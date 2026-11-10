<script setup lang="ts">
import {computed,useId} from 'vue'
import type {MetricRow,LineRow,AxisTick,TimelineEvent} from '../types'
import {sliceSeries} from '../core.mjs'
const props=withDefaults(defineProps<{rows:readonly MetricRow[];events:readonly TimelineEvent[];index:number;domain:readonly [number,number];ticks:readonly AxisTick[];context?:string;note?:string;revision?:number;static?:boolean}>(),{revision:0,static:false})
const id=useId().replaceAll(':','')
const selected=computed(()=>Math.max(0,Math.min(props.index,props.events.length-1)))
const current=computed(()=>props.events[selected.value])
const previous=computed(()=>selected.value ? props.events[selected.value-1].at : props.domain[0])
const height=computed(()=>64+112*props.rows.length)
const x=(v:number)=>154+(v-props.domain[0])/(props.domain[1]-props.domain[0])*926
const bottom=(i:number)=>118+i*112
const line=(row:LineRow,start:number,end:number,i:number)=>sliceSeries(row.points,start,end).map((p,j)=>`${j?'L':'M'}${x(p[0])},${bottom(i)-(p[1]-row.domain[0])/(row.domain[1]-row.domain[0])*76}`).join(' ')
const key=computed(()=>`${selected.value}-${props.revision}`)
</script>
<template>
 <div class="event-metrics" :data-export="static">
  <div class="metric-heading"><span>{{context}}</span><strong :key="selected" class="event-label"><time>{{current.time}}</time> {{current.label}}</strong></div>
  <svg class="metrics-panel" :viewBox="`0 0 1120 ${height}`" role="img" :aria-label="`${rows.map(r=>r.label).join(', ')}: ${ticks[0]?.label} to ${ticks.at(-1)?.label}`">
   <defs><clipPath :id="`reveal-${id}`"><rect x="154" y="0" :width="x(previous)-154" :height="height"/><rect :key="key" class="range-reveal audio-animation" :x="x(previous)" y="0" :width="x(current.at)-x(previous)" :height="height" /></clipPath></defs>
   <g class="chart-grid"><path v-for="tick in ticks" :key="tick.at" :d="`M${x(tick.at)},30 V${height-45}`" /></g>
   <g v-for="(row,i) in rows" :key="i">
    <rect x="8" :y="30+i*112" width="1104" height="101" rx="4" fill="#10171f" stroke="#30404d" />
    <g class="chart-grid"><path v-for="tick in ticks" :key="tick.at" :d="`M${x(tick.at)},${30+i*112} V${131+i*112}`" /></g>
    <text x="24" :y="62+i*112" class="metric-name">{{row.label}}</text><text x="24" :y="84+i*112" class="metric-unit">{{row.detail}}</text>
    <template v-if="row.kind==='line'">
     <text x="24" :y="106+i*112" class="metric-unit">{{row.unit}}</text>
     <template v-if="row.showValues"><text x="1090" :y="46+i*112" class="axis-value">{{row.domain[1]}}</text><text x="1090" :y="120+i*112" class="axis-value">{{row.domain[0]}}</text></template>
     <path :d="line(row,domain[0],previous,i)" :class="['metric-trace','history',row.className]" :stroke="row.color" />
     <path :key="`${i}-${key}`" :d="line(row,previous,current.at,i)" :class="['metric-trace','draw-line','audio-animation',row.className]" :stroke="row.color" pathLength="1" />
    </template>
    <template v-else>
     <g :clip-path="`url(#reveal-${id})`"><rect v-for="(segment,j) in row.segments" :key="j" :x="x(segment.from)" :y="55+i*112" :width="x(segment.to)-x(segment.from)" height="40" :fill="segment.color" /></g>
     <template v-for="(segment,j) in row.segments" :key="j">
      <rect v-if="selected===events.length-1 && segment.from>=current.at" :x="x(segment.from)" :y="55+i*112" :width="x(segment.to)-x(segment.from)" height="40" :fill="segment.color" />
      <text v-if="segment.from<=current.at" :x="x((segment.from+(selected===events.length-1 && segment.from>=current.at ? segment.to : Math.min(segment.to,current.at)))/2)" :y="81+i*112" text-anchor="middle" class="band-label">{{segment.label}}</text>
     </template>
    </template>
   </g>
   <g v-for="(event,i) in events.slice(0,selected+1)" :key="i" :class="['event-marker',{current:i===selected}]" :data-time="event.time"><path :d="`M${x(event.at)},22 V${height-45}`" /><circle :cx="x(event.at)" cy="22" r="4" /></g>
   <text v-for="tick in ticks" :key="tick.at" :x="x(tick.at)" :y="height-16" text-anchor="middle" class="axis-label">{{tick.label}}</text>
  </svg>
  <div class="event-ledger"><span v-for="(event,i) in events.slice(0,selected+1)" :key="i" :class="{selected:i===selected}"><time>{{event.time}}</time> {{event.label}}</span></div>
  <p v-if="note" class="chart-note">{{note}}</p>
 </div>
</template>
