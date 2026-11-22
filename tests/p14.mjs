// Milestone D1：進屋子、旅店睡覺切換白天晚上、下雨天、合唱團
import { launch, sleep, shot, state, advance, joystick, goNpc } from './lib.mjs';
const { browser, page, errors } = await launch('http://localhost:4173/?debug=1&skip=1');
await sleep(2500);
await page.evaluate(() => {
  const G = window.__mcv.G; const s = G.s;
  for (const q of ['main1','main2','main3','main4','main5','main6','side2','main7','main8','main9','main10','side8']) s.quests[q] = { status: 'done', prog: {}, seen: {} };
  Object.assign(s.flags, { system: true, catSpeech: true, tut_status: true, tut_quests: true, seen_arrive: true, seen_meadow: true, forest_open: true, windmill_open: true, v_md: true, v_mn: true });
  s.inventory = { wooden_sword: 1, sticker_book: 1 }; s.weapon = 'wooden_sword'; s.time = 'day'; s.observation = 6;
  G.load(s); G.world.placePlayer('village', 8 * 32 + 16, 11 * 32 + 16, 0);
});
await sleep(1500); await advance(page, { log: false });
await page.evaluate(() => { window.__mcv.G.world.onGrassStep = () => {}; });
const DOORS = [[5, 5, 'elder_home'], [3, 12, 'inn_in'], [19, 12, 'shop_in'], [26, 27, 'smithy_in'], [4, 27, 'herb_in'], [26, 8, 'flower_in'], [26, 18, 'weave_in'], [17, 27, 'mochi_home'], [2, 4, 'windmill']];
const blockedInfo = await page.evaluate(D => { const w = window.__mcv.G.world; return D.map(([x, y]) => [x, y, w.blocked[y][x], w.blocked[y + 1][x]]); }, DOORS);
console.log('door blocked (door,below):', JSON.stringify(blockedInfo));
let i = 0;
for (const [tx, ty, to] of DOORS) {
  // 走過門口（左右）不會進去
  await page.evaluate(([tx, ty]) => window.__mcv.G.world.placePlayer('village', (tx - 1) * 32 + 16, ty * 32 + 26, 3), [tx, ty]); await sleep(400);
  await joystick(page, 60, 0, 450); await sleep(500);
  const side = await state(page);
  await page.evaluate(([tx, ty]) => window.__mcv.G.world.placePlayer('village', tx * 32 + 16, (ty + 1) * 32 + 22, 1), [tx, ty]); await sleep(400);
  await joystick(page, 0, -60, 700); await sleep(1600); await advance(page, { log: false });
  const st = await state(page);
  console.log(to, 'sidewalk map=', side.map, '→ up map=', st.map, st.x, st.y, st.map === to ? 'OK' : 'FAIL');
  await shot(page, `d1_${String(++i).padStart(2, '0')}_${to}`);
  await joystick(page, 0, 60, 1500); await sleep(1600); await advance(page, { log: false });
  const back = await state(page); console.log('  back →', back.map, back.x, back.y);
}
// 旅店二樓：梯子 → 床 → 睡到晚上
await page.evaluate(() => window.__mcv.G.world.placePlayer('inn_in', 10 * 32 + 16, 2 * 32 + 24, 1)); await sleep(1500);
await joystick(page, 0, -60, 500); await sleep(1600);
console.log('ladder →', (await state(page)).map); await shot(page, 'd1_10_inn2f');
await goNpc(page, 'inn_bed'); await sleep(600);
await advance(page, { choices: ['睡到晚上'] }); await sleep(2500); await advance(page, { log: false });
console.log('time after nap', await page.evaluate(() => window.__mcv.G.s.time)); await shot(page, 'd1_11_inn2f_night');
// 合唱團
await page.evaluate(() => window.__mcv.G.world.placePlayer('village', 12 * 32 + 20, 15 * 32 + 10, 1)); await sleep(1500); await advance(page, { log: false });
await goNpc(page, 'choir_bat'); await sleep(500); const ch = await advance(page);
console.log('choir sticker', await page.evaluate(() => window.__mcv.G.s.stickers.includes('plaza_night'))); await shot(page, 'd1_12_choir');
// 睡到早上，強制下雨
await page.evaluate(() => { Math.random = () => 0.1; window.__mcv.G.world.placePlayer('inn_2f', 4 * 32 + 16, 4 * 32 + 20, 1); }); await sleep(1500);
await goNpc(page, 'inn_bed'); await sleep(500); await advance(page, { choices: ['隔天早上'] }); await sleep(2500); await advance(page, { log: false });
console.log('after sleep', await page.evaluate(() => [window.__mcv.G.s.time, window.__mcv.G.s.weather]));
await page.evaluate(() => window.__mcv.G.world.placePlayer('village', 6 * 32 + 16, 11 * 32 + 26, 1)); await sleep(1800); await advance(page);
await shot(page, 'd1_13_rain');
await goNpc(page, 'toast'); await sleep(500); await advance(page);
console.log('rain sticker', await page.evaluate(() => window.__mcv.G.s.stickers.includes('rain_day')));
await goNpc(page, 'merchant'); await sleep(500); await advance(page);
// 長老之家的預言書頁
await page.evaluate(() => window.__mcv.G.world.placePlayer('elder_home', 2 * 32 + 16, 3 * 32 + 26, 1)); await sleep(1500);
console.log('glints in elder_home', await page.evaluate(() => window.__mcv.G.world.glints.map(g => g.def.id)));
console.log('errors', errors);
await browser.close();
