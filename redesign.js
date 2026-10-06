/* ============================================================
   FHSN — "Chambers Maroon" redesign · behaviour
   FHSN NEW/2d/redesign.js

   Shared across all 6 pages. Every module guards on its markup,
   so pages without a hero canvas / ticker / timeline simply skip
   it. Requires GSAP + ScrollTrigger (loaded before this file).
   ============================================================ */
const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- film grain (all pages) ---------- */
(function(){
  const c = document.getElementById('grain'); if(!c) return;
  const x = c.getContext('2d');
  function size(){ c.width = innerWidth; c.height = innerHeight; }
  size(); addEventListener('resize', size);
  function draw(){
    const d = x.createImageData(c.width, c.height), b = d.data;
    for (let i = 0; i < b.length; i += 4){
      const v = Math.random() * 255;
      b[i] = b[i+1] = b[i+2] = v; b[i+3] = 255;
    }
    x.putImageData(d, 0, 0);
  }
  draw();
  if (!RM) setInterval(draw, 90);
})();

/* ---------- hero: drifting motes + light sweep (home only) ---------- */
(function(){
  const c = document.getElementById('chamber'); if(!c) return;
  const x = c.getContext('2d');
  let w, h, motes = [], mx = .5, my = .5, t = 0;
  function size(){
    w = c.width = c.offsetWidth; h = c.height = c.offsetHeight;
    const n = Math.min(150, Math.floor(w / 11));
    motes = Array.from({length: n}, () => ({
      x: Math.random() * w, y: Math.random() * h,
      r: Math.random() * 2.1 + .35,
      vx: (Math.random() - .5) * .16,
      vy: -Math.random() * .28 - .05,
      a: Math.random() * .5 + .12,
      ph: Math.random() * Math.PI * 2
    }));
  }
  size(); addEventListener('resize', size);
  addEventListener('mousemove', e => { mx = e.clientX / innerWidth; my = e.clientY / innerHeight; });
  function frame(){
    t += .006; x.clearRect(0, 0, w, h);
    const gx = w * (.34 + mx * .32 + Math.sin(t) * .04);
    const gy = h * (.24 + my * .2);
    const g = x.createRadialGradient(gx, gy, 0, gx, gy, Math.max(w, h) * .62);
    g.addColorStop(0, 'rgba(201,162,39,0.15)');
    g.addColorStop(.4, 'rgba(168,30,34,0.10)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    for (const m of motes){
      m.x += m.vx + Math.sin(t * 1.6 + m.ph) * .12; m.y += m.vy;
      if (m.y < -8){ m.y = h + 8; m.x = Math.random() * w; }
      if (m.x < -8) m.x = w + 8; if (m.x > w + 8) m.x = -8;
      const tw = m.a * (.6 + Math.sin(t * 3 + m.ph) * .4);
      x.beginPath(); x.arc(m.x, m.y, m.r, 0, 6.284);
      x.fillStyle = `rgba(242,239,234,${tw})`; x.fill();
    }
    requestAnimationFrame(frame);
  }
  if (!RM) frame();
  else { x.fillStyle = 'rgba(201,162,39,0.06)'; x.fillRect(0, 0, w, h); }
})();

/* ---------- nav ---------- */
const hdr = document.getElementById('hdr');
if (hdr) addEventListener('scroll', () => hdr.classList.toggle('stuck', scrollY > 60));
const burger = document.getElementById('burger'), nav = document.getElementById('nav');
if (burger && nav){
  burger.addEventListener('click', () => {
    const o = nav.classList.toggle('open');
    burger.setAttribute('aria-expanded', o);
    burger.textContent = o ? '✕' : '☰';
  });
  nav.addEventListener('click', e => {
    if (e.target.tagName === 'A'){ nav.classList.remove('open'); burger.textContent = '☰'; }
  });
}

/* ---------- ticker duplication ---------- */
const track = document.getElementById('track');
if (track) track.innerHTML += track.innerHTML;

/* ---------- card cursor glow ---------- */
document.querySelectorAll('.card').forEach(card => {
  const glow = card.querySelector('.glow'); if(!glow) return;
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    glow.style.left = (e.clientX - r.left) + 'px';
    glow.style.top = (e.clientY - r.top) + 'px';
  });
});

/* ---------- magnetic buttons ---------- */
if (!RM && window.gsap) document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('mousemove', e => {
    const r = btn.getBoundingClientRect();
    gsap.to(btn, { x: (e.clientX - r.left - r.width / 2) * .22, y: (e.clientY - r.top - r.height / 2) * .3, duration: .5, ease: 'power3.out' });
  });
  btn.addEventListener('mouseleave', () => { gsap.to(btn, { x: 0, y: 0, duration: .7, ease: 'elastic.out(1,.4)' }); });
});

/* ---------- GSAP reveals / hero / timeline ---------- */
if (window.gsap){
  gsap.registerPlugin(ScrollTrigger);
  if (!RM){
    // hero load sequence (home only)
    if (document.querySelector('.hero .ln i')){
      gsap.set('.hero .ln i', { yPercent: 115 });
      gsap.timeline({ delay: .25 })
        .to('.hero .eyebrow', { opacity: 1, duration: .6, from: { opacity: 0 } })
        .to('.hero .ln i', { yPercent: 0, duration: 1.15, stagger: .11, ease: 'power4.out' }, 0)
        .from('.hero .lede', { y: 22, opacity: 0, duration: .9, ease: 'power3.out' }, .55)
        .from('.hero .cta .btn', { y: 22, opacity: 0, duration: .8, stagger: .1, ease: 'power3.out' }, .7)
        .from('.hero .scroll-hint', { opacity: 0, duration: .8 }, 1);
      gsap.to('.hero .wrap', { y: 90, opacity: .25, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    }
    // section reveals (all pages)
    gsap.utils.toArray('.reveal').forEach(el => {
      gsap.to(el, { opacity: 1, y: 0, duration: .95, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 86%' } });
    });
    // timeline ink draw + node activation (history page)
    const tlEl = document.getElementById('tl');
    if (tlEl){
      gsap.to('#ink', { height: '100%', ease: 'none',
        scrollTrigger: { trigger: tlEl, start: 'top 62%', end: 'bottom 78%', scrub: .5 } });
      gsap.utils.toArray('.node').forEach(n => {
        gsap.from(n, { opacity: 0, y: 40, duration: .9, ease: 'power3.out',
          scrollTrigger: { trigger: n, start: 'top 84%' } });
        ScrollTrigger.create({ trigger: n, start: 'top 68%', end: 'bottom 40%',
          onToggle: s => n.classList.toggle('on', s.isActive) });
      });
    }
  } else {
    document.querySelectorAll('.reveal').forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; });
    document.querySelectorAll('.hero .ln i').forEach(el => el.style.transform = 'none');
  }
}

/* ---------- upright hero seal (index hero only) ----------
   Procedural brass medallion, generated in-browser (no assets).
   Stands vertical, face to viewer; slow idle turn. Static under
   reduced-motion; flat brass image when WebGL is unavailable.
   Requires three.js r128 (loaded before this file). Guards on
   #hero-seal so the other 5 pages skip it. Reuses global RM. */
(function () {
  'use strict';
  var mount = document.getElementById('hero-seal');
  if (!mount || typeof THREE === 'undefined') return;

  var hasWebGL = (function () {
    try { var c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) { return false; }
  })();

  function makeFaceTexture(opts) {
    opts = opts || {};
    var s = 1024, cv = document.createElement('canvas');
    cv.width = cv.height = s; var x = cv.getContext('2d'), c = s / 2;
    /* back cap has opposite winding → pre-mirror the whole face so it reads
       correctly once the geometry flips it */
    if (opts.mirror) { x.translate(s, 0); x.scale(-1, 1); }
    var g = x.createRadialGradient(c, c * 0.8, 60, c, c, c);
    g.addColorStop(0, '#e9cf8f'); g.addColorStop(0.5, '#c39b52');
    g.addColorStop(0.85, '#8a6a34'); g.addColorStop(1, '#5c451f');
    x.fillStyle = g; x.beginPath(); x.arc(c, c, c - 6, 0, Math.PI * 2); x.fill();
    x.strokeStyle = 'rgba(60,40,14,0.55)'; x.lineWidth = 10;
    x.beginPath(); x.arc(c, c, c - 40, 0, Math.PI * 2); x.stroke();
    x.strokeStyle = 'rgba(255,240,200,0.35)'; x.lineWidth = 3;
    x.beginPath(); x.arc(c, c, c - 60, 0, Math.PI * 2); x.stroke();
    x.fillStyle = 'rgba(50,34,12,0.5)';
    for (var i = 0; i < 72; i++) {
      var a = (i / 72) * Math.PI * 2, r = c - 92;
      x.beginPath(); x.arc(c + Math.cos(a) * r, c + Math.sin(a) * r, 5, 0, Math.PI * 2); x.fill();
    }
    function arc(txt, radius, top) {
      x.save(); x.translate(c, c);
      x.font = '600 44px "Cormorant Garamond", Georgia, serif';
      x.fillStyle = 'rgba(45,30,10,0.7)'; x.textAlign = 'center'; x.textBaseline = 'middle';
      var total = 1.7, step = total / (txt.length - 1), start = top ? -total / 2 : Math.PI - total / 2;
      for (var j = 0; j < txt.length; j++) {
        var ang = top ? start + step * j : start - step * j;
        x.save(); x.rotate(ang);
        x.translate(0, top ? -radius : radius);
        if (!top) x.rotate(Math.PI);
        x.fillText(txt[j], 0, 0); x.restore();
      }
      x.restore();
    }
    arc('FRIEDLAND HART SOLOMON', c - 130, true);
    arc('EST · MDCCCXCVIII', c - 130, false);
    x.fillStyle = '#2a1c08';
    x.textAlign = 'center'; x.textBaseline = 'middle';
    if (opts.centerLines) {
      /* back face: custom stacked wordmark (e.g. "Trusted / Since 1898") */
      var lines = opts.centerLines, lh = 116, y0 = c - (lines.length - 1) * lh / 2;
      x.font = '700 94px "Cormorant Garamond", Georgia, serif';
      for (var k = 0; k < lines.length; k++) x.fillText(lines[k], c, y0 + k * lh);
    } else {
      /* front face: fhsn wordmark */
      x.font = '700 220px "Cormorant Garamond", Georgia, serif';
      x.fillText('fhsn', c, c - 6);
      x.font = '500 34px "DM Mono", monospace';
      x.fillStyle = 'rgba(45,30,10,0.7)';
      x.fillText('· PRETORIA ·', c, c + 150);
    }
    var tex = new THREE.CanvasTexture(cv);
    tex.anisotropy = 8; return tex;
  }

  if (!hasWebGL) {
    var img = new Image(); img.src = makeFaceTexture().image.toDataURL();
    img.alt = 'brass seal';
    img.style.cssText = 'width:100%;height:100%;object-fit:contain;border-radius:50%;transform:rotate(-90deg)';
    mount.appendChild(img); return;
  }

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0, 8);
  var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  mount.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0x2a2320, 0.7));
  var key = new THREE.SpotLight(0xffe6b0, 2.4, 40, 0.6, 0.5, 1);
  key.position.set(-6, 8, 10); scene.add(key);
  var rim = new THREE.PointLight(0x8a1417, 3.0, 30);
  rim.position.set(7, -4, 4); scene.add(rim);
  var fill = new THREE.PointLight(0xb5924c, 1.2, 30);
  fill.position.set(0, 2, 8); scene.add(fill);

  var group = new THREE.Group(); scene.add(group);
  var brass = { color: 0xc09a4e, metalness: 0.95, roughness: 0.34 };
  var faceTex = makeFaceTexture();
  faceTex.center.set(0.5, 0.5);
  faceTex.rotation = -Math.PI / 2;          /* turn wordmark to the right → reads horizontally */
  var faceMat = new THREE.MeshStandardMaterial(Object.assign({}, brass, { map: faceTex }));
  /* back cap: same wordmark, mirrored on U so it reads correctly (cap winding
     is opposite the front), not backwards → two-faced seal */
  var faceTexBack = makeFaceTexture({ centerLines: ['Trusted', 'Since 1898'] });
  faceTexBack.center.set(0.5, 0.5);
  faceTexBack.rotation = -Math.PI / 2;
  var faceMatBack = new THREE.MeshStandardMaterial(Object.assign({}, brass, { map: faceTexBack }));
  var edgeMat = new THREE.MeshStandardMaterial(brass);
  var disc = new THREE.Mesh(
    new THREE.CylinderGeometry(2.15, 2.15, 0.34, 96, 1),
    [edgeMat, faceMat, faceMatBack]
  );
  disc.rotation.x = -Math.PI / 2;
  group.add(disc);
  group.add(new THREE.Mesh(new THREE.TorusGeometry(2.18, 0.12, 24, 96), edgeMat));
  var innerRing = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.04, 16, 96),
    new THREE.MeshStandardMaterial(Object.assign({}, brass, { roughness: 0.5 })));
  innerRing.position.z = 0.18; group.add(innerRing);
  group.rotation.x = 0.10;

  function resize() {
    var w = mount.clientWidth, h = mount.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h; camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  window.addEventListener('resize', resize); resize();

  if (RM) { group.rotation.y = -0.25; renderer.render(scene, camera); return; }

  var running = true;
  document.addEventListener('visibilitychange', function () {
    running = !document.hidden; if (running) tick();
  });
  function tick() {
    if (!running) return;
    requestAnimationFrame(tick);
    group.rotation.y += 0.006;
    renderer.render(scene, camera);
  }
  tick();
})();

/* ---------- FlipText: split [data-fliptext] into flipping chars ---------- */
(function(){
  if (RM) return;
  document.querySelectorAll('[data-fliptext]').forEach(function(el){
    var text = el.textContent, total = text.length || 1;
    el.textContent = '';
    text.split('').forEach(function(ch, i){
      var s = document.createElement('span');
      if (ch === ' ') { s.innerHTML = '&nbsp;'; s.style.display = 'inline-block'; }
      else {
        s.className = 'fx'; s.textContent = ch;
        var delay = Math.sin((i / total) * (Math.PI / 2)) * 0.9;   /* eased stagger */
        s.style.setProperty('--fx-delay', delay.toFixed(2) + 's');
      }
      el.appendChild(s);
    });
  });
})();

/* ---------- Kinetic site loader: hide once loaded ---------- */
(function(){
  var loader = document.getElementById('site-loader'); if (!loader) return;
  function hide(){ setTimeout(function(){ loader.classList.add('hide'); }, RM ? 200 : 900); }
  if (document.readyState === 'complete') hide();
  else window.addEventListener('load', hide);
})();

/* ---------- Parallax strip (desktop only, respects reduced-motion) ---------- */
(function(){
  if (RM || window.innerWidth < 768 || !window.gsap || !window.ScrollTrigger) return;
  document.querySelectorAll('.parallax-strip').forEach(function(strip){
    var bg = strip.querySelector('.px-bg'); if (!bg) return;
    gsap.to(bg, {
      yPercent: 16, ease: 'none',
      scrollTrigger: { trigger: strip, start: 'top bottom', end: 'bottom top', scrub: true }
    });
  });
})();

/* ---------- Cursor card: hover history terms → floating expansion ---------- */
(function(){
  var terms = document.querySelectorAll('.cursor-term'); if (!terms.length) return;
  var card = document.createElement('div'); card.id = 'cursor-card';
  card.innerHTML = '<img alt="" src="./assets/parallax.avif"><div class="cc-body"><p class="cc-title"></p><p class="cc-desc"></p></div>';
  document.body.appendChild(card);
  var titleEl = card.querySelector('.cc-title'), descEl = card.querySelector('.cc-desc');
  var tx = 0, ty = 0, cx = 0, cy = 0, active = false, primed = false, raf = null;
  function loop(){ cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18; card.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0)'; if (active) raf = requestAnimationFrame(loop); else raf = null; }
  function place(x, y){ var w = card.offsetWidth || 300; tx = Math.max(8, Math.min(x + 18, innerWidth - w - 8)); ty = Math.min(y + 18, innerHeight - (card.offsetHeight || 200) - 10); if (!primed){ cx = tx; cy = ty; primed = true; } }
  function show(el){ titleEl.textContent = el.dataset.title || el.textContent.trim(); descEl.textContent = el.dataset.desc || ''; card.classList.add('show'); active = true; if (!raf) loop(); }
  function hide(){ card.classList.remove('show'); active = false; }
  var touch = window.matchMedia('(hover: none)').matches;
  var current = null;
  terms.forEach(function(t){
    if (touch) {
      /* tap to toggle on touch devices (no hover) */
      t.addEventListener('click', function(e){
        e.preventDefault(); e.stopPropagation();
        if (current === t) { hide(); current = null; return; }
        show(t); current = t;
        /* pin to the top of the screen (under the header) so it's fully visible */
        var w = card.offsetWidth || Math.min(300, innerWidth * 0.88);
        tx = Math.max(8, (innerWidth - w) / 2); ty = 76;
        cx = tx; cy = ty; primed = true;
      });
    } else {
      t.addEventListener('mouseenter', function(e){ place(e.clientX, e.clientY); show(t); });
      t.addEventListener('mousemove', function(e){ place(e.clientX, e.clientY); });
      t.addEventListener('mouseleave', hide);
    }
  });
  if (touch) document.addEventListener('click', function(){ hide(); current = null; });
})();

/* ---------- Wave grid background (News page) — vanilla three port ----------
   Instanced cube grid that ripples from the cursor (idle auto-ripples).
   Ported from StudioDesk WaveGridBackground (React); post-processing and
   shadows dropped so it runs on three-core UMD (no ES-module addons).
   Guards on #wave-grid + THREE; disabled on mobile / reduced-motion. */
(function () {
  var mount = document.getElementById('wave-grid');
  if (!mount || typeof THREE === 'undefined') return;
  var isMobile = innerWidth < 768;
  var MAX_TRAIL = 128, GRID = isMobile ? 24 : 36, colorBase = '#36454F', colorHigh = '#A81E22';

  function overrideVertex(vs) {
    return vs.replace('#include <common>', '#include <common>\n' +
      'varying float vHeight; attribute vec2 aOffset; uniform sampler2D uTrailTexture;' +
      'uniform int uTrailCount; uniform float uWaveSpeed; uniform float uWaveFreq; uniform float uWaveWidth;' +
      'uniform float uFadeTime; uniform float uAmplitude; uniform float uJitter; uniform float uMaxHeight;' +
      'vec2 hash2(vec2 p){p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)));return fract(sin(p)*43758.5453123)-0.5;}'
    ).replace('#include <begin_vertex>', '#include <begin_vertex>\n' +
      'vHeight=0.0; if(position.y>0.0){ vec2 j=hash2(aOffset)*uJitter; vec2 wxz=aOffset+j; float wh=0.0,tw=0.0;' +
      'for(int i=0;i<128;i++){ if(i>=uTrailCount)break; vec4 td=texture2D(uTrailTexture,vec2((float(i)+0.5)/128.0,0.5));' +
      'float d=length(wxz-td.rg); float wf=uWaveSpeed*td.b; float rd=d-wf;' +
      'float win=exp(-(rd*rd)/(uWaveWidth*uWaveWidth)); float fd=exp(-td.b/uFadeTime); float at=1.0/(1.0+d*0.1);' +
      'float w=fd*win*at*td.a; wh+=w*cos(uWaveFreq*rd); tw+=w; }' +
      'wh/=max(tw,1.0); float disp=clamp(wh*uAmplitude,-uMaxHeight,uMaxHeight); transformed.y+=disp; vHeight=disp; }');
  }

  var cubeW = 0.8, cubeH = 3, gap = 0.01, bounds = GRID * (cubeW + gap);
  function size() { return { w: innerWidth || 1, h: innerHeight || 1, pr: Math.min(devicePixelRatio, isMobile ? 1.25 : 2) }; }
  var sz = size();
  var scene = new THREE.Scene();
  scene.background = new THREE.Color(colorBase).multiplyScalar(0.72);

  var radius = 12, aR = Math.PI * 0.03, bR = Math.PI * 0.05;
  var mouse = new THREE.Vector2(0, 0), lm = new THREE.Vector2(0, 0);
  var camera = new THREE.PerspectiveCamera(40, sz.w / sz.h, 0.1, 200);
  function posCam(mx, my) {
    var a = my * aR, b = mx * bR;
    camera.position.set(-radius * Math.cos(a) * Math.sin(b), radius * Math.cos(a) * Math.cos(b), radius * Math.sin(a));
    camera.up.set(0, 0, -1); camera.lookAt(0, 0, 0);
  }
  posCam(0, 0); scene.add(camera);
  addEventListener('mousemove', function (e) { mouse.x = (e.clientX / sz.w) * 2 - 1; mouse.y = -(e.clientY / sz.h) * 2 + 1; });

  scene.add(new THREE.AmbientLight(0xffffff, 0.45));
  var key = new THREE.DirectionalLight(0xffe9c8, 0.72); key.position.set(-20, 10, 6); scene.add(key);
  var fillL = new THREE.DirectionalLight(0xffffff, 0.22); fillL.position.set(10, 5, -3); scene.add(fillL);

  var trailData = new Float32Array(MAX_TRAIL * 4);
  var trailTex = new THREE.DataTexture(trailData, MAX_TRAIL, 1, THREE.RGBAFormat, THREE.FloatType);
  trailTex.needsUpdate = true;
  var tU = { uTrailTexture: { value: trailTex }, uTrailCount: { value: 0 }, uFadeTime: { value: 2.0 },
    uWaveSpeed: { value: 6.0 }, uWaveFreq: { value: 1.2 }, uWaveWidth: { value: 3.0 },
    uAmplitude: { value: 0.4 }, uJitter: { value: 0.2 }, uMaxHeight: { value: 0.4 } };
  var cU = { uColorBase: { value: new THREE.Color(colorBase) }, uColorHigh: { value: new THREE.Color(colorHigh) } };

  var trail = [], lastPt = null, sinceMove = 0, randTimer = 0, placingRandom = true, fadeTime = 2.0, spacing2 = 0.1;
  var rayPlane = new THREE.Mesh(new THREE.PlaneGeometry(bounds, bounds), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, visible: false }));
  rayPlane.rotation.x = -Math.PI / 2; rayPlane.updateMatrixWorld(true);
  var ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), rect = mount.getBoundingClientRect();
  mount.addEventListener('pointermove', function (e) {
    ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    var hit = ray.intersectObject(rayPlane); if (!hit.length) return;
    var x = hit[0].point.x, z = hit[0].point.z, dd = 0;
    if (lastPt) { var dx = x - lastPt.x, dz = z - lastPt.z; dd = Math.sqrt(dx * dx + dz * dz); if (dd < spacing2) return; }
    if (trail.length >= MAX_TRAIL) trail.shift();
    trail.push({ x: x, z: z, age: 0, dd: dd }); lastPt = { x: x, z: z }; sinceMove = 0; placingRandom = false; randTimer = 0;
  });
  function addRandom() { var x = (Math.random() * 0.5 - 0.25) * bounds, z = (Math.random() * 0.5 - 0.25) * bounds;
    if (trail.length >= MAX_TRAIL) trail.shift(); trail.push({ x: x, z: z, age: 0, dd: 0.8 + Math.random() * 0.2 }); }
  function updateTrail(dt) {
    var ex = fadeTime * 4;
    for (var i = trail.length - 1; i >= 0; i--) { trail[i].age += dt; if (trail[i].age > ex) trail.splice(i, 1); }
    sinceMove += dt;
    if (sinceMove >= 3.0 && !placingRandom) { placingRandom = true; randTimer = 0; }
    if (placingRandom) { randTimer += dt; if (randTimer >= 1.4) { addRandom(); randTimer = 0; } }
    var n = Math.min(trail.length, MAX_TRAIL);
    if (n > 0 || tU.uTrailCount.value > 0) {
      for (var k = 0; k < n; k++) { var t = k * 4; trailData[t] = trail[k].x; trailData[t + 1] = trail[k].z; trailData[t + 2] = trail[k].age; trailData[t + 3] = trail[k].dd; }
      trailTex.needsUpdate = true; tU.uTrailCount.value = n;
    }
  }

  var count = GRID * GRID;
  var geo = new THREE.BoxGeometry(cubeW, cubeH, cubeW);
  var offAttr = new THREE.InstancedBufferAttribute(new Float32Array(count * 2), 2);
  geo.setAttribute('aOffset', offAttr);
  /* matte: near-black warm specular + low shininess kills the white sheen that
     washed the maroon toward pink */
  var mat = new THREE.MeshPhongMaterial({ color: 0xffffff, specular: 0x1a0604, shininess: 5 });
  mat.onBeforeCompile = function (sh) {
    Object.assign(sh.uniforms, tU, cU);
    sh.vertexShader = overrideVertex(sh.vertexShader);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vHeight; uniform vec3 uColorBase; uniform vec3 uColorHigh; uniform float uMaxHeight;')
      .replace('#include <color_fragment>', '#include <color_fragment>\nfloat _t=clamp(vHeight/uMaxHeight,0.0,1.0); diffuseColor.rgb=mix(uColorBase,uColorHigh,_t);');
  };
  var inst = new THREE.InstancedMesh(geo, mat, count);
  scene.add(inst);
  var dummy = new THREE.Object3D(), spc = cubeW + gap, off = ((GRID - 1) * spc) / 2;
  for (var gi = 0; gi < GRID; gi++) for (var gj = 0; gj < GRID; gj++) {
    var idx = gi * GRID + gj, x = gi * spc - off, z = gj * spc - off;
    dummy.position.set(x, 0, z); dummy.updateMatrix(); inst.setMatrixAt(idx, dummy.matrix); offAttr.setXY(idx, x, z);
  }
  inst.instanceMatrix.needsUpdate = true; offAttr.needsUpdate = true;

  var canvas = document.createElement('canvas'); mount.appendChild(canvas);
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.NoToneMapping;
  renderer.setSize(sz.w, sz.h); renderer.setPixelRatio(sz.pr);
  addEventListener('resize', function () { sz = size(); camera.aspect = sz.w / sz.h; camera.updateProjectionMatrix(); renderer.setSize(sz.w, sz.h); renderer.setPixelRatio(sz.pr); rect = mount.getBoundingClientRect(); });

  for (var _s = 0; _s < 4; _s++) addRandom();   /* seed ripples so the grid shows colour immediately (no dead-grey first paint) */
  updateTrail(0.001);
  if (RM) { renderer.render(scene, camera); return; }   /* mobile now animates (lighter grid + capped DPR); only reduced-motion stays static */
  var clock = new THREE.Clock();
  renderer.setAnimationLoop(function () {
    var dt = clock.getDelta();
    updateTrail(dt);
    lm.x += (mouse.x - lm.x) * 0.04; lm.y += (mouse.y - lm.y) * 0.04; posCam(lm.x, lm.y);
    renderer.render(scene, camera);
  });
})();
