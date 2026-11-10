const clamp = (v, low, high) => Math.min(high, Math.max(low, v));
export function clipProgress(elapsed, duration) {
  return Number.isFinite(elapsed) && Number.isFinite(duration) && duration > 0 ? clamp(elapsed / duration, 0, 1) : 0;
}
export function reviewProgress(slides, page, click, elapsed = 0) {
  const steps = slides.flatMap(s => s.steps);
  const p = clamp(Math.trunc(page) - 1, 0, Math.max(0, slides.length - 1));
  const c = clamp(Math.trunc(click), 0, Math.max(0, (slides[p]?.steps.length || 1) - 1));
  const ordinal = slides.slice(0, p).reduce((n,s) => n + s.steps.length, 0) + c;
  const seconds = s => Number.isFinite(s?.duration_seconds) && s.duration_seconds > 0 ? s.duration_seconds : 0;
  const total = steps.reduce((n,s) => n + seconds(s), 0);
  return {ordinal, total, elapsed: steps.slice(0, ordinal).reduce((n,s) => n + seconds(s), 0) + clamp(elapsed, 0, seconds(steps[ordinal]))};
}
export function sliceSeries(points, start, end) {
  if (!points.length || end < start || points.some((p,i) => p.length !== 2 || !p.every(Number.isFinite) || (i > 0 && p[0] < points[i-1][0])))
    throw new Error('Series needs finite, ordered points and a nondecreasing interval');
  const value = t => {
    if (t < points[0][0]) return points[0][1];
    const right = points.findIndex(p => p[0] > t);
    if (right < 0) return points.at(-1)[1];
    const a=points[right-1], b=points[right];
    return a[1]+(b[1]-a[1])*(t-a[0])/(b[0]-a[0]);
  };
  return [[start,value(start)], ...points.filter(p=>p[0]>start && p[0]<end), [end,value(end)]];
}
/** A schematic shared burst, followed by a drain. Fractions, never wall-clock seconds. */
export function bufferState(capacity, peakArrivals, progress, fillUntil=.55, drainUntil=.95) {
  if (!(capacity>0) || !Number.isFinite(capacity) || !(peakArrivals>=0) || !Number.isFinite(peakArrivals) || !(fillUntil>0 && fillUntil<drainUntil && drainUntil<=1))
    throw new Error('Invalid capacity, burst or animation phases');
  const p=Number.isFinite(progress) ? clamp(progress,0,1) : 0;
  const arrivals=peakArrivals*Math.min(1,p/fillUntil);
  const occupied=p<fillUntil ? Math.min(capacity,arrivals) : Math.min(capacity,peakArrivals)*Math.max(0,1-(p-fillUntil)/(drainUntil-fillUntil));
  return {occupancy:occupied/capacity, drops:Math.round(Math.max(0,arrivals-capacity)), phase:p>=fillUntil ? 'draining' : arrivals>capacity ? 'overflow' : 'filling'};
}
export const formatTime = seconds => `${Math.floor(Math.max(0,seconds)/60)}:${String(Math.floor(Math.max(0,seconds)%60)).padStart(2,'0')}`;
