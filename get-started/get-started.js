/* ============================================================
   ZODIUM — get-started.js
   ============================================================ */

const QUIZ_DATA = {
  zcore: {
    name: 'zcore',
    desc: 'Bare fedora-bootc base. No desktop — a clean, reproducible foundation you can extend into anything.',
    wiki: '/wiki/zcore',
    iso: {
      intel:  'https://archive.org/download/zcore-bootc/zcore-bootc.iso',
      amd:    'https://archive.org/download/zcore-bootc/zcore-bootc.iso',
      nvidia: 'https://archive.org/download/zcore-nvidia/zcore-nvidia.iso',
    },
  },
  zynori: {
    name: 'zynori',
    desc: 'Niri scrollable tiling compositor + noctalia-shell. Minimal, keyboard-first, ready to boot.',
    wiki: '/wiki/zynori',
    iso: {
      intel:  'https://archive.org/download/zynori-bootc/zynori-bootc.iso',
      amd:    'https://archive.org/download/zynori-bootc/zynori-bootc.iso',
      nvidia: 'https://archive.org/download/zynori-nvidia/zynori-nvidia.iso',
    },
  },
  zykron: {
    name: 'zykron',
    desc: 'KDE Plasma, pre-configured and polished from first boot. Feature-rich, no bloat.',
    wiki: '/wiki/zykron',
    iso: {
      intel:  'https://archive.org/download/zykron-bootc/zykron-bootc.iso',
      amd:    'https://archive.org/download/zykron-bootc/zykron-bootc.iso',
      nvidia: 'https://archive.org/download/zykron-nvidia/zykron-nvidia.iso',
    },
  },
};

document.addEventListener('DOMContentLoaded', initQuiz);

function initQuiz() {
  const quizEl    = document.getElementById('flavour-quiz');
  const resultEl  = document.getElementById('quiz-result');
  const restartEl = document.getElementById('quiz-restart');
  const preview   = document.getElementById('quiz-preview-panel');
  if (!quizEl) return;

  let step = 0, flavour = null, persistedSrc = null;
  const answers = {};
  const steps = quizEl.querySelectorAll('.quiz-step');
  const pips  = quizEl.querySelectorAll('.quiz-pip');

  const CYCLE = [
    './screenshots/desktop-yes.png',
    './screenshots/tiling.png',
    './screenshots/floating.png',
    './screenshots/desktop-no.png',
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
    resultEl.querySelector('.result-dl').href  = d.iso[gpu];
    resultEl.querySelector('.result-wiki').href = d.wiki;
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

document.getElementById('nav-toggle')?.addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('open');
});
document.getElementById('sidebar-overlay')?.addEventListener('click', () => {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('open');
});