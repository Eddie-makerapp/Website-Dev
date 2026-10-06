/* ============================================================
   FHSN — Design Lab (A/B preference tool)
   Loaded in <head> on every page so saved choices apply before
   first paint.

   COLOUR — re-tints the :root tokens in redesign.css and fires
   'fhsn:palette' for canvas/WebGL (see redesign.js). The client
   picks ONE base red and ONE base grey; every other shade in that
   family keeps its original relationship to the base (same hue
   offset, saturation offset and lightness ratio).

   VARIANTS — each page has its own layouts, backgrounds, motion,
   buttons and extra features (pages.css / pages.js), plus a set of
   whole-site options (variants.css / variants.js). A choice sets
   html[data-v-<id>="<option>"] — only on the page the feature
   belongs to — and fires 'fhsn:variant' {id, value}. The hero seal
   is deliberately not variable.

   State: localStorage (per browser) + share links
   (?red=&grey=&v=id.option~id.option).
   ============================================================ */
(function () {
  var ROOT = document.documentElement;
  var KEY = 'fhsn-lab-v1';
  var PAGE = (location.pathname.split('/').pop() || 'index.html').replace('.html', '') || 'index';
  var PAGES = [['index', 'Home'], ['history', 'History'], ['people', 'Our People'], ['services', 'Services'], ['news', 'News'], ['contact', 'Contact']];
  if (!PAGES.some(function (p) { return p[0] === PAGE; })) PAGE = 'index';
  var PAGE_NAME = PAGES.filter(function (p) { return p[0] === PAGE; })[0][1];
  ROOT.dataset.page = PAGE;

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
     pages: the page(s) the feature lives on (none = whole site).
     group: section it sits in. el: what to scroll to when changed.
     The first option is always the original design. */
  var GROUPS = { layout: 'Layout', background: 'Background', motion: 'Motion & animation', buttons: 'Buttons', features: 'Extra features',
    type: 'Typography', chrome: 'Header & footer' };
  var PAGE_GROUPS = ['background', 'layout', 'motion', 'buttons', 'features'];
  var SITE_GROUPS = ['type', 'chrome', 'buttons', 'motion', 'features'];
  var FEATURES = [
    /* ---------------- whole site ---------------- */
    { id: 'type', group: 'type', label: 'Heading typeface', opts: [['orig', 'Bodoni Moda'], ['playfair', 'Playfair'], ['cormorant', 'Cormorant'], ['condensed', 'Condensed caps']] },
    { id: 'body', group: 'type', label: 'Body typeface', opts: [['orig', 'Barlow'], ['manrope', 'Manrope'], ['serif', 'Source Serif']] },
    { id: 'eyebrow', group: 'type', label: 'Section labels', opts: [['orig', 'Gold rule'], ['chip', 'Boxed chip'], ['dash', 'Red dash'], ['serif', 'Italic serif']] },
    { id: 'header', group: 'chrome', label: 'Header bar', opts: [['orig', 'Fade to blur'], ['solid', 'Solid bar'], ['float', 'Floating capsule']] },
    { id: 'nav', group: 'chrome', label: 'Menu hover', opts: [['orig', 'Gold underline'], ['pill', 'Pill'], ['dot', 'Dot'], ['bracket', 'Brackets']] },
    { id: 'footer', group: 'chrome', label: 'Footer', el: 'footer', opts: [['orig', 'Slim bar'], ['block', 'Big wordmark'], ['centered', 'Centred']] },
    { id: 'btn', group: 'buttons', label: 'All buttons', opts: [['orig', 'Gold sweep + magnetic'], ['glow', 'Glow lift'], ['slide', 'Side slide'], ['pill', 'Rounded sheen']] },
    { id: 'reveal', group: 'motion', label: 'Scroll reveal', replay: true, opts: [['orig', 'Fade up'], ['blur', 'Blur in'], ['slide', 'Slide in'], ['wipe', 'Wipe'], ['scale', 'Scale']] },
    { id: 'pagetrans', group: 'motion', label: 'Page transitions', hint: 'Plays when moving between pages', opts: [['orig', 'Instant'], ['fade', 'Fade'], ['curtain', 'Maroon curtain'], ['shutter', 'Shutters']] },
    { id: 'cursor', group: 'motion', label: 'Cursor', opts: [['orig', 'Standard'], ['ring', 'Gold ring'], ['dot', 'Blend dot'], ['label', 'Context label']] },
    { id: 'grain', group: 'features', label: 'Texture overlay', opts: [['orig', 'Film grain'], ['lines', 'Fine lines'], ['vignette', 'Vignette'], ['none', 'None']] },
    { id: 'progress', group: 'features', label: 'Scroll progress', opts: [['orig', 'Off'], ['line', 'Gold line'], ['bar', 'Red bar'], ['ring', 'Back-to-top ring']] },

    /* ---------------- Home ---------------- */
    { id: 'herolayout', pages: ['index'], group: 'layout', el: '.hero', label: 'Hero layout', opts: [['orig', 'Left column'], ['panel', 'Framed panel'], ['ruled', 'Ruled margin'], ['bottom', 'Anchored low + info bar']] },
    { id: 'practice', pages: ['index'], group: 'layout', el: '#practice .cards', label: 'Departments section', opts: [['orig', 'Four cards'], ['bento', 'Bento grid'], ['rows', 'Expanding rows'], ['carousel', 'Swipe carousel']] },
    { id: 'homenews', pages: ['index'], group: 'layout', el: '#news .posts', label: 'News preview', opts: [['orig', 'Three cards'], ['list', 'Dated list'], ['lead', 'Lead story'], ['strip', 'Numbered strip']] },
    { id: 'offer', pages: ['index', 'services'], group: 'layout', el: '#offer', label: 'Shelf-company offer', opts: [['orig', 'Red + halo'], ['slate', 'Grey'], ['split', 'Split'], ['stripes', 'Moving stripes']] },
    { id: 'herobg', pages: ['index'], group: 'background', el: '.hero', label: 'Hero animation', opts: [['orig', 'Drifting motes'], ['constellation', 'Constellation'], ['rays', 'Light rays'], ['rings', 'Ripples']] },
    { id: 'parallax', pages: ['index'], group: 'background', el: '.parallax-strip', label: 'Photo strip', opts: [['orig', 'Parallax'], ['zoom', 'Slow zoom'], ['duotone', 'Red duotone'], ['pattern', 'Pattern, no photo']] },
    { id: 'loader', pages: ['index'], group: 'motion', label: 'Page loader', replay: true, opts: [['orig', 'Kinetic word'], ['bar', 'Progress line'], ['mono', 'Pulsing monogram'], ['curtain', 'Curtain lift']] },
    { id: 'heroin', pages: ['index'], group: 'motion', el: '.hero', label: 'Headline entrance', replay: true, opts: [['orig', 'Rise from mask'], ['letters', 'Letter cascade'], ['blur', 'Blur focus'], ['type', 'Typewriter']] },
    { id: 'flip', pages: ['index'], group: 'motion', el: '[data-fliptext]', label: 'Label animation', opts: [['orig', 'Letter flip'], ['shimmer', 'Gold shimmer'], ['wave', 'Wave'], ['off', 'Still']] },
    { id: 'scrollhint', pages: ['index'], group: 'motion', el: '.hero', label: 'Scroll hint', opts: [['orig', 'Dripping line'], ['mouse', 'Mouse'], ['chevron', 'Chevron']] },
    { id: 'ticker', pages: ['index'], group: 'motion', el: '.ticker', label: 'Ticker', opts: [['orig', 'Marquee'], ['outline', 'Big outline'], ['double', 'Two rows'], ['static', 'Static']] },
    { id: 'cards', pages: ['index'], group: 'motion', el: '#practice .cards', label: 'Department card hover', opts: [['orig', 'Cursor glow'], ['tilt', '3D tilt'], ['trace', 'Border trace'], ['lift', 'Lift + bar']] },
    { id: 'posts', pages: ['index', 'news'], group: 'motion', el: '.posts', label: 'News card hover', opts: [['orig', 'Maroon fill'], ['rule', 'Gold top rule'], ['lift', 'Lift'], ['underline', 'Underline']] },
    { id: 'herocta', pages: ['index'], group: 'buttons', el: '.hero .cta', label: 'Hero buttons', opts: [['orig', 'Solid + outline'], ['split', 'Joined pair'], ['round', 'Round badge'], ['links', 'Serif text links']] },
    { id: 'stats', pages: ['index'], group: 'features', el: '.stats', label: 'Firm in numbers', replay: true, hint: 'New band under the ticker', opts: [['orig', 'Off'], ['count', 'Count-up'], ['odometer', 'Rolling digits'], ['rings', 'Progress rings']] },

    /* ---------------- History ---------------- */
    { id: 'timeline', pages: ['history'], group: 'layout', el: '#tl', label: 'Timeline layout', opts: [['orig', 'Centre spine'], ['rail', 'Left rail'], ['cards', 'Cards'], ['horizontal', 'Horizontal scroll']] },
    { id: 'ink', pages: ['history'], group: 'layout', el: '#tl', label: 'Timeline line', opts: [['orig', 'Glowing gradient'], ['dotted', 'Dotted gold'], ['bold', 'Bold red']] },
    { id: 'histhero', pages: ['history'], group: 'background', el: '.page-hero', label: 'Header background', replay: true, opts: [['orig', 'Maroon glow'], ['ledger', 'Ledger paper'], ['archive', 'Archive film'], ['years', 'Rolling years']] },
    { id: 'histbg', pages: ['history'], group: 'background', el: '#history', label: 'Timeline backdrop', opts: [['orig', 'Charcoal'], ['film', 'Old film'], ['photo', 'Sepia photo'], ['inkwash', 'Ink wash']] },
    { id: 'histmotion', pages: ['history'], group: 'motion', el: '#tl', label: 'Timeline motion', replay: true, opts: [['orig', 'Ink draws in'], ['focus', 'Spotlight'], ['counter', 'Year counter'], ['type', 'Typed entries']] },
    { id: 'term', pages: ['history'], group: 'motion', el: '.cursor-term', label: 'Name hover cards', opts: [['orig', 'Follows cursor'], ['tooltip', 'Tooltip'], ['dock', 'Docked corner']] },
    { id: 'histcta', pages: ['history'], group: 'buttons', el: '#history .seclink', label: 'Closing link', opts: [['orig', 'Gold text link'], ['button', 'Gold button'], ['faces', 'Faces pill'], ['banner', 'Full-width banner']] },
    { id: 'eranav', pages: ['history'], group: 'features', el: '#tl', label: 'Year navigator', hint: 'Jump straight to an era', opts: [['orig', 'Off'], ['dots', 'Side dots'], ['bar', 'Year bar'], ['ring', 'Progress dial']] },

    /* ---------------- Our People ---------------- */
    { id: 'roster', pages: ['people'], group: 'layout', el: '.people-pills', label: 'Team list', opts: [['orig', 'Pills'], ['columns', 'Columns'], ['avatars', 'Initial avatars']] },
    { id: 'profiles', pages: ['people'], group: 'layout', el: '#p-millie', label: 'Profile layout', opts: [['orig', 'Stacked'], ['alternate', 'Alternating'], ['tabs', 'Tabbed'], ['accordion', 'Accordion']] },
    { id: 'portrait', pages: ['people'], group: 'layout', el: '.pfphoto', label: 'Profile portrait', opts: [['orig', 'Gradient panel'], ['circle', 'Circle'], ['frame', 'Offset frame']] },
    { id: 'bullets', pages: ['people', 'services'], group: 'layout', el: '.list', label: 'List bullets', opts: [['orig', 'Em dash'], ['check', 'Tick'], ['numbered', 'Numbered']] },
    { id: 'pplhero', pages: ['people'], group: 'background', el: '.page-hero', label: 'Header background', opts: [['orig', 'Maroon glow'], ['mosaic', 'Initials mosaic'], ['marquee', 'Name marquee'], ['spot', 'Cursor spotlight']] },
    { id: 'pplbg', pages: ['people'], group: 'background', el: '#people', label: 'Team backdrop', opts: [['orig', 'Pinstripe'], ['shelves', 'Library shelves'], ['monogram', 'Monogram pattern'], ['glow', 'Cursor glow']] },
    { id: 'rostermotion', pages: ['people'], group: 'motion', el: '.people-pills', label: 'Name motion', replay: true, opts: [['orig', 'Fill on hover'], ['cascade', 'Cascade in'], ['dim', 'Dim the others'], ['magnet', 'Magnetic']] },
    { id: 'profilebtn', pages: ['people'], group: 'buttons', el: '#p-millie', label: 'Profile contact', opts: [['orig', 'Email link'], ['pair', 'Email + call'], ['copy', 'Copy email'], ['card', 'Contact card']] },
    { id: 'filter', pages: ['people'], group: 'features', el: '#people', label: 'Role filter', hint: 'Filter the team by role or name', opts: [['orig', 'Off'], ['tabs', 'Segmented tabs'], ['chips', 'Chips + counts'], ['search', 'Name search']] },

    /* ---------------- Services ---------------- */
    { id: 'deptlayout', pages: ['services'], group: 'layout', el: '#companies', label: 'Departments layout', opts: [['orig', 'Long page'], ['tabs', 'Tabs'], ['accordion', 'Accordion'], ['grid', '2 × 2 cards']] },
    { id: 'svcbg', pages: ['services'], group: 'background', label: 'Background animation', opts: [['orig', 'Aurora'], ['silk', 'Silk ribbons'], ['columns', 'Courthouse columns'], ['blueprint', 'Blueprint grid'], ['still', 'Still']] },
    { id: 'svchero', pages: ['services'], group: 'background', el: '.page-hero', label: 'Header graphic', opts: [['orig', 'None'], ['panels', 'Department panels'], ['numerals', 'Giant numerals']] },
    { id: 'listmotion', pages: ['services'], group: 'motion', el: '#companies .list', label: 'Service list motion', replay: true, opts: [['orig', 'Fade in'], ['stagger', 'One by one'], ['tick', 'Ruled draw-in'], ['hover', 'Row highlight']] },
    { id: 'jump', pages: ['services'], group: 'buttons', el: '.page-hero .jump', label: 'Department shortcuts', opts: [['orig', 'Outline boxes'], ['pills', 'Numbered pills'], ['tabs', 'Tabs'], ['tiles', 'Big tiles']] },
    { id: 'deptcontact', pages: ['services'], group: 'buttons', el: '#companies', label: 'Department contact', opts: [['orig', 'Line in list'], ['button', 'Contact button'], ['card', 'Partner card'], ['float', 'Floating ask button']] },
    { id: 'deptnav', pages: ['services'], group: 'features', el: '#companies', label: 'Department tracker', hint: 'Shows where you are on the page', opts: [['orig', 'Off'], ['side', 'Side index'], ['top', 'Sticky bar'], ['dial', 'Corner counter']] },

    /* ---------------- News ---------------- */
    { id: 'newshero', pages: ['news'], group: 'layout', el: '.page-hero', label: 'Header style', opts: [['orig', 'Standard'], ['masthead', 'Newspaper masthead'], ['split', 'Lead-story teaser']] },
    { id: 'feature', pages: ['news'], group: 'layout', el: '.feature', label: 'Featured story', opts: [['orig', 'Side by side'], ['overlay', 'Overlay'], ['stacked', 'Stacked'], ['cover', 'Magazine cover']] },
    { id: 'archive', pages: ['news'], group: 'layout', el: '#news .posts', label: 'Archive layout', opts: [['orig', 'Three cards'], ['list', 'Dated list'], ['columns', 'Newspaper columns'], ['carousel', 'Carousel']] },
    { id: 'newsbg', pages: ['news'], group: 'background', label: 'Background animation', opts: [['orig', 'Wave grid'], ['halftone', 'Halftone print'], ['headlines', 'Drifting headlines'], ['wire', 'Wire feed'], ['still', 'Still']] },
    { id: 'newsmotion', pages: ['news'], group: 'motion', el: '.feature', label: 'Story entrance', replay: true, opts: [['orig', 'Fade up'], ['deal', 'Dealt in'], ['flip', 'Flip down'], ['press', 'Press wipe']] },
    { id: 'readmore', pages: ['news'], group: 'buttons', el: '.feature', label: 'Read buttons', opts: [['orig', 'Text link'], ['pill', 'Pill'], ['circle', 'Expanding circle'], ['bar', 'Card footer bar']] },
    { id: 'newsfilter', pages: ['news'], group: 'features', el: '#news', label: 'Story filter', opts: [['orig', 'Off'], ['years', 'By year'], ['topics', 'By topic'], ['search', 'Search']] },
    { id: 'newsticker', pages: ['news'], group: 'features', el: '.page-hero', label: 'Latest headlines', replay: true, opts: [['orig', 'Off'], ['marquee', 'Marquee under header'], ['flash', 'Pop-up card']] },

    /* ---------------- Contact ---------------- */
    { id: 'contactlayout', pages: ['contact'], group: 'layout', el: '#contact', label: 'Page layout', opts: [['orig', 'Form left'], ['swap', 'Details left'], ['maphero', 'Map first'], ['card', 'Centred card']] },
    { id: 'fields', pages: ['contact'], group: 'layout', el: '.form', label: 'Field style', opts: [['orig', 'Boxed'], ['underline', 'Underline'], ['soft', 'Soft rounded']] },
    { id: 'details', pages: ['contact'], group: 'layout', el: '.cgrid aside', label: 'Contact details', opts: [['orig', 'Stacked'], ['cards', 'Cards'], ['rule', 'Red rule']] },
    { id: 'map', pages: ['contact'], group: 'layout', el: '.map-embed', label: 'Map style', opts: [['orig', 'Light'], ['dark', 'Dark'], ['mono', 'Mono + frame']] },
    { id: 'contacthero', pages: ['contact'], group: 'background', el: '.page-hero', label: 'Header', opts: [['orig', 'Maroon glow'], ['map', 'Live map'], ['phone', 'Phone-first'], ['stamp', 'Address stamp']] },
    { id: 'contactbg', pages: ['contact'], group: 'background', el: '#contact', label: 'Section backdrop', opts: [['orig', 'Charcoal'], ['contours', 'Topographic lines'], ['radar', 'Location pulse'], ['streets', 'Street grid']] },
    { id: 'fieldfx', pages: ['contact'], group: 'motion', el: '.form', label: 'Field focus effect', hint: 'Click into a field to see it', opts: [['orig', 'Border highlight'], ['sweep', 'Underline sweep'], ['glow', 'Glow pulse'], ['lift', 'Lift']] },
    { id: 'submit', pages: ['contact'], group: 'buttons', el: '.form .submit', label: 'Send button', opts: [['orig', 'Solid sweep'], ['plane', 'Paper plane'], ['wide', 'Progress bar'], ['round', 'Round arrow']] },
    { id: 'callbtn', pages: ['contact'], group: 'buttons', label: 'Quick call', opts: [['orig', 'Off'], ['float', 'Floating phone'], ['bar', 'Sticky call bar'], ['header', 'Number in header']] },
    { id: 'formflow', pages: ['contact'], group: 'features', el: '.form', label: 'Form flow', opts: [['orig', 'All fields'], ['steps', 'Step by step'], ['chat', 'Conversational'], ['float', 'Floating labels']] },
    { id: 'deptpick', pages: ['contact'], group: 'features', el: '#f-dept', label: 'Department picker', opts: [['orig', 'Dropdown'], ['tiles', 'Tiles'], ['chips', 'Chips'], ['radio', 'Radio list']] },
    { id: 'directions', pages: ['contact'], group: 'features', el: '.map-embed', label: 'Driving directions', hint: 'Wording from the current fhsn.co.za', opts: [['orig', 'Off'], ['tabs', 'Tabs'], ['accordion', 'Accordion'], ['steps', 'Route steps']] }
  ];
  var FEAT = {}; FEATURES.forEach(function (f) { FEAT[f.id] = f; });
  function onPage(f) { return !f.pages || f.pages.indexOf(PAGE) > -1; }
  function validOpt(id, v) { return !!FEAT[id] && FEAT[id].opts.some(function (o) { return o[0] === v; }); }
  var PAGE_FEATS = FEATURES.filter(function (f) { return f.pages && onPage(f); });
  var SITE_FEATS = FEATURES.filter(function (f) { return !f.pages; });

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
  var state = { red: ORIGINAL.red, grey: ORIGINAL.grey, v: {}, list: [], a: null, b: null, live: null, open: false, tab: 'page' };
  try { var saved = JSON.parse(localStorage.getItem(KEY)); if (saved) for (var s in saved) state[s] = saved[s]; } catch (e) {}
  state.v = state.v || {};
  for (var id in state.v) if (state.v[id] === 'orig' || !validOpt(id, state.v[id])) delete state.v[id];   /* drop retired options */
  if (!/^(page|site|colour|compare)$/.test(state.tab)) state.tab = 'page';
  var qs = new URLSearchParams(location.search);
  if (validHex(qs.get('red'))) state.red = validHex(qs.get('red'));
  if (validHex(qs.get('grey'))) state.grey = validHex(qs.get('grey'));
  if (qs.has('v')) {
    state.v = {};
    qs.get('v').split('~').forEach(function (pair) { var p = pair.split('.'); if (validOpt(p[0], p[1]) && p[1] !== 'orig') state.v[p[0]] = p[1]; });
  }
  if (qs.get('lab') === '1') state.open = true;   /* ?lab=1 opens the panel — send this to the client */
  if (/^(page|site|colour|compare)$/.test(qs.get('tab') || '')) state.tab = qs.get('tab');
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
  /* page transition: arriving from another page of the site (flag set by variants.js) */
  try {
    if (state.v.pagetrans && sessionStorage.getItem('fhsn-pt')) ROOT.classList.add('pt-enter');
    sessionStorage.removeItem('fhsn-pt');
  } catch (e) {}

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
    var f = FEAT[id], v = state.v[id] || 'orig';
    if (v === 'orig' || !onPage(f)) ROOT.removeAttribute('data-v-' + id); else ROOT.setAttribute('data-v-' + id, v);
    if (id === 'type' || id === 'body') loadFont(v);
    if (fire && onPage(f)) document.dispatchEvent(new CustomEvent('fhsn:variant', { detail: { id: id, value: v } }));
  }
  function setVariant(id, v) {
    if (v === 'orig') delete state.v[id]; else state.v[id] = v;
    state.live = null; applyVariant(id, true); changed();
  }
  /* swap the whole design (colours + every variant) — used by A/B, shortlist, resets, shuffle */
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
  /* bring the changed part of the page into view and flash an outline round it */
  function showTarget(f) {
    if (!f || !f.el) return;
    var t = document.querySelector(f.el); if (!t || !t.getClientRects().length) return;
    var r = t.getBoundingClientRect();
    var seen = Math.min(r.bottom, innerHeight) - Math.max(r.top, 0);   /* scroll unless at least half of it is on screen */
    if (seen < Math.min(r.height, innerHeight) * .5) {
      var off = Math.max(90, (innerHeight - Math.min(r.height, innerHeight * .7)) / 2);
      scrollTo({ top: r.top + scrollY - off, behavior: 'smooth' });
    }
    t.classList.remove('lab-flash'); void t.offsetWidth; t.classList.add('lab-flash');
    setTimeout(function () { t.classList.remove('lab-flash'); }, 1500);
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

  /* one row per feature: label + a chip for the original and each alternative */
  function featureRow(f) {
    return '<div class="lab-feat" data-f="' + f.id + '"><div class="lab-feat-h"><span>' + f.label + (f.hint ? '<small>' + f.hint + '</small>' : '') + '</span>' +
      (f.replay ? '<button class="lab-replay" data-a="replay" data-id="' + f.id + '" title="Replay animation">↻ Replay</button>' : '') + '</div>' +
      '<div class="lab-opts">' + f.opts.map(function (o, i) {
        return '<button data-a="opt" data-id="' + f.id + '" data-v="' + o[0] + '"><em>' + (i ? 'Option ' + String.fromCharCode(64 + i) : 'Original') + '</em>' + o[1] + '</button>';
      }).join('') + '</div></div>';
  }
  function groupedPanel(feats, groups) {
    return groups.map(function (g) {
      var fs = feats.filter(function (f) { return f.group === g; });
      return fs.length ? '<section class="lab-group"><h3>' + GROUPS[g] + '<small>' + fs.length + '</small></h3>' + fs.map(featureRow).join('') + '</section>' : '';
    }).join('');
  }

  var TABS = [['page', PAGE_NAME + ' page'], ['site', 'Whole site'], ['colour', 'Colour'], ['compare', 'Compare']];
  function build() {
    var tab = el('button', { id: 'lab-tab', 'aria-controls': 'lab', 'aria-expanded': 'false' }, 'Design Lab');
    var panel = el('aside', { id: 'lab', 'aria-label': 'Design Lab' });
    panel.innerHTML =
      '<div class="lab-head"><div><h2>Design Lab</h2><small>Try options · compare A/B · save favourites</small></div>' +
      '<button class="x" aria-label="Close Design Lab">×</button></div>' +
      '<div class="lab-tabs" role="tablist">' + TABS.map(function (t) { return '<button role="tab" data-tab="' + t[0] + '">' + t[1] + '<small></small></button>'; }).join('') + '</div>' +
      '<div class="lab-body">' +
        '<div data-panel="page">' +
          '<div class="lab-pages" role="navigation" aria-label="Edit another page">' + PAGES.map(function (p) {
            return p[0] === PAGE ? '<span class="on">' + p[1] + '</span>' : '<a href="./' + p[0] + '.html">' + p[1] + '</a>';
          }).join('') + '</div>' +
          '<p class="lab-intro">' + PAGE_FEATS.length + ' features unique to the ' + PAGE_NAME + ' page. Every choice is saved as you move between pages.</p>' +
          groupedPanel(PAGE_FEATS, PAGE_GROUPS) +
          '<section class="lab-btns"><button class="lab-btn" data-a="shuffle">⟳ Shuffle this page</button><button class="lab-btn" data-a="reset-page">Reset this page</button></section>' +
        '</div>' +
        '<div data-panel="site"><p class="lab-intro">Applies to all six pages.</p>' + groupedPanel(SITE_FEATS, SITE_GROUPS) +
          '<section class="lab-btns"><button class="lab-btn" data-a="reset-site">Reset whole-site options</button></section></div>' +
        '<div data-panel="colour">' +
          '<section><h3>Colour scale</h3><div class="lab-scale"><div class="g"><span>Grey</span><span data-o="grey"></span></div><div class="r"><span>Red</span><span data-o="red"></span></div></div></section>' +
          '<section class="pickers"></section>' +
          '<section><h3>All shades in use</h3><div class="lab-tokens"></div><div class="lab-contrast"></div></section>' +
          '<section><button class="lab-btn" data-a="reset-colour">Reset colours to original</button></section>' +
        '</div>' +
        '<div data-panel="compare">' +
          '<section><h3>A / B compare</h3><div class="lab-ab">' +
            ['a', 'b'].map(function (k) { return '<div class="lab-slot" data-slot="' + k + '"><div class="lbl">' + k.toUpperCase() + '</div><div class="sw"></div><button class="lab-btn" data-a="set-' + k + '">Set current as ' + k.toUpperCase() + '</button></div>'; }).join('') +
            '<button class="lab-btn primary lab-flip" data-a="flip">Flip A ⇄ B</button></div>' +
            '<p class="lab-note">A and B hold the whole design — colours plus every page and site option. Press <b>F</b> anywhere to flip.</p></section>' +
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
    function resetFeatures(list) { var c = current(); list.forEach(function (f) { delete c.v[f.id]; }); useCombo(c); }
    panel.addEventListener('click', function (e) {
      var b = e.target.closest('[data-a],[data-tab]'); if (!b) return;
      if (!b.dataset.a) { state.tab = b.dataset.tab; changed(); panel.querySelector('.lab-body').scrollTop = 0; return; }
      var a = b.dataset.a, cur = current();
      if (a === 'opt') { setVariant(b.dataset.id, b.dataset.v); showTarget(FEAT[b.dataset.id]); }
      else if (a === 'replay') { document.dispatchEvent(new CustomEvent('fhsn:variant', { detail: { id: b.dataset.id, value: state.v[b.dataset.id] || 'orig' } })); showTarget(FEAT[b.dataset.id]); }
      else if (a === 'shuffle') {
        PAGE_FEATS.forEach(function (f) { var o = f.opts[Math.floor(Math.random() * f.opts.length)][0]; if (o === 'orig') delete cur.v[f.id]; else cur.v[f.id] = o; });
        useCombo(cur); toast('Shuffled — keep what you like');
      }
      else if (a === 'reset-page') { resetFeatures(PAGE_FEATS); toast(PAGE_NAME + ' page reset to original'); }
      else if (a === 'reset-site') { resetFeatures(SITE_FEATS); toast('Whole-site options reset'); }
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
        var count = function (list) { return list.filter(function (f) { return state.v[f.id]; }).length; };
        var counts = { page: count(PAGE_FEATS), site: count(SITE_FEATS), colour: (state.red !== ORIGINAL.red) + (state.grey !== ORIGINAL.grey), compare: state.list.length };
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
