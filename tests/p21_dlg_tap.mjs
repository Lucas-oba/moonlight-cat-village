// 回歸測試：點對話框把對話點完（最後一下關掉對話）時，角色不可以走到點的位置。
// 用觸控（touchscreen.tap）和滑鼠（mouse.click）各測一次；也測選單關閉、搖桿放開後馬上點地面的情況，最後確認點地面還是會走。
import { launch, sleep } from './lib.mjs';
const URL = process.env.URL || 'http://localhost:4175/';
const { browser, page, errors } = await launch(URL + '?debug=1&skip=1');
await sleep(2500);
await page.evaluate(() => {
  const G = window.__mcv.G; const s = G.s;
  for (const q of ['main1','main2','main3','main4','main5','main6']) s.quests[q] = { status: 'done', prog: {}, seen: {} };
  Object.assign(s.flags, { system: true, catSpeech: true, tut_status: true, tut_quests: true, tut_party: true, seen_arrive: true });
  s.time = 'day'; s.weather = 'clear'; G.load(s); G.exec({ type: 'rest' }); G.world.placePlayer('village', 12 * 32 + 16, 10 * 32 + 16, 0);
});
await sleep(1500);
const pos = () => page.evaluate(() => { const w = window.__mcv.G.world; return { x: Math.round(w.player.x), y: Math.round(w.player.y), path: w.path.length, busy: window.__mcv.G.busy }; });
const dlgOpen = () => page.evaluate(() => { const e = document.querySelector('.dlg'); return !!e && !e.classList.contains('hidden'); });
let fails = 0;
// 手機放開手指以後，瀏覽器會在同一個位置補送「相容用的滑鼠事件」；這時對話框已經關了，事件會落在畫布上。
const ghost = (x, y) => page.evaluate(([x, y]) => new Promise(r => setTimeout(() => { const t = document.elementFromPoint(x, y); const o = { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0, buttons: 1, view: window };
  t.dispatchEvent(new MouseEvent('mousedown', o)); setTimeout(() => { const t2 = document.elementFromPoint(x, y); t2.dispatchEvent(new MouseEvent('mouseup', { ...o, buttons: 0 })); t2.dispatchEvent(new MouseEvent('click', { ...o, buttons: 0 })); r(t.tagName); }, 30); }, 40)), [x, y]);
const check = (name, a, b) => { const moved = Math.hypot(a.x - b.x, a.y - b.y) > 2 || b.path > 0; console.log((moved ? 'FAIL ' : 'ok   ') + name, JSON.stringify(a), '->', JSON.stringify(b)); if (moved) fails++; };
// 等開場對話結束
for (let i = 0; i < 40 && (await dlgOpen()); i++) { await page.evaluate(() => window.__mcv.G.ui.dialogue.wrap.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))); await sleep(200); }
await sleep(600);
for (const mode of ['touch', 'mouse']) {
  await page.evaluate(() => { const G = window.__mcv.G; G.world.placePlayer('village', 12 * 32 + 16, 10 * 32 + 16, 0); }); await sleep(800);
  const a = await pos();
  await page.evaluate(() => { window.__mcv.DIALOGUES.t_tap = [{ s: 'narr', t: '測試第一句。' }, { s: 'narr', t: '測試第二句。' }, { s: 'narr', t: '最後一句，點一下就結束。' }]; window.__mcv.G.run('t_tap'); });
  await sleep(400);
  const box = await page.$eval('.dlg-box', e => { const r = e.getBoundingClientRect(); return { x: r.left + r.width * 0.5, y: r.top + r.height * 0.4 }; });
  for (let i = 0; i < 12 && (await dlgOpen()); i++) { if (mode === 'touch') { await page.touchscreen.tap(box.x, box.y); await ghost(box.x, box.y); } else await page.mouse.click(box.x, box.y); await sleep(260); }
  await sleep(1200); check('dialogue close by ' + mode, a, await pos());
}
// 選單（系統面板）用 ✕ 關掉
{
  const a = await pos();
  await page.evaluate(() => { window.__mcv.G.exec({ type: 'openPanel', tab: 'status' }); }); await sleep(600);
  const x = await page.$('.sys-head .x');
  if (x) { const r = await x.boundingBox(); await page.touchscreen.tap(r.x + r.width / 2, r.y + r.height / 2); await ghost(r.x + r.width / 2, r.y + r.height / 2); await sleep(1200); check('panel close by touch', a, await pos()); }
  else console.log('skip panel (no openPanel)');
}
// 搖桿放開之後，同一根手指不算點地面
{
  const a0 = await pos();
  const b = await page.$eval('.joy', e => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await page.mouse.move(b.x, b.y); await page.mouse.down(); await page.mouse.move(b.x + 30, b.y, { steps: 3 }); await sleep(400); await page.mouse.up(); await sleep(800);
  const a = await pos(); console.log('joystick moved', JSON.stringify(a0), '->', JSON.stringify(a)); await sleep(1000); check('after joystick release', a, await pos());
}
// 點地面還是要能走
{
  await sleep(500); const a = await pos();
  await page.mouse.click(195, 300); await sleep(1500); const b = await pos();
  const moved = Math.hypot(a.x - b.x, a.y - b.y) > 10; console.log((moved ? 'ok   ' : 'FAIL ') + 'tap ground still walks', JSON.stringify(a), '->', JSON.stringify(b)); if (!moved) fails++;
  await sleep(500); const c = await pos(); await page.touchscreen.tap(195, 520); await sleep(1500); const d = await pos();
  const m2 = Math.hypot(c.x - d.x, c.y - d.y) > 10; console.log((m2 ? 'ok   ' : 'FAIL ') + 'touch ground still walks', JSON.stringify(c), '->', JSON.stringify(d)); if (!m2) fails++;
}
console.log('RESULT', fails ? 'FAIL ' + fails : 'PASS', 'errors', errors);
await browser.close(); process.exit(fails ? 1 : 0);
