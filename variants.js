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

  /* ---------- page transitions (whole site) ---------- */
  var ROOT = document.documentElement;
  function overlay(kind) {
    var o = document.createElement('div'); o.className = 'pt-ov pt-' + kind; o.setAttribute('aria-hidden', 'true');
    o.innerHTML = kind === 'shutter' ? '<i></i><i></i><i></i><i></i><i></i>' : '<i></i>';
    document.body.appendChild(o); return o;
  }
  if (ROOT.classList.contains('pt-enter')) {       /* lab.js flagged an arrival from another page */
    var kind = V('pagetrans');
    if (kind === 'fade') {
      requestAnimationFrame(function () { ROOT.classList.add('pt-go'); });
      setTimeout(function () { ROOT.classList.remove('pt-enter', 'pt-go'); }, 700);
    } else {
      var o = overlay(kind); o.classList.add('cover'); ROOT.classList.remove('pt-enter');
      requestAnimationFrame(function () { requestAnimationFrame(function () { o.classList.add('out'); }); });
      setTimeout(function () { o.remove(); }, 1400);
    }
  }
  document.addEventListener('click', function (e) {
    var kind = V('pagetrans'); if (kind === 'orig') return;
    var a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === '_blank') return;
    var url = new URL(a.href, location.href);
    if (url.origin !== location.origin || !/(\.html|\/)$/.test(url.pathname)) return;
    if (url.pathname === location.pathname && url.hash) return;
    e.preventDefault();
    try { sessionStorage.setItem('fhsn-pt', '1'); } catch (er) {}
    if (kind === 'fade') ROOT.classList.add('pt-leave');
    else { var ov = overlay(kind); requestAnimationFrame(function () { requestAnimationFrame(function () { ov.classList.add('in'); }); }); }
    setTimeout(function () { location.href = a.href; }, kind === 'fade' ? 380 : 700);
  });
  addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    ROOT.classList.remove('pt-leave');
    document.querySelectorAll('.pt-ov').forEach(function (o) { o.remove(); });
  });

  /* ---------- custom cursor (whole site, mouse only) ---------- */
  if (window.matchMedia('(pointer: fine)').matches) {
    var cur = document.createElement('div'); cur.className = 'cur'; cur.setAttribute('aria-hidden', 'true');
    cur.innerHTML = '<span></span>'; document.body.appendChild(cur);
    var label = cur.firstChild, mx = -100, my = -100, px = -100, py = -100, raf = null;
    var labelFor = function (el) {
      var h = el.getAttribute('href') || '';
      if (/^tel:/.test(h)) return 'Call';
      if (/^mailto:/.test(h)) return 'Email';
      if (/INPUT|TEXTAREA|SELECT/.test(el.tagName)) return 'Type';
      return el.tagName === 'A' ? 'Open' : 'Click';
    };
    var loop = function () {
      var k = V('cursor') === 'dot' ? .5 : .22;
      px += (mx - px) * k; py += (my - py) * k;
      cur.style.transform = 'translate3d(' + px + 'px,' + py + 'px,0)';
      raf = Math.abs(mx - px) + Math.abs(my - py) > .3 ? requestAnimationFrame(loop) : null;
    };
    addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      if (V('cursor') === 'orig') return;
      var hot = e.target.closest && e.target.closest('a,button,input,select,textarea,[role=button]');
      cur.classList.toggle('hot', !!hot);
      if (V('cursor') === 'label') label.textContent = hot ? labelFor(hot) : '';
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
  }

  /* ---------- scroll progress (whole site) ---------- */
  var bar = document.createElement('div'); bar.className = 'sprog'; bar.setAttribute('aria-hidden', 'true'); bar.innerHTML = '<i></i>';
  var ring = document.createElement('button'); ring.className = 'sprog-ring'; ring.type = 'button'; ring.setAttribute('aria-label', 'Back to top');
  ring.innerHTML = '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="21"/><circle class="p" cx="24" cy="24" r="21"/></svg><span aria-hidden="true">↑</span>';
  document.body.appendChild(bar); document.body.appendChild(ring);
  ring.addEventListener('click', function () { scrollTo({ top: 0, behavior: 'smooth' }); });
  var updProgress = function () {
    var h = document.documentElement.scrollHeight - innerHeight, p = h > 0 ? scrollY / h : 0;
    ROOT.style.setProperty('--sp', p.toFixed(4)); ring.classList.toggle('show', scrollY > 400);
  };
  addEventListener('scroll', updProgress, { passive: true }); addEventListener('resize', updProgress); updProgress();
})();
