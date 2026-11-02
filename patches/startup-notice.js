const __wtNotice=(()=>{
 const key='wuwatappo-helper-notice-request-v1',acceptedKey='wuwatappo-helper-notice-accepted-v1',resultEvent='wt-helper-notice-result',probeEvent='wt-helper-notice-probe',readyEvent='wt-helper-notice-ready';
 const text=__WT_DISCLAIMER_TEXT__;
 function request(){try{const p=JSON.parse(localStorage.getItem(key)||'null');return p&&typeof p.id==='string'&&typeof p.required==='boolean'?p:null}catch{return null}}
 function clear(id){if(!id||request()?.id===id)localStorage.removeItem(key)}
 // The native app precreates its auxiliary WebViews during startup. Opening
 // About before its WebView is mounted can deadlock the native window builder.
 // A per-request handshake also works when About mounted before the main view.
 async function ready(id){
  let received=false;const stop=await listen(readyEvent,e=>{if(e.payload?.id===id)received=true});
  try{for(let attempt=0;attempt<150&&!received;attempt++){await emit(probeEvent,{id});if(!received)await new Promise(resolve=>setTimeout(resolve,100))}if(!received)throw Error('免责说明窗口初始化超时，请退出后重试')}
  finally{stop()}
 }
 async function open(required=false){
  const id=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);let stop;
  const answer=required?new Promise(resolve=>{stop=resolve}):null;let unlisten;
  try{
   if(required)unlisten=await listen(resultEvent,e=>{if(e.payload?.id===id)stop(e.payload.accepted===true)});
   await ready(id);localStorage.setItem(key,JSON.stringify({id,required}));await invoke('open_about_window');
   return required?await answer:true;
  }finally{unlisten?.()}
 }
 async function confirm(){
  try{if(localStorage.getItem(acceptedKey)==='1')return true}catch{}
  try{const accepted=await open(true);if(accepted)try{localStorage.setItem(acceptedKey,'1')}catch(error){console.warn('[helper-notice] 无法保存阅读状态',error)}return accepted}
  catch(error){console.warn('[helper-notice]',error);return false}
 }
 async function original(){clear();return invoke('open_about_window')}
 function about(appWindow,close){
  const model={active:ref(!!request()),required:ref(false),checked:ref(false),busy:ref(false)};
  let current=null,disposed=false,closing=false;const stops=[];
  function update(){current=request();model.active.value=!!current;model.required.value=!!current?.required;model.checked.value=false;model.busy.value=false;if(current)appWindow.setTitle('免责说明').catch(console.warn)}
  async function finish(accepted){if(!current||model.busy.value||accepted&&model.required.value&&!model.checked.value)return;model.busy.value=true;
   try{if(current.required)await emit(resultEvent,{id:current.id,accepted});clear(current.id);closing=true;await close();model.active.value=false;current=null}
   catch(error){console.warn('[helper-notice]',error);model.busy.value=false}finally{closing=false}
  }
  async function own(promise){const stop=await promise;if(disposed)stop();else stops.push(stop)}
  const changed=e=>{if(e.key===key)update()};window.addEventListener('storage',changed);
  onMounted(()=>{own(listen(probeEvent,e=>{if(typeof e.payload?.id==='string')emit(readyEvent,{id:e.payload.id}).catch(console.warn)})).catch(console.warn);own(listen('about-open',update)).catch(console.warn);own(appWindow.onCloseRequested(e=>{if(current&&!closing){e.preventDefault();finish(false)}})).catch(console.warn);update()});
  onUnmounted(()=>{disposed=true;window.removeEventListener('storage',changed);for(const stop of stops)stop()});
  model.finish=finish;model.drag=e=>{if(e.button===0&&!e.target?.closest('button,a'))appWindow.startDragging().catch(console.warn)};update();return model;
 }
 function render(model){
  const blocked=model.busy.value||model.required.value&&!model.checked.value;
  const h=(tag,props,children)=>createVNode(tag,{...props,'data-v-160f56ac':''},children);
  const link=url=>h('a',{href:url,target:'_blank',rel:'noopener noreferrer',onClick:e=>{e.preventDefault();openUrl(url).catch(console.warn)}},url);
  const paragraphs=text.trim().split(/\r?\n\r?\n/).map(part=>{const children=[];let at=0;for(const match of part.matchAll(/https:\/\/[^\s]+/g)){children.push(part.slice(at,match.index),link(match[0]));at=match.index+match[0].length}children.push(part.slice(at));return h('p',{style:{whiteSpace:'pre-line'}},children)});
  return h('main',{key:'helper-disclaimer',class:'about-root locale-zh'},[
   h('header',{class:'about-header',onMousedown:model.drag},[h('h1',{class:'about-title'},'免责说明'),h('button',{type:'button',class:'about-close','aria-label':model.required.value?'退出':'关闭',onClick:()=>model.finish(false)})]),
   h('article',{class:'about-page common-scrollbar2',style:{boxSizing:'border-box',width:'100%',overflowWrap:'anywhere'}},[h('section',{class:'about-section'},paragraphs)]),
   h('footer',{class:'about-actions',style:{flexWrap:'wrap'}},[
    model.required.value?h('label',{class:'about-startup-option'},[h('input',{type:'checkbox',checked:model.checked.value,onChange:e=>{model.checked.value=e.target.checked}}),h('span',null,'我已阅读上述内容，后续不再提示')]):h('span',{'aria-hidden':'true'}),
    h('button',{type:'button',class:'about-confirm',disabled:blocked,style:blocked?{opacity:.5,cursor:'default'}:null,onClick:()=>model.finish(true)},model.required.value?'同意并启动':'关闭')])]);
 }
 return{open,confirm,original,about,render};
})();
export {__wtNotice};
