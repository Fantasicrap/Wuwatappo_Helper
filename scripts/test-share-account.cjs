const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {babelParse,traverse}=require('playwright/lib/transform/babelBundle');
const source=fs.readFileSync('patches/inventory-share.js','utf8');
let create;
traverse(babelParse(source,'share.mjs',true),{FunctionDeclaration(p){
 if(p.node.id.name==='create')create=source.slice(p.node.start,p.node.end);
}});
assert(create);
assert(!/import\(|userInfo\(|48642|synthesis/.test(create),'Sharing should run from the existing inventory snapshot');

async function scenario(switchAccount){
 let files=0,finished=false;
 const user={id:'7'},messages=[];
 const context={
  Date,AbortController,document:{},maxHeight:32000,owned:items=>[{items}],composition:()=>({total:1}),
  preview:()=>({status:text=>messages.push(text),add:()=>files++,finish:()=>finished=true}),
  background:async()=>({frames:{}}),layout:()=>[{}],
  draw:async(page,groups,options)=>{assert.equal(options.composition.total,1);if(switchAccount)user.id='8';return{failed:0}},
  image:()=>{},resolveBagAppearanceImageUrl:()=>''
 };
 vm.createContext(context);vm.runInContext(create+';this.make=create;',context);
 const model=context.make(value=>({value}),()=>({loggedIn:true,user,items:[{}]}),()=>{});
 await model.run();
 assert(finished);
 assert.equal(model.busy.value,false);
 assert.equal(files,switchAccount?0:1);
 assert.match(messages.at(-1),switchAccount?/账号已切换/:/长图已生成/);
}
(async()=>{await scenario(false);await scenario(true);console.log('PASS: local chart export without an extra account request; account switches prevent stale output')})()
 .catch(error=>{console.error(error);process.exitCode=1});
