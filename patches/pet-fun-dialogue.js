const __wtPetDialogue=(()=>{
 const keyboard=[..."ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  ...Array.from({length:24},(_,i)=>"F"+(i+1)),
  "Space","Enter","Escape","Tab","Backspace","Delete","Insert","Home","End","PageUp","PageDown",
  "ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Minus","Equal","BracketLeft","BracketRight",
  "Semicolon","Quote","Backslash","Comma","Period","Slash","Backquote","CapsLock"];
 const mouse={left:"左键",right:"右键",middle:"中键",x1:"侧键 1",x2:"侧键 2"};
 const maxLength=40;
 function valid(key){
  if(typeof key!=="string")return false;
  const [source,name,extra]=key.split(":");
  return extra===undefined&&(source==="keyboard"&&keyboard.includes(name)||
    source==="mouse"&&Object.hasOwn(mouse,name)||source==="controller"&&/^(?:[0-9]|1[0-9]|2[0-7])$/.test(name));
 }
 function clean(value){return typeof value==="string"?value.trim().slice(0,maxLength):""}
 function read(value){
  const config={};
  for(const branch of ["be","he"]){
   const item=value?.[branch];
   const lines=Object.fromEntries(Object.entries(item?.lines??{}).filter(([key,line])=>valid(key)&&clean(line)).map(([key,line])=>[key,clean(line)]));
   config[branch]={mode:item?.mode==="mapped"?"mapped":"random",lines};
  }
  return config;
 }
 // undefined keeps the original dialogue; null suppresses this input's bubble.
 function line(config,branch,source,key){
  const item=config[branch];
  if(item.mode!=="mapped")return undefined;
  const input=source==="controller"?key.split(":").at(-1):key;
  return item.lines[source+":"+input]??null;
 }
 function render(h,{settings,draft,update,disabled,branch}){
  const config=settings[branch],edit=draft.value;
  const grouped=[
   ["键盘",keyboard.map(key=>["keyboard:"+key,key])],
   ["鼠标",Object.entries(mouse).map(([key,label])=>["mouse:"+key,label])],
   ["手柄",[...__wtControllerCore.names,"LT / L2","RT / R2"].map((label,i)=>["controller:"+i,"B"+i+" · "+label])]
  ];
  const names=new Map(grouped.flatMap(([group,items])=>items.map(([key,label])=>[key,group+" · "+label])));
  const field={minHeight:"30px",boxSizing:"border-box",padding:"3px 7px",border:"1px solid var(--wt-ui-border,#dfbd9e)",borderRadius:"8px",background:"var(--wt-ui-field,#fffaf2)",color:"var(--wt-ui-text,#74523d)",font:"inherit"};
  const select=(label,props,options)=>h("select",{"aria-label":label,style:{...field,minWidth:"0",maxWidth:"100%"},...props},options);
  const option=(value,text)=>h("option",{key:value,value},text);
  const button=(text,props)=>h("button",{type:"button",style:{position:"static",padding:"4px 10px",border:"1px solid var(--wt-ui-border,#e7b77c)",borderRadius:"8px",background:"var(--wt-ui-field,#fff0d8)",color:"var(--wt-ui-text,#8e5e43)",font:"inherit"},...props},text);
  const title=branch==="be"?"BE":"HE";
  const save=()=>{
   if(!valid(edit.key)||!clean(edit.text))return;
   update({...config,lines:{...config.lines,[edit.key]:clean(edit.text)}});
  };
  const remove=key=>{
   const lines={...config.lines};delete lines[key];update({...config,lines});
   if(edit.key===key)draft.value={key:"",text:""};
  };
  return h("div",{class:"wt-pet-dialogue",style:{borderTop:"1px solid var(--wt-ui-divider,#ecd7c4)",margin:"4px 0",padding:"8px 0",fontSize:"13px"}},[
   h("label",{style:{display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap"}},["气泡台词",select(title+" 气泡台词",{
    disabled,value:config.mode,onChange:event=>update({...config,mode:event.target.value})
   },[option("random","原版随机台词"),option("mapped","按键台词")])]),
   ...(config.mode==="mapped"?[
    h("p",{style:{margin:"6px 0",lineHeight:"1.5"}},"只有绑定的按键会弹出自定义台词。键盘、鼠标和手柄可分别绑定。"),
    h("div",{style:{display:"flex",flexWrap:"wrap",gap:"6px"}},[
     select(title+" 触发按键",{disabled,value:edit.key,onChange:event=>{const key=event.target.value;draft.value={key,text:config.lines[key]??""}}},[
      option("","选择按键"),...grouped.map(([label,items])=>h("optgroup",{label},items.map(([key,name])=>option(key,name))))
     ]),
     h("input",{type:"text","aria-label":title+" 自定义台词",placeholder:"输入台词",maxLength,disabled:disabled||!edit.key,value:edit.text,
      style:{...field,minWidth:"90px",flex:"1 1 100px"},onInput:event=>{draft.value={...edit,text:event.target.value}}}),
     button("保存绑定",{disabled:disabled||!edit.key||!clean(edit.text),onClick:save})
    ]),
    ...Object.entries(config.lines).map(([key,text])=>h("div",{key,style:{display:"flex",alignItems:"center",gap:"6px",marginTop:"6px"}},[
     h("span",{style:{flex:"1",overflowWrap:"anywhere"}},names.get(key)+" · "+text),
     button("编辑",{"aria-label":"编辑 "+names.get(key),disabled,onClick:()=>{draft.value={key,text}}}),
     button("移除",{"aria-label":"移除 "+names.get(key),disabled,onClick:()=>remove(key)})
    ]))
   ]:[])
  ]);
 }
 return{read,line,render};
})();
