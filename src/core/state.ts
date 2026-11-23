import { MEMBERS, expToNext } from '../data/characters';
import { newJournal, restoreHearts } from './hearts';
import { ITEMS } from '../data/items';
export interface MemberState { id: string; lv: number; exp: number; hp: number; mp: number; joined?: boolean; }
export interface QuestState { status: 'available' | 'active' | 'done'; prog: Record<string, number>; seen: Record<string, string[]>; }
export interface GameState {
  version: number; name: string; money: number; courage: number; kindness: number; observation: number;
  titleTier: number; kindCh2: number; kindAwarded: Record<string, boolean>; befriended: Record<string, number>;
  journal: Record<number, ReturnType<typeof newJournal>>;
  members: Record<string, MemberState>; party: string[]; inventory: Record<string, number>; weapon?: string;
  flags: Record<string, boolean>; quests: Record<string, QuestState>; tracked?: string;
  map: string; x: number; y: number; dir: number; time: 'day' | 'night'; stickers: string[];
  stats: { talkSuccess: number; shares: number; won: number; lost: number }; savedAt?: number;
  guest?: string | null; titles?: string[]; chapterDone?: boolean; chapter2Done: boolean;
  quiz?: { seen: string[]; correct: number; wrong: number }; skills?: Record<string, string[]>; bonds?: Record<string, number>; size?: 'normal' | 'small' | 'big'; acc?: string[]; outfit?: string; lanterns?: string[]; seenEnemies?: string[]; weather?: 'rain' | 'clear'; bondWins?: Record<string, number>; feast?: boolean; day?: number;
}
export const SAVE_KEY = 'mcv_save_v1';
export function newState(): GameState {
  return {
    version: 1, name: '小葵', money: 0, courage: 1, kindness: 0, observation: 1,
    chapter2Done: false, titleTier: 0, kindCh2: 0, kindAwarded: {}, befriended: {}, journal: { 1: newJournal(), 2: newJournal() },
    members: { hero: { id: 'hero', lv: 1, exp: 0, hp: MEMBERS.hero.base.hp, mp: MEMBERS.hero.base.mp } },
    party: ['hero'], inventory: {}, flags: {}, quests: {}, map: 'village', x: 336, y: 936, dir: 1, time: 'night', stickers: [],
    stats: { talkSuccess: 0, shares: 0, won: 0, lost: 0 },
  };
}
export function equipBetterWeapon(s: GameState, id: string): boolean {
  const next = ITEMS[id];
  const current = s.weapon ? ITEMS[s.weapon] : undefined;
  if (next.kind !== 'weapon' || (next.atk ?? 0) <= (current?.atk ?? 0)) return false;
  s.weapon = id;
  return true;
}
export function memberStats(s: GameState, id: string) {
  const d = MEMBERS[id]; const m = s.members[id]; const l = m.lv - 1;
  const st = { maxHp: d.base.hp + d.grow.hp * l, maxMp: d.base.mp + d.grow.mp * l, atk: d.base.atk + d.grow.atk * l, def: d.base.def + d.grow.def * l, spd: d.base.spd + d.grow.spd * l };
  if (id === 'hero' && s.weapon) st.atk += ITEMS[s.weapon]?.atk ?? 0;
  // 飾品：拿在身上就有效（不用另外裝備）
  for (const [iid, n] of Object.entries(s.inventory)) { const b = n > 0 ? ITEMS[iid]?.bonus : undefined; if (b && (b.who ?? 'hero') === id) { st.atk += b.atk ?? 0; st.def += b.def ?? 0; st.spd += b.spd ?? 0; st.maxHp += b.hp ?? 0; } }
  return st;
}
export function addExp(s: GameState, n: number): { id: string; lv: number }[] {
  const ups: { id: string; lv: number }[] = [];
  for (const id of Object.keys(s.members)) {
    const m = s.members[id];
    if (id !== 'hero' && !m.joined && s.guest !== id) continue;
    m.exp += s.party.includes(id) || s.guest === id ? n : Math.floor(n / 2); // 沒上場的夥伴拿一半
    while (m.exp >= expToNext(m.lv)) {
      m.exp -= expToNext(m.lv); m.lv++;
      const st = memberStats(s, id); m.hp = st.maxHp; m.mp = st.maxMp; ups.push({ id, lv: m.lv });
    }
  }
  return ups;
}
export function healAll(s: GameState) { for (const id of Object.keys(s.members)) { const st = memberStats(s, id); s.members[id].hp = st.maxHp; s.members[id].mp = st.maxMp; } }
export function saveGame(s: GameState) { s.savedAt = Date.now(); try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); return true; } catch { return false; } }
export function loadGame(): { state: GameState; kindBonus: number } | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (s.version !== 1) return null;
    const defaults = newState();
    const state: GameState = {
      ...defaults, ...s, size: 'normal',
      stats: { ...defaults.stats, ...s.stats },
      journal: { ...defaults.journal, ...s.journal },
    };
    // 舊存檔有時只記下任務完成，沒有留下開門旗標。
    if (state.quests.main8?.status === 'done') state.flags.forest_open = true;
    return { state, kindBonus: restoreHearts(state, s) };
  } catch {
    return null;
  }
}
export function hasSave() { return !!localStorage.getItem(SAVE_KEY); }

// 羈絆等級（第一章最高 3）：加入隊伍時是 1 級
export function bondOf(s: GameState, id: string) { return s.bonds?.[id] ?? (s.members[id]?.joined ? 1 : 0); }
