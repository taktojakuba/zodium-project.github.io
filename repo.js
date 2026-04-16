                const REPOS = {
                pkgs:  { releaseBase: 'https://github.com/zodium-project/pkgs-zodium/releases/download/pkgs-rpm/' },
                kmods: { releaseBase: null },
                };

                let activeRepo = 'pkgs';
                const cache = {};

                const $ = id => document.getElementById(id);

                function switchRepo(repo) {
                activeRepo = repo;
                
                const tab = $('tab-' + repo);
                const search = $('search-input');

                document.querySelectorAll('.repo-tab').forEach(t => t.classList.remove('active'));
                
                if (tab) tab.classList.add('active');
                if (search) search.value = ''; // Check if search exists before setting value
                
                loadRepo(repo);
                }

                // ── Load & parse repodata ────────────────────────────────
                async function loadRepo(repo) {
                const list = $('pkg-list');
                if (cache[repo]) { updateStats(repo, cache[repo]); renderPackages(); return; }

                list.innerHTML = `<div class="state-box"><div class="spinner"></div><span>loading ${repo} packages…</span></div>`;

                try {
                    const base = `repo/${repo}/x86_64/repodata/`;

                    // Step 1: find real primary filename from repomd.xml
                    const repomdRes = await fetch(base + 'repomd.xml');
                    if (!repomdRes.ok) throw new Error('HTTP ' + repomdRes.status);
                    const repomdDoc = new DOMParser().parseFromString(await repomdRes.text(), 'application/xml');
                    const primaryHref = [...repomdDoc.querySelectorAll('data')]
                    .find(el => el.getAttribute('type') === 'primary')
                    ?.querySelector('location')?.getAttribute('href');
                    if (!primaryHref) throw new Error('primary not found in repomd.xml');

                    // Step 2: fetch & decompress primary.xml.gz
                    const res = await fetch(base + primaryHref.split('/').pop());
                    if (!res.ok) throw new Error('HTTP ' + res.status);
                    const xml = await decompressGz(await res.arrayBuffer());

                    cache[repo] = parseXml(xml, repo);
                    $('count-' + repo).textContent = cache[repo].length;
                    updateStats(repo, cache[repo]);
                    renderPackages();
                } catch (err) {
                    list.innerHTML = stateBox(`failed to load packages`, `could not fetch repodata — ${err.message}`, errorIcon);
                }
                }

                // ── Decompress gzip ──────────────────────────────────────
                async function decompressGz(buf) {
                const ds = new DecompressionStream('gzip');
                const writer = ds.writable.getWriter();
                writer.write(new Uint8Array(buf));
                writer.close();
                const chunks = [];
                for (const reader = ds.readable.getReader();;) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    chunks.push(value);
                }
                const out = new Uint8Array(chunks.reduce((s, c) => s + c.length, 0));
                let off = 0;
                for (const c of chunks) { out.set(c, off); off += c.length; }
                return new TextDecoder().decode(out);
                }

                // ── Parse primary.xml ────────────────────────────────────
                function parseXml(xml, repo) {
                const doc = new DOMParser().parseFromString(xml, 'application/xml');
                return [...doc.querySelectorAll('package[type="rpm"]')].map(el => {
                    const ver  = el.querySelector('version');
                    const loc  = el.querySelector('location')?.getAttribute('href') || '';
                    const file = loc.split('/').pop();
                    const base = REPOS[repo].releaseBase;
                    return {
                    name:    el.querySelector('name')?.textContent    || '',
                    arch:    el.querySelector('arch')?.textContent    || '',
                    version: ver ? `${ver.getAttribute('ver')}-${ver.getAttribute('rel')}` : '',
                    summary: el.querySelector('summary')?.textContent || '',
                    size:    parseInt(el.querySelector('size')?.getAttribute('package') || 0),
                    time:    parseInt(el.querySelector('time')?.getAttribute('file')    || 0),
                    dlUrl:   base
                        ? base + file
                        : `https://github.com/zodium-project/kmods-zodium/releases/latest/download/${file}`,
                    };
                }).sort((a, b) => a.name.localeCompare(b.name));
                }

                // ── Stats ────────────────────────────────────────────────
                function updateStats(repo, pkgs) {
                $('stat-total').textContent   = pkgs.length;
                $('stat-repo').textContent    = 'zodium-' + repo;
                const newest = pkgs.reduce((m, p) => p.time > m ? p.time : m, 0);
                $('stat-updated').textContent = newest ? new Date(newest * 1000).toISOString().slice(0, 10) : '—';
                }

                // ── Render ───────────────────────────────────────────────
                function renderPackages() {
                const list  = $('pkg-list');
                const query = $('search-input').value.toLowerCase().trim();
                const sort  = $('sort-select')//.value;
                const pkgs  = cache[activeRepo];
                if (!pkgs) return;

                let out = pkgs.filter(p =>
                    p.name.toLowerCase().includes(query) || p.summary.toLowerCase().includes(query)
                );

                const sorters = { size: (a,b) => b.size - a.size, name: (a,b) => a.name.localeCompare(b.name), version: (a,b) => a.version.localeCompare(b.version) };
                if (sorters[sort]) out.sort(sorters[sort]);

                if (!out.length) {
                    list.innerHTML = stateBox('no packages found', `no results for "<strong>${query}</strong>"`, searchIcon);
                    return;
                }

                list.innerHTML = out.map((p, i) => `
                    <div class="pkg-card" style="animation-delay:${Math.min(i*18,300)}ms">
                    <div class="pkg-main">
                        <div class="pkg-name-row">
                        <span class="pkg-name">${esc(p.name)}</span>
                        <span class="pkg-arch ${p.arch==='noarch'?'arch-noarch':p.arch.includes('86')?'arch-x86':''}">${esc(p.arch)}</span>
                        </div>
                        ${p.summary ? `<div class="pkg-summary">${esc(p.summary)}</div>` : ''}
                        <div class="pkg-meta">
                        <span class="pkg-meta-item">${clockIcon} ${esc(p.version)}</span>
                        ${p.size ? `<span class="pkg-meta-item">${dlIcon} ${fmtSize(p.size)}</span>` : ''}
                        </div>
                    </div>
                    ${p.dlUrl ? `<a class="pkg-dl-btn" href="${p.dlUrl}" target="_blank" rel="noopener">${dlIcon} .rpm</a>` : ''}
                    </div>`).join('');
                }

                // ── Helpers ──────────────────────────────────────────────
                const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
                const fmtSize = b => !b ? '' : b > 1048576 ? (b/1048576).toFixed(1)+' MB' : b > 1024 ? (b/1024).toFixed(0)+' KB' : b+' B';
                const stateBox = (title, msg, icon) => `<div class="state-box">${icon}<span>${title}</span><p>${msg}</p></div>`;

                // SVG icons as constants to avoid repetition in templates
                const errorIcon  = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/><path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;
                const searchIcon = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="1.5"/><path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;
                const clockIcon  = `<svg width="11" height="11" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="currentColor" stroke-width="1.2"/><path d="M6 3.5v2.5l1.5 1.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>`;
                const dlIcon     = `<svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M6 2v6M3.5 5.5L6 8l2.5-2.5M2 10h8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

                // ── Boot ─────────────────────────────────────────────────
                loadRepo('pkgs');            
