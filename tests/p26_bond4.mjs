import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { advance, launch, shot } from './lib.mjs';

const url = new URL(process.env.URL || 'http://localhost:4173/');
url.searchParams.set('debug', '1');
const fixture = JSON.parse(readFileSync(new URL('./fixtures/ch2_m10.json', import.meta.url), 'utf8'));
const capture = name => shot(page, `c2c_bond_${name}`);
const cmd = name => page.locator('.cmds').getByRole('button', { name });
const sub = name => page.locator('.sublist').getByRole('button', { name });
const memberTurn = who => page.locator(`.pslot.active[data-id="${who}"]`).waitFor();
let browser, ctx, page, errors;

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
    const options = kind === 'glint' ? world.glints : [...world.npcs, ...world.followers];
    const target = options.find(n => n.def.id === id);
    if (!target) throw Error(`在 ${world.map.id} 找不到 ${id}`);
    void world.doInteract({ ...target, kind });
  }, [kind, id]);
}
async function visit(kind, id, options) {
  await interact(kind, id);
  await advance(page, { log: false, ...options });
  await ready();
}
async function camp(id, name, who, skill) {
  await warp('rootvillage', 7, 16);
  await interact('glint', 'c2_bond_camp');
  await page.getByRole('button', { name, exact: true }).tap();
  await page.getByText(`營火暖暖的。${name}在妳身邊坐下。`, { exact: true }).waitFor();
  await capture(who);
  await advance(page, { log: false });
  await ready();
  const actual = await page.evaluate(([id, who, skill]) => {
    const { s } = window.__mcv.G;
    return [s.quests[id].status, s.bonds[who], s.skills[who].filter(k => k === skill).length, s.stickers.includes(`${id}_bond`)];
  }, [id, who, skill]);
  assert.deepEqual(actual, ['done', 4, 1, true], id);
}
async function battle(party) {
  await page.evaluate(party => {
    const { G, FIXED } = window.__mcv;
    G.s.party = ['hero', ...party];
    G.s.befriended = {};
    G.s.inventory.cookie = 2;
    for (const id of G.s.party) G.s.members[id].hp = 42;
    FIXED.test_bond4 = { id: 'test_bond4', enemies: ['mossrock'], bg: 'echobg' };
    void G.battleHook('test_bond4', true);
  }, party);
  await cmd(/防禦/).waitFor();
  await page.evaluate(() => {
    const sc = window.__mcv.game.scene.getScene('Battle');
    sc.foes[0].def = { ...sc.foes[0].def, skills: [], spd: 1, atk: 40 };
    sc.pickVictim = () => sc.ally('hero');
    const heal = Object.getPrototypeOf(sc).heal.bind(sc);
    window.bondHeals = [];
    sc.heal = (id, amount) => {
      window.bondHeals.push([sc.turn, id, amount]);
      return heal(id, amount);
    };
  });
}
async function skill(name) {
  await cmd(/技能/).tap();
  await sub(name).tap();
}
async function round(n) {
  await page.waitForFunction(n => {
    const sc = window.__mcv.game.scene.getScene('Battle');
    return sc.turn === n && document.querySelector('.pslot.active[data-id="hero"]') && document.querySelector('.cmds button');
  }, n);
}
async function finish() {
  await page.evaluate(() => {
    window.__mcv.game.scene.getScene('Battle').foes[0].hp = 1;
  });
  await cmd(/攻擊/).tap();
  for (let i = 0; i < 2; i++) await cmd(/防禦/).tap();
  await page.waitForFunction(() => !window.__mcv.game.scene.isActive('Battle'));
  await advance(page, { log: false });
  await ready();
}

try {
  ({ browser, ctx, page, errors } = await launch(url.href));
  page.setDefaultTimeout(15_000);
  await ctx.addInitScript(s => {
    if (!localStorage.getItem('mcv_save_v1')) localStorage.setItem('mcv_save_v1', JSON.stringify(s));
  }, fixture);
  await page.reload();
  await page.getByRole('button', { name: /繼續遊戲/ }).tap();
  await ready('echovalley');
  assert.deepEqual(await page.evaluate(() => window.__mcv.G.s.bonds), fixture.bonds);

  await visit('npc', 'ali');
  await visit('glint', 'c2_bond_rock', { choices: ['一起擋！'] });
  await visit('npc', 'c2_bond_child');
  await camp('c2s2', '阿栗', 'ali', 'split_guard');

  await visit('npc', 'mint');
  await warp('mistpath', 6, 25);
  await visit('glint', 'c2_bond_herb');
  await warp('rootvillage', 7, 16);
  await interact('npc', 'mint');
  await advance(page, { log: false, stopOn: () => page.locator('.qz-btn').first().isVisible() });
  await page.getByRole('button', { name: '乾燥的沙地中央' }).tap();
  assert.match(await page.locator('.qz-say').innerText(), /提示.*陰涼/);
  await page.getByRole('button', { name: '陰涼又潮溼的石頭上' }).tap();
  await advance(page, { log: false });
  await ready();
  await camp('c2s3', '薄荷', 'mint', 'forest_blessing');

  await warp('village', 21, 11);
  await visit('npc', 'yuzu');
  await visit('npc', 'c2_letter_village');
  await warp('mistpath', 9, 24);
  await visit('npc', 'c2_letter_mist');
  await warp('echovalley', 10, 26);
  await visit('npc', 'c2_letter_echo');
  await camp('c2s4', '柚子', 'yuzu', 'quick_delivery');

  await warp('mistpath', 7, 27);
  await visit('glint', 'c2_hollow_door');
  await visit('npc', 'pudding');
  await visit('glint', 'c2_bond_blanket');
  await camp('c2s5', '布丁', 'pudding', 'warm_blanket');
  await warp('mistpath', 7, 27);
  await visit('glint', 'c2_hollow_door');
  const money = await page.evaluate(() => {
    const { s } = window.__mcv.G;
    s.members.hero.hp = s.members.hero.mp = 1;
    return s.money;
  });
  await visit('npc', 'pudding', { choices: ['休息一下'] });
  const recovered = await page.evaluate(() => {
    const { s } = window.__mcv.G;
    return [s.money, s.members.hero.hp, s.members.hero.mp];
  });
  assert.equal(recovered[0], money);
  assert(recovered[1] > 42 && recovered[2] > 1);

  await page.evaluate(() => { void window.__mcv.G.ui.openPanel('quests'); });
  await page.getByRole('button', { name: '支線', exact: true }).tap();
  for (const title of ['一起擋！', '給大傢伙的藥', '沒有地址的信', '布丁的小病人']) {
    assert.match(await page.locator('.q-item h4').filter({ hasText: title }).innerText(), /羈絆/);
  }
  await page.locator('.sys-head .x').tap();
  await page.evaluate(() => window.__mcv.G.save());
  await page.reload();
  await page.getByRole('button', { name: /繼續遊戲/ }).tap();
  await ready('c2_pudding_hollow');
  assert.deepEqual(await page.evaluate(() => window.__mcv.G.s.bonds), { ali: 4, mint: 4, yuzu: 4, pudding: 4 });

  await battle(['ali', 'mint']);
  await cmd(/防禦/).tap();
  await memberTurn('ali');
  await skill(/一起擋/);
  await sub(/小葵/).tap();
  await memberTurn('mint');
  await skill(/森林的祝福/);
  await round(2);
  const split = await page.evaluate(() => {
    const { s } = window.__mcv.G;
    return [49 - s.members.hero.hp, 49 - s.members.ali.hp];
  });
  assert(split[0] >= 2 && Math.abs(split[0] - split[1]) <= 1, `平分傷害 ${split}`);
  await page.evaluate(() => { window.__mcv.game.scene.getScene('Battle').foes[0].def.atk = 1; });
  for (let turn = 2; turn <= 4; turn++) {
    for (let i = 0; i < 3; i++) await cmd(/防禦/).tap();
    await round(turn + 1);
  }
  const heals = await page.evaluate(() => window.bondHeals);
  assert.deepEqual(heals.filter(([, id]) => id === 'hero'), [[1, 'hero', 7], [2, 'hero', 7], [3, 'hero', 7]]);
  await finish();

  await battle(['yuzu', 'pudding']);
  await cmd(/防禦/).tap();
  await memberTurn('yuzu');
  await skill(/快遞喵/);
  await sub(/小魚乾餅乾/).tap();
  await sub(/小葵/).tap();
  await cmd(/技能/).waitFor();
  await memberTurn('yuzu');
  assert.equal(await page.evaluate(() => window.__mcv.G.s.inventory.cookie), 1);
  assert(await page.evaluate(() => window.__mcv.G.s.members.hero.hp > 42));
  await cmd(/技能/).tap();
  assert(await sub(/快遞喵/).isDisabled());
  await sub(/返回/).tap();
  await cmd(/防禦/).tap();
  await memberTurn('pudding');
  await page.evaluate(() => {
    const sc = window.__mcv.game.scene.getScene('Battle');
    sc.foes[0].def.atk = 1;
    sc.ally('hero').sticky = 2;
    sc.ally('yuzu').cryUntil = 3;
  });
  await skill(/暖暖毛毯/);
  await round(2);
  const blanket = await page.evaluate(() => {
    const sc = window.__mcv.game.scene.getScene('Battle');
    return [sc.ally('hero').sticky, sc.ally('yuzu').cryUntil, window.bondHeals.filter(([, , n]) => n === 14)];
  });
  assert.deepEqual(blanket, [0, -1, [[1, 'hero', 14], [1, 'yuzu', 14], [1, 'pudding', 14]]]);
  await finish();
  assert.deepEqual(errors, []);
  console.log('RESULT PASS');
} catch (error) {
  console.error('RESULT FAIL', error);
  process.exitCode = 1;
} finally {
  await browser?.close();
}
