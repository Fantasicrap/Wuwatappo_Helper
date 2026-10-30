const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),{babelParse,traverse}=require('playwright/lib/transform/babelBundle');
const source=fs.readFileSync('dist/migration-1.0.3.2/index-pp8VWaUF.js','utf8'),functions={};
traverse(babelParse(source,'panel.mjs',true),{FunctionDeclaration(p){const code=source.slice(p.node.start,p.node.end);if(p.node.id.name==='$t'&&!code.includes('ur(T,{online:!0'))return;if(['no','ul','xd','eh','$t','__wtSetAllRoomMembersVisible','__wtHideNewRoomMembers'].includes(p.node.id.name)){assert(!functions[p.node.id.name]);functions[p.node.id.name]=code}}});
for(const name of ['no','ul','xd','eh','$t','__wtSetAllRoomMembersVisible','__wtHideNewRoomMembers'])assert(functions[name],'Missing production function '+name);
const start=source.indexOf('const __wtHideRoomPeers='),end=source.indexOf(functions.no,start);assert(start>=0&&end>start);
function fixture(){
 const members=[{id:1,online:true,dockVisible:true,roleId:'self'},{id:2,online:false,dockVisible:false,roleId:'role'},{id:3,online:true,dockVisible:true,roleId:'role'}],joins=[];
 const c={Number,Set,W:value=>({value}),Wo:{value:1},Eo:{value:new Set()},de:{value:members},d:{value:members},ut:new Set(),Mt:new Set(),Vr:new Set(),Ie:()=>false,Go:m=>m.id===1,dt:Number,O:()=>1,ur:(item,patch)=>Object.assign(item,patch),xo:()=>{},on:()=>{},it:()=>{},document:{createElement:()=>({}),head:{append:()=>{}}}};
 c.ip=id=>{const member=members.find(m=>m.id===id);if(member)Object.assign(member,{online:false,dockVisible:false})};c.il=id=>{const index=members.findIndex(m=>m.id===id);if(index>=0)members.splice(index,1)};
 c.n={onMemberJoin:(id,reason)=>joins.push({id,reason,hidden:c.hidden(id)})};
 vm.createContext(c);vm.runInContext(source.slice(start,end)+Object.values(functions).join(';')+';this.hidden=no;this.individual=ul;this.visible=__wtSetAllRoomMembersVisible;this.leave=eh;this.reconnect=$t;this.snapshot=__wtHideNewRoomMembers;',c);
 return{c,members,joins};
}
const {c,members,joins}=fixture();c.visible(false);
c.leave(2,'offline');c.reconnect(2);assert(c.hidden(2),'An internal offline cleanup must not become a manual show exception');assert.equal(joins.at(-1).hidden,true,'Hidden at reconnect callback, before the deep watcher runs');c.snapshot();assert(c.hidden(2));
c.leave(3,'offline');c.reconnect(3);assert(c.hidden(3),'Online -> offline -> online stays hidden');
c.leave(2,'left');members.push({id:2,online:true,dockVisible:true,roleId:'role'});assert(c.hidden(2),'Leaving and returning with the same member ID stays hidden');c.snapshot();assert(c.hidden(2));
c.individual(3,false);assert(!c.hidden(3));c.leave(3,'offline');c.reconnect(3);assert(!c.hidden(3),'A genuine manual show exception remains valid');
c.visible(false);c.leave(3,'offline');c.reconnect(3);assert(c.hidden(3),'Hide all clears a previous explicit show exception');
c.visible(true);c.leave(3,'offline');c.reconnect(3);assert(!c.hidden(3),'Show all restores normal reconnect visibility');assert(!c.hidden(1),'Never hide the local pet');
assert(source.includes('"room-cat-shell--ui-hidden":no(o.id)')&&source.includes('"data-room-cat-ui-hidden":no(o.id)?"true":"false"'),'Rendering and native hit-region filtering use the same visibility policy');
console.log('PASS: production offline/leave cleanup and reconnect callbacks preserve Hide All; explicit manual show and Show All remain functional');
