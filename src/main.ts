import Phaser from 'phaser';
import './style.css';
import './data/ch1c';
import './data/interiors';
import './data/bonds';
import './data/events';
import './data/whimsy';
import './data/whimsy2';
import './data/ch2_systems';
import './data/ch2_main';
import './data/ch2_side';
import './data/hearts_content';
import './data/ch2_echo';
import './data/ch2_finale';
import './data/ch2_bonds';
import './data/ch2_remaining_sides';
import { isChapter2Map } from './core/hearts';
import { MIST_ENTRANCE, ROOT_REST } from './data/ch2_maps';
import { G } from './core/game';
import { loadGame, healAll, saveGame } from './core/state';
import { Hud, DialogueBox, makeHooks, titleScreen, prologue, A, openSystemPanel } from './ui/ui';
import { WorldScene } from './scenes/World';
import { BattleScene, type BattleResult } from './scenes/Battle';
import { FIXED } from './data/enemies';
import { sfx } from './core/sfx';
import { music } from './core/music';
import { MAPS, WONDERS } from './data/maps';
import { NPCS } from './data/npcs';
import { DIALOGUES } from './data/dialogues';
import { GLINTS, TRIGGERS } from './data/maps';
import { QUESTS } from './data/quests';
import { check } from './core/conditions';

const IMAGES = ['teasnail', 'flipmush', 'w_teatable', 'w_teapot', 'w_ftree', 'w_rsign', 'yuanyuan', 'yuanyuan_big', 'lulu', 'lulu_big', 'juanjuan', 'juanjuan_big', 'w_clock', 'w_shelf', 'w_shelf_ud', 'w_dew', 'w_cookie', 'w_hedge', 'w_sunflower', 'w_tulip', 'w_bell', 'w_circle', 'w_mushflower', 'w_gear', 'w_ladder', 'f_rocker_ud', 'f_plant_ud', 'f_barrel_ud', 'guard_spar', 'ali_feast', 'mint_feast', 'yuzu_feast', 'f_bed', 'f_table', 'f_shelf', 'f_fireplace', 'f_barrel', 'f_counter', 'f_anvil', 'f_loom', 'f_flowers', 'f_stove', 'f_herbs', 'f_sacks', 'f_plant', 'f_cupboard', 'f_rocker', 'hero_big', 'whitecat', 'whitecat_big', 'elder', 'elder_big', 'guard', 'guard_big', 'merchant', 'merchant_big', 'innkeeper', 'innkeeper_big', 'farmer', 'farmer_big', 'mochimom', 'mochimom_big', 'douhua', 'douhua_big',
  'slime', 'slime_small', 'house', 'ali', 'ali_big', 'mint', 'mint_big', 'yuzu', 'yuzu_big', 'ginkgo', 'ginkgo_big', 'gugu', 'gugu_big', 'goblin', 'sprout', 'sprout_big', 'chief', 'chief_big', 'fgoblin', 'fgoblin_big', 'fgoblin_b',
  'rock_boss', 'rock_map', 'rock_big', 'wolf', 'mushroom', 'bat', 'forestbg', 'ftree', 'glowshroom', 'tent', 'campfire', 'log', 'veggies', 'lantern_off', 'lantern_on', 'cabbage', 'sign', 'gate', 'stump', 'inn', 'elderhouse', 'fountain', 'tree', 'fence', 'fishrack', 'stall', 'hay', 'flowerpot', 'dummy', 'lamp', 'battlebg',
  'cotton', 'cotton_big', 'toast', 'toast_big', 'charcoal', 'charcoal_big', 'nori', 'nori_big', 'weaver', 'weaver_big', 'lei', 'lei_big', 'afu', 'afu_big', 'mailbox', 'box', 'letter', 'flowershop', 'smithy', 'weaveshop', 'belltower', 'windmill',
  'pudding', 'pudding_big', 'mistpuff', 'thornling', 'cryshroom', 'mistwolf', 'yarnweasel', 'mistbg',
  'manman', 'manman_big', 'echobat', 'mossrock', 'c2_softmoss', 'c2_sleepflower', 'c2_boat', 'c2_rootwall', 'echobg',
  'denbg', 'mossantler_boss', 'sighvine_boss', 'mossantler_calm', 'c2_thorn', 'c2_seed', 'c2_cake', 'c2_birdhouse', 'c2_ending',
  'pengpeng', 'pengpeng_big', 'squirrelkid', 'mossantler_map',
  'c2_bigtree', 'c2_house_broken', 'c2_house_fixed', 'c2_door', 'c2_vine', 'c2_net', 'c2_mosslog',
  'c2_cloudline', 'c2_lamp_off', 'c2_lamp_on', 'c2_planks', 'c2_footprint',
];

class Boot extends Phaser.Scene {
  constructor() { super('Boot'); }
  preload() {
    const w = this.scale.width, h = this.scale.height;
    const bar = this.add.rectangle(w / 2 - 100, h / 2, 0, 10, 0xffd36e).setOrigin(0, .5);
    this.add.text(w / 2, h / 2 - 30, '月光貓村 載入中…', { fontFamily: 'sans-serif', fontSize: '18px', color: '#fff6e3' }).setOrigin(.5);
    this.load.on('progress', (p: number) => bar.width = 200 * p);
    for (const k of IMAGES) this.load.image(k, A(k));
    this.load.spritesheet('hero', A('hero_walk'), { frameWidth: 25, frameHeight: 58 }); // 每個方向 3 格：站、左腳、右腳
    // 外觀服裝（貼紙獎勵）：上面多留 8 格給貓耳朵
    for (const k of ['ears', 'coat', 'coat_ears']) this.load.spritesheet('hero_' + k, A('hero_walk_' + k), { frameWidth: 25, frameHeight: 66 });
  }
  async create() {
    try { await (document as any).fonts?.load('20px Huninn'); } catch { /* ignore */ }
    this.scene.start('Idle');
    start(this.game);
  }
}
class Idle extends Phaser.Scene { constructor() { super('Idle'); } create() { this.cameras.main.setBackgroundColor('#0d1330'); } }

let hud: Hud; let dlg: DialogueBox;
async function start(game: Phaser.Game) {
  hud = new Hud(); dlg = new DialogueBox(); hud.setVisible(false);
  G.init(makeHooks(hud, dlg));
  hud.onSys = () => { if (G.busy > 0) return; G.busy++; openSystemPanel('status').then(() => { G.busy--; hud.refresh(); }); };
  hud.onQuests = () => { if (G.busy > 0) return; G.busy++; openSystemPanel('quests').then(() => { G.busy--; hud.refresh(); }); };
  (window as any).__startBattle = (id: string, fixed: boolean) => runBattle(game, id, fixed);
  G.battleHook = (id, fixed) => runBattle(game, id, fixed);
  const qs = new URLSearchParams(location.search);
  const choice = qs.has('debug') && qs.has('skip') ? 'skip' : await titleScreen();
  if (choice === 'continue') {
    const save = loadGame();
    if (save) {
      G.load(save.state);
      saveGame(G.s);
      if (save.kindBonus) G.ui.toast({ title: `做過的溫柔的事，都記在心裡了喵！善良值 +${save.kindBonus}`, text: '' });
    }
  }
  else if (choice === 'skip') G.newGame('小葵');
  else { const name = await prologue(dlg); G.newGame(name); }
  hud.setVisible(true); hud.refresh();
  game.scene.stop('Idle'); game.scene.start('World', { hud });
}

async function runBattle(game: Phaser.Game, id: string, fixed: boolean): Promise<BattleResult> {
  const world = game.scene.getScene('World') as WorldScene;
  G.busy++;
  if (fixed && FIXED[id]?.intro) await G.run(FIXED[id].intro!);
  sfx.encounter(); music.play(fixed ? FIXED[id]?.music ?? 'battle' : 'battle');
  world.cameras.main.flash(250, 255, 255, 255);
  await new Promise(r => setTimeout(r, 300));
  hud.setVisible(false);
  game.scene.sleep('World');
  const result = await new Promise<BattleResult>(res => game.scene.run('Battle', { enc: id, fixed, resolve: res }));
  game.scene.stop('Battle');
  if (result === 'lose' && fixed && FIXED[id]?.practice) {
    // 練習對打：輸了也不扣錢、不送回村子
    healAll(G.s); game.scene.wake('World'); G.ui.toast({ title: '練習結束', text: '輸了也沒關係！HP 都回復了。' });
  } else if (result === 'lose') {
    const s = G.s; const lost = Math.min(s.money, Math.max(5, Math.ceil(s.money * 0.1)));
    s.money -= lost; const cLost = 0; s.stats.lost++; // 勇氣不扣（避免越輸越難）
    // 在黑森林、而且營火已經點起來：回到營火旁；不然回村莊
    const camp = s.map === 'forest' && s.quests.main10?.status === 'done';
    const inChapter2 = isChapter2Map(s.map);
    const rootRest = s.quests.c2m4?.status === 'done';
    const rescue = inChapter2
      ? { map: rootRest ? 'rootvillage' : 'mistpath', ...(rootRest ? ROOT_REST : MIST_ENTRANCE) }
      : camp ? { map: 'forest', x: 5 * 32 + 40, y: 29 * 32 + 40 } : { map: 'village', x: 208, y: 446 };
    const { map: rm, x: rx, y: ry } = rescue;
    const place = inChapter2 ? (rootRest ? '大樹根村' : '紫霧林道入口') : camp ? '營火旁邊' : '村莊';
    healAll(s); s.map = rm; s.x = rx; s.y = ry; s.dir = 0;
    await G.ui.fade('', true);
    game.scene.wake('World'); world.placePlayer(rm, rx, ry, 0);
    G.busy++;
    await G.ui.unfade();
    G.busy--;
    await G.run('rescued');
    const lines = [`被小白貓救回${place}了喵。`, `掉了 ${lost} 魚乾幣${cLost ? '，勇氣值 -1' : ''}。`, '經驗值都還在喔，別灰心喵！'];
    if (!s.flags.firstLose) { s.flags.firstLose = true; lines.push('戰鬥失敗不會結束遊戲。休息一下，再出發吧喵！'); }
    await G.ui.reward('小白貓救了妳', lines);
  } else {
    game.scene.wake('World');
  }
  hud.setVisible(true); hud.refresh(); world.refreshWorld();
  music.play(MAPS[G.s.map]?.music ?? 'village');
  G.busy--;
  void G.drain();
  return result;
}

const game = new Phaser.Game({
  type: Phaser.AUTO, parent: 'game', backgroundColor: '#0d1330', pixelArt: true, roundPixels: true,
  scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' },
  scene: [Boot, Idle, WorldScene, BattleScene],
  input: { activePointers: 3 },
});
// 測試用：網址加上 ?debug=1 可以在主控台使用 __mcv
if (new URLSearchParams(location.search).has('debug')) (window as any).__mcv = { G, game, NPCS, check, DIALOGUES, GLINTS, TRIGGERS, QUESTS, MAPS, WONDERS, FIXED };
