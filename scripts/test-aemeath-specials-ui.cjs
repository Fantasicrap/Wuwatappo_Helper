const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 try{
  const page=await browser.newPage({viewport:{width:640,height:640}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*',route=>route.fulfill({body:'<meta charset=utf-8><div class="pet-dock"><div class="cat-stack"></div></div><div id="settings"></div><style>.pet-dock{position:absolute;left:0;top:0}.cat-stack{position:relative;width:180px;height:180px}</style>',contentType:'text/html'}));
  await page.goto('http://tauri.localhost/');
  await page.clock.install({time:new Date('2026-11-13T12:00:00')});
  await page.clock.pauseAt(new Date('2026-11-13T12:00:01'));
  await page.addScriptTag({content:fs.readFileSync('patches/aemeath-mech.js','utf8')+';window.api=__wtAemeathMech;'});
  await page.evaluate(()=>{
   window.settingsKey='wuwatappo-aemeath-mech-v1';window.calls=0;window.roll=.01;window.role={id:1210};
   localStorage.setItem(settingsKey,JSON.stringify({enabled:true,orbit:false,sword:false,laser:false,flash:false,wings:false}));
   window.make=()=>{window.mech=api.create({root:()=>document.querySelector('.cat-stack'),role:()=>role,activity:()=>{},random:()=>{calls++;return roll},load:async()=>({helperThemeAssets:{aemeath:{mech:'data:image/gif;base64,R0lGODlhAQABAAAAACw='}}})});mech.start()};
   window.tap=(token='keyboard:Q')=>{mech.input(token.split(':')[0],token,true);mech.input(token.split(':')[0],token,false)};
   window.update=changes=>{localStorage.setItem(settingsKey,JSON.stringify({...JSON.parse(localStorage.getItem(settingsKey)),...changes}));window.dispatchEvent(new StorageEvent('storage',{key:settingsKey}))};
   api.mount(document.querySelector('#settings'));make();
  });
  const sprite=page.locator('.wt-aemeath-mech'),kind=()=>sprite.getAttribute('data-special');
  await sprite.waitFor();assert.equal(await page.evaluate(()=>mech.inputActive()),true,'Greatsword alone requests input');
  await page.evaluate(()=>{document.querySelector('.pet-dock').style.left='230px';mech.sync()});
  await page.evaluate(()=>tap());assert.equal(await kind(),null,'Exactly 1% does not win');
  await page.evaluate(()=>{roll=.0099;mech.input('mouse','mouse:left',true);mech.input('mouse','mouse:left',true)});
  assert.equal(await kind(),'greatsword');assert.equal(await page.evaluate(()=>calls),2,'A repeated down must not draw again');
  await page.evaluate(()=>mech.input('mouse','mouse:left',false));
  assert.ok(await page.evaluate(()=>{const node=document.querySelector('.wt-mech-special'),box=node.getBoundingClientRect();return box.left>=-9&&box.top>=-9&&box.right<=innerWidth+9&&box.bottom<=innerHeight+9}));
  const greatsword=page.locator('.wt-mech-special--greatsword');
  assert.equal(await greatsword.getAttribute('data-side'),'right');
  assert.ok(await greatsword.evaluate(node=>parseFloat(node.style.left)<node.parentElement.offsetWidth/2),'Right-side mech drops the blade on the left');
  await greatsword.evaluate(svg=>{
   const blade=svg.querySelector('.wt-mech-greatblade');
   const animation=blade.getAnimations()[0];
   animation.pause();
   for(const time of [960,1480,1824,2440]){
    animation.currentTime=time;
    const tip=()=>new DOMPoint(150,231).matrixTransform(blade.getScreenCTM());
    const mirrored=tip(),center=svg.getBoundingClientRect().x+svg.getBoundingClientRect().width/2;
    svg.dataset.side='left';const normal=tip();svg.dataset.side='right';
    if(Math.abs(normal.x+mirrored.x-2*center)>1||Math.abs(normal.y-mirrored.y)>1)throw Error('Greatsword keyframe is not mirrored');
   }
  });
  await page.clock.runFor(3300);assert.equal(await kind(),null);
  await page.evaluate(()=>{mech.dispose();make()});await sprite.waitFor();await page.evaluate(()=>tap('controller:0'));
  assert.equal(await kind(),null,'Recreating the app keeps the persisted cooldown');assert.equal(await page.evaluate(()=>calls),2);
  await page.clock.fastForward(596699);await page.evaluate(()=>tap());assert.equal(await kind(),null);
  await page.evaluate(()=>{const dock=document.querySelector('.pet-dock');dock.style.left='460px';mech.sync();dock.style.left='230px';mech.sync()});
  await page.clock.runFor(1);await page.evaluate(()=>tap());assert.equal(await kind(),'greatsword','Cooldown expires at 10 minutes exactly');
  assert.equal(await greatsword.getAttribute('data-side'),'left');
  assert.ok(await greatsword.evaluate(node=>parseFloat(node.style.left)>node.parentElement.offsetWidth/2),'Left-side mech drops the blade on the right');
  await page.evaluate(()=>update({greatsword:false,laser:true}));assert.equal(await kind(),null,'Disabling removes the running effect');
  await page.evaluate(()=>{document.querySelector('.pet-dock').style.left='230px';mech.sync()});
  await page.evaluate(()=>mech.input('controller','controller:0',true));await page.clock.runFor(1199);assert.equal(await kind(),null);
  await page.evaluate(()=>mech.input('controller','controller:0',false));await page.clock.runFor(2);assert.equal(await kind(),null);
  await page.evaluate(()=>mech.input('keyboard','keyboard:Q',true));await page.clock.runFor(1200);assert.equal(await kind(),'laser');
  async function checkSweep(direction){
   const beam=page.locator('.wt-mech-laser-ray');
   const sample=()=>beam.evaluate(node=>{
    const line=node.children[3],value=name=>Number(line.getAttribute(name));
    return {x:value('x2'),y:value('y2'),dx:value('x2')-value('x1'),dy:value('y2')-value('y1'),opacity:Number(node.getAttribute('opacity'))};
   });
   await page.clock.runFor(1220);const start=await sample();
   await page.clock.runFor(300);const middle=await sample();
   await page.clock.runFor(325);const end=await sample();
   assert.ok([start,middle,end].every(point=>point.opacity>.7&&point.dy>20),'The visible beam points downward throughout');
   assert.ok(Math.abs(start.dx)<3&&direction*middle.dx>25&&direction*end.dx>direction*middle.dx,'The beam starts vertically and sweeps toward the opposite side');
   assert.ok(Math.abs(start.y-end.y)<1&&Math.abs(middle.y-end.y)<1,'The tip traces the horizontal edge of the triangle');
   assert.ok(direction*(end.x-90)>65&&end.y<90,'The sweep ends in the opposite upper corner of the pet');
   await page.clock.runFor(1020);assert.equal(await kind(),null);
  }
  await checkSweep(1);
  await page.evaluate(()=>{mech.input('keyboard','keyboard:Q',false);mech.input('keyboard','keyboard:Q',true)});
  await page.clock.runFor(1300);assert.equal(await kind(),null,'Laser has its own cooldown');
  await page.evaluate(()=>{mech.input('keyboard','keyboard:Q',false);document.querySelector('.pet-dock').style.left='0px';mech.dispose();make()});
  await sprite.waitFor();assert.equal(await sprite.getAttribute('data-facing'),'left');
  await page.evaluate(()=>{document.querySelector('.pet-dock').style.left='230px';mech.sync()});
  await page.evaluate(()=>mech.input('keyboard','keyboard:Q',true));await page.clock.runFor(1200);assert.equal(await kind(),'laser');
  await checkSweep(-1);
  await sprite.evaluate(node=>{
   const originalFacing=node.dataset.facing;
   const sword=node.querySelector('.wt-mech-sword'),grip=node.querySelector('.wt-mech-grip');
   const spriteBox=node.getBoundingClientRect(),center=spriteBox.left+spriteBox.width/2;
   for(const [move,duration] of [['sweep',1550],['spin',1950]]){
    node.dataset.sword=move;
    const animations=node.getAnimations({subtree:true}).filter(animation=>animation.animationName);
    for(const animation of animations)animation.pause();
    for(const fraction of [.22,.39,.5,.62,.76]){
     for(const animation of animations)animation.currentTime=duration*fraction;
     const pose=facing=>{
      node.dataset.facing=facing;
      const matrix=sword.getScreenCTM();
      const tip=new DOMPoint(108,15).matrixTransform(matrix);
      const handle=new DOMPoint(17.6,15).matrixTransform(matrix);
      const hand=grip.getBoundingClientRect();
      if(Math.hypot(handle.x-hand.x,handle.y-hand.y)>1.5)throw Error(move+' lost the grip at '+fraction);
      return tip;
     };
     const left=pose('left'),right=pose('right');
     if(Math.abs(left.x+right.x-2*center)>1.5||Math.abs(left.y-right.y)>1.5)throw Error(move+' keyframe is not mirrored');
    }
   }
   delete node.dataset.sword;
   node.dataset.facing=originalFacing;
  });
  await page.evaluate(()=>{role={id:1608};mech.sync()});assert.equal(await sprite.count(),0);
  await page.clock.runFor(21000);assert.equal(await page.locator('.wt-mech-special').count(),0);
  assert.deepEqual(errors,[]);
  console.log('PASS: special animation triggers, 1% boundary, cooldown persistence and expiry, hold/release, settings and role changes');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
