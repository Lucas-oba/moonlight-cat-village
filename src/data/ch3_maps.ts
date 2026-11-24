import { LANTERNS } from './ch1c';
import { point } from './ch2_maps';
import { BRIDGE_ENCOUNTER, REED_ENCOUNTER } from './ch3_enemies';
import { DIALOGUES } from './dialogues';
import { GLINTS, MAPS, TILE, WONDERS } from './maps';
import { NPCS } from './npcs';
import type { Action, Cond, PropDef } from './types';

const reed = 'reedbeach';
const village = 'twobanks';
const bridge = 'knotbridge';
export const BANKS_REST = point(5, 10);

const villageOpen: Cond = { objDone: ['c3m3', 'snacks'] };
const banks = [5, 17]; // 西岸、東岸兩條小路，從上游一路走到下游。

function prop(key: string, col: number, row: number, options: Partial<PropDef> = {}): PropDef {
  return { key, ...point(col, row), ...options };
}
function patch(key: string, tiles: number[][], scale = 1): PropDef[] {
  return tiles.map(([col, row], i) => prop(key, col, row, {
    scale: scale * [.86, 1, .75][i % 3], flip: i % 2 === 1,
  }));
}
const label = (col: number, row: number, text: string) => ({ ...point(col, row), text });

MAPS[reed] = {
  id: reed, name: '蘆管灘', riverbank: true, trees: true, music: 'reed', encounter: REED_ENCOUNTER,
  tiles: [
    'TTTTTTTTvvvvvvTTTTTTTTT',
    'TkkkkkkdvvvvvvdkkkkkkkT',
    'TkkkkkkdvvvvvvdkkkkkkkT',
    'TkkkkkkkdvvvvvdgggggkkT',
    'Tkkkkkkkdvvvvvdgggggk,T',
    'TkgggksssvvvvvdggqggkkT',
    'TkgggksssvvvvvdggqggkkT',
    'TkgggkqkdvvvvvdggqggkkT',
    'Tkggg,qkkdvvvvvdkqqkkkT',
    'T,gggqqggdvvvvvdkkqkkkT',
    'TkkkkqgggdvvvvvdkkqkkkT',
    'TkkkkqgggdvvvvdkkkqkkkT',
    'TkkkkqkkkdvvvvdkkkqkkkT',
    'TkkkkqssssvvvvssssqkkkT',
    'TkkkkqssssvvvvssssqkkkT',
    'TkkkkqkkdvvvvvdkkkqkkkT',
    'TkkkkqkkdvvvvvdkkkqkkkT',
    'Tkggqq,kdvvvvvdkggqggkT',
    'TkggqggggdvvvvvdggqggkT',
    'TkggqggggdvvvvvdggqggkT',
    'TkggqqgggdvvvvvdgqqggkT',
    'TkgggqkkkdvvvvvdgqgggkT',
    'TkkkkqkkdvvvvvdkkqkkkkT',
    'Tkkkkqkkdvvvvvdkkqk,kkT',
    'Tkkkkqkkdvvvvvd,kqkkkkT',
    'TTTTTqTTTvvvvvTTTqTTTTT',
  ],
  props: [
    // 船靠在石階外。兩岸的蘆葦高低不同，中間只看得到一小段河面。
    ...patch('c3_reeds', [[7, 2], [8, 3], [8, 8], [9, 9], [9, 12], [9, 15], [8, 16], [8, 18], [9, 19], [8, 23],
      [14, 3], [15, 4], [14, 7], [15, 9], [15, 10], [14, 11], [14, 12], [14, 15], [15, 16], [15, 18], [15, 20], [14, 23]], 1.07),
    ...patch('valley_boulder', [[2, 4], [3, 12], [1, 16], [7, 22], [19, 4], [20, 9], [20, 16], [15, 22]], .83),
    ...patch('tree', [[2, 3], [2, 11], [3, 17], [2, 23], [20, 3], [20, 12], [21, 21]], .87),
    ...patch('c3_post', [[8, 5], [9, 13], [14, 13]], .75),
    prop('c3_clappers', 7, 14, { x: point(7, 14).x - 9, scale: .64 }),
    prop('c3_bucket', 16, 15, { scale: .68 }),
    prop('c2_mosslog', 3, 20, { scale: .62 }),
  ],
  exits: banks.map(col => ({ tx: col, ty: 25, to: village, ...point(col, 2), dir: 0,
    when: villageOpen, lockedDialogue: 'c3_village_closed' })),
  zones: [],
  labels: [label(5, 4, '↑ 慢慢渡口'), label(6, 12, '西岸石階'), label(17, 12, '東岸石階'),
    ...banks.map(col => label(col, 24, '↓ 兩岸村'))],
};

MAPS[village] = {
  id: village, name: '兩岸村', riverbank: true, trees: true, music: 'banks',
  tiles: [
    'TTTTTqTTTvvvvvTTTqTTTTT',
    'TkkkkqkkdvvvvvdkkqkkkkT',
    'TkkkkqkkdvvvvvdkkqkkkkT',
    'TkkkkqkkdvvvvvdkkqkkkkT',
    'Tkkkkqkkdvvvvvdkkqkkk,T',
    'TkkkkqkkkdvvvvvdkqkkkkT',
    'TkkkkqqkkdvvvvvdkqkkkkT',
    'TkkkkkqkkdvvvvvdqqkkkkT',
    'Tkkkk,qkkdvvvvqqqqqqqkT',
    'T,qqqqqqqdvvvvdkqkkkkkT',
    'TkkkkkqkkdvvvvdkqkkkkkT',
    'TkkkkkqkdvvvvvdkqqkkkkT',
    'TkkksssssvvvvvssssskkkT',
    'TkkksssssBvvvBssssskkkT',
    'TkkksssssvvvvvssssskkkT',
    'TkkkkqkkdvvvvvdkkqkkkkT',
    'TkkkkqkkdvvvvdkkkqkkkkT',
    'Tkkkkq,kdvvvvdkkkqkkkkT',
    'TkqqqqqqdvvvvdkqqqqqqkT',
    'TkkkkqkkdvvvvdkkkqkkkkT',
    'TkkkkqkkkdvvvvdkkqkkkkT',
    'TkkkkqkkkdvvvvdkkqkkkkT',
    'TkkkkqkkkdvvvvdkkqkkkkT',
    'Tkkkkqkkkdvvvvdkkqk,kkT',
    'TTTTTqTTTTvvvvTTTqTTTTT',
  ],
  props: [
    prop('inn', 3, 8, { scale: .90, block: [79, 30] }),
    prop('house', 7, 4, { scale: .75, block: [60, 24] }),
    prop('house', 3, 21, { scale: .81, block: [68, 26], flip: true }),
    prop('house', 19, 5, { scale: .8, block: [68, 26] }),
    prop('c2_house_fixed', 20, 11, { scale: .84, block: [62, 24] }),
    prop('house', 15, 20, { scale: .76, block: [60, 24], flip: true }),
    prop('stall', 2, 15, { scale: .79, block: [47, 21] }),
    prop('fishrack', 19, 16, { scale: .82, block: [44, 14] }),
    prop('f_rocker', 2, 10, { scale: .7 }), prop('c3_bucket', 3, 9, { scale: .7 }),
    prop('f_sacks', 2, 17, { scale: .6 }), prop('f_barrel', 7, 11, { scale: .74 }),
    prop('c3_bucket', 16, 14, { scale: .7 }), prop('c3_bucket', 18, 17, { scale: .58 }),
    ...patch('c3_reeds', [[8, 4], [9, 6], [9, 10], [8, 16], [8, 17], [9, 21], [14, 2], [15, 6], [14, 10], [13, 16], [14, 22]]),
    ...patch('c3_post', [[9, 12], [13, 12], [9, 18]], .68),
    ...patch('tree', [[2, 4], [8, 18], [20, 3], [20, 22]], .80),
    ...patch('flowerpot', [[5, 8], [7, 5], [3, 22], [19, 12], [16, 21]], .78),
  ],
  exits: [
    ...banks.map(col => ({ tx: col, ty: 0, to: reed, ...point(col, 23), dir: 1 })),
    ...banks.map(col => ({ tx: col, ty: 24, to: bridge, ...point(col, 2), dir: 0,
      when: villageOpen, lockedDialogue: 'c3_village_closed' })),
  ],
  zones: [],
  labels: [...banks.map(col => label(col, 1, '↑ 蘆管灘')),
    label(3, 5, '船棚'), label(2, 13, '雜貨'), label(8, 15, '舊渡船 →'), label(15, 15, '← 舊渡船'),
    ...banks.map(col => label(col, 23, '↓ 雙結橋'))],
};

MAPS[bridge] = {
  id: bridge, name: '雙結橋', riverbank: true, music: 'reed', encounter: BRIDGE_ENCOUNTER,
  tiles: [
    'CCCCCqCCCvvvvvCCCqCCCCC',
    'CkkkkqkkdvvvvvdkkqkkkkC',
    'CkkkkqkkdvvvvvdkkqkkkkC',
    'CggggqkkkdvvvvdkkqkkkkC',
    'Cggggqkkkdvvvvdggqggg,C',
    'CgggqqkkkdvvvvdggqqggkC',
    'CgggqkkkdvvvvvdgggqggkC',
    'CkkgqgggdvvvvvdgggqggkC',
    'CkkgqgggdvvvvvdkkqqkkkC',
    'C,kgqqgdvvvvvvvdkqkkkkC',
    'CkkkkqssvvvvvvsssskkkkC',
    'CkkkkqssBBBBBBBssskkkkC',
    'CkkkkqssvdddddvssskkkkC',
    'CkkkkqkdvdddddvdkqqkkkC',
    'CkkkkqqdvvdddvvdkgqggkC',
    'CkkkkkqvvvdddvvvdgqggkC',
    'CkkkkkqvvvvbvvvvdgqggkC',
    'CkggggdvvvvbvvvvdgqggkC',
    'CkggggdvvvvbvvvvdggggkC',
    'CkggggdvvvvbvvvvdggggkC',
    'CkgggdvvvvdddvvvvdkkkkC',
    'CkkkkdvvvdddddvvvdkkkkC',
    'CkkkkdvvvdddddvvvdkkkkC',
    'Ckkkkdvvvvdsdvvvvdk,kkC',
    'CCCCCCvvvvvvvvvvvCCCCCC',
  ],
  props: [
    ...patch('c3_post', [[7, 10], [8, 12], [14, 9], [15, 12], [10, 15], [12, 15], [10, 20], [12, 20]], .92),
    ...patch('c3_reeds', [[8, 2], [9, 4], [8, 6], [8, 8], [7, 14], [6, 17], [6, 19], [5, 22],
      [14, 2], [14, 5], [15, 8], [16, 10], [16, 14], [16, 17], [17, 21]], 1.05),
    ...patch('valley_boulder', [[2, 3], [2, 10], [4, 14], [6, 15], [2, 19], [2, 23], [10, 13], [12, 14],
      [20, 3], [19, 8], [20, 12], [19, 18], [20, 22], [13, 21]], .92),
    ...patch('valley_mushrooms', [[3, 4], [3, 14], [3, 19], [20, 8], [19, 13], [20, 19]], .74),
    ...patch('tree', [[2, 2], [3, 7], [3, 23], [20, 2], [20, 9], [21, 18]], .88),
    prop('c3_flag', 16, 11, { scale: .59, when: { questNotDone: 'c3m6' } }),
    prop('c3_bucket', 18, 10, { scale: .63 }),
    prop('c3_post', 11, 16, { block: [31, 24], when: { questNotDone: 'c3m11' } }),
    prop('sign', 12, 16, { scale: .75, when: { questNotDone: 'c3m11' } }),
    prop('sign', 11, 23, { scale: .75, when: { questDone: 'c3m11' } }),
  ],
  exits: banks.map(col => ({ tx: col, ty: 0, to: village, ...point(col, 22), dir: 1 })),
  zones: [],
  labels: [...banks.map(col => label(col, 1, '↑ 兩岸村')), label(5, 10, '西橋頭'), label(17, 10, '東橋頭'),
    label(11, 18, '外側橋面')],
};

// 兩岸共用一艘船。船在另一岸時，點船柱也能把船叫過來。
export function crossBanks(from: 'west' | 'east', passenger?: string): Action[] {
  const eastbound = from === 'west';
  return [
    { type: 'flag', id: 'c3_ferry_on_east', value: !eastbound },
    { type: 'stage' },
    { type: 'walkOff', npc: 'c3_ferry_' + from, ...point(eastbound ? 13 : 9, 13), ms: 1300, ride: true, passenger },
    { type: 'flag', id: 'c3_ferry_on_east', value: eastbound },
    { type: 'warp', map: village, ...point(eastbound ? 14 : 8, 13), dir: eastbound ? 3 : 2 },
  ];
}
for (const from of ['west', 'east'] as const) {
  const eastbound = from === 'west';
  const id = 'c3_ferry_' + from;
  const dock = { map: village, ...point(eastbound ? 9 : 13, 13), flip: !eastbound };
  const moored: Cond = eastbound ? { notFlag: 'c3_ferry_on_east' } : { flag: 'c3_ferry_on_east' };
  NPCS.push({ id, name: '舊渡船', sprite: 'c3_ferry', scale: .83, noShadow: true,
    spots: [{ ...dock, when: moored }, { ...dock, sprite: 'c3_post' }],
    talk: [{ when: villageOpen, d: id }, { d: 'c3_village_closed' }] });
  DIALOGUES[id] = [{ s: 'narr', t: eastbound ? '船家伸出手，接妳去東岸。' : '船家伸出手，接妳回西岸。', act: crossBanks(from) }];
}

const supplies = DIALOGUES.merchant_shop2[0].act!.find(action => action.type === 'shop')!;
NPCS.push(
  { id: 'c3_aunt', name: '船棚阿姨', sprite: 'innkeeper', portrait: 'innkeeper_big', isCat: true,
    spots: [{ map: village, ...point(4, 9) }], talk: [{ d: 'c3_shed_rest' }] },
  { id: 'c3_grocer', name: '船家伯伯', sprite: 'merchant', portrait: 'merchant_big', isCat: true,
    spots: [{ map: village, ...point(2, 16) }], talk: [{ d: 'c3_river_shop' }] },
  { id: 'c3_upstream', name: '慢慢的小船', sprite: 'c3_ferry', scale: .88, noShadow: true,
    spots: [{ map: reed, ...point(8, 6) }], talk: [{ d: 'c3_upstream' }] },
);
DIALOGUES.c3_shed_rest = [{ s: 'c3_aunt', t: '船棚裡有軟墊。要歇歇腳嗎？', choices: [
  { label: '休息和存檔', act: [{ type: 'rest' }, { type: 'save' }] }, { label: '繼續走' },
] }];
DIALOGUES.c3_river_shop = [{ s: 'c3_grocer', t: '剛烤好的餅乾，還有給勇士的茶喔。', act: [{ ...supplies, title: '兩岸村雜貨' }] }];
DIALOGUES.c3_village_closed = [{ s: 'whitecat', t: '西岸石階上有隻小貓。我們先去問問她吧。' }];

NPCS.find(n => n.id === 'manman')!.talk.unshift({ when: { objDone: ['c3m2', 'ride'] }, d: 'c3_pick_ferry' });
DIALOGUES.c3_pick_ferry = [{ s: 'manman', t: '妳想順著河彎，還是到對岸呢？', choices: [
  { label: '去蘆管灘', next: 'c3_downstream' },
  { label: '去迴聲谷對岸', next: 'c2_ferry_first', when: { questActive: 'c2s16' } },
  { label: '去迴聲谷對岸', next: 'c2_ferry_out', when: { not: { questActive: 'c2s16' } } },
  { label: '留在這裡' },
] }];
DIALOGUES.c3_downstream = [{ s: 'manman', t: '坐穩。聽，蘆葦在吹口哨了。', act: [
  { type: 'flag', id: 'c2_ferry_north', value: false }, { type: 'stage' },
  { type: 'walkOff', npc: 'c2_ferry_boat', ...point(8, 20), ms: 1000, ride: true },
  { type: 'warp', map: reed, ...point(6, 6) },
] }];
DIALOGUES.c3_upstream = [{ s: 'manman', t: '要一起回迴聲谷嗎？', choices: [
  { label: '搭船回慢慢渡口', act: [
    { type: 'walkOff', npc: 'c3_upstream', ...point(10, 3), ms: 1000, ride: true },
    { type: 'flag', id: 'c2_ferry_north', value: false }, { type: 'warp', map: 'echovalley', ...point(6, 21) },
  ] }, { label: '留在蘆管灘' },
] }];

for (const [map, col, row, name] of [
  [reed, 4, 11, '蘆管灘的燈籠'], [village, 7, 9, '船棚的燈籠'], [bridge, 18, 9, '東橋頭的燈籠'],
] as const) {
  const id = 'lan_c3_' + map;
  const spot = { map, ...point(col, row) };
  LANTERNS.push({ id, name, ...spot });
  NPCS.push({ id, name: '月光燈籠', sprite: 'lantern_off',
    spots: [{ ...spot, when: { flag: id }, sprite: 'lantern_on' }, spot],
    talk: [{ when: { flag: id }, d: 'c2_lantern_lit' }, { d: id }] });
  DIALOGUES[id] = [{ s: 'narr', t: '月光燈籠亮了。下次可以從別盞燈回到這裡。', act: [
    { type: 'flag', id }, { type: 'sfx', id: 'ok' },
  ] }];
}

for (const [id, map, col, row, obs, text] of [
  ['c3_hollow_reed', reed, 8, 9, 3, '蘆葦的管子裡是空的。風一吹，它就輕輕響。'],
  ['c3_wet_steps', reed, 16, 16, 5, '石階上有一條濕線。剛才的水比現在高呢。'],
  ['c3_dock_ring', village, 8.375, 18.5, 4, '船柱上有一道淺淺的圈。是船繩磨出來的。'],
  ['c3_pebble', bridge, 6, 15.5, 6, '圓石底下有細細的白沙。水把石頭磨得好滑。'],
] as const) {
  GLINTS.push({ id, map, ...point(col, row), obs, once: id, d: id });
  DIALOGUES[id] = [{ s: 'hero', t: text, act: [{ type: 'stat', observation: 1 }] }];
}
GLINTS.push({ id: 'c3_bridge_sign', map: bridge, ...point(12, 15), obs: 0, kind: 'paw',
  when: { questNotDone: 'c3m11' }, d: 'c3_bridge_sign' },
{ id: 'c3_rainhill_sign', map: bridge, ...point(11, 23), obs: 0, kind: 'paw',
  when: { questDone: 'c3m11' }, d: 'c3_rainhill_sign' });
DIALOGUES.c3_bridge_sign = [{ s: 'narr', t: '木牌上寫著：「舊繩擋住橋面了。要去雨點坡的朋友，請之後再來。」' }];
DIALOGUES.c3_rainhill_sign = [{ s: 'narr', t: '往雨點坡的路（第四章製作中）' }];
WONDERS.push({ id: 'c3_reed_circle', map: reed, ...point(3, 15), mode: 'big',
  area: { x: TILE, y: TILE * 11, w: TILE * 8, h: TILE * 7 } });
