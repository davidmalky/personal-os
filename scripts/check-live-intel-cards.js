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
  panels: {
    finance: '<div class="ii ii-green"><strong>GenMed Solutions — $100,000 ACH received</strong> — Apr 22 2026 → MY PRIME PROCURE</div><div class="ii ii-amber"><strong>Donor Advised Fund</strong> — not yet set up</div>',
    health: '<div class="ii ii-amber"><strong>CPAP habit</strong> — keep nightly use; prior compliance windows are closed</div><div class="ii ii-blue"><strong>Kasa Smart Plug</strong> — CPAP timer running</div>',
    focus: '<div class="ii ii-red"><strong>Adler proof hearing — 52 days</strong> — Fri Oct 30 9:00 AM · Courtroom 9</div><div class="ii ii-amber"><strong>MileagePlus merge</strong> — call 1-800-421-4655</div>'
  }
};
context.syncStoresFromLiveIntel(intel);

var finance = JSON.parse(store['po2_store_finance']);
ok(finance.some(function(i){ return /GenMed Solutions/i.test(i.text) && /100,000|ACH/i.test(i.sub + i.text); }), 'Finance store picks up live GenMed ACH');
ok(!finance.some(function(i){ return context.isResidualNinetyThreeKText(context.storeItemBlob(i)); }), 'Finance store no longer has leftover 93K row');
ok(finance.some(function(i){ return i.text === 'Capital One Spark' && i.source === 'user'; }), 'User finance rows survive Pull Now');

var health = JSON.parse(store['po2_store_health'] || '[]');
ok(health.some(function(i){ return /CPAP habit/i.test(i.text); }), 'Health store follows live CPAP habit');
ok(!health.some(function(i){ return /Tapezza Treatment 3/i.test(i.text); }), 'Tapezza Treatment 3 does not remain as current');

var pending = JSON.parse(store['po2_store_pending'] || '[]');
ok(pending.some(function(i){ return /Adler/i.test(i.text); }), 'Pending store follows live focus Adler');
ok(pending.some(function(i){ return /MileagePlus/i.test(i.text); }), 'Pending store follows live MileagePlus');
ok(!pending.some(function(i){ return /Wave AI|Kia \$40|Cube ACR/i.test(i.text); }), 'Stale pending seeds do not remain after applyLiveIntel');

var tasks = JSON.parse(store['po2_tasks']);
ok(tasks.some(function(t){ return /Adler/i.test(t.text) && t.source === 'live'; }), 'Priority tasks pick up live Adler');
ok(!tasks.some(function(t){ return /Cube ACR/i.test(t.text); }), 'Cube ACR seed task is removed on applyLiveIntel');
ok(tasks.some(function(t){ return t.text === 'User added keep-me'; }), 'User-added priority task survives');

if (fails.length) {
  console.error('FAIL\n' + fails.map(function(f){ return ' - ' + f; }).join('\n'));
  process.exit(1);
}
console.log('ok: live intel card sync + leftover 93K auto-heal checks passed');
