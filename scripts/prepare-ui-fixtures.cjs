// Download only pinned public artwork needed by the visual regression suite.
const fs=require('fs'),path=require('path'),manifest=require('./fixtures/pet-visual-manifest.json');
const root=path.resolve(__dirname,'..'),characters=path.join(root,'dist/accessory-motion-fixtures'),accessories=path.join(root,'dist/配件全素材'),jobs=[];
fs.mkdirSync(characters,{recursive:true});fs.mkdirSync(accessories,{recursive:true});
for(const row of manifest.characters){const dir=path.join(characters,row.name.replace(/\.png$/,''));fs.mkdirSync(dir,{recursive:true});for(const part of ['head1','head2','body1','body2','body3'])jobs.push({file:path.join(dir,part+'.png'),url:manifest.base+'/'+row[part].url})}
for(const row of manifest.accessories){const dir=path.join(accessories,row.folder);fs.mkdirSync(dir,{recursive:true});jobs.push({file:path.join(dir,'桌宠.png'),url:row.renderUrl})}
(async()=>{
 let cursor=0,downloaded=0;
 await Promise.all(Array.from({length:4},async()=>{while(cursor<jobs.length){const job=jobs[cursor++];if(fs.existsSync(job.file)&&fs.readFileSync(job.file).subarray(0,8).toString('hex')==='89504e470d0a1a0a')continue;const response=await fetch(job.url,{signal:AbortSignal.timeout(30000)});if(!response.ok)throw Error('Public fixture download failed: '+response.status);const bytes=Buffer.from(await response.arrayBuffer());if(bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw Error('Fixture is not PNG');fs.writeFileSync(job.file,bytes);downloaded++}}));
 fs.writeFileSync(path.join(characters,'phrolova.json'),JSON.stringify(manifest.characters,null,2));
 const index=path.join(accessories,'素材索引.json');if(!fs.existsSync(index))fs.writeFileSync(index,JSON.stringify({scope:'Pinned visual test subset; not ownership',rows:manifest.accessories},null,2));
 console.log(JSON.stringify({passed:true,publicImages:jobs.length,downloaded,accountRequests:false}));
})().catch(e=>{console.error(e);process.exitCode=1});
