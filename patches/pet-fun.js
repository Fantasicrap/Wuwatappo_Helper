const __wtPetFun=(()=>{
 const key='wuwatappo-pet-fun-v1',defaults={master:false,badEnding:true,happyEnding:true,weapon:false,bubble:false,tears:false,drops:false,autoPickup:false,happyAnimation:true,happyBubble:true,happyTears:false,happyFlowers:true},icon=__WT_OATH_CORE_ICON__;
 function read(){
  let saved;try{saved=JSON.parse(localStorage.getItem(key)||'{}')}catch{}
  return {
   ...Object.fromEntries(Object.keys(defaults).map(k=>[k,typeof saved?.[k]==='boolean'?saved[k]:defaults[k]])),
   dialogue:__wtPetDialogue.read(saved?.dialogue)
  };
 }
 function create({ref=value=>({value}),root,role,part,account=()=>0,down,up,pulse,resetMotion,changed=()=>{},activity=()=>{},controllerDisplay=()=>false,controllerDown=()=>{},blocked=()=>false,overUi=()=>false,normalize=value=>String(value),now=()=>performance.now(),random=Math.random}){
  const cfgState=ref(read());let cfg=cfgState.value,started=false,disposed=false,layer=null,hud=null,autoUntil=0,autoIntro=false,autoEpoch=0,autoTimer=null,controllerTimer=null,controllerCursor=null,controllerEpoch=0,controllerConnected=false,owner=account(),core=__wtOathCore.create({account:owner,random});
  const inputs=new Set(),items=new Set(),controllers=new Map();let position=0;
  const reaction=__wtPhrolovaReaction.create({role,root,settings:()=>cfg,random});
  const happy=__wtHappyEnding.create({ref,root,role,settings:()=>cfgState.value,random,now});
  const branch=()=>!__wtPhrolovaReaction.isPhrolova(role())?null:cfg.badEnding&&__wtAccessoryThrust.matches(part())?'be':cfg.happyEnding&&__wtHappyEnding.matches(part())?'he':null;
  const active=()=>started&&!disposed&&cfg.master&&(branch()==='be'?[cfg.weapon,cfg.bubble,cfg.tears,cfg.drops].some(Boolean):branch()==='he'&&(cfg.happyAnimation||cfg.happyBubble||cfg.happyTears||cfg.happyFlowers)),eligible=()=>branch()!==null;
  const controllerDemand=()=>started&&!disposed&&(active()||controllerDisplay());
  function ensure(){const host=root();if(!host?.isConnected)return null;if(layer?.parentNode!==host){layer?.remove();layer=document.createElement('div');layer.className='wt-pet-fun-layer';Object.assign(layer.style,{position:'absolute',inset:'0',pointerEvents:'none',zIndex:'16'});host.appendChild(layer);hud=null}return layer}
  function status(){if(!started||!cfg.master||!cfg.drops||branch()!=='be'){hud?.remove();hud=null;return}const target=ensure();if(!target)return;if(!hud){hud=document.createElement('div');hud.className='wt-oath-core-count';Object.assign(hud.style,{position:'absolute',left:'2%',top:'2%',maxWidth:'96%',boxSizing:'border-box',padding:'clamp(2px, calc(var(--pet-base-size, 200px) * .012), 3px) clamp(4px, calc(var(--pet-base-size, 200px) * .027), 7px)',border:'1px solid #cbbba1',borderRadius:'12px',background:'#fff9e9ed',color:'#695c4d',fontFamily:'"Microsoft YaHei",sans-serif',fontSize:'clamp(7px, calc(var(--pet-base-size, 200px) * .045), 10px)',lineHeight:'1.4',whiteSpace:'normal',overflowWrap:'anywhere',pointerEvents:'none'});target.appendChild(hud)}hud.textContent='缚誓之核 '+core.count+'/5'+(autoIntro?' · 即将开始':autoUntil>now()?' · 自动 '+Math.ceil((autoUntil-now())/1000)+'s':'')}
  function remove(item){if(!items.delete(item))return;clearTimeout(item.fade);clearTimeout(item.expire);clearTimeout(item.pickup);item.animation?.cancel();item.lane.remove();changed()}
  function stopAuto(){autoEpoch++;clearTimeout(autoTimer);autoTimer=null;autoIntro=false;autoUntil=0;resetMotion();status()}
  function tickAuto(){autoTimer=null;if(!active()||!cfg.drops||branch()!=='be'||now()>=autoUntil){stopAuto();return}pulse();status();autoTimer=setTimeout(tickAuto,340)}
  function beginAuto(){clearTimeout(autoTimer);const epoch=++autoEpoch;autoIntro=true;autoUntil=0;status();reaction.special('我在海底等你…',duration=>{if(epoch!==autoEpoch)return;autoTimer=setTimeout(()=>{if(epoch!==autoEpoch)return;autoIntro=false;autoUntil=now()+__wtOathCore.duration;tickAuto()},duration+10)})}
  function collect(item){if(item.collected||!items.has(item)||!active()||!cfg.drops||branch()!=='be'||now()-item.created>=5000)return false;const result=core.collect();if(!result.ok)return false;item.collected=true;clearTimeout(item.fade);clearTimeout(item.expire);clearTimeout(item.pickup);const {button}=item;button.style.pointerEvents='none';const currentStyle=getComputedStyle(button),transform=currentStyle.transform,opacity=Number(currentStyle.opacity);item.animation?.cancel();button.style.transform=transform;item.animation=button.animate([{transform:transform==='none'?'translateY(0px)':transform,opacity},{transform:(transform==='none'?'':transform)+' translateY(-24px)',opacity:0}],{duration:180,easing:'ease-out',fill:'forwards'});item.animation.finished.catch(()=>{}).finally(()=>remove(item));status();changed();if(result.auto)beginAuto();return true}
  function schedulePickup(item){clearTimeout(item.pickup);item.pickup=null;if(!cfg.autoPickup||!cfg.master||!cfg.drops||item.collected||!items.has(item))return;item.pickup=setTimeout(()=>{item.pickup=null;if(cfg.autoPickup)collect(item)},Math.max(0,650-(now()-item.created)))}
  function spawn(){const target=ensure();if(!target)return;const host=root(),lane=document.createElement('div');lane.className='wt-oath-core-lane';Object.assign(lane.style,{position:'absolute',left:[20,44,68][position++%3]+'%',top:'40%',bottom:'20%',width:'clamp(20px, 14%, 56px)',pointerEvents:'none'});const button=document.createElement('button');button.type='button';button.className='wt-oath-core-drop';button.title='拾取缚誓之核';button.setAttribute('aria-label','拾取缚誓之核');Object.assign(button.style,{position:'absolute',left:'0',top:'0',width:'100%',height:'auto',aspectRatio:'1',padding:'0',margin:'0',border:'0',borderRadius:'0',background:'transparent',cursor:'pointer',pointerEvents:'auto',filter:'drop-shadow(0 1px 2px #55bfd36b)',zIndex:'2'});const image=document.createElement('img');image.src=icon;image.alt='';image.draggable=false;Object.assign(image.style,{display:'block',width:'100%',height:'100%',pointerEvents:'none'});button.appendChild(image);lane.appendChild(button);target.appendChild(lane);
   const y=Math.max(0,lane.clientHeight-lane.clientWidth),item={lane,button,y,created:now(),collected:false,fade:null,expire:null,pickup:null,animation:null};items.add(item);
   item.animation=button.animate([{transform:'translateY(0px)',opacity:0},{transform:'translateY('+(y*.4)+'px)',opacity:1,offset:.35},{transform:'translateY('+y+'px)',opacity:1}],{duration:650,easing:'cubic-bezier(.25,.5,.4,1)',fill:'forwards'});
   item.fade=setTimeout(()=>{if(!items.has(item)||item.collected)return;item.animation?.cancel();button.style.transform='translateY('+y+'px)';item.animation=button.animate([{opacity:1},{opacity:0}],{duration:500,fill:'forwards'})},4500);
   item.expire=setTimeout(()=>remove(item),5000);
   button.addEventListener('pointerdown',event=>event.stopPropagation());button.addEventListener('mousedown',event=>event.stopPropagation());
   button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();collect(item)});schedulePickup(item);
   changed();
  }
  function releaseInputs(source=null){for(const token of [...inputs])if(!source||token.startsWith(source+':')){up(token);happy.up(token);inputs.delete(token)}}
  function input(source,keyValue,pressed){const keyName=source==='keyboard'?(normalize(keyValue)||String(keyValue)):String(keyValue),token=source+':'+keyName;if(!pressed){inputs.delete(token);up(token);happy.up(token);return false}if(!active()||blocked()||inputs.has(token)||source==='mouse'&&overUi()||!eligible())return false;inputs.add(token);
   const ending=branch(),line=__wtPetDialogue.line(cfg.dialogue,ending,source,keyName);
   if(ending==='he')return happy.down(token,line);
   if(line!==undefined)reaction.mapped(line);
   // Only this real-input path rolls drops. The automatic pulse never enters it.
   if(cfg.drops&&eligible()&&core.roll())spawn();return down(token);
  }
  function reset(){releaseInputs();reaction.reset();happy.reset();for(const item of [...items])remove(item);stopAuto();status()}
  function controllerFrame(devices,baseline=false){const seen=new Set();let config;try{config=__wtControllerCore.config(JSON.parse(localStorage.getItem('wuwatappo-controller-v1')||'{}'))}catch{config=__wtControllerCore.config()}
   for(const raw of devices??[]){
    const device=__wtControllerCore.normalise(raw,config),id=device.id+':'+device.generation,previous=controllers.get(id),buttons=[...device.buttons];
    for(let i=0;i<2;i++){const index=26+i;buttons[index]=device.axes[4+i]>(previous?.[index] ? .35:.55)}
    seen.add(id);
    if(previous&&!baseline)for(let i=0;i<buttons.length;i++)if(buttons[i]!==previous[i]){
     if(buttons[i]&&controllerDisplay()){
      const labels=__wtControllerCore.labels(device,config),ps=__wtControllerCore.layout(device,config)==='ps';
      controllerDown(labels[i]??(ps?['L2','R2']:['LT','RT'])[i-26]);
     }
     input('controller',id+':'+i,buttons[i]);
    }
    controllers.set(id,buttons);
   }
   for(const[id,buttons]of controllers)if(!seen.has(id)){buttons.forEach((on,i)=>{if(on)input('controller',id+':'+i,false)});controllers.delete(id)}
  }
  async function pollController(){if(!controllerDemand())return;const epoch=controllerEpoch;try{const response=await fetch('http://127.0.0.1:48642/state?after='+(controllerCursor??0),{cache:'no-store',signal:AbortSignal.timeout(2000)});if(!response.ok)throw Error('controller service');const data=await response.json();if(epoch!==controllerEpoch||!controllerDemand())return;if(!Array.isArray(data.frames)||!Number.isFinite(data.seq))throw Error('controller frame');const baseline=controllerCursor===null||data.gap||data.seq<controllerCursor;controllerConnected=true;if(baseline){releaseInputs('controller');controllers.clear();if(data.frames.length)controllerFrame(data.frames.at(-1).devices,true)}else for(const frame of data.frames)controllerFrame(frame.devices);controllerCursor=data.seq}catch{if(epoch!==controllerEpoch)return;controllerConnected=false;controllerCursor=null;controllerFrame([],true)}finally{if(epoch===controllerEpoch&&controllerDemand())controllerTimer=setTimeout(pollController,controllerConnected?40:1000)}}
  function syncController(){controllerEpoch++;clearTimeout(controllerTimer);controllerTimer=null;controllerCursor=null;controllers.clear();controllerConnected=false;releaseInputs('controller');if(controllerDemand())pollController()}
  function sync(){const before=cfg;cfg=read();cfgState.value=cfg;happy.reset();if(before.bubble!==cfg.bubble||before.tears!==cfg.tears||!cfg.master||!cfg.badEnding)reaction.reset();if(!cfg.weapon||!cfg.master||!cfg.badEnding)resetMotion();if(!cfg.master||!cfg.drops||branch()!=='be'){for(const item of [...items])remove(item);stopAuto()}else for(const item of items)schedulePickup(item);status();activity();releaseInputs();syncController()}
  const changedStorage=event=>{if(event.key===key||event.key===null)sync()};window.addEventListener('storage',changedStorage);
  return{active,eligible,branch,input,releaseInputs,releasePointerInputs(){releaseInputs('keyboard');releaseInputs('mouse')},controllerFrame,syncController,visual:()=>branch()==='be'&&cfg.dialogue.be.mode==='random'&&reaction.trigger(),style:()=>active()&&branch()==='he'?happy.style():{},sync,get config(){return cfgState.value},rawKey:raw=>/^([A-Z0-9]|Space)$/.test(normalize(raw)),start(){started=true;sync()},appearanceChanged(){reset();if(started)sync()},accountChanged(){reset();owner=account();core=__wtOathCore.create({account:owner,random});status();if(started)sync()},reset,dispose(){disposed=true;reset();controllerEpoch++;clearTimeout(controllerTimer);layer?.remove();reaction.dispose();happy.dispose();window.removeEventListener('storage',changedStorage)},get count(){return core.count}};
 }
 function settings(ref,toast){
  const model={config:ref(read()),dialogueDraft:{be:ref({key:'',text:''}),he:ref({key:'',text:''})}};
  async function commit(patch){
   try{
    const next={...model.config.value,...patch};
    localStorage.setItem(key,JSON.stringify(next));model.config.value=next;
    await emit('wt-pet-fun-updated',{});toast('专属互动设置已保存');
   }catch{toast('专属互动设置保存或同步失败')}
  }
  model.save=(name,value)=>commit({[name]:value===true});
  model.saveDialogue=(branch,value)=>commit({dialogue:__wtPetDialogue.read({...model.config.value.dialogue,[branch]:value})});
  return model;
 }
 function renderSettings(h,model){
  const cfg=model.config.value,label=(name,text,disabled=false)=>h('label',{style:{display:'flex',alignItems:'center',gap:'8px',padding:'7px 0',fontSize:'14px'}},[h('input',{type:'checkbox',checked:cfg[name],disabled,onChange:event=>model.save(name,event.target.checked)}),h('span',null,text)]);
  const dialogue=(branch,disabled)=>__wtPetDialogue.render(h,{branch,disabled,settings:cfg.dialogue,draft:model.dialogueDraft[branch],update:value=>model.saveDialogue(branch,value)});
  const group=(name,title,subtitle,children)=>h('div',{'data-wt-ending':name,hidden:!cfg.master,style:{padding:'10px 14px',margin:'10px 0',border:'1px solid #ecd7c4',borderRadius:'14px',background:name==='badEnding'?'#fff7f2':'#fff9f4'}},[label(name,title,!cfg.master),h('p',{style:{margin:'0 0 6px',fontSize:'12px',lineHeight:'1.6',color:'#9a7f70'}},subtitle),...children]);
  const node=h('section',{class:'wt-pet-fun-settings',style:{borderTop:'1px solid #efd4b7',margin:'12px 0',padding:'12px 0',color:'#8e5e43'}},[h('div',{style:{fontSize:'18px',fontWeight:'600',marginBottom:'8px'}},'i弗TV'),label('master','启用 i弗TV'),group('badEnding','Bad Ending','弗洛洛 + 指定共鸣回响剑',[...Object.entries({weapon:'配件刺出动画',bubble:'弗洛洛漫画气泡',tears:'弗洛洛流泪动画',drops:'缚誓之核掉落与数量显示',autoPickup:'自动拾取缚誓之核'}).map(([name,text])=>label(name,text,!cfg.master||!cfg.badEnding||name==='autoPickup'&&!cfg.drops)),dialogue('be',!cfg.master||!cfg.badEnding||!cfg.bubble),h('p',{style:{fontSize:'12px',lineHeight:'1.6',color:'#9a7f70'}},'真实键盘、鼠标、手柄按下有2%概率掉落，5秒内可拾取。自动拾取默认关闭，落稳后收集；消耗5个触发10秒自动动画，自动动画不判掉落。')]),group('happyEnding','Happy Ending','弗洛洛 + 赫卡忒',[label('happyAnimation','配件守护动画',!cfg.master||!cfg.happyEnding),label('happyBubble','弗洛洛漫画气泡',!cfg.master||!cfg.happyEnding),label('happyTears','弗洛洛流泪动画',!cfg.master||!cfg.happyEnding),label('happyFlowers','凋落回响上飘动画',!cfg.master||!cfg.happyEnding),dialogue('he',!cfg.master||!cfg.happyEnding||!cfg.happyBubble),h('p',{style:{fontSize:'12px',lineHeight:'1.6',color:'#9a7f70'}},'按下时从人物中心偏下的随机位置飘出凋落回响，向上飞并淡出，配合轻微悬浮和守护光效。飘花仅为动画，不计入缚誓之核；每秒最多3次。')])],512);node.patchFlag=-2;return node
 }

 return{key,defaults,read,create,settings,renderSettings,icon};
})();
export {__wtPetFun};
