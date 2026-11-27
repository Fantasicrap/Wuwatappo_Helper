const BACKUP_SCHEMA='wuwatappo-helper-backup-v1';
const BACKUP_MAX_BYTES=5*1024*1024;
const BACKUP_EXACT=new Set([
 'wuwatappo-theme-v1',
 'wuwatappo-auto-claim-chests-v1',
 'wuwatappo-low-balance-refill-v1',
 'wuwatappo-synthesis-reminder-v1',
 'wuwatappo-hotkeys-v1',
 'wuwatappo-keyboard-ui-v1',
 'wuwatappo-keyboard-last-mode-v1',
 'wuwatappo-mapping-controls-v1',
 'wuwatappo-mapping-position-v1',
 'wuwatappo-input-bubbles-v1',
 'wuwatappo-wuwa-keys-v1',
 'wuwatappo-controller-v1',
 'wuwatappo-auto-emotes-v1',
 'wuwatappo-pet-fun-v1',
 'wuwatappo-pet-dialogue-v1',
 'wuwatappo-denia-effects-v1',
 'wuwatappo-denia-dialogue-v1',
 'wuwatappo-aemeath-mech-v1',
 'wuwatappo-room-placement-v1',
 'wuwatappo-room-positions-v1',
 'wuwatappo-snowfluff-prefs-v1',
 'wuwatappo-default-monitor-v1',
 'wuwatappo-locale'
]);
const BACKUP_BG_KEYS=new Set([
 'wuwatappo-aemeath-background-v1',
 'wuwatappo-denia-background-v1',
 'wuwatappo-phrolova-background-v1'
]);
const BACKUP_PREFIXES=[
 'wuwatappo-room-history-v1:',
 'wuwatappo-room-labels-v1:',
 'wuwatappo-local-wardrobe-'
];

function isAllowedBackupKey(key,includeBackgrounds=false){
 if(typeof key!=='string'||!key||key.length>128)return false;
 if(BACKUP_EXACT.has(key))return true;
 if(includeBackgrounds&&BACKUP_BG_KEYS.has(key))return true;
 return BACKUP_PREFIXES.some(prefix=>key.startsWith(prefix)&&key.length>prefix.length&&/^[A-Za-z0-9:_-]+$/.test(key.slice(prefix.length)));
}

export function exportHelperBackup(storage=localStorage,{includeBackgrounds=false}={}){
 const entries={};
 for(let i=0;i<storage.length;i++){
  const key=storage.key(i);
  if(!isAllowedBackupKey(key,includeBackgrounds))continue;
  const value=storage.getItem(key);
  if(typeof value==='string')entries[key]=value;
 }
 const keys=Object.keys(entries).sort();
 const sorted=Object.fromEntries(keys.map(k=>[k,entries[k]]));
 return {schema:BACKUP_SCHEMA,exportedAt:new Date().toISOString(),count:keys.length,entries:sorted};
}

export function importHelperBackup(rawText,storage=localStorage){
 if(typeof rawText!=='string'||rawText.length>BACKUP_MAX_BYTES)throw Error('配置文件过大或格式无效。');
 let parsed;
 try{parsed=JSON.parse(rawText)}catch{throw Error('无法解析 JSON 配置文件。')}
 if(!parsed||parsed.schema!==BACKUP_SCHEMA||!parsed.entries||typeof parsed.entries!=='object'||Array.isArray(parsed.entries))
  throw Error('不是有效的 Wuwatappo Helper 备份文件。');
 let imported=0,skipped=0;
 for(const [key,value] of Object.entries(parsed.entries)){
  if(!isAllowedBackupKey(key,true)||typeof value!=='string'){skipped++;continue}
  if(BACKUP_BG_KEYS.has(key)&&!/^data:image\/(?:webp|jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(value)){skipped++;continue}
  try{storage.setItem(key,value);imported++}catch{skipped++}
 }
 return {imported,skipped};
}

export function mountSettingsBackup(root){
 if(!root)return null;
 const doc=root.ownerDocument;
 root.className='setting-item wt-backup-card';
 root.style.cssText='display:grid;gap:8px;width:100%;box-sizing:border-box;margin-top:7px';
 root.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap"><div class="setting-label"><div class="setting-title">配置备份与恢复</div><div class="setting-sub">仅含 Helper 本地设置、备注与快捷键，不含账号登录凭据</div></div><div class="wt-ui-actions"><button type="button" class="wt-ui-button" data-wt-export-cfg>导出配置</button><button type="button" class="wt-ui-button" data-wt-import-cfg>导入配置</button></div></div><div class="wt-ui-actions" style="justify-content:space-between;font-size:12px"><label class="wt-ui-actions"><input type="checkbox" data-wt-backup-bg><span>包含自定义面板背景</span></label><output role="status" style="color:var(--wt-ui-muted,#775e4b)"></output></div><input type="file" accept=".json,application/json" hidden>';
 const exportBtn=root.querySelector('[data-wt-export-cfg]'),importBtn=root.querySelector('[data-wt-import-cfg]');
 const bgToggle=root.querySelector('[data-wt-backup-bg]'),status=root.querySelector('output'),fileInput=root.querySelector('input[type=file]');
 exportBtn.addEventListener('click',()=>{
  try{
   const data=exportHelperBackup(localStorage,{includeBackgrounds:bgToggle.checked});
   const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'});
   const url=URL.createObjectURL(blob),link=doc.createElement('a');
   const stamp=new Date().toISOString().slice(0,10);
   link.href=url;link.download='Wuwatappo-Helper-Backup-'+stamp+'.json';
   doc.body.append(link);link.click();link.remove();
   setTimeout(()=>URL.revokeObjectURL(url),4000);
   status.textContent='已导出 '+data.count+' 项本地配置。';
  }catch{status.textContent='导出配置失败，请重试。'}
 });
 importBtn.addEventListener('click',()=>fileInput.click());
 fileInput.addEventListener('change',async()=>{
  const file=fileInput.files?.[0];fileInput.value='';if(!file)return;
  try{
   const text=await file.text();
   const result=importHelperBackup(text,localStorage);
   window.dispatchEvent(new StorageEvent('storage',{key:null}));
   status.textContent='已导入 '+result.imported+' 项配置，重开面板或重启后完全生效。';
  }catch(error){status.textContent=error.message||'导入配置失败。'}
 });
 return ()=>root.replaceChildren();
}
