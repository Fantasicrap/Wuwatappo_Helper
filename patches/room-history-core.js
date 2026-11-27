const __wtRoomHistoryCore=(()=>{
 const prefix='wuwatappo-room-history-v1:';
 const account=value=>Number.isSafeInteger(Number(value))&&Number(value)>0?Number(value):0;
 const room=value=>typeof value==='string'&&value.trim().length<=64&&!/[\u0000-\u001f\u007f]/.test(value)?value.trim():'';
 function create({storage=localStorage,now=()=>Date.now(),pause=ms=>new Promise(resolve=>setTimeout(resolve,ms))}={}){
  let busy=false,serial=0,confirmed=null;
  function recent(id){id=account(id);if(!id)return[];try{const data=JSON.parse(storage.getItem(prefix+id)||'[]'),seen=new Set();return(Array.isArray(data)?data:[]).filter(item=>item&&room(item.id)&&Number.isFinite(item.visitedAt)).sort((a,b)=>b.visitedAt-a.visitedAt).filter(item=>{if(seen.has(room(item.id)))return false;seen.add(room(item.id));return true}).slice(0,100).map(item=>({id:room(item.id),visitedAt:item.visitedAt}))}catch{return[]}}
  const detailKey=id=>'wuwatappo-room-labels-v1:'+id;
 function labels(id){
  try{return new Map(JSON.parse(storage.getItem(detailKey(id))||'[]').filter(([key,entry])=>room(key)&&entry&&typeof entry.note==='string'&&Number.isFinite(entry.visitedAt)))}
  catch{return new Map()}
 }
 function read(id){
  id=account(id);if(!id)return [];
  const entries=labels(id),rows=new Map(recent(id).map(row=>[row.id,row]));
  for(const [key,value] of entries)if(value.pinned&&!rows.has(key))rows.set(key,{id:key,visitedAt:value.visitedAt});
  return [...rows.values()].map(row=>{
   const label=entries.get(row.id);
   return label?{...row,note:label.note,pinned:label.pinned===true}:row;
  }).sort((a,b)=>Number(!!b.pinned)-Number(!!a.pinned)||b.visitedAt-a.visitedAt);
 }
 function annotate(id,key,changes){
  id=account(id);key=room(key);
  const row=read(id).find(entry=>entry.id===key);
  if(!row)return false;
  const entries=labels(id),updated={visitedAt:row.visitedAt,note:row.note||'',pinned:!!row.pinned,...changes};
  updated.note=String(updated.note).trim().slice(0,40);
  if(updated.note||updated.pinned)entries.set(key,updated);else entries.delete(key);
  const recentIds=new Set(recent(id).map(item=>item.id));
  for(const [name,entry] of entries)if(!entry.pinned&&!recentIds.has(name))entries.delete(name);
  try{storage.setItem(detailKey(id),JSON.stringify([...entries]));return true}catch{return false}
 }
 function remember(id,value){id=account(id);value=room(value);if(!id||!value)return false;confirmed={accountId:id,roomId:value,serial:++serial};const rows=[{id:value,visitedAt:now()},...recent(id).filter(item=>item.id!==value)].slice(0,100);try{storage.setItem(prefix+id,JSON.stringify(rows));return true}catch{return false}}
  async function enter(id,value,{state,leave,join,setInput,notify=()=>{},timeout=12000}){
   id=account(id);value=room(value);const result=(code,message)=>({code,message});
   if(!id||!value)return result('invalid','无效的账号或房间号');
   if(busy)return result('busy','正在切换房间，请稍候');
   const valid=()=>{const s=state();return s.accountId===id&&!s.blocked};
   if(!valid())return result('account','请登录原账号后重试，或等待更新限制解除');
   if(!read(id).some(item=>item.id===value))return result('missing','该房间不在当前账号的历史记录中');
   if(state().mode!=='idle'&&state().roomId===value)return result('already','你已经在该房间');
   busy=true;
   try{
    if(state().mode!=='idle'){
     if(!state().canLeave)return result('leave','当前暂时无法退出房间，请稍后重试');
     notify('正在退出当前房间…');
     if(await leave()!==true)return result('leave','退出原房间失败，未继续加入');
     if(!valid())return result('account','账号或登录状态已改变，已停止切换');
     if(state().mode!=='idle')return result('leave','尚未确认退出原房间，已停止切换');
    }
    if(!valid())return result('account','账号或登录状态已改变，已停止切换');
    if(!state().canJoin)return result('join','连接尚未就绪，暂时无法加入；请稍后重试');
    setInput(value);const before=serial;notify('正在加入房间 '+value+'…');await join();
    const start=now();
    while(valid()){
     if(confirmed?.serial>before&&confirmed.accountId===id&&confirmed.roomId===value&&state().mode!=='idle'&&state().roomId===value)return result('joined','已进入房间 '+value);
     if(state().mode==='idle')return result('join','加入失败，房间可能已关闭、已满或连接不可用');
     if(now()-start>=timeout)return result('timeout','未收到加入成功确认，请检查当前房间状态后重试');
     await pause(100);
    }
    return result('account','账号或登录状态已改变，已停止切换');
   }catch{return result('error','房间切换失败，请检查连接及当前房间状态')}finally{busy=false}
  }
  return {read,remember,annotate,enter,get busy(){return busy}};
 }
 return {prefix,account,room,create};
})();
