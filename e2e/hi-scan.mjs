import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:3200';
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const roles = {
  public: [null, ['/', '/workers', '/jobs', '/how-it-works', '/about', '/privacy', '/cancellation-policy', '/grievance', '/login', '/signup', '/worker/register']],
  customer: ['9812345678', ['/customer/dashboard', '/requests/new', '/messages', '/notifications', '/account', '/grievance']],
  worker: ['9811122233', ['/worker/dashboard', '/worker/alerts', '/worker/schedule', '/worker/profile', '/worker/verification', '/worker/applications']],
  employer: ['9800000002', ['/employer/dashboard', '/employer/jobs/new']],
  admin: ['9800000001', ['/admin']],
};
// user content and proper nouns that are expected to stay in Latin script
const allow = /^(English|KS|UPI|OTP|JPG|PNG|WebP|MB|NCR|KS-\d.*|SR-\d.*|TKT-.*|demo-pass-123|₹.*|\d.*)$/;
const found = {};
for (const [role, [phone, paths]] of Object.entries(roles)) {
  const c = await b.newContext({ viewport: { width: 1280, height: 900 } });
  await c.addCookies([{ name: 'ks_lang', value: 'hi', url: BASE }]);
  const p = await c.newPage();
  if (phone) {
    const r = await p.request.post(`${BASE}/api/auth/login`, { data: { phone, password: 'demo-pass-123' } });
    if (!r.ok()) throw new Error('login ' + role);
    await p.request.patch(`${BASE}/api/me`, { data: { language: 'hi' } });
  }
  for (const path of paths) {
    await p.goto(BASE + path);
    await p.waitForLoadState('networkidle');
    const texts = await p.evaluate(() => {
      const out = [];
      const skip = (el) => el.closest('[lang="en"],[data-user-content]');
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while (w.nextNode()) {
        const n = w.currentNode; const s = n.textContent.trim();
        if (!s || !n.parentElement || skip(n.parentElement)) continue;
        if (/[A-Za-z]{3,}/.test(s) && !/[ऀ-ॿ]/.test(s)) out.push(s.slice(0, 80));
      }
      for (const el of document.querySelectorAll('[placeholder],[aria-label]')) {
        for (const a of ['placeholder', 'aria-label']) { const v = el.getAttribute(a); if (v && /[A-Za-z]{3,}/.test(v) && !/[ऀ-ॿ]/.test(v)) out.push(`@${a}:${v}`); }
      }
      return out;
    });
    const bad = [...new Set(texts)].filter((s) => !allow.test(s));
    if (bad.length) found[`${role} ${path}`] = bad;
  }
  await c.close();
}
await b.close();
for (const [k, v] of Object.entries(found)) console.log(k, '=>', JSON.stringify(v.slice(0, 25)));
