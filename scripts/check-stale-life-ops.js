#!/usr/bin/env node
'use strict';
var fs = require('fs');
var path = require('path');
var root = path.join(__dirname, '..');
var html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
var log = fs.readFileSync(path.join(root, 'content', 'DONALD-task-log.md'), 'utf8');
var fails = [];
function ok(cond, msg) { if (!cond) fails.push(msg); }

ok(/Fri Oct 30: Adler hearing/.test(html), 'Focus deadlines must show Fri Oct 30 Adler hearing');
ok(/9am · Courtroom 9/.test(html), 'Focus deadlines must show 9am Courtroom 9');
ok(!/Jun 26: Court hearing/.test(html), 'Baked Jun 26 court row must be gone');
ok(!/Hearing date passed — Ocean County/.test(html), 'Passed June court copy must be gone');
var healthChunk = html.split('id="view-health"')[1] || '';
healthChunk = healthChunk.split('id="view-family"')[0] || '';
ok(healthChunk.indexOf('window closed June 22') === -1, 'Health world must not show June 22 CPAP window');
ok(!/9 of 21 nights|9\/21 nights/.test(healthChunk), 'Health world must not show 9-of-21 CPAP');
ok(/Adler hearing is Friday October 30/.test(html), 'Chat/refresh prompts must lock Adler to Oct 30');
ok(/9-of-21 nights as current/.test(html), 'Prompts must forbid June 22 / 9-of-21 CPAP');

ok(/Friday October 30 9:00 AM/.test(log), 'Task log must store Adler as Fri Oct 30 9:00 AM');
ok(/Courtroom 9/.test(log), 'Task log must keep Courtroom 9');
ok(!/June 26/.test(log) && !/Jun(?:e)?\s*26/.test(log), 'Task log must not keep June 26');
ok(!/June 22/.test(log), 'Task log must not keep June 22 CPAP window');
ok(!/9\/21/.test(log) && !/9 of 21/.test(log), 'Task log must not keep 9-of-21 CPAP progress');
ok(/MileagePlus merge/.test(log), 'Task log must keep existing non-Adler/CPAP items');

ok(/9\\s\*\(of\|\\\/\)\\s\*21\\s\*nights/.test(html), 'Sanitizer must match 9-of-21 / 9/21 nights');
ok(/window closed\\s\+\(june\|jun\)/.test(html), 'Sanitizer must match window closed June');
ok(/rewriteCanonicalIntelHtml/.test(html) && /ensureAdlerHearingHtml/.test(html), 'Intel rewrite + Adler ensure helpers must exist');

var defaultsChunk = html.split('window.STORE_DEFAULTS')[1] || '';
defaultsChunk = defaultsChunk.split('function loadStore')[0] || '';
ok(!/\$93K|~\$93K/.test(defaultsChunk), 'STORE_DEFAULTS must not seed leftover GenMed $93K');
ok(!/val:'~\$93K'/.test(defaultsChunk), 'STORE_DEFAULTS finance val must not be leftover $93K');

var metricsFn = html.split('function renderDashMetrics')[1] || '';
metricsFn = metricsFn.split('window.renderFinWorldMetrics')[0] || '';
ok(/pp_balance/.test(html) && /ppBalanceFromMetrics/.test(metricsFn), 'renderDashMetrics must use live pp_balance helper');
ok(!/color:var\(--red\)">\$93K/.test(metricsFn), 'renderDashMetrics must not hardcode PP Balance $93K');

var intelMap = html.split('var INTEL_MAP=')[1] || '';
intelMap = intelMap.split('function injectAllIntel')[0] || '';
ok(!/\$93K owed/.test(intelMap), 'INTEL_MAP finance fallback must not say $93K owed');

ok(!/Collect the \$93K/.test(html), 'Chat/agent pack must not offer Collect the $93K');
ok(/syncStoresFromLiveIntel/.test(html), 'applyLiveIntel path must sync stores from live intel');
ok(/po2_staleSnap_v3/.test(html), 'Auto-heal migration v3 must exist');
ok(/\/api\/intel/.test(html), 'Pull Now must try same-origin /api/intel before worker CORS');

if (fails.length) {
  console.error('FAIL\n' + fails.map(function(f){ return ' - ' + f; }).join('\n'));
  process.exit(1);
}
console.log('ok: Adler Oct 30 + June CPAP scrub checks passed');
