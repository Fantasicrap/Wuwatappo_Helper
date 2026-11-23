const __wtNotice=(()=>{
 const key='wuwatappo-helper-notice-request-v1',acceptedKey='wuwatappo-helper-notice-accepted-v1',resultEvent='wt-helper-notice-result',probeEvent='wt-helper-notice-probe',readyEvent='wt-helper-notice-ready';
 const [chinese,english]=__WT_DISCLAIMER_TEXT__.split(/\r?\n--- EN ---\r?\n/);
 const languages=[['zh','简体中文'],['en','English']];
 const validLanguage=value=>languages.some(([locale])=>value===locale);
 const copy={
  zh:{language:'选择界面语言',hint:'以后可在「设置 → 程序与更新 → 显示语言」更改。',next:'继续',start:'启动',disclaimer:'免责说明',exit:'退出',close:'关闭',consent:'我已阅读上述内容，后续不再提示',agree:'同意并启动'},
  en:{language:'Choose your language',hint:'Change it anytime in Settings → Application and updates → Language.',next:'Continue',start:'Start',disclaimer:'Disclaimer',exit:'Exit',close:'Close',consent:'I have read this notice. Do not show it again.',agree:'Agree and start'}
 };
 const currentLanguage=()=>(globalThis.__wtLaunchLanguage?.current()??document.documentElement.lang)==='en'?'en':'zh';
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
 async function open(required=false,chooseLanguage=false,disclaimer=required){
  const id=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);let stop;
  const answer=required?new Promise(resolve=>{stop=resolve}):null;let unlisten;
  try{
   if(required)unlisten=await listen(resultEvent,e=>{if(e.payload?.id===id)stop(e.payload)});
   await ready(id);localStorage.setItem(key,JSON.stringify({id,required,chooseLanguage,disclaimer}));await invoke('open_about_window');
   return required?await answer:true;
  }finally{unlisten?.()}
 }
 async function confirm(){
  const localeApi=globalThis.__wtLaunchLanguage;
  try{
   const saved=await localeApi?.restore();
   if(saved&&localeApi.current()!==saved)await localeApi.apply(saved);
   const chooseLanguage=!!localeApi&&!saved,disclaimer=localStorage.getItem(acceptedKey)!=='1';
   if(!chooseLanguage&&!disclaimer)return true;
   const result=await open(true,chooseLanguage,disclaimer);
   if(result?.accepted!==true||chooseLanguage&&!validLanguage(result.language))return false;
   if(chooseLanguage)await localeApi.select(result.language);
   if(disclaimer)try{localStorage.setItem(acceptedKey,'1')}catch(error){console.warn('[helper-notice] 无法保存阅读状态',error)}
   return true;
  }
  catch(error){console.warn('[helper-notice]',error);return false}
 }
 async function original(){clear();return invoke('open_about_window')}
 function about(appWindow,close){
  const model={active:ref(false),required:ref(false),disclaimer:ref(false),checked:ref(false),busy:ref(false),choosing:ref(false),language:ref(null)};
  let current=null,disposed=false,closing=false;const stops=[];
  function title(){if(current){const text=copy[model.language.value||currentLanguage()];appWindow.setTitle(model.choosing.value?text.language:text.disclaimer).catch(console.warn)}}
  function update(){
   const next=request();if(current?.id===next?.id)return;
   current=next;model.active.value=!!current;model.required.value=!!current?.required;
   model.disclaimer.value=current?.disclaimer??!!current?.required;
   model.choosing.value=!!current?.chooseLanguage;model.language.value=null;
   model.checked.value=false;model.busy.value=false;title();
  }
  function choose(language){if(model.choosing.value&&validLanguage(language)){model.language.value=language;title()}}
  function next(){
   if(!model.language.value)return;
   if(model.disclaimer.value){model.choosing.value=false;title()}
   else return finish(true);
  }
  async function finish(accepted){if(!current||model.busy.value||accepted&&(model.disclaimer.value&&!model.checked.value||current.chooseLanguage&&!model.language.value))return;model.busy.value=true;
   try{if(current.required)await emit(resultEvent,{id:current.id,accepted,language:model.language.value});clear(current.id);closing=true;await close();model.active.value=false;current=null}
   catch(error){console.warn('[helper-notice]',error);model.busy.value=false}finally{closing=false}
  }
  async function own(promise){const stop=await promise;if(disposed)stop();else stops.push(stop)}
  const changed=e=>{if(e.key===key)update()};window.addEventListener('storage',changed);
  onMounted(()=>{own(listen(probeEvent,e=>{if(typeof e.payload?.id==='string')emit(readyEvent,{id:e.payload.id}).catch(console.warn)})).catch(console.warn);own(listen('about-open',update)).catch(console.warn);own(appWindow.onCloseRequested(e=>{if(current&&!closing){e.preventDefault();finish(false)}})).catch(console.warn);update()});
  onUnmounted(()=>{disposed=true;window.removeEventListener('storage',changed);for(const stop of stops)stop()});
  model.finish=finish;model.choose=choose;model.next=next;model.drag=e=>{if(e.button===0&&!e.target?.closest('button,a'))appWindow.startDragging().catch(console.warn)};update();return model;
 }
 function render(model){
  const language=model.language.value||currentLanguage(),text=copy[language],choosing=model.choosing.value;
  const blocked=model.busy.value||(choosing?!model.language.value:model.disclaimer.value&&!model.checked.value);
  const h=(tag,props,children)=>createVNode(tag,{...props,'data-v-160f56ac':''},children);
  const link=url=>h('a',{href:url,target:'_blank',rel:'noopener noreferrer',onClick:e=>{e.preventDefault();openUrl(url).catch(console.warn)}},url);
  const paragraphs=()=>((language==='en'&&english)||chinese).trim().split(/\r?\n\r?\n/).map(part=>{const children=[];let at=0;for(const match of part.matchAll(/https:\/\/[^\s]+/g)){children.push(part.slice(at,match.index),link(match[0]));at=match.index+match[0].length}children.push(part.slice(at));return h('p',{style:{whiteSpace:'pre-line'}},children)});
  const picker=()=>h('section',{style:{maxWidth:'420px',margin:'clamp(12px,8vh,70px) auto 0'}},[
   h('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,135px),1fr))',gap:'12px'}},languages.map(([locale,name])=>{
    const selected=model.language.value===locale;
    return h('button',{key:locale,class:'about-confirm',type:'button',lang:locale,'aria-pressed':selected,onClick:()=>model.choose(locale),style:{minWidth:0,padding:'10px 14px',borderRadius:'14px',background:selected?'#f9d9a3':null}},name);
   })),
   h('p',{style:{fontSize:'16px',lineHeight:1.55,margin:'20px 0 0'}},text.hint)
  ]);
  return h('main',{key:'helper-disclaimer',class:'about-root locale-'+language,lang:language,'data-wt-localized':''},[
   h('header',{class:'about-header',onMousedown:model.drag},[h('h1',{class:'about-title',style:{paddingInline:'72px',textAlign:'center',fontSize:'clamp(24px,5vw,36px)'}},choosing?text.language:text.disclaimer),h('button',{type:'button',class:'about-close','aria-label':model.required.value?text.exit:text.close,onClick:()=>model.finish(false)})]),
   h('article',{class:'about-page common-scrollbar2',style:{boxSizing:'border-box',width:'100%',overflowWrap:'anywhere'}},[choosing?picker():h('section',{class:'about-section'},paragraphs())]),
   h('footer',{class:'about-actions',style:{flexWrap:'wrap'}},[
    !choosing&&model.disclaimer.value?h('label',{class:'about-startup-option'},[h('input',{type:'checkbox',checked:model.checked.value,onChange:e=>{model.checked.value=e.target.checked}}),h('span',null,text.consent)]):h('span',{'aria-hidden':'true'}),
    h('button',{type:'button',class:'about-confirm',disabled:blocked,style:blocked?{opacity:.5,cursor:'default'}:null,onClick:()=>choosing?model.next():model.finish(true)},choosing?(model.disclaimer.value?text.next:text.start):model.required.value?text.agree:text.close)])]);
 }
 return{open,confirm,original,about,render};
})();
export {__wtNotice};
