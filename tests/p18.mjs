// W1：倒轉鐘樓的門、梯子、變大、籬笆小洞（要變小）、花園、國語題畫面
import { launch, sleep, shot, advance } from './lib.mjs';
const URL = process.env.URL || 'http://localhost:4175/';
const { browser, page, errors } = await launch(URL + '?debug=1&skip=1');
await sleep(2500);
await page.evaluate(() => {
  const G = window.__mcv.G; const s = G.s;
  for (const q of ['main1','main2','main3','main4','main5','main6']) s.quests[q] = { status: 'done', prog: {}, seen: {} };
  Object.assign(s.flags, { system: true, catSpeech: true, tut_status: true, tut_quests: true, tut_party: true, seen_arrive: true, seen_meadow: true });
  s.inventory = { wooden_sword: 1, sticker_book: 1 }; s.weapon = 'wooden_sword'; s.time = 'day'; s.weather = 'clear';
  G.load(s); window.__mcv.G.exec({ type: 'rest' }); G.world.placePlayer('village', 11 * 32 + 4, 9 * 32 + 20, 1);
});
await sleep(1500); await advance(page, { log: false });
await page.evaluate(() => { window.__mcv.G.world.onGrassStep = () => {}; });
const where = () => page.evaluate(() => { const w = window.__mcv.G.world; return [w.map.id, Math.round(w.player.x), Math.round(w.player.y), window.__mcv.G.s.size, +w.player.scale.toFixed(2)]; });
const hold = async (key, ms) => { await page.keyboard.down(key); await sleep(ms); await page.keyboard.up(key); await sleep(300); };
await shot(page, 'w1_01_yuanyuan_village');
// 開始支線 21
await page.evaluate(() => { window.__mcv.G.run('side21_start', 'yuanyuan'); }); await sleep(300); await advance(page, { choices: ['好，我來幫妳'] });
// 走進鐘樓：站在門口下面往上走
await page.evaluate(() => window.__mcv.G.world.placePlayer('village', 12 * 32 + 16, 8 * 32 + 10, 1)); await sleep(500);
await hold('ArrowUp', 900); await sleep(1500);
console.log('after door', await where()); await shot(page, 'w1_02_clock1');
// 一樓的梯子
await page.evaluate(() => window.__mcv.G.world.placePlayer('clock_1', 8 * 32 + 16, 2 * 32 + 20, 1)); await sleep(400); await hold('ArrowUp', 700); await sleep(1500);
console.log('after ladder', await where());
// 二樓：站進圈圈，按按鈕變大
await page.evaluate(() => { const w = window.__mcv.WONDERS.find(x => x.id === 'wc_tower2'); window.__mcv.G.world.player.setPosition(w.x, w.y); }); await sleep(400);
console.log('action label', await page.evaluate(() => document.querySelector('.act')?.textContent ?? [...document.querySelectorAll('button')].map(b => b.textContent).join('|')));
await page.evaluate(() => window.__mcv.G.world.interact()); await sleep(900);
console.log('big?', await where()); await shot(page, 'w1_03_big');
await page.evaluate(() => window.__mcv.G.world.interact()); await sleep(700); console.log('back?', await where());
// 國語題畫面
await page.evaluate(() => { window.__mcv.G.exec({ type: 'quiz', subject: 'chinese', tier: 1, n: 1, by: 'yuanyuan', title: '圓圓的國語題' }); }); await sleep(800); await shot(page, 'w1_04_quiz_zh');
for (let i = 0; i < 6 && !(await page.$('.qz-next')); i++) { const bs = await page.$$('.qz-btn:not([disabled])'); if (bs[0]) await bs[0].click(); await sleep(400); } await page.click('.qz-next'); await sleep(600);
// 籬笆小洞：先完成支線 21
await page.evaluate(() => { const G = window.__mcv.G; G.s.quests.side21 = { status: 'done', prog: {}, seen: {} }; G.s.inventory.shrink_dew = 1; G.world.placePlayer('village', 22 * 32 + 16, 8 * 32 + 20, 1); }); await sleep(900);
await hold('ArrowUp', 700); await advance(page, { log: true }); console.log('normal size at hole', await where());
const w = await page.evaluate(() => { const w = window.__mcv.WONDERS.find(x => x.id === 'wc_hedge'); window.__mcv.G.world.player.setPosition(w.x, w.y); return w; }); await sleep(400);
await page.evaluate(() => window.__mcv.G.world.interact()); await sleep(900); console.log('small?', await where()); await shot(page, 'w1_05_small_hedge');
await page.evaluate(() => window.__mcv.G.world.player.setPosition(22 * 32 + 16, 8 * 32 + 10)); await sleep(300);
await hold('ArrowUp', 900); await sleep(1500); await advance(page, { log: true });
console.log('garden?', await where()); await shot(page, 'w1_06_garden');
await page.evaluate(() => window.__mcv.G.world.placePlayer('clock_3', 5 * 32, 5 * 32, 1)); await sleep(1300); await shot(page, 'w1_07_clock3');
console.log('stickers', await page.evaluate(() => window.__mcv.G.s.stickers));
console.log('errors', errors); await browser.close();
