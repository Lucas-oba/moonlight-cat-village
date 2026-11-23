import { ENCOUNTERS, FIXED } from './enemies';
import { GLINTS, MAPS, TILE, WONDERS } from './maps';
import type { Cond, MapDef, PropDef } from './types';

const t = (n: number) => n * TILE;
export const point = (col: number, row: number) => ({ x: t(col) + 16, y: t(row) + 20 });
export const MIST_ENTRANCE = point(10, 34);
export const ROOT_REST = point(7, 16);
export const TRAP = point(10, 22);
export const ANTLER = point(10, 4);
export const ROOT_ARRIVAL = point(1, 12);

const started: Cond = { flag: 'c2_tree_open' };
const openedVillage: Cond = { questDone: 'c2m3' };
const repaired: Cond = { flag: 'c2_chief_house' };
const arrived: Cond = { flag: 'c2_sprout_found' };
const mist = [
  'TTTTTTTTTTTTTTTTTTTTT',
  'TTTTTTTkkkkkkkTTTTTTT',
  'TTTTTTkkkkkkkkkTTTTTT',
  'TTTTTTkkkkkkkkkTTTTTT',
  'TTTTTTkkkkkkkkkTTTTTT',
  'TTTTTTkkkqqqkkkTTTTTT',
  'TTTTkkkkkqqqkkkkkTTTT',
  'TTTTkkggkqqqkggkkTTTT',
  'TTTkkgggkqqqkgggkkTTT',
  'TTTkkgggkqqqkgggkkTTT',
  'TTTkkkkkqqqkkkkkkkTTT',
  'TTTkkggkqqqkkggkkkTTT',
  'TTTkkggkqqqkkggkkkTTT',
  'TTTkkkkkqqqkkkkkkkTTT',
  'TTTTkkkkkqqqkkkkTTTTT',
  'TTTTkkkkkqqqqqqqqqqqq',
  'TTTTkkkkkqqqqqqqqqqqq',
  'TTTkkkkkkqqqkkkkkkkkT',
  'TkkkkkkkkqqqkkkggkkkT',
  'TkkkkkkkkqqqkkkggkkkT',
  'TkkkkkkkkqqqkkkkkkkkT',
  'TkkkkkkkkqqqkkkkkkkkT',
  'TkkkkkkkkqqqkkkkkkkkT',
  'TkkkkkkkkqqqkkkkkkkkT',
  'TkkkkkkkkqqqkkkkkkkkT',
  'TkkgggkkkqqqkkkkkkkkT',
  'TkkgggkkkqqqkkkkkkkkT',
  'TkkkkkkkkqqqkkkggkkkT',
  'TTTkkkkkkqqqkkkggkTTT',
  'TTTkkkkkkqqqkkkkkkTTT',
  'TTTTTkkkkqqqkkkkTTTTT',
  'TTTTTkkkkqqqkkkkTTTTT',
  'TTTTTTkkkqqqkkkTTTTTT',
  'TTTTTTkkkqqqkkkTTTTTT',
  'TTTTTTkkkqqqkkkTTTTTT',
  'TTTTTTTkkqqqkkTTTTTTT',
  'TTTTTTTTTqqqTTTTTTTTT',
];

function prop(key: string, col: number, row: number, options: Partial<PropDef> = {}): PropDef {
  return { key, ...point(col, row), ...options };
}

MAPS.mistpath = {
  id: 'mistpath', name: '紫霧林道', tiles: mist, trees: true, forest: true, mist: true,
  music: 'mist', encounter: 'mist_grass',
  props: [
    prop('c2_mosslog', 7, 33, { scale: .82, block: [56, 20] }),
    prop('c2_mosslog', 13, 30, { scale: .77, block: [50, 18], flip: true }),
    prop('c2_mosslog', 5, 24, { scale: .72, block: [48, 20] }),
    prop('c2_mosslog', 15, 21, { scale: .75, block: [48, 20], flip: true }),
    prop('c2_mosslog', 15, 17, { scale: .72, block: [48, 18] }),
    prop('c2_mosslog', 13, 7, { scale: .75, block: [48, 20], flip: true }),
    prop('c2_door', 4, 20, { block: [40, 20] }),
    prop('c2_door', 6, 20, { block: [40, 20] }),
    prop('c2_door', 8, 20, { block: [40, 20] }),
    prop('c2_net', 10, 22, { y: TRAP.y - 40, scale: 1.34, depth: TRAP.y + 1, when: { flag: 'c2_hero_netted' } }),
    prop('c2_net', 12, 22, { y: TRAP.y - 19, scale: .68, depth: TRAP.y + 1, when: { flag: 'c2_squirrel_netted' } }),
    prop('c2_vine', 10, 1, { when: { not: arrived } }),
  ],
  exits: [
    ...[9, 10, 11].map(tx => ({ tx, ty: 36, to: 'forest', ...point(11, 41), dir: 1 })),
    ...[15, 16].map(ty => ({ tx: 20, ty, to: 'rootvillage', ...ROOT_ARRIVAL, dir: 3, when: openedVillage, lockedDialogue: 'c2_village_locked', push: [-18, 0] as [number, number] })),
  ],
  guidePaw: {
    when: { all: [{ questActive: 'c2m3' }, { flag: 'c2_mistpuffs_peaceful' }] },
    points: [30, 29, 28, 27, 26, 25, 24].map(row => [point(10, row).x, point(10, row).y]),
  },
  zones: [{ id: 'mist_north', x: 0, y: 0, w: t(21), h: t(14), encounter: 'mist_north_grass' }],
  labels: [
    { ...point(10, 35), text: '↓ 黑森林' },
    { ...point(17, 15), y: t(15) - 7, text: '大樹根村 →' },
    { ...point(6, 7), text: '↑ 迴聲谷口' },
  ],
};

const grass: MapDef['tiles'] = Array.from({ length: 25 }, (_, row) =>
  Array.from({ length: 21 }, (_, col) => {
    if (col === 0 && [11, 12, 13].includes(row)) return 'x';
    if (row === 0 || row === 24 || col === 0 || col === 20) return 'T';
    if ((row >= 11 && row <= 13) || (col >= 6 && col <= 8 && row >= 6 && row <= 21)
      || (col >= 14 && col <= 15 && row >= 5 && row <= 20)) return 'p';
    return (col + 3 * row) % 17 === 0 ? ',' : '.';
  }).join(''));

const house = (col: number, row: number) => prop('c2_house_broken', col, row, { block: [78, 34], scale: .94 });
const lamp = (col: number, row: number, when: Cond) => [
  prop('c2_lamp_off', col, row, { scale: .78, when: { not: when } }),
  prop('c2_lamp_on', col, row, { scale: .78, when }),
];

MAPS.rootvillage = {
  id: 'rootvillage', name: '大樹根村', tiles: grass, trees: true, music: 'roots',
  props: [
    prop('c2_bigtree', 10, 11, { scale: .85, block: [148, 64] }),
    { ...house(10, 16), when: { not: repaired } },
    { ...house(10, 16), key: 'c2_house_fixed', when: repaired },
    house(4, 8), house(16, 8), house(4, 20), house(16, 20),
    prop('c2_cloudline', 16, 4, { scale: .72 }),
    prop('c2_mosslog', 3, 15, { scale: .63, block: [42, 18] }),
    prop('c2_mosslog', 12, 21, { scale: .72, block: [48, 18] }),
    ...lamp(8, 16, repaired),
    ...lamp(12, 16, { questDone: 'c2m6' }),
    ...lamp(3, 11, { minKindCh2: 5 }),
    ...lamp(15, 11, { minKindCh2: 12 }),
    ...lamp(6, 20, { minKindCh2: 20 }),
    ...lamp(17, 17, { minKindCh2: 30 }),
  ],
  exits: [11, 12, 13].map(ty => ({ tx: 0, ty, to: 'mistpath', ...point(18, 16), dir: 2 })),
  zones: [],
  labels: [{ ...point(2, 11), text: '← 紫霧林道' }],
};

WONDERS.push({ id: 'c2_root_top', map: 'rootvillage', ...point(10, 2), mode: 'big',
  area: { x: t(7), y: t(1), w: t(7), h: t(3) } });

const forest = MAPS.forest;
const fallen = forest.props.find(p => p.key === 'log')!;
fallen.when = { not: started };
forest.props.push({ ...fallen, x: fallen.x + 72, when: started });
forest.labels = [{ ...point(11, 42), y: t(42) + 21, text: '↓ 紫霧林道', when: started }];
Object.assign(forest.exits.find(e => e.ty === 42)!, {
  to: 'mistpath', ...MIST_ENTRANCE, dir: 1, when: started,
});

export const PLANKS = [point(5, 14), point(6, 17), point(13, 15)];
export const PRINTS = [point(9, 13), point(10, 10), point(10, 6)];
PLANKS.forEach((p, i) => {
  const id = `c2_planks_${i + 1}`;
  GLINTS.push({ id, map: 'rootvillage', ...p, obs: 0, sprite: 'c2_planks',
    when: { objCurrent: ['c2m4', 'planks'] }, once: id, d: 'c2_carry_planks' });
});
PRINTS.forEach((p, i) => {
  const id = `c2_print_${i + 1}`;
  GLINTS.push({ id, map: 'mistpath', ...p, obs: 0, sprite: 'c2_footprint',
    when: { objCurrent: ['c2m5', `print${i + 1}`] }, once: id, d: id });
});
GLINTS.push(
  { id: 'c2_rest', map: 'rootvillage', ...point(10, 17), obs: 0, kind: 'paw', when: repaired, d: 'c2_rest' },
  { id: 'c2_valley_vines', map: 'mistpath', ...point(10, 1), obs: 0, sprite: 'c2_vine', spriteOrigin: 'base', when: arrived, d: 'c2_valley_locked' },
);

const common = [
  { enemies: ['mistpuff', 'mistpuff'], weight: 4 },
  { enemies: ['thornling', 'mistpuff'], weight: 3 },
  { enemies: ['cryshroom', 'thornling'], weight: 3 },
];
ENCOUNTERS.mist_grass = { id: 'mist_grass', rate: .14, minSteps: 6, bg: 'mistbg', groups: common };
ENCOUNTERS.mist_north_grass = { ...ENCOUNTERS.mist_grass, id: 'mist_north_grass',
  groups: [...common, { enemies: ['mistwolf', 'mistpuff'], weight: 7 }, { enemies: ['mistwolf', 'cryshroom'], weight: 4 }] };
FIXED.c2_mistpuffs = { id: 'c2_mistpuffs', enemies: ['mistpuff', 'mistpuff'], bg: 'mistbg',
  talkFlag: 'c2_mistpuffs_peaceful', noEscape: true,
  hint: '霧團子在發抖……也許牠們肚子餓了？<br>試試看用「道具」把食物分給牠們喵。' };
