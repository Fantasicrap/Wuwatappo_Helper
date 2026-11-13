const __wtAemeathMech=(()=>{
 const key='wuwatappo-aemeath-mech-v1',eventName='wt-aemeath-mech-updated';
 const defaults={enabled:false,idle:true,sword:true,orbit:true,input:true,flash:true,wings:true,laser:true,greatsword:true};
 const greatswordCooldown=600000,laserCooldown=20000,greatswordKey='wuwatappo-aemeath-greatsword-at';
 const css=`
.wt-mech-settings{margin:12px 0 0;padding:10px 12px;border:1px solid var(--wt-ui-border,#e3c9aa);border-radius:12px;background:var(--wt-ui-card-fill,#fff9ed);color:var(--wt-ui-text,#694832)}
.wt-mech-settings legend{padding:0 6px;font-weight:700}
.wt-mech-settings label{display:flex;align-items:center;gap:8px;margin:4px 0;cursor:pointer}
.wt-mech-settings label:has(:disabled){opacity:.65;cursor:default}
.wt-mech-settings label:has([data-mech-setting=flash],[data-mech-setting=wings]){padding-left:22px}
.wt-mech-settings input{accent-color:var(--wt-mech-check,#b67b49)}
.wt-aemeath-mech{position:absolute;pointer-events:none;width:clamp(35px,35%,102px);aspect-ratio:1;transform:translate(-50%,-50%);z-index:5}
.wt-mech-sprite{position:absolute;inset:0;--facing:1;transform:scaleX(var(--facing));filter:drop-shadow(0 2px 2px #29345d50)}
.wt-aemeath-mech[data-facing=left] .wt-mech-sprite{--facing:-1}
.wt-mech-sprite img{position:absolute;inset:0;width:100%;height:100%;transition:transform .22s ease-out}
.wt-mech-left-wing{clip-path:polygon(0 25%,37% 28%,38% 47%,36% 62%,37% 73%,0 74%);transform-origin:37% 48%}
.wt-mech-right-wing{clip-path:polygon(66% 29%,100% 25%,100% 74%,66% 74%,66% 57%,64% 47%);transform-origin:66% 48%}
.wt-mech-body{clip-path:polygon(0 0,100% 0,100% 25%,66% 29%,64% 47%,66% 57%,66% 74%,100% 74%,100% 100%,0 100%,0 74%,37% 73%,36% 62%,38% 47%,37% 28%,0 25%)}
.wt-aemeath-mech[data-held] .wt-mech-left-wing{transform:rotate(8deg) scaleX(1.06)}
.wt-aemeath-mech[data-held] .wt-mech-right-wing{transform:rotate(-8deg) scaleX(1.06)}
.wt-mech-core{position:absolute;left:55%;top:52%;width:24%;aspect-ratio:1;transform:translate(-50%,-50%);background:radial-gradient(circle,#f7ffffd9 0%,#71effab3 28%,#71effa00 72%);opacity:0;transition:opacity .15s}
.wt-aemeath-mech[data-held][data-core] .wt-mech-core{opacity:.62}
.wt-aemeath-mech[data-flash][data-core] .wt-mech-core{opacity:1}
.wt-mech-grip{position:absolute;left:71.5%;top:75%;width:0;height:0}
.wt-mech-sword{position:absolute;left:0;top:0;width:calc(var(--wt-mech-size,70px) * .84);height:auto;opacity:0;translate:-16% -50%;transform-origin:16% 50%;overflow:visible;pointer-events:none;filter:drop-shadow(0 0 2px #74e9ff)}
.wt-mech-trail{position:absolute;left:49%;top:32%;width:72%;height:58%;opacity:0;pointer-events:none;border-radius:50%;border-right:2px solid #98ecff;border-bottom:2px solid #f6bde8;transform:rotate(28deg)}
.wt-aemeath-mech[data-sword=sweep] .wt-mech-sword{animation:wt-mech-sweep 1.55s both}
.wt-aemeath-mech[data-sword=sweep] .wt-mech-trail{animation:wt-mech-trail 1.55s both}
.wt-aemeath-mech[data-sword=sweep] .wt-mech-sprite{animation:wt-mech-lunge 1.55s both}
.wt-aemeath-mech[data-sword=spin] .wt-mech-sword{animation:wt-mech-spin 1.95s both}
.wt-aemeath-mech[data-sword=spin] .wt-mech-trail{animation:wt-mech-trail 1.95s both}
.wt-aemeath-mech[data-sword=spin] .wt-mech-sprite{animation:wt-mech-turn 1.95s both}
@keyframes wt-mech-sweep{0%{opacity:0;transform:rotate(43deg) scaleX(.45)}18%{opacity:1;transform:rotate(16deg) scaleX(1)}39%{transform:rotate(-60deg) scaleX(1);animation-timing-function:cubic-bezier(.14,.83,.22,1)}55%{transform:rotate(31deg) scaleX(1)}76%{opacity:1;transform:rotate(38deg) scaleX(1)}100%{opacity:0;transform:rotate(54deg) scaleX(.45)}}
@keyframes wt-mech-spin{0%{opacity:0;transform:rotate(43deg) scaleX(.45)}20%{opacity:1;transform:rotate(-26deg) scaleX(1)}34%{transform:rotate(-35deg);animation-timing-function:cubic-bezier(.4,0,.35,1)}72%{opacity:1;transform:rotate(325deg)}86%{opacity:1;transform:rotate(402deg)}100%{opacity:0;transform:rotate(410deg) scaleX(.45)}}
@keyframes wt-mech-lunge{0%,100%{transform:scaleX(var(--facing))}39%{transform:scaleX(var(--facing)) translate(-6%,-3%) rotate(-8deg);animation-timing-function:cubic-bezier(.13,.8,.22,1)}55%{transform:scaleX(var(--facing)) translate(13%,1%) rotate(8deg)}76%{transform:scaleX(var(--facing)) translate(5%,0) rotate(3deg)}}
@keyframes wt-mech-turn{0%,100%{transform:scaleX(var(--facing))}34%{transform:scaleX(var(--facing)) rotate(-9deg)}45%{transform:scaleX(calc(var(--facing) * .62)) translateY(-7%) rotate(-6deg)}55%{transform:scaleX(var(--facing)) translateY(-11%) rotate(6deg)}64%{transform:scaleX(calc(var(--facing) * .64)) translateY(-6%) rotate(10deg)}78%{transform:scaleX(var(--facing)) rotate(5deg)}}
@keyframes wt-mech-trail{0%,38%,100%{opacity:0}55%{opacity:.85}76%{opacity:.12}}
.wt-aemeath-mech[data-idle]:not([data-orbit]):not([data-held]):not([data-sword]):not([data-special]) .wt-mech-sprite{animation:wt-mech-hover 4.6s ease-in-out infinite}
@keyframes wt-mech-hover{0%,100%{transform:scaleX(var(--facing)) translateY(0)}50%{transform:scaleX(var(--facing)) translateY(-4%)}}
.wt-aemeath-mech[data-special] .wt-mech-sprite{animation:none}
.wt-aemeath-mech[data-special=laser] .wt-mech-left-wing{transform:rotate(12deg) scaleX(1.1)}
.wt-aemeath-mech[data-special=laser] .wt-mech-right-wing{transform:rotate(-12deg) scaleX(1.1)}
.wt-aemeath-mech[data-special=laser] .wt-mech-core{opacity:.85}
.wt-mech-special{position:absolute;display:block;pointer-events:none;overflow:visible;z-index:6}
.wt-mech-special--laser{inset:0;width:100%;height:100%}
.wt-mech-special--greatsword{width:108%;height:auto;aspect-ratio:1;transform:translate(-50%,-50%)}
.wt-mech-special--greatsword[data-side=right]{transform:translate(-50%,-50%) scaleX(-1)}
.wt-mech-summon-gate{transform-origin:150px 64px;animation:wt-mech-summon-gate 3.2s both}
.wt-mech-strider-shadow{transform-origin:150px 90px;animation:wt-mech-strider-shadow 3.2s both}
.wt-mech-greatblade{transform-origin:150px 151px;animation:wt-mech-greatblade 3.2s both}
.wt-mech-impact{transform-origin:150px 246px;animation:wt-mech-impact 3.2s both}
.wt-mech-summon-dust{animation:wt-mech-summon-dust 3.2s both}
@keyframes wt-mech-summon-gate{0%{opacity:0;transform:scale(.25)}19%,44%{opacity:1;transform:scale(1)}59%{opacity:.25;transform:scale(1.18)}74%,100%{opacity:0;transform:scale(1.25)}}
@keyframes wt-mech-strider-shadow{0%,9%{opacity:0;transform:translateY(-35px) scale(.72)}26%,48%{opacity:.58;transform:translateY(-16px)}58%{opacity:.74;transform:translateY(13px)}86%,100%{opacity:0;transform:translateY(20px)}}
@keyframes wt-mech-greatblade{0%,10%{opacity:0;transform:translate(-23px,-74px) rotate(-22deg) scale(.56)}30%{opacity:1;transform:translate(10px,-45px) rotate(-15deg) scale(.86)}48%{opacity:1;transform:translate(13px,-39px) rotate(-12deg) scale(.93);animation-timing-function:cubic-bezier(.74,.02,.97,.48)}57%{opacity:1;transform:translate(0,35px) rotate(0) scale(1.03)}66%,77%{opacity:1;transform:translateY(26px)}100%{opacity:0;transform:translateY(34px) scale(.97)}}
@keyframes wt-mech-impact{0%,53%{opacity:0;transform:scale(.22)}58%{opacity:1;transform:scale(.62)}74%{opacity:.68;transform:scale(1.06)}100%{opacity:0;transform:scale(1.38)}}
@keyframes wt-mech-summon-dust{0%{opacity:0}16%,42%{opacity:.75}59%{opacity:1}100%{opacity:0;transform:translateY(-15px)}}
@media(prefers-reduced-motion:reduce){.wt-aemeath-mech .wt-mech-sprite,.wt-aemeath-mech .wt-mech-sword,.wt-aemeath-mech .wt-mech-trail{animation:none!important}.wt-mech-sprite img,.wt-mech-core{transition:none}.wt-aemeath-mech[data-held] .wt-mech-sprite img{transform:none}}
`;
 const swordArt='<svg class="wt-mech-sword" viewBox="0 0 110 30" aria-hidden="true"><defs><linearGradient id="wt-mech-blade"><stop stop-color="#26d3ff"/><stop offset=".52" stop-color="#e5fbff"/><stop offset="1" stop-color="#f9a0db"/></linearGradient></defs><path d="M21 15 37 8 72 10 108 15 72 20 37 22Z" fill="url(#wt-mech-blade)" stroke="#536bc0" stroke-width="1.2"/><path d="M35 15 69 13 106 15 69 17Z" fill="#fff"/><path d="M3 15 17 12 22 15 17 18Z" fill="#233452" stroke="#c4d6ed"/><path d="M10 4 28 11 41 7 32 15 41 23 28 19 10 26 19 16 19 14Z" fill="#cbdff5" stroke="#253956" stroke-width="1.6"/><path d="m24 9 7 6-7 6-5-6Z" fill="#52e8ff" stroke="#245170"/><path d="m59 10 2 4 4 1-4 1-2 4-1-4-4-1 4-1Z" fill="#fff"/></svg>';
 const laserArt=`<g class="wt-mech-laser-ray" fill="none" stroke-linecap="round"><line stroke="#9d92ff" opacity=".28"/><line stroke="#547bff" opacity=".65"/><line stroke="#94dfff"/><line stroke="#fffaff"/><line stroke="#d1e3ff" opacity=".78"/><line stroke="#e0cdff" opacity=".66"/></g><g class="wt-mech-laser-charge" fill="none"><circle stroke="#a9a0ff" opacity=".7"/><circle stroke="#89edff" stroke-dasharray="4 6"/><path fill="#fff6ff"/><path fill="#97efff" opacity=".75"/></g><g class="wt-mech-laser-burst" fill="none" stroke-width="1.25"><ellipse stroke="#fff0ff"/><ellipse stroke="#82e8ff" opacity=".72"/></g>`;
 const greatswordArt=`<defs>
  <linearGradient id="wt-greatblade-metal" x2="1" y2=".75"><stop stop-color="#8c6bb2"/><stop offset=".22" stop-color="#ffe3b3"/><stop offset=".47" stop-color="#fffaf0"/><stop offset=".66" stop-color="#acc5ff"/><stop offset="1" stop-color="#7a78b5"/></linearGradient>
  <radialGradient id="wt-greatblade-halo"><stop stop-color="#fff0fa" stop-opacity=".8"/><stop offset=".58" stop-color="#ae94ff" stop-opacity=".28"/><stop offset="1" stop-color="#9d86ff" stop-opacity="0"/></radialGradient>
 </defs>
 <g class="wt-mech-summon-gate" fill="none"><ellipse cx="150" cy="64" rx="126" ry="46" fill="url(#wt-greatblade-halo)"/><ellipse cx="150" cy="64" rx="104" ry="24" stroke="#a584db" stroke-width="4" opacity=".3"/><ellipse cx="150" cy="64" rx="104" ry="24" stroke="#fff2fb" stroke-width="1.8"/><ellipse cx="150" cy="64" rx="90" ry="17" stroke="#74ddee" stroke-dasharray="3 6"/><path d="m35 64 11-5 11 5-11 5zm208 0 11-5 11 5-11 5zM150 33l5 6-5 6-5-6z" fill="#fff0ff"/></g>
 <g class="wt-mech-strider-shadow" stroke-linejoin="round">
  <path d="m150 33 16 15 10 19 21-13 41-29-21 47 37-15-38 41 23-6-37 33-24-13-9 22h-38l-9-22-24 13-37-33 23 6-38-41 37 15-21-47 41 29 21 13 10-19z" fill="#56517b" stroke="#ffe1a4" stroke-width="3"/>
  <path d="m65 38 45 55 24-11-31 35-30-24 24 5zm170 0-45 55-24-11 31 35 30-24-24 5zM150 45l12 14-4 21-8 13-8-13-4-21z" fill="url(#wt-greatblade-metal)" stroke="#fff0cd" stroke-width="2"/>
  <path d="m147 65 3-8 3 8-3 8zM111 100l17-10m61 10-17-10" fill="#9cefff" stroke="#9cefff" stroke-width="2"/>
 </g>
 <g class="wt-mech-greatblade" stroke-linejoin="round">
  <path d="M150 31 158 43 156 73 171 83 193 76 180 98 165 105 168 117 162 195 150 231 138 195 132 117 135 105 120 98 107 76 129 83 144 73 142 43Z" fill="#f1c5ff" stroke="#f9e2ff" stroke-width="11" opacity=".52"/>
  <path d="m150 32 9 10-3 35-6 10-6-10-3-35z" fill="#715487" stroke="#ffebbb" stroke-width="2.5"/>
  <path d="M133 101 119 119 128 175 141 205 150 231 159 205 172 175 181 119 167 101Z" fill="url(#wt-greatblade-metal)" stroke="#645184" stroke-width="3"/>
  <path d="m133 112-6 11 8 51 10 29-4-40-5-37zM167 112l6 11-8 51-10 29 4-40 5-37z" fill="#99774d" stroke="#ffdf9c" stroke-width="1.2"/>
  <path d="M150 107 159 128 156 178 150 217 144 178 141 128Z" fill="#60deed" stroke="#fff5dc" stroke-width="1.7"/>
  <path d="m150 116 3 16-3 70-3-70z" fill="#f4ffff"/>
  <path d="M150 74 168 84 197 72 181 97 164 108 150 102 136 108 119 97 103 72 132 84Z" fill="url(#wt-greatblade-metal)" stroke="#71568a" stroke-width="2.5"/>
  <path d="m150 80 8 11-8 11-8-11Z" fill="#a0f4ff" stroke="#fff4de" stroke-width="2"/>
 </g>
 <g class="wt-mech-impact" fill="none"><ellipse cx="150" cy="246" rx="103" ry="33" fill="url(#wt-greatblade-halo)"/><ellipse cx="150" cy="246" rx="86" ry="14" stroke="#fff6f9" stroke-width="2.7"/><ellipse cx="150" cy="246" rx="69" ry="9" stroke="#98f4ff" stroke-width="1.5" stroke-dasharray="12 4"/><path d="m53 242-24-5m217 5 23-8m-71-10 13-14m-106 16-10-16m55 8v-19" stroke="#fff5cf" stroke-width="2.3" stroke-linecap="round"/></g>
 <path class="wt-mech-summon-dust" fill="#fff1fc" d="m73 113 3 8 8 3-8 3-3 8-3-8-8-3 8-3zm148 31 3 7 7 3-7 3-3 7-3-7-7-3 7-3zM92 191h5v5h-5zm116 14h4v4h-4zm25-110h6v6h-6zM60 163h5v5h-5zm108-99h3v3h-3z"/>`;
 function styles(){
  if(document.getElementById('wt-mech-css'))return;
  const style=document.createElement('style');style.id='wt-mech-css';style.setAttribute('data-wt-theme-sheet','mech');
  style.textContent=css;document.head.append(style);
 }
 function read(){
  let saved;try{saved=JSON.parse(localStorage.getItem(key)||'{}')}catch{}
  return Object.fromEntries(Object.entries(defaults).map(([name,value])=>[name,typeof saved?.[name]==='boolean'?saved[name]:value]));
 }
 function mount(root){
  styles();
  const field=document.createElement('fieldset');field.className='wt-mech-settings';
  const legend=document.createElement('legend');legend.textContent='爱弥斯 · 隧者兵装';field.append(legend);
  const switches=new Map();
  for(const [name,text] of [['enabled','常驻伴飞（总开关）'],['idle','待机悬浮'],['sword','待机挥剑'],['orbit','自动环绕'],['input','输入联动'],['flash','按下时核心亮起'],['wings','长按时展开机翼'],['laser','长按升空发射激光'],['greatsword','敲击时召唤隧者大剑']]){
   const label=document.createElement('label'),input=document.createElement('input');
   input.type='checkbox';input.dataset.mechSetting=name;label.append(input,text);field.append(label);switches.set(name,input);
   input.addEventListener('change',()=>{
    try{localStorage.setItem(key,JSON.stringify({...read(),[name]:input.checked}))}catch{}
    update();
    if(typeof emit==='function')Promise.resolve().then(()=>emit(eventName)).catch(()=>{});
   });
  }
  switches.get('orbit').title='2.5 秒内按下 6 次，或静置 18–24 秒后触发';
  switches.get('laser').title='长按 1.2 秒触发，间隔至少 20 秒';
  switches.get('greatsword').title='每次敲击有 1% 概率触发，成功后冷却 10 分钟';
  function update(){const cfg=read();for(const [name,input] of switches){input.checked=cfg[name];input.disabled=name!=='enabled'&&(!cfg.enabled||(['flash','wings','laser','greatsword'].includes(name)&&!cfg.input))}}
  root.append(field);update();return update;
 }
 function isAemeath(role){return Number(role?.id)===1210||/(?:^|[\\/])role_1210(?:[_-]|$)/i.test(role?.name??'')}
 function create({root,role,activity,load=()=>import('http://127.0.0.1:48642/ui.js'),random=Math.random}){
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)'),held=new Set();
  let cfg=read(),host,mech,dock,sprite='__WT_AEMEATH_MECH_SPRITE__',pending,unlisten,started=false,disposed=false,demand=false;
  if(!sprite.startsWith('data:'))sprite='';
  let holdTimer,flashTimer,orbitTimer,swordTimer,frame,layoutFrame,side=-1,lastOrbit=-8000,inputs=[],lastPath;
  let special,specialFrame,laserTimer,lastLaser=-laserCooldown,lastGreatsword=0;
  try{lastGreatsword=Math.min(Date.now(),Number(localStorage.getItem(greatswordKey))||0)}catch{}
  const resize=new ResizeObserver(scheduleLayout),move=new MutationObserver(scheduleLayout);
  const tree=new MutationObserver(()=>{if(root()!==host||!mech?.isConnected)sync()});
  const eligible=()=>started&&!disposed&&cfg.enabled&&isAemeath(role());
  const specialEnabled=kind=>cfg.input&&cfg[kind]&&!motion.matches;
  const inputActive=()=>eligible()&&!!mech?.isConnected&&(cfg.orbit&&!motion.matches||cfg.input&&(cfg.flash||cfg.wings||specialEnabled('laser')||specialEnabled('greatsword')));
  const geometry=()=>window.dispatchEvent(new Event('pet-toast-geometry-changed'));
  function updateDemand(){const next=inputActive();if(demand!==next){demand=next;activity()}}
  function release(source){
   for(const token of held)if(!source||token.startsWith(source+':'))held.delete(token);
   if(held.size)return;
   clearTimeout(holdTimer);clearTimeout(laserTimer);if(mech)delete mech.dataset.held;
  }
  function input(source,token,pressed){
   if(!pressed){
    if(held.delete(token)&&!held.size){
     release();
     const now=performance.now();
     if(cfg.orbit&&inputs.filter(t=>now-t<2500).length>=6&&now-lastOrbit>=8000)fly();
    }
    return;
   }
   if(!inputActive()||held.has(token))return;
   held.add(token);
   const now=performance.now();inputs=inputs.filter(t=>now-t<2500);inputs.push(now);
   if(special)return;
   if(specialEnabled('greatsword')&&Date.now()-lastGreatsword>=greatswordCooldown&&canPlaySpecial()&&random()<.01&&playSpecial('greatsword')){
    lastGreatsword=Date.now();
    try{localStorage.setItem(greatswordKey,String(lastGreatsword))}catch{}
    return;
   }
   delete mech.dataset.sword;planSword();if(frame===undefined)planOrbit();
   if(cfg.input&&cfg.flash){
    clearTimeout(flashTimer);mech.dataset.flash='';
    flashTimer=setTimeout(()=>{if(mech)delete mech.dataset.flash},230);
   }
   if(cfg.input&&cfg.wings&&held.size===1)holdTimer=setTimeout(()=>{if(held.size&&mech)mech.dataset.held=''},190);
   if(held.size===1&&specialEnabled('laser'))laserTimer=setTimeout(()=>{
    if(held.size&&performance.now()-lastLaser>=laserCooldown&&playSpecial('laser'))lastLaser=performance.now();
   },1200);
  }
  function position(offset,y){
   const rect=host.getBoundingClientRect(),scale=rect.width/host.offsetWidth||1,size=mech.offsetWidth;
   const width=window.innerWidth,height=window.innerHeight,pad=6;
   const clamp=(v,min,max)=>min>max?(min+max)/2:Math.max(min,Math.min(v,max));
   const x=clamp((.5+offset)*host.offsetWidth,(pad-rect.left)/scale+size/2,(width-pad-rect.left)/scale-size/2);
   const top=clamp(y*host.offsetHeight,(pad-rect.top)/scale+size/2,(height-pad-rect.top)/scale-size/2);
   mech.style.left=x+'px';mech.style.top=top+'px';
   if(mech.style.getPropertyValue('--wt-mech-size')!==size+'px')mech.style.setProperty('--wt-mech-size',size+'px');
   mech.dataset.facing=x<host.offsetWidth/2?'right':x>host.offsetWidth/2?'left':offset<0?'right':'left';
  }
  function park(){
   if(!mech||!host.offsetWidth)return;
   const rect=host.getBoundingClientRect(),size=mech.getBoundingClientRect().width;
   const edge=Math.max(0,size/2-rect.width*.02)+6;
   if(side<0&&rect.left<edge&&window.innerWidth-rect.right>rect.left)side=1;
   else if(side>0&&window.innerWidth-rect.right<edge&&rect.left>window.innerWidth-rect.right)side=-1;
   const occupied=[...(dock?.querySelectorAll('.reward-anchor,.emotion-menu,.wt-snowfluff:not([hidden])')??[])];
   const overlaps=(offset,y)=>{
    const x=rect.left+(.5+offset)*rect.width,cy=rect.top+y*rect.height;
    return occupied.some(node=>{
     const b=node.getBoundingClientRect(),r=size*.46;
     return b.width&&b.height&&x+r>b.left&&x-r<b.right&&cy+r>b.top&&cy-r<b.bottom;
    });
   };
   const choices=[[side*.5,.33],[side*.5,.22],[-side*.5,.33],[-side*.5,.22]];
   const [offset,y]=choices.find(([x,y])=>{
    const center=rect.left+(.5+x)*rect.width;
    return center>=size/2&&center<=window.innerWidth-size/2&&!overlaps(x,y);
   })??choices[0];
   side=Math.sign(offset);position(offset,y);
   return y;
  }
  function scheduleLayout(){
   if(!mech||layoutFrame!==undefined)return;
   layoutFrame=requestAnimationFrame(()=>{layoutFrame=undefined;if(frame===undefined&&!special)park()});
  }
  function planOrbit(){
   clearTimeout(orbitTimer);
   if(!mech||special||!cfg.orbit||motion.matches||document.hidden)return;
   orbitTimer=setTimeout(fly,18000+random()*6000);
  }
  function planSword(){
   clearTimeout(swordTimer);
   if(!mech||special||!cfg.sword||motion.matches||document.hidden)return;
   swordTimer=setTimeout(()=>{
    if(frame===undefined&&!held.size&&host.getClientRects().length){
     mech.dataset.sword=random()<.5?'sweep':'spin';
    }
    planSword();
   },6500+random()*5000);
  }
  function fly(){
   if(!mech||special||!cfg.orbit||motion.matches||frame!==undefined)return;
   if(held.size||document.hidden||!host.getClientRects().length){planOrbit();return}
   const base=park()??.33,start=performance.now(),direction=side;
   lastOrbit=start;inputs=[];clearTimeout(orbitTimer);delete mech.dataset.sword;
   const routes=['arc','zigzag','diagonal'].filter(route=>route!==lastPath);
   const route=routes[Math.floor(random()*routes.length)]??routes[0];
   lastPath=route;mech.dataset.orbit=route;
   const waypoints=route==='zigzag'?[[.5,base],[-.52,.09],[.52,.43],[-.52,.69],[.5,base]]:
    [[.5,base],[-.52,.12],[.52,.68],[.5,base]];
   function step(now){
    const fraction=Math.min(1,(now-start)/(route==='zigzag'?2400:2050));
    if(route==='arc'){
     const angle=fraction*Math.PI*2;
     position(direction*.5*Math.cos(angle),base-Math.sin(angle)*.43);
    }else{
     const part=fraction*(waypoints.length-1),i=Math.min(waypoints.length-2,Math.floor(part)),t=part-i;
     const eased=t*t*(3-2*t),[fromX,fromY]=waypoints[i],[toX,toY]=waypoints[i+1];
     position(direction*(fromX+(toX-fromX)*eased),fromY+(toY-fromY)*eased);
    }
    if(fraction<1)frame=requestAnimationFrame(step);
    else{frame=undefined;delete mech.dataset.orbit;park();planOrbit()}
   }
   frame=requestAnimationFrame(step);
  }
  function cancelOrbit(){
   if(frame===undefined)return;
   cancelAnimationFrame(frame);frame=undefined;
   if(mech){delete mech.dataset.orbit;park();planOrbit()}
  }
  function canPlaySpecial(){
   return !special&&frame===undefined&&!document.hidden&&!!host?.offsetWidth&&!!host.getClientRects().length;
  }
  function endSpecial(resume=true){
   if(!special)return;
   cancelAnimationFrame(specialFrame);specialFrame=undefined;
   special.node.remove();special=null;
   delete mech.dataset.special;delete mech.dataset.held;
   if(resume){park();planOrbit();planSword()}
  }
  function playSpecial(kind){
   if(!specialEnabled(kind)||!canPlaySpecial())return false;
   clearTimeout(orbitTimer);clearTimeout(swordTimer);clearTimeout(flashTimer);clearTimeout(holdTimer);
   delete mech.dataset.sword;delete mech.dataset.flash;
   const base=park()??.33,sideAtStart=side,startedAt=performance.now();
   const node=document.createElementNS('http://www.w3.org/2000/svg','svg');
   const laser=kind==='laser',duration=laser?2820:3200;
   node.setAttribute('class','wt-mech-special wt-mech-special--'+kind);
   node.setAttribute('aria-hidden','true');
   node.innerHTML=laser?laserArt:greatswordArt;
   if(!laser){
    node.setAttribute('viewBox','0 0 300 300');
    node.dataset.side=sideAtStart<0?'left':'right';
   }
   host.append(node);special={kind,node};mech.dataset.special=kind;inputs=[];
   const ray=node.querySelector('.wt-mech-laser-ray'),charge=node.querySelector('.wt-mech-laser-charge'),burst=node.querySelector('.wt-mech-laser-burst');
   const lines=ray?[...ray.children]:[],rings=charge?[...charge.querySelectorAll('circle')]:[],stars=charge?[...charge.querySelectorAll('path')]:[],waves=burst?[...burst.children]:[];
   const clamp=(v,min,max)=>min>max?(min+max)/2:Math.min(max,Math.max(min,v));
   const progress=value=>clamp(value,0,1),ease=t=>t*t*(3-2*t);
   function animate(now){
    const elapsed=now-startedAt;
    if(elapsed>=duration){endSpecial();return}
    const rect=host.getBoundingClientRect(),w=host.offsetWidth,h=host.offsetHeight,scale=rect.width/w||1;
    const lowX=(8-rect.left)/scale,highX=(window.innerWidth-8-rect.left)/scale;
    const lowY=(8-rect.top)/scale,highY=(window.innerHeight-8-rect.top)/scale;
    if(laser){
     const lift=ease(progress(elapsed/520))*(1-ease(progress((elapsed-2090)/690)));
     const flightMargin=Math.min(w*.32,(highX-lowX)*.2);
     const launchX=clamp((.5+sideAtStart*.56)*w,lowX+flightMargin,highX-flightMargin);
     const parkedX=(.5+sideAtStart*.5)*w;
     position((parkedX+(launchX-parkedX)*lift)/w-.5,base-(base+.22)*lift);
     node.setAttribute('viewBox','0 0 '+w+' '+h);
     const mechSize=mech.offsetWidth,face=mech.dataset.facing==='right'?1:-1;
     const x=mech.offsetLeft+face*mechSize*.075,y=mech.offsetTop+mechSize*.02;
     const sweep=ease(progress((elapsed-1190)/655));
     const cornerX=clamp((.5-sideAtStart*.55)*w,lowX+12,highX-12);
     const targetX=x+(cornerX-x)*sweep;
     const targetY=clamp(Math.max(h*.11,y+h*.23),lowY+12,highY-12);
     const angle=Math.atan2(targetX-x,targetY-y);
     const chargeUp=progress((elapsed-420)/680),fade=1-progress((elapsed-1850)/205);
     const power=progress((elapsed-1090)/100)*fade;
     const end=ease(progress((elapsed-1100)/100));
     ray.setAttribute('opacity',power);
     lines.forEach((line,i)=>{
      const wing=i<4?0:(i===4?-1:1)*-sideAtStart;
      const fromX=x+wing*mechSize*.18,fromY=y+wing*mechSize*.16;
      line.setAttribute('x1',fromX);line.setAttribute('y1',fromY);
      const endX=clamp(targetX+wing*w*.075,lowX+8,highX-8),endY=clamp(targetY+wing*h*.025,lowY+8,highY-8);
      line.setAttribute('x2',fromX+(endX-fromX)*end);
      line.setAttribute('y2',fromY+(endY-fromY)*end);
      line.setAttribute('stroke-width',mechSize*[.25,.145,.072,.027,.018,.014][i]*(.35+.65*power));
     });
     charge.setAttribute('transform','translate('+x+' '+y+') scale('+mechSize/96+')');
     charge.setAttribute('opacity',Math.min(1,chargeUp*2)*fade);
     rings.forEach((ring,i)=>ring.setAttribute('r',(6+i*6)*(1+chargeUp*.45)+Math.sin(elapsed*.022+i)*1.4));
     const radius=4+chargeUp*6;
     stars[0].setAttribute('d','M0 '+(-radius)+' 2 -2 '+radius+' 0 2 2 0 '+radius+' -2 2 '+(-radius)+' 0 -2 -2Z');
     stars[1].setAttribute('d','M-13 -9l2 2-2 2-2-2zM12 8l2 2-2 2-2-2z');
     const wave=progress((elapsed-1845)/390);
     burst.setAttribute('transform','translate('+targetX+' '+targetY+') rotate('+(-angle*180/Math.PI)+')');
     burst.setAttribute('opacity',elapsed<1845?0:1-wave);
     waves.forEach((ring,i)=>{ring.setAttribute('rx',mechSize*(.035+.17*wave+i*.046));ring.setAttribute('ry',mechSize*(.074+.22*wave+i*.044))});
    }else{
     const size=Math.min(w*1.08,Math.max(1,(highX-lowX)*.83),Math.max(1,(highY-lowY)*.82));
     const x=clamp(w*(.5-sideAtStart*.39),lowX+size*.43,highX-size*.43);
     const y=clamp(h*.39,lowY+size*.55,highY-size*.44);
     node.style.width=size+'px';node.style.left=x+'px';node.style.top=y+'px';
    }
    specialFrame=requestAnimationFrame(animate);
   }
   animate(startedAt);return true;
  }
  function clear(){
   endSpecial(false);cancelOrbit();clearTimeout(orbitTimer);clearTimeout(swordTimer);clearTimeout(flashTimer);release();inputs=[];
   if(layoutFrame!==undefined)cancelAnimationFrame(layoutFrame);
   layoutFrame=undefined;resize.disconnect();move.disconnect();
   if(mech){mech.remove();geometry()}mech=null;host=null;dock=null;updateDemand();
  }
  function attach(target){
   styles();
   host=target;dock=host.closest('.pet-dock')??host;
   mech=document.createElement('div');mech.className='wt-aemeath-mech';mech.setAttribute('aria-hidden','true');
   const body=document.createElement('div');body.className='wt-mech-sprite';
   for(const part of ['left-wing','right-wing','body']){
    const img=document.createElement('img');img.src=sprite;img.alt='';img.draggable=false;img.className='wt-mech-'+part;body.append(img);
   }
   const glow=document.createElement('span'),trail=document.createElement('span'),grip=document.createElement('span');
   glow.className='wt-mech-core';trail.className='wt-mech-trail';
   grip.className='wt-mech-grip';grip.innerHTML=swordArt;
   body.append(glow,trail,grip);
   const sword=grip.firstElementChild;
   sword.addEventListener('animationend',()=>{if(mech)delete mech.dataset.sword});
   mech.append(body);host.append(mech);geometry();
   resize.observe(host);move.observe(dock,{attributes:true,attributeFilter:['style','class']});
  }
  function sync(){
   if(!eligible()){tree.disconnect();clear();return}
   if(!sprite){
    if(!pending)pending=load().then(module=>{
     sprite=module.helperThemeAssets?.aemeath?.mech??'';
     if(sprite)sync();
    }).catch(()=>{pending=null});
    return;
   }
   tree.observe(document.body,{childList:true,subtree:true});
   const target=root();
   if(!target?.isConnected){clear();return}
   if(target!==host||!mech?.isConnected){clear();attach(target)}
   cfg.idle?mech.setAttribute('data-idle',''):mech.removeAttribute('data-idle');
   if(!cfg.input||!cfg.wings){clearTimeout(holdTimer);delete mech.dataset.held}
   if(cfg.input&&cfg.flash)mech.dataset.core='';
   else{clearTimeout(flashTimer);delete mech.dataset.core;delete mech.dataset.flash}
   if(!cfg.orbit||motion.matches)cancelOrbit();
   if(special&&!specialEnabled(special.kind))endSpecial();
   if(!specialEnabled('laser'))clearTimeout(laserTimer);
   if(!inputActive())release();
   if(!cfg.sword||motion.matches)delete mech.dataset.sword;
   if(frame===undefined&&!special){park();planOrbit();planSword()}
   updateDemand();
  }
  function reload(){cfg=read();sync()}
  const storage=event=>{if(event.key===key||event.key===null)reload()};
  const pageVisibility=()=>{if(document.hidden){release();endSpecial(false);cancelOrbit()}else sync()};
  return {inputActive,input,release,sync,start(){
   started=true;
   window.addEventListener('storage',storage);window.addEventListener('resize',scheduleLayout);
   document.addEventListener('visibilitychange',pageVisibility);motion.addEventListener('change',sync);
   if(typeof listen==='function')Promise.resolve().then(()=>listen(eventName,reload)).then(stop=>{if(disposed)stop();else unlisten=stop}).catch(()=>{});
   sync();
  },dispose(){
   disposed=true;tree.disconnect();clear();unlisten?.();
   window.removeEventListener('storage',storage);window.removeEventListener('resize',scheduleLayout);
   document.removeEventListener('visibilitychange',pageVisibility);motion.removeEventListener('change',sync);
  }};
 }
 return {create,mount,isAemeath};
})();
