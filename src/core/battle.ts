// 戰鬥規則（純邏輯，數值暫定）
export function calcDamage(atk: number, def: number, power = 1, defending = false) {
  const base = atk * power * (0.9 + Math.random() * 0.2) - def / 2;
  let d = Math.max(1, Math.round(base));
  if (defending) d = Math.max(1, Math.floor(d / 2));
  return d;
}
// 對話成功率 = 基礎 + 勇氣值每點 +5%（同第一章）+ 善良值每點 +2.5%（善良值這部分最多 +15%）+ 技能加成，總上限 95%
export function talkChance(base: number, courage: number, kindness: number, purrBonus = 0) {
  const kindBonus = Math.min(0.15, kindness * 0.025);
  return Math.min(0.95, base + courage * 0.05 + kindBonus + purrBonus);
}
export function bossTalkChance(base: number, courage: number) {
  return Math.min(0.95, base + courage * 0.05);
}
export function escapeChance(heroSpd: number, enemySpd: number) { return Math.min(0.9, 0.55 + (heroSpd - enemySpd) * 0.04); }
