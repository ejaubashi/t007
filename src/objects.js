import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const ACCENT = 0xef344b;
const finish = (color, metalness = .82, roughness = .29) => new T.MeshPhysicalMaterial({
  color, metalness, roughness, clearcoat: .35, clearcoatRoughness: .24,
});
const palette = () => ({
  body: finish(0x252d39),
  silver: finish(0x747e8e, .9, .25),
  edge: finish(0x404b5d, .88, .23),
  black: finish(0x090e16, .65, .3),
  glass: new T.MeshPhysicalMaterial({color:0x07121e, metalness:.45, roughness:.09, clearcoat:1, clearcoatRoughness:.08}),
  light: new T.MeshStandardMaterial({color:ACCENT, emissive:ACCENT, emissiveIntensity:2.2, roughness:.4}),
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
function armor(group, sections, position, mat, rotation=[0,0,0]) {
  const geometry=hull(sections.map(([y,w,d])=>[-y,w,d,d]));
  geometry.rotateX(Math.PI/2);
  return mesh(group,geometry,mat,position,rotation);
}
function strip(group,size,pos,mat,rotation=[0,0,0]) {
  rounded(group,size,pos,mat, .018,rotation);
  const halo = new T.MeshBasicMaterial({color:ACCENT, transparent:true, opacity:.08, depthWrite:false, blending:T.AdditiveBlending});
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

export function createRobot() {
  const group=new T.Group(),m=palette();
  // Athletic proportions, connected joints, and fitted armor replace the
  // original primitive blocks and oversized spikes.
  armor(group,[[1.77,.35,.23],[2,.48,.3],[2.5,.66,.36],[2.88,.54,.27]],[0,0,0],m.body);
  armor(group,[[1.85,.22,.1],[2.22,.46,.14],[2.61,.58,.12]],[0,0,.28],m.edge);
  rounded(group,[.6,.25,.46],[0,1.62,0],m.black,.08);
  for(let i=0;i<3;i++) rounded(group,[.34-i*.04,.045,.045],[0,1.78+i*.13,.29],m.silver,.012);
  strip(group,[.21,.032,.028],[0,2.32,.45],m.light);
  for(const side of [-1,1]) {
    const joint=(r,pos)=>mesh(group,new T.SphereGeometry(r,24,16),m.black,pos);
    joint(.23,[side*.75,2.65,0]);joint(.17,[side*1.06,1.88,.02]);joint(.2,[side*.39,1.47,0]);joint(.17,[side*.43,.45,.04]);
    armor(group,[[-.35,.22,.22],[0,.37,.33],[.3,.26,.24]],[side*.9,2.72,0],m.silver,[0,0,side*-.2]);
    armor(group,[[-.48,.13,.14],[.35,.18,.18]],[side*.98,2.2,0],m.black,[0,0,side*.14]);
    armor(group,[[-.38,.14,.16],[.23,.24,.23],[.4,.19,.18]],[side*1.16,1.43,.08],m.edge,[0,0,side*.12]);
    rounded(group,[.24,.26,.26],[side*1.23,.96,.09],m.black,.06);
    strip(group,[.025,.27,.018],[side*1.16,1.41,.32],m.light);
    armor(group,[[-.44,.17,.19],[.35,.24,.23]],[side*.4,.98,0],m.edge,[0,0,side*.035]);
    armor(group,[[-.38,.2,.22],[-.06,.17,.19],[.41,.23,.25]],[side*.44,-.1,.02],m.silver);
    rounded(group,[.49,.19,.79],[side*.44,-.64,.2],m.black,.06);
    rounded(group,[.32,.045,.45],[side*.44,-.52,.3],m.edge,.02);
    strip(group,[.028,.26,.018],[side*.44,-.08,.28],m.light);
    // Folded swept wing panels connect the two forms visually.
    const wing=new T.Group();panel(wing,[[0,.8],[side*.76,-.25],[side*.5,-.8],[0,-.3]],.04,m.body);wing.position.set(side*.67,2.18,-.37);wing.rotation.set(Math.PI*.42,0,side*-.32);group.add(wing);
    seam(group,[[side*.8,2.8,.34],[side*1.02,2.72,.34]],0xd8e5f5,.4);
  }
  rounded(group,[.36,.2,.32],[0,2.99,0],m.black,.06);
  armor(group,[[3.02,.22,.18],[3.24,.29,.23],[3.58,.23,.19],[3.69,.11,.1]],[0,0,0],m.silver);
  rounded(group,[.43,.15,.1],[0,3.37,.225],m.black,.035);
  strip(group,[.35,.024,.018],[0,3.38,.287],m.light);
  armor(group,[[3.03,.075,.04],[3.28,.13,.08]],[0,0,.23],m.edge);
  return group;
}

export function createPlanet() {
  const group=new T.Group();
  mesh(group,new T.SphereGeometry(1.65,80,56),finish(0x18202c,.85,.3));
  for(let i=0;i<3;i++) mesh(group,new T.TorusGeometry(2.15+i*.48,i===0?.014:.007,8,180),i===0?new T.MeshBasicMaterial({color:ACCENT}):finish(0x718198),[0,0,0],[.65+i*.27,.2,i*.4]);
  return group;
}
