/** Framework/provider-neutral validation. Callers own YAML parsing and local file access. */
export function prepareManifest(input,{durations=[],readExcerpt,requireMeasured=false,captionWords=7,requireAudit=true}={}) {
  const m=structuredClone(input), ids=new Set(), clips=new Set();
  if (!m.deck?.title || !Array.isArray(m.slides) || !m.slides.length) throw new Error('A titled deck needs slides');
  const measured=new Map(durations.map(d=>[d.clip,d.duration_seconds]));
  let planned=0,total=0;
  for(const slide of m.slides) {
    if(!slide.id || ids.has(slide.id) || !Array.isArray(slide.steps) || !slide.steps.length) throw new Error('Invalid slide: '+slide.id);
    ids.add(slide.id);
    for(const step of slide.steps) {
      if(!step.say?.trim() || !step.caption?.trim() || step.caption.trim().split(/\s+/).length>captionWords) throw new Error('Invalid narration/caption: '+step.clip);
      if(typeof step.clip!=='string' || !/^[a-zA-Z0-9_./-]+\.(mp3|wav|ogg|m4a)$/.test(step.clip) || step.clip.startsWith('/') || step.clip.split('/').includes('..') || clips.has(step.clip)) throw new Error('Invalid clip path: '+step.clip);
      clips.add(step.clip);
      if(requireAudit && (!step.visible_change || !step.anchors?.length || step.anchors.some(a=>!step.say.toLowerCase().includes(a.toLowerCase())))) throw new Error('Missing or unspoken audit anchor: '+step.clip);
      if(requireMeasured && !measured.has(step.clip)) throw new Error('Missing measured duration: '+step.clip);
      step.duration_seconds=measured.get(step.clip) ?? step.duration_seconds ?? step.target_seconds;
      if(!Number.isFinite(step.duration_seconds) || step.duration_seconds<=0) throw new Error('Invalid duration: '+step.clip);
      if(step.target_seconds!==undefined && (!Number.isFinite(step.target_seconds)||step.target_seconds<=0)) throw new Error('Invalid target: '+step.clip);
      total+=step.duration_seconds;planned+=step.target_seconds ?? step.duration_seconds;
    }
    if(slide.excerpt) {
      if(!readExcerpt || slide.excerpt.startsWith('/') || slide.excerpt.split(/[\\/]/).includes('..')) throw new Error('Invalid excerpt: '+slide.excerpt);
      slide.lines=readExcerpt(slide.excerpt).trimEnd().split('\n');
      if(!Number.isInteger(slide.highlight_line) || slide.highlight_line<1 || slide.highlight_line>slide.lines.length) throw new Error('Finding outside excerpt: '+slide.id);
    }
  }
  const cap=m.deck.runtime_cap_seconds;
  if(cap!==undefined && (!Number.isFinite(cap) || cap<=0 || total>cap || planned>cap)) throw new Error('Runtime exceeds configured cap');
  m.deck.total_seconds=total;
  return m;
}
const cell = s => String(s).replaceAll('|','\\|').replaceAll('\n',' ');
export function renderAudit(manifest) {
  const lines=['# Visual and narration audit','','Each row records the intended first-second change and spoken anchors. Text matching is a structural check, not proof of comprehension or visual timing; inspect the rendered states and test playback. Retained axes and source context need not be read aloud.','','| Slide / step | Seconds | Caption | First-second change | Narrated anchors |','|---|---:|---|---|---|'];
  for(const slide of manifest.slides) for(const [i,step] of slide.steps.entries()) lines.push(`| ${cell(slide.id)} / ${i} | ${step.duration_seconds.toFixed(2)} | ${cell(step.caption)} | ${cell(step.visible_change || 'Not recorded')} | ${cell((step.anchors || []).join('; '))} |`);
  lines.push('',`Total clip duration: **${manifest.deck.total_seconds.toFixed(2)} seconds**${manifest.deck.runtime_cap_seconds ? ` / ${manifest.deck.runtime_cap_seconds}-second cap` : ''}.`);
  return lines.join('\n')+'\n';
}
