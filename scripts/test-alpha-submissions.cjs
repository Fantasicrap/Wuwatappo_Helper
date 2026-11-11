const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {babelParse,traverse}=require('playwright/lib/transform/babelBundle');
const {fixturePath,target}=require('./upstream-fixtures.cjs');

function alphaAsset(file){
 const path=fixturePath('dist/migration-1.0.3.4/'+file).replace(`migration-${target}/`,`migration-${target}-alpha/`);
 return fs.readFileSync(path,'utf8');
}

const settings=alphaAsset('index-CiT_jZa7.js');
const common=alphaAsset('index-CuzHFfJW.js');
const functions=new Set(['__wtAlphaSerial','__wtAlphaBatch','Vt','yt','__wtSend']);
const bindings=new Set(['__wtRedeem','__wtBatch']);
const code=[];
for(const source of [common,settings]){
 traverse(babelParse(source,'alpha.mjs',true),{
  FunctionDeclaration(p){
   if(functions.delete(p.node.id.name))code.push(source.slice(p.node.start,p.node.end));
  },
  VariableDeclaration(p){
   if(p.node.declarations.some(d=>bindings.delete(d.id.name)))code.push(source.slice(p.node.start,p.node.end));
  }
 });
}
assert.deepEqual([...functions,...bindings],[]);
assert.match(settings,/synthesis_submit"\)\)\+" ×3"/);
assert.doesNotMatch(settings,/excode-submit",disabled:/);

const box=value=>({value});
function defer(){let resolve;const promise=new Promise(r=>{resolve=r});return{promise,resolve};}
function fixture(){
 const calls=[],notifications=[],events=[];
 const state={
  ae:{isLoggedIn:true,userInfo:{id:1}},Te:box(true),ie:box(''),
  H:box(true),$:box([7,7,7,7,7]),z:box(true),b:{bagList:[{asset_id:7,quantity:16}]},J:box(null),x:box(0),
  t:key=>key,Oe:message=>notifications.push(message),ut(){},Re(){},gn(){},ht(){},yn(){},fs:()=>null,ys(){},Pt(){},
  Qt(){},Zn(){},Zt(){},v(){},xt:async result=>result,St:value=>value,
  console:{warn(){}},ue:event=>events.push(event.type),F:event=>events.push(event),
  ke(){state.$.value=[];},
  fn:async code=>{calls.push(['redeem',code]);},
  Jn:async ids=>{calls.push(['same',...ids]);return {asset_id:17};},
  Qn:async ids=>{calls.push(['upgrade',...ids]);return {asset_id:27};}
 };
 const api=vm.runInNewContext(code.join('\n')+'\n;({synthesize:yt,redeem:Vt,leave:__wtBatch.stop})',state);
 return {state,api,calls,notifications,events};
}

(async()=>{
 const fast=fixture();
 const entered=defer(),reply=defer();
 const send=fast.state.Jn;
 fast.state.Jn=async ids=>{
  const result=await send(ids);
  if(fast.calls.length===1){entered.resolve();await reply.promise;}
  return result;
 };
 const active=fast.api.synthesize();
 await entered.promise;
 assert.equal(fast.calls.length,1,'Only the first request is in flight');
 fast.state.z.value=false;
 reply.resolve();await active;
 assert.deepEqual(fast.calls.map(([mode])=>mode),['same','same','same']);
 assert.deepEqual(fast.events,['synthesis-success']);
 assert.equal(fast.state.x.value,3);

 const partial=fixture();
 partial.state.b.bagList=[{asset_id:7,quantity:11}];
 await partial.api.synthesize();
 assert.equal(partial.calls.length,2);
 assert.deepEqual(partial.notifications,['synthesis_not_enough']);

 const refused=fixture(),normal=refused.state.Jn;
 refused.state.Jn=async ids=>{
  const result=await normal(ids);
  if(refused.calls.length===2)throw Error('Rejected');
  return result;
 };
 await refused.api.synthesize();
 assert.equal(refused.calls.length,2);
 assert.equal(refused.state.x.value,1);

 const queued=fixture();
 queued.state.b.bagList=[{asset_id:7,quantity:31}];
 await Promise.all([queued.api.synthesize(),queued.api.synthesize()]);
 assert.equal(queued.calls.length,6);
 assert.equal(queued.events.length,2);

 const changed=fixture(),previous=changed.state.Jn;
 changed.state.Jn=async ids=>{changed.state.ae.userInfo={id:2};return previous(ids);};
 await changed.api.synthesize();
 assert.equal(changed.calls.length,1);
 assert.deepEqual(changed.events,[]);

 const closed=fixture(),beforeClose=closed.state.Jn;
 closed.state.Jn=async ids=>{closed.api.leave();return beforeClose(ids);};
 await closed.api.synthesize();
 assert.equal(closed.calls.length,1);

 const redeem=fixture(),redeemFirst=defer(),redeemReply=defer(),redeemSend=redeem.state.fn;
 redeem.state.fn=async code=>{
  await redeemSend(code);
  if(code==='first'){redeemFirst.resolve();await redeemReply.promise;}
  else assert.equal(redeem.state.ie.value,'second','First success leaves newly typed code in the input');
 };
 redeem.state.ie.value=' first ';
 const first=redeem.api.redeem();await redeemFirst.promise;
 redeem.state.ie.value='second';
 const second=redeem.api.redeem();
 redeemReply.resolve();await Promise.all([first,second]);
 assert.deepEqual(redeem.calls,[['redeem','first'],['redeem','second']]);
 assert.deepEqual(redeem.events,['redeem-success','redeem-success']);
 console.log('PASS: built Alpha handlers, immediate sequential rounds, inventory and error stop, account changes, queued submissions');
})().catch(error=>{console.error(error);process.exitCode=1});
