import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { riverWalk } from './ch3_walk.mjs';
import { solveRiverSide } from './ch3_side_walk.mjs';
import { launch } from './lib.mjs';

const url = new URL(process.env.URL || 'http://localhost:4173/');
url.searchParams.set('debug', '1');
const fixture = JSON.parse(readFileSync(new URL('./fixtures/ch3_done.json', import.meta.url)));
const ids = Array.from({ length: 14 }, (_, i) => 'c3s' + (i + 1));
const companions = ['ali', 'mint', 'yuzu', 'pudding'];
const friendshipRewards = { c3s1: 2, c3s2: 2, c3s3: 2, c3s4: 2, c3s5: 2, c3s6: 1, c3s7: 1, c3s10: 1 };
// 章末存檔已邀了米舟。在測試副本倒回這份河道圖，讓 14 個委託都從接任務走一遍。
delete fixture.quests.c3s5;
for (const flag of ['c3_map_reed', 'c3_map_east', 'c3_map_bridge', 'c3_mizhou_bond1', 'c3_mizhou_bond2', 'c3_mizhou_bond3']) delete fixture.flags[flag];
fixture.party = fixture.party.filter(id => id !== 'mizhou');
delete fixture.members.mizhou;
delete fixture.bonds.mizhou;
delete fixture.bondWins.mizhou;
fixture.friendship -= 3;
fixture.journal[3].friendship -= 3;
fixture.journal[3].friendshipEvents = fixture.journal[3].friendshipEvents.filter(e => !e.includes('米舟'));

const rows = readFileSync(new URL('../docs/QUIZ_CH3.md', import.meta.url), 'utf8').split('\n')
  .filter(line => /^\|\s*c3_/.test(line)).map(line => line.split('|').slice(1, -1).map(cell => cell.trim()));
const answers = new Map(rows.map(([id, question, answer, explain, hint]) => [question, { id, answer, explain, hint }]));
assert.equal(answers.size, 40, '四科核對表應有 40 道不同的題目');

const { page, browser, errors } = await launch(url.href);
page.setDefaultTimeout(12_000);
const walk = riverWalk(page, 'c3c');
const captured = new Set();
const answered = new Map();
const triedWrong = new Set();

async function capture(name) {
  if (captured.has(name)) return;
  await walk.capture(name);
  captured.add(name);
}
function resources(s) {
  return [s.money, s.courage, s.kindness, s.observation, s.friendship, s.honesty, s.love, s.hope, s.members.hero.exp, s.members.hero.hp];
}
async function inspectPanel(id) {
  if (id === 'c3s3' && await page.locator('.letter-paper .letter-reply').isVisible()
    && await page.locator('.letter-close').isVisible()) await capture('01_柚子的回信');
  if (id === 'c3s9' && await walk.dialogue.locator('.dlg-text').filter({ hasText: '看水面！' }).isVisible()) {
    await walk.dialogue.locator('.dlg-next').waitFor();
    await capture('02_小雲的腳印');
  }
  const quiz = page.locator('.quiz-wrap');
  if (!await quiz.isVisible() || await quiz.locator('.qz-next').isVisible()) return false;
  const question = await quiz.locator('.qz-q').innerText();
  const ref = answers.get(question);
  assert(ref, '畫面上的題目應在核對表內：' + question);
  assert.equal(await quiz.locator('.qz-btn').count(), 4);
  const subject = ['chinese', 'english', 'math', 'science'][Number(id.slice(3)) - 11];
  assert(await quiz.locator('.qz-sub.' + subject).isVisible(), id + ' 科目正確');
  if (!triedWrong.has(id)) {
    const before = await walk.getState();
    const options = quiz.locator('.qz-btn');
    const distractor = (await options.allTextContents()).findIndex(option => option !== ref.answer);
    await options.nth(distractor).tap();
    assert((await quiz.locator('.qz-say').innerText()).includes(ref.hint), question + ' 的答錯提示');
    assert.equal(await quiz.locator('.qz-q').innerText(), question);
    const after = await walk.getState();
    assert.equal(after.quiz.wrong, before.quiz.wrong + 1);
    assert.deepEqual(resources(after), resources(before), '重答保留魚乾幣和數值');
    if (id === 'c3s11') await capture('03_河邊小學堂');
    triedWrong.add(id);
  }
  await quiz.getByRole('button', { name: ref.answer, exact: true }).tap();
  assert(await quiz.locator('.qz-next').isVisible(), question + ' 的正解');
  assert((await quiz.locator('.qz-say').innerText()).includes(ref.explain), question + ' 的解說');
  assert((await quiz.locator('.qz-say').innerText()).includes(ref.explain), question + ' 的解說');
  const seen = answered.get(id) ?? [];
  assert(!seen.includes(ref.id), '同一堂課不重複出題');
  seen.push(ref.id);
  answered.set(id, seen);
  return true;
}

async function continueGame() {
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 45_000 });
  await page.getByRole('button', { name: /繼續遊戲/ }).tap();
  await page.waitForFunction(() => !!window.__mcv.G.world?.player);
  await walk.settle();
}
try {
  await page.evaluate(save => localStorage.setItem('mcv_save_v1', JSON.stringify(save)), fixture);
  await continueGame();
  await page.evaluate(() => { window.__mcv.G.world.onGrassStep = () => {}; });
  // 先走西岸的委託，再到東岸。兩封信和米舟的河道圖仍需來回搭船。
  const route = [1, 6, 3, 7, 11, 8, 10, 13, 5, 2, 4, 12, 14, 9];
  for (const no of route) {
    const id = 'c3s' + no;
    const before = await walk.getState();
    assert.equal(before.quests[id]?.status, 'available', id + ' 由委託人開放');
    const steps = await solveRiverSide(page, walk, id, { inspectPanel, oral: id === 'c3s7' });
    await walk.done(id);
    const after = await walk.getState();
    const def = await page.evaluate(id => window.__mcv.QUESTS[id], id);
    assert.equal(steps[0], def.giver, id + ' 由委託人開始');
    assert.equal(after.money - before.money, def.rewards.money ?? 0, id + ' 魚乾幣');
    assert.equal(after.friendship - before.friendship, friendshipRewards[id] ?? 0, id + ' 友誼值');
    assert(after.members.hero.lv > before.members.hero.lv || after.members.hero.exp > before.members.hero.exp, id + ' 經驗');
    if (def.rewards.sticker) assert(after.stickers.includes(def.rewards.sticker), id + ' 貼紙');
    if (no <= companions.length) {
      const companion = companions[no - 1];
      assert.equal(before.bonds[companion], 4);
      assert.equal(after.bonds[companion], 4, id + ' 滿羈絆');
      assert(after.stickers.includes(id + '_memory'), id + ' 滿羈絆紀念貼紙');
    }
    if (id === 'c3s5') assert(after.members.mizhou.joined, '邀米舟同行');
    if (no >= 11) {
      assert.equal(answered.get(id)?.length, 5, id + ' 完成五題');
      assert.equal(after.quiz.correct, before.quiz.correct + 5);
    }
  }
  assert.equal(captured.size, 3);
  assert.equal(triedWrong.size, 4);
  const final = await walk.getState();
  assert.equal(final.journal[3].friendship, final.friendship);
  const newLetters = final.letters.filter(letter => !fixture.letters.some(old => old.id === letter.id));
  assert.deepEqual(newLetters.map(l => [l.id, l.mode]), [['c3_yuzu_letter', 'paper'], ['c3_cup_letter', 'oral']]);
  assert(newLetters.every(l => l.message && l.reply));

  await page.locator('.sys-btn').tap();
  await page.locator('#btn-save').tap();
  await continueGame();
  const loaded = await walk.getState();
  for (const id of ids) assert.deepEqual(loaded.quests[id], final.quests[id]);
  assert.deepEqual(loaded.letters, final.letters);
  assert.deepEqual(loaded.stickers, final.stickers);
  assert.equal(loaded.friendship, final.friendship);
  await page.locator('.sys-btn').tap();
  await walk.button('任務').tap();
  await walk.button('支線').tap();
  const completed = page.locator('.q-item.done-q').filter({ hasText: '第三章・' });
  assert.equal(await completed.count(), 14);
  assert.equal(await completed.filter({ hasText: /任務獎勵：經驗 \+\d+/ }).count(), 14);
  await walk.button('背包').tap();
  await walk.button('信').tap();
  for (const letter of newLetters) {
    await page.locator('.letter-entry').filter({ hasText: letter.from + '給' + letter.to }).tap();
    assert.equal(await page.locator('.letter-reply').innerText(), letter.reply.label ?? letter.reply);
    await walk.button('收好').tap();
  }
  assert.deepEqual(errors, []);
  console.log('RESULT PASS：14 個支線、兩封朋友信、四科共 20 道作答、3 張截圖');
} catch (error) {
  console.error('RESULT FAIL', error, errors, await page.locator('#ui').innerText().catch(() => ''));
  process.exitCode = 1;
} finally {
  await browser.close();
}
