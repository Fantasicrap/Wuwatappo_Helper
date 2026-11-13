const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium}=require('playwright');

(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 try{
  const page=await browser.newPage({viewport:{width:640,height:480}});
  await page.setContent('<div class="pet-dock"><div class="pet-dock-content"><div class="cat-wrap"></div><div class="pet-info-container"><div class="pet-toolbar"></div></div></div></div><style>.pet-dock{position:absolute;left:160px;top:120px}.cat-wrap{height:100px;width:130px}.pet-info-container,.pet-toolbar{position:relative;height:28px;width:130px}</style>');
  await page.addScriptTag({content:fs.readFileSync('patches/snowfluff-player.js','utf8')});
  await page.evaluate(()=>__wtSnowfluffPlayer.create(document.body,()=>{},async()=>({helperSongs:Array.from({length:20},(_,i)=>({name:'Track '+i,url:'song.mp3'}))})));
  await page.locator('.wt-snowfluff-star').click();
  await page.locator('[data-track]').click();
  const list=page.locator('[data-track-list]'),top=()=>list.evaluate(node=>node.scrollTop);
  await list.hover();await page.mouse.wheel(0,60);assert.equal(await top(),60);
  await list.evaluate(node=>node.scrollTop=0);
  const box=await list.boundingBox();
  await page.mouse.move(box.x+25,box.y+75);await page.mouse.down();await page.mouse.move(box.x+25,box.y+18,{steps:6});await page.mouse.up();
  assert.ok(await top()>50);assert.ok(await list.isVisible(),'Dragging must not select a track');
  await list.locator('[data-track-index="4"]').click();
  assert.equal(await list.isVisible(),false);assert.equal(await page.locator('[data-track] span').textContent(),'Track 4');
  console.log('PASS: wheel and drag scrolling, no accidental track change, click selection');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
