// Read-only upstream inspection. Does not alter executables or relax build guards.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),zlib=require('node:zlib');
const root=path.resolve(__dirname,'..'),input=path.resolve(process.argv[2]||'WuwaTappo.exe'),out=path.resolve(process.argv[3]||path.join(root,'dist/upstream-inspection'));
if(!out.startsWith(path.join(root,'dist')+path.sep))throw Error('Output must stay under this repository dist directory');
const bytes=fs.readFileSync(input),sha=b=>crypto.createHash('sha256').update(b).digest('hex');fs.mkdirSync(out,{recursive:true});
const assets=[],seen=new Set();for(const match of bytes.toString('latin1').matchAll(/\/assets\/[A-Za-z0-9_.-]+\.(?:js|css)/g)){
 if(seen.has(match[0]))continue;
 try{const offset=match.index+match[0].length,result=zlib.brotliDecompressSync(bytes.subarray(offset),{info:true}),text=result.buffer.toString('utf8');if(!text.length||!Buffer.from(text).equals(result.buffer))continue;
 seen.add(match[0]);fs.writeFileSync(path.join(out,path.basename(match[0])),result.buffer);assets.push({name:match[0],offset,compressedBytes:result.engine.bytesWritten,expandedBytes:result.buffer.length,sha256:sha(result.buffer)});
 }catch{}
}
const read=name=>fs.readFileSync(path.join(out,path.basename(name)),'utf8'),find=text=>assets.filter(a=>read(a.name).includes(text)).map(a=>a.name);
const identify={panel:find('syncMainHitRegion'),settings:find('MainPanelBagTab'),bridge:find('open_panel_window'),legacyBoostButton:find('btn-boost-clicks')};
const apiPaths=text=>[...new Set([...text.matchAll(/["']\/?api\/[^"']+["']/g)].map(m=>m[0].slice(1,-1)))].sort();
const current=apiPaths(assets.filter(a=>a.name.endsWith('.js')).map(a=>read(a.name)).join('\n'));
const report={source:input,sourceBytes:bytes.length,sourceSha256:sha(bytes),assets:assets.length,identify,api:{current,serverAcceptanceTested:false},adaptationComplete:false,executableProduced:false};
// Prepare the ignored offline rendering fixtures from this source so a clean
// checkout does not depend on images left by an older build.
const fixtures=path.join(root,'patches/share-fixtures');fs.mkdirSync(fixtures,{recursive:true});
for(const name of ['atlas-thumb-1-BLGUkvwT.png','atlas-thumb-2-CSkXBHLD.png','atlas-thumb-3-Cf7ixdnU.png','atlas-thumb-4-CDuzFic3.png']){
 const key='/assets/'+name,at=bytes.indexOf(Buffer.from(key));if(at<0)throw Error('Missing embedded fixture: '+name);
 const decoded=zlib.brotliDecompressSync(bytes.subarray(at+key.length));if(decoded.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw Error('Invalid embedded PNG: '+name);
 fs.writeFileSync(path.join(fixtures,name),decoded);
}
const {createCanvas}=require('@napi-rs/canvas');
for(const [name,color]of [['character_skin','#e799a0'],['accessory','#8bb7df'],['emote','#9ac48b']]){
 const canvas=createCanvas(160,160),ctx=canvas.getContext('2d');ctx.fillStyle=color;ctx.beginPath();ctx.arc(80,80,56,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.font='bold 20px sans-serif';ctx.fillText('TEST',54,87);fs.writeFileSync(path.join(fixtures,name+'.png'),canvas.toBuffer('image/png'));
}
fs.writeFileSync(path.join(out,'extraction-manifest.json'),JSON.stringify({sourceBytes:bytes.length,sourceSha256:sha(bytes),assets},null,2));fs.writeFileSync(path.join(out,'compatibility-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
