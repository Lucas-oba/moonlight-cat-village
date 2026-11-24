import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { launch } from './lib.mjs';
import { riverWalk } from './ch3_walk.mjs';
import { playFaner } from './faner_battle.mjs';

const url = new URL(process.env.URL || 'http://localhost:4173/');
url.searchParams.set('debug', '1');
const fixtures = new URL('./fixtures/', import.meta.url);
const oldSave = readFileSync(new URL('ch3_m6.json', fixtures), 'utf8');
const { browser, page, errors } = await launch(url.href);
page.setDefaultTimeout(15_000);
const { dialogue, button, getState, capture, settle, meet, leave, done, bank } = riverWalk(page, 'c3b');
const line = text => dialogue.locator('.dlg-text').filter({ hasText: text });
const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('mcv_save_v1')));
const flagsOnBridge = () => page.evaluate(() =>
  window.__mcv.G.world.condProps.filter(p => p.texture.key === 'c3_flag').length);
const outerBridgeOpen = () => page.evaluate(() => {
  const w = window.__mcv.G.world;
  return !!w.findPath(w.player.x, w.player.y - 4, 11 * 32 + 16, 21 * 32 + 16, false);
});

async function continueGame() {
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /繼續遊戲/ }).tap();
  await page.waitForFunction(() => window.__mcv.G.world?.map?.id === 'twobanks');
  await settle();
}
try {
  await page.evaluate(save => localStorage.setItem('mcv_save_v1', save), oldSave);
  await continueGame();
  const before = await getState();
  assert.equal(before.chapter3Done, false);
  assert.equal(before.quests.c3m7.status, 'active');
  // 走同一條路拍照。一般草地遇敵由 p29 驗證，這裡保留主線固定戰鬥。
  await page.evaluate(() => { window.__mcv.G.world.onGrassStep = () => {}; });

  await bank('west', 'east');
  await leave('reedbeach');
  await meet('c3_stand_east', { until: line('點點在敲木片！可是我只聽見') });
  await dialogue.locator('.dlg-next').waitFor();
  await capture('01_站到對方位置');
  await settle();
  assert.equal((await getState()).quests.c3m7.status, 'active');
  await leave('twobanks');
  await bank('east', 'west');
  await leave('reedbeach');
  await meet('c3_stand_west');
  await done('c3m7');

  await leave('twobanks');
  await leave('knotbridge');
  assert.equal(await outerBridgeOpen(), false);
  assert.equal(await flagsOnBridge(), 0);
  await meet('c3_flag_west');
  assert.equal(await flagsOnBridge(), 1);
  await meet('c3_flag_east', { until: line('我看見妳了！兩個紅點') });
  await dialogue.locator('.dlg-next').waitFor();
  await done('c3m8');
  assert.equal(await flagsOnBridge(), 2);
  await capture('02_兩面旗');
  await settle();
  assert.equal(await page.evaluate(() =>
    window.__mcv.G.world.npcs.find(n => n.def.id === 'c3_faner')?.spr.texture.key), 'faner_map');
  await meet('c3_faner', { until: line('是帆耳。牠的耳尖') });
  await dialogue.locator('.dlg-next').waitFor();
  await capture('03_帆耳被纏住');
  await settle();
  await done('c3m9');
  await meet('c3_faner', { until: dialogue.getByRole('button', { name: '慢慢走近帆耳' }) });
  await playFaner(page, capture);
  await settle();
  await done('c3m10');

  await meet('c3_seedpot');
  await done('c3m11');
  assert.equal((await getState()).inventory.c3_seedpot, 1);
  assert.equal(await outerBridgeOpen(), true);
  await page.locator('.sys-btn').tap();
  await button('背包').tap();
  await button('重要物品').tap();
  const pot = page.locator('.inv-row').filter({ has: page.locator('img.seedpot-icon') });
  assert.match(await pot.innerText(), /種子/);
  assert.equal(await pot.getByRole('button').count(), 0);
  await capture('09_種子小盆');
  await page.locator('.sys-head .x').tap();
  await meet('c3_rainhill_sign', { until: line('往雨點坡的路（第四章製作中）') });
  await settle();

  await leave('twobanks', 5);
  await meet('xiaosui', { until: page.locator('.dlg.bow-flash:not(.hidden)') });
  await settle({ until: line('等……') });
  await settle({ until: page.locator('.chapter-three') });
  const ending = page.locator('.chapter-three');
  assert.equal(await ending.locator('h2').textContent(), '第三章完成喵！');
  assert.equal(await ending.locator('.ce-next h1').textContent(), '第四章　水輪少了一格（製作中）');
  assert.match(await ending.evaluate(e => e.style.backgroundImage), /c3_ending\.jpg/);
  const checkpoint = await saved();
  const stat = label => ending.locator('.ce-stats div').filter({ has: page.getByText(label, { exact: true }) }).locator('b').textContent();
  const sides = await page.evaluate(() => Object.values(window.__mcv.QUESTS).filter(q => q.chapter === 3 && q.kind === 'side').length);
  assert.equal(await stat('完成的主線'), '12 / 12');
  assert.equal(await stat('完成的支線'), '1 / ' + sides);
  const riverStickers = new Set(['reedpuff_talk', 'reedpuff_defeat', 'footchestnut_talk', 'footchestnut_defeat']);
  const questStickers = await page.evaluate(() => Object.values(window.__mcv.QUESTS)
    .filter(q => q.chapter === 3 && q.rewards.sticker).map(q => q.rewards.sticker));
  for (const id of questStickers) riverStickers.add(id);
  for (const id of ['c3_reed_steps', 'c3_village_ferry', 'c3_bridge_flag', 'c3_mizhou_map', 'c3_faner_friend']) {
    assert(checkpoint.stickers.includes(id), id);
  }
  assert.equal(await stat('喵喵貼紙'), checkpoint.stickers.filter(id => riverStickers.has(id)).length + ' / ' + riverStickers.size);
  assert.equal(await stat('🤝 友誼值'), String(checkpoint.journal[3].friendship));
  assert.equal(checkpoint.chapter3Done, true);
  for (let n = 1; n <= 12; n++) assert.equal(checkpoint.quests['c3m' + n].status, 'done');
  assert.equal(checkpoint.chapter2Done, before.chapter2Done);
  assert.equal(checkpoint.chapterDone, before.chapterDone);
  assert.equal(checkpoint.inventory.c3_seedpot, 1);
  await capture('10_章末畫面');
  await button('繼續冒險').tap();
  const journal = page.locator('.journal-page');
  assert.equal(await page.locator('.sub-tabs button.on').textContent(), '第三章');
  const story = await journal.innerText();
  assert.match(story, /橋的另一頭/);
  const entry = checkpoint.journal[3];
  assert(entry.friendship > before.journal[3].friendship);
  assert.equal(entry.friendship, checkpoint.friendship);
  assert.match(story, new RegExp('友誼值 🤝 ' + entry.friendship));
  for (const event of entry.friendshipEvents) assert(story.includes(event), event);
  assert.match(story, /帆耳/);
  assert.match(story, /接到轉輪村的船/);
  assert.deepEqual(checkpoint.journal[2], before.journal[2]);
  await capture('11_日記');
  await page.locator('.sys-head .x').tap();
  await settle();
  await continueGame();
  assert.equal((await getState()).inventory.c3_seedpot, 1);
  assert.equal((await getState()).chapter3Done, true);
  assert.deepEqual(errors, []);
  if (process.argv.includes('--write-fixture')) {
    writeFileSync(new URL('ch3_done.json', fixtures), JSON.stringify(checkpoint, null, 2) + '\n');
  }
  console.log('RESULT PASS');
} catch (error) {
  const status = await page.evaluate(() => {
    const { G } = window.__mcv;
    return { map: G.s.map, position: G.world?.playerPos(), quest: G.s.tracked, text: document.querySelector('#ui').innerText.slice(-900) };
  }).catch(() => null);
  console.error('RESULT FAIL', error, status, errors);
  process.exitCode = 1;
} finally {
  await browser.close();
}
