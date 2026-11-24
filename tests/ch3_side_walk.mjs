// 依任務手冊的委託人和目前目標帶路。蘆管灘、兩岸村和雙結橋都分成兩岸。
export const isRiverSideQuest = id => /^c3s(?:[1-9]|1[0-4])$/.test(id);

async function nextStop(page, id) {
  return page.evaluate(id => {
    const { G, QUESTS, NPCS, GLINTS, DIALOGUES, check } = window.__mcv;
    const quest = QUESTS[id], progress = G.s.quests[id];
    if (!progress) throw Error('任務尚未開放：' + id);
    if (progress.status === 'done') return null;
    const goal = quest.objectives.find(o => (progress.prog[o.id] ?? 0) < (o.count ?? 1));
    const targets = progress.status === 'available' ? [quest.giver] :
      (goal?.marker ?? goal?.targets ?? []).filter(target => !progress.seen[goal.id]?.includes(target));
    const maps = ['twobanks', 'reedbeach', 'knotbridge'];
    const stops = [];
    for (const target of targets) {
      const glint = GLINTS.find(g => g.id === target);
      if (glint && !G.s.flags[glint.once] && check({ ...G.s, map: glint.map }, glint.when)) {
        stops.push({ id: target, map: glint.map, x: glint.x, relevant: true });
      }
      const npc = NPCS.find(n => n.id === target);
      if (!npc) continue;
      for (const map of maps) {
        const local = { ...G.s, map };
        const talk = npc.talk.find(r => check(local, r.when));
        if (!talk) continue;
        // 同一個捲捲在不同的碼頭教不同的課，要走到能談這項任務的地方。
        const relevant = [talk.when, DIALOGUES[talk.d]].some(data => JSON.stringify(data ?? null).includes('"' + id + '"'));
        const spot = npc.spots.find(s => check(local, s.when));
        if (npc.follow && check(local, npc.follow)) {
          if (map === G.s.map) stops.push({ id: target, map, x: G.world.player.x, relevant });
        } else if (spot?.map === map && !spot.hidden) stops.push({ id: target, map, x: spot.x, relevant });
      }
    }
    const west = G.world.player.x < 11 * 32;
    const sameBank = stop => (stop.x < 11 * 32) === west;
    stops.sort((a, b) => Number(b.relevant) - Number(a.relevant) ||
      Number(sameBank(b)) - Number(sameBank(a)) || Number(b.map === G.s.map) - Number(a.map === G.s.map));
    if (!stops.length) throw Error(id + ' 找不到可見的任務目標：' + targets.join('、'));
    return { ...stops[0], title: quest.title, progress: JSON.stringify(progress) };
  }, id);
}

async function travel(page, walk, stop) {
  let map = await walk.currentMap();
  const west = await page.evaluate(() => window.__mcv.G.world.player.x < 11 * 32);
  const cross = west !== (stop.x < 11 * 32);
  if (map !== 'twobanks' && (cross || map !== stop.map)) {
    await walk.leave('twobanks');
    map = 'twobanks';
  }
  if (cross) await walk.bank(west ? 'west' : 'east', west ? 'east' : 'west');
  if (map !== stop.map) await walk.leave(stop.map);
}

// qsolve 和整章回歸共用；inspectPanel 可在點選前檢查畫面、試答或截圖。
export async function solveRiverSide(page, walk, id, { inspectPanel, oral = false } = {}) {
  const stops = [];
  const letters = page.locator('.letter-wrap');
  const quiz = page.locator('.quiz-wrap');
  async function handlePanel() {
    if (inspectPanel && await inspectPanel(id)) return true;
    if (await letters.isVisible()) {
      const close = letters.locator('.letter-close');
      const answers = letters.locator('.letter-choice');
      if (await close.isVisible()) await close.tap();
      else if (await answers.first().isVisible()) await answers.first().tap();
      else if (oral) await letters.getByRole('button', { name: '直接幫忙傳口信' }).tap();
      else await letters.locator('.letter-choices button').first().tap();
      return true;
    }
    if (await quiz.isVisible()) {
      const next = quiz.locator('.qz-next');
      if (await next.isVisible()) await next.tap();
      else await quiz.locator('.qz-btn:enabled').first().tap();
      return true;
    }
    return false;
  }
  // 船棚與攤位也有日常選項。其他支線把推進故事的選項放在前面。
  const choices = { c3s6: '搬板凳', c3s7: '擺杯子' };
  for (let i = 0; i < 12; i++) {
    const target = await nextStop(page, id);
    if (!target) return stops;
    await travel(page, walk, target);
    await walk.meet(target.id, { handlePanel, choice: choices[id] ?? target.title });
    const after = await page.evaluate(id => JSON.stringify(window.__mcv.G.s.quests[id]), id);
    if (after === target.progress) throw Error(id + ' 在 ' + target.map + ' 找了 ' + target.id + '，任務沒有往下走：' + after);
    stops.push(target.id);
  }
  throw Error(id + ' 走過太多站：' + stops.join('、'));
}
