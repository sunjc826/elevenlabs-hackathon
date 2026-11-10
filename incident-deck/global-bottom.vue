<script setup lang="ts">
import {useNav} from '@slidev/client'
import {NarrationPlayer} from '@hackathon/narrated-deck'
import manifest from './generated/manifest.json'
import {playback} from './playback'
const nav=useNav()
const baseUrl=import.meta.env.BASE_URL
const exporting=typeof window!=='undefined' && new URLSearchParams(window.location.search).has('print')
</script>
<template>
 <NarrationPlayer :manifest="manifest" :page="nav.currentPage.value" :click="nav.clicks.value"
  :base-url="baseUrl" :clock="playback" :exporting="exporting"
  intro-label="A narrated incident review" description="Follow the evidence through a fictional production incident."
  help="Space to pause · Arrow keys to explore · About 4 minutes"
  @next="nav.next()" @previous="nav.prev()" @restart="nav.go(1,0)" />
</template>
