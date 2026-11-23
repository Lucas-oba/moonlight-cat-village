import { point } from './ch2_maps';
import { DIALOGUES } from './dialogues';
import { ITEMS, STICKERS, STICKER_PAGES } from './items';
import { GLINTS, MAPS, TILE, WONDERS } from './maps';
import { NPCS } from './npcs';
import { QUESTS, QUEST_ORDER } from './quests';
import { CH2_SIDE_QUIZ } from './quiz_ch2';
import type { Action, Cond, Dialogue, Objective } from './types';

const village = 'village';
const roots = 'rootvillage';
const npc = (id: string) => NPCS.find(n => n.id === id)!;
const available = (id: string): Cond => ({ questAvailable: id });
const done = (id: string): Cond => ({ questDone: id });
const current = (id: string, obj: string): Cond => ({ objCurrent: [id, obj] });
const onMap = (map: string, when: Cond): Cond => ({ all: [{ map }, when] });
const goal = (id: string, text: string, marker: string): Objective => ({ id, text, marker: [marker], type: 'event' });
const step = (quest: string, obj: string): Action => ({ type: 'obj', quest, obj });
const finish = (id: string, obj: string, kindness: 1 | 2): Action[] => [
  { type: 'stat', kindness }, step(id, obj), { type: 'save' },
];
const glint = (id: string, map: string, col: number, row: number, when: Cond, sprite?: string) => {
  GLINTS.push({ id, d: id, map, ...point(col, row), obs: 0, when, sprite });
};
const say = (s: string, t: string, ...act: Action[]): Dialogue => [{ s, t, act }];
const talk = (who: string, when: Cond, d: string, dialogue: Dialogue) => {
  npc(who).talk.unshift({ when, d });
  DIALOGUES[d] = dialogue;
};

function side(no: number, giver: string, map: string, title: string, summary: string, intro: string,
  objectives: Objective[], stickerName: string, prereq = ['c2m6'], page = 'forest_depths') {
  const id = `c2s${no}`;
  const sticker = `${id}_sticker`;
  QUESTS[id] = { id, no, chapter: 2, kind: 'side', title, summary, giver, prereq, ordered: true, objectives, rewards: { sticker } };
  QUEST_ORDER.push(id);
  STICKERS[sticker] = stickerName;
  STICKER_PAGES.find(p => p.id === page)!.ids.push(sticker);
  (npc(giver).giverOf ??= []).push(id);
  talk(giver, onMap(map, available(id)), `${id}_start`, say(giver, intro, { type: 'startQuest', id }));
  return id;
}

const nest = 'c2_nest';
const rock = side(7, 'rock', 'forest', '巨岩學溫柔', '用變大圈圈，幫巨岩把鳥巢放回樹上。',
  '我想把鳥巢放回去，手一使勁，樹枝就彎了！妳能用旁邊的圈圈變大，示範給我看嗎？',
  [goal('nest', '用圈圈變大，把鳥巢輕輕放回樹上', nest)], '巨岩和小鳥的家');
DIALOGUES.c2s7_start.push({
  s: 'rock', t: '這塊長高高餅乾給妳。在圈圈裡吃就能變大。',
  when: { not: { hasItem: ['grow_cookie', 1] } }, act: [{ type: 'item', id: 'grow_cookie' }],
});
WONDERS.push({
  id: 'c2_nest_circle', map: 'forest', ...point(10, 39), mode: 'big', when: current(rock, 'nest'),
  area: { x: 9 * TILE, y: 37 * TILE, w: 5 * TILE, h: 5 * TILE },
});
GLINTS.push({
  id: nest, d: nest, map: 'forest', ...point(12, 38), obs: 0,
  when: current(rock, 'nest'), needSize: 'big', sizeHint: 'c2_nest_hint',
});
DIALOGUES.c2_nest_hint = say('rock', '樹枝太高啦。先去旁邊的圈圈吃長高高餅乾。');
DIALOGUES[nest] = [{
  s: 'rock', t: '搆到了！要怎麼放才不會嚇到小鳥？',
  choices: [{ label: '輕輕地', next: 'c2_nest_gentle' }, { label: '用力地', next: 'c2_nest_hard' }],
}];
DIALOGUES.c2_nest_hard = say('narr', '樹枝晃了一下！妳趕快接住鳥巢。小鳥平安，再試一次吧。');
DIALOGUES.c2_nest_gentle = say('rock', '原來手放慢一點，樹枝就不晃了！小鳥回家啦。', ...finish(rock, 'nest', 1));

const share = side(10, 'farmer', village, '番薯伯的分享籃', '幫兩個村子互相送菜。',
  '咕咕上次幫了我。我挑了一籃好菜，能幫我帶去大樹根村嗎？',
  [goal('deliver', '把菜送到大樹根村的分享籃', 'c2_share_basket'),
    goal('return', '把回禮帶給月光貓村的番薯伯', 'farmer')],
  '兩村的分享籃', ['c2m8']);
glint('c2_share_basket', roots, 5, 10, current(share, 'deliver'), 'veggies');
DIALOGUES.c2_share_basket = say('gugu', '好香的菜！也請妳幫我帶一籃野菜和莓果回去。咕！', step(share, 'deliver'));
talk('farmer', onMap(village, current(share, 'return')), 'c2_share_return',
  say('farmer', '謝謝大樹根村的野菜和莓果！以後讓招財賣莓果，我也帶薄荷糖去大樹根村。', ...finish(share, 'return', 2)));

const moonBerry = { id: 'moon_berry', price: 32, when: done(share) };
for (const [d, item] of [['merchant_shop2', moonBerry], ['merchant_sale', moonBerry],
  ['c2_house_shop_service', { id: 'herb_candy', price: 7, when: done(share) }]] as const) {
  const shop = DIALOGUES[d].flatMap(line => line.act ?? []).find(a => a.type === 'shop')!;
  shop.items.push(item);
}
DIALOGUES.merchant_shop[0].choices!.unshift({
  label: '買月光莓（32 魚乾幣）', when: done(share), act: [{ type: 'buy', id: 'moon_berry', price: 32 }],
});

const workshop = side(11, 'charcoal', village, '黑炭師傅的小鳥', '找木板和乾草，幫受傷的小鳥做鳥屋。',
  '……那隻常來吃種子的小鳥，翅膀受傷了。幫我找木板和乾草，好嗎？',
  [goal('board', '在鐵匠鋪外找一塊薄木板', 'c2_bird_board'),
    goal('hay', '到菜園旁找一把乾草', 'c2_bird_hay'),
    goal('build', '拿材料回去找黑炭師傅', 'charcoal')],
  '小鳥的新家');
glint('c2_bird_board', village, 24, 26, current(workshop, 'board'), 'c2_planks');
glint('c2_bird_hay', village, 23, 20, current(workshop, 'hay'), 'hay');
DIALOGUES.c2_bird_board = say('narr', '找到一塊薄木板。正好能做鳥屋的屋頂！', step(workshop, 'board'));
DIALOGUES.c2_bird_hay = say('narr', '找到一把乾草。鋪在鳥屋裡，睡起來會軟軟的。', step(workshop, 'hay'));
talk('charcoal', onMap(village, current(workshop, 'build')), 'c2_build_birdhouse', [
  { s: 'charcoal', t: '妳扶住木板，我來釘。乾草鋪在裡面……好了。' },
  { s: 'narr', t: '小鳥跳進鳥屋，輕輕叫了一聲。' },
  { s: 'charcoal', t: '……牠喜歡。謝謝。鐵匠鋪也有一把新做的月光木劍，妳可以來看看。', act: finish(workshop, 'build', 2) },
]);
MAPS[village].props.push({ key: 'c2_birdhouse', ...point(24, 27), scale: .65, when: done(workshop) });
ITEMS.c2_moon_sword = { id: 'c2_moon_sword', name: '月光木劍', kind: 'weapon', atk: 6,
  desc: '黑炭師傅細細磨過的月光木劍。攻擊 +6。' };
const smith = DIALOGUES.charcoal_shop[0].act!.find(a => a.type === 'shop')!;
smith.items.push({ id: 'c2_moon_sword', price: 120, when: done(workshop) });
glint('c2_sword_display', village, 25, 28, { all: [done(workshop), { not: done('side3') }] });
DIALOGUES.c2_sword_display = DIALOGUES.charcoal_shop;

const neighbors = side(12, 'mochimom', village, '新來的鄰居', '帶暫住的哥布林一家認識三位村民。',
  '有一家哥布林要在村裡住幾天。牠們有點害羞，妳能先來跟牠們打招呼嗎？',
  [goal('hello', '到村裡的空屋前找哥布林一家', 'c2_new_neighbors'),
    goal('guard', '帶新鄰居認識橘貓守衛', 'guard'),
    goal('toast', '帶新鄰居認識吐司', 'toast'),
    goal('douhua', '帶新鄰居認識豆花', 'douhua')], '豆花畫的新鄰居');
NPCS.push({
  id: 'c2_new_neighbors', name: '哥布林一家', sprite: 'fgoblin', portrait: 'fgoblin_big', goblin: true,
  spots: [{ map: village, ...point(5, 28), when: current(neighbors, 'hello') }],
  follow: onMap(village, { all: [{ questActive: neighbors }, { objDone: [neighbors, 'hello'] }] }),
  talk: [
    { when: current(neighbors, 'hello'), d: 'c2_new_neighbors' },
    { when: { questActive: neighbors }, d: 'c2_neighbors_follow' },
  ],
});
DIALOGUES.c2_new_neighbors = say('c2_new_neighbors', '我們還不認識這裡的人。可以跟妳一起去嗎？', step(neighbors, 'hello'));
DIALOGUES.c2_neighbors_follow = say('c2_new_neighbors', '有妳陪著，我們就敢開口了。');
talk('guard', onMap(village, current(neighbors, 'guard')), 'c2_meet_guard',
  say('guard', '歡迎！在村裡找不到路，來問我就好。', step(neighbors, 'guard')));
const meetDouhua = onMap(village, current(neighbors, 'douhua'));
const douhua = npc('douhua');
douhua.spots.splice(-1, 0, { map: village, ...point(15, 28), when: meetDouhua });
douhua.follow = { all: [douhua.follow!, { not: meetDouhua }] };
talk('douhua', meetDouhua, 'c2_meet_douhua', [
  { s: 'douhua', t: '一起畫畫吧！我來畫我們第一次見面的樣子。' },
  { s: 'c2_new_neighbors', t: '我們也想畫！這是住在這裡的第一張畫，送給妳。', act: finish(neighbors, 'douhua', 2) },
]);

const cake = side(15, 'juanjuan', roots, '分不完的蛋糕', '幫捲捲把宴會的蛋糕公平分給大家。',
  '嘰嘰！這個大蛋糕要分給大家。我會切，妳能幫我算份量、讀客人的英文紙條嗎？',
  [goal('share', '在捲捲旁邊分蛋糕，答三題', 'c2_cake_table')], '大家都有蛋糕', ['c2m10'], 'wonder');
const dailyCake: Cond = { all: [done(cake), { notFlag: 'daily_c2_cake' }] };
const cakeHere: Cond = { any: [available(cake), { questActive: cake }, done(cake)] };
npc('juanjuan').spots.unshift({ map: roots, ...point(12, 15), when: onMap(roots, cakeHere) });
glint('c2_cake_table', roots, 11, 15, current(cake, 'share'), 'c2_cake');
const cakeQuiz = (title: string, ids: string[]): Action =>
  ({ type: 'quiz', ids: ids.map(id => `c2_${id}`), by: 'juanjuan', title });
DIALOGUES.c2_cake_table = [
  { s: 'juanjuan', t: '先算怎麼分，再讀客人的紙條。慢慢來！',
    act: [cakeQuiz('分不完的蛋糕', ['cake_share', 'cake_half', 'two'])] },
  { s: 'juanjuan', t: '每個人都分到了！還想練習，可以來找我喔。', act: finish(cake, 'share', 1) },
];
talk('juanjuan', onMap(roots, done(cake)), 'c2_cake_today', say('juanjuan', '今天已經分過蛋糕囉！明天再來。'));
talk('juanjuan', onMap(roots, dailyCake), 'c2_cake_daily', [{
  s: 'juanjuan', t: '要玩今天的分蛋糕小考嗎？答完三題就送妳一顆星星糖。',
  choices: [{ label: '來分蛋糕！', act: [
    cakeQuiz('分蛋糕小考', ['slices', 'hands', 'please']),
    { type: 'flag', id: 'daily_c2_cake' }, { type: 'item', id: 'star_candy' }, { type: 'save' },
  ] }, { label: '下次再來' }],
}]);
talk('juanjuan', onMap(roots, current(cake, 'share')), 'c2_cake_wait',
  say('juanjuan', '大蛋糕就在旁邊。走過去看看吧！'));

function school(no: number, who: string, map: string, title: string, summary: string, intro: string,
  ending: string, memory: string, subject: 'math' | 'english' | 'science', withWho?: string) {
  const id = side(no, who, map, title, summary, intro,
    [goal('quiz', `幫${npc(who).name}回答五題`, who)], memory);
  const here = onMap(map, { any: [available(id), current(id, 'quiz')] });
  if (who === 'mint' || who === 'yuzu') {
    const at = who === 'mint' ? point(8, 10) : point(15, 16);
    const giver = npc(who);
    giver.spots.unshift({ map, ...at, when: here });
    giver.follow = { all: [giver.follow!, { not: here }] };
  }
  const lesson: Dialogue = [];
  if (withWho) lesson.push({ s: withWho, t: subject === 'science' ? '我也來幫忙找！石頭上的小綠點是什麼呢？' : '我來幫你數！我們一題一題算。' });
  lesson.push(
    { s: who, t: '我們一起想一想。答錯也可以再試。', act: [
      { type: 'quiz', subject, n: 5, ids: CH2_SIDE_QUIZ[subject].map(q => q.id), by: who, title },
    ] },
    { s: who, t: ending, act: finish(id, 'quiz', 1) },
  );
  talk(who, onMap(map, current(id, 'quiz')), `${id}_quiz`, lesson);
  return here;
}

const mossLesson = school(18, 'mint', village, '小學堂⑦ 苔蘚的祕密', '和薄荷、露露一起認識森林。',
  '露露想照顧石頭上的苔蘚。我們一起幫她看看，森林裡需要什麼。',
  '謝謝妳！我們把苔蘚留在陰涼的地方，也看看附近的小昆蟲。', '薄荷和露露的苔蘚筆記', 'science', 'lulu');
npc('lulu').spots.unshift({ map: village, ...point(9, 10), when: mossLesson });
school(19, 'yuzu', roots, '小學堂⑧ 柚子的英文信', '幫柚子看懂英文信，把信送對地方。',
  '這五張英文紙條是送信的線索。能幫我讀一讀嗎？',
  '我知道往哪裡走了！出發前，先跟妳說一聲 Thank you！', '柚子的英文信', 'english');
const mathLesson = school(20, 'toast', village, '小學堂⑨ 分享的算術', '和吐司、捲捲一起算，讓大家都分得到。',
  '我要把點心和菜分給鄰居。捲捲來幫忙了，妳也來一起算吧！',
  '分好了！謝謝妳，大家都有一份。', '吐司的分享算術', 'math', 'juanjuan');
npc('juanjuan').spots.unshift({ map: village, ...point(7, 10), when: mathLesson });
talk('toast', onMap(village, current(neighbors, 'toast')), 'c2_meet_toast',
  say('toast', '妳們好！麵包剛出爐，要不要一起吃？', step(neighbors, 'toast')));
