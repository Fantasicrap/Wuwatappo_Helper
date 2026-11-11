const {fixturePath,target,v104}=require('./upstream-fixtures.cjs');
const fs=require('fs'),assert=require('assert/strict'),{chromium}=require('playwright'),{babelParse,traverse}=require('playwright/lib/transform/babelBundle');
const path=require('path'),out=process.env.WUWA_TEST_DISTRIBUTION_DIR||'dist/migration-'+target;
const source=fs.readFileSync(fixturePath('dist/migration-1.0.3.4/index-CiT_jZa7.js'),'utf8');
const common=fs.readFileSync(fixturePath('dist/migration-1.0.3.4/index-CuzHFfJW.js'),'utf8');
const runtime=require('./vue-runtime-fixture.cjs')(common,['createBaseVNode','ref','createTextVNode']);
const modules=new Map(),prefix=[],sections=new Map(),controls=[];
let room,monitor,roomRestore,settingsPanel,settingsRows,historyButtons=0;
const slice=(text,node)=>text.slice(node.start,node.end);
const names=['__wtPanelLayout','__wtKeyboardUi','__wtHotkeys','__wtLongRun','__wtSynthesis','__wtRoomPositions'];
traverse(babelParse(common,'common.mjs',true),{VariableDeclaration(p){
 for(const {id} of p.node.declarations)if(names.includes(id.name))modules.set(id.name,slice(common,p.node));
}});
traverse(babelParse(source,'settings.mjs',true),{
 VariableDeclaration(p){
  const ids=p.node.declarations.map(d=>d.id.name);
  if(ids.some(id=>['__wtKeys','__wtBoostUntil','__wtSynthSettings'].includes(id)))prefix.push(slice(source,p.node));
  if(ids.includes('__wtRestoreRoom'))roomRestore=slice(source,p.node);
 },
 FunctionDeclaration(p){if(['__wtBoost','__wtToggle'].includes(p.node.id.name))prefix.push(slice(source,p.node));},
 CallExpression(p){
  const n=p.node,helper=n.callee.object?.name,method=n.callee.property?.name;
  if(helper==='__wtPanelLayout'&&method==='group')sections.set(n.arguments[1].value,slice(source,n));
  const children=n.arguments[2];
  if(children?.type==='ArrayExpression'&&children.elements.some(row=>row?.callee?.object?.name==='__wtPanelLayout'&&row.callee.property?.name==='group')){
   assert(!settingsPanel,'Expected a single grouped settings panel');
   settingsRows=children;
   settingsPanel=p.parentPath.isSequenceExpression()?p.parentPath.node:n;
  }
  if(helper==='__wtPanelLayout'&&method==='room')room=slice(source,n);
  if(helper==='__wtPanelLayout'&&method==='button'&&n.arguments[1].value==='历史房间')historyButtons++;
  if(n.callee.name==='e'&&n.arguments[1]?.properties?.some(p=>p.key?.name==='id'&&p.value?.value==='wt-monitor-settings'))monitor=slice(source,n);
  if(!v104&&['__wtKeyboardUi','__wtHotkeys','__wtSynthesis','__wtPanelLayout'].includes(helper)&&['renderSettings','render','renderBasicSettings','basic'].includes(method))controls.push(slice(source,n));
 }
});
assert.equal(modules.size,names.length);
assert.equal(historyButtons,2);
if(v104)assert.deepEqual([...sections.keys()],['basic','account','input','desktop','interaction','maintenance']);
const sectionIds=v104?[...sections.keys()]:['basic','input','desktop','maintenance'];
const render=sectionIds.map(id=>{
 if(v104&&['basic','input'].includes(id))return sections.get(id);
 let children='';
 if(!v104&&id==='basic')children=controls.filter(text=>text.includes('__wtPanelLayout.basic')||text.includes('renderBasicSettings')).join(',');
 if(!v104&&id==='input')children=controls.filter(text=>text.includes('__wtKeyboardUi')||text.includes('__wtHotkeys')).join(',');
 if(id==='desktop')children=monitor;
 if(id==='maintenance')children='e("div",{id:"wt-us"})';
 return '__wtPanelLayout.group(e,'+JSON.stringify(id)+',['+children+'])';
});
// Keep the production panel boundary inside an optimized outer block. A standalone
// VNode does not catch children leaking into Vue's enclosing block tracker.
const renderPanel=v104
 ? source.slice(settingsPanel.start,settingsRows.start)+'['+render.join(',')+']'+source.slice(settingsRows.end,settingsPanel.end)
 : "e('div',{class:'panel-content'},["+render.join(',')+"])";
const roomProps=room.match(/null,40,([\w$]+)\)/)[1];
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});try{const page=await browser.newPage({viewport:{width:440,height:1000},deviceScaleFactor:2}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('http://tauri.localhost/',r=>r.fulfill({contentType:'text/html; charset=utf-8',body:'<meta charset="utf-8"><style>body{background:#f7f3ed;font:14px "Microsoft YaHei",sans-serif;margin:0;color:#694832}#root,#room{width:min(400px,calc(100vw - 24px));margin:12px auto;padding:12px;box-sizing:border-box;background:#fff8e9;border-radius:16px}</style><div id="root"></div><div id="room"></div>'}));await page.goto('http://tauri.localhost/');
await page.addScriptTag({content:'(()=>{'+runtime+'})()'});
await page.addScriptTag({content:`window.calls=[];window.emit=async()=>{};
const {createApp,createBaseVNode:e,createTextVNode:Tt,ref:y,openBlock:i,createElementBlock:m}=__vue;
const Oe=()=>{},ps=async()=>({}),__wtCheckShortcutConflict=()=>{};
const o=[],R=handler=>handler;
async function ue(event){calls.push(event)}
${[...modules.values()].join('\n')}
${prefix.join('\n')}
createApp({render:()=>(i(),m('div',null,[(${renderPanel})]))}).mount('#root');
const Er={class:'only-show-self'},${roomProps}=['checked','onChange'],s={onlyShowSelf:true};
const t={},p=()=>()=>"仅显示自己",S=String,b=[],v=(type,checked)=>ue({type,checked});
${roomRestore}
const __wtPlacement=__wtRoomPositions.settings(y,ue);
createApp({render:()=>${room}}).mount('#room');`});
if(v104)await page.addStyleTag({content:fs.readFileSync('dist/upstream-1.0.4/index-BbF1ZWW_.css','utf8')});
await page.locator('#root').screenshot({path:path.join(out,'settings-overview.png')});
const input=page.locator('[data-wt-section="input"]');
assert.equal(await input.locator('input:visible').count(),0);
await input.locator('summary').first().click();
assert.equal(await input.locator('input[readonly]:visible').count(),3);
const assertSections=async()=>{
 const ids=await page.locator('#root .panel-content > [data-wt-section]').evaluateAll(cards=>cards.map(card=>card.dataset.wtSection));
 assert.deepEqual(ids,sectionIds);
 assert.equal(await input.evaluate(card=>card.open),true);
};
await input.getByRole('button',{name:'手柄',exact:true}).click();
await assertSections();
await input.getByRole('button',{name:'不显示',exact:true}).click();
await assertSections();
await input.getByRole('button',{name:'26 字母键',exact:true}).click();
await assertSections();
await input.getByText('表情快捷键（6 个槽位）',{exact:true}).click();
assert.equal(await input.locator('input[readonly]:visible').count(),9);
await input.getByText('表情快捷键（6 个槽位）',{exact:true}).click();
await page.getByLabel('用气泡显示输入').check();
await assertSections();
assert.equal(await page.evaluate(()=>localStorage.getItem('wuwatappo-input-bubbles-v1')),'1');
assert.equal(await page.getByLabel('映射位置').count(),0);
await page.getByLabel('用气泡显示输入').uncheck();
await assertSections();
const roomKey=page.getByRole('textbox',{name:'联机仅显示自己',exact:true});
assert.equal(await roomKey.inputValue(),'未设置');
await roomKey.focus();
await page.keyboard.press('F5');
assert(await page.evaluate(()=>__wtKeys.error.value&&__wtKeys.message.value.includes('冲突')));
await roomKey.click();
await page.keyboard.press('Control+Shift+F6');
assert.equal(await page.evaluate(()=>__wtKeys.draft.value.roomOnlySelf),'Ctrl+Shift+F6');
await page.getByRole('button',{name:'保存快捷键',exact:true}).click();
assert.equal(await page.evaluate(()=>__wtHotkeys.read().roomOnlySelf),'Ctrl+Shift+F6');
await page.getByLabel('映射位置').selectOption('left');
assert.equal(await page.evaluate(()=>localStorage.getItem('wuwatappo-mapping-position-v1')),'left');
assert.equal(await input.evaluate(n=>n.open),true);
await page.getByRole('button',{name:'自动开箱：已关闭'}).click();
assert.equal(await page.getByRole('button',{name:'自动开箱：已开启'}).getAttribute('aria-pressed'),'true');
await page.getByRole('button',{name:'本地点击数 +10000',exact:true}).dblclick();
assert.equal(await page.evaluate(()=>calls.filter(x=>x.type==='boost-local-clicks').length),1);
await page.getByLabel('仅显示自己',{exact:true}).uncheck();
await page.getByRole('button',{name:'恢复显示全部'}).click();
await page.getByLabel('联机桌宠排列').selectOption('vertical');
assert.deepEqual(await page.evaluate(()=>calls.slice(-3)),[
 {type:'set-only-show-self',checked:false},{type:'set-room-members-visibility',visible:true},{type:'set-room-placement',mode:'vertical'}
]);
await page.locator('[data-wt-section="desktop"] summary').first().click();
await page.addScriptTag({content:fs.readFileSync('patches/monitor-preference.js','utf8').replace(/export /g,'')});
await page.evaluate(async()=>{window.stopMonitorUi=await mountDefaultMonitorSettings({root:document.getElementById('wt-monitor-settings'),list:async()=>[{name:'DISPLAY1',position:{x:0,y:0},size:{width:1920,height:1080},scaleFactor:1},{name:'DISPLAY2',position:{x:-2560,y:0},size:{width:2560,height:1440},scaleFactor:1.25}],listen:async()=>()=>{},emit:async()=>{}})});
if(v104){
 await page.locator('[data-wt-section="maintenance"] summary').first().click();
 await page.addScriptTag({content:fs.readFileSync('patches/update-ui.js','utf8').replaceAll('export function ','function ')});
 await page.evaluate(()=>{
  let downloadSource='github';window.lastSourceRequest=null;
  window.fetch=async(url,opts)=>({ok:true,json:async()=>{
   const path=url.split('/update/')[1];
   if(path==='status')return {state:'idle',downloadSource};
   if(path.startsWith('source/')){window.lastSourceRequest=[opts.method,opts.headers['X-Wuwa-Update']];downloadSource=path.split('/')[1];return {accepted:true}}
   throw Error('Unexpected update request: '+url);
  }});
  window.updateSettings=mountHelperUpdate(()=>{},()=>{});
 });
 const sourceSelect=page.getByRole('combobox',{name:'更新下载源'});
 await sourceSelect.selectOption('gh-proxy');
 await page.getByText('加速失败时改用 GitHub').waitFor({state:'visible'});
 assert.deepEqual(await page.evaluate(()=>window.lastSourceRequest),['POST','1']);
 await page.evaluate(()=>{window.updateSettings.stop();window.updateSettings=mountHelperUpdate(()=>{},()=>{})});
 await page.waitForFunction(()=>document.querySelector('#wt-us select').value==='gh-proxy');
 await page.locator('#wt-us').screenshot({path:path.join(out,'update-source-settings.png')});
}
for(const width of [440,320]){
 await page.setViewportSize({width,height:1000});
 const overflow=await page.locator('button:visible,input:visible,select:visible').evaluateAll(nodes=>nodes.filter(n=>{const r=n.getBoundingClientRect();return r.left<0||r.right>innerWidth}).map(n=>n.textContent));
 assert.deepEqual(overflow,[],`Controls fit at ${width}px`);
}
await page.locator('#root').screenshot({path:path.join(out,'settings-preview.png')});
assert.deepEqual(errors,[]);
console.log('PASS: bundled Vue disclosures, mapping and shortcut persistence, room actions, and 320/440px bounds');
}finally{await browser.close()}})().catch(e=>{console.error(e.stack);process.exitCode=1});

