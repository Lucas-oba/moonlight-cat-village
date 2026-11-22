// 支線10：柚子入隊、戰鬥中換人、阿栗「我來擋！」
import { launch, sleep, shot, state, advance, play, warp, tapNpc, tapGlint, goNpc, inBattle } from './lib.mjs';
const T = 32; const c = n => n * T + 16;
const { browser, page, errors } = await launch('http://localhost:4173/?debug=1&skip=1');
await sleep(2500);
await page.evaluate(() => {
  const G = window.__mcv.G; const s = G.s;
  for (const q of ['main1','main2','main3','main4','main5','main6','side2','main7','main8','main9','main10','side1','side5','side3','side10']) s.quests[q] = { status: 'done', prog: {}, seen: {} };
  Object.assign(s.flags, { system: true, catSpeech: true, tut_status: true, tut_quests: true, tut_party: true, seen_arrive: true, seen_meadow: true, forest_open: true, choiceA: true, herb_shop: true, seen_m9_enter: true, seen_m10: true });
  s.weapon = 'wooden_sword'; s.inventory = { wooden_sword: 1, cookie: 5, herb_candy: 3 }; s.money = 300; s.time = 'day';
  s.members.hero.lv = 6; G.ensureMember('ali'); G.ensureMember('mint'); s.members.ali.joined = true; s.members.mint.joined = true; s.members.ali.lv = 6; s.members.mint.lv = 6; s.party = ['hero', 'ali', 'mint']; G.ensureMember('yuzu'); s.members.yuzu.joined = true; s.members.yuzu.lv = 6;
  G.load(s); G.exec({ type: 'rest' }); G.world.placePlayer('village', 17 * 32 + 16, 11 * 32 + 16, 0);
});
await sleep(1500); await advance(page);
// 戰鬥中換人 + 我來擋！
await page.evaluate(() => { const G = window.__mcv.G; G.s.skills = { ...(G.s.skills || {}), brave_roar: true }; G.exec({ type: 'battle', encounter: 'ali_wolves' }); });
for (let i = 0; i < 40 && !(await inBattle(page)); i++) await sleep(250); console.log('inBattle', await inBattle(page));
let swapped = false, guarded = false, k = 0; const heroName = await page.evaluate(() => window.__mcv.G.s.name);
for (let i = 0; i < 900; i++) {
  if (!(await inBattle(page))) { await sleep(300); if (!(await inBattle(page))) break; }
  if (await page.$('.dlg:not(.hidden)')) { await page.click('.dlg-box').catch(() => {}); await sleep(150); continue; }
  const btns = await page.$$('.cmds button');
  if (btns.length >= 6) {
    const msg = (await page.textContent('.bmsg')) || '';
    if (!swapped && msg.startsWith('薄荷')) {
      await page.click('.cmds button:has-text("換人")'); await sleep(300); await shot(page, '83_swap_menu');
      const b = await page.$('.sublist button:has-text("柚子")'); console.log('swap btn', !!b); if (b) { await b.click(); swapped = true; await sleep(800); await shot(page, '84_swapped'); continue; }
    }
    if (!guarded && msg.startsWith('阿栗')) {
      await page.click('.cmds button:has-text("技能")'); await sleep(300);
      const b = await page.$('.sublist button:has-text("我來擋"):not([disabled])'); console.log('guard btn', !!b);
      if (b) { await b.click(); await sleep(200); const t = await page.$$('.sublist button:not(.back):not([disabled])'); if (t.length) await t[0].click(); guarded = true; await sleep(600); await shot(page, '85_guard'); continue; }
      await page.click('.sublist button.back').catch(() => {});
    }
    await page.click('.cmds button:has-text("攻擊")'); await sleep(200);
    for (let j = 0; j < 3; j++) { const sub = await page.$$('.sublist button:not(.back):not([disabled])'); if (!sub.length) break; await sub[0].click(); await sleep(200); }
    continue;
  }
  if (await page.$('.bmsg')) await page.click('.bmsg').catch(() => {});
  await sleep(150);
}
await advance(page);
console.log('swapped', swapped, 'guarded', guarded, 'party', await page.evaluate(() => window.__mcv.G.s.party));
console.log('errors', errors);
await browser.close();
