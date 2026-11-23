import { point } from './ch2_maps';
import { DIALOGUES } from './dialogues';
import { STICKERS, STICKER_PAGES } from './items';
import { GLINTS, MAPS } from './maps';
import { NPCS } from './npcs';
import { QUESTS, QUEST_ORDER } from './quests';
import type { Action, Cond, Dialogue, Objective } from './types';

const valley = 'echovalley';
const mist = 'mistpath';
const roots = 'rootvillage';
const hollow = 'c2_pudding_hollow';
const camp = 'c2_bond_camp';
const current = (id: string, obj: string): Cond => ({ objCurrent: [id, obj] });
const step = (quest: string, obj: string): Action => ({ type: 'obj', quest, obj });
const goal = (id: string, text: string, marker: string): Objective => ({ id, text, type: 'event', marker: [marker] });
const glint = (id: string, map: string, col: number, row: number, when: Cond, sprite?: string) =>
  GLINTS.push({ id, map, ...point(col, row), when, sprite, obs: 0, d: id });

function bondQuest(
  no: number, who: string, title: string, summary: string, prereq: string, map: string,
  objectives: Objective[], intro: string, skill: string, memory: string, campTalk: string,
) {
  const id = `c2s${no}`;
  const giver = NPCS.find(n => n.id === who)!;
  const sticker = `${id}_bond`;
  QUESTS[id] = {
    id, no, chapter: 2, kind: 'side', bond: [who, 1], giver: who, title, summary,
    prereq: [prereq], ordered: true, rewards: { sticker },
    objectives: [...objectives, goal('camp', `到大樹根村的營火旁找${giver.name}`, camp)],
  };
  QUEST_ORDER.push(id);
  (giver.giverOf ??= []).push(id);
  STICKERS[sticker] = memory;
  STICKER_PAGES.find(p => p.id === 'forest_depths')!.ids.push(sticker);

  const startHere: Cond = { all: [{ map }, { questAvailable: id }] };
  if (giver.follow) giver.follow = { all: [giver.follow, { not: startHere }] };
  giver.talk.unshift({ when: startHere, d: `${id}_start` });
  DIALOGUES[`${id}_start`] = [{ s: who, t: intro, act: [{ type: 'startQuest', id }] }];
  DIALOGUES[`${id}_camp`] = [
    { s: 'narr', t: `營火暖暖的。${giver.name}在妳身邊坐下。` },
    { s: who, t: campTalk, act: [{ type: 'bond', id: who, level: 4 }, { type: 'learn', id: who, skill }, step(id, 'camp')] },
  ];
  return { id, startHere, giver };
}

const ali = bondQuest(2, 'ali', '一起擋！', '和阿栗一起幫迴聲谷的哥布林小孩。', 'c2m6', valley, [
  goal('rock', '在迴聲谷入口附近幫忙擋落石', 'c2_bond_rock'),
  goal('talk', '陪哥布林小孩說話', 'c2_bond_child'),
], '那邊有個哥布林小孩！上面的石頭在晃。我們去幫牠！',
'split_guard', '一起撐住的盾牌', '今天我們一起撐住了盾牌。妳還坐下來聽牠說話。下次有人害怕，我也會留下來陪牠。');
ali.giver.spots.unshift({ map: valley, ...point(10, 28), when: ali.startHere });
glint('c2_bond_rock', valley, 11, 27, current(ali.id, 'rock'));
DIALOGUES.c2_bond_rock = [{
  s: 'ali', t: '石頭滾下來了！快和我一起撐住盾牌！',
  choices: [{ label: '一起擋！', next: 'c2_bond_rock_clear' }],
}];
DIALOGUES.c2_bond_rock_clear = [
  { s: 'narr', t: '咚！石頭撞上盾牌，滾到一旁。大家都安全了。', act: [step(ali.id, 'rock')] },
];
NPCS.push({
  id: 'c2_bond_child', name: '哥布林小孩', sprite: 'fgoblin', goblin: true, scale: .8,
  spots: [{ map: valley, ...point(12, 27), when: current(ali.id, 'talk') }],
  talk: [{ d: 'c2_bond_child' }],
});
DIALOGUES.c2_bond_child = [
  { s: 'c2_bond_child', t: '我的腳還在抖。妳可以陪我一下嗎？' },
  { s: 'hero', t: '可以呀。我們坐一下。妳想說話的時候，我會聽。' },
  { s: 'c2_bond_child', t: '謝謝妳。我現在敢站起來了！', act: [step(ali.id, 'talk')] },
];

const mint = bondQuest(3, 'mint', '給大傢伙的藥', '採一點苔蘚，和薄荷一起做藥。', 'c2m7', roots, [
  goal('herb', '到紫霧林道找陰涼石頭上的苔蘚', 'c2_bond_herb'),
  goal('quiz', '回大樹根村找薄荷，回答自然題', 'mint'),
], '我第一次幫這麼大的病人做藥。有點緊張……妳能陪我採苔蘚嗎？',
'forest_blessing', '薄荷的苔蘚藥', '苔角那麼大，我還是會緊張。可是今天妳陪著我，我就敢試試看了。');
const medicine: Cond = { all: [{ map: roots }, current(mint.id, 'quiz')] };
mint.giver.follow = { all: [mint.giver.follow!, { not: medicine }] };
mint.giver.spots.unshift({ map: roots, ...point(8, 18), when: { any: [mint.startHere, medicine] } });
mint.giver.talk.unshift({ when: medicine, d: 'c2_bond_medicine' });
glint('c2_bond_herb', mist, 6, 24, current(mint.id, 'herb'), 'c2_softmoss');
DIALOGUES.c2_bond_herb = [
  { s: 'narr', t: '陰涼的石頭上長著苔蘚。妳採了一小片，留下一些讓它繼續長。', act: [step(mint.id, 'herb')] },
];
DIALOGUES.c2_bond_medicine = [
  { s: 'mint', t: '採到了！一起想想，苔蘚喜歡長在哪裡？',
    act: [{ type: 'quiz', subject: 'science', ids: ['c2_moss'], by: 'mint', title: '給大傢伙的藥' }] },
  { s: 'mint', t: '答對了。我把藥裝好了，先收在這裡。謝謝妳陪我。', act: [step(mint.id, 'quiz')] },
];

const neighbors = [
  { id: 'c2_letter_village', map: 'village', col: 18, row: 9, name: '栗果爺爺', place: '月光貓村', reply: '是老鄰居的字！我還記得牠家門口的花。' },
  { id: 'c2_letter_mist', map: mist, col: 9, row: 23, name: '葉葉奶奶', place: '紫霧林道', reply: '原來大家都平安。我也想寫一張回信！' },
  { id: 'c2_letter_echo', map: valley, col: 10, row: 25, name: '石頭伯伯', place: '迴聲谷', reply: '這封信跑了好遠呀。謝謝妳送到我手上！' },
];
const yuzu = bondQuest(4, 'yuzu', '沒有地址的信', '和柚子一起給三位哥布林老鄰居送信。', 'c2m6', 'village',
  neighbors.map(n => goal(n.id, `把信送給${n.place}的${n.name}`, n.id)),
  '哥布林們寫了信，卻不知道老鄰居住哪。先在村子找找，再去紫霧林道和迴聲谷吧！',
  'quick_delivery', '沒有地址也送到的信', '我以前只想跑快一點。今天慢下來問路，三封信才都到了。下次也讓我幫妳送東西吧！');
for (const n of neighbors) {
  NPCS.push({
    id: n.id, name: n.name, sprite: 'fgoblin', goblin: true,
    spots: [{ map: n.map, ...point(n.col, n.row), when: current(yuzu.id, n.id) }],
    talk: [{ d: n.id }],
  });
  DIALOGUES[n.id] = [
    { s: 'hero', t: `${n.name}，這封信是給您的！` },
    { s: n.id, t: n.reply, act: [step(yuzu.id, n.id)] },
  ];
}

const pudding = bondQuest(5, 'pudding', '布丁的小病人', '到布丁的樹洞，幫小兔子蓋毯子。', 'c2m9', hollow, [
  goal('blanket', '在樹洞幫小兔子蓋毯子', 'c2_bond_blanket'),
], '小兔子還在發抖。可以幫牠蓋上毯子嗎？慢慢來，別嚇到牠。',
'warm_blanket', '小兔子的暖暖毛毯', '小兔子今天睡得好安心。以後樹洞就當診療所吧。誰累了，都可以來休息。');
glint('c2_bond_blanket', hollow, 6, 3, current(pudding.id, 'blanket'));
DIALOGUES.c2_bond_blanket = [
  { s: 'narr', t: '妳把毯子輕輕蓋在小兔子身上。牠暖和了，耳朵也放鬆了。', act: [step(pudding.id, 'blanket')] },
];
const clinic: Cond = { questDone: pudding.id };
pudding.giver.talk.unshift({ when: { all: [{ map: hollow }, clinic] }, d: 'c2_pudding_clinic' });
for (const [map, col, row] of [[mist, 7, 26], [hollow, 4, 1]] as const) {
  (MAPS[map].labels ??= []).push({ ...point(col, row), text: '布丁的診療所', when: clinic });
}
DIALOGUES.c2_pudding_clinic = [{
  s: 'pudding', t: '累了嗎？在這裡休息一下吧，不用付魚乾幣。',
  choices: [{ label: '休息一下', act: [{ type: 'rest' }] }, { label: '下次再來' }],
}];

const campGuests = [ali, mint, yuzu, pudding];
glint(camp, roots, 7, 17, { any: campGuests.map(q => current(q.id, 'camp')) }, 'campfire');
DIALOGUES[camp] = [{
  s: 'narr', t: '營火旁有空位。要和誰一起坐呢？',
  choices: campGuests.map(q => ({ label: q.giver.name, when: current(q.id, 'camp'), next: `${q.id}_camp` })),
}] satisfies Dialogue;
