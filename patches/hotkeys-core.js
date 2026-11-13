const __wtHotkeys=(()=>{
 const key="wuwatappo-hotkeys-v1";
 const actions=[{id:"game",label:"游戏模式",defaultKey:"F7"},{id:"monitor",label:"切换屏幕",defaultKey:"F8"},{id:"visibility",label:"显示／隐藏桌宠",defaultKey:"F9"},{id:"reload",label:"刷新界面",defaultKey:"F5"},{id:"record",label:"录制开始／结束",defaultKey:"Ctrl+Alt+F10"}];
 for(let slot=1;slot<=6;slot++)actions.push({id:"emote"+slot,label:"发送表情 · 槽位 "+slot,defaultKey:"Ctrl+Alt+"+slot});
 actions.splice(3,0,{id:"roomOnlySelf",label:"联机仅显示自己",defaultKey:""});
 const defaults=()=>Object.fromEntries(actions.map(a=>[a.id,a.defaultKey]));
 const pressed=new Map();let localCapture=false;const owner="hk-"+Math.random().toString(36).slice(2);
 function normalizeKey(raw){
  let s=String(raw??"");if(s===" ")return"Space";s=s.toLowerCase();
  if(/^(control|ctrl)(left|right|_l|_r)?$/.test(s))return"Ctrl";
  if(/^shift(left|right|_l|_r)?$/.test(s))return"Shift";
  if(/^(alt|altgr)(left|right|_l|_r)?$/.test(s))return"Alt";
  if(/^(meta|win|super|os)(left|right|_l|_r)?$/.test(s))return"Meta";
  if(/^f([1-9]|1\d|2[0-4])$/.test(s))return s.toUpperCase();
  if(/^(key)?[a-z]$/.test(s))return s.at(-1).toUpperCase();
  if(/^(digit|num)?\d$/.test(s))return s.at(-1);
  const aliases={printscreen:"PrintScreen",prtscr:"PrintScreen",prtsc:"PrintScreen",snapshot:"PrintScreen",space:"Space",spacebar:"Space",return:"Enter",enter:"Enter",escape:"Escape",esc:"Escape",tab:"Tab",backspace:"Backspace",delete:"Delete",del:"Delete",insert:"Insert",home:"Home",end:"End",pageup:"PageUp",pagedown:"PageDown",up:"ArrowUp",down:"ArrowDown",left:"ArrowLeft",right:"ArrowRight",arrowup:"ArrowUp",arrowdown:"ArrowDown",arrowleft:"ArrowLeft",arrowright:"ArrowRight",minus:"Minus",equal:"Equal",bracketleft:"BracketLeft",leftbracket:"BracketLeft",bracketright:"BracketRight",rightbracket:"BracketRight",semicolon:"Semicolon",quote:"Quote",backslash:"Backslash",comma:"Comma",period:"Period",dot:"Period",slash:"Slash",backquote:"Backquote",capslock:"CapsLock"};
  return aliases[s]||"";
 }
 function canonical(value){
  if(!value)return"";const parts=String(value).split("+").map(normalizeKey);
  if(parts.some(p=>!p||p==="Meta"))return null;
  const base=parts.filter(p=>!["Ctrl","Alt","Shift"].includes(p));if(base.length!==1)return null;
  return [...["Ctrl","Alt","Shift"].filter(p=>parts.includes(p)),base[0]].join("+");
 }
 const displayAliases={contextmenu:"ContextMenu",apps:"ContextMenu",pause:"Pause",numlock:"NumLock",scrolllock:"ScrollLock",multiply:"NumpadMultiply",add:"NumpadAdd",subtract:"NumpadSubtract",decimal:"NumpadDecimal",divide:"NumpadDivide",oem102:"IntlBackslash"};
 function displayKey(raw){
  const text=String(raw??""),id=text.toLowerCase();
  const side=id.match(/^(?:left|right)(shift|ctrl|control|alt|meta|win)$/);
  const keypad=id.match(/^(?:numpad|kp)(\d|add|subtract|multiply|divide|decimal|enter|equal|separator)$/);
  if(keypad)return "Numpad"+keypad[1][0].toUpperCase()+keypad[1].slice(1);
  return normalizeKey(side?.[1]??text)||displayAliases[id]||(/^(IntlBackslash|IntlRo|IntlYen|Convert|NonConvert|KanaMode|Lang[1-5]|Launch[A-Za-z]+|Media[A-Za-z]+|AudioVolume[A-Za-z]+|Browser[A-Za-z]+)$/.test(text)?text:"");
 }
 function validate(config){
  const errors=[],warnings=[],used=new Map();
  for(const action of actions){const value=canonical(config[action.id]);
   if(value===null){errors.push(action.label+"：按键格式无效");continue;}
   if(!value)continue;
   if(value.split("+").includes("PrintScreen")){errors.push("PrtScr 截图键已保留，请为程序功能选择其他按键");continue;}
   if(used.has(value))errors.push(action.label+" 与 "+used.get(value)+" 冲突："+value);else used.set(value,action.label);
   if(["Ctrl+Alt+Delete","Ctrl+Shift+Escape"].includes(value))errors.push(action.label+"：该组合由系统保留");
   else if(["Alt+F4","Alt+Tab","Ctrl+L","Ctrl+W","Ctrl+T","Ctrl+N","Ctrl+R","Ctrl+Tab"].includes(value))warnings.push(value+" 可能被系统、浏览器或其他软件占用");
  }
  return{errors,warnings};
 }
 function read(){try{const saved=JSON.parse(localStorage.getItem(key)||"null");const result={...defaults(),...saved};if(saved)for(const action of actions)if(!Object.hasOwn(saved,action.id)&&actions.some(a=>Object.hasOwn(saved,a.id)&&canonical(result[a.id])===result[action.id]))result[action.id]="";return validate(result).errors.length?defaults():result}catch{return defaults()}}
 function actionFor(chord){const config=read();return actions.find(a=>config[a.id]&&canonical(config[a.id])===chord)?.id||null}
 function fromEvent(event){
  if(event.metaKey||event.repeat)return null;
  const base=normalizeKey(event.code||event.key);if(!base||base==="PrintScreen"||["Ctrl","Alt","Shift","Meta"].includes(base))return null;
  return actionFor([...[event.ctrlKey?"Ctrl":"",event.altKey?"Alt":"",event.shiftKey?"Shift":""].filter(Boolean),base].join("+"));
 }
 function nativeDown(raw){
  const token=String(raw??"").toLowerCase(),base=normalizeKey(raw);if(!base||base==="PrintScreen"||pressed.has(token))return null;
  pressed.set(token,base);if(["Ctrl","Alt","Shift","Meta"].includes(base))return null;
  const held=[...pressed.values()];if(held.includes("Meta"))return null;
  return actionFor([...["Ctrl","Alt","Shift"].filter(m=>held.includes(m)),base].join("+"));
 }
 function nativeUp(raw){pressed.delete(String(raw??"").toLowerCase())}
 function forward(action){return emit("wt-hotkey-action",{action})}
 function capture(enabled){localCapture=enabled;return emit("wt-hotkey-capture",{owner,enabled}).catch(()=>{})}
 function editable(target){return!!target&&(typeof HTMLInputElement!=="undefined"&&target instanceof HTMLInputElement||typeof HTMLTextAreaElement!=="undefined"&&target instanceof HTMLTextAreaElement||typeof HTMLSelectElement!=="undefined"&&target instanceof HTMLSelectElement||target.isContentEditable)}
 function dom(event){if(localCapture||editable(event.target))return;const action=fromEvent(event);if(action){event.preventDefault();forward(action).catch(error=>console.warn("[hotkeys] forward failed",error))}}
 function save(config){const result=validate(config);if(result.errors.length)return result;const clean=Object.fromEntries(actions.map(a=>[a.id,canonical(config[a.id])||""]));localStorage.setItem(key,JSON.stringify(clean));emit("wt-hotkeys-updated",{}).catch(()=>{});if(typeof syncNativeMenuLocale==="function")syncNativeMenuLocale().catch(()=>{});return result}
 function createSettings(ref,toast){
  const model={draft:ref(read()),recording:ref(""),message:ref(""),error:ref(false)};
  function status(){const result=validate(model.draft.value);model.error.value=!!result.errors.length;model.message.value=[...result.errors,...result.warnings].join("；");return result}
  model.start=id=>{model.recording.value=id;capture(true)};
  model.finish=()=>{model.recording.value="";capture(false)};
  model.record=(id,event)=>{if(model.recording.value!==id)return;const base=normalizeKey(event.code||event.key);if(base==="PrintScreen"){model.recording.value="";model.error.value=false;model.message.value="PrtScr 已放行用于截图，快捷键未改变";return}event.preventDefault();event.stopPropagation();if(event.key==="Escape"){event.target?.blur();return}if(["Ctrl","Alt","Shift","Meta"].includes(base))return;if(event.metaKey||!base){model.error.value=true;model.message.value="暂不支持此按键，请使用 Ctrl、Alt、Shift 与普通按键组合";return}const value=[...[event.ctrlKey?"Ctrl":"",event.altKey?"Alt":"",event.shiftKey?"Shift":""].filter(Boolean),base].join("+");model.draft.value={...model.draft.value,[id]:value};model.recording.value="";status()};
  model.clear=id=>{model.draft.value={...model.draft.value,[id]:""};status()};
  model.save=()=>{model.finish();try{const result=save(model.draft.value);model.error.value=!!result.errors.length;model.message.value=result.errors.length?result.errors.join("；"):"已保存"+(result.warnings.length?"；"+result.warnings.join("；"):"");if(!result.errors.length)toast("快捷键已保存")}catch(error){model.error.value=true;model.message.value="快捷键保存失败"}};
  model.reset=()=>{model.draft.value=defaults();model.message.value="已恢复默认，请点击保存";model.error.value=false};
  return model;
 }
 function render(h,model){
  const button={height:"28px",lineHeight:"normal",display:"inline-flex",alignItems:"center",justifyContent:"center",padding:"0 8px",border:"1px solid var(--wt-ui-border,#E7B77C)",borderRadius:"8px",background:"var(--wt-ui-field,#fff5e2)",color:"var(--wt-ui-text,#784b33)",cursor:"pointer",fontSize:"13px",whiteSpace:"nowrap"};
  const row=action=>h("div",{key:action.id,class:"wt-ui-key-row"},[
   h("span",{style:{fontSize:"13px",color:"var(--wt-ui-text,#784b33)"}},action.label),
   h("input",{"aria-label":action.label,readonly:true,value:model.recording.value===action.id?"请按新快捷键":model.draft.value[action.id]||"未设置",style:{width:"140px",minWidth:"0",height:"30px",boxSizing:"border-box",border:"1px solid var(--wt-ui-border,#E7B77C)",borderRadius:"8px",background:"var(--wt-ui-field,#fffaf1)",padding:"0 7px",fontSize:"13px",color:"var(--wt-ui-text,#784b33)"},onFocus:()=>model.start(action.id),onClick:()=>model.start(action.id),onBlur:model.finish,onKeydown:event=>model.record(action.id,event)},null,8,["value"]),
   h("button",{type:"button",style:button,onClick:()=>model.clear(action.id)},"清除")
  ]);
  const slots=actions.filter(action=>action.id.startsWith('emote'));
  return h("div",{class:"wt-hotkey-settings",style:{margin:"18px 0",padding:"12px 0",borderTop:"1px solid var(--wt-ui-divider,#EFD4B7)",borderBottom:"1px solid var(--wt-ui-divider,#EFD4B7)"}},[
   h("div",{style:{fontSize:"18px",fontWeight:"600",color:"var(--wt-ui-text,#8e5e43)",marginBottom:"8px"}},"快捷键设置"),
   h("div",{style:{fontSize:"12px",lineHeight:"1.5",color:"var(--wt-ui-muted,#8e7b6a)"}},"点击输入框录制，支持 Ctrl / Alt / Shift 组合；Esc 取消。清除后可禁用对应快捷键。"),
   ...actions.filter(action=>!action.id.startsWith('emote')).map(row),
   h('details',{class:'wt-ui-optional'},[h('summary',null,'表情快捷键（6 个槽位）'),...slots.map(row)]),
   h("div",{style:{display:"flex",gap:"8px",marginTop:"10px"}},[h("button",{type:"button",style:button,onClick:model.save},"保存快捷键"),h("button",{type:"button",style:button,onClick:model.reset},"恢复默认")]),
   h("div",{role:"status",style:{fontSize:"12px",lineHeight:"1.5",marginTop:"8px",color:model.error.value?"#b33a25":"var(--wt-ui-muted,#8e7b6a)"}},model.message.value,5),
   h("div",{style:{fontSize:"12px",lineHeight:"1.5",color:"var(--wt-ui-muted,#8e7b6a)",marginTop:"6px"}},"表情槽位按菜单顺序对应当前装备；无需展开菜单。冲突检测覆盖本程序，其他软件占用无法完全检测。")
  ]);
 }
 if(typeof window!=="undefined"){
  window.addEventListener("keydown",dom,true);
  window.addEventListener("focusin",event=>{if(editable(event.target))capture(true)},true);
  window.addEventListener("focusout",event=>{if(editable(event.target))capture(false)},true);
 }
 return{actions,defaults,normalizeKey,displayKey,canonical,validate,read,save,fromEvent,nativeDown,nativeUp,forward,capture,editable,createSettings,render};
})();
export{__wtHotkeys};
