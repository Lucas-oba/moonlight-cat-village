import { FANER_ENCOUNTER } from './ch3_boss';
import { point } from './ch2_maps';
import { DIALOGUES } from './dialogues';
import { ITEMS } from './items';
import { GLINTS, MAPS } from './maps';
import { NPCS } from './npcs';
import { QUESTS, QUEST_ORDER } from './quests';
import type { Action, Cond, Dialogue, Objective } from './types';

const beach = 'reedbeach';
const bridge = 'knotbridge';
const village = 'twobanks';
const current = (quest: string, obj: string): Cond => ({ objCurrent: [quest, obj] });
const step = (quest: string, obj: string): Action => ({ type: 'obj', quest, obj });
const goal = (id: string, text: string, marker: string): Objective => ({ id, text, marker: [marker], type: 'event' });
const friendship = (n: number, event: string): Action => ({ type: 'stat', key: 'friendship', n, event });

const quests = [
  { title: '原來聽不到', summary: '到蘆管灘，站到朋友等船的地方。先到東岸聽木片，再到西岸看黃布。', objectives: [
    goal('east', '去蘆管灘東岸，站在點點的石階上', 'c3_stand_east'),
    goal('west', '從村裡搭船回西岸，再去蘆管灘看黃布', 'c3_stand_west'),
  ] },
  { title: '兩面布都升起來', summary: '沿西岸往南，穿過兩岸村到雙結橋。在兩個橋頭各插一支黃布旗。', objectives: [
    goal('west', '到雙結橋西橋頭插旗', 'c3_flag_west'),
    goal('east', '走過橋，到東橋頭插旗', 'c3_flag_east'),
  ] },
  { title: '會發抖的帆', summary: '橋下還有一片小小的帆在動。從橋中間往南，到石灘看看。', objectives: [
    goal('look', '到橋下石灘，蹲下來看小小的帆', 'c3_faner'),
  ] },
  { title: '各托一小段', summary: '問帆耳可不可以幫忙。等兩岸都看見黃布，再一起托住橋索。', objectives: [
    goal('lift', '問問帆耳，再請兩岸的大人托住橋索', 'c3_faner'),
    goal('rope', '鬆開橋索，陪帆耳慢慢站起來', 'c3_faner'),
  ] },
  { title: '等你自己站起來', summary: '橋索底下有顆紫色種子。把它放進小盆，一起帶走。', objectives: [
    goal('pot', '在帆耳旁邊，把種子放進小盆', 'c3_seedpot'),
    goal('pack', '把種子小盆收進背包', 'c3_potted_seed'),
  ] },
  { title: '這次一起接船', summary: '回兩岸村西岸找小穗。這回，兩個朋友要一起接船。', objectives: [
    goal('signal', '到兩岸村西岸，陪小穗舉起黃布', 'xiaosui'),
    goal('bucket', '和小穗一起接船，問船家需要什麼', 'xiaosui'),
  ] },
];
quests.forEach((quest, i) => {
  const no = i + 7;
  const id = 'c3m' + no;
  QUESTS[id] = { ...quest, id, no, chapter: 3, kind: 'main', ordered: true,
    prereq: ['c3m' + (no - 1)], autoStart: true, rewards: { exp: 800 } };
  QUEST_ORDER.push(id);
});
QUESTS.c3m12.onComplete = 'c3_finale_end';
QUESTS.c3m11.rewards.items = [{ id: 'c3_seedpot', n: 1 }];

const xiaosui = NPCS.find(n => n.id === 'xiaosui')!;
const diandian = NPCS.find(n => n.id === 'diandian')!;
const onSteps: Cond = { map: beach, questActive: 'c3m7' };
const byFlags: Cond = { questDone: 'c3m7', questNotDone: 'c3m11' };
const atDocks: Cond = { questDone: 'c3m11' };
xiaosui.spots.unshift(
  { map: village, ...point(8, 12), when: atDocks },
  { map: bridge, ...point(7, 10), when: byFlags, flip: true },
  { map: beach, ...point(16, 13), when: onSteps },
);
diandian.spots.unshift(
  { map: village, ...point(14, 12), when: atDocks },
  { map: bridge, ...point(15, 10), when: byFlags },
  { map: beach, ...point(7, 13), when: onSteps, flip: true },
);
xiaosui.talk.unshift(
  { when: current('c3m12', 'signal'), d: 'c3_receive_boat' },
  { when: current('c3m12', 'bucket'), d: 'c3_borrow_bucket' },
  { when: { questDone: 'c3m12' }, d: 'c3_dock_friends' },
  { when: onSteps, d: 'c3_east_step_hint' },
  { when: { map: village, questActive: 'c3m7' }, d: 'c3_steps_from_village' },
  { when: byFlags, d: 'c3_bridge_friends' },
);
diandian.talk.unshift(
  { when: atDocks, d: 'c3_east_dock' },
  { when: onSteps, d: 'c3_west_step_hint' },
  { when: { map: village, questActive: 'c3m7' }, d: 'c3_steps_from_village' },
  { when: byFlags, d: 'c3_bridge_friends' },
);

// 石階上的腳印人人看得到。觀察力高時，旁邊還有水花和蘆葦上的閃光。
const eastStep = point(15, 14);
const westStep = point(8, 13);
GLINTS.push(
  { id: 'c3_stand_east', d: 'c3_stand_east', map: beach, ...eastStep, kind: 'prints', obs: 0, when: current('c3m7', 'east') },
  { id: 'c3_stand_west', d: 'c3_stand_west', map: beach, ...westStep, kind: 'prints', obs: 0, when: current('c3m7', 'west') },
  { id: 'c3_loud_water', d: 'c3_loud_water', map: beach, ...point(16, 15), obs: 4, once: 'c3_loud_water', when: current('c3m7', 'east') },
  { id: 'c3_tall_reeds', d: 'c3_tall_reeds', map: beach, ...point(8, 15), obs: 4, once: 'c3_tall_reeds', when: current('c3m7', 'west') },
);

for (const [bank, col] of [['west', 8], ['east', 14]] as const) {
  const id = 'c3_flag_' + bank;
  GLINTS.push({ id, d: id, map: bridge, ...point(col, 11), obs: 0, when: current('c3m8', bank) });
  MAPS[bridge].props.push({ key: 'c3_flag', ...point(col, 11), flip: bank === 'east', when: { objDone: ['c3m8', bank] } });
}

const tangled: Cond = { questDone: 'c3m8', questNotDone: 'c3m10' };
const stones = point(12, 13);
const mizhou = NPCS.find(n => n.id === 'mizhou')!;
const byFaner: Cond = { map: bridge, questDone: 'c3m8', questNotDone: 'c3m11' };
mizhou.spots.unshift({ map: bridge, ...point(10, 12), when: byFaner });
mizhou.talk.unshift({ when: byFaner, d: 'c3_mizhou_at_stones' });
NPCS.push({
  id: 'c3_faner', name: '帆耳', sprite: 'faner_map', portrait: 'faner_boss', portraitH: 132, bob: true,
  spots: [{ map: bridge, ...stones, when: tangled }],
  talk: [
    { when: current('c3m9', 'look'), d: 'c3_third_sail' },
    { when: current('c3m10', 'lift'), d: 'c3_hold_rope' },
    { when: current('c3m10', 'rope'), d: 'c3_loosen_rope' },
  ],
}, {
  id: 'c3_faner_resting', name: '帆耳', sprite: 'faner_calm', portrait: 'faner_calm', scale: .41,
  spots: [{ map: bridge, ...stones, when: { questDone: 'c3m10' } }],
  talk: [{ d: 'c3_faner_resting' }],
});
MAPS[bridge].props.push({ key: 'ropeknot_boss', x: stones.x - 25, y: stones.y + 3, scale: .33, when: tangled });
for (const [id, col] of [['c3_aunt', 6], ['c3_grocer', 16]] as const) {
  const adult = NPCS.find(n => n.id === id)!;
  adult.spots.unshift({ map: bridge, ...point(col, 12),
    when: { map: bridge, questActive: 'c3m10' } });
  adult.talk.unshift({ when: { map: bridge }, d: 'c3_adults_at_bridge' });
}
GLINTS.push({ id: 'c3_seedpot', d: 'c3_seedpot', map: bridge, ...point(10, 14), obs: 0,
  when: current('c3m11', 'pot'), sprite: 'c2_seed', spriteOrigin: 'base' },
{ id: 'c3_potted_seed', d: 'c3_pack_seed', map: bridge, ...point(10, 14), obs: 0,
  when: current('c3m11', 'pack'), sprite: 'c3_seedpot', spriteOrigin: 'base' });
ITEMS.c3_seedpot = { id: 'c3_seedpot', name: '種子小盆', kind: 'key', desc: '紫色種子睡在土裡。妳把小盆收好，帶著它一起旅行。' };

const boatComing = current('c3m12', 'signal');
const boatMoored: Cond = { objDone: ['c3m12', 'signal'] };
const upstream = point(11, 8.5);
const dock = point(9.5, 11.6);
NPCS.push({
  id: 'c3_bucket_boat', name: '來借水桶的船', sprite: 'c3_ferry', scale: .8, noShadow: true,
  spots: [{ map: village, ...dock, when: boatMoored }, { map: village, ...upstream, when: boatComing }],
  talk: [{ d: 'c3_boat_chat' }],
}, {
  id: 'c3_bucket_guest', name: '轉輪村的船家', sprite: 'fgoblin', portrait: 'fgoblin_big', scale: .77, goblin: true,
  spots: [
    { map: village, x: dock.x, y: dock.y, lift: 16, when: boatMoored },
    { map: village, ...upstream, lift: 16, when: boatComing },
  ],
  talk: [{ d: 'c3_boat_chat' }],
});
for (const col of [8, 14]) {
  MAPS[village].props.push({ key: 'c3_flag', x: point(col, 12).x + 14, y: point(col, 12).y + 2,
    scale: .84, flip: col === 14, when: { flag: 'c3_dock_flags' } });
}

const packSeed: Dialogue = [
  { s: 'hero', t: '小盆，跟我一起走吧。我在背包裡幫你留了位子。' },
  { s: 'mizhou', t: '舊繩收好了，外側橋面可以走囉！小穗先回村接船了，我們也去吧。', act: [
    step('c3m11', 'pack'), { type: 'stage' }, { type: 'save' },
  ] },
];
const loosenRope: Action[] = [{ type: 'battle', encounter: FANER_ENCOUNTER }, step('c3m10', 'rope'), { type: 'save' }];
const story: Record<string, Dialogue> = {
  c3_steps_from_village: [{ s: 'narr', t: '沿東岸往北走，就是蘆管灘的東岸石階。回西岸時，可以搭村裡的渡船。' }],
  c3_east_step_hint: [{ s: 'xiaosui', t: '妳看，東岸石階上有腳印！站上去聽聽看。' }],
  c3_west_step_hint: [{ s: 'diandian', t: '這裡是西岸。小穗常站在石階上，朝我這邊看。' }],
  c3_loud_water: [{ s: 'hero', t: '水花打在東岸的石頭上。嘩啦！站在這裡還聽得見木片嗎？' }],
  c3_tall_reeds: [{ s: 'hero', t: '從西岸看，蘆葦比我的頭還高。黃布會不會躲在後面？' }],
  c3_stand_east: [{ s: 'xiaosui', t: '這是點點等船的地方。要站在她的腳印上聽聽看嗎？', choices: [
    { label: '站到點點的位置', next: 'c3_listen_east' }, { label: '等一下再試' },
  ] }],
  c3_listen_east: [
    { s: 'narr', t: '妳踩上石階，面向西岸。', act: [{ type: 'stage', at: { ...eastStep, dir: 2 } }] },
    { s: 'hero', t: '點點在敲木片！可是我只聽見「嘩啦、嘩啦」。' },
    { s: 'xiaosui', t: '原來我敲得再用力，她也聽不見呀。換妳去西岸看看我的布。', act: [step('c3m7', 'east')] },
  ],
  c3_stand_west: [{ s: 'diandian', t: '小穗以前就站在這一階。妳也來看看！', choices: [
    { label: '站到小穗的位置', next: 'c3_look_west' }, { label: '等一下再試' },
  ] }],
  c3_look_west: [
    { s: 'narr', t: '妳踩上西岸的腳印，踮起腳尖。', act: [{ type: 'stage', at: { ...westStep, dir: 3 } }] },
    { s: 'hero', t: '蘆葦搖來搖去。小穗真的在揮黃布嗎？我看不到她的手。' },
    { s: 'diandian', t: '原來小穗也看不見我。我們到高一點的雙結橋試試！' },
    { s: 'diandian', t: '我去拿另一塊黃布。妳從西岸一直往南走，我們橋頭見！', act: [
      friendship(2, '站到兩個朋友的位置，發現水聲和蘆葦擋住了消息。'), step('c3m7', 'west'),
    ] },
  ],
  c3_bridge_friends: [{ s: 'narr', t: '站在橋柱旁往對岸看，蘆葦尖只到妳的腳下。' }],
  c3_flag_west: [{ s: 'xiaosui', t: '這個橋頭比蘆葦高。幫我把布旗插在這裡，好嗎？', choices: [
    { label: '插上西岸的黃布旗', act: [step('c3m8', 'west'), { type: 'stage' }, { type: 'sfx', id: 'ok' }] },
    { label: '等一下再插' },
  ] }],
  c3_flag_east: [{ s: 'diandian', t: '我看見她的旗子了！換我們這一支。', choices: [
    { label: '插上東岸的黃布旗', next: 'c3_both_flags' }, { label: '等一下再插' },
  ] }],
  c3_both_flags: [
    { s: 'narr', t: '妳把布旗插穩，退到橋中間。風把兩面黃布都吹開了。', act: [
      friendship(2, '和小穗、點點在兩個橋頭插好黃布旗。'), step('c3m8', 'east'),
      { type: 'stage', at: { ...point(11, 11), dir: 0 } },
    ] },
    { s: 'xiaosui', t: '我看見妳了！兩個紅點，一個也沒少！' },
    { s: 'diandian', t: '我也看見妳了！咦，橋下怎麼還有第三片帆？它在發抖……' },
  ],
  c3_third_sail: [
    { s: 'narr', t: '妳在石灘上蹲下來。那片「帆」動了一下。原來是耳朵！' },
    { s: 'mizhou', t: '是帆耳。牠的耳尖被舊橋索纏住了。' },
    { s: 'hero', t: '繩結裡還有紫色的絲。帆耳一動，繩子就拉緊了。', act: [step('c3m9', 'look')] },
  ],
  c3_mizhou_at_stones: [{ s: 'mizhou', t: '這片石灘很淺。我陪妳走，慢慢來。' }],
  c3_adults_at_bridge: [{ s: 'narr', t: '兩岸的大人都捲起袖子。他們望著橋頭的黃布。' }],
  c3_hold_rope: [{ s: 'hero', t: '帆耳，我們可以幫你托住繩子嗎？', choices: [
    { label: '等帆耳點頭', next: 'c3_signal_banks' }, { label: '等一下再來' },
  ] }],
  c3_signal_banks: [
    { s: 'narr', t: '帆耳輕輕點了頭。小穗揮了揮黃布，等另一岸回話。' },
    { s: 'diandian', t: '我看到了！我也揮一下。兩岸都準備好啦！' },
    { s: 'c3_aunt', t: '我們一人托一小段。看，牠的耳朵可以動了。', act: [
      friendship(2, '等兩岸的黃布揮起來，和大家一起托住橋索。'), step('c3m10', 'lift'), { type: 'save' },
    ] },
    { s: 'hero', t: '我來鬆開耳尖旁邊的繩結。', act: loosenRope },
  ],
  c3_loosen_rope: [{ s: 'c3_aunt', t: '我們托穩了。妳準備好了嗎？', choices: [
    { label: '去鬆開橋索', act: loosenRope },
    { label: '等一下再來' },
  ] }],
  c3_faner_resting: [{ s: 'narr', t: '帆耳豎起兩隻耳朵。牠自己挑了一塊暖暖的石頭，坐下來曬太陽。' }],
  c3_seedpot: [
    { s: 'hero', t: '帆耳站起來了。剛才壓在繩子底下的，是一顆紫色種子！' },
    { s: 'mizhou', t: '我有個小盆。要把種子放進去嗎？', choices: [
      { label: '把紫色種子放進小盆', next: 'c3_plant_seed' }, { label: '等一下再來' },
    ] },
  ],
  c3_plant_seed: [
    { s: 'narr', t: '妳在土裡挖了個小洞，放進種子，再輕輕把土蓋好。', act: [
      step('c3m11', 'pot'), { type: 'stage' },
    ] },
    ...packSeed,
  ],
  c3_pack_seed: packSeed,
  c3_receive_boat: [{ s: 'xiaosui', t: '上游來了一艘船！等點點舉起黃布，我們也舉起來。', choices: [
    { label: '一起舉起黃布接船', next: 'c3_boat_arrives' }, { label: '等一下再來' },
  ] }],
  c3_boat_arrives: [
    { s: 'diandian', t: '這裡，這裡！小穗，妳看見我的兩個紅點了嗎？', act: [
      { type: 'flag', id: 'c3_dock_flags' }, { type: 'stage', at: { ...point(8, 13), dir: 3 } },
    ] },
    { s: 'xiaosui', t: '我看見了！船家也在朝我們揮手！', act: [
      { type: 'walkOff', npc: 'c3_bucket_boat', ...dock, passenger: 'c3_bucket_guest', ms: 1400 },
      step('c3m12', 'signal'), { type: 'stage' },
    ] },
    { s: 'c3_bucket_guest', t: '這裡是兩岸村嗎？', choices: [{ label: '伸手接住船繩', next: 'c3_borrow_bucket' }] },
  ],
  c3_borrow_bucket: [
    { s: 'c3_bucket_guest', t: '我是從轉輪村來的。我們想跟你們借個水桶。' },
    { s: 'xiaosui', t: '船棚有！我去拿。' },
    { s: 'hero', t: '我來幫忙把桶送去轉輪村。' },
    { s: 'narr', t: '小白貓低下頭，用爪子碰了碰金色領結。' },
    { s: 'whitecat', t: '……', flashBow: true },
    { s: 'system', t: '等……', glitch: true, act: [friendship(1, '陪小穗和點點接到轉輪村的船。'), step('c3m12', 'bucket')] },
  ],
  c3_finale_end: [{ s: 'narr', t: '河面上，兩面黃布又一起揮了揮。', act: [{ type: 'chapterEnd', chapter: 3 }] }],
  c3_dock_friends: [{ s: 'xiaosui', t: '點點說下次要帶熱茶。我還幫她留著那份莓果餅！' }],
  c3_east_dock: [{ s: 'diandian', t: '看，對岸就是小穗！妳到西岸找她，我在這裡揮布。' }],
  c3_boat_chat: [{ s: 'c3_bucket_guest', t: '這條河真寬！我看見兩面黃布，就知道要在哪裡靠岸了。' }],
};
Object.assign(DIALOGUES, story);
