import {groups,initialData,validateData,starterWorkspace,validateWorkspace,upgradeWorkspace,projectAtlas,structures,bridgeConnections,resolveEndpoint} from './data.js?v=20261027-03';
import {UniverseMap} from './map.js?v=20261027-03';
const $=id=>document.getElementById(id),film=document.documentElement.dataset.film==='true',storageKey='project-atlas-workspace-v2';
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let workspace=starterWorkspace(),activeId=null,data=structuredClone(initialData),selected=null,editing=null,editingBridge=null,timeline=null,travel=null,scopeId=null,expandedNodes=new Set(),draftParentId=null;
let startupMessage='';
if(!film)try{const raw=localStorage.getItem(storageKey);if(raw)workspace=upgradeWorkspace(JSON.parse(raw));}catch{startupMessage='Saved workspace could not be read. Starter projects are shown.'}
const map=new UniverseMap({host:$('scene-host'),labels:$('map-labels'),status:$('status'),reduced,film,onModeChange:state=>updateGraphics(state),onProject:id=>openProject(id),onNode:id=>select(id),onDive:id=>dive(id),onBridge:(id,p)=>followBridge(id,p),onGroup:group=>{if(!activeId)return;$('search').value='';$('filter').value=group;scopeId=null;updateScopeControls();overview(false);}});
const project=id=>workspace.projects.find(p=>p.id===id),node=id=>data.nodes.find(n=>n.id===id);
const BUILD_ID='20261027-03';
const childrenOf=id=>data.nodes.filter(n=>n.parentId===id);
const ancestorsOf=id=>{const result=[];const visited=new Set();let n=node(id);while(n?.parentId&&!visited.has(n.parentId)){visited.add(n.parentId);n=node(n.parentId);if(n)result.unshift(n);}return result};
const isDescendant=(id,ancestor)=>id===ancestor||ancestorsOf(id).some(n=>n.id===ancestor);
function defaultExpanded(){expandedNodes=new Set(data.nodes.filter(n=>!n.parentId&&childrenOf(n.id).length).map(n=>n.id));}
function updateScopeControls(){
  const trail=scopeId?[...ancestorsOf(scopeId),node(scopeId)].filter(Boolean):[];
  $('up-level').hidden=!scopeId;$('scope-path').hidden=!activeId;
  $('scope-path').replaceChildren();
  $('scope-path').append(button('⌂ '+(project(activeId)?.title||'Project'),()=>setScope(null),'scope-crumb'));
  for(const n of trail){$('scope-path').append(document.createTextNode(' / '));$('scope-path').append(button(n.title,()=>setScope(n.id),'scope-crumb'));}
}
function setScope(id){if(!activeId)return;stopTour();scopeId=id&&node(id)?id:null;
  if(scopeId){for(const n of [...ancestorsOf(scopeId),node(scopeId)])expandedNodes.add(n.id);}
  updateScopeControls();map.setView(workspace,activeId,scopeId);renderList();
  if(scopeId){const visible=visibleNodes();map.setSelection(selected&&visible.some(n=>n.id===selected)?selected:null,visible.map(n=>n.id));map.recenter();}
  else if(selected)map.focusNode(selected);else map.recenter();
}
function dive(id){const n=node(id);if(!n||!childrenOf(id).length)return;select(id,false);setScope(id);}
function renderHierarchyDetail(){
  const n=selected&&node(selected);$('hierarchy-detail').hidden=!n;if(!n)return;
  const crumbs=[...ancestorsOf(n.id),n];$('topic-path').replaceChildren();
  $('topic-path').append(button('⌂ '+groups[n.group].label,()=>setScope(null),'crumb'));
  for(const part of crumbs){$('topic-path').append(document.createTextNode(' / '));$('topic-path').append(button(part.title,()=>select(part.id),'crumb'));}
  $('children-list').replaceChildren();const children=childrenOf(n.id);
  for(const child of children){const b=button((child.kind==='task'?'☑ ':'◈ ')+child.title,()=>select(child.id),'child-link');$('children-list').append(b);}
  if(!children.length){const empty=document.createElement('p');empty.className='micro';empty.textContent='No subtopics yet. Add a task or nested idea here.';$('children-list').append(empty);}
  $('dive').hidden=!children.length;
}

function updateGestureHelp(){const mode=map.mode;if(mode==='3d')$('gesture-help').textContent='Drag empty space to orbit · Scroll to zoom · Select a portal to travel';else if(mode==='2d')$('gesture-help').textContent='2D mode · Select an entry or portal; orbit and zoom are unavailable';else $('gesture-help').textContent='Select a universe or entry · 3D is loading';}
function updateGraphics(state={mode:map.mode,error:map.graphicsError}){updateGestureHelp();$('graphics-mode').textContent=state.mode==='3d'?'3D active · WebGL renderer and orbit controls loaded':state.mode==='2d'?'2D fallback · 3D could not start':'Loading graphics';$('graphics-error').textContent=state.error||'No initialization error reported.';}
$('graphics-info').onclick=()=>{updateGraphics();$('graphics-build').textContent=BUILD_ID;$('graphics-dialog').showModal()};$('close-graphics').onclick=()=>$('graphics-dialog').close();
function button(text,fn,className=''){const b=document.createElement('button');b.type='button';b.textContent=text;b.className=className;b.onclick=fn;return b;}
const statusSlug=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-');
function badge(status){const el=document.createElement('span');el.className='status-tag'+(status==='confirmed'?' confirmed':'');el.textContent=status==='confirmed'?'Confirmed':'Proposed';return el;}
function persist(){if(film)return;try{localStorage.setItem(storageKey,JSON.stringify(workspace));$('save-status').textContent='Saved in this browser · Export keeps a portable backup.'}catch{$('save-status').textContent='Browser storage unavailable or full. Export your workspace to keep these changes.'}}
function save(){if(activeId)project(activeId).atlas=data;persist();}
function entrance(){if(reduced||film||!$('motion').checked)return;document.getElementById('map-stage').animate([{opacity:.45,transform:'translateY(8px) scale(.99)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:640,easing:'cubic-bezier(.2,.8,.2,1)'});}
function updateHeading(hub){$('workspace-kicker').textContent=hub?'RESEARCH / WORK / CONNECTIONS':'UNIVERSE / '+project(activeId).title.toUpperCase();$('workspace-title').textContent=hub?'Ideas have gravity.':project(activeId).title;$('workspace-subtitle').textContent=hub?'Explore your projects and the bridges between them.':project(activeId).subtitle;$('workspace-count').textContent=hub?workspace.projects.length:bridgeConnections(workspace,activeId).length;$('workspace-count-label').textContent=hub?'project universes':'bridges to other universes';}
function renderTravel(){if(!travel){$('travel-banner').hidden=true;return}$('travel-banner').hidden=false;const source=resolveEndpoint(workspace,travel.source),target=resolveEndpoint(workspace,travel.target);$('travel-text').textContent=source.project.title+' / '+source.entry.title+' → '+travel.label+' → '+target.project.title+' / '+target.entry.title;}
function showProjects(){stopTour();map.stopTween();activeId=null;selected=null;scopeId=null;expandedNodes=new Set();travel=null;renderTravel();document.body.classList.remove('expanded','library-hidden');$('app-shell').classList.add('hub-mode');$('library').hidden=true;$('detail').hidden=true;$('hub-bottom').hidden=false;$('tour').hidden=true;$('show-library').hidden=true;$('map-kicker').textContent='THE BIG PICTURE';$('branch-caption').textContent='Select a universe to enter · dashed lines are proposed bridges';updateGestureHelp();updateHeading(true);renderHub();map.setView(workspace);entrance();}
function renderHub(){
  $('project-grid').replaceChildren();
  for(const p of workspace.projects){const b=button('',()=>openProject(p.id),'project-card'),tag=document.createElement('span'),title=document.createElement('h2'),description=document.createElement('p'),orb=document.createElement('span'),count=document.createElement('small');
    b.style.setProperty('--universe-color',p.color||'#7566e6');tag.className='card-tag';tag.textContent='PROJECT UNIVERSE';title.textContent=p.title;description.textContent=p.subtitle;orb.className='card-orb';orb.setAttribute('aria-hidden','true');count.textContent=p.atlas.nodes.length+' entries / '+bridgeConnections(workspace,p.id).length+' bridges · Enter ↗';b.append(tag,title,description,orb,count);$('project-grid').append(b);
  }
  $('bridge-list').replaceChildren();for(const l of workspace.bridges)$('bridge-list').append(bridgeCard(l,null,true));
  if(!workspace.bridges.length)$('bridge-list').textContent='No bridges yet. Connect two universes to see their relationship here and on the map.';
}
function openProject(id,entryId=null,{fromBridge=false}={}){
  if(!project(id))return;stopTour();map.stopTween();if(!fromBridge){travel=null;renderTravel()}activeId=id;data=project(id).atlas;selected=null;scopeId=null;defaultExpanded();updateScopeControls();
  document.body.classList.remove('expanded','library-hidden');$('app-shell').classList.remove('hub-mode');$('library').hidden=false;$('detail').hidden=false;$('hub-bottom').hidden=true;$('tour').hidden=false;$('show-library').hidden=true;
  for(const [key,g]of Object.entries(groups))g.label=data.groupLabels?.[key]||structures.research[key];
  $('ip11-spotlight').hidden=id!=='ip11';$('ip11-shortcuts').hidden=id!=='ip11';
  $('project-name').textContent=project(id).title;$('project-subtitle').textContent=project(id).subtitle;$('search').value='';$('filter').value='all';
  for(const option of $('filter').options)if(Object.hasOwn(groups,option.value))option.textContent=groups[option.value].label;
  for(const option of $('paper-form').elements.group.options)option.textContent=groups[option.value].label;
  $('map-kicker').textContent='INSIDE THE UNIVERSE';$('branch-caption').textContent=Object.values(groups).map(g=>g.label).join(' / ');updateGestureHelp();updateHeading(false);map.setView(workspace,id);overview(false);map.recenter(false);createTour();if(entryId)select(entryId);entrance();
}
function connections(id){return data.edges.filter(e=>e.source===id||e.target===id);}
function visibleNodes(){
  const q=$('search').value.toLowerCase().trim(),group=$('filter').value;
  const matched=new Set(q?data.nodes.filter(n=>`${n.title} ${n.description} ${n.citation||''}`.toLowerCase().includes(q)).map(n=>n.id):[]);
  const keep=new Set(matched);for(const id of matched)for(const a of ancestorsOf(id))keep.add(a.id);
  const inScope=n=>!scopeId||isDescendant(n.id,scopeId);
  return data.nodes.filter(n=>inScope(n)&&(group==='all'||group===n.group)&&
    (q?keep.has(n.id):ancestorsOf(n.id).every(a=>scopeId===a.id||expandedNodes.has(a.id))));
}
function renderList(){
  const visible=visibleNodes(),shown=new Set(visible.map(n=>n.id));$('node-list').replaceChildren();
  for(const [key,g]of Object.entries(groups)){
    const byGroup=visible.filter(n=>n.group===key);if(!byGroup.length)continue;
    const heading=document.createElement('div');heading.className='group-name';heading.textContent=g.label;$('node-list').append(heading);
    const renderNode=(n,depth=0)=>{
      if(!shown.has(n.id))return;
      const row=document.createElement('div');row.className='topic-row';row.style.setProperty('--tree-depth',Math.min(6,depth));
      const kids=childrenOf(n.id),exp=expandedNodes.has(n.id),toggle=button(kids.length?(exp?'▾':'▸'):'·',()=>{
        if(!kids.length)return;exp?expandedNodes.delete(n.id):expandedNodes.add(n.id);renderList();
      },'tree-toggle');toggle.disabled=!kids.length;toggle.setAttribute('aria-label',(exp?'Collapse ':'Expand ')+n.title);
      const b=button('',()=>select(n.id),'topic'+(selected===n.id?' active':''));b.style.setProperty('--node-color',g.color);b.setAttribute('aria-pressed',String(selected===n.id));
      const title=document.createElement('span');title.className='topic-name';title.textContent=n.title;
      if(n.kind==='paper'&&n.citation){const small=document.createElement('small');small.textContent=n.citation;title.append(small);}
      b.append(title);
      if(n.state){const chip=document.createElement('small');chip.className='tree-state state-'+statusSlug(n.state);chip.textContent=n.state;b.append(chip);}
      if(kids.length){const small=document.createElement('small');small.className='child-count';small.textContent=kids.length+' ↳';b.append(small);}
      row.append(toggle,b);$('node-list').append(row);
      for(const child of kids)renderNode(child,depth+1);
    };
    const roots=byGroup.filter(n=>!n.parentId||!shown.has(n.parentId));
    for(const n of roots)renderNode(n,0);
  }
  if(!visible.length)$('node-list').textContent='No matching entries.';
  map.setSelection(selected,visible.map(n=>n.id));
}
function select(id,fly=true){const n=node(id);if(!n)return;stopTour();selected=id;for(const a of ancestorsOf(id))expandedNodes.add(a.id);$('category').textContent=groups[n.group].label.toUpperCase();$('title').textContent=n.title;$('description').textContent=n.description;$('entry-meta').replaceChildren();$('entry-meta').hidden=!n.state;
  if(n.state){const state=document.createElement('span');state.className='entry-state state-'+statusSlug(n.state);state.textContent='● '+n.state;$('entry-meta').append(state);}
  const kind=document.createElement('span');kind.className='entry-kind';kind.textContent=n.kind==='task'?'☐ Task':n.kind==='paper'?'▣ Literature':n.kind==='decision'?'◆ Decision':'◇ Topic';$('entry-meta').append(kind);$('entry-meta').hidden=false;
  $('reference').replaceChildren();if(n.citation){const p=document.createElement('p');p.textContent=n.citation;$('reference').append(p)}if(n.url){const a=document.createElement('a');a.href=n.url;a.target='_blank';a.rel='noopener noreferrer';a.textContent='Open source ↗';$('reference').append(a)}$('notes').disabled=false;$('notes').value=data.notes[id]||'';$('edit').hidden=false;$('delete-entry').hidden=false;$('local-links').hidden=false;$('related').replaceChildren();for(const e of connections(id)){const other=node(e.source===id?e.target:e.source),b=button(other.title,()=>select(other.id),'related'),small=document.createElement('small');small.textContent=(e.source===id?'→ ':'← ')+e.label;b.append(small);$('related').append(b)}if(!connections(id).length)$('related').textContent='No internal connections yet.';renderCrossLinks();renderHierarchyDetail();renderList();if(fly)map.focusNode(id);}
function overview(recenter=true){if(scopeId){scopeId=null;updateScopeControls();map.setView(workspace,activeId);}if(!activeId){map.recenter();return}stopTour();selected=null;$('category').textContent='PROJECT OVERVIEW';$('title').textContent='Follow a connection.';$('description').textContent='Select an entry to explore its ideas, notes, and links. Lime portals lead to entries in another universe.';$('reference').replaceChildren();$('entry-meta').hidden=true;if(data.source){const p=document.createElement('p');p.textContent='Source: '+data.source.title+' · '+data.source.meetingDate+'. Project details remain subject to partner agreement.';$('reference').append(p)}$('local-links').hidden=true;$('notes').disabled=true;$('notes').value='';$('edit').hidden=true;$('delete-entry').hidden=true;$('hierarchy-detail').hidden=true;renderList();renderCrossLinks();if(recenter)map.recenter();}
function bridgeCard(link,fromProject=null,hub=false){
  const source=resolveEndpoint(workspace,link.source),target=resolveEndpoint(workspace,link.target),card=document.createElement('div');card.className='cross-card';
  card.append(badge(link.status));const title=document.createElement('strong');title.textContent=link.label;const relation=document.createElement('p');relation.append(title);card.append(relation);
  const route=document.createElement('p');route.className='route';route.textContent=source.project.title+' / '+source.entry.title+' → '+target.project.title+' / '+target.entry.title;card.append(route);
  const actions=document.createElement('div');actions.className='card-actions';
  if(hub)actions.append(button('View source',()=>openProject(link.source.projectId,link.source.nodeId)));
  const remote=fromProject===link.target.projectId?source:target;actions.append(button(hub?'Follow →':'Open '+remote.project.title+' ↗',()=>followBridge(link.id,fromProject||link.source.projectId)));
  actions.append(button('Edit',()=>bridgeDialog(link.id)));card.append(actions);return card;
}
function renderCrossLinks(){const links=bridgeConnections(workspace,activeId,selected);$('cross-related').replaceChildren();for(const l of links)$('cross-related').append(bridgeCard(l,activeId));if(!links.length){const p=document.createElement('p');p.className='micro';p.textContent=selected?'This entry has no bridge yet. Use + to connect it to another universe.':'This project has no cross-project connections yet.';$('cross-related').append(p)}}
function followBridge(id,fromProject=activeId){const link=workspace.bridges.find(l=>l.id===id);if(!link)return;const outgoing=fromProject!==link.target.projectId,source=outgoing?link.source:link.target,target=outgoing?link.target:link.source;travel={source,target,label:outgoing?link.label:'reverse of “'+link.label+'”'};openProject(target.projectId,target.nodeId,{fromBridge:true});renderTravel();}
$('travel-back').onclick=()=>{if(!travel)return;const source=travel.source;travel=null;renderTravel();openProject(source.projectId,source.nodeId)};
function option(value,text){const o=document.createElement('option');o.value=value;o.textContent=text;return o;}
function populateEntries(projectSelect,entrySelect,selectedId=null){const p=project($(projectSelect).value);$(entrySelect).replaceChildren();for(const n of p?.atlas.nodes||[])$(entrySelect).append(option(n.id,n.title));if(selectedId&&p.atlas.nodes.some(n=>n.id===selectedId))$(entrySelect).value=selectedId;}
function syncBridgeTargets(preferred=null){const sourceId=$('source-project').value;$('target-project').replaceChildren();for(const p of workspace.projects)if(p.id!==sourceId)$('target-project').append(option(p.id,p.title));if(preferred&&preferred!==sourceId&&project(preferred))$('target-project').value=preferred;populateEntries('target-project','target-entry');}
function bridgeDialog(id=null){editingBridge=id;const form=$('bridge-form');form.reset();$('bridge-error').textContent='';$('bridge-form-title').textContent=id?'Edit bridge':'Connect universes';$('delete-bridge').hidden=!id;$('source-project').replaceChildren();for(const p of workspace.projects)$('source-project').append(option(p.id,p.title));const l=id?workspace.bridges.find(l=>l.id===id):null;if(l){$('source-project').value=l.source.projectId;populateEntries('source-project','source-entry',l.source.nodeId);syncBridgeTargets(l.target.projectId);$('target-entry').value=l.target.nodeId;form.elements.label.value=l.label;form.elements.status.value=l.status;}else{if(activeId)$('source-project').value=activeId;populateEntries('source-project','source-entry',selected);syncBridgeTargets()}
  if(workspace.projects.length<2)$('bridge-error').textContent='Create another universe before connecting projects.';$('bridge-dialog').showModal();
}
$('source-project').onchange=()=>{populateEntries('source-project','source-entry');syncBridgeTargets($('target-project').value)};$('target-project').onchange=()=>populateEntries('target-project','target-entry');
$('bridge-form').onsubmit=e=>{e.preventDefault();try{const f=new FormData(e.target),l={id:editingBridge||'bridge-'+crypto.randomUUID(),source:{projectId:f.get('sourceProject'),nodeId:f.get('sourceEntry')},target:{projectId:f.get('targetProject'),nodeId:f.get('targetEntry')},label:f.get('label').trim(),status:f.get('status')},next=structuredClone(workspace);if(editingBridge)next.bridges[next.bridges.findIndex(l=>l.id===editingBridge)]=l;else next.bridges.push(l);workspace=validateWorkspace(next);refreshAfterChange();$('bridge-dialog').close()}catch(error){$('bridge-error').textContent=error.message}};
$('delete-bridge').onclick=()=>{if(!editingBridge||!confirm('Delete this bridge? The entries and their notes will remain.'))return;workspace.bridges=workspace.bridges.filter(l=>l.id!==editingBridge);refreshAfterChange();$('bridge-dialog').close()};
function refreshAfterChange(){persist();if(activeId){data=project(activeId).atlas;map.setView(workspace,activeId,scopeId);if(selected)select(selected,false);else overview(false);updateHeading(false)}else{renderHub();map.setView(workspace);updateHeading(true)}}
function populateParents(form,chosen=''){
  const group=form.elements.group.value,id=editing;
  const parentSelect=form.elements.parentId;parentSelect.replaceChildren(option('','Top level in this branch'));
  for(const n of data.nodes){if(n.group!==group||n.id===id||(id&&isDescendant(n.id,id)))continue;
    const depth=ancestorsOf(n.id).length;parentSelect.append(option(n.id,'  '.repeat(Math.min(depth,5))+'↳ '+n.title));
  }
  parentSelect.value=Array.from(parentSelect.options).some(o=>o.value===chosen)?chosen:'';
}
function entryDialog(id=null,parentId=null){
  editing=id;draftParentId=parentId;const form=$('paper-form');form.reset();$('form-error').textContent='';
  $('form-title').textContent=id?'Edit entry':parentId?'Add child entry':'Add an entry';
  const n=id?node(id):null;
  if(n)for(const key of ['title','citation','url','description','kind','group','state'])form.elements[key].value=n[key]||(key==='kind'?'topic':key==='group'?'literature':'');
  else if(parentId&&node(parentId))form.elements.group.value=node(parentId).group;
  populateParents(form,n?.parentId||parentId||'');
  form.elements.group.onchange=()=>populateParents(form,form.elements.parentId.value);
  const linked=id?connections(id).map(e=>e.source===id?e.target:e.source):[];
  $('topic-checkboxes').replaceChildren();for(const entry of data.nodes.filter(n=>n.id!==id)){
    const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.name='connections';input.value=entry.id;input.checked=linked.includes(entry.id);label.append(input,document.createTextNode(entry.title));$('topic-checkboxes').append(label);
  }
  $('paper-dialog').showModal();
}
$('paper-form').onsubmit=e=>{e.preventDefault();try{
  const f=new FormData(e.target),id=editing||'entry-'+crypto.randomUUID(),parentId=f.get('parentId')||undefined;
  const n={id,kind:f.get('kind'),group:f.get('group'),title:f.get('title').trim(),citation:f.get('citation').trim(),url:f.get('url').trim(),state:f.get('state')||'',description:f.get('description').trim()};
  if(parentId)n.parentId=parentId;
  const next=structuredClone(data);
  if(editing){
    const oldGroup=node(id).group;next.nodes[next.nodes.findIndex(n=>n.id===id)]=n;
    if(oldGroup!==n.group)for(const child of next.nodes){if(child.id!==id&&isDescendant(child.id,id))child.group=n.group;}
  }else next.nodes.push(n);
  next.edges=next.edges.filter(e=>e.source!==id&&e.target!==id);
  for(const target of f.getAll('connections')){const previous=data.edges.find(e=>(e.source===id&&e.target===target)||(e.target===id&&e.source===target));next.edges.push(previous||{source:id,target,label:n.kind==='paper'?'provides evidence for':'connects to'});}
  data=validateData(next);save();if(parentId)expandedNodes.add(parentId);
  map.setView(workspace,activeId,scopeId);$('paper-dialog').close();select(id);updateHeading(false);
}catch(error){$('form-error').textContent=error.message}};
$('delete-entry').onclick=()=>{if(!selected)return;const links=bridgeConnections(workspace,activeId,selected);if(!confirm('Delete “'+node(selected).title+'” and its notes? '+links.length+' cross-project bridge(s) and its internal connections will also be removed. Direct children will move up one level.'))return;const id=selected,parentId=node(id)?.parentId;for(const child of childrenOf(id)){if(parentId)child.parentId=parentId;else delete child.parentId;}data.nodes=data.nodes.filter(n=>n.id!==id);data.edges=data.edges.filter(e=>e.source!==id&&e.target!==id);delete data.notes[id];workspace.bridges=workspace.bridges.filter(l=>!((l.source.projectId===activeId&&l.source.nodeId===id)||(l.target.projectId===activeId&&l.target.nodeId===id)));selected=null;save();if(scopeId===id)scopeId=parentId||null;updateScopeControls();map.setView(workspace,activeId,scopeId);overview(false);updateHeading(false)};
$('project-form').onsubmit=e=>{e.preventDefault();try{const f=new FormData(e.target),p={id:'project-'+crypto.randomUUID(),title:f.get('name').trim(),subtitle:f.get('subtitle').trim(),color:f.get('color'),atlas:projectAtlas(f.get('template'))},next=structuredClone(workspace);next.projects.push(p);workspace=validateWorkspace(next);persist();$('project-dialog').close();e.target.reset();openProject(p.id)}catch(error){$('project-error').textContent=error.message}};
function download(){const url=URL.createObjectURL(new Blob([JSON.stringify(workspace,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='project-mind-map-workspace.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
$('import').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>10000000)throw Error('Please import a JSON file smaller than 10 MB.');const raw=JSON.parse(await file.text());if(raw.version===1){if(!activeId)throw Error('Open a project before importing a single-project atlas.');const incoming=validateData(raw);if(!confirm('Replace this project with the imported atlas? Bridges pointing to entries that no longer exist will be removed.'))return;const ids=new Set(incoming.nodes.map(n=>n.id)),next=structuredClone(workspace);next.projects.find(p=>p.id===activeId).atlas=incoming;next.bridges=next.bridges.filter(l=>(l.source.projectId!==activeId||ids.has(l.source.nodeId))&&(l.target.projectId!==activeId||ids.has(l.target.nodeId)));workspace=validateWorkspace(next);persist();openProject(activeId)}else{const incoming=upgradeWorkspace(raw);if(!confirm('Replace all projects, notes, and bridges with this workspace? Export first if you need a backup.'))return;stopTour();workspace=incoming;persist();showProjects()}$('status').textContent='Workspace imported.'}catch(error){alert(error.message)}finally{e.target.value=''}};
function stopTour(){timeline?.pause();$('tour-caption').hidden=true;$('tour').textContent='▶ Guided tour';if(map.controls)map.controls.enabled=!film;}
function createTour(){if(!window.gsap||!activeId)return;const titles=Object.values(groups).map(g=>g.label),p=project(activeId),shots=[{title:titles[0],copy:'Explore the context, literature, and ideas behind this project.',x:-8,y:3,z:21,tx:-5,ty:0,tz:0},{title:titles[1],copy:'Follow the work packages, design choices, and implementation.',x:0,y:3,z:21,tx:0,ty:0,tz:0},{title:titles[2],copy:'Connect outcomes, evidence, milestones, and the next steps.',x:8,y:3,z:21,tx:5,ty:0,tz:0},{title:'A universe with connections',copy:p.title+' connects to '+bridgeConnections(workspace,activeId).length+' cross-project bridges. Follow a portal to explore another project.',x:0,y:2,z:map.cameraState().z,tx:0,ty:0,tz:0}];
  if(activeId==='thesis'){shots[0].copy='Olfaction, scent-delivery technologies, scent in VR, and evaluation methods.';shots[1].copy='A single-channel wearable prototype, VR triggers, and a cleanable outlet.';shots[2].copy='Technical characterization and a user study shaped by the research question.';}
  const state=map.cameraState();timeline?.kill();timeline=gsap.timeline({paused:true,onUpdate(){map.applyCamera(state);const i=Math.min(3,Math.floor(timeline.time()/6));$('tour-kicker').textContent=(i+1)+' / 4 · PROJECT STORY';$('tour-title').textContent=shots[i].title;$('tour-copy').textContent=shots[i].copy;},onComplete(){if(!film){if(map.controls)map.controls.target.set(state.tx,state.ty,state.tz);stopTour()}}});shots.forEach((s,i)=>{const {title,copy,...target}=s;timeline.to(state,{...target,duration:2.5,ease:'power2.inOut'},i*6).to(state,{duration:3.5},i*6+2.5)});window.__timelines=window.__timelines||{};window.__timelines['thesis-tour']=timeline;if(film){$('tour-caption').hidden=false;timeline.seek(0);map.resetMotion();}}
$('tour').onclick=()=>{if(!timeline){$('status').textContent='Tour animation unavailable; entry exploration still works.';return}if(timeline.isActive()){stopTour();return}map.stopTween();if(map.controls)map.controls.enabled=false;$('tour-caption').hidden=false;$('tour').textContent='■ Stop tour';timeline.restart();};
$('motion').checked=!reduced;$('motion').disabled=reduced;$('motion').onchange=()=>{document.body.classList.toggle('motion-off',!$('motion').checked);map.setMotion($('motion').checked)};
$('expand').onclick=()=>{const expanded=document.body.classList.toggle('expanded');$('expand').setAttribute('aria-label',expanded?'Restore layout':'Expand map');setTimeout(()=>map.resize(),0)};
$('close-library').onclick=()=>{document.body.classList.add('library-hidden');$('show-library').hidden=false;setTimeout(()=>map.resize(),0)};$('show-library').onclick=()=>{document.body.classList.remove('library-hidden');$('show-library').hidden=true;setTimeout(()=>map.resize(),0)};
$('projects').onclick=showProjects;$('brand').onclick=e=>{e.preventDefault();showProjects()};$('home').onclick=()=>overview();$('up-level').onclick=()=>setScope(scopeId?node(scopeId)?.parentId||null:null);$('dive').onclick=()=>{if(selected)dive(selected)};$('add-child').onclick=()=>{if(selected)entryDialog(null,selected)};
// A simple exploration affordance: find a new place without searching menus.
$('wander').onclick=()=>{
  if(!activeId){
    if(!workspace.projects.length)return;
    const destinations=workspace.projects;
    openProject(destinations[Math.floor(Math.random()*destinations.length)].id);
    return;
  }
  const candidates=data.nodes.filter(n=>n.id!==selected);
  if(!candidates.length)return;
  $('search').value='';$('filter').value='all';
  select(candidates[Math.floor(Math.random()*candidates.length)].id);
};
// Keyboard navigation remains secondary to the accessible buttons.
document.addEventListener('keydown',event=>{
  if(event.target.closest?.('input,textarea,select,[contenteditable="true"]')||document.querySelector('dialog[open]'))return;
  if(event.key.toLowerCase()==='f'&&!event.altKey&&!event.ctrlKey&&!event.metaKey){
    event.preventDefault();$('expand').click();
  }
});
$('jump-session').onclick=()=>{select('session4');setScope('session4');};
for(const b of document.querySelectorAll('[data-jump]'))b.onclick=()=>{const id=b.dataset.jump;if(node(id)){select(id,false);setScope(id);}};
$('expand-tree').onclick=()=>{expandedNodes=new Set(data.nodes.filter(n=>childrenOf(n.id).length).map(n=>n.id));renderList();};
$('collapse-tree').onclick=()=>{expandedNodes.clear();renderList();};
$('export').onclick=download;$('search').oninput=renderList;$('filter').onchange=renderList;$('notes').oninput=()=>{if(selected){data.notes[selected]=$('notes').value;save()}};
$('new-project').onclick=()=>{$('project-error').textContent='';$('project-dialog').showModal()};$('close-project').onclick=()=>$('project-dialog').close();$('add').onclick=()=>entryDialog();$('edit').onclick=()=>entryDialog(selected);$('close-dialog').onclick=()=>$('paper-dialog').close();$('add-bridge').onclick=()=>bridgeDialog();$('hub-add-bridge').onclick=()=>bridgeDialog();$('close-bridge').onclick=()=>$('bridge-dialog').close();
if(film){document.body.classList.add('film');openProject('thesis');map.setMotion(false)}else showProjects();
map.init().then(()=>{if(activeId){createTour();if(selected)map.focusNode(selected)}if(film){map.setMotion(false);if(map.controls)map.controls.enabled=false}window.atlasReady=true;if(startupMessage)$('status').textContent=startupMessage;});
