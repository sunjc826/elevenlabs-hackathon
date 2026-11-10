export type Point = readonly [number,number]
export interface NarratedStep { clip:string; say:string; caption:string; duration_seconds:number }
export interface NarratedSlide { id:string; steps:readonly NarratedStep[] }
export interface NarratedManifest { deck:{title:string}; slides:readonly NarratedSlide[] }
export interface PathNode { id:string; label:string; detail?:string }
export type Standing = 'neutral' | 'pending' | 'excluded' | 'confirmed'
export interface AxisTick { at:number; label:string; stagger?:boolean }
export interface TimelineEvent { at:number; time:string; label:string }
export interface LineRow { kind:'line'; label:string; detail?:string; unit?:string; color:string; points:readonly Point[]; domain:readonly [number,number]; className?:string; showValues?:boolean }
export interface BandRow { kind:'band'; label:string; detail?:string; segments:readonly {from:number;to:number;label:string;color:string}[] }
export type MetricRow = LineRow | BandRow
export interface ChartSeries { name:string; color:string; points:readonly Point[]; dashed?:boolean }
export interface ChartFinding { x:number; y:number; label:string; color?:string }
export interface BufferSpec { capacity:number; label:string; color?:string }
