function __wtRegions(root,mode,rect){
 const reward=mode==='input'&&document.documentElement.hasAttribute('data-wt-tides')?'.reward-btn':'.reward-anchor';
 const companion=mode==='visual'?'.wt-denia-cake,.wt-denia-line,.wt-denia-messenger':'.wt-denia-cake:enabled';
 const query='.wt-snowfluff:not([hidden]),.wt-snowfluff-star,.wt-denia-star,.wt-oath-core-lane,.wt-synthesis-reminder,#wt-input-keyboard,'+companion+','+reward;
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
 const backgroundKeys={aemeath:'wuwatappo-aemeath-background-v1',denia:'wuwatappo-denia-background-v1',phrolova:'wuwatappo-phrolova-background-v1'};
 const backgroundUpdated='wt-theme-background-updated',deniaUpdated='wt-denia-effects-updated';
 const packsUpdated='wt-theme-packs-updated',packsKey='wuwatappo-theme-packs-v1',moduleUrl='http://127.0.0.1:48642/ui.js';
 const themes={default:['原版暖色','奶油色与棕色'],aemeath:['爱弥斯','小爱粉与星光气泡'],denia:['达妮娅','珍珠雾紫与拟态泡泡'],phrolova:['弗洛洛','彼岸绯红与 i弗TV']};
 const dialogue=typeof __wtPetDialogue==='undefined'?null:__wtPetDialogue;
 const scope=':root['+attr+'="aemeath"]';
 // Theme swatches always show their original colors.
 const discoveries={
  aemeath:['player','点一下计数栏的星星，让飞行雪绒陪你听首歌。'],
  denia:['blocks','点一下计数栏的星星，试一局拉海洛方块。'],
  phrolova:['','展开下方的 i弗TV，给弗洛洛的桌面故事开个场。']
 };
 const pickerCss=`
.wt-theme-note{grid-column:1/-1;margin:0;padding:9px 12px;border-inline-start:3px solid var(--wt-ui-border,#d6ae83);background:var(--wt-ui-field,#fffaf1);border-radius:8px;color:var(--wt-ui-text,#694832);font-size:13px}
.wt-theme-picker{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}
.wt-theme-option{position:relative;display:flex;align-items:center;gap:10px;min-width:0;padding:10px 12px;border:1.5px solid #e3c9aa;border-radius:12px;background:#fffdf7;color:#694832;font:inherit;text-align:left;cursor:pointer;transition:border-color .15s,box-shadow .15s,transform .15s}
.wt-theme-option:hover{transform:translateY(-1px)}
.wt-theme-option:disabled{cursor:default;opacity:.68;transform:none}
.wt-theme-import{grid-column:1/-1;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.wt-theme-import[hidden]{display:none}
.wt-theme-import output{font-size:12px;color:var(--wt-ui-muted,#775e4b)}
.wt-theme-cloud{grid-column:1/-1;display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:7px 10px;border:1px dashed var(--wt-ui-border,#e3c9aa);border-radius:10px;background:var(--wt-ui-field,#fffaf1)}
.wt-theme-cloud[hidden]{display:none}
.wt-theme-cloud-label{font-size:12px;color:var(--wt-ui-muted,#775e4b);margin-inline-end:2px}
.wt-theme-dl-bar{grid-column:1/-1;display:grid;gap:4px;padding:7px 10px;border:1px solid var(--wt-ui-border,#e3c9aa);border-radius:10px;background:var(--wt-ui-field,#fffaf1);font-size:12px;color:var(--wt-ui-text,#694832)}
.wt-theme-dl-bar[hidden]{display:none}
.wt-theme-dl-track{height:6px;border-radius:99px;background:var(--wt-ui-divider,#ead7bf);overflow:hidden}
.wt-theme-dl-track i{display:block;height:100%;width:0;border-radius:99px;background:var(--wt-ui-accent,#c98d55);transition:width .25s ease}
.wt-theme-remove{margin-inline-start:auto}
.wt-theme-option[aria-pressed=true]{border-color:#c98d55;box-shadow:0 0 0 3px #f6d49d99}
.wt-theme-option:focus-visible{outline:2px solid #976137;outline-offset:2px}
.wt-theme-swatch{flex:none;display:flex;width:38px;height:38px;border-radius:50%;overflow:hidden;border:2px solid #fff;box-shadow:0 0 0 1px #0000002b;transform:rotate(-35deg)}
.wt-theme-swatch i{flex:1}
[data-wt-theme-option=default] i:nth-child(1){background:#fff3dd}[data-wt-theme-option=default] i:nth-child(2){background:#fed291}[data-wt-theme-option=default] i:nth-child(3){background:#995e3f}
[data-wt-theme-option=aemeath] i:nth-child(1){background:#ffe7f0}[data-wt-theme-option=aemeath] i:nth-child(2){background:#f7a5c3}[data-wt-theme-option=aemeath] i:nth-child(3){background:#7fdcea}
[data-wt-theme-option=denia] i:nth-child(1){background:#f9f3ff}[data-wt-theme-option=denia] i:nth-child(2){background:#ac91d6}[data-wt-theme-option=denia] i:nth-child(3){background:#b4c8ed}
[data-wt-theme-option=phrolova] i:nth-child(1){background:#f7e6ec}[data-wt-theme-option=phrolova] i:nth-child(2){background:#a33f62}[data-wt-theme-option=phrolova] i:nth-child(3){background:#3f263d}
.wt-theme-text{display:flex;flex-direction:column;min-width:0}
.wt-theme-text b{font-size:14px;line-height:1.35}
.wt-theme-text small{font-size:12px;line-height:1.4;opacity:.82}
.wt-theme-option[aria-pressed=true] b:after{content:'使用中';display:inline-block;margin-left:6px;padding:0 6px;border-radius:8px;background:#f6d49d;font-size:11px;font-weight:400;line-height:16px;vertical-align:1px}
:root[lang=en] .wt-theme-option[aria-pressed=true] b:after{content:'Active'}
.wt-aemeath-options{margin:12px 0 0;border-top:1px solid var(--wt-ui-divider,#ead7bf);padding-top:8px}
.wt-aemeath-options>summary{cursor:pointer;color:var(--wt-ui-text,#694832);font-weight:600;padding:4px 0}
.wt-aemeath-options .wt-theme-note{grid-column:1/-1;margin:0;padding:9px 12px;border-inline-start:3px solid var(--wt-ui-border,#d6ae83);background:var(--wt-ui-field,#fffaf1);border-radius:8px;color:var(--wt-ui-text,#694832);font-size:13px}
.wt-theme-picker{margin-top:8px}
.wt-theme-background,.wt-theme-picker>.wt-denia-settings,.wt-theme-picker>.wt-theme-effect{grid-column:1/-1}
.wt-theme-background{margin:0;min-width:0;padding:8px 10px;border:1px solid var(--wt-ui-border,#e3c9aa);border-radius:12px;background:var(--wt-ui-card-fill,#fff9ed)}
.wt-theme-background legend{padding:0 5px;font-weight:600}
.wt-theme-background-actions{display:flex;gap:6px;flex-wrap:wrap}
.wt-theme-background output{display:block;margin-top:5px;color:var(--wt-ui-muted,#775e4b);font-size:12px;overflow-wrap:anywhere}
.wt-theme-credit{margin:7px 0 0;padding-top:7px;border-top:1px solid var(--wt-ui-divider,#ead7bf);color:var(--wt-ui-text,#694832);font-size:12px;line-height:1.5;overflow-wrap:anywhere}
.wt-theme-credit strong{margin-inline-end:.7em}
.wt-aemeath-options .wt-theme-effect{margin:10px 0 0;border-color:var(--wt-ui-divider,#e9d6bd)}
.wt-aemeath-options .wt-theme-picker>.wt-theme-effect{margin-top:0}
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
 --wt-ui-surface:#fff5fa;
 --wt-ui-hover:#fce0ed;
 --wt-ui-accent:#df639c;
 --wt-ui-accent-fill:#fac1da;
 --wt-ui-focus:#aa4075;
 --wt-ui-rail:#efacc8;
 --wt-ui-decor:#e7a1c0;
 --wt-mech-check:#df639c;
 --wt-synthesis-border:#e68db5;
 --wt-synthesis-bubble:linear-gradient(145deg,#fff5fa,#ffdceb);
 --wt-synthesis-text:#873359;
 --wt-synthesis-shadow:#a43a692b;
 --wt-ui-raster:grayscale(1) brightness(.96) sepia(.35) saturate(3) hue-rotate(282deg);
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
§ .pet-toolbar{filter:var(--wt-ui-raster)}
§[data-wt-aemeath-toolbar] .pet-toolbar{background-image:var(--wt-aemeath-toolbar);filter:none}
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
 const themedSurfaces=`
§ .tab-bar{background-color:var(--wt-ui-rail)}
§ .wt-ui-button:not(.wt-ui-button--primary,[aria-pressed=true]),
§ select:is(.setting-input,.setting-select,.room-layout-select),
§ .wt-ui-card select,§ .wt-ui-room-tools select,§ .wt-ui-actions select,
§ .select-item :is(.select-input,.select-option),§ .atlas-item :is(.atlas-qty,.atlas-type-icon){
 background-color:var(--wt-ui-surface);border-color:var(--wt-ui-border);color:var(--wt-ui-text);
}
§ .wt-ui-card :is(input[type=text],input[type=number],textarea),
§ .wt-ui-feature :is(input[type=text],input[type=number],textarea){
 color:var(--wt-ui-text);background-color:var(--wt-ui-field);border-color:var(--wt-ui-border);
}
§ .wt-input-ui kbd.wt-key-on,§ .wt-pad .wt-pad-board kbd.wt-key-on{
 background:var(--wt-ui-accent-fill);color:var(--wt-ui-text);border-color:var(--wt-ui-accent);box-shadow:0 0 0 2px var(--wt-ui-hover);
}
§ .wt-ui-button:not(.wt-ui-button--primary,[aria-pressed=true],:disabled):hover,
§ .select-item .select-input:hover{background-color:var(--wt-ui-hover)}
§ .select-item .select-option-item{border-color:var(--wt-ui-divider)}
§ .select-item .select-option-item:is(:hover,.select-option-item--active)::after{
 background:var(--wt-ui-accent);border-color:var(--wt-ui-focus);box-shadow:none;
}
§ .select-item .select-option-list::-webkit-scrollbar-thumb,§ .my-preset .my-preset-list::-webkit-scrollbar-thumb{background:var(--wt-ui-decor)}
§ .select-item .select-option-list::-webkit-scrollbar-track,§ .my-preset .my-preset-list::-webkit-scrollbar-track{background-color:var(--wt-ui-divider)}
§ .room-members li{background-color:var(--wt-ui-surface)}
§ .room-members li.room-owner{background-color:var(--wt-ui-hover)}
§ .emotion-dot{background-color:var(--wt-ui-card-fill)}
§ .emotion-dot:is(:hover,.is-hover){background-color:var(--wt-ui-hover)}
§ .reward-countdown__svg:not(.reward-countdown__progress)>image,
§ .reward-btn:not(.reward-btn--loading),§ .preset-preview-emote-img::after,
§ :is(.preset-preview-emote-remove,.preset-remove,.panel-close,.popup-close,.about-close,.oss-notice-close){filter:var(--wt-ui-raster)}
§ .select-item .select-input::after,§ .select-item .select-option::before,
§ .login-dialog-background::before,§ :is(.panel-title,.synthesis-tip)::before,§ :is(.panel-title,.synthesis-tip)::after,
§ .atlas-type::after,§ .atlas-item::after,§ .atlas-item :is(.atlas-type-icon,.atlas-remove),
§ .emotion-dot::before,§ .emotion-dot::after,§ .room-info .room-number-copy,
§ .room-members :is(.room-visible-btn,.room-kick-btn),
§ :is(.login-dialog-button--passport,.login-dialog-button--uid),§ .uid-cont .btn-send{filter:var(--wt-ui-raster)}
§ .atlas-item::before{filter:var(--wt-ui-raster) drop-shadow(0 2px 0 var(--wt-ui-decor))}
§ .atlas-item--active::before{
 filter:var(--wt-ui-raster) drop-shadow(0 -2px 0 var(--wt-ui-decor)) drop-shadow(2px 0 0 var(--wt-ui-accent)) drop-shadow(0 3px 0 var(--wt-ui-accent)) drop-shadow(-2px 0 0 var(--wt-ui-accent));
}
§ .my-preset .preset-item,§ .preset-preview :is(.preset-preview-main,.preset-preview-emote-img),§ .synthesis-list .synthesis-item{
 background-image:none!important;
}
§ .my-preset .preset-item::before,§ .preset-preview :is(.preset-preview-main,.preset-preview-emote-img)::before,
§ .synthesis-list .synthesis-item::before{
 content:'';position:absolute;inset:0;pointer-events:none;
 background:var(--wt-raster-image,none) center / 100% 100% no-repeat var(--wt-slot-color,var(--wt-ui-decor));
 background-blend-mode:luminosity;
 mask:var(--wt-raster-image,linear-gradient(transparent,transparent)) center / 100% 100% no-repeat;
}
§ .my-preset .preset-item--active{--wt-slot-color:var(--wt-ui-accent)}
§ .synthesis-list .synthesis-add{
 position:relative;background:linear-gradient(var(--wt-ui-decor),var(--wt-ui-decor)) center / 48% 9% no-repeat,
 linear-gradient(var(--wt-ui-decor),var(--wt-ui-decor)) center / 9% 48% no-repeat;
}
`.split('§').join(':root:is([data-wt-theme="aemeath"],[data-wt-theme="denia"],[data-wt-theme="phrolova"])');
 const tidesCss=`
:root[data-wt-tides] .reward-anchor{pointer-events:none}
:root[data-wt-tides] .reward-anchor--right{--wt-tide-position:right center}
:root[data-wt-tides] .reward-anchor .reward-countdown{width:100%;height:100%;aspect-ratio:auto}
:root[data-wt-tides] .reward-anchor .reward-countdown__svg{visibility:hidden}
:root[data-wt-tides] .reward-anchor .reward-countdown::before,
:root[data-wt-tides] .reward-anchor .reward-btn::before{
 content:"";position:absolute;inset:0;margin:auto;width:48px;height:48px;
 background:var(--wt-theme-tides) var(--wt-tide-position,left center) / 200% 100% no-repeat;
 pointer-events:none;
}
:root[data-wt-tides] .reward-anchor .reward-countdown::before{top:-12px;transform:scale(.90)}
:root[data-wt-tides] .reward-anchor .reward-countdown__text{
 inset:auto 0 -2px;height:auto;margin-inline:auto;width:max-content;transform:none;
 padding:0 5px;border-radius:8px;background:var(--wt-tide-count-bg,#fff0f6);color:var(--wt-tide-count-text,#793050);
 box-shadow:0 1px 3px #7a3b4b22;font-size:11px;line-height:15px;
}
:root[data-wt-tides] .reward-anchor .reward-btn{
 position:absolute;inset:0;margin:auto;width:34px;height:36px;padding:0;border:0;background:none;filter:none;pointer-events:auto;
}
:root[data-wt-tides] .reward-anchor .reward-btn:before{
 inset:50% auto auto 50%;transform:translate(-50%,-50%);margin:0;filter:drop-shadow(0 2px 1px #783b4b55);
}
:root[data-wt-tides] .reward-anchor .reward-btn:after{display:none}
:root[data-wt-tides] .reward-anchor .reward-btn--open{animation:none}
:root[data-wt-tides] .reward-anchor .reward-btn--open:before{animation:wt-tide-disappear .5s ease-out both}
.wt-tide-spark{position:fixed;width:6px;height:6px;pointer-events:none;z-index:20;clip-path:polygon(50% 0,62% 36%,100% 50%,62% 64%,50% 100%,38% 64%,0 50%,38% 36%);background:var(--wt-tide-spark,#ffdb8a)}
.wt-tide-spark--light{background:var(--wt-tide-spark-light,#fff8de)}
@keyframes wt-tide-disappear{0%{opacity:1;transform:translate(-50%,-50%) scale(1)}30%{opacity:1;transform:translate(-50%,-50%) scale(1.12);filter:brightness(1.35)}100%{opacity:0;transform:translate(-50%,-50%) scale(.74);filter:brightness(1.9)}}
@media(prefers-reduced-motion:reduce){:root[data-wt-tides] .reward-anchor .reward-btn--open::before{animation:none;opacity:0}}
`;
 const textProperty=/^(color|fill|stroke|caret-color|-webkit-text-fill-color|-webkit-text-stroke-color|text-decoration-color)$|^--.*(text|title|label)/;
 const sheetSelector='style:not(['+mark+']),link[rel="stylesheet"]';
 const nodes={};
 const deniaClients=new Set();
 const phrolovaClients=new Set(),mechClients=new Set();
 let current='default',observer=null,timer=0,assets=null,pickers=[],undo=[],rewardObserver=null,disposePlayer=null,denia=null;
 let packs={},packEpoch=0,phrolovaAvailable=false,mechSprite='';
 function onMech(callback){
  mechClients.add(callback);
  callback(mechSprite);
  return ()=>mechClients.delete(callback);
 }
 function onPhrolova(callback){
  phrolovaClients.add(callback);
  callback(phrolovaAvailable);
  return ()=>phrolovaClients.delete(callback);
 }
 function bindPhrolova(ref,onUnmount){
  const enabled=ref(phrolovaAvailable);
  onUnmount(onPhrolova(value=>{enabled.value=value}));
  return enabled;
 }
 function syncPhrolova(){
  const next=current==='phrolova'&&packs.phrolova?.effects?.includes('phrolova')===true;
  if(next===phrolovaAvailable)return;
  phrolovaAvailable=next;
  for(const callback of phrolovaClients)callback(next);
 }
 const valid=value=>Object.hasOwn(themes,value)?value:'default';
 function read(){try{return valid(localStorage.getItem(key))}catch{return 'default'}}
 async function refreshPacks(force=false){
  const epoch=++packEpoch,module=await import(moduleUrl),catalog=await module.loadThemePacks(force);
  if(epoch!==packEpoch)return;
  const prior=packs[current]?.revision;
  packs=catalog;
  if(current!=='default'&&prior!==packs[current]?.revision){stop();current='default';document.documentElement.removeAttribute(attr)}
  apply(read());sync();
  window.dispatchEvent(new Event('wt-theme-packs-changed'));
 }
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
 function remap(r,g,b,text,theme=current){
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
  if(theme==='denia'){
   hue=h>58?223:(text?267:263)+(h-35)*.23;
   sat=Math.min(.58,sat*.68);
  }else if(theme==='phrolova'){
   hue=h>58?334:(text?326:340)+(h-35)*.23;
   sat=Math.min(.65,sat*.79);
  }
  const c=(1-Math.abs(2*light-1))*sat,x=c*(1-Math.abs(hue/60%2-1)),m=light-c/2;
  return (hue<240?[0,x,c]:hue<300?[x,0,c]:[c,0,x]).map(n=>Math.round((n+m)*255));
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
 const raritySelector=/(?:rarity|quality)[-_]|--(?:common|uncommon|rare|epic)\b/i;
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
    if(!raritySelector.test(rule.selectorText||''))recolor(rule.style);
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
  if(!base.textContent)base.textContent=current==='aemeath'?aemeathCss+themedSurfaces:themedSurfaces;
  if(!base.isConnected)document.head.append(base);
 }
 function schedule(){if(current!=='default'&&!timer)timer=setTimeout(rebuild,60)}
 function loaded(){schedule();if(current!=='default')loadAssets()}
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
  if(main&&!document.body)return;
  const selected=current;
  const art=packs[selected];
  if(!art)return;
  const effects=art.effects??[];
  if(selected==='aemeath'&&effects.includes('player')&&main&&!disposePlayer&&typeof __wtSnowfluffPlayer!=='undefined'){
   disposePlayer=__wtSnowfluffPlayer.create();
  }
  const pending=import(moduleUrl);
  assets=pending;
  pending.then(module=>{
   if(assets!==pending||current!==selected)return;
   if(selected==='denia'){
    const style=module.helperDenia;
    denia=effects.includes('denia')?style:null;
    if(style)sheet('base').textContent=style.css+themedSurfaces;
    if(style&&effects.includes('blocks')&&main&&document.body)disposePlayer=style.mountGame(module.openDeniaBlocks);
    syncDenia();
   }
   if(selected==='phrolova'&&module.helperPhrolovaCss)sheet('base').textContent=module.helperPhrolovaCss+themedSurfaces;
   const image=main?'':art.background,tides=main&&effects.includes('tides')?art.tides:'',toolbar=main?art.toolbar:'';
   if(!image&&!tides&&!toolbar)return;
   const node=sheet('assets');
   const declaration=([name,value])=>value?'--wt-'+name+':url("'+value+'");':'';
   node.textContent=':root['+attr+'="'+selected+'"]{'+[['theme-bg',image],['theme-tides',tides],[selected+'-toolbar',toolbar]].map(declaration).join('')+'}';
   document.head.prepend(node);
   if(tides)watchRewards();
   if(toolbar)document.documentElement.setAttribute('data-wt-'+selected+'-toolbar','');
  }).catch(()=>{if(assets===pending)assets=null});
 }
 function watchRewards(){
  const node=sheet('tides');node.textContent=tidesCss;document.head.append(node);
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
     if(i%3===0)spark.classList.add('wt-tide-spark--light');
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
  document.documentElement.removeAttribute('data-wt-denia-bubble');
  document.documentElement.removeAttribute('data-wt-denia-toolbar');
  document.documentElement.removeAttribute('data-wt-aemeath-toolbar');
  document.documentElement.removeAttribute('data-wt-phrolova-toolbar');
  window.dispatchEvent(new Event('pet-toast-geometry-changed'));
  for(const spark of document.querySelectorAll('.wt-tide-spark'))spark.remove();
  document.removeEventListener('load',linkLoaded,true);
  if(timer){clearTimeout(timer);timer=0}
  for(const [style,name,value,priority] of undo.reverse())try{style.setProperty(name,value,priority)}catch{}
  undo=[];
  for(const name of ['base','assets','tides']){nodes[name]?.remove();delete nodes[name]}
  assets=null;
  if(denia){denia=null;syncDenia()}
 }
 function sync(){
  syncPhrolova();
  const nextSprite=current==='aemeath'&&packs.aemeath?.effects?.includes('mech')?packs.aemeath.mech||'':'';
  if(nextSprite!==mechSprite){
   mechSprite=nextSprite;
   for(const callback of mechClients)callback(mechSprite);
  }
  pickers=pickers.filter(root=>root.isConnected);
  for(const root of pickers){
   for(const option of root.querySelectorAll('[data-wt-theme-option]')){
    const id=option.dataset.wtThemeOption;
    option.disabled=id!=='default'&&!packs[id];
    option.setAttribute('aria-pressed',String(id===current));
    option.querySelector('small').textContent=option.disabled?'需导入主题包':themes[id][1];
   }
   const note=root.querySelector('.wt-theme-note'),hint=discoveries[current];
   note.hidden=!hint||!packs[current]||(hint[0]?!packs[current].effects?.includes(hint[0]):!phrolovaAvailable);
   if(!note.hidden&&note.dataset.theme!==current){note.textContent=hint[1];note.dataset.theme=current}
   const mech=root.querySelector('.wt-aemeath-mech-options');
   if(!mechSprite)mech?.remove();
   else if(!mech&&typeof __wtAemeathMech!=='undefined'){
    const field=document.createElement('details'),summary=document.createElement('summary');
    field.className='wt-aemeath-mech-options wt-theme-effect wt-ui-optional';
    summary.textContent='爱弥斯 · 隧者兵装';
    field.append(summary);__wtAemeathMech.mount(field);root.append(field);
   }
   const credit=root.querySelector('.wt-theme-credit'),text=credit.querySelector('[data-wt-pack-credit]');
   text.textContent=packs[current]?.credit||'';credit.hidden=!text.textContent;
   const removeBtn=root.querySelector('[data-wt-remove-pack]');
   if(removeBtn)removeBtn.hidden=current==='default'||!packs[current];
   const cloud=root.querySelector('.wt-theme-cloud');
   if(cloud){
    const missing=['aemeath','denia','phrolova'].filter(id=>!packs[id]);
    cloud.hidden=!missing.length;
    for(const btn of cloud.querySelectorAll('[data-wt-download-pack]'))btn.hidden=!missing.includes(btn.dataset.wtDownloadPack);
   }
  }
  syncDenia(false);
 }
 function syncDenia(refresh=true){
  if(denia)denia.sync();
  for(const root of pickers){
   const field=root.querySelector('.wt-denia-settings');
   if(field){field.hidden=!denia;if(!denia)field.replaceChildren()}
   if(denia&&field&&!field.firstChild)denia.mount(field,()=>{
    syncDenia();
    if(typeof emit==='function')Promise.resolve().then(()=>emit(deniaUpdated)).catch(()=>{});
   },dialogue);
   if(denia&&field)denia.refresh(field);
  }
  if(refresh)for(const update of deniaClients)update();
 }
 function createDenia(options){
  let effect=null;
  function update(){
   if(denia){effect??=denia.create({...options,dialogue});effect.sync()}
   else{effect?.dispose();effect=null}
   options.activity();
  }
  return {
   start(){deniaClients.add(update);update()},input:(...args)=>effect?.input(...args),release:source=>effect?.release(source),
   sync:()=>effect?.sync(),inputActive:()=>effect?.active(),moved:()=>effect?.moved(),
   dispose(){deniaClients.delete(update);effect?.dispose();effect=null}
  };
 }
 function customBackground(theme=current){
  const key=backgroundKeys[theme];
  try{
   const data=key&&localStorage.getItem(key);
   return /^data:image\/(?:webp|jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(data??'')?data:'';
  }catch{return ''}
 }
 function syncBackground(){
  const data=customBackground(),root=document.documentElement;
  const main=window.__TAURI_INTERNALS__?.metadata?.currentWindow?.label==='main';
  if(!main&&data){
   root.style.setProperty('--wt-custom-background','url("'+data+'")');
   root.setAttribute('data-wt-custom-background','');
  }else{
   root.style.removeProperty('--wt-custom-background');
   root.removeAttribute('data-wt-custom-background');
  }
  for(const picker of pickers){
   const field=picker.querySelector('.wt-theme-background');
   if(!field)continue;
   field.hidden=!backgroundKeys[current];
   field.querySelector('[data-wt-reset-background]').disabled=!data;
   if(field.dataset.theme!==current){
    field.dataset.theme=current;
    field.querySelector('output').textContent=backgroundKeys[current]?'仅用于'+themes[current][0]+'主题。图片保存在本机。':'';
   }
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
  field.innerHTML='<legend>面板背景</legend><div class="wt-theme-background-actions"><button class="wt-ui-button" type="button" data-wt-choose-background>选择图片</button><button class="wt-ui-button" type="button" data-wt-reset-background>恢复默认</button></div><input type="file" accept=".png,.jpg,.jpeg,.webp,.bmp,.gif" hidden><output role="status"></output><p class="wt-theme-credit" hidden><strong>素材署名</strong><span data-wt-pack-credit></span></p>';
  const input=field.querySelector('input'),output=field.querySelector('output'),choose=field.querySelector('[data-wt-choose-background]'),reset=field.querySelector('[data-wt-reset-background]');
  function changed(){
   syncBackground();
   if(typeof emit==='function')Promise.resolve().then(()=>emit(backgroundUpdated)).catch(()=>{});
  }
  choose.addEventListener('click',()=>input.click());
  input.addEventListener('change',async()=>{
   const theme=current,key=backgroundKeys[theme],file=input.files?.[0];input.value='';if(!file||!key)return;
   choose.disabled=reset.disabled=true;
   try{
    const data=await encodeBackground(file);
    try{localStorage.setItem(key,data)}catch{throw Error('无法写入本机存储，原背景已保留。')}
    if(current===theme)output.textContent='已保存自定义背景。';
   }catch(error){if(current===theme)output.textContent=error.message||'背景保存失败。'}
   finally{choose.disabled=false;changed()}
  });
  reset.addEventListener('click',()=>{
   const key=backgroundKeys[current];if(!key)return;
   try{localStorage.removeItem(key);output.textContent='已恢复默认背景。';changed()}
   catch{output.textContent='无法恢复默认背景。'}
  });
  root.append(field);
 }
 function apply(value){
  const next=packs[value]?valid(value):'default';
  // The window that changes the theme also receives its own broadcast.
  if(next===current&&(next==='default'||observer)){sync();return}
  if(current!=='default')stop();
  current=next;
  if(current==='default')document.documentElement.removeAttribute(attr);
  else{document.documentElement.setAttribute(attr,current);start()}
  sync();syncBackground();
 }
 function set(value){
  const theme=valid(value);
  if(theme!=='default'&&!packs[theme])return;
  try{localStorage.setItem(key,theme)}catch{}
  apply(theme);
  if(typeof emit==='function')Promise.resolve().then(()=>emit(updated,{theme})).catch(()=>{});
 }
 function mountImport(root){
  const field=document.createElement('div');
  field.className='wt-theme-import';
  field.innerHTML='<button class="wt-ui-button" type="button" data-wt-import-pack>导入主题包</button><button class="wt-ui-button wt-theme-remove" type="button" data-wt-remove-pack hidden>卸载当前主题包</button><output role="status">支持 .wttheme 文件</output>';
  const button=field.querySelector('[data-wt-import-pack]'),removeBtn=field.querySelector('[data-wt-remove-pack]'),status=field.querySelector('output');
  const cloud=document.createElement('div');
  cloud.className='wt-theme-cloud';
  cloud.innerHTML='<span class="wt-theme-cloud-label">在线获取主题包</span>'+['aemeath','denia','phrolova'].map(id=>'<button class="wt-ui-button" type="button" data-wt-download-pack="'+id+'">下载'+themes[id][0]+'</button>').join('');
  const progressBox=document.createElement('div');
  progressBox.className='wt-theme-dl-bar';progressBox.hidden=true;
  progressBox.innerHTML='<span data-wt-dl-text></span><div class="wt-theme-dl-track"><i data-wt-dl-fill></i></div>';
  const dlText=progressBox.querySelector('[data-wt-dl-text]'),dlFill=progressBox.querySelector('[data-wt-dl-fill]');
  let dlTimer=0;
  function broadcastPacks(){
   try{localStorage.setItem(packsKey,String(Date.now()))}catch{}
   if(typeof emit==='function')Promise.resolve(emit(packsUpdated)).catch(()=>{});
  }
  function setDownloadBusy(busy){
   button.disabled=busy;removeBtn.disabled=busy;
   for(const btn of cloud.querySelectorAll('[data-wt-download-pack]'))btn.disabled=busy;
  }
  async function pollDownload(module,targetId){
   clearTimeout(dlTimer);
   try{
    const info=await module.themePackDownloadStatus();
    if(!root.isConnected)return;
    if(['checking','downloading','verifying'].includes(info.state)){
     progressBox.hidden=false;
     const pct=info.progress>=0?info.progress:0;
     const mb=n=>(n/1048576).toFixed(1);
     const detail=info.state==='downloading'&&info.totalBytes>0?pct+'% · '+mb(info.downloadedBytes)+' / '+mb(info.totalBytes)+' MB':'';
     dlText.textContent=(globalThis.__wtTranslate?.(info.message)||info.message)+(detail?' ('+detail+')':'');
     dlFill.style.width=(info.state==='verifying'?100:pct)+'%';
     dlTimer=setTimeout(()=>pollDownload(module,targetId),600);
     return;
    }
    progressBox.hidden=true;setDownloadBusy(false);
    if(info.state==='done'){
     await refreshPacks(true);broadcastPacks();set(info.id||targetId);
     status.textContent='已导入'+themes[info.id||targetId][0]+'主题包。';
    }else if(info.state==='error'){
     status.textContent=info.error||info.message||'主题包下载失败。';
    }
   }catch{
    progressBox.hidden=true;setDownloadBusy(false);
    status.textContent='主题包下载失败，请检查网络或手动导入。';
   }
  }
  button.addEventListener('click',async()=>{
   setDownloadBusy(true);
   try{
    const module=await import(moduleUrl),result=await module.importThemePack();
    if(result.cancelled)return;
    if(!result.id)throw Error(result.error||'主题包导入失败。');
    await refreshPacks(true);broadcastPacks();
    set(result.id);status.textContent='已导入'+themes[result.id][0]+'主题包。';
   }catch(error){status.textContent=error.message||'主题包导入失败。'}
   finally{setDownloadBusy(false)}
  });
  removeBtn.addEventListener('click',async()=>{
   const target=current;
   if(target==='default'||!packs[target])return;
   const tr=globalThis.__wtTranslate||(v=>v);
   if(!window.confirm(tr('确定卸载当前主题包并切回原版暖色吗？')))return;
   setDownloadBusy(true);
   try{
    const module=await import(moduleUrl),res=await module.removeThemePack(target);
    if(!res?.removed)throw Error('无法卸载主题包，请重试。');
    set('default');await refreshPacks(true);broadcastPacks();
    status.textContent='已卸载'+themes[target][0]+'主题包。';
   }catch(error){status.textContent=error.message||'主题包卸载失败。'}
   finally{setDownloadBusy(false)}
  });
  cloud.addEventListener('click',async event=>{
   const btn=event.target.closest('[data-wt-download-pack]');
   if(!btn||btn.disabled)return;
   const targetId=btn.dataset.wtDownloadPack;
   setDownloadBusy(true);progressBox.hidden=false;dlFill.style.width='0%';dlText.textContent='正在查询主题包…';
   try{
    const module=await import(moduleUrl);
    if(typeof module.downloadThemePack!=='function')throw Error('请运行新版完整 Helper 以在线下载主题包。');
    const started=await module.downloadThemePack(targetId);
    if(!started?.accepted)throw Error(started?.error||'无法启动主题包下载。');
    pollDownload(module,targetId);
   }catch(error){progressBox.hidden=true;setDownloadBusy(false);status.textContent=error.message||'主题包下载失败。'}
  });
  root.append(field,cloud,progressBox);
 }
 function mount(root){
  if(!root||root.firstChild)return;
  if(!document.getElementById('wt-theme-picker-css')){
   const style=document.createElement('style');style.id='wt-theme-picker-css';style.setAttribute(mark,'picker');style.textContent=pickerCss;document.head.append(style);
  }
  mountImport(root);
  for(const id of Object.keys(themes)){
   const option=document.createElement('button');
   option.type='button';option.className='wt-theme-option';option.dataset.wtThemeOption=id;
   option.innerHTML='<span class="wt-theme-swatch" aria-hidden="true"><i></i><i></i><i></i></span><span class="wt-theme-text"><b></b><small></small></span>';
   option.querySelector('b').textContent=themes[id][0];
   option.querySelector('small').textContent=themes[id][1];
   option.addEventListener('click',()=>set(id));
   root.append(option);
  }
  const note=document.createElement('p');note.className='wt-theme-note';note.hidden=true;root.append(note);
  mountBackground(root);
  const effects=document.createElement('section');effects.className='wt-denia-settings';effects.hidden=true;root.append(effects);
  pickers.push(root);sync();syncBackground();
 }
 function render(h,renderPhrolova){
  const children=[
   h('summary',null,'外观主题'),
   h('div',{id:'wt-theme-settings',class:'wt-theme-picker',role:'group','aria-label':'外观主题',onVnodeMounted:vnode=>{try{mount(vnode.el)}catch{}}})
  ];
  const settings=renderPhrolova?.();
  if(settings)children.push(h('details',{class:'wt-phrolova-settings wt-theme-effect wt-ui-optional'},[h('summary',null,'i弗TV'),settings]));
  const node=h('details',{class:'wt-aemeath-options'},children,512);
  node.patchFlag=-2;return node;
 }
 // This module is evaluated with the shared chunk in every window. A theme
 // failure must never stop the application from starting.
 if(typeof document!=='undefined')try{
  __wtPanelLayout.extend('interaction','互动与表情','按键自动表情与外观主题',render);
  window.addEventListener('storage',event=>{
   if(event.key===key||event.key===null)apply(read());
   if(event.key===packsKey||event.key===null)refreshPacks(true).catch(()=>{});
   if(Object.values(backgroundKeys).includes(event.key)||event.key===null)syncBackground();
   if(event.key===denia?.key||event.key===denia?.dialogueKey||event.key===null)syncDenia();
  });
  window.addEventListener('load',loaded);
  if(typeof listen==='function')Promise.resolve().then(()=>listen(updated,event=>apply(event.payload?.theme))).catch(()=>{});
  if(typeof listen==='function')Promise.resolve().then(()=>listen(backgroundUpdated,syncBackground)).catch(()=>{});
  if(typeof listen==='function')Promise.resolve().then(()=>listen(deniaUpdated,syncDenia)).catch(()=>{});
  if(typeof listen==='function')Promise.resolve().then(()=>listen(packsUpdated,()=>refreshPacks(true).catch(()=>{}))).catch(()=>{});
  refreshPacks().catch(()=>{});
 }catch{}
 return {key,themes,read,set,apply,mount,render,remap,createDenia,onMech,onPhrolova,bindPhrolova,get phrolovaEnabled(){return phrolovaAvailable},get current(){return current}};
})();
export {__wtTheme,__wtRegions};
