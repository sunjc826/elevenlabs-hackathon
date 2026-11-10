import { reactive } from 'vue'
import { clipProgress } from './core.mjs'
export function createPlaybackClock() {
  return reactive({elapsed:0,duration:0,progress:0,started:false,paused:true,revision:0})
}
export type PlaybackClock = ReturnType<typeof createPlaybackClock>
export function publishClock(clock:PlaybackClock,elapsed:number,duration:number,target?:HTMLElement) {
  clock.elapsed=elapsed
  clock.duration=duration
  if (target) {
    target.style.setProperty('--clip-duration',`${Math.max(duration,.001)}s`)
    target.style.setProperty('--clip-delay',`${-elapsed}s`)
  }
  // Visuals consume the same duration contract as CSS line animations.
  clock.progress=clipProgress(elapsed,target ? parseFloat(target.style.getPropertyValue('--clip-duration')) : duration)
}
