import fs from 'fs';
import { joystick, launch, shot, sleep, advance, state, tapTo, tapNpc, tapGlint, battle, inBattle } from './lib.mjs';
const out = [];
const log = (...a) => { console.log(...a); out.push(a.join(' ')); };
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
  await page.evaluate(() => { const w = window.__mcv.G.world; }); await joystick(page, 0, -50, 1800); await sleep(2500); await advance(page, { log: false }); await noEnc();
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

