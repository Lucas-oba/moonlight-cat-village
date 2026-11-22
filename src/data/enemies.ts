import type { EnemyDef, EncounterTable, FixedEncounter } from './types';
// 第一章敵人（數值皆暫定）
export const ENEMIES: Record<string, EnemyDef> = {
  slime: {
    id: 'slime', name: '史萊姆', sprite: 'slime', hp: 16, atk: 5, def: 1, spd: 4, exp: 10, money: 6,
    talkBase: 0.4,
    talkLines: ['噗嚕？妳身上有太陽的味道……我要去樹蔭睡覺了。', '噗嚕噗嚕～妳講話好溫柔喔。那我不撞妳了，拜拜～', '噗……其實我也不想打架。我去小溪邊泡泡水好了。'],
    talkFail: ['噗嚕噗嚕！（史萊姆好像沒在聽……）', '噗嚕？（史萊姆歪著頭，還是想撞人）'],
    gifts: [{ item: 'jelly', chance: 0.6 }],
    info: ['噗嚕……草原的大石頭下面，好像藏著亮亮的東西喔。', '噗嚕……東邊的高麗菜田，晚上常常有小小的腳步聲。'],
    skills: [{ id: 'sticky', name: '黏黏衝撞', chance: 0.3, power: 1.0, status: 'sticky' }],
  },
  gugu: {
    id: 'gugu', name: '哥布林咕咕', sprite: 'goblin', hp: 26, atk: 6, def: 2, spd: 6, exp: 30, money: 0, sticker: 'goblin',
    talkBase: 0.55, talkLines: ['……因為肚子好餓。'], talkFail: ['不、不要過來！（咕咕抱緊高麗菜，嚇得發抖）', '咕、咕咕！我不聽我不聽！'],
    gifts: [],
    skills: [{ id: 'stick', name: '小木棒亂揮', chance: 0.35, power: 1.1 }],
  },
  goblin: {
    id: 'goblin', name: '哥布林', sprite: 'goblin', hp: 22, atk: 7, def: 2, spd: 7, exp: 18, money: 10, sticker: 'goblin',
    talkBase: 0.45, talkLines: ['肚子好餓……好啦好啦，我不拿了啦。', '咕咕……妳好像不是壞人。我先走了！'],
    talkFail: ['咕！我才不怕妳！', '咕嘰嘰～（哥布林做了一個鬼臉）'],
    gifts: [{ item: 'sweet_potato', chance: 0.5 }],
    info: ['咕……黑森林最近好暗好暗，連月光都照不進去。'],
    skills: [{ id: 'steal', name: '偷偷拿', chance: 0.25, power: 0, steal: true }],
  },
  fgoblin: {
    id: 'fgoblin', name: '森林哥布林', sprite: 'fgoblin_b', hp: 26, atk: 8, def: 3, spd: 7, exp: 22, money: 12, sticker: 'fgoblin',
    talkBase: 0.35, talkBonus: { when: { questDone: 'main9' }, add: 0.35 },
    talkLines: ['妳就是救了小豆芽的人類？……我們走啦，謝謝妳。', '咕……妳的眼睛好溫柔。好啦，不打了。'],
    talkFail: ['咕咕！人類走開！', '咕嘰！這裡是我們的森林！'],
    gifts: [{ item: 'forest_mushroom', chance: 0.6 }],
    info: ['咕……森林深處的大樹下，是我們的家。', '咕……最近常常聽到很可怕的聲音。'],
    skills: [{ id: 'leafstick', name: '葉子棒敲敲', chance: 0.3, power: 1.2 }],
  },
  wolf: {
    id: 'wolf', name: '森林野狼', sprite: 'wolf', hp: 34, atk: 10, def: 3, spd: 8, exp: 30, money: 14, sticker: 'wolf',
    talkBase: 0.3, talkLines: ['嗚……我們只是肚子餓。', '嗷嗚……妳不怕我們？好吧，我們回去了。'],
    talkFail: ['嗷嗚——！（野狼露出牙齒）', '嗚嚕嚕……（野狼還是很兇）'],
    gifts: [{ item: 'wolf_fur', chance: 0.7 }],
    skills: [{ id: 'bite', name: '大口咬', chance: 0.25, power: 1.3 }, { id: 'howl', name: '嗷嗚呼叫', chance: 0.15, power: 0, call: true }],
  },
  mushroom: {
    id: 'mushroom', name: '蘑菇怪', sprite: 'mushroom', hp: 28, atk: 7, def: 3, spd: 3, exp: 22, money: 10, sticker: 'mushroom',
    talkBase: 0.45, talkLines: ['好睏……不要吵……我去旁邊睡……', '呼……妳說話好小聲，好舒服……晚安……'],
    talkFail: ['嗯？……（蘑菇怪打了一個大哈欠，沒在聽）', '……呼嚕……（牠好像睡著了又醒來）'],
    gifts: [{ item: 'forest_mushroom', chance: 0.7 }],
    skills: [{ id: 'spore', name: '睡睡孢子', chance: 0.3, power: 0.5, status: 'sleep' }],
  },
  bat: {
    id: 'bat', name: '蝙蝠怪', sprite: 'bat', hp: 18, atk: 7, def: 1, spd: 11, exp: 16, money: 8, sticker: 'bat',
    talkBase: 0.5, talkLines: ['森林裡變得好暗，我們也想搬家了。', '妳聽得懂我們唱歌嗎？好開心！拜拜～'],
    talkFail: ['吱吱吱！（蝙蝠怪飛來飛去，聽不到）', '吱？（蝙蝠怪轉了一圈）'],
    gifts: [],
    info: ['吱……森林深處的紫色霧，是從一個好深好深的洞裡飄出來的。', '吱……那棵倒下的大樹後面，有很可怕的聲音。'],
    skills: [{ id: 'flap', name: '翅膀拍拍', chance: 0.3, power: 0.9 }],
  },
  rock: {
    id: 'rock', name: '巨岩', sprite: 'rock_boss', hp: 300, atk: 21, def: 4, spd: 3, exp: 0, money: 0, sticker: 'rock',
    talkBase: 0, talkLines: [], talkFail: [], gifts: [],
    skills: [
      { id: 'sweep', name: '大樹幹橫掃', chance: 0.28, power: 0.8, target: 'all' },
      { id: 'stomp', name: '跺腳', chance: 0.22, power: 0.6, status: 'stun' },
      { id: 'roar', name: '大吼', chance: 0.18, power: 0, roar: true },
    ],
    boss: {
      lateTurn: 5, lateHp: 0.4, earlyTalk: 0.03, lateTalk: 0.33, // 模擬器調整：Lv7 兩人隊 小孩玩法約 85–90% 勝
      earlyLines: ['回去！回去！', '人類小不點！這裡誰都不准過！', '吼！不要靠近！'],
      lateLines: ['巨岩喘著氣，又回頭看了一眼森林深處……', '巨岩：「……妳為什麼不逃？」'],
    },
  },
};
export const ENCOUNTERS: Record<string, EncounterTable> = {
  meadow_grass: { id: 'meadow_grass', rate: 0.09, minSteps: 5, bg: 'battlebg', groups: [
    // 一個人：一般難度
    { enemies: ['slime'], weight: 60, when: { maxActive: 1 } }, { enemies: ['slime', 'slime'], weight: 30, when: { maxActive: 1 } },
    { enemies: ['goblin'], weight: 14, when: { all: [{ maxActive: 1 }, { questDone: 'main7' }, { questNotDone: 'main10' }] } },
    // 有夥伴時魔物會多一點，戰鬥大約 2～4 回合（模擬器調整）
    { enemies: ['slime', 'slime'], weight: 35, when: { minActive: 2 } }, { enemies: ['slime', 'slime', 'slime'], weight: 35, when: { minActive: 2 } },
    { enemies: ['slime', 'goblin'], weight: 18, when: { all: [{ minActive: 2 }, { questDone: 'main7' }, { questNotDone: 'main10' }] } },
    { enemies: ['goblin', 'goblin'], weight: 10, when: { all: [{ minActive: 3 }, { questDone: 'main7' }, { questNotDone: 'main10' }] } },
  ] },
  forest_grass: { id: 'forest_grass', rate: 0.1, minSteps: 5, bg: 'forestbg', groups: [
    { enemies: ['fgoblin', 'fgoblin'], weight: 22 }, { enemies: ['fgoblin', 'fgoblin', 'fgoblin'], weight: 10 },
    { enemies: ['wolf'], weight: 18 }, { enemies: ['mushroom'], weight: 18 }, { enemies: ['mushroom', 'slime'], weight: 8 },
    { enemies: ['bat', 'bat'], weight: 16 }, { enemies: ['bat', 'bat', 'bat'], weight: 8 },
    // 三人隊伍時多一點雙隻、三隻的組合（模擬器調整：約 2.5～3 回合）
    { enemies: ['wolf', 'fgoblin'], weight: 24, when: { minActive: 3 } }, { enemies: ['mushroom', 'mushroom'], weight: 18, when: { minActive: 3 } },
    { enemies: ['wolf', 'mushroom'], weight: 14, when: { minActive: 3 } }, { enemies: ['fgoblin', 'fgoblin', 'fgoblin'], weight: 16, when: { minActive: 3 } },
    { enemies: ['wolf', 'wolf'], weight: 8, when: { all: [{ minActive: 3 }, { questDone: 'main9' }] } },
  ] },
};
export const FIXED: Record<string, FixedEncounter> = {
  tut1: { id: 'tut1', enemies: ['slime'], bg: 'battlebg', event: ['main6', 'tutorial'], intro: 'tut1_intro',
    hint: '點「攻擊」打史萊姆！被打痛了可以「防禦」，或用「道具」吃餅乾喵！' },
  tut2: { id: 'tut2', enemies: ['slime', 'slime'], bg: 'battlebg', event: ['main6', 'tutorial'], intro: 'tut2_intro',
    hint: '試試看「技能」：初級戰士的「勇氣揮擊」，威力比較大喵！' },
  tut3: { id: 'tut3', enemies: ['slime'], bg: 'battlebg', event: ['main6', 'tutorial'], intro: 'tut3_intro', forceTalk: true, talkScript: 'tut3_talk',
    hint: '這隻史萊姆看起來好睏……試試看「對話」喵！' },
  gugu: { id: 'gugu', enemies: ['gugu'], bg: 'battlebg', talkFlag: 'gugu_talked', talkScript: 'gugu_talk', talkBonus: 0.2,
    hint: '這隻哥布林好像很害怕……試試看「對話」喵！' },
  wolves: { id: 'wolves', enemies: ['wolf', 'wolf'], bg: 'forestbg', talkFlag: 'wolves_talked', talkLines: ['……我們只是聞到食物的味道。', '嗚……對不起，我們走就是了。'],
    hint: '野狼很兇，可是好像很餓……打不過的話，也可以試試「對話」喵！',
    startLines: [{ who: 'ali', t: '勇、勇者大人，我在前面！' }, { who: 'mint', t: '受傷了就告訴我喔。' }] },
  boss: { id: 'boss', enemies: ['rock'], bg: 'forestbg', music: 'boss', talkFlag: 'boss_talked', talkScript: 'boss_talk',
    hint: '巨岩好像很緊張……先撐過牠的攻擊，觀察牠的樣子吧喵。',
    startLines: [{ who: 'ali', t: '好、好大……可是我不會退的！' }, { who: 'mint', t: '大家不要怕，我會一直幫大家回血。' }, { who: 'yuzu', t: '牠的眉毛……是八字眉耶。好像在擔心什麼。' }],
    lateLines: [{ who: 'ali', t: '勇者大人，牠好像一直在看後面……' }, { who: 'mint', t: '牠不是壞人……牠在害怕。' }, { who: 'yuzu', t: '現在！跟牠說說話吧！' }] },
  chick_slimes: { id: 'chick_slimes', enemies: ['slime', 'slime', 'slime'], bg: 'battlebg', talkBonus: 0.15,
    hint: '保護小雞！阿栗站在前面了，可以「攻擊」也可以「對話」喵！',
    startLines: [{ who: 'ali', t: '小、小雞不要怕！我、我來了！' }] },
  tree_slimes: { id: 'tree_slimes', enemies: ['slime', 'slime', 'slime'], bg: 'battlebg', talkBonus: 0.2,
    talkLines: ['我們在等她掉下來……陪我們玩。', '噗嚕～原來妳也想跟我們玩？好啊，下次再玩！', '噗嚕……好吧，我們去別的地方等月亮。'],
    hint: '史萊姆好像只是想玩……可以「對話」喔喵！' },
};
