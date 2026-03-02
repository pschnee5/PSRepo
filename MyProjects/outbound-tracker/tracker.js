#!/usr/bin/env node
// tracker.js — Outbound Activity Tracker
//
// Commands:
//   node tracker.js add              Add a new opportunity
//   node tracker.js log <id>         Log an activity on an opportunity
//   node tracker.js view <id>        Full activity timeline for one opp
//   node tracker.js list             List all stage 1+ opportunities
//   node tracker.js stage <id>       Update the stage of an opportunity
//   node tracker.js dashboard        Summary stats across all active opps
//   node tracker.js export           Export everything to CSV
// ---------------------------------------------------------------

const Database   = require('better-sqlite3');
const chalk      = require('chalk');
const Table      = require('cli-table3');
const readline   = require('readline');
const fs         = require('fs');
const path       = require('path');

// ── Database setup ───────────────────────────────────────────────

const DB_PATH = path.join(__dirname, 'tracker.db');
const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS opportunities (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    company     TEXT NOT NULL,
    contact     TEXT NOT NULL,
    title       TEXT,
    email       TEXT,
    stage       INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT NOT NULL DEFAULT (date('now')),
    notes       TEXT
  );

  CREATE TABLE IF NOT EXISTS activities (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    opportunity_id INTEGER NOT NULL,
    type           TEXT NOT NULL,
    outcome        TEXT,
    date           TEXT NOT NULL DEFAULT (date('now')),
    notes          TEXT,
    FOREIGN KEY (opportunity_id) REFERENCES opportunities(id)
  );
`);

// ── Constants ────────────────────────────────────────────────────

const STAGES = {
  1: 'Stage 1 · Discovery',
  2: 'Stage 2 · Qualified',
  3: 'Stage 3 · Demo / Meeting',
  4: 'Stage 4 · Proposal Sent',
  5: 'Stage 5 · Negotiation',
  6: 'Stage 6 · Closed Won',
  7: 'Stage 7 · Closed Lost',
};

const STAGE_COLORS = {
  1: chalk.cyan,
  2: chalk.blue,
  3: chalk.yellow,
  4: chalk.magenta,
  5: chalk.white,
  6: chalk.green,
  7: chalk.red,
};

const ACTIVITY_TYPES = ['email', 'call', 'linkedin', 'meeting', 'demo', 'proposal', 'follow_up', 'other'];

const ACTIVITY_ICONS = {
  email:      '✉',
  call:       '📞',
  linkedin:   '💼',
  meeting:    '🤝',
  demo:       '🖥',
  proposal:   '📄',
  follow_up:  '🔁',
  other:      '•',
};

// ── Helpers ──────────────────────────────────────────────────────

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(resolve => rl.question(chalk.yellow(q), a => resolve(a.trim())));

async function askFromList(prompt, options) {
  options.forEach((o, i) => console.log(chalk.gray(`  ${i + 1}. ${o}`)));
  const answer = await ask(`${prompt} (1-${options.length}): `);
  const idx = parseInt(answer, 10) - 1;
  if (idx < 0 || idx >= options.length) {
    console.log(chalk.red('Invalid choice.'));
    return askFromList(prompt, options);
  }
  return options[idx];
}

function stageLabel(n) {
  const color = STAGE_COLORS[n] || chalk.white;
  return color(STAGES[n] || `Stage ${n}`);
}

function daysAgo(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - d) / 86400000);
  if (diff === 0) return chalk.green('Today');
  if (diff === 1) return chalk.green('Yesterday');
  if (diff <= 7) return chalk.yellow(`${diff}d ago`);
  return chalk.gray(`${diff}d ago`);
}

function printHeader(title) {
  console.log('\n' + chalk.bold.white('═'.repeat(52)));
  console.log(chalk.bold.white(`  ${title}`));
  console.log(chalk.bold.white('═'.repeat(52)) + '\n');
}

function getOpp(id) {
  const opp = db.prepare('SELECT * FROM opportunities WHERE id = ?').get(id);
  if (!opp) {
    console.error(chalk.red(`No opportunity found with ID ${id}.`));
    process.exit(1);
  }
  return opp;
}

// ── Commands ─────────────────────────────────────────────────────

async function cmdAdd() {
  printHeader('Add New Opportunity');

  const company = await ask('Company name: ');
  const contact = await ask('Contact name: ');
  const title   = await ask('Contact title (optional): ');
  const email   = await ask('Contact email (optional): ');
  const notes   = await ask('Notes (optional): ');

  console.log('\nSelect starting stage:');
  const stageOptions = Object.entries(STAGES).map(([k, v]) => v);
  const stageLabel   = await askFromList('Stage', stageOptions);
  const stage        = Object.values(STAGES).indexOf(stageLabel) + 1;

  const result = db.prepare(`
    INSERT INTO opportunities (company, contact, title, email, stage, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(company, contact, title || null, email || null, stage, notes || null);

  console.log(chalk.green(`\n✔ Opportunity added — ID: ${result.lastInsertRowid}`));
  console.log(chalk.gray(`  ${company} · ${contact} · ${STAGES[stage]}\n`));

  rl.close();
}

async function cmdLog(id) {
  const opp = getOpp(id);
  printHeader(`Log Activity — #${id}: ${opp.company}`);
  console.log(chalk.gray(`  Contact: ${opp.contact}  |  ${stageLabel(opp.stage)}\n`));

  console.log('Activity type:');
  const type = await askFromList('Type', ACTIVITY_TYPES);

  const outcome = await ask('Outcome (e.g. "replied", "booked call", "no answer"): ');
  const date    = await ask('Date (YYYY-MM-DD, or press Enter for today): ');
  const notes   = await ask('Notes (optional): ');

  const actDate = date || new Date().toISOString().slice(0, 10);

  db.prepare(`
    INSERT INTO activities (opportunity_id, type, outcome, date, notes)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, type, outcome || null, actDate, notes || null);

  // Ask if stage should be updated
  const updateStage = await ask('\nUpdate stage? (y/N): ');
  if (updateStage.toLowerCase() === 'y') {
    rl.close();
    await cmdStage(id, /* interactive */ true);
    return;
  }

  console.log(chalk.green(`\n✔ Activity logged — ${ACTIVITY_ICONS[type]} ${type} on ${actDate}\n`));
  rl.close();
}

async function cmdStage(id, keepOpen = false) {
  const opp = getOpp(id);
  if (!keepOpen) printHeader(`Update Stage — #${id}: ${opp.company}`);
  console.log(chalk.gray(`  Current stage: ${stageLabel(opp.stage)}\n`));

  console.log('New stage:');
  const stageOptions = Object.entries(STAGES).map(([k, v]) => v);
  const newLabel     = await askFromList('Stage', stageOptions);
  const newStage     = Object.values(STAGES).indexOf(newLabel) + 1;

  db.prepare('UPDATE opportunities SET stage = ? WHERE id = ?').run(newStage, id);

  console.log(chalk.green(`\n✔ Stage updated → ${STAGES[newStage]}\n`));
  rl.close();
}

function cmdView(id) {
  const opp        = getOpp(id);
  const activities = db.prepare('SELECT * FROM activities WHERE opportunity_id = ? ORDER BY date ASC').all(id);

  printHeader(`Opportunity #${id}: ${opp.company}`);

  // Summary block
  console.log(chalk.bold('Contact:  ') + `${opp.contact}${opp.title ? '  ·  ' + opp.title : ''}`);
  if (opp.email) console.log(chalk.bold('Email:    ') + opp.email);
  console.log(chalk.bold('Stage:    ') + stageLabel(opp.stage));
  console.log(chalk.bold('Created:  ') + opp.created_at);
  if (opp.notes) console.log(chalk.bold('Notes:    ') + chalk.gray(opp.notes));
  console.log();

  if (activities.length === 0) {
    console.log(chalk.gray('  No activities logged yet.\n'));
    return;
  }

  // Activity counts by type
  const counts = {};
  ACTIVITY_TYPES.forEach(t => { counts[t] = 0; });
  activities.forEach(a => { counts[a.type] = (counts[a.type] || 0) + 1; });

  const countStr = Object.entries(counts)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => `${ACTIVITY_ICONS[k]} ${v} ${k}`)
    .join('  ·  ');

  console.log(chalk.bold(`${activities.length} activities total: `) + chalk.gray(countStr));
  console.log();

  // Timeline table
  const table = new Table({
    head: [chalk.bold('#'), chalk.bold('Date'), chalk.bold('Type'), chalk.bold('Outcome'), chalk.bold('Notes')],
    colWidths: [4, 12, 12, 20, 30],
    style: { border: ['gray'] },
    wordWrap: true,
  });

  activities.forEach((a, i) => {
    table.push([
      chalk.gray(i + 1),
      a.date,
      `${ACTIVITY_ICONS[a.type]} ${a.type}`,
      a.outcome || '—',
      a.notes   || '—',
    ]);
  });

  console.log(table.toString());
  console.log();
}

function cmdList() {
  const opps = db.prepare(`
    SELECT o.*,
           COUNT(a.id) as activity_count,
           MAX(a.date) as last_activity
    FROM opportunities o
    LEFT JOIN activities a ON a.opportunity_id = o.id
    WHERE o.stage BETWEEN 1 AND 5
    GROUP BY o.id
    ORDER BY o.stage ASC, last_activity DESC
  `).all();

  printHeader('Active Opportunities (Stage 1–5)');

  if (opps.length === 0) {
    console.log(chalk.gray('  No opportunities yet. Run: node tracker.js add\n'));
    return;
  }

  const table = new Table({
    head: [
      chalk.bold('ID'),
      chalk.bold('Company'),
      chalk.bold('Contact'),
      chalk.bold('Stage'),
      chalk.bold('Activities'),
      chalk.bold('Last Activity'),
    ],
    colWidths: [5, 18, 16, 26, 12, 16],
    style: { border: ['gray'] },
  });

  opps.forEach(o => {
    table.push([
      chalk.gray(o.id),
      chalk.white(o.company),
      o.contact,
      stageLabel(o.stage),
      o.activity_count > 0 ? chalk.cyan(o.activity_count) : chalk.gray('0'),
      o.last_activity ? daysAgo(o.last_activity) : chalk.gray('None'),
    ]);
  });

  console.log(table.toString());
  console.log(chalk.gray(`\n  ${opps.length} active opportunities\n`));
}

function cmdDashboard() {
  const opps = db.prepare(`
    SELECT o.*,
           COUNT(a.id) as activity_count,
           MAX(a.date) as last_activity
    FROM opportunities o
    LEFT JOIN activities a ON a.opportunity_id = o.id
    GROUP BY o.id
    ORDER BY o.stage ASC
  `).all();

  const allActivities = db.prepare('SELECT * FROM activities').all();

  printHeader('Outbound Activity Dashboard');

  if (opps.length === 0) {
    console.log(chalk.gray('  No opportunities yet. Run: node tracker.js add\n'));
    return;
  }

  // ── Pipeline overview ──
  console.log(chalk.bold('PIPELINE OVERVIEW\n'));

  const byStage = {};
  opps.forEach(o => {
    if (!byStage[o.stage]) byStage[o.stage] = [];
    byStage[o.stage].push(o);
  });

  const stageTable = new Table({
    head: [chalk.bold('Stage'), chalk.bold('Opps'), chalk.bold('Total Activities'), chalk.bold('Avg Activities')],
    colWidths: [28, 7, 18, 16],
    style: { border: ['gray'] },
  });

  Object.entries(byStage).sort(([a], [b]) => a - b).forEach(([stage, list]) => {
    const total = list.reduce((sum, o) => sum + o.activity_count, 0);
    const avg   = (total / list.length).toFixed(1);
    stageTable.push([
      stageLabel(Number(stage)),
      chalk.cyan(list.length),
      total,
      avg,
    ]);
  });

  console.log(stageTable.toString());

  // ── Activity breakdown ──
  console.log(chalk.bold('\nACTIVITY BREAKDOWN\n'));

  const actTable = new Table({
    head: [chalk.bold('Type'), chalk.bold('Total'), chalk.bold('Last 7 days'), chalk.bold('Last 30 days')],
    colWidths: [14, 8, 14, 14],
    style: { border: ['gray'] },
  });

  const now    = new Date();
  const day7   = new Date(now - 7  * 86400000).toISOString().slice(0, 10);
  const day30  = new Date(now - 30 * 86400000).toISOString().slice(0, 10);

  ACTIVITY_TYPES.forEach(type => {
    const all    = allActivities.filter(a => a.type === type);
    const week   = all.filter(a => a.date >= day7);
    const month  = all.filter(a => a.date >= day30);
    if (all.length === 0) return;
    actTable.push([
      `${ACTIVITY_ICONS[type]} ${type}`,
      chalk.cyan(all.length),
      week.length > 0  ? chalk.green(week.length)  : chalk.gray('0'),
      month.length > 0 ? chalk.yellow(month.length) : chalk.gray('0'),
    ]);
  });

  console.log(actTable.toString());

  // ── Opps needing attention (no activity in 7+ days) ──
  const stale = opps.filter(o =>
    o.stage >= 1 && o.stage <= 5 &&
    (!o.last_activity || o.last_activity < day7)
  );

  if (stale.length > 0) {
    console.log(chalk.bold('\nNEEDS ATTENTION — No activity in 7+ days\n'));
    stale.forEach(o => {
      const last = o.last_activity ? daysAgo(o.last_activity) : chalk.gray('Never');
      console.log(`  ${chalk.red('!')} #${o.id} ${chalk.white(o.company)} · ${o.contact} · ${stageLabel(o.stage)} · Last: ${last}`);
    });
    console.log();
  }

  // ── Win/loss summary ──
  const won  = opps.filter(o => o.stage === 6).length;
  const lost = opps.filter(o => o.stage === 7).length;
  if (won + lost > 0) {
    const rate = Math.round(won / (won + lost) * 100);
    console.log(chalk.bold('CLOSE RATE: ') + chalk.green(`${won} won`) + chalk.gray(' / ') + chalk.red(`${lost} lost`) + chalk.gray(` (${rate}%)\n`));
  }
}

function cmdExport() {
  const opps = db.prepare('SELECT * FROM opportunities ORDER BY id').all();
  const acts  = db.prepare('SELECT * FROM activities ORDER BY opportunity_id, date').all();

  const lines = [
    'opp_id,company,contact,title,email,stage,stage_label,created_at,opp_notes,activity_date,activity_type,activity_outcome,activity_notes'
  ];

  opps.forEach(o => {
    const oActs = acts.filter(a => a.opportunity_id === o.id);
    if (oActs.length === 0) {
      lines.push([o.id, o.company, o.contact, o.title || '', o.email || '', o.stage, STAGES[o.stage], o.created_at, o.notes || '', '', '', '', ''].join(','));
    } else {
      oActs.forEach(a => {
        const row = [
          o.id, `"${o.company}"`, `"${o.contact}"`, o.title || '', o.email || '',
          o.stage, `"${STAGES[o.stage]}"`, o.created_at, `"${o.notes || ''}"`,
          a.date, a.type, `"${a.outcome || ''}"`, `"${a.notes || ''}"`,
        ];
        lines.push(row.join(','));
      });
    }
  });

  const outPath = path.join(__dirname, `export-${new Date().toISOString().slice(0, 10)}.csv`);
  fs.writeFileSync(outPath, lines.join('\n'));
  console.log(chalk.green(`\n✔ Exported ${opps.length} opportunities and ${acts.length} activities`));
  console.log(chalk.gray(`  File: ${outPath}\n`));
}

function printHelp() {
  printHeader('Outbound Activity Tracker');
  console.log('  ' + chalk.cyan('node tracker.js add') + '            Add a new opportunity');
  console.log('  ' + chalk.cyan('node tracker.js log <id>') + '       Log an activity on an opportunity');
  console.log('  ' + chalk.cyan('node tracker.js view <id>') + '      Full activity timeline for one opp');
  console.log('  ' + chalk.cyan('node tracker.js stage <id>') + '     Update the stage of an opportunity');
  console.log('  ' + chalk.cyan('node tracker.js list') + '           List all stage 1–5 opportunities');
  console.log('  ' + chalk.cyan('node tracker.js dashboard') + '      Summary stats across all active opps');
  console.log('  ' + chalk.cyan('node tracker.js export') + '         Export everything to CSV');
  console.log();
}

// ── Router ────────────────────────────────────────────────────────

const [,, cmd, arg] = process.argv;

(async () => {
  switch (cmd) {
    case 'add':       await cmdAdd();             break;
    case 'log':       await cmdLog(Number(arg));  break;
    case 'view':      cmdView(Number(arg));       break;
    case 'stage':     await cmdStage(Number(arg)); break;
    case 'list':      cmdList();                  break;
    case 'dashboard': cmdDashboard();             break;
    case 'export':    cmdExport();                break;
    default:          printHelp();               break;
  }
  if (['view', 'list', 'dashboard', 'export', undefined].includes(cmd)) rl.close();
})();
