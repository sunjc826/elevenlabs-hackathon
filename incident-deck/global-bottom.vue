<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useNav, useSlideContext } from '@slidev/client'
import manifest from './generated/manifest.json'

const nav = useNav()
const { $slidev } = useSlideContext()
const audio = ref<HTMLAudioElement>()
const started = ref(false)
const paused = ref(true)
const finished = ref(false)
const message = ref('')
const elapsed = ref(0)
const duration = ref(0)
const currentSlide = computed(() => manifest.slides[nav.currentPage.value - 1])
const stepIndex = computed(() => Math.max(0, Math.min(nav.clicks.value, (currentSlide.value?.steps.length ?? 1) - 1)))
const currentStep = computed(() => currentSlide.value?.steps[stepIndex.value])
const src = computed(() => currentStep.value ? `${import.meta.env.BASE_URL}${currentStep.value.clip}` : '')
let revision = 0

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
  revision++
  const element = audio.value
  if (!element) return
  element.pause()
  elapsed.value = 0
  duration.value = 0
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
    await nav.go(1, 0)
    await nextTick()
    // The watcher handles navigation; replay explicitly if already on slide one.
    if (audio.value?.paused) sync()
  } else {
    paused.value = !paused.value
    if (paused.value) audio.value?.pause()
    else void play()
  }
}
function ended() {
  if (paused.value || !started.value || !audio.value?.ended) return
  if (nav.currentPage.value === manifest.slides.length && stepIndex.value === currentSlide.value.steps.length - 1) {
    finished.value = true
    paused.value = true
    return
  }
  // next() advances a click first, then the next slide at its final step.
  $slidev.nav.next()
}
function failed() {
  if (!started.value) return
  paused.value = true
  message.value = 'This clip could not load. Resume to retry, or use the arrows.'
}
function keydown(event: KeyboardEvent) {
  if (event.code !== 'Space' || (event.target instanceof HTMLElement && event.target.closest('input, textarea, select, [contenteditable="true"]'))) return
  event.preventDefault()
  event.stopImmediatePropagation()
  if (!event.repeat) void toggle()
}
watch([nav.currentPage, nav.clicks], sync, { flush: 'post' })
onMounted(() => { sync(); window.addEventListener('keydown', keydown, true) })
onBeforeUnmount(() => { revision++; audio.value?.pause(); window.removeEventListener('keydown', keydown, true) })
const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
</script>

<template>
  <audio ref="audio" preload="auto" @ended="ended" @error="failed"
    @timeupdate="elapsed = audio?.currentTime || 0" @loadedmetadata="duration = audio?.duration || 0" />
  <Teleport to="body">
    <div v-if="!started" class="play-overlay">
      <div class="play-intro">
        <span class="intro-label">A narrated incident review</span>
        <h1>{{ manifest.deck.title }}</h1>
        <p>Follow the evidence through a fictional production incident.</p>
        <button class="play-primary" @click.stop="toggle">Play narrated review <span aria-hidden="true">▶</span></button>
        <p class="play-help">Space to pause · Arrow keys to explore · About 4 minutes</p>
      </div>
    </div>
    <div v-if="started" class="narrator-controls" @click.stop>
      <button aria-label="Previous step" @click="nav.prev()">←</button>
      <button class="toggle-audio" @click="toggle">{{ finished ? 'Replay' : paused ? 'Resume' : 'Pause' }}<small>Space</small></button>
      <button aria-label="Next step" @click="nav.next()">→</button>
      <div class="playback-position"><strong>{{ nav.currentPage.value }} / {{ manifest.slides.length }}</strong><span>Step {{ stepIndex + 1 }} / {{ currentSlide?.steps.length || 1 }}</span></div>
      <div class="clip-progress"><progress :value="elapsed" :max="duration || 1" /><span>{{ clock(elapsed) }} / {{ clock(duration) }}</span></div>
      <span v-if="finished" class="playback-end">Review complete</span>
      <span v-else-if="paused" class="paused-label">Paused</span>
    </div>
    <p v-if="message" role="alert" class="audio-message">{{ message }}</p>
  </Teleport>
</template>
