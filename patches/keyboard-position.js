let __wtPositionObserver=null,__wtPositionFrame=null;
function __wtPositionKeyboard(){
 const root=document.querySelector('#wt-input-keyboard'),dock=root?.parentElement;
 if(!dock)return;
 if(!__wtPositionObserver){const host=dock.closest('.pet-dock');if(host){__wtPositionObserver=new window.MutationObserver(__wtSchedulePosition);__wtPositionObserver.observe(host,{attributes:true,attributeFilter:['style']});window.addEventListener('resize',__wtSchedulePosition)}}
 dock.style.transform='';
 let position;try{position=localStorage.getItem('wuwatappo-mapping-position-v1')}catch{}
 const scale=dock.getBoundingClientRect().width/dock.offsetWidth||1,side=!root.hidden&&['left','right'].includes(position)&&(dock.offsetWidth+root.offsetWidth+12)*scale<=window.innerWidth-16;
 root.style.position=side?'absolute':'';root.style.margin=side?'0':'';root.style.left=side?(position==='left'?-root.offsetWidth-12:dock.offsetWidth+12)+'px':'';root.style.top=side?Math.max(0,dock.offsetHeight-root.offsetHeight-40)+'px':'';
 const counter=dock.querySelector('.pet-info-container');if(counter)counter.style.marginTop=side?'-21px':'';
 root.dataset.position=side?position:'bottom';
 if(!root.hidden){const a=dock.getBoundingClientRect(),b=root.getBoundingClientRect(),rect={top:Math.min(a.top,b.top),bottom:Math.max(a.bottom,b.bottom),left:Math.min(a.left,b.left),right:Math.max(a.right,b.right)},preferred=side?0:Math.max(0,root.offsetHeight+10),min=(rect.bottom-window.innerHeight+8)/scale,max=(rect.top-8)/scale,shift=min<=max?Math.max(min,Math.min(max,preferred)):min,left=(8-rect.left)/scale,right=(window.innerWidth-rect.right-8)/scale,x=left<=right?Math.max(left,Math.min(right,0)):left;dock.style.transform=x||shift?'translate('+x+'px,'+(-shift)+'px)':''}
}
function __wtSchedulePosition(){if(__wtPositionFrame!==null)return;__wtPositionFrame=requestAnimationFrame(()=>{__wtPositionFrame=null;__wtPositionKeyboard();Me()})}
function __wtDisposePosition(){__wtPositionObserver?.disconnect();__wtPositionObserver=null;window.removeEventListener('resize',__wtSchedulePosition);if(__wtPositionFrame!==null)cancelAnimationFrame(__wtPositionFrame);__wtPositionFrame=null}
