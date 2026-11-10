#!/usr/bin/env python3
"""Join Slidev's exported click states with the manifest's existing narration."""
import argparse
from concurrent.futures import ThreadPoolExecutor
import math
from pathlib import Path
import shutil
import subprocess
import zipfile

import yaml
from mutagen.mp3 import MP3

ROOT = Path(__file__).resolve().parent

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--frames', type=Path, default=ROOT / '.qa/export')
    parser.add_argument('--output', type=Path, default=ROOT / 'exports/incident-review.mp4')
    args = parser.parse_args()
    ffmpeg = shutil.which('ffmpeg')
    if not ffmpeg:
        import imageio_ffmpeg
        ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    manifest = yaml.safe_load((ROOT / 'manifest.yaml').read_text())
    states = [(page, click, step) for page, slide in enumerate(manifest['slides'], 1)
              for click, step in enumerate(slide['steps'], 1)]
    frames = args.frames.resolve()
    assert len(list(frames.glob('*.png'))) == len(states), 'Export exactly one PNG per narration state'
    cache = ROOT / '.cache/video'
    cache.mkdir(parents=True, exist_ok=True)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    def segment(item):
        index, (page, click, step) = item
        frame = frames / f'{page:03d}-{click:02d}.png'
        clip = ROOT / 'public' / step['clip']
        assert frame.exists() and clip.exists()
        # Pad the fractional final video frame; never shorten a narration clip.
        duration = math.ceil(MP3(clip).info.length * 30) / 30
        target = cache / f'{index:03d}.mp4'
        command = [ffmpeg, '-y', '-hide_banner', '-loglevel', 'error', '-loop', '1', '-framerate', '30',
                   '-i', str(frame), '-i', str(clip), '-t', f'{duration:.6f}',
                   '-vf', 'scale=1920:1080', '-c:v', 'libx264', '-preset', 'fast', '-tune', 'stillimage',
                   '-crf', '22', '-pix_fmt', 'yuv420p', '-threads', '2', '-af', 'apad',
                   '-c:a', 'aac', '-b:a', '128k', str(target)]
        subprocess.run(command, check=True)
        print(f'{index + 1}/{len(states)}: {step["clip"]} aligned to {duration:.3f}s', flush=True)
        return target
    with ThreadPoolExecutor(max_workers=2) as pool:
        segments = list(pool.map(segment, enumerate(states)))
    listing = cache / 'segments.txt'
    listing.write_text(''.join("file '" + str(p).replace("'", "'\\''") + "'\n" for p in segments))
    subprocess.run([ffmpeg, '-y', '-hide_banner', '-loglevel', 'error', '-f', 'concat', '-safe', '0',
                    '-i', str(listing), '-c', 'copy', '-movflags', '+faststart', str(args.output.resolve())], check=True)
    with zipfile.ZipFile(args.output.parent / 'click-states.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
        for frame in sorted(frames.glob('*.png')):
            archive.write(frame, frame.name)
    print('Saved', args.output, flush=True)

if __name__ == '__main__':
    main()
