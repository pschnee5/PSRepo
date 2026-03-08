#!/usr/bin/env node
// research.js — Meeting Research Agent
//
// Researches companies before your meetings so you walk in with
// credibility, context, and a sharp point of view.
//
// Usage:
//   node research.js "Stripe" "Datadog" "Figma"       Research specific companies
//   node research.js --pipeline                        Research all active companies from outbound tracker
//   node research.js                                   Interactive mode — type company names
//
// Requires ANTHROPIC_API_KEY in your .env file.
// ---------------------------------------------------------------

require('dotenv').config();

const Anthropic = require('@anthropic-ai/sdk');
const chalk     = require('chalk');
const readline  = require('readline');
const path      = require('path');
const fs        = require('fs');

// ── Helpers ──────────────────────────────────────────────

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(resolve => rl.question(chalk.yellow(q), a => resolve(a.trim())));

function printBanner() {
  console.log('\n' + chalk.bold.cyan('╔══════════════════════════════════════════════════╗'));
  console.log(chalk.bold.cyan('║') + chalk.bold.white('   Meeting Research Agent                         ') + chalk.bold.cyan('║'));
  console.log(chalk.bold.cyan('║') + chalk.gray('   Know every company before you walk in           ') + chalk.bold.cyan('║'));
  console.log(chalk.bold.cyan('╚══════════════════════════════════════════════════╝\n'));
}

function printDivider() {
  console.log(chalk.gray('\n' + '─'.repeat(52) + '\n'));
}

// ── Pipeline integration ────────────────────────────────

function loadPipelineCompanies() {
  // Try to find the outbound tracker database
  const trackerDbPath = path.join(__dirname, '..', 'outbound-tracker', 'tracker.db');

  if (!fs.existsSync(trackerDbPath)) {
    console.log(chalk.yellow('  No outbound tracker database found.'));
    console.log(chalk.gray('  (Expected at: ../outbound-tracker/tracker.db)'));
    console.log(chalk.gray('  Use "node research.js <company1> <company2> ..." instead.\n'));
    return [];
  }

  try {
    const Database = require('better-sqlite3');
    const db = new Database(trackerDbPath, { readonly: true });

    const opps = db.prepare(`
      SELECT DISTINCT company, contact, title, stage,
             MAX(a.date) as last_activity
      FROM opportunities o
      LEFT JOIN activities a ON a.opportunity_id = o.id
      WHERE o.stage BETWEEN 1 AND 5
      GROUP BY o.company
      ORDER BY o.stage DESC, last_activity DESC
    `).all();

    db.close();

    if (opps.length === 0) {
      console.log(chalk.gray('  No active opportunities in the pipeline.\n'));
      return [];
    }

    console.log(chalk.bold(`  Found ${opps.length} active companies in your pipeline:\n`));
    opps.forEach((o, i) => {
      console.log(chalk.gray(`    ${i + 1}. `) + chalk.white(o.company) + chalk.gray(` — ${o.contact}${o.title ? ', ' + o.title : ''}`));
    });
    console.log();

    return opps.map(o => ({
      name: o.company,
      contact: o.contact,
      title: o.title,
      stage: o.stage,
    }));
  } catch (err) {
    console.log(chalk.yellow(`  Could not read tracker database: ${err.message}\n`));
    return [];
  }
}

// ── Claude research with web search ─────────────────────

async function researchCompany(client, company) {
  const companyName = typeof company === 'string' ? company : company.name;
  const contactInfo = typeof company === 'string' ? null : company;

  let contextLine = '';
  if (contactInfo && contactInfo.contact) {
    contextLine = `\nI'm meeting with ${contactInfo.contact}${contactInfo.title ? ' (' + contactInfo.title + ')' : ''} at this company.`;
  }

  const prompt = `Research the company "${companyName}" for me. I have a meeting coming up and need to walk in prepared.${contextLine}

Search the web for recent and relevant information about this company. I need:

1. **COMPANY SNAPSHOT** — What they do in 1-2 sentences. Founded when, HQ where, how big (employees/revenue if public).

2. **WHAT THEY CARE ABOUT RIGHT NOW** — Their top 2-3 current strategic priorities based on recent news, earnings calls, blog posts, or press releases. What are they investing in, launching, or pivoting toward?

3. **RECENT NEWS** — The 2-3 most notable recent developments (last 6 months). New products, funding rounds, partnerships, leadership changes, earnings highlights.

4. **INDUSTRY CONTEXT** — Key competitive dynamics. Who are they competing with? What market trends affect them?

5. **TALKING POINTS FOR MY MEETING** — 3 specific, thoughtful things I could bring up that show I've done my homework. Frame these as observations or questions, not generic compliments.

Be specific, factual, and concise. Skip anything generic — I want the kind of insight that makes someone say "this person really gets us."`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
    server_tools: [{ type: 'web_search' }],
  });

  // Extract text from response content blocks
  const text = response.content
    .filter(block => block.type === 'text')
    .map(block => block.text)
    .join('\n');

  return text;
}

// ── Output formatting ───────────────────────────────────

function printBriefing(companyName, briefing, index, total) {
  console.log(chalk.bold.cyan(`\n┌──────────────────────────────────────────────────┐`));
  console.log(chalk.bold.cyan(`│ `) + chalk.bold.white(`BRIEFING: ${companyName.toUpperCase()}`) + ' '.repeat(Math.max(0, 39 - companyName.length)) + chalk.bold.cyan(`│`));
  if (total > 1) {
    const progress = `(${index + 1} of ${total})`;
    console.log(chalk.bold.cyan(`│ `) + chalk.gray(progress) + ' '.repeat(Math.max(0, 49 - progress.length)) + chalk.bold.cyan(`│`));
  }
  console.log(chalk.bold.cyan(`└──────────────────────────────────────────────────┘`));
  console.log();
  console.log(briefing);
  printDivider();
}

// ── Main flow ───────────────────────────────────────────

async function main() {
  printBanner();

  // Check API key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error(chalk.red('  Error: ANTHROPIC_API_KEY is not set in your .env file.'));
    console.error(chalk.gray('  Add this line to .env:  ANTHROPIC_API_KEY=your-key-here'));
    process.exit(1);
  }

  const client = new Anthropic({ apiKey });

  // Determine which companies to research
  let companies = [];
  const args = process.argv.slice(2);

  if (args.length === 1 && args[0] === '--pipeline') {
    // Pull from outbound tracker
    console.log(chalk.bold('  Mode: ') + 'Pipeline scan — pulling from outbound tracker\n');
    companies = loadPipelineCompanies();

    if (companies.length === 0) {
      rl.close();
      process.exit(0);
    }
  } else if (args.length > 0 && !args[0].startsWith('-')) {
    // Companies passed as CLI arguments
    companies = args.map(name => name);
    console.log(chalk.bold('  Researching: ') + companies.join(', ') + '\n');
  } else {
    // Interactive mode
    console.log(chalk.gray('  Enter company names (comma-separated), or type "pipeline" to scan your tracker.\n'));
    const input = await ask('  Companies: ');

    if (input.toLowerCase() === 'pipeline') {
      companies = loadPipelineCompanies();
      if (companies.length === 0) {
        rl.close();
        process.exit(0);
      }
    } else {
      companies = input.split(',').map(s => s.trim()).filter(Boolean);
    }
  }

  if (companies.length === 0) {
    console.log(chalk.red('\n  No companies to research. Provide at least one company name.\n'));
    rl.close();
    process.exit(1);
  }

  // Research each company
  const total = companies.length;
  const briefings = [];

  for (let i = 0; i < companies.length; i++) {
    const company = companies[i];
    const name = typeof company === 'string' ? company : company.name;

    console.log(chalk.cyan(`\n  Researching ${name}... `) + chalk.gray(`(${i + 1}/${total})`));

    try {
      const briefing = await researchCompany(client, company);
      briefings.push({ name, briefing });
      printBriefing(name, briefing, i, total);
    } catch (err) {
      console.error(chalk.red(`\n  Failed to research ${name}: ${err.message}`));
      if (err.message.includes('api_key')) {
        console.error(chalk.gray('  Check your ANTHROPIC_API_KEY in .env'));
      }
      briefings.push({ name, briefing: `[Research failed: ${err.message}]` });
    }
  }

  // Summary footer
  if (total > 1) {
    console.log(chalk.bold.cyan('\n╔══════════════════════════════════════════════════╗'));
    console.log(chalk.bold.cyan('║') + chalk.bold.white('   Research Complete                               ') + chalk.bold.cyan('║'));
    console.log(chalk.bold.cyan('╚══════════════════════════════════════════════════╝\n'));
    console.log(chalk.bold(`  ${briefings.length} companies briefed:`));
    briefings.forEach((b, i) => {
      const status = b.briefing.startsWith('[Research failed') ? chalk.red('✗') : chalk.green('✔');
      console.log(`    ${status} ${b.name}`);
    });
    console.log();
  }

  rl.close();
}

main().catch(err => {
  console.error(chalk.red('\n  Unexpected error: ') + err.message);
  process.exit(1);
});
