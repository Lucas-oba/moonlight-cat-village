import type { Action, Dialogue, Line } from '../data/types';
import type { SavedLetter, WriteLetter } from '../data/letters';
import { DIALOGUES, INN_TALKS } from '../data/dialogues';
import { NPCS } from '../data/npcs';
import { ITEMS, STICKERS } from '../data/items';
import { ENEMIES } from '../data/enemies';
import { QUESTS } from '../data/quests';
import { type GameState, newState, saveGame, healAll, addExp } from './state';
import { bus } from './bus';
import { advance, startQuest, notify, refreshAvailability, currentObjective, questChapterPrefix } from './quests';
import { check } from './conditions';
import { sfx } from './sfx';
import { music } from './music';
import { blockTaps } from './tapguard';
import { MAX_BOND, MEMBERS } from '../data/characters';
import { awardKindEvents, chapterOf, CHAPTER_STATS, heroTier, type ChapterStat } from './hearts';
import { addStat, memberStats } from './state';
class AbortDialogue extends Error {}

export interface DialogueUI { show(line: { name?: string; text: string; kind: 'npc' | 'hero' | 'system' | 'narr'; portrait?: string; portraitH?: number; think?: boolean; flashBow?: boolean; glitch?: boolean; choices?: { label: string; brave?: true; locked?: boolean }[] }): Promise<number>; hide(): void; }
export interface UIHooks {
  writeLetter(a: WriteLetter): Promise<SavedLetter>;
  readLetter(letter: SavedLetter): Promise<void>;
  chapterEnd(chapter?: 2 | 3): Promise<void>; celebrate(tier: number): Promise<void>; shop(items: { id: string; price: number }[], title?: string): Promise<void>; dialogue: DialogueUI; activateSystem(): Promise<void>; openPanel(tab: string): Promise<void>; reward(title: string, lines: string[]): Promise<void>; fade(text?: string, white?: boolean): Promise<void>; unfade(): Promise<void>; toast(t: { title: string; text: string }): void; refresh(): void; quiz(o: any): Promise<number>; travel(): Promise<void>; stickerBoard(): Promise<void>; trade(): Promise<void>;
}

class GameController {
  s: GameState = newState();
  ui!: UIHooks;
  busy = 0;
  private queue: (() => Promise<void>)[] = [];
  private draining = false;
  world: any = null; // WorldScene
  battleHook: ((enc: string, fixed: boolean) => Promise<'win' | 'lose' | 'escape' | 'talk'>) | null = null;

  init(ui: UIHooks) {
    this.ui = ui;
    bus.on('questComplete', ({ def, lines }) => {
      this.enqueue(async () => {
        sfx.reward();
        await this.ui.reward(`${questChapterPrefix(def.chapter)}${def.kind === 'main' ? '主線' : '支線'} ${def.no}「${def.title}」完成喵！`, lines);
        if (def.onComplete) await this.run(def.onComplete);
      });
    });
    bus.on('levelUp', (u) => this.enqueue(async () => { sfx.levelUp(); await this.ui.reward('升級了喵！', [`${this.memberName(u.id)} 升到 Lv ${u.lv}！`, 'HP 和 MP 全部回復']); }));
    bus.on('toast', (t) => this.ui.toast(t));
    bus.on('questsChanged', () => { this.checkAuto(); this.checkKindEvents(); this.ui.refresh(); });
  }
  newGame(name: string) {
    this.s = newState(); this.s.name = name || '小葵';
    refreshAvailability(this.s); // main1 available
    this.s.quests.main1.status = 'done';
    refreshAvailability(this.s); // main2 自動開始
  }
  load(s: GameState) {
    this.s = s;
    // 第三章試玩存檔可能已走過河岸，補上當時還沒有的任務貼紙。
    for (const q of Object.values(QUESTS)) {
      const id = q.rewards.sticker;
      if (q.chapter === 3 && id && s.quests[q.id]?.status === 'done' && !s.stickers.includes(id)) {
        s.stickers.push(id);
      }
    }
    refreshAvailability(s);
  }
  checkKindEvents() {
    const n = awardKindEvents(this.s);
    if (n) this.ui.toast({ title: `💗 善良值 +${n}`, text: '' });
  }
  checkTitles() {
    const s = this.s;
    if (this.busy || this.draining || s.titleTier >= heroTier(s.courage)) return;
    this.enqueue(async () => {
      while (this.s === s && s.titleTier < heroTier(s.courage)) {
        const tier = ++s.titleTier;
        const skill = tier === 1 ? 'not_afraid' : tier === 4 ? 'moon_heart' : undefined;
        if (skill) {
          const skills = ((s.skills ??= {}).hero ??= []);
          if (!skills.includes(skill)) skills.push(skill);
        }
        if (tier === 3) s.inventory.shining_cape = Math.max(1, s.inventory.shining_cape ?? 0);
        const sticker = `title_t${tier}`;
        if (!s.stickers.includes(sticker)) s.stickers.push(sticker);
        if (this.world) Object.assign(s, this.world.playerPos());
        saveGame(s);
        this.ui.refresh();
        sfx.levelUp();
        await this.ui.celebrate(tier);
      }
    });
  }
  memberName(id: string) { return id === 'hero' ? this.s.name : (MEMBERS[id]?.name ?? id); }
  fmt(t: string) { return t.replace(/\{name\}/g, this.s.name); }
  enqueue(fn: () => Promise<void>) { this.queue.push(fn); this.drain(); }
  async drain() {
    if (this.draining || this.busy > 0) return; this.draining = true;
    while (this.queue.length && this.busy === 0) { const fn = this.queue.shift()!; this.busy++; try { await fn(); } finally { this.busy--; blockTaps(250); } }
    this.draining = false;
  }
  // 回傳 true＝整段對話跑完；false＝中途因為戰鬥失敗／逃跑而中斷
  async run(id: string, npcId?: string): Promise<boolean> {
    const d: Dialogue | undefined = DIALOGUES[id]; if (!d) { console.warn('no dialogue', id); return true; }
    this.busy++; let ok = true;
    try { await this.runLines(d); } catch (e) { if (e instanceof AbortDialogue) ok = false; else throw e; } finally { this.ui.dialogue.hide(); this.busy--; blockTaps(250); }
    if (npcId && ok) notify(this.s, 'talk', npcId);
    this.ui.refresh(); this.world?.refreshWorld?.();
    this.drain();
    return ok;
  }
  private meowOf(t: string) { const opts = ['喵？', '喵喵喵！', '喵——嗚？', '喵喵？喵！']; return opts[t.length % opts.length]; }
  private async runLines(d: Dialogue) {
    for (const ln of d) {
      if (ln.when && !check(this.s, ln.when)) continue;
      const options = ln.choices?.filter(c => !c.when || check(this.s, c.when));
      const choice = await this.showLine(ln, options);
      if (ln.act) for (const a of ln.act) await this.exec(a);
      const c = options?.[choice];
      if (!c) continue;
      if (c.brave) {
        const key = `brave_${c.braveId}`;
        if (this.s.flags[key]) continue;
        this.s.flags[key] = true;
        this.s.courage++;
        this.s.journal[c.chapter ?? chapterOf(this.s)].brave++;
        if (c.surprise) await this.showLine({ s: 'narr', t: c.surprise });
      }
      if (c.act) for (const a of c.act) await this.exec(a);
      if (c.next) { await this.runLines(DIALOGUES[c.next]); return; }
    }
  }
  private speaker(s: string) {
    if (s === 'hero') return { name: this.s.name, kind: 'hero' as const, portrait: 'hero_big', isCat: false };
    if (s === 'system') return { name: '喵喵勇者系統', kind: 'system' as const };
    if (s === 'narr') return { kind: 'narr' as const };
    const n = NPCS.find(n => n.id === s);
    if (n) return { name: this.s.flags.catSpeech || !n.isCat ? n.name : '？？？', kind: 'npc' as const, portrait: n.portrait, isCat: n.isCat, voice: n.voice, goblin: n.goblin, portraitH: n.portraitH };
    const e = ENEMIES[s]; if (e) return { name: e.name, kind: 'npc' as const, portrait: e.sprite, isEnemy: true };
    return { name: s, kind: 'npc' as const };
  }
  private async showLine(ln: Line, options?: Line['choices']) {
    const sp: any = this.speaker(ln.s);
    let text = this.fmt(ln.t);
    if (sp.isCat && !this.s.flags.catSpeech) text = ln.meow ?? this.meowOf(ln.t);
    else if (!text && ln.meow) text = ln.meow;
    // 聲音：每隻貓咪有自己的叫聲；系統是「叮」的貓叫；其他人是輕輕的嗶聲
    if (sp.kind === 'system') sfx.meow();
    else if (sp.isCat || sp.voice) sfx.voice(sp.voice);
    else if (sp.goblin) sfx.goblin();
    else if (sp.isEnemy) sfx.blob();
    else if (sp.kind === 'hero' || sp.kind === 'npc') sfx.talkBlip();
    return this.ui.dialogue.show({ name: sp.name, text, kind: sp.kind, portrait: sp.portrait, portraitH: sp.portraitH, think: ln.think, flashBow: ln.flashBow, glitch: ln.glitch, choices: options?.map(c => {
      const locked = (c.minCourage ?? 0) > this.s.courage;
      return { brave: c.brave, locked, label: locked ? `再勇敢一點就能做到！（勇氣值 ${c.minCourage}）` : c.label };
    }) });
  }
  // 新的一天（旅店休息、睡覺）：每天一次的小事件、送禮物重新開放；招財有機會限時特價；交換小攤換一批
  newDay() {
    const s = this.s; for (const k of Object.keys(s.flags)) if (k.startsWith('daily_') || k.startsWith('gift_t_')) delete s.flags[k];
    if (Math.random() < 0.4) s.flags.daily_sale = true;
    s.day = (s.day ?? 0) + 1;
  }
  bondUp(id: string, n = 1, level?: 4) {
    const s = this.s; const b = (s.bonds ??= {}); const before = b[id] ?? (s.members[id]?.joined ? 1 : 0);
    b[id] = Math.max(before, level ?? Math.min(MAX_BOND - 1, before + n));
    if (b[id] > before && MEMBERS[id]) this.ui.toast({ title: '羈絆提升了！', text: `${MEMBERS[id].name}的羈絆變成 ${'❤'.repeat(b[id])}${'♡'.repeat(Math.max(0, MAX_BOND - b[id]))}${b[id] === MAX_BOND ? '（最高了！）' : ''}` });
    refreshAvailability(s);
  }
  async exec(a: Action) {
    const s = this.s;
    switch (a.type) {
      case 'startQuest': startQuest(s, a.id); break;
      case 'quiz': this.ui.dialogue.hide(); await this.ui.quiz(a); break;
      case 'learn': { const k = (s.skills ??= {}); (k[a.id] ??= []).includes(a.skill) || k[a.id].push(a.skill); sfx.levelUp(); const sk = MEMBERS[a.id].skills.find(x => x.id === a.skill); await this.ui.reward('學會新技能了喵！', [`${this.memberName(a.id)}學會了「${sk?.name ?? a.skill}」`, sk?.desc ?? '']); break; }
      case 'equip': (s.acc ??= []).includes(a.id) || s.acc.push(a.id); break;
      case 'abort': throw new AbortDialogue();
      case 'swapIn': { // 讓某位夥伴上場（隊伍滿了就換下最後一位）
        if (!s.party.includes(a.id)) { if (s.party.length < 3) s.party.push(a.id); else s.party[s.party.length - 1] = a.id; }
        sfx.ok(); this.ui.toast({ title: '隊伍', text: `${MEMBERS[a.id].name}上場了！` }); this.world?.refreshWorld?.(); break;
      }
      case 'trade': this.ui.dialogue.hide(); await this.ui.trade(); break;
      case 'letter': {
        this.ui.dialogue.hide();
        const existing = s.letters.find(letter => letter.id === a.id);
        if (existing) await this.ui.readLetter(existing);
        else {
          const letter = await this.ui.writeLetter(a);
          if (!s.letters.some(saved => saved.id === a.id)) {
            s.letters.push(letter);
            this.ui.toast({ title: letter.mode === 'oral' ? '記好口信了' : '把信收進背包了', text: '' });
          }
        }
        break;
      }
      case 'letterReply': {
        const letter = s.letters.find(saved => saved.id === a.id);
        if (!letter) break;
        this.ui.dialogue.hide();
        const firstDelivery = !s.letters.some(saved => saved.reply !== undefined);
        letter.reply ??= a.message;
        if (firstDelivery) this.gainStat('friendship', 2, `幫${letter.from}把話帶給${letter.to}。`);
        await this.ui.readLetter(letter);
        break;
      }
      case 'travel': this.ui.dialogue.hide(); await this.ui.travel(); break;
      case 'stickerBoard': this.ui.dialogue.hide(); await this.ui.stickerBoard(); break;
      case 'bond': this.bondUp(a.id, a.n ?? 1, a.level); break;
      case 'newDay': this.newDay(); break;
      case 'innTalk': {
        // 旅店休息時的「營火對話」：從還沒聽過、隊伍裡的夥伴可以說的對話中隨機挑一段
        const ok = INN_TALKS.filter(t => !s.flags['heard_' + t.d] && check(s, t.when));
        if (!ok.length) break; const pick = ok[Math.floor(Math.random() * ok.length)];
        s.flags['heard_' + pick.d] = true; await this.runLines(DIALOGUES[pick.d]); break;
      }
      case 'obj': advance(s, a.quest, a.obj, a.n ?? 1); break;
      case 'item': s.inventory[a.id] = (s.inventory[a.id] ?? 0) + (a.n ?? 1); this.ui.toast({ title: '獲得', text: `${ITEMS[a.id].name} ×${a.n ?? 1}` }); break;
      case 'money': s.money += a.n; this.ui.toast({ title: '獲得', text: `${a.n} 魚乾幣` }); sfx.ok(); break;
      case 'buy':
        if (s.money >= a.price) { s.money -= a.price; s.inventory[a.id] = (s.inventory[a.id] ?? 0) + 1; sfx.ok(); this.ui.toast({ title: '買到了', text: `${ITEMS[a.id].name}（剩 ${s.money} 魚乾幣）` }); }
        else this.ui.toast({ title: '魚乾幣不夠', text: `需要 ${a.price} 魚乾幣` });
        break;
      case 'flag': s.flags[a.id] = a.value ?? true; break;
      case 'stat':
        if ('key' in a) this.gainStat(a.key, a.n, a.event);
        else {
          if (a.courage) s.courage = Math.max(0, s.courage + a.courage);
          if (a.observation) s.observation += a.observation;
          if (a.kindness) this.addKindness(a.kindness);
        }
        break;
      case 'exp': addExp(s, a.n).forEach(u => bus.emit('levelUp', u)); break;
      case 'sticker': if (!s.stickers.includes(a.id)) { s.stickers.push(a.id); this.ui.toast({ title: '新貼紙', text: STICKERS[a.id] ?? a.id }); } break;
      case 'systemActivate':
        await this.ui.activateSystem();
        s.flags.system = true; s.flags.catSpeech = true; s.weapon = 'wooden_sword';
        break;
      case 'openPanel': {
        this.ui.dialogue.hide();
        await this.ui.openPanel(a.tab);
        if (a.thenObj) advance(s, a.thenObj[0], a.thenObj[1]);
        break;
      }
      case 'rest': healAll(s); sfx.heal(); this.ui.toast({ title: '休息', text: 'HP 和 MP 都回復了！' }); break;
      case 'save': this.save(); break;
      case 'nextMorning': {
        this.ui.dialogue.hide();
        await this.ui.fade('隔天早上……');
        s.time = 'day'; s.weather = 'clear'; healAll(s); this.world?.placePlayer('village', 208, 446, 0);
        await new Promise(r => setTimeout(r, 700));
        await this.ui.unfade();
        break;
      }
      case 'battle': if (this.battleHook) { this.ui.dialogue.hide(); const r = await this.battleHook(a.encounter, true); if (r === 'lose' || r === 'escape') throw new AbortDialogue(); } break;
      case 'warp': { this.ui.dialogue.hide(); await this.ui.fade(); this.world?.placePlayer(a.map, a.x, a.y, a.dir ?? 0); await new Promise(r => setTimeout(r, 500)); await this.ui.unfade(); break; }
      case 'time': s.time = a.v; if (a.v === 'night') s.weather = 'clear'; this.world?.refreshWorld?.(); break;
      case 'sleep': {
        // 在旅店睡一覺：白天睡到晚上、晚上睡到隔天早上（HP/MP 全滿並存檔）。早上有機會下雨（只影響小事件和貼紙）
        this.ui.dialogue.hide();
        await this.ui.fade(a.to === 'night' ? '睡了一個長長的午覺……天黑了。' : '呼嚕呼嚕……隔天早上。');
        s.time = a.to; healAll(s); sfx.heal(); if (a.to === 'day') this.newDay();
        s.weather = a.to === 'day' && s.quests.main6?.status === 'done' && Math.random() < 0.35 ? 'rain' : 'clear';
        this.world?.refreshWorld?.(); this.save();
        await new Promise(r => setTimeout(r, 600));
        await this.ui.unfade();
        this.ui.toast({ title: a.to === 'night' ? '晚上了' : (s.weather === 'rain' ? '下雨了' : '早安'), text: a.to === 'night' ? '晚上會有不一樣的事情發生喔。已經存檔了。' : (s.weather === 'rain' ? '外面在下雨，貓咪們都在躲雨。已經存檔了。' : 'HP 和 MP 都回復了！已經存檔了。') });
        break;
      }
      case 'recruit': {
        this.recruit(a.id);
        sfx.newFriend(); await this.ui.reward(`${MEMBERS[a.id].name}加入隊伍了喵！`, [`${MEMBERS[a.id].name}（${MEMBERS[a.id].role}）`, s.party.includes(a.id) ? '已經在隊伍裡，會跟著妳走' : '隊伍滿了，在「隊伍」頁可以換人']);
        break;
      }
      case 'guest': if (a.id) { this.ensureMember(a.id); } s.guest = a.id; this.world?.refreshWorld?.(); break;
      case 'title': (s.titles ??= []).includes(a.id) || s.titles!.push(a.id); this.ui.toast({ title: '獲得稱號', text: `「${a.id}」` }); break;
      case 'music': music.play(a.id as any); break;
      case 'chapterEnd':
        this.ui.dialogue.hide();
        if (a.chapter) {
          if (a.chapter === 3) s.chapter3Done = true;
          else s.chapter2Done = true;
          this.save();
          await this.ui.chapterEnd(a.chapter);
          await this.ui.openPanel('journal' + a.chapter);
        } else {
          s.chapterDone = true;
          await this.ui.chapterEnd();
          await this.ui.openPanel('journal1');
        }
        break;
      case 'c2Breeze': await this.world?.blowSeed(); break;
      case 'take': s.inventory[a.id] = Math.max(0, (s.inventory[a.id] ?? 0) - (a.n ?? 1)); break;
      case 'shop': this.ui.dialogue.hide(); await this.ui.shop(a.items.filter(item => check(s, item.when)), a.title); break;
      case 'party': this.ui.dialogue.hide(); await this.ui.openPanel('party'); break;
      case 'wait': await new Promise(r => setTimeout(r, a.ms)); break;
      case 'fog': this.world?.fogBurst?.(a.x, a.y, a.n ?? 8); break;
      case 'shake': this.world?.cameras?.main?.shake(a.ms ?? 500, 0.01); break;
      case 'stage': this.world?.stage(a.playerLift, a.at); break;
      case 'walkOff': await this.world?.walkOff(a.npc, a.x, a.y, a.ms, a.ride, a.passenger); break;
      case 'dim': this.world?.moonDim?.(); break;
      case 'sfx': (sfx as any)[a.id]?.(); break;
    }
    this.checkKindEvents();
    this.ui.refresh();
  }
  // 「自動完成」的目標：條件一成立就打勾（例如：找到至少一位夥伴）
  private autoBusy = false;
  checkAuto() {
    if (this.autoBusy) return; this.autoBusy = true;
    try {
      for (const [qid, qs] of Object.entries(this.s.quests)) {
        if (qs.status !== 'active') continue; const def = QUESTS[qid];
        const objs = def.ordered ? [currentObjective(this.s, qid)].filter(Boolean) as typeof def.objectives : def.objectives;
        for (const o of objs) if (o.auto && (qs.prog[o.id] ?? 0) < (o.count ?? 1) && check(this.s, o.auto)) advance(this.s, qid, o.id, o.count ?? 1);
      }
    } finally { this.autoBusy = false; }
  }
  gainStat(key: ChapterStat, n: number, event?: string) {
    const first = this.s[key] === 0;
    if (!addStat(this.s, key, n, event)) return;
    const stat = CHAPTER_STATS[key];
    this.ui.toast({ title: `${stat.label} +${n}`, text: first ? stat.first : '' });
    this.ui.refresh();
  }
  addKindness(n: number) {
    if (!Number.isFinite(n) || n <= 0) return;
    const first = this.s.kindness === 0 && !this.s.flags.kindness_explained;
    this.s.flags.kindness_explained = true;
    this.s.kindness += n;
    if (this.s.quests.c2m1?.status === 'active' || this.s.quests.c2m1?.status === 'done') this.s.kindCh2 += n;
    this.s.journal[chapterOf(this.s)].helps++;
    this.ui.toast({
      title: `💗 善良值 +${n}`,
      text: first ? '做溫柔的事，善良值就會變多喵！善良值越高，魔物越願意聽妳說話。' : '',
    });
    this.ui.refresh();
  }
  recruit(id: string) {
    this.ensureMember(id);
    const s = this.s;
    s.members[id].joined = true;
    const bonds = s.bonds ??= {};
    bonds[id] = Math.max(1, bonds[id] ?? 0);
    if (s.guest === id) s.guest = null;
    if (!s.party.includes(id) && s.party.length < 3) s.party.push(id);
    refreshAvailability(s);
  }
  ensureMember(id: string) {
    const s = this.s; if (s.members[id]) return;
    const lv = id === 'mizhou' ? s.members.hero.lv : Math.max(1, s.members.hero.lv - 1);
    s.members[id] = { id, lv, exp: 0, hp: 1, mp: 1 };
    const st = memberStats(s, id); s.members[id].hp = st.maxHp; s.members[id].mp = st.maxMp;
  }
  save() {
    if (this.world) { const p = this.world.playerPos(); Object.assign(this.s, p); }
    const ok = saveGame(this.s);
    this.ui.toast({ title: ok ? '存檔完成' : '存檔失敗', text: ok ? '冒險紀錄已經記住了喵！' : '瀏覽器不允許存檔' });
  }
  questTitle(id: string) { const q = QUESTS[id]; return `${questChapterPrefix(q.chapter)}${q.kind === 'main' ? '主線' : '支線'} ${q.no}：${q.title}`; }
  check = (c: any) => check(this.s, c);
}
export const G = new GameController();
(window as any).__mcvG = G;
