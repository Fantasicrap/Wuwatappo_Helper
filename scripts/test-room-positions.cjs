const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const {babelParse,traverse}=require('playwright/lib/transform/babelBundle');
const memory=new Map();let writes=0;
const storage={getItem:k=>memory.get(k),setItem:(k,v)=>{writes++;memory.set(k,v)}},core={localStorage:storage};
vm.createContext(core);vm.runInContext(fs.readFileSync('patches/room-positions-core.js','utf8').replace('export {__wtRoomPositions};','')+';this.api=__wtRoomPositions;',core);
const api=core.api,a=api.create(storage);
assert(a.put(1,'room',2,345,222,1000,800));assert.equal(a.get(1,'room',2,1000,800).left,345);
let unchanged=writes;assert(a.put(1,'room',2,345,222,1000,800));assert.equal(writes,unchanged,'Unchanged coordinates are not written twice');
assert.equal(a.get(1,'other',2,1000,800),null);assert.equal(a.get(3,'room',2,1000,800),null);assert.equal(a.get(1,'room',4,1000,800),null);
assert(!a.put(1,'room',1,5,5,1000,800));assert(!a.put(1,'room',2,NaN,5,1000,800));assert(!a.put(1,'',2,5,5,1000,800));
assert.equal(a.get(1,'room',2,500,400).top,111);
assert.equal(api.create(storage).get(1,'room',2,1000,800).left,345,'New session reads saved placement');
const broken=api.create({getItem:()=>'{',setItem:()=>{throw Error('quota')}});assert.equal(broken.get(1,'room',2,1000,800),null);assert.equal(broken.put(1,'room',2,1,2,1000,800),false);
const bounded=new Map(),b=api.create({getItem:k=>bounded.get(k),setItem:(k,v)=>bounded.set(k,v)});for(let id=2;id<1004;id++)b.put(1,'room',id,id,2,2000,1000);assert.equal(JSON.parse(bounded.get(api.key)).length,1000);
const source=fs.readFileSync('dist/migration-1.0.3.3/index-pp8VWaUF.js','utf8'),fn={};
traverse(babelParse(source,'main.mjs',true),{FunctionDeclaration(p){const name=p.node.id.name;if(['Li','en','vt','Bi','Fd','_a','gl','tc','__wtSaveRoomPosition','__wtRestoreRoomPosition'].includes(name))fn[name]=source.slice(p.node.start,p.node.end)}});
assert.equal(Object.keys(fn).length,10);
function fixture(account=1,room='room'){
 const c={__wtRoomPositions:api,__wtSavedRoomPositions:api.create(storage),localStorage:storage,R:{isLoggedIn:true,userInfo:{id:account}},Vo:{value:room},ut:new Set(),Mt:new Set(),Di:new Map(),nv:value=>({value}),Lt:{value:true},Pt:{value:null},window:{innerWidth:1000,innerHeight:800},ft:200,
 ce:{value:{querySelector:()=>({getBoundingClientRect:()=>({left:50,top:40,width:200})})}},Mr:(x,y)=>({left:Math.max(0,Math.min(x,800)),top:Math.max(0,Math.min(y,589))}),Hl:()=>({left:12,top:34}),wa:()=>({left:12,top:34}),Pc:()=>({left:12,top:34}),tn:()=>true,ht:{value:[]}};
 vm.createContext(c);vm.runInContext(Object.values(fn).join(';'),c);return c;
}
// Actual placement functions: restore before initial coordinate conversion and
// clear auto-layout membership so the final layout pass cannot overwrite it.
let c=fixture(),pet={id:2,left:0,top:0,action:1};c.ht.value=[pet];c.Mt.add(2);c.Fd(pet);assert.equal(pet.left,345);assert.equal(pet.top,222);assert(c.ut.has(2));assert(!c.Mt.has(2));c._a();assert.equal(pet.left,345);
c.tc();assert.equal(pet.left,345);assert(!c.Mt.has(2),'Monitor reconciliation must not reset remembered peers to automatic slots');
c.vt(pet,{left:456,top:321});let count=writes;for(let i=0;i<30;i++)c.vt(pet,{action:i%3});assert.equal(writes,count,'Hand animation does not write positions');
c=fixture();pet={id:2,left:0,top:0};c.Fd(pet);assert.equal(pet.left,456);assert.equal(pet.top,321,'Drag position survives a fresh runtime');
c.window.innerWidth=500;c.window.innerHeight=400;c.ut.clear();c.Fd(pet);assert.equal(pet.left,228);assert.equal(pet.top,160.5,'Viewport changes proportionally adapt stored positions before clamping');
api.create(storage).put(1,'room',2,980,790,1000,800);c=fixture();pet={id:2,left:0,top:0};c.Fd(pet);assert.equal(pet.left,800);assert.equal(pet.top,589,'Restored coordinates obey native screen bounds');
c=fixture(3);pet={id:2,left:0,top:0};c.Fd(pet);assert.equal(pet.left,50);assert.equal(pet.top,40,'Another account uses original placement when no saved entry exists');
c=fixture(1,'new-room');pet={id:2,left:0,top:0};c.Mt.add(2);c.Fd(pet);assert(api.create(storage).get(1,'new-room',2,1000,800),'Settled automatic placements are also saved');
console.log('PASS: production placement save/restore survives restart, isolates account/room/member, respects bounds and auto-layout, avoids action writes, handles corrupt storage and bounds history');
