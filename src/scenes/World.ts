import Phaser from 'phaser';
import { MAPS, TILE, GLINTS, TRIGGERS, WONDERS } from '../data/maps';
import { NPCS } from '../data/npcs';
import { QUESTS } from '../data/quests';
import { ENCOUNTERS } from '../data/enemies';
import type { NpcDef, GlintDef, MapDef, WonderDef } from '../data/types';
import { G } from '../core/game';
import { check, objDone } from '../core/conditions';
import { notify, currentObjective } from '../core/quests';
import { buildGround, buildIcons } from './textures';
import { sfx } from '../core/sfx';
import { music } from '../core/music';
import { blockTaps, tapsBlocked } from '../core/tapguard';

const SOLID = 'TwFW';
// 外觀服裝：主角的貓耳髮箍／月光雨衣、夥伴的月光宴會裝（只改外觀）
export const heroKey = (s: { outfit?: string }) => s.outfit && ['ears', 'coat', 'coat_ears'].includes(s.outfit) ? 'hero_' + s.outfit : 'hero';
const spriteFor = (s: { feast?: boolean; flags: Record<string, boolean> }, def: NpcDef) => s.feast && s.flags.party_outfit && ['ali', 'mint', 'yuzu'].includes(def.id) ? def.id + '_feast' : def.sprite;
const SPEED = 118;
type Interactable = { kind: 'npc'; def: NpcDef; spr: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image } | { kind: 'glint'; def: GlintDef; spr: Phaser.GameObjects.Image };

export class WorldScene extends Phaser.Scene {
  map!: MapDef; player!: Phaser.GameObjects.Sprite; shadow!: Phaser.GameObjects.Image;
  blocked: boolean[][] = []; propBlocked: boolean[][] = [];
  npcs: { def: NpcDef; spr: Phaser.GameObjects.Image; sh: Phaser.GameObjects.Image; mark: Phaser.GameObjects.Image; tile: [number, number] }[] = [];
  glints: { def: GlintDef; spr: Phaser.GameObjects.Image }[] = [];
  condProps: Phaser.GameObjects.Image[] = [];
  paws: Phaser.GameObjects.Image[] = [];
  keys!: any; path: { x: number; y: number }[] = []; pathTarget: Interactable | null = null; tapMarker!: Phaser.GameObjects.Image;
  dir = 0; walkT = 0; stepAcc = 0; grassSteps = 0; nearest: Interactable | null = null; night!: Phaser.GameObjects.Rectangle; rain!: Phaser.GameObjects.Container; glows: Phaser.GameObjects.Image[] = [];
  transitioning = false; lastTile = '';
  followSpawn: { x: number; y: number } | null = null; tapArmed = false; trail: { x: number; y: number }[] = [];
  followers: { def: NpcDef; spr: Phaser.GameObjects.Image; sh: Phaser.GameObjects.Image; x: number; y: number; walkT: number }[] = [];
  hud: any;
  constructor() { super('World'); }
  init(data: { hud: any }) { if (data?.hud) this.hud = data.hud; }
  create() {
    blockTaps(300); this.tapArmed = false;
    G.world = this; buildIcons(this);
    this.npcs = []; this.glints = []; this.condProps = []; this.paws = []; this.followers = []; this.trail = []; this.glows = []; this.path = []; this.pathTarget = null;
    const s = G.s; this.map = MAPS[s.map]; s.size = 'normal'; this.wonderSprs = []; this.activeWonder = null; this.nearWonder = null;
    const gk = 'ground_' + this.map.id; if (!this.textures.exists(gk)) buildGround(this, gk, this.map.tiles, !!this.map.forest);
    const W = this.map.tiles[0].length * TILE, H = this.map.tiles.length * TILE;
    this.add.image(0, 0, gk).setOrigin(0).setDepth(-10);
    if (this.map.indoor) this.cameras.main.setBounds(0, -40, W, H + 160).setBackgroundColor('#1b120c');
    else this.cameras.main.setBounds(-16, -70, W + 32, H + 230).setBackgroundColor(this.map.forest ? '#13241c' : '#2d5a2a');
    this.blocked = this.map.tiles.map(row => [...row].map(ch => SOLID.includes(ch)));
    // 樹牆
    if (this.map.trees) this.map.tiles.forEach((row, y) => [...row].forEach((ch, x) => {
      if (ch !== 'T') return; const j = ((x * 7 + y * 13) % 5) - 2;
      if (this.map.flipTrees) { this.add.image(x * TILE + 16 + j, y * TILE + 32, 'w_ftree').setOrigin(.5, 1).setScale(.62 + ((x + y) % 3) * .05).setFlipX((x + y) % 2 === 1).setDepth(y * TILE + 30); return; }
      this.add.image(x * TILE + 16 + j, y * TILE + 30, this.map.forest ? 'ftree' : 'tree').setOrigin(.5, 1).setScale((this.map.forest ? .74 : .62) + ((x + y) % 3) * .05).setDepth(y * TILE + 30);
    }));
    // 地圖外圍的裝飾樹（讓畫面捲到控制鈕上方時不會露出空白）
    if (this.map.trees) for (let yy = H + 34; yy < H + 260; yy += 40) for (let xx = -10; xx < W + 20; xx += 34) this.add.image(xx + ((yy / 40) % 2) * 17, yy, this.map.flipTrees ? 'w_ftree' : this.map.forest ? 'ftree' : 'tree').setOrigin(.5, 1).setScale(this.map.flipTrees ? .62 : this.map.forest ? .74 : .62).setDepth(yy).setTint(0xb8c8b0);
    // 小溪閃光
    this.map.tiles.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === 'w' && (x * 3 + y) % 4 === 0) { const sp = this.add.rectangle(x * TILE + 10, y * TILE + 14, 8, 2, 0xd8f2ff).setDepth(-5); this.tweens.add({ targets: sp, alpha: .1, x: sp.x + 8, duration: 900 + (x % 3) * 300, yoyo: true, repeat: -1 }); } }));
    // 道具
    for (const p of this.map.props) {
      if (p.when) continue; // 有條件的裝飾：在 refreshWorld 裡畫
      if (p.hidden) { if (p.block) this.blockRect(p.x - p.block[0] / 2, p.y - p.block[1], p.block[0], p.block[1]); continue; }
      const im = this.add.image(p.x, p.y, p.key).setOrigin(.5, 1).setScale(p.scale ?? 1).setDepth(p.y).setFlipX(!!p.flip).setFlipY(!!p.flipY);
      if (p.block) this.blockRect(p.x - p.block[0] / 2, p.y - p.block[1], p.block[0], p.block[1]);
      if (p.glow) { const g = this.add.image(p.x, p.y - 44, 'glow').setBlendMode(Phaser.BlendModes.ADD).setDepth(9001).setScale(1.1); this.glows.push(g); this.tweens.add({ targets: g, alpha: .7, duration: 1200, yoyo: true, repeat: -1 }); }
      void im;
    }
    this.propBlocked = this.blocked.map(r => r.slice());
    // 主角
    this.shadow = this.add.image(0, 0, 'shadow').setDepth(0);
    this.player = this.add.sprite(s.x, s.y, heroKey(s), (s.dir ?? 0) * 3).setOrigin(.5, 1);
    this.dir = s.dir ?? 0;
    this.tapMarker = this.add.image(0, 0, 'paw').setVisible(false).setDepth(1).setTint(0xffe7a8);
    this.cameras.main.startFollow(this.player, true, .15, .15); this.cameras.main.setRoundPixels(true);
    // 室內小房間：整間放在畫面正中間（不跟著主角捲動）
    if (this.map.indoor && W <= 390) { this.cameras.main.removeBounds(); this.cameras.main.stopFollow(); this.cameras.main.centerOn(W / 2, H / 2 + 10); }
    this.applyZoom(); this.scale.on('resize', this.applyZoom, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.applyZoom, this));
    // 夜晚
    this.night = this.add.rectangle(0, 0, 4000, 4000, 0x141c5c, this.map.indoor ? .3 : .52).setOrigin(0).setScrollFactor(0).setDepth(9000);
    // 下雨天（只在村子裡、白天）：灰灰的天色 + 雨絲
    this.rain = this.add.container(0, 0).setScrollFactor(0).setDepth(9001).setVisible(false);
    if (this.map.id === 'village') {
      this.rain.add(this.add.rectangle(0, 0, 4000, 4000, 0x5a6a86, .32).setOrigin(0));
      for (let i = 0; i < 70; i++) {
        const dx = (i * 53) % 640, d0 = (i * 97) % 900;
        const drop = this.add.rectangle(dx, d0 - 60, 2, 16, 0xdcecff, .85).setAngle(12);
        this.rain.add(drop);
        this.tweens.add({ targets: drop, y: d0 + 900, x: dx - 190, duration: 900 + (i % 7) * 60, repeat: -1 });
      }
    }
    // 黑森林：四周暗暗的（暗角），只有中間看得清楚
    if (this.map.forest) { const fx = (this.cameras.main as any).postFX?.addVignette?.(0.5, 0.5, 0.62, 0.55); this.events.once('shutdown', () => { try { (this.cameras.main as any).postFX?.remove(fx); } catch { /* ignore */ } }); }
    this.refreshWorld();
    // 貼紙收藏家胸針：這張地圖有觀察力還不夠看到的閃光點時，提示一下
    if ((G.s.inventory.collector_pin ?? 0) > 0 && GLINTS.some(g => g.map === this.map.id && !(g.once && G.s.flags[g.once]) && check(G.s, g.when) && G.s.observation < g.obs))
      this.time.delayedCall(900, () => G.ui.toast({ title: '胸針閃了一下', text: '這附近好像藏著什麼……觀察力再高一點就看得到喵！' }));
    // 輸入
    this.keys = this.input.keyboard?.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE,ENTER');
    this.input.keyboard?.on('keydown-SPACE', () => this.interact()); this.input.keyboard?.on('keydown-ENTER', () => this.interact());
    // 只有「按下」和「放開」都在遊戲畫面（canvas）上、而且當時沒有對話或選單時，才算點地移動。
    // 這樣點按鈕、搖桿、對話框、系統面板時，角色就不會跑走。
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => { this.tapArmed = this.isCanvasEvent(p, 'down') && G.busy === 0 && !this.transitioning && !this.hud.joyActive && !tapsBlocked() && !document.querySelector('.sys-wrap'); });
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => { const ok = this.tapArmed && this.isCanvasEvent(p, 'up') && G.busy === 0 && !this.transitioning && !this.hud.joyActive && !tapsBlocked(); this.tapArmed = false; if (ok) this.onTap(p); });
    this.hud.onAct = () => this.interact();
    this.hud.showMapName(this.map.name);
    music.play(this.map.music ?? 'village');
    this.trail = [];
    // 進入地圖的劇情
    this.time.delayedCall(350, () => this.checkTriggers());
    if (!(this as any)._wb) { (this as any)._wb = true; this.events.on('wake', () => { blockTaps(400); this.tapArmed = false; this.refreshWorld(); }); }
  }
  isCanvasEvent(p: Phaser.Input.Pointer, which: 'down' | 'up') {
    const el = which === 'down' ? p.downElement : p.upElement; const ev: any = p.event;
    const tgt = ev?.changedTouches?.[0] ? document.elementFromPoint(ev.changedTouches[0].clientX, ev.changedTouches[0].clientY) : ev?.target;
    const cv = this.game.canvas; return el === cv && (!tgt || tgt === cv);
  }
  applyZoom() { const w = this.scale.width; this.cameras.main.setZoom(Phaser.Math.Clamp(w / 390, 1, 1.6)); }
  blockRect(x: number, y: number, w: number, h: number) {
    for (let ty = 0; ty < this.blocked.length; ty++) for (let tx = 0; tx < this.blocked[0].length; tx++) {
      const cx = tx * TILE + 16, cy = ty * TILE + 16; if (cx >= x && cx <= x + w && cy >= y && cy <= y + h) this.blocked[ty][tx] = true;
    }
  }
  placePlayer(map: string, x: number, y: number, dir = 0) {
    G.s.map = map; G.s.x = x; G.s.y = y; G.s.dir = dir;
    if (map !== this.map.id) this.scene.restart(); else { this.player.setPosition(x, y); this.dir = dir; this.player.setFrame(dir * 3); this.path = []; this.followers.forEach(f => { f.spr.destroy(); f.sh.destroy(); }); this.followers = []; this.refreshWorld(); music.play(this.map.music ?? 'village'); this.lastTile = ''; this.checkTriggers(); }
  }
  playerPos() { return { map: this.map.id, x: Math.round(this.player.x), y: Math.round(this.player.y), dir: this.dir }; }
  npcSpot(n: NpcDef) { return n.spots.find(sp => check(G.s, sp.when)); }
  markerTargets() {
    const s = G.s; const set = new Set<string>();
    for (const [qid, qs] of Object.entries(s.quests)) {
      if (qs.status === 'available' && QUESTS[qid].giver) set.add('!' + QUESTS[qid].giver);
      if (qs.status !== 'active') continue; const def = QUESTS[qid];
      const objs = def.ordered ? [currentObjective(s, qid)].filter(Boolean) : def.objectives.filter(o => !objDone(s, qid, o.id));
      for (const o of objs as any[]) { (o.marker ?? []).forEach((m: string) => set.add(m)); if (o.type === 'talk' && o.targets) o.targets.forEach((t: string) => { if (!(qs.seen[o.id] ?? []).includes(t)) set.add(t); }); }
    }
    return set;
  }
  refreshWorld() {
    const s = G.s;
    if (this.player && this.player.texture.key !== heroKey(s)) this.player.setTexture(heroKey(s), this.dir * 3);
    const prevF = new Map(this.followers.map(f => [f.def.id, { x: f.x, y: f.y }]));
    this.night.setVisible(s.time === 'night' || !!this.map.nightAlways); this.rain.setVisible(s.weather === 'rain' && s.time === 'day'); this.glows.forEach(g => g.setVisible(s.time === 'night'));
    // NPC
    this.npcs.forEach(n => { n.spr.destroy(); n.sh.destroy(); n.mark.destroy(); }); this.npcs = [];
    this.blocked = this.propBlocked.map(r => r.slice());
    const marks = this.markerTargets();
    const followIds: NpcDef[] = [];
    for (const def of NPCS) {
      if (def.follow && check(s, def.follow)) { followIds.push(def); continue; }
      const sp = this.npcSpot(def); if (!sp || sp.hidden || sp.map !== this.map.id) continue;
      const sh = this.add.image(sp.x, sp.y, 'shadow').setDepth(sp.y - 1).setScale(def.id === 'whitecat' || def.id === 'douhua' ? .8 : 1.1).setVisible(!def.noShadow);
      const lift = sp.lift ?? 0;
      const spr = this.add.image(sp.x, sp.y + 3 - lift, sp.sprite ?? spriteFor(s, def)).setOrigin(.5, 1).setDepth(sp.y + lift).setScale(def.scale ?? 1).setFlipX(!!sp.flip).setInteractive();
      spr.setData('gy', sp.y + 3); if (lift) sh.setVisible(false);
      if (def.bob) this.tweens.add({ targets: spr, y: spr.y - 3, duration: 700 + (sp.x % 5) * 80, yoyo: true, repeat: -1 });
      if (def.id === 'whitecat') this.tweens.add({ targets: spr, scaleY: 1.04, duration: 900, yoyo: true, repeat: -1 });
      const isGiver = marks.has('!' + def.id); const isTarget = marks.has(def.id);
      const mark = this.add.image(sp.x, sp.y - lift - spr.displayHeight - 8, isGiver ? 'mark' : 'arrow').setDepth(9500).setVisible(isGiver || isTarget);
      this.tweens.add({ targets: mark, y: mark.y - 6, duration: 500, yoyo: true, repeat: -1 });
      // 剛剛還跟著主角的角色（例如送回家的豆花）：從身邊走回自己的位置
      const pf = prevF.get(def.id);
      if (pf) { const tx0 = sp.x, ty0 = sp.y; spr.setPosition(pf.x, pf.y); sh.setPosition(pf.x, pf.y); mark.setAlpha(0); this.tweens.add({ targets: spr, x: tx0, y: ty0 + 3, duration: 900, ease: 'Sine.easeInOut' }); this.tweens.add({ targets: sh, x: tx0, y: ty0, duration: 900, ease: 'Sine.easeInOut', onComplete: () => mark.setAlpha(1) }); }
      const tile: [number, number] = [Math.floor(sp.x / TILE), Math.floor((sp.y - 4) / TILE)];
      if (this.blocked[tile[1]] && !lift) this.blocked[tile[1]][tile[0]] = true;
      this.npcs.push({ def, spr, sh, mark, tile });
    }
    this.syncFollowers(followIds);
    this.followers.forEach(f => { const k = spriteFor(s, f.def); if (f.spr.texture.key !== k) f.spr.setTexture(k); });
    this.drawWonders();
    // 有條件的裝飾（例如還掛在樹上的茶壺）
    this.condProps.forEach(c => c.destroy()); this.condProps = [];
    for (const p of this.map.props) if (p.when && check(s, p.when)) this.condProps.push(this.add.image(p.x, p.y, p.key).setOrigin(.5, 1).setScale(p.scale ?? 1).setDepth(p.depth ?? p.y).setFlipX(!!p.flip).setFlipY(!!p.flipY));
    // 閃光點
    this.glints.forEach(g => g.spr.destroy()); this.glints = [];
    for (const def of GLINTS) {
      if (def.map !== this.map.id) continue; if (def.once && s.flags[def.once]) continue; if (!check(s, def.when)) continue; if (s.observation < def.obs) continue;
      const k = def.kind === 'prints' ? 'prints' : def.kind === 'paw' ? 'paw' : 'sparkle';
      const spr = this.add.image(def.x, def.y, k).setDepth(def.y - 20);
      if (k !== 'sparkle') { const sp2 = this.add.image(def.x + 10, def.y - 10, 'sparkle').setDepth(def.y + 1).setScale(.8); this.tweens.add({ targets: sp2, alpha: .2, scale: .4, duration: 600, yoyo: true, repeat: -1 }); spr.once('destroy', () => sp2.destroy()); }
      else this.tweens.add({ targets: spr, alpha: .35, scale: .7, angle: 45, duration: 700, yoyo: true, repeat: -1 });
      this.glints.push({ def, spr });
    }
    // 引導貓掌印
    this.paws.forEach(p => p.destroy()); this.paws = [];
    const gp = this.map.guidePaw; if (gp && check(s, gp.when)) gp.points.forEach(([x, y], i) => { const p = this.add.image(x + (i % 2 ? 8 : -8), y, 'paw').setDepth(-1).setAlpha(.2).setBlendMode(Phaser.BlendModes.ADD); this.tweens.add({ targets: p, alpha: 1, duration: 500, delay: (gp.points.length - i) * 160, yoyo: true, repeat: -1, repeatDelay: 900 }); this.paws.push(p); });
    this.hud.refresh();
  }
  // 紫色的霧：從某個地方飄出來，然後慢慢散去
  fogBurst(x: number, y: number, n = 8) {
    for (let i = 0; i < n; i++) {
      const f = this.add.image(x + (Math.random() - .5) * 60, y + (Math.random() - .5) * 20, 'fog').setDepth(8000).setAlpha(0).setScale(.6 + Math.random() * .8).setBlendMode(Phaser.BlendModes.SCREEN);
      this.tweens.add({ targets: f, alpha: { from: 0, to: .85 }, x: f.x + (Math.random() - .5) * 160, y: f.y - 30 - Math.random() * 90, scale: f.scale * 1.8, duration: 1600 + Math.random() * 900, delay: i * 140, yoyo: true, hold: 900, onComplete: () => f.destroy() });
    }
  }
  // 月亮突然暗了一下，燈火一起搖晃
  moonDim() {
    const r = this.add.rectangle(0, 0, 4000, 4000, 0x000010, 0).setOrigin(0).setScrollFactor(0).setDepth(9003);
    this.tweens.add({ targets: r, fillAlpha: .75, duration: 260, yoyo: true, repeat: 2, onComplete: () => r.destroy() });
    this.glows.forEach(g => this.tweens.add({ targets: g, alpha: .1, duration: 90, yoyo: true, repeat: 7 }));
  }
  // ---------- 跟隨者（豆花、之後的夥伴、護送任務都用這個） ----------
  syncFollowers(defs: NpcDef[]) {
    const keep = new Set(defs.map(d => d.id));
    this.followers = this.followers.filter(f => { if (keep.has(f.def.id)) return true; f.spr.destroy(); f.sh.destroy(); return false; });
    defs.forEach((def, i) => {
      if (this.followers.some(f => f.def.id === def.id)) return;
      // 出現在主角背後（面向的反方向）
      const back = [[0, -1], [0, 1], [1, 0], [-1, 0]][this.dir] ?? [0, -1]; const gap = 26 * (i + 1);
      let x = this.player.x + back[0] * gap, y = this.player.y + back[1] * gap;
      if (this.hits(x, y) > 0) { x = this.player.x; y = this.player.y + 2; }
      if (this.followSpawn) { x = this.followSpawn.x; y = this.followSpawn.y; }
      const sh = this.add.image(x, y, 'shadow').setScale(.7);
      const spr = this.add.image(x, y, spriteFor(G.s, def)).setOrigin(.5, 1).setScale(def.scale ?? 1).setInteractive();
      this.followers.push({ def, spr, sh, x, y, walkT: 0 });
    });
    this.followSpawn = null; this.trail = [];
  }
  updateFollowers(dt: number) {
    if (!this.followers.length) return;
    const last = this.trail[this.trail.length - 1];
    if (!last || Math.hypot(last.x - this.player.x, last.y - this.player.y) > 3) { this.trail.push({ x: this.player.x, y: this.player.y }); if (this.trail.length > 200) this.trail.shift(); }
    this.followers.forEach((f, i) => {
      // 沿著主角走過的路，保持一段距離跟著
      const want = 28 * (i + 1); let acc = 0; let tx = f.x, ty = f.y; let found = false;
      for (let k = this.trail.length - 1; k > 0; k--) { acc += Math.hypot(this.trail[k].x - this.trail[k - 1].x, this.trail[k].y - this.trail[k - 1].y); if (acc >= want) { tx = this.trail[k - 1].x; ty = this.trail[k - 1].y; found = true; break; } }
      const dx = tx - f.x, dy = ty - f.y; const d = Math.hypot(dx, dy);
      const moving = found && d > 1.5;
      if (moving) { const sp = Math.min(d, (SPEED * 1.15) * dt + (d > 40 ? d * 0.1 : 0)); f.x += dx / d * sp; f.y += dy / d * sp; if (Math.abs(dx) > d * 0.4) f.spr.setFlipX(dx > 0); f.walkT += dt * 12; }
      const bob = moving ? Math.abs(Math.sin(f.walkT)) * 3 : 0;
      f.spr.setPosition(f.x, f.y - bob).setDepth(f.y); f.sh.setPosition(f.x, f.y - 1).setDepth(f.y - 1);
    });
  }
  // ---------- 輸入 ----------
  onTap(p: Phaser.Input.Pointer) {
    if (G.busy > 0 || this.transitioning) return;
    if (p.getDistance() > 14 && p.getDuration() > 250) return;
    sfx.unlock();
    const wp = this.cameras.main.getWorldPoint(p.x, p.y);
    let target: Interactable | null = null;
    // 跟在身後的夥伴優先度最低：同時點到村民和夥伴時，先跟村民說話
    for (const f of this.followers) { const b = f.spr.getBounds(); if (b.contains(wp.x, wp.y)) target = { kind: 'npc', def: f.def, spr: f.spr }; }
    for (const n of this.npcs) { const b = n.spr.getBounds(); if (b.contains(wp.x, wp.y)) target = { kind: 'npc', def: n.def, spr: n.spr }; }
    for (const g of this.glints) if (Phaser.Math.Distance.Between(wp.x, wp.y, g.def.x, g.def.y) < 26) target = { kind: 'glint', def: g.def, spr: g.spr };
    if (target && this.distTo(target) < 60) { this.path = []; this.doInteract(target); return; }
    const gx = target ? target.spr.x : wp.x, gy = target ? (target.kind === 'npc' ? (target.spr.getData('gy') ?? target.spr.y) - 4 : target.spr.y) : wp.y;
    const path = this.findPath(this.player.x, this.player.y - 4, gx, gy, !!target);
    if (path) { this.path = path; this.pathTarget = target; this.tapMarker.setPosition(gx, gy).setVisible(!target).setAlpha(1); this.tweens.add({ targets: this.tapMarker, alpha: 0, duration: 900 }); }
  }
  findPath(x0: number, y0: number, x1: number, y1: number, toAdjacent: boolean) {
    const W = this.blocked[0].length, H = this.blocked.length;
    const sx = Math.floor(x0 / TILE), sy = Math.floor(y0 / TILE); let tx = Math.floor(x1 / TILE), ty = Math.floor(y1 / TILE);
    const free = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H && !this.blocked[y][x];
    const goals = new Set<number>();
    if (toAdjacent || !free(tx, ty)) {
      for (let r = 1; r <= 3 && !goals.size; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (Math.max(Math.abs(dx), Math.abs(dy)) === r && free(tx + dx, ty + dy)) goals.add((ty + dy) * W + tx + dx);
      if (!goals.size) return null;
    } else goals.add(ty * W + tx);
    const prev = new Map<number, number>(); const q = [sy * W + sx]; prev.set(q[0], -1); let end = -1;
    while (q.length) { const c = q.shift()!; if (goals.has(c)) { end = c; break; } const cx = c % W, cy = (c / W) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) { const nx = cx + dx, ny = cy + dy; if (!free(nx, ny)) continue; if (dx && dy && (!free(cx + dx, cy) || !free(cx, cy + dy))) continue; const k = ny * W + nx; if (prev.has(k)) continue; prev.set(k, c); q.push(k); } }
    if (end < 0) return null;
    const pts: { x: number; y: number }[] = []; for (let c = end; c !== -1 && c !== sy * W + sx; c = prev.get(c)!) pts.unshift({ x: (c % W) * TILE + 16, y: ((c / W) | 0) * TILE + 20 });
    if (!toAdjacent && free(tx, ty) && pts.length) pts[pts.length - 1] = { x: x1, y: y1 + 4 };
    return pts;
  }
  distTo(t: Interactable) { const y = t.kind === 'npc' ? (t.spr.getData('gy') ?? t.spr.y) - 6 : t.spr.y; return Phaser.Math.Distance.Between(this.player.x, this.player.y - 6, t.spr.x, y); }
  interact() { if (G.busy > 0 || this.transitioning) return; if (this.nearWonder) { this.useWonder(this.nearWonder); return; } if (this.nearest) this.doInteract(this.nearest); }
  // ---------- 變大變小（只在奇妙圈圈的範圍裡） ----------
  wonderSprs: Phaser.GameObjects.Image[] = []; activeWonder: WonderDef | null = null; nearWonder: WonderDef | null = null;
  drawWonders() {
    this.wonderSprs.forEach(w => w.destroy()); this.wonderSprs = [];
    for (const w of WONDERS) {
      if (w.map !== this.map.id || !check(G.s, w.when)) continue;
      const im = this.add.image(w.x, w.y, 'w_circle').setDepth(-4).setAlpha(.85); this.wonderSprs.push(im);
      this.tweens.add({ targets: im, alpha: .45, scale: .92, duration: 900, yoyo: true, repeat: -1 });
    }
  }
  setSize(size: 'normal' | 'small' | 'big', w: WonderDef | null) {
    G.s.size = size; this.activeWonder = w; const sc = size === 'small' ? .5 : size === 'big' ? 1.6 : 1;
    this.tweens.add({ targets: this.player, scale: sc, duration: 450, ease: 'Back.Out' }); this.shadow.setScale(sc);
    this.followers.forEach(f => { f.spr.setVisible(size === 'normal'); f.sh.setVisible(size === 'normal'); });
    sfx.levelUp?.();
  }
  async useWonder(w: WonderDef) {
    const s = G.s;
    if (s.size !== 'normal') { this.setSize('normal', null); G.ui.toast({ title: '變回來了', text: '咻～變回原來的大小了！' }); return; }
    const item = w.mode === 'small' ? 'shrink_dew' : 'grow_cookie';
    if (!(s.inventory[item] > 0)) { await G.run(w.mode === 'small' ? 'w_need_small' : 'w_need_big'); return; }
    this.setSize(w.mode, w);
    if (!s.stickers.includes(w.mode === 'small' ? 'w_small' : 'w_big')) G.exec({ type: 'sticker', id: w.mode === 'small' ? 'w_small' : 'w_big' });
    G.ui.toast(w.mode === 'small' ? { title: '咕嘟咕嘟……', text: '喝了縮縮露水，身體變小了！可以鑽進小洞喔。' } : { title: '喀滋喀滋……', text: '吃了長高高餅乾，身體變大了！搆得到高高的地方喔。' });
  }
  updateWonders(locked: boolean) {
    const s = G.s; const px = this.player.x, py = this.player.y;
    if (this.activeWonder && s.size !== 'normal') { const a = this.activeWonder.area; if (px < a.x || px > a.x + a.w || py < a.y || py > a.y + a.h) { this.setSize('normal', null); G.ui.toast({ title: '變回來了', text: '走出奇妙的地方，身體變回原來的大小了。' }); } }
    this.nearWonder = null; if (locked) return;
    for (const w of WONDERS) if (w.map === this.map.id && check(s, w.when) && Math.hypot(px - w.x, py - w.y) < 26) { this.nearWonder = w; break; }
    if (this.nearWonder) this.hud.setAction(s.size !== 'normal' ? '變回來' : this.nearWonder.mode === 'small' ? '喝露水變小' : '吃餅乾變大');
  }
  async doInteract(t: Interactable): Promise<void> {
    this.path = []; this.pathTarget = null;
    const dx = t.spr.x - this.player.x, dy = t.spr.y - this.player.y;
    this.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 2 : 3) : (dy < 0 ? 1 : 0); this.player.setFrame(this.dir * 3);
    if (t.kind === 'glint' && (t.def as GlintDef).needSize && G.s.size !== (t.def as GlintDef).needSize) { await G.run((t.def as GlintDef).sizeHint ?? ((t.def as GlintDef).needSize === 'big' ? 'w_toohigh' : 'w_toobig')); return; }
    if (t.kind === 'npc') {
      const rule = t.def.talk.find(r => check(G.s, r.when)); if (!rule) return;
      await G.run(rule.d, t.def.id);
    } else {
      this.followSpawn = { x: t.def.x, y: t.def.y + 8 };
      await G.run(t.def.d);
      if (t.def.once) G.s.flags[t.def.once] = true;
      notify(G.s, 'inspect', t.def.id);
    }
    this.refreshWorld();
  }
  pendingTr = new Set<string>(); disarmed = new Set<string>();
  // 劇情觸發：進入地圖（沒有 zone）或走進某個範圍（有 zone）。整段劇情跑完才算看過；戰鬥輸了下次走進來會再觸發。
  checkTriggers() {
    for (const tr of TRIGGERS) {
      if (tr.map !== this.map.id || G.s.flags[tr.once] || this.pendingTr.has(tr.id) || !check(G.s, tr.when)) continue;
      if (tr.zone) {
        const z = tr.zone; const inside = this.player.x >= z.x && this.player.x <= z.x + z.w && this.player.y >= z.y && this.player.y <= z.y + z.h;
        if (!inside) { this.disarmed.delete(tr.id); continue; }
        if (this.disarmed.has(tr.id)) continue; // 剛剛逃跑／輸了：先走出這個範圍，再走進來才會重新開始
      }
      this.pendingTr.add(tr.id); this.path = []; this.pathTarget = null;
      G.enqueue(async () => { try { if (check(G.s, tr.when) && !G.s.flags[tr.once]) { const ok = await G.run(tr.d); if (ok) G.s.flags[tr.once] = true; else this.disarmed.add(tr.id); } } finally { this.pendingTr.delete(tr.id); } });
    }
    this.checkZones();
  }
  checkZones() {
    for (const z of this.map.zones) if (this.player.x >= z.x && this.player.x <= z.x + z.w && this.player.y >= z.y && this.player.y <= z.y + z.h) notify(G.s, 'reach', z.id);
    notify(G.s, 'reach', this.map.id);
  }
  // ---------- 每幀 ----------
  update(_t: number, dms: number) {
    const dt = Math.min(dms, 50) / 1000;
    let vx = 0, vy = 0;
    const locked = G.busy > 0 || this.transitioning;
    if (!locked) {
      const k = this.keys;
      if (k) { if (k.A.isDown || k.LEFT.isDown) vx -= 1; if (k.D.isDown || k.RIGHT.isDown) vx += 1; if (k.W.isDown || k.UP.isDown) vy -= 1; if (k.S.isDown || k.DOWN.isDown) vy += 1; }
      const j = this.hud.joyVec; if (j.x || j.y) { vx = j.x; vy = j.y; this.path = []; this.pathTarget = null; this.tapMarker.setVisible(false); }
      if (vx || vy) { this.path = []; this.pathTarget = null; const m = Math.hypot(vx, vy); if (m > 1) { vx /= m; vy /= m; } }
      else if (this.path.length) {
        const wp = this.path[0]; const dx = wp.x - this.player.x, dy = wp.y - this.player.y; const d = Math.hypot(dx, dy);
        if (d < 4) { this.path.shift(); if (!this.path.length && this.pathTarget) { const t = this.pathTarget; this.pathTarget = null; if (this.distTo(t) < 80) this.doInteract(t); } }
        else { vx = dx / d; vy = dy / d; }
      }
    }
    const moving = !!(vx || vy);
    if (moving) {
      const sp = SPEED * dt; const ox = this.player.x, oy = this.player.y;
      this.tryMove(vx * sp, 0); this.tryMove(0, vy * sp);
      const moved = Math.hypot(this.player.x - ox, this.player.y - oy);
      if (moved < 0.01 && this.path.length) { const t = this.pathTarget; this.path = []; this.pathTarget = null; if (t && this.distTo(t) < 80) this.doInteract(t); }
      this.dir = this.faceFor(vx, vy);
      this.walkT += dt * 9; // 一步一步：站 → 左腳 → 站 → 右腳
      const ph = Math.floor(this.walkT) % 4; this.player.setFrame(this.dir * 3 + (ph === 1 ? 1 : ph === 3 ? 2 : 0));
      this.onMoved(moved);
    } else { this.player.setFrame(this.dir * 3); this.walkT = 0; }
    this.updateFollowers(dt);
    const bob = moving && Math.floor(this.walkT) % 2 === 1 ? 1 : 0; // 抬腳時身體上移 1 像素
    this.player.setDisplayOrigin(this.player.width / 2, this.player.height + bob);
    this.player.setDepth(this.player.y); this.shadow.setPosition(this.player.x, this.player.y - 1).setDepth(this.player.y - 1);
    // 互動提示
    let best: Interactable | null = null, bd = 54;
    for (const n of this.npcs) { const t: Interactable = { kind: 'npc', def: n.def, spr: n.spr }; const d = this.distTo(t); if (d < bd) { bd = d; best = t; } }
    for (const g of this.glints) { const t: Interactable = { kind: 'glint', def: g.def, spr: g.spr }; const d = this.distTo(t); if (d < bd) { bd = d; best = t; } }
    this.nearest = best; this.hud.setAction(locked ? null : best ? (best.kind === 'npc' ? '對話' : '調查') : null);
    this.updateWonders(locked);
  }
  // 面向判斷（含遲滯）：斜著走時不會每一幀在「側面／正面」之間來回切換造成一扭一扭
  faceFor(vx: number, vy: number) {
    const ax = Math.abs(vx), ay = Math.abs(vy); const H = 1.5; // 另一個軸要大 1.5 倍（約 56°）才換方向
    const horiz = this.dir === 2 || this.dir === 3;
    if (horiz) { if (ay > ax * H) return vy < 0 ? 1 : 0; return ax > 0.05 ? (vx < 0 ? 2 : 3) : this.dir; }
    if (ax > ay * H) return vx < 0 ? 2 : 3; return ay > 0.05 ? (vy < 0 ? 1 : 0) : this.dir;
  }
  solidAt(px: number, py: number) { const tx = Math.floor(px / TILE), ty = Math.floor(py / TILE); if (ty < 0 || tx < 0 || ty >= this.blocked.length || tx >= this.blocked[0].length) return true; return this.blocked[ty][tx]; }
  hits(x: number, y: number) { const hw = 7, top = 8; return (+this.solidAt(x - hw, y - top)) + (+this.solidAt(x + hw, y - top)) + (+this.solidAt(x - hw, y - 1)) + (+this.solidAt(x + hw, y - 1)); }
  tryMove(dx: number, dy: number) {
    const nx = this.player.x + dx, ny = this.player.y + dy;
    const now = this.hits(this.player.x, this.player.y), next = this.hits(nx, ny);
    if (next > 0 && next >= now && !(now > 0 && next <= now)) return;
    this.player.x = nx; this.player.y = ny;
  }
  tileAtPlayer() { const tx = Math.floor(this.player.x / TILE), ty = Math.floor((this.player.y - 4) / TILE); return { tx, ty, ch: this.map.tiles[ty]?.[tx] ?? 'T' }; }
  onMoved(d: number) {
    const { tx, ty, ch } = this.tileAtPlayer(); const key = `${tx},${ty}`;
    // 出口
    const ex = this.map.exits.find(e => e.tx === tx && e.ty === ty);
    if (ex && !this.transitioning && !(ex.up && this.dir !== 1)) {
      if (check(G.s, ex.when) && (!ex.needSize || G.s.size === ex.needSize)) { this.transitioning = true; this.path = []; G.enqueue(async () => { sfx.transition(); await G.ui.fade(); this.placePlayer(ex.to, ex.x, ex.y, ex.dir ?? (ex.to === 'village' ? 1 : 0)); await new Promise(r => setTimeout(r, 200)); this.transitioning = false; await G.ui.unfade(); }); }
      else { this.player.y += ex.up ? 12 : ex.ty === 0 ? 12 : -12; this.path = []; if (ex.lockedDialogue) G.run(ex.lockedDialogue); }
      return;
    }
    if (key !== this.lastTile) { this.lastTile = key; this.checkTriggers(); }
    // 暗雷遇敵
    if ((ch === 'G' || ch === 'g' || ch === 'y') && this.map.encounter) {
      this.stepAcc += d; if (this.stepAcc >= TILE) { this.stepAcc = 0; this.grassSteps++; sfx.step(); this.onGrassStep(); }
    }
  }
  onGrassStep() {
    const s = G.s;
    if (G.busy > 0 || (s.size && s.size !== 'normal')) return;
    const cur = currentObjective(s, 'main6');
    if (cur?.id === 'tutorial') { const n = s.quests.main6.prog.tutorial ?? 0; this.startBattle(['tut1', 'tut2', 'tut3'][n], true); return; }
    const enabled = s.quests.main6 && objDone(s, 'main6', 'tutorial');
    if (!enabled) return;
    const tbl = ENCOUNTERS[this.map.encounter!];
    if (this.grassSteps >= tbl.minSteps && Math.random() < tbl.rate) this.startBattle(tbl.id, false);
  }
  startBattle(id: string, fixed: boolean) {
    this.grassSteps = 0; this.path = []; this.pathTarget = null; this.hud.joyVec = { x: 0, y: 0 };
    G.enqueue(() => (window as any).__startBattle(id, fixed));
  }
}
