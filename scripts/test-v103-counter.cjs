const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const {babelParse,traverse}=require('playwright/lib/transform/babelBundle');
const read=name=>fs.readFileSync('dist/migration-1.0.3.2/'+name,'utf8');
const panel=read('index-pp8VWaUF.js'),settings=read('index-CiT_jZa7.js'),common=read('index-CuzHFfJW.js');
function functions(source,names){const found={};traverse(babelParse(source,'production.mjs',true),{FunctionDeclaration(p){if(names.includes(p.node.id.name))found[p.node.id.name]=source.slice(p.node.start,p.node.end)}});for(const name of names)assert(found[name],'Missing production function '+name);return found}
const panelFns=functions(panel,['__wtBoostLocalClicks','__wtDisposeCounter','it','__wtFlushPanel','jp']);
const setter=[];traverse(babelParse(common,'store.mjs',true),{ObjectMethod(p){if(p.node.key.name==='setLocalClickCount')setter.push(common.slice(p.node.start,p.node.end))}});assert.equal(setter.length,1);
const parse=Object.values(functions(common,['parseClickCount','parseSafeClickCount','isFrozenClickCount'])).join(';');
const button=functions(settings,['__wtBoost']).__wtBoost;
const start=panel.indexOf('let __wtBoostBusy='),end=panel.indexOf(panelFns.__wtDisposeCounter)+panelFns.__wtDisposeCounter.length;
assert(start>=0&&end>start);
const runtime=panel.slice(start,end);
const settle=async()=>{for(let n=0;n<20;n++)await Promise.resolve()};
function fixture(){
 let now=1000,resolveSave,rejectSave;const calls={saves:0,persist:[],snapshots:[],errors:0},timers=new Map();let tid=0;
 const R={isLoggedIn:true,userInfo:{cuid:'A'},localClickCount:27,get cumulativeClickCount(){return 100+this.localClickCount}};
 const context={R,performance:{now:()=>now},console:{warn:()=>calls.errors++},Number,
  setTimeout:(fn,ms)=>{timers.set(++tid,{fn,due:now+ms});return tid},clearTimeout:id=>timers.delete(id),
  ge:{value:true},hc:()=>({localClickCount:R.localClickCount}),Au:async data=>calls.snapshots.push(data),
  Xn:()=>{calls.saves++;return new Promise((resolve,reject)=>{resolveSave=resolve;rejectSave=reject})},Vs:async(...args)=>calls.persist.push(args)};
 // Use the actual upstream setter and parsers. No invented addLocalClickCount stub.
 vm.createContext(context);vm.runInContext(parse+';this.setter=({'+setter[0]+'}).setLocalClickCount;',context);R.setLocalClickCount=context.setter;
 const emit=runtime.match(/await (\w+)\(hc\(\)\)/);assert(emit,'Missing snapshot dispatch');context[emit[1]]=async data=>calls.snapshots.push(data);
 vm.runInContext(runtime+';'+panelFns.jp+';let __wtBoostUntil=0;'+button+';this.click=__wtBoost;this.dispatch=jp;',context);
 context.ue=async event=>context.dispatch(event);
 return{context,R,calls,resolve:()=>resolveSave(),reject:()=>rejectSave(Error('storage failed')),advance:ms=>{now+=ms;for(const [id,t]of timers)if(t.due<=now){timers.delete(id);t.fn()}}};
}
(async()=>{
 let f=fixture();await f.context.click();assert.equal(f.R.localClickCount,10027,'Real settings event must update the real 1.0.3 store');assert.equal(f.calls.saves,1);assert.equal(f.calls.errors,0);
 for(let n=0;n<100;n++){f.advance(10);f.context.dispatch({type:'boost-local-clicks',delta:10000})}assert.equal(f.R.localClickCount,10027,'Slow save must not accumulate boosts');
 f.resolve();await settle();assert.equal(f.calls.persist.length,1);assert.equal(f.calls.persist[0][0],10127);assert.equal(f.calls.snapshots.at(-1).localClickCount,10027);
 await f.context.click();assert.equal(f.R.localClickCount,20027,'Button must recover when saving finishes');f.reject();await settle();assert.equal(f.calls.errors,1);f.advance(500);await f.context.click();assert.equal(f.R.localClickCount,30027,'A failed save must release the lock');f.resolve();await settle();
 f=fixture();await f.context.click();f.R.userInfo={cuid:'B'};f.resolve();await settle();assert.equal(f.calls.persist.length,0,'Do not persist to a different account');
 f=fixture();f.R.isLoggedIn=false;await f.context.click();f.resolve();await settle();assert.equal(f.calls.persist.length,0);assert.equal(f.R.localClickCount,10027);
 f=fixture();f.R.localClickCount=Number.MAX_SAFE_INTEGER-1;await f.context.click();assert.equal(f.R.localClickCount,Number.MAX_SAFE_INTEGER);f.resolve();await settle();
 console.log('PASS: actual settings event -> production dispatcher -> official 1.0.3 setter; throttling, save recovery, account guard and numeric limit');
})().catch(error=>{console.error(error);process.exitCode=1});
