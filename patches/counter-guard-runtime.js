// The panel is the authority: throttling the settings window alone cannot
// bound work from events already in transit or another settings window.
let __wtBoostBusy=false,__wtBoostNext=0;
async function __wtBoostLocalClicks(delta){
  const now=performance.now();
  if(delta!==10000||__wtBoostBusy||now<__wtBoostNext)return;
  __wtBoostBusy=true;__wtBoostNext=now+500;
  const cuid=A.isLoggedIn?String(A.userInfo?.cuid??""):"";
  try{
    A.setLocalClickCount(Math.min(Number.MAX_SAFE_INTEGER,A.localClickCount+delta));
    // No queue of boosts: clicks during this save are ignored. Read the
    // latest cumulative value after saving, and never save it for a new login.
    await Rn();
    if(cuid&&A.isLoggedIn&&String(A.userInfo?.cuid??"")===cuid)
      await ki(A.cumulativeClickCount,cuid);
  }catch(error){console.warn("[counter] save failed",error)}
  finally{__wtBoostBusy=false;tt()}
}

// All ordinary panel snapshots share one in-flight emit and one dirty bit.
// The inventory is serialized only when emitting, at most five times/second.
let __wtPanelTimer=null,__wtPanelDirty=false,__wtPanelSending=false,__wtPanelNext=0,__wtPanelStopped=false;
function tt(){
  if(__wtPanelStopped||!ge.value)return;
  __wtPanelDirty=true;
  if(__wtPanelSending||__wtPanelTimer!==null)return;
  const delay=__wtPanelNext-performance.now();
  if(delay>0)__wtPanelTimer=setTimeout(()=>{__wtPanelTimer=null;__wtFlushPanel()},delay);
  else __wtFlushPanel();
}
async function __wtFlushPanel(){
  if(__wtPanelStopped||!ge.value){__wtPanelDirty=false;return}
  __wtPanelDirty=false;__wtPanelSending=true;__wtPanelNext=performance.now()+200;
  try{await wu(fc())}catch(error){console.warn("[counter] panel update failed",error)}
  finally{__wtPanelSending=false;if(__wtPanelDirty)tt()}
}
function __wtDisposeCounter(){
  __wtPanelStopped=true;__wtPanelDirty=false;
  if(__wtPanelTimer!==null)clearTimeout(__wtPanelTimer);
  __wtPanelTimer=null;
}
