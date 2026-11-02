function __wtMouseDemand(){return __wtKeyboard.inputActive||(typeof __wtFun!=="undefined"&&__wtFun.active())}
let __wtMouseConnected=false,__wtKeysConnected=false,__wtMouseStopped=false,__wtMouseTimer=null,__wtMouseCursor=null,__wtMouseEpoch=0;
function __wtSyncMouseFeed(){
 clearTimeout(__wtMouseTimer);__wtMouseTimer=null;__wtMouseEpoch++;
 __wtMouseConnected=__wtKeysConnected=false;__wtMouseCursor=null;
 __wtKeyboard.releaseInputs?.();if(typeof __wtFun!=="undefined")__wtFun.releasePointerInputs();
 if(!__wtMouseStopped&&__wtMouseDemand())__wtPollMouse();
}
async function __wtPollMouse(){
 if(__wtMouseStopped||!__wtMouseDemand())return;
 const epoch=__wtMouseEpoch;
 try{
  const response=await fetch('http://127.0.0.1:48642/mouse?after='+(__wtMouseCursor??0),{cache:'no-store',signal:AbortSignal.timeout(2000)});
  if(!response.ok)throw Error('mouse service unavailable');
  const data=await response.json();
  if(epoch!==__wtMouseEpoch||__wtMouseStopped||!__wtMouseDemand())return;
  if(!Array.isArray(data.events)||!Number.isFinite(data.seq))throw Error('mouse response invalid');
  if(!data.available)throw Error('mouse capture unavailable');
  __wtMouseConnected=true;
  __wtKeysConnected=!!data.keyboardAvailable;
  const gap=data.gap||data.seq<(__wtMouseCursor??0);if(__wtMouseCursor===null&&typeof __wtFun!=="undefined")__wtFun.releasePointerInputs();
  if(gap){if(typeof __wtFun!=="undefined")__wtFun.releasePointerInputs();__wtKeyboard.stopRecording('mouse_event_gap');__wtKeyboard.mouse('left','release');__wtKeyboard.mouse('right','release');__wtKeyboard.releaseInputs?.()}
  if(!gap&&__wtMouseCursor!==null)for(const event of data.events)if(event.seq>__wtMouseCursor){if(event.key)__wtKeyboard.key(event.key,event.action==='press');else __wtKeyboard.mouse(event.button,event.action,{x:event.x,y:event.y});if(typeof __wtFun!=="undefined"&&__wtFun.active()&&(!event.key||data.keyboardAvailable))__wtFun.input(event.key?'keyboard':'mouse',event.key||event.button,event.action==='press')}
  __wtMouseCursor=data.seq;
 }catch{if(epoch!==__wtMouseEpoch)return;if(typeof __wtFun!=="undefined")__wtFun.releasePointerInputs();if(__wtMouseConnected){__wtKeyboard.stopRecording('mouse_connection_lost');__wtKeyboard.mouse('left','release');__wtKeyboard.mouse('right','release');__wtKeyboard.releaseInputs?.()}__wtMouseConnected=__wtKeysConnected=false;__wtMouseCursor=null}
 finally{if(epoch===__wtMouseEpoch&&!__wtMouseStopped&&__wtMouseDemand())__wtMouseTimer=setTimeout(__wtPollMouse,__wtMouseConnected?40:1000)}
}
function __wtStopMouseFeed(){__wtMouseStopped=true;__wtMouseEpoch++;clearTimeout(__wtMouseTimer)}
