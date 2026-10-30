const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const calls=[],replies=[],ctx={
 fetch:async()=>{const reply=replies.shift();if(reply instanceof Error)throw reply;return{ok:true,json:async()=>reply}},
 AbortSignal:{timeout:()=>({})},setTimeout:()=>1,clearTimeout:()=>{},
 __wtKeyboard:{mouse:(...args)=>calls.push(args),stopRecording:reason=>calls.push(['stop',reason])}
};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync('patches/v103/mouse-feed.js','utf8')+';this.poll=__wtPollMouse;this.stop=__wtStopMouseFeed',ctx);
(async()=>{
 replies.push({seq:10,available:true,events:[{seq:9,button:'left',action:'press'}]});
 await ctx.poll();assert.equal(calls.length,0,'Do not replay input from before connecting');
 replies.push({seq:12,available:true,events:[{seq:11,button:'right',action:'press',x:1,y:2},{seq:12,button:'right',action:'release',x:1,y:2}]});
 await ctx.poll();assert.equal(calls.length,2);assert.equal(calls[0][1],'press');assert.equal(calls[1][1],'release');
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
 ctx.stop();console.log('PASS: mouse feed preserves short edges and releases both buttons on gaps, capture failure and disconnection');
})().catch(e=>{console.error(e);process.exitCode=1});
