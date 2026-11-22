import fs from 'fs';
import { launch, shot, sleep, advance, battle, inBattle, state } from './lib.mjs';
const { browser, page, errors } = await launch('http://localhost:4173/?debug=1');
await page.evaluate(s => localStorage.setItem('mcv_save_v1', s), fs.readFileSync('/tmp/ckpt_found.json', 'utf8'));
await page.reload(); await sleep(2500); await page.click('text=繼續遊戲'); await sleep(1500);
await page.evaluate(() => { window.__mcv.G.s.courage = 9; window.__mcv.G.world.startBattle('meadow_grass', false); });
await sleep(1800); await shot(page, '24_random_battle');
let n = 0; const log = [];
for (let i = 0; i < 200 && await inBattle(page); i++) {
  const t = await page.textContent('.bmsg').catch(() => ''); if (t && log[log.length - 1] !== t) log.push(t);
  if (t.includes('對話成功') && n++ === 0) await shot(page, '25_talk_success');
  const btns = await page.$$('.cmds button');
  if (btns.length === 6) { await page.click('.cmds button:has-text("對話")'); await sleep(200); const sub = await page.$$('.sublist button:not(.back)'); if (sub.length) await sub[0].click(); }
  else await page.click('.bmsg').catch(() => {});
  await sleep(250);
}
console.log(log.join('\n'));
const s = await state(page); console.log('talkSuccess', await page.evaluate(() => window.__mcv.G.s.stats.talkSuccess), 'exp', s.exp, 'scene', s.scene);
console.log('errors', errors); await browser.close();
const d = await launch('http://localhost:4173/?debug=1&skip=1', { width: 1280, height: 800 });
await sleep(2500); await advance(d.page, { log: false }); await shot(d.page, '34_desktop');
console.log('overflow', await d.page.evaluate(() => document.documentElement.scrollWidth > innerWidth), d.errors); await d.browser.close();
