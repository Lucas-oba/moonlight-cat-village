// 支線10：柚子入隊、戰鬥中換人、阿栗「我來擋！」
import { launch, sleep, shot, state, advance, play, warp, tapNpc, tapGlint, goNpc, inBattle } from './lib.mjs';
const T = 32; const c = n => n * T + 16;
const { browser, page, errors } = await launch('http://localhost:4173/?debug=1&skip=1');
await sleep(2500);
await page.evaluate(() => {
  const G = window.__mcv.G; const s = G.s;
  for (const q of ['main1','main2','main3','main4','main5','main6','side2','main7','main8','main9','main10','side1','side5','side3']) s.quests[q] = { status: 'done', prog: {}, seen: {} };
  Object.assign(s.flags, { system: true, catSpeech: true, tut_status: true, tut_quests: true, tut_party: true, seen_arrive: true, seen_meadow: true, forest_open: true, choiceA: true, herb_shop: true, seen_m9_enter: true, seen_m10: true });
  s.weapon = 'wooden_sword'; s.inventory = { wooden_sword: 1, cookie: 5, herb_candy: 3 }; s.money = 300; s.time = 'day';
  s.members.hero.lv = 6; G.ensureMember('ali'); G.ensureMember('mint'); s.members.ali.joined = true; s.members.mint.joined = true; s.members.ali.lv = 6; s.members.mint.lv = 6; s.party = ['hero', 'ali', 'mint'];
  G.load(s); G.exec({ type: 'rest' }); G.world.placePlayer('village', 17 * 32 + 16, 11 * 32 + 16, 0);
});
await sleep(1500); await advance(page);
const q = async () => (await state(page)).quests.side10;
console.log('side10 before', await q());
await goNpc(page, 'yuzu'); await play(page, { choices: ['好啊'] }); console.log('start', await q());
await sleep(500); await shot(page, '81_yuzu_follow');
for (let k = 0; k < 3; k++) { await goNpc(page, 'elder'); await play(page); if (await page.evaluate(() => window.__mcv.G.s.flags.mail_elder)) break; console.log('retry elder'); } console.log('elder', await q());
await goNpc(page, 'cotton'); await play(page); console.log('cotton', await q());
for (let k = 0; k < 3; k++) { await goNpc(page, 'mailbox'); await play(page); if (await page.evaluate(() => window.__mcv.G.s.flags.mail_blown)) break; console.log('retry mailbox'); }
console.log('box blown', await q());
for (let k = 0; k < 3; k++) { await tapGlint(page, 'mailtree').catch(e => console.log(e.message)); await play(page); if (await page.evaluate(() => window.__mcv.G.s.flags.mail_got)) break; console.log('retry glint'); }
await tapNpc(page, 'mailbox'); await play(page); console.log('box', await q());
await goNpc(page, 'nori'); await play(page); console.log('nori', await q());
await page.evaluate(() => { window.__mcv.G.world.onGrassStep = () => {}; });
await warp(page, 'forest', c(6), c(20)); await warp(page, 'forest', c(6), c(24)); await sleep(800);
await play(page); console.log('bat', await q(), await page.evaluate(() => window.__mcv.G.s.flags.mail_bat));
await goNpc(page, 'gugu'); await play(page); console.log('gugu', await q());
const st = await page.evaluate(() => ({ party: window.__mcv.G.s.party, guest: window.__mcv.G.s.guest, yuzu: window.__mcv.G.s.members.yuzu }));
console.log('after recruit', JSON.stringify(st), 'side10', await q());
await shot(page, '82_after_recruit');
// 戰鬥中換人 + 我來擋！
await page.evaluate(() => { const G = window.__mcv.G; G.s.skills = { ...(G.s.skills || {}), brave_roar: true }; G.exec({ type: 'battle', encounter: 'ali_wolves' }); });
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
