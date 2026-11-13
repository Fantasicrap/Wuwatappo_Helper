function __wtMergeKeyEdges(onEdge,clock=()=>performance.now()){
 const keys=new Map(),windowMs=120;
 return {
  clear(){keys.clear()},
  input(key,down,helper){
   if(!key)return;
   let state=keys.get(key);
   if(!state){state={down:false,pending:[[],[]]};keys.set(key,state)}
   const now=clock(),edges=state.pending[Number(down)];
   while(edges.length&&now-edges[0].time>=windowMs)edges.shift();
   // The polling feed can deliver several complete taps in a single batch.
   const matching=edges.findIndex(edge=>edge.helper!==helper);
   if(matching!==-1){edges.splice(matching,1);return}
   if(state.down===down)return;
   state.down=down;
   edges.push({helper,time:now});
   onEdge(key,down);
  }
 };
}
export {__wtMergeKeyEdges};
