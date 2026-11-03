const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {chromium}=require('playwright'),{babelParse,traverse}=require('playwright/lib/transform/babelBundle');
const dir='dist/migration-1.0.3.4',common=fs.readFileSync(path.join(dir,'index-CuzHFfJW.js'),'utf8'),main=fs.readFileSync(path.join(dir,'index-pp8VWaUF.js'),'utf8');
// Keep the exact bundled Vue runtime and production block flags. A mock VNode
// factory cannot expose errors in Vue's optimized block reconciliation.
const runtime=require('./vue-runtime-fixture.cjs')(common);
let render;const constants=[];
traverse(babelParse(main,'main.mjs',true),{ArrowFunctionExpression(p){const t=main.slice(p.node.start,p.node.end);if(t.startsWith('(o,l)=>')&&t.includes('"data-room-cat-id":o.id')&&t.length<6000)render=t},VariableDeclarator(p){if(['by','_y','ky','Cy','Sy','Ay','Ry'].includes(p.node.id.name))constants.push('const '+main.slice(p.node.start,p.node.end)+';')}});
assert(render);const output=process.env.WUWA_TEST_DISTRIBUTION_DIR||'dist/room-visibility-fix-1.0.3.4';fs.mkdirSync(output,{recursive:true});
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});try{
 const page=await browser.newPage({viewport:{width:500,height:400}}),errors=[];page.on('pageerror',e=>errors.push(e.message));let downloads=0;
 await page.route('http://room.test/**',r=>{if(r.request().url().includes('/sprite')){downloads++;return r.fulfill({contentType:'image/png',headers:{'Cache-Control':'no-store'},body:fs.readFileSync('patches/share-fixtures/character_skin.png')})}return r.fulfill({contentType:'text/html',body:'<style>.room-cat-shell{width:200px;height:211px}.room-cat-shell--ui-hidden{opacity:0}</style><div id="app"></div>'})});
 await page.goto('http://room.test/');await page.addScriptTag({content:'(()=>{'+runtime+'})()'});
 await page.addScriptTag({content:`const {createApp,ref,nextTick,openBlock:Ce,createElementBlock:qe,createBaseVNode:Se,createBlock:tr,Fragment:dr,renderList:pr,normalizeClass:sn,normalizeStyle:jt,createCommentVNode:Yt,toDisplayString$1:Hs}=__vue;
 const hidden=ref(false),ready=ref(true),version=ref(1),members=ref([{id:2,nickname:'测试成员',partOffsetX:0,partOffsetY:0}]);const Pt=ref(null),Ir=ref(null),ut=new Set([2]);
 const no=()=>hidden.value,vl=()=>ready.value,au={render:()=>Se('span',{class:'test-loading'},'loading')},Dd=()=>({left:'20px',top:'20px'}),pl=()=>'/sprite-head.png?v='+version.value,hl=()=>'/sprite-body.png?v='+version.value,ml=()=>'/sprite-part.png?v='+version.value,Ld=()=>[],Bd=()=>({});
 ${constants.join('\n')}
 const roomRender=${render};window.hidden=hidden;window.ready=ready;window.version=version;window.members=members;window.tick=nextTick;
 const app=createApp({render:()=>(Ce(),qe('main',null,[(Ce(true),qe(dr,null,pr(members.value,roomRender),128))]))});window.roomApp=app;app.config.errorHandler=e=>window.__renderErrors.push(e.message);window.__renderErrors=[];app.mount('#app');`});
 assert.deepEqual(errors,[]);assert.deepEqual(await page.evaluate(()=>__renderErrors),[]);
 await page.waitForFunction(()=>document.querySelectorAll('.room-cat-shell img').length===3&&[...document.querySelectorAll('.room-cat-shell img')].every(i=>i.complete&&i.naturalWidth>0));
 for(let i=0;i<5;i++){
  await page.evaluate(async()=>{hidden.value=true;ready.value=false;await tick()});assert.equal(await page.locator('.room-cat-shell img').count(),0,'Hide must really unmount the images');
  await page.evaluate(async()=>{version.value++;hidden.value=false;await tick()});
  await page.waitForFunction(()=>document.querySelectorAll('.room-cat-shell img').length===3&&[...document.querySelectorAll('.room-cat-shell img')].every(i=>i.complete&&i.naturalWidth>0));
  await page.evaluate(async()=>{ready.value=true;await tick()});assert.equal(await page.locator('.test-loading').count(),0,'Loaded sprites replace the pending component');
 }
 await page.evaluate(async()=>{hidden.value=true;await tick();members.value=[];await tick();members.value=[{id:3,nickname:'重新加入的成员',partOffsetX:0,partOffsetY:0}];ut.add(3);await tick();hidden.value=false;await tick()});
 await page.waitForFunction(()=>document.querySelector('[data-room-cat-id="3"] img')?.naturalWidth>0);
 assert.deepEqual(await page.evaluate(()=>__renderErrors),[]);assert.deepEqual(errors,[]);assert(downloads>=18,'Restore must request new image URLs and load them successfully');
 await page.screenshot({path:path.join(output,'room-restore-preview.png')});console.log('PASS: exact bundled Vue renderer unmounts hidden images and reloads after five show/hide cycles and a member rejoin');
 if(main.includes('__wtSavedRoomPositions')){
  const positions={};traverse(babelParse(main,'main.mjs',true),{FunctionDeclaration(p){if(['Li','en','vt','Bi','Fd','Mr','Dd','__wtSaveRoomPosition','__wtRestoreRoomPosition'].includes(p.node.id.name))positions[p.node.id.name]=main.slice(p.node.start,p.node.end)}});assert.equal(Object.keys(positions).length,9);
  await page.evaluate(()=>{roomApp.unmount();document.body.insertAdjacentHTML('beforeend','<style>.room-cat-shell{position:absolute}.room-cat-pet{position:relative;height:180px}.room-cat-pet>img{position:absolute;inset:0;width:160px;height:160px}</style><div id="position-app"></div>');localStorage.removeItem('wuwatappo-room-positions-v1')});
  await page.addScriptTag({content:`window.makePositionScene=()=>{const {shallowRef:nv}=__vue;
   ${fs.readFileSync('patches/room-positions-core.js','utf8').replace('export {__wtRoomPositions};','')}
   const __wtSavedRoomPositions=__wtRoomPositions.create(),R={isLoggedIn:true,userInfo:{id:1}},Vo=ref('room'),ut=new Set(),Mt=new Set([4]),Di=new Map(),Lt=ref(true),Pt=ref(null),Ir=ref(null),Er=ref(null),Oo=ref(null),ft=200,Pn=211,c=100;
   const yn=()=>({left:0,top:0,right:0,bottom:0}),ba=()=>null,ce={value:{querySelector:()=>({getBoundingClientRect:()=>({left:20,top:20,width:200})})}},no=()=>false,vl=()=>true,au={},pl=()=>'/sprite-head.png',hl=()=>'/sprite-body.png',ml=()=>'/sprite-part.png',Ld=()=>[],Bd=()=>({});
   ${Object.values(positions).join('\n')}
   const pet={id:4,nickname:'位置记忆测试',partOffsetX:0,partOffsetY:0,left:0,top:0};if(!__wtSavedRoomPositions.get(1,'room',4,innerWidth,innerHeight))__wtSavedRoomPositions.put(1,'room',4,140,70,innerWidth,innerHeight);Fd(pet);
   const actualRender=${render};const app=createApp({render:()=>(Ce(),qe('main',null,[(Ce(true),qe(dr,null,pr([pet],actualRender),128))]))});app.config.errorHandler=e=>__renderErrors.push(e.message);app.mount('#position-app');return{app,move(x,y){pet.left=x;pet.top=y;vt(pet,{left:x,top:y})}};
  };window.positionScene=makePositionScene();`});
  assert.equal(await page.locator('[data-room-cat-id="4"]').evaluate(n=>n.style.left),'140px');
  await page.evaluate(async()=>{positionScene.move(190,100);await tick()});assert.equal(await page.locator('[data-room-cat-id="4"]').evaluate(n=>n.style.top),'100px');
  await page.evaluate(async()=>{positionScene.app.unmount();positionScene=makePositionScene();await tick()});assert.equal(await page.locator('[data-room-cat-id="4"]').evaluate(n=>n.style.left),'190px');assert.equal(await page.locator('[data-room-cat-id="4"]').evaluate(n=>n.style.top),'100px');
  await page.screenshot({path:path.join(output,'room-position-restore-preview.png')});assert.deepEqual(await page.evaluate(()=>__renderErrors),[]);assert.deepEqual(errors,[]);console.log('PASS: production position restore and update render at saved CSS coordinates in bundled Vue across a fresh scene');
 }
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
