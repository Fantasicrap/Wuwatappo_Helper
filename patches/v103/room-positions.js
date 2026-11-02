const __wtSavedRoomPositions=__wtRoomPositions.create();
function __wtSaveRoomPosition(member,patch){
 if(!R.isLoggedIn||!ut.has(member.id)||!Number.isFinite(patch.left)||!Number.isFinite(patch.top))return;
 __wtSavedRoomPositions.put(R.userInfo?.id,Vo.value,member.id,patch.left,patch.top,window.innerWidth,window.innerHeight);
}
function __wtRestoreRoomPosition(member){
 if(!R.isLoggedIn)return false;
 const saved=__wtSavedRoomPositions.get(R.userInfo?.id,Vo.value,member.id,window.innerWidth,window.innerHeight);
 if(!saved)return false;
 const p=Mr(saved.left,saved.top);member.left=p.left;member.top=p.top;ut.add(member.id);Mt.delete(member.id);Bi(member);return true;
}
