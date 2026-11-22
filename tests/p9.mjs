// 第二階段 Milestone A：支線 1、5 招募 + 主線 7～12 全流程
import { launch, sleep, shot, state, advance, play, warp, tapNpc, battle2 } from './lib.mjs';
const T = 32; const c = n => n * T + 16;
const { browser, page, errors } = await launch('http://localhost:4173/?debug=1&skip=1');
await sleep(2500);
await page.evaluate(() => {
  const G = window.__mcv.G; const s = G.s;
  for (const q of ['main1', 'main2', 'main3', 'main4', 'main5', 'main6', 'side2']) s.quests[q] = { status: 'done', prog: {}, seen: {} };
  Object.assign(s.flags, { system: true, catSpeech: true, tut_status: true, tut_quests: true, seen_arrive: true, seen_meadow: true });
  s.weapon = 'wooden_sword'; s.inventory = { wooden_sword: 1, cookie: 5, sticker_book: 1 }; s.money = 120; s.time = 'day';
  s.members.hero.lv = 4; s.members.hero.hp = 50; s.members.hero.mp = 14; s.courage = 4; s.observation = 4;
  G.load(s); G.world.placePlayer('village', 17 * 32 + 16, 9 * 32, 1);
});
await sleep(1200); await advance(page, { log: false });
const q = async () => (await state(page)).quests;
const followers = () => page.evaluate(() => window.__mcv.G.world.followers.map(f => f.def.id));
let st = await q(); console.log('start', st.main7, st.side1, st.side5);
await shot(page, '60_ali_training');
// ---- 支線 1 ----
await tapNpc(page, 'ali'); await play(page, { choices: ['好啊'] });
console.log('guest', await page.evaluate(() => window.__mcv.G.s.guest), 'followers', await followers());
await shot(page, '61_ali_follows');
await warp(page, 'meadow', c(12), c(10));
for (let i = 0; i < 5; i++) { await page.evaluate(() => { void window.__startBattle('meadow_grass', false); }); await sleep(1500); await battle2(page, i % 2 ? 'talk' : 'attack', i === 0 ? { 1: '62_party_battle_ali' } : {}); await sleep(600); }
console.log('side1', (await q()).side1);
await warp(page, 'meadow', c(14), c(17)); await play(page, { choices: ['一起上'] });
console.log('side1', (await q()).side1);
await warp(page, 'village', c(12), c(28)); await tapNpc(page, 'guard'); await play(page);
console.log('side1', (await q()).side1, 'party', await page.evaluate(() => window.__mcv.G.s.party));
// ---- 主線 7 ----
await warp(page, 'meadow', c(18), c(6)); await sleep(500); await shot(page, '63_gugu_cabbage');
await play(page, { hero: 'talk' });
console.log('main7', (await q()).main7, 'flag talked', await page.evaluate(() => window.__mcv.G.s.flags.gugu_talked));
await shot(page, '64_whitecat_rock');
await warp(page, 'village', c(12), c(28)); await tapNpc(page, 'guard'); await play(page);
st = await q(); console.log('main7', st.main7, 'main8', st.main8);
// ---- 主線 8 + 支線 5 ----
await warp(page, 'village', c(5), c(9)); await tapNpc(page, 'elder'); await play(page);
await warp(page, 'village', c(12), c(28)); await tapNpc(page, 'guard'); await play(page);
console.log('main8', (await q()).main8);
await warp(page, 'village', c(6), c(26)); await sleep(400); await tapNpc(page, 'ginkgo'); await play(page, { choices: ['我去找她'] });
await warp(page, 'meadow', c(4), c(9)); await sleep(300); await shot(page, '65_mint_in_tree');
await warp(page, 'meadow', c(4), c(7)); await play(page);
console.log('side5', (await q()).side5, 'followers', await followers());
await warp(page, 'village', c(6), c(26)); await sleep(400); await shot(page, '66_mint_follow_home');
await tapNpc(page, 'ginkgo'); await play(page);
console.log('side5', (await q()).side5, 'party', await page.evaluate(() => window.__mcv.G.s.party));
await tapNpc(page, 'ginkgo'); await sleep(800); await advance(page, { log: false, stopOn: async () => !!(await page.$('.sys-panel.shop')) });
await shot(page, '67_herb_shop'); await page.click('.sys-panel.shop .x').catch(() => {}); await sleep(300); await advance(page, { log: false });
await warp(page, 'meadow', c(12), c(15)); await sleep(300);
await warp(page, 'meadow', c(12), c(18)); await sleep(800);
await advance(page, { log: true, stopOn: async () => !!(await page.$('.sys-wrap')) });
await shot(page, '68_party_panel'); await play(page);
st = await q(); console.log('main8', st.main8, 'main9', st.main9, 'forest_open', await page.evaluate(() => window.__mcv.G.s.flags.forest_open));
// ---- 主線 9 ----
await warp(page, 'forest', c(11), c(1)); await sleep(600); await play(page);
await shot(page, '69_forest_entrance');
await page.evaluate(() => { const w = window.__mcv.G.world; w.onGrassStep = () => {}; });
await warp(page, 'forest', c(11), c(14)); await sleep(500);
await warp(page, 'forest', c(11), c(19)); await sleep(500); await shot(page, '70_sprout_wolves');
await warp(page, 'forest', c(13), c(20)); await play(page, { shots: { 1: '71_wolves_battle' } });
st = await q(); console.log('main9', st.main9, 'main10', st.main10, 'followers', await followers());
// ---- 主線 10 ----
await warp(page, 'forest', c(10), c(24)); await sleep(500);
await warp(page, 'forest', c(9), c(29)); await play(page); await shot(page, '72_goblin_camp');
for (const g of ['gob1', 'gob2', 'gob3']) { await tapNpc(page, g); await play(page, { log: false }); }
await tapNpc(page, 'chief'); await play(page, { choices: ['把菜還給'] });
st = await q(); console.log('main10', st.main10, 'main11', st.main11, 'choiceA', await page.evaluate(() => window.__mcv.G.s.flags.choiceA));
await tapNpc(page, 'campfire'); await play(page, { choices: ['坐下來'] });
// ---- 主線 11 頭目 ----
await page.evaluate(() => { const s = window.__mcv.G.s; for (const id of ['hero', 'ali', 'mint']) { s.members[id].lv = 6; } window.__mcv.G.exec({ type: 'rest' }); });
await warp(page, 'forest', c(11), c(35)); await sleep(500); await shot(page, '73_rock_boss_map');
await warp(page, 'forest', c(11), c(38));
await play(page, { hero: t => (t <= 5 ? "attack" : "talk"), shots: { 1: '74_boss_battle', 7: '75_boss_late' } });
st = await state(page); console.log('main11', st.quests.main11, 'main12', st.quests.main12, 'map', st.map, 'talked', await page.evaluate(() => window.__mcv.G.s.flags.boss_talked));
// ---- 主線 12 ----
await warp(page, 'village', c(10), c(12)); await play(page); await shot(page, '76_moon_feast');
await tapNpc(page, 'elder'); await play(page);
await warp(page, 'village', c(6), c(6)); await sleep(500); await shot(page, '77_whitecat_roof');
await tapNpc(page, 'whitecat'); await play(page);
st = await q(); console.log('main12', st.main12);
await warp(page, 'meadow', c(12), c(13)); await sleep(500); await shot(page, '78_paw_trail');
await warp(page, 'meadow', c(12), c(17));
await advance(page, { log: true, stopOn: async () => !!(await page.$('.chap-end')) });
await sleep(4000); await shot(page, '79_chapter_end');
await page.click('.chap-end .big-btn').catch(e => console.log('no btn', e.message)); await sleep(800); await advance(page, { log: true });
st = await state(page); console.log('final', st.quests.main12, 'lv', st.lv, 'chapterDone', await page.evaluate(() => window.__mcv.G.s.chapterDone));
await shot(page, '80_after_chapter');
console.log('errors', errors);
await browser.close();
