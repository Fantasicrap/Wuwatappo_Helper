// Public catalog/images only. No login, inventory, or room operations.
const fs=require('fs'),path=require('path');
const base='https://mc-wuwatappo.kurogames-global.com',out=path.resolve('dist/配件全素材');
async function get(url,json=true){const response=await fetch(url,{signal:AbortSignal.timeout(20000)});if(!response.ok)throw Error(response.status+' '+url);return json?response.json():Buffer.from(await response.arrayBuffer())}
const safe=s=>s.replace(/[<>:"/\\|?*\x00-\x1f]/g,'_'),escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const [atlas,index,dictionaryIndex]=await Promise.all([get('https://api-mc-wuwatappo.kurogames-global.com/api/common/atlas'),get(base+'/app/json-host/appearance_asset_host.json'),get(base+'/app/json-host/dict_host.json')]);
 if(atlas.code!==0&&atlas.code!==200)throw Error('Atlas response '+atlas.code);
 const [catalog,dict]=await Promise.all([get(index.url),get(dictionaryIndex.url.zh)]),rows=[],tasks=[];
 for(const item of atlas.data.filter(item=>item.asset_type==='accessory_atlas').sort((a,b)=>Number(a.asset_code)-Number(b.asset_code))){
  const thumb=catalog.accessory_atlas[item.asset_id],renderId=thumb?.height_light_id,render=catalog.accessory[renderId];if(!thumb||!render)throw Error('Unmapped atlas '+item.asset_id);
  const name=dict.accessory?.[item.asset_code]||item.asset_name,folder=safe(item.asset_code+'-'+name),dir=path.join(out,folder);fs.mkdirSync(dir,{recursive:true});
  rows.push({code:item.asset_code,name,folder,atlasId:item.asset_id,renderId,renderUrl:base+'/'+render.url,atlasUrl:base+'/'+thumb.url});
  for(const [filename,asset]of [['桌宠.png',render],['图鉴.png',thumb]])tasks.push({filename:path.join(dir,filename),url:base+'/'+asset.url});
 }
 let cursor=0,downloaded=0;await Promise.all(Array.from({length:4},async()=>{while(cursor<tasks.length){const task=tasks[cursor++];if(fs.existsSync(task.filename))continue;const bytes=await get(task.url,false);if(bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw Error('Not PNG '+task.url);fs.writeFileSync(task.filename,bytes);downloaded++}}));
 fs.writeFileSync(path.join(out,'素材索引.json'),JSON.stringify({date:'2026-11-02',source:base,scope:'all accessories in public catalog; not ownership',count:rows.length,rows},null,2));
 fs.writeFileSync(path.join(out,'配件预览.html'),'<!doctype html><meta charset="utf-8"><title>WuwaTappo 全配件素材</title><style>body{font:15px "Microsoft YaHei",sans-serif;background:#f5f0e7;color:#67472f;margin:24px}h1{font-size:24px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px}article{padding:14px;border:1px solid #e5c6a4;border-radius:14px;background:#fff9ed}img{width:100%;aspect-ratio:1;object-fit:contain;background:#bacbd6;border-radius:10px}h2{font-size:16px;min-height:44px}a{color:#8b5230}small{display:block;color:#896f5a;margin:8px 0}</style><h1>WuwaTappo 全配件素材（'+rows.length+' 款）</h1><p>来自官方公开图鉴与素材目录，包含未持有配件。点击“桌宠原图”查看实际叠加层；“图鉴图片”用于识别外观。编号通过图鉴 height_light_id 映射，未按列表位置推断。</p><div class="grid">'+rows.map(row=>{const rel=encodeURIComponent(row.folder)+'/';return '<article id="item-'+escape(row.code)+'"><img loading="lazy" src="'+rel+encodeURIComponent('图鉴.png')+'"><h2>'+escape(row.code+' · '+row.name)+'</h2><small>图鉴ID '+row.atlasId+' ／ 桌宠ID '+row.renderId+'</small><a href="'+rel+encodeURIComponent('桌宠.png')+'">桌宠原图</a>　<a href="'+rel+encodeURIComponent('图鉴.png')+'">图鉴图片</a></article>'}).join('')+'</div>');
 console.log(JSON.stringify({directory:out,accessories:rows.length,images:tasks.length,downloaded,targets:rows.filter(row=>['1124','1125'].includes(row.code))},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
