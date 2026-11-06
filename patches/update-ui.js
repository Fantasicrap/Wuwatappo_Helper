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

export function mountHelperUpdate(publish,quit){
 let stopped=false,timer,revision=0;
 const failed=()=>({state:'error',message:'检查更新失败。请确认正在运行完整 Helper，也可以前往 GitHub 下载。'});
 async function refresh(){
  clearTimeout(timer);
  const current=++revision;
  let status;
  try{status=await updateRequest('status')}catch{status=failed()}
  if(stopped||current!==revision)return;
  publish(status);
  if(['checking','downloading','applying'].includes(status.state))timer=setTimeout(refresh,1200);
 }
 refresh();
 return {
  async click(status){
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
  stop(){stopped=true;clearTimeout(timer)}
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
