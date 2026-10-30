const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),{babelParse,traverse}=require('playwright/lib/transform/babelBundle');
const source=fs.readFileSync('patches/inventory-share.js','utf8');let create;
traverse(babelParse(source,'share.mjs',true),{FunctionDeclaration(p){if(p.node.id.name==='create')create=source.slice(p.node.start,p.node.end)}});assert(create);
async function scenario(mode){let attempts=0,files=0,finished=false,header;const messages=[],user={id:7};
 const c={Date,AbortController,document:{},maxHeight:32000,owned:items=>[{items}],preview:()=>({status:text=>messages.push(text),add:()=>files++,finish:()=>finished=true}),background:async()=>({frames:{}}),layout:(groups,max,top)=>{header=top;return[{}]},draw:async(page,groups,options)=>{assert.equal(!!options.luck,mode==='recover');return{failed:0}},image:()=>{},resolveBagAppearanceImageUrl:()=>'',userInfo:async()=>user,unwrapApiData:x=>x,
 loadModule:async()=>{attempts++;if(mode==='fail'||attempts===1)throw Error('Failed to fetch dynamically imported module');return{InventoryLuck:{headerHeight:350,prepare:async()=>{if(mode==='account')throw Error('账号已切换');return{}}}}}};
 vm.createContext(c);vm.runInContext(create.replace(/import\(/g,'loadModule(')+';this.make=create;',c);
 const model=c.make(value=>({value}),()=>({loggedIn:true,user,items:[{}]}),()=>{});await model.run();assert(finished);assert.equal(model.busy.value,false);
 if(mode==='fail'){assert.equal(attempts,2);assert.equal(files,1);assert.equal(header,144);assert(messages.at(-1).includes('未附欧非统计'));assert(!messages.some(m=>m.startsWith('生成失败')))}
 if(mode==='recover'){assert.equal(attempts,2);assert.equal(files,1);assert.equal(header,350)}
 if(mode==='account'){assert.equal(files,0);assert(messages.at(-1).includes('账号已切换'))}
}
(async()=>{await scenario('fail');await scenario('recover');await scenario('account');console.log('PASS: failed local module retries, exports explicitly without luck statistics, recovers full statistics, and preserves account errors')})().catch(e=>{console.error(e);process.exitCode=1});
