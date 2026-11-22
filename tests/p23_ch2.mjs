import assert from 'node:assert/strict';
import { launch, SHOTS, sleep, state, tapGlint, tapNpc, tapTo } from './lib.mjs';

const url = new URL(process.env.URL || 'http://localhost:4173/');
url.searchParams.set('debug', '1');
const skip = new URL(url);
skip.searchParams.set('skip', '1');
const { browser, page, errors } = await launch(skip.href);
page.setDefaultTimeout(8000);
async function shot(name) {
  const png = await page.screenshot({ path: `${SHOTS}/${name}.png`, scale: 'css' });
  assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [390, 844]);
  console.log('截圖', name);
}
const grid = (col, row) => [col * 32 + 16, row * 32 + 20];
const withGame = fn => page.evaluate(fn);

async function finish(quest) {
  await page.waitForFunction(q => window.__mcv.G.s.quests[q]?.status === 'done', quest);
  console.log('完成', quest);
}

async function settle({ choices = [], stopOn } = {}) {
  const texts = [];
  const dialogue = page.locator('.dlg:not(.hidden)');
  const reward = page.locator('.reward button');
  const deadline = Date.now() + 30_000;
  for (let idle = 0; idle < 6;) {
    assert(Date.now() < deadline, '對話或獎勵等候逾時');
    if (await stopOn?.()) return texts;
    if (await reward.isVisible()) {
      await reward.tap();
      idle = 0;
      continue;
    }
    const quizNext = page.locator('.quiz .qz-next');
    const answer = page.locator('.quiz .qz-btn:not([disabled])').first();
    if (await quizNext.isVisible() || await answer.isVisible()) {
      await (await quizNext.isVisible() ? quizNext : answer).tap();
      idle = 0;
      continue;
    }
    const buttons = dialogue.locator('.choices button');
    if (await buttons.first().isVisible()) {
      if (await stopOn?.()) return texts;
      const wanted = choices.shift();
      await (wanted ? buttons.filter({ hasText: wanted }) : buttons.first()).tap();
      idle = 0;
      continue;
    }
    const next = dialogue.locator('.dlg-next');
    if (await next.isVisible()) {
      const text = await dialogue.locator('.dlg-text').innerText();
      texts.push(text);
      await dialogue.locator('.dlg-text').tap();
      await page.waitForFunction(previous => {
        const line = document.querySelector('.dlg:not(.hidden) .dlg-text');
        return !line || line.textContent !== previous || !!document.querySelector('.reward button');
      }, text, { timeout: 8000 });
      idle = 0;
      continue;
    }
    if (await withGame(() => window.__mcv.G.busy === 0)) idle++;
    await sleep(70);
  }
  return texts;
}

async function at(col, row) {
  const [x, y] = grid(col, row);
  if (await tapTo(page, x, y)) return;
  // 隊友可能剛好擋在點擊的位置。關閉閒聊後用方向鍵走過去。
  if (await withGame(() => window.__mcv.G.busy > 0)) await settle();
  for (const [coord, target, negative, positive] of [
    ['x', x, 'ArrowLeft', 'ArrowRight'], ['y', y, 'ArrowUp', 'ArrowDown'],
  ]) {
    const now = (await state(page))[coord];
    if (Math.abs(now - target) <= 6) continue;
    await page.keyboard.down(now > target ? negative : positive);
    try {
      await page.waitForFunction(([coord, target, past]) => {
        const position = window.__mcv.G.world.player[coord];
        return past ? position <= target + 6 : position >= target - 6;
      }, [coord, target, now > target], { timeout: 3500 });
    } finally {
      await page.keyboard.up(now > target ? negative : positive);
    }
  }
}

async function step(col, row, key, stop) {
  await at(col, row);
  await page.keyboard.down(key);
  try {
    await page.waitForFunction(stop, null, { timeout: 5000 });
  } finally {
    await page.keyboard.up(key);
  }
}

const dialogueUp = () => !!document.querySelector('.dlg:not(.hidden)');
const saveData = () => withGame(() => ({
  kindness: window.__mcv.G.s.kindness,
  shares: window.__mcv.G.s.stats.shares,
  food: window.__mcv.G.s.inventory.sweet_potato,
}));

try {
  // 寫入舊格式的第一章通關存檔，接下來使用正常的繼續遊戲流程。
  await page.locator('.hud-name').waitFor();
  await withGame(() => {
    const save = structuredClone(window.__mcv.G.s);
    for (let n = 1; n <= 12; n++) save.quests[`main${n}`] = { status: 'done', prog: {}, seen: {} };
    Object.assign(save, { map: 'forest', x: 368, y: 1268, dir: 0, courage: 8, observation: 3, tracked: null, chapterDone: true });
    for (const id of ['hero', 'ali', 'mint', 'yuzu']) {
      save.members[id] = { id, lv: id === 'hero' ? 11 : 10, hp: id === 'hero' ? 80 : 55, mp: 12, exp: 0, joined: id !== 'hero' };
    }
    save.party = ['hero', 'ali', 'mint'];
    save.bonds = { ali: 3, mint: 2, yuzu: 2 };
    save.weapon = 'wooden_sword';
    Object.assign(save.inventory, { wooden_sword: 1, sticker_book: 1, cookie: 5, herb_tea: 2 });
    save.stickers = ['moon_paw', 'forest_view', 'moon_feast'];
    save.flags.catSpeech = save.flags.system = true;
    delete save.kindness;
    delete save.stats.shares;
    localStorage.setItem('mcv_save_v1', JSON.stringify(save));
  });
  await page.goto(url.href);
  await page.getByRole('button', { name: /繼續遊戲/ }).tap();
  await page.locator('.hud-name').waitFor();
  await sleep(550); // 等地圖淡入與防誤觸時間結束。
  // 排除逃跑和暗雷的小機率，保留 Phaser 產生貼圖識別碼需要的亂數。
  await withGame(() => {
    const random = Math.random;
    Math.random = () => 0.25 + random() * 0.5;
  });
  assert(await tapNpc(page, 'rock'));
  await page.getByText('小豆芽在裡頭？好！我來推！').waitFor();
  await settle();
  await at(11, 41);
  await shot('c2_01_entrance');
  assert.equal((await saveData()).food, 3);
  assert(await withGame(() => ['grow_cookie', 'shrink_dew'].every(id => window.__mcv.G.s.inventory[id] === 1)));

  await step(11, 41, 'ArrowDown', () => window.__mcv.G.s.map === 'mistpath');
  await page.getByText('紫霧從樹根間飄過。小白貓就在前頭。').waitFor();
  await shot('c2_02_mistpath');
  await settle();
  await finish('c2m1');
  assert(await tapNpc(page, 'lan_c2_south'));
  await settle();
  assert(await withGame(() => window.__mcv.G.s.flags.lan_c2_south));

  await step(10, 34, 'ArrowUp', dialogueUp);
  await settle({ stopOn: () => page.locator('.battle-ui').isVisible() });
  await page.locator('.battle-ui').waitFor();
  assert.equal(await withGame(() => window.__mcv.game.scene.getScene('Battle').bg.texture.key), 'mistbg');
  for (const [i, foe] of ['霧團子A', '霧團子B'].entries()) {
    await page.getByRole('button', { name: '🍪 道具', exact: true }).tap();
    await page.getByRole('button', { name: /烤番薯/ }).tap();
    if (i === 0) {
      assert.deepEqual(await page.locator('.battle-ui .pslot[data-id]').evaluateAll(rows => rows.map(row => row.dataset.id)), ['hero', 'ali', 'mint']);
      await shot('c2_03_share');
    }
    await page.getByRole('button', { name: new RegExp(foe) }).tap();
    for (const id of ['ali', 'mint']) {
      await page.locator(`.pslot.active[data-id="${id}"]`).waitFor();
      await page.getByRole('button', { name: '🛡️ 防禦', exact: true }).tap();
    }
    await page.locator('.bmsg').filter({ hasText: `${foe}：「謝謝妳分我吃！」` }).waitFor();
    console.log('分享', foe);
  }
  await page.locator('.battle-ui').waitFor({ state: 'detached', timeout: 15000 });
  await settle();
  await finish('c2m2');
  assert.deepEqual(await saveData(), { kindness: 3, shares: 2, food: 1 });
  assert(await withGame(() => window.__mcv.G.world.npcs.some(n => n.def.id === 'c2_mist_guide')));

  await at(9, 25);
  await step(9, 24, 'ArrowUp', dialogueUp);
  const untie = page.getByRole('button', { name: '先幫小松鼠解開' });
  await settle({ stopOn: () => untie.isVisible() });
  await untie.waitFor();
  await shot('c2_04_net');
  await settle({ choices: ['先幫小松鼠解開'] });
  await finish('c2m3');

  await at(10, 17);
  await step(18, 16, 'ArrowRight', () => window.__mcv.G.s.map === 'rootvillage');
  await page.getByText('屋頂都掉下來了……我們要住哪裡？').waitFor();
  await settle();
  for (let i = 1; i <= 3; i++) {
    assert(await tapGlint(page, `c2_planks_${i}`));
    await settle();
  }
  await finish('c2m4');
  assert(await withGame(() => {
    const { G } = window.__mcv;
    return G.world.followers.some(n => n.def.id === 'rock') && !G.s.guest && !G.s.party.includes('rock');
  }));
  const litVillageLamps = () => withGame(() => window.__mcv.G.world.condProps
    .filter(prop => prop.texture.key === 'c2_lamp_on').length);
  assert.equal(await litVillageLamps(), 2);
  await at(9, 18);
  await shot('c2_05_repaired');
  assert(await tapGlint(page, 'c2_rest'));
  await settle({ choices: ['休息和存檔'] });
  assert(await withGame(() => JSON.parse(localStorage.getItem('mcv_save_v1')).map === 'rootvillage'));

  await step(7, 13, 'ArrowLeft', () => window.__mcv.G.s.map === 'mistpath');
  await page.waitForFunction(() => window.__mcv.G.busy === 0);
  assert(await withGame(() => window.__mcv.G.world.followers.every(n => n.def.id !== 'rock')));
  await at(10, 15);
  await at(10, 14);
  await shot('c2_06_footprints');
  for (let i = 1; i <= 3; i++) {
    assert(await tapGlint(page, `c2_print_${i}`));
    await settle();
  }

  await step(10, 6, 'ArrowUp', dialogueUp);
  const sprout = page.locator('.dlg:not(.hidden) .dlg-name').filter({ hasText: /^小豆芽$/ });
  await settle({ stopOn: () => sprout.isVisible() });
  await finish('c2m5');
  await page.getByText('噓——牠不是壞蛋，牠好痛。').waitFor();
  await page.locator('.toast').first().waitFor({ state: 'detached' });
  await shot('c2_07_antler');
  await settle();
  assert(await withGame(() => window.__mcv.G.world.followers.some(n => n.def.id === 'sprout')));
  assert(await tapGlint(page, 'c2_valley_vines'));
  const ending = await settle();
  assert(ending.some(t => t.includes('藤蔓擋住了路')));

  await at(10, 10);
  assert(await tapNpc(page, 'lan_c2_north'));
  await settle();
  assert(await tapNpc(page, 'lan_c2_north'));
  const travel = page.getByRole('button', { name: '好，移動！' });
  await travel.tap();
  const destination = page.locator('.inv-row').filter({ hasText: '林道入口的燈籠' });
  await destination.getByRole('button', { name: '去', exact: true }).tap();
  await page.waitForFunction(y => window.__mcv.G.busy === 0 && Math.abs(window.__mcv.G.world.player.y - y) < 5, grid(12, 34)[1] + 40);
  await sleep(350);
  assert(await tapNpc(page, 'lan_c2_south'));
  await travel.tap();
  await page.locator('.inv-row').filter({ hasText: '林道北邊的燈籠' }).getByRole('button', { name: '去', exact: true }).tap();
  await page.waitForFunction(y => window.__mcv.G.busy === 0 && Math.abs(window.__mcv.G.world.player.y - y) < 5, grid(12, 9)[1] + 40);

  await at(10, 15);
  await step(18, 16, 'ArrowRight', () => window.__mcv.G.s.map === 'rootvillage');
  await page.getByText('小豆芽！你回來了！').waitFor();
  await settle();
  await finish('c2m6');
  assert.equal(await litVillageLamps(), 3);
  await at(10, 19);
  await shot('c2_08_reunion');
  assert.deepEqual(await saveData(), { kindness: 11, shares: 2, food: 1 });
  assert.equal(await withGame(() => window.__mcv.G.s.quests.side14?.status === 'done'), false);
  await page.locator('.sys-btn').tap();
  await page.locator('.sys-tabs').getByRole('button', { name: '任務' }).tap();
  await page.getByText('第二章・6. 找到小豆芽').waitFor();
  await page.locator('.sys-head .x').tap();

  async function interact(tap, id, options) {
    const kind = tap === tapNpc ? 'npc' : 'glint';
    // 支線互動從相鄰的可走格開始，避免畫面邊緣與隊友遮住點擊目標。
    const found = await page.evaluate(([kind, id]) => {
      const world = window.__mcv.G.world;
      const target = (kind === 'npc' ? world.npcs : world.glints).find(entry => entry.def.id === id);
      if (!target) return false;
      if (world.distTo({ kind, ...target }) >= 60) {
        const x = target.spr.x;
        const y = kind === 'npc' ? target.spr.getData('gy') - 4 : target.def.y;
        const path = world.findPath(world.player.x, world.player.y - 4, x, y, true);
        if (!path) return false;
        world.path = path;
      }
      return true;
    }, [kind, id]);
    assert(found, `無法走到 ${id}`);
    await page.waitForFunction(() => !window.__mcv.G.world.path.length);
    await page.evaluate(([kind, id]) => {
      const world = window.__mcv.G.world;
      const target = (kind === 'npc' ? world.npcs : world.glints).find(entry => entry.def.id === id);
      if (!target || world.distTo({ kind, ...target }) >= 60) throw new Error(`未走到 ${id} 身旁`);
      void world.doInteract({ kind, ...target });
    }, [kind, id]);
    await settle(options);
  }
  // 其餘流程靠地圖探索，不讓隨機遇敵打斷支線互動。
  await withGame(() => { window.__mcv.G.world.onGrassStep = () => {}; });
  await interact(tapNpc, 'gugu');
  for (const house of ['shop', 'inn', 'sprout', 'elder']) {
    if (house !== 'elder') await interact(tapGlint, `c2_house_${house}_material`);
    await interact(tapGlint, `c2_house_${house}`);
    assert(await withGame(() => window.__mcv.G.world.condProps.filter(p => p.texture.key === 'c2_house_fixed').length)
      >= ['shop', 'inn', 'sprout', 'elder'].indexOf(house) + 2);
  }
  await finish('c2s6');
  await at(10, 15);
  await shot('c2_11_village_fixed');
  await interact(tapNpc, 'gob1', { choices: ['試試普通的'] });
  await finish('c2s17');
  await step(7, 13, 'ArrowLeft', () => window.__mcv.G.s.map === 'mistpath');
  await page.waitForFunction(() => window.__mcv.G.busy === 0);

  await interact(tapNpc, 'pudding');
  for (const id of ['c2_bird_moss', 'c2_bird_dew']) await interact(tapGlint, id);
  await interact(tapNpc, 'pudding', { stopOn: () => page.getByText('布丁加入隊伍了喵！').isVisible() });
  await shot('c2_09_pudding_join');
  await settle();
  await finish('c2s1');
  assert(await withGame(() => window.__mcv.G.s.members.pudding.joined));

  await interact(tapNpc, 'yuanyuan');
  await shot('c2_10_doors');
  for (const [i, obj] of ['polite', 'measure', 'opposite'].entries()) {
    if (i === 0) {
      await interact(tapGlint, 'c2_door_polite', { stopOn: () => page.locator('.quiz .qz-btn').first().isVisible() });
      await page.getByRole('button', { name: '把筆給我！', exact: true }).tap();
      await page.getByText(/先說「請問」/).waitFor();
      await shot('c2_13_quiz');
      await settle();
    } else await interact(tapGlint, `c2_door_${obj}`);
  }
  await finish('c2s13');

  for (let i = 1; i <= 3; i++) {
    await interact(tapNpc, `c2_lost_puff${i}`);
    assert(await page.evaluate(id => window.__mcv.G.world.followers.some(n => n.def.id === id), `c2_lost_puff${i}`));
    await interact(tapGlint, `c2_puff_home${i}`);
  }
  await finish('c2s9');

  await at(10, 15);
  await step(18, 16, 'ArrowRight', () => window.__mcv.G.s.map === 'rootvillage');
  await page.waitForFunction(() => window.__mcv.G.busy === 0);
  await at(10, 2);
  await page.getByText('吃餅乾變大', { exact: true }).tap();
  await interact(tapGlint, 'c2_climb');
  await interact(tapNpc, 'pengpeng');
  await finish('c2s14');
  assert.equal(await withGame(() => window.__mcv.G.s.inventory.moon_dew), 1);

  await page.locator('.sys-btn').tap();
  await page.locator('.sys-tabs').getByRole('button', { name: '隊伍' }).tap();
  await page.locator('.mem-row').filter({ hasText: '薄荷' }).getByRole('button', { name: '上場中' }).tap();
  await page.locator('.mem-row').filter({ hasText: '布丁' }).getByRole('button', { name: '休息中' }).tap();
  await page.locator('.sys-tabs').getByRole('button', { name: '屬性' }).tap();
  await page.locator('.sys-body').getByText(/善良值/).first().waitFor();
  await page.locator('.sys-body').getByText('布丁', { exact: true }).waitFor();
  await shot('c2_12_status');
  assert.deepEqual(errors, []);
  console.log('RESULT PASS');
} catch (error) {
  console.error('RESULT FAIL', error, await state(page).catch(() => null), errors);
  await shot('c2_debug').catch(() => {});
  process.exitCode = 1;
} finally {
  await browser.close();
}
