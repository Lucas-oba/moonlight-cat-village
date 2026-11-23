import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { advance, launch, shot } from './lib.mjs';

const url = new URL(process.env.URL || 'http://localhost:4173/');
url.searchParams.set('debug', '1');
const skip = new URL(url);
skip.searchParams.set('skip', '1');
const { browser, page, errors } = await launch(skip.href);
page.setDefaultTimeout(10_000);
const btn = name => page.getByRole('button', { name, exact: true });
const game = fn => page.evaluate(fn);
const hud = page.locator('.hud-name');
const ready = () => page.waitForFunction(() => window.__mcv?.G.world && window.__mcv.G.busy === 0);
const title = page.locator('.title-up');
const titles = ['小小勇士', '勇敢勇士', '閃亮勇士', '月光勇士'];
const fixture = name => JSON.parse(readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url), 'utf8'));
const titleData = () => game(() => {
  const { s } = window.__mcv.G;
  return [s.titleTier, s.inventory.shining_cape, s.skills?.hero, s.stickers.filter(id => id.startsWith('title_t'))];
});

try {
  await hud.waitFor();
  await advance(page, { log: false });
  await ready();
  await game(() => { window.__mcv.G.s.courage = 30; });
  for (const [i, name] of titles.entries()) {
    await title.getByText(new RegExp(`變成『${name}』`)).waitFor();
    if (!i) await shot(page, 's_title_up');
    await title.getByRole('button').tap();
  }
  await ready();
  assert.match(await hud.innerText(), /Lv 1・月光勇士/);
  assert.deepEqual(await titleData(), [4, 1, ['not_afraid', 'moon_heart'], ['title_t1', 'title_t2', 'title_t3', 'title_t4']]);
  await page.goto(url.href);
  await page.getByRole('button', { name: /繼續遊戲/ }).tap();
  await hud.waitFor();
  await advance(page, { log: false });
  await ready();
  assert.deepEqual(await titleData(), [4, 1, ['not_afraid', 'moon_heart'], ['title_t1', 'title_t2', 'title_t3', 'title_t4']]);
  assert.equal(await title.count(), 0);
  await page.goto(skip.href);
  await hud.waitFor();
  await advance(page, { log: false });
  await ready();
  assert.deepEqual(await titleData(), [0, undefined, undefined, []]);

  await game(() => { void window.__mcv.G.run('brave_hollow'); });
  const locked = page.locator('.choices .locked');
  await locked.waitFor();
  await shot(page, 's_brave_choice');
  await locked.tap();
  assert.match(await page.locator('.dlg-text').innerText(), /再勇敢一點就能做到/);
  await btn('慢慢來').tap();
  await ready();
  assert.equal(await game(() => window.__mcv.G.s.courage), 1);
  await game(() => {
    const { DIALOGUES } = window.__mcv;
    DIALOGUES.test_brave = DIALOGUES.main3_guard.filter(line => line.choices?.some(choice => choice.brave));
  });
  for (let i = 0; i < 2; i++) {
    await game(() => { void window.__mcv.G.run('test_brave'); });
    await btn('🦁 先打招呼').tap();
    await advance(page, { log: false });
    await ready();
  }
  assert.deepEqual(await game(() => [window.__mcv.G.s.courage, window.__mcv.G.s.journal[1].brave]), [2, 1]);

  await game(() => {
    const { G, FIXED } = window.__mcv;
    G.s.observation = 3;
    G.s.members.hero.lv = 10;
    G.s.members.hero.hp = 35;
    G.s.befriended.slime = 1;
    G.s.kindness = 30;
    FIXED.test_mood = { id: 'test_mood', enemies: ['thornling'], bg: 'forestbg' };
    const random = Math.random;
    Math.random = () => .01 + random() * .06;
    void G.battleHook('test_mood', true);
  });
  const mood = page.locator('.foe-info');
  await mood.waitFor();
  assert.equal(await mood.innerText(), '😣');
  await shot(page, 's_mood');
  await page.getByText(/史萊姆來幫忙了/).waitFor();
  await shot(page, 's_helper');
  await btn('🍪 道具').waitFor();
  await game(() => {
    window.__mcv.G.s.inventory.cookie = 1;
    const sc = window.__mcv.game.scene.getScene('Battle');
    sc.foes[0].def = { ...sc.foes[0].def, skills: [] };
    window.initialTalk = sc.talkCh(sc.foes[0]);
  });
  await btn('🍪 道具').tap();
  await page.getByRole('button', { name: /小魚乾餅乾/ }).tap();
  await page.getByRole('button', { name: /刺刺藤寶寶.*幫牠回血/ }).tap();
  await page.getByText(/心情對了/).waitFor();
  assert.equal(await game(() => {
    const sc = window.__mcv.game.scene.getScene('Battle');
    return Math.round((sc.talkCh(sc.foes[0]) - window.initialTalk) * 100);
  }), 25);
  await btn('🏃 逃跑').tap();
  await ready();

  await game(() => {
    const { G } = window.__mcv;
    G.s.observation = 5;
    void G.battleHook('test_mood', true);
  });
  await btn('⚔️ 攻擊').waitFor();
  await mood.tap();
  await page.getByText(/弱點：捲起來的藤尖/).waitFor();
  await shot(page, 's_weak');
  await game(() => { window.__mcv.game.scene.getScene('Battle').foes[0].hp = 1; });
  await btn('⚔️ 攻擊').tap();
  await page.getByText('會心一擊！看準弱點了！').waitFor();
  await ready();

  for (const name of ['ch1_mid', 'ch1_done', 'ch2_m6']) {
    const old = fixture(name);
    const load = async () => {
      await page.goto(url.href);
      await page.getByRole('button', { name: /繼續遊戲/ }).tap();
      await hud.waitFor();
      await advance(page, { log: false });
      await ready();
      return game(() => {
        const { s } = window.__mcv.G;
        return { kindness: s.kindness, kindCh2: s.kindCh2, helps: s.journal[1].helps, brave: s.journal[1].brave,
          awards: s.kindAwarded, tier: s.titleTier, friends: s.befriended };
      });
    };
    await page.evaluate(old => localStorage.setItem('mcv_save_v1', JSON.stringify(old)), old);
    const first = await load();
    const expected = [
      ['vegetables', !!(old.quests.main10?.status === 'done'), 2],
      ['gugu', old.flags.gugu_talked, 1],
      ['rock', old.flags.boss_talked, 1],
      ['sprout', old.quests.main9?.status === 'done', 2],
      ['feast', old.quests.main12?.status === 'done', 2],
      ['douhua', old.quests.side2?.status === 'done', 2],
      ['mint', old.quests.side5?.status === 'done', 1],
      ['herbs', old.quests.side12?.status === 'done', 1],
      ['goblin_writing', old.flags.ev_gobwrite, 1],
      ['chick', old.quests.side1?.status === 'done', 1],
      ['letter', old.quests.side9?.status === 'done', 1],
    ].filter(([, eligible]) => eligible);
    assert.equal(first.kindCh2, old.kindness || 0, name);
    assert.equal(first.kindness, first.kindCh2 + expected.reduce((sum, [, , amount]) => sum + amount, 0), name);
    assert.equal(first.helps, expected.length, name);
    assert(Number.isInteger(first.brave) && first.brave >= 0, name);
    assert.deepEqual(Object.keys(first.awards).sort(), expected.map(([id]) => id).sort(), name);
    assert.equal(first.tier, [5, 12, 20, 30].filter(n => old.courage >= n).length, name);
    if (old.stickers.includes('mistpuff_talk')) assert.equal(first.friends.mistpuff, 1, name);
    assert.deepEqual(await load(), first, name);
    await page.locator('.sys-btn').tap();
    await btn('勇士日記').tap();
    assert.equal(await page.locator('.sys-body .sub-tabs button.on').innerText(), name === 'ch2_m6' ? '第二章' : '第一章');
    await page.locator('.sys-head .x').tap();
    console.log('存檔通過', name, first.kindness, first.kindCh2);
  }
  await page.locator('.sys-btn').tap();
  await btn('勇士日記').tap();
  await btn('第一章').tap();
  assert.match(await page.locator('.journal-page').innerText(), /幫助了/);
  await shot(page, 's_journal');
  await btn('第二章').tap();
  await page.locator('.journal-page').waitFor();
  assert.deepEqual(errors, []);
  console.log('RESULT PASS');
} catch (error) {
  console.error('RESULT FAIL', error, errors);
  process.exitCode = 1;
} finally {
  await browser.close();
}
