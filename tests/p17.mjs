// 村莊小事件補完
import { launch, sleep, shot, state, advance, goNpc, goGlint, battle2, inBattle } from './lib.mjs';
const { browser, page, errors } = await launch('http://localhost:4173/?debug=1&skip=1');
await sleep(2500);
await page.evaluate(() => {
  const G = window.__mcv.G; const s = G.s;
  for (const q of ['main1','main2','main3','main4','main5','main6','side2','side6','main7','main8','main9','main10','main11','main12','side7','side17','side12','side1','side5']) s.quests[q] = { status: 'done', prog: {}, seen: {} };
  Object.assign(s.flags, { system: true, catSpeech: true, tut_status: true, tut_quests: true, tut_party: true, seen_arrive: true, seen_meadow: true, forest_open: true, choiceA: true, orchard_open: true, v_md: true, v_mn: true, v_fo: true, story1: true, story2: true });
  for (const id of ['ali', 'mint']) { G.ensureMember(id); s.members[id].joined = true; s.members[id].lv = 7; }
  s.members.hero.lv = 7; s.party = ['hero', 'ali', 'mint'];
  s.inventory = { wooden_sword: 1, sticker_book: 1, collector_pin: 1, jelly: 5, silver_fish: 1 }; s.weapon = 'wooden_sword'; s.money = 100; s.time = 'day'; s.weather = 'clear'; s.observation = 3; s.feast = false; s.flags.chapter_end = true;
  G.load(s); G.world.placePlayer('village', 22 * 32 + 16, 16 * 32 + 20, 1);
});
await sleep(1500); await advance(page, { log: false });
await page.evaluate(() => { window.__mcv.G.world.onGrassStep = () => {}; });
const glints = () => page.evaluate(() => window.__mcv.G.world.glints.map(g => g.def.id));
console.log('village glints', await glints());
await goGlint(page, 'fishdry'); await sleep(300); await advance(page);
console.log('cookie', await page.evaluate(() => window.__mcv.G.s.inventory.cookie), 'glints after', await glints());
// 種田事件（走進農田區）
await page.evaluate(() => { const w = window.__mcv.G.world; w.placePlayer('village', 18 * 32 + 16, 16 * 32 + 20, 0); }); await sleep(1500); await page.evaluate(() => window.__mcv.G.world.checkTriggers()); await sleep(500); await advance(page);
console.log('sweet_potato', await page.evaluate(() => window.__mcv.G.s.inventory.sweet_potato));
// 守衛練習
const talk = id => page.evaluate(id => { const G = window.__mcv.G; const n = window.__mcv.NPCS?.[id] ?? G.world.npcs.find(x => x.def.id === id)?.def; const r = n.talk.find(r => window.__mcv.check ? window.__mcv.check(G.s, r.when) : true); console.log('rule', r?.d); G.run(r.d); return r?.d; }, id);
console.log('guard rule', await talk('guard')); await sleep(500);
await advance(page, { choices: ['來練習'], stopOn: () => inBattle(page) });
if (await inBattle(page)) { await shot(page, 'd2_06_spar'); await battle2(page, 'attack'); await sleep(1500); }
await advance(page);
console.log('after spar money', await page.evaluate(() => [window.__mcv.G.s.money, window.__mcv.G.s.map, window.__mcv.G.s.flags.daily_spar]));
// 新的一天 + 特價
await page.evaluate(() => { Math.random = () => 0.1; window.__mcv.G.exec({ type: 'newDay' }); });
console.log('flags after newDay', await page.evaluate(() => Object.keys(window.__mcv.G.s.flags).filter(k => k.startsWith('daily_'))));
// 說書 3～5（晚上）
console.log('T1'); await page.evaluate(() => { window.__mcv.G.exec({ type: 'time', v: 'night' }); }); await sleep(500);
await page.evaluate(() => { window.__mcv.G.run('elder_story'); }); await sleep(300); await advance(page);
console.log('stories', await page.evaluate(() => ['story3', 'story4', 'story5'].map(k => !!window.__mcv.G.s.flags[k])));
await page.evaluate(() => window.__mcv.G.exec({ type: 'time', v: 'day' }));
// 豆花畫展
await page.evaluate(() => { window.__mcv.G.run('douhua_gallery'); }); await sleep(300); await advance(page);
console.log('douhua_art', await page.evaluate(() => window.__mcv.G.s.stickers.includes('douhua_art')));
// 果園、草原：重新出現的月光莓／銀光小魚
await page.evaluate(() => window.__mcv.G.world.placePlayer('orchard', 6 * 32 + 16, 8 * 32 + 8, 1)); await sleep(1500); await advance(page, { log: false });
console.log('orchard glints', await glints());
await page.evaluate(() => window.__mcv.G.world.placePlayer('meadow', 14 * 32 + 16, 14 * 32 + 8, 1)); await sleep(1500); await advance(page, { log: false });
console.log('meadow glints', await glints()); await shot(page, 'd2_08_meadow_pin');
await goGlint(page, 'fish_again'); await sleep(300); await advance(page);
// 交換小攤
await page.evaluate(() => { window.__mcv.G.exec({ type: 'trade' }); }); await sleep(600);
console.log('trades', await page.$$eval('.sys-wrap .inv-row b', e => e.map(x => x.textContent))); await shot(page, 'd2_09_trade');
await page.evaluate(() => [...document.querySelectorAll('.sys-head .x')].forEach(b => b.click()));
// 哥布林學寫字
await page.evaluate(() => window.__mcv.G.world.placePlayer('forest', 4 * 32 + 16, 28 * 32 + 20, 0)); await sleep(1800); await advance(page);
console.log('gobwrite', await page.evaluate(() => !!window.__mcv.G.s.flags.ev_gobwrite));
console.log('errors', errors); await browser.close();
