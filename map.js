import {groups,bridgeConnections,resolveEndpoint} from './data.js';
const ns='http://www.w3.org/2000/svg';
export class UniverseMap {
  constructor({host,labels,status,onProject,onNode,onBridge,reduced=false,film=false}){
    Object.assign(this,{host,labels,status,onProject,onNode,onBridge,reduced,film});
    this.T=null;this.items=[];this.links=[];this.rings=[];this.pulses=[];this.motion=!reduced;this.view='hub';this.selected=null;this.frame=0;this.tween=null;this.hubPositions=new Map();
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(host);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)this.startAmbient()});
  }
  async init(){
    try{
      const T=await import('three');const {OrbitControls}=await import('three/addons/controls/OrbitControls.js');
      this.T=T;this.scene=new T.Scene();this.camera=new T.PerspectiveCamera(45,1,.1,250);this.camera.position.set(0,3,32);
      this.renderer=new T.WebGLRenderer({antialias:true,alpha:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));this.renderer.setClearColor(0x000000,0);
      this.host.replaceChildren(this.renderer.domElement);
      let pointerStart=null;this.renderer.domElement.addEventListener('pointerdown',e=>{pointerStart={x:e.clientX,y:e.clientY}});this.renderer.domElement.addEventListener('pointerup',e=>{if(!pointerStart||Math.hypot(e.clientX-pointerStart.x,e.clientY-pointerStart.y)>6)return;const r=this.host.getBoundingClientRect(),ray=new T.Raycaster();ray.setFromCamera(new T.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),this.camera);const hits=ray.intersectObjects(this.items.filter(i=>i.visible).map(i=>i.mesh).filter(Boolean));if(hits.length)this.items.find(i=>i.mesh===hits[0].object)?.action();pointerStart=null;});this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.minDistance=6;this.controls.maxDistance=100;this.controls.maxPolarAngle=Math.PI*.8;this.controls.target.set(0,0,0);this.controls.addEventListener('change',()=>this.render());
      this.scene.add(new T.HemisphereLight('#ffffff','#8493b2',2.7));const light=new T.DirectionalLight('#ffffff',3.8);light.position.set(-8,14,18);this.scene.add(light);const pink=new T.PointLight('#ffbbd0',45);pink.position.set(8,8,12);this.scene.add(pink);
      this.background=new T.Group();const points=[];for(let i=0;i<260;i++)points.push(Math.sin(i*127.1)*40,Math.cos(i*71.9)*25,Math.sin(i*43.7)*10-20);
      this.background.add(new T.Points(new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(points,3)),new T.PointsMaterial({color:'#8d9caf',size:.028,transparent:true,opacity:.35})));this.scene.add(this.background);
      this.resize();if(this.workspace)this.setView(this.workspace,this.projectId);this.status.textContent='3D ready · drag to orbit, scroll to zoom';this.startAmbient();
      return true;
    }catch(error){console.warn('Three.js unavailable; using 2D map.',error);this.T=null;this.renderer?.dispose();this.renderer=null;this.host.replaceChildren();this.drawFallback();this.status.textContent='2D map · 3D needs WebGL and access to the CDN';return false;}
  }
  clear(){
    if(this.graph){this.graph.traverse(o=>{o.geometry?.dispose();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material?.dispose()});this.scene.remove(this.graph)}
    this.items=[];this.links=[];this.rings=[];this.pulses=[];this.labels.replaceChildren();this.selected=null;
    if(this.T){this.graph=new this.T.Group();this.scene.add(this.graph)}
  }
  setView(workspace,projectId=null){
    this.tween?.kill();this.workspace=workspace;this.projectId=projectId;this.view=projectId?'project':'hub';this.clear();
    if(projectId)this.buildProject();else this.buildHub();
    if(this.T){this.resize();this.recenter(false);this.resetMotion();this.render()}else this.drawFallback();
  }
  makeItem({key,title,type,point,color,action,subtitle='',linkId=null}){
    const b=document.createElement('button');b.type='button';b.className=type==='project'?'project-label':type==='portal'?'portal-label':'node-label';b.dataset.key=key;b.onclick=action;
    if(type==='project'){const strong=document.createElement('strong'),small=document.createElement('small'),enter=document.createElement('span');strong.textContent=title;small.textContent=subtitle;enter.className='enter-label';enter.textContent='Enter universe ↗';b.append(strong,small,enter)}else if(type==='portal'){const small=document.createElement('small');small.textContent='PORTAL ↗';b.append(small,document.createTextNode(title))}else b.textContent=title;
    b.setAttribute('aria-label',type==='portal'?'Open connected entry in '+title:title);this.labels.append(b);
    const item={key,title,type,point,color,button:b,linkId,visible:true,action};this.items.push(item);
    if(this.T){const T=this.T;item.position=new T.Vector3(...point);const radius=type==='project'?1.2:type==='portal'?.47:.27;
      const mesh=new T.Mesh(new T.SphereGeometry(radius,24,20),new T.MeshPhysicalMaterial({color,roughness:.17,metalness:.16,clearcoat:1,clearcoatRoughness:.13,transparent:true,opacity:1}));mesh.position.copy(item.position);item.mesh=mesh;this.graph.add(mesh);
      if(type==='project'||type==='portal'){const ring=new T.Mesh(new T.TorusGeometry(radius*1.48,.017,8,80),new T.MeshBasicMaterial({color,transparent:true,opacity:.55}));ring.position.copy(item.position);ring.rotation.x=.65;ring.rotation.y=.3;this.graph.add(ring);item.ring=ring;this.rings.push({mesh:ring,x:ring.rotation.x,y:ring.rotation.y,index:this.rings.length})}
    }
    return item;
  }
  makeLink(source,target,{color='#8073b0',label='',proposed=false,bridge=null,external=false}={}){
    const record={source,target,label,proposed,bridge,external};this.links.push(record);
    if(this.T){const T=this.T,a=new T.Vector3(...source.point),b=new T.Vector3(...target.point),mid=a.clone().lerp(b,.5);mid.z-=this.view==='hub'?2.5:2;mid.y+=this.view==='hub'?.7:0;const curve=new T.QuadraticBezierCurve3(a,mid,b);
      const material=proposed?new T.LineDashedMaterial({color,transparent:true,opacity:.7,dashSize:.17,gapSize:.12}):new T.LineBasicMaterial({color,transparent:true,opacity:.4});
      const line=new T.Line(new T.BufferGeometry().setFromPoints(curve.getPoints(64)),material);if(proposed)line.computeLineDistances();this.graph.add(line);record.line=line;record.curve=curve;
      if(external||this.view==='hub'){const pulse=new T.Mesh(new T.SphereGeometry(.075,10,8),new T.MeshBasicMaterial({color}));this.graph.add(pulse);record.pulse=pulse;this.pulses.push({mesh:pulse,curve,index:this.pulses.length});
        const arrow=new T.Mesh(new T.ConeGeometry(.11,.3,8),new T.MeshBasicMaterial({color,transparent:true,opacity:.65}));arrow.position.copy(curve.getPoint(.8));arrow.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),curve.getTangent(.8).normalize());this.graph.add(arrow);record.arrow=arrow;
      }
    }
    if(label&&this.view==='hub'){const el=document.createElement('button');el.type='button';el.className='edge-label';el.textContent=label+' ↗';if(bridge){el.setAttribute('aria-label','Follow bridge: '+bridge.label);el.onclick=()=>this.onBridge(bridge.id,bridge.source.projectId)}this.labels.append(el);record.labelElement=el;}
    return record;
  }
  buildHub(){
    const base=[[-8,1,0],[0,5,-1],[8,1,0],[0,-5,1]];const ps=this.workspace.projects,items=new Map();
    ps.forEach((p,i)=>{let point=base[i];if(!point){const angle=(i-4)*2.399963,rad=13+Math.floor((i-4)/8)*5;point=[Math.cos(angle)*rad,Math.sin(angle)*rad*.65,-2]}
      const item=this.makeItem({key:p.id,title:p.title,type:'project',point,color:p.color||'#7566e6',subtitle:p.atlas.nodes.length+' entries',action:()=>this.onProject(p.id)});items.set(p.id,item);this.hubPositions.set(p.id,point);
    });
    const pairs=new Map();for(const l of this.workspace.bridges){const ids=[l.source.projectId,l.target.projectId].sort(),key=JSON.stringify(ids);if(!pairs.has(key))pairs.set(key,{ids,links:[]});pairs.get(key).links.push(l)}
    for(const {ids,links}of pairs.values()){const first=links[0],source=items.get(first.source.projectId),target=items.get(first.target.projectId);this.makeLink(source,target,{color:'#8d78b2',label:links.length+' '+(links.length===1?'bridge':'bridges'),proposed:links.every(l=>l.status==='proposed'),bridge:first,external:true})}
  }
  buildProject(){
    const p=this.workspace.projects.find(p=>p.id===this.projectId),nodes=new Map();
    Object.keys(groups).forEach((group,gi)=>{const ns=p.atlas.nodes.filter(n=>n.group===group);ns.forEach((n,i)=>{const layer=Math.floor(i/5),row=i%5,point=[(gi-1)*8.6+layer*1.6,6-row*3.3,-layer*2.2];nodes.set(n.id,this.makeItem({key:n.id,title:n.title,type:'node',point,color:groups[group].color,action:()=>this.onNode(n.id)}))})});
    for(const e of p.atlas.edges)this.makeLink(nodes.get(e.source),nodes.get(e.target),{color:groups[p.atlas.nodes.find(n=>n.id===e.source).group].color});
    const bridges=bridgeConnections(this.workspace,p.id);
    bridges.forEach((l,i)=>{const out=l.source.projectId===p.id,local=out?l.source:l.target,remote=out?l.target:l.source,{project,entry}=resolveEndpoint(this.workspace,remote);
      const point=[i%2===0?-14.5:14.5,7.5-Math.floor(i/2)*4.2,1];const portal=this.makeItem({key:'portal:'+l.id,title:project.title,type:'portal',point,color:'#c5dc58',linkId:l.id,action:()=>this.onBridge(l.id,p.id)});portal.button.setAttribute('aria-label','Follow '+l.label+' to '+project.title+' / '+entry.title);portal.localId=local.nodeId;
      const localItem=nodes.get(local.nodeId);this.makeLink(out?localItem:portal,out?portal:localItem,{color:'#8aa139',proposed:l.status==='proposed',bridge:l,external:true});
    });
  }
  setSelection(id,visibleIds){
    this.selected=id;const visible=new Set(visibleIds||this.items.filter(i=>i.type==='node').map(i=>i.key));
    const p=this.workspace.projects.find(p=>p.id===this.projectId);const related=new Set(id?p.atlas.edges.filter(e=>e.source===id||e.target===id).flatMap(e=>[e.source,e.target]):[]);
    for(const item of this.items){item.visible=item.type==='node'?visible.has(item.key):item.type==='portal'?visible.has(item.localId):true;item.button.hidden=!item.visible;item.button.classList.toggle('active',item.key===id);const active=!id||item.key===id||related.has(item.key)||(item.type==='portal'&&item.localId===id);item.button.style.opacity=active?'1':'.42';if(item.mesh){item.mesh.visible=item.visible;item.mesh.material.opacity=active?1:.25;item.mesh.scale.setScalar(item.key===id?1.45:1)}if(item.ring){item.ring.visible=item.visible;item.ring.material.opacity=active?.55:.18}}
    for(const l of this.links){const visible=l.source.visible&&l.target.visible;if(l.line){l.line.visible=visible;l.line.material.opacity=id?(l.source.key===id||l.target.key===id?.85:.12):(l.external?.72:.35)}if(l.arrow)l.arrow.visible=visible;if(l.pulse)l.pulse.visible=visible;}
    this.render();if(!this.T)this.drawFallback();
  }
  labelPoint(item){const p=item.position.clone();p.y-=item.type==='project'?1.8:item.type==='portal'?.8:.7;return p;}
  render(){
    if(!this.renderer)return;this.renderer.render(this.scene,this.camera);const r=this.host.getBoundingClientRect();
    const place=(el,p)=>{const v=p.clone().project(this.camera);el.style.left=(v.x+1)*r.width/2+'px';el.style.top=(1-v.y)*r.height/2+'px';el.style.visibility=v.z<1&&v.z>-1&&Math.abs(v.x)<1.06&&Math.abs(v.y)<1.04?'visible':'hidden'};
    for(const item of this.items)place(item.button,this.labelPoint(item));for(const l of this.links)if(l.labelElement)place(l.labelElement,l.curve.getPoint(.5));
  }
  drawFallback(){
    if(this.T)return;const svg=document.createElementNS(ns,'svg'),r=this.host.getBoundingClientRect(),w=r.width||800,h=r.height||500;svg.setAttribute('viewBox',`0 0 ${w} ${h}`);svg.setAttribute('role','img');svg.setAttribute('aria-label',this.view==='hub'?'Project universes and their connections':'Entries and portals to connected projects');
    const pad=this.view==='hub'?70:100,xs=this.items.map(i=>i.point[0]),ys=this.items.map(i=>i.point[1]),xmin=Math.min(-10,...xs)-2,xmax=Math.max(10,...xs)+2,ymin=Math.min(-6,...ys)-2,ymax=Math.max(6,...ys)+2;
    const xy=point=>[(point[0]-xmin)/(xmax-xmin)*(w-pad*2)+pad,(ymax-point[1])/(ymax-ymin)*(h-180)+90];
    for(const l of this.links){if(!l.source.visible||!l.target.visible)continue;const a=xy(l.source.point),b=xy(l.target.point),path=document.createElementNS(ns,'path');path.setAttribute('d',`M ${a[0]} ${a[1]} Q ${(a[0]+b[0])/2} ${(a[1]+b[1])/2-24} ${b[0]} ${b[1]}`);path.setAttribute('fill','none');path.setAttribute('stroke',l.external?'#8a7baa':'#9eabc0');path.setAttribute('stroke-width',l.external?'1.6':'1');path.setAttribute('opacity','.65');if(l.proposed)path.setAttribute('stroke-dasharray','5 4');svg.append(path);if(l.labelElement){l.labelElement.style.left=(a[0]+b[0])/2+'px';l.labelElement.style.top=(a[1]+b[1])/2-15+'px';l.labelElement.style.visibility='visible'}}
    for(const item of this.items){const [x,y]=xy(item.point);const c=document.createElementNS(ns,'circle');c.setAttribute('cx',x);c.setAttribute('cy',y);c.setAttribute('r',item.type==='project'?26:7);c.setAttribute('fill',item.color);c.setAttribute('opacity',item.visible?'.65':'0');svg.append(c);item.button.style.left=x+'px';item.button.style.top=y+(item.type==='project'?45:16)+'px';item.button.style.visibility='visible';}
    this.host.replaceChildren(svg);
  }
  resize(){const r=this.host.getBoundingClientRect();if(!r.width||!r.height)return;if(this.renderer){this.camera.aspect=r.width/r.height;this.camera.updateProjectionMatrix();this.renderer.setSize(r.width,r.height);this.render()}else this.drawFallback()}
  recenter(animate=true){if(!this.T)return;const spanX=Math.max(12,...this.items.map(i=>Math.abs(i.point[0])+2)),spanY=Math.max(8,...this.items.map(i=>Math.abs(i.point[1])+3));const distance=Math.max(spanY/Math.tan(Math.PI/8),spanX/(Math.tan(Math.PI/8)*this.camera.aspect))*1.17;this.moveTo({x:0,y:1,z:Math.min(95,distance),tx:0,ty:0,tz:0},animate)}
  focusNode(id){const item=this.items.find(i=>i.key===id);if(item&&this.T)this.moveTo({x:item.point[0]+.6,y:item.point[1]+1,z:item.point[2]+17,tx:item.point[0],ty:item.point[1]-.6,tz:item.point[2]},true)}
  moveTo(target,animate=true){if(!this.T)return;this.tween?.kill();this.controls.enabled=false;const state=this.cameraState();const update=()=>this.applyCamera(state);const finish=()=>{this.controls.target.set(state.tx,state.ty,state.tz);this.controls.enabled=true;this.controls.update();};if(window.gsap&&animate&&!this.reduced){this.tween=gsap.to(state,{...target,duration:1.25,ease:'power3.inOut',onUpdate:update,onComplete:finish})}else{Object.assign(state,target);update();finish()}}
  cameraState(){if(!this.camera)return {x:0,y:1,z:32,tx:0,ty:0,tz:0};return {x:this.camera.position.x,y:this.camera.position.y,z:this.camera.position.z,tx:this.controls.target.x,ty:this.controls.target.y,tz:this.controls.target.z}}
  applyCamera(s){if(!this.camera)return;this.camera.position.set(s.x,s.y,s.z);this.camera.lookAt(s.tx,s.ty,s.tz);this.render()}
  setMotion(on){this.motion=on&&!this.reduced;cancelAnimationFrame(this.frame);this.frame=0;if(this.motion)this.startAmbient();else this.resetMotion()}
  resetMotion(){for(const r of this.rings){r.mesh.rotation.x=r.x;r.mesh.rotation.y=r.y}for(const p of this.pulses)p.mesh.position.copy(p.curve.getPoint(.5));this.render()}
  startAmbient(){if(this.frame||!this.T||!this.motion||this.film||document.hidden)return;let previous=0;const run=ms=>{this.frame=0;if(!this.motion||document.hidden)return;if(ms-previous>32){previous=ms;const t=ms/1000;for(const r of this.rings){r.mesh.rotation.x=r.x+Math.sin(t*.35+r.index)*.15;r.mesh.rotation.y=r.y+t*.09}for(const p of this.pulses)p.mesh.position.copy(p.curve.getPoint((t*.13+p.index*.22)%1));this.render()}this.frame=requestAnimationFrame(run)};this.frame=requestAnimationFrame(run)}
  stopTween(){this.tween?.kill();if(this.controls)this.controls.enabled=true}
}
