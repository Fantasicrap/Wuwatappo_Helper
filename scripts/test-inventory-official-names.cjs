const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),{babelParse,traverse}=require('playwright/lib/transform/babelBundle');
const common=fs.readFileSync('dist/migration-1.0.3.1/index-CuzHFfJW.js','utf8'),functions=new Map();
traverse(babelParse(common,'common.mjs',true),{FunctionDeclaration(p){functions.set(p.node.id.name,common.slice(p.node.start,p.node.end))}});
const names=['dictLookup','stripAssetExt','dictLookupByAssetName','parseRoleAssetName','parseAccessoryAssetName','parseEmoteAssetName','joinDisplayParts','resolveCharacterSkinDisplayName','resolveAccessoryDisplayName','resolveEmoteDisplayName','resolveAssetDisplayName'];
for(const name of names)assert(functions.has(name),'Missing official resolver '+name);
const source=fs.readFileSync('patches/inventory-share.js','utf8').replace('export {__wtInventoryShare,__wtNormalPanel};','this.share=__wtInventoryShare;');
// Synthetic names deliberately differ from role names. Exercise the actual
// official resolver, including full-name dictionaries and ID/code fallbacks.
const dictionaries={character:{'1501':'官方角色甲','role_1501_1001.png':'官方皮肤全名'},series:{'1001':'官方系列甲'},accessory:{'1000':'官方配件甲','accessory_1001.png':'官方配件完整名称'},emote:{happy:'官方表情甲','emote_1501_angry':'官方表情完整名称'}};
const c={console,assetNameDictionaries:{value:dictionaries},DISPLAY_NAME_JOIN:'·'};vm.createContext(c);vm.runInContext(names.map(n=>functions.get(n)).join(';')+';'+source,c);const api=c.share;
const role={asset_id:1,asset_type:'character_skin',asset_name:'role_1501_1001.png',role_id:'1501',series_name:'1001'};
const accessory={asset_id:2,asset_type:'accessory',asset_name:'accessory_1000.png',role_id:'0',role_name:'错误角色名'};
const emote={asset_id:3,asset_type:'emote',asset_name:'emote_1501_happy.png',role_id:'1501',role_name:'错误角色名'};
assert.equal(api.caption(role),'官方皮肤全名');assert.equal(api.caption(accessory),'官方配件甲');assert.equal(api.caption(emote),'官方角色甲·官方表情甲');
assert.equal(api.caption({...accessory,asset_name:'accessory_1001'}),'官方配件完整名称');assert.equal(api.caption({...emote,asset_name:'emote_1501_angry.png'}),'官方表情完整名称');
assert.equal(api.roleName(role),'官方角色甲');assert.equal(api.seriesName(role),'官方系列甲');
const unknown={asset_id:4,asset_type:'accessory',asset_name:'accessory_9999.png',role_id:'1501'};
assert.equal(api.caption(unknown),'名称未加载 #4');
for(const item of [role,accessory,emote])assert.equal(api.caption(item),c.resolveAssetDisplayName(item.asset_type,item.asset_name),'Caption must match the original inventory resolver');
const before=api.caption(accessory);dictionaries.accessory['1000']='Updated official accessory';assert.notEqual(before,api.caption(accessory));assert.equal(api.caption(accessory),'Updated official accessory','Follow dictionary changes instead of caching filenames');
console.log('PASS: role, accessory and emote captions match official inventory resolvers; official series/role sorting names and explicit missing-name fallback');
