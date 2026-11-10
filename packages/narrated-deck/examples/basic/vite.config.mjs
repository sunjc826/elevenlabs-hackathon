import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';
import {fileURLToPath} from 'node:url';
function silence(){
 const rate=8000,frames=12000,b=Buffer.alloc(44+frames*2);
 b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(rate,24);b.writeUInt32LE(rate*2,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(frames*2,40);return b;
}
export default defineConfig({root:fileURLToPath(new URL('.',import.meta.url)),plugins:[vue(),{
 name:'silent-timing-fixtures',
 configureServer(server){server.middlewares.use((req,res,next)=>{
  if(!/^\/audio\/example-[0-7]\.wav$/.test(req.url||'')) return next();
  const bytes=silence(),match=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range||'');
  const start=match?Number(match[1]):0,end=match&&match[2]?Math.min(Number(match[2]),bytes.length-1):bytes.length-1;
  if(start>end){res.statusCode=416;res.end();return}
  res.setHeader('Content-Type','audio/wav');res.setHeader('Accept-Ranges','bytes');
  if(match){res.statusCode=206;res.setHeader('Content-Range',`bytes ${start}-${end}/${bytes.length}`)}
  res.setHeader('Content-Length',end-start+1);res.end(bytes.subarray(start,end+1));
 })},
 generateBundle(){for(let i=0;i<8;i++)this.emitFile({type:'asset',fileName:`audio/example-${i}.wav`,source:silence()})},
}],server:{host:'127.0.0.1',port:4181},build:{outDir:'../../dist',emptyOutDir:true}});
