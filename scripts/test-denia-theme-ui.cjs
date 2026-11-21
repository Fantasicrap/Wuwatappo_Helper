const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright'),{babelParse,traverse}=require('playwright/lib/transform/babelBundle');
const {fixturePath,target}=require('./upstream-fixtures.cjs');
const out=path.resolve(process.env.WUWA_TEST_DISTRIBUTION_DIR||'dist/local-'+target);
const common=fs.readFileSync(fixturePath('dist/migration-1.0.3.4/index-CuzHFfJW.js'),'utf8');
let theme,dialogue;
traverse(babelParse(common,'common.mjs',true),{VariableDeclaration(p){
 if(p.node.declarations.some(declaration=>declaration.id.name==='__wtPetDialogue'))dialogue=common.slice(p.node.start,p.node.end);
 if(p.node.declarations.some(declaration=>declaration.id.name==='__wtTheme')){
  theme=common.slice(p.node.start,p.node.end);p.stop();
 }
}});
assert(theme&&dialogue,'Theme or dialogue module not found in the built bundle');
theme='window.__wtControllerCore={names:["A","B"]};'+dialogue+'\n'+theme;
const sourceAssets=fs.readFileSync('patches/theme-assets.js','utf8');
const moduleFile=path.join(out,'host-build/controller-ui.js');
const moduleCode=fs.existsSync(moduleFile)?fs.readFileSync(moduleFile,'utf8'):sourceAssets+'\n'+fs.readFileSync('patches/denia-theme.js','utf8')+'\n'+fs.readFileSync('patches/phrolova-theme.js','utf8');
const upstreamCss=fs.readFileSync(fixturePath('dist/upstream-1.0.3/index-C3fG-hsi.css'),'utf8');
const previewRules=new Set(['.atlas-item','.atlas-item:before,.atlas-item:after','.atlas-item:before','.atlas-item--active:before',
 '.atlas-item .atlas-qty','.synthesis-list .synthesis-item','.synthesis-list .synthesis-add','.my-preset .preset-item',
 '.select-item .select-input','.select-item .select-input:after','.room-members li','.room-members li.room-owner']);
const previewCss=[...upstreamCss.matchAll(/([^{}]+)\{[^{}]+\}/g)].filter(([,name])=>previewRules.has(name.trim())).map(([rule])=>rule).join('\n');
const css=`
 body{margin:0;padding:26px;background:#fff9ed;font:14px "Microsoft YaHei",sans-serif;color:#694832}
 .module-panel{position:relative;isolation:isolate;display:grid;grid-template-columns:72px 1fr;border:1px solid #e3c9aa;border-radius:16px;width:640px;overflow:hidden;background:#f4e1c8}
 .tab-bar{display:grid;align-content:start;gap:7px;padding:16px 7px}
 .tab-btn{padding:9px 3px;border:1px solid #cbbbe1;border-radius:11px;background:#fff6}
 .pane{position:relative;isolation:isolate;padding:18px}
 .module-content__bg{position:absolute;z-index:-1;inset:0}
 .module-content__bg:before{content:'';position:absolute;inset:0;border-radius:inherit}
 .probe{color:#694832;background-color:#fdf9ed;padding:8px;margin-top:10px}
 .cat-stack{position:relative;width:240px;height:220px;background:#f8f3fb;border-radius:12px}
 .pet-info{display:flex;width:191px}.pet-info .text{width:130px;background:#fdf9ed;color:#8e5e43;line-height:32px;border-radius:16px 0 0 16px;padding-left:14px;font-weight:bold}
 .pet-toolbar{position:relative;width:61px;background:tan no-repeat;background-size:100% 100%}
 .reward-anchor{position:absolute;top:170px;left:260px;width:48px;height:40px}
 .reward-anchor--right{top:225px}.reward-countdown__svg{visibility:visible}
 .fixture-label{display:block;padding:6px 12px;color:#5b4a69}
 .wt-input-bubble{position:absolute;left:22%;top:43%;transform:translate(-50%,-50%);max-width:42%;font-size:11px}
`;
const html='<meta charset="utf-8"><style>'+css+'</style><div class="module-panel"><div class="tab-bar">'+['背包','图鉴','设置'].map((name,i)=>'<button class="tab-btn '+(i===2?'tab-btn--active':'')+'"><span class="tab-btn__label">'+name+'</span></button>').join('')+'</div><div class="pane"><div class="module-content__bg"></div><div class="wt-theme-picker"></div><div class="probe">计数栏与控件配色</div></div></div>';
const surfaceHtml='<meta charset="utf-8"><style>'+previewCss+css+`
 .sample{display:grid;gap:10px;max-width:535px;margin:0 auto;padding:18px;border-radius:15px;background:var(--wt-ui-card-fill,#fff9ed)}
 .sample-row{display:flex;gap:14px;align-items:center}.sample .atlas-item{height:96px}.sample .atlas-qty{top:auto;bottom:7px;right:8px}
 .sample .room-members{padding:0;margin:0}.sample .atlas-thumb{position:relative;margin:7px auto;width:98px;height:50px;border-radius:10px}
 .sample .atlas-thumb--epic{background:linear-gradient(#f65731,#fba449)}
 </style><div class="sample">
 <div class="select-item"><span class="select-input">系列筛选</span></div>
 <div class="room-members"><li>房间成员</li><li class="room-owner">房主</li></div>
 <div class="sample-row"><div class="atlas-item atlas-item--active"><div class="atlas-thumb atlas-thumb--epic"></div><span class="atlas-qty">10</span></div>
 <div class="my-preset"><div class="preset-item"></div></div>
 <div class="synthesis-list"><div class="synthesis-item"><div class="synthesis-add"></div></div></div></div></div>`;
const reward=side=>'<div class="reward-anchor reward-anchor--'+side+'"><span class="reward-countdown"><span class="reward-countdown__svg">00:42</span></span><button class="reward-btn"></button></div>';
const mainHtml='<meta charset="utf-8"><style>'+css+'</style><div class="cat-stack"><span class="fixture-label">达妮娅动效测试</span></div><div class="pet-info-container"><div class="pet-info"><span class="text">482106</span><span class="pet-toolbar"></span></div></div>'+reward('left')+reward('right');
const waitTheme=(page,value)=>page.waitForFunction(expected=>(document.documentElement.dataset.wtTheme??'default')===expected,value);

(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 try{
  const context=await browser.newContext({viewport:{width:720,height:520}}),settings=await context.newPage(),main=await context.newPage(),surfaces=await context.newPage();
  await context.route('http://tauri.localhost/**',route=>route.fulfill({contentType:'text/html; charset=utf-8',body:route.request().url().endsWith('/main')?mainHtml:route.request().url().endsWith('/surfaces')?surfaceHtml:html}));
  const headers={'Access-Control-Allow-Origin':'http://tauri.localhost','Access-Control-Allow-Private-Network':'true','Access-Control-Allow-Headers':'X-Wuwa-Action','Access-Control-Allow-Methods':'GET, POST, OPTIONS'};
  const host='http://127.0.0.1:48642',installed={};
  const art=process.env.WUWA_DENIA_BACKGROUND||'dist/theme-assets/aemeath-background.jpg';
  const files={background:{name:'background.jpg',type:'image/jpeg',file:art},toolbar:{name:'toolbar.png',type:'image/png',file:'dist/theme-assets/denia-toolbar.png'},tides:{name:'tides.webp',type:'image/webp',file:'dist/theme-assets/aemeath-tides.webp'}};
  const denia={revision:'denia-1',version:'1.0.0',credit:'Hikaku · pixiv 144153156',effects:['denia','blocks','tides']};
  for(const [kind,{name,type,file}] of Object.entries(files)){
   if(!fs.existsSync(file))continue;
   denia[kind]='/theme-assets/denia/'+name;
   await context.route(host+denia[kind],route=>route.fulfill({headers,contentType:type,path:file}));
  }
  const phrolova={revision:'phrolova-1',effects:['phrolova','tides'],credit:'Pixiv · おいろ'};
  if(denia.tides){
   phrolova.tides='/theme-assets/phrolova/tides.webp';
   await context.route(host+phrolova.tides,route=>route.fulfill({headers,contentType:'image/webp',path:files.tides.file}));
  }
  if(process.env.WUWA_PHROLOVA_BACKGROUND){
   phrolova.background='/theme-assets/phrolova/background.jpg';
   await context.route(host+phrolova.background,route=>route.fulfill({headers,contentType:'image/jpeg',path:process.env.WUWA_PHROLOVA_BACKGROUND}));
  }
  const queue=[{cancelled:true},{error:'主题包校验失败。'},{id:'denia'},{id:'aemeath'},{id:'phrolova'}];
  await context.route(host+'/theme-packs',route=>route.fulfill({headers,json:installed}));
  await context.route(host+'/theme-packs/import',route=>{
   if(route.request().method()==='OPTIONS')return route.fulfill({headers,body:''});
   assert.equal(route.request().method(),'POST');
   assert.equal(route.request().headers()['x-wuwa-action'],'1');
   const result=queue.shift();
   if(result.id)installed[result.id]={denia,phrolova,aemeath:{revision:'aemeath-1',effects:['player'],credit:'Sanyue-Qiushi'}}[result.id];
   return route.fulfill({headers,json:result});
  });
  let gameOpened=0;
  await context.route(host+'/denia-blocks/open',route=>{
   if(route.request().method()==='OPTIONS')return route.fulfill({headers,body:''});
   assert.equal(route.request().method(),'POST');
   assert.equal(route.request().headers()['x-wuwa-action'],'1');
   gameOpened++;return route.fulfill({headers,json:{accepted:true}});
  });
  await context.route('http://127.0.0.1:48642/ui.js',route=>route.fulfill({
   contentType:'text/javascript; charset=utf-8',headers,body:moduleCode
  }));
  const errors=[];
  for(const page of [settings,main,surfaces])page.on('pageerror',error=>errors.push(error.message));
  await surfaces.goto('http://tauri.localhost/surfaces');
  await surfaces.addScriptTag({content:'window.__wtPanelLayout={extend(){}};'+theme});
  const surfaceColors=()=>surfaces.evaluate(()=>({
   fill:['.select-input','.room-members li','.atlas-qty'].map(selector=>getComputedStyle(document.querySelector(selector)).backgroundColor),
   frame:getComputedStyle(document.querySelector('.atlas-item'),'::before').filter,
   presetBlend:getComputedStyle(document.querySelector('.preset-item'),'::before').backgroundBlendMode,
   slot:getComputedStyle(document.querySelector('.synthesis-add')).backgroundImage,
   rarity:getComputedStyle(document.querySelector('.atlas-thumb--epic')).backgroundImage
  }));
  const warmSurfaces=await surfaceColors();
  async function verifySurfaces(id,fill){
   await waitTheme(surfaces,id);
   await surfaces.waitForFunction(expected=>getComputedStyle(document.querySelector('.select-input')).backgroundColor===expected,fill);
   const sample=await surfaceColors();
   assert.deepEqual(sample.fill,[fill,fill,fill]);
   assert.match(sample.frame,/hue-rotate/);
   assert.equal(sample.presetBlend,'luminosity');
   assert.match(sample.slot,/linear-gradient/);
   assert.equal(sample.rarity,warmSurfaces.rarity);
   await surfaces.locator('.sample').screenshot({path:path.join(out,id+'-theme-surfaces.png')});
  }
  await main.clock.install();
  await settings.goto('http://tauri.localhost/settings');
  await settings.addScriptTag({content:`window.__wtPanelLayout={extend(){}};window.emit=async()=>{};${theme}
    window.__theme=__wtTheme;__wtTheme.mount(document.querySelector('.wt-theme-picker'));`});
  await main.goto('http://tauri.localhost/main');
  await main.addScriptTag({content:`window.__wtPanelLayout={extend(){}};window.__TAURI_INTERNALS__={metadata:{currentWindow:{label:'main'}}};${theme}
    window.petRole={id:1201};window.readyCount=0;
    window.effect=__wtTheme.createDenia({root:()=>document.querySelector('.cat-stack'),role:()=>petRole,blocked:()=>false,activity:()=>readyCount++});effect.start();`});
  const tone=()=>settings.locator('.probe').evaluate(el=>getComputedStyle(el).color),original=await tone();
  const choose=id=>settings.locator('[data-wt-theme-option="'+id+'"]').click();
  const field=settings.locator('.wt-denia-settings'),input=settings.locator('.wt-theme-background input');
  const upload=Buffer.from(await settings.evaluate(()=>{
   const canvas=document.createElement('canvas');canvas.width=16;canvas.height=16;
   const ctx=canvas.getContext('2d');ctx.fillStyle='#815fa3';ctx.fillRect(0,0,16,16);return canvas.toDataURL().split(',')[1];
  }),'base64');
  const importButton=settings.getByRole('button',{name:'导入主题包',exact:true});
  assert(await settings.locator('[data-wt-theme-option=denia]').isDisabled());
  await importButton.click();await importButton.waitFor();
  await importButton.click();await settings.getByText('主题包校验失败。').waitFor();
  assert(await settings.locator('[data-wt-theme-option=denia]').isDisabled());
  await importButton.click();await waitTheme(main,'denia');await field.waitFor();
  await main.waitForFunction(()=>readyCount>1);
  assert.notEqual(await tone(),original);
  assert.notEqual(await settings.locator('.tab-bar').evaluate(el=>getComputedStyle(el).backgroundImage),'none');
  assert(await field.getByLabel('拟态泡泡').isChecked());
  await verifySurfaces('denia','rgb(247, 241, 253)');
  const credit=settings.locator('.wt-theme-background [data-wt-pack-credit]');
  assert.match(await credit.textContent(),/Hikaku/);
  assert.equal(await field.getByText(/Hikaku/).count(),0);
  if(denia.background)assert.match(await settings.locator('.module-panel').evaluate(el=>getComputedStyle(el).backgroundImage),/theme-assets\/denia\/background\.jpg/);
  if(denia.toolbar)await main.waitForFunction(()=>document.documentElement.hasAttribute('data-wt-denia-toolbar'));
  await main.getByRole('button',{name:'拉海洛方块'}).click();
  await main.waitForTimeout(100);
  assert.equal(gameOpened,1);
  if(denia.tides){
   await main.waitForFunction(()=>document.documentElement.hasAttribute('data-wt-tides'));
   const visibility=side=>main.locator('.reward-anchor--'+side+' .reward-countdown__svg').evaluate(el=>getComputedStyle(el).visibility);
   assert.equal(await visibility('left'),'hidden');
   assert.equal(await visibility('right'),'hidden');
   const tidePosition=side=>main.locator('.reward-anchor--'+side+' .reward-countdown').evaluate(el=>getComputedStyle(el,'::before').backgroundPosition);
   assert.equal(await tidePosition('left'),'0% 50%');
   assert.equal(await tidePosition('right'),'100% 50%');
   await main.screenshot({path:path.join(out,'denia-reward-preview.png')});
   assert.equal(await main.locator('.reward-anchor--right').evaluate(el=>getComputedStyle(el).getPropertyValue('--wt-tide-position').trim()),'right center');
   await main.locator('.reward-anchor--left button').evaluate(el=>el.classList.add('reward-btn--open'));
   await main.locator('.wt-tide-spark').first().waitFor();
   await main.locator('.wt-tide-spark').first().waitFor({state:'detached'});
   await main.locator('.reward-anchor--right button').evaluate(el=>el.classList.add('reward-btn--open'));
   await main.locator('.wt-tide-spark').first().waitFor();
  }
  await settings.locator('.module-panel').screenshot({path:path.join(out,'denia-settings-preview.png')});
  await uploadBackground();
  await importButton.click();await waitTheme(main,'aemeath');
  await verifySurfaces('aemeath','rgb(255, 245, 250)');
  assert.match(await credit.textContent(),/Sanyue-Qiushi/);
  assert.equal(await settings.locator('html[data-wt-custom-background]').count(),0);
  await uploadBackground();
  await importButton.click();await waitTheme(main,'phrolova');
  await verifySurfaces('phrolova','rgb(248, 231, 238)');
  assert.match(await credit.textContent(),/おいろ/);
  if(phrolova.tides){
   await main.waitForFunction(()=>getComputedStyle(document.documentElement).getPropertyValue('--wt-theme-tides').includes('/phrolova/'));
   for(const [side,position] of [['left','0% 50%'],['right','100% 50%']]){
    const reward=main.locator('.reward-anchor--'+side+' .reward-btn');
    assert.equal(await reward.evaluate(node=>getComputedStyle(node,'::before').backgroundPosition),position);
   }
   const button=main.locator('.reward-anchor--right .reward-btn');
   await button.evaluate(node=>node.classList.remove('reward-btn--open'));
   await button.evaluate(node=>node.classList.add('reward-btn--open'));
   const spark=main.locator('.wt-tide-spark:not(.wt-tide-spark--light)').first();
   await spark.waitFor();
   assert.equal(await spark.evaluate(node=>getComputedStyle(node).backgroundColor),'rgb(230, 124, 157)');
  }
  if(phrolova.background){
   await settings.waitForFunction(()=>getComputedStyle(document.querySelector('.module-content__bg')).backgroundImage.includes('/theme-assets/phrolova/background.jpg'));
   assert.match(await settings.locator('.tab-bar').evaluate(el=>getComputedStyle(el).backgroundImage),/\/theme-assets\/phrolova\/background\.jpg/);
   await settings.locator('.module-panel').screenshot({path:path.join(out,'phrolova-theme-preview.png')});
  }
  await choose('default');await waitTheme(main,'default');assert.equal(await tone(),original);
  assert(await credit.isHidden());
  await waitTheme(surfaces,'default');assert.deepEqual(await surfaceColors(),warmSurfaces);
  await choose('denia');await waitTheme(main,'denia');await field.waitFor();
  assert.equal(await settings.locator('html[data-wt-custom-background]').count(),1);
  await settings.getByRole('button',{name:'恢复默认',exact:true}).click();
  assert.equal(await settings.evaluate(()=>localStorage.getItem('wuwatappo-denia-background-v1')),null);
  assert(await settings.evaluate(()=>!!localStorage.getItem('wuwatappo-aemeath-background-v1')));
  await field.getByLabel('拟态泡泡').uncheck();
  await main.waitForFunction(()=>!document.documentElement.hasAttribute('data-wt-denia-bubble'));
  await field.getByLabel('闲置动画').uncheck();
  await field.getByLabel('虚质之手').check();
  assert.equal(await main.evaluate(()=>!!effect.inputActive()),false);
  await main.evaluate(()=>{petRole={name:'role_1211_costume.png'};effect.sync()});
  await main.waitForFunction(()=>effect.inputActive());
  const cake=main.locator('.wt-denia-cake');
  await cake.waitFor();
  await cake.screenshot({path:path.join(out,'denia-cake-preview.png')});
  await field.getByLabel('日常台词气泡').check();
  await field.getByLabel('日常台词模式').selectOption('mapped');
  await field.getByLabel('达妮娅触发按键').selectOption('keyboard:Q');
  await field.getByLabel('达妮娅自定义台词').fill('要不要再摆一局方块？');
  await field.getByRole('button',{name:'保存绑定'}).click();
  await main.waitForFunction(()=>localStorage.getItem('wuwatappo-denia-dialogue-v1')?.includes('keyboard:Q'));
  await main.waitForTimeout(120);
  const line=main.locator('.wt-denia-line');
  await edge('keyboard','J',true);await edge('keyboard','J',false);
  assert.equal(await line.count(),0);
  await edge('keyboard','Q',true);await edge('keyboard','Q',false);
  assert.equal(await line.textContent(),'要不要再摆一局方块？');
  await main.evaluate(()=>{
   const input=document.createElement('div');input.className='wt-input-bubble';input.textContent='鼠标左键';
   document.querySelector('.cat-stack').append(input);
  });
  for(const width of [120,240,400]){
   await main.locator('.cat-stack').evaluate((el,width)=>el.style.width=width+'px',width);
   assert(await main.evaluate(()=>{
    const line=document.querySelector('.wt-denia-line').getBoundingClientRect(),key=document.querySelector('.wt-input-bubble').getBoundingClientRect();
    return key.right<line.left;
   }));
  }
  await main.locator('.cat-stack').evaluate(el=>el.style.width='240px');
  await main.getByRole('button',{name:'点亮蜡烛'}).click();
  await main.getByRole('button',{name:'吹灭蜡烛'}).click();
  await main.clock.runFor(520);
  assert.equal(await line.textContent(),'我可没在等你哦。');
  await edge('keyboard','Q',true);await edge('keyboard','Q',false);
  assert.equal(await line.textContent(),'我可没在等你哦。');
  await main.clock.runFor(3600);
  await field.getByLabel('日常台词气泡').uncheck();
  await field.getByLabel('吹蜡烛').uncheck();
  await cake.waitFor();
  assert(await cake.isDisabled());await field.getByLabel('吹蜡烛').check();
  const anchor=main.locator('.reward-anchor--left');
  await anchor.locator('button').evaluate(node=>node.remove());
  await anchor.evaluate(node=>{node.append(Object.assign(document.createElement('button'),{className:'reward-btn'}))});
  const messenger=anchor.locator('.wt-denia-messenger');
  await messenger.waitFor();
  await anchor.locator('button').evaluate(node=>node.classList.add('reward-btn--loading'));
  assert.equal(await messenger.count(),1);
  await anchor.locator('button').evaluate(node=>node.classList.add('reward-btn--open'));
  assert.equal(await messenger.getAttribute('data-motion'),'retreat');
  await anchor.locator('button').evaluate(node=>node.remove());
  await main.clock.runFor(1200);
  assert.equal(await messenger.count(),1,'The paper figure stays visible after the chest button is removed');
  assert.ok(await messenger.evaluate(node=>node.offsetWidth>=44&&Number(getComputedStyle(node).opacity)>.95));
  await main.screenshot({path:path.join(out,'denia-chest-paper-preview.png')});
  await main.clock.runFor(1300);
  await messenger.waitFor({state:'detached'});
  await field.getByLabel('剪纸小人宝箱提醒').uncheck();
  const fx=main.locator('.wt-denia-fx');
  await main.evaluate(()=>effect.moved());
  await fx.waitFor({state:'detached'});
  await edge('keyboard','Q',true);await edge('keyboard','Q',false);
  await main.waitForTimeout(820);assert.equal(await fx.count(),0);
  await edge('mouse','left',true);
  await fx.waitFor();
  await main.waitForFunction(()=>{
   const data=document.querySelector('.wt-denia-fx')?.getContext('2d').getImageData(0,0,480,440).data;
   return data&&data.some((value,i)=>i%4===3&&value>170);
  });
  assert.equal(await fx.evaluate(el=>getComputedStyle(el).pointerEvents),'none');
  await main.locator('.cat-stack').screenshot({path:path.join(out,'denia-hand-preview.png')});
  await edge('mouse','left',false);
  await fx.waitFor({state:'detached'});
  await field.getByLabel('虚质之手').uncheck();
  await field.getByLabel('剪纸小人',{exact:true}).check();
  await main.evaluate(()=>{petRole={id:1211};effect.sync()});
  await main.waitForFunction(()=>effect.inputActive());
  await edge('controller','A',true);await edge('controller','A',true);await edge('controller','A',true);
  assert.equal(await fx.count(),0);
  await edge('controller','A',false);
  for(const label of ['X','Y']){await edge('controller',label,true);await edge('controller',label,false)}
  await fx.waitFor();
  await main.waitForTimeout(400);
  await main.locator('.cat-stack').evaluate(el=>{el.style.width='400px';el.style.height='360px'});
  assert(await fx.evaluate(el=>el.getBoundingClientRect().width===400));
  await main.locator('.cat-stack').screenshot({path:path.join(out,'denia-paper-preview.png')});
  await fx.waitFor({state:'detached'});
  await main.bringToFront();
  await main.clock.pauseAt(await main.evaluate(()=>new Date(Date.now()+10000).toISOString()));
  await field.getByLabel('闲置动画').check();
  await main.evaluate(()=>{effect.sync();effect.moved()});
  await main.clock.runFor(9000);
  assert.equal(await fx.count(),0);
  await main.evaluate(()=>effect.moved());
  await main.clock.runFor(9000);
  assert.equal(await fx.count(),0);
  await main.clock.runFor(1500);
  assert.equal(await fx.getAttribute('data-effect'),'idle-bubbles');
  await main.locator('.cat-stack').screenshot({path:path.join(out,'denia-idle-bubbles-preview.png')});
  await main.clock.runFor(2700);
  assert.equal(await fx.getAttribute('data-effect'),'idle-bubbles');
  await main.clock.runFor(1000);
  assert.equal(await fx.count(),0);
  await main.evaluate(()=>effect.moved());
  await main.clock.runFor(11000);
  assert.equal(await fx.getAttribute('data-effect'),'idle-paper');
  await main.locator('.cat-stack').screenshot({path:path.join(out,'denia-idle-paper-preview.png')});
  await main.clock.resume();
  await choose('default');await waitTheme(main,'default');await fx.waitFor({state:'detached'});
  assert.equal(await main.evaluate(()=>!!effect.inputActive()),false);
  assert.equal(await cake.count(),0);
  assert.equal(await main.locator('.wt-denia-star').count(),0);
  const game=await context.newPage();
  game.on('pageerror',error=>errors.push(error.message));
  await game.route('http://127.0.0.1:48642/denia-blocks',route=>route.fulfill({contentType:'text/html; charset=utf-8',path:'patches/denia-blocks.html'}));
  await game.route('http://127.0.0.1:48642/denia-blocks/falling',route=>route.fulfill({contentType:'text/html; charset=utf-8',path:'patches/denia-falling.html'}));
  await game.goto('http://127.0.0.1:48642/denia-blocks');
  await game.setViewportSize({width:585,height:700});
  const classic=game.getByRole('button',{name:/^拉海洛方块 固定朝向/}), turnabout=game.getByRole('button',{name:/^拉海洛方块・逆转/});
  await game.screenshot({path:path.join(out,'denia-blocks-choices.png')});
  await game.getByRole('link',{name:/^经典下落/}).click();
  await game.waitForURL('**/denia-blocks/falling');
  await game.clock.install();
  await game.getByRole('button',{name:'开始',exact:true}).click();
  await game.evaluate(()=>{piece={kind:0,cells:shapes[0].cells,x:3,y:0};draw()});
  await game.keyboard.press('KeyA');
  assert.equal(await game.evaluate(()=>piece.x),2);
  await game.keyboard.press('KeyR');
  assert.deepEqual(await game.evaluate(()=>piece.cells),[[0,0],[0,1]]);
  await game.clock.runFor(900);
  assert(await game.evaluate(()=>piece.y>=1));
  await game.keyboard.press('Space');
  assert(await game.evaluate(()=>grid.at(-1).some(Boolean)));
  assert.match(await game.locator('#falling-bubble-help').textContent(),/清除最底一排/);
  await game.screenshot({path:path.join(out,'denia-falling-preview.png')});
  await game.getByRole('link',{name:'选玩法'}).click();
  await game.waitForURL('**/denia-blocks');
  await classic.click();
  assert.equal(await game.locator('h1').textContent(),'拉海洛方块');
  const coordinates=()=>game.evaluate(()=>group[selected].cells.map(cell=>[cell.x,cell.y]));
  const setBar=()=>game.evaluate(()=>{
   group[0]={kind:1,cells:[{x:0,y:0,medal:false},{x:1,y:0,medal:false}]};choose(0);render();
  });
  await setBar();
  await game.keyboard.press('KeyR');
  assert.deepEqual(await coordinates(),[[0,0],[1,0]]);
  assert.equal(await game.getByRole('button',{name:'旋转 · R'}).count(),0);
  await game.getByRole('button',{name:'选玩法'}).click();
  await turnabout.click();
  await setBar();
  await game.evaluate(()=>{
   group[1]={kind:2,cells:[{x:0,y:0,medal:false},{x:1,y:0,medal:false}]};
   group[2]={kind:0,cells:[{x:0,y:0,medal:false}]};
   render();
  });
  await game.locator('#restart').focus();
  const column=()=>game.evaluate(()=>selection.x),startColumn=await column();
  for(const [key,expected] of [['KeyA',startColumn-1],['ArrowLeft',startColumn-2],['KeyD',startColumn-1],['ArrowRight',startColumn]]){
   await game.keyboard.press(key);
   assert.equal(await column(),expected,key+' must work with focus on a button');
  }
  await game.keyboard.press('KeyR');
  assert.deepEqual(await coordinates(),[[0,0],[0,1]]);
  await game.keyboard.press('Space');
  assert.equal(await game.locator('#remaining').textContent(),'2/3');
  assert.equal(await game.evaluate(()=>grid.flat().filter(Boolean).length),2);
  const board=await game.locator('#well').boundingBox(),slot=await game.locator('[data-slot="1"]').boundingBox();
  const cellAt=(x,y)=>[board.x+board.width*(x+.5)/8,board.y+board.height*(y+.5)/8];
  await game.mouse.move(slot.x+slot.width/2,slot.y+slot.height/2);
  await game.mouse.down();
  await game.mouse.move(...cellAt(0,0),{steps:4});
  await game.keyboard.press('KeyR');
  assert(await game.evaluate(()=>drag?.over));
  assert.deepEqual(await coordinates(),[[0,0],[0,1]]);
  await game.mouse.up();
  assert.equal(await game.locator('#remaining').textContent(),'1/3');
  await game.mouse.click(...cellAt(0,0));
  assert.equal(await game.locator('#remaining').textContent(),'1/3');
  await game.mouse.click(...cellAt(0,4));
  assert.equal(await game.locator('#remaining').textContent(),'3/3');
  assert.equal(await game.evaluate(()=>batches),2);
  await game.getByRole('button',{name:'暂停'}).click();
  assert.equal(await game.locator('#status').textContent(),'已暂停');
  await game.keyboard.press('KeyP');
  assert.equal(await game.locator('#status').isHidden(),true);
  await game.getByRole('button',{name:'选玩法'}).click();
  await game.getByLabel('目标').selectOption('medals');
  await game.getByLabel('难度').selectOption('hard');
  await turnabout.click();
  await game.evaluate(()=>{
   const ordinary={kind:1,medal:false};
   grid=blank();
   for(let i=0;i<size;i++)if(i!==3)grid[3][i]=grid[i][3]=ordinary;
   group[0]={kind:0,cells:[{x:0,y:0,medal:true}]};choose(0);point(3,3);render();
  });
  await game.keyboard.press('Space');
  assert.deepEqual(await game.evaluate(()=>[grid.flat().filter(Boolean).length,medals,charge,score]),[0,1,2,305]);
  await game.evaluate(()=>{
   const ordinary={kind:1,medal:false};
   grid[2].fill(ordinary);grid[2][4]=null;grid[6][5]=ordinary;grid[7][5]=ordinary;
   const next=group.findIndex(Boolean);
   group[next]={kind:0,cells:[{x:0,y:0,medal:false}]};choose(next);point(4,2);render();
  });
  await game.keyboard.press('Space');
  assert(await game.getByRole('button',{name:'吹泡泡 · 3/3'}).isEnabled());
  assert.match(await game.locator('#bubble-help').textContent(),/清除最底一排/);
  await game.screenshot({path:path.join(out,'denia-blocks-preview.png')});
  await game.keyboard.press('KeyB');
  assert.deepEqual(await game.evaluate(()=>[grid[6].filter(Boolean).length,grid[7].filter(Boolean).length,charge]),[1,0,0]);
  assert.equal(await game.locator('#hint').textContent(),'泡泡清除了最底一排。');
  await game.evaluate(()=>{
   grid=blank();
   const ordinary={kind:1,medal:false};
   for(let y=0;y<size;y++)for(let x=0;x<size;x++)if((x+y)%2===0)grid[y][x]=ordinary;
   const piece={kind:1,cells:[{x:0,y:0,medal:false},{x:1,y:0,medal:false}]};
   group=[piece,piece,piece];choose(0);outcome();render();
  });
  assert.equal(await game.locator('#status').textContent(),'没有可摆放的位置');
  await game.reload();
  await game.getByLabel('目标').selectOption('medals');
  await game.getByLabel('难度').selectOption('hard');
  await turnabout.click();
  assert.equal(await game.locator('#best').textContent(),'最高 430 分');
  await game.setViewportSize({width:370,height:480});
  assert(await game.evaluate(()=>document.documentElement.scrollWidth===innerWidth));
  await game.screenshot({path:path.join(out,'denia-blocks-compact.png'),fullPage:true});
  assert.deepEqual(errors,[]);
  console.log('Denia theme switch, distinct backgrounds, outfit, bubble, hold and repeated-input effects passed.');
  async function uploadBackground(){
   await input.setInputFiles({name:'sample.png',mimeType:'image/png',buffer:upload});
   await settings.waitForFunction(()=>document.documentElement.hasAttribute('data-wt-custom-background'));
  }
  async function edge(source,label,down){await main.evaluate(([source,label,down])=>effect.input(source,source+':'+label,down),[source,label,down])}
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
