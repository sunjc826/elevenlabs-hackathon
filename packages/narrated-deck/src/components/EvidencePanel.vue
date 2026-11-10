<script setup lang="ts">
withDefaults(defineProps<{source:string;lines?:readonly string[];highlightLine?:number;phase:'orient'|'interpret'|'standing'}>(),{lines:()=>[]})
</script>
<template>
 <div class="evidence-panel" :data-phase="phase">
  <p class="evidence-source">{{source}}</p>
  <slot name="evidence">
   <div class="excerpt" role="region" aria-label="Evidence excerpt">
    <div v-for="(text,i) in lines" :key="i" :class="['log-line',{finding:i+1===highlightLine && phase!=='orient'}]"><span class="line-number">{{String(i+1).padStart(2,'0')}}</span><pre>{{text}}</pre></div>
   </div>
  </slot>
  <div class="evidence-bottom"><slot v-if="phase==='standing'" name="standing" /></div>
 </div>
</template>
