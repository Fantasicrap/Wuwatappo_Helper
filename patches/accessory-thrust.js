const __wtAccessoryThrust=(()=>{
 // Public atlas 1572/1573 -> height_light_id 1594/1595. Names are not inferred
 // from catalog ordering: these UUIDs identify the actual desktop layers.
 const names=new Set(['accessory_1124','accessory_1125','74f85e48-71f4-4fa9-8536-fb23e41264ec','4b57f6c4-59af-4960-bcf5-05e8c450f6bd','1594','1595']);
 const matches=part=>names.has(String(part??'').split('?')[0].replace(/\\/g,'/').split('/').pop().replace(/\.png$/i,'').toLowerCase());
 function create({ref,part,blocked=()=>false,onThrust=()=>{},enabled=()=>true,visual=()=>true,now=()=>performance.now()}){
  const held=ref(false),keys=new Set(),recent=[];let disposed=false,pulseTimer=null;
  function reset(){clearTimeout(pulseTimer);pulseTimer=null;keys.clear();held.value=false}
  function down(key){if(disposed||!enabled()||blocked()||!matches(part())||keys.has(key))return false;
   const time=now();while(recent.length&&recent[0]<=time-1000)recent.shift();if(recent.length>=3)return false;
   recent.push(time);keys.add(key);held.value=true;try{onThrust()}catch(error){console.warn('[pet-fun]',error)}return true;
  }
  function up(key){keys.delete(key);if(!keys.size)held.value=false}
  function pulse(){reset();if(!down('__auto__'))return false;pulseTimer=setTimeout(()=>{pulseTimer=null;up('__auto__')},110);return true}
  function style(value){if(!visual()||!matches(value))return{};return{translate:held.value?'-5% 10%':'0% 0%',transition:held.value?'opacity .15s ease, translate 110ms cubic-bezier(.16,0,.2,1)':'opacity .15s ease, translate 240ms cubic-bezier(.22,.61,.36,1)'}}
  // Native CSS transitions retarget from their current interpolated position;
  // no frame timer, queued animation, transform replacement or snap-to-zero.
  window.addEventListener('blur',reset);
  return{down,up,pulse,reset,style,dispose(){disposed=true;reset();window.removeEventListener('blur',reset)}};
 }
 return{matches,create};
})();
export {__wtAccessoryThrust};
