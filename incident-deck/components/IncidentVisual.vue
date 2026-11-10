<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, useId } from 'vue'
import data from '../generated/manifest.json'
import type { Deck } from '../types'
import { playback } from '../playback'
import PathDiagram from './PathDiagram.vue'
const props = defineProps<{slideIndex: number; stepIndex: number}>()
const manifest = data as unknown as Deck
const slide = computed(() => manifest.slides[props.slideIndex])
const index = computed(() => Math.min(props.stepIndex, slide.value.steps.length - 1))
const step = computed(() => slide.value.steps[index.value])
const print = new URLSearchParams(window.location.search).has('print')
const phase = ref(0)
let frame = 0
function tick() {
  // Read duration from the player's CSS contract, including on seek and replay.
  const duration = parseFloat(document.documentElement.style.getPropertyValue('--clip-duration'))
  phase.value = print ? 1 : Math.min(1, Math.max(0, playback.elapsed / (duration || 1)))
  frame = requestAnimationFrame(tick)
}
onMounted(() => { frame = requestAnimationFrame(tick) })
onBeforeUnmount(() => cancelAnimationFrame(frame))
const id = useId().replaceAll(':','')
const x = (t: number) => 154 + t / (slide.value.metrics?.range_seconds || 1) * 926
const previous = computed(() => index.value ? slide.value.steps[index.value - 1].at || 0 : 0)
const current = computed(() => step.value.at || 0)
function sliced(points: number[][], start: number, end: number) {
  const value = (t: number) => {
    const i = points.findIndex(p => p[0] >= t)
    if (i <= 0) return points[Math.max(0,i)][1]
    const a = points[i-1], b=points[i]
    return a[1] + (b[1]-a[1]) * (t-a[0]) / (b[0]-a[0])
  }
  return [[start,value(start)],...points.filter(p => p[0]>start && p[0]<end),[end,value(end)]]
}
const line = (points: number[][], start: number, end: number, y: number, scale: number) => sliced(points,start,end).map((p,i) => `${i?'L':'M'}${x(p[0])},${y-p[1]*scale}`).join(' ')
const chartMax = computed(() => Math.max(...(slide.value.chart?.series.flatMap(s => s.points.map(p => p[1])) || [1])))
const chartPath = (points: number[][]) => points.map((p,i)=>`${i?'L':'M'}${145+p[0]/(slide.value.chart?.range_ms || 1)*875},${275-p[1]/chartMax.value*182}`).join(' ')
const drops = computed(() => Math.round(Math.min(slide.value.buffers?.drops || 0, Math.max(0, (slide.value.buffers?.peak_arrivals || 0) * phase.value / .55 - (slide.value.buffers?.capacities[1] || 1)))))
function occupancy(capacity: number) {
  const peak = slide.value.buffers?.peak_arrivals || 0
  const fraction = phase.value < .55 ? Math.min(1, peak * phase.value / .55 / capacity) : Math.min(1, peak / capacity) * Math.max(0, 1 - (phase.value-.55)/.4)
  return 1-fraction
}
const mini = computed(() => step.value.phase === 'standing')
const animationKey = computed(() => `${props.slideIndex}-${index.value}-${playback.revision}`)
</script>
<template>
  <div class="incident-visual" :class="`visual-${slide.visual}`" :data-visual="slide.visual" :data-step="index" :data-phase="step.phase" :data-export="print" :data-animation-progress="phase">
    <template v-if="slide.visual==='cover'">
      <div class="cover-subtitle">Larkspur Trading</div><div class="cover-metric">3 minutes<span>from gap to recovery</span></div>
      <p class="cover-note">Fictional incident review · {{ manifest.deck.date }}</p>
    </template>
    <template v-else-if="slide.visual==='metrics' && slide.metrics">
      <div class="metric-heading"><span>{{ manifest.deck.date }} · {{ manifest.deck.timezone }}</span><strong :key="index" class="event-label"><time>{{ step.time }}</time> {{ step.event }}</strong></div>
      <svg class="metrics-panel" viewBox="0 0 1120 400" role="img" :aria-label="`Feed message rate, receive misses, and strategy state from ${slide.metrics.start} to ${slide.metrics.end}`">
        <defs><clipPath :id="`reveal-${id}`"><rect x="154" y="0" :width="x(previous)-154" height="360"/><rect :key="animationKey" class="range-reveal audio-animation" :x="x(previous)" y="0" :width="x(current)-x(previous)" height="360" /></clipPath></defs>
        <rect v-for="y in [30,142,254]" :key="y" x="8" :y="y" width="1104" height="101" rx="4" fill="#10171f" stroke="#30404d" />
        <g class="chart-grid"><path v-for="t in slide.metrics.axis_labels.map((_,i)=>i*slide.metrics!.range_seconds/(slide.metrics!.axis_labels.length-1))" :key="t" :d="`M${x(t)},30 V355`" /></g>
        <text x="24" y="62" class="metric-name">{{ slide.metrics.feed_label }}</text><text x="24" y="84" class="metric-unit">message rate</text><text x="24" y="106" class="metric-unit">relative</text>
        <text x="24" y="174" class="metric-name">Receive misses</text><text x="24" y="198" class="metric-unit">{{ slide.metrics.counter_label }}</text>
        <text x="24" y="286" class="metric-name">{{ slide.metrics.strategy_label }}</text><text x="24" y="310" class="metric-unit">strategy state</text>
        <text x="1090" y="158" class="axis-value">{{ slide.metrics.misses.at(-1)?.[1] }}</text><text x="1090" y="232" class="axis-value">0</text>
        <path :d="line(slide.metrics.rate,0,previous,118,76)" class="rate-trace history" />
        <path :key="`rate-${animationKey}`" :d="line(slide.metrics.rate,previous,current,118,76)" class="rate-trace draw-line audio-animation" pathLength="1" />
        <path :d="line(slide.metrics.misses,0,previous,230,0.1125)" class="miss-trace history" />
        <path :key="`miss-${animationKey}`" :d="line(slide.metrics.misses,previous,current,230,0.1125)" class="miss-trace draw-line audio-animation" pathLength="1" />
        <g :clip-path="`url(#reveal-${id})`">
          <rect x="154" y="279" width="926" height="40" fill="#3e8267" />
          <rect :x="x(slide.metrics.halt_seconds[0])" y="279" :width="x(slide.metrics.halt_seconds[1])-x(slide.metrics.halt_seconds[0])" height="40" fill="#bd665b" />
        </g>
        <rect v-if="index===slide.steps.length-1" :x="x(current)" y="279" :width="x(slide.metrics.range_seconds)-x(current)" height="40" fill="#3e8267" />
        <text x="190" y="305" class="band-label">running</text>
        <text v-if="index>=3" :x="x((slide.metrics.halt_seconds[0]+slide.metrics.halt_seconds[1])/2)" y="305" text-anchor="middle" class="band-label">halted</text>
        <text v-if="index>=4" :x="x((current+slide.metrics.range_seconds)/2)" y="305" text-anchor="middle" class="band-label">running</text>
        <g v-for="(event,i) in slide.steps.slice(0,index+1)" :key="i" :class="['event-marker',{current:i===index}]" :data-time="event.time">
          <path :d="`M${x(event.at || 0)},22 V355`" /><circle :cx="x(event.at || 0)" cy="22" r="4" />
        </g>
        <text v-for="(label,i) in slide.metrics.axis_labels" :key="label" :x="x(i*slide.metrics.range_seconds/(slide.metrics.axis_labels.length-1))" y="384" text-anchor="middle" class="axis-label">{{ label }}</text>
      </svg>
      <div class="event-ledger"><span v-for="(event,i) in slide.steps.slice(0,index+1)" :key="i" :class="{selected:i===index}"><time>{{ event.time }}</time> {{ event.event }}</span></div>
      <p class="chart-note">Schematic traces · event timestamps retain millisecond precision</p>
    </template>
    <template v-else-if="slide.visual==='path'">
      <PathDiagram :states="step.path_states" :focus="step.focus" />
    </template>
    <template v-else-if="slide.visual==='evidence' || slide.visual==='host'">
      <p class="evidence-source">{{ slide.source }}</p>
      <div v-if="slide.visual==='evidence'" class="excerpt" role="region" aria-label="Evidence excerpt">
        <div v-for="(text,i) in slide.lines" :key="i" :class="['log-line',{finding:i+1===slide.highlight_line && index>=1}]"><span class="line-number">{{ String(i+1).padStart(2,'0') }}</span><pre>{{ text }}</pre></div>
      </div>
      <template v-else-if="slide.chart">
        <svg class="host-chart" :class="{interpreted:index>=1}" viewBox="0 0 1120 340" role="img" :aria-label="`Receive misses over time: ${slide.chart.series.map(s=>s.name).join(' versus ')}`">
          <path class="chart-grid" d="M145,93 H1020 M145,184 H1020 M145,275 H1020" />
          <text x="18" y="35" class="metric-name">{{ slide.chart.counter_label }}</text>
          <text v-for="(value,i) in [chartMax,chartMax/2,0]" :key="value" x="115" :y="99+i*91" class="axis-label">{{ value }}</text>
          <g v-for="(series,i) in slide.chart.series" :key="series.name">
            <path :d="chartPath(series.points)" :stroke="index>=1 ? series.color : '#61717f'" :stroke-dasharray="i===1 ? '10 5' : undefined" class="replay-trace" />
            <rect :x="650+i*205" y="20" width="28" height="4" :fill="index>=1 ? series.color : '#61717f'" />
            <text :x="690+i*205" y="28" class="axis-label">{{ series.name }}</text>
          </g>
          <g v-if="index>=1" class="chart-finding"><circle :cx="145+slide.chart.finding_ms/slide.chart.range_ms*875" cy="93" r="8" /><text :x="155+slide.chart.finding_ms/slide.chart.range_ms*875" y="75">{{ chartMax }} misses</text></g>
          <text v-for="(label,i) in slide.chart.x_labels" :key="label" :x="145+slide.chart.x_ticks[i]/slide.chart.range_ms*875" :y="i===1 ? 323 : 302" text-anchor="middle" class="axis-label">{{ label }}</text>
        </svg>
        <details v-if="index>=1" class="raw-counters"><summary>Raw counters · {{ manifest.deck.timezone }}</summary><pre>{{ slide.lines?.join('\n') }}</pre></details>
      </template>
      <div class="evidence-bottom"><PathDiagram v-if="mini" miniature :states="step.path_states" :focus="step.focus" :symptom="slide.id==='evidence-handler-log'" /></div>
    </template>
    <template v-else-if="slide.visual==='ring' && slide.buffers">
      <div :key="animationKey" class="buffer-pair">
        <div v-for="(capacity,i) in slide.buffers.capacities" :key="capacity" :class="['buffer',i===0?'large':'small']">
          <h2>{{ capacity }} slots</h2>
          <svg viewBox="0 0 340 280" role="img" :aria-label="`${capacity} slot receive ring`">
            <g v-for="n in 64" :key="n" :transform="`rotate(${n*360/64} 170 140)`"><rect x="166" y="17" width="8" height="19" rx="2" fill="#33434e" /></g>
            <circle cx="170" cy="140" r="88" class="buffer-track" />
            <circle cx="170" cy="140" r="88" pathLength="1" :class="['buffer-fill',i===0?'large-fill':'small-fill']" :style="{strokeDashoffset:occupancy(capacity)}" />
            <text x="170" y="136" text-anchor="middle" class="buffer-state">{{ phase < .55 ? (i===1 && drops>0 ? 'OVERFLOW' : 'FILLING') : 'DRAINING' }}</text>
            <text x="170" y="163" text-anchor="middle" class="buffer-label">{{ i===0 ? 'previous capacity' : 'new driver default' }}</text>
          </svg>
          <div class="drop-count" :class="{danger:i===1}"><strong>{{ i===0 ? 0 : drops }}</strong> dropped packets</div>
        </div>
      </div>
      <p class="ring-note">{{ slide.buffers.note }}</p>
    </template>
    <template v-else-if="slide.visual==='actions'">
      <div :key="index" class="single-action"><span class="action-number">0{{ index+1 }}</span><h2>{{ step.show }}</h2></div>
    </template>
  </div>
</template>
