export const monitorPreference=(()=>{
 const storageKey='wuwatappo-default-monitor-v1';
 const key=m=>`${m.position.x},${m.position.y},${m.size.width},${m.size.height}`;
 const valid=m=>m&&[m.position?.x,m.position?.y,m.size?.width,m.size?.height,m.scaleFactor].every(Number.isFinite)&&m.size.width>0&&m.size.height>0&&m.scaleFactor>0;
 const descriptor=m=>({kind:'monitor',name:String(m.name??''),position:{x:m.position.x,y:m.position.y},size:{width:m.size.width,height:m.size.height},scaleFactor:m.scaleFactor});
 function normalize(value){if(value?.kind==='auto'||value?.kind==='primary')return{kind:value.kind};return value?.kind==='monitor'&&valid(value)?descriptor(value):null}
 function read(storage){try{return normalize(JSON.parse(storage.getItem(storageKey)))??{kind:'auto'}}catch{return{kind:'auto'}}}
 function resolve(preference,monitors){
  const list=monitors.filter(valid),pref=normalize(preference)??{kind:'auto'};
  if(!list.length)return{target:null,missing:pref.kind==='monitor'};
  if(pref.kind==='auto')return{target:null,missing:false};
  if(pref.kind==='primary')return{target:list[0],missing:false};
  const candidates=pref.name?list.filter(m=>String(m.name??'')===pref.name):list;
  if(pref.name&&candidates.length===1)return{target:candidates[0],missing:false};
  const exact=candidates.filter(m=>key(m)===key(pref));
  return exact.length===1?{target:exact[0],missing:false}:{target:list[0],missing:true};
 }
 const label=(m,index)=>`显示器 ${index+1}${index===0?'（主屏）':''} · ${m.size.width} × ${m.size.height} · ${Math.round(m.scaleFactor*100)}%`;
 const signature=list=>JSON.stringify(list.filter(valid).map(m=>[String(m.name??''),key(m),m.scaleFactor]));
 return{storageKey,key,valid,descriptor,normalize,read,resolve,label,signature};
})();

export async function installDefaultMonitor({list,move,current,listen,emit,win=window,storage=localStorage}){
 const core=monitorPreference;let stopped=false,ready=false,refreshing=false,signature='',timer=null,queue=Promise.resolve();
 async function apply(preference,persist=false){
  const pref=core.normalize(preference);if(!pref)throw Error('显示器配置无效，请重新选择');
  const monitors=(await list()).filter(core.valid);if(stopped)return;
  if(!monitors.length)throw Error('未读取到可用显示器');
  const result=core.resolve(pref,monitors);if(persist&&result.missing)throw Error('所选显示器已断开，请刷新后重选');
  const here=await current();if(stopped)return;
  const target=result.target??(!here?monitors[0]:null);
  if(target&&(!here||core.key(here)!==core.key(target))){if(!await move(core.key(target)))throw Error('未确认切换成功，配置未保存，请重试')}
  if(stopped)return;
  if(persist)storage.setItem(core.storageKey,JSON.stringify(pref));
  signature=core.signature(monitors);
  return{ok:true,missing:result.missing,message:result.missing?'默认显示器未连接，暂时使用主屏；连接后自动恢复':pref.kind==='auto'?'已取消指定，启动时沿用原版显示器':'已保存默认显示器，并完成切换'};
 }
 function enqueue(preference,persist=false){const task=queue.catch(()=>{}).then(()=>apply(preference,persist));queue=task;return task}
 async function refresh(force=false){if(stopped||!ready||refreshing)return;refreshing=true;try{const monitors=await list();if(stopped)return;if(force||core.signature(monitors)!==signature)await enqueue(core.read(storage))}catch(error){console.warn('[default-monitor]',error)}finally{refreshing=false}}
 function start(){if(ready||stopped)return;ready=true;refresh(true);timer=win.setInterval(()=>refresh(),5000)}
 const unlisten=await listen('wt-default-monitor-change',event=>{
  const data=event.payload??event;if(stopped||!data.requestId)return;
  if(!ready){emit('wt-default-monitor-result',{requestId:data.requestId,ok:false,message:'桌宠正在启动，请稍后再保存'}).catch(()=>{});return}
  enqueue(data.preference,true).then(result=>{if(!stopped&&result)return emit('wt-default-monitor-result',{requestId:data.requestId,...result})}).catch(error=>{if(!stopped)return emit('wt-default-monitor-result',{requestId:data.requestId,ok:false,message:error.message??'切换失败，请重试'})}).catch(error=>console.warn('[default-monitor] notify failed',error));
 });
 function dispose(){if(stopped)return;stopped=true;win.clearInterval(timer);win.removeEventListener('wt-main-ready',start);win.removeEventListener('beforeunload',dispose);unlisten()}
 win.addEventListener('wt-main-ready',start);win.addEventListener('beforeunload',dispose);if(win.__wtMainReady)start();
 return{refresh,apply:enqueue,dispose};
}

export async function mountDefaultMonitorSettings({root,list,listen,emit,storage=localStorage}){
 if(!root)return()=>{};
 const core=monitorPreference,doc=root.ownerDocument;let stopped=false,busy=false,monitors=[],requestId='',timeout=null;
 root.innerHTML='<style>.wt-monitor-settings{padding:16px 0;border-top:1px solid #ead8bd;color:#8e5e43;font:inherit}.wt-monitor-settings h3{font-size:15px;font-weight:600;line-height:1.5;margin:0 0 6px}.wt-monitor-settings p{font-size:12px;line-height:1.6;color:#987e69;margin:6px 0}.wt-monitor-row{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:10px 0}.wt-monitor-settings select{flex:1 0 100%;width:100%;min-width:0;max-width:100%;box-sizing:border-box;border:1px solid #dfc5a1;border-radius:12px;background:#fffaf0;color:#805c45;padding:9px 10px;font:inherit;font-size:13px}.wt-monitor-settings button{position:static;width:auto;height:auto;transform:none;margin:0;border:1px solid #e5b77b;border-radius:12px;background:#fed291;color:#805c45;padding:9px 12px;font:inherit;font-size:13px;line-height:1.4;cursor:pointer}.wt-monitor-settings .wt-monitor-refresh{background:#fff6e6}.wt-monitor-settings :disabled{opacity:.55;cursor:wait}.wt-monitor-settings [role=status]{min-height:20px;overflow-wrap:anywhere}</style><section class="wt-monitor-settings"><h3>默认显示器</h3><p>启动时优先使用所选屏幕；仍可通过原版快捷键临时切屏。</p><div class="wt-monitor-row"><select aria-label="默认显示器"></select><button type="button" class="wt-monitor-save">保存并切换</button><button type="button" class="wt-monitor-refresh">刷新</button></div><p role="status" aria-live="polite"></p></section>';
 const select=root.querySelector('select'),save=root.querySelector('.wt-monitor-save'),reload=root.querySelector('.wt-monitor-refresh'),message=root.querySelector('[role=status]');
 const status=text=>{if(!stopped)message.textContent=text};
 function setBusy(value){busy=value;select.disabled=value;save.disabled=value;reload.disabled=value}
 function option(value,label,disabled=false){const node=doc.createElement('option');node.value=value;node.textContent=label;node.disabled=disabled;select.append(node)}
 async function refresh(){
  if(stopped||busy)return;setBusy(true);
  try{
   const found=(await list()).filter(core.valid);if(stopped)return;monitors=found;const pref=core.read(storage),resolved=core.resolve(pref,monitors);
   select.replaceChildren();option('auto','不指定（沿用原版）');option('primary','始终使用系统主显示器');
   monitors.forEach((m,index)=>option('monitor:'+core.key(m),core.label(m,index)));
   if(resolved.missing){option('missing','已保存的显示器未连接',true);select.value='missing';status('默认显示器未连接，暂时使用主屏；连接后自动恢复。')}
   else{select.value=pref.kind==='monitor'?'monitor:'+core.key(resolved.target):pref.kind;status(monitors.length?'选择后点击“保存并切换”，设置会保存在本机。':'未读取到可用显示器，请稍后刷新。')}
  }catch{status('读取显示器失败，请稍后刷新。')}finally{if(!stopped)setBusy(false)}
 }
 function fail(text){if(stopped)return;clearTimeout(timeout);timeout=null;requestId='';setBusy(false);status(text)}
 save.onclick=async()=>{
  if(stopped||busy)return;
  let preference;if(select.value==='auto'||select.value==='primary')preference={kind:select.value};else{const found=monitors.find(m=>'monitor:'+core.key(m)===select.value);if(!found){status('请先选择已连接的显示器。');return}preference=core.descriptor(found)}
  setBusy(true);requestId=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);status('正在切换并保存…');timeout=setTimeout(()=>fail('未收到桌宠的切换确认，请稍后刷新设置。'),15000);
  try{await emit('wt-default-monitor-change',{requestId,preference})}catch{fail('发送失败，请运行完整 Helper 后重试。')}
 };
 reload.onclick=refresh;
 let unlisten;
 try{unlisten=await listen('wt-default-monitor-result',event=>{const data=event.payload??event;if(stopped||!requestId||data.requestId!==requestId)return;fail(String(data.message??(data.ok?'已保存':'切换失败，请重试')))})}
 catch{setBusy(true);status('无法监听切换结果，请重新打开设置。');return()=>{stopped=true;root.replaceChildren()}}
 await refresh();
 return()=>{stopped=true;clearTimeout(timeout);unlisten();save.onclick=null;reload.onclick=null;root.replaceChildren()};
}
