/* ============================================================
   FHSN — Design Lab · page-specific features
   Every page gets its own layouts, backgrounds, motion, buttons and
   extra features (registry in lab.js, styles in pages.css). Extra
   markup is built once here and shown/hidden by html[data-v-<id>];
   anything that has to run or rebuild listens for 'fhsn:variant'.
   The hero seal is deliberately left alone.
   Needs redesign.js first (V, onVariant, tokRGBA, setNode).
   ============================================================ */
(function () {
  'use strict';
  const ROOT = document.documentElement, body = document.body;
  const PAGE = ROOT.dataset.page || 'index';
  const RMO = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const G = window.gsap && !RMO ? window.gsap : null;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function mk(tag, cls, html, attrs) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    for (const k in attrs || {}) e.setAttribute(k, attrs[k]);
    return e;
  }
  const deco = (tag, cls, html) => mk(tag, cls, html, { 'aria-hidden': 'true' });
  let refreshT;
  function refresh() { clearTimeout(refreshT); refreshT = setTimeout(() => { if (window.ScrollTrigger) ScrollTrigger.refresh(); }, 80); }
  document.addEventListener('fhsn:variant', refresh);
  /* run now with the current choice, and again whenever it changes (or is replayed) */
  function bind(id, fn) { fn(V(id)); onVariant(id, fn); }
  function whenSeen(el, fn) {
    if (!('IntersectionObserver' in window)) return fn();
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); fn(); } }, { rootMargin: '0px 0px -12% 0px' });
    io.observe(el);
  }
  function inView(el, cls) { new IntersectionObserver(es => es.forEach(e => body.classList.toggle(cls, e.isIntersecting))).observe(el); }
  function scrollToEl(el, off) { scrollTo({ top: el.getBoundingClientRect().top + scrollY - (off == null ? 100 : off), behavior: RMO ? 'auto' : 'smooth' }); }
  const initials = n => { const w = n.trim().split(/\s+/); return (w[0][0] + (w.length > 1 ? w[w.length - 1][0] : '')).toUpperCase(); };
  function ringText(text) {
    const cs = Array.from(text), st = 360 / cs.length;
    return '<span class="ring-text" aria-hidden="true">' + cs.map((c, i) => '<i style="transform:rotate(' + (i * st).toFixed(2) + 'deg)">' + (c === ' ' ? '&nbsp;' : esc(c)) + '</i>').join('') + '</span>';
  }
  /* wrap every character in span.tc (keeps nested elements such as the history name cards) */
  function splitChars(el) {
    if (el.dataset.split) return; el.dataset.split = '1';
    (function walk(node) {
      Array.from(node.childNodes).forEach(n => {
        if (n.nodeType === 3) {
          const f = document.createDocumentFragment();
          Array.from(n.textContent).forEach(ch => { const s = document.createElement('span'); s.className = 'tc'; s.textContent = ch; f.appendChild(s); });
          n.replaceWith(f);
        } else if (n.nodeType === 1) walk(n);
      });
    })(el);
  }
  function killAll(list) { list.forEach(t => { if (t.scrollTrigger) t.scrollTrigger.kill(); t.kill(); }); list.length = 0; }
  function carousel(track) {
    const nav = mk('div', 'car-nav', '<button type="button" class="car-btn" data-d="-1" aria-label="Previous">←</button><span class="car-bar" aria-hidden="true"><i></i></span><button type="button" class="car-btn" data-d="1" aria-label="Next">→</button>');
    track.after(nav);
    nav.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      const card = Array.from(track.children).find(c => !c.hidden);
      track.scrollBy({ left: (card ? card.getBoundingClientRect().width + 18 : 320) * +b.dataset.d, behavior: 'smooth' });
    });
    const upd = () => { const m = track.scrollWidth - track.clientWidth; nav.style.setProperty('--cp', m > 2 ? Math.max(.15, (track.scrollLeft + track.clientWidth) / track.scrollWidth).toFixed(3) : 1); };
    track.addEventListener('scroll', upd, { passive: true });
    addEventListener('resize', upd);
    document.addEventListener('fhsn:variant', () => requestAnimationFrame(upd));
    upd();
  }
  /* flowing silk ribbons on a canvas (services background) */
  function ribbons(canvas) {
    const x = canvas.getContext('2d'); let w = 0, h = 0, t = 0, run = false, cols = [];
    const size = () => { const d = Math.min(devicePixelRatio || 1, 1.5); w = innerWidth; h = innerHeight; canvas.width = w * d; canvas.height = h * d; x.setTransform(d, 0, 0, d, 0, 0); };
    const pal = () => { cols = [tokRGBA('--red', .55), 'rgba(201,162,39,.45)', tokRGBA('--maroon-mid', .6), 'rgba(242,239,234,.25)']; };
    addEventListener('resize', () => { if (run) size(); });
    document.addEventListener('fhsn:palette', pal);
    function draw() {
      x.clearRect(0, 0, w, h);
      for (let r = 0; r < 4; r++) {
        x.strokeStyle = cols[r]; x.lineWidth = 1;
        for (let k = 0; k < 22; k++) {
          x.globalAlpha = .05 + (k / 22) * .3; x.beginPath();
          for (let px = -20; px <= w + 20; px += 18) {
            const y = h * (.18 + r * .2) + Math.sin(px * .0021 + t * (.8 + r * .25) + r * 1.7 + k * .045) * h * .1 + Math.sin(px * .0057 - t * 1.3 + r) * 16 + k * 2.4;
            if (px <= -20) x.moveTo(px, y); else x.lineTo(px, y);
          }
          x.stroke();
        }
      }
      x.globalAlpha = 1;
    }
    function frame() { if (!run) return; t += .005; draw(); requestAnimationFrame(frame); }
    return {
      start() { if (run) return; run = true; size(); pal(); if (RMO) draw(); else frame(); },
      stop() { run = false; }
    };
  }

  /* ================================================================ HOME */
  function pageHome() {
    const hero = $('.hero'); if (!hero) return;

    /* info bar for the "anchored low" hero layout */
    hero.appendChild(mk('div', 'hero-bar', '<div class="wrap"><span><b>Est.</b> 1898 · Pretoria</span><span>Attorneys · Notaries · Conveyancers · Administrators of Estates</span><span><b>Tel</b> <a href="tel:+27124240200">012 424 0200</a></span></div>'));

    /* rotating-text ring for the "round badge" hero buttons */
    const cta2 = $('.hero .cta .btn + .btn');
    if (cta2) {
      cta2.setAttribute('aria-label', cta2.textContent.replace('→', '').trim());
      cta2.insertAdjacentHTML('beforeend', ringText('SPEAK TO AN ATTORNEY · SPEAK TO AN ATTORNEY · '));
    }

    const cards = $('#practice .cards'); if (cards) carousel(cards);

    /* firm in numbers — every figure comes from the site's own copy */
    const STATS = [[new Date().getFullYear() - 1898, '', 'Years in practice'], [4, '', 'Specialist departments'], [12, '', 'Attorneys & consultants'], [175, '+', 'Years of combined property experience']];
    const band = mk('section', 'stats', '<div class="wrap stats-row">' + STATS.map(s =>
      '<div class="stat"><div class="sv" data-to="' + s[0] + '" data-suf="' + s[1] + '" role="img" aria-label="' + s[0] + s[1] + '"></div><div class="sl">' + s[2] + '</div></div>').join('') + '</div>',
      { id: 'numbers', 'aria-label': 'The firm in numbers' });
    ($('.ticker') || hero).after(band);
    function renderStats(mode) {
      band.classList.remove('go');
      $$('.sv', band).forEach(sv => {
        const to = sv.dataset.to, suf = sv.dataset.suf;
        if (mode === 'odometer') sv.innerHTML = '<span class="odo-wrap" aria-hidden="true">' + to.split('').map(d => '<span class="odo"><span class="odo-s" data-d="' + d + '">' + '0123456789'.split('').map(n => '<i>' + n + '</i>').join('') + '</span></span>').join('') + (suf ? '<span>' + suf + '</span>' : '') + '</span>';
        else if (mode === 'rings') sv.innerHTML = '<svg viewBox="0 0 120 120" aria-hidden="true"><circle class="rg-bg" cx="60" cy="60" r="52"/><circle class="rg" cx="60" cy="60" r="52"/></svg><span class="num" aria-hidden="true">0' + suf + '</span>';
        else sv.innerHTML = '<span class="num" aria-hidden="true">0' + suf + '</span>';
      });
    }
    function playStats() {
      const mode = V('stats'); if (mode === 'orig') return;
      band.classList.add('go');
      $$('.sv', band).forEach((sv, i) => {
        const to = +sv.dataset.to, suf = sv.dataset.suf;
        if (mode === 'odometer') {
          $$('.odo-s', sv).forEach((s, j) => { s.style.transitionDelay = (i * .12 + j * .1) + 's'; s.style.transform = 'translateY(-' + s.dataset.d + 'em)'; });
          return;
        }
        const num = $('.num', sv), rg = $('.rg', sv);
        if (rg) rg.style.transitionDelay = (i * .12) + 's';
        if (!G) { num.textContent = to + suf; return; }
        const o = { v: 0 };
        G.to(o, { v: to, duration: 1.8, delay: i * .12, ease: 'power2.out', onUpdate: () => { num.textContent = Math.round(o.v) + suf; } });
      });
    }
    bind('stats', mode => { renderStats(mode); if (mode !== 'orig') whenSeen(band, playStats); });
  }

  /* ================================================================ HISTORY */
  function pageHistory() {
    const hero = $('.page-hero'), sec = $('#history'), tl = $('#tl');
    if (!sec || !tl) return;
    const nodes = $$('.node', tl), wrap = $('.wrap', sec);
    const yearText = n => $('.yr', n).textContent.trim();
    const yearOf = n => /^\d{4}$/.test(yearText(n)) ? +yearText(n) : new Date().getFullYear();
    inView(sec, 'in-history');

    /* header: rolling years 1898 → today */
    const yrs = deco('div', 'hero-years', '1898'); hero.appendChild(yrs);
    const yO = { v: 1898 };
    bind('histhero', v => {
      if (v !== 'years') return;
      const end = new Date().getFullYear();
      if (!G) { yrs.textContent = end; return; }
      yO.v = 1898; yrs.textContent = '1898';
      G.to(yO, { v: end, duration: 2.8, delay: .3, ease: 'power2.inOut', overwrite: true, onUpdate: () => { yrs.textContent = Math.round(yO.v); } });
    });

    /* horizontal timeline: pin the section and scroll the eras sideways */
    let hz = null, hzTw = null;
    const dist = () => Math.max(0, tl.scrollWidth - wrap.clientWidth);
    function buildHz() {
      if (window.fhsnTL) fhsnTL.triggers.forEach(t => t.disable(false));
      hzTw = gsap.to(tl, { x: () => -dist(), ease: 'none' });
      hz = ScrollTrigger.create({
        trigger: sec, start: 'top top', end: () => '+=' + (dist() + innerHeight * .25), pin: true, scrub: .6, animation: hzTw, invalidateOnRefresh: true,
        onUpdate: self => {
          const x = self.progress * dist(), edge = x + wrap.clientWidth * .62, from = x + wrap.clientWidth * .05;
          tl.style.setProperty('--hz-ink', Math.min(100, edge / tl.scrollWidth * 100).toFixed(2) + '%');
          nodes.forEach(n => setNode(n, n.offsetLeft < edge && n.offsetLeft + n.offsetWidth > from));
        }
      });
    }
    function killHz() {
      hz.kill(true); hzTw.kill(); hz = hzTw = null;
      gsap.set(tl, { clearProps: 'x' }); tl.style.removeProperty('--hz-ink');
      nodes.forEach(n => setNode(n, false));
      if (window.fhsnTL) fhsnTL.triggers.forEach(t => t.enable(false));
    }
    function tlMode() {
      const want = V('timeline') === 'horizontal' && innerWidth > 900 && !RMO && window.ScrollTrigger && window.gsap;
      if (want && !hz) requestAnimationFrame(() => { buildHz(); ScrollTrigger.refresh(); });
      else if (!want && hz) { killHz(); ScrollTrigger.refresh(); }
    }
    bind('timeline', tlMode);
    let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(tlMode, 200); });

    /* timeline motion: spotlight is CSS; the year counter and typed entries react to eras activating */
    const ctr = deco('div', 'yr-counter', '1898'); body.appendChild(ctr);
    const cO = { v: 1898 };
    function typeNode(n) {
      if (!n.classList.contains('tw') || n.dataset.typed) return;
      n.dataset.typed = '1';
      const cs = $$('.tc', n);
      if (!G) { n.classList.remove('tw'); return; }
      G.fromTo(cs, { opacity: 0 }, { opacity: 1, duration: .01, stagger: Math.min(.022, 1.8 / cs.length),
        onComplete: () => { n.classList.remove('tw'); G.set(cs, { clearProps: 'opacity' }); } });
    }
    document.addEventListener('fhsn:node', e => {
      if (!e.detail.on) return;
      const n = e.detail.node, m = V('histmotion');
      if (m === 'counter') {
        const to = yearOf(n);
        if (!G) { cO.v = to; ctr.textContent = to; return; }
        G.to(cO, { v: to, duration: .9, ease: 'power2.out', overwrite: true, onUpdate: () => { ctr.textContent = Math.round(cO.v); } });
      }
      if (m === 'type') typeNode(n);
    });
    bind('histmotion', m => {
      nodes.forEach(n => {
        const p = $('p', n); if (!p) return;
        delete n.dataset.typed;
        if (m === 'type') { splitChars(p); n.classList.add('tw'); }
        else { n.classList.remove('tw'); $$('.tc', p).forEach(c => { c.style.opacity = ''; }); }
      });
      if (m === 'type') nodes.filter(n => n.classList.contains('on')).forEach(typeNode);
    });

    /* year navigator */
    const years = nodes.map(yearText);
    const nav = mk('div', 'era-nav',
      '<div class="era-list">' + years.map((y, i) => '<button type="button" data-i="' + i + '"><span>' + esc(y) + '</span></button>').join('') + '</div>' +
      '<button type="button" class="era-ring" aria-label="Next era"><svg viewBox="0 0 80 80" aria-hidden="true"><circle class="er-bg" cx="40" cy="40" r="34"/><circle class="er" cx="40" cy="40" r="34"/></svg><b>' + esc(years[0]) + '</b></button>',
      { role: 'navigation', 'aria-label': 'Jump to a year' });
    body.appendChild(nav);
    let act = 0;
    function goNode(i) {
      const n = nodes[i]; if (!n) return;
      if (hz) scrollTo({ top: hz.start + Math.min(1, n.offsetLeft / Math.max(1, dist())) * (hz.end - hz.start) + 2, behavior: 'smooth' });
      else scrollTo({ top: n.getBoundingClientRect().top + scrollY - innerHeight * .45, behavior: RMO ? 'auto' : 'smooth' });
    }
    nav.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      goNode(b.classList.contains('era-ring') ? (act + 1) % nodes.length : +b.dataset.i);
    });
    function track() {
      let idx = -1;
      nodes.forEach((n, i) => { if (n.classList.contains('on')) idx = i; });
      if (idx < 0) nodes.forEach((n, i) => { if (n.getBoundingClientRect().top < innerHeight * .6) idx = i; });
      act = Math.max(0, idx);
      $$('.era-list button', nav).forEach((b, i) => b.classList.toggle('on', i === act));
      let p;
      if (hz) p = hz.progress;
      else { const r = tl.getBoundingClientRect(); p = (innerHeight * .6 - r.top) / r.height; }
      nav.style.setProperty('--p', Math.max(0, Math.min(1, p)).toFixed(3));
      $('.era-ring b', nav).textContent = years[act];
    }
    let tq = false;
    addEventListener('scroll', () => { if (tq) return; tq = true; requestAnimationFrame(() => { tq = false; if (V('eranav') !== 'orig') track(); }); }, { passive: true });
    document.addEventListener('fhsn:node', () => { if (V('eranav') !== 'orig') track(); });
    bind('eranav', v => { if (v !== 'orig') track(); });

    /* closing link: faces */
    const cta = $('.seclink', sec);
    if (cta) cta.insertAdjacentHTML('afterbegin', '<span class="faces" aria-hidden="true"><i>MS</i><i>NW</i><i>GP</i></span>');
  }

  /* ================================================================ OUR PEOPLE */
  function pagePeople() {
    const hero = $('.page-hero'), list = $('.people-pills'), team = $('#people');
    if (!list) return;
    const pills = $$('.person-pill'), blocks = $$('.role-block'), names = pills.map(p => p.textContent.trim());

    /* header: initials mosaic, name marquee, cursor spotlight */
    let tiles = '';
    for (let i = 0; i < 180; i++) tiles += '<span style="--d:' + (Math.random() * 9).toFixed(2) + 's">' + esc(initials(names[i % names.length])) + '</span>';
    hero.appendChild(deco('div', 'hero-mosaic', tiles));
    const row = a => '<div class="hn-row"><div class="hn-track">' + esc((a.join('  ·  ') + '  ·  ').repeat(2)) + '</div></div>';
    hero.appendChild(deco('div', 'hero-names', row(names.slice(0, 6)) + row(names.slice(6)) + row(names.slice(3, 9))));
    hero.addEventListener('pointermove', e => {
      if (V('pplhero') !== 'spot') return;
      const r = hero.getBoundingClientRect();
      hero.style.setProperty('--mx', (e.clientX - r.left) + 'px'); hero.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
    team.addEventListener('pointermove', e => {
      if (V('pplbg') !== 'glow') return;
      const r = team.getBoundingClientRect();
      team.style.setProperty('--gx', (e.clientX - r.left) + 'px'); team.style.setProperty('--gy', (e.clientY - r.top) + 'px');
    });

    /* role filter */
    const roles = blocks.map(b => ({ el: b, name: $('h4', b).textContent.trim(), pills: $$('.person-pill', b) }));
    const bar = mk('div', 'roster-filter',
      '<div class="rf-btns" role="group" aria-label="Filter by role"><button type="button" class="on" data-r="all">All <em>' + pills.length + '</em></button>' +
      roles.map((r, i) => '<button type="button" data-r="' + i + '">' + esc(r.name) + ' <em>' + r.pills.length + '</em></button>').join('') + '</div>' +
      '<label class="rf-search"><span>Find</span><input type="search" placeholder="Search by name…" aria-label="Search the team by name"></label>' +
      '<p class="rf-none" hidden>No one matches that name.</p>');
    list.before(bar);
    let role = 'all', q = '';
    function applyFilter() {
      const m = V('filter'), byRole = m === 'tabs' || m === 'chips', byName = m === 'search';
      let any = false;
      roles.forEach((r, i) => {
        let n = 0;
        r.pills.forEach(p => { const ok = !byName || !q || p.textContent.toLowerCase().indexOf(q) > -1; p.hidden = !ok; if (ok) n++; });
        const show = (!byRole || role === 'all' || role === String(i)) && n > 0;
        if (show && r.el.hidden) { r.el.classList.remove('pop-in'); void r.el.offsetWidth; r.el.classList.add('pop-in'); }
        r.el.hidden = !show; if (show) any = true;
      });
      $('.rf-none', bar).hidden = any;
    }
    bar.addEventListener('click', e => {
      const b = e.target.closest('[data-r]'); if (!b) return;
      role = b.dataset.r; $$('[data-r]', bar).forEach(x => x.classList.toggle('on', x === b));
      applyFilter(); refresh();
    });
    $('input', bar).addEventListener('input', e => { q = e.target.value.trim().toLowerCase(); applyFilter(); refresh(); });
    bind('filter', applyFilter);

    /* name motion: cascade + magnetic (dimming is CSS) */
    const cas = [];
    bind('rostermotion', m => {
      killAll(cas);
      if (G) G.set(pills, { clearProps: 'opacity,transform' });
      if (m === 'cascade' && G) cas.push(G.fromTo(pills, { opacity: 0, y: 24, scale: .86 }, { opacity: 1, y: 0, scale: 1, duration: .55, ease: 'back.out(1.7)', stagger: .045,
        clearProps: 'opacity,transform', scrollTrigger: { trigger: list, start: 'top 82%' } }));
    });
    pills.forEach(p => {
      p.addEventListener('pointermove', e => {
        if (V('rostermotion') !== 'magnet' || !G) return;
        const r = p.getBoundingClientRect();
        G.to(p, { x: (e.clientX - r.left - r.width / 2) * .35, y: (e.clientY - r.top - r.height / 2) * .5, duration: .35, ease: 'power3.out' });
      });
      p.addEventListener('pointerleave', () => { if (V('rostermotion') === 'magnet' && G) G.to(p, { x: 0, y: 0, duration: .7, ease: 'elastic.out(1,.4)' }); });
    });

    /* profiles: tabs, accordion, contact buttons */
    const profs = $$('.profile'); if (!profs.length) return;
    const ptabs = mk('div', 'profile-tabs', profs.map((p, i) => '<button type="button" role="tab" data-i="' + i + '">' + esc($('h3', p).textContent) +
      '<small>' + esc($('.role', p).textContent.split('·')[0].trim()) + '</small></button>').join(''), { role: 'tablist', 'aria-label': 'Profiles' });
    profs[0].before(ptabs);
    const showProf = i => {
      profs.forEach((p, j) => p.classList.toggle('is-active', i === j));
      $$('button', ptabs).forEach((b, j) => { b.classList.toggle('on', i === j); b.setAttribute('aria-selected', i === j); });
      refresh();
    };
    showProf(0);
    ptabs.addEventListener('click', e => { const b = e.target.closest('button'); if (b) showProf(+b.dataset.i); });
    profs.forEach((p, i) => {
      p.classList.toggle('is-open', i === 0);
      p.appendChild(mk('button', 'acc-btn', '+', { type: 'button', 'aria-label': 'Show or hide ' + $('h3', p).textContent }));
      p.addEventListener('click', e => {
        if (V('profiles') !== 'accordion' || e.target.closest('a,.pbtns') || !e.target.closest('.acc-btn,.pfphoto,h3,.role')) return;
        p.classList.toggle('is-open'); refresh();
      });
    });
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href^="#p-"]'); if (!a) return;
      const i = profs.findIndex(p => '#' + p.id === a.getAttribute('href')); if (i < 0) return;
      if (V('profiles') === 'tabs') showProf(i);
      if (V('profiles') === 'accordion') { profs[i].classList.add('is-open'); refresh(); }
    });
    profs.forEach(p => {
      const mail = $('a[href^="mailto:"]', p); if (!mail) return;
      const email = mail.getAttribute('href').slice(7), name = $('h3', p).textContent.trim(), first = name.split(' ')[0];
      mail.after(mk('div', 'pbtns',
        '<div class="pb-pair"><a class="pb-b solid" href="mailto:' + esc(email) + '">Email ' + esc(first) + ' <span aria-hidden="true">→</span></a><a class="pb-b" href="tel:+27124240200">Call 012 424 0200</a></div>' +
        '<div class="pb-copy"><button type="button" class="pb-b" data-email="' + esc(email) + '"><span class="lbl">Copy email</span> <code>' + esc(email) + '</code></button></div>' +
        '<div class="pb-card"><span class="pc-ini" aria-hidden="true">' + esc(initials(name)) + '</span><div><strong>' + esc(name) + '</strong><a href="mailto:' + esc(email) + '">' + esc(email) + '</a><a href="tel:+27124240200">012 424 0200</a></div>' +
        '<a class="pb-b solid" href="./contact.html">Book a consultation →</a></div>'));
    });
    document.addEventListener('click', e => {
      const b = e.target.closest('.pb-copy button'); if (!b) return;
      const done = () => { const l = $('.lbl', b); l.textContent = 'Copied ✓'; b.classList.add('done'); setTimeout(() => { l.textContent = 'Copy email'; b.classList.remove('done'); }, 1800); };
      if (navigator.clipboard) navigator.clipboard.writeText(b.dataset.email).then(done, () => prompt('Copy this email', b.dataset.email));
      else prompt('Copy this email', b.dataset.email);
    });
  }

  /* ================================================================ SERVICES */
  function pageServices() {
    const svcs = $$('.svc'); if (!svcs.length) return;
    const hero = $('.page-hero');
    /* wrapper (display:contents by default) keeps the alternating backgrounds stable and enables the 2×2 grid */
    const dw = mk('div', 'dept-wrap'); svcs[0].before(dw); svcs.forEach(s => dw.appendChild(s));
    const D = svcs.map(s => ({ el: s, id: s.id, num: $('.num', s).textContent.trim(), name: $('h2', s).textContent.trim() }));
    const short = d => d.name.replace('Administration of ', '');
    const DC = {
      companies: { who: 'Millie Shantall-Lurie', note: 'Companies department', btn: 'Email Millie Shantall-Lurie', href: 'mailto:millie@fhsn.co.za' },
      litigation: { who: 'Gerhard Painter', note: 'With Jessie Muthusamy & Riana Heunis', btn: 'Speak to the litigation team', href: './contact.html' },
      conveyancing: { who: 'Miriam Jansen van Vuuren', note: 'Head of department · with Yvette Erasmus', btn: 'Contact Miriam Jansen van Vuuren', href: './contact.html' },
      estates: { who: 'Ronel van Rooyen', note: 'Estates department', btn: 'Contact Ronel van Rooyen', href: './contact.html' }
    };

    /* background animation */
    const aur = $('.svc-aurora'), silkC = deco('canvas', 'bg-silk'), cols = deco('div', 'bg-columns', '<i></i>'), bp = deco('div', 'bg-blueprint');
    body.append(silkC, cols, bp);
    const silk = ribbons(silkC);
    bind('svcbg', v => {
      const want = v === 'orig' ? 'aurora' : v;
      if (aur) aur.style.display = want === 'aurora' ? '' : 'none';
      body.classList.toggle('svc-aurora-page', want === 'aurora');
      body.classList.toggle('bd-page', want !== 'aurora');
      ['silk', 'columns', 'blueprint', 'still'].forEach(k => body.classList.toggle('bd-' + k, want === k));
      if (want === 'silk') silk.start(); else silk.stop();
    });

    /* header graphic */
    const panels = deco('div', 'hero-panels', D.map(d => '<div data-id="' + d.id + '"><span>' + esc(d.num) + '</span><b>' + esc(short(d)) + '</b></div>').join(''));
    hero.appendChild(panels);
    hero.appendChild(deco('div', 'hero-numerals', D.map((d, i) => '<span style="--i:' + i + '">0' + (i + 1) + '</span>').join('')));
    panels.addEventListener('click', e => { const p = e.target.closest('[data-id]'); if (p) openDept(p.dataset.id, true); });
    $$('.page-hero .jump a').forEach(a => {
      const p = $('[data-id="' + a.getAttribute('href').slice(1) + '"]', panels); if (!p) return;
      a.addEventListener('mouseenter', () => p.classList.add('lit'));
      a.addEventListener('mouseleave', () => p.classList.remove('lit'));
    });

    /* departments layout: tabs / accordion / 2×2 grid */
    const tabs = mk('div', 'dept-tabs', D.map((d, i) => '<button type="button" role="tab" data-i="' + i + '"><em>' + esc(d.num.replace('Dept ', '')) + '</em>' + esc(short(d)) + '</button>').join(''),
      { role: 'tablist', 'aria-label': 'Departments' });
    dw.before(tabs);
    function showDept(i) {
      svcs.forEach((s, j) => s.classList.toggle('is-active', i === j));
      $$('button', tabs).forEach((b, j) => { b.classList.toggle('on', i === j); b.setAttribute('aria-selected', i === j); });
      refresh(); requestAnimationFrame(track);
    }
    function openDept(id, scroll) {
      const i = D.findIndex(d => d.id === id); if (i < 0) return;
      const m = V('deptlayout');
      if (m === 'tabs') { showDept(i); if (scroll) scrollToEl(tabs, 62); return; }
      if (m === 'accordion') { svcs[i].classList.add('is-open'); refresh(); }
      if (scroll) setTimeout(() => scrollToEl(svcs[i], 70), 60);
    }
    tabs.addEventListener('click', e => { const b = e.target.closest('button'); if (b) showDept(+b.dataset.i); });
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href^="#"]'); if (!a) return;
      const id = a.getAttribute('href').slice(1), m = V('deptlayout');
      if (!D.some(d => d.id === id) || (m !== 'tabs' && m !== 'accordion')) return;
      e.preventDefault(); openDept(id, true);
    });
    svcs.forEach(s => {
      const h = $('h2', s);
      const toggle = () => { if (V('deptlayout') !== 'accordion') return; s.classList.toggle('is-open'); h.setAttribute('aria-expanded', s.classList.contains('is-open')); refresh(); };
      h.addEventListener('click', toggle);
      h.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
      const lis = $$('.list li', s);
      if (lis.length > 6) {
        const b = mk('button', 'show-all', 'Show all ' + lis.length + ' services', { type: 'button' });
        $('.list', s).after(b);
        b.addEventListener('click', () => { s.classList.toggle('show-all'); b.textContent = s.classList.contains('show-all') ? 'Show fewer' : 'Show all ' + lis.length + ' services'; refresh(); });
      }
    });

    /* list animation */
    const lists = $$('.svc .list'), lm = [];
    lists.forEach(l => $$('li', l).forEach((li, i) => li.style.setProperty('--i', i)));
    bind('listmotion', m => {
      killAll(lm);
      lists.forEach(l => { l.classList.remove('go'); if (G) G.set($$('li', l), { clearProps: 'opacity,transform' }); });
      if (m === 'stagger' && G) lists.forEach(l => lm.push(G.fromTo($$('li', l), { opacity: 0, x: 36 }, { opacity: 1, x: 0, duration: .6, ease: 'power3.out', stagger: .07,
        clearProps: 'opacity,transform', scrollTrigger: { trigger: l, start: 'top 82%' } })));
      if (m === 'tick') lists.forEach(l => { if (RMO) l.classList.add('go'); else whenSeen(l, () => requestAnimationFrame(() => l.classList.add('go'))); });
    });

    /* department contact: button / partner card / floating ask */
    D.forEach(d => {
      const c = DC[d.id], col = $('.grid > div', d.el); if (!c || !col) return;
      col.appendChild(mk('div', 'dept-cta',
        '<a class="btn dc-btn" href="' + c.href + '"><span class="fill"></span><span>' + esc(c.btn) + '</span><span class="arrow">→</span></a>' +
        '<div class="dc-card"><span class="dc-ini" aria-hidden="true">' + initials(c.who) + '</span><div class="dc-who"><strong>' + esc(c.who) + '</strong><small>' + esc(c.note) + '</small></div>' +
        '<div class="dc-acts"><a href="tel:+27124240200">Call</a><a href="' + c.href + '">' + (c.href.indexOf('mailto') === 0 ? 'Email' : 'Enquire') + '</a></div></div>'));
    });
    const ask = mk('a', 'dept-ask', '<span>Ask about</span> <b></b> <i aria-hidden="true">→</i>', { href: './contact.html' });
    body.appendChild(ask);

    /* department tracker */
    const dn = mk('div', 'dept-nav', '<ol>' + D.map((d, i) => '<li><a href="#' + d.id + '" data-i="' + i + '"><em>' + esc(d.num.replace('Dept ', '')) + '</em><span>' + esc(short(d)) + '</span></a></li>').join('') + '</ol>' +
      '<div class="dn-count" aria-hidden="true"><b>01</b>/ 0' + D.length + '<span></span></div>', { role: 'navigation', 'aria-label': 'Department index' });
    body.appendChild(dn);
    function track() {
      const shown = svcs.filter(s => s.offsetParent !== null); if (!shown.length) return;
      let cur = 0;
      if (V('deptlayout') === 'tabs') cur = Math.max(0, svcs.findIndex(s => s.classList.contains('is-active')));
      else svcs.forEach((s, i) => { if (s.offsetParent !== null && s.getBoundingClientRect().top < innerHeight * .45) cur = i; });
      const top = shown[0].getBoundingClientRect().top, bottom = shown[shown.length - 1].getBoundingClientRect().bottom;
      body.classList.toggle('in-depts', top < innerHeight * .7 && bottom > innerHeight * .3);
      dn.style.setProperty('--p', Math.max(0, Math.min(1, (innerHeight * .45 - top) / Math.max(1, bottom - top))).toFixed(3));
      $$('a', dn).forEach((a, i) => a.classList.toggle('on', i === cur));
      $('.dn-count b', dn).textContent = '0' + (cur + 1);
      $('.dn-count span', dn).textContent = short(D[cur]);
      $('b', ask).textContent = short(D[cur]);
      ask.href = DC[D[cur].id] ? DC[D[cur].id].href : './contact.html';
    }
    let tq = false;
    addEventListener('scroll', () => { if (tq) return; tq = true; requestAnimationFrame(() => { tq = false; track(); }); }, { passive: true });
    addEventListener('resize', track);
    document.addEventListener('fhsn:variant', () => requestAnimationFrame(track));

    /* start on the department named in the URL (e.g. links from the home page) */
    const hashI = Math.max(0, D.findIndex(d => '#' + d.id === location.hash));
    svcs.forEach((s, i) => s.classList.toggle('is-open', i === hashI));
    bind('deptlayout', m => {
      svcs.forEach(s => {
        const h = $('h2', s);
        if (m === 'accordion') { h.tabIndex = 0; h.setAttribute('role', 'button'); h.setAttribute('aria-expanded', s.classList.contains('is-open')); }
        else { h.removeAttribute('tabindex'); h.removeAttribute('role'); h.removeAttribute('aria-expanded'); }
      });
    });
    showDept(hashI);
    track();
  }

  /* ================================================================ NEWS */
  function pageNews() {
    const hero = $('.page-hero'), feature = $('.feature'), arch = $('#news .posts');
    if (!arch) return;
    const posts = $$('.post', arch);
    if (feature && !feature.id) feature.id = 'news-feature';
    const titles = [feature ? $('h2', feature).textContent.trim() : ''].concat(posts.map(p => $('h3', p).textContent.trim())).filter(Boolean);

    /* background animation */
    const wave = $('#wave-grid'), scrim = $('.wave-scrim');
    const line = t => esc('Pretoria — ' + t + ' — ');
    let col = ''; for (let i = 0; i < 26; i++) col += line(titles[i % titles.length]) + '<br>';
    body.append(
      deco('div', 'bg-halftone'),
      deco('div', 'bg-headlines', titles.concat(['From the firm.']).map((t, i) => '<span style="--i:' + i + '">' + esc(t) + '</span>').join('')),
      deco('div', 'bg-wire', Array.from({ length: 8 }, (_, i) => '<div style="--i:' + i + '">' + col + col + '</div>').join(''))
    );
    bind('newsbg', v => {
      const want = v === 'orig' ? 'wave' : v;
      if (wave) wave.style.display = want === 'wave' ? '' : 'none';
      if (scrim) scrim.style.display = want === 'wave' ? '' : 'none';
      body.classList.toggle('wave-page', want === 'wave');
      body.classList.toggle('bd-page', want !== 'wave');
      ['halftone', 'headlines', 'wire', 'still'].forEach(k => body.classList.toggle('bd-' + k, want === k));
    });

    /* header: newspaper masthead / lead-story teaser */
    const hw = $('.wrap', hero);
    const today = new Date().toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    hw.prepend(mk('div', 'masthead-bar', '<span>Pretoria</span><span>' + esc(today) + '</span><span>Est. 1898</span>'));
    if (feature) {
      const teaser = mk('a', 'hero-teaser', '<time>' + esc($('time', feature).textContent) + '</time><strong>' + esc($('h2', feature).textContent) + '</strong><span>Read the story →</span>', { href: '#' + feature.id });
      teaser.addEventListener('click', e => { e.preventDefault(); scrollToEl(feature); });
      hw.appendChild(teaser);
    }

    /* headline marquee / latest-story pop-up */
    hero.after(deco('div', 'news-ticker', '<span class="nt-badge">Latest</span><div class="nt-track"><div>' + (titles.map(esc).join(' <i>◆</i> ') + ' <i>◆</i> ').repeat(2) + '</div></div>'));
    const flash = mk('aside', 'news-flash', '<button type="button" class="nf-x" aria-label="Dismiss">×</button><small>Latest</small><strong>' + esc(titles[0]) + '</strong><a href="#' + (feature ? feature.id : '') + '">Read the story →</a>', { 'aria-label': 'Latest story' });
    body.appendChild(flash);
    $('a', flash).addEventListener('click', e => { e.preventDefault(); flash.classList.remove('show'); if (feature) scrollToEl(feature); });
    $('.nf-x', flash).addEventListener('click', () => flash.classList.remove('show'));
    let ft;
    bind('newsticker', v => { clearTimeout(ft); flash.classList.remove('show'); if (v === 'flash') ft = setTimeout(() => flash.classList.add('show'), 1200); });

    /* archive carousel + read buttons */
    carousel(arch);
    posts.forEach(p => p.insertAdjacentHTML('beforeend', '<span class="read">' + (/contact/.test(p.getAttribute('href')) ? 'Get in touch' : 'Read story') + ' <span class="arrow">→</span></span>'));

    /* story filter */
    posts.forEach(p => {
      const t = $('time', p).textContent, h = $('h3', p).textContent;
      p.dataset.year = (t.match(/(19|20)\d\d/) || [''])[0];
      p.dataset.topic = /retrench|act\b|law/i.test(h) ? 'insight' : /media|press/i.test(h) ? 'media' : 'firm';
    });
    const yrs = Array.from(new Set(posts.map(p => p.dataset.year).filter(Boolean))).sort().reverse();
    const TOPICS = [['firm', 'Firm news'], ['insight', 'Legal insight'], ['media', 'Media']];
    const nf = mk('div', 'news-filter',
      '<div class="nf-g nf-years" role="group" aria-label="Filter by year"><button type="button" class="on" data-k="year" data-v="">All</button>' + yrs.map(y => '<button type="button" data-k="year" data-v="' + y + '">' + y + '</button>').join('') + '</div>' +
      '<div class="nf-g nf-topics" role="group" aria-label="Filter by topic"><button type="button" class="on" data-k="topic" data-v="">All</button>' + TOPICS.map(t => '<button type="button" data-k="topic" data-v="' + t[0] + '">' + t[1] + '</button>').join('') + '</div>' +
      '<label class="nf-g nf-search"><input type="search" placeholder="Search stories…" aria-label="Search stories"></label>' +
      '<p class="nf-none" hidden>No stories match.</p>');
    arch.before(nf);
    const fs = { year: '', topic: '', q: '' };
    function applyNews() {
      const m = V('newsfilter'); let any = false;
      posts.forEach(p => {
        const ok = m === 'years' ? !fs.year || p.dataset.year === fs.year
          : m === 'topics' ? !fs.topic || p.dataset.topic === fs.topic
          : m === 'search' ? !fs.q || p.textContent.toLowerCase().indexOf(fs.q) > -1 : true;
        if (ok && p.hidden) { p.classList.remove('pop-in'); void p.offsetWidth; p.classList.add('pop-in'); }
        p.hidden = !ok; if (ok) any = true;
      });
      $('.nf-none', nf).hidden = any;
    }
    nf.addEventListener('click', e => {
      const b = e.target.closest('button[data-k]'); if (!b) return;
      fs[b.dataset.k] = b.dataset.v;
      $$('button[data-k="' + b.dataset.k + '"]', nf).forEach(x => x.classList.toggle('on', x === b));
      applyNews(); refresh();
    });
    $('input', nf).addEventListener('input', e => { fs.q = e.target.value.trim().toLowerCase(); applyNews(); refresh(); });
    bind('newsfilter', applyNews);

    /* story entrance: these elements leave the site-wide reveal and get their own */
    const targets = [feature].concat(posts).filter(Boolean), nm = [];
    bind('newsmotion', v => {
      killAll(nm);
      targets.forEach(el => { if (v === 'orig' || !G) el.removeAttribute('data-own-motion'); else el.setAttribute('data-own-motion', ''); });
      if (window.fhsnReveals) fhsnReveals();
      if (v === 'orig' || !G) return;
      const end = { opacity: 1, x: 0, y: 0, rotation: 0, rotationX: 0, scale: 1, clipPath: 'inset(0% 0% 0% 0%)', clearProps: 'clipPath' };
      const from = {
        deal: { opacity: 0, y: 150, rotation: i => (i % 2 ? 7 : -6) },
        flip: { opacity: 0, rotationX: -88, transformPerspective: 1100, transformOrigin: '50% 0%' },
        press: { opacity: 1, clipPath: 'inset(0% 0% 100% 0%)', scale: .96 }
      }[v];
      const ease = v === 'deal' ? 'back.out(1.25)' : 'power3.out';
      if (feature) nm.push(G.fromTo(feature, Object.assign({}, from, v === 'deal' ? { rotation: -3, x: -60 } : {}),
        Object.assign({}, end, { duration: 1, ease: ease, scrollTrigger: { trigger: feature, start: 'top 85%' } })));
      nm.push(G.fromTo(posts, from, Object.assign({}, end, { duration: .9, stagger: .14, ease: ease, scrollTrigger: { trigger: arch, start: 'top 85%' } })));
    });
  }

  /* ================================================================ CONTACT */
  function pageContact() {
    const hero = $('.page-hero'), form = $('.form');
    if (!form) return;
    const fields = $$('.field', form), submit = $('.submit', form), sel = $('#f-dept'), mapWrap = $('.map-wrap'), mapEmbed = $('.map-embed');
    const hw = $('.wrap', hero);
    const ctl = f => $('input,select,textarea', f);

    /* header: live map / phone-first / address stamp */
    const hmap = deco('div', 'hero-map'); hero.prepend(hmap);
    bind('contacthero', v => {
      if (v !== 'map' || hmap.firstChild || !mapEmbed) return;
      const f = $('iframe', mapEmbed).cloneNode();
      f.removeAttribute('loading'); f.setAttribute('tabindex', '-1'); f.title = 'Map background';
      hmap.appendChild(f);
    });
    hw.appendChild(mk('div', 'hero-contact', '<a class="hc-phone" href="tel:+27124240200"><small>Call the switchboard</small>012 424 0200</a><a class="hc-mail" href="mailto:millie@fhsn.co.za">millie@fhsn.co.za</a><span class="hc-addr">4-301 Monument Office Park · Monument Park · Pretoria</span>'));
    hero.appendChild(deco('div', 'hero-stamp', ringText('MONUMENT OFFICE PARK · PRETORIA · EST. 1898 · ') + '<b>fhsn</b>'));

    /* section backdrop: location pulse rings behind the map */
    if (mapWrap) mapWrap.appendChild(deco('div', 'radar', '<i></i><i></i><i></i>'));

    /* department picker (synced with the real <select>) */
    const DEP = [['Companies', 'Millie Shantall-Lurie'], ['Litigation', 'Painter · Muthusamy · Heunis'], ['Conveyancing', 'Miriam Jansen van Vuuren'], ['Administration of Estates', 'Ronel van Rooyen'], ['Other', 'General enquiry']];
    if (sel) {
      const dp = mk('div', 'dept-pick', DEP.map(d => '<button type="button" data-v="' + esc(d[0]) + '" aria-pressed="false"><strong>' + esc(d[0]) + '</strong><small>' + esc(d[1]) + '</small></button>').join(''),
        { role: 'group', 'aria-label': 'Choose a department' });
      sel.after(dp);
      const sync = () => $$('button', dp).forEach(b => { const on = b.dataset.v === sel.value; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
      dp.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; sel.value = b.dataset.v; sel.dispatchEvent(new Event('change', { bubbles: true })); });
      sel.addEventListener('change', sync); sync();
    }

    /* send button: paper plane + completion bar */
    if (submit) {
      submit.insertAdjacentHTML('beforeend', '<span class="plane" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg></span>');
      submit.setAttribute('aria-label', 'Send enquiry');
      form.addEventListener('submit', () => { if (V('submit') !== 'plane') return; submit.classList.add('fly'); setTimeout(() => submit.classList.remove('fly'), 1200); });
      const ctrls = fields.map(ctl).filter(Boolean);
      const upd = () => {
        const done = ctrls.filter(c => c.value && c.value.trim()).length / ctrls.length;
        submit.style.setProperty('--done', done.toFixed(2)); submit.dataset.done = Math.round(done * 100) + '% complete';
      };
      form.addEventListener('input', upd); form.addEventListener('change', upd); upd();
    }

    /* form flow: steps / conversational / floating labels */
    const stepsUI = mk('div', 'form-steps', '<div class="fs-top"><span class="fs-count">Step <b>1</b> of ' + fields.length + '</span><span class="fs-bar" aria-hidden="true"><i></i></span></div>');
    const stepsNav = mk('div', 'fs-nav', '<button type="button" class="fs-back">← Back</button><button type="button" class="fs-next">Next →</button>');
    form.prepend(stepsUI); if (submit) submit.before(stepsNav);
    let step = 0;
    function showStep(i, focus) {
      step = Math.max(0, Math.min(fields.length - 1, i));
      fields.forEach((f, j) => f.classList.toggle('is-current', j === step));
      form.classList.toggle('fs-first', step === 0); form.classList.toggle('fs-last', step === fields.length - 1);
      $('.fs-count b', stepsUI).textContent = step + 1;
      stepsUI.style.setProperty('--p', ((step + 1) / fields.length).toFixed(3));
      if (focus) { const c = ctl(fields[step]); if (c) c.focus({ preventScroll: true }); }
      refresh();
    }
    function next() { const c = ctl(fields[step]); if (c && !c.checkValidity()) { c.reportValidity(); return; } showStep(step + 1, true); }
    $('.fs-next', stepsNav).addEventListener('click', next);
    $('.fs-back', stepsNav).addEventListener('click', () => showStep(step - 1, true));
    form.addEventListener('keydown', e => {
      if (V('formflow') !== 'steps' || e.key !== 'Enter' || /TEXTAREA|BUTTON/.test(e.target.tagName) || step === fields.length - 1) return;
      e.preventDefault(); next();
    });
    if (submit) submit.addEventListener('click', e => {
      if (V('formflow') !== 'steps') return;
      const bad = fields.findIndex(f => { const c = ctl(f); return c && !c.checkValidity(); });
      if (bad > -1 && bad !== step) { e.preventDefault(); showStep(bad, true); ctl(fields[bad]).reportValidity(); }
    });

    const chat = mk('div', 'form-chat', '<p>Hi, my name is <span data-s="f-name"></span>. You can reach me at <span data-s="f-email"></span> or <span data-s="f-phone"></span>. ' +
      'I would like to speak to someone in <span data-s="f-dept"></span> about:</p><div data-s="f-msg"></div>');
    stepsUI.after(chat);
    const PH = { 'f-name': 'your name', 'f-email': 'your email', 'f-phone': 'a phone number', 'f-msg': 'Tell us briefly what you are facing…' };
    const SZ = { 'f-name': 14, 'f-email': 22, 'f-phone': 14 };
    let home = null;
    function chatOn() {
      if (home) return; home = {};
      $$('[data-s]', chat).forEach(slot => {
        const c = document.getElementById(slot.dataset.s); if (!c) return;
        home[c.id] = { parent: c.parentNode, next: c.nextSibling, ph: c.getAttribute('placeholder'), size: c.getAttribute('size') };
        if (PH[c.id]) c.setAttribute('placeholder', PH[c.id]);
        if (SZ[c.id]) c.setAttribute('size', SZ[c.id]);
        const lab = $('label[for="' + c.id + '"]'); if (lab) c.setAttribute('aria-label', lab.textContent);
        slot.appendChild(c);
      });
    }
    function chatOff() {
      if (!home) return;
      Object.keys(home).forEach(id => {
        const c = document.getElementById(id), h = home[id];
        h.parent.insertBefore(c, h.next);
        if (h.ph == null) c.removeAttribute('placeholder'); else c.setAttribute('placeholder', h.ph);
        if (h.size == null) c.removeAttribute('size'); else c.setAttribute('size', h.size);
        c.removeAttribute('aria-label');
      });
      home = null;
    }
    function floatSet(on) {
      $$('input,textarea', form).forEach(c => {
        if (on && !c.hasAttribute('placeholder')) { c.setAttribute('placeholder', ' '); c.dataset.fph = '1'; }
        else if (!on && c.dataset.fph) { c.removeAttribute('placeholder'); delete c.dataset.fph; }
      });
    }
    bind('formflow', v => { chatOff(); floatSet(false); if (v === 'chat') chatOn(); if (v === 'float') floatSet(true); showStep(0); });

    /* quick call: floating phone / sticky bar / header number */
    const PHONE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 15.4c-1.2 0-2.4-.2-3.5-.6-.3-.1-.7 0-1 .2l-1.6 2c-2.8-1.4-5.5-3.9-6.9-6.8l2-1.7c.3-.3.3-.7.2-1-.4-1.1-.6-2.3-.6-3.5 0-.5-.4-1-1-1H4.2C3.6 3 3 3.2 3 4c0 9.3 7.7 17 17 17 .7 0 1-.6 1-1.2v-3.4c0-.6-.5-1-1-1z"/></svg>';
    body.appendChild(mk('a', 'call-fab', PHONE, { href: 'tel:+27124240200', 'aria-label': 'Call 012 424 0200' }));
    body.appendChild(mk('div', 'call-bar', '<span>Speak to an attorney — <b>012 424 0200</b></span><a class="cb-call" href="tel:+27124240200">Call now</a><a href="mailto:millie@fhsn.co.za">Email</a>'));
    const navrow = $('#hdr .navrow');
    if (navrow) navrow.insertBefore(mk('a', 'hdr-call', '☎ 012 424 0200', { href: 'tel:+27124240200' }), $('#burger'));
    addEventListener('scroll', () => body.classList.toggle('scrolled', scrollY > 280), { passive: true });

    /* directions — wording from the current fhsn.co.za contact page */
    const DIRS = [
      ['From Fountains Circle', ['Take the R21 (O.R. Tambo Airport/Kempton Park) Highway.', 'Turn left into Elephant Road at the second set of traffic lights.',
        'Turn first left into Steenbok Avenue, and turn left again immediately into Monument Office Park at the boom.']],
      ['From O.R. Tambo Airport', ['Take the R21 to Pretoria.', 'Pass the Hans Strydom off-ramp and at the first set of traffic lights turn right into Elephant Road (which is the main road entering Monument Park from the R21 – there is a green sign indicating Elephant Road).',
        'Turn first left into Steenbok Avenue and turn left again immediately into Monument Office Park at the boom.']],
      ['From Johannesburg', ['Take the M1/N1 Highway to Pretoria and follow the N1 split to Polokwane.', 'Take the 3rd turnoff which is the R21 – marked Pretoria/Kempton Park/O R Tambo Airport.',
        'The road splits. Take the left split to Pretoria (R21).', 'Pass the Solomon Mahlangu off-ramp and at the traffic lights turn right into Elephant Road (there is a green sign indicating Elephant Road).',
        'Turn first left into Steenbok Avenue and turn left again immediately into Monument Office Park at the boom.']]
    ];
    const END = 'Our offices are on the 2nd and 3rd floors of Block 4.';
    const dir = mk('div', 'directions',
      '<div class="dir-head"><p class="dir-gps"><span>GPS</span>S25º48\'05.0" &nbsp; E028º13\'37.0"</p>' +
      '<a class="dir-go" href="https://www.google.com/maps/dir/?api=1&amp;destination=-25.801389,28.226944" target="_blank" rel="noopener">Open in Google Maps <span aria-hidden="true">→</span></a></div>' +
      '<div class="dir-tabs" role="tablist" aria-label="Directions from">' + DIRS.map((d, i) => '<button type="button" role="tab" data-i="' + i + '">' + esc(d[0]) + '</button>').join('') + '</div>' +
      DIRS.map((d, i) => '<section class="dir-panel" data-i="' + i + '"><button type="button" class="dir-acc" aria-expanded="' + (i === 0) + '">' + esc(d[0]) + ' <i aria-hidden="true">+</i></button>' +
        '<div class="dir-body"><p class="dir-text">' + esc(d[1].join(' ') + ' ' + END) + '</p><ol class="dir-steps">' + d[1].map(s => '<li>' + esc(s) + '</li>').join('') +
        '<li class="end">' + esc(END) + '</li></ol></div></section>').join(''));
    (mapEmbed || mapWrap).after(dir);
    const dPanels = $$('.dir-panel', dir), dTabs = $$('.dir-tabs button', dir);
    const dirShow = i => { dPanels.forEach((p, j) => p.classList.toggle('is-active', i === j)); dTabs.forEach((b, j) => { b.classList.toggle('on', i === j); b.setAttribute('aria-selected', i === j); }); refresh(); };
    dirShow(0); dPanels[0].classList.add('is-open');
    dir.addEventListener('click', e => {
      const t = e.target.closest('.dir-tabs button'); if (t) dirShow(+t.dataset.i);
      const a = e.target.closest('.dir-acc');
      if (a) { const p = a.closest('.dir-panel'); p.classList.toggle('is-open'); a.setAttribute('aria-expanded', p.classList.contains('is-open')); refresh(); }
    });
  }

  ({ index: pageHome, history: pageHistory, people: pagePeople, services: pageServices, news: pageNews, contact: pageContact }[PAGE] || function () {})();
})();
