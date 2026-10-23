import { chromium } from 'playwright';
import fs from 'fs';
const axe = fs.readFileSync(new URL('../node_modules/axe-core/axe.min.js', import.meta.url), 'utf8');
const BASE = process.env.BASE || 'http://localhost:3200';
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const runs = [
  [null, ['/', '/workers', '/jobs', '/login', '/signup', '/worker/register', '/privacy']],
  ['9812345678', ['/customer/dashboard', '/requests/new', '/messages', '/account', '/grievance']],
  ['9810123456', ['/worker/dashboard', '/worker/schedule', '/worker/profile', '/worker/verification', '/worker/alerts']],
  ['9800000002', ['/employer/dashboard', '/employer/jobs/new']],
  ['9800000001', ['/admin']],
];
const summary = {};
for (const [phone, paths] of runs) {
  const c = await b.newContext();
  const p = await c.newPage();
  if (phone) await p.request.post(`${BASE}/api/auth/login`, { data: { phone, password: 'demo-pass-123' } });
  for (const path of paths) {
    await p.goto(BASE + path); await p.waitForLoadState('networkidle');
    await p.addScriptTag({ content: axe });
    const r = await p.evaluate(async () => (await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa'] })).violations.map((v) => `${v.impact} ${v.id} (${v.nodes.length}): ${v.nodes[0].target.join(' ')}`));
    if (r.length) summary[path] = r;
  }
  await c.close();
}
await b.close();
console.log(Object.keys(summary).length ? JSON.stringify(summary, null, 1) : 'No WCAG A/AA violations found');
