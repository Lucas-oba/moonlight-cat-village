import { point } from './ch2_maps';
import { DIALOGUES, INN_TALKS } from './dialogues';
import { ITEMS, STICKERS, STICKER_PAGES } from './items';
import { GLINTS, MAPS } from './maps';
import { NPCS } from './npcs';
import { QUESTS, QUEST_ORDER } from './quests';
import type { Action, Cond, Dialogue, Objective, Reward } from './types';

const mist = 'mistpath';
const village = 'rootvillage';
const ready: Cond = { questDone: 'c2m4' };
const active = (id: string): Cond => ({ questActive: id });
const available = (id: string): Cond => ({ questAvailable: id });
const pending = (id: string, obj: string): Cond => ({ all: [active(id), { objNotDone: [id, obj] }] });
const flag = (id: string, value = true): Action => ({ type: 'flag', id, value });
const advance = (quest: string, obj: string): Action => ({ type: 'obj', quest, obj });
const kindness = (n: number): Action => ({ type: 'stat', kindness: n });
const start = (id: string): Action => ({ type: 'startQuest', id });
const sticker = (id: string): Action => ({ type: 'sticker', id });
const goal = (id: string, text: string): Objective => ({ id, text, type: 'event' });
const line = (s: string, t: string, ...act: Action[]): Dialogue => [{ s, t, act }];
const warp = (map: string, col: number, row: number): Action => ({ type: 'warp', map, ...point(col, row) });
const quiz = (by: string, title: string, ...ids: string[]): Extract<Action, { type: 'quiz' }> =>
  ({ type: 'quiz', by, title, ids: ids.map(id => `c2_${id}`) });

function side(no: number, title: string, summary: string, objectives: Objective[], rewards: Reward = {}, giver?: string) {
  const id = `c2s${no}`;
  QUESTS[id] = { id, no, chapter: 2, kind: 'side', title, summary, giver, prereq: ['c2m4'], objectives, rewards };
  QUEST_ORDER.push(id);
  return id;
}

function glint(id: string, map: string, col: number, row: number, when: Cond, sprite?: string) {
  GLINTS.push({ id, map, ...point(col, row), obs: 0, when, d: id, sprite });
}

const recruit = side(1, '網子裡的森林貓', '布丁在照顧一隻受傷的小鳥。', [
  goal('moss', '在林道南邊找軟苔蘚'), goal('dew', '在木頭旁找乾淨的露水'), goal('bird', '回樹洞找布丁，照顧小鳥'),
], { sticker: 'c2_bird' }, 'pudding');
const pudding = NPCS.find(n => n.id === 'pudding')!;
pudding.giverOf = [recruit];
pudding.follow = { inParty: 'pudding' };
pudding.spots.push({ map: mist, ...point(7, 26), when: { all: [ready, { questNotDone: recruit }] } });
pudding.talk.unshift(
  { when: available(recruit), d: 'c2_bird_start' },
  { when: { objCurrent: [recruit, 'bird'] }, d: 'c2_bird_care' },
  { when: active(recruit), d: 'c2_bird_wait' },
  { when: { inParty: 'pudding' }, d: 'c2_pudding_party' },
);
DIALOGUES.c2_bird_start = [
  { s: 'narr', t: '布丁鑽進路邊的樹洞。乾草上躺著一隻受傷的小鳥。' },
  { s: 'pudding', t: '幫我找軟苔蘚和乾淨的露水。小聲點，牠才剛睡著。', act: [start(recruit)] },
];
DIALOGUES.c2_pudding_party = line('pudding', '……慢慢走。累了就跟我說。');
DIALOGUES.c2_bird_wait = line('pudding', '軟苔蘚在林道南邊。再去木頭旁找一點乾淨的露水。');
DIALOGUES.c2_bird_care = [
  { s: 'pudding', t: '把苔蘚鋪好，露水放這裡。陪我想想怎麼照顧牠。', act: [{ ...quiz('pudding', '照顧小鳥', 'bird', 'moss', 'dew'), n: 2 }] },
  { s: 'narr', t: '小鳥休息了一會兒，拍了拍翅膀，飛上樹枝。' },
  { s: 'pudding', t: '……妳還不錯。我跟妳去，免得妳又被網子吊起來。',
    act: [{ type: 'recruit', id: 'pudding' }, kindness(3), advance(recruit, 'bird')] },
];
for (const [id, col, row, message] of [
  ['moss', 12, 30, '樹根下的苔蘚摸起來軟軟的。'],
  ['dew', 5, 23, '葉子上有幾滴露水。小心把它們接起來。'],
] as const) {
  glint(`c2_bird_${id}`, mist, col, row, pending(recruit, id));
  DIALOGUES[`c2_bird_${id}`] = line('narr', message, advance(recruit, id));
}

for (const [partner, dialogue] of [
  ['ali', [
    { s: 'ali', t: '布丁，我的盾牌可以擋風。小鳥怕冷的話，記得找我！' },
    { s: 'pudding', t: '……坐過來一點。這裡剛好有風。' },
  ]],
  ['mint', [
    { s: 'mint', t: '布丁，妳包繃帶的時候，小動物都好安靜。' },
    { s: 'pudding', t: '我會先讓牠聞聞我的手。下次我們一起試。' },
  ]],
  ['yuzu', [
    { s: 'yuzu', t: '我撿了一片軟葉子！可以放在小鳥的窩裡嗎？' },
    { s: 'pudding', t: '可以。先讓我看看葉子上有沒有刺。' },
  ]],
] as const) {
  const id = `it_pudding_${partner}`;
  DIALOGUES[id] = [...dialogue, { s: 'narr', t: '兩隻貓靠著營火，聊了一會兒。',
    act: [{ type: 'bond', id: 'pudding' }, { type: 'bond', id: partner }] }];
  INN_TALKS.push({ d: id, when: { all: [{ inParty: 'pudding' }, { inParty: partner }] } });
}

const houses = [
  { id: 'shop', name: '哥布林雜貨', col: 4, row: 8, material: '屋瓦', source: point(3, 6) },
  { id: 'inn', name: '樹根旅店', col: 16, row: 8, material: '木板', source: point(18, 10), sprite: 'c2_planks' },
  { id: 'sprout', name: '小豆芽家', col: 4, row: 20, material: '木板', source: point(3, 17), sprite: 'c2_planks' },
  { id: 'elder', name: '長老樹屋', col: 16, row: 20 },
];
const repairs = side(6, '修好大樹根村', '和咕咕一起修好四間屋子。',
  houses.map(h => goal(h.id, `修好${h.name}`)), { sticker: 'c2_village' }, 'gugu');
const gugu = NPCS.find(n => n.id === 'gugu')!;
(gugu.giverOf ??= []).push(repairs);
gugu.talk.unshift({ when: { all: [{ map: village }, available(repairs)] }, d: 'c2_repairs_start' });
DIALOGUES.c2_repairs_start = line('gugu', '首領的家修好了！再幫忙修四間屋子吧。咕！', start(repairs));

for (const h of houses) {
  const id = `c2_house_${h.id}`;
  const fixed: Cond = { flag: id };
  const prop = MAPS[village].props.find(p => p.key === 'c2_house_broken' && p.x === point(h.col, h.row).x && p.y === point(h.col, h.row).y)!;
  prop.when = { not: fixed };
  MAPS[village].props.push({ ...prop, key: 'c2_house_fixed', when: fixed });
  if (h.source) {
    const materialId = `${id}_material`;
    GLINTS.push({ id: materialId, map: village, ...h.source, obs: 0, sprite: h.sprite,
      when: { all: [pending(repairs, h.id), { notFlag: materialId }] }, d: materialId });
    DIALOGUES[materialId] = line('narr', `找到${h.material}了！帶去${h.name}。`, flag(materialId));
    DIALOGUES[id] = [
      { s: 'narr', t: `缺了${h.material}。先在附近找找看。`, when: { notFlag: materialId } },
      { s: 'narr', t: `一起把${h.material}放好。`, when: { flag: materialId }, act: [flag(id), kindness(1), advance(repairs, h.id)] },
    ];
  } else {
    DIALOGUES[id] = line('gugu', '幫我念對木牌上的字，我就能找到這間屋子的材料！',
      quiz('gugu', h.name, 'house'), flag(id), kindness(1), advance(repairs, h.id));
  }
  glint(id, village, h.col, h.row + 1, pending(repairs, h.id));
  glint(`${id}_service`, village, h.col, h.row + 1, fixed, h.id === 'inn' ? 'campfire' : undefined);
}
DIALOGUES.c2_house_shop_service = line('gugu', '屋子修好了！來看看今天的食物和藥。', {
  type: 'shop', title: '哥布林雜貨', items: [{ id: 'sweet_potato', price: 12 }, { id: 'cookie', price: 15 }, { id: 'herb_tea', price: 24 }],
});
DIALOGUES.c2_house_inn_service = [{ s: 'narr', t: '樹根旅店的營火好暖。要休息一下嗎？', choices: [
  { label: '休息和存檔', act: [{ type: 'rest' }, { type: 'innTalk' }, { type: 'save' }] }, { label: '下次再來' },
] }];
for (const [id, name, col, row, furniture] of [
  ['sprout', '小豆芽家', 4, 20, 'f_bed'], ['elder', '長老樹屋', 16, 20, 'f_shelf'],
] as const) {
  const map = `c2_room_${id}`;
  MAPS[map] = {
    id: map, name, indoor: true, music: 'roots', zones: [],
    tiles: ['WWWWWWWW', 'WooooooW', 'WoorrooW', 'WoorrooW', 'WooooooW', 'WWWmWWWW'],
    props: [{ key: furniture, ...point(2, 2), block: [44, 20] }, { key: 'f_plant', ...point(5, 2), block: [20, 12] }],
    exits: [{ tx: 3, ty: 5, to: village, ...point(col, row + 2), dir: 0 }],
  };
  DIALOGUES[`c2_house_${id}_service`] = line('narr', `推開${name}的門。`, warp(map, 3, 4));
}

const escort = side(9, '霧團子回家', '一次帶一隻霧團子回霧的深處。', [
  ...[1, 2, 3].map(n => goal(`puff${n}`, `帶第 ${n} 隻霧團子到林道北邊的小空地`)),
], { sticker: 'c2_puff_home' }, 'c2_lost_puff1');
for (const [n, col, row] of [[1, 13, 24], [2, 6, 17], [3, 15, 13]]) {
  const npc = `c2_lost_puff${n}`;
  const obj = `puff${n}`;
  const following = `${npc}_follow`;
  const turn: Cond = { objCurrent: [escort, obj] };
  NPCS.push({
    id: npc, name: '迷路的霧團子', sprite: 'mistpuff', scale: .46, bob: true, followGap: 46, giverOf: n === 1 ? [escort] : undefined,
    spots: [{ map: mist, ...point(col, row), when: { any: [
      ...(n === 1 ? [available(escort)] : []), turn,
    ] } }],
    follow: { all: [{ map: mist }, turn, { flag: following }] },
    talk: [{ d: npc }],
  });
  DIALOGUES[npc] = line(npc, '我找不到回家的路了……可以帶我去北邊的小空地嗎？',
    ...(n === 1 ? [start(escort)] : []), flag(following));
  const home = `c2_puff_home${n}`;
  glint(home, mist, 5, 12, { all: [turn, { flag: following }] });
  DIALOGUES[home] = line(npc, n === 3 ? '到家了！大家都回來啦。謝謝妳！' : '就是這裡！我在這裡等另一隻霧團子。',
    flag(following, false), ...(n === 3 ? [kindness(2)] : []), advance(escort, obj));
}

const doors = side(13, '有禮貌的門', '和圓圓一起跟三扇門打招呼。', [
  goal('polite', '回答左邊的門'), goal('measure', '回答中間的門'), goal('opposite', '回答右邊的門'),
], { sticker: 'c2_doors', observation: 1 }, 'yuanyuan');
const yuan = NPCS.find(n => n.id === 'yuanyuan')!;
(yuan.giverOf ??= []).push(doors);
yuan.spots.unshift({ map: mist, ...point(3, 22), when: { all: [{ map: mist }, ready] } });
yuan.talk.unshift(
  { when: { all: [{ map: mist }, available(doors)] }, d: 'c2_doors_start' },
  { when: { map: mist }, d: 'c2_doors_hint' },
);
DIALOGUES.c2_doors_start = line('yuanyuan', '這三扇門愛玩國語題。答錯時牠們會嘟嘴，再試一次就好！', start(doors));
DIALOGUES.c2_doors_hint = line('yuanyuan', '從門前的亮光跟牠們打招呼吧！');
NPCS.push({ id: 'c2_door_voice', name: '有禮貌的門', sprite: 'c2_door', spots: [], talk: [] });
for (const [col, obj] of [[4, 'polite'], [6, 'measure'], [8, 'opposite']] as const) {
  const id = `c2_door_${obj}`;
  glint(id, mist, col, 21, { objCurrent: [doors, obj] });
  DIALOGUES[id] = [
    { s: 'c2_door_voice', t: '敲敲門，聽聽我的問題！', act: [quiz('c2_door_voice', '有禮貌的門', obj)] },
    { s: 'c2_door_voice', t: obj === 'opposite' ? '三扇門都笑了。謝謝妳陪我們玩！' : '答對了！再去跟下一扇門打招呼吧。',
      act: [...(obj === 'opposite' ? [kindness(1)] : []), advance(doors, obj)] },
  ];
}

const canopy = 'c2_canopy';
const laundry = side(14, '雲朵洗衣場', '在村子北邊的圈圈變大，爬上樹頂幫露露和蓬蓬。', [
  goal('clouds', '和露露、蓬蓬一起回答三題自然題'),
], { sticker: 'c2_laundry', items: [{ id: 'moon_dew', n: 1 }] }, 'pengpeng');
ITEMS.moon_dew = { id: 'moon_dew', name: '月光露水', kind: 'key', desc: '蓬蓬收在小瓶子裡的一滴亮亮露水。' };
const cloudline = MAPS[village].props.find(p => p.key === 'c2_cloudline')!;
MAPS[village].props = MAPS[village].props.filter(p => p !== cloudline);
MAPS[canopy] = {
  id: canopy, name: '大樹頂・雲朵洗衣場', music: 'roots', zones: [],
  tiles: ['TTTTTTTTTTT', 'TTkkkkkkkTT', 'TkkkkkkkkkT', 'TkkkkkkkkkT', 'TkkkkkkkkkT', 'TTkkkkkkkTT', 'TTTTTxTTTTT'],
  props: [{ ...cloudline, ...point(5, 2) }],
  exits: [{ tx: 5, ty: 6, to: village, ...point(10, 3), dir: 0 }],
};
GLINTS.push({ id: 'c2_climb', map: village, ...point(11, 2), obs: 0, when: ready, needSize: 'big', d: 'c2_climb' });
DIALOGUES.c2_climb = line('narr', '變大後，搆得到大樹的枝條了。爬上去看看吧！', warp(canopy, 5, 5), sticker('c2_canopy'));
NPCS.push({
  id: 'pengpeng', name: '蓬蓬', sprite: 'pengpeng', portrait: 'pengpeng_big', giverOf: [laundry],
  spots: [{ map: canopy, ...point(6, 3) }],
  talk: [{ when: available(laundry), d: 'c2_clouds' }, { when: active(laundry), d: 'c2_clouds' }, { d: 'c2_clouds_done' }],
});
const lulu = NPCS.find(n => n.id === 'lulu')!;
lulu.spots.unshift({ map: canopy, ...point(4, 3), when: { map: canopy } });
lulu.talk.unshift({ when: { map: canopy }, d: 'c2_clouds_hint' });
DIALOGUES.c2_clouds_hint = line('lulu', '蓬蓬在幫小雲朵洗澡。去看看牠需要什麼吧！');
DIALOGUES.c2_clouds = [
  { s: 'pengpeng', t: '紫霧把小雲朵弄髒了。我正在洗牠們。', act: [start(laundry)] },
  { s: 'lulu', t: '我們一邊晾小雲朵，一邊想想水會去哪些地方。', act: [quiz('lulu', '雲朵洗衣場', 'evaporation', 'cloud', 'cycle')] },
  { s: 'pengpeng', t: '小雲朵又白白的了！這滴月光露水送給妳。', act: [kindness(1), advance(laundry, 'clouds')] },
];
DIALOGUES.c2_clouds_done = line('pengpeng', '今天的雲朵洗好了！風會幫忙把牠們吹乾。');

const school = side(17, '小學堂⑥ 哥布林的字卡', '陪哥布林小孩練習五張國語字卡。', [
  goal('cards', '在大樹根村和哥布林小孩練習字卡'),
], { sticker: 'c2_word_cards' }, 'gob1');
const student = NPCS.find(n => n.id === 'gob1')!;
(student.giverOf ??= []).push(school);
student.talk.unshift({ when: { all: [{ map: village }, { any: [available(school), active(school)] }] }, d: 'c2_school' });
const schoolQuestions = [
  ['kind_measure', 'soft_opposite', 'rain', 'first', 'although'],
  ['letter', 'invite', 'warm_words', 'quiet', 'metaphor'],
  ['shadow', 'because', 'share_phrase', 'translate_words', 'patient'],
];
DIALOGUES.c2_school = [
  { s: 'gob1', t: '我做了好多字卡。妳想從哪一疊開始？', act: [start(school)], choices: [
    { label: '先練簡單的', next: 'c2_school_1' }, { label: '試試普通的', next: 'c2_school_2' }, { label: '多練難一點的', next: 'c2_school_3' },
  ] },
];
for (const tier of [1, 2, 3]) {
  DIALOGUES[`c2_school_${tier}`] = [
    { s: 'gob1', t: '我們一起念五張！', act: [quiz('gob1', '哥布林的字卡', ...schoolQuestions[tier - 1])] },
    { s: 'gob1', t: '我會念啦！明天換我教朋友。', act: [kindness(1), advance(school, 'cards')] },
  ];
}

const stickers = {
  c2_mist_entry: '紫霧林道', c2_net_rescue: '小松鼠得救了', c2_reunion: '小豆芽回家',
  c2_bird: '小鳥飛起來了', c2_village: '修好的大樹根村', c2_puff_home: '霧團子的家',
  c2_doors: '有禮貌的門', c2_canopy: '大樹頂', c2_laundry: '洗乾淨的小雲朵', c2_word_cards: '哥布林的字卡',
};
Object.assign(STICKERS, stickers);
STICKER_PAGES.push({ id: 'forest_depths', name: '森林深處', ids: Object.keys(stickers) });
// 已完成主線的舊存檔，也能補領這三張紀念貼紙。
for (const [n, id, map, col, row] of [
  [1, 'c2_mist_entry', mist, 8, 33], [3, 'c2_net_rescue', mist, 10, 22], [6, 'c2_reunion', village, 11, 18],
] as const) {
  glint(id, map, col, row, { all: [{ questDone: `c2m${n}` }, { not: { hasSticker: id } }] });
  DIALOGUES[id] = line('narr', `把「${stickers[id]}」的回憶放進貼紙簿。`, sticker(id));
}
