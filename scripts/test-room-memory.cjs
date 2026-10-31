const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const {babelParse,traverse}=require('playwright/lib/transform/babelBundle');
const source=fs.readFileSync('dist/migration-1.0.3.2/index-pp8VWaUF.js','utf8');
const common=fs.readFileSync('dist/migration-1.0.3.2/index-CuzHFfJW.js','utf8');
let schedule,bootstrap;
traverse(babelParse(common,'common.mjs',true),{FunctionDeclaration(p){const name=p.node.id.name;if(name==='schedulePreloadAppUiImages')schedule=common.slice(p.node.start,p.node.end);if(name==='bootstrap')bootstrap=common.slice(p.node.start,p.node.end)}});
assert(schedule&&bootstrap);let mounted=false;
const startup={applyInstallerLaunchLocale:async()=>{},createApp:()=>({use:()=>{},mount:()=>{mounted=true}}),createHead:()=>({}),_sfc_main:{},i18n:{},pinia:{},router:{},preloadAppUiImages:()=>{throw Error('Eager UI decoding')},window:{requestIdleCallback:()=>{throw Error('Eager image scheduler')},setTimeout:()=>{throw Error('Eager image timer')}}};
vm.createContext(startup);vm.runInContext(schedule+';'+bootstrap+';this.start=bootstrap;',startup);
let render,signature,watcher,emote;
traverse(babelParse(source,'panel.mjs',true),{
 ArrowFunctionExpression(p){const t=source.slice(p.node.start,p.node.end);if(t.startsWith('(o,l)=>')&&t.includes('"data-room-cat-id":o.id')&&t.length<6000)render=t},
 VariableDeclarator(p){if(p.node.id.name==='Mp')signature=source.slice(p.node.init.start,p.node.init.end)},
 CallExpression(p){const a=p.node.arguments;if(p.node.callee.name==='Oe'&&a[0]?.name==='Mp')watcher=source.slice(a[1].start,a[1].end)},
 FunctionDeclaration(p){if(p.node.id.name==='yc')emote=source.slice(p.node.start,p.node.end)}
});
assert(render&&signature&&watcher&&emote,'Missing production memory paths');
const hidden=new Set(),members=[{id:2,roleId:'role',characterAssetId:10,nickname:'Test',partId:'part',dockVisible:true}];
let loads=[],preloads=[],bubbles=0;
const node=(tag,props,children)=>({tag,props,children});
const c={no:id=>hidden.has(id),Ce:()=>{},qe:node,Se:node,tr:node,dr:'fragment',pr:(a,f)=>a.map(f),sn:x=>x,jt:x=>x,Yt:()=>null,Hs:String,
 Pt:{value:null},Ir:{value:null},ut:new Set([2]),Dd:()=>({left:'12px',top:'34px'}),vl:()=>true,au:'loading',
 pl:()=>{loads.push('head');return 'head.png'},hl:()=>{loads.push('body');return 'body.png'},ml:()=>{loads.push('part');return 'part.png'},
 _y:[],ky:[],Cy:[],Sy:{},Ay:[],Ry:{},by:[],Ld:()=>{bubbles++;return []},Bd:()=>({}),
 pe:f=>f(),L:{value:'cdn'},sv:{value:new Set()},gu:()=>0,ht:{value:members},fc:0,An:{value:new Set()},Ip:async m=>preloads.push(m.id),
 ce:{value:true},dt:Number,de:{value:members},$:(x)=>x,np:()=>{},Hf:()=>{throw Error('Hidden emote allocated')},en:()=>{},vt:()=>{},mn:()=>{},window:{setTimeout:()=>{throw Error('Hidden emote timer')}}};
vm.createContext(c);vm.runInContext('this.render='+render+';this.signature=()=>'+signature+';this.preload='+watcher+';'+emote+';this.emote=yc;',c);
(async()=>{
 await startup.start();assert(mounted,'App still mounts without eager UI preloading');
 const before=c.signature();const shown=c.render(members[0],0);assert(shown.children.length>0);assert(loads.length>0);assert.equal(bubbles,1);
 await c.preload();assert.deepEqual(preloads,[2]);assert(c.An.value.has(2));
 loads=[];bubbles=0;preloads=[];hidden.add(2);
 const dormant=c.render(members[0],0);assert.equal(dormant.children.length,0);assert.equal(dormant.props['data-room-cat-id'],2);assert.equal(dormant.props.style.left,'12px');
 assert.deepEqual(loads,[]);assert.equal(bubbles,0);assert.notEqual(c.signature(),before,'Hide invalidates the preload watcher');
 await c.preload();assert.deepEqual(preloads,[]);assert(!c.An.value.has(2));c.emote(2,'test.png');
 hidden.delete(2);assert.equal(c.signature(),before);assert(c.render(members[0],0).children.length>0);await c.preload();assert.deepEqual(preloads,[2]);
 // A load already in flight must not mark a newly hidden peer as ready.
 let finish;c.Ip=()=>new Promise(resolve=>{finish=resolve});const pending=c.preload();hidden.add(2);await c.preload();finish();await pending;assert(!c.An.value.has(2));
 assert.equal(members.length,1);assert.equal(members[0].roleId,'role');
 console.log('PASS: production room renderer removes hidden image layers, skips hidden preloads/emotes, restores display and rejects stale load completion; room state retained');
})().catch(e=>{console.error(e);process.exitCode=1});
