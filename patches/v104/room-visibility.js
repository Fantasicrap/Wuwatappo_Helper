function __wtSyncRoomVisibility(){
  xo();
  Fe(Me);
}

function __wtSetAllRoomMembersVisible(visible){
  if(typeof visible!=="boolean"||Ie())return;
  if(visible)xd();
  jp({type:"set-only-show-self",value:!visible});
}

function __wtToggleOnlyShowSelf(){
  jp({type:"set-only-show-self",value:!officialOnlyShowSelf.value});
}
