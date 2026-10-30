const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{chromium}=require('playwright');
const source=fs.readFileSync('patches/monitor-preference.js','utf8').replace(/export /g,''),out=path.resolve(process.env.WUWA_TEST_DISTRIBUTION_DIR||'dist/monitor-preview-1.0.3.1');fs.mkdirSync(out,{recursive:true});
const settings=fs.readFileSync('dist/migration-1.0.3.1/index-CiT_jZa7.js','utf8'),panel=fs.readFileSync('dist/migration-1.0.3.1/index-pp8VWaUF.js','utf8');
assert(settings.includes('id:"wt-monitor-settings"')&&settings.includes('m.mountDefaultMonitorSettings('));assert(panel.indexOf('window.__wtMainReady=1')>panel.indexOf('ta=await wv(gp),na=await bv(kp)'));
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 try{
  const page=await browser.newPage({viewport:{width:440,height:380},deviceScaleFactor:2}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('http://tauri.localhost/',r=>r.fulfill({contentType:'text/html; charset=utf-8',body:'<meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;padding:18px;background:#f5f0e9;font:14px "Microsoft YaHei",sans-serif}#wt-monitor-settings{background:#fff8e9;padding:16px;border-radius:18px}</style><div id="wt-monitor-settings"></div>'}));await page.goto('http://tauri.localhost/');
  await page.addScriptTag({content:source});
  await page.evaluate(async()=>{
   window.__wtMainReady=true;window.displays=[{name:'DISPLAY1',position:{x:0,y:0},size:{width:1920,height:1080},scaleFactor:1},{name:'DISPLAY2',position:{x:-2560,y:0},size:{width:2560,height:1440},scaleFactor:1.25}];window.originalDisplays=displays.slice();window.here=displays[0];window.confirmMove=true;window.events=new Map();
   const listen=async(name,fn)=>{if(!events.has(name))events.set(name,new Set());events.get(name).add(fn);return()=>events.get(name).delete(fn)},emit=async(name,payload)=>{for(const fn of events.get(name)||[])await fn({payload})},list=async()=>displays;
   window.helper=await installDefaultMonitor({list,current:async()=>here,move:async key=>{if(confirmMove)here=displays.find(m=>monitorPreference.key(m)===key);return confirmMove},listen,emit});
   window.stopSettings=await mountDefaultMonitorSettings({root:document.querySelector('#wt-monitor-settings'),list,listen,emit});
  });
  const select=page.getByRole('combobox',{name:'默认显示器'}),save=page.getByRole('button',{name:'保存并切换'}),status=page.getByRole('status');
  assert.equal(await select.locator('option').count(),4);
  await select.selectOption('monitor:-2560,0,2560,1440');await save.click();await page.waitForFunction(()=>document.querySelector('[role=status]').textContent.includes('已保存默认'));
  assert.equal(await page.evaluate(()=>here.name),'DISPLAY2');assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem(monitorPreference.storageKey)).name),'DISPLAY2');
  for(const width of [320,390,440]){await page.setViewportSize({width,height:380});const overflow=await page.locator('select,button').evaluateAll(nodes=>nodes.filter(n=>{const r=n.getBoundingClientRect();return r.left<0||r.right>innerWidth}).map(n=>n.textContent));assert.deepEqual(overflow,[])}
  await page.screenshot({path:path.join(out,'monitor-settings.png')});
  await page.evaluate(async()=>{displays=[originalDisplays[0]];await helper.refresh()});await page.getByRole('button',{name:'刷新',exact:true}).click();assert((await status.textContent()).includes('默认显示器未连接'));assert.equal(await select.inputValue(),'missing');assert.equal(await page.evaluate(()=>here.name),'DISPLAY1');assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem(monitorPreference.storageKey)).name),'DISPLAY2');
  await page.screenshot({path:path.join(out,'monitor-disconnected.png')});
  await page.evaluate(async()=>{displays=originalDisplays.slice();await helper.refresh()});await page.getByRole('button',{name:'刷新',exact:true}).click();assert.equal(await select.inputValue(),'monitor:-2560,0,2560,1440');assert.equal(await page.evaluate(()=>here.name),'DISPLAY2');
  await page.evaluate(()=>confirmMove=false);await select.selectOption('primary');await save.click();await page.waitForFunction(()=>document.querySelector('[role=status]').textContent.includes('未确认切换成功'));assert.equal(await save.isEnabled(),true);assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem(monitorPreference.storageKey)).name),'DISPLAY2');
  await page.evaluate(()=>confirmMove=true);await select.selectOption('auto');await save.click();await page.waitForFunction(()=>document.querySelector('[role=status]').textContent.includes('已取消指定'));assert.equal(await page.evaluate(()=>here.name),'DISPLAY2');
  await page.evaluate(()=>{stopSettings();helper.dispose()});assert.equal(await page.evaluate(()=>[...events.values()].reduce((n,s)=>n+s.size,0)),0);assert.deepEqual(errors,[]);
  console.log('PASS: monitor settings -> main handler, save and apply, offline screen indicator, reconnect, failed-save recovery, 320/390/440px layout and disposal');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
