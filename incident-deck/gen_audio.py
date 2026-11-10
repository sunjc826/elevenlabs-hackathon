#!/usr/bin/env python3
"""Manifest-only TTS. One request per missing step, no automatic paid retries."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import sys
import subprocess
import time
from urllib.request import Request, urlopen
from urllib.error import HTTPError

import yaml
from mutagen.mp3 import MP3

ROOT = Path(__file__).resolve().parent

def digest(value):
    return hashlib.sha256(value).hexdigest()

def read_manifest(path=ROOT / 'manifest.yaml'):
    data = yaml.safe_load(path.read_text())
    seen = set()
    for slide in data['slides']:
        for step in slide['steps']:
            assert step['say'].strip(), 'Narration cannot be empty'
            assert step.get('target_seconds', 1) > 0
            clip = Path(step['clip'])
            assert not clip.is_absolute() and '..' not in clip.parts and clip.suffix == '.mp3'
            assert str(clip) not in seen, 'Duplicate clip'
            seen.add(str(clip))
    return data

def get_usage(key):
    req = Request('https://api.elevenlabs.io/v1/user/subscription', headers={'xi-api-key': key})
    with urlopen(req, timeout=30) as response:
        data = json.load(response)
    return {k: data.get(k) for k in ('character_count', 'character_limit')}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--generate', action='store_true', help='Make paid requests for missing clips')
    parser.add_argument('--run', choices=['1', '2'], default='1', help='Run 2 writes a separate comparison pack')
    args = parser.parse_args()
    manifest = read_manifest()
    deck = manifest['deck']
    steps = [step for slide in manifest['slides'] for step in slide['steps']]
    output = ROOT / ('public' if args.run == '1' else '.cache/comparison')
    ledger = ROOT / '.cache' / ('attempts-' + args.run)
    revision = deck.get('audio_revision', '')
    metrics_path = ROOT / 'metrics' / (((revision + '-') if revision else '') + 'run-' + args.run + '.json')
    old = json.loads(metrics_path.read_text()) if metrics_path.exists() else {'clips': []}
    existing = {x['clip']: x for x in old['clips']}
    chars = sum(len(s['say']) for s in steps if not (output / s['clip']).exists())
    print(f"Run {args.run}: {len(steps)} clips, {chars} characters need synthesis", flush=True)
    if not args.generate:
        print('Dry run. Add --generate to synthesize missing audio.')
        return
    key = os.environ.get('ELEVENLABS_API_KEY', '').strip()
    if chars and not key:
        raise RuntimeError('ELEVENLABS_API_KEY is required in the private environment')
    before = get_usage(key) if chars else None
    if before and (not isinstance(before['character_limit'], int) or before['character_limit'] - before['character_count'] < chars):
        raise RuntimeError('Insufficient verified included credits for this batch')
    ledger.mkdir(parents=True, exist_ok=True)
    metrics_path.parent.mkdir(exist_ok=True)
    report = {'provider': 'ElevenLabs', 'model': deck['model'], 'voice_id': deck['narrator_voice'],
              'run': int(args.run), 'clips': []}
    for step in steps:
        clip = output / step['clip']
        payload = {'text': step['say'], 'model_id': deck['model'], 'voice_settings': deck['voice_settings']}
        fingerprint = digest(json.dumps({'voice': deck['narrator_voice'], **payload}, sort_keys=True).encode())
        marker = ledger / (clip.stem + '.json')
        if clip.exists():
            row = existing.get(step['clip'])
            if row is None:
                raise RuntimeError(f'{step["clip"]}: audio exists without provenance; inspect before continuing')
            if row['fingerprint'] != fingerprint or row['sha256'] != digest(clip.read_bytes()) or row.get('target_seconds') != step.get('target_seconds'):
                raise RuntimeError(f'{step["clip"]}: existing audio does not match manifest or checksum')
            mode = 'cached'
        else:
            if marker.exists():
                raise RuntimeError(f'{step["clip"]}: prior attempt recorded; inspect it before any paid retry')
            clip.parent.mkdir(parents=True, exist_ok=True)
            with marker.open('x') as file:
                json.dump({'state': 'submitted', 'fingerprint': fingerprint}, file)
            req = Request('https://api.elevenlabs.io/v1/text-to-speech/' + deck['narrator_voice'] + '?output_format=mp3_44100_128',
                          data=json.dumps(payload).encode(), headers={'xi-api-key': key, 'Content-Type': 'application/json'}, method='POST')
            started = time.monotonic()
            try:
                with urlopen(req, timeout=180) as response:
                    data = response.read()
                    latency = time.monotonic() - started
                    content_type = response.headers.get('content-type', '')
                    cost = response.headers.get('character-cost')
            except HTTPError as error:
                marker.write_text(json.dumps({'state': 'failed', 'http_status': error.code, 'fingerprint': fingerprint}))
                raise RuntimeError(f'{step["clip"]}: HTTP {error.code}; no automatic retry') from None
            except Exception:
                raise RuntimeError(f'{step["clip"]}: ambiguous request failure; inspect ledger, do not automatically retry') from None
            pending = ledger / (clip.stem + '.pending.mp3')
            pending.write_bytes(data)
            if not content_type.lower().startswith('audio/') or len(data) < 1000:
                raise RuntimeError('Unexpected response saved privately for inspection; no retry')
            raw_duration = MP3(pending).info.length
            tempo = 1.0
            target = step.get('target_seconds')
            if target:
                import imageio_ffmpeg
                tempo = raw_duration / target
                if not 0.65 <= tempo <= 1.5:
                    raise RuntimeError(f'{step["clip"]}: pacing factor {tempo:.3f} needs review; raw audio retained, no retry')
                paced = ledger / (clip.stem + '.paced.mp3')
                subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), '-v', 'error', '-y', '-i', str(pending),
                                '-af', f'atempo={tempo:.8f}', '-codec:a', 'libmp3lame', '-b:a', '128k', str(paced)], check=True)
                paced.replace(pending)
            data = pending.read_bytes()
            duration = MP3(pending).info.length
            row = {'clip': step['clip'], 'characters': len(step['say']), 'duration_seconds': round(duration, 3),
                   'seconds_per_1000_characters': round(duration / len(step['say']) * 1000, 3),
                   'raw_duration_seconds': round(raw_duration, 3), 'tempo_factor': round(tempo, 6),
                   'target_seconds': step.get('target_seconds'), 'request_latency_seconds': round(latency, 3), 'billed_credits_header': int(cost) if cost and cost.isdigit() else None,
                   'fingerprint': fingerprint, 'sha256': digest(data)}
            # Persist provenance before publishing the complete clip.
            marker.write_text(json.dumps({'state': 'complete', **row}))
            report['clips'].append(row)
            metrics_path.write_text(json.dumps(report, indent=2) + '\n')
            pending.replace(clip)
            mode = 'generated'
        if not report['clips'] or report['clips'][-1]['clip'] != row['clip']:
            report['clips'].append(row)
        print(f"{step['clip']}: {row['duration_seconds']:.2f}s, {row['characters']} chars, "
              f"{row['seconds_per_1000_characters']:.2f}s/1000 chars ({mode})", flush=True)
        metrics_path.write_text(json.dumps(report, indent=2) + '\n')
    after = None
    if chars:
        try:
            after = get_usage(key)
        except Exception:
            print('Post-run usage meter unavailable; per-response credit headers are recorded.')
        (ROOT / '.cache' / (((revision + '-') if revision else '') + 'usage-run-' + args.run + '.json')).write_text(json.dumps({'before': before, 'after': after}))
    report['observed_usage_delta'] = after['character_count'] - before['character_count'] if before and after else old.get('observed_usage_delta')
    report['total_duration_seconds'] = round(sum(r['duration_seconds'] for r in report['clips']), 3)
    report['total_characters'] = sum(r['characters'] for r in report['clips'])
    metrics_path.write_text(json.dumps(report, indent=2) + '\n')
    print(f"Total: {report['total_duration_seconds']:.2f}s", flush=True)
    if report['total_duration_seconds'] > deck.get('runtime_cap_seconds', 240):
        raise RuntimeError('Measured runtime exceeds deck cap; revise pacing before publishing')

if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
