// Scheduling only; rewards and session validity remain server decisions.
const __wtLongRun=(()=>{
 const topUpKey='wuwatappo-auto-top-up-v1';
 const topUpEnabled=()=>{try{return localStorage.getItem(topUpKey)==='1'}catch{return false}};
 function topUp(boost,enabled=topUpEnabled){
  let owner=null,armed=true,pending=false;
  return async function tick({account,clicks,online,blocked,busy}){
   if(owner!==account){owner=account;armed=true}
   if(!enabled()){armed=true;return}
   if(!account||!online||!Number.isFinite(clicks)||clicks<0)return;
   if(clicks>=10000){armed=true;return}
   if(!armed||pending||blocked||busy)return;
   pending=true;armed=false;
   try{if(!await boost()&&owner===account)armed=true}
   catch{if(owner===account)armed=true}
   finally{pending=false}
  };
 }
 function create({state,enabled,claim,sync,boost,now=()=>performance.now(),wall=()=>Date.now(),diagnostic=()=>{}}){
  const replenish=boost?topUp(boost):null;
  let stopped=false,running=false,account=null,last=null,lastWall=null,needsSync=false,syncAfter=0,lastSide='right';
  const due={left:null,right:null},retry={left:0,right:0};
  const reset=()=>{due.left=due.right=null;retry.left=retry.right=0;syncAfter=0;needsSync=false};
  const same=id=>!stopped&&enabled()&&state().account===id;
  async function tick(){
   if(stopped)return;
   const s=state(),t=now(),w=wall();
   if(replenish)void replenish(s);
   const gap=last!==null&&(t<last||t-last>60000||Math.abs((w-lastWall)-(t-last))>60000);
   last=t;lastWall=w;
   if(s.account!==account){account=s.account;reset()}
   if(!enabled()||!account){reset();return}
   if(gap){needsSync=true;syncAfter=0;due.left=due.right=null;retry.left=retry.right=0;diagnostic('resume')}
   if(!s.online||s.blocked){due.left=due.right=null;return}
   // A pending POST may already have succeeded. Never release its lock
   // just because time passed and start a duplicate claim.
   if(running)return;
   if(!s.ready||needsSync){
    if(t<syncAfter)return;
    running=true;const id=account;syncAfter=t+30000;
    try{const ok=await sync();if(!same(id))return;needsSync=!ok;if(ok){syncAfter=0;diagnostic('clock-ready')}else diagnostic('clock-retry')}
    catch{if(same(id)){needsSync=true;diagnostic('clock-retry')}}
    finally{running=false}
    return;
   }
   for(const side of ['left','right'])if(!s.due[side])due[side]=null;else if(due[side]===null)due[side]=t;
   if(s.busy||s.clicks<s.minimum)return;
   const side=(lastSide==='left'?['right','left']:['left','right']).find(k=>s.due[k]&&due[k]!==null&&t-due[k]>=5000&&t>=retry[k]);
   if(!side)return;
   running=true;lastSide=side;const id=account;retry[side]=t+30000;
   const uncertain=()=>{needsSync=true;syncAfter=0;retry[side]=now()+30000;diagnostic('claim-reconcile')};
   try{
    const result=await claim(side);
    if(!same(id))return;
    if(result==='uncertain')uncertain();
    else retry[side]=now()+(result==='skipped'||!state().due[side]?1000:30000);
   }
   catch{if(same(id))uncertain()}
   finally{running=false}
  }
  return{tick,reset,dispose(){stopped=true;reset()}};
 }
 function session({online,blocked,renew,now=()=>performance.now()}){
  let stopped=false,running=false,next=0,last=null;
  return{async tick(){
   if(stopped||running)return;
   const t=now();if(last!==null&&(t<last||t-last>60000))next=0;last=t;
   if(t<next||!online()||blocked())return;
   next=t+60000;running=true;
   try{await renew()}catch{}finally{running=false}
  },dispose(){stopped=true}};
 }
 return{create,session,topUp,topUpKey,topUpEnabled};
})();
