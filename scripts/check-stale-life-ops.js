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

if (fails.length) {
  console.error('FAIL\n' + fails.map(function(f){ return ' - ' + f; }).join('\n'));
  process.exit(1);
}
console.log('ok: Adler Oct 30 + June CPAP scrub checks passed');
