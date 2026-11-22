import fs from 'fs';
import { launch, shot, sleep, advance, state, tapTo, tapNpc, tapGlint, joystick, battle, inBattle } from './lib.mjs';
const { browser, page, errors } = await launch('http://localhost:4173/?debug=1');
await page.evaluate(s => localStorage.setItem('mcv_save_v1', s), fs.readFileSync('/tmp/ckpt_main5.json', 'utf8'));
await page.reload(); await sleep(2500);
await shot(page, '16_title_continue');
await page.click('text=繼續遊戲'); await sleep(1500);
const q = async (l) => { const s = await state(page); console.log(`== ${l}`, JSON.stringify(s.quests), 'lv', s.lv, 'exp', s.exp, 'hp', s.hp, '$', s.money, 'cou', s.courage, 'obs', s.obs, s.map, s.x, s.y, 'busy', s.busy); };
await q('loaded');
await tapNpc(page, 'merchant'); await advance(page, { choices: ['買一個'] });
await tapNpc(page, 'farmer'); await advance(page);
await tapGlint(page, 'fountain_paw'); await advance(page);
await q('main5');
await tapNpc(page, 'mochimom'); await shot(page, '17_side2_start'); await advance(page, { choices: ['我幫妳找'] });
await tapNpc(page, 'farmer'); await advance(page);
await tapGlint(page, 'garden_prints'); await advance(page);
await tapNpc(page, 'guard'); await advance(page);
await q('main6 guard');
await tapNpc(page, 'farmer'); await advance(page);
await tapNpc(page, 'merchant'); await advance(page);
await tapNpc(page, 'innkeeper'); await advance(page);
await q('side2 ask');
fs.writeFileSync('/tmp/ckpt_main6.json', await page.evaluate(() => { const G = window.__mcv.G; return JSON.stringify(Object.assign({}, G.s, G.world.playerPos())); }));
// 去草原
await tapTo(page, 336, 1000); await sleep(1500); await advance(page);
await q('meadow'); await shot(page, '18_meadow');
// 教學戰鬥
for (const [i, strat] of [[1, ['attack', 'defend', 'item', 'attack']], [2, ['skill', 'attack']], [3, ['talk']]]) {
  for (let k = 0; k < 8 && !(await inBattle(page)); k++) { await advance(page, { log: false }); await tapTo(page, k % 2 ? 7 * 32 : 4 * 32 + 16, 4 * 32 + 16, 10); await advance(page, { log: false }); }
  await sleep(800);
  await battle(page, strat, { 1: `19_battle_tut${i}`, 2: i === 2 ? '20_battle_two' : undefined });
  await sleep(800); await advance(page);
  await q('after tut' + i);
}
await shot(page, '21_after_tutorials');
for (const id of ['fp1', 'fp2', 'fp3']) { const ok = await tapGlint(page, id).catch(e => console.log(e.message)); await advance(page); if (await inBattle(page)) { await battle(page, ['attack']); await advance(page); await tapGlint(page, id).catch(e => console.log(e.message)); await advance(page); } }
await q('main6 prints'); await shot(page, '22_main6_done');
// 找豆花
for (let k = 0; k < 4; k++) { try { await tapGlint(page, 'douhua_hide'); await advance(page); } catch (e) { console.log(e.message); } if (await inBattle(page)) { await battle(page, ['talk']); await advance(page); continue; } break; }
await q('douhua found');
fs.writeFileSync('/tmp/ckpt_found.json', await page.evaluate(() => { const G = window.__mcv.G; return JSON.stringify(Object.assign({}, G.s, G.world.playerPos())); }));
console.log('errors', errors);
await browser.close();
