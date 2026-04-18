/* ============================================================
   ZODIUM — main.js
   ============================================================ */

const sectionCache = {};
const mount = () => document.getElementById('section-mount');
const SECTIONS_BASE = 'sections/';

/* ── Manifest ────────────────────────────────────────────── */
let _manifest = null;
async function fetchManifest() {
  if (_manifest) return _manifest;
  try {
    const res = await fetch(SECTIONS_BASE + 'manifest.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    _manifest = await res.json();
  } catch { _manifest = { wiki: { distro: [], flavours: [], tools: [] }, guides: [] }; }
  return _manifest;
}

/* ── Slug helpers ────────────────────────────────────────── */
function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function hashToSection(hash) {
  const parts = hash.split('/');
  const root = parts[0];
  if (!root || root === 'home') return { type: 'home' };
  if (root === 'quiz')          return { type: 'quiz' };
  if (root === 'repo')          return { type: 'repo' };
  if (root === 'wiki') {
    const slug = parts[1];
    const stepSlug = parts[2];
    if (!slug) return { type: 'wiki-landing' };
    const m = await fetchManifest();
    // check wiki pages
    for (const cat of Object.values(m.wiki)) {
      const page = cat.find(p => p.id === slug || slugify(p.title) === slug);
      if (page) return { type: 'wiki-page', page };
    }
    // check guides
    const guide = m.guides.find(g => g.id === slug || slugify(g.title) === slug);
    if (guide) {
      if (!guide.steps) return { type: 'guide-single', guide };
      const stepIdx = stepSlug
        ? Math.max(0, guide.steps.findIndex(s => slugify(s.title) === stepSlug))
        : 0;
      return { type: 'guide-step', guide, stepIdx };
    }
    return { type: 'wiki-landing' };
  }
  return { type: 'home' };
}

function sectionToHash(type, data = {}) {
  if (type === 'home')         return '';
  if (type === 'quiz')         return 'quiz';
  if (type === 'repo')         return 'repo';
  if (type === 'wiki-landing') return 'wiki';
  if (type === 'wiki-page')    return 'wiki/' + data.page.id;
  if (type === 'guide-single') return 'wiki/' + data.guide.id;
  if (type === 'guide-step')   return 'wiki/' + data.guide.id + '/' + slugify(data.guide.steps[data.stepIdx].title);
  return '';
}

function pushHash(hash) {
  history.replaceState(null, '', hash ? '#' + hash : location.pathname);
}

/* ── Section navigation ──────────────────────────────────── */
async function showsection(id, opts = {}) {
  const el = mount();
  window.scrollTo({ top: 0, behavior: 'instant' });
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active-nav'));
  document.querySelector(`.nav-item[data-id="${id}"]`)?.classList.add('active-nav');

  // Static HTML sections
  if (['home', 'ast-quiz', 'rep0'].includes(id)) {
    el.className = id === 'home' ? 'section' : id === 'rep0' ? 'page section' : 'section';
    if (id === 'home') pushHash('');
    if (id === 'ast-quiz') { pushHash('quiz'); showbar(); }
    if (id === 'rep0') { pushHash('repo'); shownav('rep'); showbar(); }

    if (sectionCache[id] && id !== 'rep0') {
      el.innerHTML = sectionCache[id]; afterLoad(id); return;
    }
    el.innerHTML = '';
    try {
      const res = await fetch(SECTIONS_BASE + id + '.html');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      sectionCache[id] = await res.text();
      el.innerHTML = sectionCache[id];
      afterLoad(id);
    } catch (err) {
      el.innerHTML = errBox(err.message);
    }
    return;
  }

  // Wiki landing
  if (id === 'wiki-landing') {
    el.className = 'section wiki-section';
    pushHash('wiki');
    shownav('wiki'); showbar();
    await renderWikiLanding();
    return;
  }

  // Wiki page (md)
  if (id.startsWith('wiki-page-')) {
    el.className = 'section wiki-section';
    shownav('wiki'); showbar();
    const pageId = id.replace('wiki-page-', '');
    const m = await fetchManifest();
    let page = null;
    for (const cat of Object.values(m.wiki)) {
      page = cat.find(p => p.id === pageId);
      if (page) break;
    }
    if (!page) { el.innerHTML = errBox('page not found'); return; }
    pushHash('wiki/' + page.id);
    setActiveNav(page.id);
    await renderMdPage(page.file, page.title, [
      { label: 'home', action: "showsection('home');hidebar()" },
      { label: 'wiki', action: "showsection('wiki-landing')" },
      { label: page.title }
    ]);
    return;
  }

  // Guide
  if (id.startsWith('guide-')) {
    el.className = 'section wiki-section guide-page';
    shownav('wiki'); showbar();
    const m = await fetchManifest();
    const parts = id.replace('guide-', '').split('-');
    const stepIdx = !isNaN(parts[parts.length - 1]) ? parseInt(parts.pop()) : null;
    const guideId = parts.join('-');
    const guide = m.guides.find(g => g.id === guideId);
    if (!guide) { el.innerHTML = errBox('guide not found'); return; }

    if (!guide.steps) {
      pushHash('wiki/' + guide.id);
      await renderMdPage(SECTIONS_BASE.replace('sections/','') + guide.file, guide.title, [
        { label: 'home', action: "showsection('home');hidebar()" },
        { label: 'wiki', action: "showsection('wiki-landing')" },
        { label: guide.title }
      ]);
    } else {
      const idx = stepIdx ?? 0;
      pushHash('wiki/' + guide.id + '/' + slugify(guide.steps[idx].title));
      expandGuideGroup(guide.id);
      setActiveNav('guide-' + guide.id + '-' + idx);
      await renderGuideStep(guide, idx);
    }
    return;
  }

  el.innerHTML = errBox('unknown section: ' + id);
}

/* ── Render helpers ──────────────────────────────────────── */
async function renderMdPage(file, title, crumbs) {
  const el = mount();
  const crumbHtml = crumbs.map((c, i) =>
    i < crumbs.length - 1
      ? `<a onclick="${c.action}" style="cursor:pointer;">${c.label}</a><span class="breadcrumb-sep">/</span>`
      : `<span>${c.label}</span>`
  ).join('');

  try {
    const res = await fetch(SECTIONS_BASE + file);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const md = await res.text();
    // strip leading h1 since we show it in page-header
    const body = md.replace(/^#\s+.+\n/, '');
    el.innerHTML = `
      <div class="page-header">
        <div class="breadcrumb">${crumbHtml}</div>
        <h1>${title}</h1>
      </div>
      <div class="content-body">
        <div class="content-block md-body">${marked.parse(body)}</div>
      </div>`;
  } catch (err) {
    el.innerHTML = errBox(err.message);
  }
}

async function renderGuideStep(guide, stepIdx) {
  const el = mount();
  const step = guide.steps[stepIdx];
  const crumbHtml = `
    <a onclick="showsection('home');hidebar()" style="cursor:pointer;">home</a><span class="breadcrumb-sep">/</span>
    <a onclick="showsection('wiki-landing')" style="cursor:pointer;">wiki</a><span class="breadcrumb-sep">/</span>
    <span>${guide.title}</span><span class="breadcrumb-sep">/</span>
    <span>${step.title}</span>`;

  const pips = guide.steps.map((s, i) => `
    <div class="stepper-pip ${i === stepIdx ? 'active' : i < stepIdx ? 'done' : ''}"
         onclick="showsection('guide-${guide.id}-${i}')">
      <div class="stepper-num">${i < stepIdx ? '✓' : i + 1}</div>
      <div class="stepper-label">${s.title}</div>
    </div>${i < guide.steps.length - 1 ? '<div class="stepper-line"></div>' : ''}`
  ).join('');

  const prev = stepIdx > 0
    ? `<a onclick="showsection('guide-${guide.id}-${stepIdx - 1}')" class="btn btn-ghost btn-sm">← ${guide.steps[stepIdx - 1].title}</a>`
    : '';
  const next = stepIdx < guide.steps.length - 1
    ? `<a onclick="showsection('guide-${guide.id}-${stepIdx + 1}')" class="btn btn-primary btn-sm">${guide.steps[stepIdx + 1].title} →</a>`
    : '<span class="btn btn-ghost btn-sm" style="opacity:0.4;cursor:default;">done ✓</span>';

  try {
    const res = await fetch(SECTIONS_BASE + guide.steps[stepIdx].file);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const md = await res.text();
    const body = md.replace(/^#\s+.+\n/, '');
    el.innerHTML = `
      <div class="page-header">
        <div class="breadcrumb">${crumbHtml}</div>
        <h1>${step.title}</h1>
        <p class="page-sub">Step ${stepIdx + 1} of ${guide.steps.length} — ${guide.title}</p>
      </div>
      <div class="content-body">
        <div class="stepper">${pips}</div>
        <div class="stepper-nav">${prev}${next}</div>
        <div class="content-block md-body">${marked.parse(body)}</div>
        <div class="stepper-nav stepper-nav--bottom">${prev}${next}</div>
      </div>`;
  } catch (err) {
    el.innerHTML = errBox(err.message);
  }
}

async function renderWikiLanding() {
  const el = mount();
  const m = await fetchManifest();

  const catHtml = (label, pages) => `
    <div class="wiki-landing-cat">
      <div class="wiki-landing-label">${label}</div>
      <div class="wiki-landing-items">
        ${pages.map(p => `
          <a onclick="showsection('wiki-page-${p.id}')" class="wiki-landing-item">
            <span class="wiki-landing-title">${p.title}</span>
            ${p.sub ? `<span class="wiki-landing-sub">${p.sub}</span>` : ''}
          </a>`).join('')}
      </div>
    </div>`;

  const guidesHtml = m.guides.map(g => {
    if (!g.steps) return `
      <a onclick="showsection('guide-${g.id}')" class="wiki-landing-item">
        <span class="wiki-landing-title">${g.title}</span>
      </a>`;
    return `
      <div class="wiki-landing-item wiki-landing-item--group">
        <span class="wiki-landing-title">${g.title}</span>
        <div class="wiki-landing-steps">
          ${g.steps.map((s, i) => `
            <a onclick="showsection('guide-${g.id}-${i}')" class="wiki-landing-step">
              <span class="step-num">${i + 1}</span>${s.title}
            </a>`).join('')}
        </div>
      </div>`;
  }).join('');

  el.innerHTML = `
    <div class="page-header">
      <div class="breadcrumb">
        <a onclick="showsection('home');hidebar()" style="cursor:pointer;">home</a>
        <span class="breadcrumb-sep">/</span>
        <span>wiki</span>
      </div>
      <h1>wiki</h1>
      <p class="page-sub">Documentation, guides, and references for the zodium project.</p>
    </div>
    <div class="wiki-landing-grid">
      ${catHtml('distro', m.wiki.distro)}
      ${catHtml('flavours', m.wiki.flavours)}
      <div class="wiki-landing-cat">
        <div class="wiki-landing-label">guides</div>
        <div class="wiki-landing-items">${guidesHtml}</div>
      </div>
      ${catHtml('tools', m.wiki.tools)}
    </div>`;
}

/* ── Post-load hooks ─────────────────────────────────────── */
function afterLoad(id) {
  if (id === 'home')     { initStars(); runTypedAnimation(); initScrollReveal(); }
  if (id === 'ast-quiz') { initQuiz(); initScrollReveal(); }
  if (id === 'rep0')     { switchRepo('pkgs'); }
}

/* ── Sidebar ─────────────────────────────────────────────── */
function shownav(id) {
  document.querySelectorAll('.nav-section.nav-group').forEach(el => el.style.display = 'none');
  document.getElementById('homebutton').style.display = 'block';
  const group = document.getElementById(id);
  if (group) group.style.display = 'flex';
  if (id === 'wiki') buildWikiNav();
}

function hidebar() {
  document.getElementById('sidebar').style.display = 'none';
  document.getElementById('main').classList.remove('sidebar-open');
  document.querySelectorAll('.nav-section.nav-group').forEach(el => el.style.display = 'none');
}

function showbar() {
  document.getElementById('sidebar').style.display = 'flex';
  document.getElementById('main').classList.add('sidebar-open');
}

function setActiveNav(id) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active-nav'));
  document.querySelector(`.nav-item[data-id="${id}"]`)?.classList.add('active-nav');
}

function expandGuideGroup(guideId) {
  const gg = document.getElementById('gg-' + guideId);
  const chev = document.getElementById('chev-' + guideId);
  if (gg) { gg.style.display = 'flex'; gg.style.flexDirection = 'column'; }
  if (chev) chev.textContent = '▾';
}

async function buildWikiNav() {
  const nav = document.getElementById('wiki-nav');
  if (!nav) return;
  const m = await fetchManifest();

  const pageLinks = (pages) => pages.map(p =>
    `<a onclick="showsection('wiki-page-${p.id}')" data-id="${p.id}" class="nav-item"><span class="nav-dot"></span>${p.title}</a>`
  ).join('');

  const guideLinks = m.guides.map(g => {
    if (!g.steps) return `<a onclick="showsection('guide-${g.id}')" data-id="guide-${g.id}" class="nav-item"><span class="nav-dot"></span>${g.title}</a>`;
    const steps = g.steps.map((s, i) =>
      `<a onclick="showsection('guide-${g.id}-${i}')" data-id="guide-${g.id}-${i}" class="nav-item guide-step"><span class="nav-dot"></span>${s.title}</a>`
    ).join('');
    return `
      <a onclick="toggleGuideGroup('gg-${g.id}','chev-${g.id}')" class="nav-item guide-parent">
        <span class="guide-chevron" id="chev-${g.id}">▸</span>${g.title}
      </a>
      <div class="guide-group" id="gg-${g.id}" style="display:none;">${steps}</div>`;
  }).join('');

  nav.innerHTML = `
    <span class="nav-label">distro</span>
    <div class="nav-group">${pageLinks(m.wiki.distro)}</div>
    <span class="nav-label" style="margin-top:14px;">flavours</span>
    <div class="nav-group">${pageLinks(m.wiki.flavours)}</div>
    <span class="nav-label" style="margin-top:14px;">guides</span>
    <div class="nav-group">${guideLinks}</div>
    <span class="nav-label" style="margin-top:14px;">tools</span>
    <div class="nav-group">${pageLinks(m.wiki.tools)}</div>`;
}

function toggleGuideGroup(ggId, chevId) {
  const el = document.getElementById(ggId);
  const chev = document.getElementById(chevId);
  if (!el) return;
  const open = el.style.display === 'none';
  el.style.display = open ? 'flex' : 'none';
  if (open) el.style.flexDirection = 'column';
  if (chev) chev.textContent = open ? '▾' : '▸';
}

/* ── Util ────────────────────────────────────────────────── */
const errBox = msg => `<div style="padding:60px 32px;color:var(--text-muted);font-size:13px;">failed to load — ${msg}</div>`;

/* ── Stars ───────────────────────────────────────────────── */
function initStars() {
  const canvas = document.getElementById('star-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, stars = [];
  const isDark   = () => window.matchMedia('(prefers-color-scheme: dark)').matches;
  const resize   = () => { W = canvas.width = canvas.offsetWidth; H = canvas.height = canvas.offsetHeight; };
  const mkStar   = () => ({
    x: Math.random()*W, y: Math.random()*H, r: Math.random()*1.2+0.2,
    speed: Math.random()*0.5+0.15, angle: Math.PI/4+(Math.random()-0.5)*0.4,
    alpha: Math.random()*0.5+0.1, trail: [], trailLen: Math.floor(Math.random()*6+3),
  });
  const initPool = () => { stars = Array.from({ length: Math.floor((W*H)/10000) }, mkStar); };

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const col = isDark() ? 'rgba(184,202,212,' : 'rgba(45,59,69,';
    for (const s of stars) {
      s.trail.forEach((t, i) => {
        ctx.beginPath(); ctx.arc(t.x, t.y, s.r*0.6, 0, Math.PI*2);
        ctx.fillStyle = col + (i/s.trail.length)*s.alpha*0.35 + ')'; ctx.fill();
      });
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fillStyle = col + s.alpha + ')'; ctx.fill();
      s.trail.push({ x: s.x, y: s.y });
      if (s.trail.length > s.trailLen) s.trail.shift();
      s.x += Math.cos(s.angle)*s.speed;
      s.y += Math.sin(s.angle)*s.speed;
      if (s.x > W+10 || s.y > H+10) {
        const ns = mkStar();
        Math.random() < 0.5 ? (ns.x = Math.random()*W, ns.y = -5) : (ns.x = -5, ns.y = Math.random()*H);
        Object.assign(s, ns); s.trail = [];
      }
    }
    requestAnimationFrame(draw);
  }

  resize(); initPool(); draw();
  new ResizeObserver(() => { resize(); initPool(); }).observe(canvas.parentElement);
}

/* ── Typed terminal ──────────────────────────────────────── */
function runTypedAnimation() {
  const out = document.querySelector('.typed-output');
  const cur = document.querySelector('.term-cursor');
  if (!out) return;
  const lines = [
    { text: '✓ Fetching image layers...', color: 't-teal'  },
    { text: '✓ Verifying signatures...',  color: 't-white' },
    { text: '✓ Staged. Reboot to apply.', color: 't-green' },
  ];
  let idx = 0;
  function typeLine({ text, color }, onDone) {
    let i = 0; out.textContent = ''; out.className = 'typed-output ' + color;
    const iv = setInterval(() => {
      out.textContent += text[i++];
      if (i >= text.length) { clearInterval(iv); setTimeout(onDone, 700); }
    }, 28);
  }
  function next() {
    if (idx >= lines.length) {
      if (cur) cur.style.display = 'none';
      setTimeout(() => { idx = 0; if (cur) cur.style.display = 'inline-block'; out.textContent = ''; next(); }, 3200);
      return;
    }
    setTimeout(() => typeLine(lines[idx], () => { idx++; next(); }), idx === 0 ? 200 : 0);
  }
  setTimeout(next, 1600);
}

/* ── Scroll reveal ───────────────────────────────────────── */
function initScrollReveal() {
  const targets = document.querySelectorAll('.tool-card, .flavour-card, .fstrip-item');
  if (!targets.length) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('revealed'); obs.unobserve(e.target); } });
  }, { threshold: 0.08 });
  targets.forEach((el, i) => { el.style.animationDelay = `${i*55}ms`; obs.observe(el); });
}

/* ── Flavour quiz ────────────────────────────────────────── */
const QUIZ_DATA = {
  zcore:  {
    name: 'zcore',
    desc: 'Bare fedora-bootc base. No desktop — a clean, reproducible foundation you can extend into anything.',
    wiki: "showsection('wiki-page-zcore')",
    iso:  {
      intel:  'https://archive.org/download/zcore-bootc/zcore-bootc.iso',
      amd:    'https://archive.org/download/zcore-bootc/zcore-bootc.iso',
      nvidia: 'https://archive.org/download/zcore-nvidia/zcore-nvidia.iso',
    },
  },
  zynori: {
    name: 'zynori',
    desc: 'Niri scrollable tiling compositor + noctalia-shell. Minimal, keyboard-first, ready to boot.',
    wiki: "showsection('wiki-page-zynori')",
    iso:  {
      intel:  'https://archive.org/download/zynori-bootc/zynori-bootc.iso',
      amd:    'https://archive.org/download/zynori-bootc/zynori-bootc.iso',
      nvidia: 'https://archive.org/download/zynori-nvidia/zynori-nvidia.iso',
    },
  },
  zykron: {
    name: 'zykron',
    desc: 'KDE Plasma, pre-configured and polished from first boot. Feature-rich, no bloat.',
    wiki: "showsection('wiki-page-zykron')",
    iso:  {
      intel:  'https://archive.org/download/zykron-bootc/zykron-bootc.iso',
      amd:    'https://archive.org/download/zykron-bootc/zykron-bootc.iso',
      nvidia: 'https://archive.org/download/zykron-nvidia/zykron-nvidia.iso',
    },
  },
};

function initQuiz() {
  const quizEl    = document.getElementById('flavour-quiz-2');
  const resultEl  = document.getElementById('quiz-result-2');
  const restartEl = document.getElementById('quiz-restart-2');
  const preview   = document.getElementById('quiz-preview-panel');
  if (!quizEl) return;
  let step = 0, flavour = null, persistedSrc = null;
  const answers = {};
  const steps = quizEl.querySelectorAll('.quiz-step');
  const pips  = quizEl.querySelectorAll('.quiz-pip');
  const CYCLE = [
    './assets/screenshots/desktop-yes.png',
    './assets/screenshots/tiling.png',
    './assets/screenshots/floating.png',
    './assets/screenshots/desktop-no.png',
  ];
  let cycleIdx = 0, cycleTimer = null, activeSrc = null, hoverTimer = null;
  CYCLE.forEach(src => { const i = new Image(); i.src = src; });

  function showImg(src, isActive) {
    if (!preview) return;
    preview.classList.toggle('active', isActive);
    if (src === activeSrc) return;
    activeSrc = src;
    const old = preview.querySelector('img');
    const img = document.createElement('img');
    img.src = src; img.alt = '';
    preview.appendChild(img);
    requestAnimationFrame(() => requestAnimationFrame(() => img.classList.add('visible')));
    if (old) { old.classList.remove('visible'); setTimeout(() => old.remove(), 380); }
    preview.querySelector('.quiz-preview-placeholder')?.remove();
  }

  function startCycle() {
    stopCycle();
    showImg(CYCLE[cycleIdx % CYCLE.length], false);
    cycleTimer = setInterval(() => { cycleIdx++; showImg(CYCLE[cycleIdx % CYCLE.length], false); }, 2500);
  }
  function stopCycle() { clearInterval(cycleTimer); cycleTimer = null; }
  startCycle();

  quizEl.querySelectorAll('.quiz-option[data-preview]').forEach(opt => {
    opt.addEventListener('mouseenter', () => {
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => { stopCycle(); showImg(opt.dataset.preview, true); }, 55);
    });
    opt.addEventListener('mouseleave', () => {
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => {
        if (persistedSrc) { showImg(persistedSrc, true); return; }
        activeSrc = null; startCycle();
      }, 55);
    });
  });

  const renderStep = () => {
    steps.forEach((s, i) => s.classList.toggle('active', i === step));
    pips.forEach((p, i) => p.classList.toggle('done', i < step));
  };

  quizEl.querySelectorAll('.quiz-option').forEach(opt => {
    opt.addEventListener('click', () => {
      clearTimeout(hoverTimer);
      opt.closest('.quiz-step').querySelectorAll('.quiz-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      const val = opt.dataset.val;
      if (step === 0) {
        answers.desktop = val; flavour = val === 'no' ? 'zcore' : null;
        step = val === 'no' ? 2 : 1; setTimeout(renderStep, 300);
      } else if (step === 1) {
        answers.desktop_type = val; flavour = val === 'tiling' ? 'zynori' : 'zykron';
        persistedSrc = opt.dataset.preview || null;
        if (persistedSrc) { stopCycle(); showImg(persistedSrc, true); }
        step = 2; setTimeout(renderStep, 300);
      } else if (step === 2) {
        answers.gpu = val; setTimeout(() => showResult(flavour, val), 300);
      }
    });
  });

  function showResult(key, gpu) {
    steps.forEach(s => s.classList.remove('active'));
    pips.forEach(p => p.classList.add('done'));
    const d = QUIZ_DATA[key];
    resultEl.querySelector('.result-name').textContent = d.name;
    resultEl.querySelector('.result-desc').textContent = d.desc;
    resultEl.querySelector('.result-dl').href = d.iso[gpu];
    const wb = resultEl.querySelector('.result-wiki');
    wb.setAttribute('onclick', d.wiki);
    wb.href = '#';
    resultEl.classList.add('active');
  }

  restartEl?.addEventListener('click', () => {
    step = 0; flavour = null; persistedSrc = null; activeSrc = null; cycleIdx = 0;
    clearTimeout(hoverTimer);
    Object.keys(answers).forEach(k => delete answers[k]);
    resultEl.classList.remove('active');
    quizEl.querySelectorAll('.quiz-option').forEach(o => o.classList.remove('selected'));
    if (preview) { preview.querySelectorAll('img').forEach(i => i.remove()); preview.classList.remove('active'); }
    renderStep(); startCycle();
  });

  renderStep();
}

/* ── Init ────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const hash = window.location.hash.slice(1);
  if (hash) resolveHash(hash);
  else { hidebar(); showsection('home'); }
});

async function resolveHash(hash) {
  const resolved = await hashToSection(hash);
  switch (resolved.type) {
    case 'home':         hidebar(); showsection('home'); break;
    case 'quiz':         showbar(); showsection('ast-quiz'); break;
    case 'repo':         shownav('rep'); showbar(); showsection('rep0'); break;
    case 'wiki-landing': shownav('wiki'); showbar(); showsection('wiki-landing'); break;
    case 'wiki-page':    shownav('wiki'); showbar(); showsection('wiki-page-' + resolved.page.id); break;
    case 'guide-single': shownav('wiki'); showbar(); showsection('guide-' + resolved.guide.id); break;
    case 'guide-step':
      shownav('wiki'); showbar();
      await buildWikiNav();
      expandGuideGroup(resolved.guide.id);
      showsection('guide-' + resolved.guide.id + '-' + resolved.stepIdx);
      break;
    default: hidebar(); showsection('home');
  }
}