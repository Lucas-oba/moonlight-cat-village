// Milestone D：可以走進去的房子（CHAPTER1.md 二-1 地點）、白天／夜晚切換、下雨天（只影響小事件和貼紙）、貓咪合唱團。
// 村民都還是站在村子裡（不影響任務），屋子裡是家具和小對話。
import type { MapDef, NpcDef, Dialogue, PropDef, Cond } from './types';
import { MAPS, GLINTS, TRIGGERS, TILE } from './maps';
import { NPCS } from './npcs';
import { DIALOGUES } from './dialogues';
import { STICKER_PAGES, STICKERS } from './items';
const t = (n: number) => n * TILE;
const doorBack = (tx: number, ty: number) => ({ x: t(tx) + 16, y: t(ty) + 26 });

// 小房間的地圖：W 牆、o 木地板、r 地毯、m 門口地墊、l 梯子
function room(id: string, name: string, tiles: string[], props: PropDef[], back: { tx: number; ty: number }, extra: Partial<MapDef> = {}): MapDef {
  const h = tiles.length; const mx = tiles[h - 1].indexOf('m'); const b = doorBack(back.tx, back.ty);
  return { id, name, indoor: true, music: 'village', tiles, props, zones: [], ...extra,
    exits: [{ tx: mx, ty: h - 1, to: 'village', x: b.x, y: b.y, dir: 0 }, ...(extra.exits ?? [])] };
}
const R8 = (rug = false) => [
  'WWWWWWWWWW',
  'WooooooooW',
  rug ? 'WoorrrrooW' : 'WooooooooW',
  rug ? 'WoorrrrooW' : 'WooooooooW',
  rug ? 'WoorrrrooW' : 'WooooooooW',
  'WooooooooW',
  'WooooooooW',
  'WWWWmWWWWW',
];
// 家具：放在上面那面牆前面（y = 第 2 格的上緣附近）
const wallY = t(2) + 2;
const F = (key: string, x: number, y: number, block?: [number, number]): PropDef => ({ key, x, y, block: block ?? [40, 18] });
const ROOMS: MapDef[] = [
  room('elder_home', '長老之家', R8(true), [
    F('f_shelf', t(2), wallY, [44, 18]), F('f_shelf', t(3) + 24, wallY, [44, 18]), F('f_fireplace', t(7), wallY, [60, 20]),
    F('f_rocker', t(7) + 20, t(4) + 8, [24, 14]), F('f_plant', t(1) + 14, t(6) + 20, [20, 12]), F('f_table', t(5), t(4) + 20, [60, 16]),
  ], { tx: 5, ty: 5 }),
  room('inn_in', '旅店', [
    'WWWWWWWWWWWW',
    'WooooooooolW',
    'WooooooooooW',
    'WooooooooooW',
    'WooorrrroooW',
    'WooorrrroooW',
    'WooooooooooW',
    'WooooooooooW',
    'WWWWWmWWWWWW',
  ], [
    F('f_stove', t(2), wallY, [60, 18]), F('f_shelf', t(4), wallY, [44, 18]), F('f_barrel', t(6), wallY - 2, [28, 16]), F('f_barrel', t(7) - 2, wallY + 4, [28, 16]),
    F('f_counter', t(2) + 8, t(5) + 8, [70, 20]), F('f_table', t(6), t(5) + 12, [60, 16]), F('f_table', t(9), t(7) + 12, [60, 16]), F('f_plant', t(10) + 16, t(4) + 4, [20, 12]),
  ], { tx: 3, ty: 12 }, { exits: [{ tx: 10, ty: 1, to: 'inn_2f', x: t(4) + 16, y: t(5) + 20, dir: 1, up: true }] }),
  { id: 'inn_2f', name: '旅店二樓', indoor: true, music: 'village', zones: [],
    tiles: [
      'WWWWWWWWWW',
      'WooooooooW',
      'WoooorrooW',
      'WoooorrooW',
      'WooooooooW',
      'WooooooooW',
      'WWWWlWWWWW',
    ],
    props: [F('f_cupboard', t(6) + 8, wallY, [44, 18]), F('f_plant', t(8) + 12, wallY - 2, [20, 12]), F('f_rocker', t(7) + 16, t(4) + 20, [24, 14]),
      { key: 'f_bed', x: t(2) + 8, y: t(3) + 30, block: [64, 40], hidden: true } as PropDef],
    exits: [{ tx: 4, ty: 6, to: 'inn_in', x: t(10) + 16, y: t(2) + 20, dir: 0 }] },
  room('shop_in', '雜貨店', R8(), [
    F('f_shelf', t(2), wallY, [44, 18]), F('f_cupboard', t(4), wallY, [44, 18]), F('f_sacks', t(7), wallY + 4, [50, 18]),
    F('f_barrel', t(8) + 12, t(5) + 10, [28, 16]), F('f_barrel', t(1) + 16, t(5) + 10, [28, 16]),
    { key: 'f_counter', x: t(4) + 16, y: t(4) + 12, block: [72, 20], hidden: true } as PropDef,
  ], { tx: 19, ty: 12 }),
  room('smithy_in', '鐵匠鋪', R8(), [
    { key: 'f_anvil', x: t(3), y: wallY + 8, block: [66, 22], hidden: true } as PropDef, F('f_shelf', t(6), wallY, [44, 18]), F('f_barrel', t(8), wallY, [28, 16]),
    F('f_sacks', t(8), t(5) + 20, [50, 18]), F('f_table', t(3), t(5) + 12, [60, 16]),
  ], { tx: 26, ty: 27 }),
  room('herb_in', '草藥店', R8(), [
    { key: 'f_herbs', x: t(3), y: wallY + 4, block: [62, 18], hidden: true } as PropDef, F('f_cupboard', t(6) + 8, wallY, [44, 18]), F('f_plant', t(8) + 12, wallY, [20, 12]),
    F('f_plant', t(1) + 14, t(6) + 20, [20, 12]), F('f_table', t(6), t(5) + 12, [60, 16]),
  ], { tx: 4, ty: 27 }),
  room('flower_in', '花店', R8(true), [
    { key: 'f_flowers', x: t(3), y: wallY + 4, block: [60, 18], hidden: true } as PropDef, F('f_flowers', t(6) + 8, wallY + 4, [60, 18]),
    F('f_plant', t(1) + 14, t(6) + 20, [20, 12]), F('f_plant', t(8) + 18, t(6) + 20, [20, 12]), F('f_counter', t(7) + 8, t(4) + 20, [70, 20]),
  ], { tx: 26, ty: 8 }),
  room('weave_in', '編織店', R8(true), [
    { key: 'f_loom', x: t(3), y: wallY + 8, block: [60, 20], hidden: true } as PropDef, F('f_shelf', t(6), wallY, [44, 18]), F('f_cupboard', t(8), wallY, [44, 18]),
    F('f_rocker', t(7) + 8, t(4) + 20, [24, 14]), F('f_plant', t(1) + 14, t(6) + 20, [20, 12]),
  ], { tx: 26, ty: 18 }),
  room('mochi_home', '麻糬媽媽家', R8(true), [
    F('f_bed', t(2) + 8, t(3) - 2, [64, 34]), F('f_fireplace', t(6) + 8, wallY, [60, 20]), F('f_plant', t(8) + 14, wallY, [20, 12]),
    F('f_table', t(6) + 16, t(5) + 20, [60, 16]), { key: 'letter', x: t(4) + 16, y: t(1) + 2 } as PropDef,
  ], { tx: 17, ty: 27 }),
];
for (const m of ROOMS) MAPS[m.id] = m;

// 村子的門：要「往上走」碰到門才會進去，從旁邊走過不會誤入
const DOORS: [number, number, string, number][] = [
  [5, 5, 'elder_home', 4], [3, 12, 'inn_in', 5], [19, 12, 'shop_in', 4], [26, 27, 'smithy_in', 4],
  [4, 27, 'herb_in', 4], [26, 8, 'flower_in', 4], [26, 18, 'weave_in', 4], [17, 27, 'mochi_home', 4],
];
const village = MAPS.village;
for (const [tx, ty, to, mx] of DOORS) {
  const h = MAPS[to].tiles.length;
  village.exits.push({ tx, ty, to, x: t(mx) + 16, y: t(h - 2) + 22, dir: 1, up: true });
}
// 老風車也一樣（以前是一走到就進去）
const mill = village.exits.find(e => e.to === 'windmill'); if (mill) mill.up = true;
// 棉花原本站在花店門口，往旁邊挪一格，讓門可以走進去
const cotton = NPCS.find(n => n.id === 'cotton'); if (cotton) cotton.spots.forEach(sp => { if (sp.map === 'village' && sp.x === t(26) + 16) sp.x = t(27) + 20; });

// ---- 老風車：真正的室內（木地板、稻草堆有蝙蝠、梯子通往頂樓） ----
const wm = MAPS.windmill;
wm.indoor = true;
wm.tiles = [
  'WWWWWWWWWWW',
  'WoooolooooW',
  'WoooooooooW',
  'WooyyoyyooW',
  'WooyyoyyooW',
  'WoooooooooW',
  'WooyyoyyooW',
  'WooyyoyyooW',
  'WoooooooooW',
  'WoooooooooW',
  'WoooooooooW',
  'WWWWWmWWWWW',
];
wm.props = [...wm.props, F('f_sacks', t(2) + 8, t(10) + 12, [50, 18]), F('f_barrel', t(9) + 8, t(6) + 4, [28, 16])];

// ---- 長老家的書架後面：舊預言書頁（原本放在村子裡長老家外面） ----
const pro = GLINTS.find(g => g.id === 'prophecy'); if (pro) { pro.map = 'elder_home'; pro.x = t(2) + 4; pro.y = t(2) + 10; }

// ---- 可以點的家具 ----
const furn = (id: string, name: string, map: string, sprite: string, x: number, y: number, talk: NpcDef['talk']): NpcDef => ({ id, name, sprite, noShadow: true, spots: [{ map, x, y }], talk });
const rested: Cond = { questDone: 'main5' };
NPCS.push(
  furn('inn_bed', '小床', 'inn_2f', 'f_bed', t(2) + 8, t(3) + 30, [{ d: 'inn_bed' }]),
  furn('shop_counter', '雜貨店的櫃台', 'shop_in', 'f_counter', t(4) + 16, t(4) + 12, [{ d: 'shop_counter' }]),
  furn('smith_anvil', '鐵砧', 'smithy_in', 'f_anvil', t(3), wallY + 8, [{ d: 'smith_anvil' }]),
  furn('herb_shelf', '草藥架', 'herb_in', 'f_herbs', t(3), wallY + 4, [{ d: 'herb_shelf' }]),
  furn('flower_bucket', '花桶', 'flower_in', 'f_flowers', t(3), wallY + 4, [{ d: 'flower_bucket' }]),
  furn('loom', '織布機', 'weave_in', 'f_loom', t(3), wallY + 8, [{ d: 'loom' }]),
  furn('douhua_pic', '牆上的畫', 'mochi_home', 'letter', t(4) + 16, t(1) + 2, [{ d: 'douhua_pic' }]),
);
// letter 只是拿來當作「牆上的畫」被點的位置；畫面上的道具已經在 props 裡
MAPS.mochi_home.props = MAPS.mochi_home.props.filter(p => p.key !== 'letter');

const sleepChoices = [
  { label: '睡午覺，睡到晚上', when: { all: [rested, { time: 'day' as const }] }, act: [{ type: 'sleep' as const, to: 'night' as const }] },
  { label: '睡覺，睡到隔天早上', when: { all: [rested, { time: 'night' as const }] }, act: [{ type: 'sleep' as const, to: 'day' as const }] },
];
const D: Record<string, Dialogue> = {
  inn_bed: [{ s: 'narr', t: '二樓的小房間，是{name}住的地方。棉被軟軟的。要睡一下嗎？（會存檔）', choices: [...sleepChoices, { label: '先不要' }] }],
  shop_counter: [{ s: 'narr', t: '雜貨店的櫃台。招財老闆都在外面的小攤子做生意，這裡放的是要補貨的東西。' }],
  smith_anvil: [{ s: 'narr', t: '大大的鐵砧和爐子。爐子裡的火暖烘烘的。' }],
  herb_shelf: [{ s: 'narr', t: '一罐一罐的草藥，還有吊起來晒乾的藥草。聞起來涼涼的。' }],
  flower_bucket: [{ s: 'narr', t: '桶子裡插滿了花。好香喔！' }],
  loom: [{ s: 'narr', t: '編織奶奶的織布機，上面有一條彩色的布，還沒有織完。' }],
  douhua_pic: [{ s: 'narr', t: '牆上貼著豆花畫的畫，歪歪的，但是很可愛。' }],
  // 下雨天
  rain_start: [
    { s: 'narr', t: '滴答、滴答……下雨了！貓咪們都躲到屋簷下面了。' },
    { s: 'system', t: '下雨天會有不一樣的小事件喔。去村子裡逛逛看喵！' },
  ],
  rain_toast: [
    { s: 'toast', t: '下雨了耶！我有兩把傘，這一把借給剛剛路過的小貓。' },
    { s: 'toast', t: '……我自己淋一點雨沒關係啦。麵包放在屋簷下就好。' },
    { s: 'narr', t: '吐司笑嘻嘻的，尾巴都濕了。', act: [{ type: 'flag', id: 'rain_toast' }, { type: 'sticker', id: 'rain_day' }] },
  ],
  rain_toast2: [{ s: 'toast', t: '雨快停了吧？傘會還回來的，沒關係！' }],
  rain_merchant: [{ s: 'merchant', t: '喵嗚，下雨天客人好少……毛都濕掉了啦！' }],
  rain_guard: [{ s: 'guard', t: '下雨也要站崗！……可是鬍子濕濕的，好癢。' }],
  rain_farmer: [{ s: 'farmer', t: '下雨好啊，菜會長得快。……可是我的毛會扁掉。' }],
  rain_cotton: [{ s: 'cotton', t: '花喝到雨水，好開心的樣子。我躲在屋簷下就好。' }],
  rain_mochimom: [{ s: 'mochimom', t: '豆花在家裡畫畫。下雨天不要跑出去喔！' }],
  rain_ginkgo: [{ s: 'ginkgo', t: '下雨天，草藥要收進來。來，幫婆婆一下……好了，謝謝。' }],
  // 貓咪合唱團（夜晚、支線 8 後，在廣場）
  choir: [
    { s: 'narr', t: '廣場上，蝙蝠怪和小雷、阿福在一起唱歌！' },
    { s: 'bat', t: '啦～啦～啦～月亮好圓～', meow: '啦～啦～啦～' },
    { s: 'narr', t: '{name}也跟著一起唱。月光下的歌聲，好好聽。', when: { notFlag: 'choir_seen' }, act: [{ type: 'flag', id: 'choir_seen' }, { type: 'sticker', id: 'plaza_night' }] },
  ],
};
Object.assign(DIALOGUES, D);
// 旅店老闆娘：也可以選擇睡到晚上／早上
for (const k of ['inn_default', 'main5_inn']) {
  const ln = DIALOGUES[k]?.find(l => l.choices); if (ln?.choices) ln.choices.splice(1, 0, ...sleepChoices);
}
// 下雨天的對話（放在「平常的話」前面；吐司的雨傘只有第一次會優先）
const RAIN: Cond = { weather: 'rain' };
const toast = NPCS.find(n => n.id === 'toast');
if (toast) { toast.talk.unshift({ when: { all: [RAIN, { notFlag: 'rain_toast' }] }, d: 'rain_toast' }); toast.talk.splice(toast.talk.length - 1, 0, { when: RAIN, d: 'rain_toast2' }); }
for (const id of ['merchant', 'guard', 'farmer', 'cotton', 'mochimom', 'ginkgo']) {
  const n = NPCS.find(x => x.id === id); if (n) n.talk.splice(n.talk.length - 1, 0, { when: RAIN, d: 'rain_' + id });
}
TRIGGERS.push({ id: 'rain_start', map: 'village', when: RAIN, once: 'seen_rain', d: 'rain_start' });
// 合唱團的蝙蝠
NPCS.push({ id: 'choir_bat', name: '蝙蝠怪', sprite: 'bat', bob: true, spots: [{ when: { all: [{ questDone: 'side8' }, { time: 'night' }] }, map: 'village', x: t(12) + 20, y: t(13) + 22 }, { map: 'village', x: 0, y: 0, hidden: true }], talk: [{ d: 'choir' }] });

// 貼紙：「晚上的廣場」改成文件裡的「月下合唱」；新增「雨天」
STICKERS.plaza_night = '月下合唱';
STICKERS.rain_day = '雨天';
const scene = STICKER_PAGES.find(p => p.id === 'scene'); if (scene && !scene.ids.includes('rain_day')) scene.ids.push('rain_day');
// 長老說書：文件寫的是勇氣值 +1（不送貼紙），貼紙改由合唱團給
for (const l of DIALOGUES.elder_story ?? []) if (l.act) l.act = l.act.filter(a => !(a.type === 'sticker' && a.id === 'plaza_night'));
