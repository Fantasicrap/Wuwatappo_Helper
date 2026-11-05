const {fixturePath}=require('./upstream-fixtures.cjs');
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const {chromium}=require('playwright'),{babelParse,traverse}=require('playwright/lib/transform/babelBundle');
const output=process.env.WUWA_TEST_DISTRIBUTION_DIR||'dist/idle-optimized-1.0.3.4';fs.mkdirSync(output,{recursive:true});
// Exercise the unchanged official action/count path while Helper mapping is off.
const source=fs.readFileSync(fixturePath('dist/migration-1.0.3.4/index-pp8VWaUF.js'),'utf8'),fns={};
traverse(babelParse(source,'main.mjs',true),{FunctionDeclaration(p){if(['Uc','Vc'].includes(p.node.id.name))fns[p.node.id.name]=source.slice(p.node.start,p.node.end)}});
let claps=0,counts=0,releases=0;
const c={__wtKeysConnected:false,__wtKeyboard:{key:()=>{}},__wtAutoEmote:{down:()=>false},__wtPerformHelperAction:()=>{},__wtHotkeys:{nativeDown:()=>null,nativeUp:()=>{}},qr:new Set(),va:new Set(),Fo:false,Wa:false,Bs:()=>false,Ie:()=>false,se:{value:''},Yo:()=>{claps++},Wl:()=>{releases++},R:{incrementLocalClickCount:()=>counts++},nn:null,A:{value:3}};
c.__wtThrust={down(){},up(){}};c.__wtFun={input(){},rawKey:()=>false};vm.createContext(c);vm.runInContext(fns.Uc+';'+fns.Vc+';Uc("Q");Uc("Q");Vc("Q");',c);
assert.equal(claps,1);assert.equal(counts,1);assert.equal(releases,1);assert.equal(c.A.value,1);
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 try{
 const context=await browser.newContext({viewport:{width:500,height:850}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const css=fs.readFileSync(fixturePath('dist/upstream-1.0.3/index-C3fG-hsi.css'),'utf8');
 const sprite=name=>'data:image/png;base64,'+fs.readFileSync('dist/accessory-motion-fixtures/role_1608_1003/'+name+'.png').toString('base64');
 assert.notEqual(sprite('body1'),sprite('body2'));
 assert.notEqual(sprite('body2'),sprite('body3'));
 await page.route('http://tauri.localhost/',r=>r.fulfill({contentType:'text/html',body:`<meta charset="utf-8"><style>${css}
 body{padding:50px;background:#f5f7f5}.pet-dock-content{width:200px;transform-origin:top left}.pet-info{border-radius:24px;background:#fff8e9;color:#8e5e43}</style>
 <div class="pet-dock-content"><div class="cat-wrap"><div class="cat-stack"><img class="cat cat-stack__face" src="${sprite('head1')}"><img class="cat cat-stack__base" src="${sprite('body1')}" data-left="${sprite('body2')}" data-right="${sprite('body3')}"></div></div><div class="pet-info-container"><div class="pet-info"><span class="text">1234</span></div></div></div>`}));
 await page.route('http://127.0.0.1:48642/ui.js',r=>r.fulfill({contentType:'text/javascript',headers:{'Access-Control-Allow-Origin':'*'},body:fs.readFileSync('patches/controller-core.js','utf8')+'\n'+fs.readFileSync('patches/controller-ui.js','utf8')}));
 await page.goto('http://tauri.localhost/');
 await page.evaluate(()=>{
 localStorage.setItem('wuwatappo-keyboard-ui-v1','hidden');window.live=true;window.events=new Map();window.reads={mouse:0,pad:0};window.intervals=new Set();
 window.padFrames=[];window.padSeq=0;window.padMs=100;window.feedPad=(pressed=false)=>padFrames.push({seq:++padSeq,ms:padMs+=4,devices:[{id:1,generation:1,key:'test-pad',name:'Synthetic Pad',mapping:'standard',layout:'xbox',vendor:1,product:1,buttons:Array.from({length:26},(_,i)=>i===0&&pressed),axes:[0,0,0,0,0,0],hats:[]}]});
 const si=window.setInterval,ci=window.clearInterval;window.setInterval=(...a)=>{const id=si(...a);intervals.add(id);return id};window.clearInterval=id=>{intervals.delete(id);ci(id)};
 const fetchOriginal=window.fetch;window.fetch=async(url,...args)=>{if(String(url).includes('/mouse?')){reads.mouse++;return{ok:true,json:async()=>({seq:0,available:true,keyboardAvailable:true,events:[]})}}if(String(url).includes('/state?')){reads.pad++;return{ok:true,json:async()=>({protocol:1,seq:padSeq,ms:padMs,frames:padFrames.splice(0)})}}return fetchOriginal(url,...args)};
 window.emit=async()=>{};
 });
 for(const file of ['patches/input-recorder.js','patches/keyboard-ui.js','patches/v103/mouse-feed.js'])await page.addScriptTag({content:fs.readFileSync(file,'utf8').replace(/export \{[^}]+\};?/g,'')});
 await page.addScriptTag({content:'var __wtKeyboard=__wtKeyboardUi.create({visible:()=>live,activity:__wtSyncMouseFeed,listen:async(n,fn)=>{events.set(n,fn);return()=>events.delete(n)},hotkeys:{read:()=>({record:"Ctrl+Alt+F10"}),editable:()=>false}});window.demo=__wtKeyboard;window.ready=demo.mount();'});
 await page.evaluate(()=>ready);await page.waitForTimeout(120);
 const dock=page.locator('.pet-dock-content');
 for(const scale of [.5,1,2]){
  await dock.evaluate(async(node,scale)=>{node.style.transform='scale('+scale+')';const body=node.querySelector('.cat-stack__base');body.src=body.dataset.left;await body.decode()},scale);
  const layout=await dock.evaluate(node=>{
   const cat=node.querySelector('.cat-stack'),counter=node.querySelector('.pet-info-container');
   return {sprite:Number(getComputedStyle(cat).zIndex),counter:Number(getComputedStyle(counter).zIndex),
    overlap:cat.getBoundingClientRect().bottom-counter.getBoundingClientRect().top};
  });
  assert(layout.overlap>0&&layout.sprite>layout.counter,'Overlapping counter stays behind the pressed character');
  if(scale===1){
   await dock.screenshot({path:path.join(output,'counter-paw-left-preview.png')});
   await dock.evaluate(async node=>{const body=node.querySelector('.cat-stack__base');body.src=body.dataset.right;await body.decode()});
   await dock.screenshot({path:path.join(output,'counter-paw-right-preview.png')});
  }
 }
 await dock.evaluate(node=>{node.style.transform=''});
 assert.deepEqual(await page.evaluate(()=>reads),{mouse:0,pad:0});assert.equal(await page.evaluate(()=>intervals.size),0);
 await page.evaluate(()=>demo.setMode('letters'));await page.waitForTimeout(120);assert((await page.evaluate(()=>reads.mouse))>1);assert.equal(await page.evaluate(()=>intervals.size),0,'Idle display does not run the status ticker');
 await page.evaluate(()=>{demo.key('Q',true);demo.key('Q',true)});assert.equal(await page.locator('kbd.wt-key-on').count(),1);await page.evaluate(()=>demo.key('Q',false));await page.waitForTimeout(100);assert.equal(await page.locator('kbd.wt-key-on').count(),0);
 await page.evaluate(()=>demo.setMode('hidden'));const before=await page.evaluate(()=>reads.mouse);await page.waitForTimeout(130);assert.equal(await page.evaluate(()=>reads.mouse),before);
 await page.evaluate(()=>{demo.toggle();demo.key('Q',true)});assert.equal(await page.evaluate(()=>demo.recording),true);assert.equal(await page.evaluate(()=>intervals.size),1);await page.evaluate(()=>demo.key('Q',false));await page.evaluate(()=>demo.toggle());assert.equal(await page.evaluate(()=>intervals.size),0);assert((await page.evaluate(()=>demo.last.events.length))>=2);
 await page.evaluate(()=>{live=false;demo.syncActivity()});const paused=await page.evaluate(()=>reads.mouse);await page.waitForTimeout(120);assert.equal(await page.evaluate(()=>reads.mouse),paused);await page.evaluate(()=>{live=true;demo.syncActivity()});await page.waitForTimeout(100);assert((await page.evaluate(()=>reads.mouse))>paused);
 await page.evaluate(()=>{feedPad();demo.setMode('controller')});await page.waitForFunction(()=>document.querySelector('.wt-pad'));await page.waitForTimeout(100);const keyboardStopped=await page.evaluate(()=>reads.mouse);assert((await page.evaluate(()=>reads.pad))>0);await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>reads.mouse),keyboardStopped);
 await page.evaluate(()=>demo.toggle());assert(await page.evaluate(()=>demo.recording));await page.evaluate(()=>{feedPad(true);feedPad(false)});await page.waitForTimeout(100);await page.evaluate(()=>demo.toggle());assert.equal(await page.getByRole('link',{name:'导出手柄 TXT'}).count(),1);
 const downloadEvent=page.waitForEvent('download');await page.getByRole('link',{name:'导出手柄 TXT'}).click();const download=await downloadEvent;const txt=path.join(output,'idle-controller-recording.txt');await download.saveAs(txt);const contents=fs.readFileSync(txt,'utf8');assert(contents.includes('按下')&&contents.includes('松开'));
 await page.evaluate(()=>{live=false;demo.syncActivity()});const padStopped=await page.evaluate(()=>reads.pad);await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>reads.pad),padStopped,'Hidden controller has no polling timer');await page.evaluate(()=>{live=true;demo.syncActivity()});await page.waitForTimeout(100);assert((await page.evaluate(()=>reads.pad))>padStopped);
 await page.evaluate(()=>demo.setMode('letters'));const stoppedPad=await page.evaluate(()=>reads.pad);await page.waitForTimeout(120);assert.equal(await page.evaluate(()=>reads.pad),stoppedPad);
 await page.locator('.pet-dock-content').screenshot({path:path.join(output,'idle-mapping-preview.png')});
 await page.evaluate(()=>events.get('wt-keyboard-config')({payload:{bubbles:true,mode:'controller'}}));
 assert.equal(await page.locator('.wt-pad,.wt-keyboard-plate').count(),0);
 assert(await page.locator('#wt-input-keyboard').isHidden());
 await page.evaluate(()=>{demo.key('Q',true);demo.key('Q',false)});
 assert.equal(await page.locator('.wt-input-bubble').textContent(),'Q');
 await page.evaluate(()=>{demo.mouse('right','press');demo.mouse('right','release')});
 assert.equal(await page.locator('.wt-input-bubble').textContent(),'鼠标右键');
 for(const scale of [.5,1,2]){
  const layout=await dock.evaluate((node,scale)=>{
   node.style.transform='scale('+scale+')';
   const host=node.querySelector('.cat-stack').getBoundingClientRect();
   const bubble=node.querySelector('.wt-input-bubble'),box=bubble.getBoundingClientRect();
   return {x:(box.left+box.width/2-host.left)/host.width,y:(box.top+box.height/2-host.top)/host.height,
    font:parseFloat(getComputedStyle(bubble).fontSize),withinLeft:box.left>=host.left&&box.right<host.left+host.width/2};
  },scale);
  assert(Math.abs(layout.x-.22)<.01&&Math.abs(layout.y-.43)<.01&&layout.font>=15&&layout.withinLeft,JSON.stringify(layout));
 }
 await dock.evaluate(node=>{node.style.transform=''});
 await page.evaluate(()=>{demo.controllerInput('×');const speech=document.createElement('div');speech.className='wt-phrolova-speech';speech.textContent='自定义台词';speech.style.cssText='position:absolute;left:2%;top:6%;box-sizing:border-box;background:#fffdf6;border:1px solid #b18e75;border-radius:20px;padding:4px 8px';document.querySelector('.cat-stack').append(speech)});
 assert.equal(await page.locator('.wt-input-bubble').textContent(),'手柄 ×');
 const pair=await page.locator('.cat-stack').evaluate(node=>{
  const host=node.getBoundingClientRect(),left=node.querySelector('.wt-input-bubble').getBoundingClientRect(),right=node.querySelector('.wt-phrolova-speech').getBoundingClientRect();
  return {left:left.right-host.left,right:right.left-host.left,center:host.width/2};
 });
 assert(pair.left<pair.center&&pair.right>pair.center,'Mapping and i弗TV bubbles use separate halves: '+JSON.stringify(pair));
 await dock.screenshot({path:path.join(output,'input-bubble-preview.png')});
 await page.getByRole('button',{name:'关闭输入气泡',exact:true}).click();
 assert.equal(await page.locator('.wt-input-bubble').count(),0);
 assert(await page.getByRole('button',{name:'开启输入气泡',exact:true}).isVisible());
 await page.evaluate(()=>{document.querySelector('.wt-phrolova-speech').remove();events.get('wt-keyboard-config')({payload:{bubbles:false,mode:'letters'}})});
 assert.equal(await page.locator('.wt-input-bubble').count(),0);
 assert.equal(await page.locator('.wt-keyboard-plate').count(),1);
 await page.evaluate(()=>{__wtStopMouseFeed();demo.dispose()});assert.equal(await page.evaluate(()=>intervals.size),0);assert.equal(await page.evaluate(()=>events.size),0);assert.deepEqual(errors,[]);
 await page.evaluate(async()=>{window.stops=0;const pending=__wtKeyboardUi.create({listen:()=>new Promise(resolve=>window.resolveStop=resolve)});const mounted=pending.mount();pending.dispose();resolveStop(()=>stops++);await mounted});assert.equal(await page.evaluate(()=>stops),1,'A delayed listener subscription is cleaned after disposal');
 console.log('PASS: mapping-off zero fetches/tickers; raw feed mode/visibility gating; recording/export; controller suspension/resume/disposal; official clap/release/count preserved (synthetic)');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
