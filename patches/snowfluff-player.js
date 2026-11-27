function __wtPlayerHit(target,convert){
 window.__wtPlayerPoint=convert;
 return !!target.closest('.wt-snowfluff')&&!target.closest('button');
}
const __wtSnowfluffPlayer=(()=>{
 const prefsKey='wuwatappo-snowfluff-prefs-v1';
 const tracks=[
  ['纸飞机','https://www.bilibili.com/video/BV1QAkcBtENr/'],
  ['靛青宇宙','https://www.bilibili.com/video/BV1gnrZBJEHs/'],
  ['碎花','https://www.bilibili.com/video/BV1DnrZBJErx/']
 ];
 const icons={
  play:'<path d="M8 5l12 7-12 7z" fill="currentColor" stroke="none"/>',
  pause:'<path d="M9 5v14m6-14v14" stroke-width="3"/>',
  previous:'<path d="M6 5v14m13-14-10 7 10 7z"/>',
  next:'<path d="M18 5v14M5 5l10 7-10 7z"/>',
  modeList:'<path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
  modeOne:'<path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/><path d="M11 10h1.5v5" stroke-width="2"/>',
  modeShuffle:'<path d="M16 3h5v5"/><path d="M4 20 21 3"/><path d="M21 16v5h-5"/><path d="M15 15l6 6"/><path d="M4 4l5 5"/>',
  volume:'<path d="M11 5L6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 6a8.5 8.5 0 0 1 0 12"/>',
  muted:'<path d="M11 5L6 9H2v6h4l5 4z"/><path d="m22 9-6 6m0-6 6 6"/>',
  settings:'<path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z"/><path d="m10 3-.5 2.2-1.6.9L5.7 5.4 4 8.4l1.6 1.5v2.2L4 13.6l1.7 3 2.2-.7 1.6.9.5 2.2h4l.5-2.2 1.6-.9 2.2.7 1.7-3-1.6-1.5V9.9L20 8.4l-1.7-3-2.2.7-1.6-.9L14 3z" transform="translate(0 1)"/>',
  close:'<path d="m7 7 10 10M17 7 7 17"/>',
  external:'<path d="M13 5h6v6m0-6-8 8m7 0v6H5V6h6"/>'
 };
 const icon=name=>'<svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+icons[name]+'</svg>';
 function iconButton(button,name,label){
  button.innerHTML=icon(name);button.title=label;button.setAttribute('aria-label',label);
 }
 function readPrefs(){
  try{
   const saved=JSON.parse(localStorage.getItem(prefsKey)||'{}');
   const volume=typeof saved.volume==='number'&&Number.isFinite(saved.volume)?Math.min(1,Math.max(0,saved.volume)):0.8;
   const mode=['list','one','shuffle'].includes(saved.mode)?saved.mode:'list';
   return {volume,muted:saved.muted===true,mode};
  }catch{return {volume:0.8,muted:false,mode:'list'}}
 }
 function savePrefs(prefs){try{localStorage.setItem(prefsKey,JSON.stringify(prefs))}catch{}}
 function formatTime(seconds){
  if(!Number.isFinite(seconds)||seconds<0)return '00:00';
  const s=Math.floor(seconds),m=Math.floor(s/60);
  return String(m).padStart(2,'0')+':'+String(s%60).padStart(2,'0');
 }
 const css=`
.pet-toolbar:has(.wt-snowfluff-star) .settings-btn{position:relative}
.wt-snowfluff-star{position:absolute;inset:0 auto 0 0;z-index:1;width:23px;height:100%;padding:0;border:0;background:none;cursor:pointer;border-radius:12px;pointer-events:auto}
.wt-snowfluff-star:hover,.wt-snowfluff-star[aria-expanded=true]{background:#ffc4e54a}
.wt-snowfluff-star:focus-visible,.wt-snowfluff button:focus-visible,.wt-snowfluff select:focus-visible,.wt-snowfluff a:focus-visible,.wt-snowfluff input:focus-visible{outline:2px solid var(--wt-ui-focus,#9c4975);outline-offset:1px}
.pet-info-container:has(.wt-snowfluff:not([hidden])){z-index:25}
.wt-snowfluff{position:absolute;z-index:30;width:206px;max-width:calc(100vw - 12px);box-sizing:border-box;padding:8px;border-radius:12px;border:1px solid var(--wt-ui-border,#dda0bb);background:var(--wt-ui-field,#fff0f8);box-shadow:0 4px 12px #73334f44;color:var(--wt-ui-text,#793050);font:12px/1.3 "Microsoft YaHei",sans-serif;pointer-events:auto;touch-action:auto}
.wt-snowfluff[hidden]{display:none!important}
.wt-snowfluff header,.wt-snowfluff-controls{display:flex;align-items:center;gap:4px}
.wt-snowfluff header{justify-content:space-between;margin-bottom:5px}
.wt-snowfluff button,.wt-snowfluff select,.wt-snowfluff a{position:static;border:1px solid var(--wt-ui-border,#dda0bb);border-radius:7px;color:inherit;background:var(--wt-ui-surface,#fff9fc);min-height:22px;font:inherit;padding:2px 5px;text-decoration:none}
.wt-snowfluff button,.wt-snowfluff a{cursor:pointer}
.wt-snowfluff button:disabled{opacity:.45;cursor:default}
.wt-snowfluff [data-track]{display:flex;align-items:center;justify-content:space-between;gap:5px;width:100%;text-align:left;box-sizing:border-box;margin:0 0 5px}
.wt-snowfluff [data-track] span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.wt-snowfluff [data-track-list]{max-height:96px;overflow-y:auto;overscroll-behavior:contain;scrollbar-width:none;margin:0 0 5px}
.wt-snowfluff [data-track-list] button{display:block;width:100%;text-align:left}
.wt-snowfluff [data-track-list] button[aria-current=true]{background:var(--wt-ui-accent-fill,#ffd5e8)}
.wt-snowfluff input[type=file],.wt-snowfluff audio{display:none}
.wt-snowfluff-progress{display:grid;gap:2px;margin:0 0 6px}
.wt-snowfluff-progress[hidden]{display:none}
.wt-snowfluff-progress input[type=range],.wt-snowfluff-volume input[type=range]{-webkit-appearance:none;appearance:none;width:100%;height:6px;margin:4px 0;border-radius:99px;background:linear-gradient(to right,var(--wt-ui-accent,#df639c) var(--wt-p,0%),var(--wt-ui-divider,#ecc3d6) var(--wt-p,0%));cursor:pointer}
.wt-snowfluff-progress input[type=range]::-webkit-slider-thumb,.wt-snowfluff-volume input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:13px;height:13px;border-radius:50%;background:var(--wt-ui-accent,#df639c);border:2px solid var(--wt-ui-surface,#fff9fc);box-shadow:0 1px 3px #73334f44}
.wt-snowfluff-times{display:flex;justify-content:space-between;font-size:10px;color:var(--wt-ui-muted,#805169);font-variant-numeric:tabular-nums}
.wt-snowfluff-controls{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:4px}
.wt-snowfluff button:has(svg){display:grid;place-items:center;min-height:28px;padding:3px}
.wt-snowfluff [data-play]{background:var(--wt-ui-accent-fill,#ffd5e8)}
.wt-snowfluff [data-settings-box]{display:grid;gap:6px;margin-top:6px;padding-top:6px;border-top:1px solid var(--wt-ui-divider,#ecc3d6)}
.wt-snowfluff [data-settings-box][hidden]{display:none}
.wt-snowfluff-volume{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:5px}
.wt-snowfluff-volume button{min-height:24px;width:24px;padding:2px}
.wt-snowfluff-volume span{font-size:10px;min-width:28px;text-align:right;font-variant-numeric:tabular-nums;color:var(--wt-ui-muted,#805169)}
.wt-snowfluff-folder-row{display:flex;gap:4px;flex-wrap:wrap}
.wt-snowfluff-folder-row button{flex:1 1 auto;font-size:11px}
.wt-snowfluff-status{display:block;margin-top:4px;overflow-wrap:anywhere;font-size:11px;color:var(--wt-ui-muted,#805169)}
`;
 function create(root=document.body,open=url=>openUrl(url),load=()=>import('http://127.0.0.1:48642/ui.js'),point=(x,y)=>window.__wtPlayerPoint?.(x,y)){
  const style=document.createElement('style');style.setAttribute('data-wt-theme-sheet','snowfluff');style.textContent=css;document.head.append(style);
  const star=document.createElement('button'),panel=document.createElement('section');
  star.type='button';star.className='wt-snowfluff-star';star.title='飞行雪绒播放器';
  star.setAttribute('aria-label',star.title);star.setAttribute('aria-controls','wt-snowfluff-player');star.setAttribute('aria-expanded','false');
  panel.className='wt-snowfluff';panel.id='wt-snowfluff-player';panel.hidden=true;panel.setAttribute('aria-label',star.title);
  panel.innerHTML='<header><strong>飞行雪绒 · 播放器</strong><button type="button" data-close></button></header><button type="button" data-track aria-expanded="false"><span></span><svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14"><path d="m3 5 4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.5"/></svg></button><div data-track-list role="group" aria-label="曲目" hidden></div><div class="wt-snowfluff-progress" hidden><input type="range" data-seek min="0" max="1000" value="0" aria-label="播放进度"><div class="wt-snowfluff-times"><span data-cur>00:00</span><span data-dur>00:00</span></div></div><div class="wt-snowfluff-controls"><button type="button" data-prev></button><button type="button" data-play></button><button type="button" data-next></button><button type="button" data-mode></button><button type="button" data-settings aria-expanded="false"></button></div><div data-settings-box hidden><div class="wt-snowfluff-volume"><button type="button" data-mute></button><input type="range" data-volume min="0" max="100" value="80" aria-label="播放器音量"><span data-volume-text>80%</span></div><div class="wt-snowfluff-folder-row"><button type="button" data-folder>选择音乐文件夹</button><button type="button" data-clear-folder hidden>清除文件夹</button></div></div><span class="wt-snowfluff-status" role="status"></span><input type="file" accept="audio/*,.mp3,.m4a,.flac,.wav,.ogg,.opus,.aac,.webm" webkitdirectory multiple><audio preload="none"></audio>';
  const trackButton=panel.querySelector('[data-track]'),trackList=panel.querySelector('[data-track-list]');
  const progressBox=panel.querySelector('.wt-snowfluff-progress'),seek=panel.querySelector('[data-seek]'),curEl=panel.querySelector('[data-cur]'),durEl=panel.querySelector('[data-dur]');
  const play=panel.querySelector('[data-play]'),prev=panel.querySelector('[data-prev]'),next=panel.querySelector('[data-next]'),modeBtn=panel.querySelector('[data-mode]'),status=panel.querySelector('[role=status]');
  const settings=panel.querySelector('[data-settings]'),settingsBox=panel.querySelector('[data-settings-box]'),close=panel.querySelector('[data-close]');
  const muteBtn=panel.querySelector('[data-mute]'),volRange=panel.querySelector('[data-volume]'),volText=panel.querySelector('[data-volume-text]'),clearFolderBtn=panel.querySelector('[data-clear-folder]');
  iconButton(close,'close','关闭播放器');iconButton(prev,'previous','上一首');iconButton(next,'next','下一首');iconButton(settings,'settings','播放器设置');
  const input=panel.querySelector('input[type=file]'),audio=panel.querySelector('audio');
  let prefs=readPrefs(),files=[],persisted=[],persistedFolder='',defaults=[],options=[],selectedIndex=0,playingIndex=-1,objectUrl='',disposed=false,loadedModule=null,seeking=false;
  let scrollSession=null;
  const domWheel=[];
  function applyVolume(){
   audio.volume=prefs.volume;audio.muted=prefs.muted;
   const pct=Math.round(prefs.volume*100);
   volRange.value=String(pct);volRange.style.setProperty('--wt-p',(prefs.muted?0:pct)+'%');
   volText.textContent=prefs.muted?'0%':pct+'%';
   iconButton(muteBtn,prefs.muted||prefs.volume===0?'muted':'volume',prefs.muted?'取消静音':'静音');
  }
  function applyModeButton(){
   const map={list:['modeList','顺序循环'],one:['modeOne','单曲循环'],shuffle:['modeShuffle','随机播放']};
   const [ic,label]=map[prefs.mode]||map.list;
   iconButton(modeBtn,ic,label);
   audio.loop=prefs.mode==='one';
  }
  applyVolume();applyModeButton();
  function matchWheel(events,delta){
   const now=performance.now();
   while(events.length&&now-events[0].at>120)events.shift();
   const index=events.findIndex(event=>Math.sign(event.delta)===Math.sign(delta));
   return index<0?null:events.splice(index,1)[0];
  }
  window.__wtPlayerHit=__wtPlayerHit;
  function stopScroll(){
   if(!scrollSession)return;
   clearTimeout(scrollSession.timer);
   for(const event of scrollSession.wheel)clearTimeout(event.timer);
   scrollSession.abort.abort();scrollSession=null;domWheel.length=0;
  }
  function startScroll(){
   stopScroll();
   const session={abort:new AbortController(),cursor:null,ready:false,wheel:[]};
   scrollSession=session;
   function consume(event){
    const p=point(event.x,event.y);
    if(event.delta&&p&&trackList.contains(document.elementFromPoint(p.x,p.y))){
     const delta=-event.delta;
     if(matchWheel(domWheel,delta))return;
     const pending={at:performance.now(),delta,timer:setTimeout(()=>{
      const index=session.wheel.indexOf(pending);
      if(index<0)return;
      session.wheel.splice(index,1);
      if(scrollSession===session)trackList.scrollTop+=delta;
     },45)};
     session.wheel.push(pending);
    }
   }
   async function poll(){
    try{
     const response=await fetch('http://127.0.0.1:48642/player-scroll?after='+(session.cursor??0),{cache:'no-store',signal:AbortSignal.any([session.abort.signal,AbortSignal.timeout(1500)])});
     if(!response.ok)throw Error('scroll service');
     const data=await response.json();
     if(scrollSession!==session)return;
     session.ready=data.available===true;
     if(session.ready&&session.cursor!==null&&data.seq>=session.cursor){
      for(const event of data.events)if(event.seq>session.cursor)consume(event);
     }
     session.cursor=session.ready?data.seq:null;
    }catch{session.ready=false;session.cursor=null}
    if(scrollSession===session)session.timer=setTimeout(poll,session.ready?24:250);
   }
   poll();
  }
  const caption=({name,file,src})=>name+(file||src?'':' · 官方试听');
  function syncProgress(){
   const active=playingIndex>=0&&Number.isFinite(audio.duration)&&audio.duration>0;
   progressBox.hidden=playingIndex<0;
   if(!active){curEl.textContent=formatTime(audio.currentTime||0);durEl.textContent='00:00';if(!seeking){seek.value='0';seek.style.setProperty('--wt-p','0%')}return}
   curEl.textContent=formatTime(audio.currentTime);durEl.textContent=formatTime(audio.duration);
   if(!seeking){const v=Math.round(audio.currentTime/audio.duration*1000);seek.value=String(v);seek.style.setProperty('--wt-p',(v/10).toFixed(1)+'%')}
  }
  function resetAudio(){
   playingIndex=-1;audio.pause();audio.removeAttribute('src');audio.load();
   if(objectUrl){URL.revokeObjectURL(objectUrl);objectUrl=''}
   syncProgress();
  }
  function populate(){
   const localItems=persisted.length?persisted:files.map(file=>({name:file.name.replace(/\.[^.]+$/,''),file}));
   const official=tracks.map(([name,url])=>({name,url,file:files.find(item=>item.name.includes(name)),src:persisted.find(item=>item.name.includes(name))?.src}));
   const seenFiles=new Set(official.map(item=>item.file).filter(Boolean));
   const seenSrc=new Set(official.map(item=>item.src).filter(Boolean));
   options=[...defaults,...localItems.filter(item=>(!item.file||!seenFiles.has(item.file))&&(!item.src||!seenSrc.has(item.src))),...official];
   selectedIndex=0;
   clearFolderBtn.hidden=!persistedFolder&&!files.length;
   trackList.replaceChildren(...options.map((item,index)=>{
    const option=document.createElement('button');option.type='button';option.dataset.trackIndex=index;
    option.textContent=caption(item);if(item.artist)option.title=item.artist;return option;
   }));
   refresh();
  }
  function refresh(){
   const index=selectedIndex,track=options[index];
   trackButton.firstElementChild.textContent=track?caption(track):'暂无曲目';
   trackButton.setAttribute('aria-label',track?'曲目：'+caption(track):'曲目');
   trackList.querySelector('[aria-current=true]')?.removeAttribute('aria-current');
   trackList.children[index]?.setAttribute('aria-current','true');
   const playing=playingIndex===index&&!audio.paused;
   if(track?.file||track?.src)iconButton(play,playing?'pause':'play',playing?'暂停':playingIndex===index&&audio.currentTime>0?'继续':'播放');
   else iconButton(play,'external','官方试听');
   prev.disabled=next.disabled=options.filter(item=>item.file||item.src).length<2;
   syncProgress();
  }
  async function start(index){
   const item=options[index];
   if(!item?.file&&!item?.src){
    if(item?.url)try{await open(item.url)}catch{status.textContent='无法打开官方试听页面'}
    return;
   }
   if(index===playingIndex&&!audio.paused){audio.pause();return}
   if(index!==playingIndex){
    resetAudio();if(item.file)objectUrl=URL.createObjectURL(item.file);audio.src=objectUrl||item.src;playingIndex=index;
   }
   status.textContent=item.name;
   try{await audio.play()}catch(error){if(index===playingIndex&&error.name!=='AbortError')status.textContent='无法播放这首歌，请检查音频格式'}
   syncProgress();place();
  }
  function advance(direction=1){
   const playable=options.map((item,i)=>item.file||item.src?i:-1).filter(i=>i>=0);
   if(!playable.length)return;
   if(prefs.mode==='shuffle'&&playable.length>1){
    const pool=playable.filter(i=>i!==selectedIndex);
    const pick=pool[Math.floor(Math.random()*pool.length)];
    selectedIndex=pick;refresh();start(pick);return;
   }
   const index=selectedIndex;
   for(let step=1;step<=options.length;step++){
    const candidate=(index+direction*step+options.length)%options.length;
    if(options[candidate].file||options[candidate].src){selectedIndex=candidate;refresh();start(candidate);return}
   }
  }
  let frame,geometryFrame,watched;
  function geometry(){
   if(geometryFrame!==undefined)return;
   geometryFrame=requestAnimationFrame(()=>{
    geometryFrame=undefined;
    window.dispatchEvent(new CustomEvent('pet-toast-geometry-changed',{detail:true}));
   });
  }
  function place(){
   if(panel.hidden||!panel.isConnected)return;
   const host=panel.offsetParent;if(!host)return;
   const pet=host.closest('.pet-dock-content')??host.parentElement;
   const base=host.getBoundingClientRect(),body=(pet.querySelector('.cat-wrap')??host).getBoundingClientRect(),trigger=star.getBoundingClientRect();
   const scale=base.width/host.offsetWidth||1,box=panel.getBoundingClientRect(),w=box.width,h=box.height;
   const gap=8,pad=6,vw=window.innerWidth,vh=window.innerHeight;
   const centeredX=(trigger.left+trigger.right-w)/2,centeredY=(trigger.top+trigger.bottom-h)/2;
   const clamp=(value,max)=>Math.max(pad,Math.min(value,max-pad));
   const candidates=[
    ['right',body.right+gap,clamp(centeredY,vh-h),vw-body.right-gap-pad-w],
    ['left',body.left-gap-w,clamp(centeredY,vh-h),body.left-gap-pad-w],
    ['bottom',clamp(centeredX,vw-w),base.bottom+gap,vh-base.bottom-gap-pad-h],
    ['top',clamp(centeredX,vw-w),body.top-gap-h,body.top-gap-pad-h]
   ];
   const obstacles=[...pet.querySelectorAll('.reward-anchor,.emotion-menu,.wt-aemeath-mech,#wt-input-keyboard:not([hidden])')].map(node=>node.getBoundingClientRect());
   const overlap=(x,y,r)=>Math.max(0,Math.min(x+w,r.right)-Math.max(x,r.left))*Math.max(0,Math.min(y+h,r.bottom)-Math.max(y,r.top));
   const ranked=candidates.map(([side,x,y,room])=>({side,x:clamp(x,vw-w),y:clamp(y,vh-h),room})).map(c=>({...c,cost:(c.room<0?1e5-c.room:0)+overlap(c.x,c.y,body)*4+obstacles.reduce((sum,r)=>sum+overlap(c.x,c.y,r),0)-(c.side===panel.dataset.side?500:0)})).sort((a,b)=>a.cost-b.cost);
   const best=ranked[0],left=(best.x-base.left)/scale+'px',top=(best.y-base.top)/scale+'px';
   const layout=[left,top,w,h].join(':');
   if(layout!==panel.dataset.layout){panel.dataset.layout=layout;panel.style.left=left;panel.style.top=top;panel.dataset.side=best.side;geometry()}
  }
  function schedule(){if(!panel.hidden&&frame===undefined)frame=requestAnimationFrame(()=>{frame=undefined;place()})}
  const resize=new ResizeObserver(schedule),move=new MutationObserver(schedule);
  function expanded(on){
   panel.hidden=!on;star.setAttribute('aria-expanded',String(on));
   if(on)place();
   else{showTracks(false);delete panel.dataset.side;delete panel.dataset.layout}
   geometry();
  }
  function attach(){
   const toolbar=root.querySelector('.pet-toolbar'),counter=toolbar?.closest('.pet-info-container');
   if(!counter)return;
   if(star.parentNode!==toolbar){toolbar.append(star);geometry()}
   if(panel.parentNode!==counter){counter.append(panel);geometry()}
   const dock=counter.closest('.pet-dock')??counter;
   if(watched!==dock){watched=dock;move.disconnect();move.observe(dock,{attributes:true,attributeFilter:['style','class']})}
   schedule();
  }
  star.addEventListener('click',()=>expanded(panel.hidden));
  star.addEventListener('mousedown',event=>event.stopPropagation());
  close.addEventListener('click',()=>{expanded(false);star.focus()});
  settings.addEventListener('click',()=>{settingsBox.hidden=!settingsBox.hidden;settings.setAttribute('aria-expanded',String(!settingsBox.hidden));place()});
  modeBtn.addEventListener('click',()=>{
   const order=['list','one','shuffle'];
   prefs={...prefs,mode:order[(order.indexOf(prefs.mode)+1)%order.length]};
   savePrefs(prefs);applyModeButton();
   status.textContent={list:'播放模式：顺序循环',one:'播放模式：单曲循环',shuffle:'播放模式：随机播放'}[prefs.mode];
  });
  muteBtn.addEventListener('click',()=>{
   prefs={...prefs,muted:!prefs.muted};savePrefs(prefs);applyVolume();
  });
  volRange.addEventListener('input',()=>{
   prefs={...prefs,volume:Math.min(1,Math.max(0,Number(volRange.value)/100)),muted:false};
   savePrefs(prefs);applyVolume();
  });
  seek.addEventListener('pointerdown',()=>{seeking=true});
  seek.addEventListener('pointerup',()=>{seeking=false});
  seek.addEventListener('input',()=>{
   seek.style.setProperty('--wt-p',(Number(seek.value)/10).toFixed(1)+'%');
   if(Number.isFinite(audio.duration)&&audio.duration>0){
    const target=Number(seek.value)/1000*audio.duration;
    curEl.textContent=formatTime(target);
   }
  });
  seek.addEventListener('change',()=>{
   seeking=false;
   if(Number.isFinite(audio.duration)&&audio.duration>0)audio.currentTime=Number(seek.value)/1000*audio.duration;
  });
  for(const type of ['pointerdown','mousedown','click'])panel.addEventListener(type,event=>event.stopPropagation());
  trackList.addEventListener('wheel',event=>{
   if(event.ctrlKey||!event.deltaY||trackList.scrollHeight<=trackList.clientHeight)return;
   event.preventDefault();event.stopPropagation();
   const unit=event.deltaMode===1?22:event.deltaMode===2?trackList.clientHeight:1;
   const delta=event.deltaY*unit;
   if(scrollSession?.ready&&window.__wtPlayerPoint){
    const pending=matchWheel(scrollSession.wheel,delta);
    if(pending)clearTimeout(pending.timer);
    else{
     domWheel.push({at:performance.now(),delta});
     if(domWheel.length>16)domWheel.shift();
    }
   }
   trackList.scrollTop+=delta;
  },{passive:false});
  function showTracks(show){trackList.hidden=!show;trackButton.setAttribute('aria-expanded',String(show));place();if(show)startScroll();else stopScroll()}
  trackButton.addEventListener('click',()=>showTracks(trackList.hidden));
  trackList.addEventListener('click',event=>{
   const item=event.target.closest('[data-track-index]');if(!item)return;
   selectedIndex=Number(item.dataset.trackIndex);refresh();showTracks(false);
  });
  panel.addEventListener('keydown',event=>{
   if(event.key!=='Escape')return;
   event.stopPropagation();
   if(!trackList.hidden){showTracks(false);trackButton.focus()}
   else{expanded(false);star.focus()}
  });
  panel.querySelector('[data-folder]').addEventListener('click',async()=>{
   if(typeof loadedModule?.pickMusicFolder==='function'){
    try{
     const res=await loadedModule.pickMusicFolder();
     if(res?.cancelled)return;
     if(res?.error)throw Error(res.error);
     files=[];persisted=res.tracks??[];persistedFolder=res.folder||'';
     resetAudio();populate();
     const first=options.findIndex(item=>persisted.includes(item));if(first>=0)selectedIndex=first;
     status.textContent=persisted.length?'已载入 '+persisted.length+' 首本地音乐':'文件夹里没有支持的音频文件';
     refresh();place();return;
    }catch(error){status.textContent=error.message||'无法打开音乐文件夹';return}
   }
   try{if(typeof input.showPicker==='function')input.showPicker();else input.click()}
   catch{status.textContent='请用鼠标直接点击，或退出游戏模式后选择文件夹'}
  });
  clearFolderBtn.addEventListener('click',async()=>{
   if(typeof loadedModule?.clearMusicFolder==='function'){
    try{await loadedModule.clearMusicFolder()}catch{}
   }
   files=[];persisted=[];persistedFolder='';resetAudio();populate();
   status.textContent='已清除本地音乐文件夹';refresh();place();
  });
  input.addEventListener('change',()=>{
   const chosen=Array.from(input.files??[]);input.value='';
   if(!chosen.length)return;
   persisted=[];persistedFolder='';
   files=chosen.filter(file=>/\.(mp3|m4a|flac|wav|ogg|opus|aac|webm)$/i.test(file.name)).sort((a,b)=>a.name.localeCompare(b.name,'zh-CN',{numeric:true}));
   resetAudio();populate();
   const first=options.findIndex(item=>item.file);if(first>=0)selectedIndex=first;
   status.textContent=files.length?'已载入 '+files.length+' 首本地音乐':'文件夹里没有支持的音频文件';
   refresh();
  });
  play.addEventListener('click',()=>start(selectedIndex));
  next.addEventListener('click',()=>advance());prev.addEventListener('click',()=>advance(-1));
  for(const event of ['play','pause'])audio.addEventListener(event,refresh);
  for(const event of ['timeupdate','loadedmetadata','durationchange'])audio.addEventListener(event,syncProgress);
  audio.addEventListener('ended',()=>{if(prefs.mode==='one'){audio.currentTime=0;audio.play().catch(()=>{});return}if(playingIndex>=0){selectedIndex=playingIndex;advance()}refresh()});
  const observer=new MutationObserver(attach);observer.observe(root,{childList:true,subtree:true});
  resize.observe(panel);window.addEventListener('resize',schedule);
  populate();attach();
  Promise.resolve().then(load).then(async module=>{
   if(disposed)return;
   loadedModule=module;
   const [packs,music]=await Promise.all([
    module.loadThemePacks().catch(()=>({})),
    typeof module.loadMusicLibrary==='function'?module.loadMusicLibrary().catch(()=>null):null
   ]);
   if(disposed)return;
   defaults=(packs?.aemeath?.songs??[]).map(({name,artist,url})=>({name,artist,src:url}));
   if(music?.hasFolder){persisted=music.tracks??[];persistedFolder=music.folder||''}
   const selected=options[selectedIndex],playing=options[playingIndex];
   populate();
   if(playing){playingIndex=options.findIndex(item=>item.file===playing.file&&item.name===playing.name)}
   if(selected&&(files.length||persisted.length||playing)){const index=options.findIndex(item=>item.file===selected.file&&item.name===selected.name);if(index>=0)selectedIndex=index}
   refresh();
  }).catch(()=>{});
  return ()=>{disposed=true;stopScroll();observer.disconnect();resize.disconnect();move.disconnect();window.removeEventListener('resize',schedule);if(frame!==undefined)cancelAnimationFrame(frame);resetAudio();star.remove();panel.remove();style.remove();geometry()};
 }
 return {create};
})();
