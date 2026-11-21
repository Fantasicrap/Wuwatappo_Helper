function __wtMountSelectPopovers(root){
 const openSelect='.select-item--open';
 const css=document.createElement('style');
 css.setAttribute('data-wt-theme-sheet','select-popovers');
 css.textContent=`
.select-item .select-option[data-wt-select-popup]{
 position:fixed;inset:auto;left:var(--wt-select-left);top:var(--wt-select-top);margin:0;
 min-width:var(--wt-select-min-width);width:max-content;max-width:var(--wt-select-max-width);
 max-height:var(--wt-select-max-height);box-sizing:border-box;transform:none;
 padding:6px 10px;border-radius:14px;box-shadow:0 5px 16px #422b3d30;
 z-index:120;overflow-y:auto;overscroll-behavior:contain;
}
.select-item--role .select-option[data-wt-select-popup]{width:var(--role-popup-width,567px)}
.select-item .select-option[data-wt-select-popup]::before{display:none}
.select-item .select-option[data-wt-select-popup]::backdrop{pointer-events:none}
.select-item .select-option[data-wt-select-popup]:has(.select-option-list){display:flex;flex-direction:column;overflow:hidden}
.select-item .select-option[data-wt-select-popup] .select-option-list{min-height:0;max-height:240px;overscroll-behavior:contain}
.select-item .select-option[data-wt-select-popup] .select-option-item{padding-inline:5px}
.select-item .select-option[data-wt-select-popup] .select-option-item-text{min-width:0;white-space:normal;overflow-wrap:anywhere}
.select-item .select-option[data-wt-select-popup] .select-option-item:is(:hover,:focus-visible){background:var(--wt-ui-hover,#f8e8d0);border-radius:6px}
.select-item .select-option[data-wt-select-popup]::-webkit-scrollbar{width:5px}
.select-item .select-option[data-wt-select-popup]::-webkit-scrollbar-thumb{background:var(--wt-ui-border,#e7b77c);border-radius:3px}
`;
 document.head.append(css);
 let active,frame=0;
 const boundsWatch=new ResizeObserver(schedule);
 const scheduleIfOpen=()=>{if(active)schedule()};
 function schedule(){
  if(!frame)frame=requestAnimationFrame(update);
 }
 function clear(){
  if(!active)return;
  const {menu}=active;
  boundsWatch.disconnect();
  if(menu.hasAttribute('popover')){
   if(menu.matches(':popover-open'))menu.hidePopover();
   menu.removeAttribute('popover');
  }
  menu.removeAttribute('data-wt-select-popup');
  for(const name of ['left','top','min-width','max-width','max-height'])menu.style.removeProperty('--wt-select-'+name);
  menu.style.removeProperty('visibility');
  active=null;
 }
 function update(){
  frame=0;
  const select=Array.from(root.querySelectorAll('.module-panel '+openSelect))
   .find(item=>item.getClientRects().length);
  const anchor=select?.querySelector(':scope > .select-input');
  const menu=select?.querySelector(':scope > .select-option');
  if(active?.menu!==menu)clear();
  if(!anchor||!menu)return;
  if(!active){
   const boundary=select.closest('.synthesis-atlas-pop-content,.module-content')??select.closest('.module-panel');
   active={menu,boundary};
   boundsWatch.observe(anchor);boundsWatch.observe(boundary);
   menu.setAttribute('data-wt-select-popup','');
   if(typeof menu.showPopover==='function'){
    menu.setAttribute('popover','manual');
    menu.showPopover();
   }
  }
  const pad=10,gap=7;
  const panel=active.boundary.getBoundingClientRect(),trigger=anchor.getBoundingClientRect();
  const left=Math.max(pad,panel.left+pad),right=Math.min(document.documentElement.clientWidth-pad,panel.right-pad);
  const top=Math.max(pad,panel.top+pad),bottom=Math.min(document.documentElement.clientHeight-pad,panel.bottom-pad);
  const scroll=anchor.closest('.panel-content')?.getBoundingClientRect();
  if(!trigger.height||right<=left||trigger.bottom<=Math.max(top,scroll?.top??top)||trigger.top>=Math.min(bottom,scroll?.bottom??bottom)){
   menu.style.visibility='hidden';
   return;
  }
  menu.style.removeProperty('visibility');
  menu.style.setProperty('--wt-select-min-width',Math.min(trigger.width,right-left)+'px');
  menu.style.setProperty('--wt-select-max-width',right-left+'px');
  const list=menu.querySelector('.select-option-list');
  const box=getComputedStyle(menu),padding=parseFloat(box.paddingTop)+parseFloat(box.paddingBottom);
  const border=parseFloat(box.borderTopWidth)+parseFloat(box.borderBottomWidth);
  const naturalHeight=(list?Math.min(240,list.scrollHeight)+padding:menu.scrollHeight)+border;
  const below=bottom-trigger.bottom-gap,above=trigger.top-top-gap;
  const flip=naturalHeight>below&&above>below,available=flip?above:below;
  const constrained=available<Math.min(52,naturalHeight);
  menu.style.setProperty('--wt-select-max-height',(constrained?bottom-top:available)+'px');
  const size=menu.getBoundingClientRect();
  const preferred=select.classList.contains('select-item--role')?(trigger.left+trigger.right-size.width)/2:trigger.left;
  const preferredTop=flip?trigger.top-gap-size.height:trigger.bottom+gap;
  menu.style.setProperty('--wt-select-left',Math.max(left,Math.min(preferred,right-size.width))+'px');
  menu.style.setProperty('--wt-select-top',Math.max(top,Math.min(preferredTop,bottom-size.height))+'px');
 }
 const changes=new MutationObserver(records=>{
  if((active&&!root.contains(active.menu))||records.some(record=>record.target.matches?.('.select-item')))schedule();
 });
 changes.observe(root,{attributes:true,attributeFilter:['class'],childList:true,subtree:true});
 window.addEventListener('resize',scheduleIfOpen);
 root.addEventListener('scroll',event=>{if(!active?.menu.contains(event.target))scheduleIfOpen()},true);
 root.addEventListener('click',schedule);
 root.addEventListener('keydown',event=>{
  if(event.key!=='Escape'||!active)return;
  const anchor=active.menu.parentElement?.querySelector(':scope > .select-input');
  if(!anchor)return;
  event.preventDefault();event.stopPropagation();anchor.click();schedule();
 },true);
}
if(typeof document!=='undefined')__wtMountSelectPopovers(document);
