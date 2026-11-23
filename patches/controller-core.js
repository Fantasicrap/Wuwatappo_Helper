// Shared normalisation and recording logic; it never reads keyboard/mouse input.
export const ControllerCore=(()=>{
 const names=['A','B','X','Y','Back','Guide','Start','LS','RS','LB','RB','↑','↓','←','→','M1','P1','P3','P2','P4','触摸','M2','M3','M4','M5','M6'],axes=['左摇杆X','左摇杆Y','右摇杆X','右摇杆Y','左扳机','右扳机'];
 const clamp=(v,a=-1,b=1)=>Math.max(a,Math.min(b,Number.isFinite(Number(v))?Number(v):0));
 function config(c={}){c=c&&typeof c==="object"?c:{};return {layout:['auto','xbox','ps','nintendo','generic'].includes(c.layout)?c.layout:'auto',deadzone:Number.isFinite(c.deadzone)?clamp(c.deadzone,0,.5):.12,triggerDeadzone:Number.isFinite(c.triggerDeadzone)?clamp(c.triggerDeadzone,0,.5):.02,device:typeof c.device==='string'?c.device:'',profiles:c.profiles&&typeof c.profiles==='object'?c.profiles:{}}}
 function layout(d,c){return c.layout==='auto'?(d.mapping==='raw'?'generic':d.layout||'xbox'):c.layout}
 function labels(d,c){let r=[...names],l=layout(d,c);if(l==='ps')r.splice(0,11,'×','○','□','△','Share','PS','Options','L3','R3','L1','R1');if(l==='nintendo')r.splice(0,7,'B','A','Y','X','−','Home','＋');if(l==='generic')r=r.map((_,i)=>'B'+i);return r}
 function profile(d,c){const p=c.profiles[d.key]??{};return {buttons:Array.isArray(p.buttons)?p.buttons.slice(0,26):[],axes:Array.isArray(p.axes)?p.axes.slice(0,6):[],centres:Array.isArray(p.centres)?p.centres.slice(0,4):[]}}
 function normalise(d,c){let p=profile(d,c),b=Array.from({length:26},(_,i)=>{const src=p.buttons[i];if(typeof src==='string'){const m=src.match(/^h([0-3]):([1248])$/);return !!(m&&((d.hats?.[+m[1]]??0)&+m[2]))}if(Number.isInteger(src)&&src>=0&&src<64)return !!d.buttons[src];if(d.mapping==='raw'&&d.hats?.length&&i>=11&&i<=14)return !!(d.hats[0]&[1,4,8,2][i-11]);return !!d.buttons[i]});
  const a=Array.from({length:6},(_,i)=>{const v=p.axes[i]??{},index=Number.isInteger(v.index)&&v.index>=0&&v.index<16?v.index:i;let x=clamp(d.axes[index]);if(v.invert)x=-x;if(i>=4){const lo=Number.isFinite(v.min)?clamp(v.min):0,hi=Number.isFinite(v.max)?clamp(v.max):1;const value=Math.abs(hi-lo)>.05?clamp((x-lo)/(hi-lo),0,1):0;return value<=c.triggerDeadzone?0:(value-c.triggerDeadzone)/(1-c.triggerDeadzone)}return clamp(x-clamp(p.centres[i]??0))});
  for(const i of [0,2]){const len=Math.hypot(a[i],a[i+1]),scale=len>c.deadzone?(Math.min(1,len)-c.deadzone)/(1-c.deadzone)/len:0;a[i]=Math.round(a[i]*scale*1000)/1000;a[i+1]=Math.round(a[i+1]*scale*1000)/1000}for(const i of [4,5])a[i]=Math.round(a[i]*1000)/1000;return {...d,buttons:b,axes:a}}
 function recorder({limit=50000}={}){let active=false,last=null,start=0,rows=[],held=new Map(),before=null,meta=null,lastAxis=0;
  function push(ms,control,action,value,extra={}){rows.push({t:Math.max(0,Math.round((ms-start)*1000)/1000),control,action,value,...extra})}
  function stop(reason='手动结束',ms=before?.ms??start){if(!active)return last;for(const [i,t] of held)push(ms,'B'+i,'松开',0,{hold:ms-t,synthetic:true});held.clear();active=false;last={...meta,duration:Math.max(0,ms-start),reason,events:rows.map(r=>({...r}))};return last}
  function begin(d,ms,ls){if(active)return;start=ms;rows=[];held.clear();meta={name:d.name,key:d.key,mapping:d.mapping,labels:[...ls],started:new Date().toISOString(),initial:{buttons:[...d.buttons],axes:[...d.axes]}};before={...d,ms,buttons:[...d.buttons],axes:[...d.axes]};lastAxis=ms;last=null;active=true}
  function input(d,ms){if(!active)return;if(ms<before.ms){stop('采集服务时间重置',before.ms);return}if(d.id!==before.id||d.generation!==before.generation){stop('设备已更换',ms);return}for(let i=0;i<26;i++){if(d.buttons[i]&&!before.buttons[i]){push(ms,'B'+i,'按下',1);held.set(i,ms)}else if(!d.buttons[i]&&before.buttons[i]&&held.has(i)){push(ms,'B'+i,'松开',0,{hold:ms-held.get(i)});held.delete(i)}}
   const sampleAxes=ms-lastAxis>=50;let sampled=false;for(let i=0;i<6;i++)if((d.axes[i]===0&&before.axes[i]!==0)||(sampleAxes&&Math.abs(d.axes[i]-before.axes[i])>=.025)){push(ms,'axis'+i,'数值',d.axes[i]);before.axes[i]=d.axes[i];sampled=true}if(sampled)lastAxis=ms;before.buttons=[...d.buttons];before.ms=ms;if(rows.length>=limit)stop('记录达到上限',ms)}
  function clear(){stop('已清除');last=null;rows=[];before=null}
  return {begin,input,stop,clear,get active(){return active},get last(){return last},get count(){return rows.length},get duration(){return active?Math.max(0,before.ms-start):last?.duration??0}}
 }
 function txt(r){
  const t=value=>globalThis.__wtTranslate?.(value)??value;
  const name=k=>k.startsWith('axis')?t(axes[+k.slice(4)]):k+'('+t(r.labels[+k.slice(1)])+')';
  const field=(key,value)=>t(key)+(t(key)===key?'':' ')+value;
  const cols=['时间（毫秒）','控件','动作','数值','按住（毫秒）','备注'].map(t).join('\t');
  const lines=[t('手柄操作录制'),field('开始时间（UTC）：',r.started),field('设备：',r.name),field('输入模式：',r.mapping),
   field('总时长（毫秒）：',r.duration),field('结束原因：',t(r.reason)),
   field('初始按键：',r.initial.buttons.map((v,i)=>v?name('B'+i):'').filter(Boolean).join(' / ')),
   field('初始轴值：',r.initial.axes.join(' / ')),t('时间基准：原生采集服务单调采样时钟；开始前已按住的键不记录孤立松开。'),'',cols];
  for(const e of r.events)lines.push([e.t,name(e.control),t(e.action),e.value,e.hold??'',e.synthetic?t('停止时补记（非实际松开）'):''].join('\t'));
  return '\uFEFF'+lines.join('\r\n')+'\r\n';
 }
 return {names,axes,config,layout,labels,profile,normalise,recorder,txt,clamp};
})();
