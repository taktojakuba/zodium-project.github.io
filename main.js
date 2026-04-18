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
const QUIZ_RESULTS = {
  zcore:  { name:'zcore',  section:'wik0', nav:'wiki', tags:['fedora-bootc','OCI','bare','extensible'],        desc:'The bare <strong>fedora-bootc</strong> base image. No desktop, no extras — just a clean, reproducible foundation you can extend into anything you want.' },
  zynori: { name:'zynori', section:'ast0', nav:'ast',  tags:['niri','wayland','tiling','minimal'],              desc:'Built around <strong>niri</strong> — a scrollable tiling Wayland compositor paired with noctalia-shell. Minimal, spatial, and fast.' },
  zykron: { name:'zykron', section:'ast1', nav:'ast',  tags:['kde plasma','wayland','full desktop','floating'], desc:'A complete <strong>KDE Plasma</strong> desktop, pre-configured and polished from first boot. Feature-rich without the bloat.' },
};

function scoreQuiz(a) {
  if (a[0] === 'bare') return 'zcore';
  const t = (a[1]==='tiling'?2:0) + (a[2]==='minimal'?1:0) + (a[3]==='compositor'?1:0);
  return t >= 2 ? 'zynori' : 'zykron';
}

function initQuizInstance(quizEl, resultId, restartId) {
  if (!quizEl) return;
  let step = 0; const answers = [];
  const steps    = quizEl.querySelectorAll('.quiz-step');
  const pips     = quizEl.querySelectorAll('.quiz-pip');
  const resultEl = document.getElementById(resultId);

  const renderStep = () => {
    pips.forEach((p,i)  => p.classList.toggle('done',   i < step));
    steps.forEach((s,i) => s.classList.toggle('active', i === step));
  };

  quizEl.querySelectorAll('.quiz-option').forEach(opt => {
    opt.addEventListener('click', () => {
      opt.closest('.quiz-step').querySelectorAll('.quiz-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      answers[step] = opt.dataset.val;
      setTimeout(() => {
        step++;
        if (answers[0] === 'bare' || step >= stesps.length) showResult();
        else renderStep();
      }, 300);
    });
  });

  function showResult() {
    steps.forEach(s => s.classList.remove('active'));
    pips.forEach(p => p.classList.add('done'));
    if (!resultEl) return;
    const r = QUIZ_RESULTS[scoreQuiz(answers)];
    resultEl.querySelector('.result-name').textContent = r.name;
    resultEl.querySelector('.result-desc').innerHTML   = r.desc;
    resultEl.querySelector('.result-tags').innerHTML   = r.tags.map(t => `<span class="rtag">${t}</span>`).join('');
    const goBtn = resultEl.querySelector('.result-go');
    if (goBtn) goBtn.onclick = () => { shownav(r.nav); showbar(); showsection(r.section); };
    resultEl.classList.add('active');
  }

  document.getElementById(restartId)?.addEventListener('click', () => {
    step = 0; answers.length = 0;
    resultEl?.classList.remove('active');
    quizEl.querySelectorAll('.quiz-option').forEach(o => o.classList.remove('selected'));
    renderStep();
  });

  renderStep();
}

function initQuiz() {
  initQuizInstance(document.getElementById('flavour-quiz'),   'quiz-result',   'quiz-restart');
  initQuizInstance(document.getElementById('flavour-quiz-2'), 'quiz-result-2', 'quiz-restart-2');
}

/* ── Init ────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => { hidebar(); showsection('home'); });