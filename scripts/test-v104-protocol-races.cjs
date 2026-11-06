const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {babelParse,traverse}=require('playwright/lib/transform/babelBundle');
const {fixturePath}=require('./upstream-fixtures.cjs');
const panel=fs.readFileSync(fixturePath('dist/migration-1.0.3.4/index-pp8VWaUF.js'),'utf8');
const common=fs.readFileSync(fixturePath('dist/migration-1.0.3.4/index-CuzHFfJW.js'),'utf8');

function extract(source,visitors){
 const parts={};
 const collect=(type,name,match)=>p=>{
  const n=p.node,text=source.slice(n.start,n.end);
  if((n.id?.name??n.key?.name)===name&&(!match||text.includes(match))){
   assert(!parts[name],'Ambiguous production function '+name);
   parts[name]=text;
  }
 };
 const visitor={};
 for(const type of Object.keys(visitors)){
  const collectors=visitors[type].map(([name,match])=>collect(type,name,match));
  visitor[type]=p=>collectors.forEach(collect=>collect(p));
 }
 traverse(babelParse(source,'bundle',true),visitor);
 assert.equal(Object.keys(parts).length,Object.values(visitors).flat().length);
 return parts;
}
const panelFns=extract(panel,{FunctionDeclaration:[['pc'],['ge','__wtReportClicks'],['Ft','rm-invalid-snapshot'],['We','se.connected']]});
const commonFns=extract(common,{
 FunctionDeclaration:['parseClickCount','parseSafeClickCount','isFrozenClickCount','clampClickCountSum','resolveClickReportGrossTotal','openChest'].map(n=>[n]),
 ObjectMethod:['setLocalClickCount','applyClickReportSuccess','applyChestClickConsume','serverClickTotal','serverClickConsume','totalClickCount','cumulativeClickCount'].map(n=>[n]),
 ClassMethod:[['post','renewTokenBeforeRequest']]
});
const start=common.indexOf('let __wtClickQueue=');
const ledger=common.slice(start,common.indexOf('export {__wtClickIO,',start));
assert(start>=0&&ledger.includes('function __wtMakeChestLedger'));
const storeMethods=['setLocalClickCount','applyClickReportSuccess','applyChestClickConsume','serverClickTotal','serverClickConsume','totalClickCount','cumulativeClickCount'];
const defer=()=>{let resolve;const promise=new Promise(r=>{resolve=r});return{promise,resolve}};
async function until(condition){for(let i=0;i<60&&!condition();i++)await Promise.resolve();assert(condition(),'Operation did not reach the expected checkpoint')}
const ref=value=>({value});
const blank=()=>{};
const reward={asset_id:12,asset_name:'reward.png',asset_type:'emote',rarity_type:'common',click_consume:1000};

function setup(){
 let token='session-a',auto=true;
 const sends=[],caches=[],reports=[],account={id:1,cuid:'a',total_click_count:5000,total_click_consume:0,left_treasure_chest:0,right_treasure_chest:0};
 const store={userInfo:{...account},localClickCount:10,serverClickSpend:0,get isLoggedIn(){return !!this.userInfo},$patch(v){Object.assign(this,v)},resetServerClickSpend(){this.serverClickSpend=0}};
 const ctx={console:{warn:blank},setTimeout,clearTimeout,globalStore:store,R:store,getCookie:()=>token,loadKeyPressClickCount:async()=>0,
  persistCumulativeClickCount:async(...args)=>reports.push(args),persistKeyPressClickCount:()=>caches.push(store.localClickCount),
  window:{dispatchEvent:()=>caches.push(store.localClickCount)},CustomEvent:class{},
  A:1,r:{connected:true},Ze:blank,ki:ack=>ack?.c===0,ot:async(event,body)=>{sends.push([event,body.num]);return{c:0}},
  Ie:()=>false,Fn:ref(false),kt:ref(false),Ei:ref(false),Oi:ref(false),xi:ref(false),Fi:ref(false),Wn:ref(true),Gn:ref(false),
  Qn:ref(true),Mi:ref(false),br:ref(false),nt:ref({status:'online'}),Ns:1000,__wtAutoChestEnabled:()=>auto,
  mt:blank,lu:blank,q:blank,go:blank,me:blank,an:blank,od:blank,$:v=>v,gr:blank,Up:async()=>{},G:async()=>{},yt:v=>v,
  Cp:()=>{ctx.Wn.value=false},Xn:()=>caches.push(store.localClickCount),cu:async()=>{},fu:blank,uu:blank,L:ref(''),
  Tm:blank,Tp:async()=>{},Iv:blank,F:ref(null),ii:blank,pt:async()=>{},
  renewTokenBeforeRequest:async()=>{},withAuthHeader:()=>({token}),ApiBusinessError:Error,
  post:async(path,body,config)=>{sends.push(['open',body.click_num,config.token]);return{data:reward}},
  read:async()=>({...account,total_click_count:5010,total_click_consume:1000,left_treasure_chest:1800000000000})};
 vm.createContext(ctx);
 vm.runInContext(`${ledger};${Object.entries(commonFns).filter(([n])=>!storeMethods.includes(n)&&n!=='post').map(([,f])=>f).join(';')};
  Object.defineProperties(R,Object.getOwnPropertyDescriptors({${storeMethods.map(n=>(['setLocalClickCount','applyClickReportSuccess','applyChestClickConsume'].includes(n)?'':'get ')+commonFns[n]).join(',')}}));
  const jsonpClient={${commonFns.post},instance:{post:(...args)=>post(...args)}};
  const Pm=openChest;
  const __wtChestLedger=__wtMakeChestLedger({syncClock:async()=>{},ready:()=>Qn.value,read:()=>read(),changed:()=>{Wn.value=false}});
  ${panelFns.ge};${panelFns.pc};this.report=ge;this.claim=pc;this.sync=__wtChestLedger.sync;`,ctx);
 return{ctx,store,sends,caches,reports,replaceSession(){token='session-b';store.userInfo={...account,id:2,cuid:'b'}},setAuto(v){auto=v}};
}

async function run(){
 const flow=setup(),crAck=defer(),chestAck=defer();
 flow.ctx.ot=(event,body)=>{flow.sends.push([event,body.num]);return crAck.promise};
 flow.ctx.post=(path,body,config)=>{flow.sends.push(['open',body.click_num,config.token]);return chestAck.promise};
 const report=flow.ctx.report();await until(()=>flow.sends.length===1);
 flow.store.localClickCount+=5;
 const claim=flow.ctx.claim('left',true);await Promise.resolve();assert.equal(flow.sends.length,1);
 crAck.resolve({c:0});await report;await until(()=>flow.sends.length===2);
 assert.deepEqual(flow.sends,[['cr',5010],['open',5015,'session-a']]);assert.equal(flow.store.localClickCount,5);
 flow.store.localClickCount+=3;chestAck.resolve({data:reward});assert.equal(await claim,'confirmed');
 assert.equal(flow.store.serverClickTotal,5015);assert.equal(flow.store.serverClickConsume,1000);
 assert.equal(flow.store.localClickCount,3);assert.deepEqual(flow.caches,[5,3]);
 await flow.ctx.report();assert.deepEqual(flow.sends.at(-1),['cr',5018]);

 const switched=setup(),inventory=defer();switched.ctx.G=()=>inventory.promise;
 const waiting=switched.ctx.claim('left',true);switched.replaceSession();inventory.resolve();
 assert.equal(await waiting,'skipped');assert.deepEqual(switched.sends,[]);

 const disabled=setup(),preflight=defer();let renewing=false;
 disabled.ctx.renewTokenBeforeRequest=()=>{renewing=true;return preflight.promise};
 const preparing=disabled.ctx.claim('left',true);await until(()=>renewing);disabled.setAuto(false);preflight.resolve();
 await preparing;assert.deepEqual(disabled.sends,[],'The final HTTP preflight must respect the disabled auto setting');

 const late=setup(),lateAck=defer();late.ctx.ot=()=>{late.sends.push('cr');return lateAck.promise};
 const inFlight=late.ctx.report();await until(()=>late.sends.length===1);late.replaceSession();lateAck.resolve({c:0});await inFlight;
 assert.equal(late.store.serverClickTotal,5000);assert.deepEqual(late.reports,[]);assert.deepEqual(late.caches,[]);

 const lateChest=setup(),latePrize=defer();lateChest.ctx.post=()=>{lateChest.sends.push('open');return latePrize.promise};
 const oldClaim=lateChest.ctx.claim('left',true);await until(()=>lateChest.sends.length===1);
 lateChest.replaceSession();latePrize.resolve({data:reward});await oldClaim;
 assert.equal(lateChest.store.serverClickConsume,0);assert.equal(lateChest.ctx.Wn.value,true);

 const uncertain=setup();uncertain.ctx.post=async()=>{uncertain.sends.push('open');throw Error('response lost')};
 const correctRead=uncertain.ctx.read;uncertain.ctx.read=async()=>({id:99});
 assert.equal(await uncertain.ctx.claim('left',true),'uncertain');
 uncertain.store.localClickCount+=4;
 assert.equal(await uncertain.ctx.claim('left',true),'uncertain');assert.deepEqual(uncertain.sends,['open']);
 uncertain.ctx.read=correctRead;assert.equal(await uncertain.ctx.sync(),true);
 assert.equal(uncertain.store.serverClickConsume,1000);assert.equal(uncertain.store.localClickCount,4);
 await uncertain.ctx.claim('left',true);assert.deepEqual(uncertain.sends,['open']);

 const remembered=[],recovery=[],emit=[],socket={connected:true,emit:(...args)=>emit.push(args)};
 let session=1;
 const room={R:{isLoggedIn:true,userInfo:{id:1,room_no:'Room12345'}},r:socket,O:()=>1,yi:blank,u:ref('Room12345'),c:ref(''),a:ref('idle'),K:v=>String(v??'').trim(),
  ki:ack=>ack?.c===0,qs:ack=>ack?.c,nd:()=>true,Qh:blank,Zh:blank,X:blank,Qg:m=>m.map(row=>({id:row.u,online:true})),
  Ls:blank,G:blank,v:ref([]),d:ref([]),zt:0,n:{onMemberJoin:blank},dt:Number,Cd:Boolean,st:blank,
  __wtRoomHistory:{remember:(...args)=>remembered.push(args)},__wu104_111576:reason=>recovery.push(reason),
  __wtClickSession:()=>{const id=session;return()=>id===session}};
 vm.createContext(room);vm.runInContext(`let te='enter';${panelFns.We};${panelFns.Ft};this.request=()=>We('rm',{r:u.value},Ft);`,room);
 const ack=(r,m)=>({c:0,d:{r,m}});
 room.request();emit.at(-1).at(-1)(ack('Room12345',[{u:2,o:true}]));
 assert.deepEqual(remembered,[[1,'Room12345']]);assert.equal(room.a.value,'member');
 room.request();emit.at(-1).at(-1)(ack('WrongRoom',[{u:1,o:true}]));
 assert.deepEqual(recovery,['rm-invalid-snapshot']);assert.equal(room.u.value,'Room12345');
 room.request();session++;emit.at(-1).at(-1)(ack('Room12345',[{u:1,o:true}]));
 room.request();room.r={connected:true};emit.at(-1).at(-1)(ack('Room12345',[{u:1,o:true}]));
 assert.deepEqual(remembered,[[1,'Room12345']]);
 console.log('PASS: production 1.0.4 handlers preserve click increments, reconcile a lost chest response and record only current room confirmations');
}
run().catch(error=>{console.error(error);process.exitCode=1});
