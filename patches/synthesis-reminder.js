const __wtSynthesis=(()=>{
 const key='wuwatappo-synthesis-reminder-v1',event='wt-synthesis-reminder-updated',rarities=['common','uncommon','rare','epic'],types=['character_skin','accessory','emote'];
 function read(){try{const s=JSON.parse(localStorage.getItem(key)||'{}');return{same:s.same===true,upgrade:s.upgrade===true}}catch{return{same:false,upgrade:false}}}
 const type=row=>String(row?.asset_type??'').trim().toLowerCase().replace(/_atlas$/,'');
 const rarity=row=>String(row?.rarity??row?.rarity_type??'').trim().toLowerCase();
 function analyze(items,catalog=[]){
  const top=new Map(),unique=new Map(),groups=new Map();
  for(const row of catalog.length?catalog:items){const t=type(row),r=rarities.indexOf(rarity(row));if(types.includes(t)&&r>=0)top.set(t,Math.max(top.get(t)??-1,r))}
  for(const row of items){const id=Number(row.asset_id),t=type(row),r=rarity(row),q=Number(row.quantity);if(!Number.isSafeInteger(id)||id<=0||!types.includes(t)||!rarities.includes(r)||!Number.isSafeInteger(q)||q<1)continue;const old=unique.get(id);if(!old||q>old.quantity)unique.set(id,{asset_type:t,rarity:r,quantity:q})}
  for(const row of unique.values()){const k=row.asset_type+':'+row.rarity,g=groups.get(k)||{type:row.asset_type,rarity:row.rarity,usable:0};g.usable+=Math.max(0,row.quantity-1);groups.set(k,g)}
  const all=[...groups.values()];return{same:all.filter(g=>g.usable>=5),upgrade:all.filter(g=>g.usable>=10&&rarities.indexOf(g.rarity)<(top.get(g.type)??3))};
 }
 function create({watch,account,inventory,catalog,load,root,open=()=>{},blocked=()=>false,changed=()=>{},now=()=>performance.now()}){
  let cfg=read(),started=false,disposed=false,owner=null,ready=false,epoch=0,node=null,opening=false,nextOpen=0;const stops=[];
  async function activate(event){event.preventDefault();event.stopPropagation();if(disposed||!ready||!account()||owner!==account()||blocked()||opening||now()<nextOpen)return;
   const current=read(),result=analyze(inventory(),catalog());if(!current.same&&!current.upgrade||!(current.same&&result.same.length||current.upgrade&&result.upgrade.length))return;
   opening=true;nextOpen=now()+500;try{await open()}catch{}finally{opening=false}
  }
  function render(){const previous=node;node?.remove();node=null;if(previous)changed();if(!started||disposed||!ready||!account()||account()!==owner||!cfg.same&&!cfg.upgrade)return;
   const result=analyze(inventory(),catalog()),same=cfg.same&&result.same.length>0,up=cfg.upgrade&&result.upgrade.length>0,host=root();if(!host||!same&&!up)return;
   node=document.createElement('button');node.type='button';node.className='wt-synthesis-reminder';node.setAttribute('aria-label','可合成，点击打开合成页面');node.setAttribute('aria-live','polite');node.title='点击打开合成页面';
   Object.assign(node.style,{position:'absolute',right:'2%',top:'7%',maxWidth:'44%',width:'auto',height:'auto',margin:'0',transform:'none',appearance:'none',cursor:'pointer',boxSizing:'border-box',padding:'3% 4%',border:'1px solid #e6b87c',borderRadius:'16px 16px 16px 4px',background:'#fff8e8f5',color:'#8e5e43',boxShadow:'0 2px 6px #95613724',fontFamily:'"Microsoft YaHei",sans-serif',fontSize:'clamp(8px,calc(var(--pet-base-size,200px) * .06),18px)',lineHeight:'1.35',textAlign:'center',pointerEvents:'auto',zIndex:'18'});
   const label=document.createElement('strong'),detail=document.createElement('div');label.textContent='可合成';detail.textContent=same&&up?'平阶 · 升阶':same?'平阶':'升阶';detail.style.fontSize='.7em';node.append(label,detail);for(const name of ['pointerdown','pointerup','mousedown','mouseup'])node.addEventListener(name,event=>event.stopPropagation());node.addEventListener('click',activate);host.appendChild(node);changed();
  }
  async function refresh(){const id=account(),ticket=++epoch;owner=id;ready=false;render();if(!started||!id||!cfg.same&&!cfg.upgrade)return;try{const ok=await load();if(!disposed&&ticket===epoch&&account()===id&&ok){ready=true;render()}}catch{}}
  function sync(){const before=cfg;cfg=read();if(!before.same&&!before.upgrade&&(cfg.same||cfg.upgrade))refresh();else render()}
  return{start(){if(started||disposed)return;started=true;stops.push(watch(account,refresh),watch(inventory,()=>{if(owner===account())ready=true;render()},{deep:true}),watch(catalog,render,{deep:true}),watch(root,render));refresh()},sync,dispose(){disposed=true;epoch++;node?.remove();stops.forEach(stop=>stop())}};
 }
 function settings(ref,toast,includeTopUp=false){
  const model={value:ref(read())};
  if(includeTopUp)model.topUp=ref(__wtLongRun.topUpEnabled());
  model.toggle=async(k,v)=>{try{const next={...model.value.value,[k]:!!v};localStorage.setItem(key,JSON.stringify(next));model.value.value=next;await emit(event,{})}catch{toast('合成提醒设置保存失败')}};
  model.setTopUp=event=>{
   const input=event.target;
   try{localStorage.setItem(__wtLongRun.topUpKey,input.checked?'1':'0');model.topUp.value=input.checked}
   catch{input.checked=model.topUp.value;toast('低保设置保存失败')}
  };
  return model;
 }
 function renderSettings(h,model){const node=h('section',{class:'wt-synthesis-settings',style:{padding:'16px 0',borderTop:'1px solid #ead8bd',color:'#8e5e43'}},[h('h3',{style:{fontSize:'15px',margin:'0 0 8px'}},'合成提醒'),...[["same","平阶合成提醒（5 个重复素材）"],["upgrade","升阶合成提醒（10 个重复素材）"]].map(([k,text])=>h('label',{style:{display:'flex',alignItems:'center',gap:'8px',margin:'10px 0',fontSize:'13px'}},[h('input',{type:'checkbox',checked:model.value.value[k],onChange:e=>model.toggle(k,e.target.checked)}),h('span',null,text)])),h('p',{style:{fontSize:'12px',lineHeight:'1.6',margin:'6px 0',color:'#987e69'}},'同类别、同稀有度汇总，每种素材保留 1 个；最高稀有度不提醒升阶。库存满足条件时在人物右上方显示，不自动合成。')],512);node.patchFlag=-2;return node}
 function renderBasicSettings(h,model){
  const topUp=h('label',{style:{display:'flex',alignItems:'center',gap:'8px',margin:'10px 0',color:'#8e5e43'}},[
   h('input',{type:'checkbox',checked:model.topUp.value,onChange:model.setTopUp}),
   h('span',null,'低保：剩余点击数低于 10000 时自动 +10000')
  ],512);
  topUp.patchFlag=-2;
  const group=h('div',null,[topUp,renderSettings(h,model)],512);
  group.patchFlag=-2;
  return group;
 }
 return{key,event,read,analyze,create,settings,renderSettings,renderBasicSettings};
})();
export {__wtSynthesis};
