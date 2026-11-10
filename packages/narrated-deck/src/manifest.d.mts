import type {NarratedManifest} from './types'
export interface EditorialManifest {
 deck:{title:string;runtime_cap_seconds?:number;[key:string]:unknown};
 slides:Array<{id:string;excerpt?:string;highlight_line?:number;[key:string]:unknown;steps:Array<{clip:string;say:string;caption:string;target_seconds?:number;duration_seconds?:number;visible_change?:string;anchors?:string[];[key:string]:unknown}>}>;
}
export interface ManifestOptions {
 durations?:Array<{clip:string;duration_seconds:number}>;
 readExcerpt?:(path:string)=>string;
 requireMeasured?:boolean;
 captionWords?:number;
 requireAudit?:boolean;
}
export function prepareManifest(input:EditorialManifest,options?:ManifestOptions):EditorialManifest & NarratedManifest & {deck:{total_seconds:number}}
export function renderAudit(manifest:ReturnType<typeof prepareManifest>):string
