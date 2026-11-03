const fs=require('fs'),cp=require('child_process'),path=require('path');
const root=path.resolve(__dirname,'..'),tests=[
 'scripts/test-v103-preview.cjs','scripts/test-v103-bindings.cjs','scripts/test-long-run.cjs','scripts/test-session-lifetime.cjs','scripts/test-network-recovery.cjs',
 'scripts/test-v103-counter.cjs','scripts/test-v103-room-history.cjs','scripts/test-auto-emotes.cjs','scripts/test-accessory-thrust.cjs','scripts/test-happy-ending.cjs','scripts/test-oath-core.cjs','scripts/test-local-wardrobe.cjs',
 'scripts/test-v103-mouse-feed.cjs','scripts/test-monitor-preference.cjs','scripts/test-controller-core.cjs',
 'patches/test-inventory-share.cjs','scripts/test-share-module-failure.cjs','scripts/test-inventory-official-names.cjs','patches/test-inventory-luck.cjs','patches/test-input-recorder.cjs',
 'patches/test-room-visibility.cjs','scripts/test-room-reconnect-visibility.cjs','scripts/test-room-memory.cjs','scripts/test-room-positions.cjs','patches/test-room-history.cjs'
];
if(process.argv.includes('--ui'))tests.push('scripts/test-v103-settings-ui.cjs','scripts/test-monitor-settings-ui.cjs','scripts/test-idle-input-ui.cjs','scripts/test-room-render-cycle.cjs','scripts/test-startup-notice.cjs','scripts/test-auto-emotes-ui.cjs','scripts/test-pet-fun-ui.cjs','scripts/test-halo-occlusion-ui.cjs','scripts/test-pet-fun-scaling-ui.cjs','scripts/test-local-wardrobe-ui.cjs');
for(const file of tests){
 try{cp.execFileSync(process.execPath,[file],{cwd:root,stdio:'pipe'});console.log('PASS '+file)}
 catch(error){process.stderr.write(error.stdout||'');process.stderr.write(error.stderr||'');throw error}
}
const out=path.resolve(process.env.WUWA_TEST_DISTRIBUTION_DIR||path.join(root,'dist/local-1.0.3.3'));fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'suite-verification.json'),JSON.stringify({passed:true,tests,realAccountOrHardwareTested:false,realMouseHookTested:false},null,2));
