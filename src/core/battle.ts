// 戰鬥規則（純邏輯，數值暫定）
export function calcDamage(atk: number, def: number, power = 1, defending = false) {
  const base = atk * power * (0.9 + Math.random() * 0.2) - def / 2;
  let d = Math.max(1, Math.round(base));
  if (defending) d = Math.max(1, Math.floor(d / 2));
  return d;
}
// 對話成功率 = 基礎成功率 + 勇氣值加成（每點 +5%），上限 95%
export function talkChance(base: number, courage: number) { return Math.min(0.95, base + courage * 0.05); }
export function escapeChance(heroSpd: number, enemySpd: number) { return Math.min(0.9, 0.55 + (heroSpd - enemySpd) * 0.04); }
