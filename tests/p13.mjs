// 燈籠快速移動 + 哥布林交換小攤
import { launch, sleep, shot, state, advance, goNpc } from './lib.mjs';
const { browser, page, errors } = await launch('http://localhost:4173/?debug=1&skip=1');
await sleep(2500);
await page.evaluate(() => {
  const G = window.__mcv.G; const s = G.s;
  for (const q of ['main1','main2','main3','main4','main5','main6','side2','main7','main8','main9','main10','side14','side15']) s.quests[q] = { status: 'done', prog: {}, seen: {} };
  Object.assign(s.flags, { system: true, catSpeech: true, tut_status: true, tut_quests: true, seen_arrive: true, seen_meadow: true, forest_open: true, lan_v1: true, lan_m1: true, lan_f1: true, lan_f2: true, v_md: true, v_mn: true, v_fo: true });
  s.inventory = { wooden_sword: 1, jelly: 6, wolf_fur: 3, forest_mushroom: 3, sticker_book: 1 }; s.weapon = 'wooden_sword';
  G.load(s); G.world.placePlayer('village', 8 * 32 + 16, 11 * 32 + 16, 0);
});
await sleep(1500); await advance(page);
await page.evaluate(() => { window.__mcv.G.world.onGrassStep = () => {}; });
await goNpc(page, 'lan_v1'); await sleep(800);
for (let i = 0; i < 20 && !(await page.$('.sys-wrap')); i++) { const b = await page.$('.dlg:not(.hidden) .choices button'); if (b) { await b.click(); await sleep(500); continue; } await page.click('.dlg-box').catch(() => {}); await sleep(300); }
await shot(page, '93_travel_panel');
const rows = await page.$$eval('.sys-wrap .inv-row b', els => els.map(e => e.textContent)); console.log('travel rows', rows);
await page.click('.sys-wrap .inv-row:has-text("森林深處") button'); await sleep(3000); await advance(page);
console.log('after travel', JSON.stringify(await state(page)).slice(0, 80));
await shot(page, '94_after_travel');
// 交換小攤
await goNpc(page, 'trader'); await sleep(800);
for (let i = 0; i < 20 && !(await page.$('.sys-wrap')); i++) { await page.click('.dlg-box').catch(() => {}); await sleep(300); }
await shot(page, '95_trade_panel');
const before = await page.evaluate(() => ({ ...window.__mcv.G.s.inventory }));
await page.click('.sys-wrap .inv-row button:not([disabled])'); await sleep(600);
const after = await page.evaluate(() => ({ ...window.__mcv.G.s.inventory }));
console.log('trade before', JSON.stringify(before), 'after', JSON.stringify(after));
await shot(page, '96_after_trade');
await page.click('.sys-head .x'); await advance(page);
console.log('errors', errors);
await browser.close();
