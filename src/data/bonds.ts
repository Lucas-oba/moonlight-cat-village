// Milestone D2：夥伴羈絆（CHAPTER1.md 五：第一章最高 3 級；一起戰鬥、旅店休息的營火對話、送喜歡的東西都會提高）、
// 羈絆 3 級才能接羈絆任務（支線 11～13）、鐘樓與最高大樹的風景點、外觀服裝的提示。
import type { Dialogue, Cond, Action } from './types';
import { DIALOGUES, INN_TALKS } from './dialogues';
import { NPCS } from './npcs';
import { QUESTS } from './quests';
import { GLINTS, TILE } from './maps';
const t = (n: number) => n * TILE;
const P = (id: string): Cond => ({ inParty: id });
const B = (id: string, n: number): Cond => ({ minBond: [id, n] });
const bond = (...ids: string[]): Action[] => ids.map(id => ({ type: 'bond', id }));

// ---- 羈絆任務：羈絆 3 級才會出現 ----
QUESTS.side11.bond = ['ali', 3]; QUESTS.side12.bond = ['mint', 3]; QUESTS.side13.bond = ['yuzu', 3];

// ---- 旅店的營火對話（約 12 段，隨機播放，每段聽一次） ----
const TALKS: [string, Cond, Dialogue][] = [
  ['it_ali1', P('ali'), [
    { s: 'narr', t: '睡前，大家在旅店的暖爐旁邊坐了一下。' },
    { s: 'ali', t: '勇者大人，我小時候很怕打雷。隊長跟我說，害怕的時候，就把背挺得更直一點。' },
    { s: 'hero', t: '那下次打雷，我們一起挺直！' },
    { s: 'ali', t: '嘿嘿……好！', act: bond('ali') }]],
  ['it_mint1', P('mint'), [
    { s: 'narr', t: '睡前，大家在旅店的暖爐旁邊坐了一下。' },
    { s: 'mint', t: '奶奶說，草藥要慢慢等，才會有味道。……我說話也比較慢，對不起。' },
    { s: 'hero', t: '慢慢說沒關係，我會等妳。' },
    { s: 'mint', t: '……嗯。謝謝。', act: bond('mint') }]],
  ['it_yuzu1', P('yuzu'), [
    { s: 'narr', t: '睡前，大家在旅店的暖爐旁邊坐了一下。' },
    { s: 'yuzu', t: '我算過了！從村子跑到草原，我只要 52 秒！' },
    { s: 'hero', t: '好快！可是慢慢走的話，可以看到路邊的小花喔。' },
    { s: 'yuzu', t: '……那我下次走走看好了。', act: bond('yuzu') }]],
  ['it_am', { all: [P('ali'), P('mint')] }, [
    { s: 'narr', t: '阿栗在暖爐旁邊，喀滋喀滋地吃著餅乾。' },
    { s: 'mint', t: '阿栗……你的餅乾屑，掉到我的尾巴上了。' },
    { s: 'ali', t: '啊！對不起對不起！我幫妳撥掉！' },
    { s: 'mint', t: '（小小聲地笑了）', act: bond('ali', 'mint') }]],
  ['it_ay', { all: [P('ali'), P('yuzu')] }, [
    { s: 'yuzu', t: '阿栗！明天我們來比賽跑步！' },
    { s: 'ali', t: '好啊！……不過我揹著盾牌，可以讓我先跑三步嗎？' },
    { s: 'yuzu', t: '五步也可以！反正我會追上你！', act: bond('ali', 'yuzu') }]],
  ['it_my', { all: [P('mint'), P('yuzu')] }, [
    { s: 'yuzu', t: '嘶……今天跑太快，膝蓋擦破了一點點。' },
    { s: 'mint', t: '……過來。這是奶奶教我的草藥，涼涼的，不會痛。' },
    { s: 'yuzu', t: '哇，真的不痛了！薄荷好厲害！', act: bond('mint', 'yuzu') }]],
  ['it_ali2', { all: [P('ali'), B('ali', 2)] }, [
    { s: 'ali', t: '勇者大人，妳第一次打史萊姆的時候，會怕嗎？' },
    { s: 'hero', t: '會呀，我的手一直抖。' },
    { s: 'ali', t: '原來勇者也會怕……那我覺得好多了。害怕也可以很勇敢，對吧？', act: bond('ali') }]],
  ['it_mint2', { all: [P('mint'), B('mint', 2)] }, [
    { s: 'mint', t: '我以前……不太敢跟大家說話。' },
    { s: 'mint', t: '可是現在，我可以跟你們一起坐在這裡了。' },
    { s: 'hero', t: '因為薄荷很勇敢呀。', act: bond('mint') }]],
  ['it_yuzu2', { all: [P('yuzu'), B('yuzu', 2)] }, [
    { s: 'yuzu', t: '我每天晚上都會看月亮。' },
    { s: 'yuzu', t: '今天的月亮，好像在笑耶。' },
    { s: 'hero', t: '一定是因為我們都在這裡。', act: bond('yuzu') }]],
  ['it_ali3', { all: [P('ali'), { questDone: 'main10' }] }, [
    { s: 'ali', t: '咕咕今天跟我說「謝謝」。……我以前覺得哥布林都很壞。' },
    { s: 'hero', t: '認識以後，就不一樣了。' },
    { s: 'ali', t: '嗯。我想保護的，好像變多了。', act: bond('ali') }]],
  ['it_mint3', { all: [P('mint'), { questDone: 'main10' }] }, [
    { s: 'mint', t: '小豆芽說，他想學認草藥……' },
    { s: 'mint', t: '我、我可以當他的老師嗎？' },
    { s: 'hero', t: '一定可以！薄荷是最溫柔的老師。', act: bond('mint') }]],
  ['it_yuzu3', { all: [P('yuzu'), { questDone: 'side10' }] }, [
    { s: 'yuzu', t: '今天送信的時候，番薯伯偷偷塞給我一顆番薯。' },
    { s: 'yuzu', t: '他嘴巴兇兇的，其實很溫柔耶。' },
    { s: 'hero', t: '因為柚子每次都好好地把信送到呀。', act: bond('yuzu') }]],
];
for (const [id, when, d] of TALKS) { DIALOGUES[id] = d; INN_TALKS.push({ d: id, when: { all: [when, { questDone: 'main5' }] } }); }
// 在旅店休息、睡覺之後，播一段營火對話
for (const k of ['inn_default', 'main5_inn', 'inn_bed']) for (const ln of DIALOGUES[k] ?? []) for (const c of ln.choices ?? []) {
  if (c.act?.some(a => a.type === 'rest' || a.type === 'sleep') && !c.act.some(a => a.type === 'innTalk')) c.act.push({ type: 'innTalk' });
}

// ---- 送禮物：每次睡覺／休息後，每位夥伴可以送一次她喜歡的東西 ----
const GIFTS: [string, string, string, string][] = [
  ['ali', 'cookie', '小魚乾餅乾', '哇！小魚乾餅乾！我最喜歡了！……我會慢慢吃的！'],
  ['mint', 'moon_flower', '月見花', '月見花……好漂亮。我會把它夾在奶奶的筆記裡。'],
  ['yuzu', 'moon_scale', '月光鱗粉', '亮晶晶的！跟月亮一樣！我要把它裝在郵差包裡！'],
];
for (const [id, item, name, thanks] of GIFTS) {
  DIALOGUES['gift_' + id] = [
    { s: 'narr', t: `{name}的包包裡有${name}。${id === 'ali' ? '阿栗' : id === 'mint' ? '薄荷' : '柚子'}好像一直在看……要送給她嗎？`, choices: [
      { label: '送給她！', act: [{ type: 'take', id: item }, { type: 'flag', id: 'gift_t_' + id }], next: 'gift_' + id + '_yes' },
      { label: '下次再說', act: [{ type: 'flag', id: 'gift_t_' + id }] }] },
  ];
  DIALOGUES['gift_' + id + '_yes'] = [{ s: id, t: thanks, act: bond(id) }];
  const n = NPCS.find(x => x.id === id); if (!n) continue;
  // 放在「隊伍中／休息中」的平常對話前面（任務對話還是比較優先）
  const i = n.talk.findIndex(r => /"(inParty|recruited)":"/.test(JSON.stringify(r.when ?? {})) && !/quest|obj/.test(JSON.stringify(r.when ?? {})));
  const rule = { when: { all: [{ recruited: id }, { hasItem: [item, 1] as [string, number] }, { notFlag: 'gift_t_' + id }] }, d: 'gift_' + id };
  n.talk.splice(i < 0 ? n.talk.length - 1 : i, 0, rule);
}
// 在旅店休息（不是睡覺）也算一天：送禮次數重置
for (const k of ['inn_default', 'main5_inn']) for (const ln of DIALOGUES[k] ?? []) for (const c of ln.choices ?? []) {
  if (c.act?.some(a => a.type === 'rest')) for (const [id] of GIFTS) c.act.unshift({ type: 'flag', id: 'gift_t_' + id, value: false });
}

// ---- 風景點：鐘樓、最高的大樹（支線 13 以外也可以上去看） ----
DIALOGUES.view_bell = [{ s: 'narr', t: '爬上鐘樓。整個月光貓村都看得到！屋頂一片一片的，好像糖果。', act: [{ type: 'sticker', id: 'bell_view' }] }];
DIALOGUES.view_tree = [{ s: 'narr', t: '爬上黑森林最高的大樹。好高好高！整片森林像綠色的海。', act: [{ type: 'sticker', id: 'tallest_tree' }] }];
DIALOGUES.view_nest = [{ s: 'narr', t: '樹頂有一個鳥巢。從這裡看出去，遠遠的森林深處，有一點紫色的光……', act: [{ type: 'sticker', id: 'birdnest' }, { type: 'stat', observation: 1 }] }];
const notS13: Cond = { not: { questActive: 'side13' } };
GLINTS.push(
  { id: 'v_bell', map: 'village', x: t(13) + 20, y: t(7) + 14, obs: 0, when: { all: [notS13, { questDone: 'main5' }] }, once: 'v_bell', d: 'view_bell' },
  { id: 'v_tree', map: 'forest', x: t(18) + 16, y: t(30) + 16, obs: 0, when: notS13, once: 'v_tree', d: 'view_tree' },
  { id: 'v_nest', map: 'forest', x: t(18) + 16, y: t(30) + 16, obs: 7, when: { all: [notS13, { hasSticker: 'tallest_tree' }] }, once: 'v_nest', d: 'view_nest' },
);
// 鳥巢和風景同一個位置：先看完風景，鳥巢才會出現（觀察力 7）
// 已經拿到貼紙的話（例如支線 13 時看過），就不再出現
const own: Record<string, string> = { v_bell: 'bell_view', v_tree: 'tallest_tree', v_nest: 'birdnest' };
for (const g of GLINTS) if (own[g.id]) g.when = { all: [g.when!, { not: { hasSticker: own[g.id] } }] };

// ---- 服裝獎勵的提示 ----
for (const ln of DIALOGUES.elder_board ?? []) if (/貓耳髮箍|月光雨衣|宴會裝/.test(ln.t)) ln.t += '打開喵喵勇者系統的「屬性」頁，就可以換上喔！';
