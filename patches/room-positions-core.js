const __wtRoomPositions=(()=>{
 const key='wuwatappo-room-positions-v1';
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
 return{create,key};
})();
export {__wtRoomPositions};
