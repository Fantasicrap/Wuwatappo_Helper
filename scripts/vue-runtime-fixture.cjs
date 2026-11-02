const {babelParse,traverse}=require('playwright/lib/transform/babelBundle');
module.exports=function(common,extra=[]){
 let scope;traverse(babelParse(common,'common.mjs',true),{Program(p){scope=p.scope}});
 const names=[...new Set(['createApp','ref','shallowRef','nextTick','openBlock','createElementBlock','createBaseVNode','createBlock','Fragment','renderList','normalizeClass','normalizeStyle','createCommentVNode','toDisplayString$1',...extra])];
 const picked=new Map(),pending=[...names],visited=new Set();
 function include(p){while(p.parentPath&&!p.parentPath.isProgram())p=p.parentPath;if(picked.has(p.node.start))return;picked.set(p.node.start,p.node);p.traverse({ReferencedIdentifier(child){const b=child.scope.getBinding(child.node.name);if(b?.scope===scope)pending.push(child.node.name)}})}
 while(pending.length){const name=pending.pop(),binding=scope.getBinding(name);if(!binding||visited.has(name))continue;visited.add(name);include(binding.path);for(let p of binding.constantViolations){while(p.parentPath&&!p.parentPath.isProgram())p=p.parentPath;if(p.isBlockStatement())include(p)}}
 return[...picked.values()].sort((a,b)=>a.start-b.start).map(n=>common.slice(n.start,n.end)).join('\n')+'\nwindow.__vue={'+names.join(',')+'};';
};
