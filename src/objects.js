import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const ACCENT = 0xef344b;
const finish = (color, metalness = .82, roughness = .29) => new T.MeshPhysicalMaterial({
  color, metalness, roughness, clearcoat: .35, clearcoatRoughness: .24,
});
const palette = (accent=ACCENT) => ({
  body: finish(0x252d39),
  silver: finish(0x747e8e, .9, .25),
  edge: finish(0x404b5d, .88, .23),
  black: finish(0x090e16, .65, .3),
  glass: new T.MeshPhysicalMaterial({color:0x07121e, metalness:.45, roughness:.09, clearcoat:1, clearcoatRoughness:.08}),
  light: new T.MeshStandardMaterial({color:accent, emissive:accent, emissiveIntensity:2.2, roughness:.4}),
});
function mesh(group, geometry, mat, position = [0,0,0], rotation = [0,0,0]) {
  const part = new T.Mesh(geometry, mat);
  part.position.set(...position); part.rotation.set(...rotation);
  part.castShadow = true; part.receiveShadow = true; group.add(part);
  return part;
}
function rounded(group, size, position, mat, radius=.06, rotation=[0,0,0]) {
  return mesh(group, new RoundedBoxGeometry(...size, 3, Math.min(radius, ...size.map(n=>n*.3))), mat, position, rotation);
}
function roundedPath(points, radius) {
  const path = new T.Shape();
  points.forEach((point, i) => {
    const v = new T.Vector2(...point), prev = new T.Vector2(...points[(i+points.length-1)%points.length]), next = new T.Vector2(...points[(i+1)%points.length]);
    const r = Math.min(radius, v.distanceTo(prev)*.28, v.distanceTo(next)*.28);
    const enter = prev.sub(v).normalize().multiplyScalar(r).add(v);
    const leave = next.sub(v).normalize().multiplyScalar(r).add(v);
    if (!i) path.moveTo(enter.x, enter.y); else path.lineTo(enter.x, enter.y);
    path.quadraticCurveTo(v.x, v.y, leave.x, leave.y);
  });
  path.closePath(); return path;
}
function panel(group, points, thickness, mat, y=0) {
  const geometry = new T.ExtrudeGeometry(roundedPath(points,.055), {depth:thickness, bevelEnabled:true, bevelSize:.018, bevelThickness:.018, bevelSegments:3, curveSegments:12, steps:1});
  // The panel outline is drawn in x/z and extruded upward.
  geometry.rotateX(Math.PI/2);
  return mesh(group, geometry, mat, [0,y+thickness,0]);
}
function seam(group, points, color=0x8d9cad, opacity=.22) {
  const geometry = new T.BufferGeometry().setFromPoints(points.map(p=>new T.Vector3(...p)));
  group.add(new T.Line(geometry, new T.LineBasicMaterial({color,transparent:true,opacity})));
}
// A chamfered loft makes continuous surfaces rather than stacked boxes.
function hull(sections) {
  sections=[...sections].sort((a,b)=>a[0]-b[0]);
  const positions=[], indices=[];
  for(const [z,w,top,bottom] of sections) {
    for(const [x,y] of [[0,top],[w*.72,top*.86],[w,top*.25],[w*.75,-bottom*.7],[0,-bottom],[-w*.75,-bottom*.7],[-w,top*.25],[-w*.72,top*.86]]) positions.push(x,y,z);
  }
  for(let j=0;j<sections.length-1;j++) for(let i=0;i<8;i++) {
    const a=j*8+i,b=j*8+(i+1)%8,c=b+8,d=a+8;indices.push(a,d,b,b,d,c);
  }
  for(let i=1;i<7;i++) {indices.push(0,i,i+1);const last=(sections.length-1)*8;indices.push(last,last+i+1,last+i);}
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}
function strip(group,size,pos,mat,rotation=[0,0,0]) {
  rounded(group,size,pos,mat, .018,rotation);
  const halo = new T.MeshBasicMaterial({color:mat.emissive, transparent:true, opacity:.08, depthWrite:false, blending:T.AdditiveBlending});
  rounded(group,size.map(n=>n*1.8),pos,halo,.025,rotation);
}

export function createLogo(day=false) {
  const group=new T.Group();
  const points=[[-1.25,1.27],[1.25,1.27],[1.25,.27],[.83,.27],[1.1,-.08],[.37,-.84],[.02,-.56],[-.24,-.56],[-.24,-1.27],[-1.25,-1.27]];
  const geometry=new T.ExtrudeGeometry(roundedPath(points,.105),{depth:.24,bevelEnabled:true,bevelSegments:7,bevelSize:.055,bevelThickness:.065,curveSegments:24,steps:1});geometry.center();
  const face=new T.MeshPhysicalMaterial({color:day?0xc6dcf1:0x354359,metalness:day?.28:.82,roughness:day?.16:.34,clearcoat:1,clearcoatRoughness:.16,envMapIntensity:day?1.3:.9,transparent:day,opacity:day?.28:1});
  const rim=new T.MeshPhysicalMaterial({color:day?0xdceaff:0x909dac,metalness:.96,roughness:.17,clearcoat:1,envMapIntensity:1.6,transparent:day,opacity:day?.78:1});
  mesh(group,geometry,[face,rim]);return group;
}

export function createShip() {
  const group=new T.Group(), m=palette();
  const outline=[[.2,1.55],[3.58,-.85],[3.63,-1.12],[2.98,-1.48],[1.43,-.97],[.53,-1.56]];
  for(const side of [-1,1]) {
    const mirrored=outline.map(([x,z])=>[x*side,z]);
    panel(group,mirrored,.075,m.body,-.065);
    panel(group,[[side*.48,1.1],[side*3.36,-.86],[side*1.18,-.53]],.035,m.edge,.045);
    panel(group,[[side*1.25,-.6],[side*3.36,-.99],[side*2.9,-1.29],[side*1.5,-.86]],.028,m.body,.045);
    seam(group,[[side*.8,.108,.45],[side*2.6,.108,-.89]]);
    seam(group,[[side*1.38,.11,-.82],[side*2.82,.11,-1.2]],0x0a1019,.8);
    strip(group,[.48,.018,.025],[side*3.09,.107,-1.02],m.light,[0,side*.2,0]);
    // Recessed engine nacelles and restrained light at the exhaust only.
    rounded(group,[.43,.3,.86],[side*.43,.06,-1.34],m.black,.09);
    const nozzle=mesh(group,new T.TorusGeometry(.115,.028,8,32),m.silver,[side*.43,.065,-1.79]);nozzle.scale.y=.72;
    const engine=mesh(group,new T.CircleGeometry(.08,32),m.light,[side*.43,.065,-1.815],[0,Math.PI,0]);engine.scale.y=.65;
    for(let i=0;i<5;i++) rounded(group,[.24,.014,.022],[side*.88,.104,-.65-i*.075],m.black,.005);
    for(let i=0;i<3;i++) rounded(group,[.04,.008,.085],[side*1.85+i*.065,.112,-.5],m.silver,.003);
  }
  mesh(group,hull([[-1.66,.31,.1,.08],[-1.22,.55,.24,.12],[-.45,.46,.4,.13],[.45,.25,.25,.09],[1.62,.11,.1,.03],[2.87,.008,.007,.006]]),m.body);
  mesh(group,hull([[-.78,.25,.37,0],[-.3,.23,.52,0],[.42,.15,.38,0],[1.1,.015,.15,0]]),m.glass);
  seam(group,[[0,.4,-.78],[0,.55,-.3],[0,.41,.42],[0,.18,1.1]],0xb2c5de,.25);
  for(const side of [-1,1]) seam(group,[[side*.25,.39,-.7],[side*.23,.54,-.3],[side*.15,.4,.4],[0,.16,1.1]],0xb2c5de,.3);
  rounded(group,[.12,.018,.035],[0,.125,1.63],m.silver,.008);
  return group;
}

export function createAsterion() {
  const group=new T.Group(),m=palette(0x56dce8);
  const ceramic=finish(0xa5b5c4,.48,.27), titanium=finish(0x495b6e,.92,.22);
  // The open annular drive is structural geometry, surrounding a continuous pod.
  const drive=new T.Group();group.add(drive);
  mesh(drive,new T.TorusGeometry(2.12,.105,16,160),titanium,[0,.08,0],[Math.PI/2,0,0]);
  mesh(drive,new T.TorusGeometry(2.12,.022,8,160),m.light,[0,.185,0],[Math.PI/2,0,0]);
  mesh(drive,new T.TorusGeometry(2.24,.026,8,160,Math.PI*1.55),ceramic,[0,.08,0],[Math.PI/2,0,.72]);
  for(const side of [-1,1]) {
    panel(group,[[side*.23,.55],[side*1.96,.38],[side*2.04,-.05],[side*.25,-.35]],.08,ceramic,.06);
    panel(group,[[side*.36,-1.15],[side*1.7,-1.14],[side*1.32,-1.52],[side*.3,-1.6]],.05,titanium,.015);
    strip(group,[.025,.018,.45],[side*1.85,.16,.12],m.light);
    rounded(group,[.16,.2,.5],[side*.42,.06,-1.97],m.black,.06);
    const exhaust=mesh(group,new T.TorusGeometry(.095,.018,8,32),m.light,[side*.42,.07,-2.24]);exhaust.scale.y=.7;
    seam(group,[[side*.65,.165,.37],[side*1.78,.165,.24]],0x40566e,.5);
  }
  mesh(group,hull([[-2.45,.16,.09,.09],[-1.72,.38,.22,.15],[-.5,.44,.36,.18],[.65,.34,.31,.14],[1.9,.17,.15,.07],[2.84,.012,.018,.012]]),ceramic);
  mesh(group,hull([[-.7,.25,.38,0],[-.1,.26,.49,0],[.8,.19,.39,0],[1.57,.025,.18,0]]),m.glass);
  for(const side of [-1,1]) {
    seam(group,[[side*.25,.4,-.7],[side*.26,.51,-.1],[side*.19,.41,.8],[0,.19,1.57]],0xd2e8f5,.5);
    for(let i=0;i<5;i++)rounded(group,[.24,.014,.026],[side*.23,.24,-1.38-i*.07],titanium,.005);
  }
  strip(group,[.12,.018,.035],[0,.16,1.94],m.light);
  return group;
}

export function createSpectre() {
  const group=new T.Group(),m=palette(0xb18aff);
  const obsidian=finish(0x171b2b,.86,.25), alloy=finish(0x68758b,.85,.26);
  // Two independent forward booms leave an actual open channel between them.
  for(const side of [-1,1]) {
    mesh(group,hull([[-2.22,.29,.17,.13],[-1.2,.4,.3,.18],[.4,.32,.23,.13],[2.15,.17,.11,.07],[3.1,.008,.012,.008]]),obsidian,[side*.83,0,0]);
    panel(group,[[side*1.05,-.35],[side*2.78,-1.48],[side*2.35,-1.94],[side*1.03,-1.39]],.065,m.edge,.025);
    panel(group,[[side*.58,.18],[side*.84,1.95],[side*1.03,.24],[side*1.08,-.96]],.025,alloy,.16);
    rounded(group,[.45,.34,.76],[side*.83,-.015,-1.99],m.black,.09);
    const nozzle=mesh(group,new T.TorusGeometry(.135,.022,8,40),alloy,[side*.83,.025,-2.39]);nozzle.scale.y=.7;
    const exhaust=mesh(group,new T.CircleGeometry(.1,32),m.light,[side*.83,.025,-2.41],[0,Math.PI,0]);exhaust.scale.y=.65;
    strip(group,[.024,.018,.64],[side*.58,.19,.62],m.light,[0,side*-.07,0]);
    strip(group,[.35,.018,.024],[side*2.27,.12,-1.66],m.light,[0,side*.2,0]);
    for(let i=0;i<5;i++)rounded(group,[.25,.012,.02],[side*.84,.31,-1.08-i*.08],m.black,.003);
    const fin=new T.Group();panel(fin,[[0,-.65],[side*.58,-1.25],[side*.6,-2.02],[0,-1.8]],.04,obsidian);fin.position.set(side*1.08,.08,0);fin.rotation.z=side*.85;group.add(fin);
  }
  panel(group,[[-.86,-1.49],[.86,-1.49],[.78,.3],[.3,1.01],[-.3,1.01],[-.78,.3]],.12,m.body,.025);
  mesh(group,hull([[-1.2,.27,.29,.05],[-.4,.31,.41,.06],[.35,.21,.31,.03],[.97,.015,.13,.01]]),m.glass);
  seam(group,[[0,.31,-1.2],[0,.43,-.4],[0,.33,.35],[0,.15,.97]],0xa2aec2,.32);
  return group;
}

export function createSpacecraft(id='fs45') {
  const craft=id==='asterion'?createAsterion():id==='spectre'?createSpectre():createShip();
  craft.name=id;return craft;
}

export function createPlanet() {
  const group=new T.Group();
  mesh(group,new T.SphereGeometry(1.65,80,56),finish(0x18202c,.85,.3));
  for(let i=0;i<3;i++) mesh(group,new T.TorusGeometry(2.15+i*.48,i===0?.014:.007,8,180),i===0?new T.MeshBasicMaterial({color:ACCENT}):finish(0x718198),[0,0,0],[.65+i*.27,.2,i*.4]);
  return group;
}
