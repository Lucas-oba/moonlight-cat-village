import fs from 'fs';
import { launch, shot, sleep, advance, state, tapTo, tapNpc, tapGlint, joystick, battle, inBattle } from './lib.mjs';
const { browser, page, errors } = await launch('http://localhost:4173/?debug=1');
await page.evaluate(s => localStorage.setItem('mcv_save_v1', s), fs.readFileSync('/tmp/ckpt_found.json', 'utf8'));
await page.reload(); await sleep(2500);
await page.click('text=繼續遊戲'); await sleep(1500);
const q = async (l) => { const s = await state(page); console.log(`== ${l}`, JSON.stringify(s.quests).replace(/"main[1-5]":"done:[^"]*",/g, ''), 'lv', s.lv, 'exp', s.exp, 'hp', s.hp, '$', s.money, 'cou', s.courage, 'obs', s.obs, s.map, s.x, s.y, 'busy', s.busy); };
await q('loaded'); await shot(page, '23_meadow_loaded');
// 隨機遇敵：在草叢來回走，用「對話」
let talked = 0;
for (let k = 0; k < 30 && talked < 1; k++) {
  await tapTo(page, k % 2 ? 2 * 32 + 16 : 6 * 32 + 16, 9 * 32 + 16, 10);
  if (await inBattle(page)) { await sleep(1500); await shot(page, '24_random_battle'); await battle(page, ['talk', 'talk', 'talk', 'attack'], { 2: '25_talk_try' }); await advance(page); talked++; }
}
await q('after random');
// 戰鬥失敗
await page.evaluate(() => { const G = window.__mcv.G; G.s.members.hero.hp = 1; G.ui.refresh(); });
let lost = false;
for (let k = 0; k < 30 && !lost; k++) {
  await tapTo(page, k % 2 ? 2 * 32 + 16 : 6 * 32 + 16, 9 * 32 + 16, 10);
  if (await inBattle(page)) { await battle(page, ['defend']); await sleep(1500); await shot(page, '26_rescue'); await advance(page, { stopOn: async () => !!(await page.$('.reward')) }); await shot(page, '27_rescue_reward'); await advance(page); lost = true; }
}
await q('after lose'); await shot(page, '28_after_lose');
// 帶豆花回家
await tapNpc(page, 'mochimom'); await advance(page);
await q('side2'); await shot(page, '29_side2_done');
await tapNpc(page, 'douhua'); await advance(page);
// 系統面板：任務日誌（支線）
await page.click('.sys-btn'); await sleep(500); await page.click('.sys-tabs button:has-text("任務日誌")'); await sleep(300); await page.click('.sub-tabs button:has-text("支線")'); await sleep(300); await shot(page, '30_questlog_side');
await page.click('.sys-tabs button:has-text("道具")'); await sleep(300); await shot(page, '31_items'); await page.click('.sys-head .x'); await sleep(300);
// 存檔、重新載入
await page.click('.sys-btn'); await sleep(400); await page.click('#btn-save'); await sleep(400); await page.click('.sys-head .x');
const before = await state(page);
await page.reload(); await sleep(2500); await shot(page, '32_title_after_save'); await page.click('text=繼續遊戲'); await sleep(1500);
const after = await state(page);
console.log('save/load match:', JSON.stringify(before.quests) === JSON.stringify(after.quests), before.lv === after.lv, before.money === after.money, before.x, after.x, before.y, after.y, before.map, after.map);
await q('reloaded'); await shot(page, '33_reloaded');
console.log('errors', errors);
await browser.close();
