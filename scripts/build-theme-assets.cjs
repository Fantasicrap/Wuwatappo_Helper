// Prepares the optional Aemeath theme images: the settings panel background and
// the launcher icon. The source pictures are fan art kept outside this repository,
// so the results go to the ignored dist directory. This step never fails the
// build: without the pictures the launcher keeps the original icon and the theme
// uses a plain pink surface.
//
//   node scripts/build-theme-assets.cjs [materials directory]
//
// Environment overrides:
//   WUWA_THEME_MATERIALS   materials directory (default: ../爱弥斯主题素材)
//   WUWA_THEME_BACKGROUND  background picture
//   WUWA_THEME_ICON        icon picture
//   WUWA_THEME_ICON_CROP   square crop of the icon picture as "x,y,size" in source pixels
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'dist/theme-assets');
const materials=path.resolve(process.argv[2]||process.env.WUWA_THEME_MATERIALS||path.join(root,'..','爱弥斯主题素材'));
const backgroundSource=path.resolve(process.env.WUWA_THEME_BACKGROUND||path.join(materials,'01_整体背景','Sanyue-Qiushi-粉色长椅.jpg'));
const iconSource=path.resolve(process.env.WUWA_THEME_ICON||path.join(materials,'04_Logo与图标候选','粉丝站-爱弥斯头像.png'));
const mechSource=path.resolve(process.env.WUWA_THEME_MECH||path.join(materials,'机兵概念','隧者兵装-Q版草图.png'));
const mechFile=path.join(out,'aemeath-mech.webp'),toolbarFile=path.join(out,'aemeath-toolbar.png');
const tidesSource=path.join(materials,'机兵概念','波纹-Q版图标.png'),tidesFile=path.join(out,'aemeath-tides.webp');
const backgroundFile=path.join(out,'aemeath-background.jpg'),iconFile=path.join(out,'aemeath.ico');
const iconSizes=[16,24,32,48,64,256];

async function background(canvasApi){
 const {createCanvas,loadImage}=canvasApi;
 const image=await loadImage(backgroundSource);
 const width=1280,height=Math.round(width*image.height/image.width);
 const canvas=createCanvas(width,height),ctx=canvas.getContext('2d');
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 ctx.drawImage(image,0,0,width,height);
 // The picture sits under a translucent layer, so a moderate quality is enough.
 let bytes;
 for(const quality of [82,74,66,58]){bytes=canvas.encodeSync('jpeg',quality);if(bytes.length<=400*1024)break}
 if(bytes[0]!==0xff||bytes[1]!==0xd8)throw Error('Background was not encoded as JPEG');
 fs.writeFileSync(backgroundFile,bytes);
 return {file:backgroundFile,width,height,bytes:bytes.length};
}

async function mech({createCanvas,loadImage}){
 const image=await loadImage(mechSource),size=320;
 const canvas=createCanvas(size,size),ctx=canvas.getContext('2d');
 const scale=size/Math.max(image.width,image.height),width=image.width*scale,height=image.height*scale;
 ctx.imageSmoothingQuality='high';
 ctx.drawImage(image,(size-width)/2,(size-height)/2,width,height);
 const bytes=canvas.encodeSync('webp',90);
 fs.writeFileSync(mechFile,bytes);
 return {file:mechFile,size,bytes:bytes.length};
}

async function tides({createCanvas,loadImage}){
 const image=await loadImage(tidesSource),width=256,height=128;
 const canvas=createCanvas(width,height),ctx=canvas.getContext('2d');
 ctx.imageSmoothingQuality='high';
 ctx.drawImage(image,0,0,width,height);
 const bytes=canvas.encodeSync('webp',90);
 fs.writeFileSync(tidesFile,bytes);
 return {file:tidesFile,width,height,bytes:bytes.length};
}

async function toolbar({createCanvas,loadImage}){
 const source=fs.readFileSync(path.join(root,'dist/upstream-1.0.4/index-BbF1ZWW_.css'),'utf8');
 const data=source.match(/\.pet-toolbar\{[^}]+background:url\((data:image\/png;base64,[^)]+)\)/)?.[1];
 if(!data)throw Error('Toolbar bitmap not found');
 const image=await loadImage(data),canvas=createCanvas(image.width,image.height),ctx=canvas.getContext('2d');
 ctx.drawImage(image,0,0);
 const pixels=ctx.getImageData(0,0,image.width,image.height);
 const palette=[
  [[255,249,241],[255,240,246]],[[253,249,237],[255,240,246]],
  [[254,210,145],[248,172,207]],[[142,94,67],[155,54,104]]
 ];
 const distance=(a,b)=>a.reduce((sum,value,index)=>sum+(value-b[index])**2,0);
 for(let at=0;at<pixels.data.length;at+=4){
  if(!pixels.data[at+3])continue;
  const rgb=Array.from(pixels.data.subarray(at,at+3));
  const [,color]=palette.reduce((best,tone)=>distance(tone[0],rgb)<distance(best[0],rgb)?tone:best);
  pixels.data.set(color,at);
 }
 ctx.putImageData(pixels,0,0);
 const bytes=canvas.toBuffer('image/png');fs.writeFileSync(toolbarFile,bytes);
 return {file:toolbarFile,bytes:bytes.length};
}

// 32-bit icon frame: BITMAPINFOHEADER, bottom-up BGRA pixels, then the 1-bit mask.
function dib(rgba,size){
 const maskRow=((size+31)>>5)<<2,pixels=Buffer.alloc(size*size*4),mask=Buffer.alloc(maskRow*size);
 for(let y=0;y<size;y++){
  const row=size-1-y;
  for(let x=0;x<size;x++){
   const from=(y*size+x)*4,to=(row*size+x)*4;
   pixels[to]=rgba[from+2];pixels[to+1]=rgba[from+1];pixels[to+2]=rgba[from];pixels[to+3]=rgba[from+3];
   if(!rgba[from+3])mask[row*maskRow+(x>>3)]|=0x80>>(x&7);
  }
 }
 const header=Buffer.alloc(40);
 header.writeUInt32LE(40,0);header.writeInt32LE(size,4);header.writeInt32LE(size*2,8);
 header.writeUInt16LE(1,12);header.writeUInt16LE(32,14);header.writeUInt32LE(pixels.length+mask.length,20);
 return Buffer.concat([header,pixels,mask]);
}

async function icon(canvasApi){
 const {createCanvas,loadImage}=canvasApi;
 const image=await loadImage(iconSource);
 let crop=[0,0,Math.min(image.width,image.height)];
 if(process.env.WUWA_THEME_ICON_CROP){
  crop=process.env.WUWA_THEME_ICON_CROP.split(',').map(Number);
  if(crop.length!==3||crop.some(n=>!Number.isFinite(n)||n<0)||!crop[2]||crop[0]+crop[2]>image.width||crop[1]+crop[2]>image.height)throw Error('WUWA_THEME_ICON_CROP must be "x,y,size" inside the picture');
 }else{
  crop[0]=(image.width-crop[2])/2;crop[1]=(image.height-crop[2])/2;
 }
 const frames=iconSizes.map(size=>{
  const canvas=createCanvas(size,size),ctx=canvas.getContext('2d');
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  ctx.beginPath();ctx.roundRect(0,0,size,size,size*.22);ctx.clip();
  ctx.drawImage(image,crop[0],crop[1],crop[2],crop[2],0,0,size,size);
  return size===256?canvas.toBuffer('image/png'):dib(ctx.getImageData(0,0,size,size).data,size);
 });
 // Frames follow the directory in order, the same layout the icon tests rebuild
 // from the executable resources.
 const directory=Buffer.alloc(6+16*frames.length);
 directory.writeUInt16LE(1,2);directory.writeUInt16LE(frames.length,4);
 let offset=directory.length;
 frames.forEach((frame,index)=>{
  const at=6+index*16,size=iconSizes[index];
  directory[at]=size===256?0:size;directory[at+1]=size===256?0:size;
  directory.writeUInt16LE(1,at+4);directory.writeUInt16LE(32,at+6);
  directory.writeUInt32LE(frame.length,at+8);directory.writeUInt32LE(offset,at+12);
  offset+=frame.length;
 });
 fs.writeFileSync(iconFile,Buffer.concat([directory,...frames]));
 return {file:iconFile,sizes:iconSizes,crop,bytes:offset};
}

(async()=>{
 const report={materials,background:null,icon:null,mech:null,toolbar:null,tides:null,skipped:[]};
 let canvasApi;
 try{canvasApi=require('@napi-rs/canvas')}catch(error){report.skipped.push('@napi-rs/canvas unavailable: '+error.message)}
 fs.mkdirSync(out,{recursive:true});
 for(const [name,source,target,build] of [['background',backgroundSource,backgroundFile,background],['icon',iconSource,iconFile,icon],['mech',mechSource,mechFile,mech],['toolbar',null,toolbarFile,toolbar],['tides',tidesSource,tidesFile,tides]]){
  // A build without pictures must not silently reuse an earlier run's assets.
  fs.rmSync(target,{force:true});
  if(!canvasApi)continue;
  if(source&&!fs.existsSync(source)){report.skipped.push(name+' source missing: '+source);continue}
  try{report[name]=await build(canvasApi)}
  catch(error){
   // A half-written or stale picture must not reach the launcher.
   fs.rmSync(target,{force:true});
   report.skipped.push(name+' failed: '+error.message);
  }
 }
 fs.writeFileSync(path.join(out,'theme-assets.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify(report,null,2));
})().catch(error=>{console.error('Theme assets skipped: '+error.stack)});
