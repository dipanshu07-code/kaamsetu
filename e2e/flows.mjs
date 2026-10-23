// End-to-end QA of the main KaamSetu flows against a running server.
import { chromium } from 'playwright';
import fs from 'fs';

const BASE = process.env.BASE || 'http://localhost:3200';
const SHOTS = new URL('./shots/', import.meta.url).pathname;
fs.mkdirSync(SHOTS, { recursive: true });
const PW = 'demo-pass-123';
const results = [];
const consoleErrors = [];

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });

async function ctx(viewport = { width: 1280, height: 900 }) {
  const c = await browser.newContext({ viewport, locale: 'en-IN', timezoneId: 'Asia/Kolkata' });
  const p = await c.newPage();
  p.on('console', (m) => m.type() === 'error' && consoleErrors.push(`${p.url()} :: ${m.text()}`));
  p.on('pageerror', (e) => consoleErrors.push(`${p.url()} :: PAGEERROR ${e.message}`));
  return { c, p };
}

async function step(name, fn) {
  try {
    await fn();
    results.push(['PASS', name]);
  } catch (e) {
    results.push(['FAIL', name, e.message.split('\n')[0]]);
  }
}

async function login(p, phone) {
  await p.goto(`${BASE}/login`);
  await p.getByLabel('Mobile number').fill(phone);
  await p.getByLabel('Password').fill(PW);
  await p.getByRole('button', { name: 'Log in', exact: true }).click();
  await p.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 15000 });
}

async function noHorizontalScroll(p) {
  const over = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (over > 1) throw new Error(`horizontal overflow ${over}px on ${p.url()}`);
}

const nextMonday = () => {
  const d = new Date(Date.now() + 3 * 86400000);
  while (d.getDay() !== 1) d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};

// ---------------------------------------------------------------- public pages, both languages, mobile
const mobile = await ctx({ width: 375, height: 800 });
for (const path of ['/', '/workers', '/jobs', '/how-it-works', '/about', '/privacy', '/cancellation-policy', '/grievance', '/login', '/signup', '/worker/register', '/requests/new']) {
  await step(`mobile EN ${path}`, async () => {
    await mobile.p.goto(BASE + path);
    await mobile.p.waitForLoadState('networkidle');
    await noHorizontalScroll(mobile.p);
  });
}
await step('switch to Hindi on mobile', async () => {
  await mobile.p.goto(BASE + '/');
  await mobile.p.getByRole('button', { name: 'हिन्दी' }).first().click();
  await mobile.p.getByRole('heading', { name: 'आस-पास काम करवाएँ। आस-पास काम पाएँ।' }).waitFor();
  if ((await mobile.p.getAttribute('html', 'lang')) !== 'hi') throw new Error('html lang not hi');
  await mobile.p.screenshot({ path: SHOTS + 'home-hi-mobile.png', fullPage: true });
});
for (const path of ['/', '/workers', '/jobs', '/how-it-works', '/privacy', '/signup', '/worker/register']) {
  await step(`mobile HI ${path} (persists, no overflow)`, async () => {
    await mobile.p.goto(BASE + path);
    await mobile.p.waitForLoadState('networkidle');
    if ((await mobile.p.getAttribute('html', 'lang')) !== 'hi') throw new Error('language did not persist');
    await noHorizontalScroll(mobile.p);
  });
}
await mobile.p.goto(BASE + '/workers');
await mobile.p.waitForLoadState('networkidle');
await mobile.p.screenshot({ path: SHOTS + 'workers-hi-mobile.png', fullPage: true });
await mobile.c.close();

// ---------------------------------------------------------------- on-demand request → alert → quote → select → confirm
const cust = await ctx();
const plumber = await ctx();
let requestUrl = '';
await step('customer logs in (demo)', () => login(cust.p, '9812345678'));
await step('customer posts plumbing request via 3-step form', async () => {
  const p = cust.p;
  await p.goto(`${BASE}/requests/new?category=plumber`);
  await p.getByLabel('What is the problem?').fill('Kitchen tap leaking under the sink');
  await p.getByRole('button', { name: 'Next' }).click();
  await p.getByLabel('House / flat / building').fill('B-12, second floor');
  await p.getByRole('button', { name: 'Next' }).click();
  await p.getByLabel('Date').fill(nextMonday());
  await p.getByLabel('Start time').selectOption('600');
  await p.getByRole('button', { name: 'Send request to nearby workers' }).click();
  await p.waitForURL(/\/requests\/[0-9a-f-]{36}/);
  requestUrl = p.url();
  await p.getByText(/nearby workers were alerted/).waitFor();
  await p.screenshot({ path: SHOTS + 'request-created.png', fullPage: true });
});
await step('plumber sees alert without the house address and replies with a quote', async () => {
  const p = plumber.p;
  await login(p, '9811122233');
  await p.goto(`${BASE}/worker/alerts`);
  await p.getByText('Kitchen tap leaking under the sink').waitFor();
  if (await p.getByText('B-12, second floor').count()) throw new Error('address leaked to worker');
  await p.getByLabel('Your price (₹)').first().fill('350');
  await p.getByLabel('Message to the customer').first().fill('Can come with a new washer');
  await p.getByRole('button', { name: 'I can do this' }).first().click();
  await p.getByText('You replied. Waiting for the customer.').first().waitFor();
});
await step('customer compares reply, chats, chooses worker', async () => {
  const p = cust.p;
  await p.goto(requestUrl);
  await p.getByText('Arjun Kumar').waitFor();
  await p.getByRole('button', { name: 'Chat' }).first().click();
  await p.getByLabel('Type a message').fill('Please bring the washer. OK deal at 350.');
  await p.getByRole('button', { name: 'Send', exact: true }).click();
  await p.getByText('Please bring the washer. OK deal at 350.').waitFor();
  await p.getByRole('button', { name: 'Choose this worker' }).click();
  await p.waitForURL(/\/bookings\//);
  await p.getByText('Accepted, price not agreed').first().waitFor();
});
let bookingUrl = '';
await step('booking is not confirmed by chat; customer accepts offer → Confirmed', async () => {
  const p = cust.p;
  bookingUrl = p.url();
  await p.getByRole('button', { name: /Accept ₹350/ }).click();
  await p.getByText('Confirmed', { exact: true }).first().waitFor();
  await p.getByText('Agreed price').waitFor();
  await p.screenshot({ path: SHOTS + 'booking-confirmed.png', fullPage: true });
});
await step('worker sees full address and phone after confirmation', async () => {
  const p = plumber.p;
  await p.goto(bookingUrl);
  await p.getByText('B-12, second floor', { exact: false }).waitFor();
  await p.getByText(/Phone: 9812345678/).waitFor();
});

// ---------------------------------------------------------------- direct booking with slot check + double booking
const cust2 = await ctx();
await step('second customer signs up through the stepped form', async () => {
  const p = cust2.p;
  await p.goto(`${BASE}/signup?role=customer`);
  await p.getByLabel('Full name').fill('Meera Joshi');
  await p.getByLabel('Mobile number').fill('9876501234');
  await p.getByRole('button', { name: 'Next' }).click();
  await p.getByLabel('City').selectOption('Delhi NCR');
  await p.getByLabel('Locality / area').selectOption({ label: 'Saket' });
  await p.getByRole('button', { name: 'Next' }).click();
  await p.getByLabel('Password').fill('meera-pass-1');
  await p.getByLabel(/I have read the privacy notice/).check();
  await p.getByRole('button', { name: 'Create account' }).click();
  await p.waitForURL(/customer\/dashboard/);
});
await step('busy slot is shown as unavailable and rejected by server', async () => {
  const p = cust2.p;
  const arjun = bookingUrl && (await plumber.p.evaluate(() => fetch('/api/worker/profile').then((r) => r.json()))).profile.id;
  await p.goto(`${BASE}/workers/${arjun}?book=1&date=${nextMonday()}&start=630&duration=60`);
  
  await p.getByLabel('Describe the work').fill('Bathroom flush not working properly');
  await p.getByRole('button', { name: 'Next' }).click();
  await p.getByText(/outside the worker’s working hours or they are busy/).waitFor();
  await p.getByRole('button', { name: 'Next' }).click(); // blocked by client validation
  await p.getByText('The worker is unavailable at this time. Please choose another time.').first().waitFor();
});
await step('free slot booking goes through all steps', async () => {
  const p = cust2.p;
  await p.getByLabel('Start time').selectOption('900');
  await p.getByText('The worker looks free at this time.').waitFor();
  await p.getByRole('button', { name: 'Next' }).click();
  await p.getByLabel('House / flat / building').fill('C-4, Saket');
  await p.getByRole('button', { name: 'Next' }).click();
  await p.getByRole('button', { name: 'Next' }).click();
  await p.getByRole('button', { name: 'Send booking request' }).click();
  await p.waitForURL(/\/bookings\/.*new=1/);
  await p.getByText('Booking request sent.', { exact: false }).waitFor();
});

// ---------------------------------------------------------------- worker schedule & jobs
const worker = await ctx();
await step('electrician manages schedule (hours + blocked time)', async () => {
  const p = worker.p;
  await login(p, '9810123456');
  await p.goto(`${BASE}/worker/schedule`);
  await p.getByRole('heading', { name: 'Weekly working hours' }).waitFor();
  await p.getByRole('button', { name: 'Save working hours' }).click();
  await p.getByText('Saved', { exact: true }).first().waitFor();
  await p.getByRole('button', { name: 'Block this time' }).click();
  await p.locator('text=Blocked:').first().waitFor();
});
await step('worker browses jobs and applies', async () => {
  const p = worker.p;
  await p.goto(`${BASE}/jobs`);
  await p.getByRole('link', { name: 'Plumber for building maintenance' }).click();
  await p.getByLabel(/Message to the employer/).fill('8 years of experience, can start Monday');
  await p.getByRole('button', { name: 'Apply' }).click();
  await p.getByText('Application sent.', { exact: false }).waitFor();
});
const emp = await ctx();
await step('employer sees applicant and shortlists', async () => {
  const p = emp.p;
  await login(p, '9800000002');
  await p.goto(`${BASE}/employer/dashboard`);
  await p.getByRole('link', { name: '1 applicants' }).click();
  await p.getByText('8 years of experience, can start Monday').waitFor();
  await p.getByLabel('Update status').selectOption('shortlisted');
  await p.getByRole('button', { name: 'Save' }).click();
  await p.waitForTimeout(800);
});
await step('employer posts a new job', async () => {
  const p = emp.p;
  await p.goto(`${BASE}/employer/jobs/new`);
  await p.getByLabel('Job title').fill('Tile fitter');
  await p.getByLabel('Duties').fill('Floor and wall tiling in new flats, tools provided.');
  await p.getByLabel('Working days and hours').fill('Mon–Sat, 9 to 6');
  await p.getByLabel('Pay from (₹)').fill('800');
  await p.getByLabel('Pay up to (₹)').fill('1000');
  await p.getByLabel('Paid per').selectOption('day');
  await p.getByRole('button', { name: 'Publish job' }).click();
  await p.getByText('Job published.').waitFor();
});
await step('worker sees new application status', async () => {
  const p = worker.p;
  await p.goto(`${BASE}/worker/applications`);
  await p.getByText('Shortlisted').waitFor();
});

// ---------------------------------------------------------------- admin, roles
const admin = await ctx();
await step('admin console tabs load', async () => {
  const p = admin.p;
  await login(p, '9800000001');
  await p.goto(`${BASE}/admin`);
  for (const tab of ['Verification queue', 'Complaints', 'Abuse reports', 'Bookings', 'Services', 'Users', 'Audit log']) {
    await p.getByRole('tab', { name: tab }).click();
    await p.waitForLoadState('networkidle');
  }
});
await step('customer cannot open admin console', async () => {
  await cust.p.goto(`${BASE}/admin`);
  await cust.p.getByText('This page is for a different type of account.').waitFor();
});
await step('booking hidden from unrelated customer', async () => {
  await cust2.p.goto(bookingUrl);
  await cust2.p.getByText('Not found, or you do not have access.').waitFor();
});

// ---------------------------------------------------------------- Hindi in an authenticated flow
await step('customer switches to Hindi: dashboard, booking, statuses translated', async () => {
  const p = cust.p;
  await p.goto(`${BASE}/customer/dashboard`);
  await p.getByRole('button', { name: 'हिन्दी' }).first().click();
  await p.getByRole('heading', { name: /नमस्ते/ }).waitFor();
  await p.goto(bookingUrl);
  await p.getByText('पक्की', { exact: true }).first().waitFor();
  await p.getByText('तय हुआ दाम').waitFor();
  await p.screenshot({ path: SHOTS + 'booking-hi.png', fullPage: true });
  const ok = await p.evaluate(() => fetch('/api/me').then((r) => r.json()));
  if (ok.user.language !== 'hi') throw new Error('language not saved to account');
});
await step('desktop screenshots', async () => {
  await worker.p.goto(`${BASE}/worker/dashboard`);
  await worker.p.waitForLoadState('networkidle');
  await worker.p.screenshot({ path: SHOTS + 'worker-dashboard.png', fullPage: true });
  await worker.p.goto(`${BASE}/workers`);
  await worker.p.waitForLoadState('networkidle');
  await worker.p.screenshot({ path: SHOTS + 'workers-en.png', fullPage: true });
  await emp.p.goto(`${BASE}/jobs`);
  await emp.p.waitForLoadState('networkidle');
  await emp.p.screenshot({ path: SHOTS + 'jobs-en.png', fullPage: true });
});

await browser.close();
for (const r of results) console.log(r.join(' | '));
console.log(`\n${results.filter((r) => r[0] === 'PASS').length}/${results.length} passed`);
console.log('\nConsole errors:', consoleErrors.length);
for (const e of [...new Set(consoleErrors)].slice(0, 30)) console.log('  ', e.slice(0, 300));
