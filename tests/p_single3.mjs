import { launch, sleep, shot } from './lib.mjs';
const url = process.argv[2] || 'http://localhost:4180/';
const { browser, page, errors } = await launch(url);
await sleep(5000);
const r = await page.evaluate(() => ({ keys: Object.keys(window.__MCV_ASSETS || {}).length, title: document.querySelector('.title-logo h1')?.textContent, ver: document.querySelector('.version')?.textContent }));
console.log(r); await shot(page, process.argv[3] || '81_single_v03_title');
const bad = await page.evaluate(() => performance.getEntriesByType('resource').filter(e => e.responseStatus >= 400).map(e => e.name));
console.log('bad', bad, 'errors', errors); await browser.close();
