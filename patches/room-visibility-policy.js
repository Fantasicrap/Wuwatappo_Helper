// A session-wide default: new/reconnected peers stay hidden until explicitly shown.
const __wtHideRoomPeers=W(false),__wtShownRoomPeers=W(new Set);
// The upstream .cat-friend rule restores pointer-events on descendants even
// when the parent is invisible, allowing hidden pets to intercept clicks.
const __wtRoomHiddenStyle=document.createElement('style');
__wtRoomHiddenStyle.textContent='.room-cat-shell--ui-hidden,.room-cat-shell--ui-hidden *{pointer-events:none!important}';
document.head.append(__wtRoomHiddenStyle);
function no(e){e=typeof e==='number'||typeof e==='string'&&e.trim()?Number(e):Number.NaN;return Number.isFinite(e)&&e>0&&e!==Number(Wo.value)&&((__wtHideRoomPeers.value&&!__wtShownRoomPeers.value.has(e))||Eo.value.has(e))}
function cl(e,t){e=Number(e);const o=new Set(Eo.value),s=new Set(__wtShownRoomPeers.value);t?(o.add(e),s.delete(e)):(o.delete(e),s.add(e));Eo.value=o;__wtShownRoomPeers.value=s}
function Md(){Eo.value.size!==0&&(Eo.value=new Set)}
