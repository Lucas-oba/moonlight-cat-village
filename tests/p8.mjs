// 搖桿面向穩定度測試：在 45°/135° 附近（含手指抖動）拖動，記錄每秒換面向的次數
import { launch, shot, sleep, advance, state } from './lib.mjs';
const { browser, page, errors } = await launch('http://localhost:4173/?debug=1&skip=1');
await sleep(2500); await advance(page, { log: false }); await sleep(400);
await page.evaluate(() => { const w = window.__mcv.G.world; w.player.setPosition(12 * 32, 24 * 32); });
const b = await page.$eval('.joy', e => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
for (const deg of [45, 135, -45, -135, 30]) {
  await page.evaluate(() => window.__mcv.G.world.player.setPosition(12 * 32, 25 * 32));
  await page.mouse.move(b.x, b.y); await page.mouse.down();
  const changes = []; let last = null; const frames = new Set(); const t0 = Date.now();
  for (let i = 0; i < 40; i++) {
    const a = (deg + Math.sin(i * 1.7) * 8) * Math.PI / 180; // ±8° 手指抖動
    await page.mouse.move(b.x + Math.cos(a) * 50, b.y + Math.sin(a) * 50);
    await sleep(50);
    const d = await page.evaluate(() => { const w = window.__mcv.G.world; return { dir: w.dir, f: w.player.frame.name }; });
    frames.add(d.f); if (last !== null && d.dir !== last) changes.push(d.dir); last = d.dir;
  }
  await page.mouse.up(); const secs = (Date.now() - t0) / 1000;
  console.log(`angle ${deg}°: facing changes ${changes.length} in ${secs.toFixed(1)}s (${(changes.length / secs).toFixed(2)}/s), final dir ${last}, frames used ${[...frames].sort().join(',')}`);
  if (deg === 45) await shot(page, '56_joystick_diagonal_walk');
  await sleep(300);
}
console.log('errors', JSON.stringify(errors)); await browser.close();
