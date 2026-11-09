const __wtAutoChestKey='wuwatappo-auto-claim-chests-v1';
function __wtAutoChestEnabled(){try{return localStorage.getItem(__wtAutoChestKey)==='1'}catch{return false}}
function __wtSetAutoChest(enabled){try{localStorage.setItem(__wtAutoChestKey,enabled?'1':'0');__wtChestTask.reset()}catch{}}
const __wtChestTask=__wtLongRun.create({
 enabled:__wtAutoChestEnabled,
 boost:()=>__wtBoostLocalClicks(1e4),
 state:()=>({account:R.isLoggedIn?R.userInfo?.id:null,online:nt.value.status==='online',blocked:Ie()||Mi.value||br.value,ready:Qn.value,busy:Fn.value,clicks:R.totalClickCount,minimum:Ns,due:{left:Wn.value,right:Gn.value}}),
 claim:side=>pc(side),sync:async()=>{await sc();return Qn.value},
 diagnostic:event=>le('HELPER','auto_chest',{event},'warn')
});
const __wtSessionTask=__wtLongRun.session({online:()=>R.isLoggedIn&&nt.value.status==='online',blocked:Ie,renew:__wtRenewSession});
function __wtAutoChestTick(){__wtSessionTask.tick();return __wtChestTask.tick()}
