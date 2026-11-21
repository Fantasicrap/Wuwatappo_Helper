export const helperDenia = (() => {
 const key='wuwatappo-denia-effects-v1',scope=':root[data-wt-theme="denia"]';
 const hold=800,handCooldown=8000,danceCooldown=9000,streakTime=1400,idleDelay=10000;
 const css=`
§{
 --wt-ui-text:#493561;--wt-ui-muted:#635471;--wt-ui-border:#c9b8dc;--wt-ui-divider:#dacde9;
 --wt-ui-field:#fbf7ff;--wt-ui-card-fill:#f9f4fdda;--wt-mech-check:#8568aa;
 --wt-ui-surface:#f7f1fd;--wt-ui-hover:#eae0f6;--wt-ui-rail:#cfc0e54f;
 --wt-ui-accent:#9676bc;--wt-ui-accent-fill:#e0cef6;--wt-ui-focus:#6f509a;--wt-ui-decor:#ba9dd8;
 --wt-synthesis-border:#b39acb;--wt-synthesis-bubble:linear-gradient(145deg,#fbf7ff,#e9dcf6);
 --wt-synthesis-text:#493561;--wt-synthesis-shadow:#49356128;
 --wt-tide-count-bg:#f9f3ff;--wt-tide-count-text:#573c76;
 --wt-ui-raster:grayscale(1) brightness(.96) sepia(.38) saturate(2.65) hue-rotate(195deg);
}
§ .module-panel{
 background-color:#cfc0e5;
 background-image:linear-gradient(110deg,#bdacd552,#e4d7f24d 49%,#9c96c319),
 var(--wt-custom-background,var(--wt-theme-bg,radial-gradient(ellipse at 82% 32%,#c5d1ed,#d9c8ea 65%)));
 background-position:center 34%;background-size:cover;background-repeat:no-repeat;
 border-color:#aa92c4;box-shadow:0 4px #aa92c4
}
§ .tab-bar{background:linear-gradient(165deg,#e8dff3a8,#bbaad171);border-radius:42px 0 0 42px}
§ .module-content{background:#e5d9f231;border-color:#d1c3e0}
§ .module-content__bg{background:linear-gradient(100deg,#f6eefb7d,#eaddf638 48%,#e2d7fa12);border-color:#dacde8}
§ .module-content__bg:before{background:none}
§ .module-content__bg:after{background:none}
§ .tab-btn__label,§ .tab-btn--active:not(:last-of-type) .tab-btn__label{color:#392754;text-shadow:0 1px 4px #fff}
§ .tab-btn:hover:not(:last-of-type){background:#f3ebfad0}
§ .tab-btn--active:not(:last-of-type){background:#fcf8ffee!important;border-color:#bfaada;box-shadow:0 3px #cab9e0}
§ .tab-btn__icon{filter:var(--wt-ui-raster)}
§ .tab-btn--active:not(:last-of-type) .tab-btn__icon{filter:var(--wt-ui-raster) brightness(.83) saturate(1.3)}
§ .setting-item{background:#f9f4fdd9}
§ .wt-ui-feature,§ .wt-ui-card,§ .wt-ui-room-tools{background:var(--wt-ui-card-fill);border-color:var(--wt-ui-border)}
§ .wt-ui-card--primary{background:#f2e9faeb;border-color:#c6b0df}
§ .wt-ui-button--primary,§ .wt-ui-button[aria-pressed=true]{background:#e2d4f3;border-color:#aa90c9;color:#4d356b}
§ .wt-theme-option{background:#fcf8ff;border-color:#d6c6e5;color:#513966}
§ .wt-theme-option[aria-pressed=true]{border-color:#9577b6;box-shadow:0 0 0 3px #c8b0ea77}
§ .wt-theme-option[aria-pressed=true] b:after{background:#e8d8fa}
§ .wt-theme-option:focus-visible{outline-color:#7657a0}
§ .wt-denia-settings{border:1px solid var(--wt-ui-border);border-radius:12px;padding:9px 10px;background:var(--wt-ui-card-fill)}
§ .wt-denia-settings[hidden]{display:none}
§ .wt-denia-settings label{display:flex;align-items:center;gap:7px;margin:6px 0}
§ .wt-denia-settings h4{margin:0 0 8px}
§ .wt-denia-settings small{display:block;color:var(--wt-ui-muted);margin-top:5px;line-height:1.45}
§ input[type=checkbox],§ input[type=radio]{accent-color:#8266a9}
§ .select-item .select-option,§ .wt-ui-actions select{color:#4d3966}
§ .pet-info .text{background:#f9f3ff;color:#573c76}
§ .pet-toolbar{background-image:var(--wt-denia-toolbar,none);background-color:var(--wt-denia-toolbar-fallback,transparent);border-radius:0 32px 32px 0}
§:not([data-wt-denia-toolbar]) .pet-toolbar{--wt-denia-toolbar-fallback:#f9f3ff}
§:not([data-wt-denia-toolbar]) .pet-toolbar:after{content:'≡';position:absolute;inset:0 11px 0 auto;display:grid;align-items:center;color:#573c76;font-size:21px;pointer-events:none}
§ .wt-denia-star{position:absolute;inset:0 auto 0 0;z-index:1;width:23px;height:100%;padding:0;border:0;border-radius:12px;background:none;cursor:pointer;pointer-events:auto}
§ .wt-denia-star:hover{background:#b5a0dc55}
§ .wt-denia-star:focus-visible{outline:2px solid #7659a1}
§:not([data-wt-denia-toolbar]) .wt-denia-star:before{content:'';display:block;margin:auto;width:16px;height:16px;background:#8970ad;clip-path:polygon(50% 0,64% 36%,100% 50%,64% 64%,50% 100%,36% 64%,0 50%,36% 36%)}
§ .reward-countdown__text{color:#573c76}
§ .reward-countdown__bar{stroke:#c4aade}
§ .reward-countdown .reward-countdown__progress{filter:drop-shadow(0 0 2px #b7a0da)}
§ .about-root,§ .oss-notice-root,§ .app-update-overlay__panel,§ .role-switch-emote-overlay__panel{background-image:linear-gradient(140deg,#fcf8ff,#e6dbf4)}
§ .wt-keyboard-plate:after{background:#d1dff6;border-color:#9cafe0}
§ .wt-input-ui kbd.wt-key-on{background:#dec6f5;color:#492c70;border-color:#a47ac9;box-shadow:0 0 5px #d8c7f2,0 0 0 1px #c1c9ee}
§ .wt-pad-board #wt-pad-body stop:first-child{stop-color:#fbf6ff}
§ .wt-pad-board #wt-pad-body stop:last-child{stop-color:#dfd1ef}
§ .wt-pad-board #wt-pad-grip stop:first-child{stop-color:#f2e8fb}
§ .wt-pad-board #wt-pad-grip stop:last-child{stop-color:#c6b4dc}
§ .wt-pad-board [fill="#d7b38c"],§ .wt-pad-board [fill="#c6a581"]{fill:#ac94c3}
§ .wt-pad-board [stroke="#a67c58"],§ .wt-pad-board [stroke="#d5b18a"],§ .wt-pad-board [stroke="#d1ad83"],§ .wt-pad-board [stroke="#c9a47d"]{stroke:#957bad}
§ .wt-pad-board [stroke="#fff9e9"]{stroke:#f9f3ff}
§ .wt-pad-board [fill="#ead3ad"],§ .wt-pad-board [fill="#f5e2bf"]{fill:#e6dcf4}
§ .wt-pad-board [fill="#b6c49b"],§ .wt-pad-board [fill="#dbc7a5"]{fill:#b9c8ed}
§[data-wt-denia-bubble] .wt-input-bubble{
 padding:4px 10px;border-color:#9a83b5;border-radius:20px;background:radial-gradient(ellipse at 19% 11%,#fff,#f9f3ff 37%,#e0d5f6 84%);
 color:#513b70;box-shadow:0 3px 10px #6c539a33,inset 0 -2px 2px #b9c8ed;animation:wt-denia-bubble .95s ease-out both;
}
§[data-wt-denia-bubble] .wt-input-bubble:before{content:'';position:absolute;right:-5px;top:-4px;width:7px;height:7px;border:1px solid #ad9acd;border-radius:50%;background:#f9f3ff;box-shadow:inset 0 -1px #b8c9ef}
§[data-wt-denia-bubble] .wt-input-bubble:after{display:none}
@keyframes wt-denia-bubble{0%{opacity:0;transform:translate(-50%,-37%) scale(.77)}23%,80%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(-50%,-67%) scale(.96)}}
@media(prefers-reduced-motion:reduce){§ .wt-input-bubble{animation:none}}
§ .wt-denia-fx{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:13}
§ .wt-denia-cake{position:absolute;left:3%;bottom:8%;width:clamp(22px,20%,74px);margin:0;padding:0;border:0;background:none;filter:drop-shadow(0 2px 2px #59416a4a);pointer-events:none;z-index:12}
§ .wt-denia-cake:enabled{pointer-events:auto;cursor:pointer}
§ .wt-denia-cake:focus-visible{outline:2px solid #7659a1;outline-offset:2px;border-radius:8px}
§ .wt-denia-cake canvas{display:block;width:100%;height:auto;pointer-events:none}
§ .wt-denia-line{position:absolute;top:9%;right:4%;max-width:49%;box-sizing:border-box;padding:3% 4%;border:1px solid #b19aca;border-radius:13px 13px 5px 13px;background:#faf3ffee;color:#54396f;box-shadow:0 2px 6px #684a902f;font:600 clamp(8px,calc(var(--pet-base-size,200px)*.055),16px)/1.25 "Microsoft YaHei",sans-serif;overflow-wrap:anywhere;text-align:center;z-index:14;pointer-events:none}
§ .wt-denia-messenger{position:absolute;top:50%;left:50%;width:clamp(22px,calc(var(--pet-base-size,200px)*.23),54px);aspect-ratio:1;filter:drop-shadow(0 0 1px #fff) drop-shadow(0 2px 2px #38224db3);pointer-events:none;z-index:2}
§ .wt-denia-knock{position:absolute;top:50%;left:50%;width:12px;aspect-ratio:1;border:1.5px solid #fff1b5;border-radius:50%;box-shadow:0 0 4px #ffecc5;pointer-events:none;z-index:1}
§ .wt-denia-dialogue{display:grid;gap:5px;margin:7px 0;padding:8px 0;border-block:1px solid var(--wt-ui-divider)}
§ .wt-denia-dialogue[hidden],§ .wt-denia-dialogue [hidden]{display:none}
§ .wt-denia-binding{display:flex;flex-wrap:wrap;gap:6px}
§ .wt-denia-dialogue :is(select,input){min-width:0;max-width:100%;padding:4px 6px;border:1px solid var(--wt-ui-border);border-radius:7px;background:var(--wt-ui-field);color:var(--wt-ui-text);font:inherit}
`.split('§').join(scope);

 const defaults={bubble:true,hand:false,paper:false,cake:true,candle:true,report:true,quotes:false,idle:true};
 const sampleLines=['我是在想题。','就打了个小盹。','再玩一局方块？','你才在摸鱼呢。','那块放左边试试。','蛋糕可以留一块吗？','嘘，等泡泡飘过去。','今天也来游戏室？','你刚刚什么都没看见。','那我陪你坐一会儿。','看吧，还是同一组。','你慢慢来，我等着。'];
 const geometry=()=>window.dispatchEvent(new CustomEvent('pet-toast-geometry-changed',{detail:true}));
 const motionReduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 function read(){
  try{
   const saved=JSON.parse(localStorage.getItem(key)||'{}');
   return Object.fromEntries(Object.entries(defaults).map(([name,value])=>[name,typeof saved?.[name]==='boolean'?saved[name]:value]));
  }catch{return {...defaults}}
 }
 function sync(){document.documentElement.toggleAttribute('data-wt-denia-bubble',read().bubble)}
 const dialogueKey='wuwatappo-denia-dialogue-v1';
 function loadDialogue(dialogue){
  try{return dialogue.readOne(JSON.parse(localStorage.getItem(dialogueKey)||'{}'))}
  catch{return dialogue.readOne()}
 }
 function mountDialogue(root,dialogue,changed){
  const field=document.createElement('div');field.className='wt-denia-dialogue';field.hidden=true;
  field.innerHTML='<label>日常台词模式 <select><option value="random">随机台词</option><option value="mapped">按键台词</option></select></label><div class="wt-denia-binding" hidden><select aria-label="达妮娅触发按键"><option value="">选择按键</option></select><input type="text" maxlength="40" aria-label="达妮娅自定义台词" placeholder="输入台词"><button type="button" class="wt-ui-button">保存绑定</button><button type="button" class="wt-ui-button">移除绑定</button></div><output role="status"></output>';
  const [mode,keySelect]=field.querySelectorAll('select'),binding=field.querySelector('.wt-denia-binding');
  const text=field.querySelector('input'),[save,remove]=field.querySelectorAll('button'),status=field.querySelector('output');
  for(const [label,items] of dialogue.choices()){
   const group=document.createElement('optgroup');group.label=label;
   for(const [value,name] of items)group.append(new Option(name,value));
   keySelect.append(group);
  }
  function update(){
   const config=loadDialogue(dialogue);
   mode.value=config.mode;binding.hidden=config.mode!=='mapped';
   text.value=config.lines[keySelect.value]??'';
   text.disabled=save.disabled=!keySelect.value;
   remove.disabled=!config.lines[keySelect.value];
  }
  function write(config,description){
   try{localStorage.setItem(dialogueKey,JSON.stringify(dialogue.readOne(config)));status.textContent=description;changed()}
   catch{status.textContent='台词保存失败。'}
   update();
  }
  mode.onchange=()=>write({...loadDialogue(dialogue),mode:mode.value},'');
  keySelect.onchange=update;
  save.onclick=()=>{
   if(!keySelect.value||!text.value.trim())return;
   const config=loadDialogue(dialogue);
   config.lines[keySelect.value]=text.value;write(config,'已保存这条按键台词。');
  };
  remove.onclick=()=>{
   const config=loadDialogue(dialogue);delete config.lines[keySelect.value];write(config,'已移除这条按键台词。');
  };
  update();root.append(field);
 }
 function mount(root,changed,dialogue){
  root.innerHTML='<h4>达妮娅动效</h4><label><input type="checkbox" data-effect="bubble">拟态泡泡</label><label><input type="checkbox" data-effect="hand">虚质之手</label><label><input type="checkbox" data-effect="paper">剪纸小人</label><label><input type="checkbox" data-effect="cake">生日蛋糕</label><label><input type="checkbox" data-effect="candle">吹蜡烛</label><label><input type="checkbox" data-effect="report">剪纸小人宝箱提醒</label><label><input type="checkbox" data-effect="quotes">日常台词气泡</label><label><input type="checkbox" data-effect="idle">闲置动画</label><small>点蛋糕点亮蜡烛，再点吹灭。宝箱可领取时，剪纸小人会去敲对应图标。</small><small>长按 0.8 秒触发手影，1.4 秒内按下 3 次触发剪纸舞。停止输入 10 秒后，她会吹泡泡或让剪纸小人绕着跳舞。</small>';
  if(dialogue)mountDialogue(root,dialogue,changed);
  root.onchange=event=>{
   const input=event.target,name=input.dataset.effect;
   if(!Object.hasOwn(defaults,name))return;
   try{localStorage.setItem(key,JSON.stringify({...read(),[name]:input.checked}))}
   catch{refresh(root);return}
   changed();
  };
 }
 function refresh(root){
  const cfg=read();
  for(const input of root.querySelectorAll('[data-effect]'))input.checked=cfg[input.dataset.effect];
  root.querySelector('[data-effect=candle]').disabled=!cfg.cake;
  root.querySelector('.wt-denia-dialogue')?.toggleAttribute('hidden',!cfg.quotes);
 }
 function mountGame(open){
  const star=document.createElement('button');
  star.type='button';star.className='wt-denia-star';star.title='拉海洛方块';star.setAttribute('aria-label',star.title);
  const attach=()=>{
   const toolbar=document.querySelector('.pet-info-container .pet-toolbar');
   if(toolbar&&star.parentNode!==toolbar){toolbar.append(star);geometry()}
  };
  star.addEventListener('mousedown',event=>event.stopPropagation());
  star.addEventListener('click',async event=>{
   event.stopPropagation();
   try{await open();star.title='拉海洛方块'}
   catch(error){star.title=error.message||'无法打开小游戏窗口'}
  });
  const observer=new MutationObserver(attach);observer.observe(document.body,{childList:true,subtree:true});attach();
  return ()=>{observer.disconnect();star.remove();geometry()};
 }
 const isDenia=role=>Number(role?.id)===1211||/(?:^|[\\/])role_1211(?:[_\-.]|$)/i.test(role?.name??'');
 const clamp=value=>Math.min(1,Math.max(0,value));
 const phase=(t,a,b)=>clamp((t-a)/(b-a));
 const smooth=n=>n*n*(3-2*n);
 const mix=(a,b,t)=>a+(b-a)*t;
 const openHand='M39 126 C43 113 44 104 39 94 C34 86 25 79 20 68 L9 45 Q5 37 11 36 Q14 35 19 40 L33 56 Q35 59 36 56 C36 50 31 39 28 31 L20 12 Q18 6 22 5 Q27 4 31 11 L46 38 Q49 43 51 39 L49 8 Q49 2 54 2 Q59 2 60 9 L63 34 Q64 40 66 37 L75 15 Q79 8 83 12 Q86 14 83 22 L76 46 Q73 57 76 58 L91 49 Q98 47 99 52 Q98 57 91 65 L81 79 Q75 90 67 97 Q62 105 66 126 Z';
 const closedHand='M38 126 C42 114 43 104 38 94 C30 86 24 79 21 70 L13 55 Q10 47 15 43 Q19 41 24 45 L31 58 Q34 63 37 59 C38 54 33 47 29 42 L26 32 Q24 28 29 24 Q34 20 39 27 L46 41 Q49 47 52 45 L46 28 Q44 21 51 20 Q57 19 60 26 L65 41 Q68 49 70 44 L70 30 Q69 22 75 23 Q83 24 84 32 L83 51 Q82 59 79 64 L87 62 Q94 60 95 66 Q98 70 89 77 L78 87 Q72 91 67 99 Q62 106 66 126 Z';
 const closedCoordinates=closedHand.match(/\d+/g).map(Number);
 function disk(ctx,x,y,r){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2)}
 function fillPath(ctx,shape,color){
  ctx.fillStyle=color;ctx.fill(new Path2D(shape));
 }
 function drawCake(canvas,lit){
  const ctx=canvas.getContext('2d');if(!ctx)return;
  ctx.setTransform(2,0,0,2,0,0);ctx.clearRect(0,0,80,64);ctx.lineWidth=1.6;ctx.lineJoin='round';
  function ellipse(x,y,rx,ry,color){
   ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();
   ctx.strokeStyle='#805876';ctx.stroke();
  }
  ellipse(40,54,37,8,'#e8d8f4');
  function tier(x,y,w,h){
   const edge=new Path2D('M'+x+' '+y+'v'+h+'q'+w/2+' 12 '+w+' 0v-'+h+'z');
   ctx.fillStyle='#ffe1b6';ctx.fill(edge);ctx.strokeStyle='#805876';ctx.stroke(edge);
   ctx.save();ctx.clip(edge);
   ctx.fillStyle='#efa77e';ctx.fillRect(x,y+h*.54,w,3);
   const drips=['M'+x+' '+y,'h'+w,'v5'];
   for(let i=0;i<5;i++)drips.push('q-'+w/10+' '+(i%2?13:9)+' -'+w/5+' '+(i%2?1:-1));
   fillPath(ctx,drips.join(' ')+'z','#fff3ec');ctx.restore();
   ellipse(x+w/2,y,w/2,5.5,'#fff7eb');
  }
  tier(7,38,66,13);tier(17,24,46,12);
  for(const [x,y] of [[14,36],[65,36],[22,23],[53,23]]){
   disk(ctx,x,y,3.5);ctx.fillStyle='#be5c85';ctx.fill();
   disk(ctx,x-1,y-1,1);ctx.fillStyle='#ffdeeb';ctx.fill();
  }
  for(const [x,y] of [[22,38],[60,37],[30,22],[48,22]]){
   ctx.beginPath();ctx.arc(x,y,5,0,Math.PI);ctx.closePath();ctx.fillStyle='#ef9149';ctx.fill();ctx.strokeStyle='#ffd492';ctx.stroke();
  }
  fillPath(ctx,'M37 11h6v13h-6z','#a798d7');
  fillPath(ctx,'M37 18l6-5v3l-6 5z','#e9dcfa');
  if(lit){
   ctx.save();ctx.shadowBlur=6;ctx.shadowColor='#ffcb80';
   fillPath(ctx,'M40 1q7 7 1 9q-6 0-1-9z','#eba457');ctx.restore();
   fillPath(ctx,'M40 5q3 3 1 4q-3 0-1-4z','#fff1ad');
  }
 }
 function paintHands(ctx,t){
  const approach=smooth(phase(t,.03,.46)),bend=smooth(phase(t,.37,.66)),fade=1-smooth(phase(t,.73,1));
  let index=0;
  const outline=new Path2D(openHand.replace(/\d+/g,value=>mix(Number(value),closedCoordinates[index++],bend).toFixed(2)));
  for(const side of [-1,1]){
   const scale=(.35+.48*approach+.13*bend)*(1-.05*(1-fade));
   ctx.save();ctx.globalAlpha=approach*fade;
   ctx.translate(120+side*(96-28*approach-9*bend),135-17*approach+10*bend);
   ctx.rotate(side*(-.38+.16*approach-.08*bend));ctx.scale(-side*scale,scale);ctx.translate(-50,-65);
   const fill=ctx.createLinearGradient(35,110,74,18);
   fill.addColorStop(0,'#211832');fill.addColorStop(.47,'#32275f');fill.addColorStop(1,'#535eb3');
   ctx.fillStyle=fill;ctx.fill(outline);ctx.strokeStyle='#b4a4e8';ctx.lineWidth=1.2;ctx.stroke(outline);
   ctx.clip(outline);
   ctx.strokeStyle='#a9b7ef9c';ctx.lineWidth=.82;
   ctx.stroke(new Path2D('M40 107 Q54 86 50 73 Q47 60 42 54 M52 100 Q64 83 59 75 L57 60 M56 76 Q68 74 73 64 L80 39'));
   if(bend>.08){
    ctx.fillStyle='rgba(24, 15, 47,'+bend*.7+')';
    ctx.fill(new Path2D('M26 50 Q42 57 42 48 Q55 53 56 47 Q69 53 70 46 Q81 50 80 54 Q78 65 66 69 Q45 71 30 61 Z'));
   }
   ctx.fillStyle='#e9ddff';
   for(const [x,y,r] of [[44,76,1],[48,87,.8],[60,73,1],[62,61,.75],[54,45,.7],[72,80,.7]]){disk(ctx,x,y,r);ctx.fill()}
   ctx.restore();
  }
 }
 function paintPaper(ctx,t,orbit=false){
  const step=Math.sin(t*4*Math.PI),lift=Math.abs(Math.sin(t*3*Math.PI));
  const angle=t*4*Math.PI-Math.PI/2,depth=orbit?(Math.sin(angle)+1)/2:1;
  const dancers=[-38,0,38].map((x,i)=>[x+7*step,-12*lift+3*Math.sin(t*4*Math.PI+i)]);
  ctx.save();ctx.globalAlpha=phase(t,0,.12)*(1-smooth(phase(t,.8,1)))*mix(.55,1,depth);
  ctx.translate(120+(orbit?Math.cos(angle)*57:0),orbit?109+Math.sin(angle)*46:55);
  if(orbit)ctx.scale(mix(.63,.82,depth),mix(.63,.82,depth));
  ctx.strokeStyle='#624781';ctx.lineWidth=5;ctx.lineCap='round';
  for(let i=1;i<dancers.length;i++){
   const [lx,ly]=dancers[i-1],[rx,ry]=dancers[i];
   ctx.beginPath();ctx.moveTo(lx+3,ly-3);ctx.quadraticCurveTo((lx+rx)/2,Math.min(ly,ry)-12,rx-3,ry-3);ctx.stroke();
  }
  dancers.forEach(([x,y],i)=>{
   const foot=Math.sin(t*6*Math.PI+i*Math.PI)*6;
   ctx.save();ctx.translate(x,y);ctx.rotate(i===1?-step*.15:step*.16);
   ctx.fillStyle=['#533b71','#74558e','#604579'][i];disk(ctx,0,-15,6.1);ctx.fill();
   ctx.fill(new Path2D('M-4 -9 L4 -9 L8 3 L4 5 L'+(6+foot)+' 14 L'+(1+foot)+' 15 L0 7 L'+(-1+foot)+' 15 L'+(-6+foot)+' 14 L-4 5 L-8 3 Z'));
   if(i!==1){const side=i===0?-1:1;ctx.beginPath();ctx.moveTo(side*3,-6);ctx.lineTo(side*15,-8-step*4*side);ctx.stroke()}
   ctx.restore();
  });
  ctx.restore();
 }
 function paintBubbles(ctx,t){
  for(let i=0;i<9;i++){
   const drift=phase(t,i*.055,i*.055+.49);
   if(drift===0||drift===1)continue;
   const x=144+drift*(40+i%3*7)+Math.sin(drift*6+i)*5,y=132-drift*(72+i%4*10);
   const r=5+(i%3)*3+drift*3;
   ctx.save();ctx.globalAlpha=Math.sin(drift*Math.PI);
   const film=ctx.createRadialGradient(x-r*.32,y-r*.35,1,x,y,r);
   film.addColorStop(0,'#fffaffef');film.addColorStop(.45,'#f5eaff70');film.addColorStop(1,i%2?'#a9ade9e0':'#ae8cd9df');
   disk(ctx,x,y,r);ctx.fillStyle=film;ctx.fill();ctx.strokeStyle='#eee7ff';ctx.lineWidth=1.2;ctx.stroke();ctx.restore();
  }
 }
 function paperFigure(ctx,x,y,size,step=0,opacity=1){
  ctx.save();ctx.globalAlpha=opacity;ctx.translate(x,y);ctx.scale(size,size);
  ctx.rotate(step*.12);ctx.strokeStyle='#4e3765';ctx.lineWidth=2.3;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(-4,-5);ctx.lineTo(-12,-9+step*3);ctx.moveTo(4,-5);ctx.lineTo(12,-7-step*4);ctx.stroke();
  ctx.fillStyle='#82639e';disk(ctx,0,-13,5.5);ctx.fill();ctx.stroke();
  fillPath(ctx,'M-3 -8 H3 L8 4 L5 7 L6 13 H2 L0 8 L-2 13 H-6 L-5 7 L-8 4Z','#795795');
  ctx.fillStyle='#ead8f5';ctx.fillRect(-2,-2,4,1);ctx.restore();
 }
 function paintCandle(ctx,t){
  for(let i=0;i<6;i++){
   const p=phase(t,.02+i*.026,.27+i*.026);
   if(!p||p===1)continue;
   const x=mix(91,31,p),y=mix(145+i*2,161-7*Math.sin(i),p),r=2+p*4;
   ctx.save();ctx.globalAlpha=.78*Math.sin(p*Math.PI);ctx.fillStyle=i%2?'#e0c9f7':'#fff5e1';
   disk(ctx,x,y,r);ctx.fill();ctx.strokeStyle='#fff5ff';ctx.stroke();ctx.restore();
  }
  const p=phase(t,.28,.54);
  if(p>0&&p<1){
   ctx.save();ctx.globalAlpha=Math.sin(Math.PI*p);ctx.fillStyle='#ffe6a2';
   for(let i=0;i<7;i++){const a=i*2.4;disk(ctx,31+Math.cos(a)*p*17,157+Math.sin(a)*p*10-p*9,1.4);ctx.fill()}
   ctx.restore();
  }
  const peek=smooth(phase(t,.30,.51))*(1-smooth(phase(t,.81,1)));
  if(peek)paperFigure(ctx,58,193-12*peek,.77,Math.sin(t*15)*.5,peek);
 }
 function paint(ctx,kind,t){
  ctx.setTransform(2,0,0,2,0,0);ctx.clearRect(0,0,240,220);
  if(kind==='candle'){paintCandle(ctx,t);return}
  if(kind==='idle-bubbles'){paintBubbles(ctx,t);return}
  if(kind==='idle-paper'){paintPaper(ctx,t,true);return}
  const hands=kind==='hand',burst=phase(t,.58,1),ring=phase(t,.01,1),y=hands?106:51;
  ctx.save();
  ctx.globalAlpha=Math.sin(Math.PI*ring)*.75;ctx.strokeStyle='#d2c1ef';ctx.lineWidth=1.5;
  disk(ctx,120,y,(hands?27:15)+ring*(hands?64:50));ctx.stroke();ctx.restore();
  if(hands)paintHands(ctx,t);else paintPaper(ctx,t);
  ctx.save();ctx.globalAlpha=Math.sin(burst*Math.PI)*.85;ctx.fillStyle='#f9eeff';ctx.strokeStyle='#9c82c6';ctx.lineWidth=.8;
  for(let i=0;i<7;i++){
   const a=i*Math.PI*2/7;
   disk(ctx,120+Math.cos(a)*(29+burst*55),y+Math.sin(a)*(19+burst*22),2.7-burst);ctx.fill();ctx.stroke();
  }ctx.restore();
 }
 function createReporter({root,enabled}){
  const cycles=new Map();
  const translate=(x,y,angle=0)=>'translate('+x+'px,'+y+'px) rotate('+angle+'deg)';
  const selector='.reward-anchor';
  function clear(entry){
   entry.travel?.cancel();entry.knock?.remove();
   if(entry.sprite){entry.sprite.remove();geometry()}
   entry.knock=entry.travel=entry.sprite=null;
  }
  function notify(anchor,entry){
   const pet=root()?.getBoundingClientRect(),area=anchor.getBoundingClientRect();
   if(!pet?.width||!area.width)return;
   const sprite=document.createElement('canvas');sprite.className='wt-denia-messenger';sprite.width=sprite.height=68;
   sprite.setAttribute('aria-hidden','true');
   const ctx=sprite.getContext('2d');if(!ctx)return;
   anchor.append(sprite);entry.sprite=sprite;entry.notified=true;
   paperFigure(ctx,34,37,1.8,1);
   const size=sprite.offsetWidth,scale=area.width/(anchor.offsetWidth||area.width);
   const direction=pet.left+pet.width/2<area.left+area.width/2?-1:1;
   const petSide=pet.left+pet.width*(direction<0?.66:.34);
   const startX=(petSide-area.left-area.width/2)/scale-size*.5;
   const startY=(pet.top+pet.height*.68-area.top-area.height/2)/scale-size*.55;
   const endX=direction*(anchor.offsetWidth*.44+size*.34)-size/2,endY=-size*.57;
   entry.home=translate(startX,startY,direction*6);
   entry.park=translate(endX,endY);
   sprite.style.transform=entry.park;sprite.dataset.motion='ready';geometry();
   if(motionReduced())return;
   sprite.dataset.motion='approach';
   const travel=entry.travel=sprite.animate([
    {transform:entry.home,opacity:0},
    {transform:translate(mix(startX,endX,.34),mix(startY,endY,.34)-size*.36,-8),opacity:1,offset:.34},
    {transform:translate(mix(startX,endX,.72),mix(startY,endY,.72)-size*.27,7),opacity:1,offset:.72},
    {transform:entry.park,opacity:1}
   ],{duration:980,easing:'ease-out'});
   travel.finished.then(()=>{
    if(entry.sprite!==sprite||entry.travel!==travel||entry.opened)return;
    sprite.dataset.motion='ready';entry.travel=null;geometry();
    const ring=document.createElement('span');ring.className='wt-denia-knock';
    anchor.append(ring);entry.knock=ring;
    const tap=ring.animate([{transform:'translate(-50%,-50%) scale(.65)',opacity:1},{transform:'translate(-50%,-50%) scale(3)',opacity:0}],{duration:335,iterations:2});
    tap.finished.catch(()=>{}).finally(()=>{ring.remove();if(entry.knock===ring)entry.knock=null});
   }).catch(()=>{});
  }
  function collect(entry){
   const sprite=entry.sprite;
   if(!sprite)return;
   const from=getComputedStyle(sprite).transform;
   entry.travel?.cancel();entry.knock?.remove();entry.knock=null;
   sprite.dataset.motion='retreat';
   const cheer=entry.park+' translateY(-22%) rotate(-10deg)';
   const frames=motionReduced()?[
    {opacity:1},{opacity:1,offset:.8},{opacity:0}
   ]:[
    {transform:from,opacity:1},
    {transform:cheer,opacity:1,offset:.16},
    {transform:entry.park,opacity:1,offset:.32},
    {transform:entry.park,opacity:1,offset:.64},
    {transform:entry.home,opacity:0}
   ];
   const travel=entry.travel=sprite.animate(frames,{duration:2400,easing:'ease-in-out'});
   travel.finished.then(()=>{if(entry.travel===travel)clear(entry)}).catch(()=>{});
  }
  function scan(){
   if(!enabled())return;
   for(const [anchor,entry] of cycles)if(!anchor.isConnected){clear(entry);cycles.delete(anchor)}
   for(const anchor of document.querySelectorAll(selector)){
    const button=anchor.querySelector('.reward-btn'),entry=cycles.get(anchor);
    if(!button){if(entry&&!entry.opened)clear(entry);else if(entry?.sprite)continue;cycles.delete(anchor);continue}
    const opening=button.classList.contains('reward-btn--open');
    if(!entry){
     const cycle={opened:opening};cycles.set(anchor,cycle);
     if(!opening)notify(anchor,cycle);
    }else if(opening&&!entry.opened){entry.opened=true;collect(entry)}
    else if(!entry.notified&&!opening)notify(anchor,entry);
   }
  }
 const watched=node=>node.nodeType===1&&(node.matches('.reward-anchor,.reward-btn')||node.querySelector(selector));
  const observer=new MutationObserver(records=>{
   if(records.some(record=>record.target.closest?.(selector)||[...record.addedNodes,...record.removedNodes].some(watched)))scan();
  });
  let running=false;
  function stop(){
   observer.disconnect();running=false;
   for(const entry of cycles.values())clear(entry);
   cycles.clear();
  }
  return {sync(){
   if(!enabled()){if(running)stop();return}
   if(!running&&document.body){running=true;observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']})}
   scan();
  },stop};
 }
 function create({root,role,blocked,dialogue}){
  const pressed=new Set(),sequence=[];
  let cfg=read(),eligible=isDenia(role()),holdTimer=0,holdToken='',frame=0,canvas=null,printing='',handAt=-Infinity,paperAt=-Infinity;
  let cake=null,cakeLit=false,cakeTimer=0,idleTimer=0,lastActivity=performance.now(),idlePlayed=false,idleNext='idle-bubbles';
  let line=null,lineTimer=0,priorityUntil=0,quoteAt=-Infinity,quoteIndex=-1,quoteConfig=dialogue&&loadDialogue(dialogue);
  const active=()=>(cfg.hand||cfg.paper||cfg.idle||cfg.quotes)&&isDenia(role());
  const canIdle=()=>cfg.idle&&isDenia(role())&&!document.hidden;
  const reporter=createReporter({root,enabled:()=>cfg.report&&isDenia(role())&&!document.hidden});
  function clearLine(){
   clearTimeout(lineTimer);
   if(line){line.remove();line=null;geometry()}
   priorityUntil=0;
  }
  function say(text,priority=false){
   const host=root();
   if(!host?.isConnected||document.hidden||!priority&&performance.now()<priorityUntil)return false;
   const duration=priority?2800:Math.max(1150,Math.min(2550,950+text.length*38));
   if(priority)priorityUntil=performance.now()+duration;
   if(line?.parentNode!==host){
    line?.remove();line=document.createElement('div');line.className='wt-denia-line';
    host.append(line);
   }
   line.textContent=text;
   if(text.length>25)line.style.fontSize='clamp(7px,calc(var(--pet-base-size,200px)*.044),13px)';
   else line.style.removeProperty('font-size');
   clearTimeout(lineTimer);lineTimer=setTimeout(clearLine,duration);geometry();return true;
  }
  function paintBirthday(){
   if(!cake)return;
   const title=!cfg.candle?'达妮娅的生日蛋糕':cakeLit?'吹灭蜡烛':'点亮蜡烛';
   cake.disabled=!cfg.candle;cake.title=title;cake.setAttribute('aria-label',title);
   drawCake(cake.firstElementChild,!cfg.candle||cakeLit);
  }
  function candle(){
   if(!cfg.cake||!cfg.candle||!isDenia(role())||blocked()||document.hidden||cakeTimer)return;
   if(!cakeLit){cakeLit=true;paintBirthday();return}
   if(!play('candle'))return;
   if(motionReduced())finishCandle();
   else cakeTimer=setTimeout(finishCandle,450);
  }
  function finishCandle(){
   cakeTimer=0;cakeLit=false;paintBirthday();
   if(!blocked())say('我可没在等你哦。',true);
  }
  function removeCake(){
   if(!cake)return;
   clearTimeout(cakeTimer);cakeTimer=0;cakeLit=false;cake.remove();cake=null;geometry();
  }
  function syncCake(){
   const host=cfg.cake&&isDenia(role())?root():null;
   if(cake&&cake.parentElement!==host)removeCake();
   if(!host?.isConnected||cake)return;
   cake=document.createElement('button');cake.className='wt-denia-cake';cake.type='button';
   const art=document.createElement('canvas');art.width=160;art.height=128;art.setAttribute('aria-hidden','true');
   cake.append(art);paintBirthday();host.append(cake);geometry();
   for(const event of ['pointerdown','mousedown'])cake.addEventListener(event,e=>e.stopPropagation());
   cake.addEventListener('click',event=>{event.stopPropagation();candle()});
  }
  const observeCake=new MutationObserver(syncCake);
  let watchingCake=false;
  function configureCake(){
   const watchCake=cfg.cake&&eligible;
   if(watchCake!==watchingCake){
    watchingCake=watchCake;observeCake.disconnect();
    if(watchCake&&document.body)observeCake.observe(document.body,{childList:true,subtree:true});
   }
   syncCake();
  }
  function clearFx(){cancelAnimationFrame(frame);frame=0;canvas?.remove();canvas=null;printing=''}
  function play(kind){
   const host=root();
   const candleEffect=kind==='candle';
   if(!host?.isConnected||blocked()||document.hidden)return false;
   if(candleEffect?!(cfg.cake&&cfg.candle&&isDenia(role())):
    !active()||printing==='candle'||printing.startsWith('idle-')||kind==='paper'&&printing==='hand')return false;
   clearFx();canvas=document.createElement('canvas');canvas.className='wt-denia-fx';canvas.width=480;canvas.height=440;
   canvas.dataset.effect=kind;canvas.setAttribute('aria-hidden','true');
   const ctx=canvas.getContext('2d');if(!ctx){clearFx();return false}
   host.append(canvas);printing=kind;
   const reduced=motionReduced();
   const duration=kind.startsWith('idle-')?3900:reduced?420:candleEffect?2650:kind==='hand'?1480:1900,start=performance.now();
   if(reduced)paint(ctx,kind,.63);
   function next(now){
    if((candleEffect?!(cfg.cake&&cfg.candle&&isDenia(role())):!active())||blocked()||document.hidden||canvas?.parentElement!==root()||now-start>=duration){clearFx();return}
    if(!reduced)paint(ctx,kind,clamp((now-start)/duration));
    frame=requestAnimationFrame(next);
   }
   frame=requestAnimationFrame(next);return true;
  }
  function armIdle(delay=idleDelay){
   if(idleTimer||idlePlayed||!canIdle())return;
   idleTimer=setTimeout(()=>{
    idleTimer=0;
    if(!canIdle()||idlePlayed||pressed.size)return;
    const remaining=idleDelay-(performance.now()-lastActivity);
    if(remaining>0){armIdle(remaining);return}
    if(printing||!play(idleNext)){armIdle(idleDelay);return}
    idlePlayed=true;idleNext=idleNext==='idle-bubbles'?'idle-paper':'idle-bubbles';
   },delay);
  }
  function moved(){
   if(!canIdle())return;
   lastActivity=performance.now();idlePlayed=false;
   armIdle();
  }
  function resetIdle(){clearTimeout(idleTimer);idleTimer=0;lastActivity=performance.now();idlePlayed=false;armIdle()}
  const visible=()=>{if(document.hidden){clearFx();clearLine();clearTimeout(cakeTimer);cakeTimer=0}reporter.sync();resetIdle()};
  document.addEventListener('visibilitychange',visible);
  function cancelHold(){clearTimeout(holdTimer);holdTimer=0;holdToken=''}
  function input(source,token,down){
   if(!down){if(pressed.delete(token))moved();if(token===holdToken)cancelHold();return}
   if(!active()||blocked()||document.hidden||pressed.has(token))return;
   pressed.add(token);moved();
   const now=performance.now();
   if(cfg.quotes&&now-quoteAt>=(quoteConfig?.mode==='mapped'?350:1080)){
    let text;
    if(quoteConfig?.mode==='mapped')text=dialogue.line({denia:quoteConfig},'denia',source,token.slice(source.length+1));
    else{
     quoteIndex=(quoteIndex+1+Math.floor(Math.random()*(sampleLines.length-1)))%sampleLines.length;
     text=sampleLines[quoteIndex];
    }
    if(text&&say(text))quoteAt=now;
   }
   if(cfg.hand&&!holdTimer&&now-handAt>=handCooldown){
    holdToken=token;
    holdTimer=setTimeout(()=>{
     cancelHold();
     if(cfg.hand&&pressed.has(token)&&play('hand'))handAt=performance.now();
    },hold);
   }
   if(cfg.paper&&now-paperAt>=danceCooldown){
    while(sequence.length&&now-sequence[0]>streakTime)sequence.shift();
    sequence.push(now);
    if(sequence.length>=3){sequence.length=0;if(play('paper'))paperAt=now}
   }
  }
  function release(source){
   if(!source){const hadPressed=pressed.size;pressed.clear();sequence.length=0;cancelHold();if(hadPressed)moved();return}
   for(const token of pressed)if(token.startsWith(source+':'))input(source,token,false);
  }
  function sync(){
   const next=read(),denia=isDenia(role());
   const idleChanged=next.idle!==cfg.idle||denia!==eligible;
   if(next.paper!==cfg.paper||next.hand!==cfg.hand||idleChanged){
    clearFx();release();
   }
   if(!denia||next.quotes!==cfg.quotes||next.candle!==cfg.candle||next.cake!==cfg.cake)clearLine();
   const birthdayChanged=next.candle!==cfg.candle||next.cake!==cfg.cake;
   cfg=next;eligible=denia;quoteConfig=dialogue&&loadDialogue(dialogue);
   if(birthdayChanged){clearTimeout(cakeTimer);cakeTimer=0;cakeLit=false;paintBirthday();geometry()}
   configureCake();
   reporter.sync();
   if(idleChanged)resetIdle();else armIdle();
  }
  return {active,input,release,sync,moved,dispose(){
   cfg={...cfg,idle:false};clearFx();clearLine();release();clearTimeout(idleTimer);
   observeCake.disconnect();removeCake();reporter.stop();document.removeEventListener('visibilitychange',visible);
  }};
 }
 return {key,dialogueKey,css,mount,refresh,sync,create,isDenia,mountGame};
})();
