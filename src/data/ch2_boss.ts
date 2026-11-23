import { ENEMIES, FIXED } from './enemies';
import { DIALOGUES } from './dialogues';

ENEMIES.sighvine_boss = {
  id: 'sighvine_boss', name: '嘆氣藤', sprite: 'sighvine_boss',
  hp: 390, atk: 0, def: 8, spd: 0, exp: 0, money: 0,
  talkBase: 0, talkLines: [], talkFail: [], gifts: [],
};
ENEMIES.mossantler_boss = {
  id: 'mossantler_boss', name: '苔角', sprite: 'mossantler_boss',
  hp: 1, atk: 26, def: 0, spd: 9, exp: 500, money: 0, mood: 'hurt',
  talkBase: 0, talkLines: [], talkFail: [], gifts: [],
  skills: [
    { id: 'vine_swing', name: '嘆氣藤甩一下', chance: .27, power: .8, status: 'bind' },
    { id: 'cry_roar', name: '大哭吼', chance: .38, power: .65, status: 'cry' },
    { id: 'stomp', name: '跺腳', chance: 1, power: .55, target: 'all' },
  ],
};

FIXED.c2_mossantler = {
  id: 'c2_mossantler', enemies: ['sighvine_boss', 'mossantler_boss'],
  bg: 'denbg', music: 'boss2', noEscape: true, intro: 'c2_mossantler_intro',
};

DIALOGUES.c2_mossantler_intro = [
  { s: 'mint', t: '藤把角纏得好緊。藥準備好了，我們一起幫牠。', choices: [
    { label: '輕輕摸苔角的鼻子', brave: true, braveId: 'c2_antler_touch', minCourage: 20, chapter: 2,
      surprise: '苔角閉了一下眼睛，慢慢吐了一口氣。', act: [{ type: 'flag', id: 'c2_antler_touch' }] },
    { label: '慢慢走近苔角', act: [{ type: 'flag', id: 'c2_antler_touch', value: false }] },
  ] },
];
