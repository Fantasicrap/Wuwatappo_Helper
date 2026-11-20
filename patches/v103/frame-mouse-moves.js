function __wtFrameMouseMoves(){
 let frame=0,latest,move,generation=0;
 function flush(){
  if(frame)cancelAnimationFrame(frame);
  frame=0;
  const event=latest;
  latest=undefined;
  if(event)move(event);
 }
 return {
  listen(callback){
   move=callback;
   return event=>{
    latest=event;
    if(!frame)frame=requestAnimationFrame(flush);
   };
  },
  edge(button){
   if(button==='left')generation++;
   flush();
  },
  get generation(){return generation},
  dispose(){if(frame)cancelAnimationFrame(frame);frame=0;latest=undefined}
 };
}
export {__wtFrameMouseMoves};
