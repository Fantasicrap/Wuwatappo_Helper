const {babelParse,traverse}=require('playwright/lib/transform/babelBundle');
const normalize=require('../v104/normalize-bindings.cjs');

// The lexical aliases used for patching take more room than the original
// minified names. Reclaim that room while keeping public export keys intact.
module.exports=function compactBindings(source,filename){
 const unavailable=new Map(),bindings=new Map();
 function names(scope){
  if(!unavailable.has(scope))unavailable.set(scope,new Set(['do','if','in','of','as']));
  return unavailable.get(scope);
 }
 function reserve(scope,name){for(let parent=scope;parent;parent=parent.parent)names(parent).add(name)}
 traverse(babelParse(source,filename,true),{
  Identifier(p){
   if(p.isReferencedIdentifier()||p.isBindingIdentifier())reserve(p.scope,p.node.name);
  },
  Scopable(p){
   for(const binding of Object.values(p.scope.bindings)){
    const {name,start}=binding.identifier;
    if(/^__(?:wu10[45]_\d+|wt\w+)$/.test(name))bindings.set(start,binding);
   }
  }
 });
 const chars='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',map={};
 const assigned=new Map();
 for(const [start,{scope}] of [...bindings].sort((a,b)=>b[1].references-a[1].references)){
  let next=0;
  let name;
  do{
   const i=next++;
   const j=i-chars.length;
   name=j<0?chars[i]:chars[Math.floor(j/chars.length)]+chars[j%chars.length];
   if(j>=chars.length**2)throw Error('No compact aliases available');
  }while(names(scope).has(name)||isAssignedAbove(scope,name));
  reserve(scope,name);
  if(!assigned.has(scope))assigned.set(scope,new Set());
  assigned.get(scope).add(name);
  map[start]=name;
 }
 function isAssignedAbove(scope,name){
  for(let parent=scope.parent;parent;parent=parent.parent)if(assigned.get(parent)?.has(name))return true;
  return false;
 }
 return normalize(source,filename,map);
};
