import {prepareManifest} from '../../src/manifest.mjs'
// One content source. The demo intentionally uses silent timing fixtures, not paid TTS.
const beat=(id:number,caption:string,say:string)=>({clip:`audio/example-${id}.wav`,caption,say,duration_seconds:1.5})
export const manifest=prepareManifest({deck:{title:'Queue review · library example'},slides:[
 {id:'path',steps:[beat(0,'Locate the queue','The highlighted queue is the candidate bottleneck.'),beat(1,'Queue confirmed','The queue is confirmed by the capture.')]},
 {id:'metrics',steps:[beat(2,'Backlog rises','The backlog rises toward the event marker.')]},
 {id:'evidence',steps:[beat(3,'Inspect the capture','Look at the queue capture.'),beat(4,'Backlog reaches forty','The highlighted row records a backlog of forty.'),beat(5,'Update the path','The miniature confirms the queue.')]},
 {id:'comparison',steps:[beat(6,'Compare both trials','The two trials use the same time window.')]},
 {id:'buffer',steps:[beat(7,'Capacity changes loss','The forty-slot buffer drops eighty; the larger one absorbs the burst.')]},
]},{requireAudit:false})
export const nodes=[{id:'input',label:'Input'},{id:'queue',label:'Queue'},{id:'worker',label:'Worker'}]
export const lines=['capture: trial','backlog: 40','capture complete <safe text>']
