const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium}=require('playwright');

(async()=>{
 const browser=await chromium.launch({headless:true,ignoreDefaultArgs:['--hide-scrollbars'],executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 try{
  const page=await browser.newPage({viewport:{width:640,height:480}});
  await page.setContent('<div class="pet-dock"><div class="pet-dock-content"><div class="cat-wrap"></div><div class="pet-info-container"><div class="pet-toolbar"></div></div></div></div><style>.pet-dock{position:absolute;left:160px;top:120px}.cat-wrap{height:100px;width:130px}.pet-info-container,.pet-toolbar{position:relative;height:28px;width:130px}</style>');
  await page.addScriptTag({content:fs.readFileSync('patches/snowfluff-player.js','utf8').replace('export {__wtPlayerHit};','')});
  const regions=fs.readFileSync('patches/theme.js','utf8').split('const __wtTheme=')[0];
  await page.addScriptTag({content:regions});
  await page.evaluate(()=>__wtSnowfluffPlayer.create(document.body,()=>{},async()=>({helperSongs:Array.from({length:20},(_,i)=>({name:'Track '+i,url:'song.mp3'}))})));
  await page.locator('.wt-snowfluff-star').click();
  assert.deepEqual(await page.evaluate(()=>{
   const dock=document.querySelector('.pet-dock'),panel=dock.querySelector('.wt-snowfluff'),identify=el=>el===panel?'player':el.className;
   return ['visual','input'].map(mode=>__wtRegions(dock,mode,identify).includes('player'));
  }),[true,true],'The entire popup must be included in both desktop window masks');
  await page.locator('[data-track]').click();
  const list=page.locator('[data-track-list]'),top=()=>list.evaluate(node=>node.scrollTop);
  await list.hover();await page.mouse.wheel(0,60);assert.equal(await top(),60);
  assert.equal(await list.evaluate(node=>getComputedStyle(node).scrollbarWidth),'none');
  assert.equal(await page.locator('[data-track-rail], [data-track-thumb]').count(),0);
  await list.locator('[data-track-index="4"]').click();
  assert.equal(await list.isVisible(),false);assert.equal(await page.locator('[data-track] span').textContent(),'Track 4');
  await page.evaluate(()=>{
   window.__wtPlayerPoint=(x,y)=>({x:(x-800)/1.5,y:(y-400)/1.5});
   window.scrollFrames=[];window.scrollCalls=0;
   window.fetch=async url=>{
    if(!url.includes('/player-scroll?after='))throw Error('Unexpected route');
    scrollCalls++;
    const frame=scrollFrames.shift();
    if(frame)window.currentScrollFrame={...frame,events:[]};
    return {ok:true,json:async()=>frame??window.currentScrollFrame??{available:true,seq:0,events:[]}};
   };
  });
  await page.locator('[data-track]').click();
  await list.evaluate(node=>node.scrollTop=0);
  await page.waitForFunction(()=>window.scrollCalls>=2);
  const nativeBox=await list.boundingBox();
  const send=(seq,x,y,delta)=>page.evaluate(({seq,x,y,delta})=>{
   const physical={x:800+x*1.5,y:400+y*1.5};
   scrollFrames.push({available:true,seq,events:[{seq,...physical,delta}]});
  },{seq,x,y,delta});
  const wheelAt={x:nativeBox.x+30,y:nativeBox.y+20};
  await page.mouse.move(wheelAt.x,wheelAt.y);
  await page.mouse.wheel(0,60);
  assert.equal(await top(),60,'The DOM wheel still works with the Windows input feed connected');
  await send(1,wheelAt.x,wheelAt.y,-120);
  await page.waitForFunction(()=>window.currentScrollFrame?.seq===1);
  await page.waitForTimeout(65);
  assert.equal(await top(),60,'The same notch reported by both channels scrolls once');
  await list.evaluate(node=>node.scrollTop=0);
  await send(2,wheelAt.x,wheelAt.y,-120);
  await page.waitForFunction(()=>document.querySelector('[data-track-list]').scrollTop===120);
  await list.evaluate(node=>node.scrollTop=0);
  await send(3,wheelAt.x,wheelAt.y,-120);
  await page.waitForFunction(()=>window.currentScrollFrame?.seq===3);
  await page.mouse.wheel(0,60);
  await page.waitForTimeout(65);
  assert.equal(await top(),60,'A Windows notch arriving first yields to its DOM counterpart');
  await send(4,nativeBox.x-5,wheelAt.y,-120);
  await page.waitForFunction(()=>window.currentScrollFrame?.seq===4);
  await page.waitForTimeout(65);
  assert.equal(await top(),60,'Desktop wheel outside the list must not scroll the player');
  await send(5,wheelAt.x,wheelAt.y,120);
  await page.waitForFunction(()=>document.querySelector('[data-track-list]').scrollTop===0);
  await page.locator('.wt-snowfluff').screenshot({path:'dist/snowfluff-overlay-scroll-check.png'});
  await page.locator('[data-close]').click();
  assert.equal(await page.locator('.wt-snowfluff').isVisible(),false);
  assert.equal(await page.locator('.wt-snowfluff-star').getAttribute('aria-expanded'),'false');
  const calls=await page.evaluate(()=>window.scrollCalls);
  await page.waitForTimeout(120);assert.equal(await page.evaluate(()=>window.scrollCalls),calls);
  console.log('PASS: popup list scrolls directly by wheel in both directions, with no visible scrollbar');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
