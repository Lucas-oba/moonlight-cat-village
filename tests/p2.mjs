import { launch, shot, sleep, advance, state, tapTo, tapNpc, tapGlint, joystick, battle, inBattle } from './lib.mjs';
const { browser, page, errors } = await launch('http://localhost:4173/?debug=1&skip=1');
await page.evaluate(() => localStorage.clear());
await sleep(2500); await advance(page);
const q = async (l) => { const s = await state(page); console.log(`== ${l}`, JSON.stringify(s.quests), 'lv', s.lv, 'exp', s.exp, '$', s.money, 'cou', s.courage, 'obs', s.obs, s.map, s.x, s.y); };
// 主線 2
await tapTo(page, 352, 520); await sleep(500); await q('reach plaza');
await tapNpc(page, 'merchant'); await shot(page, '08_meow_dialogue'); await advance(page);
await tapNpc(page, 'innkeeper'); await advance(page);
await tapNpc(page, 'farmer'); await advance(page);
await q('talk3');
await tapNpc(page, 'elder'); await advance(page, { stopOn: async () => (await page.textContent('.dlg-box').catch(()=>'')).includes('月亮蛋糕') }); await shot(page, '09_elder_cake'); await advance(page);
await q('main2 done');
// 主線 3
await tapNpc(page, 'guard'); await advance(page, { stopOn: async () => !!(await page.$('.activate')) });
await sleep(3200); await shot(page, '10_system_activate'); await page.click('.activate'); await sleep(300);
await advance(page, { stopOn: async () => !!(await page.$('.sys-wrap')) }); await sleep(500); await shot(page, '11_status_panel');
await advance(page);
await q('main3 done');
// 主線 4
await tapNpc(page, 'elder'); await advance(page, { stopOn: async () => !!(await page.$('.sys-wrap')) }); await sleep(500); await shot(page, '12_quest_log');
await advance(page, { stopOn: async () => !!(await page.$('.reward')) }); await shot(page, '13_quest_reward');
await advance(page); await sleep(800);
await q('main4 done'); await shot(page, '14_morning');
// 主線 5（先等早晨過場完全結束，避免點擊被吃掉）
for (let i = 0; i < 80; i++) { if ((await state(page)).busy === 0 && !(await page.$('.dlg-box'))) break; await advance(page); await sleep(250); }
await sleep(600);
await tapNpc(page, 'merchant'); await advance(page, { choices: ['買一個'] });
await tapNpc(page, 'innkeeper'); await advance(page, { choices: ['休息並存檔'] });
await tapNpc(page, 'farmer'); await advance(page);
await tapGlint(page, 'fountain_paw'); await advance(page);
await q('main5 done'); await shot(page, '15_after_main5');
console.log('saved?', await page.evaluate(() => !!localStorage.getItem('mcv_save_v1')));
await page.evaluate(() => window.__mcv.G.save()); const fs = await import('fs'); fs.writeFileSync('/tmp/ckpt_main5.json', await page.evaluate(() => localStorage.getItem('mcv_save_v1')));
console.log('errors', errors);
await browser.close();
