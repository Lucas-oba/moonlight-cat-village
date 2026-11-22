import { chromium } from 'playwright';
import fs from 'fs';
export const SHOTS = new URL('../screenshots', import.meta.url).pathname;
fs.mkdirSync(SHOTS, { recursive: true });
export async function launch(url = 'http://localhost:4173/?debug=1', vp = { width: 390, height: 844 }) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.goto(url);
  return { browser, ctx, page, errors };
}
export const sleep = ms => new Promise(r => setTimeout(r, ms));
export async function shot(page, name) { await page.screenshot({ path: `${SHOTS}/${name}.png` }); console.log('shot', name); }
const vis = (page, sel) => page.evaluate(s => { const e = document.querySelector(s); if (!e) return false; const st = getComputedStyle(e); return !e.classList.contains('hidden') && st.display !== 'none' && st.visibility !== 'hidden'; }, sel);
// 推進對話：choice 可為要點的選項文字（陣列依序）
export async function advance(page, { choices = [], max = 60, log = true, stopOn = null } = {}) {
  let idle = 0; const texts = [];
  for (let i = 0; i < 400 && idle < 6; i++) {
    if (stopOn && await stopOn()) return texts;
    if (await vis(page, '.reward')) { const t = await page.textContent('.reward .card'); texts.push('[REWARD] ' + t); await page.click('.reward button'); idle = 0; await sleep(250); continue; }
    if (await vis(page, '.activate')) { await sleep(3500); await page.click('.activate'); idle = 0; await sleep(300); continue; }
    if (await page.$('.qz-next')) { texts.push('[QUIZ OK] ' + ((await page.textContent('.qz-q').catch(() => '')) || '').slice(0, 40)); await page.click('.qz-next'); idle = 0; await sleep(300); continue; }
    { const qb = await page.$$('.qz-btn:not([disabled])'); if (qb.length) { await qb[0].click(); idle = 0; await sleep(300); continue; } }
    if (await vis(page, '.sys-wrap')) { await sleep(400); await page.evaluate(() => [...document.querySelectorAll('.sys-head .x')].forEach(b => b.click())); idle = 0; await sleep(300); continue; }
    if (await vis(page, '.dlg')) {
      const btns = await page.$$('.dlg .choices button');
      if (btns.length) { const want = choices.shift(); let hit = null; for (const b of btns) { const t = await b.textContent(); if (want && t.includes(want)) hit = b; } hit = hit || btns[0]; texts.push('[CHOICE] ' + await hit.textContent()); await hit.click(); idle = 0; await sleep(250); continue; }
      const t = await page.textContent('.dlg-box'); await page.click('.dlg-box'); await sleep(60); await page.click('.dlg-box').catch(() => {});
      texts.push(t.replace('▼', '').trim()); idle = 0; await sleep(200); continue;
    }
    idle++; await sleep(250);
  }
  if (log) texts.forEach(t => console.log('  >', t.slice(0, 90)));
  return texts;
}
export async function state(page) { return page.evaluate(() => { const G = window.__mcv.G; const w = G.world; return { map: G.s.map, x: w?.player?.x|0, y: w?.player?.y|0, busy: G.busy, quests: Object.fromEntries(Object.entries(G.s.quests).map(([k, v]) => [k, v.status + ':' + JSON.stringify(v.prog)])), lv: G.s.members.hero.lv, exp: G.s.members.hero.exp, hp: G.s.members.hero.hp, money: G.s.money, courage: G.s.courage, obs: G.s.observation, tracked: G.s.tracked, scene: window.__mcv.game.scene.getScenes(true).map(s => s.scene.key) }; }); }
// 世界座標 → 螢幕座標
export async function toScreen(page, wx, wy) { return page.evaluate(([wx, wy]) => { const cam = window.__mcv.G.world.cameras.main; const z = cam.zoom; const c = document.querySelector('#game canvas').getBoundingClientRect(); return { x: c.left + (wx - cam.worldView.x) * z, y: c.top + (wy - cam.worldView.y) * z, w: c.width, h: c.height }; }, [wx, wy]); }
// 點擊移動到世界座標（多次點擊直到抵達）
export async function tapTo(page, wx, wy, tol = 20) {
  for (let k = 0; k < 14; k++) {
    const st = await state(page); if (Math.hypot(st.x - wx, st.y - wy) < tol) return true;
    if (st.busy > 0) return false;
    let p = await toScreen(page, wx, wy);
    const cx = Math.max(20, Math.min(p.w - 20, p.x)), cy = Math.max(120, Math.min(p.h - 180, p.y));
    await page.mouse.click(cx, cy);
    for (let i = 0; i < 40; i++) { await sleep(150); const s2 = await page.evaluate(() => window.__mcv.G.world.path.length); if (!s2) break; }
    await sleep(100);
    if ((await state(page)).busy > 0) return false;
  }
  return false;
}
// 點 NPC（會自動走過去並對話）
export async function tapNpc(page, id) {
  for (let k = 0; k < 10; k++) {
    const pos = await page.evaluate(id => { const n = window.__mcv.G.world.npcs.find(n => n.def.id === id); return n ? { x: n.spr.x, y: n.spr.y - 20 } : null; }, id);
    if (!pos) throw new Error('npc not found ' + id);
    const p = await toScreen(page, pos.x, pos.y);
    if (p.y > 120 && p.y < p.h - 180 && p.x > 10 && p.x < p.w - 10) { await page.mouse.click(p.x, p.y); for (let i = 0; i < 60; i++) { await sleep(150); if ((await state(page)).busy > 0) return true; } return false; }
    await tapTo(page, pos.x, pos.y + 40, 40);
  }
  return false;
}
export async function joystick(page, dx, dy, ms) {
  const b = await page.$eval('.joy', e => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await page.mouse.move(b.x, b.y); await page.mouse.down(); await page.mouse.move(b.x + dx, b.y + dy, { steps: 4 }); await sleep(ms); await page.mouse.up();
}
export async function tapGlint(page, id) {
  for (let k = 0; k < 10; k++) {
    const pos = await page.evaluate(id => { const n = window.__mcv.G.world.glints.find(n => n.def.id === id); return n ? { x: n.def.x, y: n.def.y } : null; }, id);
    if (!pos) throw new Error('glint not visible ' + id);
    const p = await toScreen(page, pos.x, pos.y);
    if (p.y > 120 && p.y < p.h - 180 && p.x > 10 && p.x < p.w - 10) { await page.mouse.click(p.x, p.y); for (let i = 0; i < 60; i++) { await sleep(150); if ((await state(page)).busy > 0) return true; } return false; }
    await tapTo(page, pos.x, pos.y + 30, 40);
  }
  return false;
}
export async function inBattle(page) { return page.evaluate(() => window.__mcv.game.scene.isActive('Battle')); }
// strategy: 陣列，依序使用，最後一個重複
export async function battle(page, strategy = ['attack'], shots = {}) {
  let turn = 0;
  for (let i = 0; i < 600; i++) {
    if (!(await inBattle(page))) { await sleep(300); if (!(await inBattle(page))) return; }
    if (await page.$('.dlg:not(.hidden)')) { await page.click('.dlg-box').catch(() => {}); await sleep(150); continue; }
    const btns = await page.$$('.cmds button');
    if (btns.length === 6) {
      const s = strategy[Math.min(turn, strategy.length - 1)]; turn++;
      if (shots[turn]) await shot(page, shots[turn]);
      const label = { attack: '攻擊', skill: '技能', talk: '對話', defend: '防禦', run: '逃跑', item: '道具' }[s];
      await page.click(`.cmds button:has-text("${label}")`); await sleep(200);
      const sub = await page.$$('.sublist button:not(.back):not([disabled])');
      if (sub.length) { await sub[0].click(); await sleep(200); const sub2 = await page.$$('.sublist button:not(.back):not([disabled])'); if (sub2.length) await sub2[0].click(); }
      else if ((await page.$$('.sublist button.back')).length) { await page.click('.sublist button.back'); strategy = ['attack']; }
      continue;
    }
    if (await page.$('.bmsg')) await page.click('.bmsg').catch(() => {});
    await sleep(200);
  }
}
// ---------- 第二階段（隊伍戰鬥）用 ----------
// hero: 'attack' | 'talk' | 'skill' | 'defend' | ((turn)=>string)；同伴一律攻擊（薄荷血少時補血）
export async function battle2(page, hero = 'attack', shots = {}) {
  let turn = 0; const heroName = await page.evaluate(() => window.__mcv.G.s.name);
  for (let i = 0; i < 900; i++) {
    if (!(await inBattle(page))) { await sleep(300); if (!(await inBattle(page))) return turn; }
    if (await page.$('.dlg:not(.hidden)')) { await page.click('.dlg-box').catch(() => {}); await sleep(150); continue; }
    const btns = await page.$$('.cmds button');
    if (btns.length >= 6) {
      const msg = (await page.textContent('.bmsg')) || '';
      if (msg.startsWith(heroName)) {
        turn++; if (shots[turn]) await shot(page, shots[turn]);
        const s = typeof hero === 'function' ? hero(turn) : hero;
        const label = { attack: '攻擊', skill: '技能', talk: '對話', defend: '防禦', run: '逃跑', item: '道具' }[s];
        await page.click(`.cmds button:has-text("${label}")`); await sleep(200);
      } else {
        const low = await page.evaluate(() => { const G = window.__mcv.G; return Object.values(G.s.members).some(m => m.hp > 0 && m.hp < 14); });
        if (msg.startsWith('薄荷') && low) { await page.click('.cmds button:has-text("技能")'); await sleep(200); const b = await page.$('.sublist button:has-text("薄荷療癒"):not([disabled])'); if (b) { await b.click(); await sleep(200); const t = await page.$$('.sublist button:not(.back)'); if (t.length) await t[0].click(); continue; } await page.click('.sublist button.back'); await sleep(150); }
        await page.click('.cmds button:has-text("攻擊")'); await sleep(200);
      }
      for (let k = 0; k < 3; k++) { const sub = await page.$$('.sublist button:not(.back):not([disabled])'); if (!sub.length) break; await sub[0].click(); await sleep(200); }
      if ((await page.$$('.sublist button.back')).length) await page.click('.sublist button.back').catch(() => {});
      continue;
    }
    if (await page.$('.bmsg')) await page.click('.bmsg').catch(() => {});
    await sleep(150);
  }
  return turn;
}
// 對話與戰鬥交錯進行，直到沒事
export async function play(page, { choices = [], hero = 'attack', shots = {}, log = true } = {}) {
  const all = [];
  for (let r = 0; r < 12; r++) {
    const t = await advance(page, { choices, log: false, stopOn: () => inBattle(page) });
    all.push(...t);
    if (await inBattle(page)) { all.push('[BATTLE]'); await battle2(page, hero, shots); await sleep(500); continue; }
    if ((await state(page)).busy === 0) break;
  }
  if (log) all.forEach(t => console.log('  >', t.slice(0, 100)));
  return all;
}
export async function warp(page, map, x, y) {
  await page.evaluate(([m, x, y]) => { const G = window.__mcv.G; G.world.placePlayer(m, x, y, 0); }, [map, x, y]);
  await sleep(900);
}
// 走到 NPC 目前所在的地圖位置，然後點他
export async function goNpc(page, id) {
  const sp = await page.evaluate(id => { const { G, NPCS, check } = window.__mcv; const d = NPCS.find(n => n.id === id); const s = d.spots.find(s => check(G.s, s.when)); return s && !s.hidden ? { map: s.map, x: s.x, y: s.y } : null; }, id);
  if (!sp) throw new Error('npc nowhere ' + id);
  const cur = (await state(page)).map;
  await warp(page, sp.map, sp.x, sp.y + 70); await sleep(300);
  return tapNpc(page, id);
}
export async function goGlint(page, id) {
  const g = await page.evaluate(id => { const n = window.__mcv.G.world.glints.find(n => n.def.id === id); return n ? n.def : null; }, id);
  return tapGlint(page, id);
}
