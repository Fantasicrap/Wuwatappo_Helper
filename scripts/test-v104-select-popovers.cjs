const fs=require('node:fs');
const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require('playwright');
const {fixturePath,target}=require('./upstream-fixtures.cjs');

const common=fs.readFileSync(fixturePath('dist/migration-1.0.3.4/index-CuzHFfJW.js'),'utf8');
const css=fs.readFileSync(fixturePath('dist/upstream-1.0.3/index-C3fG-hsi.css'),'utf8');
const start=common.indexOf('function __wtMountSelectPopovers(');
const boot="if(typeof document!=='undefined')__wtMountSelectPopovers(document);";
const stop=common.indexOf(boot,start);
const themeStart=common.indexOf('const __wtTheme=');
const themeEnd=common.indexOf('export {__wtTheme,__wtRegions};',themeStart);
assert(start>=0&&stop>start&&themeStart>=0&&themeEnd>themeStart);

const options=['全部','经典系列','团团转系列','创作者合作系列 · ARE','CHUBBY系列','像素系列',
 '特别联动','周年纪念','飞行雪绒','最后一项'];
const items=options.map((label,index)=>'<div class="select-option-item" data-value="'+index+'"><span class="select-option-item-text">'+label+'</span></div>').join('');
function select(type,label,list=true){
 return '<div class="select-item select-item--'+type+'"><div class="select-input">'+label+
  '</div><div class="select-option">'+(list?'<div class="select-option-list">'+items+'</div>':items)+'</div></div>';
}

(async()=>{
 const out=process.env.WUWA_TEST_DISTRIBUTION_DIR||path.join('dist','migration-'+target);
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,ignoreDefaultArgs:['--hide-scrollbars'],
  executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 try{
  const page=await browser.newPage({viewport:{width:880,height:520},deviceScaleFactor:1.5});
  await page.route('http://tauri.localhost/',r=>r.fulfill({contentType:'text/html; charset=utf-8',body:
   '<meta charset="utf-8"><div class="module-panel"><div class="module-content"><div class="panel-content"><div class="spacer"></div>'+
   '<div class="atlas-select">'+select('series','系列')+select('role','角色')+select('rarity','稀有度')+select('language','语言',false)+
   '</div></div></div></div>'}));
  await page.route('http://127.0.0.1:48642/ui.js',r=>r.abort());
  await page.goto('http://tauri.localhost/');
  await page.addStyleTag({content:css});
  await page.addStyleTag({content:`
   body{background:#f7f3ed;font:16px "Microsoft YaHei",sans-serif}
   .module-panel{inset:12px;width:auto;height:auto;padding:0;background-image:none}
   .module-content{margin:8px 8px 8px 96px;width:auto;height:auto;flex:1;min-width:0}
   .panel-content{margin:22px 8px 0;height:290px}
   .spacer{height:235px}.atlas-select{justify-content:space-between}
  `});
  await page.evaluate(()=>{
   const all=[...document.querySelectorAll('.select-item')];
   document.addEventListener('click',event=>{
    const trigger=event.target.closest('.select-input'),item=event.target.closest('[data-value]');
    const select=trigger?.parentElement;
    const wasOpen=select?.classList.contains('select-item--open');
    for(const node of all)node.classList.remove('select-item--open');
    if(select&&!wasOpen)select.classList.add('select-item--open');
    if(item)item.closest('.select-item').querySelector('.select-input').textContent=item.textContent;
   });
  });
  const series=page.locator('.select-item--series'),original=series.locator('.select-option');
  await series.locator('.select-input').click();
  const clipped=await original.evaluate(menu=>{
   const r=menu.getBoundingClientRect(),clip=menu.closest('.panel-content').getBoundingClientRect();
   return r.top<clip.bottom&&r.bottom>clip.bottom&&!menu.contains(document.elementFromPoint(r.left+30,clip.bottom+16));
  });
  assert(clipped,'The fixture must reproduce the original clipped menu');
  await page.addScriptTag({content:common.slice(start,stop+boot.length)});
  await page.addScriptTag({content:'const __wtPanelLayout={extend(){}};'+common.slice(themeStart,themeEnd)});
  await page.mouse.click(25,25);
  for(const type of ['series','role','rarity','language']){
   const select=page.locator('.select-item--'+type),trigger=select.locator('.select-input');
   const menu=select.locator('.select-option');
   await trigger.click();
   await menu.locator('xpath=self::*[@data-wt-select-popup]').waitFor({state:'visible'});
   const metrics=await menu.evaluate(menu=>{
    const b=menu.getBoundingClientRect(),a=menu.parentElement.querySelector('.select-input').getBoundingClientRect();
    return {top:b.top,bottom:b.bottom,above:b.bottom<a.top,inside:b.left>=0&&b.right<=innerWidth&&b.top>=0&&b.bottom<=innerHeight,
     hit:menu.contains(document.elementFromPoint(b.left+20,b.bottom-8)),topLayer:menu.matches(':popover-open')};
   });
   assert(metrics.inside&&metrics.hit&&metrics.topLayer,type+' menu must escape the clipped content and remain interactive');
   if(type==='series'||type==='role')assert(metrics.above,type+' should open above when space below is tight');
   const last=menu.locator('[data-value="9"]');
   await last.scrollIntoViewIfNeeded();await last.click();
   assert.equal(await trigger.textContent(),'最后一项');
   assert.equal(await menu.isVisible(),false);
  }
  await page.evaluate(()=>__wtTheme.set('aemeath'));
  await page.setViewportSize({width:650,height:440});
  await series.locator('.select-input').click();
  await original.waitFor({state:'visible'});
  const list=original.locator('.select-option-list');
  await list.evaluate(node=>node.scrollTop=0);
  await list.hover();
  await page.mouse.wheel(0,800);
  await page.waitForFunction(()=>{
   const list=document.querySelector('.select-item--series .select-option-list');
   return list.scrollTop>0&&list.scrollTop+list.clientHeight>=list.scrollHeight-1;
  });
  await page.screenshot({path:path.join(out,'select-popover-aemeath-preview.png')});
  await page.keyboard.press('Escape');
  assert.equal(await original.isVisible(),false);
  await page.evaluate(()=>{
   __wtTheme.set('default');
   document.querySelector('.spacer').style.height='24px';
  });
  await series.locator('.select-input').click();
  await original.waitFor({state:'visible'});
  const menuBox=await original.boundingBox(),triggerBox=await series.locator('.select-input').boundingBox();
  assert(menuBox.y>triggerBox.y+triggerBox.height,'The dropdown should open below when it fits');
  await page.screenshot({path:path.join(out,'select-popover-default-preview.png')});
  await series.evaluate(node=>node.remove());
  await page.locator('.select-item--rarity .select-input').click();
  await page.locator('.select-item--rarity .select-option[data-wt-select-popup]').waitFor({state:'visible'});
  console.log('PASS: clipped menu reproduced, all four popup types fit, last options can be selected, and Escape closes');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
