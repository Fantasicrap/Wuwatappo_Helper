const __wtAutostart = (() => {
 const base='http://127.0.0.1:48642/autostart/';
 async function request(route,method,timeout){
  try{
   const result=await fetch(base+route,{method,headers:{'X-Wuwa-Action':'1'},signal:AbortSignal.timeout(timeout),cache:'no-store'});
   return result.ok?await result.json():null;
  }catch{return null;}
 }
 const managed=async()=>!!(await request('status','GET',800))?.managed;
 async function enabled(original){return await managed()||await original();}
 async function configure(turnOn,original){
  if(turnOn&&await managed())return;
  await original();
  if(turnOn)await request('retarget','POST',55000);
 }
 return {enabled,configure};
})();
export {__wtAutostart};
