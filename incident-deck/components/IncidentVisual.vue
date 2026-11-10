<script setup lang="ts">
import {computed} from 'vue'
import {EventMetrics,PathDiagram,EvidencePanel,ComparisonChart,BufferComparison} from '@hackathon/narrated-deck'
import type {MetricRow,PathNode,Standing,Point} from '@hackathon/narrated-deck'
import data from '../generated/manifest.json'
import type {Deck} from '../types'
import {playback} from '../playback'
const props=defineProps<{slideIndex:number;stepIndex:number}>()
const manifest=data as unknown as Deck
const slide=computed(()=>manifest.slides[props.slideIndex])
const index=computed(()=>Math.max(0,Math.min(props.stepIndex,slide.value.steps.length-1)))
const step=computed(()=>slide.value.steps[index.value])
const print=typeof window!=='undefined' && new URLSearchParams(window.location.search).has('print')
const phase=computed(()=>print?1:playback.progress)
const nodes:PathNode[]=manifest.deck.path_nodes.map((label,i)=>({id:String(i),label:i===2?label.split(' ')[0]:label,detail:i===2?label.split(' ').slice(1).join(' '):undefined}))
const states=computed<Standing[]>(()=>{
 const result=[...(step.value.path_states || []),'neutral','neutral'] as Standing[]
 if(slide.value.id==='evidence-handler-log') result[3]='confirmed'
 return result
})
const rows=computed<MetricRow[]>(()=>{
 const m=slide.value.metrics
 if(!m) return []
 return [
  {kind:'line',label:m.feed_label,detail:'message rate',unit:'relative',points:m.rate as Point[],domain:[0,1],color:'#83b3ed',className:'rate-trace'},
  {kind:'line',label:'Receive misses',detail:m.counter_label,points:m.misses as Point[],domain:[0,640],color:'#f6a66b',className:'miss-trace',showValues:true},
  {kind:'band',label:m.strategy_label,detail:'strategy state',segments:[
   {from:0,to:m.halt_seconds[0],label:'running',color:'#3e8267'},
   {from:m.halt_seconds[0],to:m.halt_seconds[1],label:'halted',color:'#bd665b'},
   {from:m.halt_seconds[1],to:m.range_seconds,label:'running',color:'#3e8267'}]}
 ]
})
const events=computed(()=>slide.value.steps.map(s=>({at:s.at || 0,time:s.time || '',label:s.event || ''})))
const ticks=computed(()=>slide.value.metrics?.axis_labels.map((label,i,a)=>({label,at:i*slide.value.metrics!.range_seconds/(a.length-1)})) || [])
const series=computed(()=>slide.value.chart?.series.map((s,i)=>({...s,points:s.points as Point[],dashed:i===1})) || [])
const chartTicks=computed(()=>slide.value.chart?.x_labels.map((label,i)=>({label,at:slide.value.chart!.x_ticks[i],stagger:i===1})) || [])
const buffers=computed(()=>slide.value.buffers?.capacities.map((capacity,i)=>({capacity,label:i===0?'previous capacity':'new driver default',color:i===0?'#8ce0c4':'#f6a66b'})) || [])
</script>
<template>
 <div class="incident-visual" :class="`visual-${slide.visual}`" :data-visual="slide.visual" :data-step="index" :data-phase="step.phase" :data-export="print" :data-animation-progress="phase">
  <template v-if="slide.visual==='cover'">
   <div class="cover-subtitle">Larkspur Trading</div><div class="cover-metric">3 minutes<span>from gap to recovery</span></div>
   <p class="cover-note">Fictional incident review · {{manifest.deck.date}}</p>
  </template>
  <EventMetrics v-else-if="slide.visual==='metrics' && slide.metrics" :rows="rows" :events="events" :index="index" :domain="[0,slide.metrics.range_seconds]" :ticks="ticks" :revision="playback.revision" :static="print" :context="`${manifest.deck.date} · ${manifest.deck.timezone}`" note="Schematic traces · event timestamps retain millisecond precision" />
  <PathDiagram v-else-if="slide.visual==='path'" :nodes="nodes" :states="states" :focus="step.focus" label="Packet path" />
  <EvidencePanel v-else-if="slide.visual==='evidence'||slide.visual==='host'" :source="slide.source || ''" :lines="slide.lines" :highlight-line="slide.highlight_line" :phase="index===0?'orient':index===1?'interpret':'standing'">
   <template v-if="slide.chart" #evidence>
    <ComparisonChart :series="series" :domain="[0,slide.chart.range_ms]" :ticks="chartTicks" :label="slide.chart.counter_label" :highlighted="index>=1" :finding="{x:slide.chart.finding_ms,y:640,label:'640 misses'}" />
    <details v-if="index>=1" class="raw-counters"><summary>Raw counters · {{manifest.deck.timezone}}</summary><pre>{{slide.lines?.join('\n')}}</pre></details>
   </template>
   <template #standing><PathDiagram miniature :nodes="nodes" :states="states" :focus="step.focus" label="Packet path" /></template>
  </EvidencePanel>
  <BufferComparison v-else-if="slide.visual==='ring' && slide.buffers" :buffers="buffers" :peak-arrivals="slide.buffers.peak_arrivals" :progress="phase" :note="slide.buffers.note" />
  <template v-else-if="slide.visual==='actions'"><div :key="index" class="single-action"><span class="action-number">0{{index+1}}</span><h2>{{step.show}}</h2></div></template>
 </div>
</template>
