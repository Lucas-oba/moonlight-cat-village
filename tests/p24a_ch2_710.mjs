import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { advance, launch, shot, sleep, state } from './lib.mjs';

const url = new URL(process.env.URL || 'http://localhost:4173/');
url.searchParams.set('debug', '1');
const fixture = JSON.parse(readFileSync(process.env.CHECKPOINT || new URL('./fixtures/ch2_m6.json', import.meta.url), 'utf8'));
const { browser, ctx, page, errors } = await launch(url.href);
const grid = (col, row) => [col * 32 + 16, row * 32 + 20];
const idle = () => page.waitForFunction(() => window.__mcv.G.busy === 0 && !window.__mcv.G.world.transitioning);
const status = id => page.evaluate(id => window.__mcv.G.s.quests[id]?.status, id);
const done = async id => { assert.equal(await status(id), 'done', id); console.log('完成', id); };
const capture = name => shot(page, `c2b_${name}`);
const callback = name => ({ stopOn: async () => {
  await page.locator('.dlg:not(.hidden)').waitFor({ timeout: 5000 });
  await sleep(450);
  await capture(name);
  return true;
} });

async function walk(x, y, stop = false) {
  const route = await page.evaluate(([x, y, stop]) => {
    const w = window.__mcv.G.world;
    const path = w.findPath(w.player.x, w.player.y - 4, x, y - 4, stop);
    if (path) w.path = path;
    return !!path;
  }, [x, y, stop]);
  assert(route, `找不到路到 ${x},${y}`);
  await page.waitForFunction(() => !window.__mcv.G.world.path.length);
}

async function exitTo(map) {
  const [x, y] = await page.evaluate(map => {
    const { G, check } = window.__mcv;
    const e = G.world.map.exits.filter(e => e.to === map && check(G.s, e.when))
      .sort((a, b) => Math.hypot(G.world.player.x - a.tx * 32, G.world.player.y - a.ty * 32)
        - Math.hypot(G.world.player.x - b.tx * 32, G.world.player.y - b.ty * 32))[0];
    if (!e) throw new Error(`找不到出口去 ${map}`);
    return [e.tx * 32 + 16, e.ty * 32 + 20];
  }, map);
  // 舊存檔可能還沒看過沿途的第一章事件。看完後繼續往出口走。
  for (let attempt = 0; attempt < 5; attempt++) {
    await walk(x, y);
    await page.waitForFunction(map => {
      const { G } = window.__mcv;
      return G.world.map.id === map || !G.world.transitioning;
    }, map);
    if ((await state(page)).map === map) {
      if (map !== 'echovalley') { await advance(page); await idle(); }
      return;
    }
    await advance(page);
  }
  assert.fail(`走不到 ${map} 的出口`);
}

async function interact(id, kind = 'glint', options = {}) {
  const coords = await page.evaluate(([id, kind]) => {
    const w = window.__mcv.G.world;
    const t = (kind === 'npc' ? w.npcs : w.glints).find(t => t.def.id === id);
    return t && [t.spr.x, kind === 'npc' ? t.spr.getData('gy') : t.def.y];
  }, [id, kind]);
  assert(coords, `找不到 ${id}`);
  await walk(...coords, true);
  await page.evaluate(([id, kind]) => {
    const w = window.__mcv.G.world;
    const target = (kind === 'npc' ? w.npcs : w.glints).find(t => t.def.id === id);
    if (!target || w.distTo({ kind, ...target }) >= 60) throw new Error(`沒有走到 ${id} 身邊`);
    void w.doInteract({ kind, def: target.def, spr: target.spr });
  }, [id, kind]);
  if (options.pause) return [];
  if (options.shot) await advance(page, callback(options.shot));
  return advance(page, options);
}

async function circle(col, row, button, size) {
  await walk(...grid(col, row));
  await page.getByText(button, { exact: true }).tap();
  await page.waitForFunction(size => window.__mcv.G.s.size === size, size);
}

try {
  await ctx.addInitScript(save => {
    if (localStorage.getItem('mcv_save_v1') === null) localStorage.setItem('mcv_save_v1', JSON.stringify(save));
  }, fixture);
  await page.reload();
  await page.getByRole('button', { name: /繼續遊戲/ }).tap();
  await page.locator('.hud-name').waitFor();
  await advance(page);
  await idle();
  // 固定走路流程。戰鬥數值由獨立模擬驗證。
  await page.evaluate(() => { window.__mcv.G.world.onGrassStep = () => {}; });
  for (const id of ['c2m7', 'c2s14', 'c2s16']) assert.equal(await status(id), 'active');
  await interact('c2_ask_mint');
  await interact('sprout', 'npc');
  await circle(10, 2, '吃餅乾變大', 'big');
  await interact('c2_climb');
  await interact('pengpeng', 'npc');
  await done('c2s14');
  await exitTo('rootvillage');
  await exitTo('mistpath');
  await interact('c2_softmoss');
  await exitTo('echovalley');
  await sleep(400);
  await capture('01_entrance');
  await walk(...grid(9, 29));
  await advance(page, callback('02_echo'));
  const echoButtons = page.locator('.dlg:not(.hidden) .choices button');
  assert.equal(await echoButtons.count(), 4);
  await advance(page, { choices: ['我想吃番薯！'] });

  const locked = page.locator('.dlg:not(.hidden) .choices button.locked');
  await interact('c2_high_bridge', 'glint', { pause: true });
  await locked.waitFor();
  assert.match(await locked.innerText(), /勇氣值 15/);
  await capture('03_bridge_locked');
  await advance(page, { choices: ['去慢慢渡口'] });
  assert.equal(await page.evaluate(() => window.__mcv.G.s.flags.c2_bridge_open), undefined);
  for (const n of [1, 2, 3]) await interact(`c2_stone_${n}`);
  const ferryLines = await interact('manman', 'npc', { shot: '04_ferry' });
  assert.equal(ferryLines.filter(line => line.startsWith('[QUIZ OK]')).length, 3);
  await done('c2s16');
  await done('c2m7');
  await interact('lan_c2_echo', 'npc');
  await interact('c2_ferry_back');
  await exitTo('mistpath');
  await exitTo('rootvillage');
  await interact('sprout', 'npc');
  await done('c2s8');
  await exitTo('mistpath');
  await exitTo('forest');
  await exitTo('meadow');
  await exitTo('village');

  await interact('farmer', 'npc', { shot: '05_rumor', choices: ['咕咕是我的朋友。'] });
  assert(await page.evaluate(() => window.__mcv.G.world.followers.some(t => t.def.id === 'gugu')));
  const secrets = () => page.evaluate(() => {
    const { journal } = window.__mcv.G.s;
    return [journal[1].secrets, journal[2].secrets];
  });
  const [ch1Secrets, ch2Secrets] = await secrets();
  for (const n of [1, 2, 3]) await interact(`c2_veg_${n}`);
  await interact('c2_fence');
  assert.deepEqual(await secrets(), [ch1Secrets, ch2Secrets + 4], '月光貓村的第二章閃光點');
  await interact('farmer', 'npc');
  await done('c2m8');
  assert.equal(await status('c2m9'), 'active');

  await exitTo('meadow');
  await exitTo('forest');
  await exitTo('mistpath');
  if (await status('c2s1') !== 'done') {
    await interact('pudding', 'npc');
    await interact('c2_bird_moss');
    await interact('c2_bird_dew');
    await interact('pudding', 'npc');
  }
  await interact('c2_hollow_door');
  await page.waitForFunction(() => {
    const { G } = window.__mcv;
    return G.world.map.id === 'c2_pudding_hollow' &&
      (G.s.flags.c2_hollow_intro || document.querySelector('.dlg:not(.hidden)'));
  });
  await capture('06_hollow');
  await advance(page);
  await idle();
  assert(await page.evaluate(() => window.__mcv.G.s.flags.c2_hollow_intro));
  for (const animal of ['squirrel', 'hamster', 'rabbit']) await interact(`c2_care_${animal}`);
  const beforeBond = await page.evaluate(() => window.__mcv.G.s.bonds.pudding ?? 1);
  await interact('pudding', 'npc', { choices: ['下次也可以找我幫忙。'] });
  await done('c2m9');
  assert.equal(await page.evaluate(() => window.__mcv.G.s.bonds.pudding), Math.min(3, beforeBond + 1));
  await exitTo('mistpath');
  await exitTo('echovalley');

  // 獨立驗證 15 點門檻與橋的獎勵，再走正常的樹根路線。
  await page.evaluate(() => {
    const { G } = window.__mcv;
    G.s.courage = 15;
    G.s.titleTier = 2;
  });
  await interact('c2_high_bridge', 'glint', { choices: ['走過高高的獨木橋'] });
  await capture('07_bridge_crossed');
  await circle(4, 12, '喝露水變小', 'small');
  await capture('08_roots');
  await interact('c2_under_root');
  await circle(10, 8, '吃餅乾變大', 'big');
  await interact('c2_over_root');
  await walk(...grid(9, 3));
  await advance(page);
  await done('c2m10');
  assert.equal(await status('c2m11'), 'active');
  const den = await interact('c2_den_notice', 'glint', { choices: ['等一下再來'] });
  assert(den.some(t => t === '[CHOICE] 等一下再來'));
  assert.deepEqual(await page.evaluate(() => {
    const s = window.__mcv.G.s;
    return [s.flags.c2s5_unlocked, s.flags.c2s10_unlocked, s.flags.lan_c2_echo,
      s.inventory.c2_medicine_jar, s.stickers.includes('c2_echo_reply'), s.stickers.includes('c2_high_bridge'),
      s.stickers.includes('c2_sprout_stone'), s.journal[2].brave];
  }), [true, true, true, 1, true, true, true, 3]);
  assert.deepEqual(errors, []);
  const checkpoint = await page.evaluate(() => {
    const { G } = window.__mcv;
    return { ...G.s, ...G.world.playerPos() };
  });
  writeFileSync('/tmp/ckpt_c2m10.json', JSON.stringify(checkpoint, null, 2) + '\n');
  console.log('RESULT PASS');
} catch (error) {
  console.error('RESULT FAIL', error, await state(page).catch(() => null), errors);
  await capture('debug').catch(() => {});
  process.exitCode = 1;
} finally {
  await browser.close();
}
