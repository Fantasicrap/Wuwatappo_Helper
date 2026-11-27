// The atlas and the on-screen pet use different asset IDs. Export the
// illustrated atlas image that belongs to the currently displayed pet.
const __wtPostcard=(()=>{
 const tr=value=>typeof __wtLocale==='undefined'?value:__wtLocale.translate(value);
 const palettes={
  default:{bgTop:'#fffaf0',bgBottom:'#f7ead3',veil:'rgba(255,248,233,0.82)',accent:'#c89556',soft:'#e6cfa8',ink:'#634738',muted:'#8b6e58',stamp:'#b57a3c'},
  aemeath:{bgTop:'#fff6fa',bgBottom:'#fce0ed',veil:'rgba(255,242,248,0.80)',accent:'#df639c',soft:'#f0b3cd',ink:'#793050',muted:'#8c5871',stamp:'#45b8cc'},
  denia:{bgTop:'#fcf9ff',bgBottom:'#eae0f6',veil:'rgba(249,244,253,0.82)',accent:'#9676bc',soft:'#cbb9e2',ink:'#493561',muted:'#6a597c',stamp:'#7658a3'},
  phrolova:{bgTop:'#fdf4f7',bgBottom:'#f0d4df',veil:'rgba(251,237,243,0.82)',accent:'#ad4c73',soft:'#d69eb4',ink:'#54243a',muted:'#7a475f',stamp:'#8e3254'}
 };
 const bgKeys={aemeath:'wuwatappo-aemeath-background-v1',denia:'wuwatappo-denia-background-v1',phrolova:'wuwatappo-phrolova-background-v1'};
 function savedBg(theme){
  try{
   const raw=bgKeys[theme]&&localStorage.getItem(bgKeys[theme]);
   return /^data:image\/(?:webp|jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(raw??'')?raw:'';
  }catch{return ''}
 }
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
 function wrapLines(ctx,text,maxWidth,maxLines){
  const lines=[];let line='';
  for(const ch of String(text)){
   if(ch==='\n'){if(line)lines.push(line);line='';if(lines.length>=maxLines)break;continue}
   const next=line+ch;
   if(ctx.measureText(next).width>maxWidth&&line){
    lines.push(line);line=ch.trimStart();
    if(lines.length>=maxLines-1)break;
   }else line=next;
  }
  const restIndex=lines.join('').length+line.length;
  if(lines.length<maxLines){
   let tail=line+String(text).slice(restIndex).replace(/\n+/g,' ');
   while(tail.length>1&&ctx.measureText(tail).width>maxWidth)tail=tail.slice(0,-1);
   if(tail.length<line.length+String(text).slice(restIndex).length)tail=tail.slice(0,-1)+'…';
   if(tail)lines.push(tail);
  }
  return lines.length?lines:[''];
 }
 function draw(canvas,role,accessory,caption,trial,theme,options={}){
  canvas.width=800;canvas.height=560;
  const ctx=canvas.getContext('2d'),p=palettes[theme]||palettes.default;
  const grad=ctx.createLinearGradient(0,0,800,560);
  grad.addColorStop(0,p.bgTop);grad.addColorStop(1,p.bgBottom);
  ctx.fillStyle=grad;ctx.fillRect(0,0,800,560);
  if(options.bgImage){
   const scale=Math.max(800/options.bgImage.width,560/options.bgImage.height);
   const bw=options.bgImage.width*scale,bh=options.bgImage.height*scale;
   ctx.drawImage(options.bgImage,(800-bw)/2,(560-bh)/2,bw,bh);
   ctx.fillStyle=p.veil;ctx.fillRect(0,0,800,560);
  }
  ctx.strokeStyle=p.accent;ctx.lineWidth=3.5;
  ctx.beginPath();ctx.roundRect(16,16,768,528,18);ctx.stroke();
  ctx.strokeStyle=p.soft;ctx.lineWidth=1.2;
  ctx.beginPath();ctx.roundRect(24,24,752,512,13);ctx.stroke();
  ctx.fillStyle=p.accent;ctx.font='bold 22px "Microsoft YaHei", sans-serif';ctx.textAlign='left';ctx.fillText('WuwaTappo',48,62);
  ctx.textAlign='right';ctx.font='600 18px "Microsoft YaHei", sans-serif';ctx.fillText(tr(trial?'图鉴试装':'桌宠明信片'),752,62);
  ctx.textAlign='center';
  function place(asset,x,y,w,h){
   const scale=Math.min(w/asset.img.width,h/asset.img.height);
   const dw=asset.img.width*scale,dh=asset.img.height*scale;ctx.drawImage(asset.img,x-dw/2,y+(h-dh)/2,dw,dh);
  }
  const roleX=accessory?305:400;place(role,roleX,86,390,285);
  ctx.fillStyle=p.ink;ctx.font='bold 25px "Microsoft YaHei", sans-serif';ctx.fillText(role.name,roleX,414,accessory?420:680);
  if(accessory){
   place(accessory,605,153,185,170);ctx.fillStyle=p.muted;ctx.font='20px "Microsoft YaHei", sans-serif';ctx.fillText(accessory.name,605,414,240);
  }
  ctx.strokeStyle=p.soft;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(56,444);ctx.lineTo(744,444);ctx.stroke();
  ctx.fillStyle=p.ink;ctx.font='21px "Microsoft YaHei", sans-serif';
  const lines=wrapLines(ctx,caption||tr('来自桌面的一张明信片'),options.stamp?505:670,2);
  const startY=lines.length>1?479:497;
  lines.forEach((line,i)=>ctx.fillText(line,options.stamp?328:400,startY+i*28));
  if(options.stamp){
   ctx.save();
   ctx.translate(690,492);ctx.rotate(-0.07);
   ctx.strokeStyle=p.stamp;ctx.lineWidth=1.6;ctx.fillStyle=p.bgTop;
   ctx.beginPath();ctx.roundRect(-64,-28,128,56,10);ctx.fill();ctx.stroke();
   ctx.setLineDash([3,3]);ctx.lineWidth=1;ctx.globalAlpha=0.55;
   ctx.beginPath();ctx.roundRect(-58,-22,116,44,6);ctx.stroke();
   ctx.setLineDash([]);ctx.globalAlpha=1;
   ctx.fillStyle=p.stamp;ctx.font='bold 12px Consolas, "Microsoft YaHei", sans-serif';
   ctx.fillText(options.stamp.date,0,-5);
   ctx.font='11px "Microsoft YaHei", sans-serif';
   ctx.fillText(options.stamp.clicks!==null?tr('点击 ')+options.stamp.clicks:'WuwaTappo',0,15);
   ctx.restore();
  }
 }
 async function run(get,caption,trial,useBg,showStamp){
  const controller=new AbortController(),ui=__wtInventoryShare.preview(document,()=>controller.abort());
  try{
   const {props,user}=get(),owner=user?.id,theme=__wtTheme.current;
   const role=item(props,user,'character_skin'),accessory=item(props,user,'accessory');
   ui.status(tr('正在制作明信片'));
   const bgData=useBg?savedBg(theme):'';
   const [,,bgImage]=await Promise.all([
    __wtInventoryShare.image(role.url,controller.signal).then(img=>{role.img=img}),
    accessory?__wtInventoryShare.image(accessory.url,controller.signal).then(img=>{accessory.img=img}):null,
    bgData?__wtInventoryShare.image(bgData,controller.signal).catch(()=>null):null
   ]);
   const now=new Date();
   const dateText=now.getFullYear()+'.'+String(now.getMonth()+1).padStart(2,'0')+'.'+String(now.getDate()).padStart(2,'0');
   const clicks=Number.isFinite(Number(user?.total_click_count))?Number(user.total_click_count):null;
   const stamp=showStamp?{date:dateText,clicks}:null;
   const canvas=document.createElement('canvas');
   draw(canvas,role,accessory,caption,trial,theme,{bgImage,stamp});
   const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
   if(controller.signal.aborted)return;
   if(get().user?.id!==owner)throw Error(tr('账号已切换，请重试'));
   if(!blob)throw Error(tr('PNG导出失败'));
   ui.add({blob},'WuwaTappo-Postcard-'+Date.now()+'.png');ui.status(tr('明信片已生成'));
  }catch(error){if(!controller.signal.aborted)ui.status(error.message)}
  finally{ui.finish()}
 }
 function render(h,model){
  const hasBg=!!savedBg(typeof __wtTheme!=='undefined'?__wtTheme.current:'default');
  return h('details',{class:'wt-ui-optional',style:{marginTop:'8px'}},[
   h('summary',null,'桌宠明信片'),
   h('div',{style:{display:'grid',gap:'8px',padding:'8px 0 4px'}},[
    h('div',{style:{display:'flex',alignItems:'end',gap:'8px',flexWrap:'wrap'}},[
     h('label',{style:{display:'grid',gap:'4px',flex:'1 1 150px',minWidth:'0'}},['明信片寄语',h('input',{type:'text',maxlength:60,style:{minWidth:'0',font:'inherit',padding:'5px 8px',border:'1px solid var(--wt-ui-border,#d6ae83)',borderRadius:'8px',background:'var(--wt-ui-field,#fffaf1)',color:'var(--wt-ui-text,#68452f)'},value:model.caption.value,onInput:e=>{model.caption.value=e.target.value}})]),
     __wtPanelLayout.button(h,'生成明信片',()=>run(model.appearance,model.caption.value.trim(),model.mode.value,model.useBg?.value!==false,model.showStamp?.value!==false),{class:'wt-ui-button wt-ui-button--primary'})
    ]),
    h('div',{class:'wt-ui-actions',style:{fontSize:'12px'}},[
     h('label',{class:'wt-ui-actions'},[h('input',{type:'checkbox',checked:model.showStamp?.value!==false,onChange:e=>{if(model.showStamp)model.showStamp.value=e.target.checked}}),'附加日期与计数印章']),
     hasBg?h('label',{class:'wt-ui-actions'},[h('input',{type:'checkbox',checked:model.useBg?.value!==false,onChange:e=>{if(model.useBg)model.useBg.value=e.target.checked}}),'融合自定义面板背景']):null
    ])
   ])
  ]);
 }
 return {render,draw,wrapLines};
})();
