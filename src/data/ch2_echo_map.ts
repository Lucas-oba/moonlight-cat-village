import { point } from './ch2_maps';
import { ENCOUNTERS, ENEMIES } from './enemies';
import { STICKERS, STICKER_PAGES } from './items';
import { MAPS } from './maps';
import type { EnemyDef } from './types';

export const ECHO = 'echovalley';
export const ECHO_ENCOUNTER = 'echo_grass';
export const ECHO_OPEN = { questDone: 'c2m6' };

const valleyDecor = [
  { key: 'valley_vines', tiles: [[4, 2], [15, 3], [5, 7], [10, 7], [15, 7], [3, 11], [9, 11], [14, 11], [1, 17], [17, 17], [1, 27], [17, 29]] },
  { key: 'valley_boulder', tiles: [[6, 4], [13, 4], [4, 9], [14, 9], [3, 15], [14, 16], [3, 23], [14, 26], [5, 29], [13, 30]] },
  { key: 'valley_mushrooms', tiles: [[7, 4], [14, 4], [5, 9], [13, 12], [4, 15], [12, 17], [4, 23], [13, 26], [6, 29], [12, 30]] },
].flatMap(({ key, tiles }) => tiles.map(([col, row], i) => ({
  key, ...point(col, row), flip: i % 2 === 1, scale: i % 3 === 0 ? .8 : 1,
})));

const mist = MAPS.mistpath;
mist.tiles[0] = 'TTTTTTTTTTxTTTTTTTTTT';
mist.exits.push({ tx: 10, ty: 0, to: ECHO, ...point(9, 30), dir: 1,
  when: ECHO_OPEN, lockedDialogue: 'c2_valley_locked' });

MAPS[ECHO] = {
  id: ECHO, name: '迴聲谷', music: 'echo', forest: true, encounter: ECHO_ENCOUNTER, zones: [],
  tiles: Array.from({ length: 33 }, (_, row) => Array.from({ length: 19 }, (_, col) => {
    if (row === 32 && col === 9) return 'x';
    if (row === 0 || row === 32 || col === 0 || col === 18) return 'C';
    if (row === 19 || row === 20) return col === 15 ? 'b' : 'v';
    if (row === 1) return col === 9 ? 'q' : 'C';
    if (row === 10) return col === 6 ? 'q' : 'C';
    if (row === 6) return col === 12 ? 'q' : 'C';
    if (row >= 22 && row <= 25 && (col <= 6 || col >= 12)) return 'g';
    if (row >= 12 && row <= 15 && col >= 5 && col <= 13) return 'g';
    return col >= 8 && col <= 10 ? 'q' : 'k';
  }).join('')),
  props: [
    ...valleyDecor,
    { key: 'c2_sleepflower', ...point(4, 17), scale: .8, when: { questActive: 'c2s16' } },
    { key: 'c2_rootwall', ...point(6, 10), block: [30, 18], when: { notFlag: 'c2_root_under' } },
    { key: 'c2_rootwall', ...point(12, 6), block: [30, 18], when: { notFlag: 'c2_root_over' } },
    { key: 'c2_rootwall', ...point(9, 1), scale: .85, block: [112, 23] },
    { key: 'c2_rootwall', ...point(15, 20), block: [30, 18], hidden: true, when: { notFlag: 'c2_bridge_open' } },
  ],
  exits: [{ tx: 9, ty: 32, to: 'mistpath', ...point(10, 2), dir: 0 }],
  labels: [
    { ...point(9, 31), text: '↓ 紫霧林道' },
    { ...point(5, 22), text: '慢慢渡口' },
    { ...point(15, 22), text: '高高的獨木橋' },
    { ...point(9, 1), text: '苔角的窩' },
  ],
};

const enemies: EnemyDef[] = [
  {
    id: 'echobat', name: '迴聲蝙蝠', sprite: 'echobat', mood: 'lonely', weak: '發亮的耳尖',
    hp: 70, atk: 19, def: 5, spd: 17, exp: 57, money: 22, talkBase: .24,
    likesFood: ['moon_berry'], gifts: [{ item: 'moon_berry', chance: .25 }],
    talkLines: ['妳願意聽我說話！那我就不喊回音了。'], talkFail: ['再陪我說一句嘛……'],
    info: ['牠愛模仿剛聽到的招式。'],
    skills: [{ id: 'echo_copy', name: '回音模仿', chance: .55, power: .55, mimic: true }],
  },
  {
    id: 'mossrock', name: '苔苔石', sprite: 'mossrock', mood: 'scared', weak: '石頭底下的軟苔蘚',
    hp: 78, atk: 20, def: 9, spd: 9, exp: 64, money: 24, talkBase: .30,
    likesFood: false, gifts: [{ item: 'forest_mushroom', chance: .25 }],
    talkLines: ['呼……咦？我擋到路了嗎？對不起！'], talkFail: ['嗚……是誰？讓我再躲一下。'],
    info: ['牠的身體很硬，常常睡到忘了讓路。'],
    skills: [{ id: 'moss_nap', name: '打瞌睡', chance: .45, power: 0, doze: true }],
  },
];
const monsters = STICKER_PAGES.find(page => page.id === 'monster')!;
for (const enemy of enemies) {
  ENEMIES[enemy.id] = enemy;
  for (const [suffix, label] of [['talk', '對話'], ['defeat', '打倒']]) {
    const id = `${enemy.id}_${suffix}`;
    STICKERS[id] = `${enemy.name}（${label}）`;
    monsters.ids.push(id);
  }
}

ENCOUNTERS[ECHO_ENCOUNTER] = {
  id: ECHO_ENCOUNTER, rate: .14, minSteps: 6, bg: 'echobg',
  groups: [
    { enemies: ['echobat', 'echobat'], weight: 3 },
    { enemies: ['mossrock', 'echobat'], weight: 4 },
    { enemies: ['mossrock', 'thornling'], weight: 3 },
  ],
};
