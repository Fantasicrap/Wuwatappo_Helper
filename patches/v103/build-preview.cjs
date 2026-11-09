// Shared Helper patches applied to a reviewed upstream package.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),zlib=require('zlib'),assert=require('assert/strict');
const {babelParse:parse,traverse}=require('playwright/lib/transform/babelBundle');
function babelParse(source,file,module){
 try{return parse(source,file,module)}
 catch(error){throw Error(`${file} at ${error.loc?.line}:${error.loc?.column}: ${source.slice(error.pos-100,error.pos+100)}`)}
}
const v104=process.argv.includes('--v104');
const lite=process.argv.includes('--lite');
assert(!lite||v104,'Lite requires WuwaTappo 1.0.4');
const target=v104?require('../../package.json').releaseVersion:'1.0.3.4';
const root=path.resolve(__dirname,'../..'),input=process.env.WUWA_SOURCE_EXE||'F:/WuwaTappo/WuwaTappo.exe',stage=path.join(root,'dist/upstream-'+(v104?'1.0.4':'1.0.3')),out=path.join(root,'dist/migration-'+target+(lite?'-lite':''));fs.mkdirSync(out,{recursive:true});
const original=fs.readFileSync(input),hash=b=>crypto.createHash('sha256').update(b).digest('hex'),manifest=JSON.parse(fs.readFileSync(path.join(stage,'extraction-manifest.json'),'utf8'));
assert.equal(hash(original),v104?'ee829c55916619ea2882e4a13546cbaf2f880363237608285105c7a4958e70b3':'cedc37d0c11d112f4d933647fb6cf00e1dca847fc763250984c647080f849080');
assert.equal(manifest.sourceSha256,hash(original),'Extraction must match the source executable');
const assets=v104?{
 panel:'index-BFg5ADH5.js',common:'index-CM6qA69G.js',settings:'index-BIzzuO5B.js',bridge:'switchDisplayMonitor-Dqub4lRn.js',about:'index-inPQAlmI.js',emit:'c_'
}:{
 panel:'index-pp8VWaUF.js',common:'index-CuzHFfJW.js',settings:'index-CiT_jZa7.js',bridge:'switchDisplayMonitor-B50jXMGD.js',about:'index-BEWn23m-.js',emit:'cV'
};
const bindingNames=v104?require('../v104/binding-names.json'):{};
function upstream(filename){
 const source=fs.readFileSync(path.join(stage,filename),'utf8');
 assert.equal(hash(Buffer.from(source)),manifest.assets.find(a=>a.name==='/assets/'+filename).sha256,'Extracted asset changed: '+filename);
 return bindingNames[filename]?require('../v104/normalize-bindings.cjs')(source,filename,bindingNames[filename]):source;
}
const read=name=>{let code=fs.readFileSync(path.join(root,'patches',name),'utf8');const comments=babelParse(code,'helper.mjs',true).comments??[];for(const c of comments.slice().reverse())code=code.slice(0,c.start)+code.slice(c.end);return code};
const mapping=JSON.parse(fs.readFileSync(path.join(__dirname,'panel-symbols.json'),'utf8'));
function translate(code,renames={}){const ast=babelParse(code,'helper.mjs',true),edits=new Map();traverse(ast,{Identifier(p){const name=p.node.name,b=p.scope.getBinding(name);let to;if(b&&renames[name]&&(p.node===b.identifier||b.referencePaths.includes(p)))to=renames[name];else if(!b&&p.isReferencedIdentifier())to=mapping[name];if(to&&to!==name)edits.set(p.node.start,{end:p.node.end,to})}});for(const[start,{end,to}]of [...edits].sort((a,b)=>b[0]-a[0]))code=code.slice(0,start)+to+code.slice(end);return code}
function once(s,a,b){assert.equal(s.split(a).length-1,1,'Changed migration anchor: '+a);return s.replace(a,b)}
function editFunction(s,name,fn){const matches=[];traverse(babelParse(s,'resource.mjs',true),{FunctionDeclaration(p){if(p.node.id.name===name)matches.push(p.node)}});assert.equal(matches.length,1,'Ambiguous function '+name);const n=matches[0];return s.slice(0,n.start)+fn(s.slice(n.start,n.end))+s.slice(n.end)}
const panelAsset='/assets/'+assets.panel,commonAsset='/assets/'+assets.common;let panel=upstream(assets.panel),common=upstream(assets.common);
Object.assign(mapping,{Qp:'nh',Am:'xm'});
if(!lite){
panel='const __wtRoomHistory=__wtRoomHistoryCore.create();\n'+panel;
common+='\n'+read('room-history-core.js')+'\nexport {__wtRoomHistoryCore};\n';
panel=once(panel,'a.value=Cd(xe?.o)?"owner":"member",We("rd",{r:u.value},st)',`a.value=Cd(xe?.o)?"owner":"member",${v104?'Ee>0&&Ee===T':'xe'}&&R.isLoggedIn&&__wtRoomHistory.remember(Ee,u.value),We("rd",{r:u.value},st)`);
}
panel=editFunction(panel,'it',()=>translate(read('counter-guard-runtime.js'),{tt:'it'}));
panel=editFunction(panel,'jp',s=>read('auto-chest-runtime.js')+s.replace('switch(e.type){','switch(e.type){case"boost-local-clicks":__wtBoostLocalClicks(e.delta);break;case"set-auto-claim-chests":__wtSetAutoChest(e.enabled);it();break;'+(lite?'':'case"set-room-members-visibility":__wtSetAllRoomMembersVisible(e.visible);break;')));
if(!lite)panel=editFunction(panel,'jp',s=>translate(read('room-history-runtime.js'))+s.replace('switch(e.type){','switch(e.type){case"join-room-history":__wtEnterHistoryRoom(e);break;'));
panel=once(panel,'Lr=setInterval(()=>{R.isLoggedIn&&Vn()},1e3)','Lr=setInterval(()=>{R.isLoggedIn&&Vn();__wtAutoChestTick()},1e3)');
// Preserve claim deadlines across resume in the synchronized server clock.
panel=editFunction(panel,'Cp',s=>once(s,'performance.now()+fr','is()+fr'));
panel=editFunction(panel,'Vn',s=>once(once(s,'kr-t','kr-e'),'Cr-t','Cr-e'));
if(v104){
 common=editFunction(common,'isAppUpdaterEnabled',()=> 'function isAppUpdaterEnabled(){return false}');
 common+='\n'+read('v104/click-ledger.js');
 const roomAck='const se=r,ae=oe=>{if(r!==se||!se.connected)return;';
 panel=once(panel,roomAck,'const se=r,session=_==="rm"?__wtClickSession():null,ae=oe=>{if(r!==se||!se.connected||_==="rm"&&(!session?.()||K(u.value)!==K(k?.r)))return;');
 panel=once(panel,'if(!ye?.r||!Array.isArray(ye.m)||ye.m.length===0)', 'if(!fe||K(ye?.r)!==fe||!Array.isArray(ye.m)||ye.m.length===0)');
 panel=once(panel,'async function ge(_=!1,k=A){if(k!==A||!r?.connected||!R.isLoggedIn)return;const T=await __wu104_645();if(k===A&&!(!r?.connected||!R.isLoggedIn))try{const z=await ot("cr",{num:T});if(_&&Ze(k),k!==A||!ki(z))return;await Vs(T,R.userInfo?.cuid??""),R.applyClickReportSuccess(T),window.dispatchEvent(new CustomEvent("cat-click-report-success"))}catch{}}',
  'async function ge(_=!1,k=A){const socket=r,same=__wtClickSession(),valid=()=>same?.()&&k===A&&r===socket&&socket?.connected;if(!valid())return;try{await __wtReportClicks(valid,num=>ot("cr",{num}),ki)}catch{}finally{if(_&&valid())Ze(k)}}');
 common=editFunction(common,'resolveClickReportGrossTotal',s=>once(once(s,'resolveClickReportGrossTotal()','resolveClickReportGrossTotal(valid=()=>true)'),'const t=await loadKeyPressClickCount(),n=','const t=await loadKeyPressClickCount();if(!valid())return;const n='));
 common=once(common,'applyClickReportSuccess(e){const t=parseClickCount(e);this.userInfo&&(this.userInfo={...this.userInfo,total_click_count:t}),this.setLocalClickCount(0)', 'applyClickReportSuccess(e,sent=this.localClickCount){const t=parseClickCount(e);this.userInfo&&(this.userInfo={...this.userInfo,total_click_count:t}),this.setLocalClickCount(Math.max(0,this.localClickCount-sent))');
 common=once(common,'applyChestClickConsume(e){const t=parseSafeClickCount(e);if(!this.userInfo||t<=0)return;if(isFrozenClickCount(this.serverClickTotal)){this.userInfo={...this.userInfo,total_click_consume:clampClickCountSum(this.serverClickConsume+t)},this.setLocalClickCount(0),this.serverClickSpend=0;return}const n=clampClickCountSum(this.serverClickTotal+this.localClickCount);this.userInfo={...this.userInfo,total_click_count:n,total_click_consume:clampClickCountSum(this.serverClickConsume+t)},this.setLocalClickCount(0),this.serverClickSpend=0}',
  'applyChestClickConsume(e,gross=this.cumulativeClickCount,sent=this.localClickCount){const t=parseSafeClickCount(e);if(!this.userInfo||t<=0)return;this.userInfo={...this.userInfo,total_click_count:gross,total_click_consume:clampClickCountSum(this.serverClickConsume+t)};this.setLocalClickCount(Math.max(0,this.localClickCount-sent));this.serverClickSpend=0}');
 common=editFunction(common,'openChest',s=>once(once(s,'function openChest(e)','function openChest(e,valid)'), 'click_num:e.click_num},{})','click_num:e.click_num},{},valid)'));
 common=once(common,'async post(t,n,s){return await renewTokenBeforeRequest(t),(await this.instance.post(t,n,withAuthHeader(s))).data}',
  'async post(t,n,s,valid){await renewTokenBeforeRequest(t);if(valid&&!valid())throw new ApiBusinessError(-1,"领取状态已变化，请重试");return (await this.instance.post(t,n,withAuthHeader(s))).data}');
 panel=editFunction(panel,'pc',s=>{
  s=once(s,'async function pc(e){','async function pc(e,auto=false){');
  s=once(s,'Fn.value=!0;const f=Up(e);let b=!1;try{','const same=__wtClickSession();if(!same)return "skipped";const valid=()=>same()&&!Ie()&&(e==="left"?Wn.value:Gn.value)&&R.totalClickCount>=Ns&&(!auto||__wtAutoChestEnabled()&&nt.value.status==="online"&&Qn.value&&!Mi.value&&!br.value);Fn.value=!0;const f=Up(e);let b=!1,result="skipped";try{if(__wtChestLedger.hasPending()){result="uncertain";if(!await __wtChestLedger.sync())return result;result="skipped"}if(!same())return result;');
  s=once(s,'const M=await(async()=>{await G();const ee=await Pm({place:e,click_num:R.cumulativeClickCount}),Z=yt(ee);Cp(e);','await G();const M=await __wtClickIO(async()=>{if(!valid())return;const gross=R.cumulativeClickCount,sent=__wtSubmittedClicks(gross);__wtChestLedger.submitted(same,sent);result="uncertain";const Z=yt(await Pm({place:e,click_num:gross},valid));if(!same())return;');
  s=once(s,'R.applyChestClickConsume(_e),Xn(!0);','R.applyChestClickConsume(_e,gross,sent);Cp(e);Xn(!0);__wtChestLedger.confirmed();result="confirmed";');
  s=once(s,'(await cu({prizeSrc:fu(L.value,Je,Ne,Z.asset_id),rarity:uu(Z.rarity_type)}),{ok:!0,data:Z,assetName:Ne,assetType:Je})})();if(await f,!M.ok)', '{ok:!0,data:Z,assetName:Ne,assetType:Je}});if(M?.ok&&same())await cu({prizeSrc:fu(L.value,M.assetType,M.assetName,M.data.asset_id),rarity:uu(M.data.rarity_type)});await f;if(!same()||!M)return result;if(!M.ok)');
  s=once(s,'if(M.reason==="click_consume"){go("click_consume_invalid"),mt("click_consume error");return}if(M.reason==="click_not_enough"){go("click_not_enough"),mt(gr(70005,{appendCode:!1}));return}go("asset_missing"),mt($("reward_asset_missing"));return}', 'if(M.reason==="click_consume"){go("click_consume_invalid"),mt("click_consume error");return result}if(M.reason==="click_not_enough"){go("click_not_enough"),mt(gr(70005,{appendCode:!1}));return result}go("asset_missing"),mt($("reward_asset_missing"));return result}');
  s=once(s,'await Tp(M.assetType,M.assetName,M.data.rarity_type,M.data.asset_id),Number','await Tp(M.assetType,M.assetName,M.data.rarity_type,M.data.asset_id,same);if(!same())return result;Number');
  return once(once(s,'await pt(j)}catch(M){try{await f}catch{}if','await pt(j,same);return result}catch(M){try{await f}catch{}if(!same())return result;if'),'an(M)}finally','an(M);return result}finally');
 });
 panel=editFunction(panel,'Tp',s=>once(once(s,'Tp(e,t,o,l)','Tp(e,t,o,l,same=()=>true)'),'const Z=++Td','if(!same())return;const Z=++Td'));
 panel=once(panel,'async function pt(e){await G(),pu(e,C.value)&&hu(mu(C.value))}', 'async function pt(e,same=()=>true){await G(),same()&&pu(e,C.value)&&hu(mu(C.value))}');
 panel=once(panel,'const __wtAutoChestKey=','const __wtChestLedger=__wtMakeChestLedger({syncClock:sc,ready:()=>Qn.value,read:async()=>yt(await Qp()),changed:()=>{kr=Cr=null;Vn();it()}});const __wtAutoChestKey=');
 panel=once(panel,'claim:side=>pc(side),sync:async()=>{await sc();return Qn.value}','claim:side=>pc(side,true),sync:__wtChestLedger.sync');
 panel=editFunction(panel,'hh',s=>read('v104/room-visibility.js')+once(s,'ul(e,o),on()','ul(e,o),on(),__wtSyncRoomVisibility()'));
 panel=editFunction(panel,'jp',s=>once(s,
  'case"set-only-show-self":officialOnlyShowSelf.value=e.value,on();',
  'case"set-only-show-self":if(typeof e.value!=="boolean")break;officialOnlyShowSelf.value=e.value,on(),__wtSyncRoomVisibility();'));
}else{
 panel=editFunction(panel,'ul',()=> '');panel=editFunction(panel,'xd',()=> '');
 panel=editFunction(panel,'no',()=>translate(read('room-visibility-policy.js'),{cl:'ul',Md:'xd'}));
 panel=editFunction(panel,'eh',s=>once(s,'ul(o,!1)','ul(o,!1,!0)'));
 panel=editFunction(panel,'hh',s=>translate(read('room-visibility-runtime.js'))+s);
}
// Keep each positioned shell and room state, but unmount hidden image layers.
// Filtering the room member list itself would disturb layout and reconnect state.
let roomChildren,roomFlags;
traverse(babelParse(panel,'panel.mjs',true),{CallExpression(p){const a=p.node.arguments;if(a[1]?.type==='ObjectExpression'&&a[1].properties.some(x=>x.key?.value==='data-room-cat-id')&&a[2]?.type==='ArrayExpression'){assert(!roomChildren,'Ambiguous room shell');roomChildren=a[2];roomFlags=a[3];assert.equal(roomFlags?.value,14,'Changed room block flags')}}});
assert(roomChildren,'Missing room shell children');
// Vue's original optimized block assumes fixed child topology. BAIL forces
// normal reconciliation when hidden layers are removed and later recreated.
panel=panel.slice(0,roomFlags.start)+'-2'+panel.slice(roomFlags.end);
panel=panel.slice(0,roomChildren.start)+'no(o.id)?[]:'+panel.slice(roomChildren.start);
panel=once(panel,'ht.value.map(e=>[e.id,String(e.characterAssetId??0)', 'ht.value.filter(e=>!no(e.id)).map(e=>[e.id,String(e.characterAssetId??0)');
panel=once(panel,'t=ht.value.filter(f=>f.roleId!==null)','t=ht.value.filter(f=>f.roleId!==null&&!no(f.id))');
panel=once(panel,'l=new Set([...An.value].filter(f=>!o.has(f)))','l=new Set([...An.value].filter(f=>o.has(f)))');
panel=editFunction(panel,'yc',s=>once(s,'if(!l)return;','if(!l||no(o))return;'));
if(!lite){
panel=editFunction(panel,'vt',s=>once(s,'o.value={...o.value,...t}','o.value={...o.value,...t};__wtSaveRoomPosition(e,t)'));
panel=editFunction(panel,'Bi',s=>s.slice(0,-1)+';__wtSaveRoomPosition(e,{left:e.left,top:e.top})}');
panel=editFunction(panel,'Fd',s=>once(s,'if(ut.has(e.id)||!Lt.value)return;','if(ut.has(e.id)||!Lt.value)return;if(__wtRestoreRoomPosition(e))return;'));
panel=editFunction(panel,'tc',s=>once(s,'ut.has(e.id)&&Mt.add(e.id)','ut.has(e.id)&&!__wtRestoreRoomPosition(e)&&Mt.add(e.id)'));
panel=editFunction(panel,'gl',s=>read('v103/room-positions.js')+s);
panel=editFunction(panel,'jp',s=>once(s,'switch(e.type){','switch(e.type){case"set-room-placement":__wtSetRoomMode(e.mode);break;'));
panel=editFunction(panel,'Nl',s=>once(s,'let ho=0,Qo=null;','if(__wtRoomMode==="vertical")return __wtRoomPositions.vertical(t,ht.value.length,{left:M,top:j,right:ee,bottom:Z,width:l,height:f,gap:Tt,offsetX:ft/2*(1-o),offsetY:Pn*(1-o)},Ne,ya,$d);let ho=0,Qo=null;'));
panel=editFunction(panel,'Hl',s=>once(s,'if(ht.value.length>=24)','if(__wtRoomMode!=="vertical"&&ht.value.length>=24)'));
panel=once(panel,'function Ul(e){A.value=Bl(e),nn&&clearTimeout(nn),nn=setTimeout(()=>{A.value=1,nn=null},220)}','function Ul(e){A.value=Bl(e);if(nn)clearTimeout(nn);nn=qr.size?null:setTimeout(()=>{A.value=1;nn=null},220)}');
panel=once(panel,'const t=qr.delete(e),o=va.delete(e);!t&&!o||Ie()','const t=qr.delete(e),o=va.delete(e);if(t&&!qr.size&&!nn)A.value=1;!t&&!o||Ie()');
}
const helperFiles=lite?['startup-notice.js','synthesis-reminder.js','panel-layout.js']:['hotkeys-core.js','inventory-share.js','input-recorder.js','keyboard-ui.js','room-positions-core.js','startup-notice.js','auto-emotes.js','accessory-thrust.js','phrolova-reaction.js','happy-ending.js','oath-core.js','pet-fun-dialogue.js','pet-fun.js','local-wardrobe.js','synthesis-reminder.js','panel-layout.js'];
const helpers=helperFiles.map(n=>n==='hotkeys-core.js'?read(n).replace(' const defaults=',' actions.splice(0,3);\n const defaults='):n==='startup-notice.js'?read(n).replace('__WT_DISCLAIMER_TEXT__',JSON.stringify(fs.readFileSync(path.join(root,'DISCLAIMER.txt'),'utf8').replace(/^\uFEFF/,''))):n==='pet-fun.js'?read(n).replace('__WT_OATH_CORE_ICON__',JSON.stringify('data:image/png;base64,'+fs.readFileSync(path.join(root,'patches/assets/oath-core.png')).toString('base64'))):n==='happy-ending.js'?read(n).replace('__WT_WILTED_ECHO_ICON__',JSON.stringify('data:image/png;base64,'+fs.readFileSync(path.join(root,'patches/assets/wilted-echo.png')).toString('base64'))):read(n)).join('\n');common+='\n'+helpers;
common+='\n'+read('long-run.js')+'\nexport {__wtLongRun,renewTokenIfNeeded as __wtRenewSession};\n';
common=editFunction(common,'renewTokenIfNeeded',()=>read('session-renewal-runtime.js'));
common=editFunction(common,'extendTokenExpireLocally',()=>`function extendTokenExpireLocally(days=TOKEN_COOKIE_DAYS){const token=getCookie("infoToken");if(!token)return;const old=getCookie("lastLoginTime"),expire=Date.now()+days*86400000;setCookie("infoToken",token,TOKEN_COOKIE_DAYS);setCookie("lastLoginTime",/^\\d{10}$/.test(old?.trim()??"")?String(Math.floor(expire/1000)):String(expire),TOKEN_COOKIE_DAYS)}`);
common=editFunction(common,'handleApiCode',source=>{
 source=once(source,'function handleApiCode(e,t){','function handleApiCode(e,t){if(t?.config){const headers=t.config.headers,raw=typeof headers?.get==="function"?headers.get("Authorization"):headers?.Authorization??headers?.authorization;if(raw!==`Bearer ${getCookie("infoToken")}`)return}');
 source=once(source,'clearAuthTokens(),','logDiagnostic("AUTH","session_invalid",{code:e,source:"server"},"warn"),clearAuthTokens(),');
 return once(source,'n()','!getCookie("infoToken")&&n()');
});
common=once(common,'handleApiCode(r.code,{message:r.message})','handleApiCode(r.code,{message:r.message,config:t.config})');
common=once(common,'handleApiCode(c,{message:a?.message})','handleApiCode(c,{message:a?.message,config:n})');
common=once(common,'handleApiCode(w);','handleApiCode(w,{config:n});');
common=once(common,'||r===401||r===403','||r===401');
// A deduplicated immediate probe must remain queued. Dropping it after
// clearing the old retry timer leaves the network gate degraded forever.
common=editFunction(common,'scheduleProbe',source=>once(source,'if(e===0&&Date.now()-lastProbeStartedAt<IMMEDIATE_PROBE_DEDUPE_MS){Date.now()-lastProbeStartedAt,snapshot.value.status;return}','if(e===0)e=Math.max(0,IMMEDIATE_PROBE_DEDUPE_MS-Math.max(0,Date.now()-lastProbeStartedAt));'));
common=editFunction(common,'renewTokenBeforeRequest',source=>once(once(source,'const{renewTokenIfNeeded:n}=','const __wtBefore=getCookie("infoToken");const{renewTokenIfNeeded:n}='),'await n()}','await n();if(getCookie("infoToken")!==__wtBefore)throw new ApiBusinessError(-1,"登录状态已变化，请重试")}'));
// Each WebView runs bootstrap. Let its actual img elements request their assets
// instead of eagerly decoding the entire shared UI image set in every window.
common=editFunction(common,'schedulePreloadAppUiImages',()=> 'function schedulePreloadAppUiImages(){}');
common=editFunction(common,'preloadAppUiImages',()=> 'async function preloadAppUiImages(){}');
let imageTable;
traverse(babelParse(common,'common.mjs',true),{VariableDeclarator(p){if(p.node.id.name==='uiImageUrlMap'){assert(!imageTable);assert.equal(p.scope.getBinding('uiImageUrlMap').referencePaths.length,0,'Image preload table gained another consumer');imageTable=p.node.init}}});
assert(imageTable);common=common.slice(0,imageTable.start)+'{}'+common.slice(imageTable.end);
const retiredImages=[];
traverse(babelParse(common,'common.mjs',true),{VariableDeclaration(p){const retired=p.get('declarations').filter(d=>/^__vite_glob_0_\d+$/.test(d.node.id.name)&&p.scope.getBinding(d.node.id.name).referencePaths.length===0);if(retired.length){const removed=new Set(retired.map(d=>d.node.start));retiredImages.push({start:p.node.start,end:p.node.end,text:p.node.kind+' '+p.node.declarations.filter(d=>!removed.has(d.start)).map(d=>common.slice(d.start,d.end)).join(',')+';'})}}});
for(const edit of retiredImages.sort((a,b)=>b.start-a.start))common=common.slice(0,edit.start)+edit.text+common.slice(edit.end);
if(!lite)common+='\n'+read('controller-core.js').replace('export const ControllerCore','const __wtControllerCore')+'\n';
let mainBoot;
traverse(babelParse(panel,'panel.mjs',true),{CallExpression(p){const n=p.node;if(n.callee.name==='js'&&n.arguments[0]?.type==='ArrowFunctionExpression'&&panel.slice(n.start,n.end).includes('main_mount_failed')){assert(!mainBoot);mainBoot=n.arguments[0].body.start+1}}});
assert(mainBoot);panel=panel.slice(0,mainBoot)+'if(!await __wtNotice.confirm()){await Ct("exit_app");return}'+panel.slice(mainBoot);
panel=once(panel,'Nv()||Bv().catch','true||Bv().catch');
const synthesisInit='const __wtSynth=__wtSynthesis.create({watch:Oe,account:()=>R.isLoggedIn?R.userInfo?.id:0,inventory:()=>C.value,catalog:()=>w.value,root:()=>ce.value?.querySelector(".cat-stack"),open:()=>Xp("exchange"),blocked:Ie,changed:()=>Fe(Me),load:async()=>{let a=await G();if(!a&&R.isLoggedIn)a=await G();await St();return Array.isArray(a)}});Ai(()=>__wtSynth.dispose());';
if(!lite){
const init=synthesisInit+translate(read('keyboard-position.js'))+'\n'+(v104?read('v103/helper-actions.js'):read('v103/helper-actions.js').replace(/^ .*roomOnlySelf.*\n/m,''))+'\n'+read('v103/mouse-feed.js')+'\nconst __wtKeyboard=__wtKeyboardUi.create({listen:tt,activity:()=>{__wtSyncMouseFeed();__wtFun.syncController()},layout:()=>Fe(()=>{__wtPositionKeyboard();Me()}),toClient:Wt,pointer:()=>({x:oe.value,y:fe.value}),visible:()=>_.value,hotkeys:__wtHotkeys,blocked:()=>Ie()||__wtHelperCapture.size>0});Oe(_,()=>__wtKeyboard.syncActivity());Ai(()=>{__wtStopMouseFeed();__wtDisposeHelperActions();__wtDisposePosition();__wtKeyboard.dispose();__wtDisposeCounter();__wtChestTask.dispose();__wtSessionTask.dispose()});\n';
panel=editFunction(panel,'Uc',s=>init+'const __wtAutoEmote=__wtAutoEmotes.create({defer:true,state:()=>({account:R.isLoggedIn?R.userInfo?.id:0,equipped:La.value}),load:G,send:item=>Ap({id:item.id,src:te("emote/"+item.name)}),normalize:__wtHotkeys.normalizeKey,blocked:()=>Ie()||__wtHelperCapture.size>0});Oe(()=>R.isLoggedIn?R.userInfo?.id:0,()=>__wtAutoEmote.refresh());Ai(()=>__wtAutoEmote.dispose());\n'+once(s.replace('{','{if(!__wtKeysConnected)__wtKeyboard.key(e,true);const __wtAction=__wtHotkeys.nativeDown(e);__wtPerformHelperAction(__wtAction);'),'qr.add(e);','qr.add(e);if(!__wtAction)__wtAutoEmote.down(e);'));
panel=once(panel,'K=(async()=>{E.value=!0','K=(async()=>{const __wtAccount=R.userInfo?.id;E.value=!0');
const bagCommit='const __wtItems=Gm(yt(await Ym()));if(__wtAccount===R.userInfo?.id){C.value=__wtItems;__wtAutoEmote.inventory(C.value,__wtAccount);return C.value}';
panel=v104?once(panel,'C.value=Gm(yt(await Ym())),I.value=!1',bagCommit.replace('C.value=__wtItems;','C.value=__wtItems;I.value=!1;')):once(panel,'C.value=Gm(yt(await Ym()))',bagCommit);
panel=editFunction(panel,'Vc',s=>s.replace('{','{__wtHotkeys.nativeUp(e);if(!__wtKeysConnected)__wtKeyboard.key(e,false);'));
panel=once(panel,'const Ue=W(ai),xn=pe(()=>{','const Ue=W(ai),__wtWardrobe=__wtLocalWardrobe.create({ref:W,account:()=>R.isLoggedIn?R.userInfo?.id:0,user:()=>R.isLoggedIn?R.userInfo:null,getShown:()=>({character:P.value,accessory:Ue.value}),setCharacter:name=>P.value=name,setAccessory:name=>Ue.value=name,cloudEmotes:()=>R.isLoggedIn?rr(R.userInfo):V.value,setEmotes:items=>__wtLocalEmotes.value=items,toast:mt,changed:()=>{it();Fe(Me)}}),__wtFun=__wtPetFun.create({ref:W,role:()=>__wtWardrobe.role({id:R.userInfo?.role_id,name:P.value}),root:()=>ce.value?.querySelector(".cat-stack"),part:()=>Ue.value,account:()=>R.isLoggedIn?R.userInfo?.id:0,normalize:__wtHotkeys.normalizeKey,blocked:()=>Ie()||__wtHelperCapture.size>0,overUi:()=>!!document.elementFromPoint(oe.value,fe.value)?.closest(".wt-oath-core-drop,.wt-pet-fun-settings,.wt-synthesis-reminder"),down:key=>__wtThrust.down(key),up:key=>__wtThrust.up(key),pulse:()=>__wtThrust.pulse(),resetMotion:()=>__wtThrust.reset(),changed:()=>Fe(Me),activity:()=>__wtSyncMouseFeed(),controllerDisplay:()=>__wtKeyboard.bubbleActive,controllerDown:label=>__wtKeyboard.controllerInput(label)}),__wtThrust=__wtAccessoryThrust.create({ref:W,part:()=>Ue.value,blocked:()=>Ie()||__wtHelperCapture.size>0,onThrust:()=>__wtFun.visual(),enabled:()=>__wtFun.active()&&__wtFun.eligible(),visual:()=>__wtFun.config.weapon&&__wtFun.eligible()}),xn=pe(()=>{');
panel=once(panel,'La=pe(()=>R.isLoggedIn?rr(R.userInfo).map(e=>({id:e.id,name:e.name})):V.value)','__wtLocalEmotes=W(null),La=pe(()=>__wtLocalEmotes.value??(R.isLoggedIn?rr(R.userInfo).map(e=>({id:e.id,name:e.name})):V.value))');
panel=once(panel,'return{transform:`translate(${e}px, ${t}px)`}','return{transform:`translate(${e}px, ${t}px)`,...__wtThrust.style(Ue.value),...__wtFun.style()}');
panel=once(panel,'if(!__wtAction)__wtAutoEmote.down(e);','if(!__wtAction){if(!(__wtKeysConnected&&__wtFun.rawKey(e)))__wtFun.input("keyboard",e,true);__wtAutoEmote.down(e);}');
panel=once(panel,'function Vc(e){','function Vc(e){if(!(__wtKeysConnected&&__wtFun.rawKey(e)))__wtFun.input("keyboard",e,false);');
panel=once(panel,'Ai(()=>__wtAutoEmote.dispose());','Ai(()=>__wtAutoEmote.dispose());Oe([Ue,P],()=>__wtFun.appearanceChanged());Oe(()=>R.isLoggedIn?R.userInfo?.id:0,()=>__wtFun.accountChanged());Ai(()=>{__wtFun.dispose();__wtThrust.dispose()});');
panel=once(panel,'assetId:Gt(R.userInfo)||void 0,layer:"head"','assetId:__wtWardrobe.characterId.value||Gt(R.userInfo)||void 0,layer:"head"');
panel=once(panel,'assetId:Gt(R.userInfo)||void 0,layer:"body"','assetId:__wtWardrobe.characterId.value||Gt(R.userInfo)||void 0,layer:"body"');
panel=once(panel,'const{x:e,y:t}=yu(R.userInfo);return{transform:','const{x:e,y:t}=__wtWardrobe.offset(()=>yu(R.userInfo));return{transform:');
panel=editFunction(panel,"lh",source=>once(source,"async function lh(e){","async function lh(e){if(e?.__wt_preview){await __wtWardrobe.select(e);return}"));
panel=once(panel,"Ai(()=>__wtAutoEmote.dispose());","Ai(()=>__wtAutoEmote.dispose());Oe([P,Ue],()=>__wtWardrobe.reapply());Oe(()=>R.isLoggedIn?R.userInfo?.id:0,()=>__wtWardrobe.accountChanged());Ai(()=>__wtWardrobe.dispose());");
panel=once(panel,'Sl=await tt("key-press",','await __wtInstallHelperActions(),await __wtKeyboard.mount(),Sl=await tt("key-press",');
panel=once(panel,'zi=await tt("dock-open-panel",e=>{const t=e.payload;_v(t)&&Xp(t)})','zi=await tt("dock-open-panel",e=>{const t=e.payload;_v(t)&&Xp(t)}),window.__wtMainReady=1,window.dispatchEvent(new Event("wt-main-ready"))');
panel=once(panel,'const t=e.payload.button,o=e.payload.action;','const t=e.payload.button,o=e.payload.action;if(!__wtMouseConnected){__wtKeyboard.mouse(t,o,{x:oe.value,y:fe.value});__wtFun.input("mouse",t,o==="press");}');
panel=once(panel,'const ee=j.closest("button");','const ee=j.closest("button,a[download]");');
panel=once(panel,'function He(D,x="visual"){const q=[],$=re=>','function He(D,x="visual"){const q=[];const k=G(D.querySelector("#wt-input-keyboard"));if(k)q.push(k);for(const lane of D.querySelectorAll(".wt-oath-core-lane,.wt-synthesis-reminder")){const r=G(lane);if(r)q.push(r)}const $=re=>');
panel+='\nimport{__wtHotkeys,__wtKeyboardUi,__wtRoomPositions,__wtNotice,__wtRoomHistoryCore,__wtAutoEmotes,__wtAccessoryThrust,__wtPhrolovaReaction,__wtPetFun,__wtLocalWardrobe,__wtSynthesis,__wtLongRun,__wtRenewSession,'+(v104?'__wtClickIO,__wtClickSession,__wtReportClicks,__wtSubmittedClicks,__wtMakeChestLedger,':'')+'cV as __wtRoomEmit}from"./index-CuzHFfJW.js";\n';
 }else{
 const start='await tt("wt-synthesis-reminder-updated",()=>__wtSynth.sync())';
 panel=editFunction(panel,'Uc',s=>synthesisInit+s);
 panel=once(panel,'Sl=await tt("key-press",','__wtSynth.start(),__wtStopSynth='+start+',Sl=await tt("key-press",');
 panel=once(panel,synthesisInit,synthesisInit+'let __wtStopSynth;Ai(()=>{__wtStopSynth?.();__wtDisposeCounter();__wtChestTask.dispose();__wtSessionTask.dispose()});');
 panel=once(panel,'function He(D,x="visual"){const q=[],$=re=>','function He(D,x="visual"){const q=[],hint=G(D.querySelector(".wt-synthesis-reminder"));if(hint)q.push(hint);const $=re=>');
 panel=once(panel,'K=(async()=>{E.value=!0','K=(async()=>{const __wtAccount=R.userInfo?.id;E.value=!0');
 panel=once(panel,'C.value=Gm(yt(await Ym())),I.value=!1','const items=Gm(yt(await Ym()));if(__wtAccount===R.userInfo?.id){C.value=items;I.value=!1;return items}');
 panel+='\nimport{__wtNotice,__wtSynthesis,__wtLongRun,__wtRenewSession,__wtClickIO,__wtClickSession,__wtReportClicks,__wtSubmittedClicks,__wtMakeChestLedger}from"./index-CuzHFfJW.js";\n';
}
let settings=upstream(assets.settings);
function injectComponent(source,name,prefix,render){let setup;traverse(babelParse(source,'settings.mjs',true),{ObjectExpression(p){if(p.node.properties.some(x=>x.key?.name==='__name'&&x.value?.value===name))setup=p.get('properties').find(x=>x.node.key?.name==='setup')}});assert(setup,'Missing component '+name);const returns=setup.node.body.body.filter(n=>n.type==='ReturnStatement');assert.equal(returns.length,1);const returned=returns[0].argument,arrow=returned.type==='SequenceExpression'?returned.expressions.at(-1):returned;assert.equal(arrow.type,'ArrowFunctionExpression');const exp=arrow.body.type==='SequenceExpression'?arrow.body.expressions.at(-1):arrow.body;assert.equal(exp.type,'CallExpression');let array=exp.arguments[2];if(name==='SettingsModule')setup.traverse({CallExpression(p){const a=p.node.arguments;if(a[1]?.type==='ObjectExpression'&&a[1].properties.some(x=>x.key?.name==='class'&&x.value?.value==='panel-content')&&a[2]?.type==='ArrayExpression')array=a[2]}});assert.equal(array.type,'ArrayExpression');const at=array.start+1;if(render)source=source.slice(0,at)+render+','+source.slice(at);const start=setup.node.body.start+1;return source.slice(0,start)+prefix+source.slice(start)}
settings=injectComponent(settings,'SettingsModule','const __wtSynthSettings=__wtSynthesis.settings(y,Oe,true);','__wtSynthesis.renderBasicSettings(e,__wtSynthSettings)');
settings+='\nimport{__wtSynthesis,__wtPanelLayout}from"./index-CuzHFfJW.js";\n';
settings=injectComponent(settings,'SettingsModule',(lite?'const ':'const __wtKeys=__wtHotkeys.createSettings(y,Oe),__wtMapping=__wtKeyboardUi.settings(y,Oe),')+'__wtAuto=y(localStorage.getItem("wuwatappo-auto-claim-chests-v1")==="1");let __wtBoostUntil=0;async function __wtBoost(){if(performance.now()<__wtBoostUntil)return;__wtBoostUntil=performance.now()+500;await ue({type:"boost-local-clicks",delta:10000})}async function __wtToggle(){const enabled=!__wtAuto.value;await ue({type:"set-auto-claim-chests",enabled});__wtAuto.value=enabled}',
 (lite?'':'__wtKeyboardUi.renderSettings(e,__wtMapping),__wtHotkeys.render(e,__wtKeys),')+'e("div",{class:"wt-ui-actions wt-ui-basic-actions"},[__wtPanelLayout.button(e,"本地点击数 +10000",__wtBoost,{class:"wt-ui-button wt-ui-button--primary"}),__wtPanelLayout.button(e,__wtAuto.value?"自动开箱：已开启":"自动开箱：已关闭",__wtToggle,{"aria-pressed":__wtAuto.value,title:"宝箱到期后延迟 5 秒领取"})])');
if(!lite){
settings=injectComponent(settings,"MainPanelAtlasTab","const __wtTrial=__wtLocalWardrobe.settings(y,Oe);","__wtLocalWardrobe.renderSettings(e,__wtTrial)");
settings=once(settings,'function k(h){if(Ke(h.asset_type)!=="character_skin")return!1;','function k(h){if(Ke(h.asset_type)!=="character_skin")return!1;if(__wtTrial.mode.value)return __wtLocalWardrobe.selected(h,t.selectedRoleId);');
settings=once(settings,'function D(h){if(Ke(h.asset_type)!=="accessory")return!1;','function D(h){if(Ke(h.asset_type)!=="accessory")return!1;if(__wtTrial.mode.value)return __wtLocalWardrobe.selected(h,t.selectedPartId);');
settings=once(settings,'function l(h){const $=h;if(!$.owned)return!1;','function l(h){const $=h;if(__wtTrial.mode.value){const type=Ke($.asset_type);return type==="character_skin"||type==="accessory"||type==="emote"&&__wtLocalWardrobe.canEmote($,t.selectedEmoteAssetIds)}if(!$.owned)return!1;');
settings=once(settings,'function P(T){if(T.asset_type==="character_skin"){M(T.role_id,','function P(T){if(T.__wt_preview){v("select-appearance",T);return}if(T.asset_type==="character_skin"){M(T.role_id,');
settings=once(settings,'function J(h){if(!h.owned||!h.asset_id)return null;const $=Ke(h.asset_type);return $?{asset_code:','function J(h){if(!h.asset_id||!h.owned&&!__wtTrial.mode.value)return null;const $=Ke(h.asset_type);return $?{__wt_preview:__wtTrial.mode.value,asset_code:');
settings+='\nimport{__wtLocalWardrobe}from"./index-CuzHFfJW.js";\n';
settings=injectComponent(settings,'MainPanelBagTab','const __wtShare=__wtInventoryShare.create(y,()=>({items:s.bagList,user:ae.userInfo,host:s.assetsCdnHost,loggedIn:ae.isLoggedIn,loading:s.bagListLoading}),Oe);','__wtInventoryShare.render(e,__wtShare)');

settings=injectComponent(settings,'SettingsModule','const __wtPetSettings=__wtPetFun.settings(y,Oe);','__wtPetFun.renderSettings(e,__wtPetSettings)');
settings+='\nimport{__wtPetFun}from"./index-CuzHFfJW.js";\n';
settings=injectComponent(settings,'SettingsModule','const __wtEmoteMode=__wtAutoEmotes.settings(y,Oe);','__wtAutoEmotes.renderSettings(e,__wtEmoteMode)');
panel=once(panel,'async function __wtInstallHelperActions(){','async function __wtInstallHelperActions(){__wtSynth.start();__wtHelperStops.push(await tt("wt-synthesis-reminder-updated",()=>__wtSynth.sync()));__wtWardrobe.start();__wtAutoEmote.start();__wtFun.start();__wtHelperStops.push(await tt("wt-auto-emotes-updated",()=>__wtAutoEmote.sync()));__wtHelperStops.push(await tt("wt-pet-fun-updated",()=>__wtFun.sync()));__wtHelperStops.push(await tt("wt-wardrobe-mode-updated",()=>__wtWardrobe.sync()));__wtHelperStops.push(await tt("wt-wardrobe-reset",()=>__wtWardrobe.clear()));');
settings+='\nimport{__wtAutoEmotes}from"./index-CuzHFfJW.js";\n';
settings=injectComponent(settings,'SettingsModule','let __wtMonitorStop,__wtMonitorClosed=false;ft(()=>{__wtMonitorClosed=true;__wtMonitorStop?.()});Qe(async()=>{try{const m=await import("http://127.0.0.1:48642/ui.js");if(!__wtMonitorClosed){const stop=await m.mountDefaultMonitorSettings({root:document.getElementById("wt-monitor-settings"),list:uo,listen:no,emit:__wtMonitorEmit});__wtMonitorClosed?stop():__wtMonitorStop=stop}}catch{const r=document.getElementById("wt-monitor-settings");r&&(r.textContent="默认显示器设置加载失败，请运行完整 Helper")}});','e("div",{id:"wt-monitor-settings"})');
settings=injectComponent(settings,'MainPanelRoomTab','const __wtRestoreRoom=()=>ue({type:"set-room-members-visibility",visible:true});async function __wtHistory(){try{const module=await import("http://127.0.0.1:48642/ui.js");await module.openRoomHistory({state:()=>({accountId:ae.isLoggedIn?ae.userInfo?.id:0,roomId:String(s.currentRoomId??""),mode:s.roomMode}),send:ue,listen:no,toast:Oe})}catch{Oe("历史房间加载失败，请运行完整 Helper")}}const __wtPlacement=__wtRoomPositions.settings(y,ue);',null);
settings=once(settings,'wr={class:"join-rooms"}','wr={class:"join-rooms wt-ui-join"}');
const historyButton='__wtPanelLayout.button(e,"历史房间",__wtHistory,{class:"wt-ui-button wt-ui-room-history"})';
settings=once(settings,'S(p(t)("rooms_join")),9,kr)])','S(p(t)("rooms_join")),9,kr),'+historyButton+'])');
settings=once(settings,'e("span",{class:"room-number-copy",role:"button",onClick:A})','e("button",{type:"button",class:"room-number-copy","aria-label":"复制房间号",onClick:A}),'+historyButton);
settings=once(settings,'e("label",Er,[e("input",{type:"checkbox",checked:s.onlyShowSelf','__wtPanelLayout.room(e,e("label",Er,[e("input",{type:"checkbox",checked:s.onlyShowSelf');
settings=once(settings,'S(p(t)("rooms_only_show_self")),1)]),s.roomMembers.length','S(p(t)("rooms_only_show_self")),1)]),__wtRoomPositions.render(e,__wtPlacement),__wtRestoreRoom),s.roomMembers.length');
settings+='\nimport{__wtRoomPositions}from"./index-CuzHFfJW.js";\n';
settings=once(settings,'function T(){requestAnimationFrame(()=>{xo().catch(x=>{console.warn("[panel] raise above pets failed",x)})})}','function T(){requestAnimationFrame(()=>{__wtNormalPanel(g).catch(x=>console.warn("[panel] normalize failed",x))})}');
settings=once(settings,'W[t.action]=l,await ms("set_app_shortcuts",{config:W})','W[t.action]=l,__wtCheckShortcutConflict(W,__wtHotkeys.read()),await ms("set_app_shortcuts",{config:W})');
settings=once(settings,'let __wtBoostUntil=0;','const __wtSaveKeys=__wtKeys.save;__wtKeys.save=async()=>{try{__wtCheckShortcutConflict(await ps(),__wtKeys.draft.value);__wtSaveKeys()}catch{__wtKeys.error.value=true;__wtKeys.message.value="与官方快捷键冲突或读取失败，请检查后重试"}};let __wtBoostUntil=0;');
settings+='\nfunction __wtCheckShortcutConflict(native,helper){const used=new Set(Object.values(helper).map(__wtHotkeys.canonical).filter(Boolean));for(const b of Object.values(native))if(b?.key&&used.has(__wtHotkeys.canonical(gs(b))))throw Error("duplicate")}\n';
settings+='\nimport{__wtHotkeys,__wtKeyboardUi,__wtInventoryShare,__wtNormalPanel,cV as __wtMonitorEmit}from"./index-CuzHFfJW.js";\n';
}
settings=once(settings,'label:o,href:Lt}),_','label:o,href:Lt}),_.push({key:"helper_disclaimer",label:"免责说明",href:"app://helper-disclaimer"}),_');
settings=once(settings,'if(L){if(L===as','if(L){if(L==="app://helper-disclaimer"){__wtNotice.open().catch(()=>Oe("免责说明打开失败，请重试"));return}if(L===as');
settings=once(settings,'Po().catch(ye=>{console.warn("[about] open failed",ye)})','__wtNotice.original().catch(ye=>{console.warn("[about] open failed",ye)})');
settings+='\nimport{__wtNotice}from"./index-CuzHFfJW.js";\n';
if(v104&&!lite){
 settings=editFunction(settings,'Hs',source=>{
  assert(source.includes('updater_disabled'),'Official check button changed');
  return `const __wtUpdateState=y({});let __wtUpdateUi,__wtUpdateLoad,__wtUpdateClosed=false;
  function __wtLoadUpdate(){return __wtUpdateLoad??=(import("http://127.0.0.1:48642/ui.js").then(m=>{if(!__wtUpdateClosed)__wtUpdateUi=m.mountHelperUpdate(s=>__wtUpdateState.value=s,()=>import("./quitApp-KiLkJnLY.js").then(q=>q.quitApp()));return __wtUpdateUi}).catch(()=>{__wtUpdateLoad=null;if(!__wtUpdateClosed)__wtUpdateState.value={state:"error",message:"更新服务未连接，请运行完整 Helper。"}}))}
  Qe(__wtLoadUpdate);ft(()=>{__wtUpdateClosed=true;__wtUpdateUi?.stop()});
  async function Hs(){if(re.value)return;re.value=true;try{await (await __wtLoadUpdate())?.click(__wtUpdateState.value)}finally{re.value=false}}
  async function __wtOpenUpdate(){const ui=await __wtLoadUpdate();if(ui)await ui.open();else window.open("https://github.com/Fantasicrap/Wuwatappo_Helper/releases","_blank","noopener,noreferrer")}`;
 });
 settings=once(settings,'S(X.value),1),e("div",El,S(le.value),1)','S(__wtUpdateState.value.current||'+JSON.stringify(target)+'),1),e("div",El,S(__wtUpdateState.value.message||le.value),1)');
 settings=once(settings,'disabled:!p(ne)||re.value,onMousedown:o[25]', 'disabled:re.value||["checking","downloading","applying"].includes(__wtUpdateState.value.state),onMousedown:o[25]');
 settings=once(settings,'S(p(t)("setting_version_check_btn")),41,xl)])','S(__wtUpdateState.value.state==="ready"?"重启并更新":p(t)("setting_version_check_btn")),41,xl),e("button",{type:"button",class:"setting-btn",hidden:__wtUpdateState.value.state!=="error",onClick:__wtOpenUpdate},"去 GitHub 下载",8,["hidden"])])');
 settings=once(settings,']),e("div",Tl,[e("div",Rl,',']),e("div",{id:"wt-us"}),e("div",Tl,[e("div",Rl,');
}
if(lite){
 settings=once(settings,'S(X.value),1),e("div",El,S(le.value),1)','S('+JSON.stringify(target+' · \u8f7b\u91cf\u9884\u89c8')+'),1),e("div",El,S(le.value),1)');
 settings=once(settings,'class:"setting-btn btn-check-update",','class:"setting-btn btn-check-update",hidden:!0,');
}
// Reorder the reviewed settings rows without replacing their bindings or actions.
function groupSettings(source){
 let panelCall;
 traverse(babelParse(source,'settings.mjs',true),{ObjectExpression(p){
  if(!p.node.properties.some(prop=>prop.key?.name==='__name'&&prop.value?.value==='SettingsModule'))return;
  p.traverse({CallExpression(p){
   const node=p.node;
   if(node.arguments[1]?.properties?.some(prop=>prop.key?.name==='class'&&prop.value?.value==='panel-content')&&node.arguments[2]?.type==='ArrayExpression'){
    assert(!panelCall,'Ambiguous settings content');panelCall=node;
   }
  }});
 }});
 assert(panelCall,'Missing settings panel');
 const rows=panelCall.arguments[2];
 const available=rows.elements.map(node=>source.slice(node.start,node.end));
 const take=marker=>{
  const matches=available.filter(row=>row.includes(marker));
  assert.equal(matches.length,1,'Settings row changed: '+marker);
  available.splice(available.indexOf(matches[0]),1);
  return matches[0];
 };
 const group=(id,items)=>'__wtPanelLayout.group(e,"'+id+'",['+items.join(',')+'])';
 const sections=[
  group('basic',[take('wt-ui-basic-actions'),take('__wtSynthesis.renderBasicSettings')]),
  group('account',[take('"setting_nickname"'),take('"setting_total_click"'),take('"setting_redeem_code"'),take('"setting_view_log"')])
 ];
 if(!lite)sections.push(group('input',[take('__wtKeyboardUi.renderSettings'),take('__wtHotkeys.render')]));
 sections.push(group('desktop',[
  ...['pet_scale','window_opacity','toggle_pet','game_mode','auto_game_mode_fullscreen','window_penetrate','hover_auto_hide','always_show_chest','screen'].map(id=>take('"setting_'+id+'"')),
  ...(!lite?[take('wt-monitor-settings')]:[])
 ]));
 if(!lite)sections.push(group('interaction',[take('__wtPetFun.renderSettings'),take('__wtAutoEmotes.renderSettings')]));
 sections.push(group('maintenance',[
  ...['auto_launch','show_taskbar_icon','language','version'].map(id=>take('"setting_'+id+'"')),
  ...(v104&&!lite?[take('"wt-us"')]:[])
 ]));
 // Keep the original about/legal links in the footer outside the disclosures.
 assert.equal(available.length,1,'Unexpected ungrouped settings rows');
 assert(available[0].includes('href')||available[0].includes('onClick'));
 const flag=panelCall.arguments[3];
 if(flag)source=source.slice(0,flag.start)+'-2'+source.slice(flag.end);
 return source.slice(0,rows.start)+'['+sections.concat(available).join(',')+']'+source.slice(rows.end);
}
if(v104)settings=groupSettings(settings);
let about=upstream(assets.about);
about=once(about,'y=q();let g;','y=q();const __wtLegal=__wtNotice.about(y,R);let g;');
about=once(about,'function A(){const r=b.value;','function A(){if(__wtLegal.active.value){y.setTitle("免责说明");return}const r=b.value;');
about=once(about,'u.value=m()}).then','u.value=m(),A()}).then');
let aboutRender;
traverse(babelParse(about,'about.mjs',true),{ReturnStatement(p){const a=p.node.argument;if(a?.type==='ArrowFunctionExpression'&&about.slice(a.start,a.end).includes('about-root')){assert(!aboutRender);aboutRender=a.body}}});
assert(aboutRender);about=about.slice(0,aboutRender.start)+'__wtLegal.active.value?__wtNotice.render(__wtLegal):('+about.slice(aboutRender.start,aboutRender.end)+')'+about.slice(aboutRender.end);
about+='\nimport{__wtNotice}from"./index-CuzHFfJW.js";\n';
let bridge=upstream(assets.bridge);
if(!lite){
bridge=once(bridge,'async function Ha(e){await u("open_panel_window",{payload:{tab:e??null}})}','async function Ha(e){await u("set_skip_panel_outside_click_close",{skip:true}).catch(()=>{});await u("open_panel_window",{payload:{tab:e??null}});await u("set_skip_panel_outside_click_close",{skip:true}).catch(()=>{})}');
bridge=once(bridge,'async function $a(){await u("raise_panel_window_above_pets")}','async function $a(){}');
bridge=editFunction(bridge,'Aa',s=>{
 s=once(s,'async function Aa()','async function Aa(__wtTarget)');
 s=once(s,'if(d.length<=1)','if(!d.length||!__wtTarget&&d.length<=1)');
 s=once(s,'const g=(N+1)%d.length,c=d[g]','const g=__wtTarget?d.findIndex(m=>p(m)===__wtTarget):(N+1)%d.length;if(g<0)throw Error("Display disconnected");const c=d[g]');
 s=once(s,'w("DISPLAY","switch_start"','if(__wtTarget&&m===v)return!0;w("DISPLAY","switch_start"');
 return once(s,'target_confirmed:f==null?null:p(f)===v},!0','target_confirmed:f==null?null:p(f)===v},__wtTarget?n.target_confirmed===!0:!0');
});
bridge=editFunction(bridge,'An',()=> 'async function An(t){if(O){if(!t)return O;await O}O=Aa(t);try{return await O}finally{O=null}}');
bridge+='\nimport{D as __wtWindow}from"./index-CuzHFfJW.js";if(__wtWindow().label==="main")import("http://127.0.0.1:48642/ui.js").then(m=>m.installDefaultMonitor({list:vn,move:An,current:async()=>K(await ye()),listen:A,emit:h})).catch(console.warn);\n';
if(v104)bridge=once(bridge,'.then(m=>m.installDefaultMonitor({','.then(m=>{m.watchAutomaticHelperUpdate(()=>import("./quitApp-KiLkJnLY.js").then(q=>q.quitApp()));return m.installDefaultMonitor({').replace('listen:A,emit:h})).catch(console.warn)','listen:A,emit:h})}).catch(console.warn)');
}
const resources=[{name:panelAsset,text:panel},{name:commonAsset,text:common},{name:'/assets/'+assets.settings,text:settings},{name:'/assets/'+assets.bridge,text:bridge},{name:'/assets/'+assets.about,text:about}];
if(v104)for(const resource of resources)resource.text=resource.text.replaceAll('./index-CuzHFfJW.js','./'+assets.common).replaceAll('cV as __wt',assets.emit+' as __wt');
function compressResource(text, budget){
 const bytes=Buffer.from(text);
 const compress=mode=>zlib.brotliCompressSync(bytes,{params:{
  [zlib.constants.BROTLI_PARAM_QUALITY]:11,
  [zlib.constants.BROTLI_PARAM_MODE]:mode,
  [zlib.constants.BROTLI_PARAM_LGWIN]:22
 }});
 const standard=compress(zlib.constants.BROTLI_MODE_TEXT);
 // Alternate Brotli coding is compatible with the same decoder.
 return standard.length<=budget?standard:compress(zlib.constants.BROTLI_MODE_FONT);
}
const output=Buffer.from(original),checks=[];for(const r of resources){const file=path.join(out,path.basename(r.name));fs.writeFileSync(file,r.text);babelParse(r.text,file,true);const meta=manifest.assets.find(a=>a.name===r.name),compressed=compressResource(r.text,meta.compressedBytes);assert(compressed.length<=meta.compressedBytes,`${r.name} exceeds reserved space (${compressed.length}/${meta.compressedBytes})`);output.fill(0,meta.offset,meta.offset+meta.compressedBytes);compressed.copy(output,meta.offset);assert(zlib.brotliDecompressSync(output.subarray(meta.offset,meta.offset+meta.compressedBytes)).equals(Buffer.from(r.text)));checks.push({asset:r.name,syntaxPassed:true,budget:meta.compressedBytes,compressed:compressed.length,fits:true,offset:meta.offset})}
let cursor=0;for(const c of [...checks].sort((a,b)=>a.offset-b.offset)){assert(original.subarray(cursor,c.offset).equals(output.subarray(cursor,c.offset)));cursor=c.offset+c.budget}assert(original.subarray(cursor).equals(output.subarray(cursor)));fs.writeFileSync(path.join(out,'payload.exe'),output);
fs.writeFileSync(path.join(out,'checkpoint.json'),JSON.stringify({target,edition:lite?'lite':'full',sourceSha256:hash(original),resources:checks,nativeMachineCodeChanged:false,payloadProduced:true,allFeaturesReady:false,realAccountOrHardwareTested:false},null,2));console.log(JSON.stringify(checks,null,2));


