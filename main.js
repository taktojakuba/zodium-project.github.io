/* ============================================================
   ZODIUM — main.js
   ============================================================ */

const sectionCache = {};
const mount = () => document.getElementById('section-mount');

/* ── Section navigation ──────────────────────────────────── */
async function showsection(id) {
  const el = mount();
  const classMap = { home: 'section', rep0: 'page section', 'ast-quiz': 'section' };
  el.className = (id.startsWith('guide-')) ? 'section wiki-section' : (classMap[id] ?? 'section wiki-section');

  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active-nav'));
  document.querySelector(`.nav-item[onclick*="'${id}'"]`)?.classList.add('active-nav');
  window.scrollTo({ top: 0, behavior: 'instant' });

  if (id.startsWith('guide-')) {
    el.classList.add('guide-page');
    afterLoad(id);
    return;
  }

  if (sectionCache[id] && id !== 'rep0') {
    el.innerHTML = sectionCache[id];
    afterLoad(id);
    return;
  }

  el.innerHTML = '';

  try {
    const res = await fetch(`sections/${id}.html`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    sectionCache[id] = await res.text();
    el.innerHTML = sectionCache[id];
    afterLoad(id);
  } catch (err) {
    el.innerHTML = `<div style="padding:60px 32px;color:var(--text-muted);font-size:13px;">failed to load section — ${err.message}</div>`;
  }
}

/* ── Post-load hooks ─────────────────────────────────────── */
function afterLoad(id) {
  if (id === 'home')                           { initStars(); runTypedAnimation(); initScrollReveal(); }
  if (id === 'ast-quiz') { initQuiz(); initScrollReveal(); }
  if (id === 'rep0')                           { switchRepo('pkgs'); }
  if (id.startsWith('guide-'))                 { loadGuide(id); }
}

/* ── Sidebar ─────────────────────────────────────────────── */
function shownav(id) {
  document.querySelectorAll('.nav-section.nav-group').forEach(el => el.style.display = 'none');
  document.getElementById('homebutton').style.display = 'block';
  const group = document.getElementById(id);
  if (group) group.style.display = 'flex';
  if (id === 'wiki') buildGuidesNav();
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
    wiki: "showsection('wik0');shownav('wiki');showbar();",
    iso:  {
      intel:  'https://archive.org/download/zcore-bootc/zcore-bootc.iso',
      amd:    'https://archive.org/download/zcore-bootc/zcore-bootc.iso',
      nvidia: 'https://archive.org/download/zcore-nvidia/zcore-nvidia.iso',
    },
  },
  zynori: {
    name: 'zynori',
    desc: 'Niri scrollable tiling compositor + noctalia-shell. Minimal, keyboard-first, ready to boot.',
    wiki: "showsection('wik6');shownav('wiki');showbar();",
    iso:  {
      intel:  'https://archive.org/download/zynori-bootc/zynori-bootc.iso',
      amd:    'https://archive.org/download/zynori-bootc/zynori-bootc.iso',
      nvidia: 'https://archive.org/download/zynori-nvidia/zynori-nvidia.iso',
    },
  },
  zykron: {
    name: 'zykron',
    desc: 'KDE Plasma, pre-configured and polished from first boot. Feature-rich, no bloat.',
    wiki: "showsection('wik7');shownav('wiki');showbar();",
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

  /* ── State ── */
  let step = 0, flavour = null, persistedSrc = null;
  const answers = {};
  const steps = quizEl.querySelectorAll('.quiz-step');
  const pips  = quizEl.querySelectorAll('.quiz-pip');

  /* ── Preview ── */
  const CYCLE = [
    './assets/screenshots/desktop-yes.png',
    './assets/screenshots/tiling.png',
    './assets/screenshots/floating.png',
    './assets/screenshots/desktop-no.png',
  ];
  let cycleIdx = 0, cycleTimer = null;
  let activeSrc = null, hoverTimer = null;

  // Preload all images up front so swaps are instant
  CYCLE.forEach(src => { const i = new Image(); i.src = src; });

  function showImg(src, isActive) {
    if (!preview) return;
    preview.classList.toggle('active', isActive);
    if (src === activeSrc) return;
    activeSrc = src;

    const old = preview.querySelector('img');
    const img = document.createElement('img');
    img.src = src;
    img.alt = '';
    preview.appendChild(img);
    requestAnimationFrame(() => requestAnimationFrame(() => img.classList.add('visible')));
    if (old) {
      old.classList.remove('visible');
      setTimeout(() => old.remove(), 380);
    }
    preview.querySelector('.quiz-preview-placeholder')?.remove();
  }

  function startCycle() {
    stopCycle();
    showImg(CYCLE[cycleIdx % CYCLE.length], false);
    cycleTimer = setInterval(() => {
      cycleIdx++;
      showImg(CYCLE[cycleIdx % CYCLE.length], false);
    }, 2500);
  }

  function stopCycle() {
    clearInterval(cycleTimer);
    cycleTimer = null;
  }

  startCycle();

  /* ── Hover on options with preview ── */
  quizEl.querySelectorAll('.quiz-option[data-preview]').forEach(opt => {
    opt.addEventListener('mouseenter', () => {
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => {
        stopCycle();
        showImg(opt.dataset.preview, true);
      }, 55);
    });
    opt.addEventListener('mouseleave', () => {
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => {
        if (persistedSrc) { showImg(persistedSrc, true); return; }
        activeSrc = null; // force re-render on cycle resume
        startCycle();
      }, 55);
    });
  });

  /* ── Step rendering ── */
  const renderStep = () => {
    steps.forEach((s, i) => s.classList.toggle('active', i === step));
    pips.forEach((p, i) => p.classList.toggle('done', i < step));
  };

  /* ── Clicks ── */
  quizEl.querySelectorAll('.quiz-option').forEach(opt => {
    opt.addEventListener('click', () => {
      clearTimeout(hoverTimer);
      opt.closest('.quiz-step').querySelectorAll('.quiz-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      const val = opt.dataset.val;

      if (step === 0) {
        answers.desktop = val;
        flavour = val === 'no' ? 'zcore' : null;
        step = val === 'no' ? 2 : 1;
        setTimeout(renderStep, 300);
      } else if (step === 1) {
        answers.desktop_type = val;
        flavour = val === 'tiling' ? 'zynori' : 'zykron';
        persistedSrc = opt.dataset.preview || null;
        if (persistedSrc) { stopCycle(); showImg(persistedSrc, true); }
        step = 2;
        setTimeout(renderStep, 300);
      } else if (step === 2) {
        answers.gpu = val;
        setTimeout(() => showResult(flavour, val), 300);
      }
    });
  });

  /* ── Result ── */
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

  /* ── Restart ── */
  restartEl?.addEventListener('click', () => {
    step = 0; flavour = null; persistedSrc = null; activeSrc = null; cycleIdx = 0;
    clearTimeout(hoverTimer);
    Object.keys(answers).forEach(k => delete answers[k]);
    resultEl.classList.remove('active');
    quizEl.querySelectorAll('.quiz-option').forEach(o => o.classList.remove('selected'));
    if (preview) {
      preview.querySelectorAll('img').forEach(i => i.remove());
      preview.classList.remove('active');
    }
    renderStep();
    startCycle();
  });

  renderStep();
}

/* ── Guides ──────────────────────────────────────────────── */
const GUIDES_BASE = 'sections/guides/';
let guidesManifest = null;

async function fetchManifest() {
  if (guidesManifest) return guidesManifest;
  try {
    const res = await fetch(GUIDES_BASE + 'manifest.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    guidesManifest = await res.json();
  } catch {
    guidesManifest = [];
  }
  return guidesManifest;
}

async function buildGuidesNav() {
  const nav = document.getElementById('guides-nav');
  if (!nav) return;
  const guides = await fetchManifest();
  if (!guides.length) {
    nav.innerHTML = `<span class="nav-item" style="color:var(--text-muted);font-size:12px;padding-left:8px;">no guides yet</span>`;
    return;
  }
  nav.innerHTML = guides.map(g => {
    if (g.steps) {
      const steps = g.steps.map((s, i) => `<a onclick="showsection('guide-${g.id}-${i}')" class="nav-item guide-step"><span class="nav-dot"></span>${s.title}</a>`).join('');
      return `<a onclick="toggleGuideGroup('gg-${g.id}')" class="nav-item guide-parent">
        <span class="guide-chevron" id="chev-${g.id}">▸</span>${g.title}
      </a>
      <div class="guide-group" id="gg-${g.id}" style="display:none;">${steps}</div>`;
    }
    return `<a onclick="showsection('guide-${g.id}')" class="nav-item"><span class="nav-dot"></span>${g.title}</a>`;
  }).join('');
}

function toggleGuideGroup(id) {
  const el = document.getElementById(id);
  const chevId = id.replace('gg-', 'chev-');
  const chev = document.getElementById(chevId);
  if (!el) return;
  const open = el.style.display === 'none';
  el.style.display = open ? 'flex' : 'none';
  el.style.flexDirection = 'column';
  if (chev) chev.textContent = open ? '▾' : '▸';
}

async function loadGuide(id) {
  const el = mount();
  const guides = await fetchManifest();

  // parse id: 'guide-nvidia-2' → guideId='nvidia', stepIdx=2
  const parts = id.replace('guide-', '').split('-');
  const stepIdx = isNaN(parts[parts.length - 1]) ? null : parseInt(parts.pop());
  const guideId = parts.join('-');
  const guide = guides.find(g => g.id === guideId);

  if (!guide) {
    el.innerHTML = `<div style="padding:60px 32px;color:var(--text-muted);font-size:13px;">guide not found</div>`;
    return;
  }

  const isStepped = !!guide.steps;
  const file = isStepped ? guide.steps[stepIdx].file : guide.file;
  const pageTitle = isStepped ? guide.steps[stepIdx].title : guide.title;

  try {
    const res = await fetch(GUIDES_BASE + file);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const md = await res.text();

    let stepper = '';
    let prev = '';
    let next = '';
    if (isStepped) {
      const pips = guide.steps.map((s, i) => `
        <div class="stepper-pip ${i === stepIdx ? 'active' : i < stepIdx ? 'done' : ''}" onclick="showsection('guide-${guideId}-${i}')">
          <div class="stepper-num">${i < stepIdx ? '✓' : i + 1}</div>
          <div class="stepper-label">${s.title}</div>
        </div>`).join('<div class="stepper-line"></div>');

      const prev = stepIdx > 0
        ? `<a onclick="showsection('guide-${guideId}-${stepIdx - 1}')" class="btn btn-ghost btn-sm">← ${guide.steps[stepIdx - 1].title}</a>`
        : '';
      const next = stepIdx < guide.steps.length - 1
        ? `<a onclick="showsection('guide-${guideId}-${stepIdx + 1}')" class="btn btn-primary btn-sm">${guide.steps[stepIdx + 1].title} →</a>`
        : '<span class="btn btn-ghost btn-sm" style="opacity:0.4;cursor:default;">done ✓</span>';

      stepper = `
        <div class="stepper">${pips}</div>
        <div class="stepper-nav">${prev}${next}</div>`;
    }

    el.innerHTML = `
      <div class="page-header">
        <div class="breadcrumb">
          <a onclick="showsection('home');hidebar()">home</a>
          <span class="breadcrumb-sep">/</span>
          <a onclick="shownav('wiki');showbar();showsection('wik0')">wiki</a>
          <span class="breadcrumb-sep">/</span>
          ${isStepped ? `<span>${guide.title}</span><span class="breadcrumb-sep">/</span>` : ''}
          ${pageTitle}
        </div>
        <h1>${pageTitle}</h1>
        ${isStepped ? `<p class="page-sub">Step ${stepIdx + 1} of ${guide.steps.length}</p>` : ''}
      </div>
      <div class="content-body">
        ${isStepped ? stepper : ''}
        <div class="content-block md-body">${marked.parse(md)}</div>
        ${isStepped ? `<div class="stepper-nav stepper-nav--bottom">${prev}${next}</div>` : ''}
      </div>`;
  } catch (err) {
    el.innerHTML = `<div style="padding:60px 32px;color:var(--text-muted);font-size:13px;">failed to load — ${err.message}</div>`;
  }
}

/* ── Init ────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => { hidebar(); showsection('home'); });