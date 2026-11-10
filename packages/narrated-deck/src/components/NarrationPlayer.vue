<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { NarratedManifest } from '../types'
import { createPlaybackClock, publishClock, type PlaybackClock } from '../clock'
import { reviewProgress, formatTime as clock } from '../core.mjs'

const props = withDefaults(defineProps<{
  manifest: NarratedManifest; page: number; click: number; baseUrl?: string;
  clock?: PlaybackClock; clockTarget?: HTMLElement; exporting?: boolean;
  introLabel?: string; description?: string; help?: string; subtitlesDefault?: boolean;
}>(), {baseUrl:'/',exporting:false,introLabel:'A narrated review',description:'Follow the explanation at your own pace.',help:'Space to pause · Arrow keys to navigate',subtitlesDefault:false})
const emit=defineEmits<{next:[];previous:[];restart:[]}>()
const playback=props.clock || createPlaybackClock()
const target=()=>props.clockTarget || document.documentElement
const audio = ref<HTMLAudioElement>()
const started = ref(false)
const paused = ref(true)
const finished = ref(false)
const subtitlesEnabled = ref(props.subtitlesDefault)
const message = ref('')
const elapsed = ref(0)
const duration = ref(0)
const currentSlide = computed(() => props.manifest.slides[props.page - 1])
const stepIndex = computed(() => Math.max(0, Math.min(props.click, (currentSlide.value?.steps.length ?? 1) - 1)))
const currentStep = computed(() => currentSlide.value?.steps[stepIndex.value])
const src = computed(() => currentStep.value ? `${props.baseUrl.replace(/\/?$/, '/')}${currentStep.value.clip}` : '')
const progress=computed(()=>reviewProgress(props.manifest.slides,props.page,props.click,elapsed.value))
const totalDuration=computed(()=>progress.value.total)
const deckElapsed=computed(()=>progress.value.elapsed)
let revision = 0
let frame = 0
function updateClock() {
  elapsed.value = audio.value?.currentTime || 0
  duration.value = Number.isFinite(audio.value?.duration) ? audio.value!.duration : currentStep.value?.duration_seconds || 0
  playback.started = started.value
  playback.paused = paused.value
  publishClock(playback, elapsed.value, duration.value, target())
  frame = requestAnimationFrame(updateClock)
}

async function play() {
  const element = audio.value
  if (!element || !src.value) return
  const attempt = revision
  message.value = ''
  try {
    await element.play()
    if (attempt === revision && paused.value) element.pause()
  } catch (error) {
    if (attempt !== revision) return
    if (error instanceof DOMException && error.name === 'AbortError') return
    paused.value = true
    message.value = 'Audio could not start. Tap Resume to retry, or use the arrows.'
  }
}
function sync() {
  if (props.exporting) return
  revision++
  playback.revision++
  const element = audio.value
  if (!element) return
  element.pause()
  elapsed.value = 0
  duration.value = currentStep.value?.duration_seconds || 0
  publishClock(playback, 0, duration.value, target())
  finished.value = false
  message.value = ''
  if (!src.value) { paused.value = true; return }
  element.src = src.value
  element.load()
  if (started.value && !paused.value) void play()
}
async function toggle() {
  if (!started.value) {
    started.value = true
    paused.value = false
    sync()
  } else if (finished.value) {
    paused.value = false
    finished.value = false
    const oldSource=src.value
    emit('restart')
    await nextTick()
    // The watcher handles navigation; replay explicitly if already on slide one.
    if (src.value===oldSource) sync()
  } else {
    paused.value = !paused.value
    if (paused.value) audio.value?.pause()
    else void play()
  }
}
function ended() {
  if (paused.value || !started.value || !audio.value?.ended) return
  if (props.page === props.manifest.slides.length && stepIndex.value === currentSlide.value.steps.length - 1) {
    finished.value = true
    paused.value = true
    return
  }
  // next() advances a click first, then the next slide at its final step.
  emit('next')
}
function failed() {
  if (!started.value) return
  paused.value = true
  message.value = 'This clip could not load. Resume to retry, or use the arrows.'
}
function keydown(event: KeyboardEvent) {
  if ((event.target instanceof HTMLElement && event.target.closest('input, textarea, select, [contenteditable="true"], [data-narration-exploration]'))) return
  if (started.value && ['ArrowRight','ArrowLeft'].includes(event.code)) {
    event.preventDefault(); event.stopImmediatePropagation();
    if(event.code==='ArrowRight') emit('next'); else emit('previous');
    return
  }
  if (event.code!=='Space') return
  event.preventDefault()
  event.stopImmediatePropagation()
  if (!event.repeat) void toggle()
}
watch([()=>props.page,()=>props.click], sync, { flush:'post' })
onMounted(() => { if (!props.exporting) { sync(); frame = requestAnimationFrame(updateClock); window.addEventListener('keydown', keydown, true) } })
onBeforeUnmount(() => { revision++; cancelAnimationFrame(frame); audio.value?.pause(); window.removeEventListener('keydown', keydown, true) })
function pause() { paused.value=true; audio.value?.pause() }
defineExpose({pause,toggle,finished})
</script>

<template>
  <audio ref="audio" preload="auto" @ended="ended" @error="failed"
    @timeupdate="elapsed = audio?.currentTime || 0" @loadedmetadata="duration = audio?.duration || 0" />
  <Teleport v-if="!exporting" to="body">
    <div v-if="!started" class="play-overlay">
      <div class="play-intro">
        <span class="intro-label">{{introLabel}}</span>
        <h1>{{ manifest.deck.title }}</h1>
        <p>{{description}}</p>
        <button class="play-primary" @click.stop="toggle">Play narrated review <span aria-hidden="true">▶</span></button>
        <p class="play-help">{{help}}</p>
      </div>
    </div>
    <div v-if="started && currentStep" :key="currentStep.clip" class="anchor-caption" role="status" aria-label="Visual anchor">{{ currentStep.caption }}</div>
    <div v-if="started && subtitlesEnabled && currentStep" class="narration-subtitles"
      role="region" aria-label="Narration subtitles">{{ currentStep.say }}</div>
    <div v-if="started" class="narrator-controls" @click.stop
      @keydown.right.prevent.stop="emit('next')" @keydown.left.prevent.stop="emit('previous')">
      <button aria-label="Previous step" @click="emit('previous')">←</button>
      <button class="toggle-audio" @click="toggle">{{ finished ? 'Replay' : paused ? 'Resume' : 'Pause' }}<small>Space</small></button>
      <button aria-label="Next step" @click="emit('next')">→</button>
      <button class="subtitle-toggle" aria-label="Subtitles" :aria-pressed="subtitlesEnabled"
        title="Toggle subtitles" @click="subtitlesEnabled = !subtitlesEnabled">CC</button>
      <div class="playback-position"><strong>{{ page }} / {{ manifest.slides.length }}</strong><span>Step {{ stepIndex + 1 }} / {{ currentSlide?.steps.length || 1 }}</span></div>
      <div class="clip-progress"><progress :value="elapsed" :max="duration || 1" /><span>{{ clock(elapsed) }} / {{ clock(Math.ceil(duration)) }}</span></div>
      <div class="deck-progress" role="group" aria-label="Whole-deck progress"><progress aria-label="Review progress" :value="deckElapsed" :max="totalDuration" /><span>Review {{ clock(finished ? Math.ceil(totalDuration) : deckElapsed) }} / {{ clock(Math.ceil(totalDuration)) }}</span></div>
      <span v-if="finished" class="playback-end">Review complete</span>
      <span v-else-if="paused" class="paused-label">Paused</span>
    </div>
    <div v-if="finished" data-narration-exploration><slot name="finished" :pause="pause" /></div>
    <p v-if="message" role="alert" class="audio-message">{{ message }}</p>
  </Teleport>
</template>
