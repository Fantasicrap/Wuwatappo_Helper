const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {chromium} = require('playwright');
const {babelParse, traverse} = require('playwright/lib/transform/babelBundle');
const {fixturePath,target} = require('./upstream-fixtures.cjs');

const source = fs.readFileSync(fixturePath('dist/migration-1.0.3.4/index-CuzHFfJW.js'),'utf8');
const modules = [];
traverse(babelParse(source,'common.mjs',true),{VariableDeclaration(item) {
 if(item.node.declarations.some(node=>['__wtLocale','__wtRegionUi','__wtPhrolovaReaction','__wtKeyboardUi'].includes(node.id.name)))
  modules.push(source.slice(item.node.start,item.node.end));
}});
assert.equal(modules.length,4);
const globalDir = path.join('dist','migration-'+target+'-global');
const globalCommon = fs.readFileSync(path.join(globalDir,'index-BelNnexT.js'),'utf8');
assert.match(globalCommon,/const APP_REGION="GLOBAL"/);
assert.match(globalCommon,/https:\/\/api-wutheringwaves-wuwatappo\.kurogames-global\.com/);
assert.doesNotMatch(globalCommon,/https:\/\/api-mc-wuwatappo\.kurogames-global\.com/);
assert.match(fs.readFileSync(path.join(globalDir,'useLogin-Czal3z48.js'),'utf8'),/__wtRegionUi\.signIn\(\)/);
const globalLogin = fs.readFileSync(path.join(globalDir,'login-D7Mrat3T.js'),'utf8');
assert.doesNotMatch(globalLogin,/login-dialog-button--uid/);
assert.match(globalLogin,/__wtRegionUi\.installLoginLayout\(\)/);
assert.match(globalLogin,/class:"login-select-popup wt-global-login"/);

(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 try{
  const page=await browser.newPage({viewport:{width:480,height:340}}),requests=[];
  const headers={'Access-Control-Allow-Origin':'http://tauri.localhost','Access-Control-Allow-Headers':'X-Wuwa-Action','Access-Control-Allow-Methods':'GET, POST, OPTIONS'};
  await page.route('http://tauri.localhost/',route=>route.fulfill({
   contentType:'text/html; charset=utf-8',body:'<meta charset="utf-8"><main style="font:16px sans-serif;padding:18px;max-width:360px;margin:auto"><h2>账号与兑换</h2><div id="root"></div><p title="剪纸小人宝箱提醒">正在生成…</p><div id="dynamic"></div><p data-wt-user-text>好疼…</p></main>'
  }));
  await page.route('http://127.0.0.1:48642/region/**',route=>{
   const request=route.request(),url=new URL(request.url());
   if(request.method()==='OPTIONS')return route.fulfill({headers,status:204});
   requests.push({path:url.pathname,method:request.method(),header:request.headers()['x-wuwa-action']});
   return route.fulfill({headers,json:{accepted:true}});
  });
  await page.goto('http://tauri.localhost/');
  const layout=fs.readFileSync('patches/panel-layout.js','utf8').match(/const css=`([^\x60]+)`;/)[1];
  await page.addStyleTag({content:layout+'body{background:#f7f3ed;color:#694832}'});
  await page.addScriptTag({content:modules.join('\n')+`
  const h=(tag,props,children)=>{
   const el=document.createElement(tag);
   for(const child of Array.isArray(children)?children:[children])el.append(child);
   for(const [key,value] of Object.entries(props||{})){
    if(key==='onChange')el.addEventListener('change',value);
    else if(key==='value')el.value=value;
    else el.setAttribute(key,value);
   }
   return el;
  };
  window.quitCalls=0;window.notifications=[];
  document.querySelector('#root').append(__wtRegionUi.render(h,'cn',msg=>notifications.push(msg),()=>{quitCalls++}));
  window.setLanguage=__wtLocale.install(document,__wtLocale.read());
  window.__wtTranslate=value=>__wtLocale.translate(value);
  const bubbleStyle=document.createElement('style');bubbleStyle.textContent=__wtKeyboardUi.css;document.head.append(bubbleStyle);
  `});
  assert.equal(await page.locator('html').getAttribute('lang'),'zh-CN');
  await page.evaluate(()=>{localStorage.setItem('wuwatappo-locale','en');setLanguage('en')});
  await page.getByRole('heading',{name:'Account and codes'}).waitFor();
  const select=page.getByLabel('Account region');
  assert.equal(await select.inputValue(),'cn');
  await page.getByText('Generating…',{exact:true}).waitFor();
  await page.evaluate(()=>document.querySelector('#dynamic').append('已进入房间 123456'));
  await page.getByText('Joined room 123456',{exact:true}).waitFor();
  assert.equal(await page.locator('[data-wt-user-text]').textContent(),'好疼…');
  for(const size of [100,200,400]){
   await page.evaluate(size=>{
    document.querySelector('#pet')?.remove();
    const pet=document.createElement('div');pet.className='cat-stack';pet.id='pet';pet.dataset.wtInputBubbles='';
    Object.assign(pet.style,{position:'relative',width:size+'px',height:size+'px',background:'#f8e8ef',margin:'12px auto',borderRadius:'12px'});
    pet.style.setProperty('--pet-base-size',size+'px');document.querySelector('main').append(pet);
    const input=document.createElement('div');input.className='wt-input-bubble';input.textContent='RMB';pet.append(input);
    __wtPhrolovaReaction.create({root:()=>pet,role:()=>({id:1608}),settings:()=>({bubble:true,tears:false})}).trigger('连梦也结束了吗…');
   },size);
   const bubble=page.locator('.wt-phrolova-speech');
   await bubble.getByText('Is even the dream over…?',{exact:true}).waitFor();
   assert(await page.locator('#pet').evaluate(pet=>{
    const dialogue=pet.querySelector('.wt-phrolova-speech'),label=dialogue.querySelector('span');
    const box=pet.getBoundingClientRect(),speech=dialogue.getBoundingClientRect(),input=pet.querySelector('.wt-input-bubble').getBoundingClientRect();
    return speech.right<=box.right&&speech.bottom<=box.bottom&&input.right<=speech.left&&label.scrollWidth<=label.clientWidth+1&&label.scrollHeight<=label.clientHeight+1;
   }),size+' px bubbles did not fit side by side');
   if(size===100)await page.locator('#pet').screenshot({path:path.join(process.env.WUWA_TEST_DISTRIBUTION_DIR||globalDir,'english-bubbles-50.png')});
  }
  await page.locator('#pet').evaluate(node=>node.remove());
  page.once('dialog',dialog=>dialog.dismiss());
  await select.selectOption('global');
  assert.equal(requests.length,0);
  await page.screenshot({path:path.join(process.env.WUWA_TEST_DISTRIBUTION_DIR||globalDir,'sign-in-region-en.png')});
  page.once('dialog',dialog=>dialog.accept());
  await select.selectOption('global');
  await page.waitForFunction(()=>quitCalls===1);
  assert.deepEqual(requests,[{path:'/region/switch/global',method:'POST',header:'1'}]);
  await page.addStyleTag({content:fs.readFileSync(fixturePath('dist/upstream-1.0.3/login-ByLOs4dz.css'),'utf8')});
  await page.evaluate(()=>{
   document.body.insertAdjacentHTML('beforeend',`
    <div class="login-select-popup wt-global-login" data-v-77d75044>
     <div class="login-dialog-card" data-v-77d75044>
      <div class="login-dialog-background" data-v-77d75044></div>
      <img class="login-dialog-logo" alt="KURO GAMES" data-v-77d75044>
      <button class="login-dialog-close" aria-label="Close" data-v-77d75044></button>
      <div class="login-select-content content-visible" data-v-77d75044>
       <p class="login-select-tip" data-v-77d75044>活动需要登录参与，请选择登录方式</p>
       <div class="login-select-actions" data-v-77d75044>
        <div class="login-dialog-button login-dialog-button--passport" role="button" data-v-77d75044>通行证登录</div>
        <p class="login-passport-status" data-v-77d75044>通行证登录暂不可用，请稍后再试。</p>
       </div>
      </div>
     </div>
    </div>`);
  });
  const signIn=page.getByRole('button',{name:'Sign in with KURO account'});
  await signIn.waitFor();
  assert(await signIn.evaluate(button=>button.scrollWidth>button.clientWidth),'Original English button should reproduce the overflow');
  await page.evaluate(()=>__wtRegionUi.installLoginLayout());
  for(const [width,height] of [[540,380],[390,350],[320,280]]){
   await page.setViewportSize({width,height});
   await page.locator('.login-passport-status').scrollIntoViewIfNeeded();
   assert(await page.locator('.wt-global-login').evaluate(overlay=>{
    const card=overlay.querySelector('.login-dialog-card').getBoundingClientRect();
    const logo=overlay.querySelector('.login-dialog-logo').getBoundingClientRect();
    const close=overlay.querySelector('.login-dialog-close').getBoundingClientRect();
    const [tip,button,status]=overlay.querySelectorAll('.login-select-tip,.login-dialog-button--passport,.login-passport-status');
    const [tipRect,buttonRect,statusRect]=[tip,button,status].map(node=>node.getBoundingClientRect());
    return overlay.scrollWidth<=overlay.clientWidth+1 &&
     [tip,button,status].every(node=>node.scrollWidth<=node.clientWidth+1&&node.scrollHeight<=node.clientHeight+1) &&
     card.left>=0&&card.right<=innerWidth&&logo.right<=close.left&&
     tipRect.bottom<=buttonRect.top&&buttonRect.bottom<=statusRect.top&&statusRect.bottom<=card.bottom;
   }),'English login text overflowed at '+width+' × '+height);
  }
  await page.locator('.wt-global-login').evaluate(overlay=>overlay.remove());
  await page.evaluate(()=>setLanguage('zh'));
  await page.getByRole('heading',{name:'账号与兑换'}).waitFor();
  await page.getByText('已进入房间 123456',{exact:true}).waitFor();
  console.log('PASS: language switching, Global region routing, and English login dialog layout');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
