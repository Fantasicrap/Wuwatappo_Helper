const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'inventory-share.js'),'utf8').replace('export {__wtInventoryShare,__wtNormalPanel};','this.share=__wtInventoryShare;this.normal=__wtNormalPanel;');
const context={console};vm.createContext(context);vm.runInContext(source,context);const api=context.share;
const item=(type,id,quantity=1)=>({asset_type:type,asset_id:id,quantity,rarity:'rare',role_id:'0'});
const plain=value=>JSON.parse(JSON.stringify(value));
async function main(){
 const groups=api.owned([item('emote',42),item('character_skin',2,3),item('accessory',12,2),item('accessory',12,2),item('accessory',12,5),item('emote',43,0),item('emote',44,-1),item('emote',45,NaN),item('emote',1e9),item('emote',null),item('unknown',10),null]);
 assert.deepEqual(plain(groups.map(g=>g.title)),['角色','配件','表情']);
 assert.deepEqual(plain(groups.map(g=>g.items.length)),[1,1,1]);assert.equal(groups[1].items[0].quantity,5);
 const sorted=api.owned([
  {...item('character_skin',5),rarity:'common',series_name:'A',role_name:'安可'},
  {...item('character_skin',3),rarity:'epic',series_name:'B',role_name:'安可'},
  {...item('character_skin',2),rarity:'epic',series_name:'A',role_name:'白芷'},
  {...item('character_skin',4),rarity:'rare',series_name:'A',role_name:'安可'},
  {...item('character_skin',1),rarity:'epic',series_name:'A',role_name:'安可'}
 ]);assert.deepEqual(plain(sorted[0].items.map(it=>it.asset_id)),[1,2,3,4,5]);
 const qualities=['epic','rare','uncommon','common'];
 const many=api.owned([...Array.from({length:11},(_,i)=>({...item('character_skin',i+1),rarity:qualities[i%4],role_name:'示例角色 '+(i+1),series_name:'示例系列 '+(i%2+1)})),...Array.from({length:6},(_,i)=>({...item('accessory',i+101),rarity:qualities[i%4]})),item('emote',201)]);
 const one=api.layout(many);assert.equal(one.length,1);assert.equal(one[0].blocks.length,3);
 const slots=api.positions(one[0]);assert.equal(slots.length,18);assert.equal(slots[0].x,slots[5].x);assert(slots[4].x>slots[0].x);assert(slots[5].y>slots[4].y);assert.equal(slots[0].y,slots[4].y);
 const all=api.owned(Array.from({length:1300},(_,i)=>item('emote',i+1))),pages=api.layout(all);
 assert(pages.length>1);assert(pages.every(page=>page.height<=api.maxHeight));assert.equal(pages.flatMap(api.positions).length,1300);
 const smallPages=api.layout(many,600);assert(smallPages.length>1);assert(smallPages.every(page=>page.height<=600));
 const calls=[];await context.normal({setAlwaysOnTop:async value=>calls.push(['top',value]),setSkipTaskbar:async value=>calls.push(['taskbar',value])});assert.deepEqual(calls,[['top',false],['taskbar',false]]);
 let toast='';const ref=value=>({value});const signedOut=api.create(ref,()=>({loggedIn:false,items:many}),value=>toast=value);await signedOut.run();assert.match(toast,/登录/);
 const loading=api.create(ref,()=>({loggedIn:true,loading:true}),value=>toast=value);await loading.run();assert.match(toast,/加载/);
 // Real offline Canvas rendering of a fixture, never the user's account inventory.
 const native=require('@napi-rs/canvas');
 const css=fs.readFileSync(path.join(__dirname,'../dist/upstream-1.0.3/index-C3fG-hsi.css'),'utf8');
 const before=css.slice(css.indexOf('.module-content__bg:before'));const png=before.match(/url\(data:image\/png;base64,([A-Za-z0-9+/=]+)\)/)[1];
 const pattern=await native.loadImage(Buffer.from(png,'base64'));
 const frames=Object.fromEntries(await Promise.all(Object.entries(api.rarityFiles).map(async([rarity,file])=>[rarity,await native.loadImage(path.join(__dirname,'share-fixtures',file))])));
 const originalBackground={color:'#fff3dd',pattern,frames,opacity:1};
 const document={createElement(tag){assert.equal(tag,'canvas');const canvas=native.createCanvas(1,1);canvas.toBlob=callback=>canvas.encode('png').then(buffer=>callback(new Blob([buffer],{type:'image/png'})));return canvas}};
 let done=0,inflight=0,peak=0;
 const result=await api.draw(one[0],many,{document,background:originalBackground,timestamp:'离线排版测试，示例素材',pageLabel:'1 / 1',resolveUrl:it=>it.asset_type,loadImage:async type=>{inflight++;peak=Math.max(peak,inflight);try{return await native.loadImage(path.join(__dirname,'share-fixtures',type+'.png'))}finally{inflight--}},progress(){done++}});
 assert.equal(result.failed,0);assert.equal(done,18);assert(peak<=6);assert.equal(result.width,1000);
 const preview=path.join(__dirname,'share-fixtures/layout-preview.png');fs.writeFileSync(preview,Buffer.from(await result.blob.arrayBuffer()));
 const bad=await api.draw(one[0],many,{document,background:originalBackground,timestamp:'失败占位测试',pageLabel:'1 / 1',resolveUrl:it=>it.asset_type,loadImage:async()=>{throw Error('Simulated CORS failure')},progress(){}});assert.equal(bad.failed,18);assert(bad.blob.size>0);
 const abort=new AbortController();abort.abort();await assert.rejects(api.draw(one[0],many,{document,background:originalBackground,signal:abort.signal,loadImage:async()=>{throw Error('Must not load after cancel')},progress(){}}),/已取消生成/);
 const vnode=api.render((tag,props,children,flag,dynamic)=>({tag,props,children,flag,dynamic}),{busy:{value:true},label:{value:'正在生成…'},run(){}});assert.equal(vnode.children[0].props.disabled,true);assert.equal(vnode.children[0].flag,9);
 const report={passed:true,checks:['Owned positive-quantity items only; duplicate stacks not added','Characters / accessories / emotes in fixed order','Rarity descending then series then Chinese role name in pinyin order','Original four rarity background PNGs reused','Exactly five columns and every item included','Large inventories partitioned within canvas limits','Non-topmost and normal taskbar requests','Login and loading guards','Actual offline PNG rendered with original background and three public asset samples','Concurrent image loading limited to six','Missing images remain visible placeholders with failure count','Cancellation stops pending generation','Vue button marks busy label and disabled state as dynamic'],preview,previewContainsUserInventory:false,nativeWindowBehaviorTested:false,webViewDownloadAndClipboardTested:false};
 fs.writeFileSync(path.join(__dirname,'inventory-share-tests.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}
main().catch(error=>{console.error(error.stack);process.exitCode=1});
