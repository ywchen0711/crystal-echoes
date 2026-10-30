// HD-2D look: pixel sprites in a lit 3D diorama, with bloom, tilt-shift blur and a soft colour grade.
import * as THREE from '../lib/three.module.min.js';
import { EffectComposer } from '../lib/addons/EffectComposer.js';
import { RenderPass } from '../lib/addons/RenderPass.js';
import { UnrealBloomPass } from '../lib/addons/UnrealBloomPass.js';
import { OutputPass } from '../lib/addons/OutputPass.js';
import { ShaderPass } from '../lib/addons/ShaderPass.js';
import { texFrom } from './pixel.js';
import { Pass, FullScreenQuad } from '../lib/addons/Pass.js';

// characters and monsters live on their own layer so they can be drawn as crisp, outlined pixel art
export const CHAR_LAYER = 2;

export { THREE };

const TiltShift = {
  uniforms: { tDiffuse: { value: null }, res: { value: new THREE.Vector2(1, 1) }, dir: { value: new THREE.Vector2(1, 0) }, focus: { value: 0.48 }, band: { value: 0.16 }, amount: { value: 2.2 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 res, dir; uniform float focus, band, amount; varying vec2 vUv;
    void main(){
      float d = max(0.0, abs(vUv.y - focus) - band);
      float r = clamp(d * 4.0, 0.0, 1.0) * amount;
      vec2 st = dir / res * r;
      vec4 c = texture2D(tDiffuse, vUv) * 0.2270270270;
      c += texture2D(tDiffuse, vUv + st * 1.3846153846) * 0.3162162162;
      c += texture2D(tDiffuse, vUv - st * 1.3846153846) * 0.3162162162;
      c += texture2D(tDiffuse, vUv + st * 3.2307692308) * 0.0702702703;
      c += texture2D(tDiffuse, vUv - st * 3.2307692308) * 0.0702702703;
      gl_FragColor = c;
    }`,
};
const Grade = {
  uniforms: { tDiffuse: { value: null }, sat: { value: 1.1 }, contrast: { value: 1.1 }, tint: { value: new THREE.Vector3(1.02, 1.0, 0.97) }, vig: { value: 0.6 }, fade: { value: 0 }, flash: { value: 0 }, flashColor: { value: new THREE.Vector3(1, 1, 1) }, gray: { value: 0 } },
  vertexShader: TiltShift.vertexShader,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float sat, contrast, vig, fade, flash, gray; uniform vec3 tint, flashColor; varying vec2 vUv;
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      float l = dot(c.rgb, vec3(0.299, 0.587, 0.114));
      c.rgb = mix(vec3(l), c.rgb, sat * (1.0 - gray));
      c.rgb = (c.rgb - 0.5) * contrast + 0.5;
      c.rgb *= tint;
      // split toning: cool shadows, warm highlights (the HD-2D storybook look)
      float l2 = dot(c.rgb, vec3(0.299, 0.587, 0.114));
      c.rgb += mix(vec3(-0.015, 0.0, 0.045), vec3(0.035, 0.018, -0.025), smoothstep(0.15, 0.85, l2)) * (1.0 - gray);
      vec2 d = vUv - 0.5; c.rgb *= 1.0 - dot(d, d) * vig * 1.8;
      c.rgb = mix(c.rgb, flashColor, flash);
      c.rgb *= 1.0 - fade;
      gl_FragColor = vec4(clamp(c.rgb, 0.0, 1.0), 1.0);
    }`,
};

// Draws the character layer into a small render target (so every model becomes chunky pixels),
// then lays it over the full-size scene with a dark one-pixel outline and a little colour banding.
const PixelComposite = {
  uniforms: { tDiffuse: { value: null }, tChar: { value: null }, low: { value: new THREE.Vector2(1, 1) }, outline: { value: new THREE.Vector3(0.035, 0.025, 0.07) }, levels: { value: 14 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `uniform sampler2D tDiffuse, tChar; uniform vec2 low; uniform vec3 outline; uniform float levels; varying vec2 vUv;
    void main(){
      vec4 base = texture2D(tDiffuse, vUv);
      vec2 px = 1.0 / low; vec2 uv = (floor(vUv * low) + 0.5) * px;
      vec4 c = texture2D(tChar, uv);
      if (c.a < 0.5) {
        float n = max(max(texture2D(tChar, uv + vec2(px.x, 0.0)).a, texture2D(tChar, uv - vec2(px.x, 0.0)).a), max(texture2D(tChar, uv + vec2(0.0, px.y)).a, texture2D(tChar, uv - vec2(0.0, px.y)).a));
        gl_FragColor = n > 0.5 ? vec4(mix(base.rgb, outline, 0.88), base.a) : base;
        return;
      }
      vec3 g = sqrt(max(c.rgb, 0.0));
      g = floor(g * levels + 0.5) / levels;
      gl_FragColor = vec4(g * g, 1.0);
    }`,
};
export class PixelCharPass extends Pass {
  constructor(scene, camera) {
    super();
    this.scene = scene; this.camera = camera; this.factor = 3; this.enabled = true;
    this.rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: true });
    this.depthOnly = new THREE.MeshBasicMaterial({ colorWrite: false });
    this.mat = new THREE.ShaderMaterial({ uniforms: THREE.UniformsUtils.clone(PixelComposite.uniforms), vertexShader: PixelComposite.vertexShader, fragmentShader: PixelComposite.fragmentShader, depthTest: false, depthWrite: false });
    this.quad = new FullScreenQuad(this.mat);
    this.tick = 0; this.w = 1; this.h = 1;
  }
  setSize(w, h) {
    this.w = w; this.h = h;
    // aim for characters roughly 40-50 pixels tall, like Octopath's sprites
    this.factor = Math.max(2, Math.round(h / 230));
    const lw = Math.max(1, Math.floor(w / this.factor)), lh = Math.max(1, Math.floor(h / this.factor));
    this.rt.setSize(lw, lh); this.mat.uniforms.low.value.set(lw, lh);
  }
  // lights and the sun's shadow camera must see the character layer too
  prepLights() {
    if (this.scene.userData.pxPrepped && this.tick++ % 90) return;
    this.scene.userData.pxPrepped = true;
    this.scene.traverse((o) => { if (o.isLight) { o.layers.enable(CHAR_LAYER); if (o.shadow?.camera) o.shadow.camera.layers.enable(CHAR_LAYER); } });
  }
  render(renderer, writeBuffer, readBuffer) {
    const cam = this.camera, scene = this.scene;
    this.prepLights();
    const oldMask = cam.layers.mask, oldBg = scene.background, oldClear = renderer.getClearColor(new THREE.Color()), oldA = renderer.getClearAlpha(), oldAuto = renderer.autoClear;
    renderer.setRenderTarget(this.rt);
    renderer.setClearColor(0x000000, 0); renderer.clear(true, true, true);
    renderer.autoClear = false; scene.background = null;
    const oldShadow = renderer.shadowMap.autoUpdate; renderer.shadowMap.autoUpdate = false; // shadows were already drawn this frame
    // 1) the world (cut-out leaves and all) for its depth, then wipe the colour so only depth remains
    cam.layers.set(0); renderer.render(scene, cam); renderer.clear(true, false, false);
    // 2) the characters in colour
    cam.layers.set(CHAR_LAYER); renderer.render(scene, cam);
    renderer.shadowMap.autoUpdate = oldShadow; cam.layers.mask = oldMask; scene.background = oldBg; renderer.autoClear = oldAuto; renderer.setClearColor(oldClear, oldA);
    this.mat.uniforms.tDiffuse.value = readBuffer.texture; this.mat.uniforms.tChar.value = this.rt.texture;
    renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer);
    this.quad.render(renderer);
  }
}

export function createRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  return renderer;
}

export function createPost(renderer, scene, camera) {
  const size = renderer.getDrawingBufferSize(new THREE.Vector2());
  const rt = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType });
  const composer = new EffectComposer(renderer, rt);
  const rp = new RenderPass(scene, camera); composer.addPass(rp);
  const px = new PixelCharPass(scene, camera); composer.addPass(px);
  const bloom = new UnrealBloomPass(new THREE.Vector2(size.x / 2, size.y / 2), 0.5, 0.5, 0.82); composer.addPass(bloom);
  const tsH = new ShaderPass(TiltShift), tsV = new ShaderPass(TiltShift);
  tsV.uniforms.dir.value.set(0, 1);
  composer.addPass(tsH); composer.addPass(tsV);
  composer.addPass(new OutputPass());
  const grade = new ShaderPass(Grade); composer.addPass(grade);
  const api = {
    composer, bloom, grade, tsH, tsV, rp, px,
    setSize(w, h) {
      composer.setSize(w, h);
      const s = renderer.getDrawingBufferSize(new THREE.Vector2());
      px.setSize(s.x, s.y);
      tsH.uniforms.res.value.copy(s); tsV.uniforms.res.value.copy(s);
    },
    tilt(focus, band, amount) { for (const p of [tsH, tsV]) { p.uniforms.focus.value = focus; p.uniforms.band.value = band; p.uniforms.amount.value = amount; } },
    setCamera(cam) { rp.camera = cam; px.camera = cam; },
    setScene(sc) { rp.scene = sc; px.scene = sc; },
  };
  api.setSize(size.x / renderer.getPixelRatio(), size.y / renderer.getPixelRatio());
  return api;
}

// ---------- sprites: upright planes with pixel textures, lit and shadow-casting ----------
const PX = 1 / 16; // world units per pixel (one tile = 16 px = 1 unit)
export function spriteMaterial(tex, opts = {}) {
  // a little self-light keeps sprites readable when lit from behind
  const m = new THREE.MeshStandardMaterial({ map: tex, transparent: false, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 1, metalness: 0, emissive: opts.emissive || '#2e2e2e', emissiveMap: tex, emissiveIntensity: opts.ei || 1 });
  return m;
}
export function depthMat(tex) { return new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.5 }); }

// a character or prop sprite. sheet = canvas with n frames side by side.
export class Sprite {
  constructor(sheetCanvas, frames, opts = {}) {
    this.frames = frames;
    this.fw = sheetCanvas.width / frames; this.fh = sheetCanvas.height;
    this.tex = texFrom(sheetCanvas);
    this.tex.repeat.set(1 / frames, 1);
    this.scale = opts.scale || 1;
    const w = this.fw * PX * this.scale, h = this.fh * PX * this.scale;
    const g = new THREE.PlaneGeometry(w, h); g.translate(0, h / 2, 0);
    this.mat = spriteMaterial(this.tex, opts);
    this.mesh = new THREE.Mesh(g, this.mat);
    this.mesh.castShadow = opts.shadow !== false; this.mesh.receiveShadow = false;
    this.mesh.customDepthMaterial = depthMat(this.tex);
    this.mesh.customDepthMaterial.map = this.tex;
    this.w = w; this.h = h;
    this.frame = 0; this.setFrame(0);
    if (opts.lean !== false) this.mesh.rotation.x = -0.18; // lean back a touch toward the tilted camera
  }
  setFrame(i) { this.frame = i; this.tex.offset.x = i / this.frames; }
  flip(on) { this.tex.repeat.x = (on ? -1 : 1) / this.frames; this.tex.offset.x = (this.frame + (on ? 1 : 0)) / this.frames; }
  dispose() { this.tex.dispose(); this.mat.dispose(); this.mesh.geometry.dispose(); }
}

// soft round blob shadow under sprites (helps them sit on the ground)
let blobTex;
export function blobShadow(r = 0.4) {
  if (!blobTex) {
    const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(0,0,0,0.5)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); blobTex = new THREE.CanvasTexture(c);
  }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 1.3), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.renderOrder = 1;
  return m;
}

// ---------- particles ----------
let dotTex;
function getDot() {
  if (!dotTex) {
    const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d');
    const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.7)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 32, 32); dotTex = new THREE.CanvasTexture(c);
  }
  return dotTex;
}
export class Particles {
  constructor(scene, max = 600) {
    this.max = max; this.n = 0;
    this.pos = new Float32Array(max * 3); this.col = new Float32Array(max * 3); this.size = new Float32Array(max);
    this.p = [];
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    g.setAttribute('size', new THREE.BufferAttribute(this.size, 1));
    const m = new THREE.ShaderMaterial({
      uniforms: { map: { value: getDot() } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: true,
      vertexShader: 'attribute float size; varying vec3 vC; void main(){ vC = color; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = size * 300.0 / -mv.z; gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform sampler2D map; varying vec3 vC; void main(){ vec4 t = texture2D(map, gl_PointCoord); gl_FragColor = vec4(vC * 2.2, t.a); }',
    });
    this.points = new THREE.Points(g, m); this.points.frustumCulled = false; this.points.renderOrder = 5;
    scene.add(this.points);
  }
  emit(o) {
    // o: {x,y,z, n, color, speed, life, size, gravity, spread, up, drag}
    const c = new THREE.Color(o.color || '#fff');
    for (let i = 0; i < (o.n || 10); i++) {
      if (this.p.length >= this.max) this.p.shift();
      const a = Math.random() * Math.PI * 2, b = (Math.random() - 0.3) * Math.PI, sp = (o.speed ?? 2) * (0.4 + Math.random() * 0.8);
      this.p.push({
        x: o.x + (Math.random() - 0.5) * (o.spread || 0), y: o.y + (Math.random() - 0.5) * (o.spread || 0) * 0.6, z: o.z + (Math.random() - 0.5) * (o.spread || 0) * 0.5,
        vx: Math.cos(a) * Math.cos(b) * sp, vy: Math.sin(b) * sp + (o.up || 0), vz: Math.sin(a) * Math.cos(b) * sp * 0.5,
        life: (o.life || 0.8) * (0.6 + Math.random() * 0.6), t: 0, size: (o.size || 0.25) * (0.6 + Math.random() * 0.8), g: o.gravity ?? 2, r: c.r, gg: c.g, b: c.b, drag: o.drag ?? 1.5,
      });
    }
  }
  update(dt) {
    const P = this.p;
    for (let i = P.length - 1; i >= 0; i--) {
      const q = P[i]; q.t += dt;
      if (q.t >= q.life) { P.splice(i, 1); continue; }
      q.vy -= q.g * dt; const k = Math.exp(-q.drag * dt); q.vx *= k; q.vy *= k; q.vz *= k;
      q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt;
    }
    const n = Math.min(P.length, this.max);
    for (let i = 0; i < n; i++) {
      const q = P[i], f = 1 - q.t / q.life;
      this.pos[i * 3] = q.x; this.pos[i * 3 + 1] = q.y; this.pos[i * 3 + 2] = q.z;
      this.col[i * 3] = q.r * f; this.col[i * 3 + 1] = q.gg * f; this.col[i * 3 + 2] = q.b * f;
      this.size[i] = q.size * (0.5 + f * 0.5);
    }
    for (let i = n; i < this.n; i++) this.size[i] = 0;
    this.n = n;
    const g = this.points.geometry;
    g.attributes.position.needsUpdate = true; g.attributes.color.needsUpdate = true; g.attributes.size.needsUpdate = true;
    g.setDrawRange(0, Math.max(n, 1));
  }
  clear() { this.p.length = 0; }
}

// ---------- ambient motes (dust in sunbeams, fireflies at night) ----------
export class Motes {
  constructor(scene, n = 120, color = '#fff2c0', area = 18) {
    this.n = n; this.area = area;
    const pos = new Float32Array(n * 3); this.ph = new Float32Array(n);
    for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() - 0.5) * area; pos[i * 3 + 1] = Math.random() * 4; pos[i * 3 + 2] = (Math.random() - 0.5) * area; this.ph[i] = Math.random() * 10; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.mat = new THREE.PointsMaterial({ map: getDot(), color, size: 0.09, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.8 });
    this.points = new THREE.Points(g, this.mat); this.points.frustumCulled = false;
    scene.add(this.points);
    this.t = 0;
  }
  update(dt, cx, cz) {
    this.t += dt;
    const p = this.points.geometry.attributes.position.array, A = this.area;
    for (let i = 0; i < this.n; i++) {
      p[i * 3] += Math.sin(this.t * 0.5 + this.ph[i]) * dt * 0.2;
      p[i * 3 + 1] += Math.cos(this.t * 0.7 + this.ph[i]) * dt * 0.15;
      // keep them around the camera target
      if (p[i * 3] - cx > A / 2) p[i * 3] -= A; if (p[i * 3] - cx < -A / 2) p[i * 3] += A;
      if (p[i * 3 + 2] - cz > A / 2) p[i * 3 + 2] -= A; if (p[i * 3 + 2] - cz < -A / 2) p[i * 3 + 2] += A;
      if (p[i * 3 + 1] < 0) p[i * 3 + 1] = 4; if (p[i * 3 + 1] > 4.5) p[i * 3 + 1] = 0.2;
    }
    this.points.geometry.attributes.position.needsUpdate = true;
  }
}

// ---------- animated water ----------
export function waterMaterial(color = '#2a6ab0', deep = '#123a6a') {
  const m = new THREE.MeshStandardMaterial({ color, roughness: 0.15, metalness: 0.2, transparent: true, opacity: 0.88 });
  m.userData.time = { value: 0 };
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = m.userData.time;
    sh.uniforms.uDeep = { value: new THREE.Color(deep) };
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWp;').replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWp = (modelMatrix * vec4(transformed,1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uTime; uniform vec3 uDeep; varying vec3 vWp;\nfloat hsh(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }')
      .replace('#include <color_fragment>', `#include <color_fragment>
        vec2 q = floor(vWp.xz * 8.0) / 8.0;
        float w = sin(q.x * 3.1 + uTime * 1.3) * sin(q.y * 2.3 - uTime * 1.1) + sin((q.x + q.y) * 5.0 + uTime * 2.0) * 0.5;
        diffuseColor.rgb = mix(uDeep, diffuseColor.rgb, 0.55 + 0.25 * w);
        float sp = step(0.985, hsh(floor(vWp.xz * 10.0) + floor(uTime * 3.0)));
        float band = step(0.93, sin(q.x * 2.0 + q.y * 1.3 + uTime * 1.6) * 0.5 + 0.5);
        diffuseColor.rgb += vec3(0.75, 0.85, 1.0) * (sp * 0.9 + band * 0.18);`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += vec3(0.6,0.8,1.0) * sp * 0.7;');
  };
  return m;
}

// ---------- sky dome gradient ----------
export function skyDome(top = '#5a8ae0', bottom = '#e8d8c0') {
  const g = new THREE.SphereGeometry(400, 24, 12);
  const m = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: { top: { value: new THREE.Color(top) }, bottom: { value: new THREE.Color(bottom) } },
    vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 top, bottom; varying vec3 vP; void main(){ float h = clamp(normalize(vP).y * 1.6 + 0.2, 0.0, 1.0); gl_FragColor = vec4(mix(bottom, top, h), 1.0); }',
  });
  const s = new THREE.Mesh(g, m); s.renderOrder = -10; return s;
}

// ---------- text label as a sprite (damage numbers use the DOM instead) ----------
export function labelSprite(text, color = '#fff', size = 28) {
  const c = document.createElement('canvas'); const g = c.getContext('2d'); g.font = `bold ${size}px sans-serif`;
  const w = Math.ceil(g.measureText(text).width) + 12; c.width = w; c.height = size + 12;
  g.font = `bold ${size}px sans-serif`; g.textBaseline = 'middle'; g.lineWidth = 5; g.strokeStyle = '#1c1424'; g.strokeText(text, 6, c.height / 2); g.fillStyle = color; g.fillText(text, 6, c.height / 2);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false })); s.scale.set(w / 60, c.height / 60, 1); s.renderOrder = 10;
  return s;
}
