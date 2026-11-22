import type { QuestDef } from './types';
// 第一章任務（數值暫定）
export const QUESTS: Record<string, QuestDef> = {
  main1: { id: 'main1', kind: 'main', no: 1, title: '跟著白貓走', summary: '上學的路上，我跟著一隻白貓，走進了小巷子。', prereq: [], objectives: [], rewards: {}, unlocks: ['main2'] },
  main2: {
    id: 'main2', kind: 'main', no: 2, title: '貓咪村莊', summary: '我來到一個都是貓咪的村莊。大家都說「喵喵喵」，我聽不懂。',
    prereq: ['main1'], autoStart: true, ordered: true,
    objectives: [
      { id: 'plaza', type: 'reach', text: '跟著地上發亮的貓掌印，走到廣場', targets: ['plaza'] },
      { id: 'talk3', type: 'talk', text: '跟 3 隻貓咪說說話', targets: ['merchant', 'innkeeper', 'farmer', 'mochimom', 'douhua'], count: 3, unique: true },
      { id: 'elder', type: 'event', text: '去找長老（拿拐杖的灰貓爺爺）', marker: ['elder'] },
    ],
    rewards: {}, unlocks: ['main3'],
  },
  main3: {
    id: 'main3', kind: 'main', no: 3, title: '第一把木劍', summary: '長老要我去北邊的訓練場，找大大的橘貓守衛。',
    prereq: ['main2'], autoStart: true, ordered: true,
    objectives: [
      { id: 'guard', type: 'event', text: '去北邊的訓練場，找橘貓守衛', marker: ['guard'] },
      { id: 'system', type: 'event', text: '打開「屬性」，看看自己' },
    ],
    rewards: { items: [{ id: 'wooden_sword', n: 1 }], courage: 1 }, rewardText: ['小木劍', '職業「初級戰士」', '能力「聽懂貓語」'], unlocks: ['main4'],
  },
  main4: {
    id: 'main4', kind: 'main', no: 4, title: '長老的故事', summary: '我聽得懂貓咪說話了！長老有話要跟我說。',
    prereq: ['main3'], autoStart: true, ordered: true,
    objectives: [
      { id: 'story', type: 'event', text: '去長老的家（紫色屋頂），聽長老說故事', marker: ['elder'] },
      { id: 'log', type: 'event', text: '打開「任務日誌」看看' },
    ],
    rewards: { exp: 50, courage: 1 }, unlocks: ['main5'], onComplete: 'main4_end',
  },
  main5: {
    id: 'main5', kind: 'main', no: 5, title: '認識新朋友', summary: '早安！去村子裡跟大家打招呼吧。',
    prereq: ['main4'], autoStart: true,
    objectives: [
      { id: 'shop', type: 'event', text: '去商店找招財', marker: ['merchant'] },
      { id: 'inn', type: 'event', text: '去旅店找奶油老闆娘', marker: ['innkeeper'] },
      { id: 'farm', type: 'event', text: '去菜園找番薯伯', marker: ['farmer'] },
      { id: 'paw', type: 'event', text: '在噴水池旁邊，找到發亮的東西' },
    ],
    rewards: { items: [{ id: 'cookie', n: 3 }], observation: 1 }, rewardText: ['喵喵貼紙簿'], unlocks: ['main6', 'side2'], onComplete: 'main5_end',
  },
  main6: {
    id: 'main6', kind: 'main', no: 6, title: '菜園被偷了', summary: '番薯伯的菜被偷了！地上有奇怪的小腳印。',
    prereq: ['main5'], autoStart: true, ordered: true,
    objectives: [
      { id: 'farmer', type: 'event', text: '跟番薯伯說話', marker: ['farmer'] },
      { id: 'garden', type: 'inspect', text: '看看菜園裡的小腳印', targets: ['garden_prints'] },
      { id: 'guard', type: 'event', text: '去村口（南邊）找橘貓守衛', marker: ['guard'] },
      { id: 'tutorial', type: 'event', text: '去草原，走進深綠色的草叢，練習打怪', count: 3 },
      { id: 'prints', type: 'inspect', text: '在草原找到 3 個小腳印', targets: ['fp1', 'fp2', 'fp3'], count: 3, unique: true },
    ],
    rewards: { exp: 120, money: 80, items: [{ id: 'jelly', n: 1 }], courage: 1 }, unlocks: ['main7'], onComplete: 'main6_end',
  },
  main7: {
    id: 'main7', kind: 'main', no: 7, title: '草原上的小偷', summary: '小腳印往草原的東邊去了。是誰偷了番薯伯的菜呢？',
    prereq: ['main6'], autoStart: true, ordered: true,
    objectives: [
      { id: 'find', type: 'event', text: '去草原東邊的高麗菜田看看' },
      { id: 'guard', type: 'event', text: '回村子，跟村口的橘貓守衛說', marker: ['guard'] },
    ],
    rewards: { exp: 150, money: 60 }, rewardText: ['哥布林的畫'], unlocks: ['main8'],
  },
  main8: {
    id: 'main8', kind: 'main', no: 8, title: '找夥伴一起去', summary: '咕咕的畫裡，大樹後面黑黑的……那是黑森林。一個人去太危險了。',
    prereq: ['main7'], autoStart: true, ordered: true,
    objectives: [
      { id: 'elder', type: 'event', text: '把哥布林的畫拿給長老看', marker: ['elder'] },
      { id: 'guard', type: 'event', text: '跟村口的橘貓守衛說', marker: ['guard'] },
      { id: 'friend', type: 'event', text: '找一位夥伴一起去（訓練場的阿栗、草藥店的銀杏婆婆需要幫忙）', auto: { minCompanions: 1 }, marker: ['ali', 'ginkgo'] },
      { id: 'gate', type: 'event', text: '帶夥伴去草原南邊的黑森林入口', marker: ['guard'] },
    ],
    rewards: { exp: 100, courage: 1 }, rewardText: ['可以去黑森林了'], unlocks: ['main9'],
  },
  main9: {
    id: 'main9', kind: 'main', no: 9, title: '黑森林的哭聲', summary: '黑森林好暗，只有發光的蘑菇照著小路。好像有人在哭……',
    prereq: ['main8'], autoStart: true, ordered: true,
    objectives: [
      { id: 'enter', type: 'event', text: '走進黑森林' },
      { id: 'cry', type: 'event', text: '跟著哭聲，往森林中間走' },
    ],
    rewards: { exp: 200, money: 100, items: [{ id: 'forest_mushroom', n: 2 }], courage: 2, sticker: 'sprout_saved' }, unlocks: ['main10'],
  },
  main10: {
    id: 'main10', kind: 'main', no: 10, title: '哥布林營地', summary: '小豆芽說，咕咕是牠哥哥，大家都在營地裡，肚子好餓。',
    prereq: ['main9'], autoStart: true, ordered: true,
    objectives: [
      { id: 'camp', type: 'event', text: '帶小豆芽回營地（森林的西南邊，有帳篷的地方）' },
      { id: 'talk3', type: 'talk', text: '跟營地裡的 3 隻哥布林說話', targets: ['gob1', 'gob2', 'gob3'], count: 3, unique: true },
      { id: 'chief', type: 'event', text: '跟哥布林首領說話', marker: ['chief'] },
    ],
    rewards: { exp: 200, observation: 1 }, rewardText: ['營火可以休息、存檔了'], unlocks: ['main11'],
  },
  main11: {
    id: 'main11', kind: 'main', no: 11, title: '守門的巨岩', summary: '森林最深處有一隻好大好大的哥布林「巨岩」，誰都不讓過去。',
    prereq: ['main10'], autoStart: true, ordered: true,
    objectives: [{ id: 'boss', type: 'event', text: '去森林最深處（最南邊）找巨岩' }],
    rewards: { money: 150, items: [{ id: 'rock_tooth', n: 1 }], sticker: 'rock_friend' }, rewardText: ['稱號「月光小勇者」'], unlocks: ['main12'], onComplete: 'main11_end',
  },
  main12: {
    id: 'main12', kind: 'main', no: 12, title: '月光下的約定', summary: '村子的廣場要辦月光宴會！貓咪和哥布林一起吃烤番薯。',
    prereq: ['main11'], autoStart: true, ordered: true,
    objectives: [
      { id: 'feast', type: 'event', text: '去廣場參加月光宴會' },
      { id: 'elder', type: 'event', text: '跟長老說話', marker: ['elder'] },
      { id: 'whitecat', type: 'event', text: '去找小白貓（長老家的屋頂上）', marker: ['whitecat'] },
      { id: 'chase', type: 'event', text: '追著小豆芽的腳印，去黑森林入口' },
    ],
    rewards: { exp: 200, courage: 1, observation: 1, sticker: 'moon_feast' }, onComplete: 'chapter1_end',
  },
  side1: {
    id: 'side1', kind: 'side', no: 1, title: '想當勇者的阿栗', giver: 'ali', summary: '見習守衛阿栗想跟我一起去草原巡邏。',
    prereq: ['main6'], ordered: true,
    objectives: [
      { id: 'patrol', type: 'battle', text: '跟阿栗在草原巡邏：打倒或說服魔物 5 次', targets: ['meadow'], count: 5 },
      { id: 'chick', type: 'event', text: '聽！草原南邊好像有小雞在叫' },
      { id: 'report', type: 'event', text: '回村子，跟村口的橘貓守衛報告', marker: ['guard'] },
    ],
    rewards: { exp: 150, money: 80, courage: 2, sticker: 'ali_join' },
  },
  side5: {
    id: 'side5', kind: 'side', no: 5, title: '樹上的薄荷', giver: 'ginkgo', summary: '銀杏婆婆的孫女薄荷去草原採藥，三天都沒回家。',
    prereq: ['main6'], ordered: true,
    objectives: [
      { id: 'tree', type: 'event', text: '去草原西邊的大樹找薄荷' },
      { id: 'home', type: 'event', text: '帶薄荷回草藥店，找銀杏婆婆', marker: ['ginkgo'] },
    ],
    rewards: { exp: 150, money: 80, items: [{ id: 'moon_flower', n: 2 }], observation: 1, sticker: 'mint_join' }, rewardText: ['草藥店開張了'],
  },
  side2: {
    id: 'side2', kind: 'side', no: 2, title: '帶豆花回家', giver: 'mochimom', summary: '麻糬媽媽的小孩豆花跑去看蝴蝶，還沒回家。',
    prereq: ['main5'], ordered: true,
    objectives: [
      { id: 'ask', type: 'event', text: '問問 3 隻貓咪：有沒有看到豆花？', count: 3 },
      { id: 'find', type: 'event', text: '去草原西南邊，找找發亮的草叢' },
      { id: 'home', type: 'event', text: '帶豆花回家，找麻糬媽媽', marker: ['mochimom'] },
    ],
    rewards: { exp: 100, money: 50, items: [{ id: 'moon_scale', n: 1 }], courage: 1, observation: 2, sticker: 'douhua_home' },
  },
};
export const QUEST_ORDER = Object.keys(QUESTS);
