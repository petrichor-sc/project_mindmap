import {groups,bridgeConnections,resolveEndpoint} from './data.js?v=20261027-01';

const ns='http://www.w3.org/2000/svg';
const GOLDEN_ANGLE=2.399963229728653;

export class UniverseMap {
  constructor({host,labels,status,onProject,onNode,onBridge,onGroup=()=>{},onModeChange=()=>{},reduced=false,film=false}) {
    Object.assign(this,{host,labels,status,onProject,onNode,onBridge,onModeChange,reduced,film});
    this.T=null;this.items=[];this.links=[];this.rings=[];this.pulses=[];this.halos=[];this.clusterDecor=[];
    this.motion=!reduced;this.view='hub';this.selected=null;this.hovered=null;this.frame=0;this.tween=null;
    this.hubPositions=new Map();this.mode='loading';this.graphicsError=null;
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(host);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)this.startAmbient()});
  }
  async loadGraphics(){return Promise.all([import('three'),import('three/addons/controls/OrbitControls.js')]);}
  reportMode(mode,error=null){this.mode=mode;this.graphicsError=error;this.onModeChange({mode,error});}
  makeGlowTexture(){
    const c=document.createElement('canvas');c.width=c.height=128;
    const g=c.getContext('2d'),gradient=g.createRadialGradient(64,64,0,64,64,64);
    gradient.addColorStop(0,'rgba(255,255,255,1)');gradient.addColorStop(.13,'rgba(255,255,255,.64)');
    gradient.addColorStop(.31,'rgba(255,255,255,.16)');gradient.addColorStop(1,'rgba(255,255,255,0)');
    g.fillStyle=gradient;g.fillRect(0,0,128,128);
    return new this.T.CanvasTexture(c);
  }
  async init(){
    try {
      const [T,{OrbitControls}]=await this.loadGraphics();this.T=T;
      this.scene=new T.Scene();this.camera=new T.PerspectiveCamera(46,1,.1,400);this.camera.position.set(0,4,36);
      this.renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
      this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.8));
      this.renderer.setClearColor(0x000000,0);
      this.renderer.outputColorSpace=T.SRGBColorSpace;
      this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.35;
      this.host.replaceChildren(this.renderer.domElement);
      this.glowTexture=this.makeGlowTexture();
      this.raycaster=new T.Raycaster();this.pointer=new T.Vector2();
      this.pointerStart=null;
      const canvas=this.renderer.domElement;
      canvas.addEventListener('pointerdown',e=>{this.pointerStart={x:e.clientX,y:e.clientY}});
      canvas.addEventListener('pointerup',e=>{
        if(!this.pointerStart)return;
        const movement=Math.hypot(e.clientX-this.pointerStart.x,e.clientY-this.pointerStart.y);this.pointerStart=null;
        if(movement>7)return;
        const picked=this.hitTest(e);if(picked)picked.action();
      });
      canvas.addEventListener('pointermove',e=>{
        if(this.pointerStart&&Math.hypot(e.clientX-this.pointerStart.x,e.clientY-this.pointerStart.y)>7){this.setHover(null);return;}
        this.setHover(this.hitTest(e));
      });
      canvas.addEventListener('pointerleave',()=>this.setHover(null));
      this.controls=new OrbitControls(this.camera,canvas);
      this.controls.enabled=!this.film;this.controls.enableRotate=true;this.controls.enableZoom=true;
      this.controls.enableDamping=true;this.controls.dampingFactor=.065;
      this.controls.rotateSpeed=.55;this.controls.zoomSpeed=.8;
      this.controls.minDistance=7;this.controls.maxDistance=115;
      this.controls.maxPolarAngle=Math.PI*.86;
      this.controls.target.set(0,0,0);
      this.controls.addEventListener('change',()=>this.render());
      this.scene.add(new T.HemisphereLight('#c3dbff','#1d124d',2.4));
      const key=new T.DirectionalLight('#e7efff',3.4);key.position.set(-7,11,16);this.scene.add(key);
      const rim=new T.PointLight('#9171ff',95);rim.position.set(8,3,-2);this.scene.add(rim);
      const cyan=new T.PointLight('#4dedff',65);cyan.position.set(-12,-8,5);this.scene.add(cyan);
      this.createStarfield();
      if(this.workspace)this.setView(this.workspace,this.projectId);else{this.clear();this.resize();}
      this.status.textContent='3D constellation ready · drag to orbit · scroll to zoom';
      this.reportMode('3d');this.startAmbient();return true;
    }catch(error){
      console.warn('3D initialization failed; using the 2D map.',error);
      cancelAnimationFrame(this.frame);this.frame=0;this.controls?.dispose();this.controls=null;this.T=null;
      this.renderer?.dispose();this.renderer=null;this.host.replaceChildren();this.drawFallback();
      const reason=error?.message||String(error);this.graphicsError=reason;
      this.status.textContent='2D mode · Open Graphics for details';this.reportMode('2d',reason);return false;
    }
  }
  createStarfield(){
    const T=this.T;
    // Three distinct layers give the camera real parallax, rather than a static star wallpaper.
    this.background=new T.Group();
    for(const [count,spread,size,opacity,color] of [[750,67,.085,.58,'#afc3ff'],[240,35,.16,.29,'#83e4ff'],[160,57,.23,.16,'#b497ff']]){
      const points=[];
      for(let i=0;i<count;i++){
        const u=Math.sin(i*127.1+count*2.4)*43758.5453;
        const v=Math.sin(i*71.9+count*.31)*94621.15;
        const w=Math.sin(i*43.7+count*1.8)*71234.19;
        const frac=n=>n-Math.floor(n);
        points.push((frac(u)-.5)*spread*2,(frac(v)-.5)*spread*1.35,-12+(frac(w)-.5)*spread*1.3);
      }
      const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(points,3));
      const stars=new T.Points(geo,new T.PointsMaterial({color,size,transparent:true,opacity,depthWrite:false}));
      this.background.add(stars);
    }
    this.scene.add(this.background);
  }
  hitTest(e){
    if(!this.T||!this.camera)return null;
    const r=this.host.getBoundingClientRect();if(!r.width||!r.height)return null;
    this.pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);
    this.raycaster.setFromCamera(this.pointer,this.camera);
    const hits=this.raycaster.intersectObjects(this.items.filter(i=>i.visible&&i.mesh).map(i=>i.mesh));
    return hits.length?this.items.find(i=>i.mesh===hits[0].object):null;
  }
  setHover(item){
    if(this.hovered===item)return;
    if(this.hovered)this.hovered.button?.classList.remove('hovered');
    this.hovered=item;
    if(item)item.button?.classList.add('hovered');
    if(this.renderer)this.renderer.domElement.style.cursor=item?'pointer':'grab';
    if(this.T)this.render();
  }
  clear(){
    if(this.graph){
      this.graph.traverse(o=>{
        o.geometry?.dispose();
        if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material?.dispose();
      });this.scene.remove(this.graph);
    }
    this.items=[];this.links=[];this.rings=[];this.pulses=[];this.halos=[];this.clusterDecor=[];
    this.hovered=null;this.labels.replaceChildren();this.selected=null;
    if(this.T){this.graph=new this.T.Group();this.scene.add(this.graph);}
  }
  setView(workspace,projectId=null){
    this.tween?.kill();this.workspace=workspace;this.projectId=projectId;
    this.view=projectId?'project':'hub';this.clear();
    if(projectId)this.buildProject();else this.buildHub();
    if(this.T){this.resize();this.recenter(false);this.resetMotion();this.render();}else this.drawFallback();
  }
  makeItem({key,title,type,point,color,action,subtitle='',linkId=null}){
    const b=document.createElement('button');b.type='button';
    b.className=type==='project'?'project-label':type==='portal'?'portal-label':'node-label';
    b.dataset.key=key;b.style.setProperty('--entry-glow',color);b.onclick=action;
    if(type==='project'){
      const eyebrow=document.createElement('small');eyebrow.textContent='UNIVERSE';
      const strong=document.createElement('strong');strong.textContent=title;
      const small=document.createElement('span');small.className='entry-sub';small.textContent=subtitle;
      const enter=document.createElement('span');enter.className='enter-label';enter.textContent='EXPLORE ↗';
      b.append(eyebrow,strong,small,enter);
    }else if(type==='portal'){
      const small=document.createElement('small');small.textContent='✧ JUMP TO UNIVERSE';
      const txt=document.createElement('span');txt.textContent=title;b.append(small,txt);
    }else{
      const icon=document.createElement('i');icon.className='node-marker';icon.setAttribute('aria-hidden','true');
      const txt=document.createElement('span');txt.textContent=title;b.append(icon,txt);
    }
    b.setAttribute('aria-label',type==='portal'?'Open connected entry in '+title:title);
    this.labels.append(b);
    const item={key,title,type,point,color,button:b,linkId,visible:true,action};this.items.push(item);
    b.addEventListener('mouseenter',()=>this.setHover(item));
    b.addEventListener('mouseleave',()=>this.setHover(null));
    b.addEventListener('focus',()=>this.setHover(item));
    b.addEventListener('blur',()=>this.setHover(null));
    if(this.T){
      const T=this.T;item.position=new T.Vector3(...point);
      const radius=type==='project'?1.18:type==='portal'?.65:.41;
      const mat=new T.MeshPhysicalMaterial({color,metalness:.34,roughness:.13,clearcoat:1,clearcoatRoughness:.09,
        emissive:color,emissiveIntensity:type==='node'?.65:.52});
      const mesh=new T.Mesh(new T.SphereGeometry(radius,36,24),mat);
      mesh.position.copy(item.position);mesh.userData.itemKey=key;
      item.mesh=mesh;item.radius=radius;this.graph.add(mesh);
      // Smaller bright core creates depth inside the reflective shell.
      const core=new T.Mesh(new T.SphereGeometry(radius*.31,20,14),new T.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:.5}));
      core.position.copy(item.position).add(new T.Vector3(-radius*.19,radius*.23,radius*.8));
      this.graph.add(core);item.core=core;
      const halo=new T.Sprite(new T.SpriteMaterial({map:this.glowTexture,color,blending:T.AdditiveBlending,
        depthWrite:false,transparent:true,opacity:type==='project'?.35:type==='portal'?.35:.25}));
      halo.position.copy(item.position);const glowSize=radius*(type==='project'?6.2:7.5);
      halo.scale.set(glowSize,glowSize,1);this.graph.add(halo);item.halo=halo;
      this.halos.push({item,sprite:halo,base:glowSize,index:this.halos.length});
      if(type!=='node'){
        const geo=new T.TorusGeometry(radius*(type==='project'?1.62:1.8),type==='project'?.024:.017,8,96);
        const ring=new T.Mesh(geo,new T.MeshBasicMaterial({color,transparent:true,opacity:.56,depthWrite:false}));
        ring.position.copy(item.position);ring.rotation.set(.72,.35,-.27);this.graph.add(ring);
        item.ring=ring;this.rings.push({mesh:ring,x:ring.rotation.x,y:ring.rotation.y,index:this.rings.length});
        const ring2=new T.Mesh(new T.TorusGeometry(radius*2.08,.009,7,96),new T.MeshBasicMaterial({color,transparent:true,opacity:.19,depthWrite:false}));
        ring2.position.copy(item.position);ring2.rotation.set(-.36,1.06,.4);this.graph.add(ring2);
        item.ring2=ring2;
      }
    }
    return item;
  }
  makeLink(source,target,{color='#8073b0',label='',proposed=false,bridge=null,external=false}={}){
    if(!source||!target)return null;
    const record={source,target,label,proposed,bridge,external};this.links.push(record);
    if(this.T){
      const T=this.T,a=new T.Vector3(...source.point),b=new T.Vector3(...target.point);
      const mid=a.clone().lerp(b,.5);
      mid.z+=this.view==='hub'?-.7:Math.min(-.55,-a.distanceTo(b)*.11);
      mid.y+=this.view==='hub'?.95:.36;
      const curve=new T.QuadraticBezierCurve3(a,mid,b);record.curve=curve;
      const points=curve.getPoints(42);
      const lineMaterial=proposed?
        new T.LineDashedMaterial({color,transparent:true,opacity:.38,depthWrite:false,dashSize:.23,gapSize:.14}):
        new T.LineBasicMaterial({color,transparent:true,opacity:.43,depthWrite:false});
      const line=new T.Line(new T.BufferGeometry().setFromPoints(points),lineMaterial);
      if(proposed)line.computeLineDistances();
      this.graph.add(line);record.line=line;
      // Soft outer thread adds luminosity without covering the actual connection.
      const tube=new T.Mesh(new T.TubeGeometry(curve,42,external?.052:.033,5,false),
        new T.MeshBasicMaterial({color,transparent:true,opacity:proposed?.09:.17,depthWrite:false,blending:T.AdditiveBlending}));
      this.graph.add(tube);record.tube=tube;
      const pulse=new T.Mesh(new T.SphereGeometry(external?.105:.068,12,9),
        new T.MeshBasicMaterial({color,transparent:true,opacity:proposed?.52:.88,depthWrite:false}));
      this.graph.add(pulse);record.pulse=pulse;
      this.pulses.push({mesh:pulse,curve,index:this.pulses.length});
      if(external){
        const arrow=new T.Mesh(new T.ConeGeometry(.11,.3,9),new T.MeshBasicMaterial({color,transparent:true,opacity:.68}));
        arrow.position.copy(curve.getPoint(.8));arrow.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),curve.getTangent(.8).normalize());
        this.graph.add(arrow);record.arrow=arrow;
      }
    }
    if(label&&this.view==='hub'){
      const el=document.createElement('button');el.type='button';el.className='edge-label';el.textContent=label+' ↗';
      if(bridge){el.setAttribute('aria-label','Follow bridge: '+bridge.label);el.onclick=()=>this.onBridge(bridge.id,bridge.source.projectId);}
      this.labels.append(el);record.labelElement=el;
    }
    return record;
  }
  makeCluster(index,base,color,label,key){
    if(!this.T)return;
    const T=this.T,center=new T.Vector3(base,0,-1.8);
    const group=new T.Group();group.position.copy(center);
    const ring=new T.Mesh(new T.TorusGeometry(5.3,.012,6,128),
      new T.MeshBasicMaterial({color,transparent:true,opacity:.13,depthWrite:false}));
    ring.rotation.set(.42,1.02,index*.5);group.add(ring);
    const inner=new T.Mesh(new T.TorusGeometry(3.25,.009,6,128),
      new T.MeshBasicMaterial({color,transparent:true,opacity:.09,depthWrite:false}));
    inner.rotation.set(-.45,.41,.65);group.add(inner);
    const centerOrb=new T.Sprite(new T.SpriteMaterial({map:this.glowTexture,color,blending:T.AdditiveBlending,
      transparent:true,depthWrite:false,opacity:.15}));
    centerOrb.scale.set(10,10,1);group.add(centerOrb);
    this.graph.add(group);
    const heading=document.createElement('button');heading.type='button';heading.className='cluster-caption';
    heading.style.setProperty('--entry-glow',color);
    heading.textContent=(index+1).toString().padStart(2,'0')+' / '+label;
    heading.setAttribute('aria-label','Filter to branch: '+label);
    heading.onclick=()=>this.onGroup(key);
    this.labels.append(heading);
    this.clusterDecor.push({group,ring,inner,index,heading,point:new T.Vector3(base,7.5,0)});
  }
  buildHub(){
    const base=[[-8,1,2],[0,6,-4],[9,1,2],[0,-6,-1]];
    const ps=this.workspace.projects,items=new Map();
    ps.forEach((p,i)=>{
      let point=base[i];if(!point){const angle=(i-4)*GOLDEN_ANGLE,rad=13+Math.floor((i-4)/8)*5;
        point=[Math.cos(angle)*rad,Math.sin(angle)*rad*.85,Math.sin(angle)*4];}
      const item=this.makeItem({key:p.id,title:p.title,type:'project',point,color:p.color||'#7566e6',
        subtitle:p.atlas.nodes.length+' entries · '+bridgeConnections(this.workspace,p.id).length+' bridges',
        action:()=>this.onProject(p.id)});
      items.set(p.id,item);this.hubPositions.set(p.id,point);
    });
    const pairs=new Map();
    for(const l of this.workspace.bridges){
      const ids=[l.source.projectId,l.target.projectId].sort(),key=JSON.stringify(ids);
      if(!pairs.has(key))pairs.set(key,{ids,links:[]});pairs.get(key).links.push(l);
    }
    for(const {links} of pairs.values()){
      const first=links[0],source=items.get(first.source.projectId),target=items.get(first.target.projectId);
      this.makeLink(source,target,{color:'#a796f8',label:links.length+' '+(links.length===1?'bridge':'bridges'),
        proposed:links.every(l=>l.status==='proposed'),bridge:first,external:true});
    }
  }
  buildProject(){
    const p=this.workspace.projects.find(p=>p.id===this.projectId);if(!p)return;
    const nodes=new Map();const names=Object.keys(groups);
    names.forEach((group,gi)=>{
      const ns=p.atlas.nodes.filter(n=>n.group===group);
      const base=(gi-1)*8.9;this.makeCluster(gi,base,groups[group].color,p.atlas.groupLabels?.[group]||groups[group].label,group);
      ns.forEach((n,i)=>{
        const angle=i*GOLDEN_ANGLE+gi*.6;
        const radius=i===0?.68:2.15+Math.sqrt(i)*1.22;
        const point=[base+Math.cos(angle)*radius*.69,Math.sin(angle)*radius*1.04,
          Math.sin(angle*1.35+gi*1.4)*3.5+(i%3-1)*.65];
        nodes.set(n.id,this.makeItem({key:n.id,title:n.title,type:'node',point,
          color:groups[group].color,action:()=>this.onNode(n.id)}));
      });
    });
    for(const e of p.atlas.edges){
      const source=nodes.get(e.source),target=nodes.get(e.target);
      const from=p.atlas.nodes.find(n=>n.id===e.source);
      this.makeLink(source,target,{color:groups[from?.group]?.color||'#9288e5'});
    }
    const bridges=bridgeConnections(this.workspace,p.id);
    bridges.forEach((l,i)=>{
      const out=l.source.projectId===p.id,local=out?l.source:l.target,remote=out?l.target:l.source;
      const {project,entry}=resolveEndpoint(this.workspace,remote);
      const side=i%2===0?-1:1;const point=[side*(14.2+Math.floor(i/8)*2),4.6-Math.floor(i/2)*3.4,
        -1.4+Math.sin(i*2.1)*2.1];
      const portal=this.makeItem({key:'portal:'+l.id,title:project.title,type:'portal',point,
        color:'#c7e879',linkId:l.id,action:()=>this.onBridge(l.id,p.id)});
      portal.button.setAttribute('aria-label','Follow '+l.label+' to '+project.title+' / '+entry.title);
      portal.localId=local.nodeId;
      const localItem=nodes.get(local.nodeId);
      this.makeLink(out?localItem:portal,out?portal:localItem,{color:'#c7e879',
        proposed:l.status==='proposed',bridge:l,external:true});
    });
  }
  setSelection(id,visibleIds){
    this.selected=id;
    const visible=new Set(visibleIds||this.items.filter(i=>i.type==='node').map(i=>i.key));
    const p=this.workspace.projects.find(p=>p.id===this.projectId);
    const related=new Set(id&&p?p.atlas.edges.filter(e=>e.source===id||e.target===id).flatMap(e=>[e.source,e.target]):[]);
    for(const item of this.items){
      item.visible=item.type==='node'?visible.has(item.key):item.type==='portal'?visible.has(item.localId):true;
      item.button.hidden=!item.visible;item.button.classList.toggle('active',item.key===id);
      const active=!id||item.key===id||related.has(item.key)||(item.type==='portal'&&item.localId===id);
      item.button.style.opacity=active?'1':'.39';
      if(item.mesh){item.mesh.visible=item.visible;item.mesh.material.emissiveIntensity=active?.65:.12;}
      if(item.core)item.core.visible=item.visible;
      if(item.halo){item.halo.visible=item.visible;item.halo.material.opacity=active?.30:.06;}
      if(item.ring){item.ring.visible=item.visible;item.ring.material.opacity=active?.55:.11;}
      if(item.ring2)item.ring2.visible=item.visible;
    }
    for(const l of this.links){
      const visible=l.source.visible&&l.target.visible;
      const active=!id||l.source.key===id||l.target.key===id;
      if(l.line){l.line.visible=visible;l.line.material.opacity=active?.43:.06;}
      if(l.tube){l.tube.visible=visible;l.tube.material.opacity=active?.16:.025;}
      if(l.arrow)l.arrow.visible=visible&&active;
      if(l.pulse)l.pulse.visible=visible&&active;
    }
    this.render();if(!this.T)this.drawFallback();
  }
  render(){
    if(!this.renderer)return;
    this.renderer.render(this.scene,this.camera);
    const r=this.host.getBoundingClientRect();
    const place=(el,p,type='node')=>{
      const v=p.clone().project(this.camera);let x=(v.x+1)*r.width/2,y=(1-v.y)*r.height/2;
      if(type==='node'){
        const right=x<r.width*.68;
        el.classList.toggle('label-on-left',!right);
        x+=right?14:-14;
      }else if(type==='project')y+=56;
      else if(type==='portal')y+=37;
      el.style.left=x+'px';el.style.top=y+'px';
      const visible=v.z<1&&v.z>-1&&x>-125&&x<r.width+125&&y>-70&&y<r.height+70;
      el.style.visibility=visible?'visible':'hidden';
    };
    for(const item of this.items)place(item.button,item.position,item.type);
    for(const l of this.links)if(l.labelElement)place(l.labelElement,l.curve.getPoint(.5),'edge');
    for(const c of this.clusterDecor)place(c.heading,c.point,'cluster');
  }
  drawFallback(){
    if(this.T)return;
    const svg=document.createElementNS(ns,'svg'),r=this.host.getBoundingClientRect(),w=r.width||800,h=r.height||500;
    svg.setAttribute('viewBox',`0 0 ${w} ${h}`);svg.setAttribute('role','img');
    svg.setAttribute('aria-label',this.view==='hub'?'Project universes and their connections':'Entries and portals to connected projects');
    const pad=this.view==='hub'?70:95,xs=this.items.map(i=>i.point[0]),ys=this.items.map(i=>i.point[1]);
    const xmin=Math.min(-10,...xs)-2,xmax=Math.max(10,...xs)+2,ymin=Math.min(-6,...ys)-2,ymax=Math.max(6,...ys)+2;
    const xy=point=>[(point[0]-xmin)/(xmax-xmin)*(w-pad*2)+pad,(ymax-point[1])/(ymax-ymin)*(h-180)+90];
    for(const l of this.links){
      if(!l.source.visible||!l.target.visible)continue;
      const a=xy(l.source.point),b=xy(l.target.point),path=document.createElementNS(ns,'path');
      path.setAttribute('d',`M ${a[0]} ${a[1]} Q ${(a[0]+b[0])/2} ${(a[1]+b[1])/2-24} ${b[0]} ${b[1]}`);
      path.setAttribute('fill','none');path.setAttribute('stroke',l.external?'#b0a3ff':'#608dad');
      path.setAttribute('stroke-width',l.external?'2':'1.5');path.setAttribute('opacity','.8');
      if(l.proposed)path.setAttribute('stroke-dasharray','5 4');svg.append(path);
      if(l.labelElement){l.labelElement.style.left=(a[0]+b[0])/2+'px';l.labelElement.style.top=(a[1]+b[1])/2-15+'px';l.labelElement.style.visibility='visible';}
    }
    for(const c of this.clusterDecor){const [x,y]=xy([c.point.x,c.point.y,c.point.z]);
      c.heading.style.left=x+'px';c.heading.style.top=y+'px';c.heading.style.visibility='visible';}
    for(const item of this.items){
      const [x,y]=xy(item.point),c=document.createElementNS(ns,'circle');
      c.setAttribute('cx',x);c.setAttribute('cy',y);c.setAttribute('r',item.type==='project'?18:item.type==='portal'?11:6);
      c.setAttribute('fill',item.color);c.setAttribute('opacity',item.visible?'1':'0');svg.append(c);
      item.button.style.left=x+'px';item.button.style.top=y+(item.type==='project'?46:item.type==='portal'?33:0)+'px';
      item.button.style.visibility=item.visible?'visible':'hidden';
      item.button.classList.toggle('label-on-left',false);
    }
    this.host.replaceChildren(svg);
  }
  resize(){
    const r=this.host.getBoundingClientRect();if(!r.width||!r.height)return;
    if(this.renderer){this.camera.aspect=r.width/r.height;this.camera.updateProjectionMatrix();this.renderer.setSize(r.width,r.height);this.render();}
    else this.drawFallback();
  }
  recenter(animate=true){
    if(!this.T)return;
    const spanX=Math.max(12,...this.items.map(i=>Math.abs(i.point[0])+2));
    const spanY=Math.max(8,...this.items.map(i=>Math.abs(i.point[1])+3));
    const vertical=spanY/Math.tan(this.camera.fov*Math.PI/360),horizontal=spanX/(Math.tan(this.camera.fov*Math.PI/360)*this.camera.aspect);
    const distance=Math.min(108,Math.max(vertical,horizontal)*1.04+7);
    this.moveTo({x:0,y:1.2,z:distance,tx:0,ty:0,tz:0},animate);
  }
  focusNode(id){
    const item=this.items.find(i=>i.key===id);
    if(item&&this.T)this.moveTo({x:item.point[0]+1.2,y:item.point[1]+1.2,z:item.point[2]+15,
      tx:item.point[0],ty:item.point[1],tz:item.point[2]},true);
  }
  moveTo(target,animate=true){
    if(!this.T)return;this.tween?.kill();this.controls.enabled=false;
    const state=this.cameraState();const update=()=>this.applyCamera(state);
    const finish=()=>{this.controls.target.set(state.tx,state.ty,state.tz);this.controls.enabled=!this.film;this.controls.update();};
    if(window.gsap&&animate&&!this.reduced){
      this.tween=gsap.to(state,{...target,duration:1.25,ease:'power3.inOut',onUpdate:update,onComplete:finish});
    }else{Object.assign(state,target);update();finish();}
  }
  cameraState(){
    if(!this.camera)return{x:0,y:1,z:36,tx:0,ty:0,tz:0};
    return{x:this.camera.position.x,y:this.camera.position.y,z:this.camera.position.z,
      tx:this.controls.target.x,ty:this.controls.target.y,tz:this.controls.target.z};
  }
  applyCamera(s){if(!this.camera)return;this.camera.position.set(s.x,s.y,s.z);this.camera.lookAt(s.tx,s.ty,s.tz);this.render();}
  setMotion(on){
    this.motion=on&&!this.reduced;cancelAnimationFrame(this.frame);this.frame=0;
    if(this.motion)this.startAmbient();else this.resetMotion();
  }
  resetMotion(){
    for(const r of this.rings){r.mesh.rotation.x=r.x;r.mesh.rotation.y=r.y;}
    for(const p of this.pulses)p.mesh.position.copy(p.curve.getPoint(.55));
    for(const h of this.halos){h.sprite.scale.set(h.base,h.base,1);}
    for(const i of this.items){if(i.mesh){i.mesh.scale.setScalar(i.key===this.selected?1.3:1);}}
    this.render();
  }
  startAmbient(){
    if(this.frame||!this.T||!this.motion||this.film||document.hidden)return;
    let previous=0;
    const run=ms=>{
      this.frame=0;if(!this.motion||document.hidden)return;
      // Damping needs an update loop even when the user is not moving the pointer.
      this.controls?.update();
      if(ms-previous>28){
        previous=ms;const t=ms/1000;
        for(const r of this.rings){r.mesh.rotation.x=r.x+Math.sin(t*.24+r.index)*.21;r.mesh.rotation.y=r.y+t*.13;}
        for(const p of this.pulses){p.mesh.position.copy(p.curve.getPoint((t*.11+p.index*.18)%1));}
        for(const h of this.halos){
          const active=h.item.key===this.selected||h.item===this.hovered;
          const amp=active?1.28:1;
          const size=h.base*(1+Math.sin(t*1.4+h.index*1.7)*.07)*amp;
          h.sprite.scale.set(size,size,1);
        }
        for(const item of this.items){
          if(!item.mesh)continue;
          const size=item.key===this.selected?1.3:item===this.hovered?1.32:1;
          const phase=Math.sin(t*1.6+item.point[0]*.3)*.024;
          item.mesh.scale.setScalar(size*(1+phase));
        }
        for(const c of this.clusterDecor){c.ring.rotation.z=t*.015*(c.index%2?1:-1);}
        this.render();
      }
      this.frame=requestAnimationFrame(run);
    };
    this.frame=requestAnimationFrame(run);
  }
  stopTween(){this.tween?.kill();if(this.controls)this.controls.enabled=!this.film;}
}
