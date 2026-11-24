import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { advance, launch } from './lib.mjs';

const url = new URL(process.env.URL || 'http://localhost:4173/');
url.searchParams.set('debug', '1');
const { browser, page, errors } = await launch(url.href);
page.setDefaultTimeout(15_000);
const stats = { friendship: '友誼值', honesty: '誠實與負責值', love: '愛心值', hope: '希望值' };
const keys = Object.keys(stats);
const button = name => page.getByRole('button', { name, exact: true });
const closePanel = () => page.locator('.sys-head .x').tap();
const values = () => page.evaluate(keys => keys.map(key => window.__mcv.G.s[key]), keys);
const hud = page.locator('.hud-values');

async function continueGame() {
  await page.reload();
  await page.getByRole('button', { name: /繼續遊戲/ }).tap();
  await hud.waitFor();
  await advance(page, { log: false });
  await page.waitForFunction(() => window.__mcv.G.world?.map && !window.__mcv.G.busy);
}

async function checkFixtures() {
  for (const name of ['ch1_mid', 'ch1_done', 'ch2_m6', 'ch2_done']) {
    const old = readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url), 'utf8');
    await page.evaluate(old => localStorage.setItem('mcv_save_v1', old), old);
    await continueGame();
    assert.deepEqual(await values(), [0, 0, 0, 0], name);
    await page.locator('.sys-btn').tap();
    for (const label of Object.values(stats)) {
      assert(!(await hud.innerText()).includes(label), name);
      assert(!(await page.locator('.stat-grid').innerText()).includes(label), name);
    }
    await button('勇士日記').tap();
    assert.equal(await button('第三章').count(), 0, name);
    await closePanel();
    console.log('舊存檔讀取通過', name);
  }
  const end = await page.evaluate(() => {
    const { s } = window.__mcv.G;
    return [s.chapter2Done, s.quests.c2m12.status, s.members.hero.lv, s.party.length,
      Object.keys(s.members).filter(id => s.members[id].joined).sort().map(id => [id, s.bonds[id]])];
  });
  assert.deepEqual(end, [true, 'done', 16, 3, [['ali', 4], ['mint', 4], ['pudding', 4], ['yuzu', 4]]]);
}

async function checkStats() {
  for (const [i, key] of keys.entries()) {
    const id = `c${i + 3}m1`;
    await page.evaluate(id => {
      const { G } = window.__mcv;
      G.s.quests[id] = { status: 'done', prog: {}, seen: {} };
      G.ui.refresh();
    }, id);
    for (const [j, label] of Object.values(stats).entries()) {
      assert.equal((await hud.innerText()).includes(label), j <= i);
    }
    await page.evaluate(id => { delete window.__mcv.G.s.quests[id]; }, id);
    await page.evaluate(key => window.__mcv.G.exec({ type: 'stat', key, n: 25 }), key);
    await page.locator('.toast b').filter({ hasText: stats[key] + ' +25' }).waitFor();
    assert((await hud.innerText()).includes(stats[key] + ' 25'));
    await page.evaluate(async key => {
      for (const n of [-12, 0]) await window.__mcv.G.exec({ type: 'stat', key, n });
    }, key);
    assert.equal((await values())[i], 25);
  }
  await page.locator('.sys-btn').tap();
  for (const label of Object.values(stats)) {
    assert.equal(await page.locator('.stat').filter({ hasText: label }).locator('b').innerText(), '25');
  }
  await button('勇士日記').tap();
  await button('第三章').tap();
  assert.match(await page.locator('.journal-page').innerText(), /友誼值 🤝 25/);
  await closePanel();
}

async function letter(action, id) {
  await page.evaluate(([action, id]) => {
    const debug = window.__mcv;
    void debug.G.exec({ ...debug[action], id });
  }, [action, id]);
}
async function checkLetters() {
  const id = 'debug_river_letter';
  await letter('letterExample', id);
  await button('寫一句話').tap();
  assert.equal(await page.locator('.letter-choice').count(), 3);
  await button('換個方式').tap();
  await button('畫一個小圖').tap();
  const choices = page.locator('.letter-choice');
  assert.equal(await choices.count(), 3);
  await choices.nth(1).tap();
  assert.equal(await page.evaluate(() => window.__mcv.G.s.letters[0].message.image), 'c3_ferry');

  await page.evaluate(() => window.__mcv.G.save());
  await continueGame();
  assert.deepEqual(await values(), [25, 25, 25, 25]);
  await letter('letterReplyExample', id);
  const reply = '我也有來。我一直在揮手！';
  assert.equal(await page.locator('.letter-paper .letter-reply').innerText(), reply);
  await button('收好').tap();
  assert.equal((await values())[0], 27);
  await letter('letterReplyExample', id);
  await button('收好').tap();
  assert.equal((await values())[0], 27);

  await letter('letterExample', 'debug_oral');
  await button('直接幫忙傳口信').tap();
  assert.equal(await page.locator('.letter-paper').count(), 0);
  assert.equal(await page.locator('.letter-choice').count(), 3);
  await button('我在河邊等妳。').tap();
  await letter('letterReplyExample', 'debug_oral');
  assert.equal(await page.locator('.letter-voices .letter-reply').innerText(), reply);
  await button('收好').tap();
  await page.evaluate(() => window.__mcv.G.save());
  await continueGame();
  assert.deepEqual(await values(), [27, 25, 25, 25]);

  await page.locator('.sys-btn').tap();
  await button('背包').tap();
  await button('信').tap();
  const entries = page.locator('.letter-entry');
  assert.equal(await entries.count(), 2);
  await entries.first().tap();
  assert.equal(await page.locator('.letter-message').innerText(), '河上的小船');
  assert.equal(await page.locator('.letter-reply').innerText(), reply);
  assert(await page.locator('.letter-message img').evaluate(img => img.complete && img.naturalWidth > 0));
  await button('收好').tap();
  await entries.nth(1).tap();
  assert.equal(await page.locator('.letter-message').innerText(), '我在河邊等妳。');
  await button('收好').tap();
  await button('勇士日記').tap();
  await button('第三章').tap();
  assert.match(await page.locator('.journal-page').innerText(), /幫小穗把話帶給點點/);
  await closePanel();
}

async function battleChecks(page) {
  const command = name => page.locator('.cmds').getByRole('button', { name });
  const option = name => page.locator('.sublist').getByRole('button', { name });
  const heroTurn = turn => page.waitForFunction(n => {
    const sc = window.__mcv.game.scene.getScene('Battle');
    return sc.turn === n && document.querySelector('.pslot.active')?.dataset.id === 'hero' &&
      !!document.querySelector('.cmds button');
  }, turn, { timeout: 30_000 });
  const snapshot = () => page.evaluate(() => {
    const { G, game } = window.__mcv;
    const sc = game.scene.getScene('Battle');
    return { hero: G.s.members.hero.hp, mizhou: G.s.members.mizhou.hp,
      foe: sc.foes[0].hp, speed: sc.foeSpeed(sc.foes[0]), mp: G.s.members.mizhou.mp };
  });
  const skillMenu = async () => {
    await page.locator('.pslot.active[data-id="mizhou"]').waitFor();
    await command(/技能/).tap();
    await option(/船墊護一下/).waitFor();
    return page.locator('.sublist button:not(.back)').count();
  };

  // 從正常入隊入口上場。只留一位夥伴，接力與保護的對象才固定。
  await page.evaluate(async () => {
    const { G, FIXED, joinMizhou } = window.__mcv;
    G.s.party = ['hero'];
    await joinMizhou();
    await G.exec({ type: 'rest' });
    G.s.befriended = {};
    FIXED.p28_practice = { id: 'p28_practice', enemies: ['slime'], bg: 'battlebg' };
    void G.battleHook('p28_practice', true);
  });
  await heroTurn(1);
  const attack = await page.evaluate(() => {
    const { G, game } = window.__mcv;
    const sc = game.scene.getScene('Battle');
    const foe = sc.foes[0];
    window.p28Random = Math.random;
    Math.random = () => .1;
    foe.hp = 1000;
    foe.def = { ...foe.def, hp: 1000, atk: 44, def: 0, spd: 32, weak: undefined,
      skills: [{ id: 'p28_wave', name: '水花', power: 1, chance: 1, target: 'all' }] };
    return { hero: sc.attackOf('hero'), mizhou: sc.attackOf('mizhou'), friendship: G.s.friendship };
  });
  const full = await snapshot();
  const hit = (atk, power = 1) => Math.round(atk * power * .92);
  try {
    // 一回合裡會有木劍、米舟的接力，以及米舟自己選的划槳拍。
    await command(/攻擊/).tap();
    assert.equal(await skillMenu(), 2, '羈絆 1 的兩招');
    await option(/划槳拍/).tap();
    await heroTurn(2);
    const first = await snapshot();
    assert.equal(full.foe - first.foe,
      hit(attack.hero) + hit(attack.mizhou, .5) + hit(attack.mizhou, .9), '普通攻擊後接力一次');
    assert.equal(first.speed, full.speed / 2, '划槳拍使魔物下回合變慢');
    assert.equal(first.mp, full.mp - 3);
    const heroHit = full.hero - first.hero;
    const mizhouHit = full.mizhou - first.mizhou;
    assert(heroHit > 0 && mizhouHit > 0);

    // 同樣的水花再打一次。護墊和主角防禦一起生效，米舟也受到全隊減傷。
    await command(/防禦/).tap();
    await skillMenu();
    await option(/船墊護一下/).tap();
    await option(/小葵/).tap();
    await heroTurn(3);
    const guarded = await snapshot();
    assert.equal(first.mizhou - guarded.mizhou, Math.round(mizhouHit * .7), '說到做到保護隊友');
    assert.equal(first.hero - guarded.hero, Math.ceil(Math.round(Math.floor(heroHit / 2) * .7) / 2));
    assert.equal(guarded.speed, full.speed, '划槳拍結束');

    // 米舟和勇士練習一起划；睡著的魔物不會干擾這回合的回血量。
    await page.evaluate(() => {
      const { G, game } = window.__mcv;
      G.bondUp('mizhou');
      G.s.members.hero.hp = 10;
      G.s.members.mizhou.hp = 60;
      game.scene.getScene('Battle').foes[0].sleep = 1;
    });
    await command(/技能/).tap();
    await option(/勇氣揮擊/).tap();
    assert.equal(await skillMenu(), 3, '羈絆 2 學會一起划');
    await option(/一起划！/).tap();
    await option(/小葵/).tap();
    await heroTurn(4);
    const hope = await snapshot();
    assert.equal(guarded.foe - hope.foe, hit(attack.hero * 1.25, 2) + hit(attack.mizhou * 1.25, .5),
      '一起划讓攻擊技能與夥伴接力都變強');
    const hopeHeal = maxHp => Math.round(Math.round(maxHp * .15) * 1.25);
    assert.equal(hope.hero, 10 + hopeHeal(full.hero), '希望之光幫勇士回血');
    assert.equal(hope.mizhou, 60 + hopeHeal(full.mizhou), '希望之光幫隊友回血');

    await page.evaluate(() => {
      const { G, game } = window.__mcv;
      G.bondUp('mizhou', 1, 4);
      const sc = game.scene.getScene('Battle');
      sc.foes[0].sleep = 1;
      sc.ally('hero').sticky = 3;
      sc.ally('hero').cryTurn = sc.turn - 1;
      sc.ally('hero').cryUntil = sc.turn + 3;
      G.s.members.hero.hp = 12;
      G.s.members.mizhou.hp = 32;
    });
    await command(/防禦/).tap();
    assert.equal(await skillMenu(), 4, '羈絆 4 學會渡口的燈');
    await option(/渡口的燈/).tap();
    await heroTurn(5);
    const lantern = await snapshot();
    assert.deepEqual([lantern.hero, lantern.mizhou], [27, 47], '暖暖的手把 12 HP 加到 15；希望之光每場一次');
    assert.equal(await page.evaluate(() => {
      const sc = window.__mcv.game.scene.getScene('Battle');
      const a = sc.ally('hero');
      return Number(a.sticky > 0) + Number(a.cryUntil >= sc.turn);
    }), 1, '渡口的燈只解除一種不舒服');
    assert.equal(await page.evaluate(() => window.__mcv.G.s.friendship), attack.friendship, '接力不加點');

    await page.evaluate(() => {
      const foe = window.__mcv.game.scene.getScene('Battle').foes[0];
      foe.hp = 1;
      foe.sleep = 1;
    });
    await command(/攻擊/).tap();
    await page.locator('.pslot.active[data-id="mizhou"]').waitFor();
    await command(/防禦/).tap();
    await page.locator('.battle-ui').waitFor({ state: 'detached' });
    await advance(page, { log: false });
  } finally {
    await page.evaluate(() => { Math.random = window.p28Random; delete window.p28Random; });
  }
}

try {
  await checkFixtures();
  await checkStats();
  await checkLetters();
  await battleChecks(page);
  assert.deepEqual(errors, []);
  console.log('RESULT PASS');
} finally {
  await browser.close();
}
