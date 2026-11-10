import {test} from 'node:test';
import assert from 'node:assert/strict';
import {clipProgress,reviewProgress,sliceSeries,bufferState} from '../src/core.mjs';
import {prepareManifest,renderAudit} from '../src/manifest.mjs';
const source=()=>({deck:{title:'Queue review',runtime_cap_seconds:20},slides:[{id:'queue',steps:[{clip:'voice/first.wav',say:'The queue fills before processing catches up.',caption:'Queue fills',target_seconds:5,visible_change:'Queue appears',anchors:['queue fills']}]}]});

test('compilation honors measured duration without mutating editorial input',()=>{
 const input=source();const compiled=prepareManifest(input,{durations:[{clip:'voice/first.wav',duration_seconds:7}],requireMeasured:true});
 assert.equal(compiled.deck.total_seconds,7);assert.equal(compiled.slides[0].steps[0].duration_seconds,7);assert.equal(input.slides[0].steps[0].duration_seconds,undefined);
 assert.match(renderAudit(compiled),/7.00 seconds/);
 assert.throws(()=>prepareManifest(input,{requireMeasured:true}),/Missing measured/);
 const excessive=source();excessive.deck.runtime_cap_seconds=6;
 assert.throws(()=>prepareManifest(excessive,{durations:[{clip:'voice/first.wav',duration_seconds:7}]}),/Runtime exceeds/);
});
test('budgets and caption limits are configurable rather than inherited from an example',()=>{
 const m=source();delete m.deck.runtime_cap_seconds;m.slides[0].steps[0].target_seconds=360;
 assert.equal(prepareManifest(m).deck.total_seconds,360);
 m.slides[0].steps[0].caption='One two three four five six seven eight';
 assert.throws(()=>prepareManifest(m),/caption/);
 assert.equal(prepareManifest(m,{captionWords:8}).deck.total_seconds,360);
});
test('audit, clip ownership and evidence boundaries fail clearly',()=>{
 const m=source();m.slides[0].steps[0].anchors=['unspoken'];assert.throws(()=>prepareManifest(m),/audit anchor/);
 const duplicate=source();duplicate.slides.push({...duplicate.slides[0],id:'other'});assert.throws(()=>prepareManifest(duplicate),/clip path/);
 const unsafe=source();unsafe.slides[0].steps[0].clip='../private.wav';assert.throws(()=>prepareManifest(unsafe),/clip path/);
 const e=source();Object.assign(e.slides[0],{excerpt:'sample.txt',highlight_line:2});
 assert.deepEqual(prepareManifest(e,{readExcerpt:()=>'<script>\nfinding\ncontext'}).slides[0].lines,['<script>','finding','context']);
 e.slides[0].highlight_line=4;assert.throws(()=>prepareManifest(e,{readExcerpt:()=>'<script>\nfinding\ncontext'}),/outside excerpt/);
});
test('review progress follows location on backward navigation and clamps the current clip',()=>{
 const slides=[{id:'one',steps:[{duration_seconds:4},{duration_seconds:6}]},{id:'two',steps:[{duration_seconds:2}]}];
 assert.deepEqual(reviewProgress(slides,2,0,1),{ordinal:2,total:12,elapsed:11});
 assert.deepEqual(reviewProgress(slides,1,1,100),{ordinal:1,total:12,elapsed:10});
 assert.deepEqual(reviewProgress(slides,1,0,0),{ordinal:0,total:12,elapsed:0});
 assert.equal(clipProgress(5,0),0);assert.equal(clipProgress(5,10),.5);assert.equal(clipProgress(15,10),1);
});
test('series slicing preserves steps and endpoints outside the recorded window',()=>{
 assert.deepEqual(sliceSeries([[10,1],[20,1],[20,5],[30,5]],15,25),[[15,1],[20,1],[20,5],[25,5]]);
 assert.deepEqual(sliceSeries([[10,1],[20,5]],0,30),[[0,1],[10,1],[20,5],[30,5]]);
 assert.deepEqual(sliceSeries([[10,1],[20,1],[20,5]],20,20),[[20,5],[20,5]]);
 assert.throws(()=>sliceSeries([[20,1],[10,2]],10,20),/ordered/);
});
test('same burst works with reversed capacities, different values and replay',()=>{
 assert.deepEqual(bufferState(40,120,.55),{occupancy:1,drops:80,phase:'draining'});
 assert.deepEqual(bufferState(160,120,.55),{occupancy:.75,drops:0,phase:'draining'});
 assert.equal(bufferState(40,120,1).occupancy,0);assert.equal(bufferState(40,120,1).drops,80);
 assert.deepEqual(bufferState(40,120,0),{occupancy:0,drops:0,phase:'filling'});
 assert.equal(bufferState(40,120,.2,.4,.8).drops,20);
 assert.throws(()=>bufferState(40,120,.5,.8,.4),/Invalid/);
});
