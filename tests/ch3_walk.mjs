import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sleep } from './lib.mjs';

export function riverWalk(page, prefix) {
  const pictures = process.env.CH3_SCREENSHOTS || fileURLToPath(new URL('../docs/screenshots/ch3/', import.meta.url));
  mkdirSync(pictures, { recursive: true });
  const dialogue = page.locator('.dlg:not(.hidden)');
  const button = name => page.getByRole('button', { name, exact: true });
  const getState = () => page.evaluate(() => window.__mcv.G.s);
  const currentMap = () => page.evaluate(() => window.__mcv.G.world.map.id);

  async function capture(name) {
    await page.waitForFunction(() => !document.querySelector('.toast'));
    await page.locator('.sys-panel, .ce-next').evaluateAll(panels =>
      Promise.all(panels.flatMap(panel => panel.getAnimations().map(animation => animation.finished))));
    const png = await page.screenshot({ path: join(pictures, prefix + '_' + name + '.png'), scale: 'css' });
    assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [390, 844]);
    console.log('截圖', name);
  }

  async function settle({ choice, until, handlePanel } = {}) {
    const reward = page.locator('.reward button');
    const choices = dialogue.locator('.choices button:not(.locked)');
    const untilTime = Date.now() + 35_000;
    while (Date.now() < untilTime) {
      if (until && await until.isVisible()) return;
      if (handlePanel && await handlePanel()) continue;
      const next = dialogue.locator('.dlg-next');
      let action;
      if (await reward.isVisible()) action = reward;
      else if (await button('收好').isVisible()) action = button('收好');
      else if (await choices.first().isVisible()) {
        const wanted = choice && choices.filter({ hasText: choice });
        action = wanted && await wanted.count() ? wanted.first() : choices.first();
      } else if (await next.isVisible()) action = next;
      if (action) {
        // 選項可能在打字動畫的最後一幀出現。點擊前再確認一次停留的畫面。
        if (until && await until.isVisible()) return;
        if (handlePanel && await handlePanel()) continue;
        if (action === next) await page.evaluate(() =>
          document.querySelector('.dlg:not(.hidden) .dlg-box')?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })));
        else await action.tap();
      } else if (!until && await page.evaluate(() => {
        const { G } = window.__mcv;
        return !G.busy && !G.draining && !G.world.transitioning;
      })) return;
      await sleep(100);
    }
    throw new Error('等候遊戲操作逾時：' + (await page.locator('#ui').innerText()).slice(-600));
  }

  // 讓角色走遊戲本身找到的路，再點實際的角色或船。整段流程使用地圖出口。
  async function meet(id, options) {
    console.log('走向', id);
    const target = await page.evaluate(id => {
      const w = window.__mcv.G.world;
      const target = [...w.npcs, ...w.glints, ...w.followers].find(n => n.def.id === id);
      if (!target) throw Error(w.map.name + '找不到 ' + id);
      const kind = w.glints.includes(target) ? 'glint' : 'npc';
      if (w.distTo({ kind, ...target }) >= 54) {
        const path = w.findPath(w.player.x, w.player.y - 4, target.spr.x, target.spr.getData('gy') ?? target.def.y ?? target.spr.y, true);
        if (!path) throw Error(w.map.name + '走不到 ' + id);
        w.path = path;
      }
      return kind;
    }, id);
    await page.waitForFunction(() => !window.__mcv.G.world.path.length, null, { timeout: 25_000 });
    await sleep(350); // 等鏡頭跟上，也等關閉對話的防誤觸時間結束。
    const point = await page.evaluate(([id, kind]) => {
      const w = window.__mcv.G.world;
      const n = [...w.npcs, ...w.glints, ...w.followers].find(n => n.def.id === id);
      if (!n || w.distTo({ kind, ...n }) >= 65) throw Error('還沒走到 ' + id + ' 旁邊');
      const cam = w.cameras.main;
      return { x: (n.spr.x - cam.worldView.x) * cam.zoom,
        y: (n.spr.getCenter().y - cam.worldView.y) * cam.zoom };
    }, [id, target]);
    await page.touchscreen.tap(point.x, point.y);
    await page.waitForFunction(() => window.__mcv.G.busy > 0);
    await settle(options);
  }

  async function leave(to, column) {
    console.log('前往', to);
    await page.evaluate(([to, column]) => {
      const { G, check } = window.__mcv;
      const w = G.world;
      const paths = w.map.exits.filter(ex => ex.to === to && (column == null || ex.tx === column) && check(G.s, ex.when))
        .map(ex => w.findPath(w.player.x, w.player.y - 4, ex.tx * 32 + 16, ex.ty * 32 + 16, false))
        .filter(Boolean).sort((a, b) => a.length - b.length);
      if (!paths.length) throw Error(w.map.name + '無法前往 ' + to);
      w.path = paths[0];
    }, [to, column]);
    await page.waitForFunction(to => window.__mcv.G.world.map.id === to, to, { timeout: 25_000 });
    await settle();
  }

  async function done(id) {
    assert.equal((await getState()).quests[id]?.status, 'done', id);
    console.log('完成', id);
  }

  async function bank(from, to) {
    const before = await page.evaluate(() => window.__mcv.G.world.player.x);
    await meet('c3_ferry_' + from);
    const after = await page.evaluate(() => window.__mcv.G.world.player.x);
    assert.equal(await currentMap(), 'twobanks');
    assert(to === 'east' ? after > before + 64 : after < before - 64, '渡船要把人送到另一岸');
  }
  return { dialogue, button, getState, currentMap, capture, settle, meet, leave, done, bank };
}
