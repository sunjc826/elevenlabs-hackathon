<script setup lang="ts">
import { computed,useId } from 'vue'
import type {PathNode,Standing} from '../types'
const props=withDefaults(defineProps<{nodes:readonly PathNode[];states?:readonly Standing[];focus?:number;miniature?:boolean;label?:string;standingLabels?:Partial<Record<Standing,string>>}>(),{states:()=>[],focus:-1,miniature:false,label:'Path'})
const markerId=`arrow-${useId().replaceAll(':','')}`
const spacing=computed(()=>1120/Math.max(1,props.nodes.length))
const state=(i:number)=>props.states[i] || 'neutral'
const standing=computed(()=>({...{neutral:'',pending:'COULD NOT BE EXCLUDED',excluded:'RULED OUT',confirmed:'CONFIRMED'},...props.standingLabels})[state(props.focus)])
</script>
<template>
 <div class="path-diagram" :class="{miniature}" :data-focus="focus" :data-standing="standing">
  <svg viewBox="0 0 1120 220" role="img" :aria-label="`${label}: ${nodes.map(n=>n.label).join(' to ')}. ${standing}`">
   <defs><marker :id="markerId" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="none" stroke="#566c79" /></marker></defs>
   <g v-for="(node,i) in nodes" :key="node.id" :class="['path-node',state(i),{focused:focus===i}]" :data-node="i">
    <path v-if="i<nodes.length-1" :d="`M${spacing-26+i*spacing},83 H${spacing+8+i*spacing}`" stroke="#566c79" stroke-width="2" :marker-end="`url(#${markerId})`" />
    <rect :x="10+i*spacing" y="34" :width="spacing-36" height="98" rx="7" />
    <text :x="spacing/2-8+i*spacing" y="78" text-anchor="middle" class="node-name">{{ node.label }}</text>
    <text v-if="node.detail" :x="spacing/2-8+i*spacing" y="105" text-anchor="middle" class="node-detail">{{ node.detail }}</text>
    <text v-if="state(i)==='excluded'||state(i)==='confirmed'" :x="spacing-40+i*spacing" y="28" text-anchor="middle" class="node-mark">{{state(i)==='excluded'?'×':'✓'}}</text>
    <text v-if="i===focus" :x="spacing/2-8+i*spacing" y="174" text-anchor="middle" class="node-status">{{standing}}</text>
   </g>
  </svg>
 </div>
</template>
