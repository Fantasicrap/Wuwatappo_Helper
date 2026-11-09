// Kept in the shared resource: the panel resource has a fixed compressed footprint.
const __wtInventoryShare=(()=>{
  const kinds=[['character_skin','角色'],['accessory','配件'],['emote','表情']];
  const rarityOrder=['epic','rare','uncommon','common'];
  const rarityFiles={common:'atlas-thumb-1-BLGUkvwT.png',uncommon:'atlas-thumb-2-CSkXBHLD.png',rare:'atlas-thumb-3-Cf7ixdnU.png',epic:'atlas-thumb-4-CDuzFic3.png'};
  const rarityLegend=[
    ['common','Common','#8bc5ab','90%'],
    ['uncommon','Uncommon','#83add3','9.5%'],
    ['rare','Rare','#b092ce','0.49%'],
    ['epic','Epic','#e8bb67','0.01%']
  ];
  const collator=new Intl.Collator('zh-Hans-CN-u-co-pinyin',{numeric:true,sensitivity:'base'});
  const width=1000,pad=30,gap=14,columns=5,cell=(width-pad*2-gap*4)/5,rowHeight=206,maxHeight=32000;
  function translated(prefix,value,fallback){
    const key=prefix+value;
    try{const name=dictLookup(prefix==='select_role_'?'character':'series',String(value));if(name)return name}catch{}
    try{const zh=i18n.global.getLocaleMessage('zh'),result=zh?.[key]??i18n.global.t(key);if(result&&result!==key)return String(result)}catch{}
    return fallback;
  }
  function roleName(item){
    const id=String(item.role_id??item.game_role_id??'').trim();
    return String(item.role_name??'').trim()||translated('select_role_',id,id&&id!=='0'?'角色 '+id:'通用');
  }
  function seriesName(item){
    const raw=String(item.series_name??item.series_id??'').trim()||(String(item.asset_name??'').match(/^role_\d+_(\d+)/)?.[1]??'');
    return translated('select_series_',raw,raw||'未分类系列');
  }
  function compare(a,b){
    const rank=item=>{const index=rarityOrder.indexOf(String(item.rarity).toLowerCase());return index<0?rarityOrder.length:index};
    return rank(a)-rank(b)||collator.compare(seriesName(a),seriesName(b))||collator.compare(roleName(a),roleName(b))||a.asset_id-b.asset_id;
  }
  function owned(items){
    const found=new Map();
    for(const source of Array.isArray(items)?items:[]){
      if(!source||!kinds.some(([type])=>type===source.asset_type))continue;
      const id=Number(source.asset_id),quantity=Number(source.quantity);
      if(!Number.isSafeInteger(id)||id<=0||id>=1e9||!Number.isSafeInteger(Math.floor(quantity))||quantity<1)continue;
      const item={...source,asset_id:id,quantity:Math.floor(quantity)},key=item.asset_type+':'+id;
      // Duplicate snapshots represent the same stack, not additional ownership.
      if(!found.has(key)||found.get(key).quantity<item.quantity)found.set(key,item);
    }
    return kinds.map(([type,title])=>({type,title,items:[...found.values()].filter(item=>item.asset_type===type).sort(compare)}));
  }
  function layout(groups,limit=maxHeight,top=234){
    if(limit<440)throw Error('图片高度限制过小');
    const pages=[];let page={blocks:[],y:top};
    const finish=()=>{page.height=page.y+40;pages.push(page);page={blocks:[],y:top}};
    for(const group of groups){
      let index=0,continued=false;
      do{
        if(page.y+50+rowHeight+40>limit&&page.blocks.length)finish();
        const capacity=Math.max(1,Math.floor((limit-page.y-50-40)/rowHeight));
        const items=group.items.slice(index,index+capacity*columns);
        const rows=Math.max(1,Math.ceil(items.length/columns));
        page.blocks.push({title:group.title+(continued?'（续）':''),total:group.items.length,items,y:page.y});
        page.y+=50+rows*rowHeight;index+=items.length;
        if(index<group.items.length){finish();continued=true}
      }while(index<group.items.length);
    }
    if(page.blocks.length)finish();
    return pages;
  }
  function positions(page){
    return page.blocks.flatMap(block=>block.items.map((item,index)=>({item,x:pad+(index%columns)*(cell+gap),y:block.y+50+Math.floor(index/columns)*rowHeight})));
  }
  async function image(url,signal){
    // Use the same img-src route as the inventory UI, including its data-URI texture.
    return new Promise((resolve,reject)=>{
      const img=new Image();if(!String(url).startsWith('data:'))img.crossOrigin='anonymous';
      const clean=()=>{clearTimeout(timer);img.onload=null;img.onerror=null;signal?.removeEventListener('abort',cancel)};
      const cancel=()=>{clean();img.src='';reject(Error('已取消生成'))};
      const timer=setTimeout(()=>{clean();img.src='';reject(Error('素材加载超时'))},15000);
      signal?.addEventListener('abort',cancel,{once:true});if(signal?.aborted){cancel();return}
      img.onload=()=>{clean();resolve(img)};
      img.onerror=()=>{clean();reject(Error('素材加载失败'))};img.src=url;
    });
  }
  function caption(item){
    let name;try{name=resolveAssetDisplayName(item.asset_type,item.asset_name)}catch{}
    return name||'名称未加载 #'+item.asset_id;
  }
  function text(ctx,value,x,y,maxSize){
    let output=String(value);while(output.length&&ctx.measureText(output).width>maxSize)output=output.slice(0,-1);
    ctx.fillText(output===String(value)?output:output.slice(0,-1)+'…',x,y);
  }
  async function background(doc,signal){
    const element=doc.querySelector('.module-content__bg');
    if(!element)throw Error('未找到原版背景，请在库存面板重试');
    const style=getComputedStyle(element),pattern=getComputedStyle(element,'::before');
    const match=pattern.backgroundImage.match(/^url\(["']?(.*?)["']?\)$/);
    if(!match)throw Error('原版背景纹理尚未加载，请重试');
    const loaded=[];
    try{
      for(const [rarity,file] of Object.entries(rarityFiles))loaded.push([rarity,await image(new URL('/assets/'+file,doc.baseURI).href,signal)]);
      return {color:style.backgroundColor,pattern:await image(match[1],signal),frames:Object.fromEntries(loaded),opacity:Number.isFinite(Number(pattern.opacity))?Number(pattern.opacity):1};
    }catch(error){loaded.forEach(([,bitmap])=>bitmap.close?.());throw error}
  }
  function composition(groups){
    const counts={common:0,uncommon:0,rare:0,epic:0};
    let total=0,unknown=0;
    for(const group of groups)for(const item of group.items){
      const rarity=String(item.rarity).toLowerCase();
      if(Object.hasOwn(counts,rarity)){counts[rarity]+=item.quantity;total+=item.quantity}
      else unknown+=item.quantity;
    }
    return {counts,total,unknown};
  }
  function drawRarity(ctx,{counts,total,unknown}){
    ctx.fillStyle='#fff9ed';ctx.strokeStyle='#dfc5a2';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.roundRect(580,18,390,196,16);ctx.fill();ctx.stroke();
    ctx.fillStyle='#8e5e43';ctx.font='bold 19px "Microsoft YaHei",sans-serif';
    ctx.fillText('稀有度占比',600,49);
    ctx.font='12px "Microsoft YaHei",sans-serif';
    ctx.fillText('当前库存',832,73);ctx.fillText('官方参考',907,73);
    const cx=667,cy=126,r=56;let angle=-Math.PI/2;
    if(!total){ctx.fillStyle='#ddd3c5';ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill()}
    rarityLegend.forEach(([key,name,color,reference],index)=>{
      const ratio=total?counts[key]/total:0;
      if(ratio){
        const end=angle+Math.PI*2*ratio;ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(cx,cy);
        ctx.arc(cx,cy,r,angle,end);ctx.closePath();ctx.fill();angle=end;
      }
      const y=99+index*27;
      ctx.fillStyle=color;ctx.fillRect(733,y-11,11,11);
      ctx.fillStyle='#79583f';ctx.font='13px "Microsoft YaHei",sans-serif';
      ctx.fillText(name,750,y);ctx.fillText(total?(ratio>0&&ratio<.0001?'<0.01%':(ratio*100).toFixed(2)+'%'):'—',832,y);
      ctx.fillText(reference,907,y);
    });
    ctx.fillStyle='#8e7b6a';ctx.font='14px "Microsoft YaHei",sans-serif';
    ctx.fillText('按当前库存件数统计，包含重复物品',pad,112);
    if(unknown)ctx.fillText('未识别稀有度 '+unknown+' 件，未计入饼图',pad,137);
  }
  async function draw(page,groups,options){
    const canvas=options.document.createElement('canvas');canvas.width=width;canvas.height=page.height;
    const ctx=canvas.getContext('2d');if(!ctx)throw Error('无法创建图片画布');
    let failed=0;
    try{
      ctx.fillStyle=options.background.color;ctx.fillRect(0,0,width,page.height);
      ctx.globalAlpha=options.background.opacity;ctx.fillStyle=ctx.createPattern(options.background.pattern,'repeat');ctx.fillRect(0,0,width,page.height);ctx.globalAlpha=1;
      ctx.fillStyle='#8e5e43';ctx.font='bold 32px "Microsoft YaHei", sans-serif';ctx.fillText('WuwaTappo · 我的库存',pad,48);
      ctx.font='17px "Microsoft YaHei", sans-serif';
      ctx.fillText(groups.map(group=>group.title+' '+group.items.length+' 种').join('　'),pad,80);
      drawRarity(ctx,options.composition??composition(groups));
      for(const block of page.blocks){
        ctx.font='bold 25px "Microsoft YaHei", sans-serif';ctx.fillStyle='#8e5e43';ctx.fillText(block.title+'  /  '+block.total+' 种',pad,block.y+31);
        if(!block.items.length){ctx.font='18px "Microsoft YaHei", sans-serif';ctx.fillText('暂无已拥有的'+block.title,pad,block.y+95)}
      }
      const slots=positions(page);let next=0;
      async function worker(){
        while(next<slots.length){
          if(options.signal?.aborted)return;
          const {item,x,y}=slots[next++];let bitmap;
          const frame=options.background.frames[String(item.rarity).toLowerCase()]??options.background.frames.common;
          ctx.drawImage(frame,x+8,y+4,cell-16,(cell-16)*97/110);
          try{
            bitmap=await options.loadImage(options.resolveUrl(item));
            const size=Math.min((cell-20)/bitmap.width,126/bitmap.height);
            if(!Number.isFinite(size)||size<=0)throw Error('无效的图片尺寸');
            const w=bitmap.width*size,h=bitmap.height*size;ctx.drawImage(bitmap,x+(cell-w)/2,y+7+(126-h)/2,w,h);
          }catch{if(options.signal?.aborted)return;failed++;ctx.fillStyle='#a44b37';ctx.font='16px "Microsoft YaHei", sans-serif';ctx.fillText('素材加载失败',x+22,y+72)}
          finally{bitmap?.close?.()}
          ctx.fillStyle='#8e5e43';ctx.font='15px "Microsoft YaHei", sans-serif';text(ctx,caption(item),x+9,y+165,cell-18);
          ctx.font='12px "Microsoft YaHei", sans-serif';text(ctx,seriesName(item),x+9,y+185,cell-18);
          ctx.fillStyle='#8e5e43';ctx.fillRect(x+cell-63,y+8,55,24);ctx.fillStyle='#ffffff';ctx.font='bold 14px "Microsoft YaHei", sans-serif';ctx.fillText('×'+(item.quantity>9999?'9999+':item.quantity),x+cell-58,y+25);
          options.progress();
        }
      }
      await Promise.all(Array.from({length:Math.min(6,slots.length)},worker));
      if(options.signal?.aborted)throw Error('已取消生成');
      ctx.fillStyle='#8e5e43';ctx.font='14px "Microsoft YaHei", sans-serif';
      ctx.fillText(options.timestamp+(failed?'　有 '+failed+' 个素材未加载，请重试':'')+'　'+options.pageLabel,pad,page.height-15);
      const blob=await new Promise((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(Error('PNG导出失败')),'image/png'));
      return {blob,failed,width,height:page.height};
    }finally{canvas.width=1;canvas.height=1}
  }
  function preview(doc,cancel){
    const root=doc.createElement('div');
    root.style.cssText='position:fixed;inset:12px;z-index:2147483647;background:#fff3dd;border:2px solid #e7b77c;border-radius:16px;display:flex;flex-direction:column;padding:16px;gap:12px;color:#8e5e43;font:16px "Microsoft YaHei",sans-serif;box-shadow:0 8px 32px #0003;';
    const bar=doc.createElement('div'),status=doc.createElement('span'),close=doc.createElement('button'),list=doc.createElement('div');
    bar.style.cssText='display:flex;align-items:center;gap:10px;flex:none';status.style.flex='1';list.style.cssText='overflow:auto;flex:1;min-height:0;';
    const urls=[];let busy=true;
    const button=(label,action)=>{const b=doc.createElement('button');b.textContent=label;b.style.cssText='position:static;background:#fed291;color:#8e5e43;border:1px solid #e7b77c;border-radius:14px;padding:8px 14px;cursor:pointer;font:inherit;';b.onclick=action;return b};
    close.textContent='取消';close.style.cssText='position:static;cursor:pointer;padding:8px 14px;font:inherit;';
    close.onclick=()=>{if(busy)cancel();root.remove();urls.forEach(url=>URL.revokeObjectURL(url))};
    root.addEventListener('mousedown',event=>event.stopPropagation());root.addEventListener('click',event=>event.stopPropagation());
    bar.append(status,close);root.append(bar,list);doc.body.append(root);
    return {
      status(value){status.textContent=value},
      finish(){busy=false;close.textContent='关闭'},
      add(result,name){
        const url=URL.createObjectURL(result.blob);urls.push(url);
        const tools=doc.createElement('div'),img=doc.createElement('img');tools.style.cssText='display:flex;gap:10px;margin:8px 0;';
        const save=doc.createElement('a');save.href=url;save.download=name;save.textContent='保存 PNG';save.style.cssText='color:#8e5e43;background:#fed291;border-radius:14px;padding:8px 14px;text-decoration:none;';
        tools.append(save,button('复制图片',async()=>{
          try{if(!navigator.clipboard?.write||typeof ClipboardItem==='undefined')throw Error();await navigator.clipboard.write([new ClipboardItem({'image/png':result.blob})]);status.textContent='已复制，可以粘贴分享'}
          catch{status.textContent='复制未成功，请使用“保存 PNG”'}
        }));
        img.src=url;img.alt=name;img.style.cssText='display:block;width:100%;height:auto;';list.append(tools,img);
      }
    };
  }
  function create(ref,get,notify){
    const busy=ref(false),label=ref('分享库存长图');
    async function run(){
      if(busy.value)return;
      const snapshot=get();
      if(!snapshot.loggedIn){notify('请登录后分享已拥有的库存');return}
      if(snapshot.loading){notify('库存仍在加载，请稍后重试');return}
      const account=String(snapshot.user?.id??'');
      if(!/^\d+$/.test(account)||Number(account)<=0){notify('账号状态无效，请重新读取库存');return}
      const checkAccount=()=>{
        const current=get();
        if(!current.loggedIn||String(current.user?.id??'')!==account)throw Error('账号已切换，请重新读取库存');
      };
      const groups=owned(snapshot.items),total=groups.reduce((sum,group)=>sum+group.items.length,0);
      if(!total){notify('当前没有可分享的库存');return}
      busy.value=true;const controller=new AbortController(),ui=preview(document,()=>controller.abort());let bg;
      try{
        label.value='正在生成…';ui.status('正在读取 WuwaTappo 背景…');bg=await background(document,controller.signal);
        checkAccount();
        const stats=composition(groups),pages=layout(groups,maxHeight),date=new Date(),timestamp=date.toLocaleString(),stamp=date.toISOString().replace(/[:.]/g,'-');let done=0,failed=0;
        for(let index=0;index<pages.length;index++){
          if(controller.signal.aborted)throw Error('已取消生成');
          const result=await draw(pages[index],groups,{document,composition:stats,background:bg,signal:controller.signal,loadImage:url=>image(url,controller.signal),resolveUrl:item=>resolveBagAppearanceImageUrl(snapshot.host,item),timestamp,pageLabel:(index+1)+' / '+pages.length,progress(){done++;ui.status('正在生成 '+done+' / '+total)}});
          if(controller.signal.aborted)throw Error('已取消生成');
          checkAccount();
          failed+=result.failed;ui.add(result,'WuwaTappo-库存-'+stamp+(pages.length>1?'-'+(index+1):'')+'.png');
        }
        ui.status(failed?'已生成，有 '+failed+' 个素材加载失败；关闭后重试可补全':pages.length>1?'已生成 '+pages.length+' 张长图（库存较多，已分段）':'长图已生成，可保存或复制分享');
      }catch(error){ui.status('生成失败：'+String(error?.message||error))}
      finally{bg?.pattern?.close?.();Object.values(bg?.frames??{}).forEach(bitmap=>bitmap.close?.());busy.value=false;label.value='分享库存长图';ui.finish()}
    }
    return {busy,label,run};
  }
  function render(h,model){
    __wtPanelLayout.styles();
    const node=h('section',{class:'wt-ui-feature','aria-label':'库存分享'},[
      h('header',null,[
        h('div',null,[h('h3',{class:'wt-ui-card-title'},'库存分享'),h('p',null,'按角色、配件和表情分组生成长图。')]),
        __wtPanelLayout.button(h,model.label.value,event=>{event.stopPropagation();model.run()},
          {class:'wt-ui-button wt-ui-button--primary',disabled:model.busy.value,onMousedown:event=>event.stopPropagation()})
      ])
    ],512);
    node.patchFlag=-2;
    return node;
  }
  return {owned,layout,positions,composition,draw,create,render,compare,roleName,seriesName,caption,rarityFiles,width,columns,maxHeight};
})();
async function __wtNormalPanel(panel){
  await panel.setAlwaysOnTop(false);
  try{await panel.setSkipTaskbar(false)}catch(error){console.warn('[panel] taskbar setting failed',error)}
}
export {__wtInventoryShare,__wtNormalPanel};
