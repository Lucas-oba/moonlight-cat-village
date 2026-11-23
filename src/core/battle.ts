import { heroTier } from './hearts';

// 戰鬥規則（純邏輯，數值暫定）
export function calcDamage(atk: number, def: number, power = 1, defending = false) {
  const base = atk * power * (0.9 + Math.random() * 0.2) - def / 2;
  let d = Math.max(1, Math.round(base));
  if (defending) d = Math.max(1, Math.floor(d / 2));
  return d;
}
export function courageBonus(courage: number) {
  return 0.05 * Math.min(courage, 10) + 0.03 * Math.max(0, courage - 10) + 0.04 * heroTier(courage);
}
export function talkChance(base: number, courage: number, kindness: number, purrBonus = 0, moodBonus = 0) {
  return Math.min(0.95, base + courageBonus(courage) + Math.min(0.15, kindness * 0.025) + purrBonus + moodBonus);
}
export const criticalChance = (observation: number) => observation < 5 ? 0 : Math.min(0.3, 0.08 + 0.02 * observation);
export const helperChance = (kindness: number) => Math.min(0.4, 0.1 + kindness * 0.01);
export function bossTalkChance(base: number, courage: number) {
  return Math.min(0.95, base + courage * 0.05);
}
export function escapeChance(heroSpd: number, enemySpd: number) { return Math.min(0.9, 0.55 + (heroSpd - enemySpd) * 0.04); }
