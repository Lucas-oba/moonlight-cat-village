import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { advance, launch, shot } from './lib.mjs';

const url = new URL(process.env.URL || 'http://localhost:4173/');
url.searchParams.set('debug', '1');
const fixture = JSON.parse(readFileSync(new URL('./fixtures/ch2_m10.json', import.meta.url), 'utf8'));
let browser, page, errors;

async function ready(map) {
  await page.waitForFunction(map => {
    const G = window.__mcv?.G;
    return G?.world?.map && G.busy === 0 && (!map || G.world.map.id === map);
  }, map ?? null);
}

async function warp(map, col, row) {
  await page.evaluate(([map, col, row]) => {
    window.__mcv.G.world.placePlayer(map, col * 32 + 16, row * 32 + 16);
  }, [map, col, row]);
  await ready(map);
}

async function interact(kind, id) {
  await page.evaluate(([kind, id]) => {
    const { world } = window.__mcv.G;
    const candidates = kind === 'glint' ? world.glints : [...world.npcs, ...world.followers];
    const target = candidates.find(n => n.def.id === id);
    if (!target) throw Error(`在 ${world.map.id} 找不到 ${id}`);
    void world.doInteract({ def: target.def, spr: target.spr, kind });
  }, [kind, id]);
}

async function visit(kind, id, choices = []) {
  await interact(kind, id);
  const log = await advance(page, { log: false, choices });
  await ready();
  return log;
}

async function shop(kind, id, item, available, buy = false) {
  await interact(kind, id);
  await advance(page, { log: false, stopOn: () => page.locator('.shop').isVisible() });
  await page.locator('.shop').waitFor();
  const row = page.locator('.shop .inv-row').filter({ hasText: item });
  assert.equal(await row.count(), Number(available), item);
  if (buy) await row.getByRole('button', { name: '買', exact: true }).tap();
  await page.locator('.shop .x').tap();
  await ready();
}

const read = expression => page.evaluate(expression);
const status = id => page.evaluate(id => window.__mcv.G.s.quests[id]?.status, id);
const capture = name => shot(page, `c2d_${name}`);

async function quiz(kind, id, count, image) {
  await interact(kind, id);
  await advance(page, { log: false, stopOn: () => page.locator('.qz-q').isVisible() });
  assert.match(await page.locator('.qz-n').innerText(), new RegExp(`第 1 / ${count} 題`));
  if (image) await capture(image);
  const log = await advance(page, { log: false });
  await ready();
  assert.equal(log.filter(line => line.startsWith('[QUIZ OK]')).length, count);
}

try {
  ({ browser, page, errors } = await launch(url.href));
  page.setDefaultTimeout(12_000);
  await page.evaluate(fixture => localStorage.setItem('mcv_save_v1', JSON.stringify(fixture)), fixture);
  await page.reload();
  await page.getByRole('button', { name: /繼續遊戲/ }).tap();
  await ready();
  const startingKindness = await read(() => window.__mcv.G.s.kindCh2);

  await warp('forest', 11, 40);
  await visit('npc', 'rock');
  assert.equal(await status('c2s7'), 'active');
  assert((await visit('glint', 'c2_nest')).some(line => line.includes('樹枝太高')));
  await page.evaluate(() => {
    const { G, WONDERS } = window.__mcv;
    const circle = WONDERS.find(w => w.id === 'c2_nest_circle');
    G.world.player.setPosition(circle.x, circle.y);
  });
  await page.waitForFunction(() => window.__mcv.G.world.nearWonder?.id === 'c2_nest_circle');
  await read(() => window.__mcv.G.world.interact());
  await page.waitForFunction(() => window.__mcv.G.s.size === 'big');
  await interact('glint', 'c2_nest');
  await page.getByRole('button', { name: '輕輕地', exact: true }).waitFor();
  await capture('nest');
  await advance(page, { log: false, choices: ['用力地'] });
  await ready();
  assert.equal(await status('c2s7'), 'active');
  assert.equal(await read(() => window.__mcv.G.s.kindCh2), startingKindness);
  await visit('glint', 'c2_nest', ['輕輕地']);

  await warp('village', 19, 12);
  // 開啟舊雜貨店的商品面板，方便比對分享前後的貨品。
  await read(() => { window.__mcv.G.s.quests.side6.status = 'done'; });
  await shop('npc', 'merchant', '月光莓', false);
  const shareStart = await visit('npc', 'farmer');
  assert.equal(await status('c2s10'), 'active', shareStart.join('\n'));
  // 這份存檔還沒修雜貨店，補上修好的旗標以檢查上架商品。
  await read(() => { window.__mcv.G.s.flags.c2_house_shop = true; });
  await warp('rootvillage', 5, 10);
  await shop('glint', 'c2_house_shop_service', '薄荷糖', false);
  await interact('glint', 'c2_share_basket');
  await page.getByText(/好香的菜/).waitFor();
  await capture('basket');
  await advance(page, { log: false });
  await ready();
  await warp('village', 22, 21);
  await visit('npc', 'farmer');
  await shop('npc', 'merchant', '月光莓', true);
  await warp('rootvillage', 4, 9);
  await shop('glint', 'c2_house_shop_service', '薄荷糖', true);

  await warp('village', 24, 27);
  assert(!await read(() => window.__mcv.G.world.glints.some(g => g.def.id === 'c2_sword_display')));
  await visit('npc', 'charcoal');
  await visit('glint', 'c2_bird_board');
  await visit('glint', 'c2_bird_hay');
  await visit('npc', 'charcoal');
  assert(await read(() => window.__mcv.G.world.condProps.some(p => p.texture.key === 'c2_birdhouse')));
  await capture('birdhouse');
  await read(() => { window.__mcv.G.s.money = 150; });
  await shop('glint', 'c2_sword_display', '攻擊 +6', true, true);
  assert.equal(await read(() => window.__mcv.G.s.weapon), 'c2_moon_sword');

  await visit('npc', 'mochimom');
  await visit('npc', 'c2_new_neighbors');
  assert(await read(() => window.__mcv.G.world.followers.some(f => f.def.id === 'c2_new_neighbors')));
  await visit('npc', 'guard');
  await visit('npc', 'toast');
  await interact('npc', 'douhua');
  await page.getByText(/我們第一次見面的樣子/).waitFor();
  await capture('neighbors');
  await advance(page, { log: false });
  await ready();

  await warp('rootvillage', 12, 15);
  await visit('npc', 'juanjuan');
  await quiz('glint', 'c2_cake_table', 3, 'cake');
  const initialCandy = await read(() => window.__mcv.G.s.inventory.star_candy ?? 0);
  await quiz('npc', 'juanjuan', 3, 'cake_daily');
  assert.equal(await read(() => window.__mcv.G.s.inventory.star_candy), initialCandy + 1);
  assert((await visit('npc', 'juanjuan')).some(line => line.includes('明天再來')));
  assert.equal(await read(() => window.__mcv.G.s.inventory.star_candy), initialCandy + 1);
  await read(() => window.__mcv.G.exec({ type: 'newDay' }));
  await quiz('npc', 'juanjuan', 3);
  assert.equal(await read(() => window.__mcv.G.s.inventory.star_candy), initialCandy + 2);

  await warp('village', 8, 10);
  await visit('npc', 'mint');
  await quiz('npc', 'mint', 5, 'science');
  await warp('rootvillage', 15, 16);
  await visit('npc', 'yuzu');
  await quiz('npc', 'yuzu', 5, 'english');
  await warp('village', 6, 10);
  await visit('npc', 'toast');
  await quiz('npc', 'toast', 5, 'math');

  const ids = [7, 10, 11, 12, 15, 18, 19, 20].map(no => `c2s${no}`);
  await read(() => window.__mcv.G.save());
  await page.reload();
  await page.getByRole('button', { name: /繼續遊戲/ }).tap();
  await ready();
  for (const id of ids) assert.equal(await status(id), 'done', id);
  assert.deepEqual(await page.evaluate(ids => {
    const { s } = window.__mcv.G;
    return ids.filter(id => s.stickers.includes(`${id}_sticker`));
  }, ids), ids);
  assert.equal(await read(() => window.__mcv.G.s.kindCh2), startingKindness + 11);
  assert.equal(await read(() => window.__mcv.G.s.flags.daily_c2_cake), true);
  assert.deepEqual(errors, []);
  console.log('RESULT PASS');
} catch (error) {
  console.error('RESULT FAIL', error, errors);
  process.exitCode = 1;
} finally {
  await browser?.close();
}
