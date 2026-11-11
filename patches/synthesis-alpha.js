function __wtAlphaSerial(){
 let tail=Promise.resolve();
 return work=>{
  const result=tail.then(work);
  tail=result.catch(()=>{});
  return result;
 };
}

function __wtAlphaBatch(account,inventory,insufficient){
 const enqueue=__wtAlphaSerial();
 let active=true,lastAccount,snapshot,remaining;

 function submit(selection,sameLevel,send,complete){
  const user=account(),ids=[...selection],required=new Map();
  for(const id of ids)required.set(id,(required.get(id)??0)+1);
  const current=()=>active&&!!user&&account()===user;

  return enqueue(async()=>{
   if(!current())return;
   const items=inventory();
   if(items!==snapshot||user!==lastAccount){
    // Keep one copy of each material, as in the official synthesis selector.
    remaining=new Map(items.map(item=>[item.asset_id,Math.max(0,item.quantity-1)]));
    snapshot=items;
    lastAccount=user;
   }

   let completed=0;
   try{
    while(completed<3&&current()){
     if([...required].some(([id,count])=>(remaining.get(id)??0)<count)){
      insufficient();
      break;
     }
     if(!await send(ids,sameLevel,current))break;
     for(const [id,count] of required)remaining.set(id,remaining.get(id)-count);
     completed++;
    }
   }finally{
    if(completed&&current())complete(ids,sameLevel);
   }
  });
 }

 return{submit,stop:()=>{active=false}};
}

export {__wtAlphaSerial,__wtAlphaBatch};
