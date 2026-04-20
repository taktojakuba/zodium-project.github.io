/* ============================================================
   ZODIUM — wiki.js
   ============================================================ */

const MANIFEST = '/wiki/manifest.json';
let _manifest = null;
let _currentPath = null;

/* ── Helpers ─────────────────────────────────────────────── */
const mount  = () => document.getElementById('wiki-mount');
const esc    = s  => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const errBox = msg => `<div class="err-box">failed to load — ${msg}</div>`;

function rebaseImages(html, fileDir) {
  return html.replace(/(<img\s[^>]*src=")(?!https?:\/\/|\/|data:)\.?\/?([^"]+)"/gi,
    (_, prefix, src) => `${prefix}/wiki/${fileDir}/${src}"`
  );
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function fetchManifest() {
  if (_manifest) return _manifest;
  try {
    const res = await fetch(MANIFEST);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    _manifest = await res.json();
  } catch {
    _manifest = { wiki: { distros: [], flavours: [], tools: [] }, guides: [] };
  }
  return _manifest;
}

/* ── Routing ─────────────────────────────────────────────── */
async function pathToRoute(path) {
  // path like /wiki, /wiki/zcore, /wiki/nvidia/driver-install
  const parts = path.replace(/^\/wiki\/?/, '').split('/').filter(Boolean);
  if (!parts.length) return { type: 'landing' };

  const slug     = parts[0];
  const stepSlug = parts[1];
  const m        = await fetchManifest();

  // check all wiki categories
  for (const cat of Object.values(m.wiki)) {
    const page = cat.find(p => p.id === slug);
    if (page) return { type: 'page', page };
  }
  // check guides
  const guide = m.guides.find(g => g.id === slug);
  if (guide) {
    if (!guide.steps) return { type: 'guide-single', guide };
    const stepIdx = stepSlug
      ? Math.max(0, guide.steps.findIndex(s => slugify(s.title) === stepSlug))
      : 0;
    return { type: 'guide-step', guide, stepIdx };
  }
  return { type: 'landing' };
}

/* ── Navigate ────────────────────────────────────────────── */
async function navigate(path, push = true) {
  if (push && path !== _currentPath) {
    history.pushState(null, '', path);
  }
  _currentPath = path;
  window.scrollTo({ top: 0, behavior: 'instant' });

  const route = await pathToRoute(path);
  await buildSidebar(route);

  switch (route.type) {
    case 'landing':     return renderLanding();
    case 'page':        return renderPage(route.page);
    case 'guide-single':return renderGuideSingle(route.guide);
    case 'guide-step':  return renderGuideStep(route.guide, route.stepIdx);
  }
}

/* ── Sidebar ─────────────────────────────────────────────── */
async function buildSidebar(activeRoute) {
  const nav = document.getElementById('wiki-nav');
  if (!nav) return;
  const m = await fetchManifest();

  const activeId = activeRoute.type === 'page'         ? activeRoute.page.id
                 : activeRoute.type === 'guide-single' ? 'guide-' + activeRoute.guide.id
                 : activeRoute.type === 'guide-step'   ? 'guide-' + activeRoute.guide.id + '-' + activeRoute.stepIdx
                 : null;

  const link = (id, href, label, extraClass = '') => {
    const active = id === activeId ? ' active-nav' : '';
    return `<a href="${href}" class="nav-item${active}${extraClass ? ' ' + extraClass : ''}" data-id="${id}"><span class="nav-dot"></span>${esc(label)}</a>`;
  };

  const pageLinks = (pages) => pages.map(p =>
    link(p.id, '/wiki/' + p.id, p.title)
  ).join('');

  const guideLinks = m.guides.map(g => {
    if (!g.steps) return link('guide-' + g.id, '/wiki/' + g.id, g.title);
    const isExpanded = activeRoute.type === 'guide-step' && activeRoute.guide.id === g.id;
    const steps = g.steps.map((s, i) =>
      link('guide-' + g.id + '-' + i, '/wiki/' + g.id + '/' + slugify(s.title), s.title, 'guide-step')
    ).join('');
    return `
      <a onclick="toggleGuideGroup('gg-${g.id}','chev-${g.id}')" class="nav-item guide-parent">
        <span class="guide-chevron" id="chev-${g.id}">${isExpanded ? '▾' : '▸'}</span>${esc(g.title)}
      </a>
      <div class="guide-group" id="gg-${g.id}" style="display:${isExpanded ? 'flex' : 'none'};flex-direction:column;">${steps}</div>`;
  }).join('');

  // Mark wiki home active on landing
  const wikiHomeEl = document.getElementById('nav-wiki-home');
  if (wikiHomeEl) wikiHomeEl.classList.toggle('active-nav', activeRoute.type === 'landing');

  nav.innerHTML = `
    <span class="nav-label">distros</span>
    <div class="nav-group">${pageLinks(m.wiki.distros)}</div>
    <span class="nav-label" style="margin-top:14px;">guides</span>
    <div class="nav-group">${guideLinks}</div>
    <span class="nav-label" style="margin-top:14px;">tools</span>
    <div class="nav-group">${pageLinks(m.wiki.tools)}</div>`;
}

function toggleGuideGroup(ggId, chevId) {
  const el   = document.getElementById(ggId);
  const chev = document.getElementById(chevId);
  if (!el) return;
  const open = el.style.display === 'none';
  el.style.display = open ? 'flex' : 'none';
  if (open) el.style.flexDirection = 'column';
  if (chev) chev.textContent = open ? '▾' : '▸';
}

/* ── Renderers ───────────────────────────────────────────── */
async function renderLanding() {
  const el = mount();
  const m  = await fetchManifest();

  const catHtml = (label, pages) => `
    <div class="wiki-landing-cat">
      <div class="wiki-landing-label">${label}</div>
      <div class="wiki-landing-items">
        ${pages.map(p => `
          <a href="/wiki/${p.id}" class="wiki-landing-item">
            <span class="wiki-landing-title">${esc(p.title)}</span>
            ${p.sub ? `<span class="wiki-landing-sub">${esc(p.sub)}</span>` : ''}
          </a>`).join('')}
      </div>
    </div>`;

  const guidesHtml = m.guides.map(g => {
    if (!g.steps) return `
      <a href="/wiki/${g.id}" class="wiki-landing-item">
        <span class="wiki-landing-title">${esc(g.title)}</span>
      </a>`;
    return `
      <div class="wiki-landing-item wiki-landing-item--group">
        <span class="wiki-landing-title">${esc(g.title)}</span>
        <div class="wiki-landing-steps">
          ${g.steps.map((s, i) => `
            <a href="/wiki/${g.id}/${slugify(s.title)}" class="wiki-landing-step">
              <span class="step-num">${i + 1}</span>${esc(s.title)}
            </a>`).join('')}
        </div>
      </div>`;
  }).join('');

  el.innerHTML = `
    <div class="wiki-section">
      <div class="page-header">
        <div class="breadcrumb">
          <a href="/">home</a><span class="breadcrumb-sep">/</span>
          <span>wiki</span>
        </div>
        <h1>wiki</h1>
        <p class="page-sub">Documentation, guides, and references for the zodium project.</p>
      </div>
      <div class="wiki-landing-grid">
        ${catHtml('distros', m.wiki.distros)}
        <div class="wiki-landing-cat">
          <div class="wiki-landing-label">guides</div>
          <div class="wiki-landing-items">${guidesHtml}</div>
        </div>
        ${catHtml('tools', m.wiki.tools)}
      </div>
    </div>`;
}

async function renderPage(page) {
  const el = mount();
  try {
    const res = await fetch('/wiki/' + page.file);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const md   = await res.text();
    const body = md.replace(/^#\s+.+\n/, '');
    el.innerHTML = `
      <div class="wiki-section">
        <div class="page-header">
          <div class="breadcrumb">
            <a href="/">home</a><span class="breadcrumb-sep">/</span>
            <a href="/wiki">wiki</a><span class="breadcrumb-sep">/</span>
            <span>${esc(page.title)}</span>
          </div>
          <h1>${esc(page.title)}</h1>
        </div>
        <div class="content-body">
          <div class="content-block md-body">${rebaseImages(marked.parse(body), page.file.replace(/\/[^/]+$/, ''))}</div>
        </div>
      </div>`;
  } catch (err) { el.innerHTML = errBox(err.message); }
}

async function renderGuideSingle(guide) {
  const el = mount();
  try {
    const res = await fetch('/wiki/' + guide.file);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const md   = await res.text();
    const body = md.replace(/^#\s+.+\n/, '');
    el.innerHTML = `
      <div class="wiki-section">
        <div class="page-header">
          <div class="breadcrumb">
            <a href="/">home</a><span class="breadcrumb-sep">/</span>
            <a href="/wiki">wiki</a><span class="breadcrumb-sep">/</span>
            <span>${esc(guide.title)}</span>
          </div>
          <h1>${esc(guide.title)}</h1>
        </div>
        <div class="content-body">
          <div class="content-block md-body">${rebaseImages(marked.parse(body), guide.file.replace(/\/[^/]+$/, ''))}</div>
        </div>
      </div>`;
  } catch (err) { el.innerHTML = errBox(err.message); }
}

async function renderGuideStep(guide, stepIdx) {
  const el   = mount();
  const step = guide.steps[stepIdx];

  const pips = guide.steps.map((s, i) => `
    <a href="/wiki/${guide.id}/${slugify(s.title)}" class="stepper-pip ${i === stepIdx ? 'active' : i < stepIdx ? 'done' : ''}">
      <div class="stepper-num">${i < stepIdx ? '✓' : i + 1}</div>
      <div class="stepper-label">${esc(s.title)}</div>
    </a>${i < guide.steps.length - 1 ? '<div class="stepper-line"></div>' : ''}`
  ).join('');

  const prev = stepIdx > 0
    ? `<a href="/wiki/${guide.id}/${slugify(guide.steps[stepIdx-1].title)}" class="btn btn-ghost btn-sm">← ${esc(guide.steps[stepIdx-1].title)}</a>`
    : '';
  const next = stepIdx < guide.steps.length - 1
    ? `<a href="/wiki/${guide.id}/${slugify(guide.steps[stepIdx+1].title)}" class="btn btn-primary btn-sm">${esc(guide.steps[stepIdx+1].title)} →</a>`
    : '<span class="btn btn-ghost btn-sm" style="opacity:0.4;cursor:default;">done ✓</span>';

  try {
    const res = await fetch('/wiki/' + step.file);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const md   = await res.text();
    const body = md.replace(/^#\s+.+\n/, '');
    el.innerHTML = `
      <div class="wiki-section guide-page">
        <div class="page-header">
          <div class="breadcrumb">
            <a href="/">home</a><span class="breadcrumb-sep">/</span>
            <a href="/wiki">wiki</a><span class="breadcrumb-sep">/</span>
            <span>${esc(guide.title)}</span><span class="breadcrumb-sep">/</span>
            <span>${esc(step.title)}</span>
          </div>
          <h1>${esc(step.title)}</h1>
          <p class="page-sub">Step ${stepIdx + 1} of ${guide.steps.length} — ${esc(guide.title)}</p>
        </div>
        <div class="content-body">
          <div class="stepper">${pips}</div>
          <div class="content-block md-body">${rebaseImages(marked.parse(body), step.file.replace(/\/[^/]+$/, ''))}</div>
          <div class="stepper-nav stepper-nav--bottom">${prev}${next}</div>
        </div>
      </div>`;
  } catch (err) { el.innerHTML = errBox(err.message); }
}

/* ── Intercept same-origin wiki link clicks ──────────────── */
document.addEventListener('click', e => {
  const a = e.target.closest('a');
  if (!a) return;
  const href = a.getAttribute('href');
  if (!href || !href.startsWith('/wiki')) return;
  e.preventDefault();
  navigate(href);
});

window.addEventListener('popstate', () => navigate(location.pathname, false));

/* ── Mobile sidebar toggle ───────────────────────────────── */
document.getElementById('nav-toggle')?.addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('open');
});
document.getElementById('sidebar-overlay')?.addEventListener('click', () => {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('open');
});

/* ── Init ────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  // Handle 404 redirect
  const redirect = sessionStorage.getItem('spa-redirect');
  if (redirect) {
    sessionStorage.removeItem('spa-redirect');
    await navigate(redirect, true);
    return;
  }
  await navigate(location.pathname, false);
});