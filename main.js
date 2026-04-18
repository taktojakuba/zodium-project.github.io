/* ============================================================
   ZODIUM — main.js
   ============================================================ */

const sectionCache = {};
const mount = () => document.getElementById('section-mount');

/* ── Section navigation ──────────────────────────────────── */
async function showsection(id) {
  const el = mount();
  const classMap = { home: 'section', rep0: 'page section', 'ast-quiz': 'section' };
  el.className = classMap[id] ?? 'section wiki-section';

  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active-nav'));
  document.querySelector(`.nav-item[onclick*="'${id}'"]`)?.classList.add('active-nav');
  window.scrollTo({ top: 0, behavior: 'instant' });

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
  if (['ast-quiz','ast0','ast1'].includes(id)) { initQuiz(); initScrollReveal(); }
  if (id === 'rep0')                           { switchRepo('pkgs'); }
}

/* ── Sidebar ─────────────────────────────────────────────── */
function shownav(id) {
  document.querySelectorAll('.nav-section.nav-group').forEach(el => el.style.display = 'none');
  document.getElementById('homebutton').style.display = 'block';
  const group = document.getElementById(id);
  if (group) group.style.display = 'flex';
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
    wiki: "showsection('ast0');shownav('ast');showbar();",
    iso:  {
      intel:  'https://archive.org/download/zynori-bootc/zynori-bootc.iso',
      amd:    'https://archive.org/download/zynori-bootc/zynori-bootc.iso',
      nvidia: 'https://archive.org/download/zynori-nvidia/zynori-nvidia.iso',
    },
  },
  zykron: {
    name: 'zykron',
    desc: 'KDE Plasma, pre-configured and polished from first boot. Feature-rich, no bloat.',
    wiki: "showsection('ast1');shownav('ast');showbar();",
    iso:  {
      intel:  'https://archive.org/download/zykron-bootc/zykron-bootc.iso',
      amd:    'https://archive.org/download/zykron-bootc/zykron-bootc.iso',
      nvidia: 'https://archive.org/download/zykron-nvidia/zykron-nvidia.iso',
    },
  },
};

function initQuiz() {
  const quizEl   = document.getElementById('flavour-quiz-2');
  const resultEl = document.getElementById('quiz-result-2');
  const restartEl = document.getElementById('quiz-restart-2');
  if (!quizEl) return;

  let step = 0;
  let flavour = null;
  const answers = {};
  const steps = quizEl.querySelectorAll('.quiz-step');
  const pips  = quizEl.querySelectorAll('.quiz-pip');

  const renderStep = () => {
    steps.forEach((s, i) => s.classList.toggle('active', i === step));
    pips.forEach((p, i) => p.classList.toggle('done', i < step));
  };

  quizEl.querySelectorAll('.quiz-option').forEach(opt => {
    opt.addEventListener('click', () => {
      opt.closest('.quiz-step').querySelectorAll('.quiz-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      const val = opt.dataset.val;

      if (step === 0) {
        answers.desktop = val;
        flavour = val === 'no' ? 'zcore' : null;
        // skip Q2 if no desktop, go straight to GPU
        step = val === 'no' ? 2 : 1;
        setTimeout(renderStep, 300);
      } else if (step === 1) {
        answers.desktop_type = val;
        flavour = val === 'tiling' ? 'zynori' : 'zykron';
        step = 2;
        setTimeout(renderStep, 300);
      } else if (step === 2) {
        answers.gpu = val;
        setTimeout(() => showResult(flavour, val), 300);
      }
    });
  });

  function showResult(key, gpu) {
    steps.forEach(s => s.classList.remove('active'));
    pips.forEach(p => p.classList.add('done'));
    const d = QUIZ_DATA[key];
    resultEl.querySelector('.result-name').textContent = d.name;
    resultEl.querySelector('.result-desc').textContent = d.desc;
    const dlBtn   = resultEl.querySelector('.result-dl');
    const wikiBtn = resultEl.querySelector('.result-wiki');
    dlBtn.href = d.iso[gpu];
    wikiBtn.setAttribute('onclick', d.wiki);
    wikiBtn.href = '#';
    resultEl.classList.add('active');
  }

  restartEl?.addEventListener('click', () => {
    step = 0; flavour = null;
    Object.keys(answers).forEach(k => delete answers[k]);
    resultEl.classList.remove('active');
    quizEl.querySelectorAll('.quiz-option').forEach(o => o.classList.remove('selected'));
    renderStep();
  });

  renderStep();
}

/* ── Init ────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => { hidebar(); showsection('home'); });