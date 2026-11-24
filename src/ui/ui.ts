import { chapterOf, CHAPTER_STATS, HERO_TITLES, heroTier, heroTitle, TITLE_GIFTS, visibleStats } from '../core/hearts';
import { G, type UIHooks } from '../core/game';
import { availableSkills, memberStats, hasSave, loadGame, bondOf, equipBetterWeapon } from '../core/state';
import { expToNext, MAX_BOND, MEMBERS } from '../data/characters';
import { QUESTS } from '../data/quests';
import { ITEMS, STICKERS, stickerPictures } from '../data/items';
import { currentObjective, questChapterPrefix } from '../core/quests';
import { sfx, settings, saveSettings } from '../core/sfx';
import { music } from '../core/music';
import { NPCS } from '../data/npcs';
import { objDone } from '../core/conditions';

declare const __FINALE_FALLBACKS__: Record<string, string>;
export const A = (k: string) => { let f = `${k}.${['prologue1', 'prologue2', 'prologue3', 'battlebg', 'forestbg', 'mistbg', 'echobg', 'denbg', 'reedbg', 'bridgebg', 'c2_ending', 'c3_ending', 'title'].includes(k) ? 'jpg' : 'png'}`; f = __FINALE_FALLBACKS__[f] ?? f; return ((window as any).__MCV_ASSETS?.[f] as string) ?? `./assets/${f}`; };
import { quizPanel } from './quiz';
import { readLetter, showLetterList, writeLetter } from './letters';
import { boostedHealing } from '../core/battle';
import { STICKER_PAGES, bookCount, bookTotal, bookPages, chapter1Collection, chapter2MonsterStickers, chapter3MonsterStickers } from '../data/items';
import { ENEMIES } from '../data/enemies';
import { MAPS } from '../data/maps';
import { LANTERNS, TRADES } from '../data/ch1c';
export function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', html = '', parent?: HTMLElement) {
  const e = document.createElement(tag); if (cls) e.className = cls; if (html) e.innerHTML = html; if (parent) parent.appendChild(e); return e;
}
export const root = () => document.getElementById('ui')!;
const wait = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

// ---------- HUD ----------
export class Hud {
  top = el('div', 'hud-top'); tracker = el('div', 'tracker hidden'); joy = el('div', 'joy'); knob = el('div', 'knob', '🐾');
  act = el('button', 'act-btn dim', '對話'); sysBtn = el('button', 'sys-btn hidden', '🐾'); mapName = el('div', 'map-name');
  info = el('div', 'hud-card'); money = el('div', 'hud-card hud-money');
  joyVec = { x: 0, y: 0 }; joyActive = false;
  onAct: () => void = () => {}; onSys: () => void = () => {}; onQuests: () => void = () => {};
  constructor() {
    const r = root();
    this.top.append(this.info, this.money, this.sysBtn, this.tracker);
    r.append(this.top, this.mapName, this.joy, this.act);
    this.joy.appendChild(this.knob);
    this.act.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); this.onAct(); });
    this.sysBtn.addEventListener('click', e => { e.stopPropagation(); this.onSys(); });
    // 點左上角的任務提示，直接打開任務日誌
    this.tracker.addEventListener('click', e => { e.stopPropagation(); if (G.s.flags.system) this.onQuests(); });
    let pid = -1;
    const upd = (e: PointerEvent) => {
      const b = this.joy.getBoundingClientRect(); const cx = b.left + b.width / 2, cy = b.top + b.height / 2;
      let dx = e.clientX - cx, dy = e.clientY - cy; const m = Math.hypot(dx, dy), R = b.width / 2 - 10;
      if (m > R) { dx *= R / m; dy *= R / m; }
      this.knob.style.transform = `translate(${dx}px,${dy}px)`;
      const n = Math.min(1, m / R); const ang = Math.atan2(dy, dx);
      const DZ = 0.25; const k = n < DZ ? 0 : Math.min(1, (n - DZ) / (1 - DZ) * 1.25); // 中間的死區大一點，手指小抖動不會亂走
      this.joyVec = k === 0 ? { x: 0, y: 0 } : { x: Math.cos(ang) * k, y: Math.sin(ang) * k };
    };
    this.joy.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); pid = e.pointerId; this.joy.setPointerCapture(pid); this.joyActive = true; sfx.unlock(); upd(e); });
    this.joy.addEventListener('pointermove', e => { if (e.pointerId === pid) upd(e); });
    const end = (e: PointerEvent) => { if (e.pointerId !== pid) return; pid = -1; this.joyActive = false; this.joyVec = { x: 0, y: 0 }; this.knob.style.transform = ''; };
    this.joy.addEventListener('pointerup', end); this.joy.addEventListener('pointercancel', end);
  }
  setVisible(v: boolean) { [this.top, this.tracker, this.joy, this.act].forEach(e => e.style.visibility = v ? '' : 'hidden'); }
  setAction(label: string | null) { this.act.textContent = label ?? '對話'; this.act.classList.toggle('dim', !label); }
  showMapName(n: string) { this.mapName.textContent = n; this.mapName.classList.add('show'); setTimeout(() => this.mapName.classList.remove('show'), 1600); }
  refresh() {
    const s = G.s; const st = memberStats(s, 'hero'); const m = s.members.hero;
    const extraStats = visibleStats(s).map(key => `<span>${CHAPTER_STATS[key].label} ${s[key]}</span>`).join('');
    this.info.innerHTML = `<div class="hud-name">${s.name}<small>Lv ${m.lv}・${heroTitle(s.courage)}</small></div><div class="bar"><i style="width:${(m.hp / st.maxHp) * 100}%"></i></div><div style="font-size:11px">HP ${m.hp}/${st.maxHp}</div><div class="hud-values"><span>🦁 勇氣值 ${s.courage}</span><span>💗 善良值 ${s.kindness}</span>${extraStats}</div>`;
    this.money.innerHTML = `🐟 ${s.money}`;
    this.sysBtn.classList.toggle('hidden', !s.flags.system);
    const q = s.tracked && s.quests[s.tracked]?.status === 'active' ? s.tracked : undefined;
    if (q) {
      const o = currentObjective(s, q); const def = QUESTS[q];
      const objs = def.ordered ? (o ? [o] : []) : def.objectives.filter(x => !objDone(s, q, x.id));
      const lines = objs.map(x => `・${x.text}${x.count && x.count > 1 ? `（${s.quests[q].prog[x.id] ?? 0}/${x.count}）` : ''}`).join('<br>');
      this.tracker.innerHTML = `<b>${G.questTitle(q)}</b>${lines}`;
      this.tracker.classList.remove('hidden');
    } else this.tracker.classList.add('hidden');
  }
}

// ---------- 對話框 ----------
export class DialogueBox {
  wrap = el('div', 'dlg hidden'); box = el('div', 'dlg-box'); nameEl = el('div', 'dlg-name'); textEl = el('div', 'dlg-text'); next = el('div', 'dlg-next', '▼'); pic = el('img', 'dlg-portrait') as HTMLImageElement; ch = el('div', 'choices');
  constructor() { this.wrap.append(this.pic, this.box); this.box.append(this.nameEl, this.textEl, this.ch, this.next); root().appendChild(this.wrap); }
  show(o: { name?: string; text: string; kind: string; portrait?: string; portraitH?: number; think?: boolean; flashBow?: boolean; glitch?: boolean; choices?: { label: string; brave?: true; locked?: boolean }[] }): Promise<number> {
    return new Promise(res => {
      this.wrap.className = 'dlg ' + (o.kind === 'system' ? 'sys' : o.kind === 'narr' ? 'narr' : '');
      this.wrap.classList.toggle('bow-flash', !!o.flashBow);
      this.wrap.classList.toggle('signal-glitch', !!o.glitch);
      this.nameEl.textContent = o.name ?? ''; this.nameEl.style.display = o.name ? '' : 'none';
      if (o.portrait) { this.pic.src = A(o.portrait); this.pic.style.display = ''; this.pic.className = 'dlg-portrait' + (o.kind === 'hero' ? ' left' : ''); this.pic.style.height = o.portraitH ? o.portraitH + 'px' : o.portrait.startsWith('slime') ? '90px' : o.portrait.startsWith('whitecat') || o.portrait.startsWith('douhua') ? '110px' : '150px'; }
      else this.pic.style.display = 'none';
      this.ch.innerHTML = ''; this.next.style.display = 'none';
      const full = o.text; let i = 0; let done = false;
      this.textEl.className = 'dlg-text' + (o.think ? ' think' : '');
      const finish = () => {
        done = true; this.textEl.textContent = full;
        if (o.choices?.length) {
          o.choices.forEach((c, k) => { const b = el('button', c.locked ? 'brave locked' : c.brave ? 'brave' : '', (c.brave ? '🦁 ' : '') + c.label, this.ch);
            b.onclick = (e) => {
              e.stopPropagation();
              if (c.locked) { this.textEl.textContent = '🦁 ' + c.label; return; }
              sfx.ok(); cleanup(); res(k);
            }; });
        } else this.next.style.display = '';
      };
      const timer = setInterval(() => { if (done) return; i += 2; this.textEl.textContent = full.slice(0, i); if (i >= full.length) { clearInterval(timer); finish(); } }, 28);
      const onTap = (e: Event) => { e.preventDefault(); e.stopPropagation(); if (!done) { clearInterval(timer); finish(); return; } if (o.choices?.length) return; cleanup(); res(-1); };
      const onKey = (e: KeyboardEvent) => { if (e.key === ' ' || e.key === 'Enter') onTap(e); };
      const cleanup = () => { clearInterval(timer); this.wrap.removeEventListener('pointerdown', onTap); window.removeEventListener('keydown', onKey); };
      this.wrap.classList.remove('hidden');
      setTimeout(() => { this.wrap.addEventListener('pointerdown', onTap); window.addEventListener('keydown', onKey); }, 120);
    });
  }
  hide() { this.wrap.classList.add('hidden'); }
}

// ---------- 喵喵勇者系統面板 ----------
export function openSystemPanel(tab = 'status'): Promise<void> {
  let journalChapter = tab === 'journal1' ? 1 : tab === 'journal2' ? 2 : tab === 'journal3' ? 3 : Math.min(3, chapterOf(G.s));
  if (tab.startsWith('journal')) tab = 'journal';
  return new Promise(res => {
    const wrap = el('div', 'sys-wrap', '', root()); const p = el('div', 'sys-panel', '', wrap);
    const head = el('div', 'sys-head', '🐾 喵喵勇者系統', p); const x = el('button', 'x', '✕', head);
    const tabs = el('div', 'sys-tabs', '', p); const body = el('div', 'sys-body', '', p);
    const hasParty = Object.values(G.s.members).some(m => m.joined) || !!G.s.guest;
    const hasLetters = G.s.letters.length > 0;
    const hasSeedpot = G.s.inventory.c3_seedpot > 0;
    const names: [string, string][] = [['status', '屬性'], ...(hasParty || tab === 'party' ? [['party', '隊伍'] as [string, string]] : []), ['quests', '任務'], ['items', hasLetters || hasSeedpot ? '背包' : '道具'], ...(G.s.inventory.sticker_book ? [['stickers', '貼紙'] as [string, string]] : []), ['journal', '勇士日記'], ['settings', '設定']];
    let qtab: 'main' | 'side' = 'main'; let spage = 0;
    const tutorial = tab === 'status' && !G.s.flags.tut_status ? 'status' : tab === 'quests' && !G.s.flags.tut_quests ? 'quests' : '';
    const render = (t: string) => {
      tab = t; tabs.innerHTML = '';
      names.forEach(([k, n]) => { const b = el('button', k === (t === 'letters' || t === 'important' ? 'items' : t) ? 'on' : '', n, tabs); b.onclick = () => { sfx.blip(); render(k); }; });
      const s = G.s; const st = memberStats(s, 'hero'); const m = s.members.hero;
      if (t === 'status') {
        body.innerHTML = `${tutorial === 'status' ? '<div class="tut">喵！這是妳的屬性頁。<br>・<b>勇氣值</b>越高，「對話」越容易讓魔物離開。<br>・<b>觀察力</b>越高，地圖上能看到越多「閃光點」。<br>兩個屬性都靠完成任務和事件提升喵！</div>' : ''}
        <div class="who"><img src="${A('hero_big')}"><div><div style="font-size:20px">${s.name}</div><div>Lv ${m.lv}・${heroTitle(s.courage)}</div><div style="font-size:13px">EXP ${m.exp} / ${expToNext(m.lv)}</div>
        <div><span class="tagline">能力：聽懂貓語</span></div></div></div>
        <div class="stat-grid">
        <div class="stat"><span>HP</span><b>${m.hp} / ${st.maxHp}</b></div><div class="stat"><span>MP</span><b>${m.mp} / ${st.maxMp}</b></div>
        <div class="stat"><span>攻擊</span><b>${st.atk}</b></div><div class="stat"><span>防禦</span><b>${st.def}</b></div>
        <div class="stat"><span>速度</span><b>${st.spd}</b></div><div class="stat"><span>魚乾幣</span><b>${s.money}</b></div>
        <div class="stat hl"><span>🦁 勇氣值</span><b>${s.courage}</b></div><div class="stat hl"><span>💗 善良值</span><b>${s.kindness}</b></div><div class="stat hl"><span>🔍 觀察力</span><b>${s.observation}</b></div>
        ${visibleStats(s).map(key => `<div class="stat hl"><span>${CHAPTER_STATS[key].label}</span><b>${s[key]}</b></div>`).join('')}
        </div>
        <small>稱號越高，魔物越願意聽妳說話</small><br>
        <small>${s.observation >= 5 ? '看得到魔物的心情和弱點' : s.observation >= 3 ? '看得到魔物的心情' : '在地圖上找閃光點'}${s.observation >= 4 ? '。答錯時有額外提示' : ''}</small>
        <div style="margin-top:10px">技能：${MEMBERS.hero.skills.filter(k => !k.quest || s.skills?.hero?.includes(k.id)).map(k => `<span class="tagline">${k.name}（MP ${k.mp}）</span>`).join('')}</div>
        <div>裝備：<span class="tagline">${s.weapon ? ITEMS[s.weapon].name : '（無）'}</span></div>
        ${s.titles?.length ? `<div>稱號：${s.titles.map(t => `<span class="tagline">${t}</span>`).join('')}</div>` : ''}
        <div>隊伍：${[0, 1, 2].map(i => s.party[i] ? `<span class="tagline">${G.memberName(s.party[i])}</span>` : '<span class="tagline" style="opacity:.6">空位</span>').join('')}（最多 3 人上場）</div>
        <div id="outfits"></div>
        <div class="sys-foot"><button id="btn-save">💾 存檔</button></div>`;
        body.querySelector('#btn-save')!.addEventListener('click', () => { G.save(); });
        // 外觀服裝（貼紙獎勵，只改外觀、不影響數值）
        const ow = body.querySelector('#outfits') as HTMLElement; const has = (k: string) => (s.inventory[k] ?? 0) > 0;
        const parts = new Set((s.outfit ?? '').split('_').filter(Boolean));
        const opts: [string, string, boolean][] = [['ears', '貓耳髮箍', has('cat_ears')], ['coat', '月光雨衣', has('raincoat')]];
        if (opts.some(o => o[2]) || s.flags.party_outfit) {
          ow.innerHTML = '<div style="margin-top:10px">服裝（只改外觀）：</div>'; const row = el('div', 'outfit-row', '', ow);
          for (const [k, n, ok] of opts) if (ok) { const b = el('button', parts.has(k) ? 'on' : '', (parts.has(k) ? '✓ ' : '') + n, row); b.onclick = () => { if (parts.has(k)) parts.delete(k); else parts.add(k); s.outfit = ['coat', 'ears'].filter(x => parts.has(x)).join('_') || undefined; sfx.ok(); G.world?.refreshWorld?.(); render('status'); }; }
          if (s.flags.party_outfit) { const b = el('button', s.feast ? 'on' : '', (s.feast ? '✓ ' : '') + '夥伴月光宴會裝', row); b.onclick = () => { s.feast = !s.feast; sfx.ok(); G.world?.refreshWorld?.(); render('status'); }; }
        }
      } else if (t === 'quests') {
        const list = Object.entries(s.quests).filter(([k, v]) => QUESTS[k].kind === qtab && v.status !== 'available' && k !== 'main1').sort((a, b) => (a[1].status === 'done' ? 1 : 0) - (b[1].status === 'done' ? 1 : 0) || (QUESTS[b[0]].chapter ?? 1) - (QUESTS[a[0]].chapter ?? 1) || QUESTS[a[0]].no - QUESTS[b[0]].no);
        body.innerHTML = `${tutorial === 'quests' ? '<div class="tut">喵！這是任務日誌。上面可以切換「主線」和「支線」。按「追蹤」，目標就會顯示在畫面左上角喵！</div>' : ''}`;
        const sub = el('div', 'sub-tabs', '', body);
        (['main', 'side'] as const).forEach(k => { const b = el('button', k === qtab ? 'on' : '', k === 'main' ? '主線' : '支線', sub); b.onclick = () => { qtab = k; sfx.blip(); render('quests'); }; });
        if (qtab === 'main' && s.quests.c3m1?.status === 'available') {
          el('p', 'tut', '第三章　橋的另一頭：去大樹根村的大樹下找咕咕。', body);
        }
        if (!list.length) el('div', 'empty', qtab === 'side' ? '還沒有接到支線任務。<br>頭上有「！」的村民可能需要幫忙喵。' : '沒有任務', body);
        for (const [k, v] of list) {
          const d = QUESTS[k]; const done = v.status === 'done';
          const it = el('div', 'q-item' + (s.tracked === k ? ' tracked' : '') + (done ? ' done-q' : ''), '', body);
          const h = el('h4', '', `${done ? '✅' : d.kind === 'main' ? '⭐' : '🐾'} ${questChapterPrefix(d.chapter)}${d.no}. ${d.title}${d.bond ? ' <span class="tagline">羈絆</span>' : ''}`, it);
          if (!done) { const tb = el('button', 'trk', s.tracked === k ? '追蹤中' : '追蹤', h); tb.onclick = () => { s.tracked = k; sfx.ok(); G.ui.refresh(); render('quests'); }; }
          el('p', '', d.summary + (d.autoStartAfter && s.quests[d.autoStartAfter]?.status === 'done' ? '（主線需要）' : '') + (d.giver ? `（請妳幫忙的是：${NPCS.find(n => n.id === d.giver)?.name ?? d.giver}）` : ''), it);
          if (d.chapter === 3 && d.kind === 'side') {
            const { exp, money, items, sticker } = d.rewards;
            const gifts = [
              exp && `經驗 +${exp}`, money && `魚乾幣 +${money}`,
              ...(items ?? []).map(it => `${ITEMS[it.id].name} ×${it.n}`),
              sticker && `「${STICKERS[sticker]}」貼紙`, ...(d.rewardText ?? []),
            ].filter(Boolean);
            el('p', '', '任務獎勵：' + gifts.join('、'), it);
          }
          const ul = el('ul', '', '', it); const cur = currentObjective(s, k);
          d.objectives.forEach(o => { const od = objDone(s, k, o.id); if (d.ordered && !od && cur && o.id !== cur.id) return; el('li', od ? 'done' : '', `${od ? '☑' : '☐'} ${o.text}${o.count && o.count > 1 ? `（${v.prog[o.id] ?? 0}/${o.count}）` : ''}`, ul); });
        }
      } else if (t === 'party') {
        body.innerHTML = `${!s.flags.tut_party ? '<div class="tut">喵！這是「隊伍」頁。<br>・最多 <b>3 個人</b>一起上場戰鬥。<br>・按「上場／休息」可以換人，按「↑」可以換順序。<br>・沒上場的夥伴，打完仗也會拿到<b>一半</b>的 EXP。<br>・戰鬥中也可以用「換人」喔！</div>' : ''}`;
        s.flags.tut_party = true;
        const ids = ['hero', ...s.party.filter(i => i !== 'hero'), ...Object.values(s.members).filter(mm => mm.joined && !s.party.includes(mm.id)).map(mm => mm.id)];
        if (s.guest && !ids.includes(s.guest)) ids.push(s.guest);
        for (const id of ids) {
          const mm = s.members[id]; const d = MEMBERS[id]; const ms = memberStats(s, id); const on = s.party.includes(id); const guest = s.guest === id;
          const row = el('div', 'mem-row' + (on || guest ? ' on' : ''), `<img src="${A(d.icon)}"><div class="mi"><b>${G.memberName(id)}</b> Lv${mm.lv}${guest ? ' <span class="tagline">同行中</span>' : ''}${id !== 'hero' && mm.joined ? ` <span class="bond" title="羈絆">${'❤'.repeat(bondOf(s, id))}${'♡'.repeat(Math.max(0, MAX_BOND - bondOf(s, id)))}</span>` : ''}<small>${id === 'hero' ? heroTitle(s.courage) : d.role}</small><small>HP ${mm.hp}/${ms.maxHp}・MP ${mm.mp}/${ms.maxMp}・攻 ${ms.atk}・防 ${ms.def}・速 ${ms.spd}</small><small>技能：${availableSkills(s, id).map(k => `${k.name}（${k.desc}）`).join('、')}</small></div>`, body);
          const btns = el('div', 'mb', '', row);
          if (id !== 'hero' && !guest) {
            const b = el('button', on ? 'on' : '', on ? '上場中' : '休息中', btns);
            b.onclick = () => { if (on) s.party = s.party.filter(i => i !== id); else { if (s.party.length >= 3) { toast({ title: '隊伍滿了', text: '最多 3 個人上場，先讓一位休息喵' }); return; } s.party.push(id); } sfx.ok(); G.world?.refreshWorld?.(); render('party'); };
            if (on && s.party.indexOf(id) > 1) { const u = el('button', '', '↑', btns); u.onclick = () => { const i = s.party.indexOf(id); [s.party[i - 1], s.party[i]] = [s.party[i], s.party[i - 1]]; sfx.blip(); G.world?.refreshWorld?.(); render('party'); }; }
          } else el('span', 'lead', id === 'hero' ? '隊長' : '暫時同行', btns);
        }
      } else if (t === 'journal') {
        body.innerHTML = '';
        const nav = el('div', 'sub-tabs', '', body);
        for (const [n, label] of [[1, '第一章'], [2, '第二章'], [3, '第三章']] as const) {
          if (n === 2 && !s.quests.c2m1) continue;
          if (n === 3 && !visibleStats(s).includes('friendship')) continue;
          const b = el('button', n === journalChapter ? 'on' : '', label, nav);
          b.onclick = () => { journalChapter = n; render('journal'); };
        }
        const j = s.journal[journalChapter];
        const lines: [number, string, string][] = [
          [j.brave, `這一章，${s.name}鼓起勇氣 ${j.brave} 次 🦁`, '妳害怕的時候，還是往前走了。'],
          [j.secrets, `發現了 ${j.secrets} 個祕密 🔍`, '妳看見了小小的線索。真細心！'],
          [j.helps, `幫助了 ${j.helps} 次 💗`, '妳讓大家的心暖暖的。'],
          [j.friends, `和魔物交了 ${j.friends} 次朋友`, '謝謝妳願意聽魔物說話。'],
        ];
        const praise = lines.reduce((best, line) => line[0] > best[0] ? line : best);
        const page = el('div', 'journal-page', `${badge(heroTier(s.courage))}<h3>${heroTitle(s.courage)}</h3>
          <p>🦁 ${s.courage}　🔍 ${s.observation}　💗 ${s.kindness}</p>
          ${lines.filter(([n]) => n).map(([, line]) => `<p>${line}</p>`).join('')}
          <p>${praise[0] ? praise[2] : '今天也踏出了一小步。'}</p>`, body);
        if (journalChapter === 3) {
          page.classList.add('river-journal');
          const memories = el('section');
          el('h3', '', '橋的另一頭', memories);
          el('p', '', `這一章拿到的友誼值 🤝 ${j.friendship}`, memories);
          const events = el('ul', '', '', memories);
          for (const event of j.friendshipEvents) el('li', '', '', events).textContent = event;
          page.prepend(memories);
        }
      } else if (t === 'stickers') {
        body.innerHTML = `<div class="sb-head">📒 喵喵貼紙簿：<b>${bookCount(s.stickers)}</b> / ${bookTotal()} 張</div>`;
        const sub = el('div', 'sub-tabs', '', body);
        const PAGES = [...bookPages(), { id: 'forest_friends', name: '森林朋友', ids: Object.keys(s.befriended).filter(id => ENEMIES[id]) }]; if (spage >= PAGES.length) spage = 0;
        PAGES.forEach((pg, k) => { const n = pg.ids.filter(i => s.stickers.includes(i)).length; const b = el('button', k === spage ? 'on' : '', `${pg.name}${pg.id === 'forest_friends' ? '' : `<small> ${n}/${pg.ids.length}</small>`}`, sub); b.onclick = () => { spage = k; sfx.blip(); render('stickers'); }; });
        const grid = el('div', 'sb-grid', '', body); const pg = PAGES[spage];
        if (pg.id === 'forest_friends') {
          pg.ids.forEach(id => el('div', 'sb-st have', `<img src="${A(ENEMIES[id].sprite)}" alt=""><small>${ENEMIES[id].name} ×${s.befriended[id]}</small>`, grid));
          return;
        }
        pg.ids.forEach((id, k) => {
          const have = s.stickers.includes(id);
          const cell = el('div', 'sb-st' + (have ? ' have ' + pg.id : ''), '', grid);
          if (have && stickerPictures[id]) {
            const img = el('img', '', '', cell);
            img.src = A(stickerPictures[id]);
            img.alt = '';
          } else {
            const icons = STICKER_ICON[pg.id] ?? ['⭐'];
            el('span', '', have ? icons[k % icons.length] : '？', cell);
          }
          el('small', '', have ? STICKERS[id] : '還沒拿到', cell);
        });
        el('div', 'sb-tip', '集滿 10、20、30、40、50 張，或是集滿第一章的貼紙，可以去長老家領獎勵喵！貼紙會越來越多喔。', body);
        if (pg.id === 'monster' && (chapter1Collection.monsters ?? STICKER_PAGES.find(c => c.id === 'monster')?.ids ?? []).every(i => s.stickers.includes(i))) { const b = el('button', 'qz-next', '📖 打開魔物圖鑑', body); b.onclick = () => { sfx.blip(); bestiary(body); }; }
      } else if (t === 'settings') {
        body.innerHTML = '';
        soundSettings(body);
      } else {
        body.replaceChildren();
        if (hasLetters || hasSeedpot) {
          const sections = el('div', 'sub-tabs', '', body);
          const groups = [['items', '道具']];
          if (hasSeedpot) groups.push(['important', '重要物品']);
          if (hasLetters) groups.push(['letters', '信']);
          for (const [id, label] of groups) {
            el('button', t === id ? 'on' : '', label, sections).onclick = () => { sfx.blip(); render(id); };
          }
          if (t === 'letters') { showLetterList(body, s.letters); return; }
        }
        const inv = Object.entries(s.inventory).filter(([id, n]) =>
          n > 0 && (!hasSeedpot || (ITEMS[id].kind === 'key') === (t === 'important')));
        if (t === 'important') inv.sort(([a], [b]) => Number(b === 'c3_seedpot') - Number(a === 'c3_seedpot'));
        if (!inv.length) el('div', 'empty', '還沒有道具。', body);
        for (const [id, n] of inv) {
          const d = ITEMS[id]; const row = el('div', 'inv-row', `<div><b>${d.name}</b> ×${n}<small>${d.desc}</small></div>`, body);
          if (id === 'c3_seedpot') {
            const icon = el('img', 'seedpot-icon');
            icon.src = A(id); icon.alt = '';
            row.prepend(icon);
          }
          if (d.kind === 'heal') { const b = el('button', '', '使用', row); b.onclick = () => {
            const ids = [...s.party, ...(s.guest ? [s.guest] : [])]; const pick = ids.map(i => ({ i, r: s.members[i].hp / memberStats(s, i).maxHp })).sort((a, b) => a.r - b.r)[0];
            if (!pick || pick.r >= 1) { G.ui.toast({ title: '不需要', text: '大家的 HP 都是滿的' }); return; }
            const amount = boostedHealing(d.heal ?? 0, s.love);
            if (d.healAll) { for (const i of ids) { const st2 = memberStats(s, i); s.members[i].hp = Math.min(st2.maxHp, s.members[i].hp + amount); } s.inventory[id]--; sfx.heal(); toast({ title: '回復', text: `全隊 HP +${amount}` }); G.ui.refresh(); render('items'); return; }
            const mm = s.members[pick.i]; const st = memberStats(s, pick.i); const before = mm.hp; mm.hp = Math.min(st.maxHp, mm.hp + amount); s.inventory[id]--; sfx.heal(); toast({ title: '回復', text: `${G.memberName(pick.i)} HP +${mm.hp - before}` }); G.ui.refresh(); render('items'); }; }
        }
        if (s.inventory.sticker_book) el('div', '', `<div style="margin-top:12px">📒 喵喵貼紙簿：${bookCount(s.stickers)} / ${bookTotal()} 張（在「貼紙」頁可以看）</div>`, body);
      }
    };
    render(tab);
    if (tutorial) G.s.flags['tut_' + tutorial] = true;
    sfx.meow();
    const close = () => { sfx.blip(); wrap.remove(); res(); };
    x.onclick = close; wrap.addEventListener('pointerdown', e => { if (e.target === wrap) close(); });
  });
}

// ---------- 聲音設定（系統面板「設定」頁、標題畫面都會用到） ----------
export function soundSettings(parent: HTMLElement) {
  const box = el('div', 'snd', '', parent);
  const row = (label: string, key: 'music' | 'sfx') => {
    const r = el('div', 'snd-row', `<span>${label}</span>`, box); const b = el('button', 'snd-tgl', '', r); b.dataset.k = key;
    const draw = () => { b.textContent = settings[key] ? '開 🔊' : '關 🔇'; b.classList.toggle('off', !settings[key]); };
    b.onclick = () => { settings[key] = !settings[key]; saveSettings(); draw(); sfx.ok(); }; draw();
  };
  row('🎵 背景音樂', 'music'); row('🐱 音效和貓咪叫聲', 'sfx');
  const vr = el('div', 'snd-row', '<span>🔉 音量</span>', box);
  const v = el('input', 'snd-vol', '', vr) as HTMLInputElement; v.type = 'range'; v.min = '0'; v.max = '100'; v.value = String(Math.round(settings.vol * 100));
  v.oninput = () => { settings.vol = +v.value / 100; saveSettings(); };
  v.onchange = () => sfx.voice();
  el('div', 'snd-note', `現在播放：${({ title: '標題的歌', village: '村莊的歌', field: '草原的歌', battle: '戰鬥的歌', victory: '勝利的歌', forest: '森林的歌', boss: '大魔物的歌' } as any)[music.current() ?? ''] ?? '（點一下畫面就會開始）'}`, box);
  return box;
}

// ---------- 系統啟動演出 ----------
export function activateSystem(): Promise<void> {
  return new Promise(async res => {
    const fl = el('div', 'fade white on', '', root()); await wait(500);
    const w = el('div', 'activate', '<div class="ring">🐱</div><div class="lines"></div>', root());
    fl.classList.remove('on'); setTimeout(() => fl.remove(), 700);
    sfx.chime(); const L = w.querySelector('.lines')!;
    const lines = ['叮！', '喵喵勇者系統，啟動喵！', '獲得能力：聽懂貓語', '獲得職業：初期勇士'];
    for (const t of lines) { await wait(650); el('div', '', t, L as HTMLElement); sfx.meow(); }
    await wait(500); el('div', 'tap', '點一下繼續', w);
    w.addEventListener('pointerdown', () => { w.remove(); res(); }, { once: true });
  });
}

// ---------- Toast / 獎勵 / 淡出 ----------
const toastBox = () => document.querySelector('.toasts') as HTMLElement || el('div', 'toasts', '', root());
export function toast(t: { title: string; text: string }) {
  const e = el('div', 'toast', `<b>${t.title}</b>${t.text}`, toastBox());
  setTimeout(() => e.classList.add('out'), 2400); setTimeout(() => e.remove(), 2900);
}
declare const __HERO_BADGES__: boolean[];
function badge(tier: number) {
  const asset = __HERO_BADGES__[tier] ? `badge_t${tier}` : 'hero_big';
  return `<img class="hero-badge" src="${A(asset)}" alt="">`;
}
export function reward(title: string, lines: string[], tier?: number): Promise<void> {
  return new Promise(res => {
    const w = el('div', tier == null ? 'reward' : 'reward title-up', '', root());
    const c = el('div', 'card', `${tier == null ? '<div style="font-size:30px">🐾</div>' : badge(tier)}<h3>${title}</h3><div class="r-list">${lines.length ? lines.map(l => `✨ ${l}`).join('<br>') : ''}</div>`, w);
    const b = el('button', '', '好！', c); b.onclick = () => { sfx.ok(); w.remove(); res(); };
  });
}
let fadeEl: HTMLElement | null = null;
export function fade(text = '', white = false): Promise<void> { fadeEl?.remove(); fadeEl = el('div', 'fade' + (white ? ' white' : ''), text, root()); requestAnimationFrame(() => fadeEl!.classList.add('on')); return wait(650); }
export function unfade(): Promise<void> { const f = fadeEl; if (!f) return Promise.resolve(); f.classList.remove('on'); fadeEl = null; return wait(650).then(() => f.remove()); }

export function makeHooks(hud: Hud, dlg: DialogueBox): UIHooks {
  return { writeLetter, readLetter, celebrate: (tier) => reward(`叮！${G.s.name}變成『${HERO_TITLES[tier]}』了喵！`, [
    TITLE_GIFTS[tier], `新貼紙：${HERO_TITLES[tier]}`, '妳害怕的時候，還是往前走了。',
  ], tier), dialogue: dlg, activateSystem, openPanel: openSystemPanel, reward, fade, unfade, toast, refresh: () => hud.refresh(), shop: shopPanel, chapterEnd: chapterEndScreen, quiz: quizPanel, travel: travelPanel, stickerBoard: async () => {}, trade: tradePanel };
}

// ---------- 商店（例如銀杏婆婆的草藥店） ----------
export function shopPanel(items: { id: string; price: number }[], title = '🌿 草藥店'): Promise<void> {
  return new Promise(res => {
    const wrap = el('div', 'sys-wrap', '', root()); const p = el('div', 'sys-panel shop', '', wrap);
    const head = el('div', 'sys-head', title, p); const x = el('button', 'x', '✕', head);
    const body = el('div', 'sys-body', '', p);
    const draw = () => {
      body.innerHTML = `<div class="money">我的魚乾幣：<b>${G.s.money}</b></div>`;
      for (const it of items) {
        const d = ITEMS[it.id]; const row = el('div', 'inv-row', `<div><b>${d.name}</b> <span class="price">${it.price} 魚乾幣</span><small>${d.desc}（有 ${G.s.inventory[it.id] ?? 0} 個）</small></div>`, body);
        const b = el('button', '', '買', row) as HTMLButtonElement; b.disabled = G.s.money < it.price;
        b.onclick = () => {
          if (G.s.money < it.price) return;
          G.s.money -= it.price;
          G.s.inventory[it.id] = (G.s.inventory[it.id] ?? 0) + 1;
          const equip = equipBetterWeapon(G.s, d.id);
          sfx.ok();
          toast({ title: '買到了', text: equip ? `已裝備${d.name}` : d.name });
          draw();
        };
      }
    };
    draw();
    const close = () => { sfx.blip(); wrap.remove(); res(); };
    x.onclick = close; wrap.addEventListener('pointerdown', e => { if (e.target === wrap) close(); });
  });
}

// ---------- 章末 ----------
export function chapterEndScreen(chapter?: 2 | 3): Promise<void> {
  if (chapter) {
    const s = G.s;
    const quests = Object.values(QUESTS).filter(q => q.chapter === chapter);
    const counts = (kind: 'main' | 'side') => {
      const group = quests.filter(q => q.kind === kind);
      return `${group.filter(q => s.quests[q.id]?.status === 'done').length} / ${group.length}`;
    };
    const questStickers = quests.flatMap(q => q.rewards.sticker ? [q.rewards.sticker] : []);
    const stickers = chapter === 3 ? [...new Set([...chapter3MonsterStickers, ...questStickers])]
      : STICKER_PAGES.flatMap(page =>
        page.id === 'forest_depths' ? page.ids : page.id === 'monster' ? chapter2MonsterStickers
          : page.id === 'wonder' ? page.ids.filter(id => questStickers.includes(id)) : []);
    const screen = el('div', 'chap-end illustrated-ending on ' + (chapter === 3 ? 'chapter-three' : 'chapter-two'), '', root());
    screen.style.backgroundImage = `url(${A('c' + chapter + '_ending')})`;
    const title = chapter === 3 ? '第三章完成喵！' : '第二章　森林深處　完成喵！';
    const next = chapter === 3 ? '第四章　水輪少了一格（製作中）' : '第三章　橋的另一頭';
    const card = el('div', 'ce-card', `<h2>${title}</h2>
      <div class="ce-stats">
        ${chapter === 3 ? `<div><span>完成的主線</span><b>${counts('main')}</b></div>` : ''}
        <div><span>完成的支線</span><b>${counts('side')}</b></div>
        <div><span>喵喵貼紙</span><b>${stickers.filter(id => s.stickers.includes(id)).length} / ${stickers.length}</b></div>
        ${chapter === 3 ? `<div><span>🤝 友誼值</span><b>${s.journal[3].friendship}</b></div>` : ''}
      </div><div class="ce-next"><div>下一章</div><h1>${next}</h1>${chapter === 2 ? '<small>去大樹根村的大樹下找咕咕。</small>' : ''}</div>`, screen);
    sfx.chime();
    return new Promise(resolve => {
      el('button', 'big-btn', '繼續冒險', card).onclick = () => { sfx.ok(); screen.remove(); resolve(); };
    });
  }
  return new Promise(async res => {
    const s = G.s; const sides = Object.entries(s.quests).filter(([k, v]) => QUESTS[k].kind === 'side' && v.status === 'done').length;
    const w = el('div', 'chap-end', '', root());
    await wait(50); w.classList.add('on'); sfx.chime();
    const c = el('div', 'ce-card', `<div class="ce-cat">🐱</div><h2>第一章完成喵！</h2><p class="ce-sub">月光下的小勇者</p>
      <div class="ce-stats"><div><span>等級</span><b>Lv ${s.members.hero.lv}</b></div><div><span>完成的支線</span><b>${sides} / ${Object.values(QUESTS).filter(q => q.kind === 'side').length}</b></div>
      <div><span>對話成功</span><b>${s.stats.talkSuccess} 次</b></div><div><span>喵喵貼紙</span><b>${bookCount(s.stickers)} / ${bookTotal()}</b></div>
      <div><span>🦁 勇氣值</span><b>${s.courage}</b></div><div><span>🔍 觀察力</span><b>${s.observation}</b></div></div>`, w);
    await wait(2200);
    el('div', 'ce-next', '<div>下一章</div><h1>第二章　森林深處</h1><small>（還在製作中喵！）</small>', c);
    await wait(900);
    el('div', 'ce-tip', '現在可以繼續在村子、草原、黑森林自由玩，完成還沒做完的支線和收集喔！', c);
    const b = el('button', 'big-btn', '繼續冒險', c); b.onclick = () => { sfx.ok(); w.classList.remove('on'); setTimeout(() => { w.remove(); res(); }, 500); };
  });
}

// ---------- 標題畫面 ----------
export function titleScreen(): Promise<'new' | 'continue'> {
  return new Promise(res => {
    const sc = el('div', 'screen', '', root()); sc.style.backgroundImage = `url(${A('title')})`;
    el('div', 'title-logo', '<h1>月光貓村</h1><p>第一章　月光下的小勇者</p>', sc);
    const m = el('div', 'title-menu', '', sc);
    const save = hasSave() ? loadGame()?.state : null;
    if (save) { const c = el('button', 'big-btn', `繼續遊戲<div style="font-size:13px">${save.name}・Lv ${save.members.hero.lv}</div>`, m); c.onclick = () => { sfx.unlock(); sfx.ok(); sc.remove(); res('continue'); }; }
    const n = el('button', 'big-btn' + (save ? ' alt' : ''), '新遊戲', m);
    n.onclick = () => { sfx.unlock(); sfx.ok(); if (save && !confirm('開始新遊戲會覆蓋原本的存檔（存檔時）。確定嗎？')) return; sc.remove(); res('new'); };
    el('div', 'version', '試玩版 0.11.0', sc);
    const sb = el('button', 'title-snd', settings.music || settings.sfx ? '🔊' : '🔇', sc);
    sb.onclick = (e) => { e.stopPropagation(); const on = !(settings.music || settings.sfx); settings.music = on; settings.sfx = on; saveSettings(); sb.textContent = on ? '🔊' : '🔇'; if (on) sfx.ok(); };
    music.play('title');
  });
}

// ---------- 序章 ----------
export async function prologue(dlg: DialogueBox): Promise<string> {
  const sc = el('div', 'screen', '', root()); sc.style.background = '#000'; sc.style.zIndex = '15';
  const img = el('div', 'panel-img', '', sc); img.style.opacity = '0';
  const say = (s: string, t: string, extra: any = {}) => dlg.show({ text: t, kind: s === 'hero' ? 'hero' : s === 'narr' ? 'narr' : 'npc', name: s === 'hero' ? name : s === 'narr' ? undefined : '？？？', ...extra });
  let name = '';
  const show = async (k: string) => { img.style.opacity = '0'; await wait(400); img.style.backgroundImage = `url(${A(k)})`; img.style.opacity = '1'; await wait(700); };
  await show('prologue1');
  await say('narr', '早上七點半，台北的街道熱熱鬧鬧。機車噗噗地開過去，早餐店飄來包子的香味。');
  await say('narr', '一個背著黃色書包的女孩，正走在上學的路上。');
  dlg.hide();
  name = await new Promise<string>(res => {
    const box = el('div', 'name-box', '<h3>她的名字是？</h3>', sc);
    const inp = el('input', '', '', box) as HTMLInputElement; inp.maxLength = 6; inp.placeholder = '小葵'; inp.value = '';
    el('div', 'hint', '最多 6 個字，空白就用「小葵」', box);
    const b = el('button', 'big-btn', '決定', box); b.style.width = '100%';
    const ok = () => { const v = inp.value.trim() || '小葵'; sfx.ok(); box.remove(); res(v); };
    b.onclick = ok; inp.addEventListener('keydown', e => { if (e.key === 'Enter') ok(); });
    setTimeout(() => inp.focus(), 100);
  });
  await say('narr', `${name}走著走著，路邊出現一隻戴著金色小領結的白貓。`);
  await say('narr', '白貓看著她，眨了一下眼睛。');
  await say('hero', '咦？你的領結好漂亮……你要去哪裡？');
  await show('prologue2');
  await say('narr', '白貓跳進路邊的小巷子，回頭看她一眼。');
  await say('hero', '上學會遲到啦……可是牠好像在等我。', { think: true });
  dlg.hide();
  await new Promise<void>(res => { const h = el('button', 'alley-hint', '點巷口<br>跟上去', sc); h.style.background = 'transparent'; h.onclick = () => { h.remove(); res(); }; });
  sfx.chime();
  const fl = el('div', 'fade white', '', sc); requestAnimationFrame(() => fl.classList.add('on')); await wait(1200);
  await show('prologue3'); fl.classList.remove('on'); await wait(600); fl.remove();
  await say('narr', `……${name}睜開眼睛。天上是好大好大的月亮。`);
  const vo = (id: string) => sfx.voice(NPCS.find(n => n.id === id)?.voice);
  vo('douhua'); await dlg.show({ name: '？？？', text: '喵？', kind: 'npc' });
  vo('mochimom'); await dlg.show({ name: '？？？', text: '喵喵喵！', kind: 'npc' });
  vo('farmer'); await dlg.show({ name: '？？？', text: '喵——嗚？', kind: 'npc' });
  await say('hero', '這、這裡是哪裡？貓咪……站著走路？還穿著衣服？');
  dlg.hide();
  img.style.opacity = '0'; await wait(600); sc.remove();
  return name;
}

// ---------- 貼紙圖示、魔物圖鑑 ----------
const STICKER_ICON: Record<string, string[]> = { wonder: ['🕰️', '🌷', '🐭', '🐘', '🫖', '🙃', '🌳'], village: ['🐱', '🏠', '💌', '🍞', '🌼', '🧶'], monster: ['💧', '💧', '🟢', '🟢', '🦇', '🦇', '🍃', '🍃', '🐺', '🐺', '🍄', '🍄', '🐌', '🐌', '🙃', '🙃'], scene: ['🌅', '🌙', '🌲', '🔥', '⛲', '🔔'], secret: ['🐾', '🔍', '🗝️', '📜', '✨'], shiny: ['🌟', '💎'] };
function bestiary(body: HTMLElement) {
  body.innerHTML = '<div class="sb-head">📖 魔物圖鑑（重看魔物說過的話）</div>';
  for (const id of [...new Set((STICKER_PAGES.find(c => c.id === 'monster')?.ids ?? []).map(i => i.replace(/_(talk|defeat)$/, '')))].filter(i => ENEMIES[i])) { const e = ENEMIES[id]; el('div', 'inv-row', `<div><b>${e.name}</b><small>對話成功：「${e.talkLines.join('」「')}」</small><small>${e.info ? '情報：「' + e.info.join('」「') + '」' : ''}</small></div>`, body); }
}
// ---------- 月光燈籠：快速移動 ----------
export function travelPanel(): Promise<void> {
  return new Promise(res => {
    const wrap = el('div', 'sys-wrap', '', root()); const p = el('div', 'sys-panel shop', '', wrap);
    const head = el('div', 'sys-head', '🏮 月光燈籠：要去哪裡？', p); const x = el('button', 'x', '✕', head);
    const body = el('div', 'sys-body', '', p);
    const close = () => { wrap.remove(); res(); };
    for (const l of LANTERNS.filter(l => G.s.flags[l.id] && !(l.map === G.s.map && Math.hypot(l.x - G.world.player.x, l.y - G.world.player.y) < 120))) {
      const row = el('div', 'inv-row', `<div><b>${l.name}</b><small>${MAPS[l.map].name}</small></div>`, body); const b = el('button', '', '去', row);
      b.onclick = async () => { sfx.ok(); wrap.remove(); await fade('', true); G.world.placePlayer(l.map, l.x, l.y + 40, 0); await unfade(); res(); };
    }
    if (!body.children.length) el('div', 'money', '還沒有其他亮著的燈籠喵。先去點亮別的燈籠吧！', body);
    x.onclick = () => { sfx.blip(); close(); };
  });
}

// ---------- 哥布林交換小攤（用魔物素材換東西，不用魚乾幣） ----------
export function tradePanel(): Promise<void> {
  return new Promise(res => {
    const wrap = el('div', 'sys-wrap', '', root()); const p = el('div', 'sys-panel shop', '', wrap);
    const head = el('div', 'sys-head', '🔁 哥布林交換小攤', p); const x = el('button', 'x', '✕', head);
    const body = el('div', 'sys-body', '', p);
    const draw = () => {
      body.innerHTML = '<div class="money">用魔物留下的東西來交換喵！</div>';
      const pool = TRADES.filter(tr => !tr.sticker), day = G.s.day ?? 0;
      const shown = [...Array.from({ length: Math.min(3, pool.length) }, (_, k) => pool[(day * 2 + k) % pool.length]), ...TRADES.filter(tr => tr.sticker)];
      body.insertAdjacentHTML('beforeend', '<small style="opacity:.8">（每次回村子休息，交換的東西會換一批喔）</small>');
      for (const tr of shown) {
        const can = tr.give.every(([i, n]) => (G.s.inventory[i] ?? 0) >= n);
        const giveTxt = tr.give.map(([i, n]) => `${ITEMS[i].name} ×${n}（有 ${G.s.inventory[i] ?? 0}）`).join('＋');
        const getTxt = tr.get ? `${ITEMS[tr.get[0]].name} ×${tr.get[1]}` : '一張還沒有的「閃亮貼紙」';
        const row = el('div', 'inv-row', `<div><b>換 ${getTxt}</b><small>要：${giveTxt}</small></div>`, body);
        const b = el('button', '', '換', row) as HTMLButtonElement; b.disabled = !can;
        b.onclick = () => {
          if (!tr.give.every(([i, n]) => (G.s.inventory[i] ?? 0) >= n)) return;
          if (tr.sticker) { const sid = (STICKER_PAGES.find(c => c.id === 'shiny')?.ids ?? []).find(i => !G.s.stickers.includes(i)); if (!sid) { toast({ title: '已經集滿了', text: '閃亮貼紙都有了喵！' }); return; } G.s.stickers.push(sid); toast({ title: '✨ 閃亮貼紙！', text: STICKERS[sid] }); }
          tr.give.forEach(([i, n]) => { G.s.inventory[i] -= n; });
          if (tr.get) { G.s.inventory[tr.get[0]] = (G.s.inventory[tr.get[0]] ?? 0) + tr.get[1]; toast({ title: '換到了', text: getTxt }); }
          sfx.claim(); draw();
        };
      }
    };
    draw();
    const close = () => { sfx.blip(); wrap.remove(); res(); };
    x.onclick = close; wrap.addEventListener('pointerdown', e => { if (e.target === wrap) close(); });
  });
}
