const fake = (): any => ({ innerHTML: '', className: '', style: {}, dataset: {}, classList: { add() {}, remove() {}, toggle() {} }, querySelector: () => null, addEventListener() {}, removeEventListener() {}, remove() {} });
export const el = (..._a: any[]) => fake();
export const root = () => fake();
export const A = (k: string) => k;
