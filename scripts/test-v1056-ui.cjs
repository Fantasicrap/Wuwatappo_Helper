// Comprehensive v1.0.5.6 Playwright UI + 4-theme + ZH/EN visual verification suite.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {babelParse,traverse}=require('playwright/lib/transform/babelBundle');
const {fixturePath,target}=require('./upstream-fixtures.cjs');

const root=path.resolve(__dirname,'..');
const out=path.join(root,'dist/v1056-ui-checks');
fs.mkdirSync(out,{recursive:true});

const common=fs.readFileSync(fixturePath('dist/migration-1.0.3.4/index-CuzHFfJW.js'),'utf8');
const runtime=require('./vue-runtime-fixture.cjs')(common,['createVNode','ref']);
const controllerUiPath=path.join(process.env.WUWA_TEST_DISTRIBUTION_DIR||path.join(root,'dist/local-'+target),'host-build/controller-ui.js');
assert(fs.existsSync(controllerUiPath),'Built controller-ui.js is required: '+controllerUiPath);
const controllerUi=fs.readFileSync(controllerUiPath,'utf8');
const upstreamCss=fs.readFileSync(fixturePath('dist/upstream-1.0.3/index-C3fG-hsi.css'),'utf8');

const wanted=['__wtLocale','__wtPanelLayout','__wtTheme','__wtInputRecorder','__wtKeyboardUi','__wtSnowfluffPlayer','__wtInventoryShare','__wtLocalWardrobe','__wtPostcard','__wtRoomHistoryCore'];
const modules=new Map();
traverse(babelParse(common,'common.mjs',true),{
 FunctionDeclaration(p){if(p.node.id?.name==='__wtPlayerHit')modules.set('__wtPlayerHit',common.slice(p.node.start,p.node.end))},
 VariableDeclaration(p){
  for(const {id} of p.node.declarations)if(wanted.includes(id.name))modules.set(id.name,common.slice(p.node.start,p.node.end));
 }
});
for(const name of wanted)assert(modules.has(name),'Missing module in packaged common chunk: '+name);

async function main(){
 const browser=await chromium.launch({headless:true,executablePath:process.env.WUWA_TEST_BROWSER||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 try{
  const context=await browser.newContext({viewport:{width:460,height:960},deviceScaleFactor:2});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',err=>errors.push(err.message));

  let installedPacks={
   aemeath:{revision:'1',effects:['player'],credit:'Aemeath Demo Pack',songs:[{name:'星光序曲',artist:'Test',url:'http://127.0.0.1:48642/music/track/0'}]},
   denia:{revision:'1',effects:['blocks'],credit:'Denia Demo Pack'},
   phrolova:{revision:'1',effects:['phrolova'],credit:'Phrolova Demo Pack'}
  };
  let downloadState={state:'idle',id:'',message:'',downloadedBytes:0,totalBytes:0,progress:-1};
  let musicState={hasFolder:true,folder:'C:\\Music\\Wuwa',tracks:[{id:0,name:'01 鸣潮主题曲',url:'http://127.0.0.1:48642/music/track/0'},{id:1,name:'02 今州夜色',url:'http://127.0.0.1:48642/music/track/1'}]};
  let updateState={state:'downloading',message:'正在从 GitHub 下载 Helper v1.0.5.7…',downloadSource:'github',downloadedBytes:36700160,totalBytes:69206016,progress:53};

  const headers={'Access-Control-Allow-Origin':'http://tauri.localhost','Access-Control-Allow-Headers':'X-Wuwa-Action, X-Wuwa-Update','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Private-Network':'true'};
  await context.route('http://tauri.localhost/',route=>route.fulfill({
   contentType:'text/html; charset=utf-8',
   body:`<!doctype html><meta charset="utf-8"><style>
    body{margin:0;background:var(--wt-ui-rail,#e8cfa8);font:14px "Microsoft YaHei",sans-serif;color:var(--wt-ui-text,#694832)}
    .wt-test-shell{position:relative;margin:10px auto;width:min(420px,calc(100vw - 20px));padding:12px;border-radius:18px;box-sizing:border-box;overflow:hidden;border:1.5px solid var(--wt-ui-border,#dec6a6);background:var(--wt-ui-field,#fff8e9)}
    .wt-test-shell>.module-content__bg{position:absolute;inset:0;pointer-events:none;z-index:0}
    .section-stack{position:relative;z-index:2;display:grid;gap:10px}
    .pet-stage{position:relative;margin:10px auto;width:420px;min-height:290px;padding:12px;box-sizing:border-box;border-radius:18px;background:var(--wt-ui-card-fill,#fff9ed);border:1.5px solid var(--wt-ui-border,#dec6a6);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px}
    .pet-dock-content{position:relative;display:flex;flex-direction:column;align-items:center;padding-top:34px}
    .cat-stack{width:120px;height:80px;border-radius:16px;background:var(--wt-ui-surface,#fffdf7);border:1px dashed var(--wt-ui-border,#dec6a6);display:grid;place-items:center;font-size:12px;color:var(--wt-ui-muted,#8b6e58)}
    .pet-info-container{position:relative;display:flex;align-items:center;gap:4px;margin-top:8px}
    .pet-info{background:var(--wt-ui-surface,#fffdf7);border:1px solid var(--wt-ui-border,#dec6a6);border-radius:14px;padding:3px 10px}
    .pet-toolbar{position:relative;width:44px;height:28px;border-radius:12px;background:var(--wt-ui-hover,#f4e4c9);border:1px solid var(--wt-ui-border,#dec6a6)}
   </style>
   <div class="wt-test-shell"><div class="module-content__bg"></div><div class="section-stack">
    <div class="wt-ui-card wt-theme-picker" id="theme-card"></div>
    <div class="wt-ui-card" id="wuwa-card"></div>
    <div class="wt-ui-card" id="update-card"><div id="wt-us"></div></div>
    <div id="wardrobe-card"></div>
   </div></div>
   <div class="pet-stage">
    <div class="pet-dock-content" id="pet-dock">
     <div class="cat-stack">Desktop Pet</div>
     <div class="pet-info-container"><div class="pet-info"><span class="text">12,345</span></div><div class="pet-toolbar"><button class="settings-btn" type="button" hidden></button></div></div>
    </div>
   </div>`
  }));

  await context.route('http://127.0.0.1:48642/**',route=>{
   const req=route.request(),url=new URL(req.url());
   if(req.method()==='OPTIONS')return route.fulfill({headers,status:204});
   if(url.pathname==='/ui.js')return route.fulfill({headers,contentType:'text/javascript; charset=utf-8',body:controllerUi});
   if(url.pathname==='/theme-packs')return route.fulfill({headers,json:installedPacks});
   if(url.pathname.startsWith('/theme-packs/remove/')){
    const id=url.pathname.split('/').pop();
    delete installedPacks[id];
    return route.fulfill({headers,json:{removed:true,id}});
   }
   if(url.pathname.startsWith('/theme-packs/download/')){
    const id=url.pathname.split('/').pop();
    downloadState={state:'downloading',id,message:'正在下载主题包…',downloadedBytes:8388608,totalBytes:17995154,progress:47};
    return route.fulfill({headers,json:{accepted:true,id}});
   }
   if(url.pathname==='/theme-packs/download-status')return route.fulfill({headers,json:downloadState});
   if(url.pathname==='/music/list')return route.fulfill({headers,json:musicState});
   if(url.pathname==='/music/pick'){
    musicState={hasFolder:true,folder:'D:\\OST',tracks:[{id:0,name:'鸣潮 · 拂晓',url:'http://127.0.0.1:48642/music/track/0'},{id:1,name:'黑海岸序曲',url:'http://127.0.0.1:48642/music/track/1'}]};
    return route.fulfill({headers,json:musicState});
   }
   if(url.pathname==='/music/clear'){
    musicState={hasFolder:false,folder:'',tracks:[]};
    return route.fulfill({headers,json:{cleared:true}});
   }
   if(url.pathname==='/update/status')return route.fulfill({headers,json:updateState});
   if(url.pathname.startsWith('/update/source/'))return route.fulfill({headers,json:{accepted:true}});
   if(url.pathname==='/player-scroll')return route.fulfill({headers,json:{available:false,seq:0,events:[]}});
   return route.fulfill({headers,status:404,json:{error:'not found'}});
  });

  await page.goto('http://tauri.localhost/');
  await page.addStyleTag({content:upstreamCss});
  await page.addScriptTag({content:'(()=>{'+runtime+'})()'});
  await page.addScriptTag({content:`
   window.emit=async()=>{};window.listen=async()=>()=>{};
   const listeners=new Map();
   window.__wtBusEmit=async(name,payload)=>{for(const fn of listeners.get(name)||[])fn({payload})};
   window.__wtBusListen=async(name,fn)=>{if(!listeners.has(name))listeners.set(name,new Set());listeners.get(name).add(fn);return ()=>listeners.get(name)?.delete(fn)};
   window.emit=window.__wtBusEmit;window.listen=window.__wtBusListen;
   ${[...modules.values()].join('\n')}
   window.__wtTranslate=value=>__wtLocale.translate(value);
   window.__wtSetLang=__wtLocale.install(document,'zh');
  `});

  // Mount Theme picker, Wuwa custom 9-key editor + desktop board, Update progress + Backup card, Postcard settings, Snowfluff player, Room history
  await page.evaluate(async()=>{
   const {createApp,createVNode:h,ref}=__vue;
   __wtTheme.mount(document.getElementById('theme-card'));
   const kbModel=__wtKeyboardUi.settings(ref,()=>{});
   kbModel.mode.value='wuwa';
   localStorage.setItem('wuwatappo-keyboard-ui-v1','wuwa');
   createApp({render:()=>__wtKeyboardUi.renderSettings(h,kbModel)}).mount('#wuwa-card');
   window.__kbBoard=__wtKeyboardUi.create({document,listen:window.__wtBusListen});
   await window.__kbBoard.mount();

   const uiMod=await import('http://127.0.0.1:48642/ui.js');
   window.__uiMod=uiMod;
   window.__updateHandle=uiMod.mountHelperUpdate(()=>{},()=>{});

   const makeSprite=(c1,c2)=>{const c=document.createElement('canvas');c.width=180;c.height=180;const x=c.getContext('2d');const g=x.createLinearGradient(0,0,180,180);g.addColorStop(0,c1);g.addColorStop(1,c2);x.fillStyle=g;x.beginPath();x.roundRect(14,14,152,152,28);x.fill();x.fillStyle='#ffffffcc';x.beginPath();x.arc(90,76,34,0,Math.PI*2);x.fill();x.fillRect(54,118,72,22);return c.toDataURL()};
   window.__demoRole={name:'爱弥斯 · 星光礼装',url:makeSprite('#f7a5c3','#7fdcea')};
   window.__demoAcc={name:'星海蝴蝶结',url:makeSprite('#fed291','#c98d55')};
   const wardModel=__wtLocalWardrobe.settings(ref,()=>{},()=>({props:{},user:{id:7,total_click_count:52013}}));
   createApp({render:()=>__wtLocalWardrobe.renderSettings(h,wardModel)}).mount('#wardrobe-card');

   const rooms=__wtRoomHistoryCore.create();
   rooms.remember(7,'881024');rooms.remember(7,'992048');rooms.remember(7,'773311');
   rooms.annotate(7,'881024',{note:'周五联机小队',pinned:true});
   rooms.annotate(7,'992048',{note:'深塔挂机房'});
   window.__openRooms=()=>uiMod.openRoomHistory({state:()=>({accountId:7,mode:'in_room',roomId:'881024'}),listen:async()=>()=>{},send:async()=>{}});
  });

  // Wait for theme packs & update progress to settle
  await page.locator('.wt-update-progress').waitFor({state:'visible'});
  assert((await page.locator('[data-wt-up-pct]').innerText()).includes('53%'));
  await page.locator('.wt-backup-card').waitFor({state:'visible'});

  // Open custom 9-key editor and bind slot 0 -> Shift, slot 7 -> MouseX1, slot 8 -> MouseMiddle
  await page.getByText('自定义鸣潮专属键位',{exact:true}).click();
  const slots=page.locator('.wt-wuwa-slot');
  assert.equal(await slots.count(),9);
  await slots.nth(0).click();
  await page.keyboard.press('ShiftLeft');
  await page.getByText('已更新槽位为 Shift').waitFor();
  await slots.nth(7).click();
  await page.locator('#wuwa-card').getByRole('button',{name:'侧键1',exact:true}).click();
  await slots.nth(8).click();
  await page.locator('#wuwa-card').getByRole('button',{name:'中键',exact:true}).click();

  // Verify desktop Wuwa mini-board updated live to Shift, 侧键1, 中键 without text overflow/clipping
  await page.locator('#wt-input-keyboard kbd[data-wt-key="Shift"]').waitFor();
  await page.locator('#wt-input-keyboard kbd[data-wt-key="MouseX1"]').waitFor();
  await page.locator('#wt-input-keyboard kbd[data-wt-key="MouseMiddle"]').waitFor();
  const keycapOverflow=await page.locator('#wt-input-keyboard .wt-qer-board kbd').evaluateAll(nodes=>nodes.filter(n=>n.scrollWidth>n.clientWidth+2||n.scrollHeight>n.clientHeight+2).map(n=>n.textContent));
  assert.deepEqual(keycapOverflow,[],'Custom 9-key keycaps must not clip');

  // Verify recording + APM summary + Copy summary button on desktop board
  await page.evaluate(()=>{
   window.__kbBoard.toggle();
   for(const k of ['Shift','Q','E','MouseX1','MouseMiddle']){window.__kbBoard.key(k,true);window.__kbBoard.key(k,false)}
  });
  await page.waitForTimeout(550);
  await page.evaluate(()=>window.__kbBoard.stopRecording('user'));
  await page.locator('#wt-input-keyboard .wt-export-controls button',{hasText:'复制摘要'}).waitFor();

  // Test Backup export & import security directly via controller-ui exports
  const backupOk=await page.evaluate(()=>{
   localStorage.setItem('wuwatappo-login-cuid','secret-token');
   const snap=window.__uiMod.exportHelperBackup(localStorage);
   return !('wuwatappo-login-cuid' in snap.entries) && 'wuwatappo-wuwa-keys-v1' in snap.entries;
  });
  assert.equal(backupOk,true,'Backup must include custom 9-key config and exclude login credentials');

  // Capture ALL 4 themes for Settings + Desktop Wuwa Board + Room History + Postcards
  for(const themeId of ['default','aemeath','denia','phrolova']){
   await page.locator(`[data-wt-theme-option="${themeId}"]`).click();
   if(themeId==='default')await page.waitForFunction(()=>!document.documentElement.hasAttribute('data-wt-theme'));
   else await page.waitForFunction(id=>document.documentElement.dataset.wtTheme===id,themeId);
   await page.waitForTimeout(180);

   // Verify 320px responsive bounds on each theme
   await page.setViewportSize({width:320,height:960});
   const overflow320=await page.locator('.wt-test-shell button:visible, .wt-test-shell input:visible, .wt-test-shell select:visible').evaluateAll(nodes=>nodes.filter(n=>{const r=n.getBoundingClientRect();return r.left<0||r.right>innerWidth+1}).map(n=>n.textContent||n.tagName));
   assert.deepEqual(overflow320,[],`Settings overflow at 320px on theme ${themeId}`);
   await page.setViewportSize({width:460,height:960});

   await page.locator('.wt-test-shell').screenshot({path:path.join(out,`settings-${themeId}-zh.png`)});
   await page.locator('#update-card').screenshot({path:path.join(out,`update-backup-${themeId}-zh.png`)});
   await page.locator('.pet-stage').screenshot({path:path.join(out,`wuwa-board-${themeId}.png`)});

   // Open room history modal and capture themed screenshot
   await page.evaluate(()=>window.__openRooms());
   await page.locator('.wt-history-card').waitFor({state:'visible'});
   await page.locator('.wt-history-card').screenshot({path:path.join(out,`rooms-${themeId}-zh.png`)});
   await page.locator('.wt-history-close').click();

   // Generate 4-theme postcard PNG with 2-line wrapped caption + stamp
   const postcardData=await page.evaluate(async id=>{
    const load=src=>new Promise((res,rej)=>{const img=new Image();img.onload=()=>res(img);img.onerror=rej;img.src=src});
    const [rImg,aImg]=await Promise.all([load(window.__demoRole.url),load(window.__demoAcc.url)]);
    const canvas=document.createElement('canvas');
    __wtPostcard.draw(canvas,{name:window.__demoRole.name,img:rImg},{name:window.__demoAcc.name,img:aImg},'今天也在索拉里斯和桌宠一起听歌，长寄语自动换两行排版展示',false,id,{stamp:{date:'2026.11.27',clicks:52013}});
    return canvas.toDataURL('image/png').split(',')[1];
   },themeId);
   fs.writeFileSync(path.join(out,`postcard-${themeId}.png`),Buffer.from(postcardData,'base64'));
  }

  // Test Room History Search, Copy, Delete + English mode (verify data-wt-user-text preserves Chinese note!)
  await page.locator('[data-wt-theme-option="aemeath"]').click();
  await page.waitForFunction(()=>document.documentElement.dataset.wtTheme==='aemeath');
  await page.evaluate(()=>window.__wtSetLang('en'));
  await page.waitForTimeout(150);
  await page.locator('.wt-test-shell').screenshot({path:path.join(out,'settings-aemeath-en.png')});

  await page.evaluate(()=>window.__openRooms());
  await page.locator('.wt-history-card').waitFor({state:'visible'});
  assert.equal(await page.locator('.wt-history-title').innerText(),'Room history');
  assert.equal(await page.locator('[data-room="881024"] .wt-history-pin-badge').innerText(),'Pinned');
  // CRITICAL: user note must stay untouched Chinese in English mode!
  assert.equal(await page.locator('[data-room="881024"] .wt-history-id').innerText(),'周五联机小队');
  await page.locator('.wt-history-card').screenshot({path:path.join(out,'rooms-aemeath-en.png')});
  await page.locator('.wt-history-search').fill('深塔');
  assert.equal(await page.locator('.wt-history-row').count(),1);
  await page.locator('.wt-history-search').fill('');
  assert.equal(await page.locator('.wt-history-row').count(),3);
  await page.locator('[data-room="773311"] [data-action="delete"]').click();
  assert.equal(await page.locator('.wt-history-row').count(),2);
  await page.locator('.wt-history-close').click();

  // Switch back to ZH and test Snowfluff Player expanded (volume, mute, mode cycle, persistent folder, clear)
  await page.evaluate(()=>window.__wtSetLang('zh'));
  await page.evaluate(()=>{
   window.__disposeSnowfluff=__wtSnowfluffPlayer.create(document.getElementById('pet-dock'),()=>{},()=>import('http://127.0.0.1:48642/ui.js'));
  });
  await page.locator('.wt-snowfluff-star').click();
  await page.locator('#wt-snowfluff-player').waitFor({state:'visible'});
  await page.locator('#wt-snowfluff-player [data-settings]').click();
  await page.locator('#wt-snowfluff-player [data-clear-folder]').waitFor({state:'visible'});
  await page.locator('#wt-snowfluff-player [data-mode]').click();
  assert((await page.locator('#wt-snowfluff-player .wt-snowfluff-status').innerText()).includes('单曲循环'));
  await page.locator('#wt-snowfluff-player [data-mode]').click();
  assert((await page.locator('#wt-snowfluff-player .wt-snowfluff-status').innerText()).includes('随机播放'));
  await page.locator('#wt-snowfluff-player [data-mute]').click();
  assert.equal(await page.locator('#wt-snowfluff-player [data-volume-text]').innerText(),'0%');
  await page.locator('#wt-snowfluff-player [data-mute]').click();
  assert.equal(await page.locator('#wt-snowfluff-player [data-volume-text]').innerText(),'80%');
  // Simulate playing state so progress bar is visible in screenshot
  await page.evaluate(()=>{
   const p=document.querySelector('#wt-snowfluff-player .wt-snowfluff-progress');
   p.hidden=false;const s=p.querySelector('[data-seek]');s.value='380';s.style.setProperty('--wt-p','38%');
   p.querySelector('[data-cur]').textContent='01:24';p.querySelector('[data-dur]').textContent='03:42';
  });
  await page.locator('#wt-snowfluff-player').screenshot({path:path.join(out,'snowfluff-player-zh.png')});

  // Test Theme Pack Uninstall + Online Download UI + Progress bar
  page.once('dialog',d=>d.accept());
  await page.locator('[data-wt-remove-pack]').click();
  await page.locator('[data-wt-download-pack="aemeath"]').waitFor({state:'visible'});
  await page.locator('[data-wt-download-pack="aemeath"]').click();
  await page.locator('.wt-theme-dl-bar').waitFor({state:'visible'});
  await page.waitForFunction(()=>document.querySelector('[data-wt-dl-text]')?.textContent.includes('47%'));
  await page.locator('#theme-card').screenshot({path:path.join(out,'theme-cloud-download-zh.png')});

  assert.deepEqual(errors,[],'Zero console/page errors expected');
  console.log('PASS: v1.0.5.6 4-theme + ZH/EN UI, custom 9-key, Snowfluff player, room history, backup, cloud theme download, and postcards verified.');
 }finally{await browser.close()}
}

main().catch(err=>{console.error(err.stack||err);process.exitCode=1});
