(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const pages=['index.html','login.html','register.html','profile.html','search.html','membership.html','chat.html','contact.html','success-stories.html','favourites.html','matches.html','received.html','notifications.html','privacy.html','terms.html','view-profile.html','submit-story.html'];
const BUCKET='cms-media';
let notificationCache=[], trashCache=[];

function esc(v){const d=document.createElement('div');d.textContent=v??'';return d.innerHTML}
function toast(m){const x=$('#cmsToast');if(!x)return;x.textContent=m;x.style.display='block';clearTimeout(window.__cmsToastTimer);window.__cmsToastTimer=setTimeout(()=>x.style.display='none',2400)}
function dt(v){return v?new Date(v).toISOString():null}
function localDT(v){if(!v)return'';const d=new Date(v);d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,16)}
function setupError(e){console.error('CMS:',e);const w=$('#cmsSetupWarning');if(w){w.style.display='block';w.textContent='CMS setup/migration required: '+(e?.message||e)}}
function cleanName(s){return String(s||'file').toLowerCase().replace(/[^a-z0-9._-]+/g,'-').replace(/^-+|-+$/g,'')||'file'}
function pageOptions(extra=true){return (extra?['all',...pages]:pages).map(p=>`<option value="${p}">${p==='all'?'All Website Pages':p}</option>`).join('')}
function fillPages(){['#pageSlug','#seoPage','#seoCanonicalPage','#menuUrl','#notificationPage','#notificationButtonPage'].forEach(id=>{const el=$(id);if(!el)return;const allowAll=['#notificationPage'].includes(id);const allowBlank=['#notificationButtonPage'].includes(id);el.innerHTML=(allowBlank?'<option value="">No Button</option>':'')+(allowAll?pageOptions(true):pageOptions(false))})}

async function adminCheck(){
  const {data:{user}}=await client.auth.getUser();
  if(!user){location.replace('admin-login.html');return false}
  const {data:a,error}=await client.from('admins').select('id,active').eq('id',user.id).maybeSingle();
  if(error||!a||a.active!==true){const w=$('#cmsSetupWarning');w.style.display='block';w.textContent='Access Denied: active administrator account required.';return false}
  return true;
}
function tabs(){$$('#cmsTabs .cms-tab').forEach(b=>b.onclick=()=>{$$('.cms-tab').forEach(x=>x.classList.remove('active'));$$('.cms-panel').forEach(x=>x.classList.remove('active'));b.classList.add('active');$(`[data-panel="${b.dataset.tab}"]`)?.classList.add('active');if(b.dataset.tab==='analytics')analytics();if(b.dataset.tab==='trash')trash();if(b.dataset.tab==='revisions')revisions();})}
async function q(table){const {data,error}=await client.from(table).select('*').is('deleted_at',null).order('updated_at',{ascending:false});if(error)throw error;return data||[]}
async function soft(table,id){const {error}=await client.from(table).update({deleted_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',id);if(error)return alert(error.message);toast('Moved to Recycle Bin');loadAll()}
async function uploadFile(file,folder='general'){
  if(!file)return null;
  const ext=(file.name.split('.').pop()||'bin').toLowerCase();
  const base=cleanName(file.name.replace(/\.[^.]+$/,''));
  const path=`${folder}/${Date.now()}-${Math.random().toString(36).slice(2,8)}-${base}.${ext}`;
  const {error}=await client.storage.from(BUCKET).upload(path,file,{cacheControl:'3600',upsert:false,contentType:file.type||undefined});
  if(error)throw error;
  const {data}=client.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
function previewFile(input,host){const f=input?.files?.[0],h=$(host);if(!h)return;if(!f){h.innerHTML='';return}if(f.type.startsWith('image/')){const u=URL.createObjectURL(f);h.innerHTML=`<img src="${u}" alt="Preview"><div>${esc(f.name)}</div>`}else h.innerHTML=`📄 <b>${esc(f.name)}</b> · ${(f.size/1024).toFixed(1)} KB`}
function previewUrl(url,host,label='Current file'){const h=$(host);if(!h)return;if(!url){h.innerHTML='';return}if(/\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(url))h.innerHTML=`<img src="${esc(url)}" alt="Preview"><div>${label}</div>`;else h.innerHTML=`<a href="${esc(url)}" target="_blank">${label} ↗</a>`}

/* ---------- Automatic page element dropdown ---------- */
function selectorFor(el,doc){
  if(el.id)return '#'+CSS.escape(el.id);
  const cls=[...el.classList].filter(c=>!/^active$|^show$|^hidden$/.test(c)).slice(0,2);
  if(cls.length){const s=el.tagName.toLowerCase()+'.'+cls.map(CSS.escape).join('.');try{if(doc.querySelectorAll(s).length===1)return s}catch(_){}}
  let path=[],cur=el;
  while(cur&&cur!==doc.body&&path.length<5){let part=cur.tagName.toLowerCase();if(cur.id){part='#'+CSS.escape(cur.id);path.unshift(part);break}const cs=[...cur.classList].filter(c=>!/^active$|^show$|^hidden$/.test(c)).slice(0,1);if(cs.length)part+='.'+CSS.escape(cs[0]);const siblings=cur.parentElement?[...cur.parentElement.children].filter(x=>x.tagName===cur.tagName):[];if(siblings.length>1)part+=`:nth-of-type(${siblings.indexOf(cur)+1})`;path.unshift(part);cur=cur.parentElement}
  return path.join(' > ');
}
function elementLabel(el){const text=(el.getAttribute('aria-label')||el.getAttribute('alt')||el.textContent||'').replace(/\s+/g,' ').trim().slice(0,72);const tag=el.tagName.toLowerCase();const type=tag==='img'?'Image':tag==='a'?'Link':tag==='button'?'Button':/^h[1-6]$/.test(tag)?'Heading':tag==='p'?'Text':tag==='section'?'Section':tag==='input'?'Input':tag==='textarea'?'Textarea':'Element';return `${type}${text?' · '+text:''}`}
async function loadPageSelectors(forceValue){
  const slug=$('#pageSlug').value, sel=$('#pageSelector');sel.innerHTML='<option value="">Loading page elements…</option>';$('#pagePreviewLink').href=slug;
  try{
    const res=await fetch(slug,{cache:'no-store'});if(!res.ok)throw new Error(`${slug} returned ${res.status}`);const html=await res.text();const doc=new DOMParser().parseFromString(html,'text/html');
    const allowed='h1,h2,h3,h4,h5,h6,p,a,button,img,section,label,input:not([type="hidden"]),textarea,select,footer,main';
    const list=[];const seen=new Set();
    doc.querySelectorAll(allowed).forEach(el=>{if(el.closest('script,style,noscript'))return;const s=selectorFor(el,doc);if(!s||seen.has(s))return;seen.add(s);list.push({selector:s,label:elementLabel(el),tag:el.tagName.toLowerCase(),type:el.getAttribute('type')||''})});
    // Common layout elements injected by layout.js
    [['#commonHeader','Common Header Container','div'],['#commonFooter','Common Footer Container','div'],['header nav','Common Header Navigation','nav'],['footer','Footer','footer']].forEach(([selector,label,tag])=>{if(!seen.has(selector)){seen.add(selector);list.push({selector,label,tag})}});
    sel.innerHTML='<option value="">Choose editable element…</option>'+list.map(x=>`<option value="${esc(x.selector)}" data-tag="${x.tag}" data-type="${esc(x.type||'')}">${esc(x.label)} — ${esc(x.selector)}</option>`).join('');
    if(forceValue){sel.value=forceValue;if(sel.value!==forceValue){const o=document.createElement('option');o.value=forceValue;o.textContent='Saved selector — '+forceValue;sel.appendChild(o);sel.value=forceValue}}
    updatePropertyOptions();
  }catch(e){sel.innerHTML='<option value="">Could not scan page</option>';setupError(e)}
}
function updatePropertyOptions(force){
  const o=$('#pageSelector').selectedOptions[0], tag=o?.dataset.tag||'', p=$('#pageProperty');let opts=[['text','Text'],['html','Replace HTML / Rich Content'],['before_html','Add Section Before'],['after_html','Add Section After'],['append_html','Add Content Inside'],['move_after','Move / Reorder After Element'],['hidden','Show / Hide'],['remove','Remove Element'],['style.color','Text Color'],['style.backgroundColor','Background Color']];
  if(tag==='img')opts=[['src','Image'],['hidden','Show / Hide'],['style.borderRadius','Image Radius']];
  else if(tag==='a')opts=[['text','Link Text'],['href','Destination Link'],['before_html','Add Before'],['after_html','Add After'],['move_after','Move / Reorder After Element'],['hidden','Show / Hide'],['remove','Remove Element'],['style.color','Text Color'],['style.backgroundColor','Background Color']];
  else if(tag==='input'||tag==='textarea')opts=[['placeholder','Placeholder'],['hidden','Show / Hide']];
  p.innerHTML=opts.map(([v,l])=>`<option value="${v}">${l}</option>`).join('');if(force&&![...p.options].some(x=>x.value===force)){p.insertAdjacentHTML('beforeend',`<option value="${esc(force)}">${esc(force)}</option>`)}if(force)p.value=force;updatePageValueMode();
}
function updatePageValueMode(){const prop=$('#pageProperty').value,img=prop==='src';$('#pageImageWrap').hidden=!img;$('#pageValueWrap').hidden=img||prop==='remove';if(prop==='hidden'){$('#pageValue').outerHTML='<select id="pageValue"><option value="false">Show</option><option value="true">Hide</option></select>'}else if(prop==='move_after'){const opts=[...$('#pageSelector').options].filter(o=>o.value).map(o=>`<option value="${esc(o.value)}">${esc(o.textContent)}</option>`).join('');$('#pageValue').outerHTML=`<select id="pageValue"><option value="">Choose destination element…</option>${opts}</select>`}else if($('#pageValue').tagName==='SELECT'){$('#pageValue').outerHTML='<textarea id="pageValue"></textarea>'}}

/* ---------- Overview / analytics ---------- */
async function counts(table,filters=[]){let z=client.from(table).select('id',{count:'exact',head:true});filters.forEach(([m,a,b])=>z=z[m](a,b));const {count,error}=await z;if(error)throw error;return count||0}
async function overview(){try{const [o,n,t]=await Promise.all([counts('cms_page_overrides',[['is','deleted_at',null]]),counts('cms_notifications',[['is','deleted_at',null]]),client.from('cms_trash_view').select('id',{count:'exact',head:true})]);$('#ovPages').textContent=pages.length;$('#ovOverrides').textContent=o;$('#ovNotifications').textContent=n;$('#ovTrash').textContent=t.count||0}catch(e){setupError(e)}}
async function analytics(){try{const since=new Date(Date.now()-7*86400000).toISOString();const [pub,draft,pop,mediaRows,eventsRes]=await Promise.all([counts('cms_page_overrides',[['eq','status','published'],['is','deleted_at',null]]),counts('cms_page_overrides',[['eq','status','draft'],['is','deleted_at',null]]),counts('cms_notifications',[['eq','status','published'],['is','deleted_at',null]]),q('cms_media'),client.from('cms_events').select('event_type,page_slug,reference_id,created_at').gte('created_at',since).order('created_at',{ascending:false}).limit(1000)]);$('#anPublished').textContent=pub;$('#anDraft').textContent=draft;$('#anPopups').textContent=pop;$('#anMedia').textContent=mediaRows.length;const ev=eventsRes.data||[],views=ev.filter(x=>x.event_type==='page_view').length,nv=ev.filter(x=>x.event_type==='notification_view').length,nc=ev.filter(x=>x.event_type==='notification_click').length;const byPage={};ev.filter(x=>x.event_type==='page_view').forEach(x=>byPage[x.page_slug||'unknown']=(byPage[x.page_slug||'unknown']||0)+1);const top=Object.entries(byPage).sort((a,b)=>b[1]-a[1]).slice(0,10);$('#analyticsDetails').innerHTML=`<table class="cms-table"><tr><th>Metric (last 7 days)</th><th>Count</th></tr><tr><td>Website Page Views</td><td>${views}</td></tr><tr><td>Notification Views</td><td>${nv}</td></tr><tr><td>Notification Clicks</td><td>${nc}</td></tr><tr><td>Published Overrides</td><td>${pub}</td></tr><tr><td>Draft Overrides</td><td>${draft}</td></tr></table><div class="cms-table-wrap"><table class="cms-table"><tr><th>Top Pages</th><th>Views</th></tr>${top.map(([p,c])=>`<tr><td>${esc(p)}</td><td>${c}</td></tr>`).join('')||'<tr><td colspan="2">No view data yet.</td></tr>'}</table></div>`}catch(e){setupError(e)}}

/* ---------- Pages ---------- */
async function pagesLoad(){try{const rows=await q('cms_page_overrides');$('#pageRows').innerHTML=rows.map(r=>`<tr><td>${esc(r.page_slug)}</td><td><code>${esc(r.selector)}</code></td><td>${esc(r.property)}</td><td>${esc(String(r.value??'').slice(0,90))}</td><td><span class="cms-status ${r.status==='draft'?'draft':''}">${esc(r.status)}</span></td><td><button class="cms-btn gray" data-pe="${r.id}">Edit</button> <button class="cms-btn red" data-pd="${r.id}">Delete</button></td></tr>`).join('')||'<tr><td colspan="6" class="cms-empty">No page overrides yet.</td></tr>';$$('[data-pe]').forEach(b=>b.onclick=async()=>{const r=rows.find(x=>x.id===b.dataset.pe);$('#pageId').value=r.id;$('#pageSlug').value=r.page_slug;await loadPageSelectors(r.selector);updatePropertyOptions(r.property);if(r.property==='src'){previewUrl(r.value,'#pageImagePreview','Current image');$('#pageValue').value=r.value||''}else $('#pageValue').value=r.value??'';$('#pageStatus').value=r.status;$('#pageSort').value=r.sort_order||0;document.querySelector('[data-tab="pages"]').scrollIntoView({behavior:'smooth'})});$$('[data-pd]').forEach(b=>b.onclick=()=>confirm('Move to Recycle Bin?')&&soft('cms_page_overrides',b.dataset.pd))}catch(e){setupError(e)}}
$('#pageForm').onsubmit=async e=>{e.preventDefault();try{const id=$('#pageId').value,prop=$('#pageProperty').value;let value=prop==='remove'?'true':$('#pageValue').value;if(prop==='src'&&$('#pageImageFile').files[0])value=await uploadFile($('#pageImageFile').files[0],'pages');if(prop==='src'&&!value)return alert('Choose an image.');const obj={page_slug:$('#pageSlug').value,selector:$('#pageSelector').value,property:prop,value,status:$('#pageStatus').value,sort_order:+$('#pageSort').value||0,updated_at:new Date().toISOString()};const res=id?await client.from('cms_page_overrides').update(obj).eq('id',id):await client.from('cms_page_overrides').insert(obj);if(res.error)throw res.error;toast('Page content saved');resetPage();pagesLoad();overview()}catch(e){alert(e.message)}};
function resetPage(){$('#pageForm').reset();$('#pageId').value='';$('#pageImagePreview').innerHTML='';loadPageSelectors()}$('#pageReset').onclick=resetPage;$('#pageSlug').onchange=()=>loadPageSelectors();$('#pageSelector').onchange=updatePropertyOptions;$('#pageProperty').onchange=updatePageValueMode;$('#pageImageFile').onchange=()=>previewFile($('#pageImageFile'),'#pageImagePreview');

/* ---------- Menus ---------- */
async function syncExistingWebsiteMenus(){
  try{
    const sources=[];
    for(const [file,location,selector] of [['header.html','header','.user-dashboard-navigation a'],['footer.html','footer','a']]){
      const res=await fetch(file,{cache:'no-store'});if(!res.ok)continue;
      const doc=new DOMParser().parseFromString(await res.text(),'text/html');
      [...doc.querySelectorAll(selector)].forEach((a,i)=>{const href=a.getAttribute('href')||'';if(!href||href.startsWith('#')||href.startsWith('javascript:'))return;const full=(a.textContent||'').replace(/\s+/g,' ').trim();const m=full.match(/^([^A-Za-z0-9\u0900-\u097F]*)(.*)$/);const icon=(m?.[1]||'').trim(),label=(m?.[2]||full).trim();if(label)sources.push({location,label,icon,url:href,sort_order:i,is_visible:true})});
    }
    const {data:existing,error}=await client.from('cms_menu_items').select('id,location,label,url,deleted_at');if(error)throw error;
    const all=existing||[], missing=sources.filter(src=>!all.some(x=>x.location===src.location&&x.url===src.url));
    if(missing.length){const z=await client.from('cms_menu_items').insert(missing.map(x=>({...x,updated_at:new Date().toISOString(),deleted_at:null})));if(z.error)throw z.error}
  }catch(e){console.warn('Existing website menu sync:',e)}
}
async function menus(){try{await syncExistingWebsiteMenus();const rows=await q('cms_menu_items');$('#menuRows').innerHTML=`<table class="cms-table"><tr><th>Location</th><th>Label</th><th>Destination</th><th>Order</th><th>Visible</th><th>Actions</th></tr>${rows.map(r=>`<tr><td>${esc(r.location)}</td><td>${esc(r.icon||'')} ${esc(r.label)}</td><td>${esc(r.url)}</td><td>${r.sort_order||0}</td><td>${r.is_visible?'Yes':'No'}</td><td><button class="cms-btn gray" data-me="${r.id}">Edit</button> <button class="cms-btn red" data-md="${r.id}">Delete</button></td></tr>`).join('')}</table>`;$$('[data-me]').forEach(b=>b.onclick=()=>{const r=rows.find(x=>x.id===b.dataset.me);$('#menuId').value=r.id;$('#menuLocation').value=r.location;$('#menuLabel').value=r.label;$('#menuUrl').value=r.url;$('#menuIcon').value=r.icon||'';$('#menuSort').value=r.sort_order||0;$('#menuVisible').value=String(r.is_visible)});$$('[data-md]').forEach(b=>b.onclick=()=>confirm('Move to Recycle Bin?')&&soft('cms_menu_items',b.dataset.md))}catch(e){setupError(e)}}
$('#menuForm').onsubmit=async e=>{e.preventDefault();const id=$('#menuId').value,obj={location:$('#menuLocation').value,label:$('#menuLabel').value,url:$('#menuUrl').value,icon:$('#menuIcon').value||null,sort_order:+$('#menuSort').value||0,is_visible:$('#menuVisible').value==='true',updated_at:new Date().toISOString()};const res=id?await client.from('cms_menu_items').update(obj).eq('id',id):await client.from('cms_menu_items').insert(obj);if(res.error)return alert(res.error.message);toast('Menu saved');e.target.reset();$('#menuId').value='';menus()};$('#menuReset').onclick=()=>{$('#menuForm').reset();$('#menuId').value=''};

/* ---------- Theme ---------- */
const presets={classic:['#2563eb','#16a34a','#f59e0b','#ffffff'],emerald:['#047857','#0f766e','#eab308','#f8fafc'],royal:['#6d28d9','#2563eb','#db2777','#fafafa'],rose:['#be185d','#7c3aed','#f59e0b','#fff7ed'],midnight:['#0f172a','#1d4ed8','#16a34a','#020617']};

[['themePrimary','themePrimaryColor'],['themeSecondary','themeSecondaryColor'],['themeAccent','themeAccentColor'],['themeBg','themeBgColor']].forEach(([a,b])=>{
  const text=$('#'+a),color=$('#'+b);if(!text||!color)return;
  color.oninput=()=>text.value=color.value;
  text.onchange=()=>color.value=text.value;
});

if($('#themePreset'))$('#themePreset').onchange=()=>{
  const p=presets[$('#themePreset').value];if(!p)return;
  ['themePrimary','themeSecondary','themeAccent','themeBg'].forEach((id,i)=>{
    if($('#'+id))$('#'+id).value=p[i];
    if($('#'+id+'Color'))$('#'+id+'Color').value=p[i];
  });
};

if($('#themeBackgroundFile'))$('#themeBackgroundFile').onchange=()=>previewFile($('#themeBackgroundFile'),'#themeBackgroundPreview');

async function getCurrentLiveTheme(){
  const {data,error}=await client.from('cms_theme').select('*').eq('is_active',true).is('deleted_at',null).order('created_at',{ascending:false}).limit(1);
  if(error)throw error;
  return data?.[0]||null;
}

async function backupCurrentTheme(){
  const current=await getCurrentLiveTheme();
  if(!current)return null;
  const snapshot={theme_id:current.id,name:current.name||'Previous Theme',settings:current.settings||{},saved_at:new Date().toISOString()};
  const {error}=await client.from('cms_theme_history').insert({theme_data:snapshot});
  if(error)throw error;
  return snapshot;
}

async function activateThemeSnapshot(snapshot,labelSuffix=' (Restored)'){
  if(!snapshot?.settings)throw new Error('Theme history data invalid.');
  const {error:disableError}=await client.from('cms_theme').update({is_active:false,updated_at:new Date().toISOString()}).eq('is_active',true);
  if(disableError)throw disableError;
  const {error:restoreError}=await client.from('cms_theme').insert({
    name:(snapshot.name||'Restored Theme')+labelSuffix,
    settings:snapshot.settings,
    is_active:true,
    updated_at:new Date().toISOString()
  });
  if(restoreError)throw restoreError;
}

if($('#themeForm'))$('#themeForm').onsubmit=async e=>{
  e.preventDefault();
  const btn=$('#themeForm').querySelector('button[type="submit"]');
  const oldText=btn?.textContent||'Publish Theme Live';
  try{
    if(btn){btn.disabled=true;btn.textContent='Publishing...'}
    await backupCurrentTheme();
    let bgImage=null;
    if($('#themeBackgroundFile')?.files?.[0])bgImage=await uploadFile($('#themeBackgroundFile').files[0],'theme');
    const settings={
      '--cms-primary':$('#themePrimary').value,
      '--cms-secondary':$('#themeSecondary').value,
      '--cms-accent':$('#themeAccent').value,
      '--cms-background':$('#themeBg').value,
      '--cms-font':$('#themeFont').value,
      '--cms-radius':$('#themeRadius').value,
      button_style:$('#themeButton').value,
      background_image:bgImage,
      custom_css:$('#themeCss').value
    };
    const {error:disableError}=await client.from('cms_theme').update({is_active:false,updated_at:new Date().toISOString()}).eq('is_active',true);
    if(disableError)throw disableError;
    const {error}=await client.from('cms_theme').insert({name:$('#themePreset').selectedOptions[0]?.textContent||'Published Theme',settings,is_active:true,updated_at:new Date().toISOString()});
    if(error)throw error;
    toast('Theme published live · previous theme backed up');
  }catch(e){console.error('Theme publish error:',e);alert('Theme publish failed: '+e.message)}
  finally{if(btn){btn.disabled=false;btn.textContent=oldText}}
};

if($('#themeReset'))$('#themeReset').onclick=()=>{
  $('#themeForm')?.reset();
  if($('#themeBackgroundPreview'))$('#themeBackgroundPreview').innerHTML='';
  toast('Theme preview reset');
};

window.cmsRestorePreviousTheme=async function(){
  const {data,error}=await client.from('cms_theme_history').select('*').order('created_at',{ascending:false}).limit(1);
  if(error)throw error;
  const row=data?.[0];
  if(!row){alert('Previous theme history nahi mili.');return false}
  if(!confirm('Previous theme restore karna hai? Current live theme ka backup pehle save hoga.'))return false;
  await backupCurrentTheme();
  await activateThemeSnapshot(row.theme_data);
  toast('Previous theme restored live');
  return true;
};

window.cmsRestoreThemeHistoryItem=async function(historyId){
  const {data,error}=await client.from('cms_theme_history').select('*').eq('id',historyId).maybeSingle();
  if(error)throw error;
  if(!data?.theme_data?.settings)throw new Error('Theme history data invalid.');
  if(!confirm('Ye theme version restore karna hai? Current live theme ka backup save hoga.'))return false;
  await backupCurrentTheme();
  await activateThemeSnapshot(data.theme_data);
  toast('Selected theme version restored live');
  return true;
};

window.cmsShowThemeHistory=async function(){
  const {data,error}=await client.from('cms_theme_history').select('*').order('created_at',{ascending:false}).limit(30);
  if(error)throw error;
  const rows=data||[];
  let modal=$('#cmsThemeHistoryModal');
  if(!modal){modal=document.createElement('div');modal.id='cmsThemeHistoryModal';document.body.appendChild(modal)}
  modal.style.cssText='position:fixed;inset:0;background:rgba(15,23,42,.75);z-index:999999;display:flex;align-items:center;justify-content:center;padding:20px';
  modal.innerHTML=`<div style="width:min(820px,100%);max-height:88vh;overflow:auto;background:#fff;color:#0f172a;border-radius:18px;box-shadow:0 28px 80px rgba(0,0,0,.35)">
    <div style="position:sticky;top:0;background:#fff;z-index:2;padding:18px 20px;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;gap:12px"><strong style="font-size:19px">🕘 Theme History</strong><button type="button" id="cmsCloseThemeHistory" style="border:0;background:#f1f5f9;border-radius:9px;width:38px;height:38px;font-size:20px;cursor:pointer">×</button></div>
    <div style="padding:16px">${rows.length?rows.map((row,i)=>{const t=row.theme_data||{};return `<div style="border:1px solid #e2e8f0;border-radius:14px;padding:14px;margin-bottom:10px;display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap"><div><strong>${esc(t.name||'Theme Backup')}</strong><div style="margin-top:5px;color:#64748b;font-size:13px">${row.created_at?new Date(row.created_at).toLocaleString('en-IN'):''}</div></div><div style="display:flex;gap:8px;align-items:center">${i===0?'<span style="padding:5px 9px;border-radius:20px;background:#dcfce7;color:#166534;font-size:12px;font-weight:800">Latest Previous</span>':''}<button type="button" class="cms-btn gold" data-theme-history-restore="${row.id}">Restore</button></div></div>`}).join(''):'<div class="cms-empty">No theme history yet.</div>'}</div>
  </div>`;
  $('#cmsCloseThemeHistory',modal).onclick=()=>modal.style.display='none';
  modal.onclick=e=>{if(e.target===modal)modal.style.display='none'};
  $$('[data-theme-history-restore]',modal).forEach(b=>b.onclick=async()=>{
    try{b.disabled=true;b.textContent='Restoring...';const ok=await window.cmsRestoreThemeHistoryItem(b.dataset.themeHistoryRestore);if(ok){modal.style.display='none';location.reload()}}
    catch(e){console.error('Theme history restore:',e);alert('Theme restore failed: '+e.message);b.disabled=false;b.textContent='Restore'}
  });
};

function bindThemeRestoreControls(){
  const restoreBtn=$('#cmsRestorePreviousThemeBtn'),historyBtn=$('#cmsThemeHistoryBtn');
  if(restoreBtn&&!restoreBtn.dataset.bound){restoreBtn.dataset.bound='1';restoreBtn.onclick=async()=>{
    const old=restoreBtn.innerHTML;
    try{restoreBtn.disabled=true;restoreBtn.innerHTML='Restoring...';const ok=await window.cmsRestorePreviousTheme();if(ok){alert('Previous theme restored successfully.');location.reload()}}
    catch(e){console.error('Theme restore error:',e);alert('Unable to restore previous theme: '+e.message)}
    finally{restoreBtn.disabled=false;restoreBtn.innerHTML=old}
  }}
  if(historyBtn&&!historyBtn.dataset.bound){historyBtn.dataset.bound='1';historyBtn.onclick=async()=>{try{await window.cmsShowThemeHistory()}catch(e){console.error('Theme history error:',e);alert('Unable to load theme history: '+e.message)}}}
}

/* ---------- SEO ---------- */
$('#seoOgFile').onchange=()=>previewFile($('#seoOgFile'),'#seoOgPreview');
async function seo(){try{const rows=await q('cms_seo');$('#seoRows').innerHTML=`<div class="cms-table-wrap"><table class="cms-table"><tr><th>Page</th><th>Title</th><th>Robots</th><th>Actions</th></tr>${rows.map(r=>`<tr><td>${esc(r.page_slug)}</td><td>${esc(r.title||'')}</td><td>${esc(r.robots||'')}</td><td><button class="cms-btn gray" data-se="${r.id}">Edit</button> <button class="cms-btn red" data-del="${r.id}">Delete</button></td></tr>`).join('')}</table></div>`;$$('[data-se]').forEach(b=>b.onclick=()=>{const r=rows.find(x=>x.id===b.dataset.se);$('#seoPage').value=r.page_slug;$('#seoTitle').value=r.title||'';$('#seoDescription').value=r.description||'';$('#seoKeywords').value=r.keywords||'';$('#seoCanonical').value=r.canonical_url||'';$('#seoOg').value=r.og_image_url||'';$('#seoIndex').value=r.robots||'index,follow';previewUrl(r.og_image_url,'#seoOgPreview','Current OG image')});$$('#seoRows [data-del]').forEach(b=>b.onclick=()=>confirm('Move to Recycle Bin?')&&soft('cms_seo',b.dataset.del))}catch(e){setupError(e)}}
$('#seoForm').onsubmit=async e=>{e.preventDefault();try{let og=$('#seoOg').value;if($('#seoOgFile').files[0])og=await uploadFile($('#seoOgFile').files[0],'seo');const canonical=$('#seoCanonical').value.trim()||new URL($('#seoCanonicalPage').value,location.href).href;const obj={page_slug:$('#seoPage').value,title:$('#seoTitle').value,description:$('#seoDescription').value,keywords:$('#seoKeywords').value,canonical_url:canonical,og_image_url:og||null,robots:$('#seoIndex').value,updated_at:new Date().toISOString(),deleted_at:null};const {error}=await client.from('cms_seo').upsert(obj,{onConflict:'page_slug'});if(error)throw error;toast('SEO saved');seo()}catch(e){alert(e.message)}};

/* ---------- Notifications ---------- */
['#notificationLogoFile','#notificationImageFile'].forEach((id,i)=>$(id).onchange=()=>previewFile($(id),i?'#notificationImagePreview':'#notificationLogoPreview'));
function notificationPreview(data){const modal=$('#cmsPreviewModal'),body=$('#cmsPreviewBody');body.innerHTML=`<div class="cms-preview-notif">${data.image_url?`<img class="banner" src="${esc(data.image_url)}">`:''}${data.logo_url?`<img class="logo" src="${esc(data.logo_url)}">`:''}<div class="body"><small>${esc((data.popup_type||'popup').toUpperCase())}</small><h2>${esc(data.title||'Notification')}</h2><p style="white-space:pre-wrap">${esc(data.message||'')}</p>${data.button_text?`<span class="cms-btn">${esc(data.button_text)}</span>`:''}</div></div>`;modal.hidden=false}
$('#cmsPreviewClose').onclick=()=>$('#cmsPreviewModal').hidden=true;$('#cmsPreviewModal').onclick=e=>{if(e.target.id==='cmsPreviewModal')e.currentTarget.hidden=true};$('#notificationPreviewBtn').onclick=()=>notificationPreview({popup_type:$('#notificationType').value,title:$('#notificationTitle').value,message:$('#notificationMessage').value,logo_url:$('#notificationLogo').value||($('#notificationLogoFile').files[0]?URL.createObjectURL($('#notificationLogoFile').files[0]):''),image_url:$('#notificationImage').value||($('#notificationImageFile').files[0]?URL.createObjectURL($('#notificationImageFile').files[0]):''),button_text:$('#notificationButtonText').value});
async function notifications(){try{const rows=await q('cms_notifications');notificationCache=rows;$('#notificationRows').innerHTML=`<table class="cms-table"><tr><th>Preview</th><th>Title</th><th>Type</th><th>Page/Audience</th><th>Status</th><th>Actions</th></tr>${rows.map(r=>`<tr><td>${r.image_url?`<img class="cms-thumb" src="${esc(r.image_url)}">`:r.logo_url?`<img class="cms-thumb" src="${esc(r.logo_url)}">`:'—'}</td><td>${esc(r.title)}</td><td>${esc(r.popup_type||'popup')}</td><td>${esc(r.page_slug||'all')} · ${esc(r.target_scope||'all')}</td><td><span class="cms-status ${r.status==='draft'?'draft':''}">${esc(r.status)}</span></td><td><button class="cms-btn gold" data-np="${r.id}">Preview</button> <button class="cms-btn gray" data-ne="${r.id}">Edit</button> <button class="cms-btn red" data-nd="${r.id}">Delete</button></td></tr>`).join('')}</table>`;$$('[data-np]').forEach(b=>b.onclick=()=>notificationPreview(rows.find(x=>x.id===b.dataset.np)));$$('[data-ne]').forEach(b=>b.onclick=()=>editNotification(rows.find(x=>x.id===b.dataset.ne)));$$('[data-nd]').forEach(b=>b.onclick=()=>confirm('Move to Recycle Bin?')&&soft('cms_notifications',b.dataset.nd))}catch(e){setupError(e)}}
function editNotification(r){$('#notificationId').value=r.id;$('#notificationType').value=r.popup_type||'popup';$('#notificationStatus').value=r.status;$('#notificationPage').value=r.page_slug||'all';$('#notificationTarget').value=r.target_scope||'all';$('#notificationTitle').value=r.title;$('#notificationMessage').value=r.message;$('#notificationLogo').value=r.logo_url||'';$('#notificationImage').value=r.image_url||'';$('#notificationButtonText').value=r.button_text||'';$('#notificationButtonUrl').value=r.button_url||'';$('#notificationButtonPage').value=pages.includes(r.button_url)?r.button_url:'';$('#notificationPriority').value=String(r.priority||0);$('#notificationStart').value=localDT(r.starts_at);$('#notificationEnd').value=localDT(r.ends_at);previewUrl(r.logo_url,'#notificationLogoPreview','Current logo');previewUrl(r.image_url,'#notificationImagePreview','Current banner')}
$('#notificationForm').onsubmit=async e=>{e.preventDefault();try{const id=$('#notificationId').value;let logo=$('#notificationLogo').value,img=$('#notificationImage').value;if($('#notificationLogoFile').files[0])logo=await uploadFile($('#notificationLogoFile').files[0],'notifications/logo');if($('#notificationImageFile').files[0])img=await uploadFile($('#notificationImageFile').files[0],'notifications/banner');const btnUrl=$('#notificationButtonUrl').value.trim()||$('#notificationButtonPage').value||null;const obj={popup_type:$('#notificationType').value,page_slug:$('#notificationPage').value,target_scope:$('#notificationTarget').value,title:$('#notificationTitle').value,message:$('#notificationMessage').value,logo_url:logo||null,image_url:img||null,button_text:$('#notificationButtonText').value||null,button_url:btnUrl,priority:+$('#notificationPriority').value||0,status:$('#notificationStatus').value,starts_at:dt($('#notificationStart').value)||new Date().toISOString(),ends_at:dt($('#notificationEnd').value),updated_at:new Date().toISOString()};const res=id?await client.from('cms_notifications').update(obj).eq('id',id):await client.from('cms_notifications').insert(obj);if(res.error)throw res.error;toast('Notification saved');resetNotification();notifications();overview()}catch(e){alert(e.message)}};
function resetNotification(){$('#notificationForm').reset();$('#notificationId').value='';$('#notificationLogo').value='';$('#notificationImage').value='';$('#notificationLogoPreview').innerHTML='';$('#notificationImagePreview').innerHTML=''}$('#notificationReset').onclick=resetNotification;

/* ---------- Media ---------- */
$('#mediaFile').onchange=()=>previewFile($('#mediaFile'),'#mediaPreview');
async function media(){try{const rows=await q('cms_media');$('#mediaRows').innerHTML=`<div class="cms-table-wrap"><table class="cms-table"><tr><th>Preview</th><th>Name</th><th>Type</th><th>Category</th><th>Actions</th></tr>${rows.map(r=>`<tr><td>${r.type==='image'||r.type==='icon'?`<img class="cms-thumb" src="${esc(r.url)}">`:'📄'}</td><td>${esc(r.name)}</td><td>${esc(r.type)}</td><td>${esc(r.category||'')}</td><td><a class="cms-btn gray" href="${esc(r.url)}" target="_blank">Open</a> <button class="cms-btn red" data-mdl="${r.id}">Delete</button></td></tr>`).join('')}</table></div>`;$$('[data-mdl]').forEach(b=>b.onclick=()=>confirm('Move to Recycle Bin?')&&soft('cms_media',b.dataset.mdl))}catch(e){setupError(e)}}
$('#mediaForm').onsubmit=async e=>{e.preventDefault();try{const file=$('#mediaFile').files[0];if(!file)return alert('Choose a file.');const url=await uploadFile(file,'library');const obj={name:$('#mediaName').value,type:$('#mediaType').value,url,alt_text:$('#mediaAlt').value,category:$('#mediaCategory').value,updated_at:new Date().toISOString()};const {error}=await client.from('cms_media').insert(obj);if(error)throw error;toast('Media uploaded');e.target.reset();$('#mediaPreview').innerHTML='';media();overview()}catch(e){alert(e.message)}};$('#mediaReset').onclick=()=>{$('#mediaForm').reset();$('#mediaPreview').innerHTML=''};

/* ---------- Services ---------- */
$('#serviceImageFile').onchange=()=>previewFile($('#serviceImageFile'),'#serviceImagePreview');
async function services(){try{const rows=await q('cms_services');$('#serviceRows').innerHTML=`<div class="cms-table-wrap"><table class="cms-table"><tr><th>Image</th><th>Type</th><th>Name</th><th>Active</th><th>Actions</th></tr>${rows.map(r=>`<tr><td>${r.image_url?`<img class="cms-thumb" src="${esc(r.image_url)}">`:'—'}</td><td>${esc(r.type)}</td><td>${esc(r.name)}</td><td>${r.is_active?'Yes':'No'}</td><td><button class="cms-btn gray" data-sve="${r.id}">Edit</button> <button class="cms-btn red" data-svd="${r.id}">Delete</button></td></tr>`).join('')}</table></div>`;$$('[data-sve]').forEach(b=>b.onclick=()=>{const r=rows.find(x=>x.id===b.dataset.sve);$('#serviceId').value=r.id;$('#serviceType').value=r.type;$('#serviceName').value=r.name;$('#serviceDescription').value=r.description||'';$('#serviceImage').value=r.image_url||'';$('#serviceSort').value=r.sort_order||0;$('#serviceActive').value=String(r.is_active);previewUrl(r.image_url,'#serviceImagePreview','Current image')});$$('[data-svd]').forEach(b=>b.onclick=()=>confirm('Move to Recycle Bin?')&&soft('cms_services',b.dataset.svd))}catch(e){setupError(e)}}
$('#serviceForm').onsubmit=async e=>{e.preventDefault();try{const id=$('#serviceId').value;let img=$('#serviceImage').value;if($('#serviceImageFile').files[0])img=await uploadFile($('#serviceImageFile').files[0],'services');const obj={type:$('#serviceType').value,name:$('#serviceName').value,description:$('#serviceDescription').value,image_url:img||null,sort_order:+$('#serviceSort').value||0,is_active:$('#serviceActive').value==='true',updated_at:new Date().toISOString()};const res=id?await client.from('cms_services').update(obj).eq('id',id):await client.from('cms_services').insert(obj);if(res.error)throw res.error;toast('Service/category saved');resetService();services()}catch(e){alert(e.message)}};function resetService(){$('#serviceForm').reset();$('#serviceId').value='';$('#serviceImage').value='';$('#serviceImagePreview').innerHTML=''}$('#serviceReset').onclick=resetService;

/* ---------- Documents ---------- */
$('#documentFile').onchange=()=>previewFile($('#documentFile'),'#documentPreview');
async function documents(){try{const rows=await q('cms_documents');$('#documentRows').innerHTML=`<div class="cms-table-wrap"><table class="cms-table"><tr><th>Title</th><th>Category</th><th>Status</th><th>Actions</th></tr>${rows.map(r=>`<tr><td>${esc(r.title)}</td><td>${esc(r.category||'')}</td><td>${esc(r.status)}</td><td><a class="cms-btn gray" href="${esc(r.url)}" target="_blank">Open</a> <button class="cms-btn gray" data-de="${r.id}">Edit</button> <button class="cms-btn red" data-dd="${r.id}">Delete</button></td></tr>`).join('')}</table></div>`;$$('[data-de]').forEach(b=>b.onclick=()=>{const r=rows.find(x=>x.id===b.dataset.de);$('#documentId').value=r.id;$('#documentTitle').value=r.title;$('#documentCategory').value=r.category||'general';$('#documentStatus').value=r.status;$('#documentUrl').value=r.url;previewUrl(r.url,'#documentPreview','Current document')});$$('[data-dd]').forEach(b=>b.onclick=()=>confirm('Move to Recycle Bin?')&&soft('cms_documents',b.dataset.dd))}catch(e){setupError(e)}}
$('#documentForm').onsubmit=async e=>{e.preventDefault();try{const id=$('#documentId').value;let url=$('#documentUrl').value;if($('#documentFile').files[0])url=await uploadFile($('#documentFile').files[0],'documents');if(!url)return alert('Choose a document.');const obj={title:$('#documentTitle').value,category:$('#documentCategory').value,url,status:$('#documentStatus').value,updated_at:new Date().toISOString()};const res=id?await client.from('cms_documents').update(obj).eq('id',id):await client.from('cms_documents').insert(obj);if(res.error)throw res.error;toast('Document saved');resetDocument();documents()}catch(e){alert(e.message)}};function resetDocument(){$('#documentForm').reset();$('#documentId').value='';$('#documentUrl').value='';$('#documentPreview').innerHTML=''}$('#documentReset').onclick=resetDocument;

/* ---------- Settings ---------- */
$('#setLogoFile').onchange=()=>previewFile($('#setLogoFile'),'#setLogoPreview');$('#setFaviconFile').onchange=()=>previewFile($('#setFaviconFile'),'#setFaviconPreview');
async function settingsLoad(){try{const {data,error}=await client.from('cms_settings').select('value').eq('key','global').is('deleted_at',null).maybeSingle();if(error)throw error;const v=data?.value||{};$('#setName').value=v.website_name||'DivyangSathi';$('#setEmail').value=v.support_email||'';$('#setPhone').value=v.support_phone||'';$('#setLogo').value=v.logo_url||'';$('#setFavicon').value=v.favicon_url||'';$('#setMaintenance').value=String(!!v.maintenance_mode);$('#setAnnouncement').value=v.announcement||'';previewUrl(v.logo_url,'#setLogoPreview','Current logo');previewUrl(v.favicon_url,'#setFaviconPreview','Current favicon')}catch(e){setupError(e)}}
$('#settingsForm').onsubmit=async e=>{e.preventDefault();try{let logo=$('#setLogo').value,fav=$('#setFavicon').value;if($('#setLogoFile').files[0])logo=await uploadFile($('#setLogoFile').files[0],'settings/logo');if($('#setFaviconFile').files[0])fav=await uploadFile($('#setFaviconFile').files[0],'settings/favicon');const val={website_name:$('#setName').value,support_email:$('#setEmail').value,support_phone:$('#setPhone').value,logo_url:logo||null,favicon_url:fav||null,maintenance_mode:$('#setMaintenance').value==='true',announcement:$('#setAnnouncement').value};const {error}=await client.from('cms_settings').upsert({key:'global',value:val,updated_at:new Date().toISOString(),deleted_at:null},{onConflict:'key'});if(error)throw error;$('#setLogo').value=logo||'';$('#setFavicon').value=fav||'';toast('Global settings saved')}catch(e){alert(e.message)}};


/* ---------- Revision History ---------- */
async function revisions(){try{const {data,error}=await client.from('cms_revisions').select('*').order('created_at',{ascending:false}).limit(100);if(error)throw error;const rows=data||[];$('#revisionRows').innerHTML=`<div class="cms-table-wrap"><table class="cms-table"><tr><th>Module</th><th>Changed</th><th>Previous Item</th><th>Action</th></tr>${rows.map(r=>`<tr><td>${esc(r.source_table)}</td><td>${new Date(r.created_at).toLocaleString('en-IN')}</td><td>${esc(r.snapshot?.title||r.snapshot?.name||r.snapshot?.label||r.snapshot?.page_slug||r.source_id)}</td><td><button class="cms-btn gold" data-rv="${r.id}">Restore Version</button></td></tr>`).join('')}</table></div>`;$$('[data-rv]').forEach(b=>b.onclick=async()=>{if(!confirm('Restore this previous version? Current record will be replaced.'))return;const {error}=await client.rpc('cms_restore_revision',{p_revision_id:b.dataset.rv});if(error)return alert(error.message);toast('Previous version restored');loadAll();revisions()})}catch(e){setupError(e)}}
$('#revisionRefresh').onclick=revisions;

/* ---------- Trash ---------- */
async function trash(){try{const {data,error}=await client.from('cms_trash_view').select('*').order('deleted_at',{ascending:false});if(error)throw error;trashCache=data||[];renderTrash()}catch(e){setupError(e)}}
function renderTrash(){const f=$('#trashFilter').value,rows=f==='all'?trashCache:trashCache.filter(r=>r.source_table===f);$('#trashRows').innerHTML=`<div class="cms-table-wrap"><table class="cms-table"><tr><th>Type</th><th>Name</th><th>Deleted</th><th>Actions</th></tr>${rows.map(r=>`<tr><td>${esc(r.source_table)}</td><td>${esc(r.label)}</td><td>${new Date(r.deleted_at).toLocaleString('en-IN')}</td><td><button class="cms-btn green" data-restore="${r.source_table}|${r.id}">Restore</button> <button class="cms-btn red" data-purge="${r.source_table}|${r.id}">Delete Forever</button></td></tr>`).join('')}</table></div>`;$$('[data-restore]').forEach(b=>b.onclick=async()=>{const [t,id]=b.dataset.restore.split('|');const {error}=await client.from(t).update({deleted_at:null,updated_at:new Date().toISOString()}).eq('id',id);if(error)alert(error.message);else{toast('Restored');trash();loadAll()}});$$('[data-purge]').forEach(b=>b.onclick=async()=>{if(!confirm('Permanently delete? This cannot be undone.'))return;const [t,id]=b.dataset.purge.split('|');const {error}=await client.from(t).delete().eq('id',id);if(error)alert(error.message);else{toast('Permanently deleted');trash();overview()}})}$('#trashFilter').onchange=renderTrash;
$('#analyticsRefresh').onclick=analytics;


/* ---------- Full Website Theme Manager ---------- */
const THEME_DEFAULT={name:'Classic Blue',settings:{'--cms-primary':'#2563eb','--cms-secondary':'#16a34a','--cms-accent':'#f59e0b','--cms-background':'#ffffff','--cms-font':'system-ui,sans-serif','--cms-radius':'16px',button_style:'solid',background_image:null,custom_css:'',mode:'system'}};
function themeSettingsFromForm(bg=null){return {'--cms-primary':$('#themePrimary').value,'--cms-secondary':$('#themeSecondary').value,'--cms-accent':$('#themeAccent').value,'--cms-background':$('#themeBg').value,'--cms-font':$('#themeFont').value,'--cms-radius':$('#themeRadius').value,button_style:$('#themeButton').value,background_image:bg||$('#themeBackgroundPreview')?.dataset.url||null,custom_css:$('#themeCss').value,mode:$('#themeMode').value}}
function themeFill(r){const x=r?.settings||{};$('#themeEditId').value=r?.id||'';$('#themeName').value=r?.name||'';$('#themePrimary').value=x['--cms-primary']||'#2563eb';$('#themeSecondary').value=x['--cms-secondary']||'#16a34a';$('#themeAccent').value=x['--cms-accent']||'#f59e0b';$('#themeBg').value=x['--cms-background']||'#ffffff';['Primary','Secondary','Accent','Bg'].forEach(k=>{$('#theme'+k+'Color').value=$('#theme'+k).value});$('#themeFont').value=x['--cms-font']||'system-ui,sans-serif';$('#themeRadius').value=x['--cms-radius']||'16px';$('#themeButton').value=x.button_style||'solid';$('#themeMode').value=x.mode||'system';$('#themeCss').value=x.custom_css||'';const h=$('#themeBackgroundPreview');h.dataset.url=x.background_image||'';previewUrl(x.background_image,'#themeBackgroundPreview','Current background')}
async function themeBackup(){const {data,error}=await client.from('cms_theme').select('*').eq('is_active',true).is('deleted_at',null).order('updated_at',{ascending:false}).limit(1);if(error)throw error;const r=data?.[0];if(r){const e=await client.from('cms_theme_history').insert({theme_data:{theme_id:r.id,name:r.name,settings:r.settings,saved_at:new Date().toISOString()}});if(e.error)throw e.error}return r}
async function themeSavedLoad(){const {data,error}=await client.from('cms_theme').select('*').is('deleted_at',null).order('updated_at',{ascending:false});if(error)throw error;const rows=data||[];const active=rows.find(r=>r.is_active);$('#themeActiveBadge').textContent='Active: '+(active?.name||'None');$('#themeSavedRows').innerHTML=`<div class="cms-table-wrap"><table class="cms-table"><tr><th>Theme</th><th>Status</th><th>Updated</th><th>Actions</th></tr>${rows.map(r=>`<tr><td>${esc(r.name)}</td><td>${r.is_active?'<span class="cms-status">ACTIVE</span>':'Saved'}</td><td>${new Date(r.updated_at||r.created_at).toLocaleString('en-IN')}</td><td><button class="cms-btn green" data-ta="${r.id}">Apply</button> <button class="cms-btn gray" data-te="${r.id}">Edit</button> <button class="cms-btn red" data-td="${r.id}" ${r.is_active?'disabled title="Apply another theme before deleting"':''}>Delete</button></td></tr>`).join('')||'<tr><td colspan="4">No saved themes.</td></tr>'}</table></div>`;$$('[data-ta]').forEach(b=>b.onclick=()=>themeApply(rows.find(r=>r.id===b.dataset.ta)));$$('[data-te]').forEach(b=>b.onclick=()=>themeFill(rows.find(r=>r.id===b.dataset.te)));$$('[data-td]').forEach(b=>b.onclick=async()=>{if(!confirm('Delete this saved theme?'))return;const {error}=await client.from('cms_theme').update({deleted_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',b.dataset.td).eq('is_active',false);if(error)return alert(error.message);toast('Theme moved to Recycle Bin');themeSavedLoad()})}
async function themeApply(r){if(!r)return;await themeBackup();let x=await client.from('cms_theme').update({is_active:false}).eq('is_active',true);if(x.error)throw x.error;x=await client.from('cms_theme').update({is_active:true,updated_at:new Date().toISOString()}).eq('id',r.id);if(x.error)throw x.error;toast('Theme applied live');themeSavedLoad();themeHistoryLoad()}
async function themeHistoryLoad(){const {data,error}=await client.from('cms_theme_history').select('*').order('created_at',{ascending:false}).limit(50);if(error)throw error;const rows=data||[];$('#themeHistoryRows').innerHTML=`<div class="cms-table-wrap"><table class="cms-table"><tr><th>Theme</th><th>Saved</th><th>Actions</th></tr>${rows.map(r=>`<tr><td>${esc(r.theme_data?.name||'Theme Backup')}</td><td>${new Date(r.created_at).toLocaleString('en-IN')}</td><td><button class="cms-btn gold" data-thr="${r.id}">Restore</button> <button class="cms-btn red" data-thd="${r.id}">Delete</button></td></tr>`).join('')||'<tr><td colspan="3">No theme history yet.</td></tr>'}</table></div>`;$$('[data-thr]').forEach(b=>b.onclick=async()=>{const r=rows.find(x=>x.id===b.dataset.thr);if(!confirm('Restore this theme version?'))return;await themeBackup();await client.from('cms_theme').update({is_active:false}).eq('is_active',true);const z=await client.from('cms_theme').insert({name:(r.theme_data?.name||'Restored Theme')+' (Restored)',settings:r.theme_data.settings,is_active:true});if(z.error)return alert(z.error.message);toast('Theme restored');themeSavedLoad();themeHistoryLoad()});$$('[data-thd]').forEach(b=>b.onclick=async()=>{if(!confirm('Delete this history snapshot permanently?'))return;const z=await client.from('cms_theme_history').delete().eq('id',b.dataset.thd);if(z.error)return alert(z.error.message);themeHistoryLoad()})}
async function themeSaveNew(){try{let bg=$('#themeBackgroundPreview')?.dataset.url||null;if($('#themeBackgroundFile').files[0])bg=await uploadFile($('#themeBackgroundFile').files[0],'theme');const name=$('#themeName').value.trim()||'Saved Theme '+new Date().toLocaleDateString('en-IN');const z=await client.from('cms_theme').insert({name,settings:themeSettingsFromForm(bg),is_active:false});if(z.error)throw z.error;toast('New theme saved');themeSavedLoad()}catch(e){alert(e.message)}}
async function themeUpdate(){try{const id=$('#themeEditId').value;if(!id)return alert('Saved Themes se Edit choose karo.');let bg=$('#themeBackgroundPreview')?.dataset.url||null;if($('#themeBackgroundFile').files[0])bg=await uploadFile($('#themeBackgroundFile').files[0],'theme');const z=await client.from('cms_theme').update({name:$('#themeName').value.trim()||'Updated Theme',settings:themeSettingsFromForm(bg),updated_at:new Date().toISOString()}).eq('id',id);if(z.error)throw z.error;toast('Theme updated');themeSavedLoad()}catch(e){alert(e.message)}}
function themePreviewNow(){const x=themeSettingsFromForm();let st=document.getElementById('cmsThemePreviewStyle');if(!st){st=document.createElement('style');st.id='cmsThemePreviewStyle';document.head.appendChild(st)}st.textContent=`:root{--cms-primary:${x['--cms-primary']};--cms-secondary:${x['--cms-secondary']};--cms-accent:${x['--cms-accent']};--cms-background:${x['--cms-background']}} body{font-family:${x['--cms-font']};background:${x['--cms-background']}!important} .cms-box,.cms-card{border-radius:${x['--cms-radius']}!important}`+(x.custom_css||'');toast('Preview applied to CMS only')}
async function themePublishFull(e){e.preventDefault();try{await themeBackup();let bg=$('#themeBackgroundPreview')?.dataset.url||null;if($('#themeBackgroundFile').files[0])bg=await uploadFile($('#themeBackgroundFile').files[0],'theme');await client.from('cms_theme').update({is_active:false}).eq('is_active',true);const z=await client.from('cms_theme').insert({name:$('#themeName').value.trim()||$('#themePreset').selectedOptions[0].textContent||'Published Theme',settings:themeSettingsFromForm(bg),is_active:true});if(z.error)throw z.error;toast('Theme published live');themeSavedLoad();themeHistoryLoad()}catch(e){alert(e.message)}}
async function themeRestoreDefault(){if(!confirm('Restore default website theme?'))return;await themeBackup();await client.from('cms_theme').update({is_active:false}).eq('is_active',true);const z=await client.from('cms_theme').insert({...THEME_DEFAULT,is_active:true});if(z.error)return alert(z.error.message);toast('Default theme restored');themeSavedLoad();themeHistoryLoad()}
function bindFullThemeManager(){if(!$('#themeForm'))return;$('#themeForm').onsubmit=themePublishFull;$('#themeSaveNew').onclick=themeSaveNew;$('#themeUpdate').onclick=themeUpdate;$('#themePreview').onclick=themePreviewNow;$('#themeRestoreDefault').onclick=themeRestoreDefault;$('#themeRefreshSaved').onclick=themeSavedLoad;const oldReset=$('#themeReset');oldReset.onclick=()=>{document.getElementById('cmsThemePreviewStyle')?.remove();themeFill(null);toast('Preview reset')};themeSavedLoad().catch(setupError);themeHistoryLoad().catch(setupError)}

async function loadAll(){overview();pagesLoad();menus();seo();notifications();media();services();documents();settingsLoad();trash();analytics();revisions()}
async function init(){fillPages();tabs();bindThemeRestoreControls();bindFullThemeManager();await loadPageSelectors();if(await adminCheck())loadAll()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
