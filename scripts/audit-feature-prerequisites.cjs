// Static prerequisites are evidence for migration planning, not a runtime pass.
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'dist/upstream-1.0.3'),manifest=JSON.parse(fs.readFileSync(path.join(dir,'extraction-manifest.json'),'utf8'));
assert.equal(manifest.sourceSha256,'cedc37d0c11d112f4d933647fb6cf00e1dca847fc763250984c647080f849080');
const files=manifest.assets.filter(a=>a.name.endsWith('.js')).map(a=>({name:a.name,text:fs.readFileSync(path.join(dir,path.basename(a.name)),'utf8')}));
const checks=[
 ['local-click-count',['localClickCount','save_key_press_count','save_cumulative_click_count']],
 ['auto-chest',['left_treasure_chest','right_treasure_chest','api/frontend/chests/open','click_num']],
 ['keyboard-press-release',['key-press','key-release']],
 ['mouse-input',['mouse-button','set_main_hit_region']],
 ['configurable-hotkeys',['gameMode','windowPassthrough']],
 ['emote-shortcuts',['EmotionMenu','syncEmotion']],
 ['inventory-share',['MainPanelBagTab','bagList','assetsCdnHost']],
 ['inventory-luck',['rarity_type','quantity','api/frontend/user/me']],
 ['room-history',['createRoom','joinRoom','leaveRoom','currentRoomId']],
 ['persistent-peer-hide',['onMemberJoin','onMemberLeave','roomMembers','dockVisible']],
 ['normal-settings-window',['open_panel_window','raise_panel_window_above_pets']],
 ['held-animation',['key-press','key-release','faceAction']],
 ['mapping-position',['pet-dock-content','syncMainHitRegion']],
 ];
const features=checks.map(([feature,tokens])=>({feature,staticPrerequisitesPresent:tokens.every(t=>files.some(f=>f.text.includes(t))),evidence:tokens.map(token=>({token,files:files.filter(f=>f.text.includes(token)).map(f=>f.name)})),migrationImplemented:false,runtimeTested:false}));
const report={targetHelperVersion:'1.0.3.2',sourceSha256:manifest.sourceSha256,features,independentModules:['SDL controller service and controller UI','TXT recording serializers','PNG inventory renderer','installer running-process detection'],notImplementedBeforeThisMigration:['remote exact-key sharing','remote persistent hold animation'],serverRequestsMade:false,allFeaturesMigrated:false};
fs.writeFileSync(path.join(dir,'feature-prerequisites.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({target:report.targetHelperVersion,features:features.map(({feature,staticPrerequisitesPresent})=>({feature,staticPrerequisitesPresent})),allFeaturesMigrated:false},null,2));
