#!/usr/bin/env node
// analyze.js
// ---------------------------------------------------------
// LinkedIn Profile Priority Analyzer
//
// Usage:
//   node analyze.js <linkedin-url>
//   node analyze.js                   (paste mode — no URL needed)
//
// Requires ANTHROPIC_API_KEY in your .env file.
// ---------------------------------------------------------

require('dotenv').config();

const axios       = require('axios');
const cheerio     = require('cheerio');
const readline    = require('readline');
const Anthropic   = require('@anthropic-ai/sdk');

// ── helpers ──────────────────────────────────────────────

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(resolve => rl.question(q, resolve));

function printBanner() {
  console.log('\n========================================');
  console.log('  LinkedIn Priority Analyzer');
  console.log('  Powered by Claude AI');
  console.log('========================================\n');
}

// ── step 1: get the profile text ─────────────────────────

async function fetchProfileViaHttp(url, sessionCookie) {
  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  };

  // If the user provided a session cookie, add it — gives full profile access
  if (sessionCookie) {
    headers['Cookie'] = `li_at=${sessionCookie}`;
  }

  const response = await axios.get(url, { headers, timeout: 15000, maxRedirects: 5 });
  return response.data;
}

function parseLinkedInHtml(html) {
  const $ = cheerio.load(html);

  // Remove script/style noise
  $('script, style, noscript').remove();

  // LinkedIn login wall check
  const isLoginWall =
    html.includes('authwall') ||
    html.includes('login') && html.includes('Join now') ||
    $('title').text().includes('LinkedIn: Log In');

  if (isLoginWall) {
    return { blocked: true, text: '' };
  }

  // Extract structured fields that LinkedIn exposes publicly or with auth
  const sections = {
    name:     $('h1').first().text().trim(),
    headline: $('.text-body-medium').first().text().trim(),
    about:    $('section.summary, #about ~ div, [data-section="summary"]').text().trim(),
    experience: $('section#experience, [data-section="experience"]').text().trim(),
    skills:   $('section#skills, [data-section="skills"]').text().trim(),
    education: $('section#education, [data-section="education"]').text().trim(),
    activity:  $('section.recent-activity, [data-section="recent-activity"]').text().trim(),
  };

  // Fallback: grab all visible text if structured parsing got nothing
  const allText = $('body').text().replace(/\s+/g, ' ').trim();

  const structuredText = Object.entries(sections)
    .filter(([, v]) => v.length > 0)
    .map(([k, v]) => `[${k.toUpperCase()}]\n${v}`)
    .join('\n\n');

  return {
    blocked: false,
    text: structuredText.length > 200 ? structuredText : allText.slice(0, 8000),
  };
}

async function getPastedText() {
  console.log('\nPaste the LinkedIn profile text below.');
  console.log('(Copy everything from the profile page — name, headline, about,');
  console.log(' experience, skills — then paste it here.)');
  console.log('When done, press Enter twice on a blank line:\n');

  let lines = [];
  let blankCount = 0;

  return new Promise(resolve => {
    rl.on('line', line => {
      if (line.trim() === '') {
        blankCount++;
        if (blankCount >= 2) {
          rl.removeAllListeners('line');
          resolve(lines.join('\n'));
        }
      } else {
        blankCount = 0;
        lines.push(line);
      }
    });
  });
}

// ── step 2: analyze with Claude ──────────────────────────

async function analyzeWithClaude(profileText, profileUrl) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('\nError: ANTHROPIC_API_KEY is not set in your .env file.');
    console.error('Add this line to .env:  ANTHROPIC_API_KEY=your-key-here');
    process.exit(1);
  }

  const client = new Anthropic({ apiKey });

  const prompt = `You are an expert at reading LinkedIn profiles and identifying what drives a person professionally.

Here is the LinkedIn profile data for someone${profileUrl ? ` at ${profileUrl}` : ''}:

---
${profileText}
---

Based on this profile, identify their TOP 3 MOST IMPORTANT PROFESSIONAL PRIORITIES.

A "priority" means: what does this person most care about, focus on, or invest their energy into professionally? It could be a career goal, a values-driven mission, a skill area they are deepening, a business outcome they are driving, or a cause they champion.

Respond in this exact format:

PERSON: [their name and current title/role]

PRIORITY 1: [short title — 4-6 words]
WHY: [2-3 sentences explaining the evidence from their profile that supports this priority]

PRIORITY 2: [short title — 4-6 words]
WHY: [2-3 sentences explaining the evidence from their profile that supports this priority]

PRIORITY 3: [short title — 4-6 words]
WHY: [2-3 sentences explaining the evidence from their profile that supports this priority]

CONVERSATION STARTER: [One specific, thoughtful question you could open a conversation with this person using — based on their priorities]

Be specific and grounded in the actual profile data. Do not be generic.`;

  console.log('\nAnalyzing profile with Claude...\n');

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  return message.content[0].text;
}

// ── main flow ─────────────────────────────────────────────

async function main() {
  printBanner();

  const profileUrl = process.argv[2];
  let profileText = '';

  if (profileUrl) {
    // Validate it looks like a LinkedIn URL
    if (!profileUrl.includes('linkedin.com')) {
      console.error('That doesn\'t look like a LinkedIn URL. Try again with a full URL like:');
      console.error('  https://www.linkedin.com/in/their-name/');
      process.exit(1);
    }

    console.log(`Profile URL: ${profileUrl}`);
    console.log('\nAttempting to fetch profile...');

    let html;
    let result;

    try {
      // First try: no session cookie (public data only)
      html = await fetchProfileViaHttp(profileUrl, null);
      result = parseLinkedInHtml(html);

      if (result.blocked) {
        console.log('\nLinkedIn is showing a login wall for this profile.');
        console.log('\nOption A — Provide your LinkedIn session cookie for full access.');
        console.log('  How to get it: Open LinkedIn in Chrome → DevTools (F12) →');
        console.log('  Application → Cookies → linkedin.com → copy the value of "li_at"');
        console.log('\nOption B — Skip to paste mode (manually copy the profile text).');

        const choice = await ask('\nEnter your li_at cookie value (or press Enter to paste mode): ');

        if (choice.trim()) {
          console.log('\nRetrying with session cookie...');
          html = await fetchProfileViaHttp(profileUrl, choice.trim());
          result = parseLinkedInHtml(html);

          if (result.blocked || result.text.length < 100) {
            console.log('Cookie did not work or profile is private. Switching to paste mode.');
            profileText = await getPastedText();
          } else {
            profileText = result.text;
            console.log(`Fetched ${profileText.length} characters of profile data.`);
          }
        } else {
          profileText = await getPastedText();
        }
      } else if (result.text.length < 100) {
        console.log('Could not extract enough data from the page. Switching to paste mode.');
        profileText = await getPastedText();
      } else {
        profileText = result.text;
        console.log(`Fetched ${profileText.length} characters of profile data.`);
      }
    } catch (err) {
      if (err.code === 'ENOTFOUND' || err.code === 'EAI_AGAIN') {
        console.log('\nCould not reach LinkedIn (no network or DNS issue).');
      } else if (err.response?.status === 999 || err.response?.status === 429) {
        console.log('\nLinkedIn blocked the request (bot detection).');
      } else {
        console.log(`\nFetch failed: ${err.message}`);
      }
      console.log('Switching to paste mode.\n');
      profileText = await getPastedText();
    }
  } else {
    // No URL provided — go straight to paste mode
    console.log('No URL provided — running in paste mode.');
    const urlInput = await ask('LinkedIn profile URL (optional, for reference): ');
    profileText = await getPastedText();
  }

  if (!profileText || profileText.trim().length < 50) {
    console.error('\nNot enough profile text to analyze. Please provide more content.');
    process.exit(1);
  }

  // Trim to a safe token limit (~6000 chars ≈ ~1500 tokens)
  if (profileText.length > 6000) {
    profileText = profileText.slice(0, 6000);
  }

  const analysis = await analyzeWithClaude(profileText, profileUrl);

  console.log('\n========================================');
  console.log('  ANALYSIS RESULTS');
  console.log('========================================\n');
  console.log(analysis);
  console.log('\n========================================\n');

  rl.close();
}

main().catch(err => {
  console.error('\nUnexpected error:', err.message);
  process.exit(1);
});
