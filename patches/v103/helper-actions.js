const __wtHelperCapture=new Map(),__wtHelperLast=new Map(),__wtHelperStops=[];
function __wtPerformHelperAction(action){
 const now=Date.now();for(const [id,until]of __wtHelperCapture)if(until<=now)__wtHelperCapture.delete(id);
 if(!action||Ie()||__wtHelperCapture.size||now-(__wtHelperLast.get(action)??-Number.POSITIVE_INFINITY)<400)return;
 __wtHelperLast.set(action,now);
 if(action==='record')__wtKeyboard.toggle();
 else if(action==='reload')Xn().finally(hy);
 else if(/^emote[1-6]$/.test(action)){
  const item=La.value[Number(action.slice(5))-1];
  if(item?.id>0&&item.name)Ap({id:item.id,src:te('emote/'+item.name)});
  else mt('表情槽位未配置');
 }
}
async function __wtInstallHelperActions(){
 __wtHelperStops.push(await tt('wt-hotkey-action',e=>__wtPerformHelperAction(e.payload?.action)));
 __wtHelperStops.push(await tt('wt-hotkey-capture',e=>{const id=String(e.payload?.owner??'default');e.payload?.enabled?__wtHelperCapture.set(id,Date.now()+120000):__wtHelperCapture.delete(id)}));
}
function __wtDisposeHelperActions(){for(const stop of __wtHelperStops)stop();__wtHelperStops.length=0}

