import { launch, shot, sleep, advance, state, joystick, inBattle } from './lib.mjs';
for (const [tag, url] of [['live','https://lucas-oba.github.io/moonlight-cat-village/?debug=1']]) {
  const { browser, page, errors } = await launch(url);
  const failed = []; page.on('requestfailed', r => failed.push(r.url().slice(0,80)));
  page.on('response', r => { if (r.status() >= 400) failed.push(r.status()+' '+r.url()); });
  await page.evaluate(() => localStorage.clear()); await page.reload();
  await sleep(2500); await shot(page, `40_single_${tag}_title`);
  await page.click('text=新遊戲'); await sleep(1500);
  await shot(page, `41_single_${tag}_prologue`);
  await advance(page, { log:false, stopOn: async () => !!(await page.$('.name-box')) });
  await page.fill('.name-box input', '小葵'); await page.click('.name-box button');
  await advance(page, { log:false, stopOn: async () => !!(await page.$('.alley-hint')) });
  await page.click('.alley-hint'); await sleep(2500);
  await advance(page, {log:false}); await sleep(1500); await advance(page, {log:false}); await sleep(500);
  await joystick(page, 0, -50, 1000); await sleep(300);
  await shot(page, `42_single_${tag}_village`);
  const font = await page.evaluate(() => document.fonts.check('16px Huninn'));
  await page.evaluate(() => window.__mcv.G.world.startBattle('meadow_grass', false));
  await sleep(2500); const ib = await inBattle(page);
  await shot(page, `43_single_${tag}_battle`);
  const ow = await page.evaluate(() => document.documentElement.scrollWidth);
  console.log(tag, JSON.stringify({ map:(await state(page)).map, inBattle: ib, font, scrollW: ow, errors, failed }));
  await browser.close();
}
