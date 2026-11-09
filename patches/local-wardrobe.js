const __wtLocalWardrobe=(()=>{
 const key='wuwatappo-atlas-preview-v1',prefix='wuwatappo-local-wardrobe-v1:';
 const enabled=()=>{try{return localStorage.getItem(key)==='1'}catch{return false}};
 const kind=item=>String(item?.asset_type??'').replace(/_atlas$/,'');
 function resolve(item){const type=kind(item),id=resolvePetAssetIdFromAppearanceId(Number(item?.asset_id)),meta=getAppearanceAssetById(id);if(!['character_skin','accessory','emote'].includes(type)||!meta||meta.asset_type!==type)throw Error('素材目录尚未就绪或素材类型不匹配');const name=resolveAppearanceAssetFileName(id);if(!name)throw Error('素材地址尚未加载');return{id,name,type,meta}}
 const validIds=ids=>[...new Set((Array.isArray(ids)?ids:[]).filter(id=>Number.isSafeInteger(id)&&id>0))].slice(0,6);
 function create({ref,account,user,getShown,setCharacter,setAccessory,cloudEmotes,setEmotes,toast,changed=()=>{}}){
  const characterId=ref(0),accessoryId=ref(null),emoteIds=ref(null),mode=ref(enabled());let owner=account(),started=false,busy=false,disposed=false,record={characterId:0,accessoryId:null,emoteIds:null};const fallback={...getShown()};
  function readRecord(){try{const value=JSON.parse(localStorage.getItem(prefix+owner)||'{}');return{characterId:Number.isSafeInteger(value.characterId)&&value.characterId>0?value.characterId:0,accessoryId:value.accessoryId===0||Number.isSafeInteger(value.accessoryId)&&value.accessoryId>0?value.accessoryId:null,emoteIds:Array.isArray(value.emoteIds)?validIds(value.emoteIds):null}}catch{return{characterId:0,accessoryId:null,emoteIds:null}}}
  function restore(){const current=user();setCharacter(getUserCharacterAssetName(current)||fallback.character);setAccessory(current?getUserAccessoryAssetName(current)||null:fallback.accessory);setEmotes(null)}
  function reapply(){if(!started||disposed)return;characterId.value=mode.value?record.characterId:0;accessoryId.value=mode.value?record.accessoryId:null;emoteIds.value=mode.value?record.emoteIds:null;if(characterId.value){const name=resolveAppearanceAssetFileName(characterId.value);if(name&&getShown().character!==name)setCharacter(name)}if(accessoryId.value!==null){const name=accessoryId.value?resolveAppearanceAssetFileName(accessoryId.value):null;if((name||accessoryId.value===0)&&getShown().accessory!==name)setAccessory(name)}setEmotes(emoteIds.value===null?null:emoteIds.value.map(id=>({id,name:resolveAppearanceAssetFileName(id)})).filter(item=>item.name&&getAppearanceAssetById(item.id)?.asset_type==='emote'))}
  function sync(){const before=mode.value;mode.value=enabled();if(before&&!mode.value){characterId.value=0;accessoryId.value=null;emoteIds.value=null;restore()}reapply();changed()}
  function clear(){try{const next={characterId:0,accessoryId:null,emoteIds:null};localStorage.setItem(prefix+owner,JSON.stringify(next));record=next;characterId.value=0;accessoryId.value=null;emoteIds.value=null;restore();changed();toast('已恢复云端外观和表情栏')}catch{toast('恢复外观失败，请重试')}}
  async function select(item){if(disposed||!mode.value||busy)return;busy=true;try{const value=resolve(item);if(value.type==='emote'){const ids=record.emoteIds??validIds(cloudEmotes().map(item=>item.id)),present=ids.includes(value.id);if(!present&&ids.length>=6)throw Error('本地表情栏已满，请先卸下一格表情');const next={...record,emoteIds:present?ids.filter(id=>id!==value.id):[...ids,value.id]};localStorage.setItem(prefix+owner,JSON.stringify(next));record=next;reapply();toast(present?'已从本地表情栏卸下':'已加入本地表情栏');changed();return}
   const next={...record,[value.type==='character_skin'?'characterId':'accessoryId']:value.id};localStorage.setItem(prefix+owner,JSON.stringify(next));record=next;reapply();changed();toast('已本地试装，云端角色和配件保持不变')
  }catch(error){toast('图鉴试装失败：'+(error?.message||'请重试'))}finally{busy=false}}
  const stop=watch(()=>[getAppearanceAssetById(characterId.value)?.url,getAppearanceAssetById(accessoryId.value)?.url,...(emoteIds.value??[]).map(id=>getAppearanceAssetById(id)?.url)],reapply);
  return{characterId,accessoryId,emoteIds,select,sync,clear,reapply,start(){started=true;owner=account();record=readRecord();reapply()},accountChanged(){owner=account();record=readRecord();characterId.value=0;accessoryId.value=null;emoteIds.value=null;restore();reapply();changed()},role(base){if(mode.value&&characterId.value){const meta=getAppearanceAssetById(characterId.value);return{id:meta?.game_role_id??0,name:resolveAppearanceAssetFileName(characterId.value)}}return base},offset(original){if(mode.value&&characterId.value){const meta=getAppearanceAssetById(characterId.value);return{x:Number(meta?.offset_x)||0,y:Number(meta?.offset_y)||0}}return original()},dispose(){disposed=true;stop()}};
 }
 function settings(ref,toast){const model={mode:ref(enabled())};model.toggle=async value=>{try{localStorage.setItem(key,value?'1':'0');model.mode.value=!!value;await emit('wt-wardrobe-mode-updated',{});toast(value?'图鉴试装已开启':'图鉴试装已关闭，恢复云端外观')}catch{toast('图鉴试装设置保存失败')}};model.reset=()=>emit('wt-wardrobe-reset',{}).catch(()=>toast('恢复外观失败'));return model}
 function canEmote(item,ids){const id=resolvePetAssetIdFromAppearanceId(Number(item.asset_id));return ids.includes(id)||ids.length<6}
 function selected(item,name){if(!name)return false;const id=resolvePetAssetIdFromAppearanceId(Number(item.asset_id));return resolveAppearanceAssetFileName(id).replace(/\.png$/i,'')===String(name).replace(/\.png$/i,'')}
 function renderSettings(h,model){
  const node=h('section',{class:'wt-atlas-preview-settings',style:{padding:'10px 12px',margin:'0 0 10px',border:'1px solid #e3c9aa',borderRadius:'14px',background:'#fff9ed',color:'#694832'}},[
   h('div',{style:{display:'flex',gap:'8px',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap'}},[
    h('label',{style:{display:'flex',gap:'8px',alignItems:'center',fontSize:'15px',fontWeight:'600'}},[
     h('input',{type:'checkbox',checked:model.mode.value,onChange:event=>model.toggle(event.target.checked)}),h('span',null,'启用图鉴试装')]),
    h('button',{type:'button',style:{position:'static',font:'inherit',padding:'5px 10px',border:'1px solid #d6ae83',borderRadius:'9px',background:'#fffaf1',color:'#68452f'},onClick:model.reset},'恢复云端外观')
   ]),
   h('p',{style:{fontSize:'12px',lineHeight:'1.5',margin:'6px 0 0',color:'#775e4b'}},'试装在本机生效。表情最多六槽，再点已选表情可卸下。')
  ],512);
  node.patchFlag=-2;
  return node;
 }
 return{key,kind,resolve,create,settings,canEmote,selected,renderSettings};
})();
export {__wtLocalWardrobe};
