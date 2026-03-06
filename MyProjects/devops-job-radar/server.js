// server.js — DevOps Job Radar
// -------------------------------------------------------
// Express backend that proxies requests to the Anthropic API.
// The API key lives here on the server, never in the browser.
//
// Run:   node server.js
// Visit: http://localhost:3000
// -------------------------------------------------------

require('dotenv').config();
const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Serve the frontend files from this same directory
app.use(express.static(path.join(__dirname)));

// -------------------------------------------------------
// POST /api/search-jobs
// Proxies a single message to the Anthropic API, asking
// Claude to use its web_search tool to find job postings.
// Returns the raw text Claude produces.
// -------------------------------------------------------
app.post('/api/search-jobs', async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not set in .env' });
  }

  const prompt =
    'Search for recent job postings with ANY of these titles: ' +
    '"Platform Engineer", "Cloud Operations", "DevOps", "DevSecOps", "SRE". ' +
    'Only include companies with strictly 50–500 employees. ' +
    'Do NOT include companies under 50 or over 500 employees. ' +
    'Search LinkedIn, boards.greenhouse.io, jobs.lever.co, jobs.ashbyhq.com, and Wellfound. ' +
    'Focus on venture-backed startups in fintech, payments, digital health, SaaS, AI, insurtech — ' +
    'similar to Raise, Signifyd, Raptor Maps, Ethena. ' +
    'For each job found, output in this exact format:\n\n' +
    'COMPANY: [name]\nROLE: [title]\nINDUSTRY: [industry]\n' +
    'SIZE: [employee count]\nLOCATION: [location]\nPOSTED: [when or "recently"]\n' +
    'URL: [link]\nATS: [Greenhouse/Lever/Ashby/LinkedIn/Other]\n---\n\n' +
    'List every job. No summaries. If nothing found, write: NO RESULTS FOUND.';

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':         'application/json',
        'x-api-key':            apiKey,
        'anthropic-version':    '2023-06-01',
        // web_search is a beta feature
        'anthropic-beta':       'web-search-2025-03-05',
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-6',
        max_tokens: 4000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: AbortSignal.timeout(90_000), // 90 s max
    });

    const data = await response.json();

    if (data.error) {
      console.error('Anthropic error:', data.error);
      return res.status(502).json({ error: data.error.message });
    }

    // Extract all text blocks from the response (Claude may interleave
    // tool-use and text blocks; we want only the final text output).
    const text = (data.content || [])
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('')
      .trim();

    if (!text) {
      return res.status(502).json({
        error: `No text in response. stop_reason=${data.stop_reason} ` +
               `content_types=${(data.content || []).map(b => b.type).join(',')}`,
      });
    }

    res.json({ text });
  } catch (err) {
    console.error('Fetch error:', err.message);
    res.status(502).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`DevOps Job Radar running at http://localhost:${PORT}`);
  console.log(`ANTHROPIC_API_KEY loaded: ${process.env.ANTHROPIC_API_KEY ? 'yes' : 'NO — set it in .env'}`);
});
