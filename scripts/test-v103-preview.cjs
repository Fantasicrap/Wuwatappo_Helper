const {fixturePath}=require('./upstream-fixtures.cjs');
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict'),{babelParse,traverse}=require('playwright/lib/transform/babelBundle');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'dist/migration-1.0.3.4');
function globals(s){const names=new Set();traverse(babelParse(s,'resource.mjs',true),{ReferencedIdentifier(p){if(!p.scope.getBinding(p.node.name))names.add(p.node.name)}});return names}
const browser=new Set(['Object','Event','HTMLInputElement','HTMLTextAreaElement','HTMLSelectElement','getComputedStyle','ClipboardItem','performance','setInterval','clearInterval','fetch','AbortSignal','localStorage']);
const resources=['index-pp8VWaUF.js','index-CuzHFfJW.js','index-CiT_jZa7.js','switchDisplayMonitor-B50jXMGD.js','index-BEWn23m-.js'];
const modules=new Map();
for(const name of resources){
 const before=globals(fs.readFileSync(fixturePath(path.join(root,'dist/upstream-1.0.3',name)),'utf8'));
 const file=fixturePath(path.join(dir,name)),source=fs.readFileSync(file,'utf8');
 const after=globals(source);
 assert.deepEqual([...after].filter(n=>!before.has(n)&&!browser.has(n)),[],'Unbound migrated identifiers in '+name);
 modules.set(path.basename(file),babelParse(source,file,true).program.body);
}
for(const [name,body] of modules)for(const node of body){
 if(node.type!=='ImportDeclaration'||!node.specifiers.some(s=>s.local.name.startsWith('__wt')))continue;
 const provider=modules.get(path.posix.basename(node.source.value));
 assert(provider,'Helper import must resolve to a packaged module: '+node.source.value);
 const exported=new Set(provider.filter(n=>n.type==='ExportNamedDeclaration').flatMap(n=>n.specifiers.map(s=>s.exported.name)));
 for(const specifier of node.specifiers){
  assert(exported.has(specifier.imported.name),name+' imports missing export '+specifier.imported.name);
 }
}
const panel=fs.readFileSync(fixturePath(path.join(dir,'index-pp8VWaUF.js')),'utf8');
const animation={};traverse(babelParse(panel,'panel.mjs',true),{FunctionDeclaration(p){if(['Ul','Vc'].includes(p.node.id.name))animation[p.node.id.name]=panel.slice(p.node.start,p.node.end)}});const held={__wtKeysConnected:false,A:{value:1},nn:null,qr:new Set(['Q','E']),va:new Set(),Bl:n=>n,clearTimeout:()=>{},setTimeout:()=>1,__wtHotkeys:{nativeUp:()=>{}},__wtKeyboard:{key:()=>{}},Ie:()=>false,R:{incrementLocalClickCount:()=>{}},Wl:()=>{}};held.__wtThrust={up(){}};held.__wtFun={input(){},rawKey:()=>false};vm.createContext(held);vm.runInContext(animation.Ul+';'+animation.Vc+';Ul(3);Vc("Q");',held);assert.equal(held.A.value,3);vm.runInContext('Vc("E");',held);assert.equal(held.A.value,1);
const start=panel.indexOf('const __wtAutoChestKey='),end=panel.indexOf('function jp(',start);assert(start>=0&&end>start);
const calls=[],storage=new Map();let now=10000;const ctx={R:{isLoggedIn:true,userInfo:{id:1},totalClickCount:2000},Ie:()=>false,nt:{value:{status:'online'}},Mi:{value:false},br:{value:false},Qn:{value:true},Fn:{value:false},Ns:1000,Wn:{value:true},Gn:{value:false},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},Date:{now:()=>now},performance:{now:()=>now},console,__wtRenewSession:async()=>{},pc:async s=>{calls.push(s);ctx.Wn.value=false}};
let longRun;const shared=fs.readFileSync(fixturePath(path.join(dir,'index-CuzHFfJW.js')),'utf8');traverse(babelParse(shared,'common',true),{VariableDeclarator(p){if(p.node.id.name==='__wtLongRun')longRun=shared.slice(p.node.init.start,p.node.init.end)}});
vm.createContext(ctx);ctx.__wtLongRun=vm.runInContext(longRun,ctx);vm.runInContext(panel.slice(start,end)+';this.enable=__wtSetAutoChest;this.tick=__wtAutoChestTick;',ctx);
(async()=>{ctx.enable(true);await ctx.tick();now+=4999;await ctx.tick();assert.equal(calls.length,0);now++;await ctx.tick();assert.deepEqual(calls,['left']);assert(panel.includes('app-shortcut'),'Keep official 1.0.3 shortcut handling');
const report={passed:true,actualMigratedCodeTested:true,newUnboundSymbols:[],autoChestGracePeriodVerified:true,officialShortcutsRetained:true,serverRequestsMade:false,nativeInputTested:false,uiRuntimeTested:false};fs.writeFileSync(fixturePath(path.join(dir,'verification.json')),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2))})().catch(e=>{console.error(e.stack);process.exitCode=1});
