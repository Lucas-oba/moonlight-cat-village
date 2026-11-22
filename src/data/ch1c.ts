// 第一章：其餘支線（3、4、6～15）、喵喵小學堂解題支線（16～20）、燈籠、交換小攤等
// 這個檔案在 main.ts 一開始被 import，把資料併進各個總表。
import type { QuestDef, NpcDef, Dialogue, GlintDef, TriggerDef, FixedEncounter, Cond } from './types';
import { QUESTS, QUEST_ORDER } from './quests';
import { NPCS } from './npcs';
import { DIALOGUES } from './dialogues';
import { GLINTS, TRIGGERS, TILE } from './maps';
import { ITEMS } from './items';
import { FIXED, ENCOUNTERS } from './enemies';
const T = TILE; const t = (n: number) => n * TILE;
const ocur = (q: string, o: string): Cond => ({ objCurrent: [q, o] });

// ---------------- 支線任務 ----------------
const Q: QuestDef[] = [
  { id: 'side3', kind: 'side', no: 3, title: '鐵匠的月光礦石', giver: 'charcoal', summary: '鐵匠鋪的爐子冷冰冰的。黑炭師傅說，沒有礦石就打不了鐵。', prereq: ['main7'], ordered: true,
    objectives: [
      { id: 'ore', type: 'event', text: '在黑森林找 3 顆會發光的「月光礦石」（要能進黑森林才行）', count: 3 },
      { id: 'give', type: 'event', text: '把礦石拿給鐵匠鋪的黑炭師傅', marker: ['charcoal'] },
    ],
    rewards: { exp: 200, courage: 1, items: [{ id: 'moon_sword', n: 1 }], sticker: 'smithy_fire' }, rewardText: ['鐵匠鋪開張了'] },
  { id: 'side4', kind: 'side', no: 4, title: '旅店的招牌料理', giver: 'innkeeper', summary: '奶油老闆娘想做新的招牌菜「月光魚湯」，可是材料不夠。', prereq: ['main5'], ordered: true,
    objectives: [
      { id: 'herb', type: 'event', text: '在草原找 3 株「香香草」（亮亮的地方）', count: 3 },
      { id: 'fish', type: 'event', text: '去草原小溪邊，跟釣魚的海苔婆婆要小魚', marker: ['nori'] },
      { id: 'pot', type: 'event', text: '去村子東邊的鐵匠鋪，跟黑炭師傅借大鐵鍋', marker: ['charcoal'] },
      { id: 'cook', type: 'event', text: '回旅店，和奶油老闆娘一起煮湯', marker: ['innkeeper'] },
      { id: 'taste', type: 'event', text: '端湯給 3 隻貓咪喝：橘貓守衛、長老、小白貓', count: 3, marker: ['guard', 'elder', 'whitecat'] },
    ],
    rewards: { exp: 120, money: 100, items: [{ id: 'fish_soup', n: 2 }], observation: 1, sticker: 'fish_soup' }, rewardText: ['旅店可以買「月光魚湯」了'] },
  { id: 'side6', kind: 'side', no: 6, title: '商人的翻倒貨車', giver: 'merchant', summary: '招財的貨車在草原翻倒了，五個貨箱滾得到處都是。', prereq: ['main6'], ordered: true,
    objectives: [
      { id: 'crate', type: 'event', text: '在草原找回 5 個貨箱（有的藏在亮亮的地方）', count: 5 },
      { id: 'back', type: 'event', text: '把貨箱還給雜貨店的招財', marker: ['merchant'] },
    ],
    rewards: { exp: 120, money: 150, sticker: 'merchant_luck' }, rewardText: ['雜貨店的商品變多了'] },
  { id: 'side7', kind: 'side', no: 7, title: '番薯伯的祕密果園', giver: 'farmer', summary: '番薯伯年輕時種過一片月光莓，後來找不到路了。', prereq: ['main7'], ordered: true,
    objectives: [
      { id: 'bush', type: 'event', text: '去草原北邊（右上角）的灌木叢找小洞（觀察力 5 才看得到喔）' },
      { id: 'mush', type: 'event', text: '果園裡有蘑菇怪在睡覺，請牠讓一讓' },
      { id: 'berry', type: 'event', text: '摘月光莓' },
      { id: 'home', type: 'event', text: '把月光莓帶回去給番薯伯', marker: ['farmer'] },
    ],
    rewards: { exp: 150, money: 100, items: [{ id: 'moon_berry', n: 3 }], observation: 2, sticker: 'berry_taste' }, rewardText: ['可以自由進出「月光莓果園」了'] },
  { id: 'side8', kind: 'side', no: 8, title: '小貓探險隊的勇氣試煉', giver: 'lei', summary: '小雷說：要加入探險隊，晚上要進去老風車！聽說裡面有鬼！', prereq: ['main7', 'side2'], ordered: true,
    objectives: [
      { id: 'enter', type: 'event', text: '晚上和小貓們一起走進老風車（村子西北角）' },
      { id: 'top', type: 'event', text: '爬到風車的最上面，看看「鬼」是什麼' },
      { id: 'talk', type: 'event', text: '回到風車外面，跟小雷說說話', marker: ['lei'] },
    ],
    rewards: { exp: 150, courage: 3, sticker: 'explorer' }, rewardText: ['稱號「探險隊榮譽隊長」', '老風車可以自由進出了'] },
  { id: 'side9', kind: 'side', no: 9, title: '送不出去的信', giver: 'cotton', summary: '花店的棉花有一封信，想送給一個人，可是不好意思說是誰。', prereq: ['main5'], ordered: true,
    objectives: [
      { id: 'clue', type: 'talk', text: '問問村裡的貓：奶油老闆娘、橘貓守衛、麻糬媽媽', targets: ['innkeeper', 'guard', 'mochimom'], count: 3, unique: true },
      { id: 'guess', type: 'event', text: '回花店，告訴棉花：妳猜信要給誰？', marker: ['cotton'] },
      { id: 'give', type: 'event', text: '把信交給收信的貓', marker: ['toast'] },
      { id: 'back', type: 'event', text: '回花店告訴棉花', marker: ['cotton'] },
    ],
    rewards: { exp: 80, money: 50, items: [{ id: 'clover_clip', n: 1 }], observation: 1, sticker: 'letter_thanks' } },
  { id: 'side10', kind: 'side', no: 10, title: '小郵差柚子的大冒險', giver: 'yuzu', summary: '小郵差柚子跑太快，信撒了一地。今天有 5 封信要送！', prereq: ['main9'], ordered: true,
    objectives: [
      { id: 'mail', type: 'event', text: '和柚子一起送 5 封信：長老、花店的棉花、草原的稻草人信箱、小溪的海苔婆婆、森林營地的咕咕', count: 5, marker: ['elder', 'cotton', 'mailbox', 'nori', 'gugu'] },
    ],
    rewards: { exp: 180, money: 100, observation: 1, sticker: 'yuzu_join' } },
  { id: 'side11', kind: 'side', no: 11, title: '阿栗的第一面盾牌', giver: 'ali', summary: '阿栗想要一面真正屬於自己的盾牌。', prereq: ['side1', 'side3'], ordered: true,
    objectives: [
      { id: 'mats', type: 'event', text: '準備材料：野狼的毛 3 個、月光礦石 1 個（森林裡還有一顆礦石喔）', auto: { all: [{ hasItem: ['wolf_fur', 3] }, { hasItem: ['moon_ore', 1] }] } },
      { id: 'wolves', type: 'event', text: '帶阿栗一起去黑森林中間，讓他練習保護大家' },
      { id: 'forge', type: 'event', text: '回鐵匠鋪找黑炭師傅', marker: ['charcoal'] },
    ],
    rewards: { exp: 150, courage: 2, items: [{ id: 'paw_shield', n: 1 }] }, rewardText: ['阿栗學會「勇氣喵吼」'] },
  { id: 'side12', kind: 'side', no: 12, title: '奶奶的草藥筆記', giver: 'mint', summary: '銀杏婆婆的草藥筆記在黑森林弄丟了，散成了 4 頁。', prereq: ['side5', 'main10'], ordered: true,
    objectives: [
      { id: 'page', type: 'event', text: '在黑森林找回 4 頁筆記（蘑菇圈、樹洞、哥布林營地、蘑菇怪的帽子下）', count: 4 },
      { id: 'back', type: 'event', text: '把筆記交給草藥店的銀杏婆婆', marker: ['ginkgo'] },
    ],
    rewards: { exp: 150, observation: 2 }, rewardText: ['薄荷學會「草藥小包」', '草藥店有新商品了'] },
  { id: 'side13', kind: 'side', no: 13, title: '寄不出去的明信片', giver: 'yuzu', summary: '柚子有一疊明信片，想寄給去遠方送信的爸爸。', prereq: ['side10'], ordered: true,
    objectives: [
      { id: 'high', type: 'event', text: '帶柚子去 3 個「最高的地方」：村子的鐘樓、草原的大石頭、黑森林最高的大樹', count: 3 },
    ],
    rewards: { exp: 150, courage: 1, items: [{ id: 'post_badge', n: 1 }], sticker: 'postcard' }, rewardText: ['柚子學會「偷偷看」'] },
  { id: 'side14', kind: 'side', no: 14, title: '長老的月光燈籠', giver: 'elder', summary: '以前村子和森林之間點著月光燈籠，後來一盞一盞熄了。', prereq: ['main8'], ordered: true,
    objectives: [
      { id: 'light', type: 'event', text: '點亮 6 盞月光燈籠（村子 2、草原 2、森林 2），每盞要 1 朵「月見花」或 1 份「月光鱗粉」', count: 6 },
      { id: 'report', type: 'event', text: '回去告訴長老', marker: ['elder'] },
    ],
    rewards: { exp: 150, money: 80, observation: 1, sticker: 'lantern_road' }, rewardText: ['點亮的燈籠可以「快速移動」了'] },
  { id: 'side15', kind: 'side', no: 15, title: '哥布林的道歉禮物', giver: 'gugu', summary: '咕咕想跟番薯伯說對不起，可是好害怕。', prereq: ['main10'], ordered: true,
    objectives: [
      { id: 'mush', type: 'event', text: '準備 3 朵「森林蘑菇」', auto: { hasItem: ['forest_mushroom', 3] } },
      { id: 'cook', type: 'event', text: '帶咕咕去旅店，請奶油老闆娘教牠煮湯', marker: ['innkeeper'] },
      { id: 'farm', type: 'event', text: '陪咕咕去找番薯伯', marker: ['farmer'] },
    ],
    rewards: { exp: 150, courage: 2, sticker: 'apology' }, rewardText: ['草原東邊開了「哥布林交換小攤」'] },
  // ----- 喵喵小學堂（解題支線） -----
  { id: 'side16', kind: 'side', no: 16, title: '小學堂①吐司的麵包帳本（數學）', giver: 'toast', summary: '旅店的麵包師傅吐司，算錢常常算錯。幫他算一算！', prereq: ['main5'], ordered: true,
    objectives: [{ id: 'solve', type: 'event', text: '幫吐司算 3 題數學', marker: ['toast'] }],
    rewards: { exp: 80, money: 40, items: [{ id: 'star_candy', n: 2 }] } },
  { id: 'side17', kind: 'side', no: 17, title: '小學堂②海苔婆婆的英文箱子（英文）', giver: 'nori', summary: '海苔婆婆的箱子上寫著英文，她看不懂，箱子都放錯了。', prereq: ['main6'], ordered: true,
    objectives: [{ id: 'solve', type: 'event', text: '幫海苔婆婆看懂 3 個英文', marker: ['nori'] }],
    rewards: { exp: 100, items: [{ id: 'silver_fish', n: 1 }, { id: 'star_candy', n: 1 }], observation: 1 } },
  { id: 'side18', kind: 'side', no: 18, title: '小學堂③薄荷的草藥課（自然）', giver: 'ginkgo', summary: '薄荷想考考大家：植物和動物的小知識。', prereq: ['side5'], ordered: true,
    objectives: [{ id: 'solve', type: 'event', text: '回答薄荷的 3 題自然', marker: ['ginkgo'] }],
    rewards: { exp: 120, items: [{ id: 'herb_tea', n: 2 }], observation: 1 } },
  { id: 'side19', kind: 'side', no: 19, title: '小學堂④鐘樓的三個謎題（綜合）', giver: 'elder', summary: '長老說：鐘樓的鐘，只有答出三個謎題的勇者才敲得響。', prereq: ['main8'], ordered: true,
    objectives: [{ id: 'solve', type: 'event', text: '去鐘樓下面，答出 3 個謎題（數學、英文、自然各一題）' }],
    rewards: { exp: 150, courage: 1, items: [{ id: 'star_candy', n: 2 }] } },
  { id: 'side20', kind: 'side', no: 20, title: '小學堂⑤編織奶奶的毛線考驗（綜合）', giver: 'weaver', summary: '編織店的貓奶奶說：會想的孩子，最勇敢。', prereq: ['main10'], ordered: true,
    objectives: [{ id: 'solve', type: 'event', text: '回答編織奶奶的 4 題（比較難喔）', marker: ['weaver'] }],
    rewards: { exp: 200, courage: 1, items: [{ id: 'smoke_yarn', n: 2 }, { id: 'star_candy', n: 2 }] } },
];
for (const q of Q) { QUESTS[q.id] = q; if (!QUEST_ORDER.includes(q.id)) QUEST_ORDER.push(q.id); }
QUESTS.main11.rewards.sticker = 'rock_friend';

// ---------------- 新角色 ----------------
const lanternSpot = (id: string, map: string, x: number, y: number) => [{ when: { flag: id }, map, x, y, sprite: 'lantern_on' }, { map, x, y }];
const N: NpcDef[] = [
  { id: 'yuzu', name: '柚子', sprite: 'yuzu', portrait: 'yuzu_big', isCat: true, giverOf: ['side10', 'side13'], follow: { any: [{ inParty: 'yuzu' }] },
    voice: { base: 980, len: 0.09, type: 'square', bend: 1.6, chirps: 4, gap: 0.02, bright: 1.3, vol: 0.7 },
    spots: [{ when: { all: [{ questDone: 'main9' }, { notRecruited: 'yuzu' }] }, map: 'village', x: t(17) + 16, y: t(9) + 20 }, { when: { recruited: 'yuzu' }, map: 'village', x: t(22) + 16, y: t(10) + 20 }, { map: 'village', x: 0, y: 0, hidden: true }],
    talk: [{ when: { questAvailable: 'side10' }, d: 'side10_start' }, { when: { questAvailable: 'side13' }, d: 'side13_start' }, { when: { recruited: 'yuzu' }, d: 'yuzu_bench' }, { d: 'yuzu_default' }] },
  { id: 'cotton', name: '棉花', sprite: 'cotton', portrait: 'cotton_big', isCat: true, giverOf: ['side9'], voice: { base: 860, len: 0.18, type: 'sine', bend: 1.2, drop: 0.9, bright: 1.2, vol: 0.8 },
    spots: [{ map: 'village', x: t(26) + 16, y: t(8) + 20 }],
    talk: [{ when: ocur('side10', 'mail'), d: 'side10_cotton' }, { when: { questAvailable: 'side9' }, d: 'side9_start' }, { when: ocur('side9', 'guess'), d: 'side9_guess' }, { when: ocur('side9', 'back'), d: 'side9_back' }, { when: { questActive: 'side9' }, d: 'side9_wait' }, { d: 'cotton_default' }] },
  { id: 'toast', name: '吐司', sprite: 'toast', portrait: 'toast_big', isCat: true, giverOf: ['side16'], voice: { base: 430, len: 0.3, type: 'triangle', bend: 1.15, drop: 0.7, vol: 0.9 },
    spots: [{ map: 'village', x: t(6) + 16, y: t(10) + 20 }],
    talk: [{ when: ocur('side9', 'give'), d: 'side9_toast' }, { when: { questAvailable: 'side16' }, d: 'side16_start' }, { when: ocur('side16', 'solve'), d: 'side16_solve' }, { when: { questDone: 'side16' }, d: 'toast_practice' }, { d: 'toast_default' }] },
  { id: 'charcoal', name: '黑炭師傅', sprite: 'charcoal', portrait: 'charcoal_big', isCat: true, giverOf: ['side3'], portraitH: 200, voice: { base: 190, len: 0.4, type: 'sawtooth', bend: 1.1, drop: 0.6, bright: 0.6, vol: 1.1 },
    spots: [{ map: 'village', x: t(25) + 8, y: t(27) + 20 }],
    talk: [{ when: ocur('side4', 'pot'), d: 'side4_pot' }, { when: { questAvailable: 'side3' }, d: 'side3_start' }, { when: ocur('side3', 'give'), d: 'side3_give' }, { when: ocur('side11', 'forge'), d: 'side11_forge' }, { when: { questActive: 'side3' }, d: 'side3_wait' },
      { when: { all: [{ questDone: 'side3' }, { time: 'night' }, { notFlag: 'ev_charcoal' }] }, d: 'charcoal_secret' }, { when: { questDone: 'side3' }, d: 'charcoal_shop' }, { d: 'charcoal_default' }] },
  { id: 'nori', name: '海苔婆婆', sprite: 'nori', portrait: 'nori_big', isCat: true, giverOf: ['side17'], voice: { base: 330, len: 0.5, type: 'triangle', bend: 1.1, drop: 0.75, vib: 4, vol: 0.9 },
    spots: [{ map: 'meadow', x: t(14) + 12, y: t(12) + 22 }],
    talk: [{ when: { all: [ocur('side10', 'mail'), { notFlag: 'mail_nori' }] }, d: 'side10_nori' }, { when: ocur('side4', 'fish'), d: 'side4_fish' }, { when: { questAvailable: 'side17' }, d: 'side17_start' }, { when: ocur('side17', 'solve'), d: 'side17_solve' },
      { when: { all: [{ questDone: 'side17' }, { notFlag: 'nori_wait3' }] }, d: 'nori_wait' }, { d: 'nori_default' }] },
  { id: 'weaver', name: '編織奶奶', sprite: 'weaver', portrait: 'weaver_big', isCat: true, giverOf: ['side20'], voice: { base: 600, len: 0.45, type: 'sine', bend: 1.15, drop: 0.8, vib: 6, vol: 0.85 },
    spots: [{ map: 'village', x: t(26) + 16, y: t(19) + 16 }],
    talk: [{ when: { hasItem: ['yarn_ball', 1] }, d: 'weaver_yarn' }, { when: { questAvailable: 'side20' }, d: 'side20_start' }, { when: ocur('side20', 'solve'), d: 'side20_solve' }, { d: 'weaver_default' }] },
  { id: 'lei', name: '小雷', sprite: 'lei', portrait: 'lei_big', isCat: true, giverOf: ['side8'], follow: { any: [ocur('side8', 'enter'), ocur('side8', 'top')] }, voice: { base: 900, len: 0.12, type: 'square', bend: 1.4, chirps: 2, gap: 0.04, vol: 0.7 },
    spots: [{ map: 'village', x: t(4) + 16, y: t(6) + 24 }],
    talk: [{ when: { questAvailable: 'side8' }, d: 'side8_start' }, { when: ocur('side8', 'enter'), d: 'side8_go' }, { when: ocur('side8', 'talk'), d: 'side8_end' }, { d: 'lei_default' }] },
  { id: 'afu', name: '阿福', sprite: 'afu', portrait: 'afu_big', isCat: true, follow: { any: [ocur('side8', 'enter'), ocur('side8', 'top')] }, voice: { base: 760, len: 0.2, type: 'triangle', bend: 1.2, drop: 0.85, vol: 0.8 },
    spots: [{ map: 'village', x: t(1) + 24, y: t(6) + 24 }],
    talk: [{ when: { questActive: 'side8' }, d: 'afu_scared' }, { d: 'afu_default' }] },
  { id: 'mailbox', name: '稻草人小屋的信箱', sprite: 'mailbox', spots: [{ map: 'meadow', x: t(18) + 16, y: t(7) + 26 }],
    talk: [{ when: { all: [ocur('side10', 'mail'), { notFlag: 'mail_box' }, { notFlag: 'mail_blown' }] }, d: 'side10_box' }, { when: { all: [ocur('side10', 'mail'), { flag: 'mail_blown' }, { flag: 'mail_got' }, { notFlag: 'mail_box' }] }, d: 'side10_box2' }, { d: 'mailbox_default' }] },
  { id: 'crategob', name: '坐在箱子上的哥布林', sprite: 'goblin', goblin: true, spots: [{ when: { all: [{ questActive: 'side6' }, { notFlag: 'crate5' }] }, map: 'meadow', x: t(17) + 16, y: t(14) + 20 }, { map: 'meadow', x: 0, y: 0, hidden: true }],
    talk: [{ when: { flag: 'catSpeech' }, d: 'side6_gob' }] },
  { id: 'omush', name: '打瞌睡的蘑菇怪', sprite: 'mushroom', bob: true, spots: [{ when: { all: [{ questActive: 'side7' }, { notFlag: 'omush_ok' }] }, map: 'orchard', x: t(6) + 16, y: t(4) + 20 }, { map: 'orchard', x: t(10) + 16, y: t(1) + 24, flip: true }],
    talk: [{ when: { notFlag: 'omush_ok' }, d: 'side7_mush' }, { d: 'omush_sleep' }] },
  { id: 'nmush', name: '蘑菇怪', sprite: 'mushroom', spots: [{ when: { all: [{ questActive: 'side12' }, { notFlag: 'note4' }] }, map: 'forest', x: t(16) + 16, y: t(35) + 20 }, { map: 'forest', x: 0, y: 0, hidden: true }],
    talk: [{ d: 'side12_mush' }] },
  { id: 'omush2', name: '擋路的蘑菇怪', sprite: 'mushroom', spots: [{ when: { all: [{ questActive: 'side3' }, { notFlag: 'ore3' }] }, map: 'forest', x: t(3) + 16, y: t(21) + 20 }, { map: 'forest', x: 0, y: 0, hidden: true }],
    talk: [{ d: 'side3_mush' }] },
  { id: 'trader', name: '交換小攤的哥布林', sprite: 'fgoblin', goblin: true, spots: [{ when: { questDone: 'side15' }, map: 'meadow', x: t(21) + 16, y: t(9) + 22 }, { map: 'meadow', x: 0, y: 0, hidden: true }],
    talk: [{ d: 'trader_hi' }] },
  { id: 'roofcat', name: '小白貓', sprite: 'whitecat', isCat: true, voice: { base: 880, len: 0.3, type: 'sine', bend: 1.25, drop: 0.8, vib: 7, bright: 1.4 },
    spots: [
      { when: { all: [{ questDone: 'main6' }, { notFlag: 'roof1' }] }, map: 'village', x: 100, y: 376, lift: 100 },
      { when: { all: [{ questDone: 'main9' }, { flag: 'roof1' }, { notFlag: 'roof2' }] }, map: 'village', x: 624, y: 376, lift: 96 },
      { when: { all: [{ questDone: 'main10' }, { flag: 'roof2' }, { notFlag: 'roof3' }, { time: 'night' }] }, map: 'village', x: 176, y: 168, lift: 100 },
      { map: 'village', x: 0, y: 0, hidden: true },
    ],
    talk: [{ when: { notFlag: 'roof1' }, d: 'roof1' }, { when: { notFlag: 'roof2' }, d: 'roof2' }, { d: 'roof3' }] },
  { id: 'napcat', name: '午睡的貓', sprite: 'mochimom', isCat: true, scale: 0.9, voice: { base: 520, len: 0.6, type: 'sine', bend: 0.9, drop: 0.6, vol: 0.6 },
    spots: [{ when: { all: [{ questDone: 'main5' }, { time: 'day' }] }, map: 'village', x: t(15) + 16, y: t(14) + 20, flip: true }, { map: 'village', x: 0, y: 0, hidden: true }],
    talk: [{ when: { flag: 'nap2' }, d: 'nap3' }, { when: { flag: 'nap1' }, d: 'nap2' }, { d: 'nap1' }] },
  // 月光燈籠（支線 14、快速移動）
  { id: 'lan_v1', name: '月光燈籠', sprite: 'lantern_off', spots: lanternSpot('lan_v1', 'village', t(8) + 16, t(9) + 20), talk: [{ d: 'lantern' }] },
  { id: 'lan_v2', name: '月光燈籠', sprite: 'lantern_off', spots: lanternSpot('lan_v2', 'village', t(12) + 16, t(29) + 20), talk: [{ d: 'lantern' }] },
  { id: 'lan_m1', name: '月光燈籠', sprite: 'lantern_off', spots: lanternSpot('lan_m1', 'meadow', t(11) + 16, t(2) + 20), talk: [{ d: 'lantern' }] },
  { id: 'lan_m2', name: '月光燈籠', sprite: 'lantern_off', spots: lanternSpot('lan_m2', 'meadow', t(14) + 16, t(19) + 20), talk: [{ d: 'lantern' }] },
  { id: 'lan_f1', name: '月光燈籠', sprite: 'lantern_off', spots: lanternSpot('lan_f1', 'forest', t(13) + 16, t(4) + 28), talk: [{ d: 'lantern' }] },
  { id: 'lan_f2', name: '月光燈籠', sprite: 'lantern_off', spots: lanternSpot('lan_f2', 'forest', t(12) + 16, t(33) + 28), talk: [{ d: 'lantern' }] },
];
const old = NPCS.findIndex(n => n.id === 'yuzu'); if (old >= 0) NPCS.splice(old, 1);
NPCS.push(...N);
// 舊角色加上新的對話（插在主線的對話後面）
function addTalk(id: string, entries: { when?: Cond; d: string }[], front = false) {
  const n = NPCS.find(x => x.id === id)!; if (front) { n.talk.unshift(...entries); return; }
  let pos = 0; n.talk.forEach((e, i) => { if (/objCurrent":\["main|objNotDone":\["main|questActive":"main(2|3)"/.test(JSON.stringify(e.when ?? {}))) pos = i + 1; });
  n.talk.splice(pos, 0, ...entries);
}
const notF = (f: string): Cond => ({ notFlag: f });
addTalk('elder', [
  { when: { all: [ocur('side10', 'mail'), notF('mail_elder')] }, d: 'side10_elder' },
  { when: ocur('side4', 'taste'), d: 'side4_taste_elder' },
  { when: { questAvailable: 'side14' }, d: 'side14_start' }, { when: ocur('side14', 'report'), d: 'side14_report' },
  { when: { questAvailable: 'side19' }, d: 'side19_start' },
  { when: { any: [...[10, 20, 30, 40, 50].map(n => ({ all: [{ minStickers: n }, { notFlag: 'sb' + n }] })), { all: [{ allStickers: true }, { notFlag: 'sb60' }] }] }, d: 'elder_board' },
  { when: { all: [{ time: 'night' }, { questDone: 'main6' }] }, d: 'elder_story' },
]);
addTalk('guard', [{ when: ocur('side4', 'taste'), d: 'side4_taste_guard' }, { when: { all: [ocur('side9', 'clue'), notF('c9_guard')] }, d: 'side9_clue_guard' }]);
addTalk('whitecat', [{ when: ocur('side4', 'taste'), d: 'side4_taste_cat' }], true);
addTalk('innkeeper', [{ when: { questAvailable: 'side4' }, d: 'side4_start' }, { when: ocur('side4', 'cook'), d: 'side4_cook' }, { when: ocur('side15', 'cook'), d: 'side15_cook' }, { when: { all: [ocur('side9', 'clue'), notF('c9_inn')] }, d: 'side9_clue_inn' }, { when: { questDone: 'side4' }, d: 'inn_menu' }]);
addTalk('mochimom', [{ when: { all: [ocur('side9', 'clue'), notF('c9_mochi')] }, d: 'side9_clue_mochi' }, { when: { questDone: 'side2' }, d: 'douhua_gallery' }]);
addTalk('merchant', [{ when: { questAvailable: 'side6' }, d: 'side6_start' }, { when: ocur('side6', 'back'), d: 'side6_back' }, { when: { all: [{ questDone: 'side6' }, { flag: 'catSpeech' }] }, d: 'merchant_shop2' }]);
addTalk('farmer', [{ when: { questAvailable: 'side7' }, d: 'side7_start' }, { when: ocur('side7', 'home'), d: 'side7_home' }, { when: ocur('side15', 'farm'), d: 'side15_farm' }]);
addTalk('ginkgo', [{ when: ocur('side12', 'back'), d: 'side12_back' }, { when: { questAvailable: 'side18' }, d: 'side18_start' }, { when: ocur('side18', 'solve'), d: 'side18_solve' }, { when: { questDone: 'side12' }, d: 'ginkgo_shop2' }]);
addTalk('mint', [{ when: { questAvailable: 'side12' }, d: 'side12_start' }], true);
addTalk('ali', [{ when: { questAvailable: 'side11' }, d: 'side11_start' }], true);
addTalk('gugu', [{ when: { all: [ocur('side10', 'mail'), notF('mail_gugu'), { flag: 'mail_bat' }] }, d: 'side10_gugu' }, { when: { questAvailable: 'side15' }, d: 'side15_start' }, { when: { questActive: 'side15' }, d: 'side15_wait' }], true);
addTalk('gob1', [{ when: { all: [{ questActive: 'side12' }, notF('note3')] }, d: 'side12_gob' }], true);
addTalk('campfire', [{ when: { all: [{ questAvailable: 'side13' }, { recruited: 'yuzu' }] }, d: 'side13_start' }, { when: { all: [{ questDone: 'main10' }, { minCompanions: 1 }] }, d: 'campfire_talk' }], true);
// 柚子有信要送時、帶咕咕煮湯時：咕咕跟著走
const gugu = NPCS.find(n => n.id === 'gugu')!; gugu.follow = { any: [ocur('side15', 'cook'), ocur('side15', 'farm')] };
const douhua = NPCS.find(n => n.id === 'douhua')!; douhua.follow = { any: [douhua.follow!, ocur('side8', 'enter'), ocur('side8', 'top')] };

// ---------------- 對話 ----------------
const D: Record<string, Dialogue> = {
  // ===== 支線 3：鐵匠的月光礦石 =====
  side3_start: [
    { s: 'narr', t: '鐵匠鋪的爐子冷冰冰的。一隻好大的黑貓坐在門口。' },
    { s: 'charcoal', t: '……沒礦石。打不了。' },
    { s: 'hero', t: '那我幫你去找！' },
    { s: 'charcoal', t: '……黑森林有。會發光。……危險。', act: [{ type: 'startQuest', id: 'side3' }] },
    { s: 'charcoal', t: '……謝謝。' },
    { s: 'system', t: '月光礦石在黑森林裡喵。可以進黑森林以後，找找亮亮的地方吧！' },
  ],
  side3_wait: [{ s: 'charcoal', t: '……礦石。三顆。' }],
  ore1: [{ s: 'narr', t: '樹洞裡有一顆藍藍亮亮的石頭！', act: [{ type: 'item', id: 'moon_ore' }, { type: 'flag', id: 'ore1' }, { type: 'obj', quest: 'side3', obj: 'ore' }] }],
  ore2: [{ s: 'narr', t: '草叢裡有一顆會發光的石頭！', act: [{ type: 'item', id: 'moon_ore' }, { type: 'flag', id: 'ore2' }, { type: 'obj', quest: 'side3', obj: 'ore' }] }],
  ore4: [{ s: 'narr', t: '樹根旁邊，又找到一顆月光礦石！', act: [{ type: 'item', id: 'moon_ore' }, { type: 'flag', id: 'ore4' }] }],
  side3_mush: [
    { s: 'narr', t: '一隻蘑菇怪抱著一顆亮亮的石頭，睡得好香。' },
    { s: 'hero', t: '不好意思……那顆石頭可以給我嗎？', act: [{ type: 'battle', encounter: 'ore_mush' }] },
    { s: 'narr', t: '蘑菇怪搖搖晃晃地走開了，石頭留在地上。', act: [{ type: 'item', id: 'moon_ore' }, { type: 'flag', id: 'ore3' }, { type: 'obj', quest: 'side3', obj: 'ore' }] },
  ],
  side3_give: [
    { s: 'hero', t: '黑炭師傅！三顆月光礦石，找到了！', act: [{ type: 'take', id: 'moon_ore', n: 3 }] },
    { s: 'charcoal', t: '……好。' },
    { s: 'narr', t: '黑炭師傅把礦石放進爐子。可是火只冒出一點點煙。' },
    { s: 'charcoal', t: '……火，不夠旺。……妳知道，為什麼嗎？' },
    { s: 'system', t: '喵喵小學堂！想一想，火要燒得旺，需要什麼？', act: [{ type: 'quiz', ids: ['s17'], by: 'charcoal', title: '小學堂：鐵匠鋪的火' }] },
    { s: 'hero', t: '要讓空氣跑進去！火需要氧氣！' },
    { s: 'narr', t: '黑炭師傅拉了拉風箱。呼——呼——！爐子的火一下子變得又紅又亮！', act: [{ type: 'sfx', id: 'hit' }] },
    { s: 'charcoal', t: '……聰明。' },
    { s: 'narr', t: '叮！叮！叮！黑炭師傅把小木劍敲了又敲。木劍慢慢發出了月光。' },
    { s: 'charcoal', t: '這把劍會發光，是因為拿劍的人，心裡有光。', act: [{ type: 'obj', quest: 'side3', obj: 'give' }] },
    { s: 'narr', t: '（黑炭師傅第一次講了這麼長的話。）' },
  ],
  charcoal_default: [{ s: 'charcoal', t: '……嗯。' }],
  charcoal_shop: [{ s: 'charcoal', t: '……要什麼。', act: [{ type: 'shop', title: '🔨 鐵匠鋪', items: [{ id: 'wrist_guard', price: 60 }, { id: 'light_shoes', price: 60 }] }] }],
  charcoal_secret: [
    { s: 'narr', t: '鐵匠鋪後面，黑炭師傅蹲在地上，把麵包屑分給一群小鳥。' },
    { s: 'charcoal', t: '……！' },
    { s: 'charcoal', t: '……沒看到。妳什麼都沒看到。', act: [{ type: 'flag', id: 'ev_charcoal' }, { type: 'stat', observation: 1 }, { type: 'sticker', id: 'charcoal_secret' }] },
  ],
  // ===== 支線 4：旅店的招牌料理 =====
  side4_start: [
    { s: 'innkeeper', t: '哎呀，勇者小妹妹！我想做一道新的招牌菜「月光魚湯」！' },
    { s: 'innkeeper', t: '可是缺材料呀！要草原的香香草 3 株、小溪的銀光小魚，還有一個大鐵鍋！', choices: [
      { label: '我來幫忙！', act: [{ type: 'startQuest', id: 'side4' }] }, { label: '等一下喔', next: 'later' }] },
    { s: 'innkeeper', t: '哈哈哈！太好了！香香草在草原，亮亮的地方找找看喔！' },
  ],
  later: [{ s: 'hero', t: '（等一下再來吧。）' }],
  herb1: [{ s: 'narr', t: '找到一株香香草！聞起來好舒服。', act: [{ type: 'item', id: 'sweet_herb' }, { type: 'flag', id: 'herb1' }, { type: 'obj', quest: 'side4', obj: 'herb' }] }],
  herb2: [{ s: 'narr', t: '找到一株香香草！', act: [{ type: 'item', id: 'sweet_herb' }, { type: 'flag', id: 'herb2' }, { type: 'obj', quest: 'side4', obj: 'herb' }] }],
  herb3: [{ s: 'narr', t: '找到一株香香草！葉子上有露水。', act: [{ type: 'item', id: 'sweet_herb' }, { type: 'flag', id: 'herb3' }, { type: 'obj', quest: 'side4', obj: 'herb' }] }],
  side4_fish: [
    { s: 'nori', t: '想要銀光小魚呀？呵呵，釣魚的祕訣，就是「等」。' },
    { s: 'nori', t: '來，陪婆婆一起等。' },
    { s: 'narr', t: '……', act: [{ type: 'wait', ms: 600 }] },
    { s: 'narr', t: '……噗通！浮標動了！' },
    { s: 'nori', t: '妳看，等一等，就來了。拿去吧，兩條。', act: [{ type: 'item', id: 'silver_fish', n: 2 }, { type: 'obj', quest: 'side4', obj: 'fish' }] },
  ],
  side4_pot: [
    { s: 'hero', t: '黑炭師傅，可以借我大鐵鍋嗎？要煮月光魚湯。' },
    { s: 'charcoal', t: '……拿去。', act: [{ type: 'item', id: 'iron_pot' }, { type: 'obj', quest: 'side4', obj: 'pot' }] },
    { s: 'narr', t: '（就這樣，好簡單。）' },
  ],
  side4_cook: [
    { s: 'innkeeper', t: '材料都到齊啦！我們要煮 3 鍋，一鍋要放 2 條小魚……', act: [{ type: 'take', id: 'sweet_herb', n: 3 }, { type: 'take', id: 'iron_pot' }] },
    { s: 'innkeeper', t: '哎呀，我算數不太好！小妹妹幫我算算看？', act: [{ type: 'quiz', ids: ['m26'], by: 'innkeeper', title: '小學堂：煮魚湯' }] },
    { s: 'innkeeper', t: '6 條！可是我們只有 2 條……那就煮 1 大鍋吧！哈哈哈！', act: [{ type: 'take', id: 'silver_fish', n: 2 }] },
    { s: 'narr', t: '咕嘟咕嘟……旅店裡飄出好香好香的味道。', act: [{ type: 'obj', quest: 'side4', obj: 'cook' }] },
    { s: 'innkeeper', t: '完成！端去給大家嚐嚐看吧：守衛、長老，還有小白貓！' },
  ],
  side4_taste_guard: [
    { s: 'guard', t: '這、這是……月光魚湯？', when: { notFlag: 't4_guard' } },
    { s: 'guard', t: '……嗚嗚，好好喝。我才沒有哭。', when: { notFlag: 't4_guard' }, act: [{ type: 'flag', id: 't4_guard' }, { type: 'obj', quest: 'side4', obj: 'taste' }] },
    { s: 'guard', t: '湯很好喝喔，謝謝妳。', when: { flag: 't4_guard' } },
  ],
  side4_taste_elder: [
    { s: 'elder', t: '呵呵……這是年輕時的味道啊。', when: { notFlag: 't4_elder' }, act: [{ type: 'flag', id: 't4_elder' }, { type: 'obj', quest: 'side4', obj: 'taste' }] },
    { s: 'elder', t: '好湯，好湯。', when: { flag: 't4_elder' } },
  ],
  side4_taste_cat: [
    { s: 'whitecat', t: '喵。', when: { notFlag: 't4_cat' } },
    { s: 'narr', t: '小白貓舔了一口湯……然後咻地一下不見了！碗裡的湯也喝光了。', when: { notFlag: 't4_cat' }, act: [{ type: 'flag', id: 't4_cat' }, { type: 'obj', quest: 'side4', obj: 'taste' }] },
    { s: 'whitecat', t: '喵～', when: { flag: 't4_cat' } },
  ],
  inn_menu: [{ s: 'innkeeper', t: '要不要來一碗月光魚湯呀？出發前喝，暖呼呼的！', act: [{ type: 'shop', title: '🍲 旅店料理', items: [{ id: 'fish_soup', price: 40 }, { id: 'cookie', price: 10 }] }] }],
  // ===== 支線 6：招財的貨箱 =====
  side6_start: [
    { s: 'merchant', t: '嗚嗚，損失太大了喵！我的貨車在草原翻倒了，五個貨箱滾得到處都是！' },
    { s: 'merchant', t: '勇者大人，可以幫我找回來嗎？', choices: [{ label: '好，我去找！', act: [{ type: 'startQuest', id: 'side6' }] }, { label: '等一下喔', next: 'later' }] },
    { s: 'merchant', t: '划算喵！有兩個可能藏在很難看到的地方，要仔細看喔！' },
  ],
  crate1: [{ s: 'narr', t: '草叢裡有一個寫著「划算喵」的木箱子！', act: [{ type: 'item', id: 'crate' }, { type: 'flag', id: 'crate1' }, { type: 'obj', quest: 'side6', obj: 'crate' }] }],
  crate2: [{ s: 'narr', t: '路邊滾著一個貨箱！', act: [{ type: 'item', id: 'crate' }, { type: 'flag', id: 'crate2' }, { type: 'obj', quest: 'side6', obj: 'crate' }] }],
  crate3: [{ s: 'narr', t: '高高的草裡，藏著一個貨箱！', act: [{ type: 'item', id: 'crate' }, { type: 'flag', id: 'crate3' }, { type: 'obj', quest: 'side6', obj: 'crate' }] }],
  crate4: [{ s: 'narr', t: '石頭後面也有一個貨箱！', act: [{ type: 'item', id: 'crate' }, { type: 'flag', id: 'crate4' }, { type: 'obj', quest: 'side6', obj: 'crate' }] }],
  side6_gob: [
    { s: 'crategob', t: '咕嘰～這個箱子坐起來好舒服喔。' },
    { s: 'hero', t: '那是招財叔叔的箱子，可以還給他嗎？', act: [{ type: 'battle', encounter: 'crate_gob' }] },
    { s: 'crategob', t: '好啦好啦，還你。可是……裡面如果有餅乾，可以分我一片嗎？', when: { hasItem: ['cookie', 1] }, choices: [
      { label: '分你一片', act: [{ type: 'take', id: 'cookie' }, { type: 'stat', courage: 1 }, { type: 'flag', id: 'gob_cookie' }] }, { label: '對不起，不行', act: [] }] },
    { s: 'crategob', t: '咔滋咔滋……好好吃！謝謝妳！', when: { flag: 'gob_cookie' } },
    { s: 'narr', t: '拿回了貨箱！', act: [{ type: 'item', id: 'crate' }, { type: 'flag', id: 'crate5' }, { type: 'obj', quest: 'side6', obj: 'crate' }] },
  ],
  side6_back: [
    { s: 'hero', t: '招財叔叔，五個貨箱都找回來了！', act: [{ type: 'take', id: 'crate', n: 5 }] },
    { s: 'merchant', t: '全部都在！妳真是幸運貓！我來數數看，每箱有 25 包小魚乾……' },
    { s: 'merchant', t: '哎呀，數字太多了喵。勇者大人幫我算算？', act: [{ type: 'quiz', ids: ['m27'], by: 'merchant', title: '小學堂：數貨箱' }] },
    { s: 'merchant', t: '125 包！一包都沒少！以後勇者大人來買東西，我一定給妳好貨喵！', act: [{ type: 'obj', quest: 'side6', obj: 'back' }] },
  ],
  merchant_shop2: [{ s: 'merchant', t: '歡迎光臨！新貨到了，划算喵！', act: [{ type: 'shop', title: '🛒 招財的雜貨店', items: [{ id: 'cookie', price: 10 }, { id: 'sweet_potato', price: 18 }, { id: 'herb_tea', price: 25 }, { id: 'jerky', price: 20 }, { id: 'smoke_yarn', price: 15 }] }] }],
  // ===== 支線 7：番薯伯的祕密果園 =====
  side7_start: [
    { s: 'farmer', t: '喂，勇者！過來過來！……妳是勇者，我才跟妳說。' },
    { s: 'farmer', t: '我年輕的時候，在草原種過一片月光莓。後來……找不到路了。' },
    { s: 'farmer', t: '這是我以前畫的地圖。上面畫著草原北邊的灌木叢。', act: [{ type: 'startQuest', id: 'side7' }, { type: 'item', id: 'map_piece' }] },
    { s: 'system', t: '灌木叢的小洞很難發現，要觀察力 5 才看得到喵。觀察力可以靠任務和發現祕密提升！' },
  ],
  bush_locked: [{ s: 'narr', t: '灌木叢好茂密，鑽不過去。' }],
  glint_bush: [
    { s: 'narr', t: '灌木叢下面……有一個小小的洞！好像可以鑽過去。', act: [{ type: 'flag', id: 'orchard_open' }, { type: 'obj', quest: 'side7', obj: 'bush' }] },
  ],
  orchard_enter: [
    { s: 'narr', t: '鑽過灌木叢……眼前是一片被月光照亮的小果園！' },
    { s: 'hero', t: '好漂亮……這就是番薯伯的果園！', act: [{ type: 'sticker', id: 'orchard_night' }] },
  ],
  side7_mush: [
    { s: 'omush', t: '這裡……好安靜……不要吵……' },
    { s: 'hero', t: '蘑菇怪，可以讓一讓嗎？我想摘月光莓。', act: [{ type: 'battle', encounter: 'orchard_mush' }] },
    { s: 'omush', t: '呼……好吧……我去旁邊睡……', act: [{ type: 'flag', id: 'omush_ok' }, { type: 'obj', quest: 'side7', obj: 'mush' }] },
  ],
  omush_sleep: [{ s: 'narr', t: '蘑菇怪在角落睡得好香。呼嚕……' }],
  glint_berry: [{ s: 'narr', t: '摘到了紅紅亮亮的月光莓！', act: [{ type: 'item', id: 'moon_berry', n: 1 }, { type: 'obj', quest: 'side7', obj: 'berry' }] }],
  side7_home: [
    { s: 'farmer', t: '這、這是……月光莓！', act: [{ type: 'take', id: 'moon_berry', n: 1 }] },
    { s: 'farmer', t: '嗯……就是這個味道！……我才沒有哭，是風太大。' },
    { s: 'farmer', t: '對了，月光莓要怎麼種才會長得好呢？妳知道嗎？', act: [{ type: 'quiz', ids: ['s05'], by: 'farmer', title: '小學堂：種月光莓' }] },
    { s: 'farmer', t: '哈哈！妳比我還懂！那片果園以後就交給妳照顧啦！', act: [{ type: 'obj', quest: 'side7', obj: 'home' }] },
  ],
  // ===== 支線 8：小貓探險隊 =====
  side8_start: [
    { s: 'lei', t: '喂！妳就是勇者？要加入我們「小貓探險隊」，要通過勇氣試煉！' },
    { s: 'afu', t: '（小聲）小雷，真的要去嗎……' },
    { s: 'lei', t: '晚上！進去村子後面的老風車！聽說裡面有鬼！', choices: [
      { label: '好，等到晚上一起去！', act: [{ type: 'startQuest', id: 'side8' }, { type: 'time', v: 'night' }] }, { label: '我再想想', next: 'later' }] },
    { s: 'narr', t: '太陽下山了。天上掛著好大的月亮。' },
    { s: 'douhua', t: '我也要去！我也要去！' },
    { s: 'system', t: '小貓們跟著妳了喵。老風車在村子的西北角！' },
  ],
  side8_go: [{ s: 'lei', t: '走、走啊！我、我才不怕！' }],
  windmill_locked: [{ s: 'narr', t: '老風車的門關著。小雷說，晚上才能進去。' }],
  mill_enter: [
    { s: 'narr', t: '風車裡面黑黑的，木頭地板嘎吱嘎吱響。' },
    { s: 'afu', t: '嗚嗚……勇者大人，我可以抓著妳的書包嗎……' },
    { s: 'lei', t: '我、我走在最後面，是為了保護大家！' },
    { s: 'system', t: '風車上面有聲音……走到最上面看看吧喵。', act: [{ type: 'obj', quest: 'side8', obj: 'enter' }] },
  ],
  mill_top: [
    { s: 'narr', t: '「啦～啦啦～♪」……是歌聲！' },
    { s: 'narr', t: '月光從窗戶照進來，一群蝙蝠怪倒掛在樑上，正在練習唱歌。' },
    { s: 'bat', t: '吱！有人來了！大家，排好隊形！', act: [{ type: 'battle', encounter: 'mill_bats' }] },
    { s: 'bat', t: '對不起……我們吵到你們了嗎？我們只是想辦一場演唱會……' },
    { s: 'hero', t: '原來「鬼」是你們呀！唱得很好聽喔。' },
    { s: 'bat', t: '真的嗎？那……我們以後只在週末練習！', act: [{ type: 'obj', quest: 'side8', obj: 'top' }, { type: 'sticker', id: 'windmill_top' }] },
    { s: 'narr', t: '從風車的窗戶看出去，月亮又大又圓。' },
  ],
  side8_end: [
    { s: 'lei', t: '……喂，勇者。其實我剛剛很怕。妳怎麼都不怕？' },
    { s: 'hero', t: '我也怕啊。可是我們一起，就沒那麼怕了。' },
    { s: 'lei', t: '……嗯！妳是我們探險隊的榮譽隊長！', act: [{ type: 'title', id: '探險隊榮譽隊長' }, { type: 'flag', id: 'windmill_open' }, { type: 'time', v: 'day' }, { type: 'obj', quest: 'side8', obj: 'talk' }] },
    { s: 'narr', t: '天亮了。' },
  ],
  lei_default: [{ s: 'lei', t: '探險隊今天也要出發！……等我吃完點心。' }],
  afu_scared: [{ s: 'afu', t: '嗚……我、我會跟緊妳的……' }],
  afu_default: [{ s: 'afu', t: '妳要不要吃小魚乾？……一片就好喔。' }],
  glint_millbox: [{ s: 'narr', t: '風車地板下面，有一個舊舊的小箱子。裡面有一張畫著月亮的紙。', act: [{ type: 'sticker', id: 'windmill_box' }, { type: 'stat', observation: 1 }] }],
  // ===== 支線 9：送不出去的信 =====
  side9_start: [
    { s: 'cotton', t: '那、那個……這封信，可以請妳幫我送給一個人嗎？' },
    { s: 'cotton', t: '可是……我不好意思說是誰……我只能給妳三個提示。', act: [{ type: 'startQuest', id: 'side9' }, { type: 'item', id: 'cotton_letter' }] },
    { s: 'cotton', t: '他每天最早起床。他身上有麵粉的味道。他會分麵包給小鳥。' },
    { s: 'system', t: '去問問奶油老闆娘、橘貓守衛、麻糬媽媽，找出線索吧喵！' },
  ],
  side9_wait: [{ s: 'cotton', t: '（棉花的臉紅紅的）……拜、拜託妳了。' }],
  side9_clue_inn: [{ s: 'innkeeper', t: '每天最早起床的？哈哈，是我們旅店廚房的人呀！天還沒亮就在揉麵團了！', act: [{ type: 'flag', id: 'c9_inn' }] }],
  side9_clue_guard: [{ s: 'guard', t: '身上有麵粉味的貓？……我站崗的時候，常常聞到旅店那邊飄來麵包香。', act: [{ type: 'flag', id: 'c9_guard' }] }],
  side9_clue_mochi: [{ s: 'mochimom', t: '分麵包給小鳥？我看過喔！旅店門口那隻淺褐色的貓，每天都在餵小鳥！', act: [{ type: 'flag', id: 'c9_mochi' }] }],
  side9_guess: [
    { s: 'cotton', t: '妳、妳知道是誰了嗎？' },
    { s: 'hero', t: '我猜，收信的是……', choices: [
      { label: '麵包師傅吐司', next: 'side9_right' }, { label: '黑炭師傅', next: 'side9_wrong' }, { label: '招財叔叔', next: 'side9_wrong' }] },
  ],
  side9_wrong: [
    { s: 'cotton', t: '咦？不、不是他喔……' },
    { s: 'system', t: '再想想：最早起床、有麵粉的味道、會分麵包給小鳥……誰每天都在做麵包呢喵？' },
  ],
  side9_right: [
    { s: 'cotton', t: '……！（棉花的臉變得更紅了）' },
    { s: 'cotton', t: '對……就是吐司。拜託妳了。', act: [{ type: 'obj', quest: 'side9', obj: 'guess' }] },
  ],
  side9_toast: [
    { s: 'hero', t: '吐司，這是花店的棉花給你的信。', act: [{ type: 'take', id: 'cotton_letter' }] },
    { s: 'narr', t: '吐司打開信……「謝謝你，那天下雨借我雨傘，你自己淋雨回家。我一直都記得。」' },
    { s: 'toast', t: '我、我都忘了這件事了……原來她一直記得。', act: [{ type: 'obj', quest: 'side9', obj: 'give' }] },
    { s: 'toast', t: '請、請幫我跟她說……不客氣。還有，謝謝。' },
  ],
  side9_back: [
    { s: 'hero', t: '吐司說：「不客氣，還有謝謝。」' },
    { s: 'cotton', t: '……嘻嘻。謝謝妳。這個髮夾送妳，是四葉草的，會帶來幸運喔。', act: [{ type: 'obj', quest: 'side9', obj: 'back' }] },
  ],
  cotton_default: [{ s: 'cotton', t: '今天的花開得好漂亮……妳要聞聞看嗎？' }],
  toast_default: [{ s: 'toast', t: '麵包剛出爐喔！……小鳥們也在等。' }],
  // ===== 支線 10：小郵差柚子 =====
  side10_start: [
    { s: 'narr', t: '咻——！一隻有豹紋斑點的貓衝過來，碰！撞到了{name}。' },
    { s: 'narr', t: '信封撒了一地。' },
    { s: 'yuzu', t: '對不起對不起對不起！我是小郵差柚子！今天有五封信，可是我一封都還沒送到！' },
    { s: 'yuzu', t: '我跑太快了，常常送錯家……妳可以陪我一起送嗎？', choices: [
      { label: '好啊，一起去！', act: [{ type: 'startQuest', id: 'side10' }, { type: 'guest', id: 'yuzu' }] }, { label: '等一下喔', next: 'later' }] },
    { s: 'yuzu', t: '耶！給長老、花店的棉花、草原稻草人小屋的信箱、小溪的海苔婆婆，還有……森林營地的咕咕！' },
    { s: 'system', t: '柚子變成「同行」的夥伴了！她跑得好快，戰鬥時常常第一個動喵。' },
  ],
  side10_elder: [
    { s: 'yuzu', t: '長老！您的信！' },
    { s: 'elder', t: '呵呵，是老朋友寄來的。謝謝妳們。', act: [{ type: 'flag', id: 'mail_elder' }, { type: 'obj', quest: 'side10', obj: 'mail' }] },
  ],
  side10_cotton: [
    { s: 'yuzu', t: '棉花姊姊，妳的信！', when: { notFlag: 'mail_cotton' } },
    { s: 'cotton', t: '是種子店寄來的花種子！謝謝妳們～', when: { notFlag: 'mail_cotton' }, act: [{ type: 'flag', id: 'mail_cotton' }, { type: 'obj', quest: 'side10', obj: 'mail' }] },
    { s: 'cotton', t: '妳們送信辛苦了。', when: { flag: 'mail_cotton' } },
  ],
  side10_box: [
    { s: 'yuzu', t: '這裡是番薯伯的稻草人小屋！信箱在——' },
    { s: 'narr', t: '呼——！一陣大風吹過來，信從柚子手上飛走了！', act: [{ type: 'flag', id: 'mail_blown' }, { type: 'shake' }] },
    { s: 'yuzu', t: '啊啊啊！信飛到樹上去了！' },
    { s: 'system', t: '看看附近的大樹，有沒有亮亮的地方喵。' },
  ],
  glint_mailtree: [{ s: 'narr', t: '樹枝上卡著一個信封！{name}踮起腳尖，拿下來了。', act: [{ type: 'flag', id: 'mail_got' }] }],
  side10_box2: [
    { s: 'narr', t: '把信放進信箱。叩咚。', act: [{ type: 'flag', id: 'mail_box' }, { type: 'obj', quest: 'side10', obj: 'mail' }] },
    { s: 'yuzu', t: '送到了！謝謝妳！' },
  ],
  mailbox_default: [{ s: 'narr', t: '紅色的信箱。上面畫著番薯。' }],
  side10_nori: [
    { s: 'yuzu', t: '海苔婆婆！您的信！' },
    { s: 'nori', t: '哎呀，是孫子寄來的。……原來他學會寫字了。', act: [{ type: 'flag', id: 'mail_nori' }, { type: 'obj', quest: 'side10', obj: 'mail' }] },
  ],
  s10_bat: [
    { s: 'narr', t: '吱吱！一隻蝙蝠怪飛過來，叼走了最後一封信！' },
    { s: 'yuzu', t: '還給我！那是要給咕咕的！', act: [{ type: 'battle', encounter: 'bat_mail' }] },
    { s: 'bat', t: '吱……這張紙亮亮的，好漂亮……好啦，還你。', act: [{ type: 'flag', id: 'mail_bat' }] },
  ],
  side10_gugu: [
    { s: 'yuzu', t: '咕咕！你的信！' },
    { s: 'gugu', t: '給、給我的？……是一張畫！' },
    { s: 'narr', t: '畫上有咕咕、小豆芽，還有一行歪歪的字：「新年快樂！──豆花」' },
    { s: 'gugu', t: '……咕。這是我第一次收到信。', act: [{ type: 'flag', id: 'mail_gugu' }, { type: 'obj', quest: 'side10', obj: 'mail' }] },
  ],
  side10_done: [
    { s: 'yuzu', t: '五封信，全部送到了！' },
    { s: 'yuzu', t: '跟妳一起跑，好像整個世界都變大了！我可以跟妳去冒險嗎？' },
    { s: 'yuzu', t: '我保證不會跑太快！……大概啦。' },
    { s: 'hero', t: '當然好！', act: [{ type: 'recruit', id: 'yuzu' }] },
    { s: 'system', t: '隊伍最多 3 個人上場。如果滿了，可以在「隊伍」頁換人，戰鬥中也可以按「換人」喵！' },
  ],
  yuzu_bench: [{ s: 'yuzu', t: '我在郵局前面待命！要出發的時候叫我喔！咻——！' }],
  yuzu_default: [{ s: 'yuzu', t: '咻——！（柚子跑過去了）' }],
  // ===== 支線 11：阿栗的盾牌 =====
  side11_start: [
    { s: 'ali', t: '勇者大人……其實，我一直拿的是隊長以前的舊盾牌。' },
    { s: 'ali', t: '我想要一面，真正屬於我的盾牌。', act: [{ type: 'startQuest', id: 'side11' }] },
    { s: 'system', t: '黑炭師傅說要：野狼的毛 3 個、月光礦石 1 個……還有阿栗的勇氣喵。' },
  ],
  s11_wolves: [
    { s: 'system', t: '這裡就是阿栗想練習的地方喵！可是阿栗沒有在隊伍裡。要讓阿栗上場嗎？', when: { not: { inParty: 'ali' } }, choices: [{ label: '讓阿栗上場！', act: [{ type: 'swapIn', id: 'ali' }] }, { label: '等一下', act: [{ type: 'abort' }] }] },
    { s: 'narr', t: '嗷嗚——！樹叢裡跳出好幾隻野狼！' },
    { s: 'ali', t: '……！（阿栗的腳在發抖）' },
    { s: 'ali', t: '勇者大人，請妳站我後面！', act: [{ type: 'battle', encounter: 'ali_wolves' }] },
    { s: 'ali', t: '我……我做到了！我保護了大家！', act: [{ type: 'obj', quest: 'side11', obj: 'wolves' }] },
  ],
  side11_forge: [
    { s: 'charcoal', t: '……材料。', act: [{ type: 'take', id: 'wolf_fur', n: 3 }, { type: 'take', id: 'moon_ore', n: 1 }] },
    { s: 'charcoal', t: '……還有，勇氣。……阿栗，有了。' },
    { s: 'narr', t: '叮叮噹噹！一面小小的、亮亮的盾牌做好了。' },
    { s: 'ali', t: '我要在上面畫一個貓掌印！……歪掉了。沒關係！這是我們隊伍的標誌！', act: [{ type: 'learn', id: 'ali', skill: 'brave_roar' }, { type: 'obj', quest: 'side11', obj: 'forge' }] },
  ],
  // ===== 支線 12：草藥筆記 =====
  side12_start: [
    { s: 'mint', t: '那個……奶奶年輕時寫了一本草藥筆記，在黑森林弄丟了。' },
    { s: 'mint', t: '她說沒關係……可是她每次說的時候，都在看窗外。', act: [{ type: 'startQuest', id: 'side12' }] },
    { s: 'mint', t: '筆記散成 4 頁了。我們一起找，好不好？' },
  ],
  note1: [{ s: 'narr', t: '發光的蘑菇圈中間，有一頁筆記！', act: [{ type: 'item', id: 'herb_note' }, { type: 'flag', id: 'note1' }, { type: 'obj', quest: 'side12', obj: 'page' }] }],
  note2: [{ s: 'narr', t: '樹洞裡塞著一頁筆記！', act: [{ type: 'item', id: 'herb_note' }, { type: 'flag', id: 'note2' }, { type: 'obj', quest: 'side12', obj: 'page' }] }],
  side12_gob: [
    { s: 'gob1', t: '這張紙？我們拿來墊桌腳啦。上面畫的草，我們拿來治肚子痛，很有用耶！' },
    { s: 'mint', t: '那、那我教你們更多！', when: { inParty: 'mint' } },
    { s: 'narr', t: '（薄荷第一次主動大聲說話。）', when: { inParty: 'mint' } },
    { s: 'gob1', t: '真的嗎？那這張還妳！', act: [{ type: 'item', id: 'herb_note' }, { type: 'flag', id: 'note3' }, { type: 'obj', quest: 'side12', obj: 'page' }] },
  ],
  side12_mush: [
    { s: 'narr', t: '蘑菇怪的大帽子下面，露出一角紙。' },
    { s: 'hero', t: '蘑菇怪，可以借我看看你的帽子下面嗎？', act: [{ type: 'battle', encounter: 'note_mush' }] },
    { s: 'narr', t: '找到最後一頁筆記了！', act: [{ type: 'item', id: 'herb_note' }, { type: 'flag', id: 'note4' }, { type: 'obj', quest: 'side12', obj: 'page' }] },
  ],
  side12_back: [
    { s: 'mint', t: '奶奶，妳的筆記，4 頁都找回來了。', act: [{ type: 'take', id: 'herb_note', n: 4 }] },
    { s: 'ginkgo', t: '……哎呀。哎呀呀。' },
    { s: 'ginkgo', t: '我弄丟的不是筆記，是我年輕時的勇氣。謝謝妳們幫我找回來。' },
    { s: 'ginkgo', t: '來，婆婆考考妳們：筆記裡寫的這件事，妳知道答案嗎？', act: [{ type: 'quiz', ids: ['s18'], by: 'ginkgo', title: '小學堂：草藥筆記' }] },
    { s: 'mint', t: '我照著筆記，學會了新的草藥配方！', act: [{ type: 'learn', id: 'mint', skill: 'herb_pack' }, { type: 'obj', quest: 'side12', obj: 'back' }] },
  ],
  ginkgo_shop2: [{ s: 'ginkgo', t: '照著筆記做的新藥茶，要不要試試？', act: [{ type: 'shop', items: [{ id: 'herb_candy', price: 7 }, { id: 'cookie', price: 9 }, { id: 'herb_tea', price: 25 }, { id: 'note_tea', price: 45 }, { id: 'moon_flower', price: 15 }] }] }],
  // ===== 支線 13：明信片 =====
  side13_start: [
    { s: 'yuzu', t: '……那個，{name}。這些是我寫給爸爸的明信片。' },
    { s: 'yuzu', t: '我爸爸是旅行郵差，去了好遠好遠的地方送信。我不知道要寄去哪裡。' },
    { s: 'yuzu', t: '所以……我想把明信片綁在月光燈籠上，從最高的地方放出去！', act: [{ type: 'startQuest', id: 'side13' }, { type: 'item', id: 'postcard', n: 3 }] },
    { s: 'system', t: '最高的地方：村子的鐘樓、草原的大石頭、黑森林最高的大樹。記得帶柚子一起去喵！' },
  ],
  high_bell: [
    { s: 'narr', t: '爬上鐘樓。整個月光貓村都看得到！', act: [{ type: 'sticker', id: 'bell_view' }] },
    { s: 'yuzu', t: '爸爸以前會揹著我，在村子裡一家一家送信。他說，每封信都裝著一個人的心意。', when: { inParty: 'yuzu' }, act: [{ type: 'take', id: 'postcard' }, { type: 'flag', id: 'hi_bell' }, { type: 'obj', quest: 'side13', obj: 'high' }] },
    { s: 'narr', t: '小小的燈籠，帶著明信片，慢慢飄上天空。', when: { flag: 'hi_bell' } },
    { s: 'system', t: '柚子沒有在隊伍裡喵。要讓柚子上場嗎？', when: { all: [{ notFlag: 'hi_bell' }, { not: { inParty: 'yuzu' } }] }, choices: [{ label: '讓柚子上場！', act: [{ type: 'swapIn', id: 'yuzu' }], next: 'high_bell' }, { label: '等一下', act: [] }] },
  ],
  high_rock: [
    { s: 'narr', t: '站在大石頭上，風吹得好舒服。', when: { inParty: 'yuzu' } },
    { s: 'yuzu', t: '爸爸跑得比我還快喔！可是他每次都會停下來，等我追上他。', when: { inParty: 'yuzu' }, act: [{ type: 'take', id: 'postcard' }, { type: 'flag', id: 'hi_rock' }, { type: 'obj', quest: 'side13', obj: 'high' }] },
    { s: 'system', t: '柚子沒有在隊伍裡喵。要讓柚子上場嗎？', when: { all: [{ notFlag: 'hi_rock' }, { not: { inParty: 'yuzu' } }] }, choices: [{ label: '讓柚子上場！', act: [{ type: 'swapIn', id: 'yuzu' }], next: 'high_rock' }, { label: '等一下', act: [] }] },
  ],
  high_tree: [
    { s: 'narr', t: '爬上黑森林最高的大樹。樹頂有一個鳥巢，遠遠的森林深處，有一點紫色的光。', act: [{ type: 'sticker', id: 'tallest_tree' }, { type: 'sticker', id: 'birdnest' }] },
    { s: 'yuzu', t: '爸爸說，想念一個人的時候，就抬頭看月亮。因為我們看的是同一個月亮。', when: { inParty: 'yuzu' }, act: [{ type: 'take', id: 'postcard' }, { type: 'flag', id: 'hi_tree' }, { type: 'obj', quest: 'side13', obj: 'high' }] },
    { s: 'system', t: '柚子沒有在隊伍裡喵。要讓柚子上場嗎？', when: { all: [{ notFlag: 'hi_tree' }, { not: { inParty: 'yuzu' } }] }, choices: [{ label: '讓柚子上場！', act: [{ type: 'swapIn', id: 'yuzu' }], next: 'high_tree' }, { label: '等一下', act: [] }] },
  ],
  side13_end: [
    { s: 'narr', t: '最後一盞燈籠，飄向了月亮。' },
    { s: 'narr', t: '貓掌介面輕輕地閃了一下。' },
    { s: 'system', t: '……收到了喵。' },
    { s: 'yuzu', t: '……咦？剛剛那是什麼？' },
    { s: 'yuzu', t: '謝謝妳。原來想念一個人，也可以是很溫暖的事情。', act: [{ type: 'learn', id: 'yuzu', skill: 'peek' }] },
  ],
  // ===== 支線 14：月光燈籠 =====
  side14_start: [
    { s: 'elder', t: '很久以前，村子和森林之間點著月光燈籠，旅人可以跟著月光，很快回家。' },
    { s: 'elder', t: '後來，燈籠一盞一盞熄了……妳願意幫我把它們點亮嗎？', act: [{ type: 'startQuest', id: 'side14' }, { type: 'item', id: 'moon_flower', n: 3 }] },
    { s: 'elder', t: '這 3 朵月見花給妳。不夠的話，月光鱗粉也可以，草藥店也有賣月見花。' },
  ],
  lantern: [
    { s: 'narr', t: '一盞熄滅的月光燈籠。' },
    { s: 'system', t: '要用月見花或月光鱗粉，才能點亮喵。', when: { questActive: 'side14' } },
  ],
  lantern_lit: [
    { s: 'narr', t: '燈籠亮著溫柔的月光。', when: { not: { questDone: 'side14' } } },
    { s: 'system', t: '要用月光燈籠，移動到別的燈籠嗎？', when: { questDone: 'side14' }, choices: [{ label: '好，移動！', act: [{ type: 'travel' }] }, { label: '不用了', act: [] }] },
  ],
  lantern_bat: [
    { s: 'narr', t: '燈籠裡面，住著一隻蝙蝠怪！' },
    { s: 'bat', t: '吱！這是我的家！', act: [{ type: 'battle', encounter: 'lantern_bat' }] },
    { s: 'bat', t: '亮亮的好舒服……可是太亮會睡不著。我搬到旁邊的樹上好了。', act: [{ type: 'flag', id: 'lan_bat' }] },
  ],
  side14_report: [
    { s: 'elder', t: '……妳看。' },
    { s: 'narr', t: '從長老家的窗戶看出去，一盞一盞的燈籠，從村子一直連到森林。' },
    { s: 'system', t: '月光之路連起來了喵！點亮的燈籠，可以讓妳瞬間移動到另一盞燈籠！', act: [{ type: 'obj', quest: 'side14', obj: 'report' }] },
  ],
  // ===== 支線 15：哥布林的道歉禮物 =====
  side15_start: [
    { s: 'gugu', t: '咕……勇者。我、我想跟番薯伯說對不起。' },
    { s: 'gugu', t: '可是我好怕他……他一定還在生氣。', act: [{ type: 'startQuest', id: 'side15' }] },
    { s: 'hero', t: '那我們做一個道歉禮物吧！先準備 3 朵森林蘑菇。' },
  ],
  side15_wait: [
    { s: 'gugu', t: '咕……我會努力的。' },
    { s: 'system', t: '黑森林的蘑菇怪，和森林哥布林，用「對話」請牠們離開時，常常會送妳森林蘑菇喵！', when: ocur('side15', 'mush') },
  ],
  side15_cook: [
    { s: 'innkeeper', t: '哎呀，小哥布林也想學煮湯？好呀！我們來煮「蘑菇番薯湯」！', act: [{ type: 'take', id: 'forest_mushroom', n: 3 }] },
    { s: 'innkeeper', t: '湯要煮 20 分鐘。現在是 4 點 50 分……小妹妹，幾點幾分會煮好呀？', act: [{ type: 'quiz', ids: ['m28'], by: 'innkeeper', title: '小學堂：煮湯的時間' }] },
    { s: 'innkeeper', t: '答對了！到時候就可以關火囉！' },
    { s: 'narr', t: '咕咕很認真地攪拌湯，攪得滿頭大汗。', act: [{ type: 'item', id: 'mushroom_soup' }, { type: 'obj', quest: 'side15', obj: 'cook' }] },
  ],
  side15_farm: [
    { s: 'farmer', t: '你還敢來！', act: [{ type: 'shake' }] },
    { s: 'gugu', t: '咕……！（咕咕發著抖，把湯遞出去）', choices: [
      { label: '陪在咕咕旁邊', act: [{ type: 'flag', id: 's15_stay' }] }, { label: '幫咕咕說話', act: [{ type: 'flag', id: 's15_speak' }] }] },
    { s: 'hero', t: '（{name}輕輕站到咕咕旁邊，握住牠的手。）', when: { flag: 's15_stay' } },
    { s: 'hero', t: '番薯伯，咕咕是因為森林出事了，肚子好餓。牠一直很想道歉。', when: { flag: 's15_speak' } },
    { s: 'gugu', t: '對、對不起。這是我做的湯。', act: [{ type: 'take', id: 'mushroom_soup' }] },
    { s: 'farmer', t: '……（喝了一口）' },
    { s: 'farmer', t: '……鹽放太多了。下次我教你。', act: [{ type: 'obj', quest: 'side15', obj: 'farm' }] },
    { s: 'gugu', t: '……咕！咕咕！（咕咕笑了）' },
  ],
  trader_hi: [{ s: 'trader', t: '咕嘰！交換小攤開張！不用魚乾幣，用魔物的東西來換！', act: [{ type: 'trade' } as any] }],
  // ===== 小學堂 =====
  side16_start: [
    { s: 'toast', t: '唉……今天賣麵包，錢又算錯了。' },
    { s: 'toast', t: '妳、妳會算數嗎？可以幫我看看帳本嗎？', choices: [{ label: '我來幫你算！', act: [{ type: 'startQuest', id: 'side16' }] }, { label: '等一下喔', next: 'later' }] },
    { s: 'toast', t: '謝謝！我們開始吧！', act: [] },
  ],
  side16_solve: [
    { s: 'toast', t: '帳本上有好幾題，我們一題一題來！', act: [{ type: 'quiz', subject: 'math', tier: 1, n: 3, by: 'toast', title: '小學堂①吐司的麵包帳本' }] },
    { s: 'toast', t: '全部算對了！原來算數不可怕，一步一步來就好！', act: [{ type: 'obj', quest: 'side16', obj: 'solve' }] },
    { s: 'toast', t: '以後想練習的話，再來找我喔！' },
  ],
  toast_practice: [
    { s: 'toast', t: '要不要一起練習算數？', choices: [{ label: '好！', act: [{ type: 'quiz', subject: 'math', tier: 2, n: 2, by: 'toast', title: '吐司的算數練習' }, { type: 'exp', n: 10 }] }, { label: '下次再說', act: [] }] },
  ],
  side17_start: [
    { s: 'nori', t: '唉呀，孫子幫我在箱子上寫了字，說這樣就不會放錯……' },
    { s: 'nori', t: '可是他寫的是英文！婆婆看不懂呀。妳可以幫婆婆看看嗎？', act: [{ type: 'startQuest', id: 'side17' }] },
  ],
  side17_solve: [
    { s: 'nori', t: '箱子上寫的英文，婆婆一個一個問妳喔。', act: [{ type: 'quiz', subject: 'english', tier: 1, n: 3, by: 'nori', title: '小學堂②海苔婆婆的英文箱子' }] },
    { s: 'nori', t: '原來是這樣！妳好厲害。婆婆送妳一條今天釣到最大的魚！', act: [{ type: 'obj', quest: 'side17', obj: 'solve' }] },
  ],
  nori_wait: [
    { s: 'nori', t: '要不要陪婆婆等魚？', when: { notFlag: 'nori_wait1' }, act: [{ type: 'flag', id: 'nori_wait1' }] },
    { s: 'nori', t: '……今天的風，好舒服呢。', when: { all: [{ flag: 'nori_wait1' }, { notFlag: 'nori_wait2' }, { notFlag: 'nw_t1' }] }, act: [{ type: 'flag', id: 'nw_t1' }] },
    { s: 'narr', t: '……（一起等著。小溪嘩啦嘩啦地流。）' },
    { s: 'nori', t: '妳看，又上鉤了。等一等，好事就會來。', when: { flag: 'nw_t1' }, act: [{ type: 'flag', id: 'nori_wait2' }] },
    { s: 'nori', t: '陪婆婆等了三次了。這是謝禮。', when: { all: [{ flag: 'nori_wait2' }, { flag: 'nw_t2' }] }, act: [{ type: 'flag', id: 'nori_wait3' }, { type: 'item', id: 'silver_fish' }, { type: 'sticker', id: 'nori_fish' }] },
    { s: 'narr', t: '', when: { all: [{ flag: 'nori_wait2' }, { notFlag: 'nw_t2' }] }, act: [{ type: 'flag', id: 'nw_t2' }] },
  ],
  nori_default: [{ s: 'nori', t: '釣魚的祕訣，就是等呀。' }],
  side18_start: [
    { s: 'ginkgo', t: '呵呵，薄荷說她想當小老師，考考大家草藥和動物的知識。' },
    { s: 'mint', t: '（小聲）我、我準備了 3 題……', when: { inParty: 'mint' } },
    { s: 'ginkgo', t: '妳願意當她的第一個學生嗎？', act: [{ type: 'startQuest', id: 'side18' }] },
  ],
  side18_solve: [
    { s: 'ginkgo', t: '那就開始吧。', act: [{ type: 'quiz', subject: 'science', tier: 2, n: 3, by: 'mint', title: '小學堂③薄荷的草藥課' }] },
    { s: 'ginkgo', t: '全部答對！薄荷，妳教得真好。', act: [{ type: 'obj', quest: 'side18', obj: 'solve' }] },
    { s: 'ginkgo', t: '……冷笑話時間：什麼草最會害羞？……「含羞草」。呵呵呵。' },
  ],
  side19_start: [
    { s: 'elder', t: '廣場北邊的鐘樓，很久沒有響了。' },
    { s: 'elder', t: '傳說，鐘只會為「肯動腦筋又有勇氣」的孩子響起。鐘樓下面有三個謎題喔。', act: [{ type: 'startQuest', id: 'side19' }] },
  ],
  bell_quiz: [
    { s: 'narr', t: '鐘樓的門上刻著字：「回答三個謎題，鐘就會響。」' },
    { s: 'hero', t: '好，我來試試看！', act: [{ type: 'quiz', subject: 'mix', tier: 2, n: 3, by: 'elder', title: '小學堂④鐘樓的三個謎題' }] },
    { s: 'narr', t: '噹——！噹——！鐘聲傳遍了整個月光貓村！', act: [{ type: 'shake' }, { type: 'obj', quest: 'side19', obj: 'solve' }] },
    { s: 'narr', t: '村子裡的貓咪都抬起頭，對著鐘樓笑了。' },
  ],
  side20_start: [
    { s: 'weaver', t: '呵呵，小勇者。妳知道嗎？毛線要一圈一圈織，才會變成暖暖的圍巾。' },
    { s: 'weaver', t: '想事情也一樣，一步一步來。奶奶出 4 題比較難的，妳敢不敢試試？', act: [{ type: 'startQuest', id: 'side20' }] },
  ],
  side20_solve: [
    { s: 'weaver', t: '慢慢來，不用急。', act: [{ type: 'quiz', subject: 'mix', tier: 3, n: 4, by: 'weaver', title: '小學堂⑤編織奶奶的毛線考驗' }] },
    { s: 'weaver', t: '好孩子。會想的孩子，最勇敢。', act: [{ type: 'obj', quest: 'side20', obj: 'solve' }] },
  ],
  weaver_yarn: [
    { s: 'hero', t: '奶奶，這是妳的毛線球嗎？', act: [{ type: 'take', id: 'yarn_ball' }] },
    { s: 'weaver', t: '哎呀，又滾出去了。謝謝妳，這個給妳。', act: [{ type: 'item', id: 'cookie', n: 2 }] },
  ],
  weaver_default: [{ s: 'weaver', t: '一圈、兩圈、三圈……（奶奶在織圍巾）' }],
  glint_yarn: [{ s: 'narr', t: '路邊有一顆紫色的毛線球。', act: [{ type: 'item', id: 'yarn_ball' }] }],
  // ===== 村莊小事件、貼紙 =====
  roof1: [{ s: 'narr', t: '旅店的屋頂上，小白貓看了妳一眼……然後咻地不見了。屋頂上留下一個貓掌印。', act: [{ type: 'flag', id: 'roof1' }, { type: 'sticker', id: 'whitecat_roof1' }] }],
  roof2: [{ s: 'narr', t: '小白貓坐在屋頂上曬月亮。妳一眨眼，牠又不見了。', act: [{ type: 'flag', id: 'roof2' }, { type: 'sticker', id: 'whitecat_roof2' }] }],
  roof3: [{ s: 'narr', t: '長老家的屋頂上，小白貓的金色領結閃了一下。', act: [{ type: 'flag', id: 'roof3' }, { type: 'sticker', id: 'whitecat_roof3' }] }],
  nap1: [{ s: 'napcat', t: '呼嚕……呼嚕……', act: [{ type: 'flag', id: 'nap1' }] }],
  nap2: [{ s: 'narr', t: '貓咪翻了個身。', act: [{ type: 'flag', id: 'nap2' }] }],
  nap3: [{ s: 'napcat', t: '呼嚕……小魚乾……好大一條……（說夢話）', act: [{ type: 'sticker', id: 'nap_cat' }] }],
  elder_board: [
    { s: 'elder', t: '喔？妳的貼紙簿，貼了好多貼紙呢。' },
    { s: 'system', t: '10 張貼紙的獎勵：小魚乾餅乾 ×5！', when: { all: [{ minStickers: 10 }, { notFlag: 'sb10' }] }, act: [{ type: 'flag', id: 'sb10' }, { type: 'item', id: 'cookie', n: 5 }] },
    { s: 'system', t: '20 張貼紙的獎勵：「貓耳髮箍」！', when: { all: [{ minStickers: 20 }, { notFlag: 'sb20' }] }, act: [{ type: 'flag', id: 'sb20' }, { type: 'item', id: 'cat_ears' }] },
    { s: 'system', t: '30 張貼紙的獎勵：「貼紙收藏家胸針」！觀察力 +1！', when: { all: [{ minStickers: 30 }, { notFlag: 'sb30' }] }, act: [{ type: 'flag', id: 'sb30' }, { type: 'item', id: 'collector_pin' }, { type: 'stat', observation: 1 }] },
    { s: 'system', t: '40 張貼紙的獎勵：「月光雨衣」！', when: { all: [{ minStickers: 40 }, { notFlag: 'sb40' }] }, act: [{ type: 'flag', id: 'sb40' }, { type: 'item', id: 'raincoat' }] },
    { s: 'system', t: '50 張貼紙的獎勵：夥伴們的「月光宴會裝」！', when: { all: [{ minStickers: 50 }, { notFlag: 'sb50' }] }, act: [{ type: 'flag', id: 'sb50' }, { type: 'flag', id: 'party_outfit' }] },
    { s: 'elder', t: '貼紙……全部集滿了！好，我就說一個關於小白貓的古老故事吧。', when: { all: [{ allStickers: true }, { notFlag: 'sb60' }] }, act: [{ type: 'flag', id: 'sb60' }, { type: 'title', id: '月光觀察家' }] },
    { s: 'elder', t: '傳說，每當月亮變暗的時候，就會有一隻白色的小貓，帶著遠方的孩子回到這裡。……也許，那只是傳說。', when: { flag: 'sb60' } },
  ],
  elder_story: [
    { s: 'elder', t: '晚上了呀。來，聽長老說個故事。', when: { notFlag: 'story1' } },
    { s: 'elder', t: '很久很久以前，月光貓村只有三隻貓。牠們在月光下蓋了第一間房子……就是長老家喔。', when: { notFlag: 'story1' }, act: [{ type: 'flag', id: 'story1' }, { type: 'stat', courage: 1 }, { type: 'sticker', id: 'plaza_night' }] },
    { s: 'elder', t: '村子的噴水池，以前是一口井。乾旱的那一年，哥布林和貓咪一起挖深了它。', when: { all: [{ flag: 'story1' }, { notFlag: 'story2' }, { questDone: 'main10' }] }, act: [{ type: 'flag', id: 'story2' }, { type: 'stat', courage: 1 }] },
    { s: 'elder', t: '今晚的月亮，真亮啊。', when: { flag: 'story1' } },
  ],
  douhua_gallery: [
    { s: 'mochimom', t: '豆花畫了一張畫喔！妳看！' },
    { s: 'narr', t: '畫上是{name}，還有……', when: { notRecruited: 'ali' } },
    { s: 'narr', t: '畫上是{name}和夥伴們，大家手牽著手。每多一位夥伴，豆花就多畫一個人。', when: { minCompanions: 1 } },
  ],
  campfire_talk: [
    { s: 'narr', t: '大家圍著營火坐下來，火光暖暖的。', act: [{ type: 'rest' }] },
    { s: 'ali', t: '勇者大人，妳最喜歡吃什麼？我最喜歡小魚乾餅乾！', when: { all: [{ inParty: 'ali' }, { notFlag: 'cf1' }] }, act: [{ type: 'flag', id: 'cf1' }, { type: 'bond', id: 'ali' }] },
    { s: 'mint', t: '（小聲）……營火的味道，跟奶奶煮的藥草茶有一點像。', when: { all: [{ inParty: 'mint' }, { flag: 'cf1' }, { notFlag: 'cf2' }] }, act: [{ type: 'flag', id: 'cf2' }, { type: 'bond', id: 'mint' }] },
    { s: 'yuzu', t: '我跟你們說喔！我昨天跑去草原，跑太快，一頭撞進乾草堆！', when: { all: [{ inParty: 'yuzu' }, { notFlag: 'cf3' }] }, act: [{ type: 'flag', id: 'cf3' }, { type: 'bond', id: 'yuzu' }] },
    { s: 'ali', t: '薄荷，妳回血的時候，好溫暖喔。', when: { all: [{ inParty: 'ali' }, { inParty: 'mint' }, { flag: 'cf2' }, { notFlag: 'cf4' }] }, act: [{ type: 'flag', id: 'cf4' }, { type: 'bond', id: 'ali' }, { type: 'bond', id: 'mint' }] },
    { s: 'mint', t: '……謝、謝謝。阿栗站在前面的時候，也很帥。', when: { all: [{ flag: 'cf4' }, { notFlag: 'cf4b' }] }, act: [{ type: 'flag', id: 'cf4b' }] },
    { s: 'narr', t: '火光一閃一閃的。大家都很有精神了！', act: [{ type: 'sticker', id: 'camp_fire' }] },
  ],
  // 風景
  view_meadow_day: [{ s: 'narr', t: '藍藍的天空下，風吹過草原，草一波一波地動。', act: [{ type: 'sticker', id: 'meadow_day' }] }],
  view_meadow_night: [{ s: 'narr', t: '夜晚的草原，螢火蟲一閃一閃。', act: [{ type: 'sticker', id: 'meadow_night' }] }],
  view_forest: [{ s: 'narr', t: '黑森林的大樹好高，月光從葉子的縫縫灑下來。', act: [{ type: 'sticker', id: 'forest_view' }] }],
  glint_spring: [{ s: 'narr', t: '發光蘑菇圈的中間，有一個小小的泉水。喝一口，全身都暖起來了！', act: [{ type: 'rest' }, { type: 'sticker', id: 'spring' }] }],
  glint_path: [{ s: 'narr', t: '倒下的大樹後面，有一條小小的路！好像可以抄近路。', act: [{ type: 'sticker', id: 'secret_path' }, { type: 'stat', observation: 1 }] }],
  glint_prophecy: [{ s: 'narr', t: '長老家的書架後面，夾著一張舊舊的紙：「當月光再次照進黑森林，一位來自遠方的小小勇者，會牽起貓族的手。」', act: [{ type: 'stat', observation: 1 }, { type: 'flag', id: 'prophecy_seen' }, { type: 'sticker', id: 'prophecy' }] }],
};
for (const [k, v] of Object.entries(D)) DIALOGUES[k] = v;

// ---- 月光燈籠：點亮、快速移動 ----
export const LANTERNS = [
  { id: 'lan_v1', name: '廣場的燈籠', map: 'village', x: t(8) + 16, y: t(9) + 20 },
  { id: 'lan_v2', name: '村口的燈籠', map: 'village', x: t(12) + 16, y: t(29) + 20 },
  { id: 'lan_m1', name: '草原北邊的燈籠', map: 'meadow', x: t(11) + 16, y: t(2) + 20 },
  { id: 'lan_m2', name: '草原南邊的燈籠', map: 'meadow', x: t(14) + 16, y: t(19) + 20 },
  { id: 'lan_f1', name: '森林入口的燈籠', map: 'forest', x: t(13) + 16, y: t(4) + 28 },
  { id: 'lan_f2', name: '森林深處的燈籠', map: 'forest', x: t(12) + 16, y: t(33) + 28 },
];
for (const l of LANTERNS) {
  const n = NPCS.find(x => x.id === l.id)!;
  n.talk = [
    { when: { flag: l.id }, d: 'lantern_lit' },
    ...(l.id === 'lan_f1' ? [{ when: { all: [{ questActive: 'side14' }, { notFlag: 'lan_bat' }] }, d: 'lantern_bat' }] : []),
    { when: { all: [{ questActive: 'side14' }, { any: [{ hasItem: ['moon_flower', 1] }, { hasItem: ['moon_scale', 1] }] }] }, d: 'light_' + l.id },
    { d: 'lantern' },
  ];
  DIALOGUES['light_' + l.id] = [
    { s: 'narr', t: '把一朵月見花，輕輕放進燈籠裡……', when: { hasItem: ['moon_flower', 1] }, act: [{ type: 'take', id: 'moon_flower' }, { type: 'flag', id: 'lit_tmp' }] },
    { s: 'narr', t: '把一點月光鱗粉，灑進燈籠裡……', when: { notFlag: 'lit_tmp' }, act: [{ type: 'take', id: 'moon_scale' }] },
    { s: 'narr', t: '燈籠「啪」地亮了起來！溫柔的月光照亮了四周。', act: [{ type: 'flag', id: 'lit_tmp', value: false }, { type: 'flag', id: l.id }, { type: 'sfx', id: 'ok' }, { type: 'obj', quest: 'side14', obj: 'light' }] },
  ];
}
QUESTS.side10.onComplete = 'side10_done';
QUESTS.side13.onComplete = 'side13_end';

// ---- 閃光點 ----
const G2: GlintDef[] = [
  { id: 'herb1', map: 'meadow', x: t(3) + 16, y: t(1) + 16, obs: 0, when: ocur('side4', 'herb'), once: 'herb1', d: 'herb1' },
  { id: 'herb2', map: 'meadow', x: t(21) + 10, y: t(12) + 16, obs: 0, when: ocur('side4', 'herb'), once: 'herb2', d: 'herb2' },
  { id: 'herb3', map: 'meadow', x: t(7) + 16, y: t(20) + 16, obs: 1, when: ocur('side4', 'herb'), once: 'herb3', d: 'herb3' },
  { id: 'crate1', map: 'meadow', x: t(2) + 16, y: t(13) + 16, obs: 0, when: ocur('side6', 'crate'), once: 'crate1', d: 'crate1' },
  { id: 'crate2', map: 'meadow', x: t(10) + 16, y: t(16) + 16, obs: 0, when: ocur('side6', 'crate'), once: 'crate2', d: 'crate2' },
  { id: 'crate3', map: 'meadow', x: t(22) + 8, y: t(9) + 16, obs: 2, when: ocur('side6', 'crate'), once: 'crate3', d: 'crate3' },
  { id: 'crate4', map: 'meadow', x: t(5) + 16, y: t(17) + 16, obs: 3, when: ocur('side6', 'crate'), once: 'crate4', d: 'crate4' },
  { id: 'ore1', map: 'forest', x: t(10) + 16, y: t(12) + 16, obs: 3, when: ocur('side3', 'ore'), once: 'ore1', d: 'ore1' },
  { id: 'ore2', map: 'forest', x: t(19) + 16, y: t(9) + 16, obs: 0, when: ocur('side3', 'ore'), once: 'ore2', d: 'ore2' },
  { id: 'ore4', map: 'forest', x: t(4) + 16, y: t(16) + 16, obs: 0, when: { questActive: 'side11' }, once: 'ore4', d: 'ore4' },
  { id: 'note1', map: 'forest', x: t(19) + 16, y: t(13) + 16, obs: 0, when: { questActive: 'side12' }, once: 'note1', d: 'note1' },
  { id: 'note2', map: 'forest', x: t(7) + 16, y: t(13) + 16, obs: 2, when: { questActive: 'side12' }, once: 'note2', d: 'note2' },
  { id: 'bush', map: 'meadow', x: t(20) + 16, y: t(1) + 20, obs: 5, when: ocur('side7', 'bush'), once: 'orchard_open', d: 'glint_bush' },
  { id: 'berry', map: 'orchard', x: t(10) + 16, y: t(4) + 8, obs: 0, when: ocur('side7', 'berry'), d: 'glint_berry' },
  { id: 'mailtree', map: 'meadow', x: t(8) + 10, y: t(12) + 4, obs: 0, when: { all: [{ flag: 'mail_blown' }, { notFlag: 'mail_got' }] }, d: 'glint_mailtree' },
  { id: 'millbox', map: 'windmill', x: t(8) + 16, y: t(3) + 4, obs: 6, once: 'got_millbox', d: 'glint_millbox' },
  { id: 'yarn1', map: 'village', x: t(19) + 16, y: t(24) + 16, obs: 0, when: { questDone: 'main6' }, once: 'yarn1', d: 'glint_yarn' },
  { id: 'yarn2', map: 'meadow', x: t(9) + 16, y: t(6) + 16, obs: 0, when: { questDone: 'main8' }, once: 'yarn2', d: 'glint_yarn' },
  { id: 'spring', map: 'forest', x: t(8) + 8, y: t(13) + 6, obs: 4, d: 'glint_spring' },
  { id: 'spath', map: 'forest', x: t(13) + 16, y: t(41) + 8, obs: 6, once: 'got_spath', d: 'glint_path' },
  { id: 'prophecy', map: 'village', x: t(7) + 16, y: t(6) + 8, obs: 4, once: 'prophecy_seen', d: 'glint_prophecy' },
  { id: 'bellq', map: 'village', x: t(12) + 16, y: t(7) + 18, obs: 0, when: ocur('side19', 'solve'), d: 'bell_quiz' },
  { id: 'hi_bell', map: 'village', x: t(13) + 20, y: t(7) + 14, obs: 0, when: { all: [{ questActive: 'side13' }, { notFlag: 'hi_bell' }] }, d: 'high_bell' },
  { id: 'hi_rock', map: 'meadow', x: t(18) + 16, y: t(3) + 10, obs: 0, when: { all: [{ questActive: 'side13' }, { notFlag: 'hi_rock' }] }, d: 'high_rock' },
  { id: 'hi_tree', map: 'forest', x: t(18) + 16, y: t(30) + 16, obs: 0, when: { all: [{ questActive: 'side13' }, { notFlag: 'hi_tree' }] }, d: 'high_tree' },
];
GLINTS.push(...G2);
// ---- 自動觸發 ----
const TR: TriggerDef[] = [
  { id: 's8_enter', map: 'windmill', when: ocur('side8', 'enter'), once: 'seen_s8_enter', d: 'mill_enter' },
  { id: 's8_top', map: 'windmill', when: ocur('side8', 'top'), once: 'seen_s8_top', d: 'mill_top', zone: { x: t(2), y: t(1), w: t(7), h: t(2) } },
  { id: 's7_orchard', map: 'orchard', once: 'seen_orchard', d: 'orchard_enter' },
  { id: 's10_bat', map: 'forest', when: { all: [ocur('side10', 'mail'), { notFlag: 'mail_bat' }] }, once: 'seen_s10_bat', d: 's10_bat', zone: { x: t(1), y: t(23), w: t(12), h: t(3) } },
  { id: 's11_wolves', map: 'forest', when: ocur('side11', 'wolves'), once: 'seen_s11_wolves', d: 's11_wolves', zone: { x: t(1), y: t(16), w: t(20), h: t(4) } },
  { id: 'v_meadow_day', map: 'meadow', when: { all: [{ time: 'day' }, { questDone: 'main6' }] }, once: 'v_md', d: 'view_meadow_day', zone: { x: t(8), y: t(8), w: t(8), h: t(6) } },
  { id: 'v_meadow_night', map: 'meadow', when: { time: 'night' }, once: 'v_mn', d: 'view_meadow_night', zone: { x: t(8), y: t(8), w: t(8), h: t(6) } },
  { id: 'v_forest', map: 'forest', when: { questDone: 'main9' }, once: 'v_fo', d: 'view_forest', zone: { x: t(8), y: t(2), w: t(7), h: t(4) } },
];
TRIGGERS.push(...TR);
// ---- 事件戰鬥 ----
const FX: Record<string, FixedEncounter> = {
  ore_mush: { id: 'ore_mush', enemies: ['mushroom'], bg: 'forestbg', talkBonus: 0.25, hint: '蘑菇怪好睏……「對話」請牠讓開也可以喵。' },
  crate_gob: { id: 'crate_gob', enemies: ['goblin'], bg: 'battlebg', talkBonus: 0.3, hint: '哥布林只是覺得箱子很好坐……試試「對話」喵！' },
  orchard_mush: { id: 'orchard_mush', enemies: ['mushroom'], bg: 'battlebg', talkBonus: 0.35, hint: '小心「睡睡孢子」！薄荷的「安神花香」可以叫醒大家喵。' },
  mill_bats: { id: 'mill_bats', enemies: ['bat', 'bat', 'bat'], bg: 'forestbg', talkBonus: 0.3, talkLines: ['吱吱～原來你們不是來趕我們走的！', '吱！那我們小聲一點唱！'], hint: '蝙蝠怪好像只是在唱歌……「對話」看看喵！' },
  bat_mail: { id: 'bat_mail', enemies: ['bat'], bg: 'forestbg', talkBonus: 0.3, hint: '蝙蝠怪喜歡亮亮的東西……「對話」也可以要回信喵！' },
  ali_wolves: { id: 'ali_wolves', enemies: ['wolf', 'wolf'], bg: 'forestbg', talkBonus: 0.1, hint: '阿栗的「我來擋！」可以保護隊友喵！',
    startLines: [{ who: 'ali', t: '勇者大人，請妳站我後面！' }, { who: 'mint', t: '阿栗，加油！' }, { who: 'yuzu', t: '我來幫忙丟毛線球！' }] },
  note_mush: { id: 'note_mush', enemies: ['mushroom', 'mushroom'], bg: 'forestbg', talkBonus: 0.2, hint: '兩隻蘑菇怪！小心睡著喵。' },
  lantern_bat: { id: 'lantern_bat', enemies: ['bat', 'bat'], bg: 'forestbg', talkBonus: 0.3, hint: '蝙蝠怪把燈籠當成家了……「對話」請牠們搬家喵。' },
};
Object.assign(FIXED, FX);
ENCOUNTERS.windmill_bats = { id: 'windmill_bats', rate: 0.07, minSteps: 6, bg: 'forestbg', groups: [{ enemies: ['bat'], weight: 60 }, { enemies: ['bat', 'bat'], weight: 40 }] };
// ---- 哥布林交換小攤 ----
export const TRADES: { give: [string, number][]; get?: [string, number]; sticker?: 'shiny' }[] = [
  { give: [['jelly', 3]], get: ['jerky', 1] },
  { give: [['jelly', 2], ['forest_mushroom', 1]], get: ['herb_tea', 1] },
  { give: [['wolf_fur', 2]], get: ['star_candy', 2] },
  { give: [['forest_mushroom', 2]], get: ['moon_flower', 1] },
  { give: [['jelly', 4], ['wolf_fur', 1]], sticker: 'shiny' },
];

Object.assign(ITEMS, {
  wrist_guard: { id: 'wrist_guard', name: '小貓護腕', kind: 'accessory', desc: '黑炭師傅打的皮革護腕。防禦 +1。', bonus: { def: 1 } },
  light_shoes: { id: 'light_shoes', name: '輕巧小鞋', kind: 'accessory', desc: '走起路來輕輕的。速度 +1。', bonus: { spd: 1 } },
  note_tea: { id: 'note_tea', name: '筆記藥茶', kind: 'heal', desc: '照著銀杏婆婆的筆記做的藥茶。回復 60 HP。', heal: 60, battle: true },
});
// 解題支線：接下任務後直接開始答題（小朋友不用再點一次）
for (const n of [16, 17, 18, 20]) {
  const st = DIALOGUES[`side${n}_start`], so = DIALOGUES[`side${n}_solve`];
  if (st && so) st.push(...so.map(l => ({ ...l, when: l.when ? { all: [{ questActive: `side${n}` }, l.when] } : { questActive: `side${n}` } })));
}
// 對話優先順序：正在進行的支線步驟（objCurrent side…）要比「接新任務」先。
// 不然例如老闆娘會一直問要不要接支線 4，咕咕的支線 15 就推進不了。
for (const n of NPCS) {
  const isStart = (e: { when?: Cond }) => JSON.stringify(e.when ?? {}).includes('questAvailable');
  const isSideStep = (e: { when?: Cond }) => /objCurrent":\["side/.test(JSON.stringify(e.when ?? {}));
  const first = n.talk.findIndex(isStart); if (first < 0) continue;
  const late = n.talk.slice(first).filter(isSideStep); if (!late.length) continue;
  const rest = n.talk.filter(e => !late.includes(e)); rest.splice(first, 0, ...late); n.talk = rest;
}
