import { CH2_QUIZ } from '../data/quiz_ch2';
// 喵喵小學堂：解題面板（大大的選項按鈕；答錯沒有懲罰，貓咪給提示再試一次）
import { el, root, A } from './ui';
import { G } from '../core/game';
import { sfx } from '../core/sfx';
import { NPCS } from '../data/npcs';
import { QUIZ, SUBJECT_NAME, PRAISE, RETRY, type QuizQ, type Subject } from '../data/quiz';
export interface QuizOpts { subject?: Subject | 'mix'; tier?: number; n?: number; by?: string; title?: string; ids?: string[] }
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
function shuffle<T>(a: T[]) { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }
// 選題：同科目、同難度；最近做過的題目先不出
export function chooseQuestions(o: QuizOpts): QuizQ[] {
  const s = G.s; const qz = (s.quiz ??= { seen: [], correct: 0, wrong: 0 });
  if (o.ids) {
    const questions = o.ids.map(id => QUIZ.find(q => q.id === id) ?? CH2_QUIZ.find(q => q.id === id))
      .filter((q): q is QuizQ => q !== undefined);
    return o.n == null ? questions : shuffle(questions).slice(0, o.n);
  }
  const n = o.n ?? 1; const tier = o.tier ?? 1;
  let pool = QUIZ.filter(q => (!o.subject || o.subject === 'mix' || q.subject === o.subject));
  const exact = pool.filter(q => q.tier === tier); if (exact.length >= n) pool = exact; else pool = pool.filter(q => q.tier <= tier);
  let fresh = pool.filter(q => !qz.seen.includes(q.id));
  if (fresh.length < n) { qz.seen = qz.seen.filter(id => !pool.some(q => q.id === id)); fresh = pool; } // 都做過了：重新輪一次
  // 混合題：盡量每科都出到
  const out: QuizQ[] = []; const order = shuffle(fresh);
  if (o.subject === 'mix') for (const sub of shuffle(['chinese', 'math', 'english', 'science'] as Subject[])) { const q = order.find(x => x.subject === sub && !out.includes(x)); if (q && out.length < n) out.push(q); }
  for (const q of order) { if (out.length >= n) break; if (!out.includes(q)) out.push(q); }
  return out;
}
export function quizPanel(o: QuizOpts): Promise<number> {
  const qs = chooseQuestions(o);
  const npc = NPCS.find(n => n.id === o.by) ?? NPCS.find(n => n.id === 'whitecat')!;
  const s = G.s; const qz = (s.quiz ??= { seen: [], correct: 0, wrong: 0 });
  return new Promise(res => {
    const wrap = el('div', 'sys-wrap quiz-wrap', '', root()); const p = el('div', 'sys-panel quiz', '', wrap);
    el('div', 'sys-head', `📚 ${o.title ?? '喵喵小學堂'}`, p);
    const body = el('div', 'sys-body', '', p);
    let i = 0; let firstTry = 0;
    const show = () => {
      const q = qs[i]; let tries = 0;
      body.innerHTML = '';
      el('div', 'qz-top', `<span class="qz-sub ${q.subject}">${SUBJECT_NAME[q.subject]}</span><span class="qz-n">第 ${i + 1} / ${qs.length} 題</span>`, body);
      el('div', 'qz-q', q.q, body);
      const grid = el('div', 'qz-ch', '', body);
      const bubble = el('div', 'qz-cat', `<img src="${A(npc.portrait ?? npc.sprite)}"><div class="qz-say">${G.fmt(npc.name)}：「慢慢想，不用急喵。」</div>`, body);
      const say = bubble.querySelector('.qz-say') as HTMLElement;
      const idx = shuffle(q.choices.map((_, k) => k));
      const wrongButtons: HTMLButtonElement[] = [];
      for (const k of idx) {
        const b = el('button', 'qz-btn', q.choices[k], grid) as HTMLButtonElement;
        if (k !== q.answer) wrongButtons.push(b);
        b.onclick = () => {
          if (b.disabled || grid.classList.contains('done')) return;
          if (k === q.answer) {
            grid.classList.add('done'); b.classList.add('ok'); sfx.claim();
            if (tries === 0) firstTry++;
            qz.correct++; if (!qz.seen.includes(q.id)) qz.seen.push(q.id); if (qz.seen.length > 60) qz.seen.shift();
            say.innerHTML = `${G.fmt(npc.name)}：「${pick(PRAISE)}」<br><small>💡 ${q.explain}</small>`;
            const nx = el('button', 'qz-next', i + 1 < qs.length ? '下一題 ▶' : '完成！', body) as HTMLButtonElement;
            nx.onclick = () => { sfx.blip(); i++; if (i < qs.length) show(); else { wrap.remove(); if (qz.correct >= 20 && !s.stickers.includes('quiz_star')) { s.stickers.push('quiz_star'); G.ui.toast({ title: '新貼紙', text: '小學堂之星（答對 20 題）' }); } res(firstTry); } };
          } else {
            tries++; qz.wrong++; b.disabled = true; b.classList.add('no'); sfx.blip();
            say.innerHTML = `${G.fmt(npc.name)}：「${pick(RETRY)}」<br><small>🐾 提示：${q.hint}</small>`;
            if (tries === 1 && s.observation >= 4) {
              const other = wrongButtons.find(button => !button.disabled);
              if (other) {
                other.disabled = true;
                other.classList.add('qz-eliminated');
                el('small', '', '<br>🔍 觀察力幫妳刪掉一個不對的答案', say);
              }
            }
            bubble.classList.remove('wig'); void bubble.offsetWidth; bubble.classList.add('wig');
          }
        };
      }
    };
    show();
  });
}
