const {fixturePath}=require('./upstream-fixtures.cjs');
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const {babelParse,traverse}=require('playwright/lib/transform/babelBundle');
const memory=new Map();let writes=0;
const storage={getItem:k=>memory.get(k),setItem:(k,v)=>{writes++;memory.set(k,v)}},core={localStorage:storage};
vm.createContext(core);vm.runInContext(fs.readFileSync('patches/room-positions-core.js','utf8').replace('export {__wtRoomPositions};','')+';this.api=__wtRoomPositions;',core);
const api=core.api,a=api.create(storage);
assert.equal(api.getMode(storage),'custom');api.setMode('vertical',storage);assert.equal(api.getMode(storage),'vertical');
api.setMode('invalid',storage);assert.equal(api.getMode(storage),'custom');
assert(a.put(1,'room',2,345,222,1000,800));assert.equal(a.get(1,'room',2,1000,800).left,345);
let unchanged=writes;assert(a.put(1,'room',2,345,222,1000,800));assert.equal(writes,unchanged,'Unchanged coordinates are not written twice');
assert.equal(a.get(1,'other',2,1000,800),null);assert.equal(a.get(3,'room',2,1000,800),null);assert.equal(a.get(1,'room',4,1000,800),null);
assert(!a.put(1,'room',1,5,5,1000,800));assert(!a.put(1,'room',2,NaN,5,1000,800));assert(!a.put(1,'',2,5,5,1000,800));
assert.equal(a.get(1,'room',2,500,400).top,111);
assert.equal(api.create(storage).get(1,'room',2,1000,800).left,345,'New session reads saved placement');
const broken=api.create({getItem:()=>'{',setItem:()=>{throw Error('quota')}});assert.equal(broken.get(1,'room',2,1000,800),null);assert.equal(broken.put(1,'room',2,1,2,1000,800),false);
const bounded=new Map(),b=api.create({getItem:k=>bounded.get(k),setItem:(k,v)=>bounded.set(k,v)});for(let id=2;id<1004;id++)b.put(1,'room',id,id,2,2000,1000);assert.equal(JSON.parse(bounded.get(api.key)).length,1000);
const source=fs.readFileSync(fixturePath('dist/migration-1.0.3.4/index-pp8VWaUF.js'),'utf8'),fn={};
traverse(babelParse(source,'main.mjs',true),{FunctionDeclaration(p){const name=p.node.id.name;if(['Li','en','vt','Bi','Fd','_a','gl','tc','Nl','__wtSetRoomMode','__wtSaveRoomPosition','__wtRestoreRoomPosition'].includes(name))fn[name]=source.slice(p.node.start,p.node.end)}});
assert.equal(Object.keys(fn).length,12);
function fixture(account=1,room='room'){
 const c={__wtRoomMode:'custom',__wtRoomPositions:api,__wtSavedRoomPositions:api.create(storage),localStorage:storage,R:{isLoggedIn:true,userInfo:{id:account}},Vo:{value:room},ut:new Set(),Mt:new Set(),Di:new Map(),nv:value=>({value}),Lt:{value:true},Pt:{value:null},window:{innerWidth:1000,innerHeight:800},ft:200,
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

const geometry={left:0,top:0,right:1000,bottom:800,width:200,height:200,gap:10,offsetX:0,offsetY:0};
const box=(left,top)=>({left,top,right:left+200,bottom:top+200});
const overlaps=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
const slots=(count,blocked=[])=>Array.from({length:count},(_,index)=>api.vertical(index,count,geometry,blocked,box,overlaps));
assert.deepEqual(slots(4).map(p=>[p.left,p.top]),[[800,600],[800,390],[800,180],[590,600]]);
assert.equal(slots(4,[box(800,600)])[0].top,390,'Avoid the local pet before filling the next column');
const dense=slots(30);
assert.equal(new Set(dense.map(p=>`${p.left}:${p.top}`)).size,30);
assert(dense.every(p=>p.left>=0&&p.left+200<=1000&&p.top>=0&&p.top+200<=800));
c=fixture(1,'mode-room');pet={id:5,left:0,top:0};c.ht.value=[pet];c.Mt.add(5);
Object.assign(c,{c:100,Pn:200,Tt:10,yn:()=>({left:0,top:0,right:0,bottom:0}),Jd:()=>null,ya:box,$d:overlaps,no:()=>false,Fe:cb=>cb(),Dn(){},Me(){}});
c.Fd(pet);c.vt(pet,{left:310,top:225});pet.left=310;pet.top=225;
c.Hl=index=>{const p=c.Nl(index);return{left:p.left-50,top:p.top-40}};
c.__wtSetRoomMode('horizontal');assert.equal(api.getMode(storage),'horizontal');assert(c.Mt.has(5));
c.__wtSetRoomMode('vertical');assert.equal(api.getMode(storage),'vertical');assert.equal(c.Nl(0).left,800);assert.equal(pet.left,800);
c.vt(pet,{left:101,top:102});
c.__wtSetRoomMode('custom');assert.equal(pet.left,310);assert.equal(pet.top,225);assert(!c.Mt.has(5),'Switching modes must retain saved custom coordinates');
console.log('PASS: production position memory, three persisted layout modes, column order and viewport bounds, preserved custom coordinates');
