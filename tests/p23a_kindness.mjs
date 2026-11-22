import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const url = new URL(process.env.URL || 'http://localhost:4173/');
url.searchParams.set('debug', '1');
const browser = await chromium.launch();

try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));

  // 從第一章格式的存檔進入，讓遊戲走原本的讀檔流程。
  const skip = new URL(url);
  skip.searchParams.set('skip', '1');
  await page.goto(skip.href);
  await page.locator('.hud-name').waitFor();
  await page.evaluate(() => {
    const save = JSON.parse(JSON.stringify(window.__mcv.G.s));
    delete save.kindness;
    delete save.stats.shares;
    save.stats.won = 7;
    localStorage.setItem('mcv_save_v1', JSON.stringify(save));
  });

  await page.goto(url.href);
  await page.getByRole('button', { name: /繼續遊戲/ }).tap();
  await page.locator('.hud-values').getByText('💗 善良值 0').waitFor();
  const stats = () => page.evaluate(() => {
    const { s } = window.__mcv.G;
    return { kindness: s.kindness, shares: s.stats.shares, won: s.stats.won, talked: s.stats.talkSuccess,
      food: s.inventory.sweet_potato, exp: s.members.hero.exp, sticker: s.stickers.includes('mistpuff_talk') };
  });
  assert.deepEqual(await stats(), { kindness: 0, shares: 0, won: 7, talked: 0, food: undefined, exp: 0, sticker: false });

  await page.evaluate(() => {
    const { G, FIXED } = window.__mcv;
    FIXED.test_kindness = { id: 'test_kindness', enemies: ['mistpuff', 'mistpuff'], bg: 'forestbg' };
    Object.assign(G.s.members.hero, { lv: 10, hp: 86 });
    G.s.inventory.sweet_potato = 2;
    // 固定亂數，避免霧團子自己逃跑或留下隨機謝禮。
    Math.random = () => 0.5;
    void G.battleHook('test_kindness', true);
  });

  async function share(label) {
    await page.getByRole('button', { name: '🍪 道具', exact: true }).tap();
    await page.getByRole('button', { name: /烤番薯/ }).tap();
    await page.getByRole('button', { name: new RegExp(label) }).tap();
    await page.locator('.bmsg').filter({ hasText: `${label}：「謝謝妳分我吃！」` }).waitFor();
  }

  await share('霧團子A');
  await page.getByText('做溫柔的事，善良值就會變多喵！善良值越高，魔物越願意聽妳說話。').waitFor();
  const remaining = () => page.evaluate(() => window.__mcv.game.scene.getScene('Battle').alive().map(foe => foe.label));
  assert.deepEqual(await remaining(), ['霧團子B']);
  assert.deepEqual(await stats(), { kindness: 1, shares: 1, won: 7, talked: 0, food: 1, exp: 0, sticker: true });

  await share('霧團子B');
  assert.deepEqual(await remaining(), []);
  await page.locator('.battle-ui').waitFor({ state: 'detached' });
  await page.locator('.hud-values').getByText('💗 善良值 1').waitFor();
  assert.deepEqual(await stats(), { kindness: 1, shares: 2, won: 8, talked: 0, food: 0, exp: 80, sticker: true });
  assert.deepEqual(errors, []);
  console.log('RESULT PASS');
} catch (error) {
  console.error('RESULT FAIL', error);
  process.exitCode = 1;
} finally {
  await browser.close();
}
