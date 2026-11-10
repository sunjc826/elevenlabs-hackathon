<script setup lang="ts">
import {computed} from 'vue'
import type {ChartSeries,ChartFinding,AxisTick,Point} from '../types'
const props=defineProps<{series:readonly ChartSeries[];domain:readonly [number,number];ticks:readonly AxisTick[];label:string;finding?:ChartFinding;highlighted?:boolean}>()
const ymin=computed(()=>Math.min(0,...props.series.flatMap(s=>s.points.map(p=>p[1]))))
const ymax=computed(()=>Math.max(ymin.value+1,...props.series.flatMap(s=>s.points.map(p=>p[1]))))
const x=(v:number)=>145+(v-props.domain[0])/(props.domain[1]-props.domain[0])*875
const y=(v:number)=>275-(v-ymin.value)/(ymax.value-ymin.value)*182
const path=(points:readonly Point[])=>points.map((p,i)=>`${i?'L':'M'}${x(p[0])},${y(p[1])}`).join(' ')
</script>
<template>
 <svg class="comparison-chart" :class="{interpreted:highlighted}" viewBox="0 0 1120 340" role="img" :aria-label="`${label}: ${series.map(s=>s.name).join(' versus ')}`">
  <path class="chart-grid" d="M145,93 H1020 M145,184 H1020 M145,275 H1020" />
  <text x="18" y="35" class="metric-name">{{label}}</text>
  <text v-for="value in [ymax,(ymax+ymin)/2,ymin]" :key="value" x="115" :y="y(value)+6" class="axis-label">{{value}}</text>
  <g v-for="(item,i) in series" :key="item.name">
   <path :d="path(item.points)" :stroke="highlighted?item.color:'#61717f'" :stroke-dasharray="item.dashed?'10 5':undefined" class="replay-trace" />
   <rect :x="1080-series.length*205+i*205" y="20" width="28" height="4" :fill="highlighted?item.color:'#61717f'" />
   <text :x="1120-series.length*205+i*205" y="28" class="axis-label">{{item.name}}</text>
  </g>
  <g v-if="highlighted && finding" class="chart-finding" :style="{fill:finding.color || series[0]?.color}"><circle :cx="x(finding.x)" :cy="y(finding.y)" r="8" /><text :x="x(finding.x)+10" :y="y(finding.y)-18">{{finding.label}}</text></g>
  <text v-for="tick in ticks" :key="tick.at" :x="x(tick.at)" :y="tick.stagger?323:302" text-anchor="middle" class="axis-label">{{tick.label}}</text>
 </svg>
</template>
