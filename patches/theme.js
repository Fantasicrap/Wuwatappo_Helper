function __wtRegions(root,mode,rect){
 const reward=mode==='input'&&document.documentElement.hasAttribute('data-wt-tides')?'.reward-btn':'.reward-anchor';
 const query='.wt-snowfluff:not([hidden]),.wt-snowfluff-star,.wt-oath-core-lane,.wt-synthesis-reminder,#wt-input-keyboard,'+reward;
 const regions=Array.from(root.querySelectorAll(query),rect).filter(Boolean);
 const mech=root.querySelector('.wt-aemeath-mech');
 if(mode==='visual'&&mech){
  const bounds=mech.closest('.cat-stack')?.getBoundingClientRect(),size=mech.getBoundingClientRect().width;
  if(bounds?.width&&size)regions.push({left:bounds.left-size,top:bounds.top-size*1.15,width:bounds.width+2*size,height:bounds.height+1.15*size});
 }
 return regions;
}
const __wtTheme=(()=>{
 const key='wuwatappo-theme-v1',updated='wt-theme-updated',attr='data-wt-theme',mark='data-wt-theme-sheet';
 const backgroundKey='wuwatappo-aemeath-background-v1',backgroundUpdated='wt-theme-background-updated';
 const themes={default:['原版暖色','WuwaTappo 原本的奶油色与棕色'],aemeath:['爱弥斯','小爱粉配色、背景与按键气泡']};
 const scope=':root['+attr+'="aemeath"]';
 // The picker previews both palettes, so its sheet is never recolored.
 const pickerCss=`
.wt-theme-picker{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}
.wt-theme-option{position:relative;display:flex;align-items:center;gap:10px;min-width:0;padding:10px 12px;border:1.5px solid #e3c9aa;border-radius:12px;background:#fffdf7;color:#694832;font:inherit;text-align:left;cursor:pointer;transition:border-color .15s,box-shadow .15s,transform .15s}
.wt-theme-option:hover{transform:translateY(-1px)}
.wt-theme-option[aria-pressed=true]{border-color:#c98d55;box-shadow:0 0 0 3px #f6d49d99}
.wt-theme-option:focus-visible{outline:2px solid #976137;outline-offset:2px}
.wt-theme-swatch{flex:none;display:flex;width:38px;height:38px;border-radius:50%;overflow:hidden;border:2px solid #fff;box-shadow:0 0 0 1px #0000002b;transform:rotate(-35deg)}
.wt-theme-swatch i{flex:1}
[data-wt-theme-option=default] i:nth-child(1){background:#fff3dd}[data-wt-theme-option=default] i:nth-child(2){background:#fed291}[data-wt-theme-option=default] i:nth-child(3){background:#995e3f}
[data-wt-theme-option=aemeath] i:nth-child(1){background:#ffe7f0}[data-wt-theme-option=aemeath] i:nth-child(2){background:#f7a5c3}[data-wt-theme-option=aemeath] i:nth-child(3){background:#7fdcea}
.wt-theme-text{display:flex;flex-direction:column;min-width:0}
.wt-theme-text b{font-size:14px;line-height:1.35}
.wt-theme-text small{font-size:12px;line-height:1.4;opacity:.82}
.wt-theme-option[aria-pressed=true] b:after{content:'使用中';display:inline-block;margin-left:6px;padding:0 6px;border-radius:8px;background:#f6d49d;font-size:11px;font-weight:400;line-height:16px;vertical-align:1px}
.wt-aemeath-options{margin:12px 0 0;border-top:1px solid var(--wt-ui-divider,#ead7bf);padding-top:8px}
.wt-aemeath-options>summary{cursor:pointer;color:var(--wt-ui-text,#694832);font-weight:600;padding:4px 0}
.wt-aemeath-options .wt-theme-picker{margin-top:8px}
.wt-theme-background,.wt-theme-picker>.wt-mech-settings{grid-column:1/-1}
.wt-theme-background{margin:0;min-width:0;padding:8px 10px;border:1px solid var(--wt-ui-border,#e3c9aa);border-radius:12px;background:var(--wt-ui-card-fill,#fff9ed)}
.wt-theme-background legend{padding:0 5px;font-weight:600}
.wt-theme-background-actions{display:flex;gap:6px;flex-wrap:wrap}
.wt-theme-background output{display:block;margin-top:5px;color:var(--wt-ui-muted,#775e4b);font-size:12px;overflow-wrap:anywhere}
.wt-theme-background input[hidden]{display:none}
§ .wt-theme-option{border-color:#f3bfd4;background:rgba(255,250,252,.7);color:#8f3566}
§ .wt-theme-option[aria-pressed=true]{border-color:#ea7aa8;box-shadow:0 0 0 3px #f7a5c380}
§ .wt-theme-option[aria-pressed=true] b:after{background:#ffd0e3}
§ .wt-theme-option:focus-visible{outline-color:#35b3c8}
`.split('§').join(scope);
 const aemeathCss=`
§{
 --wt-ui-text:#793050;
 --wt-ui-muted:#805169;
 --wt-ui-border:#dda0bb;
 --wt-ui-divider:#ecc3d6;
 --wt-ui-field:#fff0f6;
 --wt-ui-card-fill:rgba(255,240,247,.82);
 --wt-mech-check:#df639c;
 --wt-synthesis-border:#e68db5;
 --wt-synthesis-bubble:linear-gradient(145deg,#fff5fa,#ffdceb);
 --wt-synthesis-text:#873359;
 --wt-synthesis-shadow:#a43a692b;
 --wt-raster-pink:grayscale(1) sepia(.24) hue-rotate(287deg) saturate(2.7);
}
§ .module-panel{background-color:#efacc8;border-color:#d889aa;box-shadow:0 4px #d889aa}
§ .tab-btn__label{color:#71324f}
§ .tab-btn:hover:not(:last-of-type){background:#f6c2d8}
§ .tab-btn--active:not(:last-of-type){background:#ffe6f0!important;border-color:#f6a6c5;box-shadow:0 4px #f3a0c0}
§ .tab-btn--active:not(:last-of-type) .tab-btn__label{color:#a34a73}
§ .tab-btn__icon{filter:grayscale(1) sepia(.65) hue-rotate(285deg) saturate(1.9) drop-shadow(0 1px 0 #a84f79)}
§ .tab-btn--active:not(:last-of-type) .tab-btn__icon{filter:grayscale(1) sepia(.8) hue-rotate(285deg) saturate(2.5) brightness(1.45)}
§ .module-content{background:#f8d4e3;border-color:#eeacc7}
§ .module-content__bg{background-color:#fff0f6;background-image:linear-gradient(180deg,rgba(255,244,249,.28),rgba(255,238,246,.40)),var(--wt-custom-background,var(--wt-theme-bg,none));background-size:cover;background-position:62% 42%;border-color:#f8d5e3}
§[data-wt-custom-background] .module-content__bg{background-position:center}
§ .module-content__bg:before,§ .module-content__bg:after{filter:hue-rotate(-62deg);opacity:.28}
§ .setting-item{background:rgba(255,240,247,.64)}
§ .wt-ui-card,§ .wt-ui-room-tools,§ .wt-ui-feature{background:rgba(255,248,251,.70);border-color:#f3bfd4}
§ .wt-ui-card--primary{background:rgba(255,240,247,.76);border-color:#ee9fc1}
§ .wt-ui-button--primary,§ .wt-ui-button[aria-pressed=true]{background:linear-gradient(180deg,#ffbdd8,#f797be);border-color:#ea7aa8;color:#7d2550}
§ .wt-ui-card :focus-visible,§ .wt-ui-room-tools :focus-visible,§ .wt-ui-button:focus-visible,§ .wt-ui-optional>summary:focus-visible{outline-color:#35b3c8}
§ input[type=checkbox],§ input[type=radio]{accent-color:#df639c}
§ .pet-info .text{background:#fff0f6;color:#9b3668}
§ .reward-countdown__text{color:#9b3668}
§ .reward-countdown__bar{stroke:#f8aacd}
§ .reward-countdown .reward-countdown__progress{filter:drop-shadow(0 0 1px #f29ac1) drop-shadow(0 0 1px #f29ac1cc)}
§ .reward-countdown__svg:not(.reward-countdown__progress)>image,
§ .pet-toolbar,§ .reward-btn:not(.reward-btn--loading),§ .synthesis-add,
§ .preset-preview-emote-img:after,§ .preset-preview-emote-remove,§ .preset-remove,
§ .panel-close,§ .popup-close,§ .about-close,§ .oss-notice-close,
§ .select-item .select-input:after,§ .select-item .select-option:before,
§ .room-info .room-number-copy,§ .room-members .room-visible-btn,
§ .login-dialog-button--passport,§ .login-dialog-button--uid,§ .uid-cont .btn-send{
 filter:var(--wt-raster-pink);
}
§ .pet-toolbar{__WT_AEMEATH_TOOLBAR__}
§[data-wt-tides] .reward-anchor{--wt-tide-position:left center;pointer-events:none}
§[data-wt-tides] .reward-anchor--right{--wt-tide-position:right center}
§[data-wt-tides] .reward-countdown{width:100%;height:100%;aspect-ratio:auto}
§[data-wt-tides] .reward-countdown__svg{visibility:hidden}
§[data-wt-tides] .reward-countdown::before,
§[data-wt-tides] .reward-anchor .reward-btn::before{
 content:"";position:absolute;inset:0;margin:auto;width:48px;height:48px;
 background:var(--wt-theme-tides) var(--wt-tide-position) / 200% 100% no-repeat;
 pointer-events:none;
}
§[data-wt-tides] .reward-countdown::before{top:-12px;transform:scale(.90)}
§[data-wt-tides] .reward-countdown__text{
 inset:auto 0 -2px;height:auto;margin-inline:auto;width:max-content;transform:none;
 padding:0 5px;border-radius:8px;background:#fff0f6;color:#793050;
 box-shadow:0 1px 3px #7a3b4b22;font-size:11px;line-height:15px;
}
§[data-wt-tides] .reward-anchor .reward-btn{
 position:absolute;inset:0;margin:auto;width:34px;height:36px;padding:0;border:0;background:none;filter:none;pointer-events:auto;
}
§[data-wt-tides] .reward-anchor .reward-btn:before{
 inset:50% auto auto 50%;transform:translate(-50%,-50%);margin:0;filter:drop-shadow(0 2px 1px #783b4b55);
}
§[data-wt-tides] .reward-anchor .reward-btn:after{display:none}
§[data-wt-tides] .reward-anchor .reward-btn--open{animation:none}
§[data-wt-tides] .reward-anchor .reward-btn--open:before{animation:wt-tide-disappear .5s ease-out both}
.wt-tide-spark{position:fixed;width:6px;height:6px;pointer-events:none;z-index:20;clip-path:polygon(50% 0,62% 36%,100% 50%,62% 64%,50% 100%,38% 64%,0 50%,38% 36%);background:#ffdb8a}
@keyframes wt-tide-disappear{0%{opacity:1;transform:translate(-50%,-50%) scale(1)}30%{opacity:1;transform:translate(-50%,-50%) scale(1.12);filter:brightness(1.35)}100%{opacity:0;transform:translate(-50%,-50%) scale(.74);filter:brightness(1.9)}}
@media(prefers-reduced-motion:reduce){§[data-wt-tides] .reward-anchor .reward-btn--open::before{animation:none;opacity:0}}
§ .my-preset .preset-item,§ .preset-preview .preset-preview-main,
§ .preset-preview .preset-preview-emote-img,§ .synthesis-list .synthesis-item{
 background-image:none!important;
}
§ .my-preset .preset-item:before,§ .preset-preview .preset-preview-main:before,
§ .preset-preview .preset-preview-emote-img:before,§ .synthesis-list .synthesis-item:before{
 content:"";position:absolute;inset:0;pointer-events:none;
 background:var(--wt-raster-image,none) center / 100% 100% no-repeat;
 filter:var(--wt-raster-pink);
}
§ .synthesis-list .synthesis-add{position:relative}
§ .preset-preview .preset-preview-emote--drop-target .preset-preview-emote-img{filter:drop-shadow(0 2px 0 #dfa5c0) drop-shadow(0 0 6px #f8aacc)}
§ .about-root,§ .oss-notice-root,§ .app-update-overlay__panel,§ .role-switch-emote-overlay__panel{
 background-image:linear-gradient(140deg,#fff5fa,#f8d9e7);
}
§ .wt-keyboard-plate:after{background:#b4edf4;border-color:#6fd0e0}
§ .wt-input-ui kbd.wt-key-on{background:#ff9cc4;color:#7d2550;border-color:#e9679d;box-shadow:0 0 6px #ffc2dc,0 0 0 1px #8be4f0}
§ .wt-pad-board #wt-pad-body stop:first-child{stop-color:#fff2f8}
§ .wt-pad-board #wt-pad-body stop:last-child{stop-color:#f1b4d0}
§ .wt-pad-board #wt-pad-grip stop:first-child{stop-color:#ffe1ee}
§ .wt-pad-board #wt-pad-grip stop:last-child{stop-color:#e993ba}
§ .wt-pad-board [fill="#d7b38c"],§ .wt-pad-board [fill="#c6a581"]{fill:#c4779a}
§ .wt-pad-board [stroke="#a67c58"],§ .wt-pad-board [stroke="#d5b18a"],§ .wt-pad-board [stroke="#d1ad83"],§ .wt-pad-board [stroke="#c9a47d"]{stroke:#c8799d}
§ .wt-pad-board [stroke="#fff9e9"]{stroke:#fff8fc}
§ .wt-pad-board [fill="#ead3ad"],§ .wt-pad-board [fill="#f5e2bf"]{fill:#f9d0e3}
§ .wt-pad-board [fill="#b6c49b"],§ .wt-pad-board [fill="#dbc7a5"]{fill:#7fdcea}
§ .wt-input-bubble{padding:4px 10px;border:1.5px solid #f38fb7;border-radius:14px;background:linear-gradient(135deg,#fffafc,#ffe3ef 60%,#ffd2e5);color:#ad3a70;text-shadow:0 1px 0 #fff;box-shadow:0 3px 0 #f6a8c7,0 7px 14px rgba(233,95,150,.26),inset 0 1px 0 #fff;transform-origin:50% 100%;animation:wt-aemeath-bubble 1s ease-out both,wt-aemeath-ring .55s ease-out both}
§ .wt-input-bubble:before{content:'';position:absolute;right:-6px;top:-7px;width:13px;height:13px;background:linear-gradient(135deg,#9af0f7,#4fc9de);clip-path:polygon(50% 0,61% 39%,100% 50%,61% 61%,50% 100%,39% 61%,0 50%,39% 39%);animation:wt-aemeath-twinkle .7s ease-out both}
§ .wt-input-bubble:after{width:7px;height:7px;bottom:-5px;background:#ffd9e9;border-right:1.5px solid #f38fb7;border-bottom:1.5px solid #f38fb7}
@keyframes wt-aemeath-bubble{0%{opacity:.4;transform:translate(-50%,-42%) scale(.72) rotate(-5deg);animation-timing-function:cubic-bezier(.2,1.6,.4,1)}26%{opacity:1;transform:translate(-50%,-50%) scale(1) rotate(0)}84%{opacity:1;transform:translate(-50%,-50%) scale(1) rotate(0);animation-timing-function:ease-in}100%{opacity:0;transform:translate(-50%,-62%) scale(.96) rotate(0)}}
@keyframes wt-aemeath-ring{0%{box-shadow:0 3px 0 #f6a8c7,0 7px 14px rgba(233,95,150,.26),inset 0 1px 0 #fff,0 0 0 0 rgba(255,143,186,.6)}100%{box-shadow:0 3px 0 #f6a8c7,0 7px 14px rgba(233,95,150,.26),inset 0 1px 0 #fff,0 0 0 10px rgba(255,143,186,0)}}
@keyframes wt-aemeath-twinkle{0%{opacity:0;transform:scale(.2) rotate(-45deg)}50%{opacity:1;transform:scale(1.2) rotate(10deg)}100%{opacity:.95;transform:scale(.9) rotate(0)}}
@media (prefers-reduced-motion:reduce){§ .wt-input-bubble,§ .wt-input-bubble:before{animation:none}}
`.split('§').join(scope);
 const textProperty=/^(color|fill|stroke|caret-color|-webkit-text-fill-color|-webkit-text-stroke-color|text-decoration-color)$|^--.*(text|title|label)/;
 const sheetSelector='style:not(['+mark+']),link[rel="stylesheet"]';
 const nodes={};
 let current='default',observer=null,timer=0,assets=null,pickers=[],undo=[],rewardObserver=null,disposePlayer=null;
 const valid=value=>Object.hasOwn(themes,value)?value:'default';
 function read(){try{return valid(localStorage.getItem(key))}catch{return 'default'}}
 function parse(token){
  if(token[0]==='#'){
   let hex=token.slice(1);
   if(hex.length<5)hex=hex.replace(/./g,'$&$&');
   if(hex.length!==6&&hex.length!==8)return null;
   const value=[0,2,4,6].map(at=>parseInt(hex.slice(at,at+2),16));
   return [value[0],value[1],value[2],hex.length===8?Math.round(value[3]/2.55)/100:1];
  }
  const part=token.match(/-?[\d.]+%?/g);
  if(!part||part.length<3)return null;
  const number=(text,scale)=>parseFloat(text)*(text.endsWith('%')?scale:1);
  return [number(part[0],2.55),number(part[1],2.55),number(part[2],2.55),part[3]===undefined?1:number(part[3],.01)];
 }
 // Warm cream, orange and brown become pink; the yellow-green accent becomes Aemeath's cyan.
 // Greys, reds, greens, blues and rarity colors stay as they are.
 function remap(r,g,b,text){
  const max=Math.max(r,g,b),min=Math.min(r,g,b),delta=max-min,l=(max+min)/510;
  if(!delta||l<.05||l>.985)return null;
  const s=delta/(255-Math.abs(max+min-255));
  if(s<.1)return null;
  const h=60*(max===r?((g-b)/delta+6)%6:max===g?(b-r)/delta+2:(r-g)/delta+4);
  let hue,sat,light;
  if(h>58&&h<=78&&s>=.25){hue=186;sat=s;light=l}
  else if(h>=12&&h<=58){
   hue=(text?332:338)+(h-35)*.25;
   if(text){sat=Math.min(1,s*1.15+.04);light=l>.6?l+(1-l)*.25:l}
   else if(l>=.85){sat=s;light=l+(1-l)*.3}
   else if(l>=.6){sat=s*.85;light=l+(1-l)*.12}
   else{sat=Math.min(1,s*1.2);light=l+(.62-l)*.5*Math.min(1,Math.max(0,(l-.2)/.2))}
  }else return null;
  const c=(1-Math.abs(2*light-1))*sat,x=c*(1-Math.abs(hue/60%2-1)),m=light-c/2;
  return (hue<240?[0,x,c]:[c,0,x]).map(n=>Math.round((n+m)*255));
 }
 function convert(value,text){
  let changed=false;
  const next=value.replace(/url\([^)]*\)|#[0-9a-f]{3,8}\b|rgba?\([^()]*\)/gi,token=>{
   if(token[0]==='u'||token[0]==='U')return token;
   const color=parse(token);
   const mapped=color&&remap(color[0],color[1],color[2],text);
   if(!mapped)return token;
   changed=true;
   return color[3]<1?'rgba('+mapped.join(', ')+', '+color[3]+')':'rgb('+mapped.join(', ')+')';
  });
  return changed?next:null;
 }
 // Colors are rewritten inside the existing rules so selector specificity and
 // cascade order stay exactly as upstream wrote them. Every change is recorded
 // and reverted when the original theme is selected again. Mapped colors fall
 // outside the warm range, so a second pass over the same rule changes nothing.
 // A shorthand that contains var() exposes no longhand values, so it is read as a whole.
 const shorthands=['background','border','border-top','border-right','border-bottom','border-left','border-color','outline'];
 // Move decorative bitmaps onto their own layer, leaving the character and item art untinted.
 const rasterBackground=/(?:^|\s)(?:\.preset-item(?:--active|--add)?|\.preset-preview-main|\.preset-preview-emote-img|\.synthesis-item)$/;
 function recolor(style){
  for(const name of Array.from(style).concat(shorthands)){
   const value=style.getPropertyValue(name);
   if(!value||value.length>4000||value.indexOf('#')<0&&value.indexOf('rgb')<0)continue;
   const next=convert(value,textProperty.test(name));
   if(!next)continue;
   const priority=style.getPropertyPriority(name);
   style.setProperty(name,next,priority);
   undo.push([style,name,value,priority]);
  }
 }
 function walk(rules){
  for(const rule of rules){
   if(rule.style){
    recolor(rule.style);
    if(rasterBackground.test(rule.selectorText||'')){
     const image=rule.style.getPropertyValue('background-image');
     if(image.startsWith('url(')&&!rule.style.getPropertyValue('--wt-raster-image')){
      const url=image.slice(4,-1).replace(/^["']|["']$/g,'');
      rule.style.setProperty('--wt-raster-image',url.startsWith('data:')?image:
       'url("'+new URL(url,rule.parentStyleSheet?.href||document.baseURI).href+'")');
      undo.push([rule.style,'--wt-raster-image','','']);
     }
    }
   }
   if(rule.cssRules)walk(rule.cssRules);
   else if(rule.styleSheet)try{walk(rule.styleSheet.cssRules)}catch{}
  }
 }
 function sheet(name){
  if(!nodes[name]){nodes[name]=document.createElement('style');nodes[name].setAttribute(mark,name)}
  return nodes[name];
 }
 function rebuild(){
  timer=0;
  if(current==='default')return;
  for(const item of document.styleSheets){
   if(item.ownerNode?.hasAttribute?.(mark))continue;
   try{walk(item.cssRules)}catch{}
  }
  const base=sheet('base');
  if(!base.textContent)base.textContent=aemeathCss;
  if(!base.isConnected)document.head.append(base);
 }
 function schedule(){if(current!=='default'&&!timer)timer=setTimeout(rebuild,60)}
 function loaded(){schedule();if(current==='aemeath')loadAssets()}
 function linkLoaded(event){if(event.target?.nodeName==='LINK')schedule()}
 function changed(records){
  for(const record of records){
   if(record.target.nodeName==='STYLE'){if(!record.target.hasAttribute(mark)){schedule();return}continue}
   for(const node of record.addedNodes)if(node.nodeType===1&&(node.matches(sheetSelector)||node.querySelector(sheetSelector))){schedule();return}
  }
 }
 function loadAssets(){
  if(assets)return;
  const main=window.__TAURI_INTERNALS__?.metadata?.currentWindow?.label==='main';
  if(main&&!disposePlayer&&typeof __wtSnowfluffPlayer!=='undefined'){
   if(!document.body)return;
   disposePlayer=__wtSnowfluffPlayer.create();
  }
  const pending=import('http://127.0.0.1:48642/ui.js');
  assets=pending;
  pending.then(module=>{
   if(assets!==pending||current!=='aemeath')return;
   const art=module.helperThemeAssets?.aemeath;
   const image=main?'':art?.background,tides=main?art?.tides:'';
   if(!image&&!tides)return;
   const node=sheet('assets');
   node.textContent=scope+'{'+(image?'--wt-theme-bg:url("'+image+'")':'--wt-theme-tides:url("'+tides+'")')+'}';
   document.head.prepend(node);
   if(tides)watchRewards();
  }).catch(()=>{if(assets===pending)assets=null});
 }
 function watchRewards(){
  document.documentElement.setAttribute('data-wt-tides','');
  window.dispatchEvent(new Event('pet-toast-geometry-changed'));
  rewardObserver=new MutationObserver(records=>{
   if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
   const opened=new Set();
   for(const {target,oldValue} of records){
    if(target.matches('.reward-btn--open')&&!oldValue?.split(/\s+/).includes('reward-btn--open'))opened.add(target);
   }
   for(const button of opened){
    const {x,y,width,height}=button.getBoundingClientRect();
    for(let i=0;i<10;i++){
     const angle=i*Math.PI/5,radius=17+(i%3)*7;
     const spark=document.createElement('i');spark.className='wt-tide-spark';
     spark.style.left=x+width/2-3+'px';spark.style.top=y+height/2-3+'px';
     if(i%3===0)spark.style.background='#fff8de';
     document.body.append(spark);
     const animation=spark.animate([{opacity:0,transform:'scale(.55)'},{opacity:1,offset:.24},{opacity:0,transform:'translate('+Math.cos(angle)*radius+'px,'+(Math.sin(angle)*radius-8)+'px) scale(.25) rotate(45deg)'}],{duration:510+i%3*60,easing:'ease-out',fill:'both'});
     animation.finished.then(()=>spark.remove(),()=>spark.remove());
    }
   }
  });
  rewardObserver.observe(document.body,{subtree:true,attributes:true,attributeOldValue:true,attributeFilter:['class']});
 }
 function start(){
  rebuild();
  if(!observer){
   observer=new MutationObserver(changed);
   observer.observe(document.documentElement,{childList:true,subtree:true});
   document.addEventListener('load',linkLoaded,true);
  }
  loadAssets();
 }
 function stop(){
  observer?.disconnect();observer=null;
  rewardObserver?.disconnect();rewardObserver=null;
  disposePlayer?.();disposePlayer=null;
  document.documentElement.removeAttribute('data-wt-tides');
  window.dispatchEvent(new Event('pet-toast-geometry-changed'));
  for(const spark of document.querySelectorAll('.wt-tide-spark'))spark.remove();
  document.removeEventListener('load',linkLoaded,true);
  if(timer){clearTimeout(timer);timer=0}
  for(const [style,name,value,priority] of undo.reverse())try{style.setProperty(name,value,priority)}catch{}
  undo=[];
  for(const name of ['base','assets']){nodes[name]?.remove();delete nodes[name]}
  assets=null;
 }
 function sync(){
  pickers=pickers.filter(root=>root.isConnected);
  for(const root of pickers)for(const option of root.querySelectorAll('[data-wt-theme-option]'))option.setAttribute('aria-pressed',String(option.dataset.wtThemeOption===current));
 }
 function customBackground(){
  try{
   const data=localStorage.getItem(backgroundKey);
   return /^data:image\/(?:webp|jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(data??'')?data:'';
  }catch{return ''}
 }
 function syncBackground(){
  const data=customBackground(),root=document.documentElement;
  const main=window.__TAURI_INTERNALS__?.metadata?.currentWindow?.label==='main';
  if(!main&&data&&current==='aemeath'){
   root.style.setProperty('--wt-custom-background','url("'+data+'")');
   root.setAttribute('data-wt-custom-background','');
  }else{
   root.style.removeProperty('--wt-custom-background');
   root.removeAttribute('data-wt-custom-background');
  }
  for(const picker of pickers){
   const reset=picker.querySelector('[data-wt-reset-background]');
   if(reset)reset.disabled=!data;
  }
 }
 async function encodeBackground(file){
  if(!/^image\/(?:png|jpeg|webp|bmp|x-ms-bmp|gif)$/.test(file.type)&&
     !/\.(?:png|jpe?g|webp|bmp|gif)$/i.test(file.name))throw Error('请选择 PNG、JPEG、WebP、BMP 或 GIF 图片。');
  const bitmap=await window.createImageBitmap(file).catch(()=>{throw Error('无法读取这张图片，请换一张。')});
  try{
   const scale=Math.min(1,1920/Math.max(bitmap.width,bitmap.height));
   const canvas=document.createElement('canvas');
   canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
   const ctx=canvas.getContext('2d');ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
   for(const quality of [.86,.72,.56,.42]){
    const data=canvas.toDataURL('image/webp',quality);
    if(data.length<=1100000)return data;
   }
   throw Error('图片细节太多，无法保存，请换一张尺寸较小的图片。');
  }finally{bitmap.close()}
 }
 function mountBackground(root){
  const field=document.createElement('fieldset');
  field.className='wt-theme-background';
  field.innerHTML='<legend>面板背景</legend><div class="wt-theme-background-actions"><button class="wt-ui-button" type="button" data-wt-choose-background>选择图片</button><button class="wt-ui-button" type="button" data-wt-reset-background>恢复默认</button></div><input type="file" accept=".png,.jpg,.jpeg,.webp,.bmp,.gif" hidden><output role="status">仅在爱弥斯主题显示。图片保存在本机。</output>';
  const input=field.querySelector('input'),output=field.querySelector('output'),choose=field.querySelector('[data-wt-choose-background]'),reset=field.querySelector('[data-wt-reset-background]');
  function changed(){
   syncBackground();
   if(typeof emit==='function')Promise.resolve().then(()=>emit(backgroundUpdated)).catch(()=>{});
  }
  choose.addEventListener('click',()=>input.click());
  input.addEventListener('change',async()=>{
   const file=input.files?.[0];input.value='';if(!file)return;
   choose.disabled=reset.disabled=true;
   try{
    const data=await encodeBackground(file);
    try{localStorage.setItem(backgroundKey,data)}catch{throw Error('无法写入本机存储，原背景已保留。')}
    output.textContent='已保存自定义背景。';
   }catch(error){output.textContent=error.message||'背景保存失败。'}
   finally{choose.disabled=false;changed()}
  });
  reset.addEventListener('click',()=>{
   try{localStorage.removeItem(backgroundKey);output.textContent='已恢复默认背景。';changed()}
   catch{output.textContent='无法恢复默认背景。'}
  });
  root.append(field);
 }
 function apply(value){
  const next=valid(value);
  // The window that changes the theme also receives its own broadcast.
  if(next===current&&(next==='default'||observer)){sync();return}
  current=next;
  if(current==='default'){document.documentElement.removeAttribute(attr);stop()}
  else{document.documentElement.setAttribute(attr,current);start()}
  sync();syncBackground();
 }
 function set(value){
  const theme=valid(value);
  try{localStorage.setItem(key,theme)}catch{}
  apply(theme);
  if(typeof emit==='function')Promise.resolve().then(()=>emit(updated,{theme})).catch(()=>{});
 }
 function mount(root){
  if(!root||root.firstChild)return;
  if(!document.getElementById('wt-theme-picker-css')){
   const style=document.createElement('style');style.id='wt-theme-picker-css';style.setAttribute(mark,'picker');style.textContent=pickerCss;document.head.append(style);
  }
  for(const id of Object.keys(themes)){
   const option=document.createElement('button');
   option.type='button';option.className='wt-theme-option';option.dataset.wtThemeOption=id;
   option.innerHTML='<span class="wt-theme-swatch" aria-hidden="true"><i></i><i></i><i></i></span><span class="wt-theme-text"><b></b><small></small></span>';
   option.querySelector('b').textContent=themes[id][0];
   option.querySelector('small').textContent=themes[id][1];
   option.addEventListener('click',()=>set(id));
   root.append(option);
  }
  mountBackground(root);
  if(typeof __wtAemeathMech!=='undefined')__wtAemeathMech.mount(root);
  pickers.push(root);sync();syncBackground();
 }
 function render(h){
  return h('details',{class:'wt-aemeath-options'},[
   h('summary',null,'爱弥斯主题与外观'),
   h('div',{id:'wt-theme-settings',class:'wt-theme-picker',role:'group','aria-label':'外观主题',onVnodeMounted:vnode=>{try{mount(vnode.el)}catch{}}})
  ]);
 }
 // This module is evaluated with the shared chunk in every window. A theme
 // failure must never stop the application from starting.
 if(typeof document!=='undefined')try{
  __wtPanelLayout.extend('interaction','互动与表情','i弗TV、按键自动表情和爱弥斯主题',render);
  window.addEventListener('storage',event=>{
   if(event.key===key||event.key===null)apply(read());
   if(event.key===backgroundKey||event.key===null)syncBackground();
  });
  window.addEventListener('load',loaded);
  if(typeof listen==='function')Promise.resolve().then(()=>listen(updated,event=>apply(event.payload?.theme))).catch(()=>{});
  if(typeof listen==='function')Promise.resolve().then(()=>listen(backgroundUpdated,syncBackground)).catch(()=>{});
  apply(read());
 }catch{}
 return {key,themes,read,set,apply,mount,render,remap,get current(){return current}};
})();
export {__wtTheme,__wtRegions};
