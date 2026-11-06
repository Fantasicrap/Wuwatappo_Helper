const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const {fixturePath,target}=require('./upstream-fixtures.cjs');
const code=fs.readFileSync('patches/update-ui.js','utf8').replaceAll('export function ','function ');
const read=file=>fs.readFileSync(fixturePath('dist/migration-1.0.3.4/'+file),'utf8');
assert(read('index-CuzHFfJW.js').includes('function isAppUpdaterEnabled(){return false}'));
const settings=read('index-CiT_jZa7.js');
assert(settings.includes('mountHelperUpdate')&&settings.includes('去 GitHub 下载')&&settings.includes(JSON.stringify(target))&&settings.includes('id:"wt-us"'));
assert(read('switchDisplayMonitor-B50jXMGD.js').includes('watchAutomaticHelperUpdate'));

function fixture(status){
 const calls=[],events=new Map(),timers=new Map(),published=[];
 let next=0,quits=0,fail=false;
 const window={addEventListener:(event,fn)=>events.set(event,fn),removeEventListener:event=>events.delete(event),open:()=>calls.push(['browser'])};
 const context=vm.createContext({window,AbortController,setTimeout:(fn,delay)=>{timers.set(++next,{fn,delay});return next},clearTimeout:id=>timers.delete(id),
  fetch:async(url,opts)=>{const path=url.split('/').at(-1);calls.push([path,opts.method,opts.headers?.['X-Wuwa-Update']]);
   if(fail)throw new Error('offline');
   if(path==='check')status={state:'downloading',automatic:false};
   return {ok:true,json:async()=>path==='status'?status:{accepted:true}};
  }});
 const api=vm.runInContext(code+';({mountHelperUpdate,watchAutomaticHelperUpdate})',context);
 const quit=async()=>{quits++};
 return {calls,published,events,api,quit,window,setStatus:value=>{status=value},setOffline:()=>{fail=true},get quits(){return quits},
  async timer(delay){const task=[...timers].find(([,t])=>t.delay===delay);assert(task,'missing timer '+delay);timers.delete(task[0]);await task[1].fn()}};
}

(async()=>{
 const manual=fixture({state:'idle'});
 const ui=manual.api.mountHelperUpdate(v=>manual.published.push(v),manual.quit);
 await ui.click({state:'idle'});
 assert(manual.calls.some(c=>c.join('|')==='check|POST|1'));
 assert.equal(manual.published.at(-1).state,'downloading');
 manual.setStatus({state:'ready',automatic:false});await manual.timer(1200);
 assert.equal(manual.quits,0,'Manual download must wait for restart');
 await ui.click(manual.published.at(-1));assert.equal(manual.quits,1);
 assert(manual.calls.some(c=>c.join('|')==='install|POST|1'));
 await manual.timer(20000);assert(manual.calls.some(c=>c.join('|')==='cancel|POST|1'));
 ui.stop();

 const auto=fixture({state:'downloading',automatic:true});
 auto.api.watchAutomaticHelperUpdate(auto.quit);assert.equal(auto.calls.length,0,'Wait for desk pet startup');
 await auto.events.get('wt-main-ready')();
 auto.setStatus({state:'ready',automatic:true});await auto.timer(2000);
 assert.equal(auto.quits,1);assert(auto.calls.some(c=>c.join('|')==='install|POST|1'));

 const offline=fixture({state:'idle'});offline.setOffline();
 const failed=offline.api.mountHelperUpdate(v=>offline.published.push(v),offline.quit);
 await failed.click({state:'idle'});assert.equal(offline.published.at(-1).state,'error');
 await failed.open();assert(offline.calls.some(c=>c[0]==='browser'));
 console.log('PASS: packaged settings and startup hooks, manual restart, automatic restart, and GitHub fallback');
})().catch(e=>{console.error(e);process.exitCode=1});
