// 奇幻內容 W2（CH1_WHIMSY_PROPOSAL.md，使用者已同意）：
// 捲捲（小松鼠）的下午茶會、顛倒小徑、兩種自創魔物（茶杯蝸牛、倒立菇）、數學和英文題。
// 捲捲他們從哪裡來「先不設定」——台詞裡不要解釋來歷。
import type { Dialogue, QuestDef, Cond, Action, PropDef } from './types';
import { MAPS, GLINTS, TRIGGERS, TILE, WONDERS } from './maps';
import { NPCS } from './npcs';
import { DIALOGUES } from './dialogues';
import { QUESTS, QUEST_ORDER } from './quests';
import { ITEMS, STICKERS, STICKER_PAGES } from './items';
import { ENEMIES, ENCOUNTERS } from './enemies';
import { QUIZ, type QuizQ } from './quiz';
const t = (n: number) => n * TILE;
const D: Record<string, Dialogue> = {};
const act = (q: string): Cond => ({ questActive: q });
const done = (q: string): Cond => ({ questDone: q });
const ocur = (q: string, o: string): Cond => ({ objCurrent: [q, o] });
const daily = (id: string): Cond => ({ notFlag: 'daily_' + id });
const markDaily = (id: string): Action => ({ type: 'flag', id: 'daily_' + id });
const P = (key: string, x: number, y: number, extra: Partial<PropDef> = {}): PropDef => ({ key, x, y, ...extra });

// ---------- 題目：茶會的數學、英文（台灣國小三～五年級；answer 一律是第 0 個） ----------
const W: QuizQ[] = [
  { id: 'wm01', subject: 'math', grade: 3, tier: 1, q: '茶會桌上排了 4 排杯子，每排 6 個。一共有幾個杯子？', choices: ['24 個', '10 個', '20 個', '28 個'], answer: 0, hint: '4 排，每排 6 個，就是 6 ＋ 6 ＋ 6 ＋ 6，也可以用乘法喔。', explain: '4 × 6 ＝ 24，一共 24 個杯子。' },
  { id: 'wm02', subject: 'math', grade: 3, tier: 1, q: '捲捲有 30 塊小餅乾，要平分給 5 位客人。每位分到幾塊？', choices: ['6 塊', '5 塊', '7 塊', '25 塊'], answer: 0, hint: '平分就是用除法：30 ÷ 5 ＝ ？', explain: '30 ÷ 5 ＝ 6，每位客人分到 6 塊。' },
  { id: 'wm03', subject: 'math', grade: 3, tier: 1, q: '茶壺裡有 1000 毫升的茶，倒出 350 毫升。還剩下多少毫升？', choices: ['650 毫升', '750 毫升', '550 毫升', '1350 毫升'], answer: 0, hint: '倒出去會變少，要用減法：1000 － 350。', explain: '1000 － 350 ＝ 650，還剩 650 毫升。' },
  { id: 'wm04', subject: 'math', grade: 4, tier: 2, q: '一個蛋糕切成 8 片一樣大，吃掉 3 片。吃掉的是整個蛋糕的幾分之幾？', choices: ['八分之三', '八分之五', '五分之三', '三分之一'], answer: 0, hint: '一共切成幾片？那個數字放在分母（下面）。吃掉的片數放在分子（上面）。', explain: '全部 8 片，吃掉 3 片，就是八分之三（3/8）。' },
  { id: 'wm05', subject: 'math', grade: 3, tier: 2, q: '茶會 3 點 30 分開始，喝了 45 分鐘。幾點幾分結束？', choices: ['4 點 15 分', '4 點 5 分', '4 點 45 分', '3 點 75 分'], answer: 0, hint: '3 點 30 分再過 30 分鐘是 4 點，還要再加幾分鐘？', explain: '3:30 過 30 分鐘是 4:00，再過 15 分鐘是 4 點 15 分。' },
  { id: 'wm06', subject: 'math', grade: 3, tier: 2, q: '一盒方糖有 4 排，每排 8 顆。用掉 13 顆以後，還剩幾顆？', choices: ['19 顆', '21 顆', '17 顆', '45 顆'], answer: 0, hint: '先算一盒有幾顆（4 × 8），再減掉用掉的 13 顆。', explain: '4 × 8 ＝ 32，32 － 13 ＝ 19，還剩 19 顆。' },
  { id: 'wm07', subject: 'math', grade: 5, tier: 3, q: '一壺茶有 1.5 公升，平分倒成 6 杯。每杯是幾公升？', choices: ['0.25 公升', '0.2 公升', '0.3 公升', '2.5 公升'], answer: 0, hint: '1.5 公升 ＝ 1500 毫升。1500 ÷ 6 ＝ ？毫升，再換回公升。', explain: '1500 ÷ 6 ＝ 250 毫升 ＝ 0.25 公升。' },
  { id: 'wm08', subject: 'math', grade: 4, tier: 3, q: '長方形的桌布，長 3 公尺、寬 2 公尺。桌布的面積是幾平方公尺？', choices: ['6 平方公尺', '10 平方公尺', '5 平方公尺', '12 平方公尺'], answer: 0, hint: '長方形面積 ＝ 長 × 寬。（10 是繞一圈的周長喔！）', explain: '3 × 2 ＝ 6，面積是 6 平方公尺。' },
  { id: 'we01', subject: 'english', grade: 3, tier: 1, q: '「cup」是什麼？', choices: ['杯子', '盤子', '湯匙', '帽子'], answer: 0, hint: '喝茶的時候，茶要倒進哪裡？', explain: 'cup ＝ 杯子。a cup of tea ＝ 一杯茶。' },
  { id: 'we02', subject: 'english', grade: 3, tier: 1, q: '「茶」的英文是哪一個？', choices: ['tea', 'milk', 'cake', 'juice'], answer: 0, hint: '它的念法很像中文的「踢」。', explain: 'tea ＝ 茶。milk 是牛奶，cake 是蛋糕，juice 是果汁。' },
  { id: 'we03', subject: 'english', grade: 3, tier: 1, q: '「cake」是什麼？', choices: ['蛋糕', '餅乾', '麵包', '糖果'], answer: 0, hint: '生日的時候會插蠟燭的那個！', explain: 'cake ＝ 蛋糕。birthday cake ＝ 生日蛋糕。' },
  { id: 'we04', subject: 'english', grade: 3, tier: 1, q: '「spoon」是什麼？', choices: ['湯匙', '叉子', '刀子', '杯子'], answer: 0, hint: '喝湯、攪拌紅茶的時候會用到它。', explain: 'spoon ＝ 湯匙。叉子是 fork，刀子是 knife。' },
  { id: 'we05', subject: 'english', grade: 3, tier: 1, q: '「milk」是什麼？', choices: ['牛奶', '果汁', '水', '茶'], answer: 0, hint: '白白的，是乳牛給我們的飲料。', explain: 'milk ＝ 牛奶。' },
  { id: 'we06', subject: 'english', grade: 4, tier: 2, q: '「Would you like some tea?」是什麼意思？', choices: ['你想要喝一點茶嗎？', '我喜歡喝茶。', '茶好燙喔！', '這是誰的茶？'], answer: 0, hint: '「Would you like…?」是很有禮貌地問別人「你想要……嗎？」', explain: 'Would you like some tea? ＝ 你想要喝一點茶嗎？可以回答 Yes, please.' },
  { id: 'we07', subject: 'english', grade: 4, tier: 2, q: '「How many cups?」是在問什麼？', choices: ['有幾個杯子？', '杯子是什麼顏色？', '杯子在哪裡？', '這是誰的杯子？'], answer: 0, hint: '「How many」是在問「多少個」。', explain: 'How many cups? ＝ 有幾個杯子？' },
  { id: 'we08', subject: 'english', grade: 4, tier: 2, q: '「I\'m full.」是什麼意思？', choices: ['我吃飽了。', '我好餓。', '我很忙。', '我好開心。'], answer: 0, hint: 'full 是「滿滿的」。肚子滿滿的，就是……？', explain: 'I\'m full. ＝ 我吃飽了。我好餓是 I\'m hungry.' },
  { id: 'we09', subject: 'english', grade: 5, tier: 3, q: '「Please pass me the sugar.」是什麼意思？', choices: ['請把糖遞給我。', '請給我牛奶。', '我不要加糖。', '糖在哪裡？'], answer: 0, hint: 'sugar 是「糖」，pass me 是「拿給我、遞給我」。', explain: 'Please pass me the sugar. ＝ 請把糖遞給我。' },
  { id: 'we10', subject: 'english', grade: 5, tier: 3, q: '「There are three cakes on the table.」桌上有什麼？', choices: ['三個蛋糕', '三杯茶', '兩個蛋糕', '三個杯子'], answer: 0, hint: 'three 是 3，cakes 是蛋糕（不只一個，所以多了 s）。', explain: '桌子上有三個蛋糕。' },
];
for (const q of W) if (!QUIZ.some(x => x.id === q.id)) QUIZ.push(q);

// ---------- 道具、貼紙 ----------
ITEMS.tea_leaf = { id: 'tea_leaf', name: '香香茶葉', kind: 'material', desc: '茶杯蝸牛送的茶葉，聞起來甜甜的。是素材。' };
ITEMS.flip_fruit = { id: 'flip_fruit', name: '倒立果', kind: 'heal', desc: '長在樹根上的果子，咬一口會想倒立。回復 30 HP。', heal: 30, battle: true };
STICKERS.w_tea = '永遠的下午茶'; STICKERS.w_path = '顛倒小徑'; STICKERS.w_secret = '樹洞裡的祕密';
STICKERS.teasnail_talk = '茶杯蝸牛（對話）'; STICKERS.teasnail_defeat = '茶杯蝸牛（打倒）';
STICKERS.flipmush_talk = '倒立菇（對話）'; STICKERS.flipmush_defeat = '倒立菇（打倒）';
{ const wp = STICKER_PAGES.find(p => p.id === 'wonder'); if (wp) for (const id of ['w_tea', 'w_path', 'w_secret']) if (!wp.ids.includes(id)) wp.ids.push(id);
  const mp = STICKER_PAGES.find(p => p.id === 'monster'); if (mp) for (const id of ['teasnail_talk', 'teasnail_defeat', 'flipmush_talk', 'flipmush_defeat']) if (!mp.ids.includes(id)) mp.ids.push(id); }

// ---------- 魔物（自創、可以對話；數值用 sim/ 模擬器調整） ----------
ENEMIES.teasnail = {
  id: 'teasnail', name: '茶杯蝸牛', sprite: 'teasnail', hp: 24, atk: 6, def: 4, spd: 2, exp: 18, money: 9, sticker: 'teasnail',
  talkBase: 0.55, talkLines: ['呼～一起喝杯茶，慢慢來就好……我先走囉。', '妳說話好溫柔，跟熱茶一樣暖暖的。拜拜～'],
  talkFail: ['……（茶杯蝸牛慢慢喝了一口茶，還沒聽完）', '咕嘟咕嘟……（牠縮進杯子裡了）'],
  gifts: [{ item: 'tea_leaf', chance: 0.6 }],
  info: ['草原大樹下的茶會，永遠都在喝茶喔……主人是一隻小松鼠。', '倒過來的路？我太慢了，走到一半就天黑了。'],
  skills: [{ id: 'teaspray', name: '噴熱茶', chance: 0.25, power: 1.1 }, { id: 'sleepytea', name: '請喝睏睏茶', chance: 0.12, power: 0.3, status: 'sleep' }],
};
ENEMIES.flipmush = {
  id: 'flipmush', name: '倒立菇', sprite: 'flipmush', hp: 30, atk: 8, def: 3, spd: 6, exp: 24, money: 11, sticker: 'flipmush',
  talkBase: 0.45, talkLines: ['倒過來看，天空在腳下喔！妳也試試看～', '嘿嘿，妳不覺得頭暈嗎？那妳很厲害！再見～'],
  talkFail: ['咕嚕咕嚕轉～（倒立菇轉圈圈，沒在聽）', '？？（牠倒著看妳，好像看不懂）'],
  gifts: [{ item: 'forest_mushroom', chance: 0.5 }, { item: 'flip_fruit', chance: 0.15 }],
  info: ['顛倒小徑走到最上面，會走到哥布林的營地喔。很奇怪吧？', '樹洞太小了，要變小才進得去。裡面有寶貝喔！'],
  skills: [{ id: 'spin', name: '倒立轉圈', chance: 0.28, power: 1.1 }, { id: 'dizzy', name: '頭暈暈', chance: 0.14, power: 0.6, status: 'stun' }],
};
// 草原：鐘樓的事情以後，偶爾會遇到茶杯蝸牛（模擬器調整）
ENCOUNTERS.meadow_grass.groups.push(
  { enemies: ['teasnail'], weight: 14, when: { all: [{ maxActive: 1 }, done('side21')] } },
  { enemies: ['teasnail', 'slime'], weight: 18, when: { all: [{ minActive: 2 }, done('side21')] } },
);
ENCOUNTERS.flip_grass = { id: 'flip_grass', rate: 0.09, minSteps: 5, bg: 'forestbg', groups: [
  { enemies: ['flipmush'], weight: 22 }, { enemies: ['flipmush', 'flipmush'], weight: 26 },
  { enemies: ['flipmush', 'teasnail'], weight: 20 }, { enemies: ['flipmush', 'bat'], weight: 16 },
  { enemies: ['flipmush', 'flipmush', 'teasnail'], weight: 14, when: { minActive: 3 } },
] };

// ---------- 捲捲（小松鼠）與下午茶會：草原東邊的大樹下 ----------
NPCS.push({ id: 'juanjuan', name: '捲捲', sprite: 'juanjuan', portrait: 'juanjuan_big', giverOf: ['side23'],
  voice: { base: 980, len: 0.06, type: 'triangle', bend: 1.25, drop: 0.85, chirps: 4, gap: 0.025, bright: 1.1, vol: 0.55 }, // 嘰嘰喳喳：快快的一串
  spots: [{ when: done('side21'), map: 'meadow', x: t(22) + 6, y: t(14) + 2 }],
  talk: [
    { when: { questAvailable: 'side23' }, d: 'side23_start' },
    { when: ocur('side23', 'cups'), d: 'side23_cups' },
    { when: ocur('side23', 'teapot'), d: 'side23_teapot_hint' },
    { when: ocur('side23', 'menu'), d: 'side23_menu' },
    { when: { all: [done('side23'), daily('tea')] }, d: 'tea_daily' },
    { when: done('side23'), d: 'tea_after' },
    { d: 'juan_default' },
  ] });
const M = MAPS.meadow;
M.props.push(
  P('w_teatable', t(20) + 16, t(14) + 4, { block: [100, 24] }),
  P('w_teapot', t(17) + 8, t(10) + 20, { scale: 1.3, depth: t(12), when: { not: { any: [done('side23'), { flag: 'got_teapot' }] } } } as Partial<PropDef>),
);
WONDERS.push({ id: 'wc_tea', map: 'meadow', x: t(18) + 20, y: t(12) + 10, mode: 'big', area: { x: t(15), y: t(9) + 16, w: t(8), h: t(5) }, when: { any: [act('side23'), done('side23')] } });
GLINTS.push({ id: 'tea_pot', map: 'meadow', x: t(17) + 8, y: t(10) + 10, obs: 0, when: ocur('side23', 'teapot'), d: 'tea_pot', needSize: 'big', sizeHint: 'tea_pot_high' });

// ---------- 顛倒小徑：黑森林左邊（主線 8 以後） ----------
const F = MAPS.forest;
F.exits.push({ tx: 1, ty: 8, to: 'flip_path', x: t(6) + 16, y: t(19) + 20, dir: 1, when: done('main8'), lockedDialogue: 'flip_locked' });
F.props.push(P('w_rsign', t(2) + 12, t(9) + 30, { block: [16, 10] }), P('glowshroom', t(1) + 16, t(7) + 30, { flipY: true }));
MAPS.flip_path = { id: 'flip_path', name: '顛倒小徑', trees: true, forest: true, flipTrees: true, music: 'forest', encounter: 'flip_grass', zones: [],
  tiles: [
    'TTTTTTqTTTTT',
    'TkkkkkqkkkkT',
    'TkggkkqkkggT',
    'TkggkqqkkggT',
    'TkkkkqkkkkkT',
    'TTkkkqkkkTTT',
    'TkkkkqqqkkkT',
    'TkgggkkqkkkT',
    'TkgggkkqkggT',
    'TkkkkkkqkggT',
    'TTTkkqqqkkkT',
    'TkkkkqkkkkkT',
    'TkkggqkkggkT',
    'TkkggqkkggkT',
    'TkkkkqqqkkkT',
    'TTkkkkkqkkTT',
    'TkkggkkqkkkT',
    'TkkggkkqkkkT',
    'TkkkkkqqkkkT',
    'TkkkkkqkkkkT',
    'TTTTTTqTTTTT',
  ],
  props: [
    P('w_ftree', t(2) + 20, t(9) + 30, { block: [26, 12], scale: 0.9 }),
    P('w_ftree', t(9) + 16, t(4) + 30, { block: [26, 12], scale: 1.1 }),
    P('w_rsign', t(7) + 20, t(18) + 26, { block: [16, 10], flipY: true }),
    P('w_rsign', t(4) + 10, t(2) + 30, { block: [16, 10], flipY: true }),
    P('glowshroom', t(1) + 20, t(5) + 30, { flipY: true }), P('glowshroom', t(10) + 8, t(11) + 30, { flipY: true }),
    P('glowshroom', t(3), t(15) + 30, { flipY: true }), P('glowshroom', t(9) + 20, t(17) + 30, { flipY: true }),
    P('stump', t(9), t(13) + 24, { block: [26, 12], flipY: true }),
  ],
  exits: [
    { tx: 6, ty: 20, to: 'forest', x: t(2) + 16, y: t(8) + 20, dir: 0 },
    { tx: 6, ty: 0, to: 'forest', x: t(5) + 16, y: t(29) + 20, dir: 0 },
  ] };
TRIGGERS.push({ id: 'w_path_in', map: 'flip_path', once: 'seen_flip_path', d: 'w_path_in' });
TRIGGERS.push({ id: 'w_path_end', map: 'forest', when: { flag: 'seen_flip_path' }, once: 'flip_path_shortcut', d: 'w_path_end', zone: { x: t(3), y: t(28), w: t(5), h: t(3) } });
WONDERS.push(
  { id: 'wc_hole', map: 'flip_path', x: t(4) + 16, y: t(9) + 22, mode: 'small', area: { x: t(1), y: t(7), w: t(5), h: t(4) }, when: done('main8') },
  { id: 'wc_fruit', map: 'flip_path', x: t(8) + 8, y: t(5) + 14, mode: 'big', area: { x: t(6), y: t(3), w: t(5), h: t(4) }, when: done('main8') },
);
GLINTS.push(
  { id: 'fp_hole', map: 'flip_path', x: t(2) + 20, y: t(9) + 36, obs: 0, once: 'got_fp_hole', d: 'fp_hole', needSize: 'small', sizeHint: 'fp_hole_big' },
  { id: 'fp_fruit', map: 'flip_path', x: t(9) + 16, y: t(3) + 30, obs: 0, when: daily('flipfruit'), d: 'fp_fruit', needSize: 'big', sizeHint: 'fp_fruit_high' },
);

// ---------- 支線 23 ----------
const Q: QuestDef[] = [
  { id: 'side23', kind: 'side', no: 23, title: '奇妙③永遠結束不了的茶會（數學・英文）', giver: 'juanjuan', summary: '草原東邊的大樹下，小松鼠捲捲的下午茶會一直開、一直開，好像永遠結束不了……', prereq: ['side21'], ordered: true,
    objectives: [
      { id: 'cups', type: 'event', text: '幫捲捲數杯子、分餅乾（數學）', marker: ['juanjuan'] },
      { id: 'teapot', type: 'inspect', text: '站進大樹旁的圈圈變大，拿下樹上的茶壺', targets: ['tea_pot'] },
      { id: 'menu', type: 'event', text: '把茶壺交給捲捲，看懂英文菜單', marker: ['juanjuan'] },
    ],
    rewards: { exp: 140, money: 60, items: [{ id: 'herb_tea', n: 1 }, { id: 'cookie', n: 2 }], courage: 1, sticker: 'w_tea' } },
];
for (const q of Q) { QUESTS[q.id] = q; if (!QUEST_ORDER.includes(q.id)) QUEST_ORDER.push(q.id); }

// ---------- 對話 ----------
Object.assign(D, {
  juan_default: [{ s: 'juanjuan', t: '嘰嘰！我是捲捲！尾巴捲捲、杯子滿滿！要不要坐下來喝茶？' }],
  side23_start: [
    { s: 'juanjuan', t: '嘰嘰！歡迎歡迎！茶會開始囉！……啊，茶會從昨天就開始了。' },
    { s: 'hero', t: '昨天？那什麼時候結束？' },
    { s: 'juanjuan', t: '結、結束？……杯子還沒數完、餅乾還沒分好、茶壺也不見了……茶會不能結束啦！' },
    { s: 'juanjuan', t: '妳可以陪我把茶會辦完嗎？要幫我算數學，還要看英文菜單喔！', choices: [
      { label: '好，我陪妳！', act: [{ type: 'startQuest', id: 'side23' }] },
      { label: '等一下喔', next: 'later' }] },
    { s: 'juanjuan', t: '耶！那先坐下來，幫我數數看桌上的杯子！' },
  ],
  side23_cups: [
    { s: 'juanjuan', t: '杯子一排一排的，我數到一半就忘了……還有餅乾要怎麼分才公平呢？', act: [{ type: 'quiz', ids: ['wm01', 'wm02'], by: 'juanjuan', title: '捲捲的茶會數學' }] },
    { s: 'juanjuan', t: '哇！一下就算好了！好厲害！' },
    { s: 'juanjuan', t: '接下來……茶壺！我昨天把它掛在大樹上晾乾，結果太高了，拿不下來……', act: [{ type: 'obj', quest: 'side23', obj: 'cups' }] },
    { s: 'juanjuan', t: '大樹旁邊有一個發光的圈圈。妳的「長高高餅乾」借我看看——對，就是那個！站進去吃一口吧！' },
  ],
  side23_teapot_hint: [{ s: 'juanjuan', t: '茶壺在大樹上面！站進旁邊的圈圈，吃一口長高高餅乾就拿得到了！' }],
  tea_pot_high: [{ s: 'narr', t: '藍白色的茶壺掛在樹枝上，搖啊搖。太高了，跳起來也搆不到……' }, { s: 'hero', t: '（樹旁邊的圈圈……吃一口長高高餅乾試試看！）', think: true }],
  tea_pot: [{ s: 'narr', t: '變大的{name}，輕輕把茶壺從樹枝上拿下來了！', act: [{ type: 'flag', id: 'got_teapot' }, { type: 'obj', quest: 'side23', obj: 'teapot' }, { type: 'sfx', id: 'chime' }] }, { s: 'hero', t: '拿到了！拿去給捲捲吧。' }],
  side23_menu: [
    { s: 'juanjuan', t: '茶壺回來了！嘰嘰！最後一件事——客人寫了一張英文菜單，我看不懂……', act: [{ type: 'quiz', ids: ['we06', 'we01'], by: 'juanjuan', title: '茶會的英文菜單' }] },
    { s: 'juanjuan', t: '原來是在問「要不要喝茶」！我還以為是在叫我回家……' },
    { s: 'juanjuan', t: '……其實，我不是不能結束茶會。我是不敢結束。' },
    { s: 'juanjuan', t: '我怕茶會結束了，大家就回家了，就沒有人陪我了……' },
    { s: 'hero', t: '茶會結束了，還可以再辦一次呀！說「明天見」，大家就會再來。' },
    { s: 'juanjuan', t: '再辦一次……！對耶！那、那我要鼓起勇氣說了——' },
    { s: 'juanjuan', t: '今天的茶會，結束囉！謝謝大家！明天見！', act: [{ type: 'sfx', id: 'chime' }, { type: 'obj', quest: 'side23', obj: 'menu' }] },
    { s: 'juanjuan', t: '嘰嘰！說出來了！以後每天都來喝茶好不好？我會準備「茶會小考」，答對就請妳吃點心！' },
  ],
  tea_daily: [{ s: 'juanjuan', t: '嘰嘰！今天的茶會小考要考哪一科？答對 2 題就請妳吃點心喔！', choices: [
    { label: '數學', act: [{ type: 'quiz', subject: 'math', tier: 2, n: 2, by: 'juanjuan', title: '茶會小考（數學）' }, { type: 'item', id: 'cookie', n: 2 }, markDaily('tea')], next: 'tea_snack' },
    { label: '英文', act: [{ type: 'quiz', subject: 'english', tier: 2, n: 2, by: 'juanjuan', title: '茶會小考（英文）' }, { type: 'item', id: 'cookie', n: 2 }, markDaily('tea')], next: 'tea_snack' },
    { label: '下次再說', act: [] }] }],
  tea_snack: [{ s: 'juanjuan', t: '答對了！小魚乾餅乾兩塊，請慢用～明天見！' }],
  tea_after: [{ s: 'juanjuan', t: '今天的茶會已經結束囉！明天見！……嘿嘿，我現在很會說這句話了。' }],
  // ----- 顛倒小徑 -----
  flip_locked: [{ s: 'narr', t: '樹根長在上面、樹葉長在下面……好奇怪的小路。還是先把森林的事情辦完吧。' }],
  w_path_in: [
    { s: 'narr', t: '咦？樹都倒過來長了！樹根在天上，樹葉在腳下，路牌也是倒著寫的。' },
    { s: 'hero', t: '可是……我還是可以好好地走路耶。', act: [{ type: 'sticker', id: 'w_path' }] },
  ],
  w_path_end: [{ s: 'narr', t: '從顛倒小徑的上面走出來——竟然是哥布林營地的旁邊！原來這是一條捷徑！' }],
  fp_hole_big: [{ s: 'narr', t: '倒立樹的樹根下面，有一個小小的樹洞，裡面好像有東西在發光……' }, { s: 'hero', t: '（太小了，進不去……旁邊的圈圈，喝一口縮縮露水試試看！）', think: true }],
  fp_hole: [{ s: 'narr', t: '變小的{name}鑽進樹洞——裡面有一顆亮晶晶的倒立果，還有一張小小的貼紙！', act: [{ type: 'item', id: 'flip_fruit', n: 1 }, { type: 'sticker', id: 'w_secret' }] }],
  fp_fruit_high: [{ s: 'narr', t: '倒立樹的果子，長在高高的樹根上。太高了，搆不到……' }, { s: 'hero', t: '（旁邊有一個圈圈……吃一口長高高餅乾試試看！）', think: true }],
  fp_fruit: [{ s: 'narr', t: '變大的{name}摘下了一顆倒立果！（明天還會再長出來喔）', act: [{ type: 'item', id: 'flip_fruit', n: 1 }, markDaily('flipfruit')] }],
});
Object.assign(DIALOGUES, D);
