// 自動解任務：找出能推進任務的 NPC／閃光點／觸發點，走過去互動，一路點完對話、戰鬥、解題。
// 用法：node tests/qsolve.mjs side3,side4,...
import { readFileSync, writeFileSync } from 'node:fs';
import { launch, sleep, shot, state, battle2, inBattle } from './lib.mjs';
const LIST = (process.argv[2] || 'side3').split(',');
const OBS = Number(process.env.OBS ?? 4);
const { browser, page, errors } = await launch((process.env.URL || 'http://localhost:4173/') + '?debug=1&skip=1');
page.setDefaultTimeout(4000);
await sleep(2500);
const checkpoint = process.env.CHECKPOINT;
const progressionRun = !!process.env.FRESH || !!checkpoint;
const OBSF = Number(process.env.OBS ?? 0);
// CHECKPOINT=/tmp/ckpt_found.json 可接續 p2 → p3 的實際流程。
if (checkpoint) {
  const save = JSON.parse(readFileSync(checkpoint, 'utf8'));
  await page.evaluate(save => {
    const { G } = window.__mcv;
    G.load(save);
    G.world.placePlayer(save.map, save.x, save.y, save.dir);
  }, save);
} else if (progressionRun) await page.evaluate(() => { const G = window.__mcv.G; const s = G.s; s.members.hero.lv = 7; s.inventory.cookie = 6; s.money = 300; G.exec({ type: 'rest' }); });
else await page.evaluate(([OBS, RESET]) => {
  const G = window.__mcv.G; const s = G.s;
  for (const q of ['main1','main2','main3','main4','main5','main6','side2','main7','main8','main9','main10','side1','side5','side10']) s.quests[q] = { status: 'done', prog: {}, seen: {} };
  Object.assign(s.flags, { system: true, catSpeech: true, tut_status: true, tut_quests: true, tut_party: true, seen_arrive: true, seen_meadow: true, forest_open: true, choiceA: true, herb_shop: true, seen_m9_enter: true, seen_m10: true, v_md: true, v_mn: true, v_fo: true });
  s.weapon = 'wooden_sword'; s.inventory = { wooden_sword: 1, cookie: 6, herb_candy: 4, sticker_book: 1, moon_flower: 2, moon_scale: 1 }; 
  s.money = 300; s.time = 'day'; s.observation = OBS; s.courage = 6;
  for (const id of ['ali', 'mint', 'yuzu']) { G.ensureMember(id); s.members[id].joined = true; s.members[id].lv = 7; }
  s.members.hero.lv = 7; s.bonds = { ali: 3, mint: 3, yuzu: 3 }; s.party = ['hero', 'ali', 'mint'];
  for (const q of (RESET || '').split(',').filter(Boolean)) delete s.quests[q];
  G.load(s); G.exec({ type: 'rest' }); G.world.placePlayer('village', 10 * 32 + 16, 12 * 32 + 16, 0);
}, [OBS, process.env.RESET]);
await sleep(1500);
const vis = async sel => !!(await page.$(`${sel}:not(.hidden)`));
const seenChoice = new Map(); const log = [];
async function resolve() {
  let idle = 0;
  for (let i = 0; i < 600 && idle < 4; i++) {
    if (await inBattle(page)) {
      const enc = await page.evaluate(() => window.__mcv.game.scene.getScene('Battle').encId);
      const cmd = enc === 'boss' ? () => page.evaluate(() => {
        const { G, game } = window.__mcv;
        return game.scene.getScene('Battle').latePhase ? 'talk' : G.s.members.hero.mp >= 3 ? 'skill' : 'attack';
      }) : ['tut3', 'gugu'].includes(enc) ? 'talk' : 'attack';
      log.push('[BATTLE]'); await battle2(page, cmd); await sleep(600); idle = 0; continue;
    }
    if (await page.$('.qz-next')) { log.push('[QUIZ OK] ' + ((await page.textContent('.qz-q').catch(() => '')) || '').slice(0, 40)); await page.click('.qz-next'); await sleep(300); idle = 0; continue; }
    const qb = await page.$$('.qz-btn:not([disabled])'); if (qb.length) { await qb[0].click(); await sleep(300); idle = 0; continue; }
    if (await vis('.reward')) { log.push('[REWARD] ' + (await page.textContent('.reward .card')).slice(0, 80)); await page.click('.reward button'); await sleep(300); idle = 0; continue; }
    const chapterClosed = await page.evaluate(() => {
      const button = document.querySelector('.chap-end button');
      button?.click();
      return !!button;
    });
    if (chapterClosed) { await sleep(550); idle = 0; continue; }
    if (await vis('.activate')) { await sleep(3500); await page.click('.activate'); await sleep(300); idle = 0; continue; }
    if (await vis('.sys-wrap')) { log.push('[PANEL] ' + ((await page.textContent('.sys-head').catch(() => '')) || '').slice(0, 30)); await sleep(300); await page.evaluate(() => [...document.querySelectorAll('.sys-head .x')].forEach(b => b.click())); await sleep(300); idle = 0; continue; }
    if (await vis('.dlg')) {
      const btns = await page.$$('.dlg .choices button');
      if (btns.length) {
        const texts = await Promise.all(btns.map(b => b.textContent())); const key = texts.join('|');
        const good = texts.map((t, k) => k).filter(k => !/等一下|不用|還沒|先不要|下次/.test(texts[k]));
        const pool = good.length ? good : texts.map((t, k) => k); const n = seenChoice.get(key) ?? 0; seenChoice.set(key, n + 1);
        const k = pool[n % pool.length]; log.push('[CHOICE] ' + texts[k]); await btns[k].click(); await sleep(250); idle = 0; continue;
      }
      const t = await page.textContent('.dlg-box');
      log.push(t.replace('▼', '').trim().slice(0, 70));
      // 對話動作接到 pointerdown，等待下一個對話註冊監聽後再點。
      await page.evaluate(() => document.querySelector('.dlg:not(.hidden) .dlg-box')
        ?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true })));
      await sleep(150);
      idle = 0;
      continue;
    }
    if ((await page.evaluate(() => window.__mcv.G.busy)) > 0) { idle = 0; await sleep(250); continue; }
    idle++; await sleep(80);
  }
}
const quiet = () => page.evaluate(() => { const w = window.__mcv.G.world; if (w) w.onGrassStep = () => {}; });
async function cands(q, newFlags) {
  return page.evaluate(([q, newFlags]) => {
    const { G, NPCS, GLINTS, TRIGGERS, DIALOGUES, check } = window.__mcv; const s = G.s; const out = [];
    const ment = (d, w) => { const x = JSON.stringify(DIALOGUES[d] || []) + JSON.stringify(w || {}); return x.includes('"' + q + '"') ? 2 : newFlags.some(f => x.includes('"' + f + '"')) ? 1 : 0; };
    const giver = s.quests[q]?.status === 'available' ? window.__mcv.QUESTS[q].giver : null;
    const qd = window.__mcv.QUESTS[q], qs = s.quests[q]; const curO = qs?.status === 'active' ? qd.objectives.find(o => !(qs.prog[o.id] >= (o.count ?? 1))) : null;
    const curT = curO && curO.type === 'talk' ? (curO.targets || []).filter(id => !(qs.seen?.[curO.id] || []).includes(id)) : [];
    if (curO && curO.type === 'reach') for (const tg of (curO.targets || [])) if (window.__mcv.MAPS[tg]) out.push({ k: 'trig', id: 'map_' + tg, map: tg, zone: null, d: 'reach', m: 3 });
    if (curO && curO.type === 'reach') for (const z of (window.__mcv.MAPS ? Object.values(window.__mcv.MAPS) : [])) for (const zz of (z.zones || [])) if ((curO.targets || []).includes(zz.id)) out.push({ k: 'trig', id: 'zone_' + zz.id, map: z.id, zone: zz, d: 'reach', m: 3 });
    if (curO?.id === 'tutorial') out.push({ k: 'grass', id: 'tutorial', d: 'grass', m: 5 });
    if (curO?.type === 'battle' && (curO.targets || []).some(m => window.__mcv.MAPS[m]?.encounter)) out.push({ k: 'grass', id: 'fight_' + curO.targets[0], map: curO.targets[0], d: 'grass', m: 4 });
    for (const n of NPCS) {
      const r = n.talk.find(r => check(s, r.when)); if (!r) continue; const m = (curT.includes(n.id) || curO?.marker?.includes(n.id) ? 3 : 0) || ment(r.d, r.when) || (n.id === giver ? 0.5 : 0); if (!m) continue;
      if (n.follow && check(s, n.follow)) { out.push({ k: 'follow', id: n.id, d: r.d, m }); continue; }
      const sp = (n.spots || []).find(sp => check(s, sp.when)); if (!sp || sp.hidden) continue;
      out.push({ k: 'npc', id: n.id, map: sp.map, x: sp.x, y: sp.y, d: r.d, m });
    }
    for (const g of GLINTS) { if (g.once && s.flags[g.once]) continue; if (!check(s, g.when)) continue; const m = curO?.targets?.includes(g.id) ? 3 : ment(g.d, g.when); if (m) out.push({ k: 'glint', id: g.id, map: g.map, x: g.x, y: g.y, obs: g.obs, d: g.d, m, need: g.needSize }); }
    for (const t of TRIGGERS) { if (s.flags[t.once] || !check(s, t.when)) continue; const m = ment(t.d, t.when); if (m) out.push({ k: 'trig', id: t.id, map: t.map, zone: t.zone, d: t.d, m }); }
    return out.sort((a, b) => (b.m - a.m) || (Number(b.k === 'trig') - Number(a.k === 'trig')));
  }, [q, newFlags]);
}
async function act(c) {
  if (c.k === 'grass') { await page.evaluate(() => { const w = window.__mcv.G.world; if (w.map.id !== 'meadow') w.placePlayer('meadow', 14 * 32 + 16, 14 * 32 + 8, 0); }); await sleep(1500); await resolve(); await page.evaluate(() => { const w = window.__mcv.G.world; delete w.onGrassStep; w.grassSteps = 99; const r = Math.random; Math.random = () => 0; try { w.onGrassStep(); } finally { Math.random = r; } }); await sleep(800); await resolve(); await quiet(); return 'ok'; }
  if (c.k === 'trig') {
    const z = c.zone; const p = z ? [z.x + z.w / 2, z.y + z.h / 2] : null;
    await page.evaluate(([c, p]) => { const w = window.__mcv.G.world; if (p) w.placePlayer(c.map, p[0], p[1], 0); else w.placePlayer(c.map, w.map.id === c.map ? w.player.x : 5 * 32 + 16, w.map.id === c.map ? w.player.y : 6 * 32 + 16, 0); }, [c, p]);
    if (!p) { /* 地圖觸發：先離開再進來 */ }
    await sleep(650); await quiet(); await page.evaluate(() => window.__mcv.G.world.checkTriggers()); await sleep(500); return 'trig';
  }
  if (c.k !== 'follow') { await page.evaluate(c => window.__mcv.G.world.placePlayer(c.map, c.x, c.y + 34, 0), c); await sleep(550); await quiet(); await resolve(); }
  return page.evaluate(c => {
    const w = window.__mcv.G.world;
    if (c.k === 'glint' && c.need && window.__mcv.G.s.size !== c.need) { const wd = window.__mcv.WONDERS.find(x => x.map === c.map && x.mode === c.need); if (wd) { w.player.setPosition(wd.x, wd.y); w.useWonder(wd); w.player.setPosition(c.x, c.y + 34); } }
    if (c.k === 'glint') { const g = w.glints.find(g => g.def.id === c.id); if (!g) return 'glint-hidden(obs ' + c.obs + ', have ' + window.__mcv.G.s.observation + ')'; w.doInteract({ kind: 'glint', def: g.def, spr: g.spr }); return 'ok'; }
    const n = [...w.npcs, ...w.followers].find(n => n.def.id === c.id); if (!n) return 'npc-missing'; w.doInteract({ kind: 'npc', def: n.def, spr: n.spr }); return 'ok';
  }, c);
}
const report = {};
for (const q of LIST) {
  const t0 = Date.now(); const f0 = await page.evaluate(() => Object.keys(window.__mcv.G.s.flags));
  if (progressionRun) await page.evaluate((OBSF) => { const s = window.__mcv.G.s; for (const m of Object.values(s.members)) if (m.lv < 7) m.lv = 7; s.bonds = { ali: 3, mint: 3, yuzu: 3, ...(s.bonds || {}) }; for (const k of ['ali', 'mint', 'yuzu']) s.bonds[k] = 3; if (OBSF) s.observation = Math.max(s.observation, OBSF); window.__mcv.G.exec({ type: 'rest' }); }, OBSF);
  let st = await page.evaluate(q => window.__mcv.G.s.quests[q]?.status, q); const steps = []; let fails = 0; const tried = new Map();
  console.log(`\n=== ${q} (${st})`);
  for (let i = 0; i < 40; i++) {
    st = await page.evaluate(q => window.__mcv.G.s.quests[q]?.status, q); if (st === 'done') break;
    const newFlags = await page.evaluate(f0 => Object.keys(window.__mcv.G.s.flags).filter(f => !f0.includes(f) && window.__mcv.G.s.flags[f]), f0);
    const cs = (await cands(q, newFlags)).filter(c => (tried.get(c.k + c.id + c.d) ?? 0) < 3);
    if (!cs.length) {
      const gave = await page.evaluate(q => { const { G, QUESTS } = window.__mcv; const st = G.s.quests[q]; if (!st) return null; const o = QUESTS[q].objectives.find(o => !(st.prog[o.id] >= (o.count ?? 1))); const hs = o?.auto?.hasItem ? [o.auto.hasItem] : (o?.auto?.all ?? []).map(c => c.hasItem).filter(Boolean); if (!hs.length) return null; for (const h of hs) G.s.inventory[h[0]] = Math.max(G.s.inventory[h[0]] ?? 0, h[1]); G.checkAuto(); return hs.flat(); }, q);
      if (gave && !steps.includes('give-' + gave[0])) { steps.push('give-' + gave[0]); console.log('  (simulated collecting from fights:', gave.join(' x'), ')'); continue; }
      const tm = await page.evaluate(() => window.__mcv.G.s.time);
      if (!steps.includes('time-toggle-' + tm)) { steps.push('time-toggle-' + tm); await page.evaluate(() => window.__mcv.G.exec({ type: 'time', v: window.__mcv.G.s.time === 'day' ? 'night' : 'day' })); continue; }
      console.log('  STUCK: no candidate', JSON.stringify(await page.evaluate(q => ({ st: window.__mcv.G.s.quests[q], cur: window.__mcv.QUESTS[q].objectives.map(o => o.id) }), q))); break;
    }
    const c = cs[0]; tried.set(c.k + c.id + c.d, (tried.get(c.k + c.id + c.d) ?? 0) + 1);
    log.length = 0; const r = await act(c); await resolve();
    const prog = await page.evaluate(q => JSON.stringify(window.__mcv.G.s.quests[q]), q);
    console.log(`  [${c.k}] ${c.id} → ${c.d} (${r}) ${prog}`); log.forEach(t => console.log('     ', t));
    steps.push(`${c.k}:${c.id}`); if (r !== 'ok' && r !== 'trig') fails++;
  }
  st = await page.evaluate(q => window.__mcv.G.s.quests[q]?.status, q);
  report[q] = { status: st, steps: steps.length, sec: Math.round((Date.now() - t0) / 1000) };
  console.log(`=== ${q} → ${st} in ${steps.length} steps`);
  await shot(page, `qs_${q}`);
  if (st === 'done' && process.env.SAVE_CHECKPOINT) {
    const save = await page.evaluate(() => {
      const { G } = window.__mcv;
      return { ...G.s, ...G.world.playerPos() };
    });
    writeFileSync(process.env.SAVE_CHECKPOINT, JSON.stringify(save));
  }
}
console.log('\nREPORT', JSON.stringify(report)); console.log('errors', errors);
const chapterDone = LIST.includes('main12') ? await page.evaluate(() => window.__mcv.G.s.chapterDone === true) : null;
if (chapterDone != null) console.log('chapterDone', chapterDone);
if (errors.length || chapterDone === false || Object.values(report).some(q => q.status !== 'done')) process.exitCode = 1;
await browser.close();
