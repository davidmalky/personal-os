#!/usr/bin/env node
'use strict';
var fs = require('fs');
var path = require('path');
var vm = require('vm');
var root = path.join(__dirname, '..');
var html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
var fails = [];
function ok(cond, msg) { if (!cond) fails.push(msg); }

var start = html.indexOf('// --- LIVE INTEL CARD SYNC ---');
var end = html.indexOf('// --- END LIVE INTEL CARD SYNC ---');
ok(start > -1 && end > start, 'Live intel card sync block must exist');
if (start < 0 || end < start) {
  console.error('FAIL\n' + fails.map(function(f){ return ' - ' + f; }).join('\n'));
  process.exit(1);
}

var store = {};
var context = {
  window: {},
  localStorage: {
    getItem: function(k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
    setItem: function(k, v) { store[k] = String(v); },
    removeItem: function(k) { delete store[k]; }
  }
};
context.window = context;
vm.runInNewContext(html.slice(start, end), context);

ok(typeof context.formatUsdCompact === 'function', 'formatUsdCompact exported');
ok(context.formatUsdCompact(0) === '$0', 'formatUsdCompact(0) is $0');
ok(context.formatUsdCompact(100000) === '$100K', 'formatUsdCompact(100000) is $100K');

var pp = context.ppBalanceFromMetrics({
  pp_balance: 0,
  genmed_ach_received: 100000,
  genmed_ach_date: '2026-04-22'
});
ok(pp.display === '$0', 'PP Balance from live metrics is $0, not leftover $93K');
ok(!/93K/.test(pp.display + ' ' + pp.sub), 'PP Balance subtitle must not keep leftover 93K');
ok(/100K/.test(pp.sub) && /Apr/.test(pp.sub), 'PP Balance subtitle uses GenMed ACH facts');

var blank = context.ppBalanceFromMetrics({});
ok(blank.display === '—' || blank.display === '-', 'Missing metrics do not invent a PP number');
ok(!/93K/.test(blank.display + ' ' + blank.sub), 'Missing metrics do not fall back to leftover 93K');

ok(context.isResidualNinetyThreeKText('$93K remaining of $193K total'), '93K GenMed remaining is residual');
ok(context.isResidualNinetyThreeKText('~$93K'), 'tilde 93K val is residual');
ok(!context.isResidualNinetyThreeKText('Adler hearing Fri Oct 30'), 'Adler text is not residual 93K');
ok(!context.isResidualNinetyThreeKText('GenMed $193K contract total'), '193K contract total is not leftover 93K');
ok(context.isCardPromoOrMarketing('Chase® Ink® — Your Ink Business Unlimited® card'), 'Chase Ink is card promo');
ok(context.isCardPromoOrMarketing('Chase Credit Journey — latest Credit Summary'), 'Credit Journey is marketing');
ok(!context.isCardPromoOrMarketing('GenMed Solutions — $100,000 ACH received'), 'GenMed ACH is not promo');
ok(context.isBotOrAutomationMail('cursor[bot] — Fix stale Adler hearing'), 'cursor bot is automation mail');
ok(context.isThinCpapBoilerplate('CPAP habit — keep nightly use; prior compliance windows are closed'), 'thin CPAP habit is boilerplate');
ok(context.itemTopicKey('Avrumy — in Israel') === 'avrami', 'Avrumy maps to Avrami topic');
ok(context.itemTopicKey('Leah — at Shalva') === 'shalva', 'Leah/Shalva share a topic');
ok(context.textsOverlap('Adler hearing — Fri Oct 30 9am', 'Adler proof hearing — 52 days'), 'Adler seed and live titles share a topic');

ok(context.isKnownStaleSeedItem('finance', {
  id: 'f1', text: 'Prime Procurement — GenMed balance', sub: '$93K remaining of $193K total', val: '~$93K'
}), 'Old finance f1 seed is stale');
ok(context.isKnownStaleSeedItem('pending', {id:'p1', text:'Cube ACR → Drive auto-backup', sub:'Call pipeline'}), 'Cube ACR pending seed is stale');
ok(context.isKnownStaleSeedItem('pending', {id:'p2', text:'Wave AI voice notes', sub:'USB'}), 'Wave AI pending seed is stale');
ok(context.isKnownStaleSeedItem('pending', {id:'p8', text:'Kia $40 refund', sub:'MVC'}), 'Kia $40 pending seed is stale');
ok(context.isKnownStaleSeedItem('health', {id:'h2', text:'Tapezza Treatment 3', sub:'Jun 1 scheduling window passed'}), 'Tapezza Treatment 3 seed is stale');
ok(context.isKnownStaleSeedItem('health', {id:'h3', text:'Dr. Landsman ENT', sub:'May 25 — date passed'}), 'Landsman May 25 seed is stale');
ok(context.isKnownStaleSeedTask({id:1, text:'Set up Cube ACR → Google Drive auto-backup', pri:'high'}), 'Cube ACR priority task seed is stale');
ok(context.isKnownStaleSeedTask({id:3, text:'Yeshiva Dvar Torah tuition — move on BuyersEdge/Mark', pri:'high'}), 'Yeshiva Dvar Torah seed is stale');

store['po2_store_finance'] = JSON.stringify([
  {id:'f1', text:'Prime Procurement — GenMed balance', sub:'$93K remaining of $193K total', status:'urgent', val:'~$93K'},
  {id:'f2', text:'Capital One Spark', sub:'AutoPay enrolled', status:'done', val:'AutoPay', source:'user'}
]);
store['po2_tasks'] = JSON.stringify([
  {id:1, text:'Set up Cube ACR → Google Drive auto-backup', pri:'high', cat:'projects', done:false},
  {id:5, text:'Set up Donor Advised Fund', pri:'med', cat:'finance', done:false},
  {id:99, text:'User added keep-me', pri:'low', cat:'other', done:false, source:'user'}
]);

var intel = {
  metrics: {pp_balance: 0, genmed_ach_received: 100000, genmed_ach_date: '2026-04-22'},
  week: [
    {title:'Erev Rosh Hashana', date:'Thu Sep 10', type:'jewish'},
    {title:'Rosh Hashana 5787', date:'Fri Sep 11', type:'jewish'}
  ],
  email_highlights: [
    {from:'cursor[bot]', subject:'Re: Fix stale Adler hearing (PR #3)', date:'Sep 8'},
    {from:'DG', subject:'Compensation Structure & Agreement Docs', date:'Sep 8'},
    {from:'Israel Steinberg', subject:'Re: 2 documents for review', date:'Sep 3'}
  ],
  panels: {
    finance: '<div class="ii ii-green"><strong>GenMed Solutions — $100,000 ACH received</strong> — Apr 22 2026 → MY PRIME PROCURE</div><div class="ii ii-amber"><strong>GenMed: $100,000 ACH received — reconcile remaining receivable</strong> — remaining unknown</div><div class="ii ii-blue"><strong>Chase® Ink®</strong> — Your Ink Business Unlimited® card makes your business travel easier</div><div class="ii ii-blue"><strong>Chase Credit Journey</strong> — Here\'s your latest Credit Summary</div><div class="ii ii-amber"><strong>Donor Advised Fund</strong> — not yet set up</div>',
    health: '<div class="ii ii-amber"><strong>CPAP habit</strong> — keep nightly use; prior compliance windows are closed</div><div class="ii ii-blue"><strong>Kasa Smart Plug</strong> — CPAP timer running on auto start/stop</div>',
    focus: '<div class="ii ii-red"><strong>Adler proof hearing — 52 days</strong> — Fri Oct 30 9:00 AM · Courtroom 9</div><div class="ii ii-amber"><strong>MileagePlus merge</strong> — call 1-800-421-4655</div><div class="ii ii-amber"><strong>Solo 401k</strong> — establish before Dec 31 2026</div>',
    family: '<div class="ii ii-red"><strong>Erev Rosh Hashana</strong> — Thu Sep 10</div><div class="ii ii-amber"><strong>Avrumy</strong> — in Israel, check in this week</div><div class="ii ii-amber"><strong>Leah</strong> — at Shalva, monitor how she is settling in</div>',
    email: '<div class="ii ii-blue"><strong>cursor[bot]</strong> — Re: Fix stale Adler hearing</div><div class="ii ii-blue"><strong>DG</strong> — Re: Compensation Structure &amp; Agreement Docs</div>',
    work: '<div class="ii ii-blue"><strong>Chase® Ink®</strong> — Your Ink Business Unlimited® card</div><div class="ii ii-blue"><strong>Canceled: AI Acquisition Introduction Call with Toby Taylor</strong> — Sep 8</div><div class="ii ii-blue"><strong>DONALD Personal OS</strong> — DONALD Morning Briefing</div>'
  }
};
context.syncStoresFromLiveIntel(intel);

var finance = JSON.parse(store['po2_store_finance']);
ok(finance.some(function(i){ return /GenMed/i.test(i.text) && /100,000|ACH|receivable|reconcile/i.test(i.sub + i.text); }), 'Finance store picks up live GenMed ACH');
ok(!finance.some(function(i){ return context.isResidualNinetyThreeKText(context.storeItemBlob(i)); }), 'Finance store no longer has leftover 93K row');
ok(finance.some(function(i){ return i.text === 'Capital One Spark' && i.source === 'user'; }), 'User finance rows survive Pull Now');
ok(!finance.some(function(i){ return /Chase|Ink|Credit Journey/i.test(i.text + ' ' + i.sub); }), 'Finance never keeps Chase Ink / card promo');

var health = JSON.parse(store['po2_store_health'] || '[]');
ok(!health.some(function(i){ return /CPAP habit|Kasa Smart Plug/i.test(i.text); }), 'Thin closed-window CPAP boilerplate is dropped from Health');
ok(!health.some(function(i){ return /Tapezza Treatment 3/i.test(i.text); }), 'Tapezza Treatment 3 does not remain as current');

var pending = JSON.parse(store['po2_store_pending'] || '[]');
ok(pending.some(function(i){ return /Adler/i.test(i.text); }), 'Pending store follows live focus Adler');
ok(pending.some(function(i){ return /Rosh Hashana|High Holiday/i.test(i.text); }), 'Pending includes High Holiday prep this week');
ok(pending.some(function(i){ return /Avrami|Avrumy/i.test(i.text); }), 'Pending includes Avrami/Avrumy this week');
var pendingTop = pending.slice(0, 5).map(function(i){ return i.text; }).join(' | ');
ok(/Rosh|Avrami|Avrumy|Shalva|Mark|GenMed|Adler/i.test(pendingTop), 'Pending top is this-week personal board');
ok(!/MileagePlus/.test(pendingTop), 'MileagePlus does not dominate pending top');
ok(!pending.some(function(i){ return /Wave AI|Kia \$40|Cube ACR/i.test(i.text); }), 'Stale pending seeds do not remain after applyLiveIntel');

var tasks = JSON.parse(store['po2_tasks']);
ok(tasks.some(function(t){ return /Adler/i.test(t.text) && t.source === 'live'; }), 'Priority tasks pick up live Adler');
ok(!tasks.some(function(t){ return /Cube ACR/i.test(t.text); }), 'Cube ACR seed task is removed on applyLiveIntel');
ok(tasks.some(function(t){ return t.text === 'User added keep-me'; }), 'User-added priority task survives');
var taskTop = tasks.filter(function(t){ return !t.done; }).slice(0, 6).map(function(t){ return t.text; }).join(' | ');
ok(/Rosh|Avrami|Avrumy|Shalva|Mark|GenMed|Adler/i.test(taskTop), 'Priority top is this-week personal board');
ok(!/MileagePlus/.test(taskTop), 'MileagePlus is not a top priority after Pull Now');

var work = JSON.parse(store['po2_store_work'] || '[]');
ok(!work.some(function(i){ return /Chase|Ink|Toby|Morning Briefing/i.test(i.text + ' ' + i.sub); }), 'Work store drops Chase ads, canceled Toby, and bot briefings');

var family = JSON.parse(store['po2_store_family'] || '[]');
ok(family.some(function(i){ return /Rosh Hashana/i.test(i.text); }), 'Family store has High Holidays');
ok(family.some(function(i){ return /Avrami|Avrumy/i.test(i.text); }), 'Family store has Avrami');

var financeHtml = context.rankFilterIntelHtml('finance', intel.panels.finance, intel, {});
ok(/GenMed/i.test(financeHtml), 'Finance panel HTML keeps GenMed');
ok(!/Ink|Credit Journey/i.test(financeHtml), 'Finance panel HTML drops Chase Ink');

var focusHtml = context.rankFilterIntelHtml('focus', intel.panels.focus, intel, {ensureAdler:true});
ok(/Rosh Hashana/i.test(focusHtml), 'Focus HTML includes Rosh Hashana');
ok(/Avrami|Avrumy/i.test(focusHtml), 'Focus HTML includes Avrami');
ok(/Adler/i.test(focusHtml) && /Oct 30|Courtroom 9/i.test(focusHtml), 'Focus HTML keeps Adler Oct 30');
ok(!/MileagePlus/i.test(focusHtml), 'Focus HTML drops MileagePlus fossil');

var emailHtml = context.rankFilterIntelHtml('email', intel.panels.email, intel, {});
ok(/Compensation|Mark/i.test(emailHtml), 'Email HTML keeps Mark docs');
ok(!/cursor\[bot\]/i.test(emailHtml), 'Email HTML drops cursor bot');

var workHtml = context.rankFilterIntelHtml('work', intel.panels.work, intel, {});
ok(!/Ink|Toby Taylor|Morning Briefing/i.test(workHtml), 'Work HTML drops promo and canceled intro');

if (fails.length) {
  console.error('FAIL\n' + fails.map(function(f){ return ' - ' + f; }).join('\n'));
  process.exit(1);
}
console.log('ok: live intel card sync + leftover 93K auto-heal checks passed');
