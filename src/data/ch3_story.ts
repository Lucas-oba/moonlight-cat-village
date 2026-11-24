import { point } from './ch2_maps';
import { crossBanks } from './ch3_maps';
import { DIALOGUES } from './dialogues';
import { GLINTS } from './maps';
import { NPCS } from './npcs';
import { QUESTS, QUEST_ORDER } from './quests';
import type { Action, Cond, Dialogue, Objective } from './types';
import type { WriteLetter } from './letters';

const roots = 'rootvillage';
const beach = 'reedbeach';
const banks = 'twobanks';
const bridge = 'knotbridge';
const npc = (id: string) => NPCS.find(n => n.id === id)!;
const current = (quest: string, obj: string): Cond => ({ objCurrent: [quest, obj] });
const step = (quest: string, obj: string): Action => ({ type: 'obj', quest, obj });
const goal = (id: string, text: string, marker: string): Objective => ({ id, text, type: 'event', marker: [marker] });
const friendship = (n: number, event: string): Action => ({ type: 'stat', key: 'friendship', n, event });

const mainQuests = [
  { title: '風往河邊走', summary: '大樹根村的咕咕看見一條紫絲。去林道看看，再到迴聲谷找慢慢。', objectives: [
    goal('leaf', '找紫霧林道北邊發亮的葉尖', 'c3_purple_leaf'),
    goal('wind', '到迴聲谷的渡口找慢慢', 'manman'),
  ] },
  { title: '順著河彎', summary: '在迴聲谷搭慢慢的船。到蘆管灘西岸，找敲木片的小貓。', objectives: [
    goal('ride', '找慢慢，搭船去蘆管灘', 'manman'),
    goal('clappers', '沿西岸往南走，和小穗說話', 'xiaosui'),
  ] },
  { title: '等不到的朋友', summary: '陪小穗把點心送回兩岸村西岸的船棚。問問米舟有沒有見到點點。', objectives: [
    goal('snacks', '和小穗一起提點心', 'xiaosui'),
    goal('shelter', '沿西岸往南進村，把點心給船棚阿姨', 'c3_aunt'),
    goal('news', '在船棚旁找米舟', 'mizhou'),
  ] },
  { title: '幫我問一句', summary: '在兩岸村西岸的船棚前找小穗，幫她帶一句話給點點。', objectives: [
    goal('letter', '到船棚前找小穗，幫她帶話', 'xiaosui'),
  ] },
  { title: '草後的黃布', summary: '搭舊渡船到東岸，沿路往南走。點點常在雙結橋的東橋頭揮黃布。', objectives: [
    goal('seeds', '到雙結橋東岸，找沾在草上的黃線', 'c3_flag_seeds'),
    goal('reply', '找東橋頭的點點，聽她的回答', 'diandian'),
  ] },
  { title: '兩邊都到了', summary: '沿原路回村，搭船回西岸找小穗。陪她上船，到朋友站過的地方看看。', objectives: [
    goal('return', '回兩岸村西岸，把回答帶給小穗', 'xiaosui'),
    goal('cross', '在西岸點舊渡船，陪小穗換岸', 'c3_ferry_west'),
  ] },
];

mainQuests.forEach((quest, i) => {
  const no = i + 1;
  const id = `c3m${no}`;
  QUESTS[id] = { ...quest, id, no, chapter: 3, kind: 'main', ordered: true,
    prereq: [i ? `c3m${i}` : 'c2m12'], autoStart: i > 0,
    ...(i === 0 ? { giver: 'gugu' } : {}), rewards: { exp: 600 } };
  QUEST_ORDER.push(id);
});

npc('gugu').spots.unshift({ map: roots, ...point(9, 13), when: { map: roots, questAvailable: 'c3m1' } });
npc('gugu').talk.unshift({ when: { map: roots, questAvailable: 'c3m1' }, d: 'c3_wind' });
npc('manman').talk.unshift(
  { when: current('c3m1', 'wind'), d: 'c3_river_wind' },
  { when: current('c3m2', 'ride'), d: 'c3_set_sail' },
);
GLINTS.push({ id: 'c3_purple_leaf', map: 'mistpath', ...point(11, 7), obs: 0,
  when: current('c3m1', 'leaf'), d: 'c3_purple_leaf' });

const readyToCross = current('c3m6', 'cross');
const swapped: Cond = { questDone: 'c3m6' };
NPCS.push({
  id: 'xiaosui', name: '小穗', sprite: 'xiaosui', portrait: 'xiaosui_big', isCat: true,
  voice: { base: 580, len: .17, chirps: 2, gap: .04 }, followGap: 31,
  follow: { all: [current('c3m3', 'shelter'), { any: [{ map: beach }, { map: banks }] }] },
  spots: [
    { map: banks, ...point(16, 13), when: { flag: 'c3_xiaosui_east' } },
    { map: banks, ...point(8, 12), when: readyToCross },
    { map: banks, ...point(5, 11), when: { objDone: ['c3m3', 'shelter'] } },
    { map: beach, ...point(7, 13) },
  ],
  talk: [
    { when: current('c3m2', 'clappers'), d: 'c3_clappers' },
    { when: current('c3m3', 'snacks'), d: 'c3_snacks' },
    { when: current('c3m4', 'letter'), d: 'c3_write' },
    { when: current('c3m6', 'return'), d: 'c3_bring_reply' },
    { when: readyToCross, d: 'c3_ready' },
    { when: swapped, d: 'c3_other_bank' },
    { d: 'c3_xiaosui_chat' },
  ],
}, {
  id: 'diandian', name: '點點', sprite: 'diandian', portrait: 'diandian_big', goblin: true,
  spots: [
    { map: banks, ...point(7, 12), when: swapped },
    { map: banks, ...point(15, 12), when: { questDone: 'c3m5' } },
    { map: bridge, ...point(15, 11), when: current('c3m5', 'reply') },
  ],
  talk: [
    { when: current('c3m5', 'reply'), d: 'c3_reply' },
    { when: swapped, d: 'c3_diandian_west' },
    { d: 'c3_diandian_chat' },
  ],
});

npc('c3_aunt').talk.unshift({ when: current('c3m3', 'shelter'), d: 'c3_bring_snacks' });
const mizhou = npc('mizhou');
mizhou.spots.push({ map: banks, ...point(7, 14) });
mizhou.follow = { inParty: 'mizhou' };
mizhou.talk.push({ when: current('c3m3', 'news'), d: 'c3_mizhou_news' }, { d: 'c3_mizhou_chat' });
npc('c3_ferry_west').talk.unshift({ when: readyToCross, d: 'c3_swap_banks' });
GLINTS.push({ id: 'c3_flag_seeds', map: bridge, ...point(16, 7), obs: 0,
  when: current('c3m5', 'seeds'), d: 'c3_flag_seeds' });

const letter: WriteLetter = {
  type: 'letter', id: 'c3_river_letter', from: '小穗', to: '點點',
  words: ['妳今天也有來嗎？', '我在西岸等妳。', '妳聽見我的木片了嗎？'],
  pictures: [
    { image: 'c3_clappers', label: '我敲的木片' },
    { image: 'c3_flag', label: '妳的黃布' },
    { image: 'c3_ferry', label: '我們等的小船' },
  ],
};

const story: Record<string, Dialogue> = {
  c3_wind: [
    { s: 'gugu', t: '咕！昨晚飛走的種子，好像在葉子上留下了東西。' },
    { s: 'gugu', t: '從村口走到紫霧林道，再往北。那片葉子的尖尖在發亮。', act: [
      { type: 'startQuest', id: 'c3m1' }, { type: 'time', v: 'day' },
    ] },
  ],
  c3_purple_leaf: [
    { s: 'hero', t: '葉尖纏著一條紫絲。風一吹，它就朝谷口飄！' },
    { s: 'whitecat', t: '我們往北走吧。迴聲谷的渡口有船，可以問問慢慢。', act: [step('c3m1', 'leaf')] },
  ],
  c3_river_wind: [
    { s: 'manman', t: '昨天……有一顆小東西，從我的槳邊飛過去。' },
    { s: 'manman', t: '它往蘆管灘去了。妳想去的時候，就來找我搭船。', act: [step('c3m1', 'wind')] },
  ],
  c3_set_sail: [{ s: 'manman', t: '船到了。妳想去哪裡？', choices: [
    { label: '搭船去蘆管灘', next: 'c3_first_ride' },
    { label: '去谷裡的對岸', when: { questActive: 'c2s16' }, next: 'c2_ferry_first' },
    { label: '去谷裡的對岸', when: { questDone: 'c2s16' }, next: 'c2_ferry_out' },
    { label: '再等一下' },
  ] }],
  c3_first_ride: [
    { s: 'manman', t: '坐好囉。這回我們要順著河走。', act: [
      { type: 'flag', id: 'c2_ferry_north', value: false }, { type: 'stage' },
      { type: 'walkOff', npc: 'c2_ferry_boat', ...point(9, 19), ms: 1250, ride: true },
    ] },
    { s: 'narr', t: '小船繞過河彎。風穿過蘆葦，吹出短短的笛聲。', act: [
      { type: 'warp', map: beach, ...point(6, 6) }, step('c3m2', 'ride'), { type: 'save' },
    ] },
    { s: 'hero', t: '咦？還有「叩、叩」的聲音！去西岸南邊的石階看看吧。' },
  ],
  c3_clappers: [
    { s: 'narr', t: '小貓把兩片木片敲在一起。叩、叩！她踮起腳，看向對岸。' },
    { s: 'xiaosui', t: '我是小穗。點點說要一起吃點心。我敲了好多次，她都沒回我。' },
    { s: 'xiaosui', t: '點心涼了。可以幫我提一份嗎？我們一起走回船棚。', act: [step('c3m2', 'clappers')] },
  ],
  c3_snacks: [
    { s: 'hero', t: '這一份我來提。妳幫點點留了什麼？' },
    { s: 'xiaosui', t: '她最愛的莓果餅。沿這邊往南進村，就到阿姨的船棚了。', act: [step('c3m3', 'snacks')] },
  ],
  c3_bring_snacks: [
    { s: 'c3_aunt', t: '兩份都帶回來啦？我先用布包好，餅才不會乾。' },
    { s: 'xiaosui', t: '米舟今天來回划了好多趟。我們去問問船棚旁的米舟吧。', act: [step('c3m3', 'shelter')] },
  ],
  c3_mizhou_news: [
    { s: 'mizhou', t: '我今天划過東岸。有個孩子站在蘆葦後面，手上拿著黃布。' },
    { s: 'xiaosui', t: '是點點！她的布上有兩個紅點。可是……她怎麼沒叫我呢？' },
    { s: 'mizhou', t: '我們可以幫她問呀。去船棚前，聽聽小穗想說什麼。', act: [step('c3m3', 'news')] },
  ],
  c3_write: [
    { s: 'xiaosui', t: '我想問點點：「妳今天也有來嗎？」妳能幫我帶話嗎？', act: [letter] },
    { s: 'xiaosui', t: '搭舊渡船去東岸，再往南走到雙結橋。她常在東橋頭玩。' },
    { s: 'mizhou', t: '等妳有空，也來看看我的河道圖吧。還有三個地方沒畫好。', act: [step('c3m4', 'letter')] },
  ],
  c3_flag_seeds: [
    { s: 'hero', t: '草籽上有條黃線！再往南看，草後面露出一小角黃布。', act: [step('c3m5', 'seeds')] },
  ],
  c3_reply: [
    { s: 'diandian', t: '小穗託妳來的？我今天也去了呀！妳看，我就是這樣揮的。' },
    { s: 'narr', t: '點點抖開黃布。布上的兩個大紅點，一下高、一下低。' },
    { s: 'diandian', t: '幫我告訴她：「我一直在揮黃布，揮到手都痠了。」', act: [
      { type: 'letterReply', id: letter.id, message: { image: 'c3_flag', label: '我一直在揮黃布，揮到手都痠了。' } },
    ] },
    { s: 'diandian', t: '謝謝妳！沿路往北回村，再搭船到西岸找小穗吧。我到東岸碼頭等妳們。', act: [step('c3m5', 'reply')] },
  ],
  c3_bring_reply: [
    { s: 'hero', t: '小穗，點點有話要我帶回來。', act: [letter] },
    { s: 'xiaosui', t: '她也到了！我們一個敲木片，一個揮黃布。怎麼會錯過呢？' },
    { s: 'xiaosui', t: '我想去她站的地方看看。走吧，到西岸碼頭點舊渡船！', act: [
      friendship(2, '把點點的回答帶回給小穗。'), step('c3m6', 'return'),
    ] },
  ],
  c3_swap_banks: [
    { s: 'xiaosui', t: '點點在東岸等我們。船來了！', choices: [
      { label: '陪小穗換岸', next: 'c3_ride_together' }, { label: '等一下再搭' },
    ] },
  ],
  c3_ride_together: [
    { s: 'narr', t: '小穗把木片收進兜裡，跟妳一起上船。船槳划過水面。', act: [
      ...crossBanks('west', 'xiaosui'), { type: 'flag', id: 'c3_xiaosui_east' }, { type: 'stage' },
    ] },
    { s: 'diandian', t: '小穗！原來妳一直在等我。我也在等妳呀！' },
    { s: 'diandian', t: '我把黃布借妳。妳站在我這邊試試，我也想去妳那邊。' },
    { s: 'xiaosui', t: '好！木片給妳。我們換個地方等船吧。' },
    { s: 'narr', t: '點點坐回程的船去了西岸。小穗在東岸把黃布打開。', act: [
      { type: 'walkOff', npc: 'c3_ferry_east', ...point(9, 13), ms: 1100, passenger: 'diandian' },
      { type: 'flag', id: 'c3_ferry_on_east', value: false },
      friendship(1, '陪小穗和點點交換等船的地方。'), step('c3m6', 'cross'), { type: 'stage' }, { type: 'save' },
    ] },
    { s: 'system', t: '妳把兩邊的話都帶到了喵。' },
    { s: 'xiaosui', t: '我幫妳看船。妳要去畫圖的話，米舟就在西岸船棚旁！', when: { questNotDone: 'c3s5' } },
  ],
  c3_xiaosui_chat: [{ s: 'xiaosui', t: '我幫點點留了一份莓果餅。船棚在西岸。' }],
  c3_ready: [{ s: 'xiaosui', t: '我們一起搭這艘舊渡船，到東岸找點點！' }],
  c3_other_bank: [{ s: 'xiaosui', t: '從這裡看西岸，原來是這個樣子呀。米舟在船棚旁畫的圖，妳也看過了嗎？' }],
  c3_diandian_chat: [{ s: 'diandian', t: '小穗在西岸。我會在這裡等妳們。' }],
  c3_diandian_west: [{ s: 'diandian', t: '我借到了小穗的木片！叩、叩，這邊聽起來好響。' }],
  c3_mizhou_chat: [{ s: 'mizhou', t: '河邊每個靠岸的地方都不一樣。我喜歡把它們畫下來。' }],
};
Object.assign(DIALOGUES, story);

// 三個靠岸處可以照自己的路線補畫，每一站只算一次。
const chart = 'c3s5';
const landings = [
  { id: 'c3_map_reed', map: beach, col: 8, row: 14, title: '蘆管灘西岸的石階',
    text: '這裡的石階一層一層往下。妳在圖上畫了三條短線。' },
  { id: 'c3_map_east', map: banks, col: 14, row: 14, title: '兩岸村東岸的碼頭',
    text: '碼頭邊放著水桶。妳在河邊畫了一個小桶子。' },
  { id: 'c3_map_bridge', map: bridge, col: 14, row: 10, title: '雙結橋的東橋頭',
    text: '兩根橋柱靠得好近。妳把它們畫在小船旁邊。' },
];
QUESTS[chart] = {
  id: chart, chapter: 3, kind: 'side', no: 5, giver: 'mizhou', title: '米舟的半張圖',
  summary: '幫米舟畫下三個靠岸處。畫好後，回兩岸村西岸的船棚找米舟。',
  prereq: ['c3m4'], ordered: true, rewards: { exp: 300 }, rewardText: ['友誼值 +2'],
  objectives: [
    { id: 'landings', type: 'inspect', text: '看蘆管灘西岸石階、村子東岸碼頭和雙結橋東橋頭',
      count: landings.length, unique: true, targets: landings.map(l => l.id), marker: landings.map(l => l.id) },
    goal('chart', '回西岸船棚，和米舟拼好河道圖', 'mizhou'),
  ],
};
QUEST_ORDER.push(chart);
for (const l of landings) {
  GLINTS.push({ id: l.id, d: l.id, map: l.map, ...point(l.col, l.row), obs: 0,
    when: current(chart, 'landings'), once: l.id });
  DIALOGUES[l.id] = [{ s: 'narr', t: l.text }];
}
mizhou.giverOf = [chart];
mizhou.talk.unshift(
  { when: { questAvailable: chart }, d: 'c3_chart_start' },
  { when: current(chart, 'chart'), d: 'c3_chart_finish' },
  { when: current(chart, 'landings'), d: 'c3_chart_hint' },
  { when: { questDone: chart, notRecruited: 'mizhou' }, d: 'c3_mizhou_invite' },
);
const missingLandings = landings.map(l => ({ s: 'mizhou', t: l.title + '，那裡還是空白的。', when: { notFlag: l.id } }));
DIALOGUES.c3_chart_start = [
  { s: 'mizhou', t: '我畫了河道，可是我在船上，看不清上岸的地方。妳可以幫我畫另一半嗎？' },
  { s: 'mizhou', t: '這三處留給妳。先去哪裡都可以！', act: [{ type: 'startQuest', id: chart }] },
  ...missingLandings,
];
DIALOGUES.c3_chart_hint = [
  { s: 'mizhou', t: '想看還有哪裡沒畫嗎？' },
  ...missingLandings,
];
DIALOGUES.c3_chart_finish = [
  { s: 'mizhou', t: '石階、水桶、兩根橋柱！妳看見的岸，剛好接上我畫的河。' },
  { s: 'narr', t: '妳把兩半河道圖靠在一起。米舟用爪子按住了紙角。', act: [
    friendship(2, '和米舟一起畫完河道圖。'), step(chart, 'chart'),
  ] },
];
DIALOGUES.c3_mizhou_invite = [{ s: 'mizhou', t: '下次我想跟妳一起看。要讓我帶上船槳，和妳出門嗎？', choices: [
  { label: '邀米舟同行', next: 'c3_mizhou_join' }, { label: '改天再邀', next: 'c3_mizhou_later' },
] }];
DIALOGUES.c3_chart_finish.push(...DIALOGUES.c3_mizhou_invite);
DIALOGUES.c3_mizhou_later = [{ s: 'mizhou', t: '好啊！我會在西岸的船棚等妳。' }];
DIALOGUES.c3_mizhou_join = [
  { s: 'mizhou', t: '槳、船墊、河道圖！帶齊了，走吧！', act: [{ type: 'recruit', id: 'mizhou' }] },
  { s: 'mizhou', when: { not: { inParty: 'mizhou' } }, t: '前面站滿了。要我先跟在後面，還是換我上場呢？', choices: [
    { label: '請米舟上場', act: [{ type: 'swapIn', id: 'mizhou' }] }, { label: '先跟在後面' },
  ] },
  { s: 'mizhou', t: '有空來兩岸村坐坐吧。我留了一塊很軟的船墊給妳。', act: [{ type: 'save' }] },
];

const bondScenes = [
  { level: 1, intro: '這塊船墊最軟了。妳要坐嗎？', choice: '把船墊分一半',
    answer: '那我們一人坐一邊！剛好，尾巴也有地方放。' },
  { level: 2, intro: '我們上次一人划一下，船怎麼一直轉圈呀？', choice: '跟著節奏划',
    answer: '我喊一、妳喊二。一、二！這次兩支槳一起碰到水了。' },
  { level: 3, intro: '河道圖的角被風吹起來了！妳能按住妳畫的那一邊嗎？', choice: '一起收好河道圖',
    answer: '我按這邊，妳按那邊。摺起來了！我們下次再一起打開。' },
];
for (const scene of bondScenes) {
  const id = `c3_mizhou_bond${scene.level}`;
  const when: Cond = { map: banks, recruited: 'mizhou', minBond: ['mizhou', scene.level], notFlag: id };
  if (scene.level > 1) when.flag = `c3_mizhou_bond${scene.level - 1}`;
  mizhou.talk.unshift({ when, d: id });
  DIALOGUES[id] = [{ s: 'mizhou', t: scene.intro, choices: [
    { label: scene.choice, next: `${id}_end` }, { label: '等一下再聊' },
  ] }];
  const reward: Action = scene.level < 3 ? { type: 'bond', id: 'mizhou' } : friendship(1, '和米舟一起划槳、一起收好河道圖。');
  DIALOGUES[`${id}_end`] = [{ s: 'mizhou', t: scene.answer, act: [{ type: 'flag', id }, reward] }];
}
