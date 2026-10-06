/* ============================================================
   FHSN — Design Lab (A/B preference tool)
   Loaded in <head> on every page so a saved palette is applied
   before first paint. Re-tints the :root tokens in redesign.css
   and fires 'fhsn:palette' for canvas/WebGL (see redesign.js).

   Colour model: the client picks ONE base red and ONE base grey.
   Every other shade in that family (maroon, maroon-deep, char …)
   keeps its original relationship to the base — same hue offset,
   same saturation offset, same lightness ratio — so the site's
   depth/contrast structure survives any choice.

   State: localStorage (per browser) + ?red=&grey= share links.
   ============================================================ */
(function () {
  var ROOT = document.documentElement;
  var KEY = 'fhsn-lab-v1';

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

  /* ---------- colour math ---------- */
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

  /* ---------- state ---------- */
  var state = { red: ORIGINAL.red, grey: ORIGINAL.grey, list: [], a: null, b: null, live: null, open: false };
  try { var saved = JSON.parse(localStorage.getItem(KEY)); if (saved) for (var s in saved) state[s] = saved[s]; } catch (e) {}
  var qs = new URLSearchParams(location.search);
  if (validHex(qs.get('red'))) state.red = validHex(qs.get('red'));
  if (validHex(qs.get('grey'))) state.grey = validHex(qs.get('grey'));
  if (qs.get('lab') === '1') state.open = true;   /* ?lab=1 opens the panel — send this to the client */
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }

  var pending = false;
  function apply() {
    var all = Object.assign(derive('red', state.red), derive('grey', state.grey));
    for (var k in all) ROOT.style.setProperty(k, all[k]);
    if (!pending) {
      pending = true;
      requestAnimationFrame(function () {
        pending = false; save();
        document.dispatchEvent(new CustomEvent('fhsn:palette', { detail: { red: state.red, grey: state.grey } }));
        if (ui) ui.refresh();
      });
    }
    return all;
  }
  function setColour(fam, hex, keepLive) {
    state[fam] = hex.toUpperCase();
    if (!keepLive) state.live = null;
    apply();
  }
  apply();   /* runs in <head>: no flash of the original palette */

  /* ---------- UI ---------- */
  var ui = null;
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
        if (Math.abs(drawnL - hsl[2]) > .4 || drawnL === null) drawWheel(hsl[2]);
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

  function build() {
    var tab = el('button', { id: 'lab-tab', 'aria-controls': 'lab', 'aria-expanded': 'false' }, 'Design Lab');
    var panel = el('aside', { id: 'lab', 'aria-label': 'Design Lab' });
    panel.innerHTML =
      '<div class="lab-head"><div><h2>Design Lab</h2><small>Pick variations · compare A/B · save favourites</small></div>' +
      '<button class="x" aria-label="Close Design Lab">×</button></div>' +
      '<div class="lab-tabs"><button class="on">Colour</button><button disabled>Type<small>soon</small></button><button disabled>Motion<small>soon</small></button></div>' +
      '<div class="lab-body">' +
        '<section><h3>Colour scale</h3><div class="lab-scale"><div class="g"><span>Grey</span><span data-o="grey"></span></div><div class="r"><span>Red</span><span data-o="red"></span></div></div></section>' +
        '<section class="pickers"></section>' +
        '<section><h3>All shades in use</h3><div class="lab-tokens"></div><div class="lab-contrast"></div></section>' +
        '<section><div class="lab-btns"><button class="lab-btn primary" data-a="save">♥ Save combo</button><button class="lab-btn" data-a="share">Copy share link</button><button class="lab-btn" data-a="reset">Reset to original</button></div></section>' +
        '<section><h3>A / B compare</h3><div class="lab-ab">' +
          ['a', 'b'].map(function (k) { return '<div class="lab-slot" data-slot="' + k + '"><div class="lbl">' + k.toUpperCase() + '</div><div class="sw"></div><button class="lab-btn" data-a="set-' + k + '">Set current as ' + k.toUpperCase() + '</button></div>'; }).join('') +
          '<button class="lab-btn primary lab-flip" data-a="flip">Flip A ⇄ B</button></div>' +
          '<p class="lab-note">Tip: press <b>F</b> to flip between A and B while browsing.</p></section>' +
        '<section><h3>Shortlist</h3><ol class="lab-list"></ol></section>' +
      '</div>';
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

    function useCombo(c, live) { state.red = c.red; state.grey = c.grey; state.live = live || null; apply(); }
    function flip() {
      if (!state.a || !state.b) { toast('Set both A and B first'); return; }
      var next = state.live === 'a' ? 'b' : 'a';
      useCombo(state[next], next); toast('Showing ' + next.toUpperCase());
    }
    panel.addEventListener('click', function (e) {
      var b = e.target.closest('[data-a]'); if (!b) return;
      var a = b.dataset.a, cur = { red: state.red, grey: state.grey };
      if (a === 'save') {
        if (state.list.some(function (c) { return c.red === cur.red && c.grey === cur.grey; })) { toast('Already in shortlist'); return; }
        state.list.push({ id: Date.now(), name: 'Combo ' + (state.list.length + 1), red: cur.red, grey: cur.grey, fav: false });
        save(); ui.refresh(); toast('Saved to shortlist');
      } else if (a === 'share') {
        var url = location.origin + location.pathname + '?red=' + cur.red.slice(1) + '&grey=' + cur.grey.slice(1);
        (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject())
          .then(function () { toast('Link copied'); }, function () { window.prompt('Copy this link', url); });
      } else if (a === 'reset') { useCombo(ORIGINAL); toast('Original colours restored'); }
      else if (a === 'set-a' || a === 'set-b') { state[a.slice(4)] = cur; state.live = a.slice(4); save(); ui.refresh(); }
      else if (a === 'flip') flip();
      else if (a === 'use') useCombo(state.list[+b.dataset.i]);
      else if (a === 'fav') { var c = state.list[+b.dataset.i]; c.fav = !c.fav; save(); ui.refresh(); }
      else if (a === 'del') { state.list.splice(+b.dataset.i, 1); save(); ui.refresh(); }
    });
    document.addEventListener('keydown', function (e) {
      if ((e.key === 'f' || e.key === 'F') && !e.ctrlKey && !e.metaKey && !e.altKey && !/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) flip();
    });

    ui = {
      refresh: function () {
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
        ['a', 'b'].forEach(function (k) {
          var slot = panel.querySelector('[data-slot=' + k + ']');
          slot.classList.toggle('live', state.live === k);
          slot.querySelector('.sw').innerHTML = state[k] ? mini(state[k].red, state[k].grey) : '<div class="empty">empty</div>';
        });
        var ol = panel.querySelector('.lab-list');
        ol.innerHTML = state.list.length ? state.list.map(function (c, i) {
          var cur = c.red === state.red && c.grey === state.grey;
          return '<li class="' + (cur ? 'cur' : '') + '">' + mini(c.red, c.grey) +
            '<span class="nm">' + c.name + '<small>' + c.red + ' · ' + c.grey + '</small></span>' +
            '<button class="fav' + (c.fav ? ' on' : '') + '" data-a="fav" data-i="' + i + '" title="Mark as preferred" aria-label="Mark ' + c.name + ' as preferred">♥</button>' +
            '<button data-a="use" data-i="' + i + '" title="Apply" aria-label="Apply ' + c.name + '">▶</button>' +
            '<button data-a="del" data-i="' + i + '" title="Remove" aria-label="Remove ' + c.name + '">×</button></li>';
        }).join('') : '<li class="lab-empty">No combos saved yet — pick colours and hit ♥ Save combo.</li>';
      }
    };
    ui.refresh();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
