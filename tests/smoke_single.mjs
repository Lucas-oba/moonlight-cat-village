import { chromium } from 'playwright';
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
await p.goto((process.argv[2]||'http://localhost:4180/')); await p.waitForTimeout(8000);
await p.screenshot({ path: '/tmp/single.png' }); console.log('errors', errs, await p.textContent('body').then(t => t.slice(0, 120)));
await b.close();
