import { QUESTS } from '../data/quests';
import type { QuestDef, Reward } from '../data/types';
import type { GameState } from './state';
import { addExp, bondOf, equipBetterWeapon } from './state';
import { bus } from './bus';
import { ITEMS } from '../data/items';

export function questChapterPrefix(chapter: QuestDef['chapter']) {
  return chapter === 3 ? '第三章・' : chapter === 2 ? '第二章・' : '';
}
export function currentObjective(s: GameState, qid: string) {
  const def = QUESTS[qid]; const qs = s.quests[qid]; if (!qs || qs.status !== 'active') return undefined;
  for (const o of def.objectives) if ((qs.prog[o.id] ?? 0) < (o.count ?? 1)) return o;
  return undefined;
}
export function refreshAvailability(s: GameState) {
  for (const def of Object.values(QUESTS)) {
    if (s.quests[def.id]) continue;
    if (def.prereq.every(p => s.quests[p]?.status === 'done') && (!def.bond || bondOf(s, def.bond[0]) >= def.bond[1])) {
      s.quests[def.id] = { status: 'available', prog: {}, seen: {} };
      if (def.autoStart) startQuest(s, def.id);
    }
  }
  for (const def of Object.values(QUESTS)) {
    if (def.autoStartAfter && s.quests[def.autoStartAfter]?.status === 'done' && s.quests[def.id]?.status === 'available') startQuest(s, def.id);
  }
}
export function startQuest(s: GameState, id: string) {
  const qs = s.quests[id] ?? (s.quests[id] = { status: 'available', prog: {}, seen: {} });
  if (qs.status !== 'available') return;
  qs.status = 'active';
  const def = QUESTS[id];
  if (def.kind === 'main' || !s.tracked || s.quests[s.tracked]?.status !== 'active') s.tracked = id;
  if (def.id !== 'main1') bus.emit('toast', { kind: 'quest', title: `${def.kind === 'main' ? '主線' : '支線'}任務開始`, text: questChapterPrefix(def.chapter) + def.title });
  bus.emit('questsChanged');
}
// 物件類事件：talk / reach / inspect / defeat / resolve / collect
export function notify(s: GameState, type: string, target: string) {
  for (const [qid, qs] of Object.entries(s.quests)) {
    if (qs.status !== 'active') continue;
    const def = QUESTS[qid];
    const objs = def.ordered ? [currentObjective(s, qid)].filter(Boolean) as QuestDef['objectives'] : def.objectives;
    for (const o of objs) {
      if (o.type !== type) continue;
      if (o.targets && !o.targets.includes(target)) continue;
      if ((qs.prog[o.id] ?? 0) >= (o.count ?? 1)) continue;
      if (o.unique) { const seen = (qs.seen[o.id] ??= []); if (seen.includes(target)) continue; seen.push(target); }
      advance(s, qid, o.id, 1);
    }
  }
}
export function advance(s: GameState, qid: string, oid: string, n = 1) {
  const qs = s.quests[qid]; if (!qs || qs.status !== 'active') return;
  const o = QUESTS[qid].objectives.find(o => o.id === oid); if (!o) return;
  const cur = qs.prog[oid] ?? 0; const max = o.count ?? 1; if (cur >= max) return;
  qs.prog[oid] = Math.min(max, cur + n);
  if (qs.prog[oid] >= max) bus.emit('toast', { kind: 'obj', title: '目標完成', text: o.text });
  else bus.emit('toast', { kind: 'obj', title: `目標進度 ${qs.prog[oid]}/${max}`, text: o.text });
  bus.emit('questsChanged');
  if (!currentObjective(s, qid) && !QUESTS[qid].comingSoon) completeQuest(s, qid);
}
export function completeQuest(s: GameState, qid: string) {
  const qs = s.quests[qid]; const def = QUESTS[qid];
  qs.status = 'done';
  const lines = grantReward(s, def.rewards).concat(def.rewardText ?? []);
  bus.emit('questComplete', { def, lines });
  refreshAvailability(s);
  if (s.tracked === qid) s.tracked = Object.keys(s.quests).find(k => s.quests[k].status === 'active' && QUESTS[k].kind === 'main') ?? Object.keys(s.quests).find(k => s.quests[k].status === 'active');
  bus.emit('questsChanged');
}
export function grantReward(s: GameState, r: Reward): string[] {
  const out: string[] = [];
  if (r.exp) { out.push(`${r.exp} EXP`); const ups = addExp(s, r.exp); ups.forEach(u => out.push(`🎉 升到 Lv ${u.lv}！HP、MP 全部回復`)); }
  if (r.money) { s.money += r.money; out.push(`${r.money} 魚乾幣`); }
  for (const it of r.items ?? []) { s.inventory[it.id] = (s.inventory[it.id] ?? 0) + it.n; equipBetterWeapon(s, it.id); out.push(`${ITEMS[it.id].name} ×${it.n}`); }
  if (r.courage) { s.courage += r.courage; out.push(`勇氣值 +${r.courage}`); }
  if (r.observation) { s.observation += r.observation; out.push(`觀察力 +${r.observation}`); }
  for (const f of r.flags ?? []) s.flags[f] = true;
  if (r.sticker && !s.stickers.includes(r.sticker)) { s.stickers.push(r.sticker); out.push('新貼紙'); }
  return out;
}
