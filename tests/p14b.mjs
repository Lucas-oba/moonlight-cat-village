import { launch, sleep, shot, advance } from './lib.mjs';
const { browser, page, errors } = await launch('http://localhost:4173/?debug=1&skip=1');
await sleep(2500);
await page.evaluate(() => { const G = window.__mcv.G; const s = G.s;
  for (const q of ['main1','main2','main3','main4','main5','main6']) s.quests[q] = { status: 'done', prog: {}, seen: {} };
  Object.assign(s.flags, { system: true, catSpeech: true, tut_status: true, tut_quests: true, seen_arrive: true }); s.time = 'day'; G.load(s); });
await sleep(1200);
for (const [m, x, y] of [['elder_home', 144, 214], ['inn_in', 176, 246], ['inn_2f', 144, 150], ['weave_in', 144, 214], ['windmill', 176, 328], ['mochi_home', 144, 214]]) {
  await page.evaluate(([m, x, y]) => window.__mcv.G.world.placePlayer(m, x, y, 1), [m, x, y]); await sleep(1500); await advance(page, { log: false });
  await shot(page, 'd1b_' + m);
}
console.log('errors', errors); await browser.close();
