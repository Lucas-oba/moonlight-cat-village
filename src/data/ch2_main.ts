import { LANTERNS } from './ch1c';
import { ANTLER, point, TRAP } from './ch2_maps';
import { DIALOGUES } from './dialogues';
import { TILE, TRIGGERS } from './maps';
import { NPCS } from './npcs';
import { QUESTS, QUEST_ORDER } from './quests';
import type { Action, Cond, Dialogue, NpcDef, Objective } from './types';

const done = (id: string): Cond => ({ questDone: id });
const flag = (id: string): Action => ({ type: 'flag', id });
const current = (id: string, obj: string): Cond => ({ objCurrent: [id, obj] });
const advance = (quest: string, obj: string): Action => ({ type: 'obj', quest, obj });
const kindness = (n: number): Action => ({ type: 'stat', kindness: n });
const goal = (id: string, text: string, count?: number): Objective => ({ id, type: 'event', text, count });

const quests = [
  { title: '走進紫霧', summary: '巨岩知道倒樹後面有條小路。', objectives: [goal('enter', '從倒樹的缺口走進紫霧林道')] },
  { title: '霧裡的小聲音', summary: '霧裡傳來小小的哭聲。', objectives: [goal('puffs', '沿路往北，看看是誰在哭')] },
  { title: '不友善的森林貓', summary: '前面的路上好像有人。', objectives: [goal('net', '沿著林道往北走')] },
  { title: '大樹根村', summary: '大樹根村的房子被搖壞了。', objectives: [
    goal('arrive', '走東邊岔路去大樹根村'), goal('planks', '點木板，搬三疊去修屋子', 3), goal('repair', '和巨岩一起修好首領家'),
  ] },
  { title: '寶貝石頭的腳印', summary: '往林道北邊找找小豆芽的腳印。', onComplete: 'c2_find', objectives: [
    goal('print1', '到林道的岔路北邊找腳印'), goal('print2', '沿著小路看下一串腳印'),
    goal('print3', '往北找第三串腳印'), goal('valley', '沿小路走到迴聲谷口'),
  ] },
  { title: '找到小豆芽', summary: '小豆芽就在迴聲谷口。', objectives: [
    goal('find', '去看看小豆芽身旁是誰'), goal('home', '帶小豆芽回大樹根村'),
  ] },
];

quests.forEach((quest, i) => {
  const no = i + 1;
  const id = `c2m${no}`;
  QUESTS[id] = { ...quest, id, no, chapter: 2, kind: 'main', ordered: true, rewards: {},
    prereq: [i === 0 ? 'main12' : `c2m${i}`], autoStart: i > 0,
    ...(i === 0 ? { giver: 'rock' } : {}),
  };
  QUEST_ORDER.push(id);
});

const root = { map: 'rootvillage' };
const netScene: Cond = { all: [{ flag: 'c2_squirrel_netted' }, current('c2m3', 'net')] };
const valleyScene: Cond = { all: [{ questActive: 'c2m6' }, { notFlag: 'c2_sprout_found' }] };
const escort: Cond = current('c2m6', 'home');
const rockFollows: Cond = { all: [root, done('c2m4')] };

const npc = (id: string) => NPCS.find(n => n.id === id)!;
const rock = npc('rock');
rock.follow = rockFollows;
rock.followScale = .68;
rock.followGap = 86;
rock.spots.unshift(
  { ...root, ...point(7, 14), when: { all: [root, done('c2m3')] } },
  { map: 'forest', ...point(9, 40), when: { all: [{ map: 'forest' }, { flag: 'c2_tree_open' }] } },
);
rock.talk.unshift(
  { when: { all: [done('main12'), { questNotStarted: 'c2m1' }] }, d: 'c2_start' },
  { when: { questActive: 'c2m1' }, d: 'c2_open_path' },
  { when: rockFollows, d: 'c2_rock_follow' },
  { when: { all: [root, { questActive: 'c2m4' }] }, d: 'c2_rock_planks' },
);

npc('whitecat').spots.unshift(
  { map: 'mistpath', ...point(10, 32), when: { questActive: 'c2m1' } },
  { map: 'mistpath', ...point(11, 31), when: { questActive: 'c2m2' } },
);
npc('whitecat').talk.unshift({ when: { questActive: 'c2m2' }, d: 'c2_whitecat_guide' });

for (const [id, col, row] of [['chief', 13, 18], ['gugu', 4, 12], ['gob1', 8, 14]] as const) {
  npc(id).spots.unshift({ ...root, ...point(col, row), when: { all: [root, done('c2m3')] } });
  npc(id).talk.unshift({ when: { all: [root, done('c2m3')] }, d: `c2_${id}` });
}

const sprout = npc('sprout');
sprout.follow = { any: [sprout.follow!, escort] };
sprout.spots.unshift(
  { map: 'mistpath', ...point(7, 5), when: valleyScene },
  { ...root, ...point(9, 18), when: done('c2m6') },
);
sprout.talk.unshift({ when: escort, d: 'c2_sprout_follow' }, { when: done('c2m6'), d: 'c2_sprout_home' });

NPCS.push(
  { id: 'pudding', name: '布丁', isCat: true, sprite: 'pudding', portrait: 'pudding_big', portraitH: 155,
    spots: [{ map: 'mistpath', ...point(8, 22), when: current('c2m3', 'net') }], talk: [{ d: 'c2_pudding_wait' }] },
  { id: 'c2_squirrelkid', name: '小松鼠寶寶', sprite: 'squirrelkid', noShadow: true,
    spots: [{ map: 'mistpath', ...point(12, 22), lift: 22, when: netScene }], talk: [] },
  { id: 'c2_mist_guide', name: '霧團子', sprite: 'mistpuff', scale: .46, bob: true,
    spots: [{ map: 'mistpath', ...point(10, 27), when: { all: [{ flag: 'c2_mistpuffs_peaceful' }, current('c2m3', 'net')] } }],
    talk: [{ d: 'c2_puff_guide' }] },
  { id: 'c2_antler', name: '苔角', sprite: 'mossantler_map', noShadow: true,
    spots: [{ map: 'mistpath', ...ANTLER, when: valleyScene }], talk: [] },
);

const lanterns = [
  { id: 'lan_c2_south', name: '林道入口的燈籠', map: 'mistpath', ...point(12, 34) },
  { id: 'lan_c2_north', name: '林道北邊的燈籠', map: 'mistpath', ...point(12, 9) },
];
for (const l of lanterns) {
  LANTERNS.push(l);
  const n: NpcDef = { id: l.id, name: '月光燈籠', sprite: 'lantern_off',
    spots: [{ ...l, when: { flag: l.id }, sprite: 'lantern_on' }, l],
    talk: [{ when: { flag: l.id }, d: 'c2_lantern_lit' }, { d: `light_${l.id}` }] };
  NPCS.push(n);
  DIALOGUES[`light_${l.id}`] = [
    { s: 'narr', t: '月光燈籠亮了。下次可以用它快速移動！', act: [flag(l.id), { type: 'sfx', id: 'ok' }] },
  ];
}

const zone = (col: number, row: number, w: number, h: number) =>
  ({ x: col * TILE, y: row * TILE, w: w * TILE, h: h * TILE });
TRIGGERS.push(
  { id: 'c2_enter', map: 'mistpath', once: 'c2_entered', when: current('c2m1', 'enter'), d: 'c2_enter' },
  { id: 'c2_puffs', map: 'mistpath', once: 'c2_puffs_seen', when: current('c2m2', 'puffs'), d: 'c2_puffs', zone: zone(6, 30, 9, 4) },
  { id: 'c2_trap', map: 'mistpath', once: 'c2_trap_seen', when: { all: [current('c2m3', 'net'), { notFlag: 'c2_hero_netted' }] }, d: 'c2_trap', zone: zone(1, 22, 19, 2) },
  { id: 'c2_arrive', map: 'rootvillage', once: 'c2_arrival_seen', when: current('c2m4', 'arrive'), d: 'c2_arrive' },
  { id: 'c2_valley', map: 'mistpath', once: 'c2_valley_seen', when: current('c2m5', 'valley'), d: 'c2_valley', zone: zone(6, 4, 9, 2) },
  { id: 'c2_home', map: 'rootvillage', once: 'c2_home_seen', when: escort, d: 'c2_home' },
);

const hasDew: Cond = { hasItem: ['shrink_dew', 1] };
const hasCookie: Cond = { hasItem: ['grow_cookie', 1] };
const peaceful: Cond = { flag: 'c2_mistpuffs_peaceful' };

const dialogue: Record<string, Dialogue> = {
  c2_start: [
    { s: 'rock', t: '小豆芽在裡頭？好！我來推！' },
    { s: 'narr', t: '轟隆！巨岩推開倒樹，留出一條小路。', act: [flag('c2_tree_open'), { type: 'shake' }, { type: 'stage' }] },
    { s: 'rock', t: '小心腳下！這袋烤番薯給妳。', act: [{ type: 'item', id: 'sweet_potato', n: 3 }] },
    { s: 'yuanyuan', t: '等等！縮縮露水帶著，說不定會用到！', when: { not: hasDew }, act: [{ type: 'item', id: 'shrink_dew' }] },
    { s: 'yuanyuan', t: '還有長高高餅乾！也帶著吧。', when: { not: hasCookie }, act: [{ type: 'item', id: 'grow_cookie' }] },
    { s: 'yuanyuan', t: '加油！我在這裡等妳。' },
    { s: 'whitecat', t: '我先走。跟緊我喔。' },
    { s: 'system', t: '做溫柔的事，善良值就會變多喵！善良值越高，魔物越願意聽妳說話。',
      when: { notFlag: 'kindness_explained' }, act: [flag('kindness_explained')] },
    { s: 'system', t: '從倒樹的缺口走進去喵！', act: [{ type: 'startQuest', id: 'c2m1' }] },
  ],
  c2_lantern_lit: [{ s: 'system', t: '要用月光燈籠，移動到別的燈籠嗎？', choices: [
    { label: '好，移動！', act: [{ type: 'travel' }] }, { label: '不用了' },
  ] }],
  c2_open_path: [{ s: 'rock', t: '走這條小路！慢慢來，別跌倒喔！' }],
  c2_enter: [
    { s: 'narr', t: '紫霧從樹根間飄過。小白貓就在前頭。' },
    { s: 'whitecat', t: '噓。前面有小小的哭聲。', act: [advance('c2m1', 'enter')] },
  ],
  c2_whitecat_guide: [{ s: 'whitecat', t: '哭聲就在前面。走近一點吧。' }],
  c2_puffs: [
    { s: 'system', t: '霧團子在發抖……也許牠們肚子餓了？試試看用「道具」把食物分給牠們喵。',
      act: [{ type: 'flag', id: 'c2_mistpuffs_peaceful', value: false }, { type: 'battle', encounter: 'c2_mistpuffs' }] },
    { s: 'mistpuff', t: '這邊……沿著樹根走。', when: peaceful, act: [kindness(2)] },
    { s: 'system', t: '牠們跑走了……下次試試看分享吧喵。', when: { not: peaceful } },
    { s: 'narr', t: '林道還往北延伸。', act: [advance('c2m2', 'puffs')] },
  ],
  c2_puff_guide: [{ s: 'mistpuff', t: '前面有一隻黑白貓。妳小心喔。' }],
  c2_pudding_wait: [{ s: 'pudding', t: '別再往前。' }],
  c2_trap: [
    { s: 'pudding', t: '人類，回去！這裡不歡迎妳。' },
    { s: 'narr', t: '唰！{name}踩到網子，被吊了起來！',
      act: [flag('c2_hero_netted'), flag('c2_squirrel_netted'), { type: 'stage', playerLift: 49, at: { ...TRAP, dir: 0 } }, { type: 'shake', ms: 250 }] },
    { s: 'hero', t: '旁邊也有一張網！小松鼠在發抖。', choices: [
      { label: '先幫小松鼠解開', act: [kindness(2)], next: 'c2_untie' },
      { label: '布丁，先放我下來！', next: 'c2_ask_down' },
    ] },
  ],
  c2_ask_down: [
    { s: 'pudding', t: '別亂動。' },
    { s: 'hero', t: '小松鼠，別怕。我先幫妳。', choices: [{ label: '解開小松鼠的網子', next: 'c2_untie' }] },
  ],
  c2_untie: [
    { s: 'narr', t: '{name}伸出手，拉開小松鼠的繩結。',
      act: [{ type: 'flag', id: 'c2_squirrel_netted', value: false }, { type: 'stage' }] },
    { s: 'narr', t: '小松鼠跳下來，跑進樹林。' },
    { s: 'pudding', t: '……哼。隨便妳。',
      act: [{ type: 'flag', id: 'c2_hero_netted', value: false }, { type: 'stage', playerLift: 0 }] },
    { s: 'narr', t: '布丁放下網子，跑進樹林。', act: [
      { type: 'walkOff', npc: 'pudding', x: point(6, 22).x, y: point(6, 22).y, ms: 620 },
      advance('c2m3', 'net'),
    ] },
  ],
  c2_village_locked: [{ s: 'system', t: '先沿著林道去看看，路上好像有人喵。' }],
  c2_arrive: [
    { s: 'gugu', t: '屋頂都掉下來了……我們要住哪裡？' },
    { s: 'chief', t: '剛才地一直搖。大家都平安，還好。' },
    { s: 'gob1', t: '我想回家……' },
    { s: 'rock', t: '我來搬大的！小疊的木板就拜託妳啦！', act: [advance('c2m4', 'arrive')] },
  ],
  c2_rock_planks: [{ s: 'rock', t: '看到木板就點一下！大的留給我！' }],
  c2_rock_follow: [{ s: 'rock', t: '我在這兒！妳慢慢走，我跟得上。' }],
  c2_chief: [{ s: 'chief', t: '累了就來屋前休息。', when: done('c2m4') },
    { s: 'chief', t: '先修這一間吧。大家就有地方歇腳了。', when: { questNotDone: 'c2m4' } }],
  c2_gugu: [{ s: 'gugu', t: '謝謝妳幫我們修屋子。', when: done('c2m4') },
    { s: 'gugu', t: '我在找還能用的木板。', when: { questNotDone: 'c2m4' } }],
  c2_gob1: [{ s: 'gob1', t: '燈亮了！心裡也暖暖的。', when: done('c2m4') },
    { s: 'gob1', t: '屋子還會再搖嗎？', when: { questNotDone: 'c2m4' } }],
  c2_carry_planks: [
    { s: 'narr', t: '{name}把這一疊木板搬到首領家。', act: [advance('c2m4', 'planks')] },
    { s: 'rock', t: '木板齊了！我扶住屋頂，妳幫我遞木板！', when: current('c2m4', 'repair'), act: [{ type: 'sfx', id: 'ok' }] },
    { s: 'chief', t: '修好了！來，點亮屋前的燈。', when: current('c2m4', 'repair'),
      act: [flag('c2_chief_house'), kindness(3), advance('c2m4', 'repair'), { type: 'stage' }] },
    { s: 'gugu', t: '小豆芽常走林道北邊。去岔路北邊找找吧。', when: done('c2m4') },
  ],
  c2_rest: [{ s: 'system', t: '要在這裡休息和存檔嗎？', choices: [
    { label: '休息和存檔', act: [{ type: 'rest' }, { type: 'save' }] }, { label: '繼續走' },
  ] }],
  c2_print_1: [{ s: 'hero', t: '三根腳趾！是小豆芽的腳印。', act: [advance('c2m5', 'print1')] }],
  c2_print_2: [{ s: 'hero', t: '這裡也有。小豆芽往北走了。', act: [advance('c2m5', 'print2')] }],
  c2_print_3: [{ s: 'whitecat', t: '腳印通往前面的空地。那裡是迴聲谷口。', act: [advance('c2m5', 'print3')] }],
  c2_valley: [{ s: 'narr', t: '風從谷底吹上來。有人正在小聲說話。', act: [
    advance('c2m5', 'valley'), { type: 'stage', at: { ...point(10, 5), dir: 1 } },
  ] }],
  c2_find: [
    { s: 'sprout', t: '噓——牠不是壞蛋，牠好痛。' },
    { s: 'sprout', t: '牠叫苔角，是森林裡最老最老的大傢伙。' },
    { s: 'narr', t: '小豆芽餵苔角吃莓果。苔角的角纏著紫色的藤。' },
    { s: 'narr', t: '苔角睜開眼睛，低低吼了一聲。紫霧湧了出來！',
      act: [{ type: 'shake', ms: 850 }, { type: 'fog', x: ANTLER.x, y: ANTLER.y - 45, n: 15 }] },
    { s: 'narr', t: '苔角站起來，慢慢走下山谷。', act: [
      { type: 'walkOff', npc: 'c2_antler', ...point(10, 0), ms: 1400 }, flag('c2_sprout_found'), { type: 'stage' },
    ] },
    { s: 'sprout', t: '牠還會痛嗎？我們先回去告訴大家！', act: [advance('c2m6', 'find')] },
  ],
  c2_sprout_follow: [{ s: 'sprout', t: '莓果還有一顆。下次再帶給苔角！' }],
  c2_sprout_home: [{ s: 'sprout', t: '大家抱得好緊喔！我好想念你們。' }],
  c2_home: [
    { s: 'gugu', t: '小豆芽！你回來了！' },
    { s: 'sprout', t: '我回來了！我有好多話要說。' },
    { s: 'narr', t: '大家抱成一團。屋前又亮了一盞燈。', act: [kindness(3), advance('c2m6', 'home'), { type: 'stage' }] },
    { s: 'system', t: '要怎麼幫苔角呢？在首領家前找薄荷吧喵！' },
  ],
  c2_valley_locked: [{ s: 'narr', t: '藤蔓擋住了路。先帶小豆芽回大樹根村吧。' }],
};

Object.assign(DIALOGUES, dialogue);
