const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {pathToFileURL}=require('url'),{chromium}=require('playwright'),{createCanvas,loadImage}=require('@napi-rs/canvas');
const out=path.resolve(process.env.WUWA_TEST_DISTRIBUTION_DIR||'dist/halo-depth-1.0.3.3');
async function pixels(buffer){const img=await loadImage(buffer),canvas=createCanvas(img.width,img.height),ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);return ctx.getImageData(0,0,img.width,img.height).data}
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 try{
  const page=await browser.newPage({viewport:{width:940,height:950}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.join(out,'互动效果预览.html')).href);
  await page.waitForFunction(()=>window.models?.length===6&&[...document.querySelectorAll('.scene>img')].every(n=>n.complete&&n.naturalWidth));
  await page.evaluate(async()=>{
   document.body.style.background='transparent';
   for(const n of document.querySelectorAll('.scene,.card'))n.style.background='transparent';
   localStorage.setItem(__wtPetFun.key,JSON.stringify({master:true,happyEnding:true,happyAnimation:true,happyFlowers:false,happyBubble:false,happyTears:false}));
   for(const m of models){m.part.value='3bbc0e3c-7c7a-4ab1-8fe8-581cf65bab67.png';m.fun.appearanceChanged();m.fun.input('keyboard','occlusion',true)}
   await tick();
  });
  await page.waitForFunction(()=>[...document.querySelectorAll('.scene>img')].every(n=>n.complete&&n.naturalWidth));
  await page.waitForTimeout(260);
  await page.evaluate(()=>{for(const a of document.getAnimations()){a.pause();a.currentTime=300}});
  const order=await page.locator('.scene').evaluateAll(hosts=>hosts.map(host=>({back:Number(getComputedStyle(host.querySelector('.wt-happy-effects-back')).zIndex),body:Number(getComputedStyle(host.querySelector('.body')).zIndex),front:Number(getComputedStyle(host.querySelector('.wt-happy-effects')).zIndex)})));
  for(const row of order){assert(row.back<row.body);assert(row.front>row.body)}
  const show=async which=>{await page.evaluate(which=>{for(const n of document.querySelectorAll('.wt-happy-halo-back'))n.style.visibility=which==='rear'||which==='both'?'visible':'hidden';for(const n of document.querySelectorAll('.wt-happy-halo-front'))n.style.visibility=which==='front'||which==='both'?'visible':'hidden'},which)};
  const capture=async()=>{const result=[];for(let i=0;i<6;i++)result.push(await pixels(await page.locator('#scene-'+i).screenshot({omitBackground:true})));return result};
  await show('none');const base=await capture();
  await show('rear');const rear=await capture();
  await show('front');const front=await capture();
  const rows=[];let frontOverlap=0;
  for(let i=0;i<6;i++){
   let opaquePixels=0,rearChangedOpaque=0,rearVisibleOutside=0,frontChangedOpaque=0;
   for(let p=0;p<base[i].length;p+=4){
    const difference=(a,b)=>Math.max(Math.abs(a[p]-b[p]),Math.abs(a[p+1]-b[p+1]),Math.abs(a[p+2]-b[p+2]));
    if(base[i][p+3]===255){opaquePixels++;if(difference(base[i],rear[i])>2)rearChangedOpaque++;if(difference(base[i],front[i])>2)frontChangedOpaque++}
    if(base[i][p+3]===0&&rear[i][p+3]>4)rearVisibleOutside++;
   }
   assert(opaquePixels>1000);assert.equal(rearChangedOpaque,0,'Rear halo must not repaint opaque character pixels, series '+i);assert(rearVisibleOutside>20,'Rear halo remains visible around transparent edges, series '+i);
   frontOverlap+=frontChangedOpaque;rows.push({series:1001+i,opaquePixels,rearChangedOpaque,rearVisibleOutside,frontChangedOpaque});
  }
  assert(frontOverlap>20,'Front halo must be able to pass in front of the hands/body');
  await show('both');
  await page.evaluate(()=>{document.body.style.background='#efece4';for(const n of document.querySelectorAll('.card'))n.style.background='#fff9ee';for(const n of document.querySelectorAll('.scene'))n.style.background='radial-gradient(ellipse at 48% 55%,#d8e7e9 0,#f5efdf 70%)'});
  await page.locator('#scene-1').screenshot({path:path.join(out,'HE光环遮挡预览.png')});
  await page.evaluate(()=>models.forEach(m=>m.fun.appearanceChanged()));
  assert.equal(await page.locator('.wt-happy-halo,.wt-happy-halo-back,.wt-happy-effects-back').count(),0,'Reset removes both depth layers');
  await page.evaluate(()=>dispose());assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(out,'halo-occlusion-verification.json'),JSON.stringify({passed:true,realOfficialArtUsed:true,sixSeries:true,pixelComparison:true,frontOverlap,rows,hardwareTested:false},null,2));
  console.log('PASS: six official skins; rear halo leaves opaque character pixels unchanged, shows through transparent edges, front halo overlays hands, and both layers clean up');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
