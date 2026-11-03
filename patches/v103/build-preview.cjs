// Local 1.0.3 adaptation preview; real account and hardware validation remains pending.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),zlib=require('zlib'),assert=require('assert/strict');
const {babelParse,traverse}=require('playwright/lib/transform/babelBundle');
const root=path.resolve(__dirname,'../..'),input=process.env.WUWA_SOURCE_EXE||'F:/WuwaTappo/WuwaTappo.exe',stage=path.join(root,'dist/upstream-1.0.3'),out=path.join(root,'dist/migration-1.0.3.4');fs.mkdirSync(out,{recursive:true});
const original=fs.readFileSync(input),hash=b=>crypto.createHash('sha256').update(b).digest('hex'),manifest=JSON.parse(fs.readFileSync(path.join(stage,'extraction-manifest.json'),'utf8'));
assert.equal(hash(original),'cedc37d0c11d112f4d933647fb6cf00e1dca847fc763250984c647080f849080');
const read=name=>{let code=fs.readFileSync(path.join(root,'patches',name),'utf8');const comments=babelParse(code,'helper.mjs',true).comments??[];for(const c of comments.slice().reverse())code=code.slice(0,c.start)+code.slice(c.end);return code};
const mapping=JSON.parse(fs.readFileSync(path.join(__dirname,'panel-symbols.json'),'utf8'));
function translate(code,renames={}){const ast=babelParse(code,'helper.mjs',true),edits=new Map();traverse(ast,{Identifier(p){const name=p.node.name,b=p.scope.getBinding(name);let to;if(b&&renames[name]&&(p.node===b.identifier||b.referencePaths.includes(p)))to=renames[name];else if(!b&&p.isReferencedIdentifier())to=mapping[name];if(to&&to!==name)edits.set(p.node.start,{end:p.node.end,to})}});for(const[start,{end,to}]of [...edits].sort((a,b)=>b[0]-a[0]))code=code.slice(0,start)+to+code.slice(end);return code}
function once(s,a,b){assert.equal(s.split(a).length-1,1,'Changed migration anchor: '+a);return s.replace(a,b)}
function editFunction(s,name,fn){const matches=[];traverse(babelParse(s,'resource.mjs',true),{FunctionDeclaration(p){if(p.node.id.name===name)matches.push(p.node)}});assert.equal(matches.length,1,'Ambiguous function '+name);const n=matches[0];return s.slice(0,n.start)+fn(s.slice(n.start,n.end))+s.slice(n.end)}
const panelAsset='/assets/index-pp8VWaUF.js',commonAsset='/assets/index-CuzHFfJW.js';let panel=fs.readFileSync(path.join(stage,path.basename(panelAsset)),'utf8'),common=fs.readFileSync(path.join(stage,path.basename(commonAsset)),'utf8');
Object.assign(mapping,{Qp:'nh',Am:'xm'});
panel='const __wtRoomHistory=__wtRoomHistoryCore.create();\n'+panel;
common+='\n'+read('room-history-core.js')+'\nexport {__wtRoomHistoryCore};\n';
panel=once(panel,'a.value=Cd(xe?.o)?"owner":"member",We("rd",{r:u.value},st)','a.value=Cd(xe?.o)?"owner":"member",xe&&R.isLoggedIn&&__wtRoomHistory.remember(Ee,u.value),We("rd",{r:u.value},st)');
panel=editFunction(panel,'it',()=>translate(read('counter-guard-runtime.js'),{tt:'it'}));
panel=editFunction(panel,'jp',s=>read('auto-chest-runtime.js')+s.replace('switch(e.type){','switch(e.type){case"boost-local-clicks":__wtBoostLocalClicks(e.delta);break;case"set-auto-claim-chests":__wtSetAutoChest(e.enabled);it();break;case"set-room-members-visibility":__wtSetAllRoomMembersVisible(e.visible);break;'));
panel=editFunction(panel,'jp',s=>translate(read('room-history-runtime.js'))+s.replace('switch(e.type){','switch(e.type){case"join-room-history":__wtEnterHistoryRoom(e);break;'));
panel=once(panel,'Lr=setInterval(()=>{R.isLoggedIn&&Vn()},1e3)','Lr=setInterval(()=>{R.isLoggedIn&&Vn();__wtAutoChestTick()},1e3)');
// Preserve claim deadlines across resume in the synchronized server clock.
panel=editFunction(panel,'Cp',s=>once(s,'performance.now()+fr','is()+fr'));
panel=editFunction(panel,'Vn',s=>once(once(s,'kr-t','kr-e'),'Cr-t','Cr-e'));
panel=editFunction(panel,'ul',()=> '');panel=editFunction(panel,'xd',()=> '');
panel=editFunction(panel,'no',()=>translate(read('room-visibility-policy.js'),{cl:'ul',Md:'xd'}));
panel=editFunction(panel,'eh',s=>once(s,'ul(o,!1)','ul(o,!1,!0)'));
// The original replacements above intentionally leave one definition each.
panel=editFunction(panel,'hh',s=>translate(read('room-visibility-runtime.js'))+s);
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
panel=editFunction(panel,'vt',s=>once(s,'o.value={...o.value,...t}','o.value={...o.value,...t};__wtSaveRoomPosition(e,t)'));
panel=editFunction(panel,'Bi',s=>s.slice(0,-1)+';__wtSaveRoomPosition(e,{left:e.left,top:e.top})}');
panel=editFunction(panel,'Fd',s=>once(s,'if(ut.has(e.id)||!Lt.value)return;','if(ut.has(e.id)||!Lt.value)return;if(__wtRestoreRoomPosition(e))return;'));
panel=editFunction(panel,'tc',s=>once(s,'ut.has(e.id)&&Mt.add(e.id)','ut.has(e.id)&&!__wtRestoreRoomPosition(e)&&Mt.add(e.id)'));
panel=editFunction(panel,'gl',s=>read('v103/room-positions.js')+s);
panel=once(panel,'function Ul(e){A.value=Bl(e),nn&&clearTimeout(nn),nn=setTimeout(()=>{A.value=1,nn=null},220)}','function Ul(e){A.value=Bl(e);if(nn)clearTimeout(nn);nn=qr.size?null:setTimeout(()=>{A.value=1;nn=null},220)}');
panel=once(panel,'const t=qr.delete(e),o=va.delete(e);!t&&!o||Ie()','const t=qr.delete(e),o=va.delete(e);if(t&&!qr.size&&!nn)A.value=1;!t&&!o||Ie()');
const helpers=['hotkeys-core.js','inventory-share.js','input-recorder.js','keyboard-ui.js','room-positions-core.js','startup-notice.js','auto-emotes.js','accessory-thrust.js','phrolova-reaction.js','happy-ending.js','oath-core.js','pet-fun.js','local-wardrobe.js','synthesis-reminder.js'].map(n=>n==='hotkeys-core.js'?read(n).replace(' const defaults=',' actions.splice(0,3);\n const defaults='):n==='startup-notice.js'?read(n).replace('__WT_DISCLAIMER_TEXT__',JSON.stringify(fs.readFileSync(path.join(root,'DISCLAIMER.txt'),'utf8').replace(/^\uFEFF/,''))):n==='pet-fun.js'?read(n).replace('__WT_OATH_CORE_ICON__',JSON.stringify('data:image/png;base64,'+fs.readFileSync(path.join(root,'patches/assets/oath-core.png')).toString('base64'))):n==='happy-ending.js'?read(n).replace('__WT_WILTED_ECHO_ICON__',JSON.stringify('data:image/png;base64,'+fs.readFileSync(path.join(root,'patches/assets/wilted-echo.png')).toString('base64'))):read(n)).join('\n');common+='\n'+helpers;
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
common+='\n'+read('controller-core.js').replace('export const ControllerCore','const __wtControllerCore')+'\n';
let mainBoot;
traverse(babelParse(panel,'panel.mjs',true),{CallExpression(p){const n=p.node;if(n.callee.name==='js'&&n.arguments[0]?.type==='ArrowFunctionExpression'&&panel.slice(n.start,n.end).includes('main_mount_failed')){assert(!mainBoot);mainBoot=n.arguments[0].body.start+1}}});
assert(mainBoot);panel=panel.slice(0,mainBoot)+'if(!await __wtNotice.confirm()){await Ct("exit_app");return}'+panel.slice(mainBoot);
panel=once(panel,'Nv()||Bv().catch','true||Bv().catch');
const init='const __wtSynth=__wtSynthesis.create({watch:Oe,account:()=>R.isLoggedIn?R.userInfo?.id:0,inventory:()=>C.value,catalog:()=>w.value,root:()=>ce.value?.querySelector(".cat-stack"),open:()=>Xp("exchange"),blocked:Ie,changed:()=>Fe(Me),load:async()=>{let a=await G();if(!a&&R.isLoggedIn)a=await G();await St();return Array.isArray(a)}});Ai(()=>__wtSynth.dispose());'+translate(read('keyboard-position.js'))+'\n'+read('v103/helper-actions.js')+'\n'+read('v103/mouse-feed.js')+'\nconst __wtKeyboard=__wtKeyboardUi.create({listen:tt,activity:__wtSyncMouseFeed,layout:()=>Fe(()=>{__wtPositionKeyboard();Me()}),toClient:Wt,pointer:()=>({x:oe.value,y:fe.value}),visible:()=>_.value,hotkeys:__wtHotkeys,blocked:()=>Ie()||__wtHelperCapture.size>0});Oe(_,()=>__wtKeyboard.syncActivity());Ai(()=>{__wtStopMouseFeed();__wtDisposeHelperActions();__wtDisposePosition();__wtKeyboard.dispose();__wtDisposeCounter();__wtChestTask.dispose();__wtSessionTask.dispose()});\n';
panel=editFunction(panel,'Uc',s=>init+'const __wtAutoEmote=__wtAutoEmotes.create({defer:true,state:()=>({account:R.isLoggedIn?R.userInfo?.id:0,equipped:La.value}),load:G,send:item=>Ap({id:item.id,src:te("emote/"+item.name)}),normalize:__wtHotkeys.normalizeKey,blocked:()=>Ie()||__wtHelperCapture.size>0});Oe(()=>R.isLoggedIn?R.userInfo?.id:0,()=>__wtAutoEmote.refresh());Ai(()=>__wtAutoEmote.dispose());\n'+once(s.replace('{','{if(!__wtKeysConnected)__wtKeyboard.key(e,true);const __wtAction=__wtHotkeys.nativeDown(e);__wtPerformHelperAction(__wtAction);'),'qr.add(e);','qr.add(e);if(!__wtAction)__wtAutoEmote.down(e);'));
panel=once(panel,'K=(async()=>{E.value=!0','K=(async()=>{const __wtAccount=R.userInfo?.id;E.value=!0');
panel=once(panel,'C.value=Gm(yt(await Ym()))','const __wtItems=Gm(yt(await Ym()));if(__wtAccount===R.userInfo?.id){C.value=__wtItems;__wtAutoEmote.inventory(C.value,__wtAccount);return C.value}');
panel=editFunction(panel,'Vc',s=>s.replace('{','{__wtHotkeys.nativeUp(e);if(!__wtKeysConnected)__wtKeyboard.key(e,false);'));
panel=once(panel,'const Ue=W(ai),xn=pe(()=>{','const Ue=W(ai),__wtWardrobe=__wtLocalWardrobe.create({ref:W,account:()=>R.isLoggedIn?R.userInfo?.id:0,user:()=>R.isLoggedIn?R.userInfo:null,getShown:()=>({character:P.value,accessory:Ue.value}),setCharacter:name=>P.value=name,setAccessory:name=>Ue.value=name,cloudEmotes:()=>R.isLoggedIn?rr(R.userInfo):V.value,setEmotes:items=>__wtLocalEmotes.value=items,toast:mt,changed:()=>{it();Fe(Me)}}),__wtFun=__wtPetFun.create({ref:W,role:()=>__wtWardrobe.role({id:R.userInfo?.role_id,name:P.value}),root:()=>ce.value?.querySelector(".cat-stack"),part:()=>Ue.value,account:()=>R.isLoggedIn?R.userInfo?.id:0,normalize:__wtHotkeys.normalizeKey,blocked:()=>Ie()||__wtHelperCapture.size>0,overUi:()=>!!document.elementFromPoint(oe.value,fe.value)?.closest(".wt-oath-core-drop,.wt-pet-fun-settings,.wt-synthesis-reminder"),down:key=>__wtThrust.down(key),up:key=>__wtThrust.up(key),pulse:()=>__wtThrust.pulse(),resetMotion:()=>__wtThrust.reset(),changed:()=>Fe(Me),activity:()=>__wtSyncMouseFeed()}),__wtThrust=__wtAccessoryThrust.create({ref:W,part:()=>Ue.value,blocked:()=>Ie()||__wtHelperCapture.size>0,onThrust:()=>__wtFun.visual(),enabled:()=>__wtFun.active()&&__wtFun.eligible(),visual:()=>__wtFun.config.weapon&&__wtFun.eligible()}),xn=pe(()=>{');
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
panel+='\nimport{__wtHotkeys,__wtKeyboardUi,__wtRoomPositions,__wtNotice,__wtRoomHistoryCore,__wtAutoEmotes,__wtAccessoryThrust,__wtPhrolovaReaction,__wtPetFun,__wtLocalWardrobe,__wtSynthesis,__wtLongRun,__wtRenewSession,cV as __wtRoomEmit}from"./index-CuzHFfJW.js";\n';
let settings=fs.readFileSync(path.join(stage,'index-CiT_jZa7.js'),'utf8');
function injectComponent(source,name,prefix,render){let setup;traverse(babelParse(source,'settings.mjs',true),{ObjectExpression(p){if(p.node.properties.some(x=>x.key?.name==='__name'&&x.value?.value===name))setup=p.get('properties').find(x=>x.node.key?.name==='setup')}});assert(setup,'Missing component '+name);const returns=setup.node.body.body.filter(n=>n.type==='ReturnStatement');assert.equal(returns.length,1);const returned=returns[0].argument,arrow=returned.type==='SequenceExpression'?returned.expressions.at(-1):returned;assert.equal(arrow.type,'ArrowFunctionExpression');const exp=arrow.body.type==='SequenceExpression'?arrow.body.expressions.at(-1):arrow.body;assert.equal(exp.type,'CallExpression');let array=exp.arguments[2];if(name==='SettingsModule')setup.traverse({CallExpression(p){const a=p.node.arguments;if(a[1]?.type==='ObjectExpression'&&a[1].properties.some(x=>x.key?.name==='class'&&x.value?.value==='panel-content')&&a[2]?.type==='ArrayExpression')array=a[2]}});assert.equal(array.type,'ArrayExpression');const at=array.start+1;source=source.slice(0,at)+render+','+source.slice(at);const start=setup.node.body.start+1;return source.slice(0,start)+prefix+source.slice(start)}
settings=injectComponent(settings,'SettingsModule','const __wtKeys=__wtHotkeys.createSettings(y,Oe),__wtMapping=__wtKeyboardUi.settings(y,Oe),__wtAuto=y(localStorage.getItem("wuwatappo-auto-claim-chests-v1")==="1");let __wtBoostUntil=0;async function __wtBoost(){if(performance.now()<__wtBoostUntil)return;__wtBoostUntil=performance.now()+500;await ue({type:"boost-local-clicks",delta:10000})}async function __wtToggle(){const enabled=!__wtAuto.value;await ue({type:"set-auto-claim-chests",enabled});__wtAuto.value=enabled}',
 '__wtKeyboardUi.renderSettings(e,__wtMapping),__wtHotkeys.render(e,__wtKeys),e("div",{style:{display:"flex",gap:"8px",padding:"12px",flexWrap:"wrap"}},[e("button",{type:"button",class:"setting-btn",style:{position:"static",padding:"6px 12px",border:"1px solid #E7B77C",borderRadius:"14px",background:"#fff3dd",color:"#8e5e43",font:"inherit"},onClick:__wtBoost},"本地点击数 +10000"),e("button",{type:"button",class:"setting-btn",style:{position:"static",padding:"6px 12px",border:"1px solid #E7B77C",borderRadius:"14px",background:"#fff3dd",color:"#8e5e43",font:"inherit"},onClick:__wtToggle},__wtAuto.value?"自动宝箱：开（延迟5秒）":"自动宝箱：关",1)])');
settings=injectComponent(settings,"MainPanelAtlasTab","const __wtTrial=__wtLocalWardrobe.settings(y,Oe);","__wtLocalWardrobe.renderSettings(e,__wtTrial)");
settings=once(settings,'function k(h){if(Ke(h.asset_type)!=="character_skin")return!1;','function k(h){if(Ke(h.asset_type)!=="character_skin")return!1;if(__wtTrial.mode.value)return __wtLocalWardrobe.selected(h,t.selectedRoleId);');
settings=once(settings,'function D(h){if(Ke(h.asset_type)!=="accessory")return!1;','function D(h){if(Ke(h.asset_type)!=="accessory")return!1;if(__wtTrial.mode.value)return __wtLocalWardrobe.selected(h,t.selectedPartId);');
settings=once(settings,'function l(h){const $=h;if(!$.owned)return!1;','function l(h){const $=h;if(__wtTrial.mode.value){const type=Ke($.asset_type);return type==="character_skin"||type==="accessory"||type==="emote"&&__wtLocalWardrobe.canEmote($,t.selectedEmoteAssetIds)}if(!$.owned)return!1;');
settings=once(settings,'function P(T){if(T.asset_type==="character_skin"){M(T.role_id,','function P(T){if(T.__wt_preview){v("select-appearance",T);return}if(T.asset_type==="character_skin"){M(T.role_id,');
settings=once(settings,'function J(h){if(!h.owned||!h.asset_id)return null;const $=Ke(h.asset_type);return $?{asset_code:','function J(h){if(!h.asset_id||!h.owned&&!__wtTrial.mode.value)return null;const $=Ke(h.asset_type);return $?{__wt_preview:__wtTrial.mode.value,asset_code:');
settings+='\nimport{__wtLocalWardrobe}from"./index-CuzHFfJW.js";\n';
settings=injectComponent(settings,'MainPanelBagTab','const __wtShare=__wtInventoryShare.create(y,()=>({items:s.bagList,user:ae.userInfo,host:s.assetsCdnHost,loggedIn:ae.isLoggedIn,loading:s.bagListLoading}),Oe);','__wtInventoryShare.render(e,__wtShare)');
settings=injectComponent(settings,'SettingsModule','const __wtSynthSettings=__wtSynthesis.settings(y,Oe);','__wtSynthesis.renderSettings(e,__wtSynthSettings)');
settings+='\nimport{__wtSynthesis}from"./index-CuzHFfJW.js";\n';
settings=injectComponent(settings,'SettingsModule','const __wtPetSettings=__wtPetFun.settings(y,Oe);','__wtPetFun.renderSettings(e,__wtPetSettings)');
settings+='\nimport{__wtPetFun}from"./index-CuzHFfJW.js";\n';
settings=injectComponent(settings,'SettingsModule','const __wtEmoteMode=__wtAutoEmotes.settings(y,Oe);','__wtAutoEmotes.renderSettings(e,__wtEmoteMode)');
panel=once(panel,'async function __wtInstallHelperActions(){','async function __wtInstallHelperActions(){__wtSynth.start();__wtHelperStops.push(await tt("wt-synthesis-reminder-updated",()=>__wtSynth.sync()));__wtWardrobe.start();__wtAutoEmote.start();__wtFun.start();__wtHelperStops.push(await tt("wt-auto-emotes-updated",()=>__wtAutoEmote.sync()));__wtHelperStops.push(await tt("wt-pet-fun-updated",()=>__wtFun.sync()));__wtHelperStops.push(await tt("wt-wardrobe-mode-updated",()=>__wtWardrobe.sync()));__wtHelperStops.push(await tt("wt-wardrobe-reset",()=>__wtWardrobe.clear()));');
settings+='\nimport{__wtAutoEmotes}from"./index-CuzHFfJW.js";\n';
settings=injectComponent(settings,'SettingsModule','let __wtMonitorStop,__wtMonitorClosed=false;ft(()=>{__wtMonitorClosed=true;__wtMonitorStop?.()});Qe(async()=>{try{const m=await import("http://127.0.0.1:48642/ui.js");if(!__wtMonitorClosed){const stop=await m.mountDefaultMonitorSettings({root:document.getElementById("wt-monitor-settings"),list:uo,listen:no,emit:__wtMonitorEmit});__wtMonitorClosed?stop():__wtMonitorStop=stop}}catch{const r=document.getElementById("wt-monitor-settings");r&&(r.textContent="默认显示器设置加载失败，请运行完整 Helper")}});','e("div",{id:"wt-monitor-settings"})');
settings=injectComponent(settings,'MainPanelRoomTab','async function __wtVisible(visible){await ue({type:"set-room-members-visibility",visible})}async function __wtHistory(){try{const module=await import("http://127.0.0.1:48642/ui.js");await module.openRoomHistory({state:()=>({accountId:ae.isLoggedIn?ae.userInfo?.id:0,roomId:String(s.currentRoomId??""),mode:s.roomMode}),send:ue,listen:no,toast:Oe})}catch{Oe("历史房间加载失败，请运行完整 Helper")}}','e("div",{style:{display:"flex",gap:"8px",margin:"12px 0",flexWrap:"wrap"}},[e("button",{type:"button",class:"setting-btn",style:{position:"static",padding:"6px 12px",border:"1px solid #E7B77C",borderRadius:"14px",background:"#fff3dd",color:"#8e5e43",font:"inherit"},onClick:()=>__wtVisible(false)},"一键不可见"),e("button",{type:"button",class:"setting-btn",style:{position:"static",padding:"6px 12px",border:"1px solid #E7B77C",borderRadius:"14px",background:"#fff3dd",color:"#8e5e43",font:"inherit"},onClick:()=>__wtVisible(true)},"一键可见"),e("button",{type:"button",class:"setting-btn",style:{position:"static",padding:"6px 12px",border:"1px solid #E7B77C",borderRadius:"14px",background:"#fff3dd",color:"#8e5e43",font:"inherit"},onClick:__wtHistory},"历史房间")])');
settings=once(settings,'function T(){requestAnimationFrame(()=>{xo().catch(x=>{console.warn("[panel] raise above pets failed",x)})})}','function T(){requestAnimationFrame(()=>{__wtNormalPanel(g).catch(x=>console.warn("[panel] normalize failed",x))})}');
settings=once(settings,'W[t.action]=l,await ms("set_app_shortcuts",{config:W})','W[t.action]=l,__wtCheckShortcutConflict(W,__wtHotkeys.read()),await ms("set_app_shortcuts",{config:W})');
settings=once(settings,'let __wtBoostUntil=0;','const __wtSaveKeys=__wtKeys.save;__wtKeys.save=async()=>{try{__wtCheckShortcutConflict(await ps(),__wtKeys.draft.value);__wtSaveKeys()}catch{__wtKeys.error.value=true;__wtKeys.message.value="与官方快捷键冲突或读取失败，请检查后重试"}};let __wtBoostUntil=0;');
settings+='\nfunction __wtCheckShortcutConflict(native,helper){const used=new Set(Object.values(helper).map(__wtHotkeys.canonical).filter(Boolean));for(const b of Object.values(native))if(b?.key&&used.has(__wtHotkeys.canonical(gs(b))))throw Error("duplicate")}\n';
settings+='\nimport{__wtHotkeys,__wtKeyboardUi,__wtInventoryShare,__wtNormalPanel,cV as __wtMonitorEmit}from"./index-CuzHFfJW.js";\n';
settings=once(settings,'label:o,href:Lt}),_','label:o,href:Lt}),_.push({key:"helper_disclaimer",label:"免责说明",href:"app://helper-disclaimer"}),_');
settings=once(settings,'if(L){if(L===as','if(L){if(L==="app://helper-disclaimer"){__wtNotice.open().catch(()=>Oe("免责说明打开失败，请重试"));return}if(L===as');
settings=once(settings,'Po().catch(ye=>{console.warn("[about] open failed",ye)})','__wtNotice.original().catch(ye=>{console.warn("[about] open failed",ye)})');
settings+='\nimport{__wtNotice}from"./index-CuzHFfJW.js";\n';
let about=fs.readFileSync(path.join(stage,'index-BEWn23m-.js'),'utf8');
about=once(about,'y=q();let g;','y=q();const __wtLegal=__wtNotice.about(y,R);let g;');
about=once(about,'function A(){const r=b.value;','function A(){if(__wtLegal.active.value){y.setTitle("免责说明");return}const r=b.value;');
about=once(about,'u.value=m()}).then','u.value=m(),A()}).then');
let aboutRender;
traverse(babelParse(about,'about.mjs',true),{ReturnStatement(p){const a=p.node.argument;if(a?.type==='ArrowFunctionExpression'&&about.slice(a.start,a.end).includes('about-root')){assert(!aboutRender);aboutRender=a.body}}});
assert(aboutRender);about=about.slice(0,aboutRender.start)+'__wtLegal.active.value?__wtNotice.render(__wtLegal):('+about.slice(aboutRender.start,aboutRender.end)+')'+about.slice(aboutRender.end);
about+='\nimport{__wtNotice}from"./index-CuzHFfJW.js";\n';
let bridge=fs.readFileSync(path.join(stage,'switchDisplayMonitor-B50jXMGD.js'),'utf8');
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
const resources=[{name:panelAsset,text:panel},{name:commonAsset,text:common},{name:'/assets/index-CiT_jZa7.js',text:settings},{name:'/assets/switchDisplayMonitor-B50jXMGD.js',text:bridge},{name:'/assets/index-BEWn23m-.js',text:about}];
const output=Buffer.from(original),checks=[];for(const r of resources){const file=path.join(out,path.basename(r.name));fs.writeFileSync(file,r.text);babelParse(r.text,file,true);const meta=manifest.assets.find(a=>a.name===r.name),compressed=zlib.brotliCompressSync(Buffer.from(r.text),{params:{[zlib.constants.BROTLI_PARAM_QUALITY]:11,[zlib.constants.BROTLI_PARAM_MODE]:zlib.constants.BROTLI_MODE_TEXT,[zlib.constants.BROTLI_PARAM_LGWIN]:22}});assert(compressed.length<=meta.compressedBytes,'Resource exceeds reserved space');output.fill(0,meta.offset,meta.offset+meta.compressedBytes);compressed.copy(output,meta.offset);assert(zlib.brotliDecompressSync(output.subarray(meta.offset,meta.offset+meta.compressedBytes)).equals(Buffer.from(r.text)));checks.push({asset:r.name,syntaxPassed:true,budget:meta.compressedBytes,compressed:compressed.length,fits:true,offset:meta.offset})}
let cursor=0;for(const c of [...checks].sort((a,b)=>a.offset-b.offset)){assert(original.subarray(cursor,c.offset).equals(output.subarray(cursor,c.offset)));cursor=c.offset+c.budget}assert(original.subarray(cursor).equals(output.subarray(cursor)));fs.writeFileSync(path.join(out,'payload.exe'),output);
fs.writeFileSync(path.join(out,'checkpoint.json'),JSON.stringify({target:'1.0.3.4',sourceSha256:hash(original),resources:checks,nativeMachineCodeChanged:false,payloadProduced:true,allFeaturesReady:false,realAccountOrHardwareTested:false},null,2));console.log(JSON.stringify(checks,null,2));


