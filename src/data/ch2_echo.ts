import { LANTERNS } from './ch1c';
import { ECHO, ECHO_OPEN } from './ch2_echo_map';
import { point } from './ch2_maps';
import { DIALOGUES } from './dialogues';
import { ITEMS, STICKERS, STICKER_PAGES } from './items';
import { GLINTS, MAPS, TILE, TRIGGERS, WONDERS } from './maps';
import { NPCS } from './npcs';
import { QUESTS, QUEST_ORDER } from './quests';
import type { Action, Cond, GlintDef, Objective, QuestDef } from './types';

const mist = 'mistpath';
const roots = 'rootvillage';
const hollow = 'c2_pudding_hollow';
const done = (id: string): Cond => ({ questDone: id });
const active = (id: string): Cond => ({ questActive: id });
const current = (id: string, obj: string): Cond => ({ objCurrent: [id, obj] });
const flag = (id: string): Action => ({ type: 'flag', id });
const step = (quest: string, obj: string): Action => ({ type: 'obj', quest, obj });
const item = (id: string): Action => ({ type: 'item', id });
const sticker = (id: string): Action => ({ type: 'sticker', id });
const start = (id: string): Action => ({ type: 'startQuest', id });
const go = (map: string, col: number, row: number, dir = 0): Action => ({ type: 'warp', map, ...point(col, row), dir });
const at = (col: number, row: number): Action => ({ type: 'stage', at: { ...point(col, row), dir: 1 } });
const goal = (id: string, text: string, options: Partial<Objective> = {}): Objective => ({ id, text, type: 'event', ...options });
const npc = (id: string) => NPCS.find(n => n.id === id)!;
const line = (id: string, s: string, t: string, ...act: Action[]) => { DIALOGUES[id] = [{ s, t, act }]; };
function glint(id: string, map: string, col: number, row: number, when?: Cond, options: Partial<GlintDef> = {}) {
  GLINTS.push({ id, map, ...point(col, row), obs: 0, d: id, when, ...options });
}
function quest(no: number, kind: 'main' | 'side', title: string, summary: string, objectives: Objective[],
  options: Partial<QuestDef> = {}) {
  const id = `c2${kind === 'main' ? 'm' : 's'}${no}`;
  QUESTS[id] = {
    id, no, kind, title, summary, objectives, chapter: 2, rewards: {},
    prereq: [kind === 'main' ? `c2m${no - 1}` : 'c2m6'],
    ...(kind === 'main' ? { autoStart: true, ordered: true } : {}), ...options,
  };
  QUEST_ORDER.push(id);
}

const oldVines = GLINTS.find(g => g.id === 'c2_valley_vines')!;
oldVines.when = { all: [oldVines.when!, { not: ECHO_OPEN }] };
MAPS[mist].props.find(p => p.key === 'c2_vine')!.when = {
  all: [{ notFlag: 'c2_sprout_found' }, { not: ECHO_OPEN }],
};

const lantern = { id: 'lan_c2_echo', name: '迴聲谷的燈籠', map: ECHO, ...point(9, 17) };
LANTERNS.push(lantern);
NPCS.push({ id: lantern.id, name: '月光燈籠', sprite: 'lantern_off',
  spots: [{ ...lantern, when: { flag: lantern.id }, sprite: 'lantern_on' }, lantern],
  talk: [{ when: { flag: lantern.id }, d: 'c2_lantern_lit' }, { d: 'c2_echo_lantern' }],
});
line('c2_echo_lantern', 'narr', '月光燈籠亮了。下次可以用它快速移動！', flag(lantern.id), { type: 'sfx', id: 'ok' });

TRIGGERS.push({ id: 'c2_echo_call', map: ECHO, once: 'c2_echo_called', d: 'c2_echo_call',
  zone: { x: 6 * TILE, y: 26 * TILE, w: 7 * TILE, h: 4 * TILE + 8 } });
DIALOGUES.c2_echo_call = [{ s: 'narr', t: '山谷好深。想對它喊什麼？', choices: [
  { label: '妳好嗎？', next: 'c2_echo_hello' },
  { label: '有人在嗎？', next: 'c2_echo_anyone' },
  { label: '我想吃番薯！', next: 'c2_echo_food' },
  { label: '喵——！', next: 'c2_echo_meow' },
] }];
for (const [id, reply] of [
  ['hello', '很好——就是襪子忘了曬！'],
  ['anyone', '有——有一個回音在上班！'],
  ['food', '番薯——也分我一口！'],
  ['meow', '汪——啊，喊錯了！'],
]) line(`c2_echo_${id}`, 'narr', `回音說「${reply}」`, sticker('c2_echo_reply'));

glint('c2_high_bridge', ECHO, 15, 21, { notFlag: 'c2_bridge_open' });
DIALOGUES.c2_high_bridge = [{ s: 'hero', t: '橋好高。對面有個閃亮的東西！', choices: [
  { label: '走過高高的獨木橋', brave: true, braveId: 'c2_high_bridge', minCourage: 15,
    surprise: '風把我的頭髮吹得翹起來了！', next: 'c2_high_bridge_cross' },
  { label: '去慢慢渡口' },
] }];
line('c2_high_bridge_cross', 'narr', '過橋了！石縫裡有一顆月亮果。', flag('c2_bridge_open'),
  at(15, 17), item('moon_berry'), sticker('c2_high_bridge'));

ITEMS.c2_softmoss = { id: 'c2_softmoss', name: '軟軟苔蘚', kind: 'key', desc: '軟得像一片小枕頭。' };
ITEMS.c2_sleepflower = { id: 'c2_sleepflower', name: '安眠花', kind: 'key', desc: '聞起來淡淡的，讓人想打呵欠。' };
ITEMS.c2_medicine_jar = { id: 'c2_medicine_jar', name: '藥罐', kind: 'key', desc: '番薯伯借給妳的小藥罐。' };
quest(7, 'main', '要怎麼幫牠？', '找薄荷問問，怎麼讓苔角舒服一點。', [
  goal('mint', '到大樹根村的首領家前找薄荷', { marker: ['c2_ask_mint'] }),
  goal('moss', '在紫霧林道找軟軟苔蘚', { marker: ['c2_softmoss'], auto: { hasItem: ['c2_softmoss', 1] } }),
  goal('dew', '到雲朵洗衣場拿月光露水（支線 14）', { auto: { hasItem: ['moon_dew', 1] } }),
  goal('flower', '到迴聲谷的慢慢渡口拿安眠花（支線 16）', { auto: { hasItem: ['c2_sleepflower', 1] } }),
], { ordered: false });
QUESTS.c2s14.autoStartAfter = 'c2m6';
glint('c2_ask_mint', roots, 11, 18, current('c2m7', 'mint'));
line('c2_ask_mint', 'mint', '我需要軟軟苔蘚、月光露水和安眠花。湊齊了，就能幫苔角。', step('c2m7', 'mint'));
glint('c2_softmoss', mist, 6, 11, { all: [active('c2m7'), { not: { hasItem: ['c2_softmoss', 1] } }] }, { sprite: 'c2_softmoss' });
line('c2_softmoss', 'hero', '這片苔蘚好軟。帶去給薄荷吧！', item('c2_softmoss'), step('c2m7', 'moss'));

quest(16, 'side', '慢慢渡口', '和慢慢搭船，去對岸找安眠花。', [
  goal('ride', '跟迴聲谷渡口的慢慢說話', { marker: ['manman'] }),
], { giver: 'manman', autoStartAfter: 'c2m6',
  rewards: { items: [{ id: 'c2_sleepflower', n: 1 }], sticker: 'c2_ferry' } });
NPCS.push({
  id: 'manman', name: '慢慢', sprite: 'manman', portrait: 'manman_big',
  spots: [{ map: ECHO, ...point(5, 21) }], talk: [{ when: active('c2s16'), d: 'c2_ferry_first' }, { d: 'c2_ferry_out' }],
});
NPCS.push({ id: 'c2_ferry_boat', name: '小船', sprite: 'c2_boat', scale: .8, noShadow: true,
  spots: [
    { map: ECHO, ...point(5, 20), lift: 1, when: { notFlag: 'c2_ferry_north' } },
    { map: ECHO, ...point(5, 18), lift: 1, when: { flag: 'c2_ferry_north' } },
  ], talk: [] });
DIALOGUES.c2_ferry_first = [
  { s: 'manman', t: '慢慢來……上船吧。安眠花……在對岸。', act: [{ type: 'flag', id: 'c2_ferry_north', value: false }] },
  { s: 'narr', t: '越想快點過河，船反而越慢。船只往前挪了一點。',
    act: [{ type: 'walkOff', npc: 'c2_ferry_boat', ...point(5, 20), y: point(5, 20).y - 8, ms: 900, ride: true }] },
  { s: 'manman', t: '深呼吸……唱首歌吧。啦……啦……', act: [
    { type: 'walkOff', npc: 'c2_ferry_boat', ...point(5, 18), ms: 400, ride: true },
    { type: 'quiz', subject: 'english', by: 'manman', title: '渡河唱歌', ids: ['c2_ferry_left', 'c2_ferry_three', 'c2_ferry_duck'] },
  ] },
  { s: 'narr', t: '歌聲一響，船輕輕滑到對岸。岸邊開著一朵安眠花。',
    act: [flag('c2_ferry_north'), at(5, 17), step('c2s16', 'ride')] },
];
line('c2_ferry_out', 'manman', '坐穩了……慢慢唱。這就到對岸。', flag('c2_ferry_north'), at(5, 17));
glint('c2_ferry_back', ECHO, 5, 17, done('c2s16'));
DIALOGUES.c2_ferry_back = [{ s: 'narr', t: '要請慢慢載妳回去嗎？', choices: [
  { label: '搭船回去', next: 'c2_ferry_return' }, { label: '留在這裡' },
] }];
line('c2_ferry_return', 'manman', '再唱一小段……到囉。', { type: 'flag', id: 'c2_ferry_north', value: false }, at(5, 21));

quest(8, 'side', '小豆芽的寶貝', '小豆芽的寶貝石頭掉在迴聲谷。', [
  goal('clues', '在迴聲谷找三處亮光', { count: 3, marker: ['c2_stone_1', 'c2_stone_2', 'c2_stone_3'] }),
  goal('return', '把石頭還給大樹根村的小豆芽', { marker: ['sprout'] }),
], { giver: 'sprout', ordered: true, rewards: { sticker: 'c2_sprout_stone' } });
const sprout = npc('sprout');
(sprout.giverOf ??= []).push('c2s8');
sprout.talk.unshift(
  { when: { questAvailable: 'c2s8' }, d: 'c2_stone_start' },
  { when: current('c2s8', 'return'), d: 'c2_stone_return' },
);
line('c2_stone_start', 'sprout', '我的寶貝石頭掉在迴聲谷。它圓圓的，摸起來暖暖的。可以幫我找嗎？', start('c2s8'));
line('c2_stone_return', 'sprout', '就是這顆！謝謝妳幫我找回來。', step('c2s8', 'return'));
for (const [i, col, row, text] of [
  [1, 7, 28, '腳印滑了一下。石頭好像滾向河邊了。'],
  [2, 11, 23, '碎石一路滾下坡。去渡口旁看看吧。'],
  [3, 4, 21, '石縫裡有顆圓石頭。摸起來暖暖的！'],
] as const) {
  const id = `c2_stone_${i}`;
  glint(id, ECHO, col, row, i === 1 ? current('c2s8', 'clues') :
    { all: [current('c2s8', 'clues'), { flag: `c2_stone_${i - 1}` }] }, { once: id, obs: 1 });
  line(id, 'hero', text, flag(id), step('c2s8', 'clues'));
}

quest(8, 'main', '村子裡的流言', '回月光貓村，找番薯伯借藥罐。', [
  goal('rumor', '去菜園找番薯伯', { marker: ['farmer'] }),
  goal('harvest', '和咕咕一起收三處菜', { count: 3, marker: ['c2_veg_1', 'c2_veg_2', 'c2_veg_3'] }),
  goal('fence', '搬木板修好籬笆', { marker: ['c2_fence'] }),
  goal('jar', '回去找番薯伯拿藥罐', { marker: ['farmer'] }),
]);
const farmer = npc('farmer');
farmer.talk.unshift(
  { when: current('c2m8', 'rumor'), d: 'c2_rumor' },
  { when: current('c2m8', 'jar'), d: 'c2_rumor_end' },
);
const gugu = npc('gugu');
gugu.follow = { any: [
  ...(gugu.follow ? [gugu.follow] : []),
  { all: [{ map: 'village' }, active('c2m8'), { objDone: ['c2m8', 'rumor'] }] },
] };
DIALOGUES.c2_rumor = [
  { s: 'narr', t: '菜園旁，有村民說「紫霧都是哥布林帶來的！」' },
  { s: 'farmer', t: '藥罐在我這兒。菜？我才不分給哥布林！' },
  { s: 'hero', t: '咕咕低下了頭。', choices: [
    { label: '咕咕是我的朋友。', brave: true, braveId: 'c2_rumor_friend', chapter: 2,
      surprise: '咕咕抬起頭，小聲說「謝謝妳，咕。」' },
    { label: '我們先去幫忙吧。' },
  ] },
  { s: 'hero', t: '咕咕，我們一起幫番薯伯收菜吧。', act: [step('c2m8', 'rumor')] },
];
for (const [n, col, row, text] of [
  [1, 17, 18, '咕咕抱起一顆高麗菜。葉子蓋住了牠的鼻子！'],
  [2, 18, 19, '一、二、三！兩人拔起一根大蘿蔔。'],
  [3, 20, 18, '最後一籃菜也收好了。'],
] as const) {
  const id = `c2_veg_${n}`;
  glint(id, 'village', col, row, current('c2m8', 'harvest'), { once: id, sprite: 'cabbage' });
  line(id, 'narr', text, flag(id), step('c2m8', 'harvest'));
}
MAPS.village.props.push({ key: 'fence', ...point(20, 20), when: { objDone: ['c2m8', 'fence'] } });
glint('c2_fence', 'village', 20, 20, current('c2m8', 'fence'), { sprite: 'c2_planks' });
line('c2_fence', 'narr', '妳搬來木板。咕咕扶著籬笆，一起把木板放好。', step('c2m8', 'fence'));
DIALOGUES.c2_rumor_end = [
  { s: 'narr', t: '村民看見咕咕忙得滿頭汗。有人接過菜籃，有人拿水給牠。' },
  { s: 'farmer', t: '喏，藥罐給妳。這籃菜……太多了，咕咕，你拿回去。' },
  { s: 'gugu', t: '謝謝！我會分給大家吃。', act: [item('c2_medicine_jar'), flag('c2s10_unlocked'), step('c2m8', 'jar')] },
];

quest(9, 'main', '布丁的祕密', '去紫霧林道，看看布丁的樹洞。', [
  goal('pudding', '先找到布丁（支線 1）', { auto: done('c2s1'), marker: ['pudding'] }),
  goal('care', '進布丁的樹洞，照顧三隻小動物', { count: 3, marker: ['c2_hollow_door', 'c2_care_squirrel', 'c2_care_hamster', 'c2_care_rabbit'] }),
  goal('thanks', '在樹洞裡跟布丁說話', { marker: ['pudding'] }),
]);
const hollowOpen: Cond = { all: [done('c2s1'), { any: [active('c2m9'), done('c2m9')] }] };
MAPS[hollow] = {
  id: hollow, name: '布丁的樹洞', indoor: true, music: 'mist', zones: [],
  tiles: ['WWWWWWWWW', 'WoooooooW', 'WorrrrroW', 'WorrrrroW', 'WorrrrroW', 'WoooooooW', 'WWWWmWWWW'],
  props: [{ key: 'f_shelf', ...point(1, 1) }, { key: 'f_bed', ...point(7, 1) }],
  exits: [{ tx: 4, ty: 6, to: mist, ...point(7, 27), dir: 0 }],
};
glint('c2_hollow_door', mist, 7, 26, hollowOpen);
line('c2_hollow_door', 'narr', '樹根下有一扇小門。布丁的樹洞就在裡面。', go(hollow, 4, 5, 1));
const pudding = npc('pudding');
pudding.follow = { all: [pudding.follow!, { not: { map: hollow } }] };
pudding.spots.unshift({ map: hollow, ...point(4, 1), when: { map: hollow } });
pudding.talk.unshift(
  { when: { all: [{ map: hollow }, current('c2m9', 'thanks')] }, d: 'c2_hollow_thanks' },
  { when: { all: [{ map: hollow }, current('c2m9', 'care')] }, d: 'c2_hollow_help' },
  { when: { map: hollow }, d: 'c2_pudding_party' },
);
line('c2_hollow_help', 'pudding', '牠們被霧嚇壞了。我怕有人傷害牠們，才掛起網子。');
for (const [id, col, row, sprite, text] of [
  ['squirrel', 2, 3, 'squirrelkid', '小松鼠的腳擦傷了。妳輕輕包上繃帶。'],
  ['hamster', 4, 3, 'yuanyuan', '小倉鼠渴了。妳捧著小碗，讓牠慢慢喝水。'],
  ['rabbit', 6, 3, 'lulu', '小兔子冷得發抖。妳替牠蓋好小毯子。'],
] as const) {
  const target = `c2_care_${id}`;
  MAPS[hollow].props.push({ key: sprite, ...point(col, row), scale: .58 });
  glint(target, hollow, col, row, current('c2m9', 'care'), { once: target });
  line(target, 'narr', text, flag(target), step('c2m9', 'care'));
}
DIALOGUES.c2_hollow_thanks = [
  { s: 'narr', t: '小動物們安靜下來。有一隻還打了個小呵欠。' },
  { s: 'pudding', t: '妳剛剛一直陪著牠們。', choices: [
    { label: '下次也可以找我幫忙。', brave: true, braveId: 'c2_pudding_help',
      surprise: '布丁往旁邊挪了一點，讓妳坐在她身邊。' },
    { label: '牠們睡得好安穩。' },
  ] },
  { s: 'pudding', t: '……謝謝。', act: [{ type: 'bond', id: 'pudding' }, flag('c2s5_unlocked'), step('c2m9', 'thanks')] },
];
TRIGGERS.push({ id: 'c2_hollow_intro', map: hollow, when: current('c2m9', 'care'), once: 'c2_hollow_intro', d: 'c2_hollow_help' });

quest(10, 'main', '嘆氣藤', '去迴聲谷深處，找出通往苔角窩口的路。', [
  goal('under', '在迴聲谷變小，找樹根下面的亮光', { marker: ['c2_under_root'] }),
  goal('over', '在迴聲谷變大，找樹根上面的亮光', { marker: ['c2_over_root'] }),
  goal('den', '沿著小路走到苔角的窩口'),
]);
for (const [kind, col, row, mode, nextRow, text] of [
  ['under', 6, 10, 'small', 9, '樹根底下有道縫。妳縮著身子鑽過去了！'],
  ['over', 12, 6, 'big', 5, '這條根像個大門檻。妳抬起腳跨了過去！'],
] as const) {
  const id = `c2_${kind}_root`;
  const when = current('c2m10', kind);
  WONDERS.push({ id, map: ECHO, ...point(col - 2, row + 2), mode, when,
    area: { x: (col - 3) * TILE, y: (row - 1) * TILE, w: 6 * TILE, h: 5 * TILE } });
  glint(id, ECHO, col, row + 1, when, { needSize: mode });
  line(id, 'narr', text, flag(`c2_root_${kind}`), at(col, nextRow), step('c2m10', kind));
}
TRIGGERS.push({ id: 'c2_den', map: ECHO, when: current('c2m10', 'den'), once: 'c2_den_seen', d: 'c2_den',
  zone: { x: 8 * TILE, y: 2 * TILE, w: 3 * TILE, h: 2 * TILE + 8 } });
DIALOGUES.c2_den = [
  { s: 'narr', t: '石頭後面傳來一聲嘆息。找到苔角的窩了。', act: [step('c2m10', 'den')] },
];

Object.assign(STICKERS, {
  c2_echo_reply: '會回答的回音', c2_high_bridge: '高高的獨木橋',
  c2_ferry: '慢慢渡口的歌', c2_sprout_stone: '小豆芽的寶貝石頭',
});
STICKER_PAGES.find(p => p.id === 'forest_depths')!.ids.push('c2_echo_reply', 'c2_high_bridge', 'c2_ferry', 'c2_sprout_stone');
