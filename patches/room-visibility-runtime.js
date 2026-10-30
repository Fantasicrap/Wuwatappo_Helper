function __wtSetAllRoomMembersVisible(visible){
  if(typeof visible!=="boolean"||Ie())return;
  __wtHideRoomPeers.value=!visible;
  __wtShownRoomPeers.value=new Set;
  if(visible){Md()}
  else{
    const hidden=new Set(Eo.value);
    for(const member of fe.value){
      if(!Number.isFinite(member.id)||member.id<=0||!member.online||!member.dockVisible||Go(member))continue;
      hidden.add(member.id);
    }
    Eo.value=hidden;
  }
  xo();
  tn();
  tt();
}
// Populate the original per-member hidden set as room snapshots change.
// Keep individual show overrides; a new Hide All clears those overrides.
function __wtHideNewRoomMembers(){
  if(!__wtHideRoomPeers.value)return;
  const hidden=new Set(Eo.value);let changed=false;
  for(const member of fe.value){
    const id=Number(member.id);
    if(!Number.isFinite(id)||id<=0||id===Number(Wo.value)||__wtShownRoomPeers.value.has(id)||hidden.has(id))continue;
    hidden.add(id);changed=true;
  }
  if(changed){Eo.value=hidden;tn();tt()}
}
Oe(fe,__wtHideNewRoomMembers,{deep:true});
