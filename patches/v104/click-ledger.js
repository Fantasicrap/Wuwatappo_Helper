let __wtClickQueue=Promise.resolve();

function __wtClickIO(work){
 const result=__wtClickQueue.then(work);
 __wtClickQueue=result.catch(()=>{});
 return result;
}

function __wtClickSession(){
 const id=globalStore.userInfo?.id,token=getCookie('infoToken');
 if(!globalStore.isLoggedIn||!id||!token)return null;
 return ()=>globalStore.isLoggedIn&&globalStore.userInfo?.id===id&&getCookie('infoToken')===token;
}

async function __wtClickAck(send){
 let timer;
 try{return await Promise.race([send(),new Promise(resolve=>{timer=setTimeout(resolve,8000)})])}
 finally{clearTimeout(timer)}
}

function __wtSubmittedClicks(gross){
 const base=globalStore.serverClickTotal,pending=globalStore.localClickCount;
 return isFrozenClickCount(base)?pending:Math.min(pending,Math.max(0,gross-base));
}

function __wtReportClicks(valid,send,accepted){
 return __wtClickIO(async()=>{
  if(!valid())return;
  const gross=await resolveClickReportGrossTotal(valid);
  if(!valid())return;
  const sent=__wtSubmittedClicks(gross),ack=await __wtClickAck(()=>send(gross));
  if(!valid()||!accepted(ack))return;
  const cuid=globalStore.userInfo?.cuid??'';
  globalStore.applyClickReportSuccess(gross,sent);
  window.dispatchEvent(new CustomEvent('cat-click-report-success'));
  await persistCumulativeClickCount(gross,cuid);
 });
}

function __wtReconcileChest(data,sent){
 const account=globalStore.userInfo;
 if(!account||String(data?.id)!==String(account.id))return false;
 const fields=['total_click_count','total_click_consume','left_treasure_chest','right_treasure_chest'];
 const values=fields.map(field=>data[field]);
 if(values.some(value=>value==null||value===''||!Number.isFinite(Number(value))||Number(value)<0))return false;
 const gross=parseClickCount(values[0]),consumed=parseClickCount(values[1]);
 if(gross<globalStore.serverClickTotal||consumed<globalStore.serverClickConsume)return false;
 const credited=Math.min(sent,gross-globalStore.serverClickTotal);
 globalStore.$patch({userInfo:{...account,...Object.fromEntries(fields.map((field,i)=>[field,values[i]]))}});
 if(credited>0)globalStore.setLocalClickCount(Math.max(0,globalStore.localClickCount-credited));
 globalStore.resetServerClickSpend();
 persistKeyPressClickCount(void 0,{force:true});
 return true;
}

function __wtMakeChestLedger({syncClock,ready,read,changed}){
 let pending;
 return {
  hasPending:()=>!!pending,
  submitted(same,sent){pending={same,sent}},
  confirmed(){pending=void 0},
  async sync(){
   const claim=pending;
   if(!claim?.same()){
    pending=void 0;
    await syncClock();
    return ready();
   }
   return __wtClickIO(async()=>{
    if(pending!==claim)return ready();
    if(!claim.same())return false;
    await syncClock();
    if(!ready()||!claim.same())return false;
    const data=await read();
    if(!claim.same()||!__wtReconcileChest(data,claim.sent))return false;
    pending=void 0;
    changed();
    return true;
   });
  }
 };
}

export {__wtClickIO,__wtClickSession,__wtReportClicks,__wtSubmittedClicks,__wtMakeChestLedger};
