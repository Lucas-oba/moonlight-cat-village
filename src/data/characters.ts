// 隊伍成員（最多 3 人上場）。數值暫定。
export type SkillKind = 'attack' | 'taunt' | 'guard' | 'heal' | 'cure' | 'allFoes' | 'dash' | 'guardAll' | 'healAll' | 'peek';
export interface SkillDef { id: string; name: string; mp: number; power: number; desc: string; learnLv: number; kind: SkillKind; quest?: boolean; }
export interface MemberDef { id: string; name: string; role: string; icon: string; base: { hp: number; mp: number; atk: number; def: number; spd: number }; grow: { hp: number; mp: number; atk: number; def: number; spd: number }; skills: SkillDef[]; verb: string; }
export const MEMBERS: Record<string, MemberDef> = {
  hero: { id: 'hero', name: '{name}', role: '初級戰士', icon: 'hero_big', verb: '揮動木劍', base: { hp: 32, mp: 8, atk: 7, def: 3, spd: 6 }, grow: { hp: 6, mp: 2, atk: 2, def: 1, spd: 1 },
    skills: [{ id: 'brave_slash', name: '勇氣揮擊', mp: 3, power: 1.7, desc: '鼓起勇氣用力一揮，傷害比較大。', learnLv: 1, kind: 'attack' }] },
  ali: { id: 'ali', name: '阿栗', role: '見習守衛（站前面保護大家）', icon: 'ali', verb: '用盾牌撞過去', base: { hp: 40, mp: 6, atk: 6, def: 6, spd: 4 }, grow: { hp: 8, mp: 1, atk: 1, def: 2, spd: 1 },
    skills: [
      { id: 'shield_punch', name: '盾牌貓拳', mp: 2, power: 1.2, desc: '打一下，讓魔物只想打阿栗。', learnLv: 1, kind: 'taunt' },
      { id: 'cover', name: '我來擋！', mp: 2, power: 0, desc: '這一回合，替一位隊友擋下攻擊。', learnLv: 1, kind: 'guard' },
      { id: 'brave_roar', name: '勇氣喵吼', mp: 4, power: 0, desc: '大聲一吼！全隊 2 回合受到的傷害變少。', learnLv: 1, kind: 'guardAll', quest: true },
    ] },
  mint: { id: 'mint', name: '薄荷', role: '草藥師（幫大家回血）', icon: 'mint', verb: '用藥草籃輕輕敲', base: { hp: 26, mp: 14, atk: 4, def: 3, spd: 5 }, grow: { hp: 5, mp: 3, atk: 1, def: 1, spd: 1 },
    skills: [
      { id: 'mint_heal', name: '薄荷療癒', mp: 3, power: 18, desc: '幫一位隊友回復 HP。', learnLv: 1, kind: 'heal' },
      { id: 'calm_scent', name: '安神花香', mp: 2, power: 0, desc: '解除一位隊友的黏黏、暈暈、睡著。', learnLv: 1, kind: 'cure' },
      { id: 'herb_pack', name: '草藥小包', mp: 6, power: 12, desc: '幫全隊一起回復一點 HP。', learnLv: 1, kind: 'healAll', quest: true },
    ] },
  yuzu: { id: 'yuzu', name: '柚子', role: '小郵差（跑得快、丟毛線球）', icon: 'yuzu', verb: '丟出毛線球', base: { hp: 28, mp: 10, atk: 6, def: 3, spd: 9 }, grow: { hp: 5, mp: 2, atk: 2, def: 1, spd: 2 },
    skills: [
      { id: 'yarn_throw', name: '毛線球連投', mp: 3, power: 0.8, desc: '對全部魔物丟毛線球。', learnLv: 1, kind: 'allFoes' },
      { id: 'swift_step', name: '疾風貓步', mp: 2, power: 0, desc: '跑得好快！這一場戰鬥可以多動一次（只能用一次）。', learnLv: 1, kind: 'dash' },
      { id: 'peek', name: '偷偷看', mp: 1, power: 0, desc: '偷偷看魔物還有多少 HP，和「對話」成功率。', learnLv: 1, kind: 'peek', quest: true },
    ] },
};
export const MAX_PARTY = 3;
export function expToNext(lv: number) { return Math.round(40 * Math.pow(lv, 1.4)); }
