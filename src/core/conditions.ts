import type { Cond } from '../data/types';
import type { GameState } from './state';
import { QUESTS } from '../data/quests';
import { bookCount, bookTotal } from '../data/items';
import { bondOf } from './state';
import { currentObjective } from './quests';
export function check(s: GameState, c?: Cond): boolean {
  if (!c) return true;
  const q = (id: string) => s.quests[id];
  if (c.questActive && q(c.questActive)?.status !== 'active') return false;
  if (c.questDone && q(c.questDone)?.status !== 'done') return false;
  if (c.questNotDone && q(c.questNotDone)?.status === 'done') return false;
  if (c.questAvailable && q(c.questAvailable)?.status !== 'available') return false;
  if (c.questNotStarted && q(c.questNotStarted) && q(c.questNotStarted).status !== 'available') return false;
  if (c.objCurrent) { const [qid, oid] = c.objCurrent; if (q(qid)?.status !== 'active') return false; if (currentObjective(s, qid)?.id !== oid) return false; }
  if (c.objDone && !objDone(s, c.objDone[0], c.objDone[1])) return false;
  if (c.objNotDone && objDone(s, c.objNotDone[0], c.objNotDone[1])) return false;
  if (c.flag && !s.flags[c.flag]) return false;
  if (c.notFlag && s.flags[c.notFlag]) return false;
  if (c.time && s.time !== c.time) return false;
  if (c.minObs != null && s.observation < c.minObs) return false;
  if (c.minCourage != null && s.courage < c.minCourage) return false;
  if (c.inParty && !(s.party.includes(c.inParty) || s.guest === c.inParty)) return false;
  if (c.recruited && !s.members[c.recruited]?.joined) return false;
  if (c.notRecruited && s.members[c.notRecruited]?.joined) return false;
  if (c.minBond && bondOf(s, c.minBond[0]) < c.minBond[1]) return false;
  if (c.maxBond && bondOf(s, c.maxBond[0]) > c.maxBond[1]) return false;
  if (c.weather && (s.weather === 'rain' && s.time === 'day' ? 'rain' : 'clear') !== c.weather) return false;
  if (c.minActive != null || c.maxActive != null) { const n = Math.min(3, s.party.length + (s.guest && !s.party.includes(s.guest) ? 1 : 0)); if (c.minActive != null && n < c.minActive) return false; if (c.maxActive != null && n > c.maxActive) return false; }
  if (c.minCompanions != null && Object.values(s.members).filter(m => m.joined).length < c.minCompanions) return false;
  if (c.hasItem && (s.inventory[c.hasItem[0]] ?? 0) < c.hasItem[1]) return false;
  if (c.allStickers && bookCount(s.stickers) < bookTotal()) return false;
  if (c.minStickers != null && bookCount(s.stickers) < c.minStickers) return false;
  if (c.hasSticker && !s.stickers.includes(c.hasSticker)) return false;
  if (c.all && !c.all.every(x => check(s, x))) return false;
  if (c.any && !c.any.some(x => check(s, x))) return false;
  if (c.not && check(s, c.not)) return false;
  return true;
}
export function objDone(s: GameState, qid: string, oid: string) {
  const qs = s.quests[qid]; if (!qs) return false; if (qs.status === 'done') return true;
  const o = QUESTS[qid].objectives.find(o => o.id === oid); if (!o) return false;
  return (qs.prog[oid] ?? 0) >= (o.count ?? 1);
}
