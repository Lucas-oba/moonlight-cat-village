// 奇幻內容 W1（CH1_WHIMSY_PROPOSAL.md，使用者已同意）：
// 圓圓（小倉鼠）、露露（小兔子）、倒轉鐘樓、會說話的花園、變大變小、國語題。
// 他們從哪裡來「先不設定」——台詞裡不要解釋來歷。
import type { MapDef, NpcDef, Dialogue, QuestDef, Cond, PropDef } from './types';
import { MAPS, GLINTS, TRIGGERS, TILE, WONDERS } from './maps';
import { NPCS } from './npcs';
import { DIALOGUES } from './dialogues';
import { QUESTS, QUEST_ORDER } from './quests';
import { ITEMS, STICKERS, STICKER_PAGES } from './items';
import './quiz_zh';
const t = (n: number) => n * TILE;
const wallY = t(2) + 2;
const D: Record<string, Dialogue> = {};
const act = (q: string): Cond => ({ questActive: q });
const done = (q: string): Cond => ({ questDone: q });
const ocur = (q: string, o: string): Cond => ({ objCurrent: [q, o] });
const F = (key: string, x: number, y: number, block?: [number, number], extra: Partial<PropDef> = {}): PropDef => ({ key, x, y, block: block ?? [40, 18], ...extra });

// ---------- 道具 ----------
ITEMS.shrink_dew = { id: 'shrink_dew', name: '縮縮露水', kind: 'key', desc: '圓圓送的小瓶子。站在發光的「奇妙圈圈」裡喝一口，身體就會變小。喝不完喔！' };
ITEMS.grow_cookie = { id: 'grow_cookie', name: '長高高餅乾', kind: 'key', desc: '圓圓送的星星餅乾。站在發光的「奇妙圈圈」裡吃一口，身體就會變大。吃不完喔！' };
ITEMS.clock_gear = { id: 'clock_gear', name: '大鐘的齒輪', kind: 'key', desc: '亮晶晶的銅齒輪。是鐘樓大鐘掉下來的零件。' };

// ---------- 貼紙：新的一頁「奇妙頁」（總數自動往上加） ----------
STICKERS.w_tower = '倒轉鐘樓'; STICKERS.w_garden = '會說話的花園'; STICKERS.w_small = '變小了！'; STICKERS.w_big = '變大了！';
if (!STICKER_PAGES.some(p => p.id === 'wonder')) STICKER_PAGES.push({ id: 'wonder', name: '奇妙頁', ids: ['w_tower', 'w_garden', 'w_small', 'w_big'] });

// ---------- 角色 ----------
NPCS.push(
  { id: 'yuanyuan', name: '圓圓', sprite: 'yuanyuan', portrait: 'yuanyuan_big', giverOf: ['side21'],
    voice: { base: 1250, len: 0.09, type: 'square', bend: 1.5, drop: 1.1, chirps: 3, gap: 0.03, bright: 1.3, vol: 0.6 }, // 吱吱吱：又高又快
    spots: [
      { when: { all: [done('main5'), { not: { any: [act('side21'), done('side21')] } }] }, map: 'village', x: t(11) + 4, y: t(8) + 22 },
      { when: { any: [act('side21'), done('side21')] }, map: 'clock_1', x: t(5) + 16, y: t(4) + 20 },
    ],
    talk: [
      { when: { questAvailable: 'side21' }, d: 'side21_start' },
      { when: ocur('side21', 'fix1'), d: 'side21_fix1_hint' },
      { when: ocur('side21', 'gear'), d: 'side21_gear_hint' },
      { when: ocur('side21', 'clock'), d: 'side21_clock_hint' },
      { when: ocur('side21', 'report'), d: 'side21_report' },
      { when: done('side21'), d: 'yuan_practice' },
      { d: 'yuan_default' },
    ] },
  { id: 'lulu', name: '露露', sprite: 'lulu', portrait: 'lulu_big', giverOf: ['side22'],
    voice: { base: 720, len: 0.22, type: 'sine', bend: 1.12, drop: 0.92, vib: 4, bright: 0.6, vol: 0.45 }, // 小小聲、軟軟的
    spots: [
      { when: { all: [done('side21'), { not: { any: [act('side22'), done('side22')] } }] }, map: 'village', x: t(24), y: t(8) + 24 },
      { when: { any: [act('side22'), done('side22')] }, map: 'garden', x: t(6) + 16, y: t(4) + 24 },
    ],
    talk: [
      { when: { questAvailable: 'side22' }, d: 'side22_start' },
      { when: ocur('side22', 'flowers'), d: 'side22_wait' },
      { when: ocur('side22', 'speak'), d: 'side22_speak' },
      { when: done('side22'), d: 'lulu_practice' },
      { d: 'lulu_default' },
    ] },
);
// 會說話的花（花園裡）
const flower = (id: string, name: string, sprite: string, x: number, y: number, voice: NpcDef['voice']): NpcDef => ({
  id, name, sprite, scale: 1.7, voice, noShadow: true, spots: [{ map: 'garden', x, y }],
  talk: [{ when: { all: [ocur('side22', 'flowers'), { notFlag: 'ok_' + id }] }, d: id + '_quiz' }, { when: done('side22'), d: id + '_after' }, { d: id + '_talk' }] });
NPCS.push(
  flower('f_sun', '驕傲的向日葵', 'w_sunflower', t(2) + 16, t(7) + 10, { base: 330, len: 0.2, type: 'triangle', bend: 1.3, drop: 0.8, chirps: 2, vol: 0.7 }),
  flower('f_tulip', '害羞的鬱金香', 'w_tulip', t(10) + 16, t(7) + 10, { base: 900, len: 0.16, type: 'sine', bend: 1.1, drop: 0.95, vol: 0.4 }),
  flower('f_bell', '愛唱歌的風鈴草', 'w_bell', t(6) + 16, t(10) + 4, { base: 620, len: 0.32, type: 'sine', bend: 1.5, drop: 1.2, vib: 9, chirps: 2, vol: 0.6 }),
);
// 鐘樓一樓：被收倒過來的東西（擺好就換成正的）
const fixable = (id: string, name: string, key: string, x: number, y: number): NpcDef => ({
  id, name, sprite: key + '_ud', noShadow: true,
  spots: [{ when: { notFlag: 'ok_' + id }, map: 'clock_1', x, y, sprite: key + '_ud' }, { when: { flag: 'ok_' + id }, map: 'clock_1', x, y, sprite: key }],
  talk: [{ when: { all: [ocur('side21', 'fix1'), { notFlag: 'ok_' + id }] }, d: 'fix_' + id }, { when: { flag: 'ok_' + id }, d: 'fixed_ok' }, { d: 'upside_down' }] });
NPCS.push(
  fixable('c1_shelf', '倒過來的書架', 'w_shelf', t(2) + 12, wallY + 64),
  fixable('c1_chair', '倒過來的搖椅', 'f_rocker', t(7) + 20, t(4) + 10),
  fixable('c1_plant', '倒過來的盆栽', 'f_plant', t(8) + 4, t(6) + 20),
  { id: 'big_clock', name: '大鐘', sprite: 'w_clock', scale: 1.5, noShadow: true, spots: [{ map: 'clock_3', x: t(5), y: t(3) + 10 }],
    talk: [{ when: ocur('side21', 'clock'), d: 'side21_clock' }, { when: done('side21'), d: 'big_clock_time' }, { d: 'big_clock_back' }] },
);

// ---------- 地圖：倒轉鐘樓（3 層）、會說話的花園 ----------
const back = (tx: number, ty: number) => ({ x: t(tx) + 16, y: t(ty) + 26 });
const vb = back(12, 7);
MAPS.clock_1 = { id: 'clock_1', name: '倒轉鐘樓・一樓', indoor: true, music: 'village', zones: [],
  tiles: ['WWWWWWWWWW', 'WooooooolW', 'WooooooooW', 'WoorrrrooW', 'WoorrrrooW', 'WooooooooW', 'WooooooooW', 'WWWWmWWWWW'],
  props: [F('f_barrel_ud', t(5) + 16, wallY, [28, 16]), F('w_gear', t(4), wallY - 30, undefined, { block: undefined })],
  exits: [{ tx: 4, ty: 7, to: 'village', x: vb.x, y: vb.y, dir: 0 }, { tx: 8, ty: 1, to: 'clock_2', x: t(8) + 16, y: t(5) + 22, dir: 1, up: true }] };
MAPS.clock_2 = { id: 'clock_2', name: '倒轉鐘樓・二樓', indoor: true, music: 'village', zones: [],
  tiles: ['WWWWWWWWWW', 'WloooooooW', 'WooooooooW', 'WooooooooW', 'WooooooooW', 'WooooooooW', 'WWWWWWWWlW'],
  props: [F('w_shelf', t(5), wallY + 8, [56, 18], { scale: 1.6 }), F('f_sacks', t(7) + 16, t(4) + 20, [50, 18], { flipY: true }), F('f_barrel', t(2), t(5) + 10, [28, 16], { flipY: true })],
  exits: [{ tx: 8, ty: 6, to: 'clock_1', x: t(8) + 16, y: t(2) + 20, dir: 0 }, { tx: 1, ty: 1, to: 'clock_3', x: t(2) + 16, y: t(5) + 20, dir: 1, up: true }] };
MAPS.clock_3 = { id: 'clock_3', name: '倒轉鐘樓・頂樓', indoor: true, music: 'village', zones: [],
  tiles: ['WWWWWWWWWW', 'WooooooooW', 'WooooooooW', 'WooooooooW', 'WooooooooW', 'WooooooooW', 'WWlWWWWWWW'],
  props: [{ key: 'w_clock', x: t(5), y: t(3) + 10, block: [60, 24], hidden: true } as PropDef, F('w_gear', t(8), wallY + 4, [30, 14])],
  exits: [{ tx: 2, ty: 6, to: 'clock_2', x: t(1) + 16, y: t(2) + 20, dir: 0 }] };
MAPS.garden = { id: 'garden', name: '會說話的花園', music: 'field', trees: true, zones: [],
  tiles: [
    'TTTTTTTTTTTTT',
    'T...........T',
    'T...........T',
    'T...........T',
    'T...........T',
    'T...........T',
    'T...........T',
    'T...........T',
    'T...........T',
    'T...........T',
    'T...........T',
    'T...........T',
    'T...........T',
    'TTTTTTxTTTTTT',
  ],
  props: [
    F('w_mushflower', t(2), t(3), [40, 14], { scale: 1.6 }), F('w_mushflower', t(11), t(3) + 8, [40, 14], { scale: 1.4, flip: true }),
    F('w_mushflower', t(11) + 6, t(12), [40, 14], { scale: 1.5 }), F('w_mushflower', t(1) + 24, t(12) + 4, [40, 14], { scale: 1.3, flip: true }),
    { key: 'flowerpot', x: t(4), y: t(12) }, { key: 'flowerpot', x: t(9), y: t(12) },
  ],
  exits: [{ tx: 6, ty: 13, to: 'village', x: t(22) + 16, y: t(7) + 28, dir: 0 }] };
// 村子：鐘樓的門（任務開始後才進得去）、花店後面的籬笆小洞（要變小）
const V = MAPS.village;
V.exits.push({ tx: 12, ty: 7, to: 'clock_1', x: t(4) + 16, y: t(6) + 22, dir: 1, up: true, when: { any: [act('side21'), done('side21')] } });
V.props.push({ key: 'w_hedge', x: t(22) + 16, y: t(7) + 4, block: [72, 24] });
V.exits.push({ tx: 22, ty: 7, to: 'garden', x: t(6) + 16, y: t(12) + 8, dir: 1, up: true, needSize: 'small', when: done('side21'), lockedDialogue: 'w_hole' });
// 奇妙圈圈
WONDERS.push(
  { id: 'wc_tower2', map: 'clock_2', x: t(4) + 16, y: t(4) + 8, mode: 'big', area: { x: 0, y: 0, w: t(10), h: t(7) }, when: { any: [act('side21'), done('side21')] } },
  { id: 'wc_hedge', map: 'village', x: t(22) + 16, y: t(8) + 18, mode: 'small', area: { x: t(20), y: t(6), w: t(5), h: t(3) + 16 }, when: done('side21') },
);
TRIGGERS.push({ id: 'w_garden_in', map: 'garden', once: 'seen_garden', d: 'w_garden_in' });
// 高高的齒輪（要變大才搆得到）
GLINTS.push({ id: 'c2_gear', map: 'clock_2', x: t(5), y: t(2) + 30, obs: 0, when: ocur('side21', 'gear'), d: 'c2_gear', needSize: 'big', sizeHint: 'c2_gear_high' });

// ---------- 支線 21、22 ----------
const Q: QuestDef[] = [
  { id: 'side21', kind: 'side', no: 21, title: '奇妙①鐘樓為什麼倒著走？（國語）', giver: 'yuanyuan', summary: '鐘樓裡的大鐘一直倒著走！小倉鼠圓圓說，是她把東西收得亂七八糟……', prereq: ['main5'], ordered: true,
    objectives: [
      { id: 'fix1', type: 'talk', text: '把一樓倒過來的 3 樣東西擺回去', targets: ['c1_shelf', 'c1_chair', 'c1_plant'], count: 3, unique: true },
      { id: 'gear', type: 'inspect', text: '去二樓，站進發光的圈圈變大，拿下書架上的齒輪', targets: ['c2_gear'] },
      { id: 'clock', type: 'event', text: '去頂樓，把齒輪裝回大鐘', marker: ['big_clock'] },
      { id: 'report', type: 'event', text: '回一樓告訴圓圓', marker: ['yuanyuan'] },
    ],
    rewards: { exp: 120, money: 50, items: [{ id: 'shrink_dew', n: 1 }], courage: 1, sticker: 'w_tower' }, rewardText: ['縮縮露水（可以在奇妙圈圈裡變小）'] },
  { id: 'side22', kind: 'side', no: 22, title: '奇妙②露露想說話（自然）', giver: 'lulu', summary: '害羞的小兔子露露，在花園裡說話都沒人聽。陪她一起去！（花園的入口在花店左邊的籬笆）', prereq: ['side21'], ordered: true,
    objectives: [
      { id: 'enter', type: 'reach', text: '在花店左邊籬笆前的圈圈喝縮縮露水變小，從小洞鑽進花園', targets: ['garden'] },
      { id: 'flowers', type: 'talk', text: '回答 3 朵花的問題', targets: ['f_sun', 'f_tulip', 'f_bell'], count: 3, unique: true },
      { id: 'speak', type: 'event', text: '幫露露鼓起勇氣說話', marker: ['lulu'] },
    ],
    rewards: { exp: 150, money: 60, observation: 1, items: [{ id: 'herb_tea', n: 1 }], sticker: 'w_garden' } },
];
for (const q of Q) { QUESTS[q.id] = q; if (!QUEST_ORDER.includes(q.id)) QUEST_ORDER.push(q.id); }

// ---------- 對話 ----------
Object.assign(D, {
  w_need_small: [{ s: 'hero', t: '（地上有一個發光的圈圈……好像要有什麼東西，才能用它。）', think: true }],
  w_need_big: [{ s: 'hero', t: '（地上有一個發光的圈圈……好像要有什麼東西，才能用它。）', think: true }],
  w_toohigh: [{ s: 'hero', t: '（太高了，搆不到……要是能變大就好了。）', think: true }],
  w_toobig: [{ s: 'hero', t: '（太小了，進不去……要是能變小就好了。）', think: true }],
  w_hole: [{ s: 'narr', t: '籬笆下面有一個小小的洞。裡面傳來吱吱喳喳的說話聲……可是洞太小了，鑽不進去。' }],
  // ----- 圓圓 -----
  yuan_default: [{ s: 'yuanyuan', t: '書要排排站，字要寫端端！我是圓圓，最愛整理和看書！' }],
  side21_start: [
    { s: 'yuanyuan', t: '哎呀呀，哎呀呀！鐘樓的大鐘，倒著走啦！' },
    { s: 'hero', t: '倒著走？' },
    { s: 'yuanyuan', t: '我、我昨天幫鐘樓大掃除……結果什麼東西都被我收倒過來了。書架倒了、椅子倒了，連大鐘的齒輪都不見了！' },
    { s: 'yuanyuan', t: '妳可以幫我把東西擺回去嗎？每擺一樣，我就考妳一題國語——押韻押韻，答對就行！', choices: [
      { label: '好，我來幫妳！', act: [{ type: 'startQuest', id: 'side21' }, { type: 'item', id: 'grow_cookie' }] },
      { label: '等一下喔', next: 'later' }] },
    { s: 'yuanyuan', t: '太好了！這塊「長高高餅乾」先給妳。二樓地上有發光的圈圈，站進去吃一口，就會變大喔！' },
    { s: 'yuanyuan', t: '鐘樓的門就在我後面，往上走就進得去！' },
  ],
  side21_fix1_hint: [{ s: 'yuanyuan', t: '書架、搖椅、盆栽……都倒過來了。去點點看它們吧！' }],
  side21_gear_hint: [{ s: 'yuanyuan', t: '齒輪呀，被我放到二樓書架的最上面了……太高了我拿不到。妳吃了長高高餅乾一定拿得到！' }],
  side21_clock_hint: [{ s: 'yuanyuan', t: '拿到齒輪了！快去頂樓，裝回大鐘裡面吧！' }],
  side21_report: [
    { s: 'yuanyuan', t: '滴答、滴答……大鐘正著走了！謝謝妳！' },
    { s: 'yuanyuan', t: '其實……東西是我收錯的。我本來不敢說，怕大家笑我。' },
    { s: 'hero', t: '承認自己做錯，也是一種勇氣喔！' },
    { s: 'yuanyuan', t: '嗯！說出來以後，心裡輕飄飄的！這瓶「縮縮露水」送給妳——站在圈圈裡喝一口，就會變小喔！', act: [{ type: 'obj', quest: 'side21', obj: 'report' }] },
    { s: 'yuanyuan', t: '對了，花店旁邊的籬笆前面，也有一個圈圈。聽說籬笆後面，有一座會說話的花園呢！' },
  ],
  yuan_practice: [{ s: 'yuanyuan', t: '要不要再來一題國語？答對有獎勵喔！', choices: [
    { label: '好！', act: [{ type: 'quiz', subject: 'chinese', tier: 2, n: 2, by: 'yuanyuan', title: '圓圓的國語小教室' }, { type: 'exp', n: 10 }] },
    { label: '下次再說', act: [] }] }],
  upside_down: [{ s: 'narr', t: '東西被收得倒過來了。看起來好奇怪……' }],
  fixed_ok: [{ s: 'narr', t: '已經擺得好好的了。' }],
  fix_c1_shelf: [
    { s: 'narr', t: '書架整個倒過來了，書都要掉下來了！' },
    { s: 'yuanyuan', t: '擺回去之前，先考一題！', act: [{ type: 'quiz', subject: 'chinese', tier: 1, n: 1, by: 'yuanyuan', title: '圓圓的國語題' }] },
    { s: 'narr', t: '{name}把書架翻回來，書一本一本排好了！', act: [{ type: 'flag', id: 'ok_c1_shelf' }, { type: 'sfx', id: 'chime' }] },
  ],
  fix_c1_chair: [
    { s: 'narr', t: '搖椅四腳朝天，還在慢慢搖……' },
    { s: 'yuanyuan', t: '再考一題！', act: [{ type: 'quiz', subject: 'chinese', tier: 1, n: 1, by: 'yuanyuan', title: '圓圓的國語題' }] },
    { s: 'narr', t: '嘿咻！搖椅翻回來了！', act: [{ type: 'flag', id: 'ok_c1_chair' }, { type: 'sfx', id: 'chime' }] },
  ],
  fix_c1_plant: [
    { s: 'narr', t: '盆栽倒立著，葉子垂在地上。' },
    { s: 'yuanyuan', t: '最後一題！', act: [{ type: 'quiz', subject: 'chinese', tier: 1, n: 1, by: 'yuanyuan', title: '圓圓的國語題' }] },
    { s: 'narr', t: '盆栽站好了，葉子開心地抖了抖！', act: [{ type: 'flag', id: 'ok_c1_plant' }, { type: 'sfx', id: 'chime' }] },
    { s: 'yuanyuan', t: '一樓整齊啦！接下來是二樓的齒輪——梯子在右上角喔！' },
  ],
  c2_gear_high: [{ s: 'narr', t: '書架最上面，有一個亮晶晶的齒輪。太高了，踮腳也搆不到……' }, { s: 'hero', t: '（地上那個發光的圈圈……吃一口長高高餅乾試試看！）', think: true }],
  c2_gear: [{ s: 'narr', t: '變大的{name}，輕輕鬆鬆就拿到了書架上的齒輪！', act: [{ type: 'item', id: 'clock_gear' }] }, { s: 'hero', t: '拿到了！去頂樓裝回大鐘吧。' }],
  side21_clock: [
    { s: 'narr', t: '大鐘的指針，滴答……答滴……一直往反方向轉。' },
    { s: 'narr', t: '齒輪的洞旁邊，刻著兩道題目。要答對才裝得進去！', act: [{ type: 'quiz', subject: 'chinese', tier: 2, n: 2, by: 'yuanyuan', title: '大鐘的國語題' }] },
    { s: 'narr', t: '{name}把齒輪裝回去……喀嚓！', act: [{ type: 'take', id: 'clock_gear' }, { type: 'shake', ms: 300 }] },
    { s: 'narr', t: '滴答、滴答——大鐘正著走了！噹——噹——鐘聲傳遍了整個月光貓村。', act: [{ type: 'sfx', id: 'chime' }, { type: 'obj', quest: 'side21', obj: 'clock' }] },
  ],
  big_clock_back: [{ s: 'narr', t: '大鐘滴答滴答地走著。' }],
  big_clock_time: [{ s: 'narr', t: '大鐘正正地走著。旁邊有一根小小的拉桿，可以把時間轉快一點。', choices: [
    { label: '轉到晚上', when: { time: 'day' } as any, act: [{ type: 'time', v: 'night' }] },
    { label: '轉到早上', when: { time: 'night' } as any, act: [{ type: 'time', v: 'day' }] },
    { label: '不用了', act: [] }] }],
  // ----- 露露 -----
  lulu_default: [{ s: 'lulu', t: '（小小聲）……你、你好……' }],
  side22_start: [
    { s: 'narr', t: '籬笆旁邊，有一隻小兔子，耳朵整個蓋住了臉。' },
    { s: 'lulu', t: '（小小聲）……那、那個……我叫露露……' },
    { s: 'lulu', t: '籬笆後面，有一座會說話的花園。我每天都去澆水……可是花兒們好吵，我一說話，就沒有人聽見……' },
    { s: 'lulu', t: '妳……可以陪我進去嗎？', choices: [
      { label: '好，我陪妳！', act: [{ type: 'startQuest', id: 'side22' }] },
      { label: '等一下喔', next: 'later' }] },
    { s: 'lulu', t: '謝、謝謝……籬笆下面有個小洞。站到旁邊發光的圈圈裡，喝一口縮縮露水，就鑽得進去了……' },
  ],
  side22_wait: [{ s: 'lulu', t: '（小小聲）花兒們都想考考妳……三朵都去聊聊看吧……' }],
  side22_speak: [
    { s: 'narr', t: '花兒們又開始吱吱喳喳地吵起來了。露露的耳朵抖個不停。' },
    { s: 'lulu', t: '我、我想跟大家說……可是我好怕……' },
    { s: 'hero', t: '要跟露露說什麼呢？', choices: [
      { label: '「害怕也沒關係，我在旁邊陪妳！」', act: [] },
      { label: '「妳很懂植物，大家一定想聽！」', act: [] }] },
    { s: 'lulu', t: '……嗯！', act: [{ type: 'shake', ms: 200 }] },
    { s: 'lulu', t: '大家好！我是露露！請、請聽我說！' },
    { s: 'f_sun', t: '……哇。原來露露的聲音，這麼好聽。' },
    { s: 'f_bell', t: '♪ 露露說話，我們聽～ ♪' },
    { s: 'lulu', t: '我想說……每天早上我都會來澆水。你們想要多一點陽光的話，可以告訴我喔！' },
    { s: 'f_tulip', t: '（小小聲）……謝謝妳，露露。' },
    { s: 'lulu', t: '我做到了……！謝謝妳，{name}。原來勇氣，就是怕怕的時候，還是說出來！', act: [{ type: 'obj', quest: 'side22', obj: 'speak' }] },
  ],
  lulu_practice: [{ s: 'lulu', t: '要、要不要一起認識植物和大自然？', choices: [
    { label: '好！', act: [{ type: 'quiz', subject: 'science', tier: 2, n: 2, by: 'lulu', title: '露露的自然小教室' }, { type: 'exp', n: 10 }] },
    { label: '下次再說', act: [] }] }],
  // ----- 花 -----
  f_sun_talk: [{ s: 'f_sun', t: '我是花園裡最高、最亮的花！太陽公公最喜歡我了！' }],
  f_sun_quiz: [
    { s: 'f_sun', t: '哼哼，小不點！想跟我說話？先回答我的問題！', act: [{ type: 'quiz', subject: 'science', tier: 1, n: 1, by: 'f_sun', title: '向日葵的問題' }] },
    { s: 'f_sun', t: '……答對了？嗯，妳還不錯嘛！', act: [{ type: 'flag', id: 'ok_f_sun' }] },
  ],
  f_sun_after: [{ s: 'f_sun', t: '露露說話的時候，我會安靜聽的。……我只是太大聲了啦。' }],
  f_tulip_talk: [{ s: 'f_tulip', t: '（用葉子遮住臉）……不要看我……' }],
  f_tulip_quiz: [
    { s: 'f_tulip', t: '（小小聲）……我、我也有一題……', act: [{ type: 'quiz', subject: 'science', tier: 1, n: 1, by: 'f_tulip', title: '鬱金香的問題' }] },
    { s: 'f_tulip', t: '……妳好厲害。', act: [{ type: 'flag', id: 'ok_f_tulip' }] },
  ],
  f_tulip_after: [{ s: 'f_tulip', t: '露露跟我一樣害羞……可是她好勇敢。我也想試試看。' }],
  f_bell_talk: [{ s: 'f_bell', t: '♪ 叮鈴～叮鈴～花園裡的歌，唱給你聽～ ♪' }],
  f_bell_quiz: [
    { s: 'f_bell', t: '♪ 答對問題，我就唱一首歌給你聽～ ♪', act: [{ type: 'quiz', subject: 'science', tier: 2, n: 1, by: 'f_bell', title: '風鈴草的問題' }] },
    { s: 'f_bell', t: '♪ 答對啦～答對啦～叮鈴叮鈴噹～ ♪', act: [{ type: 'flag', id: 'ok_f_bell' }] },
  ],
  f_bell_after: [{ s: 'f_bell', t: '♪ 露露說話，我們聽～ 這首歌是我新寫的喔！ ♪' }],
  w_garden_in: [{ s: 'narr', t: '鑽過小洞——哇！花朵們都好大好大，比房子還高！' }, { s: 'f_sun', t: '咦？有個小不點跑進來了！' }],
});
Object.assign(DIALOGUES, D);
