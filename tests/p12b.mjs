// 喵喵小學堂、貼紙簿、村莊東街截圖
import { launch, sleep, shot, state, advance, play, warp, tapNpc, goNpc } from './lib.mjs';
const T = 32; const c = n => n * T + 16;
const { browser, page, errors } = await launch('http://localhost:4173/?debug=1&skip=1');
await sleep(2500);
await page.evaluate(() => {
  const G = window.__mcv.G; const s = G.s;
  for (const q of ['main1','main2','main3','main4','main5','main6','side2','main7','main8']) s.quests[q] = { status: 'done', prog: {}, seen: {} };
  Object.assign(s.flags, { system: true, catSpeech: true, tut_status: true, tut_quests: true, seen_arrive: true, seen_meadow: true, forest_open: true });
  s.inventory = { wooden_sword: 1, sticker_book: 1, cookie: 3 }; s.weapon = 'wooden_sword'; s.time = 'day';
  s.stickers = ['douhua_home', 'ali_join', 'chick_saved', 'slime_talk', 'slime_defeat', 'goblin_talk', 'meadow_day', 'moon_paw', 'shiny_slime'];
  G.load(s); G.world.placePlayer('village', 23 * 32 + 16, 14 * 32 + 16, 0);
});
await sleep(1500); await advance(page);
// 貼紙簿
await page.evaluate(() => { window.__mcv.G.ui.openPanel('stickers'); }); await sleep(800); await shot(page, '90_sticker_book');
const tabs = await page.$$('.sub-tabs button'); if (tabs[1]) { await tabs[1].click(); await sleep(400); await shot(page, '91_sticker_monsters'); }
await page.click('.sys-head .x').catch(() => {}); await sleep(300);
// 風車小屋
await page.evaluate(() => { const G = window.__mcv.G; G.s.flags.windmill_open = true; G.world.onGrassStep = () => {}; G.world.placePlayer('windmill', 5 * 32 + 16, 9 * 32 + 16, 0); }); await sleep(1500); await advance(page); await shot(page, '92_windmill');
console.log('errors', errors);
await browser.close();
