import fs from 'fs';
import { launch, shot, sleep, advance, state, tapTo, tapNpc, tapGlint, battle, inBattle } from './lib.mjs';
const out = [];
const log = (...a) => { console.log(...a); out.push(a.join(' ')); };
const pos = async page => { const s = await state(page); return `${s.x},${s.y}`; };
// ---------- 1. 點按鈕不會讓角色亂跑 ----------
{
  const { browser, page, errors } = await launch('http://localhost:4173/?debug=1&skip=1');
  await sleep(2500); await advance(page, { log: false }); await sleep(500);
  await page.evaluate(() => { const G = window.__mcv.G; G.s.flags.system = true; G.s.flags.catSpeech = true; G.ui.refresh(); });
  await sleep(300);
  const p0 = await pos(page); log('start pos', p0);
  const targets = ['.hud-card', '.hud-money', '.act-btn', '.tracker', '.joy'];
  for (const sel of targets) {
    for (const mode of ['touch', 'mouse']) {
      const b = await page.$eval(sel, e => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
      if (mode === 'touch') await page.touchscreen.tap(b.x, b.y); else await page.mouse.click(b.x, b.y);
      await sleep(900); await advance(page, { log: false }); await sleep(300);
      const p = await pos(page); log(`tap ${sel} (${mode}) -> ${p} ${p === p0 ? 'UNCHANGED' : 'MOVED!'}`);
    }
  }
  await shot(page, '50_tap_buttons_no_move');
  // 系統面板：開、切頁、關
  for (const mode of ['touch', 'mouse']) {
    const tap = async sel => { const b = await page.$eval(sel, e => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }); if (mode === 'touch') await page.touchscreen.tap(b.x, b.y); else await page.mouse.click(b.x, b.y); await sleep(400); };
    await tap('.sys-btn'); await tap('.sys-tabs button:nth-child(2)'); await tap('.sys-tabs button:nth-child(3)'); await tap('.sys-tabs button:nth-child(4)');
    if (mode === 'mouse') await shot(page, '51_settings_music_toggle');
    await tap('.snd-tgl'); await tap('.snd-tgl');
    await tap('.sys-head .x'); await sleep(700);
    const p = await pos(page); log(`system panel (${mode}) -> ${p} ${p === p0 ? 'UNCHANGED' : 'MOVED!'}`);
  }
  // 對話：走到村民旁邊按「對話」，點完對話框
  await tapNpc(page, 'merchant'); await advance(page, { log: false }); await sleep(800);
  const pa = await pos(page); await sleep(800); const pb = await pos(page);
  log(`after dialogue close: ${pa} -> ${pb} ${pa === pb ? 'STILL' : 'MOVED!'}`);
  // 用按鈕對話（觸控），點對話框
  for (let i = 0; i < 2; i++) {
    const b = await page.$eval('.act-btn', e => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
    await page.touchscreen.tap(b.x, b.y); await sleep(500);
    for (let k = 0; k < 20 && await page.$('.dlg:not(.hidden)'); k++) { const d = await page.$eval('.dlg-box', e => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }); const ch = await page.$('.dlg .choices button'); if (ch) { const c = await ch.boundingBox(); await page.touchscreen.tap(c.x + 10, c.y + 10); } else await page.touchscreen.tap(d.x, d.y); await sleep(350); }
    await sleep(800); const pc = await pos(page); log(`act-button dialogue (touch) #${i} -> ${pa} vs ${pc} ${pa === pc ? 'STILL' : 'MOVED!'}`);
  }
  // 地面點擊還是要能走
  const before = await state(page); const sc = await page.evaluate(() => ({ x: innerWidth / 2 + 60, y: innerHeight / 2 - 60 }));
  await page.touchscreen.tap(sc.x, sc.y); await sleep(1500); const after = await state(page);
  log(`ground tap still moves: ${before.x},${before.y} -> ${after.x},${after.y} ${before.x !== after.x || before.y !== after.y ? 'OK' : 'NO MOVE!'}`);
  log('music in village:', await page.evaluate(() => window.__music.current()));
  log('errors', JSON.stringify(errors)); await browser.close();
}
// ---------- 2. 豆花跟著走 ----------
{
  const s = JSON.parse(fs.readFileSync('/tmp/ckpt_found.json', 'utf8')); s.quests.side2.prog.find = 0;
  const { browser, page, errors } = await launch('http://localhost:4173/?debug=1');
  await page.evaluate(s => localStorage.setItem('mcv_save_v1', s), JSON.stringify(s));
  await page.reload(); await sleep(2500); await page.click('text=繼續遊戲'); await sleep(2000); await advance(page, { log: false });
  log('meadow music:', await page.evaluate(() => window.__music.current()));
  await tapGlint(page, 'douhua_hide'); const t = await advance(page, { log: false }); log('glint dialog lines', t.length);
  await sleep(600);
  const fol = () => page.evaluate(() => { const w = window.__mcv.G.world; return w.followers.map(f => ({ id: f.def.id, x: f.x | 0, y: f.y | 0, px: w.player.x | 0, py: w.player.y | 0 })); });
  log('followers after find', JSON.stringify(await fol()));
  await shot(page, '52_douhua_found_follows');
  // 往北走回村莊（出口在上方）
  const noEnc = () => page.evaluate(() => { window.__mcv.G.world.onGrassStep = () => {}; }); await noEnc();
  await tapTo(page, 9 * 32 + 16, 60, 24); await sleep(400);
  log('followers walking', JSON.stringify(await fol()));
  await shot(page, '53_douhua_following_meadow');
  await tapTo(page, 9 * 32 + 16, 10, 10); await sleep(2500); await advance(page, { log: false }); await noEnc();
  const st = await state(page); log('map now', st.map, st.x, st.y, 'music', await page.evaluate(() => window.__music.current()));
  log('followers in village', JSON.stringify(await fol()));
  await tapTo(page, st.x, st.y - 120, 24); await sleep(300);
  log('followers after walk', JSON.stringify(await fol()));
  await shot(page, '54_douhua_following_village');
  await tapNpc(page, 'mochimom'); await advance(page, { log: false }); await sleep(1500);
  log('side2', (await state(page)).quests.side2, 'followers', JSON.stringify(await fol()));
  log('douhua npc at home', JSON.stringify(await page.evaluate(() => window.__mcv.G.world.npcs.filter(n => n.def.id === 'douhua').map(n => [n.spr.x | 0, n.spr.y | 0]))));
  await shot(page, '55_douhua_home');
  // 戰鬥音樂
  await page.evaluate(() => window.__mcv.G.world.startBattle('meadow_grass', false)); await sleep(2500);
  log('battle music', await page.evaluate(() => window.__music.current()), 'inBattle', await inBattle(page));
  await battle(page, ['attack']); await sleep(1200);
  log('after battle music', await page.evaluate(() => window.__music.current()));
  log('errors', JSON.stringify(errors)); await browser.close();
}
fs.writeFileSync('/tmp/p7.log', out.join('\n'));
