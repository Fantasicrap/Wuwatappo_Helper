const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
const scope={};vm.createContext(scope);vm.runInContext(fs.readFileSync(path.join(__dirname,'room-history-core.js'),'utf8')+';this.C=__wtRoomHistoryCore',scope);const C=scope.C,plain=v=>JSON.parse(JSON.stringify(v));
async function main(){const memory=new Map(),storage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v)};let clock=1000;const history=C.create({storage,now:()=>clock,pause:async ms=>{clock+=ms}});
 assert.equal(history.remember(0,'room'),false);assert.equal(history.remember(1,'bad\nroom'),false);history.remember(1,' 1001 ');clock++;history.remember(1,'1002');clock++;history.remember(1,'1001');history.remember(2,'2001');assert.deepEqual(plain(history.read(1)).map(r=>r.id),['1001','1002']);assert.deepEqual(plain(history.read(2)).map(r=>r.id),['2001']);assert.equal(history.read(3).length,0);
 memory.set(C.prefix+4,'not json');assert.equal(history.read(4).length,0);memory.set(C.prefix+4,JSON.stringify([{id:'',visitedAt:1},{id:'x'},{id:'x',visitedAt:3},{id:'x',visitedAt:1}]));assert.deepEqual(plain(history.read(4)),[{id:'x',visitedAt:3}]);
 let s={accountId:1,mode:'idle',roomId:'',canLeave:true,canJoin:true,blocked:false},calls=[],confirmation=true,leaveResult=true;let api={state:()=>({...s}),setInput:id=>calls.push('input:'+id),leave:async()=>{calls.push('leave');if(leaveResult){s.mode='idle';s.roomId=''}return leaveResult},join:async()=>{calls.push('join');s.mode='member';s.roomId='1001';if(confirmation)history.remember(1,'1001')},timeout:300};
 let r=await history.enter(1,'1001',api);assert.equal(r.code,'joined');assert.deepEqual(calls,['input:1001','join']);
 calls=[];r=await history.enter(1,'1001',api);assert.equal(r.message,'你已经在该房间');assert.deepEqual(calls,[]);
 s.roomId='1002';calls=[];r=await history.enter(1,'1001',api);assert.equal(r.code,'joined');assert.deepEqual(calls,['leave','input:1001','join']);
 s.roomId='1002';leaveResult=false;calls=[];r=await history.enter(1,'1001',api);assert.equal(r.code,'leave');assert.deepEqual(calls,['leave']);assert.equal(s.roomId,'1002');
 leaveResult=true;calls=[];const switchingAccount={...api,leave:async()=>{calls.push('leave');s={...s,accountId:2,mode:'idle',roomId:''};return true}};r=await history.enter(1,'1001',switchingAccount);assert.equal(r.code,'account');assert.deepEqual(calls,['leave']);
 s={...s,accountId:1,mode:'idle',roomId:''};calls=[];r=await history.enter(1,'unknown',api);assert.equal(r.code,'missing');assert.deepEqual(calls,[]);s.blocked=true;r=await history.enter(1,'1001',api);assert.equal(r.code,'account');s.blocked=false;
 confirmation=false;r=await history.enter(1,'1001',api);assert.equal(r.code,'timeout','Optimistic room state alone must not count as successful entry');assert.equal(history.busy,false);
 s={...s,mode:'idle',roomId:''};r=await history.enter(1,'1001',{...api,join:async()=>{}});assert.equal(r.code,'join');
 s={...s,mode:'idle',roomId:''};let release;const waiting=history.enter(1,'1001',{...api,join:()=>new Promise(resolve=>{release=resolve})});assert.equal(history.busy,true);r=await history.enter(1,'1002',api);assert.equal(r.code,'busy');release();await waiting;assert.equal(history.busy,false);
 const broken=C.create({storage:{getItem:()=>null,setItem:()=>{throw Error('quota')}}});assert.equal(broken.remember(1,'x'),false);assert.equal(broken.read(1).length,0);
 for(let i=0;i<120;i++){clock++;history.remember(9,String(i))}assert.equal(history.read(9).length,100);assert.equal(history.read(9)[0].id,'119');
 history.remember(10,'friends');assert(history.annotate(10,'friends',{note:'周五联机',pinned:true}));
 for(let i=0;i<105;i++){clock++;history.remember(10,String(i))}
 const restarted=C.create({storage});assert.equal(restarted.read(10).length,101);
 assert.equal(restarted.read(10)[0].id,'friends');assert.equal(restarted.read(10)[0].note,'周五联机');
 assert.equal(restarted.annotate(11,'friends',{note:'other account'}),false);
 assert(restarted.annotate(10,'friends',{pinned:false}));assert.equal(restarted.read(10).length,100);
 const report={passed:true,checks:['Per-account history, deduplication, recency and bounded local storage','Only confirmed room snapshots record; invalid/stale data ignored','Same-room hint without leave or join','Other-room switch awaits successful leave before join','Failed leave preserves room and prevents join','Account change and update lock stop switching','Unknown history entry rejected','Optimistic join without server confirmation times out','Concurrent clicks serialize; lock released on failure','Storage failure does not crash app'],serverRequestsMade:false,realAccountRoomSwitchTested:false};fs.writeFileSync(path.join(__dirname,'room-history-tests.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));}
main().catch(e=>{console.error(e.stack);process.exitCode=1});
