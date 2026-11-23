import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { advance, inBattle, launch, shot, sleep } from './lib.mjs';

const url = new URL(process.env.URL || 'http://localhost:4173/');
url.searchParams.set('debug', '1');
const fixture = JSON.parse(readFileSync(new URL('./fixtures/ch2_m10.json', import.meta.url), 'utf8'));
const { browser, ctx, page, errors } = await launch(url.href);
page.setDefaultTimeout(15_000);
const capture = name => shot(page, `c2b_${name}`);
const dialogue = page.locator('.dlg:not(.hidden)');
const choice = name => dialogue.getByRole('button', { name });
const command = name => page.locator('.cmds').getByRole('button', { name });
const care = page.locator('.antler-care');
const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('mcv_save_v1')));

async function interact(id) {
  await page.evaluate(id => {
    const { world } = window.__mcv.G;
    const target = world.glints.find(g => g.def.id === id);
    if (!target) throw Error('找不到 ' + id);
    void world.doInteract({ kind: 'glint', ...target });
  }, id);
}

async function nextLine() {
  await dialogue.waitFor();
  await sleep(130);
  await dialogue.evaluate(dlg => {
    const next = dlg.querySelector('.dlg-next');
    if (getComputedStyle(next).display === 'none') {
      dlg.querySelector('.dlg-box').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    }
  });
  await dialogue.locator('.dlg-next').waitFor();
  await dialogue.locator('.dlg-box').dispatchEvent('pointerdown');
}

try {
  await ctx.addInitScript(s => {
    if (!localStorage.getItem('mcv_save_v1')) localStorage.setItem('mcv_save_v1', JSON.stringify(s));
  }, fixture);
  await page.reload();
  await page.getByRole('button', { name: /繼續遊戲/ }).tap();
  await page.waitForFunction(() => {
    const { G } = window.__mcv;
    return G.busy === 0 && G.world?.glints.some(g => g.def.id === 'c2_den_notice');
  });
  await interact('c2_den_notice');
  await choice('進去幫苔角').tap();
  const locked = dialogue.locator('.choices .locked');
  await locked.tap();
  assert.match(await dialogue.locator('.dlg-text').textContent(), /勇氣值 20/);
  await choice('慢慢走近苔角').tap();
  await command(/攻擊/).waitFor();
  assert.equal(await page.locator('.antler-meter[data-calm]').getAttribute('data-calm'), '0');
  assert.equal(await page.getByRole('button', { name: /逃跑/ }).count(), 0);
  await page.getByRole('button', { name: '查看心情與弱點' }).tap();
  assert.match(await page.locator('.bmsg').textContent(), /苔角/);
  await capture('10_boss_start');

  let thin = false;
  let calm = false;
  let healed = false;
  const attack = command(/攻擊/);
  const talk = command(/對話／安撫/);
  for (let i = 0; i < 700 && !await care.isVisible(); i++) {
    const status = await page.evaluate(() => {
      const battle = window.__mcv.game.scene.getScene('Battle');
      return {
        hp: battle.vine.hp, max: battle.vine.def.hp, calm: battle.calm,
        active: document.querySelector('.pslot.active')?.dataset.id,
        least: Math.min(...battle.allies.map(a => battle.hp(a.id))),
      };
    });
    assert(status.least >= 1);
    if (!thin && status.hp > 0 && status.hp <= status.max / 2) {
      thin = true;
      await capture('11_vine_thin');
    }
    if (!calm && status.calm === 6 && status.hp > 0) {
      calm = true;
      await capture('12_calm_full');
    }
    if (await attack.isVisible() || await talk.isVisible()) {
      if (thin && status.calm < 6 && status.active === 'mint' && !healed) {
        await command(/技能/).tap();
        await page.locator('.sublist').getByRole('button', { name: /薄荷療癒/ }).tap();
        await page.locator('.sublist').getByRole('button', { name: /苔角/ }).tap();
        healed = true;
      } else {
        const soothe = status.hp <= 0 || (thin && status.calm < 6 && status.active === 'hero');
        if (soothe && await attack.isVisible()) await command('目標：嘆氣藤').tap();
        if (!soothe && await talk.isVisible()) await command('目標：苔角').tap();
        await (soothe ? talk : attack).tap();
      }
    } else {
      await page.locator('.bmsg').dispatchEvent('pointerdown');
      await sleep(90);
    }
  }
  assert(thin && calm && await care.isVisible(), '要見到藤變細、平靜滿和照顧畫面');
  await capture('13_care');
  for (let i = 1; i <= 3; i++) {
    await care.getByRole('button', { name: `拔掉第 ${i} 根刺` }).tap();
    assert.match(await care.locator('.antler-care-line').textContent(), /藥|做得很好/);
  }
  await care.getByRole('button', { name: '照顧好了' }).tap();
  while (await inBattle(page) && !await dialogue.isVisible()) {
    await page.locator('.bmsg').dispatchEvent('pointerdown').catch(() => {});
    await sleep(100);
  }
  await advance(page);
  assert.equal((await saved()).quests.c2m11.status, 'done');
  assert.equal((await saved()).kindness, fixture.kindness + 5);
  assert.equal((await saved()).money, fixture.money + 200);
  assert.equal((await saved()).inventory.c2_flower_crown, 1);
  assert((await saved()).stickers.includes('c2_forest_friend'));

  // 戰鬥與宴會之間只搬移到大樹旁，互動仍走遊戲的閃光點入口。
  await page.evaluate(() => window.__mcv.G.world.placePlayer('rootvillage', 336, 464, 1));
  await page.waitForFunction(() => {
    const { G } = window.__mcv;
    return !G.busy && G.world.glints.some(g => g.def.id === 'c2_feast');
  });
  assert(await page.evaluate(() => window.__mcv.G.world.npcs.some(n => n.def.id === 'c2_calm_antler')));
  await interact('c2_feast');
  await choice('一起看星星').tap();
  await advance(page, { stopOn: () => page.evaluate(() => window.__mcv.G.s.flags.c2_feast_started), log: false });
  assert.equal(await page.evaluate(() => window.__mcv.G.s.time), 'night');
  await dialogue.locator('.dlg-next').waitFor();
  await capture('14_feast');
  const lines = await advance(page, { stopOn: () => dialogue.getByText(/枯掉的嘆氣藤/).isVisible() });
  assert(lines.some(t => t.includes('幫我找回這顆石頭')));
  await nextLine();
  await page.locator('.dlg.bow-flash').waitFor();
  await capture('15_hook');
  await nextLine();
  await page.locator('.dlg.signal-glitch').waitFor();
  await nextLine();
  await advance(page, { stopOn: () => page.locator('.chapter-two').isVisible() });
  const ending = page.locator('.chapter-two');
  assert.match(await ending.textContent(), /第二章　森林深處　完成喵！/);
  assert.match(await ending.textContent(), /第三章（製作中）/);
  assert.match(await ending.textContent(), /完成的支線4 \/ 20/);
  await capture('16_ending');
  await ending.getByRole('button', { name: '繼續冒險' }).tap();
  const journal = page.locator('.journal-page');
  await journal.waitFor();
  assert.equal(await page.locator('.sys-wrap button.on').filter({ hasText: /^第二章$/ }).count(), 1);
  await page.waitForTimeout(900); // 等日記淡入完成
  await capture('17_journal');
  const save = await saved();
  assert.equal(save.chapter2Done, true);
  assert.equal(save.chapterDone, fixture.chapterDone);
  assert.equal(save.quests.c2m12.status, 'done');
  assert.equal(save.inventory.c2_treasure_stone, 1);
  assert.deepEqual(errors, []);
  console.log('RESULT PASS');
} catch (error) {
  console.error('RESULT FAIL', error, errors);
  await capture('boss_debug').catch(() => {});
  process.exitCode = 1;
} finally {
  await browser.close();
}
