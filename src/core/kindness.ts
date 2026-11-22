// 只計算善良值額外點亮的燈，劇情燈由地圖另計。
export function kindnessLampCount(kindness: number) {
  return [5, 12, 20, 30].filter(threshold => kindness >= threshold).length;
}

export function kindnessFogLevel(kindness: number): 'thick' | 'medium' | 'thin' {
  if (kindness < 12) return 'thick';
  if (kindness < 20) return 'medium';
  return 'thin';
}
