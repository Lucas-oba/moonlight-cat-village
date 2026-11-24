import type { GameState } from './state';
import { ENEMIES } from '../data/enemies';
import { GLINTS } from '../data/maps';
import { QUESTS } from '../data/quests';

export const HERO_TITLES = ['初期勇士', '小小勇士', '勇敢勇士', '閃亮勇士', '月光勇士'];
export const TITLE_GIFTS = ['', '學會「我不怕！」', '勇氣揮擊威力提升到 2.0', '閃亮勇士披風：防禦 +2、HP +10', '學會「月光之心」'];
export function heroTier(courage: number) {
  return [5, 12, 20, 30].filter(n => courage >= n).length;
}
export function heroTitle(courage: number) { return HERO_TITLES[heroTier(courage)]; }
export const CHAPTER_STATS = {
  friendship: { chapter: 3, label: '🤝 友誼值', first: '妳出招時，夥伴有機會接著打一下。' },
  honesty: { chapter: 4, label: '🔔 誠實與負責值', first: '妳選防禦時，也能保護大家。' },
  love: { chapter: 5, label: '💞 愛心值', first: '幫忙補血時，可以多補一點。' },
  hope: { chapter: 6, label: '✨ 希望值', first: '有人快沒力氣時，大家有機會一起回血。' },
} as const;
export type ChapterStat = keyof typeof CHAPTER_STATS;
export const newJournal = () => ({ brave: 0, secrets: 0, friends: 0, helps: 0, friendship: 0, friendshipEvents: [] as string[] });
export const isChapter2Map = (map: string) => ['mistpath', 'rootvillage', 'echovalley'].includes(map) || map.startsWith('c2_');
export function chapterOf(s: GameState) {
  for (let chapter = 6; chapter >= 2; chapter--) {
    const start = s.quests[`c${chapter}m1`]?.status;
    if (start === 'active' || start === 'done') return chapter;
  }
  return isChapter2Map(s.map) ? 2 : 1;
}
export function visibleStats(s: GameState) {
  const chapter = chapterOf(s);
  return (Object.keys(CHAPTER_STATS) as ChapterStat[]).filter(key => s[key] > 0 || chapter >= CHAPTER_STATS[key].chapter);
}
export const CH1_KIND_EVENTS = [
  { id: 'vegetables', quest: 'main10', n: 2 },
  { id: 'gugu', flag: 'gugu_talked', n: 1 },
  { id: 'rock', flag: 'boss_talked', n: 1 },
  { id: 'sprout', quest: 'main9', n: 2 },
  { id: 'feast', quest: 'main12', n: 2 },
  { id: 'douhua', quest: 'side2', n: 2 },
  { id: 'mint', quest: 'side5', n: 1 },
  { id: 'herbs', quest: 'side12', n: 1 },
  { id: 'goblin_writing', flag: 'ev_gobwrite', n: 1 },
  { id: 'chick', quest: 'side1', n: 1 },
  { id: 'letter', quest: 'side9', n: 1 },
];
export function awardKindEvents(s: GameState) {
  let total = 0;
  for (const e of CH1_KIND_EVENTS) {
    if (s.kindAwarded[e.id] || !(e.flag ? s.flags[e.flag] : s.quests[e.quest!]?.status === 'done')) continue;
    s.kindAwarded[e.id] = true;
    s.kindness += e.n;
    s.journal[1].helps++;
    total += e.n;
  }
  return total;
}
export function restoreHearts(s: GameState, old: Partial<GameState>) {
  if (old.kindCh2 == null) s.kindCh2 = old.kindness ?? 0;
  if (!old.befriended) {
    // 咕咕和一般哥布林原本共用貼紙。咕咕另有劇情旗標。
    for (const e of Object.values(ENEMIES)) {
      const known = e.id === 'gugu' ? s.flags.gugu_talked :
        s.stickers.includes(`${e.sticker ?? e.id}_talk`) && (e.id !== 'goblin' || !s.flags.gugu_talked);
      if (known) s.befriended[e.id] = 1;
    }
  }
  const j = s.journal[1];
  if (!Number.isFinite(old.journal?.[1]?.brave)) {
    j.brave = Object.values(QUESTS).filter(q => q.chapter !== 2 && q.rewards.courage && s.quests[q.id]?.status === 'done').length;
    j.brave += ['gugu_talked', 'boss_talked', 'got_badge', 'gob_cookie', 'story1', 'story2', 'ev_gobwrite'].filter(f => s.flags[f]).length;
    j.brave += ['main7', 'main10', 'main11'].filter(q => s.quests[q]?.status === 'done').length -
      Number(s.quests.main7?.status === 'done' && !!s.flags.gugu_talked) -
      Number(s.quests.main11?.status === 'done' && !!s.flags.boss_talked);
  }
  if (!old.journal?.[1]) {
    j.secrets = new Set(GLINTS.filter(g => !['mistpath', 'rootvillage'].includes(g.map) && g.once && s.flags[g.once]).map(g => g.once)).size;
    const chapter2Enemies = ['mistpuff', 'thornling', 'cryshroom', 'mistwolf', 'yarnweasel'];
    const chapter1Talk = new Set(Object.values(ENEMIES).filter(e => !chapter2Enemies.includes(e.id)).map(e => `${e.sticker ?? e.id}_talk`));
    j.friends = s.stickers.filter(id => chapter1Talk.has(id)).length;
    j.helps = Object.values(s.kindAwarded).filter(Boolean).length;
  }
  return awardKindEvents(s);
}

export type Mood = 'hungry' | 'scared' | 'lonely' | 'hurt';
export const MOODS = {
  hungry: ['🍙', '牠好像肚子餓了。'],
  scared: ['😨', '牠好像很害怕。'],
  lonely: ['💧', '牠好像很寂寞。'],
  hurt: ['😣', '牠好像受傷了。'],
};
export const HELPERS: Record<string, 'heal' | 'guard' | 'cheer'> = {
  slime: 'heal', mistpuff: 'heal', mushroom: 'heal', teasnail: 'heal', flipmush: 'heal',
  goblin: 'guard', fgoblin: 'guard', wolf: 'guard', mistwolf: 'guard', gugu: 'guard', rock: 'guard',
  bat: 'cheer', cryshroom: 'cheer', thornling: 'cheer', yarnweasel: 'cheer', echobat: 'cheer', mossrock: 'cheer',
  reedpuff: 'cheer', footchestnut: 'guard',
};
