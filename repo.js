// ── State ────────────────────────────────────────────────
const REPOS = {
pkgs: {
    label: 'pkgs',
    primaryUrl: 'pkgs/x86_64/repodata/primary.xml.gz',
    releaseBase: 'https://github.com/zodium-project/pkgs-zodium/releases/download/pkgs-rpm/',
},
kmods: {
    label: 'kmods',
    primaryUrl: 'kmods/x86_64/repodata/primary.xml.gz',
    releaseBase: null, // dynamic per kernel version
},
};

let activeRepo = 'pkgs';
const cache = {};

// ── Switch repo tab ──────────────────────────────────────
function switchRepo(repo) {
activeRepo = repo;
document.querySelectorAll('.repo-tab').forEach(t => t.classList.remove('active'));
document.getElementById('tab-' + repo).classList.add('active');
document.getElementById('search-input').value = '';
loadRepo(repo);
}

// ── Load & parse repodata ────────────────────────────────
async function loadRepo(repo) {
const list = document.getElementById('pkg-list');

if (cache[repo]) {
    updateStats(repo, cache[repo]);
    renderPackages();
    return;
}

list.innerHTML = `<div class="state-box"><div class="spinner"></div><span>loading ${repo} packages...</span></div>`;

try {
    // Step 1 — fetch repomd.xml to find actual primary filename
    const repomdUrl = REPOS[repo].primaryUrl.replace('primary.xml.gz', 'repomd.xml');
    const repomdRes = await fetch(repomdUrl);
    if (!repomdRes.ok) throw new Error('HTTP ' + repomdRes.status);
    const repomdText = await repomdRes.text();
    const repomdDoc = new DOMParser().parseFromString(repomdText, 'application/xml');
    const primaryEl = [...repomdDoc.querySelectorAll('data')].find(el => el.getAttribute('type') === 'primary');
    const primaryHref = primaryEl?.querySelector('location')?.getAttribute('href');
    if (!primaryHref) throw new Error('primary not found in repomd.xml');

    // Step 2 — fetch the actual primary.xml.gz using its real checksummed filename
    const baseUrl = REPOS[repo].primaryUrl.replace('primary.xml.gz', '');
    const primaryFilename = primaryHref.split('/').pop();
    const res = await fetch(baseUrl + primaryFilename);
    if (!res.ok) throw new Error('HTTP ' + res.status);

    const buf = await res.arrayBuffer();
    const xml = await decompressGz(buf);
    const pkgs = parseXml(xml, repo);

    cache[repo] = pkgs;
    document.getElementById('count-' + repo).textContent = pkgs.length;
    updateStats(repo, pkgs);
    renderPackages();
} catch (err) {
    list.innerHTML = `
    <div class="state-box">
<svg width="28" height="28" viewBox="0 0 24 24" fill="none">
<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
<path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
</svg>
<span>failed to load packages</span>
<p>could not fetch repodata — ${err.message}</p>
    </div>`;
}
}

// ── Decompress gzip ──────────────────────────────────────
async function decompressGz(buf) {
const ds = new DecompressionStream('gzip');
const writer = ds.writable.getWriter();
writer.write(new Uint8Array(buf));
writer.close();
const chunks = [];
const reader = ds.readable.getReader();
while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
}
const total = chunks.reduce((s, c) => s + c.length, 0);
const out = new Uint8Array(total);
let offset = 0;
for (const c of chunks) { out.set(c, offset); offset += c.length; }
return new TextDecoder().decode(out);
}

// ── Parse primary.xml ────────────────────────────────────
function parseXml(xml, repo) {
const parser = new DOMParser();
const doc = parser.parseFromString(xml, 'application/xml');
const pkgEls = doc.querySelectorAll('package[type="rpm"]');
const pkgs = [];

pkgEls.forEach(el => {
    const name    = el.querySelector('name')?.textContent || '';
    const arch    = el.querySelector('arch')?.textContent || '';
    const ver     = el.querySelector('version');
    const version = ver ? `${ver.getAttribute('ver')}-${ver.getAttribute('rel')}` : '';
    const epoch   = ver ? (ver.getAttribute('epoch') || '0') : '0';
    const summary = el.querySelector('summary')?.textContent || '';
    const size    = el.querySelector('size')?.getAttribute('package') || '0';
    const loc     = el.querySelector('location')?.getAttribute('href') || '';
    const time    = el.querySelector('time')?.getAttribute('file') || '';

    // Build download URL
    let dlUrl = '#';
    if (REPOS[repo].releaseBase) {
    dlUrl = REPOS[repo].releaseBase + loc.split('/').pop();
    } else {
    // kmods: release tag is kernel-{version-arch} built from the package version/arch
    const filename = loc.split('/').pop();
    dlUrl = `https://github.com/zodium-project/kmods-zodium/releases/latest/download/${filename}`;
    }

    pkgs.push({ name, arch, version, epoch, summary, size: parseInt(size), loc, dlUrl, time: parseInt(time) });
});

return pkgs.sort((a, b) => a.name.localeCompare(b.name));
}

// ── Update stats ─────────────────────────────────────────
function updateStats(repo, pkgs) {
document.getElementById('stat-total').textContent = pkgs.length;
document.getElementById('stat-repo').textContent = 'zodium-' + repo;

// Use newest file time as "last updated"
const newest = pkgs.reduce((max, p) => p.time > max ? p.time : max, 0);
if (newest) {
    const d = new Date(newest * 1000);
    document.getElementById('stat-updated').textContent =
    d.toISOString().slice(0, 10);
} else {
    document.getElementById('stat-updated').textContent = '—';
}
}

// ── Render packages ──────────────────────────────────────
function renderPackages() {
const list  = document.getElementById('pkg-list');
const query = document.getElementById('search-input').value.toLowerCase().trim();
const sort  = document.getElementById('sort-select').value;
const pkgs  = cache[activeRepo];

if (!pkgs) return;

let filtered = pkgs.filter(p =>
    p.name.toLowerCase().includes(query) ||
    p.summary.toLowerCase().includes(query)
);

if (sort === 'size')    filtered.sort((a, b) => b.size - a.size);
if (sort === 'name')    filtered.sort((a, b) => a.name.localeCompare(b.name));
if (sort === 'version') filtered.sort((a, b) => a.version.localeCompare(b.version));

if (filtered.length === 0) {
    list.innerHTML = `
    <div class="state-box">
<svg width="28" height="28" viewBox="0 0 24 24" fill="none">
<circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="1.5"/>
<path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
</svg>
<span>no packages found</span>
<p>no results for "<strong>${query}</strong>"</p>
    </div>`;
    return;
}

list.innerHTML = filtered.map((p, i) => {
    const archClass = p.arch === 'noarch' ? 'arch-noarch' :
    p.arch.includes('86') ? 'arch-x86' : '';
    const sizeFmt = formatSize(p.size);

    return `
    <div class="pkg-card" style="animation-delay:${Math.min(i * 18, 300)}ms">
<div class="pkg-main">
<div class="pkg-name-row">
    <span class="pkg-name">${escHtml(p.name)}</span>
    <span class="pkg-arch ${archClass}">${escHtml(p.arch)}</span>
</div>
${p.summary ? `<div class="pkg-summary">${escHtml(p.summary)}</div>` : ''}
<div class="pkg-meta">
    <span class="pkg-meta-item">
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
<circle cx="6" cy="6" r="5" stroke="currentColor" stroke-width="1.2"/>
<path d="M6 3.5v2.5l1.5 1.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
    </svg>
    ${escHtml(p.version)}
    </span>
    ${sizeFmt ? `<span class="pkg-meta-item">
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
<path d="M2 10h8M6 2v6M3.5 5.5L6 8l2.5-2.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    ${sizeFmt}
    </span>` : ''}
</div>
</div>
<div class="pkg-right">
${p.dlUrl !== '#' ? `
    <a class="pkg-dl-btn" href="${p.dlUrl}" target="_blank" rel="noopener">
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
<path d="M6 2v6M3.5 5.5L6 8l2.5-2.5M2 10h8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    .rpm
    </a>` : ''}
</div>
    </div>`;
}).join('');
}

// ── Helpers ──────────────────────────────────────────────
function formatSize(bytes) {
if (!bytes) return '';
if (bytes > 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
if (bytes > 1024) return (bytes / 1024).toFixed(0) + ' KB';
return bytes + ' B';
}

function escHtml(s) {
return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Boot ─────────────────────────────────────────────────
loadRepo('pkgs');