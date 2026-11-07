import React, {useEffect, useRef} from 'react';
import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RectAreaLightUniformsLib} from 'three/addons/lights/RectAreaLightUniformsLib.js';
import {createLogo, createSpacecraft, createPlanet} from './objects.js';
import {getCraft} from './fleet.js';

RectAreaLightUniformsLib.init();
function disposeModel(model){model.traverse(o=>{o.geometry?.dispose();if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();});}

function studioEnvironment(renderer,kind) {
  const studio=new T.Scene();studio.background=new T.Color(0x121721);
  const panels=[
    [[-4,3.5,4], [3,6], [5.4,5.7,6.2]],
    [[4,1,-2], [1.6,5], [2.3,3.1,4.7]],
    [[0,6,-1], [5,3], [3.5,3.6,3.8]],
    [[-2,-2,3], [3,1], [.42,.48,.6]],
  ];
  if(kind==='logo')panels.push([[0,1.4,6],[3.3,5],[2.3,2.6,3.2]]);
  for(const [position,size,color] of panels) {
    const panel=new T.Mesh(new T.PlaneGeometry(...size),new T.MeshBasicMaterial({color:new T.Color().setRGB(...color),side:T.DoubleSide}));
    panel.position.set(...position);panel.lookAt(0,0,0);studio.add(panel);
  }
  const pmrem=new T.PMREMGenerator(renderer),target=pmrem.fromScene(studio,.05);
  pmrem.dispose();studio.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});return target;
}
function lightRig(scene,day) {
  scene.add(new T.HemisphereLight(0xcbdaf0,0x101319,day?.65:.35));
  for(const [color,intensity,w,h,pos] of [[0xf3f6ff,5,5,5,[-3,5,5]],[0x9dbce8,3,2,5,[5,2,-3]],[0xffffff,2,4,2,[-3,1,-4]]]) {
    const light=new T.RectAreaLight(color,intensity,w,h);light.position.set(...pos);light.lookAt(0,.5,0);scene.add(light);
  }
  const key=new T.SpotLight(0xf4f5ff,70,0,Math.PI/5,.9,2);key.position.set(-3,7,4);key.target.position.set(0,0,0);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.bias=-.0004;key.shadow.normalBias=.03;scene.add(key,key.target);
}
function groundGlowTexture() {
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
  const ctx=canvas.getContext('2d'),gradient=ctx.createRadialGradient(128,128,84,128,128,127);
  gradient.addColorStop(0,'rgba(255,255,255,0)');gradient.addColorStop(.5,'rgba(255,255,255,0.015)');gradient.addColorStop(.73,'rgba(255,255,255,0.24)');gradient.addColorStop(.83,'rgba(255,255,255,0.08)');gradient.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=gradient;ctx.fillRect(0,0,256,256);return new T.CanvasTexture(canvas);
}
function stage(scene) {
  const group=new T.Group();scene.add(group);
  const floor=new T.Mesh(new T.PlaneGeometry(150,150),new T.MeshStandardMaterial({color:0x060a11,metalness:.1,roughness:.8,envMapIntensity:.14}));floor.rotation.x=-Math.PI/2;floor.position.y=-.85;floor.receiveShadow=true;group.add(floor);
  const plinth=new T.Mesh(new T.CylinderGeometry(2.72,2.78,.12,128),new T.MeshPhysicalMaterial({color:0x111821,metalness:.7,roughness:.38}));plinth.position.y=-.75;plinth.receiveShadow=true;group.add(plinth);
  const ring=new T.Mesh(new T.TorusGeometry(2.69,.012,8,160),new T.MeshBasicMaterial({color:0x9fb5cf}));ring.rotation.x=Math.PI/2;ring.position.y=-.682;group.add(ring);
  const texture=groundGlowTexture(),halo=new T.Mesh(new T.PlaneGeometry(6.8,6.8),new T.MeshBasicMaterial({map:texture,color:0x90afdc,transparent:true,opacity:.35,depthWrite:false,blending:T.AdditiveBlending}));halo.rotation.x=-Math.PI/2;halo.position.y=-.67;group.add(halo);
  for(let i=1;i<7;i++) {const orbit=new T.Mesh(new T.TorusGeometry(3+i*1.45,.004,3,128),new T.MeshBasicMaterial({color:0x788ca4,transparent:true,opacity:.13-i*.012}));orbit.rotation.x=Math.PI/2;orbit.position.y=-.835;group.add(orbit);}
  const grid=new T.PolarGridHelper(13,12,0,100,0x1b2433,0x131b27);grid.position.y=-.83;grid.material.transparent=true;grid.material.opacity=.3;group.add(grid);
  return {ring,halo,texture};
}

export default function Scene({kind='logo',day=false,craft='fs45',interactive=false,onReady}) {
  const ref=useRef(),craftRef=useRef(craft);craftRef.current=craft;
  useEffect(()=>{
    const el=ref.current;let renderer;
    try {renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});} catch {el.classList.add('no-webgl');return;}
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
    renderer.shadowMap.enabled=kind!=='logo';renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;el.appendChild(renderer.domElement);
    const scene=new T.Scene();scene.fog=new T.FogExp2(0x020408,.028);
    const camera=new T.PerspectiveCamera(38,1,.1,100);
    const homePosition=new T.Vector3(kind==='logo'?0:6,kind==='logo'?0:4,kind==='logo'?8.5:9);
    camera.position.copy(homePosition);
    const environment=studioEnvironment(renderer,kind);scene.environment=environment.texture;lightRig(scene,day);
    let model,ship,platform;
    let activeCraft=craftRef.current;
    if(kind==='logo') {model=createLogo(day);scene.add(model);}
    else if(kind==='universe') {model=createPlanet();scene.add(model);}
    else {
      model=new T.Group();ship=createSpacecraft(activeCraft);model.add(ship);scene.add(model);
      if(interactive) {
        platform=stage(scene);
        const positions=new Float32Array(450);for(let i=0;i<positions.length;i++)positions[i]=(Math.random()-.5)*65;
        const stars=new T.BufferGeometry();stars.setAttribute('position',new T.BufferAttribute(positions,3));scene.add(new T.Points(stars,new T.PointsMaterial({color:0xaabbd5,size:.02,transparent:true,opacity:.5})));
      }
    }
    let themeDay=day;
    const changeTheme=event=>{
      if(kind!=='logo'||themeDay===event.detail)return;
      themeDay=event.detail;const previous=model;model=createLogo(themeDay);model.rotation.copy(previous.rotation);model.position.copy(previous.position);scene.remove(previous);disposeModel(previous);scene.add(model);
      scene.children.find(child=>child.isHemisphereLight).intensity=themeDay?.65:.35;
    };
    el.addEventListener('scene-theme',changeTheme);
    const controls=interactive?new OrbitControls(camera,renderer.domElement):null;
    if(controls){controls.enableDamping=true;controls.dampingFactor=.07;controls.minDistance=6;controls.maxDistance=18;controls.maxPolarAngle=Math.PI/2-.04;controls.target.set(0,.65,0);controls.enablePan=false;}
    const pointer={x:0,y:0};
    const move=e=>{const r=el.getBoundingClientRect();pointer.x=(e.clientX-r.left)/r.width-.5;pointer.y=(e.clientY-r.top)/r.height-.5;};
    const leave=()=>{pointer.x=pointer.y=0;};el.addEventListener('pointermove',move);el.addEventListener('pointerleave',leave);
    const reset=()=>{if(controls){camera.position.copy(homePosition);controls.target.set(0,.65,0);controls.update();}};el.addEventListener('reset-view',reset);
    const resize=()=>{const w=el.clientWidth,h=el.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.fov=kind==='logo'?38:T.MathUtils.radToDeg(2*Math.atan(Math.tan(T.MathUtils.degToRad(w<h?46:38)/2)/Math.min(1,w/h)));camera.updateProjectionMatrix();};
    const observer=new ResizeObserver(resize);observer.observe(el);resize();
    let visible=true;const visibility=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;});visibility.observe(el);
    const motion=matchMedia('(prefers-reduced-motion: reduce)');
    const accent=new T.Color(getCraft(activeCraft).accent);
    let raf,last=0,lastShadow=0;
    const animate=time=>{
      raf=requestAnimationFrame(animate);
      if(!visible||document.hidden||time-last<32)return;
      const dt=Math.min((time-last)/1000,.05);last=time;
      // Shadows change slowly; avoid rendering the full shadow map every frame.
      if(time-lastShadow>200){renderer.shadowMap.needsUpdate=true;lastShadow=time;}
      if(kind==='logo') {
        model.rotation.y=T.MathUtils.damp(model.rotation.y,-.15+pointer.x*.42,5,dt);model.rotation.x=T.MathUtils.damp(model.rotation.x,.07-pointer.y*.24,5,dt);
        model.position.y=motion.matches?0:Math.sin(time*.0006)*.055;
      } else if(kind==='universe') {if(!motion.matches)model.rotation.y+=dt*.09;}
      else {
        if(activeCraft!==craftRef.current) {
          model.remove(ship);disposeModel(ship);activeCraft=craftRef.current;ship=createSpacecraft(activeCraft);ship.scale.setScalar(motion.matches?1:.86);model.add(ship);accent.set(getCraft(activeCraft).accent);renderer.shadowMap.needsUpdate=true;
        }
        const scale=T.MathUtils.damp(ship.scale.x,1,7,dt);ship.scale.setScalar(scale);
        ship.position.y=.3+(motion.matches?0:Math.sin(time*.0009)*.055);
        if(!interactive){model.rotation.y=motion.matches?.3:time*.0001;model.rotation.x=.13;}
        if(platform){platform.ring.material.color.lerp(accent,.08);platform.halo.material.color.copy(platform.ring.material.color);}

      }
      controls?.update();renderer.render(scene,camera);
    };raf=requestAnimationFrame(animate);onReady?.();
    return()=>{
      cancelAnimationFrame(raf);observer.disconnect();visibility.disconnect();el.removeEventListener('pointermove',move);el.removeEventListener('pointerleave',leave);el.removeEventListener('reset-view',reset);el.removeEventListener('scene-theme',changeTheme);controls?.dispose();
      disposeModel(scene);platform?.texture.dispose();environment.dispose();renderer.dispose();renderer.domElement.remove();
    };
  },[kind,interactive]);
  useEffect(()=>{ref.current?.dispatchEvent(new CustomEvent('scene-theme',{detail:day}));},[day]);
  return <div ref={ref} className={`scene scene-${kind}`} role="img" aria-label={kind==='logo'?'Floating metallic Flyshare logo':kind==='universe'?'An orbiting planet':`Interactive ${getCraft(craft).name} ${getCraft(craft).code} spacecraft model`}/>;
}
