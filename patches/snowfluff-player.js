const __wtSnowfluffPlayer=(()=>{
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
  settings:'<path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z"/><path d="m10 3-.5 2.2-1.6.9L5.7 5.4 4 8.4l1.6 1.5v2.2L4 13.6l1.7 3 2.2-.7 1.6.9.5 2.2h4l.5-2.2 1.6-.9 2.2.7 1.7-3-1.6-1.5V9.9L20 8.4l-1.7-3-2.2.7-1.6-.9L14 3z" transform="translate(0 1)"/>',
  close:'<path d="m7 7 10 10M17 7 7 17"/>',
  external:'<path d="M13 5h6v6m0-6-8 8m7 0v6H5V6h6"/>'
 };
 const icon=name=>'<svg aria-hidden="true" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+icons[name]+'</svg>';
 function iconButton(button,name,label){
  button.innerHTML=icon(name);button.title=label;button.setAttribute('aria-label',label);
 }
 const css=`
.pet-toolbar:has(.wt-snowfluff-star) .settings-btn{position:relative}
.wt-snowfluff-star{position:absolute;inset:0 auto 0 0;z-index:1;width:23px;height:100%;padding:0;border:0;background:none;cursor:pointer;border-radius:12px;pointer-events:auto}
.wt-snowfluff-star:hover,.wt-snowfluff-star[aria-expanded=true]{background:#ffc4e54a}
.wt-snowfluff-star:focus-visible,.wt-snowfluff button:focus-visible,.wt-snowfluff select:focus-visible,.wt-snowfluff a:focus-visible{outline:2px solid #9c4975;outline-offset:1px}
.pet-info-container:has(.wt-snowfluff:not([hidden])){z-index:8}
.wt-snowfluff{position:absolute;z-index:30;width:190px;max-width:calc(100vw - 12px);box-sizing:border-box;padding:8px;border-radius:12px;border:1px solid var(--wt-ui-border,#dda0bb);background:#fff0f8;box-shadow:0 4px 12px #73334f44;color:var(--wt-ui-text,#793050);font:12px/1.3 "Microsoft YaHei",sans-serif;pointer-events:auto;touch-action:auto}
.wt-snowfluff[hidden]{display:none!important}
.wt-snowfluff header,.wt-snowfluff-controls{display:flex;align-items:center;gap:4px}
.wt-snowfluff header{justify-content:space-between;margin-bottom:5px}
.wt-snowfluff button,.wt-snowfluff select,.wt-snowfluff a{position:static;border:1px solid #dda0bb;border-radius:7px;color:inherit;background:#fff9fc;min-height:22px;font:inherit;padding:2px 5px;text-decoration:none}
.wt-snowfluff button,.wt-snowfluff a{cursor:pointer}
.wt-snowfluff button:disabled{opacity:.45;cursor:default}
.wt-snowfluff [data-track]{display:flex;align-items:center;justify-content:space-between;gap:5px;width:100%;text-align:left;box-sizing:border-box;margin:0 0 5px}
.wt-snowfluff [data-track] span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.wt-snowfluff [data-track-list]{max-height:96px;overflow-y:auto;overscroll-behavior:contain;scrollbar-gutter:stable;scrollbar-color:#d792b3 #ffe6f2;margin:0 0 5px}
.wt-snowfluff [data-track-list] button{display:block;width:100%;text-align:left}
.wt-snowfluff [data-track-list] button[aria-current=true]{background:#ffd5e8}
.wt-snowfluff input[type=file],.wt-snowfluff audio{display:none}
.wt-snowfluff-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px}
.wt-snowfluff button:has(svg){display:grid;place-items:center;min-height:28px;padding:3px}
.wt-snowfluff [data-play]{background:#ffd5e8}
.wt-snowfluff [data-settings-box]{margin-top:6px}
.wt-snowfluff-status{display:block;margin-top:4px;overflow-wrap:anywhere;color:var(--wt-ui-muted,#805169)}
`;
 function create(root=document.body,open=url=>openUrl(url),load=()=>import('http://127.0.0.1:48642/ui.js')){
  const style=document.createElement('style');style.setAttribute('data-wt-theme-sheet','snowfluff');style.textContent=css;document.head.append(style);
  const star=document.createElement('button'),panel=document.createElement('section');
  star.type='button';star.className='wt-snowfluff-star';star.title='飞行雪绒播放器';
  star.setAttribute('aria-label',star.title);star.setAttribute('aria-controls','wt-snowfluff-player');star.setAttribute('aria-expanded','false');
  panel.className='wt-snowfluff';panel.id='wt-snowfluff-player';panel.hidden=true;panel.setAttribute('aria-label',star.title);
  panel.innerHTML='<header><strong>飞行雪绒 · 播放器</strong><button type="button" data-close></button></header><button type="button" data-track aria-expanded="false"><span></span><svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14"><path d="m3 5 4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.5"/></svg></button><div data-track-list role="group" aria-label="曲目" hidden></div><div class="wt-snowfluff-controls"><button type="button" data-prev></button><button type="button" data-play></button><button type="button" data-next></button><button type="button" data-settings aria-expanded="false"></button></div><div data-settings-box hidden><button type="button" data-folder>选择音乐文件夹</button></div><span class="wt-snowfluff-status" role="status"></span><input type="file" accept="audio/*,.mp3,.m4a,.flac,.wav,.ogg,.opus,.aac,.webm" webkitdirectory multiple><audio preload="none"></audio>';
  const trackButton=panel.querySelector('[data-track]'),trackList=panel.querySelector('[data-track-list]');
  const play=panel.querySelector('[data-play]'),prev=panel.querySelector('[data-prev]'),next=panel.querySelector('[data-next]'),status=panel.querySelector('[role=status]');
  const settings=panel.querySelector('[data-settings]'),settingsBox=panel.querySelector('[data-settings-box]'),close=panel.querySelector('[data-close]');
  iconButton(close,'close','关闭播放器');iconButton(prev,'previous','上一首');iconButton(next,'next','下一首');iconButton(settings,'settings','播放器设置');
  const input=panel.querySelector('input'),audio=panel.querySelector('audio');
  let files=[],defaults=[],options=[],selectedIndex=0,playingIndex=-1,objectUrl='',disposed=false;
  const caption=({name,file,src})=>name+(file||src?'':' · 官方试听');
  function resetAudio(){
   playingIndex=-1;audio.pause();audio.removeAttribute('src');audio.load();
   if(objectUrl){URL.revokeObjectURL(objectUrl);objectUrl=''}
  }
  function populate(){
   const official=tracks.map(([name,url])=>({name,url,file:files.find(item=>item.name.includes(name))}));
   const seen=new Set(official.map(item=>item.file).filter(Boolean));
   options=[...defaults,...files.filter(file=>!seen.has(file)).map(file=>({name:file.name.replace(/\.[^.]+$/,''),file})),...official];
   selectedIndex=0;
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
  }
  function advance(direction=1){
   const index=selectedIndex;
   for(let step=1;step<options.length;step++){
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
   const obstacles=[...pet.querySelectorAll('.reward-anchor,.emotion-menu,.wt-aemeath-mech')].map(node=>node.getBoundingClientRect());
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
  for(const type of ['pointerdown','mousedown','click'])panel.addEventListener(type,event=>event.stopPropagation());
  let drag=null,skipClick=false;
  trackList.addEventListener('wheel',event=>{
   if(event.ctrlKey||!event.deltaY||trackList.scrollHeight<=trackList.clientHeight)return;
   event.preventDefault();event.stopPropagation();
   const unit=event.deltaMode===1?22:event.deltaMode===2?trackList.clientHeight:1;
   trackList.scrollTop+=event.deltaY*unit;
  },{passive:false});
  trackList.addEventListener('pointerdown',event=>{
   skipClick=false;
   if(event.pointerType!=='mouse'||event.button!==0||!event.target.closest('[data-track-index]')||trackList.scrollHeight<=trackList.clientHeight)return;
   drag={id:event.pointerId,y:event.clientY,top:trackList.scrollTop,active:false};
  });
  trackList.addEventListener('pointermove',event=>{
   if(!drag||event.pointerId!==drag.id)return;
   const delta=event.clientY-drag.y;
   if(!event.buttons){drag=null;return}
   if(!drag.active&&Math.abs(delta)<5)return;
   if(!drag.active){drag.active=true;trackList.setPointerCapture(event.pointerId)}
   trackList.scrollTop=drag.top-delta;
  });
  function endDrag(event){
   if(event.pointerId!==drag?.id)return;
   skipClick=drag.active;drag=null;
  }
  for(const type of ['pointerup','pointercancel','lostpointercapture'])trackList.addEventListener(type,endDrag);
  function showTracks(show){drag=null;skipClick=false;trackList.hidden=!show;trackButton.setAttribute('aria-expanded',String(show));place()}
  trackButton.addEventListener('click',()=>showTracks(trackList.hidden));
  trackList.addEventListener('click',event=>{
   if(skipClick&&event.detail){skipClick=false;return}
   const item=event.target.closest('[data-track-index]');if(!item)return;
   selectedIndex=Number(item.dataset.trackIndex);refresh();showTracks(false);
  });
  panel.addEventListener('keydown',event=>{
   if(event.key!=='Escape')return;
   event.stopPropagation();
   if(!trackList.hidden){showTracks(false);trackButton.focus()}
   else{expanded(false);star.focus()}
  });
  panel.querySelector('[data-folder]').addEventListener('click',()=>{
   try{if(typeof input.showPicker==='function')input.showPicker();else input.click()}
   catch{status.textContent='请用鼠标直接点击，或退出游戏模式后选择文件夹'}
  });
  input.addEventListener('change',()=>{
   const chosen=Array.from(input.files??[]);input.value='';
   if(!chosen.length)return;
   files=chosen.filter(file=>/\.(mp3|m4a|flac|wav|ogg|opus|aac|webm)$/i.test(file.name)).sort((a,b)=>a.name.localeCompare(b.name,'zh-CN',{numeric:true}));
   resetAudio();populate();
   const first=options.findIndex(item=>item.file);if(first>=0)selectedIndex=first;
   status.textContent=files.length?'已载入 '+files.length+' 首本地音乐':'文件夹里没有支持的音频文件';
   refresh();
  });
  play.addEventListener('click',()=>start(selectedIndex));
  next.addEventListener('click',()=>advance());prev.addEventListener('click',()=>advance(-1));
  for(const event of ['play','pause'])audio.addEventListener(event,refresh);
  audio.addEventListener('ended',()=>{if(playingIndex>=0){selectedIndex=playingIndex;advance()}refresh()});
  const observer=new MutationObserver(attach);observer.observe(root,{childList:true,subtree:true});
  resize.observe(panel);window.addEventListener('resize',schedule);
  populate();attach();
  Promise.resolve().then(load).then(module=>{
   if(disposed||!Array.isArray(module.helperSongs))return;
   defaults=module.helperSongs.map(({name,artist,url})=>({name,artist,src:url}));
   const selected=options[selectedIndex],playing=options[playingIndex];
   populate();
   if(playing){playingIndex=options.findIndex(item=>item.file===playing.file&&item.name===playing.name)}
   if(selected&&(files.length||playing)){const index=options.findIndex(item=>item.file===selected.file&&item.name===selected.name);if(index>=0)selectedIndex=index}
   refresh();
  }).catch(()=>{});
  return ()=>{disposed=true;observer.disconnect();resize.disconnect();move.disconnect();window.removeEventListener('resize',schedule);if(frame!==undefined)cancelAnimationFrame(frame);resetAudio();star.remove();panel.remove();style.remove();geometry()};
 }
 return {create};
})();
