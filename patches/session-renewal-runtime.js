let __wtRenewRetryAt=0,__wtRenewLastClock=0;
async function renewTokenIfNeeded(){
 const token=getCookie('infoToken'),now=performance.now();
 if(now<__wtRenewLastClock)__wtRenewRetryAt=0;
 __wtRenewLastClock=now;
 if(!token||!shouldRenewToken())return false;
 if(renewInFlight)return renewInFlight;
 if(now<__wtRenewRetryAt)return false;
 renewInFlight=(async()=>{
  try{
   const data=unwrapApiData(await refreshToken());
   // An old account's response must never extend a newly logged-in session.
   if(getCookie('infoToken')!==token)return false;
   if(data!==true){__wtRenewRetryAt=performance.now()+30000;return false}
   extendTokenExpireLocally();__wtRenewRetryAt=0;return true;
  }catch(error){
   __wtRenewRetryAt=performance.now()+30000;
   const code=parseApiErrorCode(error);
   if(code===10002||code===10003)throw error;
   return false;
  }finally{renewInFlight=null}
 })();
 return renewInFlight;
}
