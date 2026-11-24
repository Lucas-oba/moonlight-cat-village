import { DIALOGUES } from './dialogues';
import { ENEMIES, FIXED } from './enemies';

export const FANER_ENCOUNTER = 'c3_faner';

export const FANER_SKILL_TIPS: Record<string, string> = {
  brave_slash: '用力一揮，把橋索打鬆。',
  shield_punch: '用盾敲橋索，再站到前面幫大家擋一下。',
  paddle_tap: '用船槳輕輕拍鬆橋索。',
  yarn_throw: '朝橋索丟毛線球。',
  peek: '看看橋索還有多緊，也看看帆耳安心了沒。',
  soothing_purr: '下次和帆耳說話，平靜多一顆心。',
  lullaby: '這次先收起搖籃曲。可以和帆耳說說話。',
};

ENEMIES.ropeknot_boss = {
  id: 'ropeknot_boss', name: '紫結舊橋索', sprite: 'ropeknot_boss',
  hp: 500, atk: 0, def: 10, spd: 0, exp: 0, money: 0,
  talkBase: 0, talkLines: [], talkFail: [], gifts: [],
};
ENEMIES.faner_boss = {
  id: 'faner_boss', name: '帆耳', sprite: 'faner_boss', mood: 'hurt',
  hp: 1, atk: 34, def: 0, spd: 10, exp: 880, money: 0,
  talkBase: 0, talkLines: [], talkFail: [], gifts: [],
  skills: [
    { id: 'c3_faner_splash', name: '耳朵拍出水花', chance: .4, power: .75, target: 'all' },
    { id: 'c3_faner_shiver', name: '抖抖腳', chance: 1, power: .85 },
  ],
};

FIXED[FANER_ENCOUNTER] = {
  id: FANER_ENCOUNTER, enemies: ['ropeknot_boss', 'faner_boss'],
  bg: 'bridgebg', music: 'boss3', noEscape: true, intro: 'c3_faner_intro',
};
DIALOGUES.c3_faner_intro = [
  { s: 'mizhou', t: '大家托好橋索了。帆耳還在發抖。', choices: [
    { label: '走到帆耳身邊，讓牠看見妳', brave: true, braveId: 'c3_faner_approach', minCourage: 18, chapter: 3,
      surprise: '帆耳抬起眼睛看著妳。牠的耳朵放鬆了一點。' },
    { label: '慢慢走近帆耳' },
  ] },
];
