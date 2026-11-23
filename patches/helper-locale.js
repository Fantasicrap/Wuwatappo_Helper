const __wtLocale = (() => {
 const key = 'wuwatappo-locale';
 const endpoint = __WT_LOCALE_ENDPOINT__;
 const table = new Map(__WT_LOCALE_MESSAGES__.split('\n').filter(Boolean).map(row => {
  const divider = row.indexOf('|');
  return [row.slice(0, divider), row.slice(divider + 1)];
 }));
 const formats = [
  [/^缚誓之核 (\d+\/5)(?: · (.*))?$/, (_, count, status) => 'Oathbound Core ' + count + (status ? ' · ' + translate(status, 'en') : '')],
  [/^自动 (\d+)s$/, (_, seconds) => 'Auto ' + seconds + 's'],
  [/^未识别稀有度 (\d+) 件，未计入饼图$/, (_, n) => n + ' items with unknown rarity were excluded from the chart'],
  [/^有 (\d+) 个素材未加载，请重试$/, (_, n) => n + ' assets failed to load. Try again.'],
  [/^暂无已拥有的(.+)$/, (_, name) => 'No owned ' + translate(name,'en').toLowerCase()],
  [/^(.+)（续）$/, (_, name) => translate(name,'en') + ' (continued)'],
  [/^(吹泡泡|泡泡) · (\d+)\s*\/\s*(\d+)$/, (_, action, n, total) => (action==='吹泡泡'?'Blow a bubble':'Bubble') + ' · ' + n + ' / ' + total],
  [/^最高 (\d+) 分$/, (_, score) => 'Best: ' + score + ' points'],
  [/^已导入(.+)主题包。$/, (_, name) => translate(name,'en') + ' theme pack imported.'],
  [/^仅用于(.+)主题。图片保存在本机。$/, (_, name) => 'Applies to ' + translate(name,'en') + '. The image is stored locally.'],
  [/^已载入 (\d+) 首本地音乐$/, (_, n) => 'Loaded ' + n + ' local tracks'],
  [/^正在加入房间 (.+)$/, (_, room) => 'Joining room ' + room],
  [/^已进入房间 (.+)$/, (_, room) => 'Joined room ' + room],
  [/^显示器 (\d+)(（主屏）)?$/, (_, monitor, primary) => 'Display ' + monitor + (primary?' (primary)':'')],
  [/^录制中 (\d+) 条$/, (_, n) => 'Recording · ' + n + ' events'],
  [/^● 录制中 (\d+) 条$/, (_, n) => '● Recording · ' + n + ' events'],
  [/^已结束 · (\d+) 条，可导出$/, (_, n) => 'Finished · ' + n + ' events. Ready to export.'],
  [/^未录制 · (.+)$/, (_, key) => 'Not recording · ' + translate(key,'en')],
  [/^条目达上限，已结束 · (.+)$/, (_, count) => 'Recording limit reached · ' + count],
  [/^发送表情 · 槽位 (\d+)$/, (_, slot) => 'Send emote · Slot ' + slot],
  [/^导出 (.+)$/, (_, type) => 'Export ' + type],
  [/^设备 (.+)$/, (_, name) => 'Device ' + name],
  [/^按下：(.+)$/, (_, keys) => 'Pressed: ' + keys],
  [/^轴：(.+)$/, (_, axes) => 'Axes: ' + axes],
  [/^目标 (.+)$/, (_, target) => 'Target ' + target],
  [/^(.+) · 标准控件 B(\d+)$/, (_, name, number) => name + ' · Standard control B' + number],
  [/^图鉴试装失败[：:]\s*(.*)$/, (_, reason) => 'Appearance preview failed. ' + translate(reason,'en')],
  [/^名称未加载 #(\d+)$/, (_, id) => 'Name unavailable #' + id],
  [/^已生成，有 (\d+) 个素材加载失败；关闭后重试可补全$/, (_, n) => 'Image generated. ' + n + ' assets failed to load. Close and retry to include them.'],
  [/^已生成 (\d+) 张长图（库存较多，已分段）$/, (_, n) => n + ' images generated for the large inventory.'],
  [/^(.+) · 官方试听$/, (_, track) => translate(track,'en') + ' · Official preview'],
  [/^曲目：(.+)$/, (_, track) => 'Track: ' + translate(track,'en')],
  [/^Helper v([\d.]+) 已下载并校验。$/, (_, version) => 'Helper v' + version + ' was downloaded and verified.'],
  [/^正在尝试通过 GH-Proxy 下载 Helper v([\d.]+)…$/, (_, version) => 'Trying GH-Proxy for Helper v' + version + '…'],
  [/^正在从 GitHub 下载 Helper v([\d.]+)…$/, (_, version) => 'Downloading Helper v' + version + ' from GitHub…'],
  [/^GitHub 暂无适配官方 ([\d.]+) 的 Helper，可继续使用当前版本。$/, (_, version) => 'No Helper for official v' + version + ' is available on GitHub yet. You can keep using this version.'],
  [/^还需 (\d+) 秒$/, (_, seconds) => seconds + ' seconds left'],
  [/^正在生成 (\d+)\s*\/\s*(\d+)$/, (_, done, total) => 'Generating ' + done + ' / ' + total],
  [/^已发送(\d+)s$/, (_, seconds) => 'Sent · ' + seconds + 's'],
  [/^发送过于频繁，请等待(\d+)分(\d+)秒后再试$/, (_, minutes, seconds) => 'Too many requests. Try again in ' + minutes + 'm ' + seconds + 's.'],
  [/^生成失败[：:]\s*(.*)$/, (_, reason) => 'Could not generate the image. ' + translate(reason, 'en')]
 ];
 const valid = value => value === 'en' || value === 'zh';
 function saved() {
  try { const value=localStorage.getItem(key);return valid(value)?value:null; }
  catch { return null; }
 }
 const read = () => saved()??'zh';
 async function preference(method,value='') {
  if(!endpoint)return null;
  try {
   const response=await fetch(endpoint+(value?'/'+value:''),{method,headers:{'X-Wuwa-Action':'1'},cache:'no-store',signal:AbortSignal.timeout(800)});
   return response.ok?await response.json():null;
  } catch {return null;}
 }
 let writing=Promise.resolve();
 function remember(value){
  if(!endpoint||!valid(value))return null;
  writing=writing.then(()=>preference('POST',value));
  return writing;
 }
 async function restore(){
  const local=saved(),remote=(await preference('GET'))?.locale;
  if(valid(remote))return remote;
  if(local)await remember(local);
  return local;
 }
 function translate(value, locale = read()) {
  if (locale !== 'en' || typeof value !== 'string') return value;
  const words = value.trim();
  const match = table.get(words);
  if (match) return value.replace(words, () => match);
  for (const [pattern, format] of formats) {
   const parts = words.match(pattern);
   if (parts) return value.replace(words, () => format(...parts));
  }
  return value;
 }
 function install(doc, initialLocale = read()) {
  let locale = initialLocale;
  const ignored = 'script,style,textarea,[contenteditable],[data-wt-user-text],[data-wt-localized],.atlas-name-inner,.role-nick,.room-member-name';
  const names = ['title', 'aria-label', 'placeholder', 'alt'];
  const records = new WeakMap();
  function textRecord(node, name, value) {
   const previous = records.get(node)?.get(name);
   const source = previous?.localized === value ? previous.source : value;
   if (!source) return;
   const localized = translate(source, locale);
   if (localized !== value) {
    let entry = records.get(node);
    if (!entry) records.set(node, entry = new Map());
    entry.set(name, {source, localized});
    if (name) node.setAttribute(name, localized);
    else node.nodeValue = localized;
   } else if (previous && previous.localized !== value) {
    records.get(node).delete(name);
   }
  }
  function inspect(node) {
   const el = node.nodeType === 1 ? node : node.parentElement;
   if (!el || el.closest(ignored)) return;
   if (node.nodeType === 3) textRecord(node, '', node.nodeValue);
   if (node.nodeType === 1) {
    for (const name of names) textRecord(node, name, node.getAttribute(name));
   }
  }
  function tree(node) {
   inspect(node);
   if (node.nodeType !== 1 && node.nodeType !== 11) return;
   const {SHOW_ELEMENT,SHOW_TEXT} = doc.defaultView.NodeFilter;
   const walker = doc.createTreeWalker(node, SHOW_ELEMENT | SHOW_TEXT);
   while (walker.nextNode()) inspect(walker.currentNode);
  }
  const observer = new MutationObserver(changes => {
   if (locale !== 'en') return;
   for (const change of changes) {
    if (change.type === 'childList') change.addedNodes.forEach(tree);
    else inspect(change.target);
   }
  });
  function setLanguage(next) {
   const chosen = next === 'en' ? 'en' : 'zh';
   locale = chosen;
   doc.documentElement.lang = chosen === 'en' ? 'en' : 'zh-CN';
   tree(doc.documentElement);
  }
  setLanguage(locale);
  observer.observe(doc.documentElement,{subtree:true, childList:true, characterData:true, attributes:true, attributeFilter:names});
  return setLanguage;
 }
 return {read, translate, install, restore, remember};
})();
