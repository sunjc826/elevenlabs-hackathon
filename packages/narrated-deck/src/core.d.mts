import type { NarratedSlide, Point } from './types'
export function clipProgress(elapsed:number,duration:number):number
export function reviewProgress(slides:readonly NarratedSlide[],page:number,click:number,elapsed?:number):{ordinal:number;total:number;elapsed:number}
export function sliceSeries(points:readonly Point[],start:number,end:number):Point[]
export function bufferState(capacity:number,peakArrivals:number,progress:number,fillUntil?:number,drainUntil?:number):{occupancy:number;drops:number;phase:'filling'|'overflow'|'draining'}
export function formatTime(seconds:number):string
