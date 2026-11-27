const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const code=file=>fs.readFileSync(path.join(root,'patches',file),'utf8').replace(/^export \{.*?\};?$/gm,'').replace('export async function openRoomHistory','async function openRoomHistory');
const output=path.join(root,'dist/player-ui-checks');fs.mkdirSync(output,{recursive:true});
async function main(){
 const browser=await chromium.launch({executablePath:process.env.WUWA_TEST_BROWSER||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:420,height:680}}),errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  await page.route('http://127.0.0.1:48642/**',route=>{
   if(route.request().url().endsWith('ui.js'))return route.fulfill({contentType:'text/javascript',body:'export const loadThemePacks=async()=>({aemeath:{effects:["player"]},denia:{effects:["blocks"]},phrolova:{effects:["phrolova"]}})'});
   return route.fulfill({contentType:'text/html',body:'<meta charset="utf-8"><div id="app"></div><div id="picker"></div>'});
  });
  await page.goto('http://127.0.0.1:48642/fixture');
  await page.addScriptTag({content:[code('panel-layout.js'),code('theme.js'),code('room-history-core.js'),code('room-history-ui.js')].join('\n')});
  await page.addScriptTag({content:`
   __wtTheme.mount(document.querySelector('#picker'));
   const rooms=__wtRoomHistoryCore.create();rooms.remember(7,'1001');rooms.remember(7,'1002');
   window.showRooms=()=>openRoomHistory({state:()=>({accountId:7,mode:'idle'}),listen:async()=>()=>{},send:async()=>{}});
  `});
  for(const [theme,word] of [['aemeath','飞行雪绒'],['denia','拉海洛方块'],['phrolova','i弗TV']]){
   await page.locator('[data-wt-theme-option="'+theme+'"]').click();
   assert((await page.locator('.wt-theme-note').innerText()).includes(word));
   if(theme==='denia')await page.screenshot({path:path.join(output,'theme-hint.png')});
  }
  await page.locator('[data-wt-theme-option="default"]').click();assert(await page.locator('.wt-theme-note').isHidden());
  await page.evaluate(()=>{void showRooms()});
  const row=page.locator('[data-room="1001"]');await row.getByText('备注',{exact:true}).click();
  await page.getByLabel('房间备注').fill('周五联机');await page.getByText('保存备注',{exact:true}).click();
  await row.getByText('置顶',{exact:true}).click();
  assert.equal(await page.locator('.wt-history-row').first().getAttribute('data-room'),'1001');
  assert.equal(await row.locator('.wt-history-id').innerText(),'周五联机');
  await page.screenshot({path:path.join(output,'rooms.png')});
  await page.getByLabel('关闭历史房间').click();
  assert.deepEqual(errors,[]);
  console.log('PASS: room editing and pinning, hints for all three themes.');
 }finally{await browser.close()}
}
main().catch(error=>{console.error(error);process.exitCode=1});
