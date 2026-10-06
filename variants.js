/* ============================================================
   FHSN — Design Lab variant behaviour
   The parts of the alternative designs that CSS alone can't do.
   Loaded after redesign.js (uses its V() / onVariant() helpers).
   ============================================================ */
(function () {
  /* ---------- practice cards: 3D tilt ---------- */
  document.querySelectorAll('.card').forEach(function (card) {
    card.addEventListener('mousemove', function (e) {
      if (V('cards') !== 'tilt') return;
      var r = card.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
      card.style.transform = 'rotateX(' + (-py * 14).toFixed(2) + 'deg) rotateY(' + (px * 14).toFixed(2) + 'deg)';
    });
    card.addEventListener('mouseleave', function () { if (card.style.transform.indexOf('rotate') > -1) card.style.transform = 'none'; });
  });
  onVariant('cards', function () { document.querySelectorAll('.card').forEach(function (c) { if (c.style.transform.indexOf('rotate') > -1) c.style.transform = 'none'; }); });

  /* ---------- people: initials for the avatar roster ---------- */
  document.querySelectorAll('.person-pill').forEach(function (p) {
    var w = p.textContent.trim().split(/\s+/);
    p.dataset.initials = (w[0][0] + (w.length > 1 ? w[w.length - 1][0] : '')).toUpperCase();
  });

  /* ---------- loader: extra markup + replay when the style changes ---------- */
  var loader = document.getElementById('site-loader');
  if (loader) {
    loader.insertAdjacentHTML('beforeend', '<div class="ld-bar"><b>fhsn</b><span></span></div><div class="ld-mono">fhsn</div>');
    onVariant('loader', function () {
      loader.classList.remove('hide');
      setTimeout(function () { loader.classList.add('hide'); }, 1900);
    });
  }

  /* ---------- ticker: second row running the other way ---------- */
  var track = document.getElementById('track');
  if (track) {
    var rev = track.cloneNode(true); rev.removeAttribute('id'); rev.classList.add('rev');
    track.parentNode.appendChild(rev);
  }

  /* ---------- page backdrops (services + news) ---------- */
  var page = (location.pathname.split('/').pop() || 'index.html').replace('.html', '') || 'index';
  var DEFAULT_BD = { services: 'aurora', news: 'wave' }[page];
  if (!DEFAULT_BD) return;
  var body = document.body;
  function el(cls, html, id) {
    var d = document.createElement('div'); if (cls) d.className = cls; if (id) d.id = id;
    d.setAttribute('aria-hidden', 'true'); if (html) d.innerHTML = html;
    body.insertBefore(d, body.firstChild); return d;
  }
  function loadThree(cb) {
    if (window.THREE) return cb();
    var s = document.createElement('script');
    s.src = 'https://unpkg.com/three@0.128.0/build/three.min.js';
    s.integrity = 'sha384-CI3ELBVUz9XQO+97x6nwMDPosPR5XvsxW2ua7N1Xeygeh1IxtgqtCkGfQY9WWdHu'; s.crossOrigin = 'anonymous';
    s.onload = cb; document.head.appendChild(s);
  }
  function backdrop() {
    var want = V('backdrop'); if (want === 'orig') want = DEFAULT_BD;
    var aur = document.querySelector('.svc-aurora'), wave = document.getElementById('wave-grid'),
        scrim = document.querySelector('.wave-scrim'), orbs = document.querySelector('.bd-orbs');
    if (want === 'aurora' && !aur) aur = el('svc-aurora', '<div class="aur"></div>');
    if (want === 'orbs' && !orbs) orbs = el('bd-orbs', '<i></i><i></i><i></i>');
    if (want === 'wave' && !wave) {
      scrim = el('wave-scrim'); wave = el('', '', 'wave-grid');
      loadThree(function () { window.fhsnWaveGrid(); });
    }
    if (aur) aur.style.display = want === 'aurora' ? '' : 'none';
    if (wave) wave.style.display = want === 'wave' ? '' : 'none';
    if (scrim) scrim.style.display = want === 'wave' ? '' : 'none';
    if (orbs) orbs.style.display = want === 'orbs' ? '' : 'none';
    body.classList.toggle('svc-aurora-page', want === 'aurora');
    body.classList.toggle('wave-page', want === 'wave');
    body.classList.toggle('orbs-page', want === 'orbs');
    body.classList.toggle('plain-page', want === 'plain');
  }
  backdrop(); onVariant('backdrop', backdrop);
})();
