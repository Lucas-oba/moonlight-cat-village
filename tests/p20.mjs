// W2：捲捲的茶會（變大拿茶壺）、顛倒小徑（倒立樹、變小樹洞、變大摘果、捷徑）、新魔物戰鬥、貼紙簿、圖鑑
import { launch, sleep, shot, advance, battle2, inBattle } from './lib.mjs';
const URL = process.env.URL || 'http://localhost:4175/';
const { browser, page, errors } = await launch(URL + '?debug=1&skip=1');
await sleep(2500);
await page.evaluate(() => {
  const G = window.__mcv.G; const s = G.s;
  for (const q of ['main1','main2','main3','main4','main5','main6','main7','main8','side21']) s.quests[q] = { status: 'done', prog: {}, seen: {} };
  Object.assign(s.flags, { system: true, catSpeech: true, tut_status: true, tut_quests: true, tut_party: true, seen_arrive: true, seen_meadow: true, forest_open: true });
  s.inventory = { wooden_sword: 1, sticker_book: 1, grow_cookie: 1, shrink_dew: 1, cookie: 5 }; s.weapon = 'wooden_sword'; s.time = 'day'; s.weather = 'clear';
  for (const id of ['ali', 'mint']) { G.ensureMember(id); s.members[id].joined = true; s.members[id].lv = 6; } s.members.hero.lv = 6; s.party = ['hero', 'ali', 'mint'];
  G.load(s); G.exec({ type: 'rest' }); G.world.placePlayer('meadow', 19 * 32 + 16, 12 * 32 + 20, 1);
});
await sleep(1500); await advance(page, { log: false });
const noGrass = () => page.evaluate(() => { window.__mcv.G.world.onGrassStep = () => {}; });
await noGrass();
const where = () => page.evaluate(() => { const w = window.__mcv.G.world; return [w.map.id, Math.round(w.player.x), Math.round(w.player.y), window.__mcv.G.s.size]; });
const hold = async (key, ms) => { await page.keyboard.down(key); await sleep(ms); await page.keyboard.up(key); await sleep(300); };
const toWonder = async id => { await page.evaluate(id => { const w = window.__mcv.WONDERS.find(x => x.id === id); window.__mcv.G.world.player.setPosition(w.x, w.y); }, id); await sleep(400); await page.evaluate(() => window.__mcv.G.world.interact()); await sleep(900); };
await shot(page, 'w2_01_teaparty');
await page.evaluate(() => { window.__mcv.G.run('side23_start', 'juanjuan'); }); await sleep(300); await advance(page, { choices: ['好，我陪妳'] , log: false });
await page.evaluate(() => { window.__mcv.G.run('side23_cups', 'juanjuan'); }); await sleep(600); await shot(page, 'w2_02_tea_math');
for (let k = 0; k < 2; k++) { for (let i = 0; i < 6 && !(await page.$('.qz-next')); i++) { const bs = await page.$$('.qz-btn:not([disabled])'); if (bs[0]) await bs[0].click(); await sleep(400); } if (await page.$('.qz-next')) await page.click('.qz-next'); await sleep(500); }
await advance(page, { log: false });
console.log('quest', await page.evaluate(() => JSON.stringify(window.__mcv.G.s.quests.side23)));
// 正常大小去拿茶壺 → 太高
await page.evaluate(() => window.__mcv.G.world.player.setPosition(17 * 32 + 28, 11 * 32 + 6)); await sleep(500);
await page.evaluate(() => window.__mcv.G.world.interact()); await sleep(400); await advance(page, { log: true });
await toWonder('wc_tea'); console.log('big?', await where());
await page.evaluate(() => window.__mcv.G.world.player.setPosition(17 * 32 + 28, 11 * 32 + 6)); await sleep(500); await shot(page, 'w2_03_big_teapot');
await page.evaluate(() => window.__mcv.G.world.interact()); await sleep(400); await advance(page, { log: true });
console.log('quest', await page.evaluate(() => JSON.stringify(window.__mcv.G.s.quests.side23)));
await page.evaluate(() => window.__mcv.G.world.player.setPosition(19 * 32, 12 * 32 + 20)); await sleep(900); await shot(page, 'w2_03b_teapot_gone');
// 顛倒小徑入口
await page.evaluate(() => window.__mcv.G.world.placePlayer('forest', 2 * 32 + 16, 8 * 32 + 20, 2)); await sleep(1300); await advance(page, { log: false }); await noGrass();
await page.evaluate(() => window.__mcv.G.world.placePlayer('forest', 2 * 32 + 16, 8 * 32 + 20, 2)); await sleep(1000); await advance(page, { log: false }); await noGrass();
await shot(page, 'w2_04_forest_entry');
await hold('ArrowLeft', 700); await sleep(1500); await advance(page, { log: true }); await noGrass();
console.log('in path?', await where()); await shot(page, 'w2_05_flip_path');
await toWonder('wc_hole'); console.log('small?', await where());
await page.evaluate(() => window.__mcv.G.world.player.setPosition(2 * 32 + 20, 10 * 32 + 10)); await sleep(500); await shot(page, 'w2_06_small_hole');
await page.evaluate(() => window.__mcv.G.world.interact()); await sleep(400); await advance(page, { log: true });
await page.evaluate(() => window.__mcv.G.world.player.setPosition(4 * 32 + 16, 6 * 32 + 16)); await sleep(500); // 走出圈圈範圍 → 變回來
console.log('after leave', await where());
await toWonder('wc_fruit'); console.log('big?', await where());
await page.evaluate(() => window.__mcv.G.world.player.setPosition(9 * 32 + 16, 4 * 32 + 36)); await sleep(500); await shot(page, 'w2_07_big_fruit');
await page.evaluate(() => window.__mcv.G.world.interact()); await sleep(400); await advance(page, { log: true });
// 走到最上面：捷徑到哥布林營地
await page.evaluate(() => window.__mcv.G.world.placePlayer('flip_path', 6 * 32 + 16, 1 * 32 + 10, 1)); await sleep(1200); await noGrass();
await hold('ArrowUp', 700); await sleep(1600); await advance(page, { log: true });
console.log('shortcut ->', await where()); await shot(page, 'w2_08_camp_shortcut');
// 新魔物的戰鬥
let shotDone = false;
for (let i = 0; i < 8; i++) {
  await page.evaluate(() => { window.__mcv.G.world.startBattle('flip_grass', false); }); await sleep(2200);
  const foes = await page.evaluate(() => window.__mcv.game.scene.getScene('Battle').foes.map(f => f.def.id));
  if (!shotDone && foes.includes('teasnail')) { await shot(page, 'w2_09_battle'); shotDone = true; }
  if (i === 0 && !shotDone) await shot(page, 'w2_09b_battle_flipmush');
  while (await inBattle(page)) { await battle2(page, i % 2 ? 'talk' : 'attack'); await sleep(500); }
  await advance(page, { log: false }); await noGrass();
  if (shotDone && i >= 3) break;
}
console.log('stickers', await page.evaluate(() => window.__mcv.G.s.stickers));
console.log('inv', await page.evaluate(() => JSON.stringify(window.__mcv.G.s.inventory)));
// 每日茶會小考
await page.evaluate(() => { const G = window.__mcv.G; G.s.flags.daily_tea = false; G.world.placePlayer('meadow', 20 * 32 + 16, 13 * 32 + 30, 0); }); await sleep(1300);
await page.evaluate(() => { window.__mcv.G.run('tea_daily', 'juanjuan'); }); await sleep(300); await advance(page, { choices: ['英文'], log: true });
await sleep(500); await shot(page, 'w2_10_tea_daily');
for (let k = 0; k < 2; k++) { for (let i = 0; i < 6 && !(await page.$('.qz-next')); i++) { const bs = await page.$$('.qz-btn:not([disabled])'); if (bs[0]) await bs[0].click(); await sleep(400); } if (await page.$('.qz-next')) await page.click('.qz-next'); await sleep(500); }
await advance(page, { log: true });
console.log('daily flag', await page.evaluate(() => window.__mcv.G.s.flags.daily_tea), 'cookies', await page.evaluate(() => window.__mcv.G.s.inventory.cookie));
console.log('errors', errors); await browser.close();
