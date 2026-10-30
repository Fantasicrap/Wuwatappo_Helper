const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const {babelParse,traverse}=require('playwright/lib/transform/babelBundle');
const source=fs.readFileSync('patches/monitor-preference.js','utf8').replace(/export /g,'');
const ctx={console:{warn:()=>{}}};vm.createContext(ctx);vm.runInContext(source+';this.api=monitorPreference;this.install=installDefaultMonitor;',ctx);
const api=ctx.api,monitor=(name,x,width=1920,scale=1)=>({name,position:{x,y:0},size:{width,height:1080},scaleFactor:scale});
const primary=monitor('DISPLAY1',0),secondary=monitor('DISPLAY2',-2560,2560,1.25);
const saved=api.descriptor(secondary),json=x=>JSON.parse(JSON.stringify(x)),settle=async()=>{for(let n=0;n<40;n++)await Promise.resolve()};
assert.equal(api.resolve(saved,[primary,secondary]).target,secondary);
const resized=monitor('DISPLAY2',1920,3840,1.5);assert.equal(api.resolve(saved,[primary,resized]).target,resized,'Unique device name survives resolution and position changes');
assert.equal(api.resolve(saved,[primary]).missing,true);assert.equal(api.resolve(saved,[primary]).target,primary);
const duplicate=monitor('DISPLAY2',8000);assert.equal(api.resolve(saved,[primary,secondary,duplicate]).target,secondary);
assert.equal(api.resolve(saved,[primary,resized,duplicate]).missing,true,'Do not guess between duplicate device names');
assert.equal(api.resolve({kind:'auto'},[primary,secondary]).target,null);assert.equal(api.resolve({kind:'primary'},[primary,secondary]).target,primary);
const corrupt={getItem:()=>'{'};assert.equal(api.read(corrupt).kind,'auto');
async function fixture(){
 let monitors=[primary,secondary],here=primary,success=true,stopped=0,listRequests=0;const events=new Map(),dom=new Map(),timers=new Map(),moves=[],replies=[],storage=new Map();
 const win={__wtMainReady:false,setInterval:fn=>{timers.set(1,fn);return 1},clearInterval:id=>timers.delete(id),addEventListener:(n,fn)=>dom.set(n,fn),removeEventListener:n=>dom.delete(n)};
 const options={win,storage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},list:async()=>{listRequests++;return monitors},current:async()=>here,move:async key=>{moves.push(key);if(success)here=monitors.find(m=>api.key(m)===key);return success},listen:async(n,fn)=>{events.set(n,fn);return()=>{events.delete(n);stopped++}},emit:async(n,v)=>replies.push(v)};
 storage.set(api.storageKey,JSON.stringify(saved));const control=await ctx.install(options);
 return{control,win,storage,moves,replies,events,timers,dom,listRequests:()=>listRequests,start:async()=>{win.__wtMainReady=true;dom.get('wt-main-ready')();await settle()},setMonitors:v=>monitors=v,setHere:v=>here=v,here:()=>here,setSuccess:v=>success=v,unlistens:()=>stopped};
}
async function productionBridge(){
 const code=fs.readFileSync('dist/migration-1.0.3.1/switchDisplayMonitor-B50jXMGD.js','utf8'),fns={};
 traverse(babelParse(code,'bridge.mjs',true),{FunctionDeclaration(p){if(['Aa','An','p','qe','j'].includes(p.node.id.name))fns[p.node.id.name]=code.slice(p.node.start,p.node.end)}});assert.equal(Object.keys(fns).length,5);
 let here=primary,monitors=[primary,secondary],confirm=true;const calls=[],cache=new Map(),c={Date,Math,console:{warn:()=>{},error:()=>{}},O:null,pa:'position',localStorage:{setItem:(k,v)=>cache.set(k,v)},ye:async()=>({}),me:async()=>monitors,H:async()=>primary,K:async()=>here,w:()=>{},ne:async()=>({}),ot:()=>({}),Ea:async()=>{calls.push('prepare');return true},ga:async()=>true,Sa:async()=>true,rt:async()=>{},ct:async fn=>fn(),_e:()=>{},u:async(name,args)=>{calls.push(name);if(name==='set_main_window_monitor_bounds'&&confirm)here=monitors.find(m=>m.position.x===args.payload.x)}};
 vm.createContext(c);vm.runInContext(Object.values(fns).join(';')+';this.switchTo=An;',c);
 assert.equal(await c.switchTo(api.key(secondary)),true);assert.equal(here,secondary);assert.equal(json(JSON.parse(cache.get('position'))).x,-2048,'Use target DPI when saving logical position');assert(calls.includes('sync_aux_windows_to_main_monitor'));assert.equal(calls.at(-1),'finish_main_window_monitor_switch');
 const before=calls.length;assert.equal(await c.switchTo(api.key(secondary)),true);assert.equal(calls.length,before,'Already on target must not move');
 assert.equal(await c.switchTo(),true);assert.equal(here,primary,'Original cycle shortcut remains functional');
 monitors=[primary];assert.equal(await c.switchTo(api.key(secondary)),false);assert.equal(here,primary,'Disconnected target must not teleport to guessed bounds');
 here=null;assert.equal(await c.switchTo(api.key(primary)),true);assert.equal(here,primary,'Explicit primary target supports single-screen recovery');
 monitors=[primary,secondary];confirm=false;assert.equal(await c.switchTo(api.key(secondary)),false,'Do not confirm a switch that did not reach the target');assert.equal(calls.at(-1),'finish_main_window_monitor_switch');
}
(async()=>{
 const f=await fixture();assert.equal(f.moves.length,0,'Wait until all main layout handlers are installed');await f.start();assert.equal(f.here(),secondary);
 const pending=f.control.refresh(true),requests=f.listRequests(),duplicate=f.control.refresh(true);assert.equal(f.listRequests(),requests,'Slow refresh must not accumulate duplicate topology polls');await Promise.all([pending,duplicate]);
 f.setHere(primary);await f.control.refresh();assert.equal(f.here(),primary,'Manual temporary switching is not undone by polling');
 f.setMonitors([primary]);await f.control.refresh();assert.equal(f.here(),primary);assert.equal(JSON.parse(f.storage.get(api.storageKey)).name,'DISPLAY2','Fallback must preserve saved preference');
 f.setMonitors([primary,secondary]);await f.control.refresh();assert.equal(f.here(),secondary,'Reconnect restores selected default');
 f.setSuccess(false);await assert.rejects(f.control.apply({kind:'primary'},true),/未确认/);assert.equal(JSON.parse(f.storage.get(api.storageKey)).name,'DISPLAY2');
 f.setSuccess(true);await f.control.apply({kind:'auto'},true);assert.equal(f.here(),secondary);assert.equal(JSON.parse(f.storage.get(api.storageKey)).kind,'auto');
 f.setHere(null);f.setMonitors([primary]);await f.control.refresh();assert.equal(f.here(),primary,'Off-screen recovery works even without an explicit preference');
 f.events.get('wt-default-monitor-change')({payload:{requestId:'save-primary',preference:{kind:'primary'}}});await settle();assert.equal(f.replies.at(-1).requestId,'save-primary');assert.equal(f.replies.at(-1).ok,true);
 f.control.dispose();assert.equal(f.unlistens(),1);assert.equal(f.timers.size,0);
 await productionBridge();console.log('PASS: default monitor identity, startup readiness, disconnect/reconnect, temporary switching, verified native sequence, negative coordinates and mixed DPI');
})().catch(error=>{console.error(error);process.exitCode=1});
