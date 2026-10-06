/* ============================================================
   FHSN — Design Lab (A/B preference tool)
   Loaded in <head> on every page so saved choices apply before
   first paint.

   COLOUR — re-tints the :root tokens in redesign.css and fires
   'fhsn:palette' for canvas/WebGL (see redesign.js). The client
   picks ONE base red and ONE base grey; every other shade in that
   family keeps its original relationship to the base (same hue
   offset, saturation offset and lightness ratio).

   VARIANTS — every design feature (buttons, backgrounds,
   animations …) has the original plus alternatives. A choice sets
   html[data-v-<id>="<option>"] (styles in variants.css) and fires
   'fhsn:variant' {id, value} for the JS-driven ones. The hero seal
   is deliberately not variable.

   State: localStorage (per browser) + share links
   (?red=&grey=&v=id.option~id.option).
   ============================================================ */
(function () {
  var ROOT = document.documentElement;
  var KEY = 'fhsn-lab-v1';
  var PAGE = (location.pathname.split('/').pop() || 'index.html').replace('.html', '') || 'index';

  /* ================= colour families ================= */
  var FAMILIES = {
    red: {
      label: 'Red', anchor: '--red', maxSat: 100,
      tokens: {
        '--red': '#A81E22', '--maroon': '#7A1620', '--maroon-deep': '#5B0F17', '--maroon-mid': '#8E1B26',
        '--maroon-dark': '#4A121B', '--maroon-ink': '#2E0A0E', '--maroon-night': '#1E060A', '--maroon-shadow': '#280A10'
      },
      presets: [
        ['Original', '#A81E22'], ['Crimson', '#B0182C'], ['Cardinal', '#C41E3A'], ['Signal', '#C8102E'],
        ['Carmine', '#960018'], ['Burgundy', '#800020'], ['Garnet', '#7C1C24'], ['Claret', '#7F1734'],
        ['Oxblood', '#6E1A1F'], ['Merlot', '#73343A'], ['Brick', '#9C3A2E'], ['Rust', '#A4422A']
      ]
    },
    grey: {
      label: 'Grey', anchor: '--slate', maxSat: 30,   /* greys live in the low-saturation centre of the wheel */
      tokens: {
        '--slate': '#4E5754', '--slate-deep': '#3B443F', '--char': '#2E3532',
        '--char-deep': '#242927', '--char-ink': '#1E2321', '--wave-base': '#36454F'
      },
      presets: [
        ['Original', '#4E5754'], ['Charcoal', '#36454F'], ['Gunmetal', '#2A3439'], ['Graphite', '#474A51'],
        ['Iron', '#52595D'], ['Steel', '#54616E'], ['Pewter', '#696A6A'], ['Ash', '#62686A'],
        ['Smoke', '#4A4A4F'], ['Moss', '#4F574C'], ['Taupe', '#5E5650'], ['Ink', '#2B2F36']
      ]
    }
  };
  var ORIGINAL = { red: '#A81E22', grey: '#4E5754' };
  var PAPER = '#F2EFEA';

  /* ================= design variants =================
     pages: where the feature exists (omitted = every page).
     The first option is always the original design. */
  var BD_LABEL = { aurora: 'Aurora', wave: 'Wave grid', orbs: 'Soft orbs', plain: 'Plain' };
  var BD_DEFAULT = { services: 'aurora', news: 'wave' }[PAGE];
  var FEATURES = [
    /* ---- type ---- */
    { id: 'type', tab: 'type', label: 'Heading typeface', opts: [['orig', 'Bodoni Moda'], ['playfair', 'Playfair'], ['cormorant', 'Cormorant'], ['condensed', 'Condensed caps']] },
    { id: 'body', tab: 'type', label: 'Body typeface', opts: [['orig', 'Barlow'], ['manrope', 'Manrope'], ['serif', 'Source Serif']] },
    { id: 'eyebrow', tab: 'type', label: 'Section labels', opts: [['orig', 'Gold rule'], ['chip', 'Boxed chip'], ['dash', 'Red dash'], ['serif', 'Italic serif']] },
    /* ---- design: whole site ---- */
    { id: 'header', tab: 'design', label: 'Header bar', opts: [['orig', 'Fade to blur'], ['solid', 'Solid bar'], ['float', 'Floating capsule']] },
    { id: 'nav', tab: 'design', label: 'Menu hover', opts: [['orig', 'Gold underline'], ['pill', 'Pill'], ['dot', 'Dot'], ['bracket', 'Brackets']] },
    { id: 'btn', tab: 'design', label: 'Buttons', opts: [['orig', 'Gold sweep + magnetic'], ['glow', 'Glow lift'], ['slide', 'Side slide'], ['pill', 'Rounded sheen']] },
    { id: 'grain', tab: 'design', label: 'Texture overlay', opts: [['orig', 'Film grain'], ['lines', 'Fine lines'], ['vignette', 'Vignette'], ['none', 'None']] },
    { id: 'footer', tab: 'design', label: 'Footer', opts: [['orig', 'Slim bar'], ['block', 'Big wordmark'], ['centered', 'Centred']] },
    /* ---- design: per page ---- */
    { id: 'pagehero', tab: 'design', pages: ['history', 'people', 'services', 'news', 'contact'], label: 'Page header background',
      opts: [['orig', PAGE === 'services' || PAGE === 'news' ? 'See-through' : 'Maroon glow'], ['split', 'Diagonal split'], ['photo', 'Photo'], ['mesh', 'Moving mesh']] },
    { id: 'backdrop', tab: 'design', pages: ['services', 'news'], label: 'Page backdrop',
      opts: [['orig', BD_LABEL[BD_DEFAULT] || 'Original']].concat(['aurora', 'wave', 'orbs', 'plain'].filter(function (k) { return k !== BD_DEFAULT; }).map(function (k) { return [k, BD_LABEL[k]]; })) },
    { id: 'cards', tab: 'design', pages: ['index'], label: 'Department cards', opts: [['orig', 'Cursor glow'], ['tilt', '3D tilt'], ['trace', 'Border trace'], ['lift', 'Lift + bar']] },
    { id: 'offer', tab: 'design', pages: ['index', 'services'], label: 'Shelf-company offer band', opts: [['orig', 'Red + halo'], ['slate', 'Grey'], ['split', 'Split'], ['stripes', 'Moving stripes']] },
    { id: 'posts', tab: 'design', pages: ['index', 'news'], label: 'News cards', opts: [['orig', 'Maroon fill'], ['rule', 'Gold top rule'], ['lift', 'Lift'], ['underline', 'Underline']] },
    { id: 'timeline', tab: 'design', pages: ['history'], label: 'Timeline layout', opts: [['orig', 'Centre spine'], ['rail', 'Left rail'], ['cards', 'Cards']] },
    { id: 'ink', tab: 'design', pages: ['history'], label: 'Timeline line', opts: [['orig', 'Glowing gradient'], ['dotted', 'Dotted gold'], ['bold', 'Bold red']] },
    { id: 'roster', tab: 'design', pages: ['people'], label: 'People list', opts: [['orig', 'Pills'], ['columns', 'Columns'], ['avatars', 'Initial avatars']] },
    { id: 'portrait', tab: 'design', pages: ['people'], label: 'Profile portrait', opts: [['orig', 'Gradient panel'], ['circle', 'Circle'], ['frame', 'Offset frame']] },
    { id: 'bullets', tab: 'design', pages: ['people', 'services'], label: 'List bullets', opts: [['orig', 'Em dash'], ['check', 'Tick'], ['numbered', 'Numbered']] },
    { id: 'jump', tab: 'design', pages: ['services'], label: 'Department shortcuts', opts: [['orig', 'Outline boxes'], ['pills', 'Numbered pills'], ['tabs', 'Tabs']] },
    { id: 'feature', tab: 'design', pages: ['news'], label: 'Featured story', opts: [['orig', 'Side by side'], ['overlay', 'Overlay'], ['stacked', 'Stacked']] },
    { id: 'fields', tab: 'design', pages: ['contact'], label: 'Form fields', opts: [['orig', 'Boxed'], ['underline', 'Underline'], ['soft', 'Soft rounded']] },
    { id: 'details', tab: 'design', pages: ['contact'], label: 'Contact details', opts: [['orig', 'Stacked'], ['cards', 'Cards'], ['rule', 'Red rule']] },
    { id: 'map', tab: 'design', pages: ['contact'], label: 'Map', opts: [['orig', 'Light'], ['dark', 'Dark'], ['mono', 'Mono + frame']] },
    /* ---- motion ---- */
    { id: 'reveal', tab: 'motion', label: 'Scroll reveal', replay: true, opts: [['orig', 'Fade up'], ['blur', 'Blur in'], ['slide', 'Slide in'], ['wipe', 'Wipe'], ['scale', 'Scale']] },
    { id: 'loader', tab: 'motion', pages: ['index'], label: 'Page loader', replay: true, opts: [['orig', 'Kinetic word'], ['bar', 'Progress line'], ['mono', 'Pulsing monogram'], ['curtain', 'Curtain lift']] },
    { id: 'heroin', tab: 'motion', pages: ['index'], label: 'Headline entrance', replay: true, opts: [['orig', 'Rise from mask'], ['letters', 'Letter cascade'], ['blur', 'Blur focus'], ['type', 'Typewriter']] },
    { id: 'herobg', tab: 'motion', pages: ['index'], label: 'Hero background', opts: [['orig', 'Drifting motes'], ['constellation', 'Constellation'], ['rays', 'Light rays'], ['rings', 'Ripples']] },
    { id: 'scrollhint', tab: 'motion', pages: ['index'], label: 'Scroll hint', opts: [['orig', 'Dripping line'], ['mouse', 'Mouse'], ['chevron', 'Chevron']] },
    { id: 'ticker', tab: 'motion', pages: ['index'], label: 'Ticker', opts: [['orig', 'Marquee'], ['outline', 'Big outline'], ['double', 'Two rows'], ['static', 'Static']] },
    { id: 'flip', tab: 'motion', pages: ['index'], label: 'Label animation', opts: [['orig', 'Letter flip'], ['shimmer', 'Gold shimmer'], ['wave', 'Wave'], ['off', 'Still']] },
    { id: 'parallax', tab: 'motion', pages: ['index'], label: 'Photo strip', opts: [['orig', 'Parallax'], ['zoom', 'Slow zoom'], ['duotone', 'Red duotone'], ['pattern', 'Pattern, no photo']] },
    { id: 'term', tab: 'motion', pages: ['history'], label: 'Name hover cards', opts: [['orig', 'Follows cursor'], ['tooltip', 'Tooltip'], ['dock', 'Docked corner']] }
  ];
  var FEAT = {}; FEATURES.forEach(function (f) { FEAT[f.id] = f; });
  function onPage(f) { return !f.pages || f.pages.indexOf(PAGE) > -1; }
  function validOpt(id, v) { return FEAT[id] && (v === 'orig' || FEAT[id].opts.some(function (o) { return o[0] === v; }) ||
    /* backdrop options differ per page; accept any known backdrop */ (id === 'backdrop' && BD_LABEL[v])); }

  /* ================= colour math ================= */
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function hexToRgb(h) {
    h = h.replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&');
    var n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255];
  }
  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(function (v) { return ('0' + Math.round(clamp(v, 0, 255)).toString(16)).slice(-2); }).join('').toUpperCase();
  }
  function hexToHsl(hex) {
    var c = hexToRgb(hex), r = c[0] / 255, g = c[1] / 255, b = c[2] / 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, h = 0, s = 0, d = mx - mn;
    if (d) {
      s = d / (1 - Math.abs(2 * l - 1));
      h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
      h *= 60; if (h < 0) h += 360;
    }
    return [h, s * 100, l * 100];
  }
  function hslToRgb(h, s, l) {
    h = ((h % 360) + 360) % 360; s /= 100; l /= 100;
    var c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2, r, g, b;
    if (h < 60) { r = c; g = x; b = 0; } else if (h < 120) { r = x; g = c; b = 0; } else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; } else if (h < 300) { r = x; g = 0; b = c; } else { r = c; g = 0; b = x; }
    return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
  }
  function hslToHex(h, s, l) { var c = hslToRgb(h, s, l); return rgbToHex(c[0], c[1], c[2]); }
  function lum(hex) {
    return hexToRgb(hex).map(function (v) { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); })
      .reduce(function (a, v, i) { return a + v * [.2126, .7152, .0722][i]; }, 0);
  }
  function contrast(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }
  function validHex(v) { v = (v || '').trim().replace(/^#?/, '#'); return /^#[0-9a-f]{6}$/i.test(v) ? v.toUpperCase() : null; }

  /* one base colour in, the whole family of shades out */
  function derive(fam, base) {
    var F = FAMILIES[fam], out = {};
    if (base.toUpperCase() === ORIGINAL[fam]) { for (var k in F.tokens) out[k] = F.tokens[k]; return out; }
    var A = hexToHsl(F.tokens[F.anchor]), B = hexToHsl(base);
    for (var t in F.tokens) {
      var T = hexToHsl(F.tokens[t]);
      out[t] = t === F.anchor ? base.toUpperCase() : hslToHex(
        B[0] + (T[0] - A[0]),
        clamp(T[1] + (B[1] - A[1]), 0, 100),
        clamp(T[2] * (B[2] / A[2]), 1, 97)
      );
    }
    return out;
  }

  /* ================= state ================= */
  var state = { red: ORIGINAL.red, grey: ORIGINAL.grey, v: {}, list: [], a: null, b: null, live: null, open: false, tab: 'colour' };
  try { var saved = JSON.parse(localStorage.getItem(KEY)); if (saved) for (var s in saved) state[s] = saved[s]; } catch (e) {}
  state.v = state.v || {};
  var qs = new URLSearchParams(location.search);
  if (validHex(qs.get('red'))) state.red = validHex(qs.get('red'));
  if (validHex(qs.get('grey'))) state.grey = validHex(qs.get('grey'));
  if (qs.has('v')) {
    state.v = {};
    qs.get('v').split('~').forEach(function (pair) { var p = pair.split('.'); if (validOpt(p[0], p[1]) && p[1] !== 'orig') state.v[p[0]] = p[1]; });
  }
  if (qs.get('lab') === '1') state.open = true;   /* ?lab=1 opens the panel — send this to the client */
  if (/^(colour|type|design|motion|compare)$/.test(qs.get('tab') || '')) state.tab = qs.get('tab');
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }

  var ui = null, pending = false;
  function changed() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(function () { pending = false; save(); if (ui) ui.refresh(); });
  }

  /* ---- colour ---- */
  var palPending = false;
  function applyColour() {
    var all = Object.assign(derive('red', state.red), derive('grey', state.grey));
    for (var k in all) ROOT.style.setProperty(k, all[k]);
    if (!palPending) {
      palPending = true;
      requestAnimationFrame(function () {
        palPending = false;
        document.dispatchEvent(new CustomEvent('fhsn:palette', { detail: { red: state.red, grey: state.grey } }));
      });
    }
    changed();
  }
  function setColour(fam, hex) { state[fam] = hex.toUpperCase(); state.live = null; applyColour(); }

  /* ---- variants ---- */
  var FONTS = {
    playfair: 'Playfair+Display:ital,wght@0,600;1,600;1,700', cormorant: 'Cormorant+Garamond:ital,wght@0,600;1,600;1,700',
    manrope: 'Manrope:wght@300;400;600', serif: 'Source+Serif+4:opsz,wght@8..60,300;8..60,400;8..60,600'
  };
  var fontsLoaded = {};
  function loadFont(v) {
    if (!FONTS[v] || fontsLoaded[v]) return; fontsLoaded[v] = true;
    var l = document.createElement('link'); l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=' + FONTS[v] + '&display=swap';
    document.head.appendChild(l);
  }
  function applyVariant(id, fire) {
    var v = state.v[id] || 'orig';
    if (v === 'orig') ROOT.removeAttribute('data-v-' + id); else ROOT.setAttribute('data-v-' + id, v);
    if (id === 'type' || id === 'body') loadFont(v);
    if (fire) document.dispatchEvent(new CustomEvent('fhsn:variant', { detail: { id: id, value: v } }));
  }
  function setVariant(id, v) {
    if (v === 'orig') delete state.v[id]; else state.v[id] = v;
    state.live = null; applyVariant(id, true); changed();
  }
  /* swap the whole design (colours + every variant) — used by A/B, shortlist, resets */
  function useCombo(c, live) {
    var before = state.v, after = c.v || {};
    state.red = c.red; state.grey = c.grey; state.v = Object.assign({}, after); state.live = live || null;
    applyColour();
    FEATURES.forEach(function (f) { if ((before[f.id] || 'orig') !== (after[f.id] || 'orig')) applyVariant(f.id, true); });
    changed();
  }
  function current() { return { red: state.red, grey: state.grey, v: Object.assign({}, state.v) }; }
  function key(c) { var v = c.v || {}; return c.red + c.grey + Object.keys(v).sort().map(function (k) { return k + v[k]; }).join(); }

  applyColour();
  FEATURES.forEach(function (f) { applyVariant(f.id, false); });   /* runs in <head>: no flash of the original design */

  /* ================= UI ================= */
  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    for (var a in attrs || {}) e.setAttribute(a, attrs[a]);
    if (html != null) e.innerHTML = html;
    return e;
  }
  function mini(red, grey) {
    var r = derive('red', red), g = derive('grey', grey);
    return '<span class="lab-mini"><i style="background:' + g['--slate'] + '"></i><i style="background:' + g['--char'] +
      '"></i><i style="background:' + r['--red'] + '"></i><i style="background:' + r['--maroon-deep'] + '"></i></span>';
  }
  function nChanges(v) { return Object.keys(v || {}).length; }
  var toastEl, toastT;
  function toast(msg) {
    if (!toastEl) { toastEl = el('div', { class: 'lab-toast', role: 'status' }); document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('show'); }, 1800);
  }

  function makePicker(fam) {
    var F = FAMILIES[fam];
    var box = el('div', { class: 'lab-picker' });
    box.innerHTML =
      '<div class="top"><span class="chip"></span><h3>' + F.label + '</h3><input type="text" maxlength="7" spellcheck="false" aria-label="' + F.label + ' hex"></div>' +
      '<div class="lab-wheelrow"><div class="lab-wheel"><canvas width="300" height="300" aria-label="' + F.label + ' colour wheel"></canvas><span class="knob"></span></div>' +
      '<div class="lab-sliders"><label>Lightness<input type="range" min="4" max="90" step="0.5" data-k="l"></label>' +
      '<label>Saturation<input type="range" min="0" max="' + F.maxSat + '" step="0.5" data-k="s"></label>' +
      '<label>Hue<input type="range" min="0" max="360" step="1" data-k="h"></label></div></div>' +
      '<div class="lab-sw"></div>';
    var cv = box.querySelector('canvas'), cx = cv.getContext('2d'), knob = box.querySelector('.knob');
    var hexIn = box.querySelector('input[type=text]'), chip = box.querySelector('.chip');
    var rng = { h: box.querySelector('[data-k=h]'), s: box.querySelector('[data-k=s]'), l: box.querySelector('[data-k=l]') };
    var sw = box.querySelector('.lab-sw');
    F.presets.forEach(function (p) {
      var b = el('button', { title: p[0] + ' ' + p[1], 'aria-label': p[0] + ' ' + p[1], style: 'background:' + p[1] });
      b.dataset.hex = p[1];
      b.onclick = function () { setColour(fam, p[1]); };
      sw.appendChild(b);
    });

    var hsl = hexToHsl(state[fam]), drawnL = null;
    /* wheel: angle = hue (0° at top, clockwise), radius = saturation (0 → maxSat), drawn at current lightness */
    function drawWheel(L) {
      var W = cv.width, R = W / 2, img = cx.createImageData(W, W), d = img.data;
      for (var y = 0; y < W; y++) for (var x = 0; x < W; x++) {
        var dx = x - R, dy = y - R, r = Math.sqrt(dx * dx + dy * dy), i = (y * W + x) * 4;
        if (r > R) continue;
        var h = (Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360;
        var c = hslToRgb(h, (r / R) * F.maxSat, L);
        d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = r > R - 1 ? 255 * (R - r) : 255;
      }
      cx.putImageData(img, 0, 0); drawnL = L;
    }
    function pick(e) {
      var b = cv.getBoundingClientRect(), R = b.width / 2;
      var dx = e.clientX - b.left - R, dy = e.clientY - b.top - R;
      var r = Math.min(1, Math.sqrt(dx * dx + dy * dy) / R);
      hsl = [(Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360, r * F.maxSat, hsl[2]];
      setColour(fam, hslToHex(hsl[0], hsl[1], hsl[2]));
    }
    var wheel = box.querySelector('.lab-wheel');
    wheel.addEventListener('pointerdown', function (e) { wheel.setPointerCapture(e.pointerId); pick(e); });
    wheel.addEventListener('pointermove', function (e) { if (wheel.hasPointerCapture(e.pointerId)) pick(e); });
    ['h', 's', 'l'].forEach(function (k, idx) {
      rng[k].addEventListener('input', function () {
        hsl[idx] = +rng[k].value; setColour(fam, hslToHex(hsl[0], hsl[1], hsl[2]));
      });
    });
    hexIn.addEventListener('change', function () {
      var v = validHex(hexIn.value);
      if (v) { hsl = hexToHsl(v); setColour(fam, v); } else hexIn.value = state[fam];
    });

    return {
      el: box,
      refresh: function () {
        var cur = state[fam];
        /* only resync HSL from hex when the change came from elsewhere (preset, A/B, reset) —
           keeps hue stable while dragging saturation down to 0 */
        if (hslToHex(hsl[0], hsl[1], hsl[2]) !== cur) hsl = hexToHsl(cur);
        if (drawnL === null || Math.abs(drawnL - hsl[2]) > .4) drawWheel(hsl[2]);
        var ang = hsl[0] * Math.PI / 180, rr = Math.min(1, hsl[1] / F.maxSat) * 50;
        knob.style.left = (50 + Math.sin(ang) * rr) + '%'; knob.style.top = (50 - Math.cos(ang) * rr) + '%';
        knob.style.background = cur; chip.style.background = cur;
        if (document.activeElement !== hexIn) hexIn.value = cur;
        rng.h.value = hsl[0]; rng.s.value = hsl[1]; rng.l.value = hsl[2];
        rng.l.style.background = 'linear-gradient(90deg,#000,' + hslToHex(hsl[0], hsl[1], 50) + ',#fff)';
        rng.s.style.background = 'linear-gradient(90deg,' + hslToHex(hsl[0], 0, hsl[2]) + ',' + hslToHex(hsl[0], F.maxSat, hsl[2]) + ')';
        rng.h.style.background = 'linear-gradient(90deg,' + [0, 60, 120, 180, 240, 300, 360].map(function (h) { return hslToHex(h, Math.max(hsl[1], 40), 50); }).join(',') + ')';
        sw.querySelectorAll('button').forEach(function (b) { b.classList.toggle('on', b.dataset.hex === cur); });
      }
    };
  }

  /* one row per feature: label + an option chip for the original and each alternative */
  function featureRow(f) {
    return '<div class="lab-feat" data-f="' + f.id + '"><div class="lab-feat-h"><span>' + f.label + '</span>' +
      (f.replay ? '<button class="lab-replay" data-a="replay" data-id="' + f.id + '" title="Replay animation">↻ Replay</button>' : '') + '</div>' +
      '<div class="lab-opts">' + f.opts.map(function (o, i) {
        return '<button data-a="opt" data-id="' + f.id + '" data-v="' + o[0] + '"><em>' + (i ? String.fromCharCode(64 + i) : 'Orig') + '</em>' + o[1] + '</button>';
      }).join('') + '</div></div>';
  }
  function featurePanel(tab) {
    var mine = FEATURES.filter(function (f) { return f.tab === tab && f.pages && onPage(f); });
    var site = FEATURES.filter(function (f) { return f.tab === tab && !f.pages; });
    var others = FEATURES.filter(function (f) { return f.tab === tab && f.pages && !onPage(f); });
    var PAGE_NAME = { index: 'Home', history: 'History', people: 'Our People', services: 'Services', news: 'News', contact: 'Contact' }[PAGE] || PAGE;
    return (mine.length ? '<section><h3>On this page · ' + PAGE_NAME + '</h3>' + mine.map(featureRow).join('') + '</section>' : '') +
      (site.length ? '<section><h3>Every page</h3>' + site.map(featureRow).join('') + '</section>' : '') +
      (others.length ? '<section><p class="lab-note">' + others.length + ' more on other pages: ' +
        others.map(function (f) { return f.label + ' (' + f.pages.join(', ').replace('index', 'home') + ')'; }).join(' · ') + '</p></section>' : '') +
      '<section><button class="lab-btn" data-a="reset-tab" data-tab="' + tab + '">Reset this tab to original</button></section>';
  }

  var TABS = [['colour', 'Colour'], ['type', 'Type'], ['design', 'Design'], ['motion', 'Motion'], ['compare', 'Compare']];
  function build() {
    var tab = el('button', { id: 'lab-tab', 'aria-controls': 'lab', 'aria-expanded': 'false' }, 'Design Lab');
    var panel = el('aside', { id: 'lab', 'aria-label': 'Design Lab' });
    panel.innerHTML =
      '<div class="lab-head"><div><h2>Design Lab</h2><small>Pick variations · compare A/B · save favourites</small></div>' +
      '<button class="x" aria-label="Close Design Lab">×</button></div>' +
      '<div class="lab-tabs" role="tablist">' + TABS.map(function (t) { return '<button role="tab" data-tab="' + t[0] + '">' + t[1] + '<small></small></button>'; }).join('') + '</div>' +
      '<div class="lab-body">' +
        '<div data-panel="colour">' +
          '<section><h3>Colour scale</h3><div class="lab-scale"><div class="g"><span>Grey</span><span data-o="grey"></span></div><div class="r"><span>Red</span><span data-o="red"></span></div></div></section>' +
          '<section class="pickers"></section>' +
          '<section><h3>All shades in use</h3><div class="lab-tokens"></div><div class="lab-contrast"></div></section>' +
          '<section><button class="lab-btn" data-a="reset-colour">Reset colours to original</button></section>' +
        '</div>' +
        '<div data-panel="type">' + featurePanel('type') + '</div>' +
        '<div data-panel="design">' + featurePanel('design') + '</div>' +
        '<div data-panel="motion">' + featurePanel('motion') + '</div>' +
        '<div data-panel="compare">' +
          '<section><h3>A / B compare</h3><div class="lab-ab">' +
            ['a', 'b'].map(function (k) { return '<div class="lab-slot" data-slot="' + k + '"><div class="lbl">' + k.toUpperCase() + '</div><div class="sw"></div><button class="lab-btn" data-a="set-' + k + '">Set current as ' + k.toUpperCase() + '</button></div>'; }).join('') +
            '<button class="lab-btn primary lab-flip" data-a="flip">Flip A ⇄ B</button></div>' +
            '<p class="lab-note">A and B hold the whole design — colours plus every Type, Design and Motion choice. Press <b>F</b> anywhere to flip.</p></section>' +
          '<section><h3>Shortlist</h3><ol class="lab-list"></ol></section>' +
          '<section><div class="lab-btns"><button class="lab-btn" data-a="reset-all">Reset everything to original</button></div></section>' +
        '</div>' +
      '</div>' +
      '<div class="lab-foot"><button class="lab-btn primary" data-a="save">♥ Save design</button><button class="lab-btn" data-a="share">Copy share link</button></div>';
    document.body.appendChild(panel); document.body.appendChild(tab);

    var pickers = { red: makePicker('red'), grey: makePicker('grey') };
    panel.querySelector('.pickers').append(pickers.red.el, pickers.grey.el);

    function setOpen(o) {
      state.open = o; document.body.classList.toggle('lab-open', o);
      tab.setAttribute('aria-expanded', o); tab.textContent = o ? 'Close' : 'Design Lab'; save();
    }
    tab.onclick = function () { setOpen(!state.open); };
    panel.querySelector('.x').onclick = function () { setOpen(false); };
    setOpen(!!state.open);

    function flip() {
      if (!state.a || !state.b) { toast('Set both A and B first'); return; }
      var next = state.live === 'a' ? 'b' : 'a';
      useCombo(state[next], next); toast('Showing ' + next.toUpperCase());
    }
    function resetFeatures(filter) {
      var c = current(); FEATURES.forEach(function (f) { if (filter(f)) delete c.v[f.id]; }); useCombo(c);
    }
    panel.addEventListener('click', function (e) {
      var b = e.target.closest('[data-a],[data-tab]'); if (!b) return;
      if (!b.dataset.a) { state.tab = b.dataset.tab; changed(); panel.querySelector('.lab-body').scrollTop = 0; return; }
      var a = b.dataset.a, cur = current();
      if (a === 'opt') setVariant(b.dataset.id, b.dataset.v);
      else if (a === 'replay') document.dispatchEvent(new CustomEvent('fhsn:variant', { detail: { id: b.dataset.id, value: state.v[b.dataset.id] || 'orig' } }));
      else if (a === 'save') {
        if (state.list.some(function (c) { return key(c) === key(cur); })) { toast('Already in shortlist'); return; }
        cur.id = Date.now(); cur.name = 'Design ' + (state.list.length + 1); cur.fav = false;
        state.list.push(cur); changed(); toast('Saved to shortlist');
      } else if (a === 'share') {
        var v = Object.keys(cur.v).map(function (k) { return k + '.' + cur.v[k]; }).join('~');
        var url = location.origin + location.pathname + '?red=' + cur.red.slice(1) + '&grey=' + cur.grey.slice(1) + (v ? '&v=' + v : '');
        (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject())
          .then(function () { toast('Link copied'); }, function () { window.prompt('Copy this link', url); });
      }
      else if (a === 'reset-colour') { cur.red = ORIGINAL.red; cur.grey = ORIGINAL.grey; useCombo(cur); toast('Original colours restored'); }
      else if (a === 'reset-tab') { resetFeatures(function (f) { return f.tab === b.dataset.tab; }); toast('Tab reset to original'); }
      else if (a === 'reset-all') { useCombo({ red: ORIGINAL.red, grey: ORIGINAL.grey, v: {} }); toast('Original design restored'); }
      else if (a === 'set-a' || a === 'set-b') { state[a.slice(4)] = cur; state.live = a.slice(4); changed(); }
      else if (a === 'flip') flip();
      else if (a === 'use') useCombo(state.list[+b.dataset.i]);
      else if (a === 'fav') { var c = state.list[+b.dataset.i]; c.fav = !c.fav; changed(); }
      else if (a === 'del') { state.list.splice(+b.dataset.i, 1); changed(); }
    });
    document.addEventListener('keydown', function (e) {
      if ((e.key === 'f' || e.key === 'F') && !e.ctrlKey && !e.metaKey && !e.altKey && !/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) flip();
    });

    ui = {
      refresh: function () {
        /* tabs + change counts */
        var counts = { colour: (state.red !== ORIGINAL.red) + (state.grey !== ORIGINAL.grey), compare: state.list.length };
        FEATURES.forEach(function (f) { if (state.v[f.id]) counts[f.tab] = (counts[f.tab] || 0) + 1; });
        panel.querySelectorAll('.lab-tabs button').forEach(function (t) {
          var k = t.dataset.tab; t.classList.toggle('on', state.tab === k); t.setAttribute('aria-selected', state.tab === k);
          t.querySelector('small').textContent = counts[k] ? (k === 'compare' ? counts[k] + ' saved' : counts[k] + ' changed') : '';
        });
        panel.querySelectorAll('[data-panel]').forEach(function (p) { p.hidden = p.dataset.panel !== state.tab; });

        /* colour */
        pickers.red.refresh(); pickers.grey.refresh();
        panel.querySelector('[data-o=red]').textContent = state.red;
        panel.querySelector('[data-o=grey]').textContent = state.grey;
        var all = Object.assign(derive('grey', state.grey), derive('red', state.red));
        panel.querySelector('.lab-tokens').innerHTML = Object.keys(all).map(function (k) {
          return '<span title="' + k + ' ' + all[k] + '" style="background:' + all[k] + '"></span>';
        }).join('');
        var cg = contrast(PAPER, all['--char']), cr = contrast(PAPER, all['--red']);
        panel.querySelector('.lab-contrast').innerHTML =
          '<div style="background:' + all['--char'] + '">Text on grey <b class="' + (cg < 4.5 ? 'bad' : '') + '">' + cg.toFixed(1) + ':1</b></div>' +
          '<div style="background:' + all['--red'] + '">Text on red <b class="' + (cr < 4.5 ? 'bad' : '') + '">' + cr.toFixed(1) + ':1</b></div>';

        /* variant chips */
        panel.querySelectorAll('.lab-opts button').forEach(function (o) {
          o.classList.toggle('on', (state.v[o.dataset.id] || 'orig') === o.dataset.v);
        });

        /* compare */
        ['a', 'b'].forEach(function (k) {
          var slot = panel.querySelector('[data-slot=' + k + ']'), c = state[k];
          slot.classList.toggle('live', state.live === k);
          slot.querySelector('.sw').innerHTML = c ? mini(c.red, c.grey) + '<small>' + nChanges(c.v) + ' design changes</small>' : '<div class="empty">empty</div>';
        });
        var ol = panel.querySelector('.lab-list'), curKey = key(current());
        ol.innerHTML = state.list.length ? state.list.map(function (c, i) {
          return '<li class="' + (key(c) === curKey ? 'cur' : '') + '">' + mini(c.red, c.grey) +
            '<span class="nm">' + c.name + '<small>' + c.red + ' · ' + c.grey + ' · ' + nChanges(c.v) + ' design changes</small></span>' +
            '<button class="fav' + (c.fav ? ' on' : '') + '" data-a="fav" data-i="' + i + '" title="Mark as preferred" aria-label="Mark ' + c.name + ' as preferred">♥</button>' +
            '<button data-a="use" data-i="' + i + '" title="Apply" aria-label="Apply ' + c.name + '">▶</button>' +
            '<button data-a="del" data-i="' + i + '" title="Remove" aria-label="Remove ' + c.name + '">×</button></li>';
        }).join('') : '<li class="lab-empty">Nothing saved yet — set up a design you like and hit ♥ Save design.</li>';
      }
    };
    ui.refresh();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
