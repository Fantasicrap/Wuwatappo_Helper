// Offline UI smoke test. Use the same Vue runtime and artwork lookup IDs as the atlas.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {catalog,atlas}=require('./fixtures/wardrobe-catalog.json');
const root=path.resolve(__dirname,'..'),version=require('../package.json').releaseVersion;
const migration=path.join(root,'dist/migration-'+version);
const common=fs.readFileSync(path.join(migration,'index-BelNnexT.js'),'utf8');
const settings=fs.readFileSync(path.join(migration,'index-Gk2CevxF.js'),'utf8');
assert(settings.includes('props:__wu105_46509,user:__wu105_812.userInfo'));
const runtime=require('./vue-runtime-fixture.cjs')(common,['createVNode']);
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
  await page.addScriptTag({content:'(()=>{'+runtime+'})()'});
  await page.addScriptTag({content:[code('panel-layout.js'),code('theme.js'),code('inventory-share.js'),code('local-wardrobe.js'),code('postcard.js'),code('room-history-core.js'),code('room-history-ui.js')].join('\n')});
  await page.addScriptTag({content:`
   const catalog=${JSON.stringify(catalog)},rows=${JSON.stringify(atlas.data)};
   const role=rows.find(row=>row.asset_name==='role_1608_1001.png'),part=rows.find(row=>row.asset_name==='accessory_1124.png');
   function resolvePetAssetIdFromAppearanceId(id){return catalog.character_skin_atlas[id]?.height_light_id||catalog.accessory_atlas[id]?.height_light_id||id}
   function resolveAppearanceAssetFileName(id){return (catalog.character_skin[id]||catalog.accessory[id])?.url.split('?')[0].split('/').pop()||''}
   const getUserCharacterAssetId=()=>0,getUserAccessoryAssetId=()=>0;
   const resolveAssetDisplayName=(_,name)=>name.includes('1124')?'测试配件':'测试角色';
   const resolveBagAppearanceImageUrl=(_,row)=>{const image=document.createElement('canvas');image.width=40;image.height=40;const ctx=image.getContext('2d');ctx.fillStyle=row===role?'#135790':'#357913';ctx.fillRect(0,0,40,40);return image.toDataURL()};
   const props={selectedRoleId:resolveAppearanceAssetFileName(resolvePetAssetIdFromAppearanceId(role.asset_id)),selectedPartId:resolveAppearanceAssetFileName(resolvePetAssetIdFromAppearanceId(part.asset_id)),atlasList:rows};
   const model=__wtLocalWardrobe.settings(__vue.ref,()=>{},()=>({props,user:{id:7}}));model.mode.value=true;
   __vue.createApp({render:()=>__wtLocalWardrobe.renderSettings(__vue.createVNode,model)}).mount('#app');
   __wtTheme.mount(document.querySelector('#picker'));
   const rooms=__wtRoomHistoryCore.create();rooms.remember(7,'1001');rooms.remember(7,'1002');
   window.showRooms=()=>openRoomHistory({state:()=>({accountId:7,mode:'idle'}),listen:async()=>()=>{},send:async()=>{}});
  `});
  for(const [theme,word] of [['aemeath','飞行雪绒'],['denia','拉海洛方块'],['phrolova','i弗TV']]){
   await page.locator('[data-wt-theme-option="'+theme+'"]').click();
   assert((await page.locator('.wt-theme-note').innerText()).includes(word));
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
  await page.getByText('桌宠明信片',{exact:true}).click();
  await page.getByLabel('明信片寄语').fill('周五联机见');
  await page.getByRole('button',{name:'生成明信片'}).click();
  await page.getByText('明信片已生成',{exact:true}).waitFor();
  const download=page.waitForEvent('download');await page.getByText('保存 PNG',{exact:true}).click();
  const file=path.join(output,'postcard.png');await (await download).saveAs(file);
  const png=fs.readFileSync(file);assert.equal(png.readUInt32BE(16),800);assert.equal(png.readUInt32BE(20),560);
  const colors=await page.locator('img[alt^="WuwaTappo-Postcard"]').evaluate(img=>{const c=document.createElement('canvas');c.width=800;c.height=560;const ctx=c.getContext('2d');ctx.drawImage(img,0,0);return [[305,200],[605,200]].map(([x,y])=>[...ctx.getImageData(x,y,1,1).data].slice(0,3))});
  assert.deepEqual(colors,[[19,87,144],[53,121,19]]);assert.deepEqual(errors,[]);
  console.log('PASS: room editing/pinning, three theme notes, atlas preview with two images and real PNG download.');
 }finally{await browser.close()}
}
main().catch(error=>{console.error(error);process.exitCode=1});
