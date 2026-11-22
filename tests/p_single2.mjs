import { launch, sleep, shot, advance } from './lib.mjs';
const { browser, page, errors } = await launch('http://localhost:4180/index.html?debug=1');
await sleep(3000); await page.click('text=新遊戲'); await sleep(1500);
console.log('music', await page.evaluate(() => window.__music.current()), 'assets', await page.evaluate(() => Object.keys(window.__MCV_ASSETS).filter(k => k.endsWith('.mp3')).length));
await shot(page, '57_single_prologue');
console.log('errors', JSON.stringify(errors)); await browser.close();
