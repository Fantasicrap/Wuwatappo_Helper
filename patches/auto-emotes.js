const __wtAutoEmotes=(()=>{
 const key='wuwatappo-auto-emotes-v1',choices=[['off','关闭'],['equipped','装备栏表情'],['owned','随机已拥有表情']];
 const valid=value=>choices.some(([id])=>id===value)?value:'off';
 function read(){try{return valid(localStorage.getItem(key))}catch{return'off'}}
 function pool(items){const seen=new Set();return(Array.isArray(items)?items:[]).filter(item=>item?.asset_type==='emote'&&Number.isSafeInteger(Number(item.asset_id))&&Number(item.asset_id)>0&&Number.isFinite(Number(item.quantity))&&Number(item.quantity)>=1&&typeof item.asset_name==='string'&&item.asset_name.trim()&&!seen.has(Number(item.asset_id))&&seen.add(Number(item.asset_id))).map(item=>({id:Number(item.asset_id),name:item.asset_name}))}
 function create({state,load,send,defer=false,blocked=()=>false,normalize=value=>String(value),now=()=>performance.now(),random=Math.random}){
  let mode=read(),account=state().account,items=[],ready=false,pending=false,epoch=0,retryAt=0,slot=0,disposed=false,active=!defer;const recent=[];
  function inventory(list,id){if(!disposed&&mode==='owned'&&id===account&&id===state().account&&Array.isArray(list)){items=pool(list);ready=true;return true}return false}
  async function prime(){if(!active||disposed||mode!=='owned'||!account||pending||ready||now()<retryAt)return;const token=epoch,id=account;pending=true;
   try{const list=await load();if(token===epoch&&mode==='owned')inventory(list,id)}catch{}
   finally{if(token===epoch){pending=false;retryAt=now()+5000}}
  }
  function refresh(){epoch++;account=state().account;items=[];ready=false;pending=false;retryAt=0;slot=0;prime()}
  function sync(){const next=read();if(next!==mode){mode=next;refresh()}}
  function down(raw){if(!active||disposed||mode==='off'||blocked())return false;const code=normalize(raw);if(!code||['Ctrl','Alt','Shift','Meta','PrintScreen'].includes(code))return false;
   if(account!==state().account)refresh();const time=now();while(recent.length&&recent[0]<=time-1000)recent.shift();if(recent.length>=3)return false;
   let item;if(mode==='owned'){if(!ready){prime();return false}if(!items.length)return false;item=items[Math.min(items.length-1,Math.max(0,Math.floor(random()*items.length)))];}
   else{const slots=state().equipped?.filter(item=>Number.isSafeInteger(item?.id)&&item.id>0&&typeof item.name==='string'&&item.name.trim())??[];if(!slots.length)return false;item=slots[slot%slots.length];slot++}
   recent.push(time);try{send(item);return true}catch{return false}
  }
  const changed=event=>{if(event.key===key||event.key===null)sync()};window.addEventListener('storage',changed);prime();
  return{down,sync,refresh,inventory,start(){if(!disposed&&!active){active=true;refresh()}},dispose(){disposed=true;epoch++;items=[];window.removeEventListener('storage',changed)}};
 }
 function settings(ref,toast){const model={mode:ref(read())};model.save=async value=>{const next=valid(value);try{localStorage.setItem(key,next);model.mode.value=next;await emit('wt-auto-emotes-updated',{});toast('按键自动表情：'+choices.find(([id])=>id===next)[1])}catch{toast('自动表情设置保存或同步失败，请重新打开设置检查')}};return model}
 function renderSettings(h,model){return h('section',{class:'wt-auto-emote-settings',style:{padding:'12px 0',margin:'12px 0',borderTop:'1px solid var(--wt-ui-divider,#efd4b7)',color:'var(--wt-ui-text,#8e5e43)'}},[
  h('label',{for:'wt-auto-emote-mode',style:{display:'block',fontSize:'18px',fontWeight:'600',marginBottom:'8px'}},'按键自动表情'),
  h('select',{id:'wt-auto-emote-mode',value:model.mode.value,style:{position:'static',width:'100%',maxWidth:'320px',boxSizing:'border-box',padding:'7px 10px',border:'1px solid var(--wt-ui-border,#e7b77c)',borderRadius:'9px',background:'var(--wt-ui-field,#fff8e9)',color:'var(--wt-ui-text,#8e5e43)',font:'inherit'},onChange:event=>model.save(event.target.value)},choices.map(([value,label])=>h('option',{value},label))),
  h('p',{style:{fontSize:'12px',lineHeight:'1.6',margin:'7px 0 0',color:'var(--wt-ui-muted,#8e7b6a)'}},'键盘按下触发，长按不连发；任意1秒内最多3次，不补发。装备栏按槽位轮流发送；随机模式需登录并读取库存，联机沿用原版发送流程。')])}
 return{key,read,pool,create,settings,renderSettings};
})();
export {__wtAutoEmotes};
