const __wtPanelLayout=(()=>{
 const css=`
.wt-ui-card,.wt-ui-room-tools,.wt-ui-feature{box-sizing:border-box;min-width:0;color:#694832;border:1px solid #e3c9aa;border-radius:14px;background:#fff9ed}
.wt-ui-card{margin:0 0 10px}.wt-ui-card>summary,.wt-ui-card>header{display:flex;align-items:center;gap:12px;padding:12px 14px}
.wt-ui-card>summary{cursor:pointer;list-style:none}.wt-ui-card>summary::-webkit-details-marker,.wt-ui-optional>summary::-webkit-details-marker{display:none}
.wt-ui-card>summary::after,.wt-ui-optional>summary::after{content:'';width:7px;height:7px;margin-left:auto;border-right:2px solid currentColor;border-bottom:2px solid currentColor;transform:rotate(45deg);flex:none}
.wt-ui-card[open]>summary::after,.wt-ui-optional[open]>summary::after{transform:rotate(225deg)}
.wt-ui-card-title{margin:0;color:#67462f;font-size:16px;font-weight:700;line-height:1.35}.wt-ui-card-description{margin:3px 0 0;color:#775e4b;font-size:12px;line-height:1.45}
.wt-ui-card-body{padding:0 14px 12px;min-width:0}.wt-ui-card[open]>summary{border-bottom:1px solid #efdfca;margin-bottom:10px}
.wt-ui-card--primary{background:#fff6e3;border-color:#dcb687}.wt-ui-card-body .setting-item{border-radius:9px;padding:9px 10px;margin:0 0 7px;gap:8px;flex-wrap:wrap}
.wt-ui-card-body .setting-item:last-child{margin-bottom:0}.wt-ui-card-body .setting-item .setting-title{font-size:14px;font-weight:600;color:#694832}
.wt-ui-card-body .setting-item .setting-sub{font-size:12px;color:#775e4b}.wt-ui-card-body .setting-label,.wt-ui-card-body .setting-content{min-width:0;max-width:100%;flex-wrap:wrap}
.wt-ui-card-body .setting-content>.setting-input:not(.setting-shortcut-input){min-width:min(10rem,100%);max-width:100%}.wt-ui-card-body .setting-content>.setting-range{max-width:calc(100% - 54px)}
.wt-ui-card-body .setting-btns,.wt-ui-card-body .setting-btns-left,.wt-ui-card-body .setting-btns-right{flex-wrap:wrap;gap:8px;margin:8px 0 0}
.wt-ui-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.wt-ui-actions input{min-width:0}.wt-ui-basic-actions{margin-bottom:10px}
.wt-ui-button{position:static;min-width:0;min-height:30px;padding:5px 10px;border:1px solid #d6ae83;border-radius:9px;background:#fffaf1;color:#68452f;font:inherit;line-height:1.35;cursor:pointer}
.wt-ui-button:hover:not(:disabled){background:#f9e7c9}.wt-ui-button--primary,.wt-ui-button[aria-pressed=true]{background:#f6d49d;border-color:#cfa374;color:#583a27}.wt-ui-button:disabled{cursor:default;opacity:.6}
.wt-ui-card :focus-visible,.wt-ui-room-tools :focus-visible,.wt-ui-button:focus-visible,.wt-ui-optional>summary:focus-visible{outline:2px solid #976137;outline-offset:2px}
.wt-ui-room-tools{display:flex;align-items:center;justify-content:space-between;gap:8px 12px;flex-wrap:wrap;margin:10px 0;padding:8px 10px}
.wt-ui-room-tools .wt-ui-placement{margin:0;max-width:100%}.wt-ui-room-tools label{white-space:normal}.wt-ui-join{flex-wrap:wrap}.wt-ui-join .join-rooms-input{flex:1 1 11em;min-width:0;max-width:100%}
.room-info .room-number-copy{border:0;padding:0;flex:none}.wt-ui-room-history{flex:none}.wt-ui-feature{margin:0 0 10px;padding:10px 12px}
.wt-ui-feature>header{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}.wt-ui-feature p{margin:4px 0;color:#775e4b;font-size:12px;line-height:1.45}
.wt-ui-optional{margin:8px 0;border-top:1px solid #e9d6bd;padding-top:6px}.wt-ui-optional>summary{display:flex;align-items:center;gap:8px;cursor:pointer;list-style:none;padding:5px 2px;font-weight:600}
.wt-ui-key-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(90px,1.25fr) auto;align-items:center;gap:6px;margin:7px 0}
.wt-ui-key-row input{width:100%!important}.wt-ui-key-row span{min-width:0;overflow-wrap:anywhere}
.wt-ui-mapping-controls{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:8px 0}.wt-ui-mapping-controls select{max-width:100%;min-height:30px;border:1px solid #d6ae83;border-radius:9px;padding:3px 8px;background:#fffaf1;color:#68452f;font:inherit}
`;
 function styles(){
  if(typeof document==='undefined'||document.getElementById('wt-panel-layout-css'))return;
  const sheet=document.createElement('style');sheet.id='wt-panel-layout-css';sheet.textContent=css;document.head.append(sheet);
 }
 function dynamic(h,tag,props,children){
  const node=h(tag,props,children,512);
  // Upstream uses precompiled Vue render blocks. These wrappers need a full child diff.
  node.patchFlag=-2;
  return node;
 }
 const sections={
  basic:['基础辅助','点击补充、宝箱与合成提醒'],
  account:['账号与兑换','账号信息、兑换码和登录操作'],
  input:['输入与录制','桌面映射、显示方式和快捷键'],
  desktop:['桌面与游戏模式','尺寸、透明度、穿透与显示器'],
  interaction:['互动与表情','i弗TV 和按键自动表情'],
  maintenance:['程序与更新','启动、语言、版本与更新来源']
 };
 // Optional modules add their own settings card without this file naming them.
 const slots={};
 function extend(id,title,description,render){sections[id]=[title,description];slots[id]=render}
 function group(h,id,children){
  styles();
  const [title,description]=sections[id];
  const primary=id==='basic';
  if(slots[id])children=[...children,slots[id](h)];
  const heading=h(primary?'h2':'span',{class:'wt-ui-card-title'},title);
  const label=h('div',null,[heading,h('p',{class:'wt-ui-card-description'},description)]);
  return dynamic(h,primary?'section':'details',{class:'wt-ui-card'+(primary?' wt-ui-card--primary':''),'data-wt-section':id},[
   h(primary?'header':'summary',null,[label]),dynamic(h,'div',{class:'wt-ui-card-body'},children)
  ]);
 }
 function button(h,label,action,extra={}){
  styles();
  return dynamic(h,'button',{type:'button',class:'wt-ui-button',onClick:action,...extra},label);
 }
 function basic(h,enabled,boost,toggle){
  return dynamic(h,'div',{class:'wt-ui-actions wt-ui-basic-actions'},[
   button(h,'本地点击数 +10000',boost,{class:'wt-ui-button wt-ui-button--primary'}),
   button(h,enabled?'自动开箱：已开启':'自动开箱：已关闭',toggle,{'aria-pressed':enabled,title:'宝箱到期后延迟 5 秒领取'})
  ]);
 }
 function room(h,visibility,placement,restore){
  styles();
  return dynamic(h,'div',{class:'wt-ui-room-tools'},[
   dynamic(h,'div',{class:'wt-ui-actions'},[visibility,button(h,'恢复显示全部',restore,{title:'退出仅显示自己，并清除逐人隐藏'})]),placement
  ]);
 }
 function monitor(onMount,onUnmount,load,list,listen,emit){
  let cleanup,closed=false;
  onUnmount(()=>{closed=true;cleanup?.()});
  onMount(async()=>{
   try{
    const {mountDefaultMonitorSettings}=await load();
    if(closed)return;
    const stop=await mountDefaultMonitorSettings({root:document.getElementById('wt-monitor-settings'),list,listen,emit});
    if(closed)stop();else cleanup=stop;
   }catch{
    if(closed)return;
    const root=document.getElementById('wt-monitor-settings');
    if(root)root.textContent='默认显示器设置加载失败，请运行完整 Helper';
   }
  });
 }
 return{styles,group,button,basic,room,monitor,extend};
})();
export {__wtPanelLayout};
