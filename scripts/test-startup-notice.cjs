const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const {chromium}=require('playwright'),{babelParse,traverse}=require('playwright/lib/transform/babelBundle');
const dir='dist/migration-1.0.3.3',common=fs.readFileSync(path.join(dir,'index-CuzHFfJW.js'),'utf8'),main=fs.readFileSync(path.join(dir,'index-pp8VWaUF.js'),'utf8'),settings=fs.readFileSync(path.join(dir,'index-CiT_jZa7.js'),'utf8');
let about=fs.readFileSync(path.join(dir,'index-BEWn23m-.js'),'utf8'),boot,footer,click;
traverse(babelParse(main,'main.mjs',true),{CallExpression(p){const n=p.node;if(n.callee.name==='js'&&n.arguments[0]?.type==='ArrowFunctionExpression'&&main.slice(n.start,n.end).includes('main_mount_failed'))boot=main.slice(n.arguments[0].start,n.arguments[0].end)}});
assert(boot?.includes('if(!await __wtNotice.confirm())'));
traverse(babelParse(settings,'settings.mjs',true),{VariableDeclarator(p){const n=p.node;if(n.id.name==='Ue'&&settings.slice(n.start,n.end).includes('helper_disclaimer'))footer=settings.slice(n.init.arguments[0].start,n.init.arguments[0].end)},FunctionDeclaration(p){if(p.node.id.name==='ct'&&settings.slice(p.node.start,p.node.end).includes('helper-disclaimer'))click=settings.slice(p.node.start,p.node.end)}});
assert(footer&&click);const footerContext={B:{value:'zh'},d:[],a:()=>'',No:()=> '关于 WuwaTappo',Lt:'app://about',as:'app://oss',__wtNotice:{open:async()=>{footerContext.opens++},original:async()=>{footerContext.originals++}},opens:0,originals:0};vm.createContext(footerContext);vm.runInContext('this.links=('+footer+')();'+click.replaceAll('import.meta.url','"http://notice.test/"')+';this.click=ct;',footerContext);
assert.deepEqual(Array.from(footerContext.links,x=>x.label),['关于 WuwaTappo','免责说明']);
const cuts=[];traverse(babelParse(about,'about.mjs',true),{ImportDeclaration(p){cuts.push([p.node.start,p.node.end,''])},ExportNamedDeclaration(p){cuts.push([p.node.start,p.node.end,'window.aboutComponent=aa;'])}});for(const [start,end,text]of cuts.sort((a,b)=>b[0]-a[0]))about=about.slice(0,start)+text+about.slice(end);
const runtime=require('./vue-runtime-fixture.cjs')(common,['defineComponent','computed','watch','onMounted','onUnmounted','createVNode','createStaticVNode','withDirectives','vModelCheckbox','withModifiers','unref']);
let notice;traverse(babelParse(common,'common.mjs',true),{VariableDeclaration(p){if(p.node.declarations.some(d=>d.id.name==='__wtNotice'))notice=common.slice(p.node.start,p.node.end)}});assert(notice,'Missing bundled disclaimer module');
assert(notice.includes(JSON.stringify(fs.readFileSync('DISCLAIMER.txt','utf8').replace(/^\uFEFF/,''))),'Bundled and distributed disclaimer must match');
const output=process.env.WUWA_TEST_DISTRIBUTION_DIR||'dist/startup-notice-1.0.3.3';fs.mkdirSync(output,{recursive:true});
(async()=>{
 const timedCalls=[],timedListeners=new Set(),timedStorage=new Map(),timed={localStorage:{getItem:k=>timedStorage.get(k)??null,setItem:(k,v)=>timedStorage.set(k,v),removeItem:k=>timedStorage.delete(k)},listen:async(name,fn)=>{timedListeners.add(fn);return()=>timedListeners.delete(fn)},emit:async()=>{},invoke:async name=>timedCalls.push(name),setTimeout:fn=>fn(),console:{warn(){}}};
 vm.createContext(timed);vm.runInContext(notice+';this.api=__wtNotice;',timed);
 assert.equal(await timed.api.confirm(),false,'A missing About WebView must cancel startup after the readiness deadline');assert.deepEqual(timedCalls,[],'Readiness timeout cannot call the potentially blocking native window opener');assert.equal(timedListeners.size,0,'Timeout releases result and readiness listeners');assert.equal(timedStorage.size,0,'Timeout cannot leave a pending disclaimer request');
 const event={preventDefault(){},stopPropagation(){}};await footerContext.click(event,'app://helper-disclaimer');await footerContext.click(event,'app://about');assert.equal(footerContext.opens,1);assert.equal(footerContext.originals,1);
 let resolve;const calls=[],ctx={__wtNotice:{confirm:()=>new Promise(r=>resolve=r)},Ct:async command=>calls.push(command)};vm.createContext(ctx);vm.runInContext('this.boot='+boot.replaceAll('import.meta.url','"http://notice.test/"'),ctx);const blocked=ctx.boot();assert.deepEqual(calls,[]);resolve(false);await blocked;assert.deepEqual(calls,['exit_app'],'Declining cannot run the normal mount body');
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 try{
  const context=await browser.newContext({viewport:{width:700,height:820}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const css=fs.readFileSync('dist/upstream-1.0.3/index-CaMAtNXT.css','utf8');
  await context.route('http://notice.test/**',r=>r.fulfill({contentType:'text/html',body:'<meta charset="utf-8"><style>body{margin:0;--font-bold:"Microsoft YaHei";font-family:"Microsoft YaHei"}'+css+'</style><div id="app"></div>'}));await page.goto('http://notice.test/');
  await page.addScriptTag({content:'(()=>{'+runtime+'})()'});
  await page.addScriptTag({content:`const {ref,onMounted,onUnmounted,createVNode}=__vue;window.listeners=new Map();window.noticeClosed=0;window.noticeOpens=0;window.closeHandlers=[];window.opened=[];
   async function listen(name,fn){const list=listeners.get(name)||new Set;list.add(fn);listeners.set(name,list);return()=>list.delete(fn)}
   async function emit(name,payload){for(const fn of listeners.get(name)||[])await fn({payload})}
   async function invoke(name){if(name==='open_about_window'){noticeOpens++;await emit('about-open',{})}else if(name==='close_about_window')noticeClosed++}
   async function openUrl(url){opened.push(url)}
   window.noticeWindow={setTitle:async()=>{},startDragging:async()=>{},onCloseRequested:async fn=>{closeHandlers.push(fn);return()=>closeHandlers.splice(closeHandlers.indexOf(fn),1)}};
   ${notice}
   window.notice=__wtNotice;localStorage.setItem('about_startup_skip','1');`});
  // Reproduce the real native startup ordering: main mounts before the hidden
  // About WebView. The native open command must never run during that interval.
  await page.evaluate(()=>{window.answer='pending';notice.confirm().then(v=>answer=v)});
  await page.waitForTimeout(180);assert.equal(await page.evaluate(()=>noticeOpens),0,'Cannot open a native About window before its component is ready');
  await page.evaluate(()=>emit('wt-helper-notice-ready',{id:'previous-launch'}));
  await page.waitForTimeout(120);assert.equal(await page.evaluate(()=>noticeOpens),0,'An unrelated or stale ready event cannot release the startup gate');
  await page.addScriptTag({content:`(()=>{const {defineComponent:T,ref:S,computed:f,watch:x,onMounted:j,onUnmounted:E,openBlock:i,createElementBlock:l,Fragment:n,createBaseVNode:e,toDisplayString$1:p,unref:h,createCommentVNode:w,createStaticVNode:d,withDirectives:D,vModelCheckbox:I,withModifiers:P,normalizeClass:U}=__vue;
   const q=()=>noticeWindow,G=()=>({locale:S('zh'),t:k=>k,te:()=>false}),B=listen,R=()=>invoke('close_about_window'),m=()=>localStorage.getItem('about_startup_skip')==='1',F=v=>localStorage.setItem('about_startup_skip',v?'1':'0'),O=()=> '关于 WuwaTappo',L=(component,props)=>{for(const[k,v]of props)component[k]=v;return component};
   ${about}
   window.aboutApp=__vue.createApp(window.aboutComponent);aboutApp.mount('#app');})()`});
  await page.waitForFunction(()=>closeHandlers.length>0);
  await page.getByRole('heading',{name:'免责说明',exact:true}).waitFor();const start=page.getByRole('button',{name:'同意并启动',exact:true});assert(await start.isDisabled());assert.equal(await page.getByRole('checkbox').isChecked(),false);
  assert.equal(await page.evaluate(()=>listeners.get('wt-helper-notice-ready').size),0,'Startup handshake listener is released after readiness');
  const text=await page.locator('.about-page').innerText();for(const needle of ['https://github.com/Fantasicrap/Wuwatappo_Helper','DanielToyama','库洛','完全开源','免费','退款','仅供娱乐','创作者概不负责'])assert(text.includes(needle),needle);
  await page.setViewportSize({width:500,height:700});assert.equal(await page.locator('.about-page').evaluate(n=>n.scrollWidth>n.clientWidth+1),false,'Long GitHub links wrap inside the official dialog');await page.screenshot({path:path.join(output,'startup-notice-small-preview.png')});await page.setViewportSize({width:700,height:820});
  await page.getByRole('checkbox',{name:'我已阅读上述内容，后续不再提示',exact:true}).check();assert(await start.isEnabled());assert.equal(await page.evaluate(()=>localStorage.getItem('wuwatappo-helper-notice-accepted-v1')),null,'Checking without confirmation must not persist');await page.screenshot({path:path.join(output,'startup-notice-preview.png')});await start.click();await page.waitForFunction(()=>answer===true&&noticeClosed>0&&document.querySelector('.about-title')?.textContent!=='免责说明');
  const opensBefore=await page.evaluate(()=>noticeOpens);assert.equal(await page.evaluate(()=>notice.confirm()),true);assert.equal(await page.evaluate(()=>noticeOpens),opensBefore,'Subsequent startup skips the native window opener');
  const restarted=await page.context().newPage();await restarted.goto('http://notice.test/');await restarted.addScriptTag({content:notice+';window.notice=__wtNotice;'});assert.equal(await restarted.evaluate(()=>notice.confirm()),true,'Persisted consent also skips startup in a fresh WebView without any native bridge calls');await restarted.close();
  await page.evaluate(()=>{localStorage.removeItem('wuwatappo-helper-notice-accepted-v1');answer='pending';notice.confirm().then(v=>answer=v)});await page.getByRole('heading',{name:'免责说明',exact:true}).waitFor();assert.equal(await page.getByRole('checkbox').isChecked(),false,'A new user must still confirm');await page.getByRole('checkbox').check();await page.getByRole('button',{name:'退出',exact:true}).click();await page.waitForFunction(()=>answer===false&&document.querySelector('.about-title')?.textContent!=='免责说明');assert.equal(await page.evaluate(()=>localStorage.getItem('wuwatappo-helper-notice-accepted-v1')),null,'Closing after checking cannot remember consent');
  await page.evaluate(()=>notice.open());await page.getByRole('heading',{name:'免责说明',exact:true}).waitFor();assert.equal(await page.getByRole('checkbox').count(),0);await page.getByRole('button',{name:'关闭',exact:true}).last().click();await page.evaluate(()=>notice.original());await page.getByRole('heading',{name:'关于Wuwa Tappo',exact:true}).waitFor();
  await page.evaluate(()=>{answer='pending';notice.confirm().then(v=>answer=v)});await page.getByRole('heading',{name:'免责说明',exact:true}).waitFor();await page.evaluate(async()=>{for(const fn of closeHandlers)await fn({preventDefault(){}})});await page.waitForFunction(()=>answer===false);
  assert.deepEqual(errors,[]);console.log('PASS: first startup requires consent, confirmed reading persists across WebViews and skips later startup prompts; cancel never persists; original About/settings entry and native readiness gate preserved');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
