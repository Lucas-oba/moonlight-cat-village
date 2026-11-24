import assert from 'node:assert/strict';

export async function playFaner(page, capture) {
  const dialogue = page.locator('.dlg:not(.hidden)');
  const command = name => page.locator('.cmds').getByRole('button', { name });
  const attack = command(/攻擊/);
  const message = page.locator('.bmsg');
  const care = page.locator('.faner-care');
  const creaturePoint = () => page.evaluate(() => {
    const sc = window.__mcv.game.scene.getScene('Battle');
    const center = sc.creature.spr.getCenter();
    const canvas = sc.game.canvas.getBoundingClientRect();
    return { x: canvas.left + center.x * canvas.width / sc.scale.width,
      y: canvas.top + center.y * canvas.height / sc.scale.height };
  });

  const before = await page.evaluate(() => {
    const { G, game } = window.__mcv;
    const sc = game.scene.getScene('Battle');
    // 只固定前兩回合的揮旗抽籤。第二次的 0.30 要有朋友信等友誼值才會揮旗。
    const wave = sc.waveFlags;
    sc.waveFlags = function () {
      const random = Math.random;
      const roll = this.turn === 1 ? .99 : .30;
      if (this.turn === 2) delete this.waveFlags;
      Math.random = () => { Math.random = random; return roll; };
      try { return wave.call(this); } finally { Math.random = random; }
    };
    // 拍照時把台詞留久一點；點訊息即可照平常方式繼續。
    const say = sc.say;
    sc.say = function (line, duration) {
      return say.call(this, line, /平靜 \+|兩岸揮旗/.test(line) ? 15_000 : duration);
    };
    sc.events.once('shutdown', () => { delete sc.say; delete sc.waveFlags; });
    return { wins: G.s.stats.won, losses: G.s.stats.lost, friendship: G.s.friendship };
  });
  assert(await dialogue.getByRole('button', { name: '慢慢走近帆耳' }).isVisible());
  await dialogue.getByRole('button', { name: /🦁.*走到帆耳身邊/ }).tap();
  await dialogue.locator('.dlg-next').waitFor();
  await dialogue.locator('.dlg-box').dispatchEvent('pointerdown');
  await attack.waitFor();
  await page.waitForFunction(() => window.__music.current() === 'boss3');
  const start = await page.evaluate(() => {
    const sc = window.__mcv.game.scene.getScene('Battle');
    return [sc.bg.texture.key, sc.obstacle.spr.texture.key, sc.creature.spr.texture.key, sc.calm];
  });
  assert.deepEqual(start, ['bridgebg', 'ropeknot_boss', 'faner_boss', 1]);
  assert.match(await page.locator('.vine-meter[data-hp]').innerText(), /紫結舊橋索/);
  assert.equal(await page.locator('.faner-flags').count(), 0);
  await capture('04_頭目戰開始');

  // 在攻擊鈕可用時直接點帆耳。隊員會接著選指令，主角排進這回合的是對話。
  const point = await creaturePoint();
  await page.touchscreen.tap(point.x, point.y);
  await page.waitForFunction(() => document.querySelector('.pslot.active')?.dataset.id !== 'hero');

  let firstTalk = false, flagSeen = false, bonusTalk = false;
  const deadline = Date.now() + 120_000;
  while (!await care.isVisible()) {
    if (Date.now() > deadline) throw Error('帆耳戰鬥逾時：' + await message.innerText());
    const state = await page.evaluate(() => {
      const sc = window.__mcv.game.scene.getScene('Battle');
      return { turn: sc.turn, calm: sc.calm, creatureHp: sc.creature.hp, maxHp: sc.creature.def.hp,
        text: document.querySelector('.bmsg').textContent };
    });
    assert.equal(state.creatureHp, state.maxHp, '攻擊只能打到舊橋索');
    const text = state.text;
    if (!firstTalk && text.includes('平靜 +2')) {
      assert.equal(state.turn, 1);
      assert.equal(state.calm, 3);
      await capture('05_對話');
      firstTalk = true;
    } else if (!flagSeen && text.includes('兩岸揮旗')) {
      assert.equal(state.turn, 2);
      assert.match(text, /平靜多一顆心/);
      const flags = page.locator('.faner-flags');
      assert.match(await flags.innerText(), /小穗/);
      assert.match(await flags.innerText(), /點點/);
      assert.equal(await flags.locator('img.waving-flag').count(), 2);
      await capture('06_揮旗幫忙');
      flagSeen = true;
    } else if (flagSeen && text.includes('平靜 +3')) {
      assert.equal(state.calm, 6);
      bonusTalk = true;
    }
    if (await attack.isVisible()) {
      const cheerForTalk = await page.evaluate(() => window.__mcv.game.scene.getScene('Battle').turn === 2 &&
        document.querySelector('.pslot.active')?.dataset.id === 'hero');
      if (cheerForTalk) {
        await command('目標：紫結舊橋索').tap();
        await command(/對話／安撫/).tap();
      } else await attack.tap();
    } else if (await command(/對話／安撫/).isVisible()) {
      // 目標會保留到下一位隊員。切回橋索，讓夥伴繼續幫忙。
      const target = command('目標：帆耳');
      if (await target.isEnabled()) await target.tap();
      else await command(/對話／安撫/).tap();
    } else {
      await message.evaluate((el, seen) => {
        if (el.textContent === seen) el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      }, text);
      await page.waitForTimeout(90);
    }
  }
  assert(firstTalk && flagSeen && bonusTalk, '點帆耳能對話，兩岸揮旗會幫忙安撫');
  assert.equal(await page.locator('.vine-meter[data-hp]').getAttribute('data-hp'), '0');
  assert.equal(await page.locator('.antler-meter[data-calm]').getAttribute('data-calm'), '6');
  const friendship = await page.evaluate(() => [window.__mcv.G.s.friendship, window.__mcv.G.s.flags.c3_faner_talked]);
  assert.deepEqual(friendship, [before.friendship + 2, true], '兩次對話只給一次友誼值');
  await capture('07_照顧時間');
  const knot = care.getByRole('button', { name: '解開最後一圈繩結' });
  const stand = care.getByRole('button', { name: '陪帆耳慢慢站起來' });
  const closeup = care.locator('.faner-closeup');
  await closeup.tap({ position: { x: 10, y: 12 } });
  assert.match(await care.innerText(), /嗚……/);
  assert(await knot.isVisible() && !await stand.isVisible());
  await knot.tap();
  assert.equal(await knot.count(), 0);
  await stand.tap();
  assert.match(await closeup.evaluate(el => el.style.backgroundImage), /faner_calm/);
  assert.equal(await page.evaluate(() => window.__mcv.game.scene.getScene('Battle').creature.spr.texture.key), 'faner_calm');
  await capture('08_帆耳站起來');
  await care.getByRole('button', { name: '照顧好了' }).tap();
  await page.waitForFunction(() => !window.__mcv.game.scene.isActive('Battle'));
  const result = await page.evaluate(() => [window.__mcv.G.s.stats.won, window.__mcv.G.s.stats.lost]);
  assert.deepEqual(result, [before.wins + 1, before.losses]);
}
