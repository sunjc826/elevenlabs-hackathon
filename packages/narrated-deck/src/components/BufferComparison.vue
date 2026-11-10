<script setup lang="ts">
import {computed} from 'vue'
import type {BufferSpec} from '../types'
import {bufferState} from '../core.mjs'
const props=withDefaults(defineProps<{buffers:readonly BufferSpec[];peakArrivals:number;progress:number;note?:string;unit?:string;lossLabel?:string;fillUntil?:number;drainUntil?:number}>(),{unit:'slots',lossLabel:'dropped packets',fillUntil:.55,drainUntil:.95})
const states=computed(()=>props.buffers.map(b=>bufferState(b.capacity,props.peakArrivals,props.progress,props.fillUntil,props.drainUntil)))
</script>
<template>
 <div class="buffer-comparison">
  <div class="buffer-pair">
   <div v-for="(buffer,i) in buffers" :key="i" :class="['buffer',i===0?'large':'small']">
    <h2>{{buffer.capacity}} {{unit}}</h2>
    <svg viewBox="0 0 340 280" role="img" :aria-label="`${buffer.label}: ${buffer.capacity} ${unit}`">
     <g v-for="n in 64" :key="n" :transform="`rotate(${n*360/64} 170 140)`"><rect x="166" y="17" width="8" height="19" rx="2" fill="#33434e" /></g>
     <circle cx="170" cy="140" r="88" class="buffer-track" />
     <circle cx="170" cy="140" r="88" pathLength="1" :class="['buffer-fill',i===0?'large-fill':'small-fill']" :style="{strokeDashoffset:1-states[i].occupancy,stroke:buffer.color || (states[i].drops?'#f6a66b':'#8ce0c4')}" />
     <text x="170" y="136" text-anchor="middle" class="buffer-state">{{states[i].phase.toUpperCase()}}</text>
     <text x="170" y="163" text-anchor="middle" class="buffer-label">{{buffer.label}}</text>
    </svg>
    <div class="drop-count" :class="{danger:states[i].drops>0}"><strong>{{states[i].drops}}</strong> {{lossLabel}}</div>
   </div>
  </div>
  <p v-if="note" class="ring-note">{{note}}</p>
 </div>
</template>
