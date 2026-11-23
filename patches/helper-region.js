const __wtRegionUi = (() => {
 const base = 'http://127.0.0.1:48642';
 const header = {'X-Wuwa-Action':'1'};
 const t = text => __wtLocale.translate(text);
 async function request(path, method = 'GET') {
  const response = await fetch(base + path,{method,headers:header,cache:'no-store',signal:AbortSignal.timeout(4000)});
  if (!response.ok) throw Error('Local Helper service unavailable');
  return response.json();
 }
 function render(h, region, notify, quit) {
  return h('label',{class:'wt-ui-actions wt-region-setting'},[
   h('span',null,'登录区服'),
   h('select',{'aria-label':'登录区服',value:region,onChange:async event=>{
    const select = event.target;
    const next = select.value;
    select.value = region;
    const message = t('切换区服需要重启桌宠。两个区服的账号独立保存。是否继续？');
    if (!['cn','global'].includes(next)||next===region||!window.confirm(message)) return;
    select.disabled = true;
    try {
     if (!(await request('/region/switch/'+next,'POST')).accepted) throw Error('Region unavailable');
     await quit();
    } catch {
     await request('/region/switch/cancel','POST').catch(()=>{});
     notify(t('无法切换区服，请重试。'));
     select.disabled = false;
    }
   }},[
    h('option',{value:'cn'},'国服（CN）'),
    h('option',{value:'global'},'国际服（Global）')
   ])
  ]);
 }
 async function signIn(){
  const bytes=crypto.getRandomValues(new Uint8Array(16));
  const state=Array.from(bytes,n=>n.toString(16).padStart(2,'0')).join('');
  const path='/region/auth/';
  const language=__wtLocale.read()==='en'?'en':'zh';
  if(!(await request(path+'open/'+state+'/'+language,'POST')).accepted)throw Error('Official sign-in window unavailable');
  const expires=Date.now()+600000;
  while(Date.now()<expires){
   const reply=await request(path+'result/'+state);
   if(reply.status==='complete')return reply.login;
   if(reply.status!=='pending')return null;
   await new Promise(resolve=>setTimeout(resolve,500));
  }
  return null;
 }
 return {render,signIn};
})();
export {__wtRegionUi};
