import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { shot, sleep } from './lib.mjs';

const url = process.env.URL || 'http://localhost:4173/';
let browser;

try {
  browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  });
  page.setDefaultTimeout(10000);
  await page.addInitScript(() => localStorage.clear());
  await page.goto(url);

  const dialogue = page.locator('.dlg:not(.hidden) .dlg-box');
  const panel = page.locator('.screen .panel-img');
  const seen = [];

  async function readDialogue(text, image, filename) {
    const current = dialogue.filter({ hasText: text });
    await current.locator('.dlg-next').waitFor({ state: 'visible' });
    const line = await current.locator('.dlg-text').innerText();
    seen.push(line);
    if (image) {
      await panel.evaluate(async (element, expected) => {
        const src = getComputedStyle(element).backgroundImage.match(/^url\("(.*)"\)$/)?.[1];
        const embedded = window.__MCV_ASSETS?.[`${expected}.jpg`];
        if (!src || !(embedded ? src === embedded : new URL(src).pathname.endsWith(`/${expected}.jpg`))) {
          throw new Error(`未顯示序章圖片 ${expected}`);
        }
        const loaded = new Image();
        loaded.src = src;
        await loaded.decode();
        await Promise.all(element.getAnimations().map(animation => animation.finished));
      }, image);
    }
    if (filename) await shot(page, filename);
    await current.tap();
    await sleep(500);
  }

  await page.getByRole('button', { name: '新遊戲', exact: true }).tap();
  await readDialogue('早上七點半，', 'prologue1', 'prologue_1');
  await readDialogue('一個背著黃色書包的女孩');

  await page.locator('.name-box input').fill('小葵');
  await page.getByRole('button', { name: '決定', exact: true }).tap();
  await readDialogue('小葵走著走著');
  await readDialogue('白貓看著她，眨了一下眼睛。');
  await readDialogue('咦？你的領結好漂亮');
  await readDialogue('白貓跳進路邊的小巷子', 'prologue2', 'prologue_2');
  await readDialogue('上學會遲到啦');

  const alley = page.getByRole('button', { name: '點巷口 跟上去', exact: true });
  await alley.waitFor({ state: 'visible' });
  await shot(page, 'prologue_2b');
  await alley.tap();

  await readDialogue('……小葵睜開眼睛。');
  await readDialogue('喵？');
  await readDialogue('喵喵喵！');
  await readDialogue('喵——嗚？');
  await readDialogue('這、這裡是哪裡？');
  await page.locator('.hud-name').filter({ hasText: '小葵' }).waitFor({ state: 'visible' });

  assert.match(seen[0], /早上七點半，台北的街道熱熱鬧鬧。/);
  assert.doesNotMatch(seen.join('\n'), /臺灣|台灣/);
  console.log('RESULT PASS');
} catch (error) {
  console.error('RESULT FAIL', error);
  process.exitCode = 1;
} finally {
  await browser?.close();
}
