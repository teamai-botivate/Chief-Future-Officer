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
    logs:      'Execution Logs',
  }[id] || id;

  if (id === 'history')   loadHistory();
  if (id === 'logs')      loadLogs();
  if (id === 'dashboard') loadDashboardHistory();
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

  container.innerHTML = `
    <div class="result-panel">
      <div class="result-header">
        <div class="result-title">🔬 Research Results</div>
        <span style="font-size:11px;color:var(--text-muted)">${new Date(data.created_at).toLocaleString()}</span>
      </div>
      <div class="result-body">
        <div class="analysis-text">${analysisHtml}</div>
        ${sourcesHtml}
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
      </div>
    </div>`;
}

// ── Render helpers ─────────────────────────────────────────────────────────────

function renderAnalysis(text) {
  if (!text) return '<em style="color:var(--text-muted)">No analysis available.</em>';

  const lines = text.split('\n');
  let html = '';

  for (let line of lines) {
    const t = line.trim();
    if (!t) { html += '<div style="height:8px;"></div>'; continue; }

    // ### Heading 3
    if (t.startsWith('### ')) {
      html += `<div style="font-size:14px;font-weight:700;color:var(--accent);margin:14px 0 6px;">${mdInline(t.slice(4))}</div>`;
      continue;
    }
    // ## Heading 2
    if (t.startsWith('## ')) {
      html += `<div style="font-size:15px;font-weight:700;color:var(--text-primary);margin:16px 0 6px;">${mdInline(t.slice(3))}</div>`;
      continue;
    }
    // # Heading 1
    if (t.startsWith('# ')) {
      html += `<div style="font-size:16px;font-weight:800;color:var(--text-primary);margin:18px 0 8px;">${mdInline(t.slice(2))}</div>`;
      continue;
    }
    // ALL CAPS section title (e.g. OPPORTUNITIES:)
    if (/^[A-Z][A-Z\s\/]{2,}:/.test(t)) {
      html += `<span class="section-title">${t.replace(/:.*/, '')}</span>`;
      const rest = t.replace(/^[A-Z][A-Z\s\/]+:\s*/, '');
      if (rest) html += `<div style="display:block;margin-bottom:4px;">${mdInline(rest)}</div>`;
      continue;
    }
    // Bullet: -, *, •
    if (t.startsWith('- ') || t.startsWith('* ') || t.startsWith('• ')) {
      html += `<div class="bullet">${mdInline(t.slice(2))}</div>`;
      continue;
    }
    // Numbered list
    if (/^\d+\.\s/.test(t)) {
      const num = t.match(/^(\d+)\.\s/)[1];
      const content = t.replace(/^\d+\.\s/, '');
      html += `<div style="display:flex;gap:10px;margin-bottom:4px;">
        <span style="color:var(--accent);font-weight:700;min-width:18px;">${num}.</span>
        <span>${mdInline(content)}</span>
      </div>`;
      continue;
    }
    // QUESTION: label from daily brief
    if (t.startsWith('QUESTION:')) {
      html += `<div style="font-size:11px;font-weight:700;color:var(--accent);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:4px;">Question</div>
               <div style="font-size:13px;color:var(--text-secondary);margin-bottom:12px;">${mdInline(t.slice(9).trim())}</div>`;
      continue;
    }
    // Horizontal rule
    if (t === '---' || t === '***') {
      html += `<hr style="border:none;border-top:1px solid var(--border);margin:12px 0;">`;
      continue;
    }
    // Normal paragraph
    html += `<div style="display:block;margin-bottom:4px;color:var(--text-secondary);font-size:13px;line-height:1.8;">${mdInline(t)}</div>`;
  }

  return html;
}

function mdInline(text) {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:var(--text-primary);font-weight:600;">$1</strong>')
    .replace(/\*(.+?)\*/g,     '<em>$1</em>')
    .replace(/`(.+?)`/g,       '<code style="background:var(--bg-elevated);padding:1px 5px;border-radius:4px;font-size:12px;">$1</code>');
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
  const body = document.getElementById('daily-brief-body');
  const dateEl = document.getElementById('brief-date');
  body.innerHTML = '<div class="loader visible"><div class="spinner"></div><span>Generating today\'s brief…</span></div>';

  try {
    const data = await apiFetch('/api/daily-brief');
    const d = new Date(data.date);
    dateEl.textContent = d.toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' })
      + (data.cached ? ' · Cached' : ' · Just generated');

    // Split multi-question brief by separator
    const sections = data.analysis.split('\n\n---\n\n').filter(Boolean);
    let html = '';
    for (const sec of sections) {
      html += `<div style="margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid var(--border);">
        <div class="analysis-text">${renderAnalysis(sec)}</div>
      </div>`;
    }
    html += renderSources(data.sources);
    body.innerHTML = html || '<p style="color:var(--text-muted)">No brief available.</p>';
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
    dateEl.textContent = d.toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' }) + ' · Just regenerated';

    const sections = data.analysis.split('\n\n---\n\n').filter(Boolean);
    let html = '';
    for (const sec of sections) {
      html += `<div style="margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid var(--border);">
        <div class="analysis-text">${renderAnalysis(sec)}</div>
      </div>`;
    }
    html += renderSources(data.sources);
    body.innerHTML = html || '<p style="color:var(--text-muted)">No brief available.</p>';
  } catch (e) {
    body.innerHTML = `<p style="color:var(--accent3)">Error: ${e.message}</p>`;
  }
}

// ── Schedule Modal ────────────────────────────────────────────────────────────

async function openScheduleModal() {
  document.getElementById('schedule-modal').style.display = 'flex';
  try {
    const sched = await apiFetch('/api/schedule');
    document.getElementById('sched-time').value = sched.run_time || '08:00';
    renderSchedQuestions(sched.questions || []);
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
    container.innerHTML += `
      <div style="display:flex;gap:8px;align-items:center;" id="sq-row-${i}">
        <input type="text" value="${escHtml(q)}" placeholder="Enter a research question…"
          style="flex:1;" id="sq-${i}" />
        <button onclick="removeSchedQuestion(${i})"
          style="background:none;border:none;color:var(--text-muted);font-size:16px;cursor:pointer;flex-shrink:0;">✕</button>
      </div>`;
  });
}

function addSchedQuestion() {
  const container = document.getElementById('sched-questions');
  const count = container.children.length;
  if (count >= 5) { alert('Maximum 5 questions allowed.'); return; }
  const i = count;
  const row = document.createElement('div');
  row.style.cssText = 'display:flex;gap:8px;align-items:center;';
  row.id = `sq-row-${i}`;
  row.innerHTML = `
    <input type="text" value="" placeholder="Enter a research question…"
      style="flex:1;" id="sq-${i}" />
    <button onclick="removeSchedQuestion(${i})"
      style="background:none;border:none;color:var(--text-muted);font-size:16px;cursor:pointer;flex-shrink:0;">✕</button>`;
  container.appendChild(row);
}

function removeSchedQuestion(i) {
  const row = document.getElementById(`sq-row-${i}`);
  if (row) row.remove();
}

async function saveSchedule() {
  const runTime = document.getElementById('sched-time').value;
  if (!runTime) { alert('Please set a run time.'); return; }

  const questions = [];
  document.querySelectorAll('[id^="sq-"]').forEach(inp => {
    if (inp.tagName === 'INPUT' && inp.value.trim()) {
      questions.push(inp.value.trim());
    }
  });
  if (!questions.length) { alert('Add at least one research question.'); return; }

  try {
    await apiFetch('/api/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ run_time: runTime, questions }),
    });
    closeScheduleModal();
    alert(`Schedule saved. Daily brief will run at ${runTime} each day.`);
  } catch (e) {
    alert('Error saving schedule: ' + e.message);
  }
}

// Close modal on backdrop click
document.addEventListener('click', e => {
  const modal = document.getElementById('schedule-modal');
  if (e.target === modal) closeScheduleModal();
});

// ── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  showScreen('dashboard');
  loadDailyBrief();
});
