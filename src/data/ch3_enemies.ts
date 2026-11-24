import { ENCOUNTERS, ENEMIES } from './enemies';
import { chapter3MonsterStickers, stickerPictures, STICKERS, STICKER_PAGES } from './items';
import type { EncounterGroup, EnemyDef } from './types';

const enemies: EnemyDef[] = [
  {
    id: 'reedpuff', name: '蘆哨球', sprite: 'reedpuff', mood: 'lonely', weak: '蘆管外的毛球尾巴',
    hp: 93, atk: 18, def: 6, spd: 17, exp: 78, money: 24, talkBase: .37,
    talkLines: ['咻！妳有聽到？我再吹一小段給妳聽。', '妳敲兩下，我吹兩聲。咦，我們合起來是一首歌！'],
    talkFail: ['咻咻？我在這根蘆管裡，再叫我一次好嗎？'],
    likesFood: ['cookie', 'moon_berry'], foodReply: '給我一小口就好。咻！這一聲是謝謝妳。',
    foodRefusal: '蘆哨球探出頭來。「有脆脆的餅乾，或是小小的莓果嗎？」',
    gifts: [{ item: 'moon_berry', chance: .22 }], info: ['靠近河水，要大聲一點。我把蘆管伸出來才聽得清楚。'],
    skills: [{ id: 'reed_whistle', name: '蘆葉飛一飛', chance: .35, power: .8 }],
  },
  {
    id: 'footchestnut', name: '泡腳栗', sprite: 'footchestnut', mood: 'hungry', weak: '腳底的小白點',
    hp: 100, atk: 19, def: 8, spd: 13, exp: 82, money: 26, talkBase: .32,
    talkLines: ['噗通！坐這裡吧。我替妳留了一塊平平的石頭。', '呀，船要來了！妳先過，我把腳收好。'],
    talkFail: ['咕嚕……剛才是我的肚子在叫。妳說什麼？'],
    likesFood: ['sweet_potato', 'fish_soup'], foodReply: '暖呼呼的！這下連腳趾都暖起來了。',
    foodRefusal: '泡腳栗搖搖頭。「我想吃暖暖的番薯，或喝一口魚湯。」',
    gifts: [{ item: 'sweet_potato', chance: .2 }], info: ['我最愛在石階上泡腳。水花拍不到的那一格，可以坐兩個人。'],
    skills: [{ id: 'chestnut_splash', name: '踢踢水花', chance: .35, power: .85 }],
  },
];
const monsterPage = STICKER_PAGES.find(page => page.id === 'monster')!;
for (const enemy of enemies) {
  ENEMIES[enemy.id] = enemy;
  for (const [suffix, label] of [['talk', '對話'], ['defeat', '打倒']]) {
    const id = `${enemy.id}_${suffix}`;
    STICKERS[id] = `${enemy.name}（${label}）`;
    stickerPictures[id] = enemy.sprite;
    monsterPage.ids.push(id);
    chapter3MonsterStickers.push(id);
  }
}

export const REED_ENCOUNTER = 'c3_reed_grass';
export const BRIDGE_ENCOUNTER = 'c3_bridge_grass';
const riverGroups: EncounterGroup[] = [
  { enemies: ['reedpuff'], weight: 5, when: { maxActive: 2 } },
  { enemies: ['footchestnut'], weight: 5, when: { maxActive: 2 } },
  { enemies: ['reedpuff', 'footchestnut'], weight: 7, when: { minActive: 2 } },
  { enemies: ['reedpuff', 'reedpuff'], weight: 2, when: { minActive: 3 } },
  { enemies: ['footchestnut', 'footchestnut'], weight: 2, when: { minActive: 3 } },
];
ENCOUNTERS[BRIDGE_ENCOUNTER] = { id: BRIDGE_ENCOUNTER, bg: 'reedbg', rate: .13, minSteps: 6, groups: riverGroups };
ENCOUNTERS[REED_ENCOUNTER] = {
  id: REED_ENCOUNTER, bg: 'reedbg', rate: .13, minSteps: 6,
  groups: [...riverGroups,
    { enemies: ['mistpuff'], weight: 1, when: { maxActive: 1 } },
    { enemies: ['reedpuff', 'mistpuff'], weight: 1, when: { minActive: 2 } },
  ],
};
