const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
 const calls=[],replies=[];let now=0;const ctx={
 fetch:async()=>{const reply=replies.shift();if(reply instanceof Error)throw reply;return{ok:true,json:async()=>reply}},
 AbortSignal:{timeout:()=>({})},setTimeout:()=>1,clearTimeout:()=>{},
 performance:{now:()=>now},__wtHotkeys:{displayKey:key=>key},
 __wtKeyboard:{inputActive:true,mouse:(...args)=>calls.push(args),key:(...args)=>calls.push(['key',...args]),stopRecording:reason=>calls.push(['stop',reason])}
};
vm.createContext(ctx);
const merge=fs.readFileSync('patches/input-edge-merge.js','utf8').replace(/export\s*\{[^}]+\};?/g,'');
vm.runInContext(merge+fs.readFileSync('patches/v103/mouse-feed.js','utf8')+';this.poll=__wtPollMouse;this.sync=__wtSyncMouseFeed;this.stop=__wtStopMouseFeed;this.nativeKey=__wtKey',ctx);
(async()=>{
 replies.push({seq:10,available:true,events:[{seq:9,button:'left',action:'press'}]});
 await ctx.poll();assert.equal(calls.length,0,'Do not replay input from before connecting');
 replies.push({seq:12,available:true,events:[{seq:11,button:'right',action:'press',x:1,y:2},{seq:12,button:'right',action:'release',x:1,y:2}]});
 await ctx.poll();assert.equal(calls.length,2);assert.equal(calls[0][1],'press');assert.equal(calls[1][1],'release');
 calls.length=0;let seq=12;const keys=['1','2','3','Q','E','R','Space'];
 replies.push({seq:26,available:true,keyboardAvailable:true,events:keys.flatMap(key=>[{seq:++seq,key,action:'press'},{seq:++seq,key,action:'release'}])});await ctx.poll();
 assert.equal(calls.length,14);for(let i=0;i<keys.length;i++){assert.deepEqual(calls[i*2],['key',keys[i],true]);assert.deepEqual(calls[i*2+1],['key',keys[i],false])}
 calls.length=0;
 now=250;
 // An online raw feed must never disable the upstream keyboard path.
 for(let i=0;i<2;i++){ctx.nativeKey('F12',true);ctx.nativeKey('F12',false);now+=20}
 const tap=['press','release'].map(action=>({key:'F12',action}));
 replies.push({seq:30,available:true,keyboardAvailable:true,events:[...tap,...tap].map((event,i)=>({...event,seq:i+27}))});
 await ctx.poll();
 assert.deepEqual(calls,[['key','F12',true],['key','F12',false],['key','F12',true],['key','F12',false]],'Both upstream taps must survive a delayed raw batch without being doubled');
 calls.length=0;
 replies.push({seq:2048,available:true,gap:true,events:[{seq:2048,button:'left',action:'press'}]});
 await ctx.poll();assert.deepEqual(calls,[['stop','mouse_event_gap'],['left','release'],['right','release']],'Missing edges must stop recording and discard partial history');
 calls.length=0;
 replies.push({seq:2048,available:false,events:[]});
 await ctx.poll();assert.deepEqual(calls,[['stop','mouse_connection_lost'],['left','release'],['right','release']]);
 calls.length=0;
 replies.push({seq:2050,available:true,events:[{seq:2049,button:'right',action:'press'}]});
 await ctx.poll();assert.equal(calls.length,0,'Reconnecting must skip stale input');
 replies.push(new Error('connection reset'));
 await ctx.poll();assert.deepEqual(calls,[['stop','mouse_connection_lost'],['left','release'],['right','release']]);
 calls.length=0;ctx.__wtKeyboard.inputActive=false;replies.push(new Error('Must not fetch while hidden'));await ctx.poll();assert.equal(replies.length,1);replies.pop();
 ctx.__wtKeyboard.inputActive=true;let resolve;ctx.fetch=()=>new Promise(done=>resolve=done);const pending=ctx.poll();ctx.__wtKeyboard.inputActive=false;ctx.sync();resolve({ok:true,json:async()=>({seq:9999,available:true,events:[{seq:9999,key:'Q',action:'press'}]})});await pending;assert.equal(calls.length,0,'A late response cannot relight keys after suspension');
 ctx.stop();console.log('PASS: raw feed retains edges, handles gaps and disconnects, stops when disabled and ignores late responses');
})().catch(e=>{console.error(e);process.exitCode=1});
