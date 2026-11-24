/* PromptTantu v1 — dependency-free, local-first prompt browser. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const keys = { favorites:'prompttantu:favorites:v1',custom:'prompttantu:custom:v1',theme:'prompttantu:theme:v1' };
  const iconSet = ['✺','◈','◉','✧','⬡','✎','⚗','⚑','▥','⌘','▦','⚙','◫','◎','✹','⌕','▤','☼','↗','◷'];
  const state = { meta:null, catalog:[], searchable:[], filtered:[], weekly:new Map(), loaded:false, view:'library', page:0, pageSize:24, category:'all', mode:'all', query:'', sort:'asc', fav:new Set(readJSON(keys.favorites,[])), custom:readJSON(keys.custom,[]), detail:null, categoryCache:new Map(), searchTimer:null, toastTimer:null };
  function readJSON(key,fallback){try {let data=JSON.parse(localStorage.getItem(key));return data??fallback}catch{return fallback}}
  const escapeHTML = s => String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
  function notify(message){const el=$('toast');el.textContent=message;el.classList.add('visible');clearTimeout(state.toastTimer);state.toastTimer=setTimeout(()=>el.classList.remove('visible'),2600)}
  function save(key,val){try {localStorage.setItem(key,JSON.stringify(val))}catch{notify('Local storage unavailable. Export a backup to keep your changes.')}}
  function fmt(n){return Number(n).toLocaleString('en-IN')}
  function slug(mode){return mode?.split(/\s+/).filter(Boolean)[0]||'/prompt'}
  function updateCounters(){$('favCount').textContent=fmt(state.fav.size);$('statFavorites').textContent=fmt(state.fav.size);$('ownCount').textContent=fmt(state.custom.length);$('statOwn').textContent=fmt(state.custom.length);$('statTotal').textContent=fmt((state.meta?.count||100000)+state.custom.length)}
  async function decompressJson(url){const r=await fetch(url);if(!r.ok)throw Error(`Could not load ${url} (${r.status})`);if(!('DecompressionStream' in window))throw Error('This browser does not support gzip decoding. Use current Chrome, Edge, Firefox or Safari.');const ds=r.body.pipeThrough(new DecompressionStream('gzip'));return JSON.parse(await new Response(ds).text())}
  async function bootstrap(){
    try {
      const r=await fetch('data/meta.json');if(!r.ok)throw Error('Metadata not found');state.meta=await r.json();
      $('statCategories').textContent=state.meta.category_count;$('categoryTinyCount').textContent=state.meta.category_count;
      setCategories();
      state.catalog=await decompressJson('data/catalog.json.gz');
      if(state.catalog.length!==state.meta.count)throw Error('Library index count mismatch');
      const weeklyResponse=await fetch('data/weekly-150001.json');
      if(weeklyResponse.ok){const weekly=await weeklyResponse.json(); for(const row of weekly){if(state.catalog.some(x=>x[0]===row.id))throw Error('Weekly ID collides with base library: '+row.id); const ci=state.meta.categories.findIndex(c=>c.name===row.category); if(ci<0)throw Error('Invalid weekly category'); state.weekly.set(row.id,row); state.catalog.push([row.id,row.title,ci,row.modes,row.subcategory,row.purpose]);} state.meta.count+=weekly.length;}
      state.searchable=state.catalog.map(r=>[r[0],r[1],r[3],r[4],r[5]].join(' ').toLowerCase());
      setModes();state.loaded=true;$('libraryStatus').textContent=fmt(state.meta.count)+' prompts ready';$('syncText').textContent=fmt(state.meta.count)+' prompts indexed';
      updateCounters();renderLibrary();
    } catch(e){$('libraryStatus').textContent='Library unavailable';$('syncText').textContent='Open via a web server';$('promptGrid').innerHTML=`<div class="empty-state"><strong>Unable to open the library</strong>${escapeHTML(e.message)}<br/><br/>Run <code>python -m http.server 8000</code> from this folder and open <code>http://localhost:8000</code>.</div>`;console.error(e)}
  }
  function setCategories(){
    const cats=state.meta.categories;
    $('categorySelect').innerHTML='<option value="all">All categories</option>'+cats.map((c,i)=>`<option value="${i}">${escapeHTML(c.name)}</option>`).join('');
    $('categoryNav').innerHTML=cats.map((c,i)=>`<button class="category-item" data-category="${i}" title="${escapeHTML(c.name)}"><span class="category-emoji">${iconSet[i]}</span><span class="cat-title">${escapeHTML(c.name)}</span></button>`).join('');
  }
  function setModes(){
    const counts=new Map();for(const row of state.catalog){for(const m of row[3].split(/\s+/).filter(Boolean))counts.set(m,(counts.get(m)||0)+1)}
    const values=[...counts.entries()].sort((a,b)=>b[1]-a[1]);
    $('modeSelect').innerHTML='<option value="all">All modes</option>'+values.map(([m,count])=>`<option value="${escapeHTML(m)}">${escapeHTML(m)} (${fmt(count)})</option>`).join('');
  }
  function applyFilters(){
    if(!state.loaded)return;
    const cat=state.category, mode=state.mode, terms=state.query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const output=[];
    for(let i=0;i<state.catalog.length;i++){
      const row=state.catalog[i];if(cat!=='all'&&String(row[2])!==cat)continue;
      if(mode!=='all'&&!row[3].split(/\s+/).includes(mode))continue;
      if(terms.length&&!terms.every(t=>state.searchable[i].includes(t)))continue;
      output.push(i);
    }
    if(state.sort==='desc')output.reverse();
    state.filtered=output;state.page=0;
    renderLibrary();
  }
  function findCardRecord(id){return state.catalog.find(r=>r[0]===id)||null}
  function cardHtml(row,custom=false){
    const [id,title,ci,modes,subcategory,purpose]=row;
    const category=custom?'My collection':state.meta.categories[ci].name;
    return `<article class="prompt-card" data-open="${escapeHTML(id)}" tabindex="0" role="button" aria-label="Open prompt ${escapeHTML(id)}: ${escapeHTML(title)}"><div class="prompt-top"><span class="prompt-id">${escapeHTML(id)} · ${escapeHTML(category)}</span><button class="fav-toggle ${state.fav.has(id)?'saved':''}" data-fav="${escapeHTML(id)}" title="${state.fav.has(id)?'Remove favorite':'Save favorite'}" aria-label="Toggle favorite for ${escapeHTML(id)}">${state.fav.has(id)?'♥':'♡'}</button></div><h4>${escapeHTML(title)}</h4><p>${escapeHTML(purpose||subcategory||'Build and customize this reusable prompt.')}</p><div class="card-bottom"><span class="mode-tag">${escapeHTML(slug(modes))}</span><span class="card-open">Open prompt ↗</span></div></article>`;
  }
  function renderLibrary(){
    if(!state.loaded)return;
    if(state.filtered.length===0 && !state.query && state.category==='all' && state.mode==='all'){
      state.filtered=Array.from({length:state.catalog.length},(_,i)=>i);if(state.sort==='desc')state.filtered.reverse();
    }
    const count=state.filtered.length;
    $('resultsTitle').textContent=state.category==='all'?'Explore prompts':state.meta.categories[Number(state.category)].name;
    $('resultsSummary').textContent=`${fmt(count)} matching prompts · Page ${fmt(state.page+1)} of ${fmt(Math.max(1,Math.ceil(count/state.pageSize)))}`;
    const slice=state.filtered.slice(state.page*state.pageSize,(state.page+1)*state.pageSize);
    $('promptGrid').innerHTML=slice.length?slice.map(i=>cardHtml(state.catalog[i])).join(''):'<div class="empty-state"><strong>No matches found</strong>Try a shorter search or clear the category and mode filters.</div>';
    $('pagination').innerHTML=count>state.pageSize?`<button data-page="previous" ${state.page===0?'disabled':''}>← Previous</button><span>${fmt(state.page*state.pageSize+1)}–${fmt(Math.min((state.page+1)*state.pageSize,count))} / ${fmt(count)}</span><button data-page="next" ${(state.page+1)*state.pageSize>=count?'disabled':''}>Next →</button>`:'';
  }
  function setCategory(cat){state.category=cat;$('categorySelect').value=cat;document.querySelectorAll('.category-item').forEach(e=>e.classList.toggle('active',e.dataset.category===cat));switchView('library');applyFilters()}
  function switchView(view){
    state.view=view;
    const map={'library':['libraryView','Explore Library'],'favorites':['favoritesView','My Favorites'],'workflows':['workflowsView','Workflow Studio'],'my-prompts':['myPromptsView','My Prompts']};
    for(const [key,[id]] of Object.entries(map))$(id).hidden=key!==view;
    $('viewCrumb').textContent=map[view][1];document.querySelectorAll('.nav-button').forEach(e=>e.classList.toggle('active',e.dataset.view===view));
    if(view==='favorites')renderFavorites();if(view==='my-prompts')renderCustom();if(view==='workflows')renderWorkflows();
    if(window.innerWidth<950)closeMenu();
  }
  function toggleFavorite(id){if(state.fav.has(id))state.fav.delete(id);else state.fav.add(id);save(keys.favorites,[...state.fav]);updateCounters();if(state.view==='favorites')renderFavorites();else if(state.view==='my-prompts')renderCustom();else renderLibrary();if(state.detail?.id===id)refreshDetailFavorite()}
  function renderFavorites(){
    const rows=[];
    for(const id of state.fav){const row=findCardRecord(id);if(row)rows.push(cardHtml(row));else{const c=state.custom.find(x=>x.id===id);if(c)rows.push(cardHtml(customAsRow(c),true))}}
    $('favoritesGrid').innerHTML=rows.length?rows.join(''):'<div class="empty-state"><strong>No favorites yet</strong>Tap ♡ on any prompt to save it here.</div>';
  }
  function customAsRow(c){return[c.id,c.title,-1,c.modes||'/personal','',c.purpose||'Your custom template']}
  function renderCustom(){$('customGrid').innerHTML=state.custom.length?state.custom.slice().reverse().map(c=>cardHtml(customAsRow(c),true)).join(''):'<div class="empty-state"><strong>Your personal collection is empty</strong>Create a prompt above or import an existing JSONL batch.</div>'}
  async function loadPrompt(id){
    const custom=state.custom.find(c=>c.id===id);if(custom)return custom;
    if(state.weekly.has(id))return state.weekly.get(id);
    const found=state.catalog.find(r=>r[0]===id);if(!found)throw Error('Prompt not found');
    const ci=found[2];let records=state.categoryCache.get(ci);
    if(!records){
      notify(`Opening ${state.meta.categories[ci].name}...`);
      const data=await decompressJson(state.meta.categories[ci].file);
      records=new Map(data.map(row=>[row.id,row]));
      if(state.categoryCache.size>=2)state.categoryCache.delete(state.categoryCache.keys().next().value);
      state.categoryCache.set(ci,records);
    }
    return records.get(id);
  }
  async function openPrompt(id){
    try{
      const data=await loadPrompt(id);if(!data)throw Error('Prompt not in shard');state.detail=data;
      $('detailId').textContent=data.id;
      $('detailTitle').textContent=data.title;
      $('detailPurpose').textContent=data.purpose||data.subcategory||'';
      $('detailModes').innerHTML=(data.modes||'/personal').split(/\s+/).filter(Boolean).map(m=>`<span class="mode-tag">${escapeHTML(m)}</span>`).join('');
      $('detailExample').textContent=data.example||'Fill the placeholders, then copy the prompt into your AI tool.';
      $('templateEdit').value=data.template||'';rebuildVariables();refreshDetailFavorite();$('detailDialog').showModal();
    }catch(e){notify(`Unable to open: ${e.message}`);console.error(e)}
  }
  function refreshDetailFavorite(){const id=state.detail?.id;if(!id)return;const liked=state.fav.has(id);$('detailFav').textContent=liked?'♥ Saved':'♡ Save';$('detailFav').setAttribute('aria-pressed',String(liked))}
  function rebuildVariables(){
    const template=$('templateEdit').value;
    const matches=[...template.matchAll(/\[\[([A-Z][A-Z0-9_]*)\]\]/g)].map(m=>m[1]);
    const unique=[...new Set(matches)].slice(0,35);
    const old={};$('variableFields').querySelectorAll('input').forEach(e=>old[e.dataset.key]=e.value);
    $('variablesSection').hidden=unique.length===0;
    $('variableFields').innerHTML=unique.map(key=>`<label>${escapeHTML(key.replaceAll('_',' ').toLowerCase())}<input data-key="${escapeHTML(key)}" placeholder="Enter ${escapeHTML(key.toLowerCase().replaceAll('_',' '))}" value="${escapeHTML(old[key]||'')}"></label>`).join('');
    renderPreview();
  }
  function renderPreview(){const values={};$('variableFields').querySelectorAll('input').forEach(e=>{if(e.value.trim())values[e.dataset.key]=e.value.trim()});$('previewArea').value=$('templateEdit').value.replace(/\[\[([A-Z][A-Z0-9_]*)\]\]/g,(all,key)=>values[key]||all)}
  async function copy(text){try{await navigator.clipboard.writeText(text);notify('Copied to clipboard')}catch{const inp=document.createElement('textarea');inp.value=text;document.body.appendChild(inp);inp.select();document.execCommand('copy');inp.remove();notify('Copied to clipboard')}}
  const workflows=[
    {icon:'◈',label:'RESEARCH',title:'PDF to Verified Exam Notes',summary:'A grounded process from PDF extraction to teachable, exam-ready revision notes.',steps:['NotebookLM sources','Claims & gaps','ChatGPT notes','Human review'],prompt:'/research /teacher /verify\nGOAL: Turn the supplied course files into exam-focused notes for [[COURSE_CODE]].\nSTEP 1 — SOURCE EXTRACTION: In NotebookLM, outline each source with page references. Mark anything missing or illegible.\nSTEP 2 — TRACEABILITY: Build a table mapping each module/topic to source pages; do not invent coverage.\nSTEP 3 — TEACHING: In ChatGPT, create definitions, diagrams to draw, worked problems, short/long answers, and recall questions.\nSTEP 4 — VALIDATION: Recheck every factual assertion against the source, highlight uncertain claims, and conduct a practice quiz.\nOUTPUT: [[FORMAT]] with references to supplied sources.'},
    {icon:'✧',label:'IMAGE EDITING',title:'Identity-First Photo Composite',summary:'Use a real reference photo and target scene to specify a precise, natural edit.',steps:['Reference face','Target scene','Edit boundaries','Realism check'],prompt:'/professional /human /verify\nSOURCE_IDENTITY: [[SOURCE_IMAGE]]\nTARGET_SCENE: [[TARGET_IMAGE]]\nREQUEST: [[EDIT_REQUEST]]\nPreserve recognizable face, skin texture, and hairstyle from the source image. Preserve untouched people, background objects, and original framing from the target scene. Match pose, camera perspective, focal depth, lighting, shadows, and contact points. Correct anatomical artifacts and unintended changes. If the result is presented as documentary evidence, disclose that it is a composite.\nOUTPUT: A faithful photorealistic edited image if supported by the image tool, not merely a description.'},
    {icon:'⌘',label:'CODE',title:'Gemini × ChatGPT Code Review',summary:'Use independent model reviews and tests before applying code changes.',steps:['Describe issue','Generate patch','Independent review','Run tests'],prompt:'/debug /optimize /verify\nREPOSITORY: [[REPO_URL]]\nISSUE: [[BUG_OR_FEATURE]]\nCONSTRAINTS: [[CONSTRAINTS]]\n1. Identify reproducible acceptance criteria and current behavior.\n2. Ask Gemini for a minimal proposed fix with test cases.\n3. Ask ChatGPT to independently critique the proposed patch for correctness, security, regressions, and scope.\n4. Run automated tests in an isolated development branch, review diffs, and request human approval before merging.\n5. Return tested result and remaining uncertainties.'},
    {icon:'⚗',label:'RESEARCH',title:'Paper to Reproducible Experiment',summary:'Convert methodology into code, logging, evaluation, and documented limits.',steps:['Method extraction','Experiment spec','Reproduce','Audit metrics'],prompt:'/research /framework /analyst\nPAPER: [[SOURCE_PAPER]]\nDATASET: [[DATASET]]\nENVIRONMENT: [[ENVIRONMENT]]\nExtract inputs, preprocessing, architecture, training, evaluation, baselines, random seeds, and reported limitations, citing source sections. Produce a versioned experiment plan, reproducible code checklist, and independent metric verification protocol. If the paper omits a detail, flag it as unresolved rather than inventing it.'},
    {icon:'▣',label:'PRODUCT',title:'Idea to GitHub Release',summary:'Move an app idea through validation, build, test, and safe production release.',steps:['Define MVP','Branch & build','QA checklist','Approve release'],prompt:'/startup /dev /strategy\nPRODUCT: [[APP_IDEA]]\nUSERS: [[TARGET_USERS]]\nREPOSITORY: [[REPO]]\nDefine the smallest valuable MVP. Create a feature map, UX flow, code architecture, tests, security guardrails, documentation, release checklist, and rollback plan. Work in a feature branch, verify build outputs, and request approval before any production deployment. Report real evidence, not assumed success.'},
    {icon:'♧',label:'CREATOR',title:'Content Campaign Repurposer',summary:'Turn a single approved asset into coordinated cross-platform content.',steps:['Source asset','Hook variants','Platform edits','Performance review'],prompt:'/creative /copywriter /content\nSOURCE: [[ORIGINAL_CONTENT]]\nPLATFORMS: [[PLATFORMS]]\nAUDIENCE: [[AUDIENCE]]\nProduce platform-specific hooks, concise scripts, accessibility descriptions, captions, and CTAs. Avoid invented achievements and copyrighted text reproduction. Distinguish proposed posts from published posts. Include a measurement plan and human publishing approval.'},
    {icon:'↭',label:'AUTOMATION',title:'Weekly Prompt Batch Publisher',summary:'Generate, validate, and add fresh prompts without reusing IDs.',steps:['Find last ID','Generate batch','Similarity check','Publish'],prompt:'/automate /promptengineer /verify\nCURRENT_LAST_ID: [[LAST_USED_ID]]\nBATCH_SIZE: [[NUMBER_OF_PROMPTS]]\nCATEGORIES: [[CATEGORIES]]\nRead the current registry, compute the next sequential IDs, generate clear templates with purpose and examples, check exact and near-duplicate titles/templates, validate JSON schema, and produce an importable JSONL file. Do not claim publication until upload and integrity checks succeed.'},
    {icon:'◇',label:'BUSINESS',title:'Customer Insight to Roadmap',summary:'Transform feedback into evidence-ranked product priorities.',steps:['Gather feedback','Tag evidence','Prioritize','Plan experiments'],prompt:'/business /analyst /strategy\nPRODUCT: [[PRODUCT]]\nFEEDBACK: [[INTERVIEWS_OR_REVIEWS]]\nGOALS: [[BUSINESS_GOALS]]\nCluster observed needs, count supporting evidence, separate actual customer quotes from hypotheses, estimate effort and impact, and recommend a three-stage roadmap with measurable experiments.'}
  ];
  function renderWorkflows(){$('workflowGrid').innerHTML=workflows.map((w,i)=>`<article class="workflow-card"><span class="workflow-icon">${w.icon}</span><span class="kicker" style="display:inline-block;margin-left:12px">${escapeHTML(w.label)}</span><h3>${escapeHTML(w.title)}</h3><p>${escapeHTML(w.summary)}</p><div class="workflow-steps">${w.steps.map(s=>`<span>${escapeHTML(s)}</span>`).join('')}</div><button class="button button-quiet" data-workflow="${i}">Copy workflow ↗</button></article>`).join('')}
  function downloadFile(name,blob){const link=document.createElement('a');const url=URL.createObjectURL(blob);link.href=url;link.download=name;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1500)}
  function exportData(type){
    let data;if(type==='favorites'){
      data=[...state.fav].map(id=>state.custom.find(c=>c.id===id)||state.catalog.find(r=>r[0]===id)).filter(Boolean).map(r=>Array.isArray(r)?{id:r[0],title:r[1],category:state.meta?.categories[r[2]]?.name||'',modes:r[3]}:r)
    }else data=state.custom;
    downloadFile(`prompttantu-${type}-${new Date().toISOString().slice(0,10)}.json`,new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));notify(`${type} exported`)
  }
  async function importFile(file){
    if(!file)return;const message=$('importMessage');message.textContent='Reading file locally...';
    try{
      if(file.size>60*1024*1024)throw Error('Import limit: 60 MB. Import a category at a time.');
      const raw=await file.text();let records;
      if(file.name.toLowerCase().endsWith('.jsonl'))records=raw.split(/\r?\n/).filter(Boolean).map((line,i)=>{try{return JSON.parse(line)}catch{throw Error(`Invalid JSON on line ${i+1}`)}});
      else{const j=JSON.parse(raw);records=Array.isArray(j)?j:Array.isArray(j.prompts)?j.prompts:[j]}
      if(records.length>5500)throw Error('Import at most 5,500 prompts at a time.');
      const existing=new Set([...state.catalog.map(x=>x[0]),...state.custom.map(x=>x.id)]);
      let added=0,skipped=0;
      for(const r of records){
        if(!r||typeof r!=='object'||!String(r.title||'').trim()||typeof r.template!=='string'){skipped++;continue}
        let id=String(r.id||'').trim();if(!id)id='MY-'+Date.now().toString(36)+'-'+String(added+1).padStart(3,'0');
        if(existing.has(id)){skipped++;continue}
        existing.add(id);state.custom.push({id,title:String(r.title).slice(0,200),modes:String(r.modes||'/personal').slice(0,250),purpose:String(r.purpose||'').slice(0,1000),template:r.template.slice(0,30000),example:String(r.example||'').slice(0,1000)});added++;
      }
      save(keys.custom,state.custom);updateCounters();renderCustom();message.textContent=`Imported ${fmt(added)} prompts. Skipped ${fmt(skipped)} duplicates or invalid rows.`;notify(message.textContent)
    }catch(e){message.textContent=`Import failed: ${e.message}`}
  }
  function closeMenu(){$('sidebar').classList.remove('open');$('mobileBackdrop').hidden=true}
  function bind(){
    document.querySelectorAll('.nav-button').forEach(e=>e.addEventListener('click',()=>switchView(e.dataset.view)));
    $('categoryNav').addEventListener('click',e=>{const btn=e.target.closest('[data-category]');if(btn)setCategory(btn.dataset.category)});
    $('searchInput').addEventListener('input',e=>{state.query=e.target.value;clearTimeout(state.searchTimer);state.searchTimer=setTimeout(applyFilters,160)});
    $('categorySelect').addEventListener('change',e=>setCategory(e.target.value));$('modeSelect').addEventListener('change',e=>{state.mode=e.target.value;applyFilters()});$('sortSelect').addEventListener('change',e=>{state.sort=e.target.value;applyFilters()});
    $('resetFilters').addEventListener('click',()=>{state.category='all';state.mode='all';state.query='';state.sort='asc';$('searchInput').value='';$('categorySelect').value='all';$('modeSelect').value='all';$('sortSelect').value='asc';document.querySelectorAll('.category-item').forEach(e=>e.classList.remove('active'));applyFilters()});
    $('browseButton').addEventListener('click',()=>{switchView('library');$('searchInput').focus();$('libraryView').scrollIntoView({behavior:'smooth'})});
    $('workflowButton').addEventListener('click',()=>{switchView('workflows');$('workflowsView').scrollIntoView({behavior:'smooth'})});
    $('randomButton').addEventListener('click',()=>{if(state.catalog.length)openPrompt(state.catalog[Math.floor(Math.random()*state.catalog.length)][0])});
    document.body.addEventListener('click',e=>{
      const fav=e.target.closest('[data-fav]');if(fav){e.stopPropagation();toggleFavorite(fav.dataset.fav);return}
      const card=e.target.closest('[data-open]');if(card){openPrompt(card.dataset.open);return}
      const pager=e.target.closest('[data-page]');if(pager){const direction=pager.dataset.page==='next'?1:-1;state.page=Math.min(Math.ceil(state.filtered.length/state.pageSize)-1,Math.max(0,state.page+direction));renderLibrary();$('resultsTitle').scrollIntoView({behavior:'smooth',block:'start'});return}
      const wf=e.target.closest('[data-workflow]');if(wf)copy(workflows[Number(wf.dataset.workflow)].prompt);
    });
    document.body.addEventListener('keydown',e=>{const card=e.target.closest('[data-open]');if(card&&(e.key==='Enter'||e.key===' ')){e.preventDefault();openPrompt(card.dataset.open)}});
    document.addEventListener('keydown',e=>{if(e.key==='/'&&!(e.target instanceof HTMLInputElement)&&!(e.target instanceof HTMLTextAreaElement)&&!$('detailDialog').open){e.preventDefault();switchView('library');$('searchInput').focus()}});
    $('detailFav').addEventListener('click',()=>{if(state.detail)toggleFavorite(state.detail.id)});
    $('templateEdit').addEventListener('input',rebuildVariables);$('restoreTemplate').addEventListener('click',()=>{if(state.detail){$('templateEdit').value=state.detail.template;rebuildVariables()}});
    $('variableFields').addEventListener('input',renderPreview);$('copyTemplate').addEventListener('click',()=>copy($('templateEdit').value));$('copyReady').addEventListener('click',()=>copy($('previewArea').value));
    $('exportFavoritesButton').addEventListener('click',()=>exportData('favorites'));$('exportCustomButton').addEventListener('click',()=>exportData('custom'));
    $('importButton').addEventListener('click',()=>{$('importMessage').textContent='';$('importDialog').showModal()});$('importFile').addEventListener('change',e=>importFile(e.target.files[0]));
    $('newPromptForm').addEventListener('submit',e=>{e.preventDefault();const data={id:'MY-'+Date.now().toString(36),title:$('customTitle').value.trim(),modes:$('customModes').value.trim()||'/personal',template:$('customTemplate').value.trim(),purpose:$('customPurpose').value.trim(),example:''};if(!data.title||!data.template)return;state.custom.push(data);save(keys.custom,state.custom);updateCounters();renderCustom();$('newPromptForm').reset();notify('Your prompt was saved locally')});
    $('menuButton').addEventListener('click',()=>{$('sidebar').classList.add('open');$('mobileBackdrop').hidden=false});$('mobileBackdrop').addEventListener('click',closeMenu);
    const currentTheme=localStorage.getItem(keys.theme);if(currentTheme==='light')document.documentElement.classList.add('light');
    $('themeButton').addEventListener('click',()=>{document.documentElement.classList.toggle('light');localStorage.setItem(keys.theme,document.documentElement.classList.contains('light')?'light':'dark')});
    $('detailDialog').addEventListener('click',e=>{if(e.target===$('detailDialog'))$('detailDialog').close()});$('importDialog').addEventListener('click',e=>{if(e.target===$('importDialog'))$('importDialog').close()});
    updateCounters();renderWorkflows();renderCustom();
  }
  bind();bootstrap();
  if('serviceWorker' in navigator && location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js').catch(()=>{});
})();
