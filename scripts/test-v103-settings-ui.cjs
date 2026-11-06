const {fixturePath,target,v104}=require('./upstream-fixtures.cjs');
const fs=require('fs'),assert=require('assert/strict'),{chromium}=require('playwright'),{babelParse,traverse}=require('playwright/lib/transform/babelBundle');
const source=fs.readFileSync(fixturePath('dist/migration-1.0.3.4/index-CiT_jZa7.js'),'utf8'),prefix=[],render=[];
traverse(babelParse(source,'settings.mjs',true),{VariableDeclaration(p){if(p.node.declarations.some(d=>['__wtKeys','__wtBoostUntil'].includes(d.id.name)))prefix.push(source.slice(p.node.start,p.node.end))},FunctionDeclaration(p){if(['__wtBoost','__wtToggle'].includes(p.node.id.name))prefix.push(source.slice(p.node.start,p.node.end))},CallExpression(p){const n=p.node;if(n.callee.type==='MemberExpression'&&['__wtKeyboardUi','__wtHotkeys'].includes(n.callee.object.name)&&['renderSettings','render'].includes(n.callee.property.name))render.push(source.slice(n.start,n.end));if(n.callee.name==='e'&&n.arguments[2]?.type==='ArrayExpression'&&n.arguments[2].elements.some(x=>x?.type==='CallExpression'&&x.arguments[2]?.value==='本地点击数 +10000'))render.push(source.slice(n.start,n.end));if(n.callee.name==='e'&&n.arguments[1]?.properties?.some(p=>p.key?.name==='id'&&p.value?.value==='wt-monitor-settings'))render.push(source.slice(n.start,n.end))}});assert.equal(render.length,4);
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});try{const page=await browser.newPage({viewport:{width:440,height:1000},deviceScaleFactor:2}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('http://tauri.localhost/',r=>r.fulfill({contentType:'text/html; charset=utf-8',body:'<meta charset="utf-8"><style>body{background:#f7f3ed;font:14px "Microsoft YaHei",sans-serif;margin:0}#root{width:400px;margin:12px auto;padding:12px;box-sizing:border-box;background:#fff8e9;border-radius:16px}</style><div id="root"></div>'}));await page.goto('http://tauri.localhost/');
await page.addScriptTag({content:'window.calls=[];window.emit=async()=>{};function y(value){return{value}};function Oe(){};async function ue(e){calls.push(e)};'+fs.readFileSync('patches/hotkeys-core.js','utf8').replace(' const defaults=',' actions.splice(0,3);\n const defaults=').replace('export{__wtHotkeys};','')+fs.readFileSync('patches/keyboard-ui.js','utf8').replace('export {__wtKeyboardUi};','')+';'+prefix.join('\n')+';function e(tag,props={},children=[]){const n=document.createElement(tag);for(const[k,v]of Object.entries(props||{})){if(k==="style")Object.assign(n.style,v);else if(k.startsWith("on"))n.addEventListener(k.slice(2).toLowerCase(),v);else if(k==="value")n.value=v;else if(v!==false&&v!=null)n.setAttribute(k,v===true?"":v)}for(const c of [children].flat(Infinity))if(c!=null)n.append(c instanceof Node?c:document.createTextNode(String(c)));return n};window.draw=()=>document.querySelector("#root").replaceChildren('+render.join(',')+');draw();'});
assert.equal(await page.locator('input[readonly]').count(),9);
await page.getByLabel('用气泡显示输入').check();
assert.equal(await page.evaluate(()=>localStorage.getItem('wuwatappo-input-bubbles-v1')),'1');
await page.getByLabel('用气泡显示输入').uncheck();
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
await page.getByRole('button',{name:'映射位置：下方',exact:true}).click();await page.evaluate(()=>draw());assert(await page.getByRole('button',{name:'映射位置：左侧',exact:true}).isVisible());await page.getByRole('button',{name:'本地点击数 +10000',exact:true}).click();await page.getByRole('button',{name:'本地点击数 +10000',exact:true}).click();assert.equal(await page.evaluate(()=>calls.filter(x=>x.type==='boost-local-clicks').length),1);
await page.addScriptTag({content:fs.readFileSync('patches/monitor-preference.js','utf8').replace(/export /g,'')});
await page.evaluate(async()=>{window.stopMonitorUi=await mountDefaultMonitorSettings({root:document.getElementById('wt-monitor-settings'),list:async()=>[{name:'DISPLAY1',position:{x:0,y:0},size:{width:1920,height:1080},scaleFactor:1},{name:'DISPLAY2',position:{x:-2560,y:0},size:{width:2560,height:1440},scaleFactor:1.25}],listen:async()=>()=>{},emit:async()=>{}})});
if(v104){
 await page.addStyleTag({content:fs.readFileSync('dist/upstream-1.0.4/index-BbF1ZWW_.css','utf8')});
 await page.addScriptTag({content:fs.readFileSync('patches/update-ui.js','utf8').replaceAll('export function ','function ')});
 await page.evaluate(()=>{
  const root=document.createElement('div');root.id='wt-us';document.querySelector('#root').append(root);
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
 await page.locator('#wt-us').screenshot({path:require('path').join(process.env.WUWA_TEST_DISTRIBUTION_DIR||'dist/migration-'+target,'update-source-settings.png')});
}
const overflow=await page.locator('button,input,select').evaluateAll(nodes=>nodes.filter(n=>{const r=n.getBoundingClientRect();return r.left<0||r.right>innerWidth}).map(n=>n.textContent));assert.deepEqual(overflow,[]);await page.locator('#root').screenshot({path:require('path').join(process.env.WUWA_TEST_DISTRIBUTION_DIR||'dist/local-1.0.3.4','settings-preview.png')});assert.deepEqual(errors,[]);console.log('PASS: nine shortcuts fit, only-self shortcut records and warns on conflict, position persists and boost is throttled');}finally{await browser.close()}})().catch(e=>{console.error(e.stack);process.exitCode=1});

