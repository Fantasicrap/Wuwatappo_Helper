const __wtOathCore=(()=>{
 // Keep the original BE storage namespace across animation and UI updates.
 const duration=10000,probability=.02,prefix='wuwatappo-oath-core-v1:';
 function create({storage=localStorage,account=0,random=Math.random}={}){
  const key=prefix+String(account);let count=0;try{const value=Number(storage.getItem(key));if(Number.isSafeInteger(value)&&value>=0&&value<1000000)count=value}catch{}
  return{get count(){return count},roll:()=>random()<probability,collect(){const auto=count+1>=5,next=auto?count+1-5:count+1;try{storage.setItem(key,String(next))}catch{return{ok:false,auto:false,count}}count=next;return{ok:true,auto,count,duration}}};
 }
 return{create,duration,probability,prefix};
})();
export {__wtOathCore};
