# Browser checks

Playwright scripts used to verify the main flows. They are not part of `npm test` because they need a running server and a browser.

```bash
# terminal 1: fresh demo database + production build
rm -rf .data && npm run build && npm start -- -p 3200
# terminal 2
npm i --no-save playwright axe-core
node e2e/flows.mjs     # 39 end-to-end steps: requests, quotes, negotiation, double-booking, jobs, admin, Hindi
node e2e/axe.mjs       # WCAG 2 A/AA scan of 20 pages across all roles
node e2e/hi-scan.mjs   # lists any Latin-script interface text left on Hindi pages
```

Set `BASE` to target another URL and `CHROMIUM_PATH` to use a specific browser binary. `flows.mjs` expects a fresh demo database, because it creates accounts with fixed phone numbers.
