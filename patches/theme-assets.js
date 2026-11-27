const helperThemeHost = 'http://127.0.0.1:48642';
let helperThemeIndex;

export function loadThemePacks(reload=false){
 if(!helperThemeIndex||reload){
  const request=fetch(helperThemeHost+'/theme-packs',{cache:'no-store',signal:AbortSignal.timeout(3500)})
   .then(response=>{if(!response.ok)throw Error('无法读取已安装的主题包。');return response.json()})
   .then(packs=>Object.fromEntries(['aemeath','denia','phrolova'].filter(id=>packs[id]).map(id=>{
    const pack=packs[id];
    const resource=value=>typeof value==='string'&&value.startsWith('/theme-assets/'+id+'/')?helperThemeHost+value:'';
    return [id,{...pack,background:resource(pack.background),toolbar:resource(pack.toolbar),tides:resource(pack.tides),
     mech:resource(pack.mech),songs:(pack.songs||[]).map(track=>({...track,url:resource(track.url)})).filter(track=>track.url)}];
   })));
  helperThemeIndex=request;
  request.catch(()=>{if(helperThemeIndex===request)helperThemeIndex=null});
 }
 return helperThemeIndex;
}

async function helperThemeAction(route,method='POST'){
 const response=await fetch(helperThemeHost+route,{method,headers:{'X-Wuwa-Action':'1'},cache:'no-store'});
 if(!response.ok)throw Error('本机 Helper 服务未响应。');
 return response.json();
}

export function importThemePack(){return helperThemeAction('/theme-packs/import')}
export function removeThemePack(id){return helperThemeAction('/theme-packs/remove/'+encodeURIComponent(id))}
export function downloadThemePack(id){return helperThemeAction('/theme-packs/download/'+encodeURIComponent(id))}
export function themePackDownloadStatus(){return helperThemeAction('/theme-packs/download-status','GET')}

function mapMusic(data){
 return {
  hasFolder:data?.hasFolder===true,
  folder:String(data?.folder||''),
  tracks:Array.isArray(data?.tracks)?data.tracks
   .filter(t=>typeof t?.url==='string'&&t.url.startsWith('/music/track/'))
   .map(t=>({id:t.id,name:String(t.name||''),src:helperThemeHost+t.url})):[]
 };
}

export async function loadMusicLibrary(){
 return mapMusic(await helperThemeAction('/music/list','GET'));
}
export async function pickMusicFolder(){
 const res=await helperThemeAction('/music/pick','POST');
 if(res?.cancelled||res?.error)return res;
 return mapMusic(res);
}
export async function clearMusicFolder(){
 return mapMusic(await helperThemeAction('/music/clear','POST'));
}

export async function openDeniaBlocks(){
 const language=document.documentElement.lang==='en'?'?lang=en':'';
 if(!(await helperThemeAction('/denia-blocks/open'+language)).accepted)throw Error('请先导入达妮娅主题包。');
}
