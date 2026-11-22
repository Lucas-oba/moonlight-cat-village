// 支線 1：跟阿栗在草原打 5 場（D2 加了羈絆累計，確認沒有壞掉）
import { launch, sleep, shot, advance, battle2, inBattle } from './lib.mjs';
const { browser, page, errors } = await launch((process.env.URL || 'http://localhost:4175/') + '?debug=1&skip=1');
await sleep(2500);
await page.evaluate(() => {
  const G = window.__mcv.G; const s = G.s;
  for (const q of ['main1','main2','main3','main4','main5','main6']) s.quests[q] = { status: 'done', prog: {}, seen: {} };
  Object.assign(s.flags, { system: true, catSpeech: true, tut_status: true, tut_quests: true, tut_party: true, seen_arrive: true, seen_meadow: true });
  s.inventory = { wooden_sword: 1, sticker_book: 1, cookie: 5 }; s.weapon = 'wooden_sword'; s.members.hero.lv = 6; s.time = 'day';
  G.load(s); G.exec({ type: 'rest' }); G.world.placePlayer('village', 10 * 32 + 16, 12 * 32 + 16, 0);
});
await sleep(1500); await advance(page, { log: false });
await page.evaluate(() => { window.__mcv.G.run('side1_start', 'ali'); }); await sleep(300); await advance(page, { log: false });
console.log('side1', await page.evaluate(() => window.__mcv.G.s.quests.side1));
await page.evaluate(() => window.__mcv.G.world.placePlayer('meadow', 14 * 32 + 16, 14 * 32 + 8, 0)); await sleep(1500); await advance(page, { log: false });
for (let k = 0; k < 7; k++) {
  const t0 = Date.now();
  await page.evaluate(() => { const w = window.__mcv.G.world; w.grassSteps = 99; const r = Math.random; Math.random = () => 0; try { w.onGrassStep(); } finally { Math.random = r; } });
  for (let i = 0; i < 20 && !(await inBattle(page)); i++) await sleep(200);
  if (!(await inBattle(page))) { console.log('no battle', k); await advance(page); continue; }
  await battle2(page, 'attack'); await sleep(800); await advance(page, { log: false });
  console.log('battle', k, Math.round((Date.now() - t0) / 1000) + 's', JSON.stringify(await page.evaluate(() => [window.__mcv.G.s.quests.side1.prog, window.__mcv.G.s.bonds, window.__mcv.G.s.map])));
  if (await page.evaluate(() => (window.__mcv.G.s.quests.side1.prog.patrol ?? 0) >= 5)) break;
}
await page.evaluate(() => window.__mcv.G.world.placePlayer('meadow', 17 * 32, 16 * 32 + 8, 0)); await sleep(1200);
await page.evaluate(() => window.__mcv.G.world.checkTriggers()); await sleep(600);
for (let i = 0; i < 8; i++) { await advance(page, { log: false, stopOn: () => inBattle(page) }); if (await inBattle(page)) { await battle2(page, 'attack'); await sleep(800); } else break; }
console.log('after chick', JSON.stringify(await page.evaluate(() => window.__mcv.G.s.quests.side1)));
const cur = await page.evaluate(() => { const { QUESTS, G } = window.__mcv; const st = G.s.quests.side1; return QUESTS.side1.objectives.find(o => !(st.prog[o.id] >= (o.count ?? 1)))?.id; });
if (cur === 'chick') { // 小雞旁邊的史萊姆：點牠們
  for (const id of ['cslime1', 'cslime2', 'cslime3', 'chick']) { await page.evaluate(id => { const w = window.__mcv.G.world; const n = w.npcs.find(n => n.def.id === id); if (n) w.doInteract({ kind: 'npc', def: n.def, spr: n.spr }); }, id); await sleep(400);
    for (let i = 0; i < 6; i++) { await advance(page, { log: false, stopOn: () => inBattle(page) }); if (await inBattle(page)) { await battle2(page, 'attack'); await sleep(800); } else break; } }
  console.log('after slimes', JSON.stringify(await page.evaluate(() => window.__mcv.G.s.quests.side1)));
}
await page.evaluate(() => window.__mcv.G.world.placePlayer('village', 10 * 32 + 16, 29 * 32, 1)); await sleep(1500); await advance(page, { log: false });
await page.evaluate(() => { const G = window.__mcv.G; const n = window.__mcv.NPCS.find(n => n.id === 'guard'); const r = n.talk.find(r => window.__mcv.check(G.s, r.when)); console.log(r.d); G.run(r.d, 'guard'); }); await sleep(300); await advance(page);
console.log('final', JSON.stringify(await page.evaluate(() => window.__mcv.G.s.quests.side1)));
await shot(page, 'p19_side1');
console.log('errors', errors); await browser.close();
