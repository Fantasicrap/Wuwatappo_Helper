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

async function helperThemeAction(route){
 const response=await fetch(helperThemeHost+route,{method:'POST',headers:{'X-Wuwa-Action':'1'}});
 if(!response.ok)throw Error('本机 Helper 服务未响应。');
 return response.json();
}

export function importThemePack(){return helperThemeAction('/theme-packs/import')}
export async function openDeniaBlocks(){
 const language=document.documentElement.lang==='en'?'?lang=en':'';
 if(!(await helperThemeAction('/denia-blocks/open'+language)).accepted)throw Error('请先导入达妮娅主题包。');
}
