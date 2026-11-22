import '../src/data/ch1c';
import { DIALOGUES } from '../src/data/dialogues';
import { NPCS } from '../src/data/npcs';
import { GLINTS, TRIGGERS } from '../src/data/maps';
import { QUESTS } from '../src/data/quests';
import { STICKER_PAGES } from '../src/data/items';
const refs = new Set<string>();
for (const n of NPCS) for (const t of n.talk) refs.add(t.d);
for (const g of GLINTS) refs.add(g.d); for (const t of TRIGGERS) refs.add(t.d);
for (const q of Object.values(QUESTS)) if ((q as any).onComplete) refs.add((q as any).onComplete);
const J = JSON.stringify(DIALOGUES);
for (const m of J.matchAll(/"(?:run|script|d|talkScript|intro)":"([a-z0-9_]+)"/g)) refs.add(m[1]);
const FX = require('../src/data/enemies').FIXED; for (const f of Object.values(FX) as any[]) { for (const k of ['intro','talkScript','winScript','loseScript']) if (f[k]) refs.add(f[k]); }
const unref = Object.keys(DIALOGUES).filter(k => !refs.has(k));
console.log('UNREFERENCED dialogues:', unref.join(' '));
for (const p of STICKER_PAGES) for (const id of p.ids) {
  const keys = Object.entries(DIALOGUES).filter(([k, v]) => JSON.stringify(v).includes(`"sticker","id":"${id}"`) || JSON.stringify(v).includes(`"id":"${id}"`)).map(([k]) => k);
  const qs = Object.values(QUESTS).filter(q => (q as any).rewards?.sticker === id).map(q => q.id);
  if (!keys.length && !qs.length) continue;
  const ok = keys.some(k => refs.has(k)) || qs.length;
  if (!ok) console.log('STICKER only in unreferenced dialogue:', id, keys);
}
