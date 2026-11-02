/* HJS Designs — the world. Rebuilt from scratch 2026-11-02.
 *
 * THE ONE ARCHITECTURAL CHANGE from the first attempt: there is no film and no hand-off.
 * The laptop and the city live in ONE Three.js scene and ONE camera travels a single path
 * through both at a CONSTANT speed. Hayden's complaint was "a big jump cut from real life to
 * digital world" and "no increase or decrease in speed throughout the entire camera motion" —
 * neither is possible here, because there is nothing to cut between.
 *
 * THE LOOK is taken from his AskLex screenshot, and from their live bundle (read 2026-10-30):
 * envMap everywhere, ~70 lights, shadows on, real CC0 PBR textures, and NO 3D models — the whole
 * city is procedural geometry. Palette sampled off his frame; see ASSETS.md for every source.
 */
import * as THREE from 'three';
import { OrbitControls }  from 'three/addons/controls/OrbitControls.js';
import { RGBELoader }     from 'three/addons/loaders/RGBELoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }     from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass }from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass }     from 'three/addons/postprocessing/OutputPass.js';
import { mountPanels } from './panels.js?v=1';

/* ───────── palette, sampled off his AskLex frame ───────── */
const C = {
  skyTop:0x12132A, skyHaze:0x262A48,
  grass:0x3B4A25, grassLit:0x5F7634,
  concrete:0x6B707A, concDark:0x41454E, stone:0x63676F, asphalt:0x1B1D23,
  lineY:0xC9A84B, winWarm:0xEFE6C8, winCool:0xC3D6EA, wire:0x79819A,
  water:0x3FBFA8, gold:0xC9A84B, moss:0x5E7F5F, cream:0xF2EDE0
};
const YEAR_PINS = [
  { name:'The Work',     at:new THREE.Vector3(-20, 150, -330) },
  { name:'Packages',     at:new THREE.Vector3(395, 120, -215) },
  { name:'About Hayden', at:new THREE.Vector3(-330, 30,  180) },
  { name:'Get in touch', at:new THREE.Vector3(60,  18,  -110) }
];

const boot = document.getElementById('boot');
const bootbar = document.getElementById('bootbar');
const bootmsg = document.getElementById('bootmsg');
let step = 0; const STEPS = 6;
const tick = msg => { step++; bootbar.style.width = Math.round(step/STEPS*100)+'%'; if(msg) bootmsg.textContent = msg; };

/* ───────── renderer ───────── */
/* phones get a lighter build, and anything with no WebGL at all gets the plain page instead
 * of a dead black canvas — it is still a website, it just is not a world. */
const PHONE = matchMedia('(max-width:820px)').matches || navigator.maxTouchPoints > 1;
(function webglOrBust(){
  const c = document.createElement('canvas');
  const ok = !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  if(!ok){
    document.getElementById('boot').classList.add('gone');
    document.getElementById('fallback').classList.add('on');
    throw new Error('no webgl');
  }
})();

const renderer = new THREE.WebGLRenderer({ antialias:!PHONE, powerPreference:'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, PHONE ? 1.5 : 2));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.28;
renderer.shadowMap.enabled = !PHONE;                 // AskLex uses shadowMap 96 times; we had none
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('stage').appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x2B3152, 0.00030);
const camera = new THREE.PerspectiveCamera(46, innerWidth/innerHeight, 0.5, 9000);

/* ───────── loaders ───────── */
const texLoader = new THREE.TextureLoader();
function pbr(folder, file, repeat = 1, opts = {}) {
  const get = (suffix, srgb) => {
    const t = texLoader.load(`tex/${folder}/${file}_${suffix}.jpg`);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat, repeat);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  };
  return new THREE.MeshStandardMaterial(Object.assign({
    map: get('Color', true), normalMap: get('NormalGL'), roughnessMap: get('Roughness')
  }, opts));
}

/* ───────── the environment: the single biggest lever (AskLex: envMap x108) ───────── */
const pmrem = new THREE.PMREMGenerator(renderer);
pmrem.compileEquirectangularShader();
new RGBELoader().load('hdr/dikhololo_night_1k.hdr', hdr => {
  scene.environment = pmrem.fromEquirectangular(hdr).texture;
  scene.environmentIntensity = 0.9;
  hdr.dispose(); pmrem.dispose();
  tick('lighting the room');
}, undefined, () => tick('lighting the room'));

/* ───────── sky + stars ───────── */
scene.add(new THREE.Mesh(
  new THREE.SphereGeometry(5200, 32, 20),
  new THREE.ShaderMaterial({
    side:THREE.BackSide, depthWrite:false,
    uniforms:{ top:{value:new THREE.Color(C.skyTop)}, haze:{value:new THREE.Color(C.skyHaze)} },
    vertexShader:`varying float h; void main(){ h=normalize(position).y;
      gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);} `,
    fragmentShader:`varying float h; uniform vec3 top; uniform vec3 haze;
      void main(){ gl_FragColor=vec4(mix(haze,top,smoothstep(-0.06,0.42,h)),1.0);} `
  })));

(function stars(){
  const n=1500, pos=new Float32Array(n*3), sz=new Float32Array(n);
  for(let i=0;i<n;i++){
    const th=Math.random()*Math.PI*2, ph=Math.acos(Math.random()*0.92+0.04), r=4400;
    pos[i*3]=r*Math.sin(ph)*Math.cos(th); pos[i*3+1]=r*Math.cos(ph)*0.9+320; pos[i*3+2]=r*Math.sin(ph)*Math.sin(th);
    sz[i]=Math.random()<0.1?11:5+Math.random()*4;
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.BufferAttribute(pos,3));
  g.setAttribute('sz',new THREE.BufferAttribute(sz,1));
  scene.add(new THREE.Points(g,new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    vertexShader:`attribute float sz; varying float v; void main(){ v=sz;
      vec4 mv=modelViewMatrix*vec4(position,1.0); gl_PointSize=sz*(300.0/-mv.z);
      gl_Position=projectionMatrix*mv;} `,
    fragmentShader:`varying float v; void main(){ float d=length(gl_PointCoord-0.5);
      gl_FragColor=vec4(1.0,0.98,0.94,smoothstep(0.5,0.06,d)*(0.30+v*0.035));} `
  })));
})();

/* the moon — the real NASA LRO map, the same one AskLex uses. "A tad bit higher" (Hayden). */
(function moon(){
  const m = new THREE.Mesh(new THREE.SphereGeometry(150, 40, 28),
    new THREE.MeshBasicMaterial({ map: texLoader.load('tex/moon_lroc_1k.jpg'), fog:false }));
  m.position.set(1480, 1260, -3200); scene.add(m);
  const cv=document.createElement('canvas'); cv.width=cv.height=128;
  const x=cv.getContext('2d'), g=x.createRadialGradient(64,64,0,64,64,64);
  g.addColorStop(0,'#AFC4D8'); g.addColorStop(.35,'#AFC4D877'); g.addColorStop(1,'#AFC4D800');
  x.fillStyle=g; x.fillRect(0,0,128,128);
  const halo=new THREE.Sprite(new THREE.SpriteMaterial({ map:new THREE.CanvasTexture(cv),
    transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, opacity:.16, fog:false }));
  halo.scale.set(620,620,1); halo.position.copy(m.position); halo.position.z -= 40; scene.add(halo);
})();

/* ───────── light: AskLex runs ~70 light objects. We had 3. ───────── */
scene.add(new THREE.HemisphereLight(0x7E8CAD, 0x4C6030, 1.7));
scene.add(new THREE.AmbientLight(0x2A3246, 0.35));
const moonKey = new THREE.DirectionalLight(0xD2DEF2, 2.0);
moonKey.position.set(900, 760, -420);
moonKey.castShadow = true;
moonKey.shadow.mapSize.set(2048, 2048);
{ const c = moonKey.shadow.camera;            // a TIGHT frustum over the plaza, or it costs everything
  c.left=-520; c.right=520; c.top=520; c.bottom=-520; c.near=200; c.far=2200; c.updateProjectionMatrix(); }
scene.add(moonKey);
const rim = new THREE.DirectionalLight(0x7FA186, 0.5); rim.position.set(-700, 220, 500); scene.add(rim);

/* Everything built from here to the end of traffic is THE CITY. It is collected into one group
 * and hidden until you are through the screen — Hayden: "you can see the city in the background
 * before you even go to the computer, which shouldn't be a thing." A room shell cannot do this,
 * because the neighbourhood and the trees stand inside the room's own volume. */
const CITY_MARK = scene.children.length;
const city = new THREE.Group();

/* ───────── the ground: real grass, not a hex colour ───────── */
const grassMat = pbr('Grass004','Grass004_1K-JPG', 70, { color:new THREE.Color(0x7E9846), roughness:1 });
const ground = new THREE.Mesh(new THREE.PlaneGeometry(9000,9000,1,1).rotateX(-Math.PI/2), grassMat);
ground.position.y = -0.2; ground.receiveShadow = true; scene.add(ground);
tick('laying the ground');

/* ───────── roads ───────── */
const asphaltMat = pbr('Asphalt033','Asphalt033_1K-JPG', 26, { color:new THREE.Color(C.asphalt), roughness:.92 });
function road(pts, w){
  const curve = new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(p[0],0.6,p[1])));
  const n=240, verts=[], uvs=[], idx=[];
  for(let i=0;i<=n;i++){
    const t=i/n, P=curve.getPoint(t), T=curve.getTangent(t);
    const N=new THREE.Vector3(-T.z,0,T.x).normalize().multiplyScalar(w/2);
    verts.push(P.x-N.x,0.6,P.z-N.z, P.x+N.x,0.6,P.z+N.z);
    uvs.push(0,t*40, 1,t*40);
    if(i<n){ const a=i*2; idx.push(a,a+1,a+2, a+1,a+3,a+2); }
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  g.setIndex(idx); g.computeVertexNormals();
  const m=new THREE.Mesh(g, asphaltMat); m.receiveShadow=true; scene.add(m);
  const dash=new THREE.InstancedMesh(new THREE.PlaneGeometry(1.5,11).rotateX(-Math.PI/2),
    new THREE.MeshBasicMaterial({color:C.lineY,toneMapped:false}), 150);
  const d=new THREE.Object3D();
  for(let i=0;i<150;i++){ const t=i/150,P=curve.getPoint(t),T=curve.getTangent(t);
    d.position.set(P.x,1.0,P.z); d.rotation.y=Math.atan2(T.x,T.z); d.updateMatrix(); dash.setMatrixAt(i,d.matrix); }
  scene.add(dash);
  return curve;
}
const mainRoad = road([[-760,560],[-470,300],[-330,70],[-250,-180],[-60,-430],[290,-560],[720,-620]], 17);
road([[-900,-60],[-420,-40],[60,20],[520,90],[980,120]], 13);

/* ───────── the plaza + pool ───────── */
(function plaza(){
  const slab=new THREE.Mesh(new THREE.BoxGeometry(400,1.6,330),
    pbr('PavingStones131','PavingStones131_1K-JPG', 22, {color:new THREE.Color(0x7B8089),roughness:.8,envMapIntensity:1.2}));
  slab.position.set(30,0.8,-150); slab.receiveShadow=true; scene.add(slab);
  const pool=new THREE.Mesh(new THREE.CircleGeometry(54,64).rotateX(-Math.PI/2),
    new THREE.MeshStandardMaterial({color:0x0E2A28,roughness:.08,metalness:.7,
      emissive:new THREE.Color(C.water),emissiveIntensity:.11,envMapIntensity:1.4}));
  pool.position.set(60,2.0,-110); scene.add(pool);
  for(let i=0;i<6;i++){                       // pool light, the kind AskLex has pooling on the stone
    const a=i/6*Math.PI*2;
    const L=new THREE.PointLight(C.water, 14, 170, 2);
    L.position.set(60+Math.cos(a)*42, 8, -110+Math.sin(a)*42); scene.add(L);
  }
})();

/* ───────── buildings ───────── */
const concreteMat = pbr('Concrete034','Concrete034_1K-JPG', 4, {color:new THREE.Color(C.concrete),roughness:.72,envMapIntensity:1.3});
const glassMat = new THREE.MeshStandardMaterial({color:0x1C2130,roughness:.11,metalness:.68,envMapIntensity:2.1});
const WIN_GEO = new THREE.PlaneGeometry(1,1);
const winXf=[], winCol=[]; const tmp=new THREE.Object3D(), tc=new THREE.Color();

function windows(x,y0,z,w,h,d,density,cool){
  const rows=Math.max(3,Math.floor(h/6.6));
  // the camera looks down -Z: the lit faces must be the ones turned TOWARD it (+Z and the sides)
  const faces=[{n:[0,0,1],sw:w,off:[0,0,d/2+0.25]},{n:[0,0,-1],sw:w,off:[0,0,-d/2-0.25]},
               {n:[1,0,0],sw:d,off:[w/2+0.25,0,0]},{n:[-1,0,0],sw:d,off:[-w/2-0.25,0,0]}];
  faces.forEach(f=>{
    const fc=Math.max(2,Math.floor(f.sw/5.4));
    for(let r=0;r<rows;r++){
      if(Math.random()<0.09) continue;
      for(let c=0;c<fc;c++){
        if(Math.random()>density) continue;
        const u=(c+0.5)/fc-0.5;
        tmp.position.set(x+f.off[0]+(f.n[0]?0:u*f.sw), y0+(r+0.5)*(h/rows), z+f.off[2]+(f.n[2]?0:u*f.sw));
        tmp.rotation.set(0, Math.atan2(f.n[0],f.n[2]), 0);
        tmp.scale.set(3.3,2.7,1); tmp.updateMatrix(); winXf.push(tmp.matrix.clone());
        tc.setHex((cool?Math.random()<0.45:Math.random()<0.90)?C.winWarm:C.winCool);
        const v=0.78+Math.random()*0.22; winCol.push(tc.r*v,tc.g*v,tc.b*v);
      }
    }
  });
}
function lattice(x,z,w,h,d,round){
  const geo=round?new THREE.CylinderGeometry(w/2,w/2,h,26):new THREE.BoxGeometry(w,h,d);
  const m=new THREE.Mesh(geo,glassMat); m.position.set(x,h/2,z); m.castShadow=true; scene.add(m);
  const seg=[], rows=Math.round(h/7.2), cols=round?26:Math.round(w/7.2);
  if(round){
    for(let r=0;r<=rows;r++){ const y=r*(h/rows);
      for(let c=0;c<cols;c++){ const a=c/cols*Math.PI*2,b=(c+1)/cols*Math.PI*2,R=w/2+0.3;
        seg.push(Math.cos(a)*R,y,Math.sin(a)*R, Math.cos(b)*R,y,Math.sin(b)*R); } }
    for(let c=0;c<cols;c++){ const a=c/cols*Math.PI*2,R=w/2+0.3;
      seg.push(Math.cos(a)*R,0,Math.sin(a)*R, Math.cos(a)*R,h,Math.sin(a)*R); }
  } else {
    const hw=w/2+0.3, hd=d/2+0.3;
    for(let r=0;r<=rows;r++){ const y=r*(h/rows);
      seg.push(-hw,y,hd,hw,y,hd, -hw,y,-hd,hw,y,-hd, -hw,y,-hd,-hw,y,hd, hw,y,-hd,hw,y,hd); }
    for(let c=0;c<=cols;c++){ const u=-hw+c*(w/cols); seg.push(u,0,hd,u,h,hd, u,0,-hd,u,h,-hd); }
    const dc=Math.max(1,Math.round(d/7.2));
    for(let c=0;c<=dc;c++){ const v=-hd+c*(d/dc); seg.push(hw,0,v,hw,h,v, -hw,0,v,-hw,h,v); }
  }
  const lg=new THREE.BufferGeometry();
  lg.setAttribute('position',new THREE.Float32BufferAttribute(seg,3));
  const L=new THREE.LineSegments(lg,new THREE.LineBasicMaterial({color:C.wire,transparent:true,opacity:.7}));
  L.position.set(x,0,z); scene.add(L);
}
function tower(x,z,w,h,d,density,cool){
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d), concreteMat);
  m.position.set(x,h/2,z); m.castShadow=true; m.receiveShadow=true; scene.add(m);
  const cap=new THREE.Mesh(new THREE.BoxGeometry(w*1.04,5,d*1.04),
    new THREE.MeshStandardMaterial({color:C.concDark,roughness:.9}));
  cap.position.set(x,h+1.5,z); scene.add(cap);
  if(Math.random()<0.45){                       // a mast, so the skyline is not a row of flat blocks
    const mast=new THREE.Mesh(new THREE.CylinderGeometry(0.6,1.4,18+Math.random()*26,6),
      new THREE.MeshStandardMaterial({color:0x555C68,roughness:.6,metalness:.4}));
    mast.position.set(x,h+14,z); scene.add(mast);
  }
  windows(x,4,z,w,h-10,d,density,cool);
}
const SKYLINE=[
  [-330,-470,54,190,54,'c'],[-262,-420,46,150,46,'c'],[-196,-560,62,212,50,'l'],[-112,-498,48,164,44,'s'],
  [-44,-620,70,236,56,'l'],[36,-540,44,148,44,'s'],[112,-600,58,204,50,'s'],[186,-516,50,172,46,'l'],
  [258,-596,66,224,54,'s'],[336,-500,44,142,42,'s'],[410,-586,56,186,50,'l'],[486,-498,48,156,44,'s'],
  [-404,-556,50,168,48,'s'],[-470,-470,42,132,42,'s'],[-540,-560,54,178,48,'l'],[560,-566,52,166,48,'s'],
  [634,-480,44,128,42,'s'],[-612,-470,46,124,44,'s'],[-300,-250,56,92,52,'s'],[-372,-150,48,72,46,'s'],
  [306,-270,54,96,50,'s'],[384,-166,46,78,44,'s'],[-300,-700,58,150,52,'s'],[200,-740,54,140,50,'s'],
  [-80,-790,62,162,56,'l'],[420,-760,48,120,46,'s'],[-520,-740,50,128,48,'s'],[660,-700,46,112,44,'s']
];
let litCount = 0;
SKYLINE.forEach(([x,z,w,h,d,k])=>{
  if(litCount < 9 && Math.random() < 0.4){        // nine towers light their own block
    const L=new THREE.PointLight(C.winWarm, 26, 300, 2);
    L.position.set(x, h*0.55, z + d/2 + 20); scene.add(L); litCount++;
  }
  if(k==='s') tower(x,z,w,h,d,0.88,Math.random()<0.3);
  else lattice(x,z,w,h,d,k==='c');
});
tick('raising the city');

/* ───────── Space Needle — our anchor where AskLex has the Lotus Tower ───────── */
const steelMat = pbr('Metal063','Metal063_1K-JPG', 2, {color:0x5A6472,roughness:.5,metalness:.55,envMapIntensity:1.3});
(function needle(){
  const g=new THREE.Group(); g.position.set(-20,0,-330);
  const pale=new THREE.MeshStandardMaterial({color:0x8E9AA6,roughness:.45,metalness:.35,envMapIntensity:1.4});
  for(let i=0;i<3;i++){
    const leg=new THREE.Mesh(new THREE.CylinderGeometry(2.0,4.6,118,10), steelMat);
    const a=i/3*Math.PI*2;
    leg.position.set(Math.cos(a)*11,59,Math.sin(a)*11);
    leg.rotation.z=-Math.cos(a)*0.095; leg.rotation.x=Math.sin(a)*0.095;
    leg.castShadow=true; g.add(leg);
  }
  const core=new THREE.Mesh(new THREE.CylinderGeometry(3.4,5.2,122,14), steelMat); core.position.y=61; core.castShadow=true; g.add(core);
  const su=new THREE.Mesh(new THREE.CylinderGeometry(30,18,9,36), pale); su.position.y=126; su.castShadow=true; g.add(su);
  const sl=new THREE.Mesh(new THREE.CylinderGeometry(18,30,10,36), pale); sl.position.y=116; g.add(sl);
  const halo=new THREE.Mesh(new THREE.CylinderGeometry(30.4,30.4,3,36),
    new THREE.MeshBasicMaterial({color:C.winWarm,toneMapped:false})); halo.position.y=121.5; g.add(halo);
  const roof=new THREE.Mesh(new THREE.CylinderGeometry(13,20,6,30), pale); roof.position.y=134; g.add(roof);
  const mast=new THREE.Mesh(new THREE.CylinderGeometry(0.6,1.6,48,8), steelMat); mast.position.y=160; g.add(mast);
  const tip=new THREE.Mesh(new THREE.SphereGeometry(1.5,10,8),
    new THREE.MeshBasicMaterial({color:0xFF5C4A,toneMapped:false})); tip.position.y=186; g.add(tip);
  const base=new THREE.Mesh(new THREE.CylinderGeometry(46,52,3,40),
    pbr('PavingStones131','PavingStones131_1K-JPG',6,{color:new THREE.Color(C.stone),roughness:.85}));
  base.position.y=1.5; base.receiveShadow=true; g.add(base);
  // a RectAreaLight ring under the saucer: panel light is what makes a lit thing light its surroundings
  for(let i=0;i<4;i++){
    const a=i/4*Math.PI*2;
    const L=new THREE.PointLight(C.winWarm, 60, 420, 2);
    L.position.set(Math.cos(a)*26, 118, Math.sin(a)*26); g.add(L);
  }
  scene.add(g);
})();

/* ───────── Mount Rainier, back right (Hayden) ───────── */
(function rainier(){
  const G = new THREE.Group(); G.position.set(2600, 0, -5200);
  const rock = new THREE.MeshStandardMaterial({color:0x2B3450,roughness:1,flatShading:true,fog:true});
  const main = new THREE.Mesh(new THREE.ConeGeometry(2100, 1450, 11), rock);
  main.position.y = 700; G.add(main);
  const shoulder = new THREE.Mesh(new THREE.ConeGeometry(1250, 760, 9), rock);
  shoulder.position.set(-1500, 360, 420); G.add(shoulder);
  const snow = new THREE.Mesh(new THREE.ConeGeometry(760, 520, 11),
    new THREE.MeshStandardMaterial({color:0xA9BCD6,roughness:.85,flatShading:true,envMapIntensity:1.4}));
  snow.position.y = 1160; G.add(snow);
  scene.add(G);
})();

/* ───────── houses, trees and street lights ───────── */
const wallMat = pbr('Concrete034','Concrete034_1K-JPG', 2, {color:0x8A909E,roughness:.9});
const roofMat = new THREE.MeshStandardMaterial({color:0x4E5564,roughness:.95});
const leafMat = new THREE.MeshStandardMaterial({color:0x2C3F26,roughness:1,flatShading:true});
const barkMat = new THREE.MeshStandardMaterial({color:0x2A2520,roughness:1});
function house(x,z,s,rot){
  const g=new THREE.Group();
  const body=new THREE.Mesh(new THREE.BoxGeometry(16*s,11*s,13*s), wallMat);
  body.position.y=5.5*s; body.castShadow=true; body.receiveShadow=true; g.add(body);
  const roof=new THREE.Mesh(new THREE.ConeGeometry(12.4*s,6.4*s,4), roofMat);
  roof.position.y=14.2*s; roof.rotation.y=Math.PI/4; roof.castShadow=true; g.add(roof);
  g.position.set(x,0,z); g.rotation.y=rot; scene.add(g);
  windows(x,2.4*s,z,15*s,8*s,12*s,0.5,false);
}
function tree(x,z,s){
  const t=new THREE.Mesh(new THREE.CylinderGeometry(0.7*s,1.1*s,7*s,6), barkMat);
  t.position.set(x,3.5*s,z); scene.add(t);
  const c=new THREE.Mesh(new THREE.SphereGeometry(5.4*s,9,7), leafMat);
  c.position.set(x,11*s,z); c.scale.y=1.25; c.castShadow=true; scene.add(c);
}
for(let i=0;i<78;i++){
  const side=i%2?1:-1;
  const x=side*(150+Math.random()*700)+(Math.random()-.5)*180, z=-90+Math.random()*640;
  if(Math.abs(x)<150 && z<60) continue;
  house(x,z,0.8+Math.random()*0.9,Math.random()*Math.PI*2);
}
for(let i=0;i<210;i++){
  const a=Math.random()*Math.PI*2, r=190+Math.random()*1100;
  const x=Math.cos(a)*r, z=Math.sin(a)*r+120;
  if(Math.abs(x)<190 && z<40 && z>-380) continue;
  tree(x,z,0.85+Math.random()*1.15);
}
for(let i=0;i<26;i++) tree(-820+Math.random()*1640, 330+Math.random()*180, 1.3+Math.random()*0.8);
// a near treeline so the bottom of the frame is not bare field (the reference has one)
for(let i=0;i<34;i++) tree(-1100+Math.random()*2200, 470+Math.random()*190, 1.5+Math.random()*1.1);
// and a low hedge along the plaza's near edge, catching the plaza light
(function hedge(){
  const geo=new THREE.BoxGeometry(14,7,9);
  const mesh=new THREE.InstancedMesh(geo, leafMat, 46); const o=new THREE.Object3D();
  for(let i=0;i<46;i++){
    o.position.set(-240+i*15.5, 3.5, 34+Math.sin(i*0.7)*5);
    o.rotation.y=Math.random()*0.5; o.scale.setScalar(0.85+Math.random()*0.5);
    o.updateMatrix(); mesh.setMatrixAt(i,o.matrix);
  }
  mesh.castShadow=true; scene.add(mesh);
})();

// street lights down the main road: a pole, a warm disc and a real PointLight each
for(let i=0;i<(PHONE?8:18);i++){
  const t=i/(PHONE?8:18), P=mainRoad.getPoint(t), T=mainRoad.getTangent(t);
  const N=new THREE.Vector3(-T.z,0,T.x).normalize().multiplyScalar(13);
  const pole=new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.7,16,6), steelMat);
  pole.position.set(P.x+N.x,8,P.z+N.z); scene.add(pole);
  const lamp=new THREE.Mesh(new THREE.SphereGeometry(1.5,8,6),
    new THREE.MeshBasicMaterial({color:0xFFEFC8,toneMapped:false}));
  lamp.position.set(P.x+N.x,16.4,P.z+N.z); scene.add(lamp);
  const L=new THREE.PointLight(0xFFE0A0, 55, 150, 2);
  L.position.set(P.x+N.x,16,P.z+N.z); scene.add(L);
}
tick('lighting the streets');

/* one InstancedMesh for every window in the city */
const winMesh = new THREE.InstancedMesh(WIN_GEO,
  new THREE.MeshBasicMaterial({vertexColors:true,toneMapped:false,side:THREE.DoubleSide}), winXf.length);
winXf.forEach((m,i)=>winMesh.setMatrixAt(i,m));
winMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(winCol),3);
scene.add(winMesh);

/* traffic */
const CARS=[];
(function traffic(){
  const body=new THREE.BoxGeometry(2.6,2.0,5.6);
  for(let i=0;i<22;i++){
    const m=new THREE.Mesh(body,new THREE.MeshStandardMaterial({
      color:[0x9AA2AE,0x6E7480,0xB7483A,0x3F566E][i%4],roughness:.4,metalness:.5,envMapIntensity:1.4}));
    m.castShadow=true; scene.add(m);
    CARS.push({m,t:Math.random(),v:(0.00018+Math.random()*0.00014)*(i%2?1:-1),off:(i%2?1:-1)*4.4});
  }
})();

/* ───────── district landmarks ─────────
 * Hayden wants the city to BE the navigation — "like a video game." Four pins over four
 * identical blocks is not that, so each district gets something you can recognise from the air.
 */

/* Packages — the HJS board, where AskLex puts its own sign */
(function board(){
  const cv=document.createElement('canvas'); cv.width=1024; cv.height=640;
  const x=cv.getContext('2d');
  x.fillStyle='#101A13'; x.fillRect(0,0,1024,640);
  x.strokeStyle='#C9A84B'; x.lineWidth=7; x.strokeRect(26,26,972,588);
  x.fillStyle='#F2EDE0'; x.textAlign='center';
  x.font='600 148px Poppins, system-ui, sans-serif';
  x.fillText('HJS', 512, 252); x.fillText('Designs', 512, 398);
  x.fillStyle='#C9A84B'; x.fillRect(250, 436, 524, 6);
  x.font='500 38px Poppins, system-ui, sans-serif'; x.letterSpacing='12px';
  x.fillText('PLATEAU WEBSITES', 512, 518);
  const t=new THREE.CanvasTexture(cv); t.colorSpace=THREE.SRGBColorSpace;
  const panel=new THREE.Mesh(new THREE.PlaneGeometry(190,119),
    new THREE.MeshBasicMaterial({map:t,toneMapped:false}));
  panel.position.set(395,118,-215); panel.rotation.y=-0.46; scene.add(panel);
  const frame=new THREE.Mesh(new THREE.BoxGeometry(206,134,5),
    new THREE.MeshStandardMaterial({color:C.gold,roughness:.35,metalness:.6,
      emissive:new THREE.Color(C.gold),emissiveIntensity:.12,envMapIntensity:1.6}));
  frame.position.set(397,118,-217); frame.rotation.y=-0.46; frame.castShadow=true; scene.add(frame);
  [-70,0,70].forEach(o=>{
    const leg=new THREE.Mesh(new THREE.BoxGeometry(5,118,5),
      new THREE.MeshStandardMaterial({color:C.gold,roughness:.45,metalness:.55}));
    leg.position.set(395+Math.cos(-0.46)*o, 59, -215-Math.sin(-0.46)*o);
    leg.castShadow=true; scene.add(leg);
  });
  for(let i=-1;i<=1;i++){                       // the sign lights its own ground
    const L=new THREE.PointLight(C.gold, 70, 320, 2);
    L.position.set(395+i*60, 150, -195); scene.add(L);
  }
})();

/* The Work — the tallest tower, crowned, so the eye lands on it from anywhere */
(function workTower(){
  const h=286, w=58, d=52;
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d), concreteMat);
  m.position.set(-20,h/2,-640); m.castShadow=true; scene.add(m);
  windows(-20,4,-640,w,h-16,d,0.9,false);
  const crown=new THREE.Mesh(new THREE.CylinderGeometry(w*0.62,w*0.52,10,24),
    new THREE.MeshStandardMaterial({color:0x8E9AA6,roughness:.4,metalness:.45,envMapIntensity:1.6}));
  crown.position.set(-20,h+6,-640); scene.add(crown);
  const ring=new THREE.Mesh(new THREE.CylinderGeometry(w*0.64,w*0.64,2.6,24),
    new THREE.MeshBasicMaterial({color:C.winWarm,toneMapped:false}));
  ring.position.set(-20,h+2,-640); scene.add(ring);
  const L=new THREE.PointLight(C.winWarm, 120, 520, 2); L.position.set(-20,h+8,-640); scene.add(L);
})();

/* About Hayden — a lit workshop in the neighbourhood, not another block */
(function workshop(){
  const g=new THREE.Group(); g.position.set(-330,0,180); g.rotation.y=0.42;
  const body=new THREE.Mesh(new THREE.BoxGeometry(46,26,34), wallMat);
  body.position.y=13; body.castShadow=true; body.receiveShadow=true; g.add(body);
  const roof=new THREE.Mesh(new THREE.ConeGeometry(34,15,4), roofMat);
  roof.position.y=33; roof.rotation.y=Math.PI/4; roof.castShadow=true; g.add(roof);
  const win=new THREE.Mesh(new THREE.PlaneGeometry(30,13),
    new THREE.MeshBasicMaterial({color:0xFFE9BC,toneMapped:false}));
  win.position.set(0,14,17.2); g.add(win);
  const L=new THREE.PointLight(0xFFD79A, 90, 300, 2); L.position.set(0,16,26); g.add(L);
  scene.add(g);
})();

/* fold the city into its group and put it away until the portal */
scene.children.slice(CITY_MARK).forEach(o => city.add(o));
city.visible = false;
scene.add(city);

/* ═══════════ the way in: a blank room, a closed laptop, and ONE camera move ═══════════
 * Hayden's notes, in his order: start a lot higher up and further out · a BLANK room, no
 * flashing lights · the lid opens fully BEFORE the camera moves · sit there about half a second ·
 * then one continuous motion at one speed, straight into the screen · the ENTIRE screen is the
 * portal · you come out already at altitude over the city, with no jump cut.
 */
const LAP = new THREE.Vector3(-40, 86, 520);     // where the laptop sits, on the camera's path
const PASS_Z = 518;                              // the screen plane
const CAM_A = new THREE.Vector3(-40, 430, 742);  // high and far back, looking steeply down
const CAM_B = new THREE.Vector3(-40, 95, 604);   // square on to the open screen
const CAM_C = new THREE.Vector3(-40, 90, 470);   // through it
const CAM_D = PHONE ? new THREE.Vector3(-30, 118, 330) : new THREE.Vector3(-40, 132, 430);   // the city, at the framing sampled off his frame
const LOOK_SCREEN = new THREE.Vector3(-40, 92, 520);
const LOOK_CITY   = PHONE ? new THREE.Vector3(0, 104, -300) : new THREE.Vector3(0, 74, -240);

const camPath  = new THREE.CatmullRomCurve3([CAM_A, CAM_B, CAM_C, CAM_D], false, 'catmullrom', 0.0);
const lookPath = new THREE.CatmullRomCurve3(
  [LOOK_SCREEN, LOOK_SCREEN, LOOK_CITY.clone().lerp(LOOK_SCREEN,0.25), LOOK_CITY], false, 'catmullrom', 0.0);

/* the blank room: a dark shell around the laptop that hides the city until you are through */
const room = new THREE.Group();
(function buildRoom(){
  const shell = new THREE.Mesh(new THREE.BoxGeometry(1200, 700, 900),
    new THREE.MeshStandardMaterial({ color:0x0C1016, roughness:1, metalness:0, side:THREE.BackSide }));
  shell.position.set(-40, 180, 560); room.add(shell);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(1200, 900).rotateX(-Math.PI/2),
    pbr('Ground037','Ground037_1K-JPG', 10, { color:0x10151C, roughness:1 }));
  floor.position.set(-40, 0.5, 560); floor.receiveShadow = true; room.add(floor);
  const key = new THREE.DirectionalLight(0xC8D4EC, 1.5); key.position.set(60, 320, 760);
  key.castShadow = true; key.shadow.mapSize.set(1024,1024);
  { const c=key.shadow.camera; c.left=-180;c.right=180;c.top=180;c.bottom=-180;c.near=50;c.far=700;c.updateProjectionMatrix(); }
  room.add(key);
  room.add(new THREE.HemisphereLight(0x3A4356, 0x0A0E14, 0.5));
  scene.add(room);
})();

/* the laptop. The display is mounted on the INSIDE of the lid — on a real laptop the screen faces
 * the keyboard when it is shut. Getting this backwards is what hid the card in every early cut. */
const laptop = new THREE.Group(); laptop.position.copy(LAP);
const hinge  = new THREE.Group();
(function buildLaptop(){
  const alu = new THREE.MeshStandardMaterial({ color:0xB8BCC2, roughness:.34, metalness:.85, envMapIntensity:1.6 });
  const W = 52, Dp = 36, T = 1.8;
  const base = new THREE.Mesh(new THREE.BoxGeometry(W, T, Dp), alu);
  base.position.set(0, T/2, 0); base.castShadow = true; base.receiveShadow = true; laptop.add(base);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(W*0.82, 0.25, Dp*0.52),
    new THREE.MeshStandardMaterial({ color:0x15181C, roughness:.7 }));
  deck.position.set(0, T+0.14, -2.4); laptop.add(deck);

  hinge.position.set(0, T, -Dp/2);
  const lid = new THREE.Mesh(new THREE.BoxGeometry(W, Dp*0.94, 1.2), alu);
  lid.position.set(0, Dp*0.47, -0.6); lid.castShadow = true; hinge.add(lid);
  // the display, on the inside face (+Z of the lid's local space)
  const card = texLoader.load('tex/hjs-screen-plate.png');
  card.colorSpace = THREE.SRGBColorSpace;
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(W*0.92, Dp*0.86),
    new THREE.MeshStandardMaterial({ map:card, emissive:0xffffff, emissiveMap:card,
      emissiveIntensity:0, roughness:.35, toneMapped:true }));
  panel.position.set(0, Dp*0.47, 0.06); hinge.add(panel);
  laptop.userData.panel = panel;
  hinge.rotation.x = 0;                     // shut
  laptop.add(hinge);
  // the glow the open screen throws back into the room
  const screenLight = new THREE.PointLight(0xEFE6C8, 0, 220, 2);
  screenLight.position.set(0, 24, 6); laptop.add(screenLight);
  laptop.userData.light = screenLight;
  scene.add(laptop);
})();
tick('setting the room');

/* ───────── the sequence ───────── */
const LID_SHUT = -Math.PI/2;                        // lid flat over the keyboard, screen facing it
const LID_OPEN = THREE.MathUtils.degToRad(15);      // leaning 105° back from the base, like a real one
hinge.rotation.x = LID_SHUT;

const OPEN_MS = 1300, HOLD_MS = 550, TRAVEL_MS = 7200;
let phase = 'shut', t0 = 0, travelT = 0, passed = false, done = false;

camera.position.copy(CAM_A);
camera.lookAt(LOOK_SCREEN);

const invite = document.getElementById('invite');
const hit = document.getElementById('hit');
const flash = document.getElementById('flash');
const worldUI = document.getElementById('world');
const hint = document.getElementById('hint');

const controls = new OrbitControls(camera, renderer.domElement);
controls.enabled = false;
controls.target.copy(LOOK_SCREEN);
controls.enableDamping = true; controls.dampingFactor = .055;
controls.minDistance = 90; controls.maxDistance = 900;
controls.maxPolarAngle = Math.PI*0.502; controls.minPolarAngle = Math.PI*0.26;
controls.rotateSpeed = .42; controls.zoomSpeed = .7; controls.enablePan = false;

const easeOut = x => 1 - Math.pow(1-x, 3);

function begin(){
  if(phase !== 'shut') return;
  phase = 'opening'; t0 = performance.now();
  invite.classList.remove('on'); hit.classList.remove('on');
}
hit.addEventListener('click', begin);

function portal(){
  if(passed) return; passed = true;
  flash.animate([{opacity:0},{opacity:.92,offset:.26},{opacity:0}], {duration:700, easing:'ease-out'});
  city.visible = true;                          // the first time the city is ever on screen
  scene.remove(room); scene.remove(laptop);     // the blank room's job is done
  worldUI.classList.add('on');
  PINS.forEach(p => p.el.style.opacity = '1');
}

/* ───────── the district pins ───────── */
const pinBox = document.getElementById('world');
const panels = mountPanels();
const PINS = YEAR_PINS.map(d => {
  const el = document.createElement('button');
  el.className = 'pin'; el.type = 'button';
  el.innerHTML = '<i></i>' + d.name;
  el.onclick = () => {
    const dir = camera.position.clone().sub(d.at).setY(0).normalize().multiplyScalar(250);
    fly(d.at.clone().add(dir).setY(d.at.y*0.55 + 42), d.at);
    panels.open(d.name);          // flying there is half of it; the content is the other half
  };
  pinBox.appendChild(el);
  return { at:d.at, el };
});
let flying = null;
function fly(pos, tgt){ flying = { p0:camera.position.clone(), p1:pos, t0:controls.target.clone(), t1:tgt.clone(), k:0 }; }

/* ───────── post: a restrained bloom, matched to his reference ───────── */
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.46, 0.55, 0.58));
composer.addPass(new OutputPass());

/* ───────── loop ───────── */
const v = new THREE.Vector3();
let last = performance.now();
function frame(now){
  requestAnimationFrame(frame);
  const dt = Math.min((now - last)/1000, 0.05); last = now;

  if(phase === 'opening'){
    const k = Math.min(1, (now - t0)/OPEN_MS), e = easeOut(k);
    hinge.rotation.x = LID_SHUT + (LID_OPEN - LID_SHUT) * e;
    laptop.userData.panel.material.emissiveIntensity = e * 1.0;
    laptop.userData.light.intensity = e * 140;
    if(k >= 1){ phase = 'hold'; t0 = now; }
  } else if(phase === 'hold'){
    if(now - t0 >= HOLD_MS){ phase = 'travel'; t0 = now; }
  } else if(phase === 'travel'){
    travelT = Math.min(1, (now - t0)/TRAVEL_MS);   // LINEAR: one speed the whole way, no easing
    camera.position.copy(camPath.getPoint(travelT));
    camera.lookAt(lookPath.getPoint(travelT));
    if(!passed && camera.position.z <= PASS_Z) portal();
    if(travelT >= 1){
      phase = 'free'; done = true;
      controls.target.copy(LOOK_CITY);
      controls.enabled = true;
    }
  }

  if(flying){
    flying.k = Math.min(1, flying.k + 0.022);
    const e = easeOut(flying.k);
    camera.position.lerpVectors(flying.p0, flying.p1, e);
    controls.target.lerpVectors(flying.t0, flying.t1, e);
    if(flying.k >= 1) flying = null;
  }

  CARS.forEach(c => {
    c.t = (c.t + c.v + 1) % 1;
    const P = mainRoad.getPoint(c.t), T = mainRoad.getTangent(c.t);
    const N = new THREE.Vector3(-T.z,0,T.x).normalize().multiplyScalar(c.off);
    c.m.position.set(P.x+N.x, 1.8, P.z+N.z);
    c.m.rotation.y = Math.atan2(T.x, T.z) + (c.v<0 ? Math.PI : 0);
  });

  if(controls.enabled) controls.update();

  if(done){
    PINS.forEach(p => {
      v.copy(p.at).project(camera);
      const on = v.z < 1 && Math.abs(v.x) < 1.08 && Math.abs(v.y) < 1.08;
      p.el.style.display = on ? 'block' : 'none';
      if(on){ p.el.style.left = ((v.x*.5+.5)*innerWidth)+'px'; p.el.style.top = ((-v.y*.5+.5)*innerHeight)+'px'; }
    });
  }
  composer.render();
}

addEventListener('resize', () => {
  camera.aspect = innerWidth/innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight);
});
let hintHidden = false;
controls.addEventListener('start', () => { if(!hintHidden){ hintHidden = true; hint.style.opacity = 0; } });

/* reduced motion: no flight, you simply arrive */
if(matchMedia('(prefers-reduced-motion: reduce)').matches){
  hit.addEventListener('click', () => {
    hinge.rotation.x = LID_OPEN;
    camera.position.copy(CAM_D); camera.lookAt(LOOK_CITY);
    portal(); phase = 'free'; done = true;
    controls.target.copy(LOOK_CITY); controls.enabled = true;
  }, { capture:true });
}

/* skip: the whole point of the intro is the first time. Returning visitors should not be made
 * to sit through it again, and some people never want it. */
const skipBtn = document.getElementById('skip');
function arrive(){
  hinge.rotation.x = LID_OPEN;
  camera.position.copy(CAM_D); camera.lookAt(LOOK_CITY);
  portal();
  phase = 'free'; done = true; travelT = 1;
  controls.target.copy(LOOK_CITY); controls.enabled = true;
  skipBtn.classList.remove('on');
  invite.classList.remove('on'); hit.classList.remove('on');
  try { sessionStorage.setItem('hjs-seen', '1'); } catch(e) {}
}
skipBtn.addEventListener('click', arrive);
hit.addEventListener('click', () => setTimeout(() => skipBtn.classList.add('on'), 600));

tick('ready');
requestAnimationFrame(frame);
setTimeout(() => {
  boot.classList.add('gone');
  let seen = false; try { seen = sessionStorage.getItem('hjs-seen') === '1'; } catch(e) {}
  if(seen) return arrive();          // you have already taken the ride this visit
  invite.classList.add('on');
  hit.classList.add('on');
}, 900);
