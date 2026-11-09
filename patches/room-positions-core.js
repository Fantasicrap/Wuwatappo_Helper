const __wtRoomPositions=(()=>{
 const key='wuwatappo-room-positions-v1';
 const modeKey='wuwatappo-room-placement-v1';
 const modes={horizontal:'横排列（原版）',vertical:'纵排列（从右至左）',custom:'保留自定义排列'};
 const validMode=value=>Object.hasOwn(modes,value);
 function getMode(storage=localStorage){try{const value=storage.getItem(modeKey);return validMode(value)?value:'custom'}catch{return 'custom'}}
 function setMode(mode,storage=localStorage){try{storage.setItem(modeKey,mode)}catch{}}
 const id=v=>Number.isSafeInteger(v)&&v>0;
 const room=v=>typeof v==='string'&&v.trim().length>0&&v.trim().length<=64&&!/[\u0000-\u001f\u007f]/.test(v);
 const valid=r=>r&&id(r.a)&&id(r.m)&&r.a!==r.m&&room(r.r)&&[r.x,r.y,r.w,r.h].every(Number.isFinite)&&Math.abs(r.x)<1e6&&Math.abs(r.y)<1e6&&r.w>0&&r.h>0;
 function create(storage=localStorage){
  let rows;
  function read(){if(rows)return rows;try{const raw=JSON.parse(storage.getItem(key)||'[]');rows=Array.isArray(raw)?raw.filter(valid).slice(0,1000):[]}catch{rows=[]}return rows}
  function same(p,a,r,m){return p.a===a&&p.r===r&&p.m===m}
  function get(a,r,m,w,h){if(!id(a)||!id(m)||!room(r)||![w,h].every(v=>Number.isFinite(v)&&v>0))return null;const p=read().find(p=>same(p,a,r.trim(),m));return p?{left:p.x*w/p.w,top:p.y*h/p.h}:null}
  function put(a,r,m,x,y,w,h){const p={a,r:typeof r==='string'?r.trim():r,m,x,y,w,h};if(!valid(p))return false;const old=read().find(row=>same(row,a,p.r,m));if(old&&old.x===x&&old.y===y&&old.w===w&&old.h===h)return true;const next=[p,...read().filter(row=>!same(row,a,p.r,m))].slice(0,1000);try{storage.setItem(key,JSON.stringify(next));rows=next;return true}catch{return false}}
  return{get,put};
 }
 function vertical(index,count,geometry,blocked,box,overlaps){
  const {left,top,right,bottom,width,height,gap,offsetX,offsetY}=geometry;
  const xMax=Math.max(left,right-width),yMax=Math.max(top,bottom-height);
  const rows=1+Math.floor((yMax-top)/(height+gap)),columns=1+Math.floor((xMax-left)/(width+gap));
  function grid(rowCount,columnCount,xStep,yStep){
   const clear=[],occupied=[];
   for(let col=0;col<columnCount;col++)for(let row=0;row<rowCount;row++){
    const point={left:xMax-col*xStep-offsetX,top:yMax-row*yStep-offsetY};
    (blocked.some(bounds=>overlaps(box(point.left,point.top),bounds))?occupied:clear).push(point);
    if(clear.length>=count)return {clear,occupied};
   }
   return {clear,occupied};
  }
  const regular=grid(rows,columns,width+gap,height+gap);
  if(regular.clear.length>=count)return regular.clear[index];
  // When a screen cannot hold the whole room at its current scale, compress
  // the grid within the same work area while keeping the right-to-left order.
  const denseRows=Math.min(count,Math.max(rows,yMax>top?Math.ceil(Math.sqrt((count+blocked.length)*rows/columns)):1));
  const denseColumns=xMax>left?Math.max(columns,Math.ceil((count+blocked.length)/denseRows)):1;
  const dense=grid(denseRows,denseColumns,denseColumns>1?(xMax-left)/(denseColumns-1):0,denseRows>1?(yMax-top)/(denseRows-1):0);
  const slots=dense.clear.concat(dense.occupied);
  return slots[index%slots.length];
 }
 function settings(ref,send){return{mode:ref(getMode()),async change(value){if(!validMode(value))return;await send({type:'set-room-placement',mode:value});this.mode.value=value}}}
 function render(e,settings){
  return e('label',{class:'wt-ui-placement',style:{display:'flex',alignItems:'center',flexWrap:'wrap',gap:'8px',fontWeight:'600',color:'#8e5e43'}},[
   '联机桌宠排列',e('select',{value:settings.mode.value,style:{padding:'5px 24px 5px 9px',border:'1px solid #d5a87c',borderRadius:'9px',background:'#fff8ed',color:'#75492e',font:'inherit',maxWidth:'100%'},onChange:event=>settings.change(event.target.value)},
    Object.entries(modes).map(([value,label])=>e('option',{value},label)))
  ]);
 }
 return{create,key,getMode,setMode,validMode,vertical,settings,render};
})();
export {__wtRoomPositions};
