import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { riverWalk } from './ch3_walk.mjs';
import { battle2, launch } from './lib.mjs';

const url = new URL(process.env.URL || 'http://localhost:4173/');
url.searchParams.set('debug', '1');
const fixtures = new URL('./fixtures/', import.meta.url);
const oldSave = readFileSync(new URL('ch2_done.json', fixtures), 'utf8');
const { browser, page, errors } = await launch(url.href);
page.setDefaultTimeout(12_000);
const { dialogue, button, getState, currentMap, capture, settle, meet, leave, done, bank } = riverWalk(page, 'c3a');

async function grassBattle() {
  // 從可達的相鄰草地來回走。保留遇敵步數門檻，只在檢查遇敵的那一步固定機率。
  const cells = await page.evaluate(() => {
    const w = window.__mcv.G.world;
    const paths = [];
    for (let row = 1; row < w.map.tiles.length - 1; row++) {
      for (let col = 1; col < w.map.tiles[row].length - 1; col++) {
        if (!/[Ggy]/.test(w.map.tiles[row][col]) || w.blocked[row][col]) continue;
        for (const [dx, dy] of [[1, 0], [0, 1]]) {
          if (!/[Ggy]/.test(w.map.tiles[row + dy][col + dx]) || w.blocked[row + dy][col + dx]) continue;
          const here = { x: col * 32 + 16, y: row * 32 + 16 };
          const path = w.findPath(w.player.x, w.player.y - 4, here.x, here.y, false);
          if (path) paths.push({ n: path.length, cells: [here, { x: here.x + dx * 32, y: here.y + dy * 32 }] });
        }
      }
    }
    if (!paths.length) throw Error('蘆管灘找不到能走到的草地');
    return paths.sort((a, b) => a.n - b.n)[0].cells;
  });
  await page.evaluate(() => { window.seekReedEncounter = true; });
  for (let i = 0; i < 32; i++) {
    await page.evaluate(cell => {
      const w = window.__mcv.G.world;
      w.path = w.findPath(w.player.x, w.player.y - 4, cell.x, cell.y, false);
    }, cells[i % 2]);
    await page.waitForFunction(() => !window.__mcv.G.world.path.length);
    if (await page.evaluate(() => window.__mcv.G.busy > 0)) break;
  }
  await page.locator('.cmds button').first().waitFor();
  assert.equal(await page.evaluate(() => window.__mcv.game.scene.getScene('Battle').bg.texture.key), 'reedbg');
  await page.locator('.pslot[data-id="mizhou"]').waitFor();
  const foes = await page.evaluate(() => window.__mcv.game.scene.getScene('Battle').foes.map(f => f.def.id));
  assert(foes.some(id => ['reedpuff', 'footchestnut'].includes(id)));
  await capture('11_蘆管灘遇敵');
  const wins = (await getState()).stats.won;
  await battle2(page);
  await settle();
  assert.equal((await getState()).stats.won, wins + 1);
  assert.equal(await currentMap(), 'reedbeach');
}

try {
  await page.evaluate(save => localStorage.setItem('mcv_save_v1', save), oldSave);
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 45_000 });
  await page.getByRole('button', { name: /繼續遊戲/ }).tap();
  await page.waitForFunction(() => window.__mcv.G.world?.map?.id === 'rootvillage');
  await settle();
  await page.evaluate(() => {
    const w = window.__mcv.G.world;
    const grassStep = w.onGrassStep;
    w.onGrassStep = function () {
      if (!window.seekReedEncounter) return;
      const random = Math.random;
      try {
        Math.random = () => 0;
        grassStep.call(this);
      } finally { Math.random = random; }
    };
  });
  assert.equal((await getState()).quests.c3m1?.status, 'available');
  await meet('gugu');
  await leave('mistpath');
  await meet('c3_purple_leaf');
  await leave('echovalley');
  await meet('manman');
  await done('c3m1');
  await meet('manman', { until: dialogue.getByRole('button', { name: /搭船去蘆管灘/ }) });
  await capture('01_慢慢渡口');
  await settle({ choice: '搭船去蘆管灘' });
  assert.equal(await currentMap(), 'reedbeach');
  await meet('xiaosui', { until: dialogue.locator('.dlg-name').filter({ hasText: /^小穗$/ }) });
  await dialogue.locator('.dlg-next').waitFor();
  await capture('02_蘆管灘的小穗');
  await settle();
  await done('c3m2');
  await meet('xiaosui');
  await leave('twobanks');
  await meet('c3_aunt');
  await meet('mizhou');
  await done('c3m3');
  await capture('03_兩岸村的船棚');
  await meet('lan_c3_twobanks');

  await meet('xiaosui', { until: button('寫一句話') });
  await button('寫一句話').tap();
  assert.equal(await page.locator('.letter-choice').count(), 3);
  await capture('04_小穗的朋友信');
  await button('妳今天也有來嗎？').tap();
  await settle();
  await done('c3m4');
  const outbound = (await getState()).letters[0];
  assert.deepEqual([outbound.from, outbound.to, outbound.mode, outbound.reply], ['小穗', '點點', 'paper', undefined]);
  await meet('mizhou'); // 接下半張圖，順路記下三個靠岸處。
  assert.equal((await getState()).quests.c3s5.status, 'active');
  await leave('reedbeach');
  await meet('lan_c3_reedbeach');
  await meet('c3_hollow_reed');
  assert.equal((await getState()).observation, JSON.parse(oldSave).observation + 1);
  await meet('c3_map_reed');
  await leave('twobanks');
  await bank('west', 'east');
  await capture('05_渡船到東岸');
  await meet('c3_map_east');
  await leave('knotbridge');
  await meet('lan_c3_knotbridge');
  await meet('c3_map_bridge');
  await meet('c3_flag_seeds');
  await meet('diandian', { until: button('收好') });
  assert.match(await page.locator('.letter-reply').innerText(), /揮/);
  await capture('06_點點的回信');
  await button('收好').tap();
  await settle();
  await done('c3m5');
  assert.equal((await getState()).friendship, 2);
  await capture('07_雙結橋');
  await leave('twobanks');
  await bank('east', 'west');
  await meet('xiaosui');
  const delivery = (await getState()).quests.c3m6;
  assert.deepEqual([delivery.status, delivery.prog.return], ['active', 1]);
  await bank('west', 'east');
  await done('c3m6');
  await capture('08_兩邊都到了');
  assert(await page.evaluate(() => {
    const w = window.__mcv.G.world;
    const x = id => w.npcs.find(n => n.def.id === id).spr.x;
    return x('xiaosui') > x('c3_ferry_east') && w.player.x > x('c3_ferry_east') && x('diandian') < x('c3_ferry_west');
  }));
  const returned = await getState();
  assert(returned.friendship > 2 && returned.journal[3].friendshipEvents.length >= 2);
  assert(!returned.members.mizhou?.joined, '米舟還沒入隊也能幫兩個朋友換岸');
  await bank('east', 'west');
  await meet('mizhou', { choice: '改天再邀' });
  await done('c3s5');
  const finishedMap = await getState();
  assert(!finishedMap.members.mizhou?.joined);
  assert(finishedMap.stickers.includes('c3_mizhou_map'));
  await meet('mizhou', { choice: '邀米舟同行', until: page.locator('.reward').filter({ hasText: '米舟加入隊伍' }) });
  await capture('09_邀米舟同行');
  await settle({ choice: '先跟在後面' });
  assert((await getState()).members.mizhou.joined);
  assert.equal((await getState()).friendship, finishedMap.friendship);
  for (const [index, choice] of ['把船墊分一半', '跟著節奏划', '一起收好河道圖'].entries()) {
    await meet('mizhou', { choice });
    assert((await getState()).flags['c3_mizhou_bond' + (index + 1)], choice);
  }
  await page.locator('.sys-btn').tap();
  await button('隊伍').tap();
  const row = name => page.locator('.mem-row').filter({ hasText: name });
  await row('阿栗').getByText('上場中').tap();
  await row('米舟').getByText('休息中').tap();
  assert((await getState()).party.includes('mizhou'));
  await capture('10_米舟上場');
  await button('勇士日記').tap();
  await button('第三章').tap();
  assert.match(await page.locator('.journal-page').innerText(), /小穗/);
  await page.locator('.sys-head .x').tap();
  await leave('reedbeach');
  await grassBattle();
  await page.evaluate(() => { window.seekReedEncounter = false; });
  await leave('twobanks');
  await meet('c3_grocer', { until: page.locator('.sys-head').filter({ hasText: '兩岸村雜貨' }) });
  await page.locator('.sys-head .x').tap();
  await settle();
  await meet('c3_aunt', { choice: '休息和存檔' });
  const checkpoint = await page.evaluate(() => JSON.parse(localStorage.getItem('mcv_save_v1')));
  assert.equal(checkpoint.map, 'twobanks');
  assert.equal(checkpoint.friendship, 8);
  assert.equal(checkpoint.bonds.mizhou, 3);
  for (const id of ['c3m1', 'c3m2', 'c3m3', 'c3m4', 'c3m5', 'c3m6', 'c3s5']) assert.equal(checkpoint.quests[id]?.status, 'done');
  for (const id of ['reedbeach', 'twobanks', 'knotbridge']) assert(checkpoint.flags['lan_c3_' + id]);
  assert(checkpoint.party.includes('mizhou'));
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 45_000 });
  await page.getByRole('button', { name: /繼續遊戲/ }).tap();
  await page.waitForFunction(() => window.__mcv.G.world?.map?.id === 'twobanks');
  await settle();
  assert.deepEqual((await getState()).letters, checkpoint.letters);
  await meet('lan_c3_twobanks', { choice: '好，移動！', until: page.locator('.inv-row').filter({ hasText: '東橋頭的燈籠' }) });
  await page.locator('.inv-row').filter({ hasText: '東橋頭的燈籠' }).getByRole('button', { name: '去', exact: true }).tap();
  await page.waitForFunction(() => window.__mcv.G.world.map.id === 'knotbridge');
  await settle();

  // 存檔已留在船棚。讓主角以一點 HP 獨自防禦，驗證第三章的敗戰救援。
  await page.evaluate(() => {
    const { G } = window.__mcv;
    G.s.party = ['hero'];
    G.s.members.hero.hp = 1;
    G.s.befriended = {};
    G.world.startBattle(G.world.map.encounter, false);
  });
  await page.locator('.cmds').getByRole('button', { name: /防禦/ }).tap();
  await settle({ until: page.locator('.reward').filter({ hasText: '被小白貓救回兩岸村的船棚' }) });
  await settle();
  const rescued = await getState();
  assert.equal(rescued.map, 'twobanks');
  assert.equal(rescued.money, checkpoint.money - Math.max(5, Math.ceil(checkpoint.money * .1)));
  assert.equal(rescued.stats.lost, checkpoint.stats.lost + 1);
  for (const stat of ['courage', 'kindness', 'observation', 'friendship', 'honesty', 'love', 'hope']) {
    assert.equal(rescued[stat], checkpoint[stat], stat);
  }
  assert.deepEqual(errors, []);
  if (process.argv.includes('--write-fixture')) {
    writeFileSync(new URL('ch3_m6.json', fixtures), JSON.stringify(checkpoint, null, 2) + '\n');
  }
  console.log('RESULT PASS');
} catch (error) {
  const position = await page.evaluate(() => {
    const { G } = window.__mcv;
    return { map: G.s.map, pos: G.world?.playerPos(), quest: G.s.tracked, text: document.querySelector('#ui').innerText.slice(-700) };
  }).catch(() => null);
  console.error('RESULT FAIL', error, position, errors);
  process.exitCode = 1;
} finally {
  await browser.close();
}
