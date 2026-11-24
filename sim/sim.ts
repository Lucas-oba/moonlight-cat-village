// 月光貓村 戰鬥模擬器：直接使用遊戲裡真正的 BattleScene 規則（只把畫面換成假的）
(globalThis as any).setTimeout = (f: any) => { Promise.resolve().then(f); return 0; };
(globalThis as any).clearTimeout = () => {};
import { BattleScene, CALM_MAX } from '../src/scenes/Battle';
import { G } from '../src/core/game';
import { newState, memberStats, addExp, healAll } from '../src/core/state';
import { MEMBERS, expToNext } from '../src/data/characters';
import { ENEMIES, ENCOUNTERS, FIXED } from '../src/data/enemies';
import '../src/data/whimsy2';
// 模擬用：只有茶杯蝸牛的草原組合（實際遊戲要支線21完成後才會出現）
ENCOUNTERS.sim_teasnail = { id: 'sim_teasnail', rate: 0.09, minSteps: 5, bg: 'battlebg', groups: ENCOUNTERS.meadow_grass.groups.filter(g => g.enemies.includes('teasnail')).map(g => ({ ...g, when: (g.when as any)?.all?.[0] })) };
import { ITEMS } from '../src/data/items';
import '../src/data/ch1c';
import '../src/data/ch2_systems';
import '../src/data/ch2_boss';
import { ECHO, ECHO_ENCOUNTER } from '../src/data/ch2_echo_map';
import { REED_ENCOUNTER, BRIDGE_ENCOUNTER } from '../src/data/ch3_enemies';
import { FANER_ENCOUNTER } from '../src/data/ch3_boss';
import { talkChance } from '../src/core/battle';
import { CHAPTER_STATS, type ChapterStat } from '../src/core/hearts';
import assert from 'node:assert/strict';

// 試調數值：TUNE='{"ENEMIES":{"slime":{"atk":5}}}'
function deep(t: any, o: any) { for (const k in o) { if (o[k] && typeof o[k] === 'object' && !Array.isArray(o[k]) && t[k]) deep(t[k], o[k]); else t[k] = o[k]; } }
if (process.env.TUNE) deep({ ENEMIES, ENCOUNTERS, FIXED, MEMBERS }, JSON.parse(process.env.TUNE));
G.ui = { toast() {}, refresh() {}, dialogue: { hide() {}, show: async () => 0 } } as any;
(G as any).run = async () => true;

type Policy = 'child' | 'smart';
const statKeys = Object.keys(CHAPTER_STATS) as ChapterStat[];
type BattleStats = Record<ChapterStat, number>;
function readNumberOption(key: string, fallback: number) {
  const i = process.argv.indexOf('--' + key);
  if (i === -1) return fallback;
  const value = Number(process.argv[i + 1]);
  assert(Number.isSafeInteger(value) && value >= 0, `--${key} 需要填 0 或正整數`);
  return value;
}
const statOptions = Object.fromEntries(statKeys.map(key => [key, readNumberOption(key, 0)])) as BattleStats;
export interface Setup extends Partial<BattleStats> { lv: number; party: string[]; cookies: number; courage: number; enc: string; fixed: boolean; policy: Policy; stats?: boolean; legacy?: boolean; bond4?: boolean }
const bondSkills: Record<string, string> = {
  ali: 'split_guard', mint: 'forest_blessing', yuzu: 'quick_delivery', pudding: 'warm_blanket',
};
function setupState(su: Setup) {
  const s = newState(); s.name = '小葵'; s.courage = su.courage; s.weapon = 'wooden_sword';
  for (const key of statKeys) s[key] = su[key] ?? 0;
  s.inventory = { cookie: su.cookies };
  if (su.enc === ECHO_ENCOUNTER || su.enc === 'c2_mossantler') s.map = ECHO;
  if ([REED_ENCOUNTER, BRIDGE_ENCOUNTER, FANER_ENCOUNTER].includes(su.enc)) {
    s.map = su.enc === REED_ENCOUNTER ? 'reedbeach' : 'knotbridge';
    s.quests.c3m1 = { status: 'done', prog: {}, seen: {} };
  }
  if (su.stats || su.legacy) {
    if (su.stats) s.observation = su.lv >= 5 ? Math.min(8, su.lv) : su.lv;
    s.kindness = su.lv >= 10 ? (su.stats ? 16 : 11) : su.stats && su.lv >= 5 ? 4 : 0;
    if (su.enc !== 'tut1') s.befriended = su.lv >= 10 ? { slime: 1, bat: 1, goblin: 1, ...(s.map === ECHO ? { mistpuff: 1, echobat: 1, mossrock: 1 } : {}) } : { slime: 1 };
  }
  G.s = s;
  s.members.hero.lv = su.lv;
  for (const id of su.party) {
    G.ensureMember(id);
    s.members[id].joined = id !== 'hero';
  }
  if (su.bond4) {
    for (const id of su.party.filter(id => id in bondSkills)) {
      (s.bonds ??= {})[id] = 4;
      (s.skills ??= {})[id] = [bondSkills[id]];
    }
  }
  s.party = [...su.party]; healAll(s);
}
function policyCmd(sc: any, a: any, policy: Policy, extra: boolean) {
  const s = G.s; const id = a.id; const m = s.members[id];
  const foes = sc.alive(); const foe = foes[Math.floor(Math.random() * foes.length)];
  const ratio = (x: string) => s.members[x].hp / memberStats(s, x).maxHp;
  const allies = sc.aliveAllies().map((x: any) => x.id);
  const weakest = allies.sort((p: string, q: string) => ratio(p) - ratio(q))[0];
  const boss = foes.find((f: any) => f.def.boss);
  const sk = (k: string) => MEMBERS[id].skills.find(x => x.id === k)!;
  const can = (k: string) => m.mp >= sk(k).mp;
  const R = Math.random();
  const bondSkill = sk(bondSkills[id]);
  if (bondSkill && s.skills?.[id]?.includes(bondSkill.id) && m.mp >= bondSkill.mp) {
    const injured = allies.filter((ally: string) => ratio(ally) < .85).length;
    const target = allies.find((ally: string) => ally !== id);
    const useSkill = (fields = {}) => ({ who: id, kind: 'skill', skill: bondSkill, ...fields });
    if (id === 'yuzu' && target && ratio(target) < .85 && s.inventory.cookie > 0 && !sc.usedSkills.has(bondSkill.id)) {
      return useSkill({ item: 'cookie', ally: target });
    }
    if (R < (policy === 'smart' ? .8 : .35)) {
      if (id === 'ali' && target && ratio(target) < .6) return useSkill({ ally: target });
      if (id === 'mint' && injured >= 2 && !sc.regenTurns) return useSkill();
      if (id === 'pudding' && (injured >= 2 || sc.aliveAllies().some((ally: any) =>
        ally.sticky || ally.stun || ally.sleep || ally.bindTurn >= sc.turn || ally.cryUntil >= sc.turn))) return useSkill();
    }
  }
  if (sc.antlerBattle || sc.fanerBattle) {
    const { obstacle, creature } = sc;
    if (sc.calm < CALM_MAX) {
      if (obstacle.gone || (id === 'hero' && (obstacle.hp <= obstacle.def.hp / 2 || R < .30))) {
        return { who: id, kind: 'talk', foe: creature };
      }
      if (sc.antlerBattle && id === 'pudding' && R < .3) {
        const purr = MEMBERS.pudding.skills.find(k => k.kind === 'purr')!;
        if (m.mp >= purr.mp) return { who: id, kind: 'skill', skill: purr };
      }
      if (sc.antlerBattle && policy === 'smart' && id === 'mint' && can('mint_heal')) {
        return { who: id, kind: 'skill', skill: sk('mint_heal'), foe: creature };
      }
    }
    if (obstacle.gone) return { who: id, kind: 'defend' };
    if (id === 'hero' && can('brave_slash') && (policy === 'smart' || R > .85)) {
      return { who: id, kind: 'skill', skill: sk('brave_slash'), foe: obstacle };
    }
    return { who: id, kind: 'attack', foe: obstacle };
  }
  if (policy === 'child') {
    if (id === 'mint' && ratio(weakest) < 0.4 && can('mint_heal')) return { who: id, kind: 'skill', skill: sk('mint_heal'), ally: weakest };
    if (ratio(weakest) < 0.4 && s.inventory.cookie > 0 && R < 0.6) return { who: id, kind: 'item', item: 'cookie', ally: weakest };
    if (id === 'hero') {
      if (boss && sc.latePhase && R < 0.5) return { who: id, kind: 'talk', foe: boss };
      if (!boss && R < 0.15) return { who: id, kind: 'talk', foe };
      if (R > 0.85 && can('brave_slash')) return { who: id, kind: 'skill', skill: sk('brave_slash'), foe };
    }
    if (id === 'ali' && R < 0.2 && can('shield_punch')) return { who: id, kind: 'skill', skill: sk('shield_punch'), foe };
    if (id === 'yuzu' && R < 0.3 && can('yarn_throw')) return { who: id, kind: 'skill', skill: sk('yarn_throw') };
    return { who: id, kind: 'attack', foe };
  }
  // smart
  if (id === 'mint') {
    const stuck = sc.allies.find((x: any) => sc.hp(x.id) > 0 && (x.stun || x.sleep));
    if (ratio(weakest) < 0.55 && can('mint_heal')) return { who: id, kind: 'skill', skill: sk('mint_heal'), ally: weakest };
    if (stuck && can('calm_scent')) return { who: id, kind: 'skill', skill: sk('calm_scent'), ally: stuck.id };
  }
  if (ratio(weakest) < 0.35 && s.inventory.cookie > 0) return { who: id, kind: 'item', item: 'cookie', ally: weakest };
  if (id === 'hero') {
    if (boss && sc.latePhase) return { who: id, kind: 'talk', foe: boss };
    if (can('brave_slash')) return { who: id, kind: 'skill', skill: sk('brave_slash'), foe };
  }
  if (id === 'ali') { if (!a.taunt && can('shield_punch')) return { who: id, kind: 'skill', skill: sk('shield_punch'), foe }; }
  if (id === 'yuzu' && foes.length > 1 && can('yarn_throw')) return { who: id, kind: 'skill', skill: sk('yarn_throw') };
  return { who: id, kind: 'attack', foe };
}
export async function runOne(su: Setup, keep = false) {
  if (!keep) setupState(su);
  const sc: any = new BattleScene();
  sc.say = async () => {};
  sc.renderParty = () => {};
  if (su.legacy) {
    const currentTalk = sc.talkCh.bind(sc);
    sc.talkCh = (f: any) => f.def.boss || sc.fx?.forceTalk ? currentTalk(f) :
      Math.min(.95, sc.talkBase(f) + .05 * G.s.courage + Math.min(.15, G.s.kindness * .025) + sc.purrBonus);
    sc.tryHelper = async () => {};
  }
  sc.careForAntler = async () => {};
  let caredForFaner = false;
  sc.careForFaner = async () => { caredForFaner = true; };
  let timeout = false;
  sc.askCmd = async (a: any, extra = false) => {
    if (sc.turn > 40) { timeout = true; sc.foes.forEach((f: any) => { f.gone = true; f.how = 'flee'; }); return { who: a.id, kind: 'defend' }; }
    return policyCmd(sc, a, su.policy, extra);
  };
  const res: string = await new Promise(r => { sc.init({ enc: su.enc, fixed: su.fixed, resolve: r }); sc.create(); });
  if (su.enc === FANER_ENCOUNTER && res === 'win' && !timeout) {
    assert(caredForFaner && sc.obstacle.hp <= 0 && sc.calm === CALM_MAX, '橋索解開、帆耳平靜並進入照顧時間才能完成戰鬥');
    assert.equal(sc.creature.hp, sc.creature.def.hp, '帆耳沒有受傷');
  }
  const s = G.s;
  const hpLeft = s.party.reduce((t, id) => t + Math.max(0, s.members[id].hp) / memberStats(s, id).maxHp, 0) / s.party.length;
  const exp = sc.foes.filter((f: any) => f.how !== 'flee').reduce((t: number, f: any) => t + f.def.exp, 0);
  return { res: timeout ? 'timeout' : res, turns: sc.turn, hpLeft, talked: sc.foes.some((f: any) => f.how === 'talk'), exp, cookiesUsed: su.cookies - (s.inventory.cookie ?? 0) };
}
export async function batch(su: Setup, n: number, startTrial?: (i: number) => void) {
  let win = 0, lose = 0, to = 0, turns = 0, hp = 0, talk = 0, exp = 0, cookies = 0; const tl: number[] = [];
  for (let i = 0; i < n; i++) { startTrial?.(i); const r = await runOne(su); if (r.res === 'win') win++; else if (r.res === 'lose') lose++; else if (r.res === 'timeout') to++; turns += r.turns; tl.push(r.turns); hp += r.hpLeft; if (r.talked) talk++; exp += r.exp; cookies += r.cookiesUsed; }
  tl.sort((a, b) => a - b);
  return { max: tl[n - 1], win: win / n, lose: lose / n, timeout: to / n, turns: turns / n, p90: tl[Math.floor(n * 0.9)], hpLeft: hp / n, talk: talk / n, exp: exp / n, cookies: cookies / n };
}
// ---- 情境：第一章各地點，與「應有等級」 ----
const P = { solo: ['hero'], ali: ['hero', 'ali'], mint: ['hero', 'mint'], full: ['hero', 'ali', 'mint'], yuzu: ['hero', 'ali', 'yuzu'], amy: ['hero', 'mint', 'yuzu'], puddingAli: ['hero', 'pudding', 'ali'], puddingMint: ['hero', 'pudding', 'mint'], mizhou: ['hero', 'mizhou'], mizhouYuzu: ['hero', 'mizhou', 'yuzu'], mizhouMint: ['hero', 'mizhou', 'mint'] };
const CH2_SCENARIOS = ['mistpuff', 'thornling', 'cryshroom', 'mistwolf', 'yarnweasel'].map(id => {
  const enc = `sim_${id}`;
  FIXED[enc] = { id: enc, enemies: [id, id], bg: 'forestbg' };
  return { name: ENEMIES[id].name + ' ×2', enc, fixed: true, lv: [10, 11, 12], parties: ['full' as const, 'puddingAli' as const, 'puddingMint' as const], courage: 12, cookies: 3 };
});
type Scenario = { name: string; enc: string; fixed: boolean; lv: number[]; parties: (keyof typeof P)[]; courage: number; cookies: number };
const echoScenario: Scenario = { name: '迴聲谷', enc: ECHO_ENCOUNTER, fixed: false, lv: [12, 13, 14, 15],
  parties: ['full', 'yuzu', 'amy', 'puddingAli', 'puddingMint'], courage: 12, cookies: 3 };
const antlerScenario: Scenario = { name: '苔角（第二章主線 11）', enc: 'c2_mossantler', fixed: true,
  lv: [13, 14, 15], parties: ['full', 'yuzu', 'amy', 'puddingAli', 'puddingMint'], courage: 12, cookies: 3 };
const CH3_SCENARIOS: Scenario[] = [['蘆管灘', REED_ENCOUNTER], ['雙結橋', BRIDGE_ENCOUNTER]].map(([name, enc]) => ({
  name, enc, fixed: false, lv: [16, 17, 18, 19, 20], parties: ['solo', 'mizhou', 'full', 'mizhouYuzu'], courage: 18, cookies: 3,
}));
const fanerScenario: Scenario = { name: '帆耳（第三章主線 10）', enc: FANER_ENCOUNTER, fixed: true, lv: [19, 20, 21],
  parties: ['ali', 'mizhou', 'full', 'mizhouMint'], courage: 18, cookies: 3 };
CH3_SCENARIOS.push(fanerScenario);
export const SCENARIOS: Scenario[] = [
  { name: '草原（主線6後）', enc: 'meadow_grass', fixed: false, lv: [2, 3, 4], parties: ['solo', 'ali', 'mint'], courage: 3, cookies: 2 },
  { name: '咕咕（主線7）', enc: 'gugu', fixed: true, lv: [2, 3, 4], parties: ['solo', 'ali'], courage: 3, cookies: 2 },
  { name: '小雞與史萊姆（支線1）', enc: 'chick_slimes', fixed: true, lv: [2, 3, 4], parties: ['ali'], courage: 3, cookies: 2 },
  { name: '樹下史萊姆（支線5）', enc: 'tree_slimes', fixed: true, lv: [2, 3, 4], parties: ['solo', 'ali'], courage: 3, cookies: 2 },
  { name: '野狼（主線9）', enc: 'wolves', fixed: true, lv: [4, 5, 6], parties: ['ali', 'mint', 'full'], courage: 5, cookies: 3 },
  { name: '黑森林', enc: 'forest_grass', fixed: false, lv: [5, 6, 7], parties: ['ali', 'mint', 'full'], courage: 5, cookies: 3 },
  { name: '礦石蘑菇（支線3）', enc: 'ore_mush', fixed: true, lv: [5, 6], parties: ['ali', 'mint'], courage: 5, cookies: 3 },
  { name: '箱子哥布林（支線6）', enc: 'crate_gob', fixed: true, lv: [3, 4, 5], parties: ['solo', 'ali', 'mint'], courage: 3, cookies: 2 },
  { name: '果園蘑菇（支線7）', enc: 'orchard_mush', fixed: true, lv: [3, 4, 5], parties: ['ali', 'mint', 'full'], courage: 3, cookies: 2 },
  { name: '風車蝙蝠（支線8）', enc: 'mill_bats', fixed: true, lv: [3, 4, 5], parties: ['ali', 'mint', 'full'], courage: 3, cookies: 2 },
  { name: '風車小屋', enc: 'windmill_bats', fixed: false, lv: [3, 4, 5], parties: ['ali', 'full'], courage: 3, cookies: 2 },
  { name: '信件蝙蝠（支線10）', enc: 'bat_mail', fixed: true, lv: [5, 6], parties: ['ali', 'mint'], courage: 5, cookies: 3 },
  { name: '阿栗野狼（支線11）', enc: 'ali_wolves', fixed: true, lv: [5, 6, 7], parties: ['ali', 'full', 'yuzu'], courage: 5, cookies: 3 },
  { name: '筆記蘑菇（支線12）', enc: 'note_mush', fixed: true, lv: [5, 6, 7], parties: ['ali', 'mint', 'full'], courage: 5, cookies: 3 },
  { name: '燈籠蝙蝠（支線14）', enc: 'lantern_bat', fixed: true, lv: [6, 7], parties: ['full', 'yuzu'], courage: 6, cookies: 3 },
  { name: '茶杯蝸牛（草原，支線21後）', enc: 'sim_teasnail', fixed: false, lv: [3, 4, 5], parties: ['solo', 'ali', 'mint'], courage: 3, cookies: 2 },
  { name: '顛倒小徑（主線8後）', enc: 'flip_grass', fixed: false, lv: [5, 6, 7], parties: ['ali', 'mint', 'full'], courage: 5, cookies: 3 },
  ...CH2_SCENARIOS, echoScenario, antlerScenario,
  { name: '巨岩（主線11）', enc: 'boss', fixed: true, lv: [5, 6, 7, 8], parties: ['ali', 'mint', 'full', 'yuzu', 'amy'], courage: 7, cookies: 3 },
  ...CH3_SCENARIOS,
];
async function main() {
  const N = +(process.argv[2] ?? 1000); const only = process.argv[3];
  const rows: any[] = [];
  const echo = only === '迴聲谷';
  const antler = only === '苔角';
  const ch2 = only === 'ch2' || echo || antler;
  const faner = only === '帆耳';
  const ch3 = only === 'ch3' || faner;
  const chapterBatch = ch2 || ch3;
  const policies: Policy[] = chapterBatch ? ['child'] : ['child', 'smart'];
  const selected = faner ? [fanerScenario] : ch3 ? CH3_SCENARIOS : echo ? [echoScenario] : antler ? [antlerScenario]
    : ch2 ? [...CH2_SCENARIOS, echoScenario, antlerScenario] : SCENARIOS;
  const seed = readNumberOption('seed', -1);
  const startTrial = seed < 0 ? undefined : (i: number) => { Math.random = seeded(seed + Math.imul(i + 1, 0x9e3779b9)); };
  for (const sc of selected) {
    if (!chapterBatch && only && only !== 'all' && !sc.name.includes(only)) continue;
    const bond4 = sc === echoScenario || sc === antlerScenario;
    for (const lv of sc.lv) for (const p of sc.parties) for (const pol of policies) {
      const r = await batch({ ...statOptions, lv, party: P[p], cookies: sc.cookies, courage: sc.courage, enc: sc.enc, fixed: sc.fixed, policy: pol, stats: bond4 || CH3_SCENARIOS.includes(sc), bond4 }, sc.enc === 'boss' ? Math.min(N, 600) : N, startTrial);
      rows.push({ 情境: sc.name, ...(chapterBatch ? { 場次: N } : {}), ...(ch3 && seed >= 0 ? { seed } : {}), lv, 隊伍: p, 玩家: pol, ...statOptions, 勝率: (r.win * 100).toFixed(1) + '%', 卡住: (r.timeout * 100).toFixed(1) + '%', 回合: r.turns.toFixed(chapterBatch ? 2 : 1), p90回合: r.p90, 剩血: (r.hpLeft * 100).toFixed(chapterBatch ? 1 : 0) + '%', 對話結束: (r.talk * 100).toFixed(0) + '%', 餅乾: r.cookies.toFixed(2), EXP: r.exp.toFixed(0), 最多回合: r.max });
    }
  }
  console.table(rows);
  if (process.argv.includes('--json')) { const fs = await import('fs'); fs.writeFileSync(process.argv[process.argv.indexOf('--json') + 1], JSON.stringify(rows, null, 1)); }
}
// ---- 升級曲線：照第一章的順序真的打一遍（HP 會延續，回村/營火才補滿）----
interface Seg { name: string; enc?: string; grass: number; fixed?: string[]; quest: number; courage?: number; party?: string[]; walkMin: number; heal?: boolean }
function pois(l: number) { let k = 0, p = Math.exp(-l), c = p; const u = Math.random(); while (u > c) { k++; p *= l / k; c += p; } return k; }
const STEPS = (t: string) => { const e = ENCOUNTERS[t]; return e.minSteps + 1 / e.rate - 1; };
export function route(kind: 'ali' | 'mint' | 'full'): Seg[] {
  const R: Seg[] = [
    { name: '主線4–5', grass: 0, quest: 50, courage: 2, walkMin: 6 },
    { name: '主線6 教學', enc: 'meadow_grass', grass: 30, fixed: ['tut1', 'tut2', 'tut3'], quest: 120, courage: 1, walkMin: 5, heal: true },
  ];
  if (kind === 'full') R.push({ name: '支線2 豆花', enc: 'meadow_grass', grass: 30, quest: 100, courage: 1, walkMin: 4, heal: true });
  R.push({ name: '主線7 咕咕', enc: 'meadow_grass', grass: 40, fixed: ['gugu'], quest: 150, walkMin: 5, heal: true });
  if (kind !== 'mint') R.push({ name: '支線1 阿栗', enc: 'meadow_grass', grass: 0, fixed: ['@patrol5', 'chick_slimes'], quest: 150, courage: 2, party: ['ali'], walkMin: 6, heal: true });
  if (kind !== 'ali') R.push({ name: '支線5 薄荷', enc: 'meadow_grass', grass: 30, fixed: ['tree_slimes'], quest: 150, party: ['mint'], walkMin: 5, heal: true });
  R.push({ name: '主線8 出發', enc: 'meadow_grass', grass: 20, quest: 100, courage: 1, walkMin: 3, heal: true });
  R.push({ name: '主線9 森林', enc: 'forest_grass', grass: 40, fixed: ['wolves'], quest: 200, courage: 2, walkMin: 6 });
  R.push({ name: '主線10 營地', enc: 'forest_grass', grass: 40, quest: 200, walkMin: 5 });
  R.push({ name: '主線11 巨岩前', enc: 'forest_grass', grass: 25, quest: 0, walkMin: 3, heal: true });
  return R;
}
export const LOSS: Record<string, number> = {};
export async function curve(kind: 'ali' | 'mint' | 'full', n: number) {
  const out: Record<string, { lv: number[]; enc: number[]; min: number[]; lose: number }> = {};
  for (let it = 0; it < n; it++) {
    const s = newState(); s.weapon = 'wooden_sword'; s.inventory = { cookie: 3 }; s.courage = 1;
    Object.assign(s, statOptions);
    s.members.hero = { id: 'hero', lv: 1, exp: 0, hp: 1, mp: 1 } as any; s.party = ['hero']; G.s = s; healAll(s);
    let enc = 0, min = 0, lose = 0;
    const fight = async (e: string, fixed: boolean) => {
      const r = await runOne({ lv: 0, party: [], cookies: 0, courage: 0, enc: e, fixed, policy: 'child' }, true);
      min += (r.turns * 12 + 20) / 60; if (r.res !== 'win') { lose++; LOSS[e + '@Lv' + s.members.hero.lv] = (LOSS[e + '@Lv' + s.members.hero.lv] ?? 0) + 1; healAll(G.s); s.money = Math.floor(s.money / 2); }
      return r;
    };
    for (const g of route(kind)) {
      if (g.heal) healAll(s);
      if (g.party) for (const id of g.party) { G.ensureMember(id); s.members[id].joined = true; s.party.push(id); }
      for (const f of g.fixed ?? []) {
        if (f === '@patrol5') { for (let k = 0; k < 5; k++) { await fight('meadow_grass', false); enc++; } min += 5 * 16 / 60 * 2; continue; }
        if (f === 'chick_slimes') { G.ensureMember('ali'); s.guest = 'ali'; }
        await fight(f, true); s.guest = null;
      }
      const k = g.enc ? pois(g.grass / STEPS(g.enc)) : 0;
      for (let i = 0; i < k; i++) { await fight(g.enc!, false); enc++; }
      addExp(s, g.quest); s.courage += g.courage ?? 0; min += g.walkMin;
      const o = (out[g.name] ??= { lv: [], enc: [], min: [], lose: 0 });
      o.lv.push(s.members.hero.lv + s.members.hero.exp / expToNext(s.members.hero.lv)); o.enc.push(enc); o.min.push(min); o.lose += lose;
    }
  }
  const avg = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;
  const pct = (a: number[], q: number) => [...a].sort((x, y) => x - y)[Math.floor(a.length * q)];
  return Object.entries(out).map(([k, o]) => ({ 路線: kind, 到達: k, ...statOptions, 平均等級: avg(o.lv).toFixed(2), 'p10等級': pct(o.lv, .1).toFixed(2), 累計遇敵: avg(o.enc).toFixed(1), 累計分鐘: avg(o.min).toFixed(0), 累計戰敗: (o.lose / n).toFixed(2) }));
}
function checkTalkRates() {
  let worst = 0;
  const riverMonsters = new Set([...FIXED[FANER_ENCOUNTER].enemies, ...ENCOUNTERS[BRIDGE_ENCOUNTER].groups.flatMap(group => group.enemies)]);
  for (const e of Object.values(ENEMIES).filter(e => !e.boss && !riverMonsters.has(e.id) && !['echobat', 'mossrock', 'mossantler_boss', 'sighvine_boss'].includes(e.id) && !CH2_SCENARIOS.some(sc => sc.enc === `sim_${e.id}`))) {
    for (const extra of [0, e.talkBonus?.add ?? 0]) {
      for (let c = 0; c <= 30; c++) {
        const old = Math.min(.95, e.talkBase + extra + .05 * c);
        const current = talkChance(e.talkBase + extra, c, 0);
        worst = Math.max(worst, old - current);
        assert(current >= old - .06, `${e.id}・勇氣值 ${c}・對話基礎加成 ${extra}`);
      }
    }
  }
  return worst;
}
function seeded(seed: number) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
async function compareStats() {
  const n = Number(process.argv[2] || 1000);
  const worst = checkTalkRates();
  const rows: any[] = [];
  const originalRandom = Math.random;
  try {
    for (const scenario of SCENARIOS.filter(sc => !CH3_SCENARIOS.includes(sc))) for (const lv of scenario.lv) for (const party of scenario.parties) {
      const setup = { ...scenario, lv, party: P[party], policy: 'child' as const };
      const startTrial = (i: number) => { Math.random = seeded(Math.imul(i + 1, 0x9e3779b9)); };
      const old = await batch({ ...setup, legacy: true }, n, startTrial);
      const current = await batch({ ...setup, ...statOptions, stats: true }, n, startTrial);
      rows.push({ 情境: scenario.name, 等級: lv, 隊伍: party, 舊版: old, 新版: current });
    }
  } finally { Math.random = originalRandom; }
  const summaries = [false, true].map(ch2 => {
    const group = rows.filter(row => [...CH2_SCENARIOS, echoScenario, antlerScenario].some(sc => sc.name === row.情境) === ch2);
    const avg = (key: '舊版' | '新版', metric: string) => group.reduce((total, row) => total + row[key][metric], 0) / group.length;
    return { 章: ch2 ? 2 : 1, 組合: group.length,
      舊平均勝率: avg('舊版', 'win'), 新平均勝率: avg('新版', 'win'),
      舊平均回合: avg('舊版', 'turns'), 新平均回合: avg('新版', 'turns'),
      勝率下降組合: group.filter(r => r.新版.win < r.舊版.win).length,
      回合增加組合: group.filter(r => r.新版.turns > r.舊版.turns).length };
  });
  const file = process.argv[process.argv.indexOf('--stats') + 1] || 'sim/stats_010.json';
  const fs = await import('node:fs');
  fs.writeFileSync(file, JSON.stringify({ 每組場次: n, 新數值: statOptions, 對話成功率最大降幅: worst, 摘要: summaries, 結果: rows }, null, 2) + '\n');
  console.table(summaries);
}
console.log('模擬設定', statOptions);
if (process.argv.includes('--stats')) await compareStats();
else if (process.argv.includes('--curve')) (async () => { const rows = []; for (const k of ['ali', 'mint', 'full'] as const) rows.push(...await curve(k, 400)); console.table(rows); console.log('戰敗來源', LOSS); const j = process.argv.indexOf('--json'); if (j > 0) (await import('fs')).writeFileSync(process.argv[j + 1], JSON.stringify(rows, null, 1)); })();
else main();
