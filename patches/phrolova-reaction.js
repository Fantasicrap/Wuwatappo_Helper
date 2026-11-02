const __wtPhrolovaReaction=(()=>{
 const specialDuration=3000,normalDuration=1000,phrases=['好疼…','好冷啊…','终究如此…','为何…是你…','别再靠近了…','原来，是这样…','请…停下…','连梦也结束了吗…'];
 // Eye anchors were checked against both head frames of all six public skins.
 // Only the uncovered eye gets a tear. The pixel series uses a stepped glyph.
 const profiles=[
  [1001,'f53ca683-0b46-4ecf-9efe-ed2da50f36df',67.1,70.4,'#4b6970','#b5e3e7',1.1,27.7],
  [1002,'2a71d7b1-91a7-467c-9534-e9b70c64c410',56.8,78.0,'#29282c','#a8e2ed',1.5,37.8],
  [1003,'5830c4e3-4ef8-47f2-9820-1cc9d9d31547',67.3,66.1,'#171c25','#96dfef',1.6,32.1],
  [1004,'7f1d904a-0d86-462e-be06-add53ca7c345',69.7,65.5,'#50565b','#c3e7e3',.9,27.7],
  [1005,'fd3e712f-2493-446a-aa13-7dbefd5fe5dc',63.8,72.0,'#58444a','#a9d7df',1.2,35.2],
  [1006,'59898ee0-7518-4ab9-9552-eb7f78a5b4f6',68.7,68.5,'#111c25','#a1dce5',1.6,27.7]
 ];
 const file=value=>String(value??'').split('?')[0].replace(/\\/g,'/').split('/').pop().replace(/\.png$/i,'').toLowerCase();
 function profile(role){const name=file(role?.name);return profiles.find(p=>p[1]===name||name==='role_1608_'+p[0])??null}
 function isPhrolova(role){return Number(role?.id)===1608||/^role_1608_/.test(file(role?.name))||!!profile(role)}
 function tearSvg(p){const pixel=p[0]===1005;return'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 19" style="display:block;width:100%;height:100%"'+(pixel?' shape-rendering="crispEdges"':'')+'><path d="'+(pixel?'M5 1H7V5H9V8H11V15H9V17H3V15H1V8H3V5H5Z':'M6 1C5 5 1 8 1 12C1 19 11 19 11 12C11 8 7 5 6 1Z')+'" fill="'+p[5]+'" stroke="'+p[4]+'" stroke-width="'+p[6]+'" stroke-linejoin="round"/><path d="'+(pixel?'M3 10H5V14H3Z':'M3.4 10Q2.6 12 3.5 13.2')+'" fill="'+(pixel?'#fff9ee':'none')+'" stroke="#fff9ee" stroke-width="1.2" stroke-linecap="round"/></svg>'}
 function create({role,root,settings=()=>({bubble:true,tears:true}),random=Math.random,now=()=>performance.now()}){
  let layer=null,bubble=null,bubbleTimer=null,lastPhrase=-1,disposed=false,specialTimer=null,pendingLine="",specialUntil=0;const tears=new Set(),recent=[];
  function tidy(){if(layer&&!bubble&&!tears.size){layer.remove();layer=null}}
  function reset(){specialUntil=0;clearTimeout(specialTimer);specialTimer=null;pendingLine="";clearTimeout(bubbleTimer);bubbleTimer=null;for(const item of tears){item.animation?.cancel();item.node.remove()}tears.clear();bubble?.remove();bubble=null;layer?.remove();layer=null}
  function trigger(line="",allowTears=false,priority=false){const current=role(),cfg=settings();if(disposed||!isPhrolova(current)||!cfg.bubble&&!cfg.tears)return false;const host=root();if(!host||!host.isConnected)return false;const time=now();if(!priority&&time<specialUntil)return false;while(recent.length&&recent[0]<=time-1000)recent.shift();if(recent.length>=3||pendingLine&&!line)return false;recent.push(time);
   if(layer?.parentNode!==host)reset();if(!layer){layer=document.createElement('div');layer.className='wt-phrolova-reaction';Object.assign(layer.style,{position:'absolute',inset:'0',overflow:'hidden',pointerEvents:'none',zIndex:'14'});host.appendChild(layer)}
   if(cfg.bubble){if(!bubble){bubble=document.createElement('div');bubble.className='wt-phrolova-speech';bubble.setAttribute('aria-live','off');Object.assign(bubble.style,{position:'absolute',left:'2%',top:'3%',maxWidth:'84%',boxSizing:'border-box',padding:'clamp(3px, calc(var(--pet-base-size, 200px) * .027), 7px) clamp(5px, calc(var(--pet-base-size, 200px) * .046), 12px)',border:'1.6px solid #4d4149',borderRadius:'50% / 48%',background:'#fffdf6',color:'#51424c',fontFamily:'"Microsoft YaHei",sans-serif',fontSize:'clamp(8px, calc(var(--pet-base-size, 200px) * .055), 16px)',lineHeight:'1.45',whiteSpace:'normal',overflowWrap:'anywhere',textAlign:'center',boxShadow:'1px 2px 0 #4b30431a',zIndex:'2'});const text=document.createElement('span');text.className='wt-phrolova-speech-text';bubble.appendChild(text);const tail=document.createElement('i');Object.assign(tail.style,{position:'absolute',left:'69%',bottom:'-5px',width:'8px',height:'8px',background:'#fffdf6',borderRight:'1.6px solid #4d4149',borderBottom:'1.6px solid #4d4149',transform:'rotate(45deg)'});bubble.appendChild(tail);layer.appendChild(bubble)}
   let index=Math.min(phrases.length-1,Math.max(0,Math.floor(random()*phrases.length)));if(index===lastPhrase)index=(index+1)%phrases.length;lastPhrase=index;bubble.querySelector('.wt-phrolova-speech-text').textContent=line||phrases[index];const head=profile(current)?.[7]??30,counter=host.querySelector('.wt-oath-core-count'),clearance=counter?counter.offsetTop+counter.offsetHeight+2:2;bubble.style.top=Math.max(clearance,host.clientHeight*(head/100+.02)-bubble.offsetHeight)+'px';
   if(priority)specialUntil=time+specialDuration;clearTimeout(bubbleTimer);bubbleTimer=setTimeout(()=>{bubble?.remove();bubble=null;bubbleTimer=null;tidy()},priority?specialDuration:normalDuration);
   }const p=cfg.tears&&(!line||allowTears)?profile(current):null;if(p){const node=document.createElement('div');node.className='wt-phrolova-tear';node.dataset.series=String(p[0]);Object.assign(node.style,{position:'absolute',left:(p[2]-1.6)+'%',top:p[3]+'%',width:'3.2%',height:'4.8%',imageRendering:p[0]===1005?'pixelated':'auto',pointerEvents:'none'});node.innerHTML=tearSvg(p);layer.appendChild(node);
    const item={node,animation:null};tears.add(item);const distance=Math.max(0,host.clientHeight*(1-p[3]/100-.048));
    item.animation=node.animate([{transform:'translateY(0px) scale(.78)',opacity:.85},{transform:'translateY('+(distance*.25)+'px) scale(1)',opacity:1,offset:.4},{transform:'translateY('+distance+'px) scale(.85)',opacity:0}],{duration:600,easing:'cubic-bezier(.3,0,.65,1)',fill:'forwards'});
    item.animation.finished.catch(()=>{}).finally(()=>{node.remove();tears.delete(item);tidy()});
   }
   return true;
  }
  function special(line,onShown){clearTimeout(specialTimer);pendingLine="";if(!settings().bubble){onShown?.(0);return 0}const delay=recent.length>=3?Math.max(0,recent[0]+1000-now()):0;if(delay){pendingLine=line;specialTimer=setTimeout(()=>{const text=pendingLine;pendingLine="";specialTimer=null;special(text,onShown)},Math.ceil(delay)+2)}else if(trigger(line,false,true))onShown?.(specialDuration);return delay}
  return{trigger,special,reset,dispose(){disposed=true;reset()}};
 }
 return{specialDuration,normalDuration,phrases,profiles,profile,isPhrolova,tearSvg,create};
})();
export {__wtPhrolovaReaction};
