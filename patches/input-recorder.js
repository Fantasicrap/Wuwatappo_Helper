// Only the nine explicitly selected game controls can enter a recording.
const __wtInputRecorder=(()=>{
 const allowed=Object.freeze(['1','2','3','Q','E','R','Space','MouseLeft','MouseRight']);
 function normalize(raw){
  const text=String(raw&&typeof raw==='object'?(raw.code??raw.key??''):raw??'');
  if(text===' ')return 'Space';
  const digit=text.match(/^(?:Digit|Numpad|Num|Key)?([123])$/i);if(digit)return digit[1];
  if(/^(?:Key)?[a-z]$/i.test(text))return text.slice(-1).toUpperCase();
  if(/^(space|spacebar)$/i.test(text))return 'Space';
  if(/^(mouseleft|left)$/i.test(text))return 'MouseLeft';
  if(/^(mouseright|right)$/i.test(text))return 'MouseRight';
  return '';
 }
 function create({clock=()=>performance.now(),date=()=>new Date().toISOString(),limit=50000}={}){
  const held=new Set(),recorded=new Map();let active=false,events=[],startTime=0,lastTime=0,startedAt='',last=null;
  const time=()=>{const value=Number(clock());lastTime=Math.max(lastTime,Number.isFinite(value)?value:startTime);return Math.round(Math.max(0,lastTime-startTime)*1000)/1000};
  function append(key,action,at,extra={}){
   const event={index:events.length+1,time_ms:at,device:key.startsWith('Mouse')?'mouse':'keyboard',key,action,...extra};events.push(event);return event;
  }
  function start(){
   if(active)return false;
   startTime=Number(clock());lastTime=startTime;startedAt=date();events=[];recorded.clear();last=null;active=true;return true;
  }
  function stop(reason='user'){
   if(!active)return last;
   const at=time();
   for(const[key,down]of recorded)append(key,'release',at,{hold_ms:Math.max(0,Math.round((at-down)*1000)/1000),synthetic:true,reason:'recording_stopped'});
   recorded.clear();active=false;
   last={schema:'wuwatappo-helper-input-v1',name:'鸣潮专属',started_at:startedAt,duration_ms:at,time_basis:'application_monotonic_event_arrival',allowed_keys:[...allowed],stop_reason:reason,events:events.map(event=>({...event}))};
   return last;
  }
  function input(raw,down,{capture=true}={}){
   const key=normalize(raw);if(!key)return false;
   if(down){
    if(held.has(key))return false;held.add(key);
    if(active&&capture&&allowed.includes(key)){
     if(events.length>=limit){stop('event_limit');return true}
     const at=time();append(key,'press',at);recorded.set(key,at);
    }
   }else{
    if(!held.delete(key))return false;
    // A release for a key held before Start is deliberately not an orphan event.
    if(active&&recorded.has(key)){
     const at=time(),pressedAt=recorded.get(key);append(key,'release',at,{hold_ms:Math.max(0,Math.round((at-pressedAt)*1000)/1000)});recorded.delete(key);
     if(events.length>=limit)stop('event_limit');
    }
   }
   return true;
  }
  function clear(){stop('cleared');held.clear();recorded.clear();events=[];last=null}
  return {start,stop,input,clear,get active(){return active},get held(){return new Set(held)},get count(){return events.length},get duration(){return active?time():last?.duration_ms??0},get last(){return last}};
 }
 function txt(recording){
  const t=value=>globalThis.__wtTranslate?.(value)??value,labels={Space:'空格',MouseLeft:'鼠标左键',MouseRight:'鼠标右键'},label=key=>t(labels[key]??key);
  const field=(key,value)=>t(key)+(t(key)===key?'':' ')+value;
  const cols=['序号','时间（毫秒）','按键','动作','按住（毫秒）','备注'].map(t).join('\t');
  const lines=[t('鸣潮专属操作录制'),field('开始时间（UTC）：',recording.started_at),field('总时长：',recording.duration_ms+t(' 毫秒')),field('事件条数：',recording.events.length),field('结束原因：',recording.stop_reason),field('录制按键：',recording.allowed_keys.map(label).join(' / ')),t('时间基准：应用收到事件后，从开始录制起计算的毫秒数。'),'',cols];
  for(const event of recording.events)lines.push([event.index,event.time_ms,label(event.key),t(event.action==='press'?'按下':'松开'),event.hold_ms??'',event.synthetic?t('停止录制时补记（非实际松开）'):''].join('\t'));
  return '\uFEFF'+lines.join('\r\n')+'\r\n';
 }
 return {allowed,normalize,create,txt};

})();
export {__wtInputRecorder};
