# DevOps Hiring Radar

Scans the web for **DevOps / Platform / SRE / DevSecOps / Cloud Ops** job postings at companies with **50–500 employees**, using Claude's built-in web search.

## How it works

1. You click **Scan Now** in the browser.
2. The browser calls our own Express server (`/api/search-jobs`).
3. The server calls the Anthropic API with the `web_search` tool — Claude searches LinkedIn, Greenhouse, Lever, Ashby, and Wellfound.
4. Results are parsed and displayed as cards. They're also cached in `localStorage` so a page reload keeps the last scan.

## Setup

```bash
cd MyProjects/devops-job-radar

# 1. Install dependencies
npm install

# 2. Create your .env file
cp .env.example .env
# Edit .env and paste your Anthropic API key

# 3. Start the server
npm start

# 4. Open http://localhost:3000
```

## Requirements

- Node.js 18+ (uses native `fetch`)
- An Anthropic API key with access to the `web_search_20250305` tool
  (available on claude-sonnet-4-6 and newer models)

## Files

| File | Purpose |
|------|---------|
| `server.js` | Express backend — proxies Anthropic API calls, keeps the key secure |
| `index.html` | Page structure |
| `styles.css` | Dark-theme styling |
| `script.js` | Frontend logic — scan button, parsing, card rendering, localStorage cache |
| `.env.example` | Template for your `.env` |
