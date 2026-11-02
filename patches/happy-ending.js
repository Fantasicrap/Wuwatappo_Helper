const __wtHappyEnding=(()=>{
 const icon=__WT_WILTED_ECHO_ICON__,phrases=['你还在这里。','这次，一起回去吧。','这一曲，为你而奏。','再陪我一会儿。','这次，你准时赴约了','释怀…'];
 const names=new Set(['accessory_1131','1601','3bbc0e3c-7c7a-4ab1-8fe8-581cf65bab67']);
 const matches=value=>names.has(String(value??'').split('?')[0].replace(/\\/g,'/').split('/').pop().replace(/\.png$/i,'').toLowerCase());
 function create({ref,root,role,settings,random=Math.random,now=()=>performance.now()}){
  const held=ref(false),keys=new Set(),recent=[],effects=new Set(),poses=new Map();let layer=null,backLayer=null,disposed=false,last=-1;
  const speech=__wtPhrolovaReaction.create({root,role,settings:()=>({bubble:settings().happyBubble,tears:settings().happyTears}),random,now});
  function tidy(){if(!effects.size){layer?.remove();backLayer?.remove();layer=backLayer=null}}
  function animate(node,frames,options,startTime=null){const animation=node.animate(frames,options),item={node,animation};if(startTime!==null)animation.startTime=startTime;effects.add(item);animation.finished.catch(()=>{}).finally(()=>{node.remove();effects.delete(item);tidy()})}
  function ensureLayer(host,back=false){let target=back?backLayer:layer;if(target?.parentNode!==host){target?.remove();target=document.createElement('div');target.className=back?'wt-happy-effects-back':'wt-happy-effects';Object.assign(target.style,{position:'absolute',inset:'0',overflow:'hidden',pointerEvents:'none',zIndex:back?'1':'13'});host.appendChild(target);if(back)backLayer=target;else layer=target}return target}
  function bloom(){const host=root();if(!host?.isConnected)return;ensureLayer(host);
   if(settings().happyFlowers){const flower=document.createElement('img'),x=20+random()*60,drift=(random()-.5)*host.clientWidth*.1,rise=host.clientHeight*.38;flower.className='wt-happy-flower';flower.src=icon;flower.alt='';flower.draggable=false;Object.assign(flower.style,{position:'absolute',left:x+'%',top:'60%',width:'14%',height:'auto',aspectRatio:'1',marginLeft:'-7%',marginTop:'-7%',pointerEvents:'none',filter:'drop-shadow(0 0 2px #e76d8550)'});layer.appendChild(flower);
   animate(flower,[{transform:'translate(0px,0px) scale(.72)',opacity:0},{transform:'translate('+(drift*.45)+'px,'+(-rise*.4)+'px) scale(1)',opacity:1,offset:.3},{transform:'translate('+drift+'px,'+(-rise)+'px) scale(.88)',opacity:0}],{duration:900,easing:'cubic-bezier(.2,.5,.4,1)',fill:'forwards'});}
   if(settings().happyAnimation){const startTime=document.timeline.currentTime;
    const art='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 110" preserveAspectRatio="none" style="display:block;width:100%;height:100%;overflow:visible;pointer-events:none;filter:drop-shadow(0 0 2px #f14a7999)"><ellipse cx="100" cy="55" rx="93" ry="43" fill="#f8a3b5" fill-opacity=".045" stroke="#9c294f" stroke-width="4.6" opacity=".95"/><ellipse cx="100" cy="55" rx="83" ry="34" fill="none" stroke="#ff9bae" stroke-width="2.7" opacity=".95"/><ellipse class="wt-happy-halo-arc" cx="100" cy="55" rx="93" ry="43" fill="none" stroke="#fff1e5" stroke-width="4.6" stroke-linecap="round" pathLength="100" stroke-dasharray="28 72"/><ellipse class="wt-happy-halo-arc" cx="100" cy="55" rx="83" ry="34" fill="none" stroke="#f0467b" stroke-width="4.3" stroke-linecap="round" pathLength="100" stroke-dasharray="16 84"/></svg>';
    for(const back of [true,false]){const halo=document.createElement('div');halo.className=back?'wt-happy-halo-back':'wt-happy-halo wt-happy-halo-front';Object.assign(halo.style,{position:'absolute',left:'8%',top:'65%',width:'84%',height:'28%',pointerEvents:'none'});halo.innerHTML=art;halo.firstElementChild.style.clipPath=back?'inset(-12% -6% 50% -6%)':'inset(50% -6% -12% -6%)';ensureLayer(host,back).appendChild(halo);
     animate(halo,[{transform:'scale(.84)',opacity:0},{transform:'scale(1)',opacity:1,offset:.18},{transform:'scale(1.055)',opacity:.92,offset:.6},{transform:'scale(1.12)',opacity:0}],{duration:1000,easing:'cubic-bezier(.16,.55,.4,1)',fill:'forwards'},startTime);
     const arcs=halo.querySelectorAll('.wt-happy-halo-arc');animate(arcs[0],[{strokeDashoffset:'0'},{strokeDashoffset:'-80'}],{duration:1000,easing:'ease-out',fill:'forwards'},startTime);animate(arcs[1],[{strokeDashoffset:'-35'},{strokeDashoffset:'55'}],{duration:1000,easing:'ease-out',fill:'forwards'},startTime);
    }
   }
  }
  function pose(on){for(const node of root()?.querySelectorAll('.cat-stack__face,.cat-stack__base')??[]){const from=getComputedStyle(node).translate;poses.get(node)?.cancel();const animation=node.animate([{translate:from==='none'?'0% 0%':from},{translate:on?'0% -2.5%':'0% 0%'}],{duration:220,easing:'cubic-bezier(.22,.61,.36,1)',fill:'forwards'});poses.set(node,animation);if(!on)animation.finished.catch(()=>{}).finally(()=>{if(poses.get(node)===animation){animation.cancel();poses.delete(node)}})}}
  function down(key){if(disposed||keys.has(key))return false;const time=now();while(recent.length&&recent[0]<=time-1000)recent.shift();if(recent.length>=3)return false;recent.push(time);keys.add(key);held.value=true;const cfg=settings();if(cfg.happyAnimation&&keys.size===1)pose(true);if(cfg.happyAnimation||cfg.happyFlowers)bloom();if(cfg.happyBubble||cfg.happyTears){let index=Math.min(phrases.length-1,Math.floor(random()*phrases.length));if(index===last)index=(index+1)%phrases.length;last=index;speech.trigger(phrases[index],true)}return true}
  function up(key){keys.delete(key);if(held.value&&!keys.size&&settings().happyAnimation)pose(false);held.value=keys.size>0}
  function reset(){keys.clear();held.value=false;speech.reset();for(const item of effects){item.animation.cancel();item.node.remove()}effects.clear();for(const animation of poses.values())animation.cancel();poses.clear();layer?.remove();backLayer?.remove();layer=backLayer=null}
  function style(){if(!settings().happyAnimation)return{};return{translate:held.value?'0% -2.5%':'0% 0%',transition:'opacity .15s ease, translate 220ms cubic-bezier(.22,.61,.36,1)'}}
  window.addEventListener('blur',reset);
  return{down,up,reset,style,dispose(){disposed=true;reset();speech.dispose();window.removeEventListener('blur',reset)}};
 }
 return{create,matches,phrases,icon};
})();
export {__wtHappyEnding};
