// script.js — DevOps Job Radar
// -------------------------------------------------------
// All API calls go to our own Express server (/api/search-jobs),
// which keeps the Anthropic API key safely on the backend.
// Results are cached in localStorage so a page reload doesn't
// clear the last scan.
// -------------------------------------------------------

const CACHE_KEY = 'devops_radar_v1';

// ── DOM refs ──────────────────────────────────────────────
const scanBtn      = document.getElementById('scanBtn');
const progressEl   = document.getElementById('progress');
const progressText = document.getElementById('progressText');
const errorBanner  = document.getElementById('errorBanner');
const emptyState   = document.getElementById('emptyState');
const resultsEl    = document.getElementById('results');
const jobCountEl   = document.getElementById('jobCount');
const jobPluralEl  = document.getElementById('jobPlural');
const jobGrid      = document.getElementById('jobGrid');
const rawFallback  = document.getElementById('rawFallback');
const rawText      = document.getElementById('rawText');
const lastRunTime  = document.getElementById('lastRunTime');

// ── Helpers ───────────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

function showError(msg) {
  errorBanner.textContent = '⚠ ' + msg;
  errorBanner.style.display = 'block';
}

function clearError() {
  errorBanner.textContent = '';
  errorBanner.style.display = 'none';
}

function setLoading(on) {
  scanBtn.disabled = on;
  scanBtn.textContent = on ? 'Scanning…' : '↻ Scan Now';
  progressEl.style.display = on ? 'flex' : 'none';
}

// ── Parse Claude's text into structured job objects ───────
function parseListings(text) {
  const blocks = text
    .split(/\n---\n/)
    .map(b => b.trim())
    .filter(b => b && b !== 'NO RESULTS FOUND');

  return blocks
    .map(block => {
      const fields = {};
      block.split('\n').forEach(line => {
        const idx = line.indexOf(':');
        if (idx > -1) {
          const key = line.slice(0, idx).trim().toUpperCase();
          fields[key] = line.slice(idx + 1).trim();
        }
      });
      return fields;
    })
    .filter(f => f.COMPANY);
}

// ── Render job cards ──────────────────────────────────────
function renderCards(jobs) {
  emptyState.style.display    = 'none';
  rawFallback.style.display   = 'none';

  if (jobs.length === 0) {
    resultsEl.style.display = 'none';
    emptyState.style.display = 'block';
    return;
  }

  jobCountEl.textContent  = jobs.length;
  jobPluralEl.textContent = jobs.length !== 1 ? 's' : '';
  jobGrid.innerHTML       = '';
  resultsEl.style.display = 'block';

  jobs.forEach(job => {
    const card = document.createElement('div');
    card.className = 'card';

    const url = job.URL && job.URL !== '' && job.URL !== 'N/A' ? job.URL : null;

    card.innerHTML = `
      <div class="card-bar"></div>
      <div class="c-top">
        <div>
          <div class="c-name">${esc(job.COMPANY || '—')}</div>
          <div class="c-role">${esc(job.ROLE || '—')}</div>
        </div>
        ${job.POSTED ? `<div class="badge-green">● ${esc(job.POSTED)}</div>` : ''}
      </div>
      <div class="tags">
        ${job.INDUSTRY ? `<span class="tag t-ind">${esc(job.INDUSTRY)}</span>` : ''}
        ${job.SIZE     ? `<span class="tag t-sz">👥 ${esc(job.SIZE)}</span>` : ''}
        ${job.LOCATION ? `<span class="tag t-loc">📍 ${esc(job.LOCATION)}</span>` : ''}
        ${job.ATS      ? `<span class="tag t-ats">${esc(job.ATS)}</span>` : ''}
      </div>
      ${url ? `<a class="c-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">View posting →</a>` : ''}
    `;

    jobGrid.appendChild(card);
  });
}

// Minimal HTML escape to prevent XSS from API-returned data
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Show raw text when parsing yields nothing ─────────────
function renderRaw(text) {
  emptyState.style.display  = 'none';
  resultsEl.style.display   = 'none';
  rawFallback.style.display = 'block';
  rawText.textContent       = text;
}

// ── Load cached results on startup ───────────────────────
function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return;
    const cache = JSON.parse(raw);
    if (cache.text)  { restoreResults(cache.text, cache.ts); }
  } catch {
    // silently ignore corrupt cache
  }
}

function restoreResults(text, ts) {
  if (ts) lastRunTime.textContent = 'Last scan: ' + fmtDate(ts);
  const jobs = parseListings(text);
  if (jobs.length > 0) {
    renderCards(jobs);
  } else {
    renderRaw(text);
  }
}

// ── Scan button handler ───────────────────────────────────
scanBtn.addEventListener('click', async () => {
  clearError();
  setLoading(true);
  emptyState.style.display    = 'none';
  resultsEl.style.display     = 'none';
  rawFallback.style.display   = 'none';
  progressText.textContent    = 'Searching all roles… this can take up to 60 s';

  try {
    const response = await fetch('/api/search-jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    const ts = new Date().toISOString();
    lastRunTime.textContent = 'Last scan: ' + fmtDate(ts);

    // Cache to localStorage
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ text: data.text, ts }));
    } catch { /* storage full — ignore */ }

    const jobs = parseListings(data.text);
    if (jobs.length > 0) {
      renderCards(jobs);
    } else {
      renderRaw(data.text);
    }
  } catch (err) {
    showError(err.message);
    emptyState.style.display = 'block';
  } finally {
    setLoading(false);
  }
});

// ── Init ──────────────────────────────────────────────────
loadCache();
