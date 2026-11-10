import { reactive } from 'vue'
// Shared transport state. The media element, never an independent timer, owns time.
export const playback = reactive({ elapsed: 0, duration: 0, started: false, paused: true, revision: 0 })
export function publishClock(elapsed: number, duration: number) {
  playback.elapsed = elapsed
  playback.duration = duration
  document.documentElement.style.setProperty('--clip-duration', `${Math.max(duration, .001)}s`)
  document.documentElement.style.setProperty('--clip-delay', `${-elapsed}s`)
}
