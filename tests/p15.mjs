// Milestone D2：羈絆、旅店營火對話、送禮、羈絆任務解鎖、服裝、風景點
import { launch, sleep, shot, state, advance, goNpc, goGlint } from './lib.mjs';
const { browser, page, errors } = await launch('http://localhost:4173/?debug=1&skip=1');
await sleep(2500);
await page.evaluate(() => {
  const G = window.__mcv.G; const s = G.s;
  for (const q of ['main1','main2','main3','main4','main5','main6','side1','side3','side2','main7','main8','main9','main10','side10']) s.quests[q] = { status: 'done', prog: {}, seen: {} };
  Object.assign(s.flags, { system: true, catSpeech: true, tut_status: true, tut_quests: true, tut_party: true, seen_arrive: true, seen_meadow: true, forest_open: true, v_md: true, v_mn: true, v_fo: true });
  for (const id of ['ali', 'mint', 'yuzu']) { G.ensureMember(id); s.members[id].joined = true; s.members[id].lv = 6; }
  s.party = ['hero', 'mint']; s.inventory = { wooden_sword: 1, sticker_book: 1, cookie: 3, moon_flower: 1, cat_ears: 1, raincoat: 1 }; s.weapon = 'wooden_sword';
  s.flags.party_outfit = true; s.time = 'day'; s.observation = 7;
  G.load(s); G.world.placePlayer('village', 5 * 32 + 16, 13 * 32 + 20, 1);
});
await sleep(1500); await advance(page, { log: false });
await page.evaluate(() => { window.__mcv.G.world.onGrassStep = () => {}; });
const info = () => page.evaluate(() => { const s = window.__mcv.G.s; return { bonds: s.bonds, side11: s.quests.side11?.status, side12: s.quests.side12?.status, it: Object.keys(s.flags).filter(k => k.startsWith('it_')), gifts: Object.keys(s.flags).filter(k => k.startsWith('gift_t_') && s.flags[k]) }; });
console.log('start', JSON.stringify(await info()));
// 送禮（阿栗：小魚乾餅乾）
await goNpc(page, 'ali'); await sleep(500); await advance(page, { choices: ['送給她'] });
console.log('after gift', JSON.stringify(await info()));
await goNpc(page, 'ali'); await sleep(500); const again = await advance(page, { log: false }); console.log('ali again (no gift prompt):', again.join(' | ').slice(0, 120));
await page.evaluate(() => { const G = window.__mcv.G; G.s.party = ['hero', 'ali', 'mint']; G.world.refreshWorld(); });
// 旅店休息 → 營火對話
for (let i = 0; i < 3; i++) {
  await goNpc(page, 'innkeeper'); await sleep(500); await advance(page, { choices: ['休息並存檔'] }); await sleep(800); await advance(page, { log: false });
  console.log('rest', i, JSON.stringify(await info()));
}
await shot(page, 'd2_01_after_rests');
// 一起打贏 5 場
await page.evaluate(async () => { const G = window.__mcv.G; for (let i = 0; i < 5; i++) { const w = (G.s.bondWins ??= {}); for (const id of ['ali', 'mint']) { w[id] = (w[id] ?? 0) + 1; if (w[id] % 5 === 0) G.bondUp(id); } } });
await sleep(500); console.log('after 5 wins', JSON.stringify(await info()));
// 隊伍頁（愛心）與屬性頁（服裝）
await page.evaluate(() => { window.__mcv.G.ui.openPanel('party'); }); await sleep(800); await shot(page, 'd2_02_party_bonds');
await page.click('.sys-tabs button:has-text("屬性")'); await sleep(400);
for (const n of ['貓耳髮箍', '月光雨衣', '夥伴月光宴會裝']) { await page.click(`.outfit-row button:has-text("${n}")`); await sleep(300); }
await shot(page, 'd2_03_status_outfits');
console.log('outfit', await page.evaluate(() => [window.__mcv.G.s.outfit, window.__mcv.G.s.feast, window.__mcv.G.world.player.texture.key]));
await page.click('.sys-head .x'); await sleep(600);
await page.evaluate(() => window.__mcv.G.world.placePlayer('village', 12 * 32 + 16, 16 * 32 + 10, 0)); await sleep(1200); await shot(page, 'd2_04_outfits_map');
// 風景點：鐘樓
await goGlint(page, 'v_bell'); await sleep(400); await advance(page);
// 最高的大樹
await page.evaluate(() => window.__mcv.G.world.placePlayer('forest', 18 * 32 + 16, 32 * 32 + 10, 1)); await sleep(1800); await advance(page, { log: false });
console.log('forest glints', await page.evaluate(() => window.__mcv.G.world.glints.map(g => g.def.id)));
await goGlint(page, 'v_tree'); await sleep(400); await advance(page);
await goGlint(page, 'v_nest'); await sleep(400); await advance(page);
console.log('stickers', await page.evaluate(() => ['bell_view', 'tallest_tree', 'birdnest'].map(k => window.__mcv.G.s.stickers.includes(k))));
console.log('errors', errors);
await browser.close();
