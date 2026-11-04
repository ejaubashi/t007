import React, { useEffect, useRef } from 'react';
import * as T from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const red = 0xf02e40;
function material(color=0x30333c, metalness=.8, roughness=.3) { return new T.MeshStandardMaterial({ color, metalness, roughness, flatShading:true }); }
function box(group,size,pos,mat,rot=[0,0,0]) { const m=new T.Mesh(new T.BoxGeometry(...size),mat);m.position.set(...pos);m.rotation.set(...rot);group.add(m);return m; }
function facet(group,points,depth,mat) {const s=new T.Shape();points.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();const g=new T.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelSize:.025,bevelThickness:.025,bevelSegments:1,steps:1});g.rotateX(-Math.PI/2);const m=new T.Mesh(g,mat);group.add(m);return m;}
function ship() {
 const g=new T.Group(), dark=material(0x22252c), steel=material(0x676c78), black=material(0x090c13,.9,.16), light=new T.MeshStandardMaterial({color:red,emissive:red,emissiveIntensity:5});
 facet(g,[[0,3.1],[-.5,1.2],[-3.5,-.9],[-3.2,-1.5],[-1,-1.1],[0,-1.55],[1,-1.1],[3.2,-1.5],[3.5,-.9],[.5,1.2]],.14,dark);
 facet(g,[[0,3.15],[-.48,.1],[-.75,-1.25],[0,-.9],[.75,-1.25],[.48,.1]],.36,steel);
 facet(g,[[0,1.6],[-.25,.5],[-.2,-.15],[.2,-.15],[.25,.5]],.52,black);
 for(const sign of [-1,1]) {
  facet(g,[[sign*.55,.9],[sign*3.4,-.95],[sign*1.3,-.7]],.2,steel);
  box(g,[.65,.035,.035],[sign*2.7,.23,1.05],light,[0,sign*.23,0]);
  box(g,[.3,.18,.6],[sign*.55,.15,1.4],black);
  box(g,[.27,.08,.07],[sign*.55,.2,1.73],light);
  for(let i=0;i<5;i++) box(g,[.22,.012,.018],[sign*(1+i*.33),.23,.6+i*.12],black,[0,sign*.6,0]);
  for(let i=0;i<3;i++) box(g,[.045,.015,.12],[sign*1.4+i*.07,.25,.1],material(0xaeb3bc));
 }
 const edges=new T.LineSegments(new T.EdgesGeometry(g.children[0].geometry,30),new T.LineBasicMaterial({color:0x656a74,transparent:true,opacity:.25}));g.add(edges);
 return g;
}
function robot() {
 const g=new T.Group(), dark=material(0x242730), steel=material(0x666a75), black=material(0x101219), glow=new T.MeshStandardMaterial({color:red,emissive:red,emissiveIntensity:4});
 // Independently articulated assemblies retain a deliberately angular silhouette.
 box(g,[1.45,1.5,.65],[0,2.25,0],dark);
 for(const s of [-1,1]) {
  box(g,[.65,1.2,.65],[s*.54,.95,0],steel,[0,0,s*-.06]);
  box(g,[.52,1,.56],[s*.55,-.13,.12],dark);
  box(g,[.7,.3,1.1],[s*.55,-.75,.4],black);
  box(g,[1,.55,.8],[s*1.1,2.85,0],steel,[0,0,s*-.15]);
  box(g,[.4,1.25,.5],[s*1.35,2.08,0],dark,[0,0,s*.16]);
  box(g,[.5,.9,.5],[s*1.55,1.15,.15],steel,[.1,0,s*.2]);
  box(g,[.38,.4,.4],[s*1.65,.58,.25],black);
  const wing=facet(g,[[0,1.6],[s*1.2,.4],[s*.55,-.6]],.1,dark);wing.position.set(s*.9,1.9,-.55);wing.rotation.x=.6;wing.rotation.z=s*.5;
  box(g,[.37,.04,.03],[s*.26,3.65,.42],glow,[0,0,s*.2]);
  box(g,[.035,.45,.03],[s*.8,.25,.42],glow);
 }
 const helmet=new T.Mesh(new T.OctahedronGeometry(.65),steel);helmet.scale.set(.7,1,.65);helmet.position.set(0,3.55,0);g.add(helmet);
 for(const side of [-1,1]){const horn=new T.Mesh(new T.ConeGeometry(.14,.95,4),steel);horn.position.set(side*.43,3.95,0);horn.rotation.z=-side*.4;g.add(horn);for(const [x,y,r,h] of [[1.1,2.95,.6,.95],[.55,.8,.42,1.2],[1.5,1.25,.38,1.1]]){const plate=new T.Mesh(new T.ConeGeometry(r,h,4),steel);plate.scale.z=.55;plate.position.set(side*x,y,.35);plate.rotation.z=side*.1;g.add(plate);}}
 const crown=new T.Mesh(new T.ConeGeometry(.26,.8,4),steel);crown.position.set(0,4.15,0);g.add(crown);
 for(let i=0;i<4;i++)box(g,[.2,.035,.03],[0,2.8-i*.28,.35],glow);
 const breast=new T.Mesh(new T.ConeGeometry(.8,.9,3),steel);breast.position.set(0,2.5,.25);breast.rotation.x=Math.PI/2;g.add(breast);
 g.position.y=.85;return g;
}
function logo(day) {
 const shape=new T.Shape(); const points=[[-1.3,1.3],[1.3,1.3],[1.3,.25],[.9,.25],[1.12,-.08],[.4,-.86],[.05,-.58],[-.22,-.58],[-.22,-1.3],[-1.3,-1.3]];
 points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();
 const geo=new T.ExtrudeGeometry(shape,{depth:.15,bevelEnabled:true,bevelSegments:4,steps:1,bevelSize:.045,bevelThickness:.05});geo.center();
 const g=new T.Group();g.add(new T.Mesh(geo,[new T.MeshPhysicalMaterial({color:day?0xd6e5f6:0x080a10,metalness:day?.1:.85,roughness:.18,clearcoat:1,transparent:day,opacity:day?.08:1,envMapIntensity:.6}),new T.MeshPhysicalMaterial({color:day?0xb7cce6:0x9d9fa6,metalness:day?.3:.95,roughness:.2,transparent:day,opacity:day?.35:1,envMapIntensity:1.3})]));
 return g;
}
export default function Scene({kind='logo',day=false,form='ship',interactive=false,onReady}) {
 const ref=useRef(), formRef=useRef(form);formRef.current=form;
 useEffect(()=>{
  const el=ref.current;let renderer;
  try {renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});} catch {el.classList.add('no-webgl');return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.4;el.appendChild(renderer.domElement);
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(38,1,.1,200);camera.position.set(kind==='logo'?0:7,kind==='logo'?0:4.5,kind==='logo'?8:9);
  const room=new RoomEnvironment(),pmrem=new T.PMREMGenerator(renderer);const envTarget=pmrem.fromScene(room,.04);scene.environment=envTarget.texture;room.dispose();pmrem.dispose();
  scene.add(new T.HemisphereLight(day?0xe5f1ff:0xb9c9ef,0x14131b,day?3:1.3));
  [[0xffffff,55,[-3,5,4]],[0xb2c4ef,35,[5,1,-2]],[red,10,[-4,2,-3]]].forEach(([c,p,pos])=>{const l=new T.PointLight(c,p);l.position.set(...pos);scene.add(l);});
  const key=new T.DirectionalLight(0xffffff,4);key.position.set(-3,5,3);scene.add(key);
  let model,shipModel,robotModel,ring;
  if(kind==='logo') {model=logo(day);scene.add(model);}
  else if(kind==='universe') {
   model=new T.Group();const planet=new T.Mesh(new T.SphereGeometry(1.7,64,48),material(0x21242d,.75,.25));model.add(planet);
   for(let i=0;i<3;i++){const r=new T.Mesh(new T.TorusGeometry(2.2+i*.6,.012,8,160),i===0?new T.MeshBasicMaterial({color:red}):material(0x8b8d99));r.rotation.set(.6+i*.3,.2,i*.5);model.add(r);}scene.add(model);
  } else {model=new T.Group();shipModel=ship();robotModel=robot();robotModel.scale.setScalar(.01);model.add(shipModel,robotModel);scene.add(model);
   if(interactive){const base=new T.Mesh(new T.CylinderGeometry(2.6,2.6,.15,96),material(0x15171d));base.position.y=-.7;scene.add(base);
    ring=new T.Mesh(new T.TorusGeometry(2.55,.026,8,150),new T.MeshBasicMaterial({color:0xdce8ff}));ring.rotation.x=Math.PI/2;ring.position.y=-.61;scene.add(ring);
    for(let i=1;i<11;i++){const r=new T.Mesh(new T.TorusGeometry(i*1.35,.005,3,120),new T.MeshBasicMaterial({color:0x282b32}));r.rotation.x=Math.PI/2;r.position.y=-.79;scene.add(r);}
    const grid=new T.GridHelper(40,30,0x262930,0x15171b);grid.position.y=-.8;scene.add(grid);
    const ps=new Float32Array(600);for(let i=0;i<600;i++)ps[i]=(Math.random()-.5)*80;
    const pg=new T.BufferGeometry();pg.setAttribute('position',new T.BufferAttribute(ps,3));scene.add(new T.Points(pg,new T.PointsMaterial({color:0x9da8be,size:.035})));}
  }
  const controls=interactive?new OrbitControls(camera,renderer.domElement):null;
  if(controls){controls.enableDamping=true;controls.minDistance=5;controls.maxDistance=20;controls.maxPolarAngle=Math.PI/2-.02;controls.target.set(0,.7,0);controls.enablePan=false;}
  const pointer={x:0,y:0};const move=e=>{const r=el.getBoundingClientRect();pointer.x=(e.clientX-r.left)/r.width-.5;pointer.y=(e.clientY-r.top)/r.height-.5;};el.addEventListener('pointermove',move);
  const reset=()=>{if(controls){camera.position.set(7,4.5,9);controls.target.set(0,.7,0);controls.update();}};el.addEventListener('reset-view',reset);
  const resize=()=>{const w=el.clientWidth,h=el.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();};const observer=new ResizeObserver(resize);observer.observe(el);resize();
  let raf,progress=0;const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;let last=0;
  const animate=t=>{raf=requestAnimationFrame(animate);const dt=Math.min((t-last)/1000,.05);last=t;
   if(kind==='logo'){model.rotation.y=T.MathUtils.lerp(model.rotation.y,pointer.x*.5,.04);model.rotation.x=T.MathUtils.lerp(model.rotation.x,-pointer.y*.3,.04);model.position.y=reduce?0:Math.sin(t*.0006)*.07;}
   else if(kind==='universe'){if(!reduce)model.rotation.y+=dt*.12;}
   else {progress=T.MathUtils.damp(progress,formRef.current==='robot'?1:0,4,dt);shipModel.scale.setScalar(Math.max(.001,1-progress));shipModel.position.y=.4+Math.sin(t*.001)*.08+progress*2;shipModel.rotation.z=progress*Math.PI/2;robotModel.scale.setScalar(Math.max(.001,progress*.68));robotModel.position.y=-.02;robotModel.rotation.y=(1-progress)*Math.PI;
    if(!interactive){model.rotation.y=t*.00012;model.rotation.x=.22;}if(ring)ring.material.color.set(progress>.5?red:0xdce8ff);}
   controls?.update();renderer.render(scene,camera);
  };raf=requestAnimationFrame(animate);onReady?.();
  return()=>{cancelAnimationFrame(raf);observer.disconnect();el.removeEventListener('pointermove',move);el.removeEventListener('reset-view',reset);controls?.dispose();scene.traverse(o=>{o.geometry?.dispose();if(o.material){for(const m of (Array.isArray(o.material)?o.material:[o.material]))m.dispose();}});envTarget.dispose();renderer.dispose();renderer.domElement.remove();};
 },[kind,day,interactive]);
 return <div ref={ref} className={`scene scene-${kind}`} role="img" aria-label={kind==='logo'?'Floating metallic Flyshare logo':kind==='universe'?'An orbiting planet':`Interactive FS-45 ${form==='robot'?'transformer':'spaceship'} model`}/>;
}
