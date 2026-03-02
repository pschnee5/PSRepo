// seed-demo.js — loads fake data so you can see the tracker in action
// Run once: node seed-demo.js
// Remove demo data: node seed-demo.js --clear

const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'tracker.db'));

if (process.argv[2] === '--clear') {
  db.exec('DELETE FROM activities; DELETE FROM opportunities;');
  console.log('Demo data cleared.');
  process.exit(0);
}

const opps = db.prepare(`
  INSERT INTO opportunities (company, contact, title, email, stage, created_at, notes)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const acts = db.prepare(`
  INSERT INTO activities (opportunity_id, type, outcome, date, notes)
  VALUES (?, ?, ?, ?, ?)
`);

const insertOpps = db.transaction(() => {
  opps.run('Acme Corp',       'Jane Smith',    'VP of Sales',        'jane@acme.com',     2, '2026-01-15', 'Referral from Mike');
  opps.run('TechFlow Inc',    'Bob Johnson',   'Director of Ops',    'bob@techflow.com',  1, '2026-02-10', 'Cold outbound — saw their Series B announcement');
  opps.run('Meridian Health', 'Sarah Lee',     'CTO',                'slee@meridian.com', 3, '2026-01-28', 'Inbound after webinar');
  opps.run('BlueSky Retail',  'Carlos Reyes',  'Head of Ecommerce',  null,                4, '2026-01-05', 'Demo went really well');
  opps.run('Novu Systems',    'Amy Chen',      'CEO',                'amy@novu.io',       1, '2026-02-20', 'Met at SaaStr');
  opps.run('Fieldstone Co',   'Dan Marsh',     'VP Engineering',     'dan@fieldstone.com',6, '2025-12-01', 'Closed won!');
  opps.run('PeakPoint Media', 'Tina Guo',      'Marketing Director', 'tina@peakpoint.com',7, '2026-01-20', 'Lost to competitor on price');
});
insertOpps();

const insertActs = db.transaction(() => {
  // Opp 1 — Acme Corp (Stage 2)
  acts.run(1, 'linkedin',   'Connected',          '2026-01-15', 'Sent connection request with a note about their expansion');
  acts.run(1, 'email',      'Opened',             '2026-01-16', 'Intro email — referenced their Q4 hiring push');
  acts.run(1, 'email',      'Replied — positive', '2026-01-18', 'She said she\'d been looking for something like this');
  acts.run(1, 'call',       'Connected — 22 min', '2026-01-20', 'Discovery call. Main pain: team tracking manual processes in spreadsheets');
  acts.run(1, 'follow_up',  'Sent recap email',   '2026-01-21', 'Sent notes + next steps');
  acts.run(1, 'email',      'No reply',           '2026-01-28', 'Bump #1');
  acts.run(1, 'call',       'Voicemail',          '2026-02-03', 'Left a voicemail');
  acts.run(1, 'email',      'Replied — set call', '2026-02-05', 'She replied, set up next meeting');

  // Opp 2 — TechFlow Inc (Stage 1, recent)
  acts.run(2, 'linkedin',   'Connection request sent', '2026-02-10', null);
  acts.run(2, 'email',      'Opened, no reply',        '2026-02-11', 'Cold intro email');
  acts.run(2, 'email',      'No reply',                '2026-02-18', 'Follow-up #1');

  // Opp 3 — Meridian Health (Stage 3, stale — needs attention)
  acts.run(3, 'email',      'Replied — interested',    '2026-01-29', 'Responded to cold email within 2 hours');
  acts.run(3, 'call',       'Connected — 35 min',      '2026-02-01', 'Deep discovery. Huge compliance pain point');
  acts.run(3, 'meeting',    'Demo scheduled',          '2026-02-04', null);
  acts.run(3, 'demo',       'Very engaged — lots of Qs','2026-02-07', 'Sarah looped in two engineers during the call');
  acts.run(3, 'follow_up',  'Sent one-pager',          '2026-02-08', null);
  // last activity was 2026-02-08 — stale

  // Opp 4 — BlueSky Retail (Stage 4)
  acts.run(4, 'linkedin',   'Connected',              '2026-01-05', null);
  acts.run(4, 'email',      'Replied',                '2026-01-07', null);
  acts.run(4, 'call',       'Connected — 20 min',     '2026-01-10', null);
  acts.run(4, 'meeting',    'Completed',              '2026-01-15', 'Brought in their CFO');
  acts.run(4, 'demo',       'Positive',               '2026-01-22', null);
  acts.run(4, 'proposal',   'Sent — awaiting response','2026-02-25', 'Sent $24k/yr proposal');
  acts.run(4, 'follow_up',  'Acknowledged, reviewing', '2026-02-28', null);

  // Opp 5 — Novu Systems (Stage 1, very fresh)
  acts.run(5, 'linkedin',   'Connected at event',     '2026-02-20', 'Met Amy at SaaStr booth');
  acts.run(5, 'email',      'Replied — let\'s chat',  '2026-02-21', null);

  // Opp 6 — Closed won
  acts.run(6, 'email',      'Replied',                '2025-12-03', null);
  acts.run(6, 'call',       'Connected',              '2025-12-05', null);
  acts.run(6, 'demo',       'Completed',              '2025-12-10', null);
  acts.run(6, 'proposal',   'Sent',                   '2025-12-15', null);
  acts.run(6, 'call',       'Negotiation call',       '2025-12-20', null);
  acts.run(6, 'email',      'Contract signed!',       '2025-12-28', null);

  // Opp 7 — Closed lost
  acts.run(7, 'linkedin',   'Connected',              '2026-01-20', null);
  acts.run(7, 'email',      'Replied',                '2026-01-22', null);
  acts.run(7, 'call',       'Connected',              '2026-01-25', null);
  acts.run(7, 'proposal',   'Sent — lost to price',   '2026-02-01', 'Went with cheaper competitor');
});
insertActs();

console.log('Demo data loaded! Try these commands:');
console.log('  node tracker.js dashboard');
console.log('  node tracker.js list');
console.log('  node tracker.js view 1');
console.log('  node tracker.js view 4');
