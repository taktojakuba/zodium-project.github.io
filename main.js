/* ============================================================
   ZODIUM — main.js  (multi-file router edition)
   ============================================================ */

/* ── Route map ───────────────────────────────────────────── */
const ROUTES = {
  'home':                'website/home.html',
  'ast-quiz':            'website/getstarted.html',
  'flavours':            'website/wiki.html',
  'wiki/distros/zcore':  'website/wiki-files/distros/zcore.html',
  'wiki/distros/zynori': 'website/wiki-files/distros/zynori.html',
  'wiki/distros/zykron': 'website/wiki-files/distros/zykron.html',
  'wiki/tools/zfetch':   'website/wiki-files/tools/zfetch.html',
  'wiki/tools/zrun':     'website/wiki-files/tools/zrun.html',
  'wiki/tools/zgpu':     'website/wiki-files/tools/zgpu.html',
  'wiki/tools/zync':     'website/wiki-files/tools/zync.html',
  'wiki/tools/zbox':     'website/wiki-files/tools/zbox.html',
};

/* ── Page cache ──────────────────────────────────────────── */
const PAGE_CACHE = {};

/* ── Core router ─────────────────────────────────────────── */
async function navigate(route) {
  const container = document.getElementById('page-container');
  const sidebar = document.getElementById('sidebar');
  const main = document.getElementById('main');
  const topbar = document.getElementById('topbar');
  if (sidebar) sidebar.style.display = 'none';
  if (main) main.classList.remove('sidebar-open');
  if (topbar) topbar.style.display = 'flex';
  const path = ROUTES[route];

  if (!path) {
    console.warn('zodium: unknown route:', route);
    return;
  }

  // Fetch & cache
  if (!PAGE_CACHE[route]) {
    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error(res.status);
      PAGE_CACHE[route] = await res.text();
    } catch (err) {
      console.error('zodium: failed to load', path, err);
      container.innerHTML = `<div style="padding:60px 40px;color:var(--text-muted);font-family:var(--font-mono);font-size:13px;">failed to load page: ${path}</div>`;
      return;
    }
  }

  container.innerHTML = PAGE_CACHE[route];
  window.scrollTo({ top: 0, behavior: 'instant' });

  // Re-run page-specific init after content swap
  if (route === 'home') {
    initStars();
    runTypedAnimation();
    initScrollReveal();
    initQuizInstance(
      document.getElementById('flavour-quiz'),
      'quiz-result',
      'quiz-restart'
    );
  }

  if (route === 'ast-quiz') {
    hidebar();
    initQuizInstance(
      document.getElementById('flavour-quiz-2'),
      'quiz-result-2',
      'quiz-restart-2'
    );
  }
}

/* ── Sidebar nav helpers ─────────────────────────────────── */
function shownav(id) {
  document.querySelectorAll('.nav-section.nav-group').forEach(el => {
    el.style.display = 'none';
  });
  const homebtn = document.getElementById('homebutton');
  if (homebtn) homebtn.style.display = 'block';
  const group = document.getElementById(id);
  if (group) group.style.display = 'flex';
}

function hidebar() {
  const sidebar = document.getElementById('sidebar');
  const main    = document.getElementById('main');
  const topbar  = document.getElementById('topbar');
  if (sidebar) sidebar.style.display = 'none';
  if (main)    main.classList.remove('sidebar-open');
  if (topbar)  topbar.style.display = 'flex';
  document.querySelectorAll('.nav-section.nav-group').forEach(el => {
    el.style.display = 'none';
  });
}

function showbar() {
  const sidebar = document.getElementById('sidebar');
  const main    = document.getElementById('main');
  const topbar  = document.getElementById('topbar');
  if (sidebar) sidebar.style.display = 'flex';
  if (main)    main.classList.add('sidebar-open');
  if (topbar)  topbar.style.display = 'none';
}

/* ── Stars animation ─────────────────────────────────────── */
function initStars() {
  const canvas = document.getElementById('star-canvas');
  if (!canvas) return;

  // Avoid double-init if already running
  if (canvas._zodiumStars) return;
  canvas._zodiumStars = true;

  const ctx = canvas.getContext('2d');
  let W, H, stars = [], animId;

  const isDark = () =>
    window.matchMedia('(prefers-color-scheme: dark)').matches;

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function mkStar() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.2 + 0.2,
      speed: Math.random() * 0.5 + 0.15,
      angle: Math.PI / 4 + (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.5 + 0.1,
      trail: [],
      trailLen: Math.floor(Math.random() * 6 + 3),
    };
  }

  function initStarPool() {
    stars = [];
    const count = Math.floor((W * H) / 10000);
    for (let i = 0; i < count; i++) {
      const s = mkStar();
      s.x = Math.random() * W;
      s.y = Math.random() * H;
      stars.push(s);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const color = isDark() ? `rgba(184,202,212,` : `rgba(45,59,69,`;

    for (const s of stars) {
      for (let i = 0; i < s.trail.length; i++) {
        const t = s.trail[i];
        const a = (i / s.trail.length) * s.alpha * 0.35;
        ctx.beginPath();
        ctx.arc(t.x, t.y, s.r * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = color + a + ')';
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = color + s.alpha + ')';
      ctx.fill();

      s.trail.push({ x: s.x, y: s.y });
      if (s.trail.length > s.trailLen) s.trail.shift();
      s.x += Math.cos(s.angle) * s.speed;
      s.y += Math.sin(s.angle) * s.speed;

      if (s.x > W + 10 || s.y > H + 10) {
        const ns = mkStar();
        if (Math.random() < 0.5) { ns.x = Math.random() * W; ns.y = -5; }
        else                      { ns.x = -5; ns.y = Math.random() * H; }
        Object.assign(s, ns);
        s.trail = [];
      }
    }
    animId = requestAnimationFrame(draw);
  }

  resize();
  initStarPool();
  draw();

  const ro = new ResizeObserver(() => { resize(); initStarPool(); });
  ro.observe(canvas.parentElement);
}

/* ── Typed terminal ──────────────────────────────────────── */
function runTypedAnimation() {
  const outputEl = document.querySelector('.typed-output');
  const cursorEl = document.querySelector('.term-cursor');
  if (!outputEl || outputEl._zodiumTyped) return;
  outputEl._zodiumTyped = true;

  const lines = [
    { text: '✓ Fetching image layers...', color: 't-teal',  delay: 800 },
    { text: '✓ Verifying signatures...', color: 't-white', delay: 1600 },
    { text: '✓ Staged. Reboot to apply.', color: 't-green', delay: 2600 },
  ];

  let lineIndex = 0;

  function typeLine(lineObj, onDone) {
    const full = lineObj.text;
    let i = 0;
    outputEl.textContent = '';
    outputEl.className = 'typed-output ' + (lineObj.color || '');
    const interval = setInterval(() => {
      outputEl.textContent += full[i++];
      if (i >= full.length) {
        clearInterval(interval);
        setTimeout(onDone, 700);
      }
    }, 28);
  }

  function nextLine() {
    if (lineIndex >= lines.length) {
      if (cursorEl) cursorEl.style.display = 'none';
      setTimeout(() => {
        lineIndex = 0;
        if (cursorEl) cursorEl.style.display = 'inline-block';
        outputEl.textContent = '';
        scheduleNext();
      }, 3200);
      return;
    }
    const line = lines[lineIndex];
    setTimeout(() => {
      typeLine(line, () => { lineIndex++; scheduleNext(); });
    }, lineIndex === 0 ? 200 : 0);
  }

  function scheduleNext() { nextLine(); }
  setTimeout(scheduleNext, 1600);
}

/* ── Scroll reveal ───────────────────────────────────────── */
function initScrollReveal() {
  const targets = document.querySelectorAll('.tool-card, .flavour-card, .fstrip-item');
  if (!targets.length) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  targets.forEach((el, i) => {
    el.style.animationDelay = `${i * 55}ms`;
    observer.observe(el);
  });
}

/* ── Flavour quiz ────────────────────────────────────────── */
const QUIZ_RESULTS = {
  zcore: {
    name: 'zcore',
    desc: 'The bare <strong>fedora-bootc</strong> base image. No desktop, no extras — just a clean, reproducible foundation you can extend into anything you want.',
    tags: ['fedora-bootc', 'OCI', 'bare', 'extensible'],
    route: 'wiki/distros/zcore',
    nav: 'wiki',
  },
  zynori: {
    name: 'zynori',
    desc: 'Built around <strong>niri</strong> — a scrollable tiling Wayland compositor paired with noctalia-shell. Minimal, spatial, and fast. Great for keyboard-driven workflows.',
    tags: ['niri', 'wayland', 'tiling', 'minimal'],
    route: 'wiki/distros/zynori',
    nav: 'ast',
  },
  zykron: {
    name: 'zykron',
    desc: 'A complete <strong>KDE Plasma</strong> desktop, pre-configured and polished from first boot. Feature-rich without the bloat — familiar, flexible, and ready to go.',
    tags: ['kde plasma', 'wayland', 'full desktop', 'floating'],
    route: 'wiki/distros/zykron',
    nav: 'ast',
  },
};

function scoreQuiz(answers) {
  if (answers[0] === 'bare') return 'zcore';
  let t = 0, f = 0;
  if (answers[1] === 'tiling')     t += 2; else f += 2;
  if (answers[2] === 'minimal')    t += 1; else f += 1;
  if (answers[3] === 'compositor') t += 1; else f += 1;
  return t >= f ? 'zynori' : 'zykron';
}

function initQuizInstance(quizEl, resultId, restartId) {
  if (!quizEl) return;
  let step = 0;
  const answers = [];
  const steps    = quizEl.querySelectorAll('.quiz-step');
  const pips     = quizEl.querySelectorAll('.quiz-pip');
  const resultEl = document.getElementById(resultId);
  const totalSteps = steps.length;

  function renderStep() {
    pips.forEach((p, i) => p.classList.toggle('done', i < step));
    steps.forEach((s, i) => s.classList.toggle('active', i === step));
  }

  quizEl.querySelectorAll('.quiz-option').forEach(opt => {
    opt.addEventListener('click', () => {
      const stepEl = opt.closest('.quiz-step');
      stepEl.querySelectorAll('.quiz-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      answers[step] = opt.dataset.val;

      setTimeout(() => {
        step++;
        if (answers[0] === 'bare') { showResult(); return; }
        if (step < totalSteps) renderStep();
        else showResult();
      }, 300);
    });
  });

  function showResult() {
    steps.forEach(s => s.classList.remove('active'));
    pips.forEach(p => p.classList.add('done'));
    if (!resultEl) return;
    const key = scoreQuiz(answers);
    const r   = QUIZ_RESULTS[key];
    resultEl.querySelector('.result-name').textContent = r.name;
    resultEl.querySelector('.result-desc').innerHTML   = r.desc;
    resultEl.querySelector('.result-tags').innerHTML   = r.tags.map(t => `<span class="rtag">${t}</span>`).join('');
    const goBtn = resultEl.querySelector('.result-go');
    if (goBtn) goBtn.onclick = () => { shownav(r.nav); showbar(); navigate(r.route); };
    resultEl.classList.add('active');
  }

  document.getElementById(restartId)?.addEventListener('click', () => {
    step = 0; answers.length = 0;
    if (resultEl) resultEl.classList.remove('active');
    quizEl.querySelectorAll('.quiz-option').forEach(o => o.classList.remove('selected'));
    renderStep();
  });

  renderStep();
}

/* ── Init ────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  // Wire up home nav button
  const homebtn = document.getElementById('homebutton');
  if (homebtn) {
    homebtn.querySelector('.nav-item')?.addEventListener('click', () => {
      hidebar();
      navigate('home');
    });
  }

  // Boot into home
  hidebar();
  navigate('home');
});