/* Chief Future Officer — Frontend Logic */

const API = '';   // same origin

// ── Mobile Sidebar ────────────────────────────────────────────────────────────

function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebar-overlay').style.display = 'block';
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').style.display = 'none';
}

// ── Navigation ────────────────────────────────────────────────────────────────

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('screen-' + id).classList.add('active');
  document.getElementById('nav-' + id).classList.add('active');
  closeSidebar();
  document.getElementById('topbar-title').textContent = {
    dashboard: 'Dashboard',
    history:   'Company History',
    research:  'AI Research',
    recommend: 'Strategic Recommendations',
    tasks:     'Strategic Tasks',
    logs:      'Execution Logs',
  }[id] || id;

  if (id === 'history')   loadHistory();
  if (id === 'logs')      loadLogs();
  if (id === 'dashboard') loadDashboardHistory();
  if (id === 'tasks')     loadTasks();
}

// ── API helpers ───────────────────────────────────────────────────────────────

async function apiFetch(path, opts = {}) {
  const res = await fetch(API + path, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Request failed');
  }
  return res.json();
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

async function loadDashboardHistory() {
  try {
    const data = await apiFetch('/api/history');
    document.getElementById('dash-customers').textContent = data.metrics?.team_size || '40+';
    document.getElementById('dash-growth').textContent    = data.metrics?.modules_built || '70+';
    document.getElementById('dash-nps').textContent       = data.metrics?.industries_served || '10+';
    document.getElementById('dash-retention').textContent = 'Enterprise';
  } catch (_) { /* silently ignore on dashboard */ }
}

// ── Company History ───────────────────────────────────────────────────────────

async function loadHistory() {
  const el = document.getElementById('history-content');
  el.innerHTML = '<div class="loader visible"><div class="spinner"></div><span>Loading company data…</span></div>';

  try {
    const d = await apiFetch('/api/history');
    let html = '';

    // ── Header card ──
    html += `
      <div class="card">
        <div class="card-header">
          <div class="card-icon purple">🏢</div>
          <div>
            <div class="card-title">${d.company.name}</div>
            <div class="card-subtitle">${d.company.tagline}</div>
          </div>
        </div>
        <p style="color:var(--text-secondary);font-size:13px;line-height:1.8;">${d.description}</p>
        <div class="two-col mt-16">
          <div>
            <div class="stat-label">Mission</div>
            <div style="font-size:13px;color:var(--text-secondary);line-height:1.6;">${d.mission}</div>
          </div>
          <div>
            <div class="stat-label">Vision</div>
            <div style="font-size:13px;color:var(--text-secondary);line-height:1.6;">${d.vision}</div>
          </div>
        </div>
        <div class="mt-16">
          <div class="stat-label">Founding Story</div>
          <div style="font-size:13px;color:var(--text-secondary);line-height:1.7;margin-top:6px;">${d.founding_story}</div>
        </div>
      </div>`;

    // ── Key metrics ──
    html += `<div class="dash-grid mt-16">
      <div class="stat-card"><div class="stat-label">Team Size</div><div class="stat-value">${d.metrics.team_size}</div><div class="stat-desc">and growing</div></div>
      <div class="stat-card"><div class="stat-label">Modules Built</div><div class="stat-value">${d.metrics.modules_built}</div><div class="stat-desc">reusable automation modules</div></div>
      <div class="stat-card"><div class="stat-label">Industries Served</div><div class="stat-value">${d.metrics.industries_served}</div><div class="stat-desc">verticals and growing</div></div>
      <div class="stat-card"><div class="stat-label">Current Focus</div><div class="stat-value" style="font-size:16px;margin-top:4px;">Enterprise</div><div class="stat-desc">${d.metrics.customer_focus}</div></div>
    </div>`;

    // ── AutoRocket product ──
    if (d.core_product && d.core_product.name) {
      const caps = (d.core_product.key_capabilities || []).map(c => `<li>${c}</li>`).join('');
      html += `<div class="card mt-16">
        <div class="card-header">
          <div class="card-icon green">🚀</div>
          <div>
            <div class="card-title">${d.core_product.name}</div>
            <div class="card-subtitle">${d.core_product.positioning || ''}</div>
          </div>
        </div>
        <p style="color:var(--text-secondary);font-size:13px;line-height:1.7;margin-bottom:14px;">${d.core_product.description}</p>
        <ul class="product-features">${caps}</ul>
      </div>`;
    }

    // ── Evolution timeline ──
    html += `<div class="card mt-16">
      <div class="card-header">
        <div class="card-icon yellow">📅</div>
        <div class="card-title">Company Evolution</div>
      </div>
      <div class="timeline">`;
    for (const h of (d.history || [])) {
      html += `<div class="timeline-item">
        <div class="timeline-year">${h.phase}</div>
        <div class="timeline-event">${h.description}</div>
      </div>`;
    }
    html += `</div></div>`;

    // ── Vision evolution ──
    html += `<div class="card mt-16">
      <div class="card-header">
        <div class="card-icon purple">🎯</div>
        <div class="card-title">Vision Evolution</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:4px;">`;
    for (const v of (d.vision_evolution || [])) {
      const parts = v.split(':');
      const label = parts[0] || v;
      const text  = parts.slice(1).join(':').trim() || '';
      html += `<div style="display:flex;gap:10px;align-items:flex-start;">
        <span style="color:var(--accent);font-weight:700;font-size:11px;white-space:nowrap;padding-top:2px;">${escHtml(label)}</span>
        ${text ? `<span style="font-size:13px;color:var(--text-secondary);">${escHtml(text)}</span>` : ''}
      </div>`;
    }
    html += `</div></div>`;

    // ── Business strategy ──
    html += `<div class="card mt-16">
      <div class="card-header">
        <div class="card-icon blue">⚙️</div>
        <div class="card-title">Business Strategy (How Botivate Works)</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:4px;">`;
    (d.strategy || []).forEach((s, i) => {
      html += `<div style="display:flex;gap:12px;align-items:flex-start;">
        <span style="color:var(--accent);font-weight:700;font-size:13px;min-width:20px;">${i + 1}.</span>
        <span style="font-size:13px;color:var(--text-secondary);">${escHtml(s)}</span>
      </div>`;
    });
    html += `</div></div>`;

    // ── Industries ──
    html += `<div class="card mt-16">
      <div class="card-header">
        <div class="card-icon red">🏭</div>
        <div class="card-title">Industries Served</div>
      </div>
      <div class="opp-grid">`;
    for (const ind of (d.industries || [])) {
      html += `<div class="opp-item">${escHtml(ind)}</div>`;
    }
    html += `</div></div>`;

    // ── Key decisions ──
    html += `<div class="card mt-16">
      <div class="card-header">
        <div class="card-icon yellow">💡</div>
        <div class="card-title">Key Strategic Decisions</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;margin-top:4px;">`;
    for (const dec of (d.key_decisions || [])) {
      const parts = dec.split(':');
      html += `<div style="display:flex;gap:10px;align-items:flex-start;">
        <span style="color:var(--accent2);flex-shrink:0;font-weight:700;">▸</span>
        <div>
          <span style="font-size:13px;font-weight:600;color:var(--text-primary);">${escHtml(parts[0] || dec)}</span>
          ${parts[1] ? `<span style="font-size:13px;color:var(--text-secondary);">: ${escHtml(parts.slice(1).join(':').trim())}</span>` : ''}
        </div>
      </div>`;
    }
    html += `</div></div>`;

    // ── Lessons learned ──
    html += `<div class="card mt-16">
      <div class="card-header">
        <div class="card-icon green">📚</div>
        <div class="card-title">Key Lessons Learned</div>
      </div>
      <div class="opp-grid">`;
    for (const l of (d.lessons || [])) {
      html += `<div class="opp-item">${escHtml(l)}</div>`;
    }
    html += `</div></div>`;

    // ── Future vision ──
    if (d.future_vision && d.future_vision.roadmap) {
      html += `<div class="card mt-16">
        <div class="card-header">
          <div class="card-icon purple">🔭</div>
          <div>
            <div class="card-title">Future Vision</div>
            <div class="card-subtitle">${escHtml(d.future_vision.ultimate_goal || '')}</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;flex-wrap:wrap;gap:8px;margin-top:8px;">`;
      d.future_vision.roadmap.forEach((step, i) => {
        html += `<div style="background:var(--bg-elevated);border:1px solid var(--border);border-radius:8px;padding:8px 14px;font-size:12px;color:var(--text-secondary);">${escHtml(step)}</div>`;
        if (i < d.future_vision.roadmap.length - 1) {
          html += `<div style="color:var(--accent);font-size:16px;">→</div>`;
        }
      });
      html += `</div></div>`;
    }

    el.innerHTML = html;
  } catch (e) {
    el.innerHTML = `<div class="card"><p style="color:var(--accent3)">Error: ${e.message}</p></div>`;
  }
}

// ── Research ──────────────────────────────────────────────────────────────────

function fillResearch(q) {
  document.getElementById('research-input').value = q;
}

async function runResearch() {
  const q = document.getElementById('research-input').value.trim();
  if (!q) { alert('Please enter a research question.'); return; }

  const btn = document.getElementById('research-btn');
  const loader = document.getElementById('research-loader');
  const result = document.getElementById('research-result');

  btn.disabled = true;
  loader.classList.add('visible');
  result.style.display = 'none';

  const steps = loader.querySelectorAll('.loader-step');
  let stepIdx = 0;
  const stepTimer = setInterval(() => {
    if (stepIdx < steps.length) {
      if (stepIdx > 0) steps[stepIdx - 1].classList.replace('active', 'done');
      steps[stepIdx].classList.add('active');
      stepIdx++;
    }
  }, 2500);

  try {
    const data = await apiFetch('/api/research', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: q }),
    });

    clearInterval(stepTimer);
    steps.forEach(s => { s.classList.remove('active'); s.classList.add('done'); });

    renderResearchResult(data, result);
    result.style.display = 'block';
  } catch (e) {
    clearInterval(stepTimer);
    result.innerHTML = `<div class="result-panel"><div class="result-body"><p style="color:var(--accent3)">Error: ${e.message}</p></div></div>`;
    result.style.display = 'block';
  } finally {
    btn.disabled = false;
    loader.classList.remove('visible');
    steps.forEach(s => { s.classList.remove('active', 'done'); });
  }
}

function renderResearchResult(data, container) {
  const analysisHtml = renderAnalysis(data.analysis);
  const sourcesHtml  = renderSources(data.sources);
  const tasks = extractTasks(data.analysis, 'research', data.id);

  container.innerHTML = `
    <div class="result-panel">
      <div class="result-header">
        <div class="result-title">🔬 Research Results</div>
        <span style="font-size:11px;color:var(--text-muted)">${new Date(data.created_at).toLocaleString()}</span>
      </div>
      <div class="result-body">
        <div class="analysis-text">${analysisHtml}</div>
        ${sourcesHtml}
        ${renderTaskExtract(tasks, 'research', data.id)}
      </div>
    </div>`;
}

// ── Recommendations ───────────────────────────────────────────────────────────

function fillRecommend(q) {
  document.getElementById('recommend-input').value = q;
}

async function runRecommend() {
  const q = document.getElementById('recommend-input').value.trim();
  if (!q) { alert('Please enter a business goal.'); return; }

  const btn    = document.getElementById('recommend-btn');
  const loader = document.getElementById('recommend-loader');
  const result = document.getElementById('recommend-result');

  btn.disabled = true;
  loader.classList.add('visible');
  result.style.display = 'none';

  const steps = loader.querySelectorAll('.loader-step');
  let stepIdx = 0;
  const stepTimer = setInterval(() => {
    if (stepIdx < steps.length) {
      if (stepIdx > 0) steps[stepIdx - 1].classList.replace('active', 'done');
      steps[stepIdx].classList.add('active');
      stepIdx++;
    }
  }, 2500);

  try {
    const data = await apiFetch('/api/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ business_goal: q }),
    });

    clearInterval(stepTimer);
    steps.forEach(s => { s.classList.remove('active'); s.classList.add('done'); });

    renderRecommendResult(data, result);
    result.style.display = 'block';
  } catch (e) {
    clearInterval(stepTimer);
    result.innerHTML = `<div class="result-panel"><div class="result-body"><p style="color:var(--accent3)">Error: ${e.message}</p></div></div>`;
    result.style.display = 'block';
  } finally {
    btn.disabled = false;
    loader.classList.remove('visible');
    steps.forEach(s => { s.classList.remove('active', 'done'); });
  }
}

function renderRecommendResult(data, container) {
  const priorityClass = 'priority-' + (data.priority || 'medium').toLowerCase();
  const analysisHtml  = renderAnalysis(data.analysis);
  const sourcesHtml   = renderSources(data.sources);
  const tasks = extractTasks(data.analysis, 'recommend', data.id);

  container.innerHTML = `
    <div class="result-panel">
      <div class="result-header">
        <div class="result-title">🧭 Strategic Recommendation</div>
        <span style="font-size:11px;color:var(--text-muted)">${new Date(data.created_at).toLocaleString()}</span>
      </div>
      <div class="result-body">
        <div class="meta-row">
          <div class="meta-badge ${priorityClass}">🔥 Priority: ${data.priority || 'High'}</div>
          <div class="meta-badge confidence">🎯 Confidence: ${data.confidence || 75}%</div>
        </div>
        <div class="analysis-text">${analysisHtml}</div>
        ${sourcesHtml}
        ${renderTaskExtract(tasks, 'recommend', data.id)}
      </div>
    </div>`;
}

// ── Render helpers ─────────────────────────────────────────────────────────────

function renderAnalysis(text) {
  if (!text) return '<em style="color:var(--text-muted)">No analysis available.</em>';

  // Pre-process: collect table blocks first, render line-by-line for the rest
  const lines = text.split('\n');
  let html = '';
  let i = 0;

  while (i < lines.length) {
    const t = lines[i].trim();

    // ── Table detection: line starts and ends with | ──────────────────────────
    if (t.startsWith('|') && t.endsWith('|')) {
      // Collect all consecutive table lines
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }
      html += renderTable(tableLines);
      continue;
    }

    i++;
    if (!t) { html += '<div style="height:8px;"></div>'; continue; }

    // ### Heading 3 — color-coded by keyword
    if (t.startsWith('### ')) {
      const content = t.slice(4);
      const color = sectionColor(content);
      html += `<div style="font-size:13.5px;font-weight:700;color:${color};margin:18px 0 6px;display:flex;align-items:center;gap:8px;">
        <span style="width:3px;height:14px;background:${color};border-radius:2px;display:inline-block;flex-shrink:0;"></span>
        ${mdInline(content)}</div>`;
      continue;
    }
    // ## Heading 2
    if (t.startsWith('## ')) {
      html += `<div style="font-size:15px;font-weight:800;color:var(--white-full);margin:20px 0 8px;letter-spacing:-0.2px;">${mdInline(t.slice(3))}</div>`;
      continue;
    }
    // # Heading 1
    if (t.startsWith('# ')) {
      html += `<div style="font-size:17px;font-weight:900;color:var(--white-full);margin:22px 0 10px;letter-spacing:-0.4px;">${mdInline(t.slice(2))}</div>`;
      continue;
    }
    // ALL CAPS section title (OPPORTUNITIES:, THREATS:, etc.) — color coded
    if (/^[A-Z][A-Z\s\/]{2,}:/.test(t)) {
      const label = t.replace(/:.*/, '').trim();
      const color = sectionColor(label);
      const rest  = t.replace(/^[A-Z][A-Z\s\/]+:\s*/, '');
      html += `<div style="display:flex;align-items:center;gap:8px;margin:18px 0 8px;">
        <span style="width:3px;height:16px;background:${color};border-radius:2px;flex-shrink:0;"></span>
        <span style="font-size:10.5px;font-weight:800;color:${color};text-transform:uppercase;letter-spacing:1.2px;">${label}</span>
      </div>`;
      if (rest) html += `<div style="margin-bottom:6px;color:var(--text-secondary);font-size:13px;">${mdInline(rest)}</div>`;
      continue;
    }
    // Bullet: -, *, •
    if (t.startsWith('- ') || t.startsWith('* ') || t.startsWith('• ')) {
      html += `<div class="bullet">${mdInline(t.slice(2))}</div>`;
      continue;
    }
    // Numbered list
    if (/^\d+\.\s/.test(t)) {
      const num     = t.match(/^(\d+)\.\s/)[1];
      const content = t.replace(/^\d+\.\s/, '');
      html += `<div style="display:flex;gap:10px;margin-bottom:5px;align-items:flex-start;">
        <span style="background:var(--blue-dim);color:var(--blue);font-weight:700;font-size:11px;
          min-width:22px;height:22px;border-radius:50%;display:flex;align-items:center;
          justify-content:center;flex-shrink:0;margin-top:1px;">${num}</span>
        <span style="color:var(--text-secondary);font-size:13px;line-height:1.7;">${mdInline(content)}</span>
      </div>`;
      continue;
    }
    // QUESTION: label from daily brief
    if (t.startsWith('QUESTION:')) {
      html += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <span class="pill pill-blue">📋 Question</span>
      </div>
      <div style="font-size:13px;color:var(--white-60);margin-bottom:14px;font-style:italic;">${mdInline(t.slice(9).trim())}</div>`;
      continue;
    }
    // Horizontal rule
    if (t === '---' || t === '***') {
      html += `<hr style="border:none;border-top:1px solid var(--border-light);margin:16px 0;opacity:0.5;">`;
      continue;
    }
    // Normal paragraph
    html += `<div style="display:block;margin-bottom:5px;color:var(--text-secondary);font-size:13px;line-height:1.85;">${mdInline(t)}</div>`;
  }

  return html;
}

function renderTable(tableLines) {
  if (tableLines.length < 2) return '';

  // Parse cells from a pipe-delimited row
  const parseCells = row => row.replace(/^\||\|$/g, '').split('|').map(c => c.trim());

  const headerCells = parseCells(tableLines[0]);
  // Second row is separator (---, :---:, etc.) — skip it
  const dataStart = tableLines.length > 1 && /^\|[\s\-\|:]+\|$/.test(tableLines[1]) ? 2 : 1;
  const dataRows = tableLines.slice(dataStart).map(parseCells);

  const thHtml = headerCells.map(h =>
    `<th style="padding:9px 14px;text-align:left;font-size:11px;font-weight:700;
      color:var(--blue);text-transform:uppercase;letter-spacing:0.8px;
      border-bottom:1px solid var(--border);white-space:nowrap;">${mdInline(h)}</th>`
  ).join('');

  const tbodyHtml = dataRows.map((cells, ri) => {
    const bg = ri % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-elevated)';
    const tdHtml = cells.map((c, ci) => {
      const isFirst = ci === 0;
      const style = isFirst
        ? 'padding:9px 14px;font-size:12.5px;font-weight:600;color:var(--white-full);border-bottom:1px solid var(--border);'
        : 'padding:9px 14px;font-size:12px;color:var(--text-secondary);border-bottom:1px solid var(--border);line-height:1.5;';
      return `<td style="${style}">${mdInline(c)}</td>`;
    }).join('');
    return `<tr style="background:${bg};">${tdHtml}</tr>`;
  }).join('');

  return `<div style="overflow-x:auto;margin:12px 0 16px;border-radius:10px;border:1px solid var(--border);">
    <table style="width:100%;border-collapse:collapse;font-family:inherit;">
      <thead style="background:var(--bg-elevated);">
        <tr>${thHtml}</tr>
      </thead>
      <tbody>${tbodyHtml}</tbody>
    </table>
  </div>`;
}

/* Map section keyword → color variable string */
function sectionColor(text) {
  const t = text.toUpperCase();
  if (/OPPORTUNIT|GROWTH|SUCCESS|STRENGTH|POSITIVE|WHAT THIS MEANS/.test(t)) return 'var(--teal)';
  if (/THREAT|RISK|DANGER|CHALLENGE|WEAKNESS|WATCH/.test(t))                  return 'var(--red)';
  if (/PRIORITY|CAUTION|MEDIUM|CONSIDER|ROADMAP|RECOMMENDED|NEXT STEP/.test(t)) return 'var(--amber)';
  if (/INSIGHT|STRATEGIC|TREND|TECHNOLOGY|COMPETI/.test(t))                   return 'var(--violet)';
  if (/SUMMARY|EXECUTIVE|FINDING|KEY|CONCLUSION|RECOMMEND/.test(t))           return 'var(--blue)';
  return 'var(--blue)';
}

function mdInline(text) {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:var(--white-full);font-weight:700;">$1</strong>')
    .replace(/\*(.+?)\*/g,     '<em style="color:var(--white-60);">$1</em>')
    .replace(/`(.+?)`/g,       '<code style="background:var(--blue-dim);color:var(--blue);padding:1px 6px;border-radius:4px;font-size:11.5px;font-weight:600;">$1</code>');
}

function renderSources(sources) {
  if (!sources || sources.length === 0) return '';
  const chips = sources
    .filter(s => s.url)
    .map(s => `<a class="source-chip" href="${s.url}" target="_blank" rel="noopener">
      <span>🔗</span><span>${s.title || s.url}</span>
    </a>`)
    .join('');
  if (!chips) return '';
  return `<div style="margin-top:16px">
    <div class="stat-label mb-4">Sources</div>
    <div class="sources-list">${chips}</div>
  </div>`;
}

// ── Logs ──────────────────────────────────────────────────────────────────────

async function loadLogs() {
  const el = document.getElementById('logs-content');
  el.innerHTML = '<div class="loader visible"><div class="spinner"></div><span>Loading logs…</span></div>';

  try {
    const data = await apiFetch('/api/logs');
    if (!data.logs || data.logs.length === 0) {
      el.innerHTML = `<div class="empty-state">
        <div class="empty-icon">📋</div>
        <div class="empty-title">No logs yet</div>
        <div class="empty-desc">Run a research query or get a recommendation first.</div>
      </div>`;
      return;
    }

    const items = data.logs.map(log => {
      const meta = log.type === 'recommendation'
        ? `Priority: ${log.priority || '—'} &bull; Confidence: ${log.confidence || '—'}%`
        : 'Research query';
      return `<div class="log-item">
        <div class="log-type-badge ${log.type}">${log.type === 'recommendation' ? 'Recommend' : 'Research'}</div>
        <div class="log-content">
          <div class="log-input">${escHtml(log.input)}</div>
          <div class="log-meta">${meta} &bull; ${new Date(log.created_at).toLocaleString()}</div>
        </div>
      </div>`;
    }).join('');

    el.innerHTML = `<div class="log-list">${items}</div>`;
  } catch (e) {
    el.innerHTML = `<div class="card"><p style="color:var(--accent3)">Error: ${e.message}</p></div>`;
  }
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Daily Brief ───────────────────────────────────────────────────────────────

async function loadDailyBrief() {
  const body   = document.getElementById('daily-brief-body');
  const dateEl = document.getElementById('brief-date');
  body.innerHTML = '<div class="loader visible"><div class="spinner"></div><span>Checking CFO report schedule…</span></div>';

  try {
    const data = await apiFetch('/api/daily-brief');

    // Not yet time to run
    if (!data.analysis) {
      const d = new Date(data.date);
      dateEl.textContent = d.toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
      body.innerHTML = `
        <div style="text-align:center;padding:32px 20px;">
          <div style="font-size:36px;margin-bottom:12px;">⏰</div>
          <div style="font-size:15px;font-weight:700;color:var(--text-primary);margin-bottom:6px;">
            CFO Report Scheduled for ${data.next_run} IST
          </div>
          <div style="font-size:13px;color:var(--text-secondary);margin-bottom:20px;max-width:400px;margin-left:auto;margin-right:auto;line-height:1.7;">
            ${data.message}
          </div>
          <button class="btn btn-primary" onclick="regenerateBrief()">▶ Generate Now</button>
        </div>`;
      return;
    }

    const d = new Date(data.date);
    const modeLabel = data.mode === 'full' ? '14-Point CFO Analysis' : 'Custom Research';
    dateEl.textContent = d.toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' })
      + ` · ${modeLabel}` + (data.cached ? ' · Cached' : ' · Just generated');

    const tasks = extractTasks(data.analysis, 'daily_brief', null);
    body.innerHTML = `<div class="analysis-text">${renderAnalysis(data.analysis)}</div>${renderSources(data.sources)}${renderTaskExtract(tasks, 'daily_brief', null)}`;
  } catch (e) {
    body.innerHTML = `<p style="color:var(--accent3)">Could not load brief: ${e.message}</p>`;
    dateEl.textContent = 'Error';
  }
}

async function regenerateBrief() {
  const body = document.getElementById('daily-brief-body');
  const dateEl = document.getElementById('brief-date');
  body.innerHTML = '<div class="loader visible"><div class="spinner"></div><span>Regenerating brief…</span></div>';
  dateEl.textContent = 'Regenerating…';

  try {
    const data = await apiFetch('/api/daily-brief/regenerate', { method: 'POST' });
    const d = new Date(data.date);
    const modeLabel = data.mode === 'full' ? '14-Point CFO Analysis' : 'Custom Research';
    dateEl.textContent = d.toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' }) + ` · ${modeLabel} · Just regenerated`;
    const tasks = extractTasks(data.analysis, 'daily_brief', null);
    body.innerHTML = `<div class="analysis-text">${renderAnalysis(data.analysis)}</div>${renderSources(data.sources)}${renderTaskExtract(tasks, 'daily_brief', null)}`;
  } catch (e) {
    body.innerHTML = `<p style="color:var(--accent3)">Error: ${e.message}</p>`;
  }
}

// ── Schedule Modal ────────────────────────────────────────────────────────────

let _selectedDays = 'daily';

function selectDay(btn) {
  const day = btn.dataset.day;
  if (day === 'daily') {
    // Deselect all individual days, select "Every Day"
    _selectedDays = 'daily';
    document.querySelectorAll('.day-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  } else {
    // Deselect "Every Day" and toggle individual days
    document.querySelector('.day-btn[data-day="daily"]').classList.remove('active');
    btn.classList.toggle('active');
    const activeDays = [...document.querySelectorAll('.day-btn.active')]
      .map(b => b.dataset.day).filter(d => d !== 'daily');
    _selectedDays = activeDays.length ? activeDays.join(',') : 'daily';
    if (!activeDays.length) {
      document.querySelector('.day-btn[data-day="daily"]').classList.add('active');
    }
  }
}

function toggleModeUI() {
  const isCustom = document.getElementById('mode-custom').checked;
  document.getElementById('sched-custom-section').style.display = isCustom ? 'block' : 'none';
}

async function openScheduleModal() {
  document.getElementById('schedule-modal').style.display = 'flex';
  try {
    const sched = await apiFetch('/api/schedule');
    document.getElementById('sched-time').value = sched.run_time || '08:00';

    // Set run days
    _selectedDays = sched.run_days || 'daily';
    document.querySelectorAll('.day-btn').forEach(b => b.classList.remove('active'));
    if (_selectedDays === 'daily') {
      document.querySelector('.day-btn[data-day="daily"]').classList.add('active');
    } else {
      _selectedDays.split(',').forEach(d => {
        const btn = document.querySelector(`.day-btn[data-day="${d}"]`);
        if (btn) btn.classList.add('active');
      });
    }

    // Set mode
    const mode = sched.mode || 'full';
    document.getElementById(mode === 'full' ? 'mode-full' : 'mode-custom').checked = true;
    toggleModeUI();

    renderSchedQuestions(sched.custom_questions || []);

    // Show last run info
    if (sched.last_run) {
      const lr = new Date(sched.last_run);
      document.getElementById('sched-time').title = `Last run: ${lr.toLocaleString()}`;
    }
  } catch (e) {
    renderSchedQuestions([]);
  }
}

function closeScheduleModal() {
  document.getElementById('schedule-modal').style.display = 'none';
}

function renderSchedQuestions(questions) {
  const container = document.getElementById('sched-questions');
  container.innerHTML = '';
  const qs = questions.length ? questions : [''];
  qs.forEach((q, i) => {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:8px;align-items:center;';
    row.id = `sq-row-${i}`;
    row.innerHTML = `
      <input type="text" value="${escHtml(q)}" placeholder="Enter a research question…" style="flex:1;" id="sq-${i}" />
      <button onclick="removeSchedQuestion(${i})"
        style="background:none;border:none;color:var(--text-muted);font-size:18px;cursor:pointer;flex-shrink:0;line-height:1;">✕</button>`;
    container.appendChild(row);
  });
}

function addSchedQuestion() {
  const container = document.getElementById('sched-questions');
  if (container.children.length >= 10) { alert('Maximum 10 questions allowed.'); return; }
  const i = container.children.length;
  const row = document.createElement('div');
  row.style.cssText = 'display:flex;gap:8px;align-items:center;';
  row.id = `sq-row-${i}`;
  row.innerHTML = `
    <input type="text" value="" placeholder="Enter a research question…" style="flex:1;" id="sq-${i}" />
    <button onclick="removeSchedQuestion(${i})"
      style="background:none;border:none;color:var(--text-muted);font-size:18px;cursor:pointer;flex-shrink:0;line-height:1;">✕</button>`;
  container.appendChild(row);
}

function removeSchedQuestion(i) {
  const row = document.getElementById(`sq-row-${i}`);
  if (row) row.remove();
}

async function saveSchedule() {
  const runTime = document.getElementById('sched-time').value;
  if (!runTime) { alert('Please set a run time.'); return; }

  const mode = document.querySelector('input[name="sched-mode"]:checked')?.value || 'full';
  const custom_questions = [];
  document.querySelectorAll('[id^="sq-"]').forEach(inp => {
    if (inp.tagName === 'INPUT' && inp.value.trim()) custom_questions.push(inp.value.trim());
  });
  if (mode === 'custom' && !custom_questions.length) {
    alert('Add at least one question for custom mode.'); return;
  }

  try {
    const saved = await apiFetch('/api/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ run_time: runTime, run_days: _selectedDays, mode, custom_questions }),
    });
    closeScheduleModal();

    const dayLabel = saved.run_days === 'daily' ? 'every day' : `on days: ${saved.run_days}`;
    const modeLabel = saved.mode === 'full' ? 'Full CFO Analysis (14-point)' : 'Custom Questions';
    alert(`✓ Schedule saved!\n\nTime: ${runTime} IST\nDays: ${dayLabel}\nMode: ${modeLabel}\n\nThe CFO report will auto-generate when you open the dashboard after ${runTime}.`);
  } catch (e) {
    alert('Error saving schedule: ' + e.message);
  }
}

// Close modals on backdrop click
document.addEventListener('click', e => {
  if (e.target === document.getElementById('schedule-modal'))     closeScheduleModal();
  if (e.target === document.getElementById('complete-modal'))     closeCompleteModal();
  if (e.target === document.getElementById('task-detail-modal'))  closeTaskDetailModal();
});

// ── Task Extraction ───────────────────────────────────────────────────────────

// Strip markdown bold/italic/code from plain text
function stripMd(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/^#+\s*/, '')
    .trim();
}

function extractTasks(analysisText, source, sourceId) {
  if (!analysisText) return [];

  const lines = analysisText.split('\n');
  const tasks = [];

  // Track which section we're in for context
  let currentSection = '';
  const ACTION_SECTIONS = /90.DAY|ACTION PLAN|NEXT STEP|ROADMAP|IMMEDIATE|WEEK\s*1|WEEK\s*2|WEEK\s*3|MONTH\s*2|MONTH\s*3|HOW TO SOLVE|INVESTMENT PRIOR|GO.TO.MARKET|DEPARTMENT FOCUS|BUSINESS COACH/i;
  const INFO_SECTIONS   = /EXECUTIVE SUMMARY|GAP ANALYSIS|FUTURE IMPACT|BOTIVATE KA FUTURE|COMPETITOR ANALYSIS|LOCATION INTEL|CLIENT INTEL|NETWORK|NETWORTH|FINANCIAL RECOMMENDATION|PRODUCT IMPROVEMENT|NEXT PRODUCTS/i;

  // Map section name → category label for description
  const sectionCategory = (s) => {
    if (/90.DAY|ACTION PLAN|WEEK|MONTH/.test(s)) return '90-Day Plan';
    if (/ROADMAP/.test(s)) return 'Roadmap';
    if (/INVESTMENT/.test(s)) return 'Investment';
    if (/GO.TO.MARKET|GTM/.test(s)) return 'Go-to-Market';
    if (/BUSINESS COACH/.test(s)) return 'Business Coach';
    if (/DEPARTMENT/.test(s)) return 'Team Focus';
    if (/HOW TO SOLVE/.test(s)) return 'Gap Fix';
    if (/NEXT STEP/.test(s)) return 'Next Steps';
    return 'Strategy';
  };

  let inActionSection = false;

  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (!t) continue;

    // Detect section headers
    if (t.startsWith('##') || t.startsWith('###') || /^[A-Z][A-Z\s\/\-]{3,}:?$/.test(t)) {
      const header = stripMd(t).toUpperCase();
      currentSection = header;
      inActionSection = ACTION_SECTIONS.test(header);
      continue;
    }

    // Only extract from action-oriented sections
    if (!inActionSection) continue;

    const isBullet   = /^[-*•]\s/.test(t);
    const isNumbered = /^\d+[\.\)]\s/.test(t);
    const isWeekLine = /^(Week|Month)\s*[\d\-]+[:\-]/i.test(t);

    if (!isBullet && !isNumbered && !isWeekLine) continue;

    // Clean the raw text
    let raw = t
      .replace(/^[-*•]\s*/, '')
      .replace(/^\d+[\.\)]\s*/, '')
      .replace(/^(Week|Month)\s*[\d\-]+[:\-]\s*/i, '')
      .trim();

    raw = stripMd(raw);

    // Skip if too short, too long, or just metadata
    if (raw.length < 20 || raw.length > 250) continue;
    if (/^\d+[\.,]/.test(raw)) continue; // skip pure numbers
    if (/^(INR|₹|Amount|Expected|Timeline|Owner|Steps|Action|Result)/i.test(raw)) continue;

    // Build clean title: first sentence / up to 80 chars
    let title = raw.split(/[|—–]/)[0].trim(); // stop at pipe or dash separators
    if (title.length > 80) title = title.slice(0, 77) + '…';

    // Build description from remainder or next line context
    let description = '';
    const remainder = raw.slice(title.length).replace(/^[\s|—–]+/, '').trim();
    if (remainder.length > 10) {
      description = stripMd(remainder).slice(0, 120);
    } else if (i + 1 < lines.length) {
      const nextLine = stripMd(lines[i + 1].trim());
      if (nextLine.length > 10 && nextLine.length < 150 && !nextLine.startsWith('#')) {
        description = nextLine.slice(0, 120);
      }
    }

    tasks.push({
      title,
      description,
      priority: inferPriority(raw + ' ' + currentSection),
      category: sectionCategory(currentSection),
    });
  }

  // Deduplicate by title prefix
  const seen = new Set();
  return tasks.filter(t => {
    const key = t.title.slice(0, 50).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 12);
}

function inferPriority(text) {
  const t = text.toLowerCase();
  if (/immediate|urgent|this week|week 1|week 2|asap|critical|day 1|now|must|first/.test(t)) return 'high';
  if (/month 3|long.term|eventually|consider|explore|later|future/.test(t)) return 'low';
  return 'medium';
}

// Global store for task detail modal
let _taskDetailList = [];

function renderTaskExtract(tasks, source, sourceId) {
  if (!tasks || tasks.length === 0) return '';

  // Store globally so modal can access full data
  _taskDetailList = tasks;

  const priorityColor = { high: 'var(--red)', medium: 'var(--amber)', low: 'var(--blue)' };
  const priorityBg    = { high: 'rgba(255,77,106,0.12)', medium: 'rgba(245,158,11,0.12)', low: 'rgba(59,158,255,0.10)' };

  const items = tasks.map((task, i) => {
    const pc = priorityColor[task.priority] || 'var(--blue)';
    const pb = priorityBg[task.priority]    || 'rgba(59,158,255,0.10)';
    const cat = task.category
      ? `<span style="font-size:10px;background:var(--bg-card);border:1px solid var(--border);border-radius:10px;padding:1px 7px;color:var(--text-muted);">${escHtml(task.category)}</span>`
      : '';

    return `<div class="task-extract-item" id="tex-${source}-${sourceId}-${i}">
      <div style="flex-shrink:0;width:6px;height:6px;border-radius:50%;background:${pc};margin-top:7px;"></div>
      <div style="flex:1;min-width:0;cursor:pointer;" onclick="openTaskDetail(${i}, '${source}', ${sourceId || 'null'})">
        <div style="font-size:13px;font-weight:600;color:var(--text-primary);line-height:1.5;
          text-decoration:underline;text-decoration-color:var(--border-light);text-underline-offset:3px;">
          ${escHtml(task.title)}
        </div>
        <div style="display:flex;gap:6px;align-items:center;margin-top:5px;flex-wrap:wrap;">
          ${cat}
          <span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;
            padding:1px 7px;border-radius:10px;background:${pb};color:${pc};">${task.priority}</span>
          <span style="font-size:10px;color:var(--text-muted);">↗ tap for details</span>
        </div>
      </div>
      <button class="btn-add-task" id="btn-tex-${source}-${i}"
        onclick="addTaskFromExtract(${i}, '${source}', ${sourceId || 'null'}, this)"
        title="Add to Tasks">+ Add</button>
    </div>`;
  }).join('');

  const tasksJson = JSON.stringify(tasks).replace(/"/g, '&quot;');

  return `
    <div class="task-extract-box" style="margin-top:24px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;flex-wrap:wrap;">
        <div>
          <div style="font-size:14px;font-weight:700;color:var(--white-full);">✅ Suggested Action Tasks</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">
            ${tasks.length} tasks from this analysis — click title for details, or add directly
          </div>
        </div>
        <button class="btn btn-primary" style="margin-left:auto;font-size:11px;padding:6px 14px;"
          onclick="addAllTasks('${source}', ${sourceId || 'null'}, ${tasksJson})">
          + Add All (${tasks.length})
        </button>
      </div>
      <div style="display:flex;flex-direction:column;gap:2px;">${items}</div>
    </div>`;
}

// ── Task Detail Modal ─────────────────────────────────────────────────────────

let _detailTaskIdx = null;
let _detailSource  = null;
let _detailSourceId = null;

function openTaskDetail(idx, source, sourceId) {
  const task = _taskDetailList[idx];
  if (!task) return;

  _detailTaskIdx  = idx;
  _detailSource   = source;
  _detailSourceId = sourceId;

  const priorityColor = { high: 'var(--red)', medium: 'var(--amber)', low: 'var(--blue)' };
  const priorityBg    = { high: 'rgba(255,77,106,0.15)', medium: 'rgba(245,158,11,0.15)', low: 'rgba(59,158,255,0.12)' };
  const sourceLabel   = { research: '🔬 Research', recommend: '🧭 Recommendation', daily_brief: '☀️ Daily Brief', manual: '✏️ Manual' };
  const pc = priorityColor[task.priority] || 'var(--blue)';
  const pb = priorityBg[task.priority]    || 'rgba(59,158,255,0.12)';

  // What to do — generate actionable steps from the task
  const whatToDo = buildWhatToDo(task);

  document.getElementById('task-detail-title').textContent    = task.title;
  document.getElementById('task-detail-category').textContent = task.category || 'Strategy';
  document.getElementById('task-detail-source').textContent   = sourceLabel[source] || source;
  document.getElementById('task-detail-priority').textContent = task.priority.toUpperCase();
  document.getElementById('task-detail-priority').style.cssText =
    `font-size:11px;font-weight:700;padding:3px 10px;border-radius:10px;background:${pb};color:${pc};text-transform:uppercase;`;
  document.getElementById('task-detail-body').innerHTML = whatToDo;

  // Check if already added
  const addBtn = document.getElementById('task-detail-add-btn');
  const existingBtn = document.getElementById(`btn-tex-${source}-${idx}`);
  if (existingBtn && existingBtn.disabled) {
    addBtn.textContent = '✓ Already Added';
    addBtn.disabled = true;
    addBtn.style.background = 'var(--teal)';
    addBtn.style.color = '#000';
  } else {
    addBtn.textContent = '+ Add to Tasks';
    addBtn.disabled = false;
    addBtn.style.background = '';
    addBtn.style.color = '';
  }

  document.getElementById('task-detail-modal').style.display = 'flex';
}

function buildWhatToDo(task) {
  const lines = [];

  // Main action
  lines.push(`<div style="margin-bottom:14px;">
    <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:6px;">What to Do</div>
    <div style="font-size:13.5px;color:var(--text-primary);line-height:1.7;">${escHtml(task.title)}</div>
  </div>`);

  // Context / description
  if (task.description && task.description.trim()) {
    lines.push(`<div style="margin-bottom:14px;">
      <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:6px;">Context</div>
      <div style="font-size:13px;color:var(--text-secondary);line-height:1.7;">${escHtml(task.description)}</div>
    </div>`);
  }

  // Why it matters — derived from category
  const whyMap = {
    '90-Day Plan':   'This is a time-bound action from the 90-day execution plan. Completing it on schedule keeps Botivate on track for quarterly goals.',
    'Roadmap':       'This action is part of the strategic roadmap. Skipping or delaying it creates downstream blockers for future milestones.',
    'Investment':    'This involves resource allocation. Timely investment decisions directly impact revenue potential and growth rate.',
    'Go-to-Market':  'This is a market-facing action. Every week of delay gives competitors more time to establish presence in that segment.',
    'Business Coach':'This addresses a team or leadership behaviour. Fixing it multiplies the effectiveness of everything else Botivate does.',
    'Team Focus':    'This determines where team energy goes. Misaligned focus is the #1 reason early-stage companies stall.',
    'Gap Fix':       'This closes a known capability or visibility gap. Until fixed, this gap costs Botivate deals, talent, and credibility.',
    'Next Steps':    'This is an immediate next step from the CFO analysis. It should be assigned to a person and given a deadline today.',
    'Strategy':      'This is a strategic recommendation from the AI CFO. Acting on it moves Botivate closer to its growth targets.',
  };
  const why = whyMap[task.category] || whyMap['Strategy'];
  lines.push(`<div style="margin-bottom:14px;">
    <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:6px;">Why It Matters</div>
    <div style="font-size:13px;color:var(--text-secondary);line-height:1.7;">${why}</div>
  </div>`);

  // Suggested owner
  const ownerMap = {
    'Investment':    'Kavit Passary (Business & Finance)',
    'Business Coach':'Satyendra Tandan (Product & Team)',
    'Team Focus':    'Satyendra Tandan (Product & Team)',
    'Go-to-Market':  'Sales / Marketing Lead',
    '90-Day Plan':   'Assign to relevant founder or team lead',
    'Gap Fix':       'Tech Lead or designated owner',
  };
  const owner = ownerMap[task.category] || 'Assign to a founder or team lead';
  lines.push(`<div style="display:flex;gap:24px;flex-wrap:wrap;">
    <div>
      <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:4px;">Suggested Owner</div>
      <div style="font-size:13px;color:var(--text-primary);">${owner}</div>
    </div>
    <div>
      <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:4px;">Priority</div>
      <div style="font-size:13px;color:var(--text-primary);text-transform:capitalize;">${task.priority} — ${task.priority === 'high' ? 'Do this week' : task.priority === 'medium' ? 'Do this month' : 'Plan for next quarter'}</div>
    </div>
  </div>`);

  return lines.join('');
}

function closeTaskDetailModal() {
  document.getElementById('task-detail-modal').style.display = 'none';
  _detailTaskIdx = null;
}

async function addFromDetailModal() {
  if (_detailTaskIdx === null) return;
  const task = _taskDetailList[_detailTaskIdx];
  const btn  = document.getElementById('task-detail-add-btn');
  btn.disabled = true;
  btn.textContent = '…';
  try {
    await apiFetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: task.title,
        description: task.description || '',
        source: _detailSource,
        source_id: _detailSourceId,
        priority: task.priority,
      }),
    });
    btn.textContent = '✓ Added';
    btn.style.background = 'var(--teal)';
    btn.style.color = '#000';
    // Also mark the list button
    const listBtn = document.getElementById(`btn-tex-${_detailSource}-${_detailTaskIdx}`);
    if (listBtn) { listBtn.textContent = '✓'; listBtn.disabled = true; listBtn.style.background = 'var(--teal)'; listBtn.style.color = '#000'; }
  } catch (e) {
    btn.textContent = '+ Add to Tasks';
    btn.disabled = false;
    alert('Error: ' + e.message);
  }
}

async function addTaskFromExtract(idx, source, sourceId, btn) {
  const row = btn.closest('.task-extract-item');
  const titleEl = row.querySelector('div[style*="font-size:13px"]');
  const priorityEl = row.querySelector('.priority-dot');
  const title = titleEl.textContent.trim();
  const priority = priorityEl.textContent.trim();

  btn.disabled = true;
  btn.textContent = '…';
  try {
    await apiFetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, source, source_id: sourceId, priority }),
    });
    btn.textContent = '✓ Added';
    btn.style.background = 'var(--teal)';
    btn.style.color = '#000';
    btn.disabled = true;
  } catch (e) {
    btn.textContent = '+ Add';
    btn.disabled = false;
    alert('Error: ' + e.message);
  }
}

async function addAllTasks(source, sourceId, tasks) {
  for (const task of tasks) {
    try {
      await apiFetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: task.title, source, source_id: sourceId, priority: task.priority }),
      });
    } catch (_) {}
  }
  // Mark all buttons as added
  document.querySelectorAll('.btn-add-task').forEach(btn => {
    btn.textContent = '✓ Added';
    btn.style.background = 'var(--teal)';
    btn.style.color = '#000';
    btn.disabled = true;
  });
  alert(`✓ ${tasks.length} tasks added! Go to Tasks screen to manage them.`);
}

// ── Tasks Screen ──────────────────────────────────────────────────────────────

let _currentTaskTab = 'pending';

function switchTaskTab(tab) {
  _currentTaskTab = tab;
  document.getElementById('tasks-pending-view').style.display = tab === 'pending' ? 'block' : 'none';
  document.getElementById('tasks-done-view').style.display    = tab === 'done' ? 'block' : 'none';
  document.querySelectorAll('.task-tab').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
}

async function loadTasks() {
  const pendingEl = document.getElementById('tasks-pending-content');
  const doneEl    = document.getElementById('tasks-done-content');
  pendingEl.innerHTML = '<div class="loader visible"><div class="spinner"></div><span>Loading…</span></div>';
  doneEl.innerHTML    = '<div class="loader visible"><div class="spinner"></div><span>Loading…</span></div>';

  try {
    const data = await apiFetch('/api/tasks');
    const pending = data.pending || [];
    const done    = data.done    || [];

    document.getElementById('pending-count').textContent = pending.length ? ` (${pending.length})` : '';
    document.getElementById('done-count').textContent    = done.length    ? ` (${done.length})`    : '';

    pendingEl.innerHTML = pending.length ? renderTaskList(pending, false) : `
      <div class="empty-state">
        <div class="empty-icon">✅</div>
        <div class="empty-title">No pending tasks</div>
        <div class="empty-desc">Run a Research or Recommendation and add tasks from the results.</div>
      </div>`;

    doneEl.innerHTML = done.length ? renderTaskList(done, true) : `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <div class="empty-title">No completed tasks yet</div>
        <div class="empty-desc">Complete a pending task to see it here.</div>
      </div>`;
  } catch (e) {
    pendingEl.innerHTML = `<div class="card"><p style="color:var(--accent3)">Error: ${e.message}</p></div>`;
    doneEl.innerHTML = pendingEl.innerHTML;
  }
}

function renderTaskList(tasks, isDone) {
  return tasks.map(t => {
    const sourceLabel = { research: '🔬 Research', recommend: '🧭 Recommend', daily_brief: '☀️ Daily Brief', manual: '✏️ Manual' }[t.source] || t.source;
    const createdDate = t.created_at ? new Date(t.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) : '';
    const completedDate = t.completed_at ? new Date(t.completed_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) : '';

    const actions = isDone
      ? `<div style="display:flex;gap:6px;flex-shrink:0;flex-wrap:wrap;">
           <button class="btn btn-ghost" style="font-size:11px;padding:5px 10px;" onclick="reopenTask(${t.id})">↺ Reopen</button>
           <button class="btn btn-ghost" style="font-size:11px;padding:5px 10px;color:var(--red);" onclick="deleteTask(${t.id})">✕</button>
         </div>`
      : `<div style="display:flex;gap:6px;flex-shrink:0;flex-wrap:wrap;">
           <button class="btn btn-primary" style="font-size:11px;padding:5px 12px;" onclick="openCompleteModal(${t.id})">✓ Done</button>
           <button class="btn btn-ghost" style="font-size:11px;padding:5px 10px;color:var(--red);" onclick="deleteTask(${t.id})">✕</button>
         </div>`;

    const completionNote = isDone && t.notes ? `<div style="font-size:11px;color:var(--teal);margin-top:4px;">📝 ${escHtml(t.notes)}</div>` : '';
    const completionMeta = isDone ? `<span style="color:var(--teal);">✓ Completed ${completedDate}</span>` : `Added ${createdDate}`;

    return `<div class="task-card ${isDone ? 'task-done' : ''}">
      <div class="task-check-col">
        ${isDone
          ? `<div class="task-check done">✓</div>`
          : `<button class="task-check pending" onclick="openCompleteModal(${t.id})" title="Mark done"></button>`}
      </div>
      <div style="flex:1;min-width:0;">
        <div class="task-title ${isDone ? 'strikethrough' : ''}">${escHtml(t.title)}</div>
        ${t.description ? `<div style="font-size:12px;color:var(--text-muted);margin-top:3px;">${escHtml(t.description)}</div>` : ''}
        ${completionNote}
        <div style="display:flex;gap:10px;align-items:center;margin-top:6px;flex-wrap:wrap;">
          <span class="source-label">${sourceLabel}</span>
          <span class="priority-dot priority-${t.priority}">${t.priority}</span>
          <span style="font-size:11px;color:var(--text-muted);">${completionMeta}</span>
        </div>
      </div>
      ${actions}
    </div>`;
  }).join('');
}

// ── Complete Modal ────────────────────────────────────────────────────────────

let _completingTaskId = null;

function openCompleteModal(taskId) {
  _completingTaskId = taskId;
  document.getElementById('complete-notes').value = '';
  document.getElementById('complete-modal').style.display = 'flex';
  setTimeout(() => document.getElementById('complete-notes').focus(), 100);
}

function closeCompleteModal() {
  document.getElementById('complete-modal').style.display = 'none';
  _completingTaskId = null;
}

async function confirmComplete() {
  if (!_completingTaskId) return;
  const notes = document.getElementById('complete-notes').value.trim();
  const btn = document.getElementById('confirm-complete-btn');
  btn.disabled = true;
  try {
    await apiFetch(`/api/tasks/${_completingTaskId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    });
    closeCompleteModal();
    loadTasks();
  } catch (e) {
    alert('Error: ' + e.message);
  } finally {
    btn.disabled = false;
  }
}

async function reopenTask(taskId) {
  if (!confirm('Move this task back to Pending?')) return;
  try {
    await apiFetch(`/api/tasks/${taskId}/reopen`, { method: 'POST' });
    loadTasks();
  } catch (e) { alert('Error: ' + e.message); }
}

async function deleteTask(taskId) {
  if (!confirm('Delete this task permanently?')) return;
  try {
    await apiFetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
    loadTasks();
  } catch (e) { alert('Error: ' + e.message); }
}

// ── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  showScreen('dashboard');
  loadDailyBrief();
});
