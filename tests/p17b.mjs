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
await page.evaluate(() => window.__mcv.G.world.placePlayer('forest', 4 * 32 + 16, 28 * 32 + 20, 0)); await sleep(1200);
console.log('toast', await page.evaluate(() => document.body.innerText.includes('胸針閃了一下')), 'hidden here', await page.evaluate(() => { const m = window.__mcv; return m.GLINTS.filter(g => g.map === 'forest' && g.obs > m.G.s.observation).map(g => g.id); }));
await page.evaluate(() => window.__mcv.G.world.checkTriggers?.()); await sleep(800);
await advance(page, { max: 30 });
console.log('gobwrite', await page.evaluate(() => !!window.__mcv.G.s.flags.ev_gobwrite), await page.evaluate(() => window.__mcv.TRIGGERS.find(t => t.id === 'ev_gobwrite')));
console.log('errors', errors); await browser.close();
