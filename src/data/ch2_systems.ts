import { MEMBERS } from './characters';
import { ENEMIES } from './enemies';
import { STICKERS, STICKER_PAGES, bookIds, chapter1Collection, chapter2MonsterStickers } from './items';
import type { EnemyDef } from './types';

MEMBERS.pudding = {
  id: 'pudding', name: '布丁', role: '森林貓（安撫魔物、照顧隊友）',
  icon: 'pudding', verb: '用小包包輕輕敲',
  base: { hp: 30, mp: 12, atk: 5, def: 4, spd: 7 },
  grow: { hp: 5, mp: 2, atk: 1, def: 1, spd: 1 },
  skills: [
    { id: 'small_bandage', name: '小繃帶', mp: 3, power: 16, desc: '幫一位隊友回復 HP。', learnLv: 1, kind: 'heal' },
    { id: 'soothing_purr', name: '呼嚕呼嚕', mp: 3, power: 0.20, desc: '讓下一次對話更容易成功。', learnLv: 1, kind: 'purr' },
    { id: 'lullaby', name: '搖籃曲', mp: 5, power: 0.60, desc: '有機會讓一隻魔物睡著，少動一次。', learnLv: 12, kind: 'sleepFoe' },
    { id: 'warm_blanket', name: '暖暖毛毯', mp: 6, power: 14, desc: '幫全隊回復 14 HP，也會解除不舒服的狀態。', learnLv: 1, kind: 'healCleanse', quest: true },
  ],
};

const enemies: EnemyDef[] = [
  {
    id: 'mistpuff', mood: 'hungry', weak: '頭頂的小霧團', name: '霧團子', sprite: 'mistpuff', hp: 48, atk: 13, def: 3, spd: 12, exp: 40, money: 15,
    likesFood: true, talkBase: 0.65,
    talkLines: ['呼……妳的聲音好溫柔。我敢自己走了。'],
    talkFail: ['嗚……我還是有點怕。'],
    gifts: [{ item: 'moon_berry', chance: 0.25 }],
    info: ['霧太濃的時候，我會沿著樹根慢慢走。'],
    skills: [{ id: 'mistpuff_flee', name: '鑽進霧裡', chance: 0.12, power: 0, flee: true }],
  },
  {
    id: 'thornling', mood: 'hurt', weak: '捲起來的藤尖', name: '刺刺藤寶寶', sprite: 'thornling', hp: 47, atk: 15, def: 5, spd: 11, exp: 46, money: 18,
    likesFood: false, talkBase: 0.33,
    talkLines: ['妳沒有踩我的葉子。那我也把藤收起來。'],
    talkFail: ['別靠過來！我的小葉子會被踩到！'],
    gifts: [{ item: 'herb_candy', chance: 0.25 }],
    info: ['發光的苔蘚摸起來軟軟的，我喜歡躲在旁邊。'],
    skills: [{ id: 'vine_bind', name: '藤蔓綁腳', chance: 0.25, power: 0.8, status: 'bind' }],
  },
  {
    id: 'cryshroom', mood: 'lonely', weak: '眼淚下的小斑點', name: '哭哭菇', sprite: 'cryshroom', hp: 46, atk: 14, def: 4, spd: 10, exp: 44, money: 17,
    likesFood: false, talkBase: 0.4,
    talkLines: ['謝謝妳聽我哭。我想去擦擦眼淚。'],
    talkFail: ['嗚嗚……我現在聽不進去。'],
    gifts: [{ item: 'forest_mushroom', chance: 0.4 }],
    info: ['往北走，聲音會從山谷那邊傳回來。'],
    skills: [{ id: 'tear_splash', name: '眼淚噗噗', chance: 0.3, power: 0.85, status: 'cry' }],
  },
  {
    id: 'mistwolf', mood: 'scared', weak: '霧裡的前腳', name: '迷霧野狼', sprite: 'mistwolf', hp: 50, atk: 18, def: 5, spd: 16, exp: 52, money: 21,
    likesFood: true, talkBase: 0.37,
    talkLines: ['我們……之前見過？'],
    talkFail: ['嗚……霧太濃了，我看不清楚妳。'],
    gifts: [{ item: 'wolf_fur', chance: 0.5 }],
    info: ['北邊的霧最濃。走慢一點，才聽得到腳步聲。'],
    skills: [{ id: 'mist_pounce', name: '霧中一撲', chance: 0.25, power: 1.2 }],
  },
  {
    id: 'yarnweasel', mood: 'scared', weak: '抱著毛線的爪子', name: '松鼠鼬', sprite: 'yarnweasel', hp: 55, atk: 15, def: 4, spd: 16, exp: 45, money: 18,
    likesFood: true, talkBase: 0.45,
    talkLines: ['妳肯聽我說話呀？那我回樹根那邊去了。'],
    talkFail: ['我才沒有盯著妳的包包！'],
    gifts: [{ item: 'cookie', chance: 0.3 }],
    info: ['大樹的根又粗又長，躲在下面就淋不到雨。'],
    skills: [{ id: 'steal', name: '偷偷拿', chance: 0.12, power: 0, steal: true }],
  },
];

const monsterPage = STICKER_PAGES.find(page => page.id === 'monster')!;
// 保留第一章的收藏獎勵與圖鑑解鎖門檻。
chapter1Collection.all = bookIds();
chapter1Collection.monsters = [...monsterPage.ids];
for (const enemy of enemies) {
  ENEMIES[enemy.id] = enemy;
  const talk = `${enemy.id}_talk`;
  const defeat = `${enemy.id}_defeat`;
  STICKERS[talk] = `${enemy.name}（對話）`;
  STICKERS[defeat] = `${enemy.name}（打倒）`;
  monsterPage.ids.push(talk, defeat);
  chapter2MonsterStickers.push(talk, defeat);
}
