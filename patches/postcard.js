// The atlas and the on-screen pet use different asset IDs. Export the
// illustrated atlas image that belongs to the currently displayed pet.
const __wtPostcard=(()=>{
 const tr=value=>typeof __wtLocale==='undefined'?value:__wtLocale.translate(value);
 const frames={default:'#c89556',aemeath:'#cf84a0',denia:'#9986be',phrolova:'#ac5968'};
 function item(props,user,type){
  const isRole=type==='character_skin';
  const file=String((isRole?props.selectedRoleId:props.selectedPartId)||'').replace(/\.png$/i,'');
  if(!file&&!isRole)return null;
  const candidates=(props.atlasList||[]).filter(row=>__wtLocalWardrobe.kind(row)===type);
  const cloudId=isRole?getUserCharacterAssetId(user):getUserAccessoryAssetId(user);
  const match=candidates.find(row=>file&&(__wtLocalWardrobe.selected(row,file)||String(row.asset_name||'').replace(/\.png$/i,'')===file))
   ||(!file&&candidates.find(row=>resolvePetAssetIdFromAppearanceId(row.asset_id)===cloudId));
  if(!match)throw Error(tr('当前装扮素材尚未就绪，请稍后重试'));
  return {url:resolveBagAppearanceImageUrl(props.assetsCdnHost,match),name:__wtInventoryShare.caption(match)};
 }
 function draw(canvas,role,accessory,caption,trial,theme){
  canvas.width=800;canvas.height=560;
  const ctx=canvas.getContext('2d'),accent=frames[theme]||frames.default;
  ctx.fillStyle='#fff8e9';ctx.fillRect(0,0,800,560);
  ctx.strokeStyle=accent;ctx.lineWidth=4;ctx.strokeRect(16,16,768,528);
  ctx.fillStyle=accent;ctx.font='bold 24px "Microsoft YaHei", sans-serif';ctx.fillText('WuwaTappo',48,65);
  ctx.textAlign='right';ctx.fillText(tr(trial?'图鉴试装':'桌宠明信片'),752,65);ctx.textAlign='center';
  function place(asset,x,y,w,h){
   const scale=Math.min(w/asset.img.width,h/asset.img.height);
   const dw=asset.img.width*scale,dh=asset.img.height*scale;ctx.drawImage(asset.img,x-dw/2,y+(h-dh)/2,dw,dh);
  }
  const roleX=accessory?305:400;place(role,roleX,86,390,285);
  ctx.fillStyle='#634738';ctx.font='bold 26px "Microsoft YaHei", sans-serif';ctx.fillText(role.name,roleX,415,accessory?420:680);
  if(accessory){
   place(accessory,605,153,185,170);ctx.font='20px "Microsoft YaHei", sans-serif';ctx.fillText(accessory.name,605,415,240);
  }
  ctx.strokeStyle=accent;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(56,448);ctx.lineTo(744,448);ctx.stroke();
  ctx.font='23px "Microsoft YaHei", sans-serif';ctx.fillText(caption||tr('来自桌面的一张明信片'),400,503,670);
 }
 async function run(get,caption,trial){
  const controller=new AbortController(),ui=__wtInventoryShare.preview(document,()=>controller.abort());
  try{
   const {props,user}=get(),owner=user?.id;
   const role=item(props,user,'character_skin'),accessory=item(props,user,'accessory');
   ui.status(tr('正在制作明信片'));
   await Promise.all([role,accessory].filter(Boolean).map(async asset=>{asset.img=await __wtInventoryShare.image(asset.url,controller.signal)}));
   const canvas=document.createElement('canvas');draw(canvas,role,accessory,caption,trial,__wtTheme.current);
   const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
   if(controller.signal.aborted)return;
   if(get().user?.id!==owner)throw Error(tr('账号已切换，请重试'));
   if(!blob)throw Error(tr('PNG导出失败'));
   ui.add({blob},'WuwaTappo-Postcard-'+Date.now()+'.png');ui.status(tr('明信片已生成'));
  }catch(error){if(!controller.signal.aborted)ui.status(error.message)}
  finally{ui.finish()}
 }
 function render(h,model){
  return h('details',{class:'wt-ui-optional',style:{marginTop:'8px'}},[
   h('summary',null,'桌宠明信片'),
   h('div',{style:{display:'flex',alignItems:'end',gap:'8px',flexWrap:'wrap',padding:'8px 0'}},[
    h('label',{style:{display:'grid',gap:'4px',flex:'1 1 150px',minWidth:'0'}},['明信片寄语',h('input',{type:'text',maxlength:36,style:{minWidth:'0',font:'inherit'},value:model.caption.value,onInput:e=>{model.caption.value=e.target.value}})]),
    __wtPanelLayout.button(h,'生成明信片',()=>run(model.appearance,model.caption.value.trim(),model.mode.value))
   ])
  ]);
 }
 return {render,draw};
})();
