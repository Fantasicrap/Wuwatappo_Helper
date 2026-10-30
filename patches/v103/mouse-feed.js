let __wtMouseConnected=false,__wtKeysConnected=false,__wtMouseStopped=false,__wtMouseTimer=null,__wtMouseCursor=null;
async function __wtPollMouse(){
 if(__wtMouseStopped)return;
 try{
  const response=await fetch('http://127.0.0.1:48642/mouse?after='+(__wtMouseCursor??0),{cache:'no-store',signal:AbortSignal.timeout(2000)});
  if(!response.ok)throw Error('mouse service unavailable');
  const data=await response.json();
  if(!Array.isArray(data.events)||!Number.isFinite(data.seq))throw Error('mouse response invalid');
  if(!data.available)throw Error('mouse capture unavailable');
  __wtMouseConnected=true;
  __wtKeysConnected=!!data.keyboardAvailable;
  const gap=data.gap||data.seq<(__wtMouseCursor??0);
  if(gap){__wtKeyboard.stopRecording('mouse_event_gap');__wtKeyboard.mouse('left','release');__wtKeyboard.mouse('right','release');__wtKeyboard.releaseInputs?.()}
  if(!gap&&__wtMouseCursor!==null)for(const event of data.events)if(event.seq>__wtMouseCursor){if(event.key)__wtKeyboard.key(event.key,event.action==='press');else __wtKeyboard.mouse(event.button,event.action,{x:event.x,y:event.y})}
  __wtMouseCursor=data.seq;
 }catch{if(__wtMouseConnected){__wtKeyboard.stopRecording('mouse_connection_lost');__wtKeyboard.mouse('left','release');__wtKeyboard.mouse('right','release');__wtKeyboard.releaseInputs?.()}__wtMouseConnected=__wtKeysConnected=false;__wtMouseCursor=null}
 finally{if(!__wtMouseStopped)__wtMouseTimer=setTimeout(__wtPollMouse,40)}
}
function __wtStopMouseFeed(){__wtMouseStopped=true;clearTimeout(__wtMouseTimer)}
