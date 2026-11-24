import { point } from './ch2_maps';
import { DIALOGUES } from './dialogues';
import { stickerPictures, STICKERS, STICKER_PAGES } from './items';
import type { WriteLetter } from './letters';
import { GLINTS, MAPS } from './maps';
import { NPCS } from './npcs';
import { QUESTS, QUEST_ORDER } from './quests';
import type { Action, Cond, Dialogue, Objective } from './types';

const banks = 'twobanks';
const beach = 'reedbeach';
const npc = (id: string) => NPCS.find(n => n.id === id)!;
const current = (quest: string, obj: string): Cond => ({ objCurrent: [quest, obj] });
const step = (quest: string, obj: string): Action => ({ type: 'obj', quest, obj });
const start = (id: string): Action => ({ type: 'startQuest', id });
const goal = (id: string, text: string, target: string): Objective => ({ id, text, type: 'event', marker: [target] });
const friendship = (n: number, event: string): Action => ({ type: 'stat', key: 'friendship', n, event });

function side(no: number, title: string, giver: string, prereq: string, summary: string,
  objectives: Objective[], stickerName: string, hearts = 0) {
  const id = 'c3s' + no;
  const sticker = id + '_memory';
  QUESTS[id] = {
    id, no, chapter: 3, kind: 'side', giver, title, summary, prereq: [prereq], objectives, ordered: true,
    rewards: { exp: 160, money: 24, sticker }, rewardText: hearts ? ['友誼值 +' + hearts] : [],
  };
  QUEST_ORDER.push(id);
  const friend = npc(giver);
  (friend.giverOf ??= []).push(id);
  STICKERS[sticker] = stickerName;
  stickerPictures[sticker] = friend.portrait ?? friend.sprite;
  STICKER_PAGES.find(p => p.id === 'river_friends')!.ids.push(sticker);
  return id;
}

// NPC 的站位是全世界共用的。只在任務所在的地圖換位置，上場的老夥伴也能在河邊等玩家。
function visit(who: string, map: string, col: number, row: number, quest: string, hint: string) {
  const actor = npc(who);
  const when: Cond = { map, any: [{ questAvailable: quest }, { questActive: quest }] };
  actor.spots.unshift({ map, ...point(col, row), when });
  if (actor.follow) actor.follow = { all: [actor.follow, { not: when }] };
  const d = quest + '_hint_' + who;
  actor.talk.unshift({ when, d });
  DIALOGUES[d] = [{ s: who, t: hint }];
}
function talk(who: string, map: string, condition: Cond, d: string, lines: Dialogue) {
  npc(who).talk.unshift({ when: { map, all: [condition] }, d });
  DIALOGUES[d] = lines;
}
function glint(id: string, map: string, col: number, row: number, when: Cond, lines: Dialogue) {
  GLINTS.push({ id, d: id, map, ...point(col, row), obs: 0, when });
  DIALOGUES[id] = lines;
}

function bondQuest(no: number, title: string, who: string, col: number, row: number, prereq: string,
  summary: string, objectives: Objective[], sticker: string, intro: Dialogue) {
  const id = side(no, title, who, prereq, summary, objectives, sticker, 2);
  QUESTS[id].bond = [who, 1];
  visit(who, banks, col, row, id, summary);
  talk(who, banks, { questAvailable: id }, id + '_start', [
    ...intro, { s: who, t: summary, act: [start(id)] },
  ]);
  return id;
}
function bondEnding(quest: string, obj: string, who: string, memory: string, event: string): Dialogue {
  return [
    { s: who, when: { minBond: [who, 4] }, t: memory },
    { s: who, when: { maxBond: [who, 3] }, t: '下次也來陪我，好嗎？', act: [{ type: 'bond', id: who }] },
    { s: 'system', t: event + '喵。', act: [friendship(2, event + '。'), step(quest, obj)] },
  ];
}

const umbrella = bondQuest(1, '傘柄的另一半', 'ali', 3, 12, 'c3m3',
  '去西岸船棚旁，和等船的小孩一起撐傘。', [goal('share', '找船棚旁等船的小孩，一起握傘柄', 'c3_umbrella_child')],
  '兩雙手的小傘', [{ s: 'ali', t: '我幫大家撐傘！咦，傘柄一直往我這邊倒……' }]);
NPCS.push({
  id: 'c3_umbrella_child', name: '等船的小孩', sprite: 'fgoblin', goblin: true, scale: .75,
  spots: [{ map: banks, ...point(4, 11), when: current(umbrella, 'share') }],
  talk: [{ when: current(umbrella, 'share'), d: 'c3_umbrella_share' }, { d: 'c3_wait_for_yuzu' }],
});
DIALOGUES.c3_umbrella_share = [
  { s: 'c3_umbrella_child', t: '阿栗，我也搆得到。可以讓我握一下嗎？', choices: [
    { label: '把傘柄往中間挪', next: 'c3_umbrella_together' },
  ] },
];
DIALOGUES.c3_umbrella_together = [
  { s: 'narr', t: '阿栗握住上面，小孩握住下面。傘下多出一塊陰影，剛好讓妳站進去。' },
  { s: 'ali', t: '原來兩個人一起撐，我的爪子還能空出一隻！' },
  ...bondEnding(umbrella, 'share', 'ali', '以前都是我舉盾。妳看，今天有人幫我撐傘了！', '妳幫阿栗把傘柄分了一半'),
];

const herbs = bondQuest(2, '兩雙手的藥籃', 'mint', 18, 8, 'c3m4',
  '到東岸的藥籃旁，和薄荷分著做洗葉和晾葉的工作。', [goal('leaves', '在東岸的藥籃旁，挑想做的工作', 'c3_herb_basket')],
  '曬好的藥葉', [{ s: 'mint', t: '這一籃藥葉要洗，也要晾。妳想做哪一件？' }]);
MAPS[banks].props.push({ key: 'f_herbs', ...point(18, 10), scale: .7, when: current(herbs, 'leaves') });
glint('c3_herb_basket', banks, 18, 10, current(herbs, 'leaves'), [
  { s: 'mint', t: '木盆和竹盤都在這裡。妳先挑，我來做另一件。', choices: [
    { label: '我來洗葉子', act: [{ type: 'flag', id: 'c3_wash_leaves' }] }, { label: '我來晾葉子' },
  ] },
  { s: 'narr', when: { flag: 'c3_wash_leaves' }, t: '妳把葉上的泥洗掉。薄荷接過濕葉，一片片攤在盤上。' },
  { s: 'narr', when: { notFlag: 'c3_wash_leaves' }, t: '薄荷洗好葉子遞給妳。妳把兩片黏在一起的葉子輕輕分開。' },
  ...bondEnding(herbs, 'leaves', 'mint', '我還記得妳幫我採苔蘚。這次換我來幫妳捲袖子。', '妳和薄荷分工收好了藥葉'),
]);

const yuzuLetter: WriteLetter = {
  type: 'letter', id: 'c3_yuzu_letter', from: '等船的小孩', to: '洗杯姐姐',
  words: ['妳等船時喜歡看什麼？', '東岸有什麼好看的？', '我想看看妳眼裡的河。'],
};
const reply = bondQuest(3, '回信的下半頁', 'yuzu', 4, 16, 'c3m6',
  '和柚子一起帶話給東岸的洗杯姐姐，再把回答交給西岸的小孩。', [
    goal('write', '和西岸的柚子一起準備朋友信', 'yuzu'),
    goal('reply', '到東岸找洗杯姐姐，等她回答', 'c3_cupkeeper'),
    goal('return', '回西岸找柚子，一起把回答交給小孩', 'yuzu'),
  ], '下半頁的小船', [{ s: 'yuzu', t: '我每次送了信就跑。今天我想等朋友說完，再走！' }]);
npc('c3_umbrella_child').spots.push({ map: banks, ...point(3, 17), when: { questActive: reply } });
npc('yuzu').spots.unshift({ map: banks, ...point(19, 19), when: { map: banks, ...current(reply, 'reply') } });
DIALOGUES.c3_wait_for_yuzu = [{ s: 'c3_umbrella_child', t: '我託柚子傳話給洗杯姐姐了，好想知道她看見什麼。' }];
talk('yuzu', banks, current(reply, 'write'), 'c3_yuzu_write', [
  { s: 'c3_umbrella_child', t: '姐姐在東岸看到的河，跟我看到的一樣嗎？' },
  { s: 'yuzu', t: '我們可以寫在紙的上半頁，把下面留給姐姐。幫忙傳口信也行！', act: [yuzuLetter, step(reply, 'write')] },
]);
NPCS.push({
  id: 'c3_cupkeeper', name: '洗杯姐姐', sprite: 'fgoblin', portrait: 'fgoblin_big', goblin: true,
  spots: [{ map: banks, ...point(18, 18), when: { questDone: 'c3m6' } }], talk: [{ d: 'c3_cupkeeper_chat' }],
});
DIALOGUES.c3_cupkeeper_chat = [{ s: 'c3_cupkeeper', t: '我把杯子倒過來放。等它乾了，就可以裝進籃子。' }];
talk('c3_cupkeeper', banks, current(reply, 'reply'), 'c3_yuzu_reply', [
  { s: 'c3_cupkeeper', t: '我喜歡看小船。等我一下，我想把河上的小船畫給那孩子看。' },
  { s: 'yuzu', t: '我的腳又想跑了……好，我坐下來！', choices: [{ label: '陪她畫完' }] },
  { s: 'c3_cupkeeper', t: '畫好了！看，船尾還有兩道水波。', act: [
    { type: 'letterReply', id: yuzuLetter.id, message: { image: 'c3_ferry', label: '我的朋友，這是我看見的小船。妳看，後面有兩道水波！' } },
    step(reply, 'reply'),
  ] },
]);
talk('yuzu', banks, current(reply, 'return'), 'c3_yuzu_return', [
  { s: 'yuzu', t: '我們來看看她的回答。', act: [yuzuLetter] },
  { s: 'c3_umbrella_child', t: '原來船後面還有兩道水波！下次我也想數數看。' },
  { s: 'yuzu', t: '我以前只送出去就走了。今天連朋友的回答也帶回來啦！' },
  ...bondEnding(reply, 'return', 'yuzu', '下次妳畫畫，我也坐在妳身邊等。慢慢畫！', '妳和柚子把朋友的回答帶回來了'),
]);

const bird = bondQuest(4, '摸摸之前', 'pudding', 18, 14, 'c3m7',
  '到東岸的窗邊，看看小病鳥，再和朋友商量怎麼陪牠。', [
    goal('water', '在東岸的窗邊，看看小鳥的反應', 'c3_bird_window'),
  ], '窗邊的小水碟', [{ s: 'pudding', t: '先把手收回來。妳看，小病鳥正把頭縮進羽毛裡。' }]);
MAPS[banks].props.push({ key: 'chick', ...point(20, 12), when: current(bird, 'water') });
glint('c3_bird_window', banks, 20, 12, current(bird, 'water'), [
  { s: 'narr', t: '等船的小孩想摸摸小鳥。手才靠近，小鳥就往後縮。' },
  { s: 'pudding', t: '我們退一步。妳們一個遞水，一個在窗外等。妳想做哪個？', choices: [
    { label: '遞一小碟水', act: [{ type: 'flag', id: 'c3_offer_bird_water' }] }, { label: '在窗外陪牠' },
  ] },
  { s: 'narr', when: { flag: 'c3_offer_bird_water' }, t: '妳放下水碟，退到窗邊。小孩靠在窗外，小聲數著小鳥喝了幾口。' },
  { s: 'narr', when: { notFlag: 'c3_offer_bird_water' }, t: '小孩把水碟放好。妳在窗外坐下。過了一會兒，小鳥自己走到碟子旁。' },
  ...bondEnding(bird, 'water', 'pudding', '妳還記得怎麼等小鳥靠過來。下次樹洞有客人，我也想找妳一起陪。', '妳和朋友等小鳥自己來喝水'),
]);

const bench = side(6, '板凳轉過來', 'c3_aunt', 'c3m3', '幫船棚阿姨搬西岸的兩張板凳，讓等船的人能看見彼此。', [
  goal('turn', '把西岸小路南邊的板凳轉過來', 'c3_turn_bench'),
], '面對面的板凳', 1);
talk('c3_aunt', banks, { questAvailable: bench }, 'c3_bench_offer', [
  { s: 'c3_aunt', t: '等船的人都背對背坐著。他們想聊聊天，可以幫我搬板凳嗎？', choices: [
    { label: '一起搬板凳', act: [start(bench)] },
    ...DIALOGUES.c3_shed_rest[0].choices!,
  ] },
]);
const benchSpot = point(6, 19);
MAPS[banks].props.push(
  { key: 'f_rocker', ...point(4, 19), scale: .55, when: { questDone: 'c3m3' } },
  { key: 'f_rocker', ...benchSpot, scale: .55, when: { questDone: 'c3m3', questNotDone: bench } },
  { key: 'f_rocker', ...benchSpot, scale: .55, flip: true, when: { questDone: bench } },
);
glint('c3_turn_bench', banks, 6, 19, current(bench, 'turn'), [
  { s: 'narr', t: '兩張板凳都面向小路。要怎麼擺，才看得見另一張臉？', choices: [
    { label: '把這張轉向另一張' },
  ] },
  { s: 'c3_aunt', t: '來，一人抬一邊。好，放下！現在兩邊等船的人可以面對面聊天了。',
    act: [friendship(1, '和船棚阿姨搬板凳，讓等船的人面對面聊天。'), step(bench, 'turn')] },
]);

const cupLetter: WriteLetter = {
  type: 'letter', id: 'c3_cup_letter', from: '船家伯伯', to: '洗杯姐姐',
  words: ['坐下來一起吃吧！', '有個位子留給妳。', '想和我們一起吃點心嗎？'],
};
const cup = side(7, '少一個杯子', 'c3_grocer', 'c3m8', '看看西岸點心桌上少了什麼。去東岸，邀洗杯姐姐一起來吃點心。', [
  goal('table', '看看西岸小路旁的點心桌，準備邀請的話', 'c3_snack_table'),
  goal('invite', '去東岸，把邀請帶給洗杯姐姐', 'c3_cupkeeper'),
  goal('return', '回西岸雜貨攤，告訴船家伯伯她的回答', 'c3_grocer'),
], '留給妳的杯子', 1);
talk('c3_grocer', banks, { questAvailable: cup }, 'c3_cups_offer', [
  { s: 'c3_grocer', t: '點心桌上有三塊餅，好像還少了什麼。妳可以幫我看看嗎？', choices: [
    { label: '一起擺杯子', act: [start(cup)] }, { label: '逛逛雜貨攤', next: 'c3_river_shop' },
  ] },
]);
MAPS[banks].props.push({ key: 'f_table', ...point(4, 18), scale: .57, when: { questDone: 'c3m8' } });
glint('c3_snack_table', banks, 4, 18, current(cup, 'table'), [
  { s: 'narr', t: '桌上有三塊餅。左邊和右邊都有杯子，中間只有餅。', choices: [{ label: '替中間補一個杯子' }] },
  { s: 'c3_grocer', t: '啊！我們每次吃點心，洗杯姐姐都還在洗杯子。這回也邀她來吧！', act: [
    cupLetter, step(cup, 'table'),
  ] },
]);
talk('c3_cupkeeper', banks, current(cup, 'invite'), 'c3_cups_invite', [
  { s: 'c3_cupkeeper', t: '我也有位子嗎？好呀！放好這個杯子，我就搭船過去。', act: [
    { type: 'letterReply', id: cupLetter.id, message: '好，我也來！我的杯子洗好囉。' }, step(cup, 'invite'),
  ] },
]);
npc('c3_cupkeeper').spots.unshift({ map: banks, ...point(3, 18), when: { questDone: cup, not: current(reply, 'reply') } });
talk('c3_grocer', banks, current(cup, 'return'), 'c3_cups_return', [
  { s: 'hero', t: '伯伯，洗杯姐姐回話了！', act: [cupLetter] },
  { s: 'c3_grocer', t: '來了，船靠岸了！這個杯子放中間。大家各拿一塊餅，剛剛好。', act: [
    friendship(1, '替洗杯姐姐留一個杯子，邀她一起吃點心。'), step(cup, 'return'),
  ] },
]);

const rhyme = side(8, '笑出聲的蘆管', 'yuanyuan', 'c3m3', '到蘆管灘西岸找圓圓。跟牠一人讀半句，聽蘆管怎麼笑。', [
  goal('rhyme', '到西岸的蘆管旁，接圓圓的下半句', 'c3_laugh_reeds'),
], '噗噗笑的蘆管');
visit('yuanyuan', beach, 5, 9, rhyme, '妳靠近我旁邊那排蘆管，聽聽看。');
talk('yuanyuan', beach, { questAvailable: rhyme }, 'c3_rhyme_start', [
  { s: 'yuanyuan', t: '我發現蘆管有個癢癢的地方。兩句話最後的音很像，它就會笑！', act: [start(rhyme)] },
]);
glint('c3_laugh_reeds', beach, 7, 10, current(rhyme, 'rhyme'), [
  { s: 'yuanyuan', t: '「朋友牽著手……」換妳接！哪一句的尾音跟「手」像呢？', choices: [
    { label: '沿著河邊走', next: 'c3_reeds_giggle' }, { label: '一起來划船', next: 'c3_reeds_retry' },
  ] },
]);
DIALOGUES.c3_reeds_retry = [{ s: 'yuanyuan', t: '蘆管歪了一下。聽，「手、走」的尾音都是「ㄡ」。再接一次吧！', choices: [
  { label: '沿著河邊走', next: 'c3_reeds_giggle' },
] }];
DIALOGUES.c3_reeds_giggle = [
  { s: 'hero', t: '沿著河邊走！' },
  { s: 'narr', t: '「噗、噗噗！」前面一管笑彎了腰，後面那管噗出一顆水珠。' },
  { s: 'yuanyuan', t: '嘻！水珠剛好停在我鼻尖上。', act: [step(rhyme, 'rhyme')] },
];

const cloud = side(9, '小雲的腳印', 'pengpeng', 'c3m7', '和蓬蓬、露露到蘆管灘東岸，幫小雲鬆開勾住牠的葉子。', [
  goal('look', '在東岸找露露，看看小雲勾在哪裡', 'lulu'),
  goal('leaf', '在東岸石階旁，托起勾住小雲的葉尖', 'c3_cloud_leaf'),
], '小雲的圓腳印');
visit('pengpeng', beach, 18, 10, cloud, '小雲勾在葉子上了！露露在石階旁邊看著牠。');
visit('lulu', beach, 18, 13, cloud, '蓬蓬正看著小雲。我們一起想個辦法吧。');
talk('pengpeng', beach, { questAvailable: cloud }, 'c3_cloud_start', [
  { s: 'pengpeng', t: '小雲翻身，把肚皮勾在葉尖上了！我來托住牠。妳可以請露露過來嗎？', act: [start(cloud)] },
]);
talk('lulu', beach, current(cloud, 'look'), 'c3_cloud_look', [
  { s: 'lulu', t: '看東岸石階旁！只要把那片彎彎的葉子抬高一點，小雲就能翻回來。', act: [step(cloud, 'look')] },
]);
for (const [col, row, scale] of [[14, 12, .85], [13.5, 11.5, .70], [12.7, 11.6, .53]]) {
  MAPS[beach].props.push({ key: 'paw', ...point(col, row), scale, when: { flag: 'c3_cloud_steps', questActive: cloud } });
}
glint('c3_cloud_leaf', beach, 15, 12, current(cloud, 'leaf'), [
  { s: 'pengpeng', t: '小雲，我托住妳啦。露露，妳拉住葉柄！', choices: [{ label: '輕輕托起葉尖' }] },
  { s: 'lulu', t: '鬆開了！咦？小雲沒有飛上天。牠把一隻腳放進水裡了！',
    act: [{ type: 'flag', id: 'c3_cloud_steps' }, { type: 'stage' }] },
  { s: 'pengpeng', t: '看水面！小雲每踩一步，就多一個圓圓的霧印。', act: [step(cloud, 'leaf')] },
]);

const boat = side(10, '害羞的小船', 'manman', 'c3m8', '到蘆管灘西岸找慢慢。和捲捲一起想辦法，坐小船漂回船棚。', [
  goal('praise', '對西岸下游的小船說一句好話', 'c3_shy_boat'),
  goal('seat', '找小船旁的捲捲，一起騰個位子', 'juanjuan'),
], '留給朋友的船位', 1);
visit('manman', beach, 6, 20, boat, '我的小船很會划，一聽見好話，就有點害羞……');
visit('juanjuan', beach, 6, 22, boat, '我也想上船！我的尾巴好像佔了兩個位子。');
talk('manman', beach, { questAvailable: boat }, 'c3_boat_start', [
  { s: 'manman', t: '我說「好船」，船頭就縮進來了。不信？妳也去河邊誇誇牠。', act: [start(boat)] },
]);
const smallBoat = point(8, 21);
NPCS.push(
  { id: 'c3_shy_boat', name: '害羞的小船', sprite: 'c2_boat', noShadow: true, scale: .82,
    spots: [{ map: beach, ...smallBoat, when: current(boat, 'praise') }], talk: [{ d: 'c3_boat_praise' }] },
  { id: 'c3_shy_boat_small', name: '縮短的小船', sprite: 'c2_boat', noShadow: true, scale: .58,
    spots: [{ map: beach, ...smallBoat, when: current(boat, 'seat') }], talk: [{ d: 'c3_boat_small' }] },
);
DIALOGUES.c3_boat_praise = [
  { s: 'narr', t: '小船在水面轉了半圈。妳想跟牠說什麼？', choices: [
    { label: '你好會轉彎！' }, { label: '你的小船頭真漂亮！' },
  ] },
  { s: 'narr', t: '「咻！」船頭又縮短一截。捲捲把大尾巴抱了起來。', act: [step(boat, 'praise'), { type: 'stage' }] },
];
DIALOGUES.c3_boat_small = [{ s: 'manman', t: '坐得下嗎……？妳問問捲捲，牠好像有主意。' }];
talk('juanjuan', beach, current(boat, 'seat'), 'c3_boat_share', [
  { s: 'juanjuan', t: '我把尾巴捲在腿上！妳來坐這個空位。', choices: [{ label: '靠在一起坐好' }] },
  { s: 'manman', t: '我在船頭划。大家都坐好了，回船棚囉！', act: [
    { type: 'walkOff', npc: 'c3_shy_boat_small', ...point(10, 24), ms: 1000, ride: true, passenger: 'juanjuan' },
    { type: 'warp', map: banks, ...point(7, 13) },
  ] },
  { s: 'juanjuan', t: '船靠岸啦！我的尾巴捲得剛剛好，誰也沒擠到。', act: [
    friendship(1, '和捲捲騰出船位，一起回到船棚。'), step(boat, 'seat'),
  ] },
]);
