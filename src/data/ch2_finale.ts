import './ch2_boss';
import { ECHO } from './ch2_echo_map';
import { point } from './ch2_maps';
import { DIALOGUES } from './dialogues';
import { ITEMS, STICKERS, STICKER_PAGES } from './items';
import { GLINTS, MAPS } from './maps';
import { NPCS } from './npcs';
import { QUESTS, QUEST_ORDER } from './quests';
import type { Line } from './types';

const roots = 'rootvillage';

ITEMS.c2_flower_crown = { id: 'c2_flower_crown', name: '苔角的小花冠', kind: 'accessory', desc: '用森林裡的小花編成的花冠。' };
ITEMS.c2_treasure_stone = { id: 'c2_treasure_stone', name: '小豆芽的寶貝石頭', kind: 'accessory', desc: '圓圓的石頭，握在手裡暖暖的。' };
STICKERS.c2_forest_friend = '森林的好朋友';
STICKER_PAGES.find(p => p.id === 'forest_depths')!.ids.push('c2_forest_friend');

QUESTS.c2m11 = {
  id: 'c2m11', chapter: 2, kind: 'main', no: 11, title: '苔角',
  summary: '到苔角的窩，幫牠解開嘆氣藤。',
  prereq: ['c2m10'], autoStart: true,
  objectives: [{ id: 'care', type: 'event', text: '打斷嘆氣藤，安撫苔角，再幫牠拔刺', marker: ['c2_den_notice'] }],
  rewards: { money: 200, items: [{ id: 'c2_flower_crown', n: 1 }], sticker: 'c2_forest_friend' },
  rewardText: ['善良值 +5'], onComplete: 'c2_antler_after',
};
QUESTS.c2m12 = {
  id: 'c2m12', chapter: 2, kind: 'main', no: 12, title: '大樹下的星星',
  summary: '回大樹根村，去大樹下參加宴會。',
  prereq: ['c2m11'], autoStart: true,
  objectives: [{ id: 'feast', type: 'event', text: '回大樹根村，到大樹下參加宴會', marker: ['c2_feast'] }],
  rewards: { items: [{ id: 'c2_treasure_stone', n: 1 }] }, onComplete: 'c2_finale_end',
};
QUEST_ORDER.push('c2m11', 'c2m12');

GLINTS.push(
  { id: 'c2_den_notice', d: 'c2_den_notice', map: ECHO, ...point(9, 2), obs: 0, when: { questActive: 'c2m11' } },
  { id: 'c2_feast', d: 'c2_feast', map: roots, ...point(10, 13), obs: 0, when: { objCurrent: ['c2m12', 'feast'] } },
);
DIALOGUES.c2_den_notice = [
  { s: 'narr', t: '苔角在裡面。要進去幫牠嗎？', choices: [
    { label: '進去幫苔角', act: [
      { type: 'battle', encounter: 'c2_mossantler' },
      { type: 'stat', kindness: 5 },
      { type: 'obj', quest: 'c2m11', obj: 'care' },
      { type: 'save' },
    ] },
    { label: '等一下再來' },
  ] },
];
DIALOGUES.c2_antler_after = [
  { s: 'narr', t: '苔角不再發抖了。牠低下頭，讓大家摸摸牠的鼻子。' },
  { s: 'sprout', t: '森林不搖了！走吧，大家在大樹下等妳。' },
];

NPCS.push({
  id: 'c2_calm_antler', name: '苔角', sprite: 'mossantler_calm', portrait: 'mossantler_calm', scale: .7,
  spots: [{ map: roots, ...point(13, 23), when: { questDone: 'c2m11' } }],
  talk: [{ d: 'c2_calm_antler' }],
});
DIALOGUES.c2_calm_antler = [{ s: 'narr', t: '苔角戴著小花冠，在村子外面吹風。牠舒服地呼了一口氣。' }];

const feastGuests = [
  ['c2s1', 'pudding', '小鳥的翅膀好了。牠今天飛得好高。'],
  ['c2s6', 'gugu', '謝謝妳幫忙修屋子。今晚大家都能回家睡覺了！'],
  ['c2s8', 'sprout', '我把石頭放在口袋裡。這次一定不會弄丟了！'],
  ['c2s9', 'c2_lost_puff1', '謝謝妳帶我們回家！今天我們一起來了。'],
  ['c2s13', 'yuanyuan', '我一說請，門就打開了。今天的門也好有禮貌！'],
  ['c2s14', 'pengpeng', '洗好的床單好香。小娃娃今天一定睡得很甜。'],
  ['c2s16', 'manman', '謝謝妳……陪我唱歌。小河也在聽呢。'],
  ['c2s17', 'gob1', '我寫了一張字卡，上面寫著「謝謝」。送給妳！'],
] as const;
const guestLines: Line[] = feastGuests.map(([quest, who, t]) =>
  ({ s: who, t, when: { questDone: quest } }));

const party = { flag: 'c2_feast_started', questActive: 'c2m12', map: roots };
MAPS[roots].props.push({ key: 'c2_cake', ...point(10, 12), when: party });
for (const [who, col, row] of [['farmer', 12, 14], ['douhua', 6, 13]] as const) {
  NPCS.find(n => n.id === who)?.spots.unshift({ map: roots, ...point(col, row), when: party });
}
for (const [i, [quest, who]] of feastGuests.entries()) {
  const guest = NPCS.find(n => n.id === who);
  if (guest) guest.spots.unshift({ map: roots, ...point(7 + i % 4 * 2, 12 + Math.floor(i / 4) * 2),
    when: { all: [party, { questDone: quest }] } });
}

DIALOGUES.c2_feast = [
  { s: 'narr', t: '大樹下的宴會要開始了。要留下來嗎？', choices: [
    { label: '一起看星星', next: 'c2_feast_party' }, { label: '等一下再來' },
  ] },
];
DIALOGUES.c2_feast_party = [
  { s: 'narr', t: '天慢慢黑了。大家把燈籠掛上樹。', act: [
    { type: 'flag', id: 'c2_feast_started' }, { type: 'time', v: 'night' }, { type: 'music', id: 'feast' },
  ] },
  { s: 'gugu', t: '來分蛋糕吧！今天兩個村子的人都來了。' },
  ...guestLines,
  { s: 'sprout', t: '妳幫我找回這顆石頭。現在，我想把它送給妳。', when: { questDone: 'c2s8' } },
  { s: 'sprout', t: '這是我的寶貝石頭。妳陪苔角好久，我想把它送給妳。', when: { questNotDone: 'c2s8' } },
  { s: 'narr', t: '枯掉的嘆氣藤縮成一顆紫色種子。一陣風吹了過來……', act: [{ type: 'c2Breeze' }] },
  { s: 'whitecat', t: '……', flashBow: true },
  { s: 'system', t: '滋……喵……', glitch: true, act: [{ type: 'obj', quest: 'c2m12', obj: 'feast' }] },
];
DIALOGUES.c2_finale_end = [
  { s: 'narr', t: '大樹上亮著燈。抬頭一看，天上也亮著好多星星。', act: [
    { type: 'chapterEnd', chapter: 2 }, { type: 'music', id: 'roots' },
  ] },
];
