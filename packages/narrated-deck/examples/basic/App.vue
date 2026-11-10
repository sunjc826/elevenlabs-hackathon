<script setup lang="ts">
import {ref,computed} from 'vue'
import {NarrationPlayer,PathDiagram,EventMetrics,EvidencePanel,ComparisonChart,BufferComparison,createPlaybackClock} from '../../src'
import type {MetricRow} from '../../src'
import {manifest,nodes,lines} from './data'
import '../../src/style.css'
const page=ref(1),click=ref(0),exploring=ref(false)
const clock=createPlaybackClock()
const slide=computed(()=>manifest.slides[page.value-1])
function next(){if(click.value<slide.value.steps.length-1) click.value++;else if(page.value<manifest.slides.length){page.value++;click.value=0}}
function previous(){if(click.value>0) click.value--;else if(page.value>1){page.value--;click.value=slide.value.steps.length-1}}
function restart(){page.value=1;click.value=0;exploring.value=false}
const rows:MetricRow[]=[
 {kind:'line',label:'Backlog',color:'#83b3ed',points:[[10,0],[30,40],[50,40]],domain:[0,40],showValues:true},
 {kind:'band',label:'Worker',segments:[{from:10,to:30,label:'busy',color:'#3e8267'},{from:30,to:50,label:'waiting',color:'#bd665b'}]},
]
</script>
<template>
 <main>
  <h1>{{slide.id}}</h1>
  <PathDiagram v-if="page===1" :nodes="nodes" :focus="1" :states="['neutral',click?'confirmed':'pending','neutral']" />
  <EventMetrics v-else-if="page===2" :rows="rows" :events="[{at:30,time:'00:30',label:'Backlog observed'}]" :index="0" :domain="[10,50]" :ticks="[{at:10,label:'00:10'},{at:30,label:'00:30'},{at:50,label:'00:50'}]" :revision="clock.revision" />
  <EvidencePanel v-else-if="page===3" source="Queue capture" :lines="lines" :highlight-line="2" :phase="click===0?'orient':click===1?'interpret':'standing'">
   <template #standing><PathDiagram miniature :nodes="nodes" :focus="1" :states="['neutral','confirmed','neutral']" /></template>
  </EvidencePanel>
  <ComparisonChart v-else-if="page===4" label="Trial difference" :series="[{name:'small batch',color:'#f6a66b',points:[[10,-5],[30,15]]},{name:'large batch',color:'#8ce0c4',points:[[10,0],[30,0]],dashed:true}]" :domain="[10,30]" :ticks="[{at:10,label:'10'},{at:30,label:'30'}]" :highlighted="true" :finding="{x:30,y:15,label:'Difference: 15'}" />
  <BufferComparison v-else :buffers="[{capacity:40,label:'smaller'},{capacity:160,label:'larger'}]" :peak-arrivals="120" :progress="clock.progress" note="Schematic · silent timing fixture" />
 </main>
 <NarrationPlayer :manifest="manifest" :page="page" :click="click" :clock="clock" description="A reusable Vue example with silent clips for timing tests. No speech synthesis or keys." @next="next" @previous="previous" @restart="restart">
  <template #finished><aside class="after-review"><button @click="exploring=!exploring">Explore evidence</button><pre v-if="exploring">{{lines.join('\n')}}</pre></aside></template>
 </NarrationPlayer>
</template>
<style>
body{margin:0;background:#10191f;color:#edf2f2;font-family:Arial,sans-serif}
main{max-width:1120px;padding:32px;margin:0 auto 150px}h1{font-size:38px}main>.path-diagram{margin-top:70px}.after-review{position:fixed;top:16px;right:16px;background:#152b35;padding:12px;z-index:95}.after-review button{padding:10px}.after-review pre{white-space:pre-wrap}
</style>
