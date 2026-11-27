const updateEndpoint='http://127.0.0.1:48642/update/';

async function updateRequest(path,post=false){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),4500);
 try{
  const response=await fetch(updateEndpoint+path,{method:post?'POST':'GET',headers:post?{'X-Wuwa-Update':'1'}:undefined,signal:controller.signal,cache:'no-store'});
  if(!response.ok)throw new Error('更新服务不可用');
  return await response.json();
 }finally{clearTimeout(timer)}
}

async function installHelperUpdate(quit){
 const result=await updateRequest('install',true);
 if(!result.accepted)return;
 const cancel=()=>updateRequest('cancel',true).catch(()=>{});
 // Normally the WebView closes with the pet. If exit fails, restore the button.
 const guard=setTimeout(cancel,20000);
 try{await quit()}
 catch(error){clearTimeout(guard);await cancel();throw error}
}

function formatUpdateProgress(status){
 if(status?.state!=='downloading'||!(status.totalBytes>0))return null;
 const pct=Math.max(0,Math.min(100,status.progress>=0?status.progress:Math.floor(status.downloadedBytes*100/status.totalBytes)));
 const mb=n=>(n/1048576).toFixed(1);
 return {pct,label:pct+'% · '+mb(status.downloadedBytes)+' / '+mb(status.totalBytes)+' MB'};
}

function mountDownloadSource(root,change){
 if(!root)return;
 const doc=root.ownerDocument;
 root.replaceChildren();
 root.className='';
 const sourceRow=doc.createElement('div');
 sourceRow.className='setting-item';sourceRow.style.gap='8px';sourceRow.style.flexWrap='wrap';
 const label=doc.createElement('div'),hint=doc.createElement('div'),select=doc.createElement('select');
 label.className='setting-label';
 const title=doc.createElement('div');title.className='setting-title';title.textContent='更新下载源';
 hint.className='setting-sub';hint.textContent='仅用于下载更新文件';hint.id='wt-us-hint';hint.setAttribute('aria-live','polite');
 select.setAttribute('aria-label','更新下载源');select.setAttribute('aria-describedby',hint.id);
 Object.assign(select.style,{font:'inherit',color:'var(--wt-ui-text,#784b35)',background:'var(--wt-ui-field,#fff7e8)',border:'1px solid var(--wt-ui-border,#d9b58c)',borderRadius:'9px',padding:'5px 8px',maxWidth:'100%'});
 for(const [value,text] of [['github','GitHub（默认）'],['gh-proxy','GH-Proxy（尝试）']]){
  const option=doc.createElement('option');option.value=value;option.textContent=text;select.append(option);
 }
 select.disabled=true;select.addEventListener('change',()=>change(select.value));
 label.append(title,hint);sourceRow.append(label,select);

 const progressBox=doc.createElement('div');
 progressBox.className='setting-item wt-update-progress';progressBox.hidden=true;
 progressBox.style.cssText='display:grid;gap:6px;width:100%;box-sizing:border-box';
 progressBox.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:12px;color:var(--wt-ui-text,#694832)"><span data-wt-up-msg style="min-width:0;overflow-wrap:anywhere"></span><strong data-wt-up-pct style="font-variant-numeric:tabular-nums;white-space:nowrap;flex:none"></strong></div><div style="height:7px;border-radius:99px;background:var(--wt-ui-divider,#ead7bf);overflow:hidden"><i data-wt-up-fill style="display:block;height:100%;width:0;border-radius:99px;background:var(--wt-ui-accent,#c98d55);transition:width .25s ease"></i></div>';
 const upMsg=progressBox.querySelector('[data-wt-up-msg]'),upPct=progressBox.querySelector('[data-wt-up-pct]'),upFill=progressBox.querySelector('[data-wt-up-fill]');

 const backupHost=doc.createElement('div');
 root.append(sourceRow,progressBox,backupHost);
 const disposeBackup=typeof mountSettingsBackup==='function'?mountSettingsBackup(backupHost):null;

 return {
  select,hint,
  progress(status){
   const info=formatUpdateProgress(status);
   progressBox.hidden=!info;
   if(!info)return;
   upMsg.textContent=globalThis.__wtTranslate?.(status.message)||status.message||'正在下载更新…';
   upPct.textContent=info.label;
   upFill.style.width=info.pct+'%';
  },
  remove(){disposeBackup?.();root.replaceChildren()}
 };
}

export function mountHelperUpdate(publish,quit){
 let stopped=false,timer,revision=0,saving=false,saveFailed=false;
 const sourceUi=mountDownloadSource(window.document?.getElementById('wt-us'),setSource);
 const failed=()=>({state:'error',message:'检查更新失败。请确认正在运行完整 Helper，也可以前往 GitHub 下载。'});
 const active=status=>['checking','downloading','applying'].includes(status.state);
 async function refresh(){
  clearTimeout(timer);
  const current=++revision;
  let status;
  try{status=await updateRequest('status')}catch{status=failed()}
  if(stopped||current!==revision)return;
  const prog=formatUpdateProgress(status);
  publish(prog?{...status,message:(globalThis.__wtTranslate?.(status.message)||status.message)+' ('+prog.label+')'}:status);
  if(sourceUi){
   const {select,hint}=sourceUi;
   if(!saving)select.value=status.downloadSource==='gh-proxy'?'gh-proxy':'github';
   select.disabled=!status.downloadSource||saving||active(status);
   hint.textContent=saveFailed?'未能保存，请重试':select.value==='gh-proxy'?'加速失败时改用 GitHub':'仅用于下载更新文件';
   sourceUi.progress(status);
  }
  if(active(status))timer=setTimeout(refresh,status.state==='downloading'&&status.totalBytes>0?500:1200);
 }
 async function setSource(source){
  if(stopped||saving||!['github','gh-proxy'].includes(source))return;
  saving=true;saveFailed=false;if(sourceUi)sourceUi.select.disabled=true;
  try{saveFailed=!(await updateRequest('source/'+source,true)).accepted}catch{saveFailed=true}
  finally{saving=false;if(!stopped)await refresh()}
 }
 refresh();
 return {
  async click(status){
   if(saving)return;
   try{
    if(status.state==='ready')await installHelperUpdate(quit);
    else await updateRequest('check',true);
    await refresh();
   }catch{if(!stopped)publish(failed())}
  },
  async open(){
   try{if((await updateRequest('release',true)).accepted)return}catch{}
   window.open('https://github.com/Fantasicrap/Wuwatappo_Helper/releases','_blank','noopener,noreferrer');
  },
  stop(){stopped=true;clearTimeout(timer);sourceUi?.remove()}
 };
}

export function watchAutomaticHelperUpdate(quit){
 let stopped=false,timer,failures=0;
 const stop=()=>{stopped=true;clearTimeout(timer);window.removeEventListener('wt-main-ready',check)};
 async function check(){
  if(stopped)return;
  try{
   const status=await updateRequest('status');
   if(stopped)return;
   if(status.automatic&&status.state==='ready'){await installHelperUpdate(quit);return}
   if(status.automatic&&['checking','downloading'].includes(status.state))timer=setTimeout(check,2000);
  }catch{if(!stopped&&++failures<3)timer=setTimeout(check,2000)}
 }
 window.addEventListener('beforeunload',stop,{once:true});
 if(window.__wtMainReady)check();
 else window.addEventListener('wt-main-ready',check,{once:true});
}
