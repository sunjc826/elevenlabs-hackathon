<script setup lang="ts">
import { computed, useId } from 'vue'
import data from '../generated/manifest.json'
const props = withDefaults(defineProps<{states?: string[]; focus?: number; miniature?: boolean; symptom?: boolean}>(), {states: () => ['pending','pending','pending'], focus: -1, miniature: false, symptom: false})
const markerId = `arrow-${useId().replaceAll(':','')}`
const nodes = data.deck.path_nodes
const state = (i: number) => i < 3 ? props.states[i] || 'neutral' : (i === 3 && props.symptom ? 'confirmed' : 'neutral')
const standing = computed(() => state(props.focus) === 'excluded' ? 'RULED OUT' : state(props.focus) === 'confirmed' ? 'CONFIRMED' : 'COULD NOT BE EXCLUDED')
</script>
<template>
  <div class="path-diagram" :class="{miniature}" :data-focus="focus" :data-standing="standing">
    <svg viewBox="0 0 1120 220" role="img" :aria-label="`Packet path: ${nodes.join(' to ')}. ${standing}`">
      <defs><marker :id="markerId" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="none" stroke="#566c79" /></marker></defs>
      <g v-for="(node,i) in nodes" :key="node" :class="['path-node',state(i),{focused:focus===i}]" :data-node="i">
        <path v-if="i<4" :d="`M${198+i*224},83 H${238+i*224}`" stroke="#566c79" stroke-width="2" :marker-end="`url(#${markerId})`" />
        <rect :x="10+i*224" y="34" width="188" height="98" rx="7" />
        <text :x="104+i*224" y="78" text-anchor="middle" class="node-name">{{ i === 2 ? node.split(' ')[0] : node }}</text>
        <text v-if="i===2" :x="104+i*224" y="105" text-anchor="middle" class="node-detail">{{ node.split(' ').slice(1).join(' ') }}</text>
        <text v-if="state(i)==='excluded' || state(i)==='confirmed'" :x="184+i*224" y="28" text-anchor="middle" class="node-mark">{{ state(i)==='excluded' ? '×' : '✓' }}</text>
        <text v-if="i===focus" :x="104+i*224" y="174" text-anchor="middle" class="node-status">{{ standing }}</text>
      </g>
    </svg>
  </div>
</template>
