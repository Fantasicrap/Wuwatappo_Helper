const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const runtime=fs.readFileSync(path.join(__dirname,'room-visibility-runtime.js'),'utf8');
const uiCode=fs.readFileSync(path.join(__dirname,'room-visibility-ui.js'),'utf8');
const updates={hover:0,layout:0,panel:0};
const members=[
 {id:1,online:true,dockVisible:true},
 {id:2,online:true,dockVisible:true},
 {id:3,online:true,dockVisible:true},
 {id:4,online:false,dockVisible:true},
 {id:5,online:true,dockVisible:false},
 {id:-1,online:true,dockVisible:true},
 {id:2,online:true,dockVisible:true}
];
const original=JSON.stringify(members);
const styles=[];let watcher;const ctx={Oe:(source,callback)=>{watcher=callback},document:{createElement:()=>({}),head:{append:node=>styles.push(node)}},Ie:()=>false,Eo:{value:new Set([3,40])},fe:{value:members},Go:member=>member.id===1,
 Md:()=>{ctx.Eo.value=new Set()},xo:()=>updates.hover++,tn:()=>updates.layout++,tt:()=>updates.panel++};
vm.createContext(ctx,{codeGeneration:{strings:false,wasm:false}});
ctx.W=value=>({value});ctx.Wo={value:1};
vm.runInContext(fs.readFileSync(path.join(__dirname,'room-visibility-policy.js'),'utf8')+runtime+';this.setVisible=__wtSetAllRoomMembersVisible;this.hidden=no;this.individual=cl;this.reset=Md',ctx,{timeout:1000});
assert(styles[0].textContent.includes('.room-cat-shell--ui-hidden *{pointer-events:none!important}'));
ctx.setVisible(false);assert.deepEqual([...ctx.Eo.value].sort((a,b)=>a-b),[2,3,40]);
ctx.setVisible(false);assert.deepEqual([...ctx.Eo.value].sort((a,b)=>a-b),[2,3,40]);
assert(!ctx.Eo.value.has(1));assert(!ctx.Eo.value.has(4));assert(!ctx.Eo.value.has(5));assert(!ctx.Eo.value.has(-1));
ctx.setVisible(true);assert.equal(ctx.Eo.value.size,0);ctx.setVisible(true);assert.equal(ctx.Eo.value.size,0);
assert.equal(JSON.stringify(members),original);assert.deepEqual(updates,{hover:4,layout:4,panel:4});
ctx.Ie=()=>true;ctx.setVisible(false);assert.equal(ctx.Eo.value.size,0);assert.equal(updates.panel,4);
ctx.Ie=()=>false;ctx.setVisible('false');assert.equal(ctx.Eo.value.size,0);assert.equal(updates.panel,4);
const events=[];
const ui={de:async e=>events.push(JSON.parse(JSON.stringify(e))),He:()=>{},console:{warn:()=>{}}};
vm.createContext(ui);vm.runInContext(uiCode+';this.bulk=__wtBulkRoomVisible',ui,{timeout:1000});
(async()=>{
 await ui.bulk(false);await ui.bulk(true);
 assert.deepEqual(events,[{type:'set-room-members-visibility',visible:false},{type:'set-room-members-visibility',visible:true}]);
 for(const event of events)ctx.setVisible(event.visible);
 assert.equal(ctx.Eo.value.size,0);
 ctx.setVisible(false);assert(ctx.hidden(200),'Late joiner must be hidden before first render');
 members.push({id:200,online:true,dockVisible:true});watcher();assert(ctx.Eo.value.has(200),'Actual per-member hidden set is updated when a new snapshot arrives');
 assert(ctx.hidden('200'),'String-form member IDs follow the same hide rule');assert(!ctx.hidden('1'),'String-form local ID stays visible');
 assert(ctx.hidden(4)&&ctx.hidden(5),'Previously offline or dock-hidden peers stay hidden on return');
 assert(!ctx.hidden(1)&&!ctx.hidden(-1)&&!ctx.hidden(NaN),'Never hide self or invalid IDs');
 ctx.individual(200,false);assert(!ctx.hidden(200),'An explicit individual show overrides the default');
 watcher();assert(!ctx.hidden(200),'Snapshot updates preserve explicit show overrides');
 assert(ctx.hidden(201));ctx.setVisible(false);assert(ctx.hidden(200),'Hide all clears per-member show exceptions');
 ctx.reset();assert(ctx.hidden(202),'Original room reset must not clear the session hide default');
 ctx.setVisible(true);assert(!ctx.hidden(200)&&!ctx.hidden(203),'Show all restores future joiners too');
 ctx.individual(200,true);assert(ctx.hidden(200)&&!ctx.hidden(203),'Individual hide still works after show all');
 ctx.setVisible(false);ctx.Ie=()=>true;ctx.setVisible(true);assert(ctx.hidden(204));ctx.Ie=()=>false;
 const result={passed:true,checks:[
  'Hide all eligible online peers; exclude self, offline and non-displayed peers',
  'Repeated hide and show actions are idempotent',
  'Show clears local hidden overrides',
  'Duplicate member IDs do not toggle peers back on',
  'Member records and server desktop flags unchanged',
  'Hover, hit regions and room panel refreshed',
  'Forced update lock and invalid values ignored',
  'UI emits one explicit visibility message per button'
  ,'Late join, reconnect, room reset and individual override obey the persistent session default'
 ],networkRequestsMade:false};
 fs.writeFileSync(path.join(__dirname,'room-visibility-tests.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
})().catch(e=>{console.error(e.stack);process.exitCode=1});
