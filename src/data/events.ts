// 第一章村莊小事件的補完（CHAPTER1.md 六-1 表格）：小魚乾晾曬、長老說書 3～5、哥布林幫忙種田、守衛練習對打、
// 招財的划算時間、哥布林學寫字、豆花的畫展貼紙；以及月光莓／銀光小魚在休息後重新出現、交換小攤每次休息換一批、收藏家胸針提示。
import type { Dialogue, Cond, Action } from './types';
import { DIALOGUES } from './dialogues';
import { NPCS } from './npcs';
import { GLINTS, TRIGGERS, TILE } from './maps';
import { ENEMIES, FIXED } from './enemies';
import { STICKER_PAGES, STICKERS } from './items';
import { TRADES } from './ch1c';
const t = (n: number) => n * TILE;
const D: Record<string, Dialogue> = {};
const daily = (id: string): Cond => ({ notFlag: 'daily_' + id });
const markDaily = (id: string): Action => ({ type: 'flag', id: 'daily_' + id });

// ---- 新的一天（在旅店休息或睡覺）：每天一次的小事件重新開放 ----
D.new_day_marker = [];
for (const k of ['inn_default', 'main5_inn', 'inn_bed']) for (const ln of DIALOGUES[k] ?? []) for (const c of ln.choices ?? []) {
  if (c.act?.some(a => a.type === 'rest') && !c.act.some(a => a.type === 'newDay')) c.act.unshift({ type: 'newDay' }); // 睡覺（sleep）自己會處理
}

// ---- 小魚乾晾曬（民宅屋簷、白天） ----
D.fishdry = [
  { s: 'narr', t: '一陣風吹過來，屋簷下晾的小魚乾掉了好幾條！{name}趕快撿起來，掛回去。' },
  { s: '老奶奶貓', t: '哎呀，謝謝妳呀，好孩子。來，這個給妳。', act: [{ type: 'item', id: 'cookie', n: 1 }, markDaily('fishdry')] },
];
GLINTS.push({ id: 'fishdry', map: 'village', x: 708, y: 486, obs: 0, when: { all: [{ questDone: 'main5' }, { time: 'day' }, { weather: 'clear' }, daily('fishdry')] }, d: 'fishdry' });

// ---- 長老的說書時間：每推進主線換一個，共 5 個（每個第一次聽：勇氣值 +1） ----
const story = DIALOGUES.elder_story; const last = story.pop()!; // 「今晚的月亮，真亮啊。」放最後
story.push(
  { s: 'elder', t: '鐘樓的鐘呀，以前每天晚上都會敲一下，告訴大家「月亮出來了，可以回家了」。', when: { all: [{ flag: 'story1' }, { notFlag: 'story3' }, { questDone: 'main8' }] }, act: [{ type: 'flag', id: 'story3' }, { type: 'stat', courage: 1 }] },
  { s: 'elder', t: '月光燈籠是為了迷路的孩子點的。只要看到燈籠的光，就找得到回家的路。', when: { all: [{ flag: 'story1' }, { notFlag: 'story4' }, { questDone: 'main9' }] }, act: [{ type: 'flag', id: 'story4' }, { type: 'stat', courage: 1 }] },
  { s: 'elder', t: '很久很久以前，貓咪和哥布林也一起辦過宴會。……能再看到那樣的晚上，長老好開心。', when: { all: [{ flag: 'story1' }, { notFlag: 'story5' }, { questDone: 'main11' }] }, act: [{ type: 'flag', id: 'story5' }, { type: 'stat', courage: 1 }] },
  last,
);

// ---- 哥布林幫忙種田（主線 10 選 A 之後，農田） ----
D.ev_farm = [
  { s: 'narr', t: '菜園裡，咕咕和小豆芽正蹲在地上拔草，拔得滿頭大汗。' },
  { s: 'sprout', t: '番薯伯伯！這根是草，還是菜？' },
  { s: 'farmer', t: '那是菜啦！……哼，拔得還算可以啦。' },
  { s: 'farmer', t: '（小聲）……謝啦。這兩顆番薯，拿去烤。', act: [{ type: 'item', id: 'sweet_potato', n: 2 }] },
];
TRIGGERS.push({ id: 'ev_farm', map: 'village', when: { all: [{ questDone: 'main10' }, { flag: 'choiceA' }, { time: 'day' }] }, once: 'ev_farm', d: 'ev_farm', zone: { x: t(15), y: t(15), w: t(8), h: t(5) } });

// ---- 守衛的練習對打（主線 3 之後、每天一次、不會輸錢） ----
ENEMIES.guard_spar = { id: 'guard_spar', name: '橘貓守衛（練習）', sprite: 'guard_spar', hp: 40, atk: 6, def: 3, spd: 5, exp: 25, money: 0,
  talkBase: 0, talkLines: ['哈哈，好吧！今天就練到這裡！'], talkFail: ['練習的時候不能用說的啦！拿出勇氣來！', '喵哈哈！再來！'], gifts: [],
  skills: [{ id: 'spar', name: '守衛的木槍', chance: 0.3, power: 1.0 }] } as any;
FIXED.spar = { id: 'spar', enemies: ['guard_spar'], bg: 'battlebg', practice: true, hint: '練習對打：輸了也不會掉魚乾幣喔！' } as any;
D.guard_spar = [
  { s: 'guard', t: '喔！要不要跟我練習一下？放心，練習輸了也不會怎麼樣！', choices: [
    { label: '好！來練習！', act: [markDaily('spar'), { type: 'battle', encounter: 'spar' }], next: 'guard_spar_end' },
    { label: '下次吧' }] },
];
D.guard_spar_end = [{ s: 'guard', t: '不錯不錯！今天就練到這裡，明天再來吧！' }];
const guard = NPCS.find(n => n.id === 'guard');
if (guard) guard.talk.splice(Math.max(0, guard.talk.findIndex(r => r.d === 'guard_gate')), 0, { when: { all: [{ questDone: 'main3' }, daily('spar'), ] }, d: 'guard_spar' });

// ---- 招財的划算時間（雜貨店、隨機）：新的一天有機會「限時特價」，一樣東西打折 ----
D.merchant_sale = [
  { s: 'merchant', t: '限時特價喵！今天的小魚乾餅乾，只要 6 魚乾幣！', act: [{ type: 'shop', title: '🛒 招財的雜貨店（限時特價！）', items: [{ id: 'cookie', price: 6 }, { id: 'sweet_potato', price: 18 }, { id: 'herb_tea', price: 25 }, { id: 'jerky', price: 20 }, { id: 'smoke_yarn', price: 15 }] }] },
];
const merchant = NPCS.find(n => n.id === 'merchant');
if (merchant) { const i = merchant.talk.findIndex(r => r.d === 'merchant_shop2'); if (i >= 0) merchant.talk.splice(i, 0, { when: { all: [{ questDone: 'side6' }, { flag: 'catSpeech' }, { flag: 'daily_sale' }] }, d: 'merchant_sale' }); }

// ---- 哥布林學寫字（哥布林營地、支線 12 後） ----
D.ev_gobwrite = [
  { s: 'narr', t: '營地的營火旁邊，薄荷正在教小豆芽和哥布林們認草藥的名字。' },
  { s: 'sprout', t: '「薄、荷」……「月、見、花」！我寫好了！' },
  { s: 'narr', t: '字寫得歪歪扭扭的，可是大家都好認真。' },
  { s: 'mint', t: '……寫得很好喔。下次教你們寫「勇氣」。', act: [{ type: 'stat', courage: 1 }] },
];
TRIGGERS.push({ id: 'ev_gobwrite', map: 'forest', when: { questDone: 'side12' }, once: 'ev_gobwrite', d: 'ev_gobwrite', zone: { x: t(1), y: t(27), w: t(8), h: t(4) } });

// ---- 豆花的畫展（麻糬媽媽家、支線 2 後）：貼紙 ----
STICKERS.douhua_art = '豆花的畫展';
const vp = STICKER_PAGES.find(p => p.id === 'village'); if (vp && !vp.ids.includes('douhua_art')) vp.ids.push('douhua_art');
DIALOGUES.douhua_gallery?.push({ s: 'narr', t: '豆花把畫送給{name}，貼進貼紙簿裡了！', when: { not: { hasSticker: 'douhua_art' } }, act: [{ type: 'sticker', id: 'douhua_art' }] });
const pic = DIALOGUES.douhua_pic; if (pic) pic.push({ s: 'narr', t: '畫上有{name}，還有好多貓咪。', when: { questDone: 'side2' } });

// ---- 月光莓、銀光小魚：休息後重新出現 ----
D.berry_again = [{ s: 'narr', t: '月光莓又長出來了！摘了一顆。', act: [{ type: 'item', id: 'moon_berry', n: 1 }, markDaily('berry')] }];
D.fish_again = [{ s: 'narr', t: '小溪裡有東西亮了一下……抓到一條銀光小魚！', act: [{ type: 'item', id: 'silver_fish', n: 1 }, markDaily('fish')] }];
GLINTS.push(
  { id: 'berry_again', map: 'orchard', x: t(10) + 16, y: t(4) + 8, obs: 0, when: { all: [{ questDone: 'side7' }, daily('berry')] }, d: 'berry_again' },
  { id: 'fish_again', map: 'meadow', x: t(16) + 8, y: t(12) + 22, obs: 0, when: { all: [{ questDone: 'side17' }, daily('fish')] }, d: 'fish_again' },
);
// ---- 哥布林交換小攤：每次休息後換一批（閃亮貼紙那一格一直都在） ----
TRADES.push(
  { give: [['jelly', 2]], get: ['cookie', 2] },
  { give: [['wolf_fur', 1], ['forest_mushroom', 1]], get: ['jerky', 1] },
  { give: [['silver_fish', 1]], get: ['star_candy', 1] },
);
Object.assign(DIALOGUES, D);
