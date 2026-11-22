import Phaser from 'phaser';
import { G } from '../core/game';
import { ENEMIES, ENCOUNTERS, FIXED } from '../data/enemies';
import { ITEMS, STICKERS } from '../data/items';
import { MEMBERS, MAX_PARTY, type SkillDef } from '../data/characters';
import type { EnemyDef, FixedEncounter } from '../data/types';
import { memberStats, addExp } from '../core/state';
import { bossTalkChance, calcDamage, talkChance, escapeChance } from '../core/battle';
import { notify, advance } from '../core/quests';
import { check } from '../core/conditions';
import { el, root, A } from '../ui/ui';
import { sfx } from '../core/sfx';
import { music } from '../core/music';

type Foe = { def: EnemyDef; hp: number; atkUp: number; sleep: number; spr: Phaser.GameObjects.Image; gone: boolean; how?: 'defeat' | 'talk' | 'flee'; label: string; called?: boolean; stole?: string };
type Ally = { id: string; sticky: number; stun: number; sleep: number; bindTurn: number; cryTurn: number; cryUntil: number; defend: boolean; taunt: number; coveredBy: string | null; dashUsed: boolean; justIn: boolean; guardUp?: number };
type Cmd = { who: string; kind: 'attack' | 'skill' | 'item' | 'defend' | 'run' | 'talk'; foe?: Foe; ally?: string; item?: string; skill?: SkillDef; extra?: boolean };
export type BattleResult = 'win' | 'lose' | 'escape';
const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

export class BattleScene extends Phaser.Scene {
  foes: Foe[] = []; allies: Ally[] = []; ui!: HTMLElement; msgEl!: HTMLElement; cmdEl!: HTMLElement; partyEl!: HTMLElement; hintEl!: HTMLElement;
  resolve!: (r: BattleResult) => void; encId = ''; fixed = false; fx: FixedEncounter | null = null; hintText = ''; bg!: Phaser.GameObjects.Image;
  turn = 0; latePhase = false; lateShown = false; sharedKindness = false; purrBonus = 0;
  constructor() { super('Battle'); }
  init(d: { enc: string; fixed: boolean; resolve: (r: BattleResult) => void }) { this.encId = d.enc; this.fixed = d.fixed; this.resolve = d.resolve; this.foes = []; this.allies = []; this.turn = 0; this.latePhase = false; this.lateShown = false; this.sharedKindness = false; this.purrBonus = 0; }
  name(id: string) { return id === 'hero' ? G.s.name : MEMBERS[id].name; }
  ally(id: string) { return this.allies.find(a => a.id === id); }
  hp(id: string) { return G.s.members[id].hp; }
  // 上場的隊員：隊伍（最多 3 人），同行的暫時隊友也算一個
  activeIds() { const s = G.s; const g = s.guest && !s.party.includes(s.guest) ? [s.guest] : []; return [...s.party.slice(0, MAX_PARTY - g.length), ...g]; }
  benchIds() { const s = G.s; const act = new Set(this.allies.map(a => a.id)); return Object.values(s.members).filter(m => m.joined && !act.has(m.id)).map(m => m.id); }
  aliveAllies() { return this.allies.filter(a => this.hp(a.id) > 0); }
  create() {
    let ids: string[]; let bg = 'battlebg';
    if (this.fixed) { const f = FIXED[this.encId]; this.fx = f; ids = f.enemies; bg = f.bg; this.hintText = f.hint ?? ''; }
    else {
      this.fx = null; const t = ENCOUNTERS[this.encId]; const groups = t.groups.filter(g => !g.when || check(G.s, g.when));
      let r = Math.random() * groups.reduce((a, g) => a + g.weight, 0); const g = groups.find(g => (r -= g.weight) < 0) ?? groups[0]; ids = g.enemies; bg = t.bg; this.hintText = '';
    }
    this.bg = this.add.image(0, 0, bg).setOrigin(.5, 0);
    ids.forEach((id) => this.addFoe(id));
    this.relabel();
    this.allies = this.activeIds().map(id => this.newAlly(id));
    this.layout(); this.scale.on('resize', this.layout, this); this.events.once('shutdown', () => { this.scale.off('resize', this.layout, this); this.ui?.remove(); });
    this.buildUI();
    this.cameras.main.fadeIn(300);
    this.run();
  }
  newAlly(id: string): Ally { return { id, sticky: 0, stun: 0, sleep: 0, bindTurn: -1, cryTurn: -3, cryUntil: -1, defend: false, taunt: 0, coveredBy: null, dashUsed: false, justIn: false }; }
  addFoe(id: string) {
    const def = ENEMIES[id]; const spr = this.add.image(0, 0, def.sprite).setOrigin(.5, 1);
    const f: Foe = { def, hp: def.hp, atkUp: 1, sleep: 0, spr, gone: false, label: def.name }; this.foes.push(f);
    this.tweens.add({ targets: spr, scaleY: { from: 1, to: 1.05 }, duration: 700 + this.foes.length * 120, yoyo: true, repeat: -1 });
    return f;
  }
  relabel() { const cnt: Record<string, number> = {}; const tot: Record<string, number> = {}; this.foes.forEach(f => tot[f.def.id] = (tot[f.def.id] ?? 0) + 1); this.foes.forEach(f => { const i = cnt[f.def.id] = (cnt[f.def.id] ?? 0) + 1; f.label = f.def.name + (tot[f.def.id] > 1 ? 'ABCDE'[i - 1] : ''); }); }
  layout() {
    const w = this.scale.width, h = this.scale.height;
    const sc = Math.max(w / this.bg.width, h / this.bg.height); this.bg.setScale(sc).setPosition(w / 2, Math.min(0, h - this.bg.height * sc));
    const n = this.foes.length; const ss = Math.min(1.1, w / 390) * (n > 2 ? .66 : n > 1 ? .78 : 1);
    const xs = n === 1 ? [.5] : n === 2 ? [.3, .7] : n === 3 ? [.2, .5, .8] : [.14, .38, .62, .86];
    this.foes.forEach((f, i) => { f.spr.setPosition(w * (xs[i] ?? .5), h * (.44 + (n > 2 && i % 2 ? .03 : 0))); f.spr.setScale(ss); });
  }
  buildUI() {
    this.ui = el('div', 'battle-ui', '', root());
    this.partyEl = el('div', 'party', '', this.ui);
    this.hintEl = el('div', 'bhint hidden', '', this.ui);
    this.msgEl = el('div', 'bmsg', '', this.ui);
    this.cmdEl = el('div', 'cmds', '', this.ui);
    this.renderParty();
  }
  renderParty(active = '') {
    const s = G.s; this.partyEl.innerHTML = '';
    for (let i = 0; i < MAX_PARTY; i++) {
      const a = this.allies[i];
      if (!a) { el('div', 'pslot empty', '<div>空位<br><small>（找到夥伴就能一起戰鬥）</small></div>', this.partyEl); continue; }
      const id = a.id; const m = s.members[id]; const st = memberStats(s, id); const ko = m.hp <= 0;
      const tags = [a.sticky ? '黏黏' : '', a.stun ? '暈暈' : '', a.sleep ? '睡著' : '', a.bindTurn >= this.turn ? '被綁住' : '', this.turn <= a.cryUntil ? '想哭' : '', a.defend ? '防禦' : '', a.taunt ? '吸引' : '', a.coveredBy ? '被保護' : '', a.guardUp ? '勇氣' : '', ko ? '倒下' : '', s.guest === id ? '同行' : ''].filter(Boolean);
      const d = el('div', 'pslot' + (active === id ? ' active' : '') + (ko ? ' ko' : ''), `<div class="sts">${tags.map(t => `<span class="st${t === '防禦' || t === '被保護' ? ' good' : ''}">${t}</span>`).join('')}</div><div class="nm"><img src="${A(MEMBERS[id].icon)}" alt=""><span>${this.name(id)}</span><span>Lv${m.lv}</span></div>
        <div class="bar"><i style="width:${(m.hp / st.maxHp) * 100}%"></i></div><div>HP ${m.hp}/${st.maxHp}</div><div class="bar mp"><i style="width:${(m.mp / st.maxMp) * 100}%"></i></div><div class="mpn">MP ${m.mp}/${st.maxMp}</div>`, this.partyEl);
      d.dataset.id = id;
    }
  }
  async say(t: string, ms = 900) { this.msgEl.innerHTML = t; await new Promise<void>(res => { const tm = setTimeout(done, ms); const self = this; function done() { clearTimeout(tm); self.msgEl.removeEventListener('pointerdown', done); res(); } this.msgEl.addEventListener('pointerdown', done); }); }
  alive() { return this.foes.filter(f => !f.gone); }
  menu(items: { label: string; cls?: string; disabled?: boolean; glow?: boolean; v: string }[], grid = true): Promise<string> {
    return new Promise(res => {
      this.cmdEl.className = grid ? 'cmds' : 'sublist'; this.cmdEl.innerHTML = '';
      for (const it of items) { const b = el('button', (it.cls ?? '') + (it.glow ? ' glowing' : ''), it.label, this.cmdEl) as HTMLButtonElement; b.disabled = !!it.disabled; b.onclick = () => { sfx.blip(); this.cmdEl.innerHTML = ''; res(it.v); }; }
    });
  }
  async pickTarget(): Promise<Foe | null> {
    const al = this.alive(); if (al.length === 1) return al[0];
    this.msgEl.innerHTML = '要選哪一隻呢？';
    const handlers: (() => void)[] = [];
    const p = new Promise<Foe | null>(res => {
      al.forEach(f => { f.spr.setInteractive(); const h = () => { this.cmdEl.innerHTML = ''; res(f); }; f.spr.once('pointerdown', h); handlers.push(() => { f.spr.off('pointerdown', h); f.spr.disableInteractive(); }); });
      this.menu([...al.map(f => ({ label: f.label, v: f.label })), { label: '↩ 返回', cls: 'back', v: '' }], false).then(v => res(al.find(f => f.label === v) ?? null));
    });
    const r = await p; handlers.forEach(h => h()); return r;
  }
  async pickAlly(prompt: string, filter: (a: Ally) => boolean = a => this.hp(a.id) > 0): Promise<string | null> {
    this.msgEl.innerHTML = prompt;
    const list = this.allies.filter(filter);
    const v = await this.menu([...list.map(a => { const st = memberStats(G.s, a.id); return { label: `${this.name(a.id)}<small>HP ${this.hp(a.id)}/${st.maxHp}</small>`, v: a.id }; }), { label: '↩ 返回', cls: 'back', v: '' }], false);
    return v || null;
  }
  // ---------- 選指令 ----------
  async askCmd(a: Ally, extra = false): Promise<Cmd | 'swapped' | null> {
    const s = G.s; const id = a.id; const m = s.members[id]; const hero = id === 'hero';
    if (this.hintText) { this.hintEl.innerHTML = '🐾 ' + this.hintText; this.hintEl.classList.remove('hidden'); }
    this.msgEl.innerHTML = `${this.name(id)}要做什麼呢？${extra ? '（疾風貓步：多動一次！）' : ''}`;
    this.renderParty(id);
    const tut = this.fixed ? this.encId : '';
    const bench = this.benchIds();
    const items: { label: string; cls?: string; disabled?: boolean; glow?: boolean; v: string }[] = [
      { label: '⚔️ 攻擊', v: 'attack', glow: tut === 'tut1' }, { label: '✨ 技能', v: 'skill', glow: tut === 'tut2' }, { label: '🍪 道具', v: 'item' },
      { label: '🛡️ 防禦', v: 'defend' },
    ];
    if (hero) items.push({ label: '🏃 逃跑', v: 'run', disabled: !!this.fx?.noEscape }, { label: '💬 對話', v: 'talk', cls: 'talk', glow: tut === 'tut3' || (this.latePhase && !!this.alive().find(f => f.def.boss)) });
    else items.push({ label: '🔄 換人', v: 'swap', disabled: !bench.length }, { label: '💬 對話<small>（只有勇者會）</small>', v: '', cls: 'talk', disabled: true });
    const v = await this.menu(items);
    if (v === 'attack' || v === 'talk') { const f = await this.pickTarget(); return f ? { who: id, kind: v, foe: f, extra } : null; }
    if (v === 'skill') {
      const sks = MEMBERS[id].skills.filter(k => m.lv >= k.learnLv && (!k.quest || !!G.s.skills?.[id]?.includes(k.id)));
      const c = await this.menu([...sks.map(k => ({ label: `${k.name}<small>MP ${k.mp}・${k.desc}</small>`, v: k.id, disabled: m.mp < k.mp || (k.kind === 'dash' && (a.dashUsed || extra)) })), { label: '↩ 返回', cls: 'back', v: '' }], false);
      if (!c) return null; const sk = sks.find(k => k.id === c)!;
      if (sk.kind === 'attack' || sk.kind === 'taunt' || sk.kind === 'sleepFoe') { const f = await this.pickTarget(); return f ? { who: id, kind: 'skill', skill: sk, foe: f, extra } : null; }
      if (sk.kind === 'heal' || sk.kind === 'cure') { const t = await this.pickAlly(sk.kind === 'heal' ? '要幫誰回血呢？' : '要幫誰解除不舒服呢？'); return t ? { who: id, kind: 'skill', skill: sk, ally: t, extra } : null; }
      if (sk.kind === 'guardAll' || sk.kind === 'healAll' || sk.kind === 'peek') return { who: id, kind: 'skill', skill: sk, extra };
      if (sk.kind === 'guard') { const t = await this.pickAlly('要保護誰呢？', x => x.id !== id && this.hp(x.id) > 0); return t ? { who: id, kind: 'skill', skill: sk, ally: t, extra } : null; }
      return { who: id, kind: 'skill', skill: sk, extra };
    }
    if (v === 'item') {
      const usable = Object.entries(s.inventory).filter(([iid, n]) => n > 0 && ITEMS[iid].battle);
      const c = await this.menu([...usable.map(([iid, n]) => ({ label: `${ITEMS[iid].name}<small>×${n}</small>`, v: iid })), ...(usable.length ? [] : [{ label: '沒有可以用的道具', v: '', disabled: true }]), { label: '↩ 返回', cls: 'back', v: '' }], false);
      if (!c) return null;
      const foes = ITEMS[c].food ? this.alive().filter(f => !f.def.boss) : [];
      if (foes.length) {
        this.msgEl.textContent = '要把食物給誰呢？';
        const allies = this.aliveAllies().map(a => ({ label: `${this.name(a.id)}<small>HP ${this.hp(a.id)}/${memberStats(s, a.id).maxHp}</small>`, v: a.id }));
        const targets = foes.map((f, i) => ({ label: `${f.label}<small>分享食物</small>`, v: `foe_${i}` }));
        const target = await this.menu([...allies, ...targets, { label: '↩ 返回', cls: 'back', v: '' }], false);
        if (!target) return null;
        const foe = foes[targets.findIndex(t => t.v === target)];
        return { who: id, kind: 'item', item: c, ally: foe ? undefined : target, foe, extra };
      }
      const t = this.allies.length > 1 ? await this.pickAlly('要給誰吃呢？') : id; return t ? { who: id, kind: 'item', item: c, ally: t, extra } : null;
    }
    if (v === 'swap') {
      const inId = await this.menu([...bench.map(b => { const st = memberStats(s, b); return { label: `${MEMBERS[b].name}<small>Lv${s.members[b].lv}・HP ${s.members[b].hp}/${st.maxHp}</small>`, v: b }; }), { label: '↩ 返回', cls: 'back', v: '' }], false);
      if (!inId) return null;
      await this.swap(id, inId); return 'swapped';
    }
    return { who: id, kind: v as any, extra };
  }
  async swap(outId: string, inId: string) {
    const i = this.allies.findIndex(x => x.id === outId); const na = this.newAlly(inId); na.justIn = true; this.allies[i] = na;
    const s = G.s; const pi = s.party.indexOf(outId); if (pi >= 0) s.party[pi] = inId; else s.party.push(inId);
    sfx.ok(); this.renderParty(); await this.say(`${this.name(outId)}退到後面休息，換${this.name(inId)}上場！`, 1000);
  }
  // ---------- 主流程 ----------
  async run() {
    const s = G.s;
    await this.say(this.alive().map(f => f.label).join('、') + ' 出現了！', 1000);
    for (const ln of this.fx?.startLines ?? []) if (this.ally(ln.who)) await this.say(`${this.name(ln.who)}：「${G.fmt(ln.t)}」`, 1500);
    while (true) {
      this.turn++;
      this.checkLate();
      if (this.latePhase && !this.lateShown) { this.lateShown = true; await this.showLate(); }
      // 1. 每個人選指令
      const cmds: Cmd[] = [];
      this.allies.forEach(a => { a.justIn = false; });
      for (let i = 0; i < this.allies.length; i++) {
        const a = this.allies[i]; if (this.hp(a.id) <= 0 || a.justIn) continue;
        if (a.stun || a.sleep || a.bindTurn === this.turn) continue;
        let c: Cmd | 'swapped' | null = null; while (!c) c = await this.askCmd(a);
        if (c === 'swapped') continue;
        cmds.push(c);
        if (c.skill?.kind === 'dash') { let e: Cmd | 'swapped' | null = null; while (!e || e === 'swapped') e = await this.askCmd(a, true); cmds.push(e); }
      }
      this.hintEl.classList.add('hidden'); this.renderParty();
      // 2. 依照速度排順序（防禦、保護最先）
      const prio = (c: Cmd) => (c.kind === 'defend' || c.skill?.kind === 'guard' ? 100 : 0) + this.spdOf(c.who) + (c.extra ? -0.1 : 0);
      type Ev = { cmd?: Cmd; foe?: Foe; p: number };
      const evs: Ev[] = [...cmds.map(c => ({ cmd: c, p: prio(c) })), ...this.alive().map(f => ({ foe: f, p: f.def.spd + Math.random() * .5 }))];
      // 這回合被暈眩／睡著的人：說明一下
      for (const a of this.allies) if (this.hp(a.id) > 0 && (a.stun || a.sleep || a.bindTurn === this.turn)) { await this.say(`${this.name(a.id)}${a.stun ? '頭暈暈的，動不了！' : a.bindTurn === this.turn ? '的腳被綁住了，動不了！' : '呼嚕呼嚕……睡著了。'}`, 800); }
      evs.sort((x, y) => y.p - x.p);
      for (const e of evs) {
        if (e.cmd) {
          if (this.hp(e.cmd.who) <= 0 || !this.ally(e.cmd.who)) continue;
          const r = await this.doCmd(e.cmd); if (r) return this.finish(r);
        } else if (e.foe && !e.foe.gone) {
          await this.doFoe(e.foe); if (!this.aliveAllies().length) return this.finish('lose');
        }
        if (!this.alive().length) return this.finish('win');
      }
      // 3. 回合結束
      for (const a of this.allies) { a.defend = false; a.coveredBy = null; if (a.sticky) a.sticky--; if (a.stun) a.stun--; if (a.taunt) a.taunt--; if (a.guardUp) a.guardUp--; if (a.sleep && Math.random() < .5) { a.sleep = 0; if (this.hp(a.id) > 0) await this.say(`${this.name(a.id)}醒過來了！`, 700); } }
      this.renderParty();
    }
  }
  spdOf(id: string) { const a = this.ally(id); return memberStats(G.s, id).spd * (a?.sticky ? .3 : 1); }
  talkCh(f: Foe) {
    const s = G.s; const fx = this.fx; if (fx?.forceTalk) return 1;
    let base = f.def.talkBase + (fx?.talkBonus ?? 0);
    if (f.def.talkBonus && check(s, f.def.talkBonus.when)) base += f.def.talkBonus.add;
    if (f.def.id === 'wolf' && (s.inventory.jerky ?? 0) > 0) base += 0.25; // 帶著肉乾：野狼比較願意聽
    if (f.def.boss) return bossTalkChance(this.latePhase ? f.def.boss.lateTalk : f.def.boss.earlyTalk, s.courage);
    return talkChance(base, s.courage, s.kindness, this.purrBonus);
  }
  checkLate() { const b = this.alive().find(f => f.def.boss); if (!b?.def.boss) return; if (this.turn > b.def.boss.lateTurn || b.hp <= b.def.hp * b.def.boss.lateHp) this.latePhase = true; }
  async showLate() {
    const b = this.alive().find(f => f.def.boss); if (!b?.def.boss) return;
    for (const t of b.def.boss.lateLines) await this.say(G.fmt(t), 1600);
    for (const ln of this.fx?.lateLines ?? []) if (this.ally(ln.who) && this.hp(ln.who) > 0) await this.say(`${this.name(ln.who)}：「${G.fmt(ln.t)}」`, 1500);
    this.hintText = '巨岩好像沒那麼生氣了……現在試試看「對話」喵！';
  }
  floatText(x: number, y: number, t: string, color = '#ffffff') {
    const tx = this.add.text(x, y, t, { fontFamily: 'Huninn, sans-serif', fontSize: '30px', color, stroke: '#3b2a1e', strokeThickness: 6 }).setOrigin(.5).setDepth(50);
    this.tweens.add({ targets: tx, y: y - 46, alpha: 0, duration: 1000, ease: 'Cubic.out', onComplete: () => tx.destroy() });
  }
  async hitFoe(f: Foe, dmg: number, big = false) {
    const sl = this.add.image(f.spr.x, f.spr.y - f.spr.displayHeight / 2, 'slash').setDepth(40).setScale(big ? 1.6 : 1.1); this.tweens.add({ targets: sl, alpha: 0, angle: 30, duration: 350, onComplete: () => sl.destroy() });
    sfx.hit(); this.tweens.add({ targets: f.spr, alpha: .2, duration: 70, yoyo: true, repeat: 2 });
    f.sleep = 0;
    f.hp -= dmg; this.floatText(f.spr.x, f.spr.y - f.spr.displayHeight * .6, String(dmg), big ? '#ffe17a' : '#ffffff');
    await wait(350);
    if (f.hp <= 0) {
      f.gone = true; f.how = 'defeat'; sfx.enemyDown(); this.tweens.add({ targets: f.spr, alpha: 0, scaleX: f.spr.scaleX * 1.4, scaleY: 0, duration: 400 });
      if (f.def.boss) await this.say(`${f.label}「咚」地一聲坐在地上，大口大口喘氣……`, 1300);
      else await this.say(`${f.label} 縮成一小團，咕嚕咕嚕地逃走了！`, 900);
    }
  }
  heal(id: string, n: number) { const st = memberStats(G.s, id); const m = G.s.members[id]; const b = m.hp; m.hp = Math.min(st.maxHp, m.hp + n); return m.hp - b; }
  async doCmd(c: Cmd): Promise<BattleResult | null> {
    const s = G.s; const id = c.who; const st = memberStats(s, id); const m = s.members[id]; const me = this.ally(id)!; const nm = this.name(id);
    const atk = this.turn > me.cryTurn && this.turn <= me.cryUntil ? st.atk * 0.75 : st.atk;
    if (c.kind !== 'item' && c.foe?.gone) c.foe = this.alive()[0]; if (!c.foe && (c.kind === 'attack' || c.kind === 'talk')) return null;
    switch (c.kind) {
      case 'attack': { await this.say(`${nm}${MEMBERS[id].verb}！`, 500); await this.hitFoe(c.foe!, calcDamage(atk, c.foe!.def.def)); break; }
      case 'skill': {
        const sk = c.skill!; if (m.mp < sk.mp) { await this.say(`${nm}的 MP 不夠了……`, 700); break; }
        m.mp -= sk.mp; this.renderParty();
        if (sk.kind === 'attack') { await this.say(`${nm}鼓起勇氣——「${sk.name}」！`, 700); this.cameras.main.shake(150, .006); await this.hitFoe(c.foe!, calcDamage(atk, c.foe!.def.def, sk.power), true); }
        else if (sk.kind === 'taunt') { await this.say(`${nm}：「看這邊！」——「${sk.name}」！`, 700); me.taunt = 2; await this.hitFoe(c.foe!, calcDamage(atk, c.foe!.def.def, sk.power)); if (!c.foe!.gone) await this.say(`${c.foe!.label}生氣地瞪著${nm}！`, 700); }
        else if (sk.kind === 'guard') { const t = this.ally(c.ally!); if (t && this.hp(t.id) > 0) { t.coveredBy = id; await this.say(`${nm}：「${this.name(t.id)}，我來擋！」`, 900); } }
        else if (sk.kind === 'heal') { const n = this.hp(c.ally!) > 0 ? this.heal(c.ally!, sk.power + Math.floor(st.atk / 2)) : 0; sfx.heal(); await this.say(n ? `${nm}使出「${sk.name}」！${this.name(c.ally!)}回復了 ${n} HP！` : `${this.name(c.ally!)}${this.hp(c.ally!) > 0 ? '的 HP 已經滿了！' : '倒下了，無法回血……'}`, 1000); }
        else if (sk.kind === 'cure') { const t = this.ally(c.ally!); if (t) { const had = t.sticky || t.stun || t.sleep || t.bindTurn >= this.turn || this.turn <= t.cryUntil; t.bindTurn = -1; t.cryTurn = -3; t.cryUntil = -1; t.sticky = 0; t.stun = 0; t.sleep = 0; sfx.heal(); await this.say(`${nm}使出「${sk.name}」！香香的花香飄過來${had ? `，${this.name(t.id)}舒服多了！` : '……大家都好放鬆。'}`, 1100); } }
        else if (sk.kind === 'allFoes') { await this.say(`${nm}：「看我的！」——「${sk.name}」！`, 700); for (const f of this.alive()) await this.hitFoe(f, calcDamage(atk, f.def.def, sk.power)); }
        else if (sk.kind === 'guardAll') { await this.say(`${nm}：「喵嗚——！大家不要怕！」——「${sk.name}」！`, 900); for (const x of this.aliveAllies()) x.guardUp = 2; this.renderParty(); await this.say('大家鼓起勇氣，防禦變高了！（2 回合）', 900); }
        else if (sk.kind === 'healAll') { sfx.heal(); const parts: string[] = []; for (const x of this.aliveAllies()) { const n = this.heal(x.id, sk.power + Math.floor(st.atk / 3)); if (n) parts.push(`${this.name(x.id)} +${n}`); } await this.say(`${nm}打開「${sk.name}」！香香的草藥灑向大家。<br><small>${parts.join('、') || '大家都很有精神！'}</small>`, 1300); }
        else if (sk.kind === 'peek') { const lines = this.alive().map(f => `${f.label}：HP ${f.hp}／${f.def.hp}・對話成功率約 ${Math.round(this.talkCh(f) * 100)}%`); await this.say(`${nm}瞇起眼睛偷偷看……<br><small>${lines.join('<br>')}</small>`, 2200); }
        else if (sk.kind === 'purr') {
          this.purrBonus = sk.power;
          await this.say(`${nm}輕輕地呼嚕……下一次對話更容易成功了！`);
        }
        else if (sk.kind === 'sleepFoe' && c.foe) {
          if (Math.random() < sk.power) {
            c.foe.sleep = 1;
            await this.say(`${nm}唱起搖籃曲，${c.foe.label}睡著了！`);
          } else await this.say(`${nm}唱起搖籃曲，${c.foe.label}還醒著。`);
        }
        else if (sk.kind === 'dash') { me.dashUsed = true; await this.say(`${nm}跑得像風一樣快！`, 700); }
        this.renderParty(); break;
      }
      case 'item': {
        const item = c.item!;
        const it = ITEMS[item];
        if (!(s.inventory[item] > 0)) break;
        if (c.foe) {
          if (it.food && !c.foe.gone && !c.foe.def.boss) await this.shareFood(c.foe, item);
          break;
        }
        const target = c.ally ?? id;
        if (this.hp(target) <= 0) {
          await this.say(`${this.name(target)}倒下了，吃不下東西……`, 800);
          break;
        }
        s.inventory[item]--;
        sfx.heal();
        if (it.healAll) {
          const parts = this.aliveAllies().map(ally => `${this.name(ally.id)} +${this.heal(ally.id, it.heal ?? 0)}`);
          this.renderParty();
          await this.say(`${nm}拿出${it.name}，大家一起吃！<br><small>${parts.join('、')}</small>`, 1100);
          break;
        }
        const n = this.heal(target, it.heal ?? 0);
        this.renderParty();
        await this.say(`${target === id ? nm : `${nm}拿給${this.name(target)}`}吃了${it.name}，HP 回復了 ${n}！`, 900);
        break;
      }
      case 'defend': { me.defend = true; await this.say(`${nm}準備好防禦！`, 600); this.renderParty(); break; }
      case 'run': {
        const ch = escapeChance(st.spd, Math.max(...this.alive().map(f => f.def.spd))) * (this.alive().some(f => f.def.boss) ? .6 : 1);
        if (Math.random() < ch) { await this.say(`大家一溜煙地跑走了！`, 800); return 'escape'; }
        await this.say('逃跑失敗了……被擋住了！', 800); break;
      }
      case 'talk': {
        const f = c.foe!; const fx = this.fx;
        const ch = this.talkCh(f);
        this.purrBonus = 0;
        if (fx?.talkScript && fx.forceTalk) { this.ui.style.visibility = 'hidden'; await G.run(fx.talkScript); this.ui.style.visibility = ''; }
        else await this.say(f.def.boss ? `${nm}抬頭看著${f.label}：「我們不是來打架的。」` : `${nm}對${f.label}說：「我們不要打架，好不好？」`, 1000);
        if (Math.random() < ch) {
          if (fx?.talkScript && !fx.forceTalk) { this.ui.style.visibility = 'hidden'; await G.run(fx.talkScript); this.ui.style.visibility = ''; }
          else if (!fx?.forceTalk) { const L = fx?.talkLines ?? f.def.talkLines; await this.say(`${f.label}：「${G.fmt(L[Math.floor(Math.random() * L.length)])}」`, 1600); }
          s.stats.talkSuccess++;
          this.peacefulExit(f);
          { const sid = `shiny_${f.def.sticker ?? f.def.id}`; if (STICKERS[sid] && !s.stickers.includes(sid) && Math.random() < 0.08 + s.courage * 0.01) { s.stickers.push(sid); sfx.claim(); G.ui.toast({ title: '✨ 閃亮貼紙！', text: STICKERS[sid] }); } }
          await this.say(`對話成功！${f.label}${f.def.boss ? '放下了大樹幹。' : '慢慢離開了。'}`, 1000);
          await this.leaveGift(f, fx?.forceTalk);
          if (f.def.info && Math.random() < .35) await this.say(`${f.label}偷偷說：「${f.def.info[Math.floor(Math.random() * f.def.info.length)]}」`, 1800);
          notify(s, 'resolve', f.def.id);
        } else {
          const L = f.def.boss ? (this.latePhase ? ['……妳為什麼不逃？', '……（巨岩握著樹幹的手，有一點在抖）'] : f.def.boss.earlyLines) : f.def.talkFail;
          await this.say(`${f.label}：「${G.fmt(L[Math.floor(Math.random() * L.length)])}」<br><small>${f.def.boss && !this.latePhase ? '（巨岩好緊張……先撐過攻擊，看看牠的樣子吧）' : '（勇氣值和善良值越高，越容易成功喔）'}</small>`, 1400);
        }
        break;
      }
    }
    return null;
  }
  peacefulExit(f: Foe) {
    f.gone = true; f.how = 'talk';
    if (this.fx?.talkFlag) G.s.flags[this.fx.talkFlag] = true;
    const hearts = this.add.image(f.spr.x, f.spr.y - f.spr.displayHeight, 'heart').setScale(2).setDepth(45); this.tweens.add({ targets: hearts, y: hearts.y - 40, alpha: 0, duration: 1100, onComplete: () => hearts.destroy() });
    sfx.heal(); this.tweens.add({ targets: f.spr, x: f.spr.x + 260, alpha: 0, duration: 900, ease: 'Sine.in' });
    this.sticker(f.def, 'talk');
  }
  async leaveGift(f: Foe, guaranteed = false) {
    const s = G.s;
    for (const g of f.def.gifts) if (guaranteed || Math.random() < g.chance) { s.inventory[g.item] = (s.inventory[g.item] ?? 0) + 1; await this.say(`${f.label}留下了「${ITEMS[g.item].name}」！`, 900); }
  }
  async shareFood(f: Foe, item: string) {
    const liked = f.def.likesFood;
    if (liked !== true && !(Array.isArray(liked) && liked.includes(item))) {
      await this.say('牠聞了聞，好像不餓。');
      return;
    }
    const s = G.s;
    s.inventory[item]--;
    s.stats.shares++;
    this.peacefulExit(f);
    if (!this.sharedKindness) {
      this.sharedKindness = true;
      G.addKindness(1);
    }
    await this.say(`${f.label}：「謝謝妳分我吃！」牠收下${ITEMS[item].name}，開心地離開了。`, 1600);
    await this.leaveGift(f);
    notify(s, 'resolve', f.def.id);
  }
  sticker(def: EnemyDef, how: 'talk' | 'defeat') { const s = G.s; const id = `${def.sticker ?? def.id}_${how}`; if (STICKERS[id] && !s.stickers.includes(id)) { s.stickers.push(id); G.ui.toast({ title: '新貼紙', text: STICKERS[id] }); } }
  pickVictim(): Ally | undefined {
    const al = this.aliveAllies(); if (!al.length) return undefined;
    const t = al.filter(a => a.taunt > 0); if (t.length && Math.random() < .75) return t[0];
    return al[Math.floor(Math.random() * al.length)];
  }
  async hurt(a: Ally, f: Foe, power: number) {
    const s = G.s; let tgt = a; let covered = false;
    if (a.coveredBy) { const c = this.ally(a.coveredBy); if (c && this.hp(c.id) > 0) { tgt = c; covered = true; } }
    const st = memberStats(s, tgt.id); const m = s.members[tgt.id];
    let d = calcDamage(f.def.atk * f.atkUp, st.def, power, tgt.defend || covered); if (tgt.guardUp) d = Math.max(1, Math.round(d * 0.65));
    m.hp = Math.max(0, m.hp - d); sfx.hurt(); this.cameras.main.shake(120, .004);
    if (tgt.sleep) tgt.sleep = 0;
    this.renderParty(); this.partyEl.querySelector(`[data-id="${tgt.id}"]`)?.classList.add('hit');
    await this.say(`${covered ? `${this.name(tgt.id)}擋在${this.name(a.id)}前面！` : ''}${this.name(tgt.id)}受到 ${d} 點傷害。${tgt.defend ? '（防禦中，傷害減半！）' : ''}`, 800);
    if (m.hp <= 0) await this.say(`${this.name(tgt.id)}倒下了……`, 800);
    return tgt;
  }
  async doFoe(f: Foe) {
    if (f.sleep) {
      f.sleep--;
      await this.say(`${f.label}呼嚕呼嚕……睡著了。`);
      return;
    }
    const s = G.s;
    const sk = f.def.skills?.find(k => Math.random() < k.chance && !(k.call && (f.called || this.alive().length >= 3)) && !(k.roar && f.atkUp >= 1.6) && !(k.steal && (f.stole || !Object.entries(s.inventory).some(([i, n]) => n > 0 && ITEMS[i].battle))));
    this.tweens.add({ targets: f.spr, y: f.spr.y + 26, duration: 120, yoyo: true });
    if (sk?.call) {
      f.called = true; await this.say(`${f.label}「嗷嗚——！」大聲叫同伴！`, 900);
      const nf = this.addFoe(f.def.id); nf.spr.setAlpha(0); this.relabel(); this.layout(); this.tweens.add({ targets: nf.spr, alpha: 1, duration: 400 });
      await this.say(`又來了一隻${f.def.name}！`, 800); return;
    }
    if (sk?.roar) {
      f.atkUp = Math.min(1.6, f.atkUp + .3); this.cameras.main.shake(300, .01); await this.say(`${f.label}使出「${sk.name}」！「吼——！！」攻擊力變高了！`, 1000);
      if (f.def.boss) await this.say(`……${f.label}吼完，偷偷回頭看了森林深處一眼。`, 1100); return;
    }
    if (sk?.flee) {
      await this.fleeFoe(f, `${f.label}嚇了一跳，鑽進霧裡跑走了！`);
      return;
    }
    if (sk?.steal) {
      const its = Object.entries(s.inventory).filter(([i, n]) => n > 0 && ITEMS[i].battle); const [iid] = its[Math.floor(Math.random() * its.length)];
      s.inventory[iid]--; f.stole = iid;
      await this.fleeFoe(f, `${f.label}偷走了一個「${ITEMS[iid].name}」，抱著跑掉了！`);
      return;
    }
    await this.say(sk ? `${f.label}使出「${sk.name}」！` : `${f.label}撲了過來！`, 550);
    const victims = sk?.target === 'all' ? this.aliveAllies() : [this.pickVictim()].filter(Boolean) as Ally[];
    for (const v of victims) {
      const hitWho = await this.hurt(v, f, sk?.power ?? 1);
      if (this.hp(hitWho.id) <= 0) continue;
      if (sk?.status === 'sticky') { hitWho.sticky = 2; this.renderParty(); await this.say(`${this.name(hitWho.id)}被黏黏的果凍黏住了，動作變慢了！`, 900); }
      if (sk?.status === 'stun') { hitWho.stun = 1; this.renderParty(); await this.say(`地面搖來搖去！${this.name(hitWho.id)}頭暈暈的，下一回合不能動！`, 1000); }
      if (sk?.status === 'sleep') { hitWho.sleep = 2; this.renderParty(); await this.say(`${this.name(hitWho.id)}聞到香香的孢子……呼嚕呼嚕睡著了。`, 1000); }
      if (sk?.status === 'bind') {
        hitWho.bindTurn = this.turn + 1;
        this.renderParty();
        await this.say(`${this.name(hitWho.id)}的腳被藤蔓綁住了，下一回合不能動！`);
      }
      if (sk?.status === 'cry') {
        // 同一回合再次被濺到，仍保留這回合已生效的降攻。
        if (this.turn > hitWho.cryUntil) hitWho.cryTurn = this.turn;
        hitWho.cryUntil = this.turn + 2;
        this.renderParty();
        await this.say(`${this.name(hitWho.id)}也想哭了，接下來 2 回合攻擊變弱！`);
      }
    }
  }
  async fleeFoe(f: Foe, message: string) {
    f.gone = true; f.how = 'flee';
    this.tweens.add({ targets: f.spr, x: f.spr.x - 300, duration: 700 });
    await this.say(message, 1100);
  }
  async finish(r: BattleResult) {
    const s = G.s; this.cmdEl.innerHTML = ''; this.hintEl.classList.add('hidden');
    if (r === 'win') {
      music.jingle();
      const exp = this.foes.filter(f => f.how !== 'flee').reduce((a, f) => a + f.def.exp, 0); const money = this.foes.filter(f => f.how === 'defeat').reduce((a, f) => a + f.def.money, 0);
      s.money += money; s.stats.won++;
      // 一起戰鬥會提高羈絆：同一隊打贏 5 場 +1
      for (const a of this.allies) if (a.id !== 'hero' && s.members[a.id]?.joined) { const w = (s.bondWins ??= {}); w[a.id] = (w[a.id] ?? 0) + 1; if (w[a.id] % 5 === 0) G.bondUp(a.id); }
      for (const f of this.foes) if (f.how === 'defeat') { notify(s, 'defeat', f.def.id); notify(s, 'resolve', f.def.id); this.sticker(f.def, 'defeat'); }
      // 倒下的夥伴：戰鬥結束後用 1 HP 站起來
      for (const a of this.allies) if (s.members[a.id].hp <= 0) s.members[a.id].hp = 1;
      const ups = addExp(s, exp);
      const bench = this.benchIds();
      await this.say(`戰鬥結束！獲得 ${exp} EXP${money ? `、${money} 魚乾幣` : ''}。${bench.length ? '<br><small>（沒上場的夥伴也拿到一半 EXP）</small>' : ''}`, 1500);
      for (const u of ups) { const st = memberStats(s, u.id); sfx.levelUp(); await this.say(`🎉 ${this.name(u.id)}升到 Lv ${u.lv} 了！HP 上限 ${st.maxHp}、攻擊 ${st.atk}。HP 全部回復！`, 1800); }
      const fx = this.fx?.event; if (fx) advance(s, fx[0], fx[1]);
      notify(s, 'battle', s.map);
    } else if (r === 'lose') { sfx.lose(); await this.say(`大家都倒下了……`, 1300); }
    else { for (const a of this.allies) if (s.members[a.id].hp <= 0) s.members[a.id].hp = 1; }
    this.cameras.main.fadeOut(300); await wait(320);
    this.resolve(r);
  }
}
