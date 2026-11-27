let __wtHistoryClose=null;
export async function openRoomHistory({state,send,listen,toast=()=>{}}){
 __wtHistoryClose?.();
 const first=state(),accountId=__wtRoomHistoryCore.account(first.accountId);
 if(!accountId){toast('请先登录账号');return}
 const data=__wtRoomHistoryCore.create(),root=document.createElement('div');
 root.className='wt-history-overlay';root.innerHTML='<style>.wt-history-overlay{position:fixed;inset:0;z-index:10000;display:grid;place-items:center;background:#493a302e;font:14px "Microsoft YaHei",sans-serif;color:var(--wt-ui-text,#74513e);user-select:none}.wt-history-card{width:min(360px,calc(100vw - 32px));max-height:calc(100vh - 32px);display:flex;flex-direction:column;border:1px solid var(--wt-ui-border,#dec6a6);border-radius:18px;background:var(--wt-ui-field,#fff9ee);box-shadow:0 12px 40px #493a3029;padding:16px;box-sizing:border-box}.wt-history-header{display:flex;align-items:center;justify-content:space-between;gap:12px}.wt-history-title{font-size:18px;font-weight:600}.wt-history-overlay button{position:static;display:block;height:auto;width:auto;min-width:0;transform:none;filter:none;margin:0;font:inherit;line-height:1.4;color:inherit;cursor:pointer}.wt-history-close{border:0;border-radius:50%;background:var(--wt-ui-hover,#f2e5d0);padding:4px 10px}.wt-history-caption{font-size:12px;line-height:1.6;color:var(--wt-ui-muted,#987a60);margin:8px 0 12px}.wt-history-list{overflow:auto;min-height:40px;max-height:330px;display:flex;flex-direction:column;gap:8px}.wt-history-room{display:flex!important;align-items:center;justify-content:space-between;gap:12px;width:100%!important;border:1px solid var(--wt-ui-divider,#e6d4b8);border-radius:10px;padding:11px 12px;background:var(--wt-ui-surface,#fffdf7);text-align:left}.wt-history-row{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:4px;margin-bottom:4px}.wt-history-row>button:not(.wt-history-room),.wt-history-editor button{border:1px solid var(--wt-ui-border,#dec6a6);border-radius:9px;padding:4px 7px;background:var(--wt-ui-field,#fffaf1)}.wt-history-room{flex-wrap:wrap}.wt-history-editor{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0}.wt-history-editor[hidden]{display:none}.wt-history-editor input{min-width:0;flex:1}.wt-history-room:hover{background:var(--wt-ui-hover,#fff0d8);border-color:var(--wt-ui-border,#c8a57d)}.wt-history-card button:focus-visible{outline:2px solid var(--wt-ui-focus,#976137);outline-offset:1px}.wt-history-id{font-size:16px;font-weight:600;overflow-wrap:anywhere;min-width:0}.wt-history-meta{font-size:11px;color:var(--wt-ui-muted,#9a7d62);flex:none}.wt-history-current{background:var(--wt-ui-hover,#edf1e1);border-color:var(--wt-ui-border,#bdcba7)}.wt-history-overlay button:disabled{opacity:.6;cursor:wait}.wt-history-message{min-height:34px;line-height:1.5;font-size:12px;padding-top:12px;overflow-wrap:anywhere}.wt-history-empty{font-size:13px;color:var(--wt-ui-muted,#987a60);padding:12px 0;line-height:1.6}</style><section class="wt-history-card" role="dialog" aria-modal="true" aria-label="历史房间"><div class="wt-history-header"><span class="wt-history-title">历史房间</span><button class="wt-history-close" aria-label="关闭历史房间">×</button></div><p class="wt-history-caption">当前账号 · 最近 100 个房间<br>点击房间号即可进入；切换时会先退出当前房间。</p><form class="wt-history-editor" hidden><input maxlength="40" aria-label="房间备注" placeholder="房间备注"><button type="submit">保存备注</button><button type="button">取消</button></form><div class="wt-history-list"></div><div class="wt-history-message" role="status">仅记录本机开启此功能后成功进入的房间。</div></section>';
 document.body.append(root);const list=root.querySelector('.wt-history-list'),message=root.querySelector('.wt-history-message');let busy=false,requestId='',disposed=false,unlisten=null,timer=null,deadline=0,signature='';
 const oldFocus=document.activeElement;
 function close(){if(disposed)return;disposed=true;clearInterval(timer);window.removeEventListener('storage',onStorage);unlisten?.();root.remove();if(__wtHistoryClose===close)__wtHistoryClose=null;if(oldFocus?.isConnected)oldFocus.focus?.()}
 __wtHistoryClose=close;root.querySelector('.wt-history-close').onclick=close;
 root.onmousedown=event=>event.stopPropagation();root.onclick=event=>event.stopPropagation();root.onkeydown=event=>{if(event.key==='Escape')close();if(event.key==='Tab'){const nodes=[...root.querySelectorAll('button:not(:disabled),input:not(:disabled)')].filter(el=>!el.closest('[hidden]'));if(!nodes.length)return;const i=nodes.indexOf(document.activeElement),next=(i+(event.shiftKey?-1:1)+nodes.length)%nodes.length;event.preventDefault();nodes[next].focus()}};
 const editor=root.querySelector('form'),input=editor.querySelector('input');
 let editing='',rows=data.read(accountId);
 const sameAccount=()=>__wtRoomHistoryCore.account(state().accountId)===accountId;
 function onStorage(event){
  if(!event.key||event.key===__wtRoomHistoryCore.prefix+accountId||event.key==='wuwatappo-room-labels-v1:'+accountId)refresh();
 }
 function refresh(){rows=data.read(accountId);signature='';render()}
 function focusRoom(id,action){[...list.children].find(el=>el.dataset.room===id)?.querySelector('[data-action="'+action+'"]')?.focus()}
 function endEdit(){editor.hidden=true;const id=editing;editing='';focusRoom(id,'note')}
 function save(id,change){
  if(!sameAccount()){close();return false}
  if(!data.annotate(accountId,id,change)){message.textContent='保存失败，请重试';return false}
  refresh();return true;
 }
 editor.onsubmit=event=>{event.preventDefault();if(save(editing,{note:input.value}))endEdit()};
 editor.querySelector('[type=button]').onclick=endEdit;
 function render(){
  const current=state(),sig=JSON.stringify([current.roomId,current.mode,busy]);
  if(sig===signature)return;signature=sig;list.replaceChildren();
  if(!rows.length){const empty=document.createElement('p');empty.textContent='暂无历史房间。成功加入或创建房间后，会自动记录在这里。';list.append(empty)}
  for(const item of rows){
   const row=document.createElement('div');row.className='wt-history-row';row.dataset.room=item.id;
   const make=(action,label,handler)=>{
    const button=document.createElement('button');button.type='button';button.dataset.action=action;
    button.textContent=label;button.disabled=busy;button.onclick=handler;row.append(button);return button;
   };
   const here=current.mode!=='idle'&&current.roomId===item.id;
   const join=make('join','',()=>enter(item.id));join.className='wt-history-room'+(here?' wt-history-current':'');
   const title=document.createElement('span'),meta=document.createElement('span');
   title.className='wt-history-id';title.textContent=item.note||item.id;
   meta.className='wt-history-meta';meta.textContent=here?'当前房间':new Date(item.visitedAt).toLocaleDateString();
   join.append(title);if(item.note){const id=document.createElement('small');id.textContent=item.id;join.append(id)}join.append(meta);
   const pin=make('pin',item.pinned?'取消置顶':'置顶',()=>{if(save(item.id,{pinned:!item.pinned}))focusRoom(item.id,'pin')});
   pin.setAttribute('aria-pressed',String(!!item.pinned));
   make('note','备注',()=>{editing=item.id;input.value=item.note||'';editor.hidden=false;input.focus()});
   list.append(row);
  }
 }
 window.addEventListener('storage',onStorage);
 async function enter(id){if(disposed||busy)return;const current=state();if(__wtRoomHistoryCore.account(current.accountId)!==accountId){close();toast('账号已切换，请重新打开历史房间');return}if(current.mode!=='idle'&&current.roomId===id){message.textContent='你已经在该房间';toast('你已经在该房间');return}busy=true;requestId=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);deadline=Date.now()+25000;message.textContent='正在处理房间切换…';render();try{await send({type:'join-room-history',accountId,roomId:id,requestId})}catch{if(disposed)return;busy=false;message.textContent='发送失败，请检查连接后重试';render()}}
 try{unlisten=await listen('wt-room-history-result',event=>{const result=event.payload??event;if(disposed||result.requestId!==requestId||__wtRoomHistoryCore.account(result.accountId)!==accountId)return;message.textContent=String(result.message??'');if(result.code!=='pending'){busy=false;render()}});if(disposed){unlisten?.();return}}catch{close();toast('无法监听房间状态，请重试');return}
 timer=setInterval(()=>{if(__wtRoomHistoryCore.account(state().accountId)!==accountId){close();toast('账号已切换，历史房间已关闭');return}if(busy&&Date.now()>deadline){busy=false;message.textContent='等待结果超时，请检查当前房间状态后再操作'}render()},300);
 render();root.querySelector('.wt-history-close').focus();return close;
}
