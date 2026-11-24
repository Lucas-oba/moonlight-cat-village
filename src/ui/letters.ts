import { sfx } from '../core/sfx';
import { blockTaps } from '../core/tapguard';
import type { LetterMessage, SavedLetter, WriteLetter } from '../data/letters';
import { A, el, root } from './ui';

function letterWindow(title: string) {
  const wrap = el('div', 'sys-wrap letter-wrap', '', root());
  const panel = el('section', 'letter-panel', '', wrap);
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-label', title);
  const heading = el('h3', 'letter-heading', '', panel);
  const icon = el('img', '', '', heading);
  icon.src = A('c3_letter');
  icon.alt = '';
  heading.append(title);
  return { body: el('div', 'letter-body', '', panel), close() { blockTaps(); wrap.remove(); } };
}

function showMessage(container: HTMLElement, message: LetterMessage, oral = false) {
  if (typeof message === 'string') {
    container.textContent = message;
    return;
  }
  if (!oral) {
    const image = el('img', 'letter-picture', '', container);
    image.src = A(message.image);
    image.alt = '';
  }
  container.append(message.label);
}

function showHalves(body: HTMLElement, from: string, to: string, oral = false) {
  const sheet = el('div', oral ? 'letter-voices' : 'letter-paper', '', body);
  function half(name: string, cls: string) {
    const side = el('div', 'letter-half', '', sheet);
    el('b', '', '', side).textContent = name;
    return el('p', cls, '', side);
  }
  return { left: half(from, 'letter-message'), right: half(to, 'letter-reply') };
}

export function writeLetter(a: WriteLetter): Promise<SavedLetter> {
  return new Promise(resolve => {
    const { body, close } = letterWindow('朋友信');
    function choose(messages: LetterMessage[], mode: SavedLetter['mode']) {
      sfx.blip();
      body.replaceChildren();
      const oral = mode === 'oral';
      if (!oral) {
        const { left, right } = showHalves(body, a.from, a.to);
        left.textContent = '要帶什麼話呢？';
        right.textContent = '等朋友回信。';
      }
      el('p', '', '', body).textContent = oral ? '妳想幫忙說哪一句？'
        : typeof messages[0] === 'string' ? '選一句話寫在信上。' : '選一個小圖畫在信上。';
      const list = el('div', 'letter-choices', '', body);
      for (const message of messages) {
        const button = el('button', 'letter-choice', '', list);
        showMessage(button, message, oral);
        button.onclick = () => {
          sfx.ok();
          close();
          resolve({ id: a.id, from: a.from, to: a.to, mode, message });
        };
      }
      el('button', 'letter-back', '換個方式', body).onclick = showModes;
    }
    function showModes() {
      body.replaceChildren();
      el('p', '', '', body).textContent = `妳想怎麼幫${a.from}帶話給${a.to}？`;
      const modes = el('div', 'letter-choices', '', body);
      function option(label: string, messages: LetterMessage[], mode: SavedLetter['mode']) {
        el('button', '', label, modes).onclick = () => choose(messages, mode);
      }
      if (a.words) option('寫一句話', a.words, 'paper');
      if (a.pictures) option('畫一個小圖', a.pictures, 'paper');
      option('直接幫忙傳口信', a.words ?? a.pictures!, 'oral');
    }
    showModes();
  });
}

export function readLetter(letter: SavedLetter): Promise<void> {
  return new Promise(resolve => {
    const oral = letter.mode === 'oral';
    const { body, close } = letterWindow(oral ? '朋友的口信' : '朋友信');
    const { left, right } = showHalves(body, letter.from, letter.to, oral);
    showMessage(left, letter.message, oral);
    if (letter.reply !== undefined) showMessage(right, letter.reply, oral);
    else right.textContent = '等朋友回答。';
    el('button', 'letter-close', '收好', body).onclick = () => { sfx.blip(); close(); resolve(); };
  });
}

export function showLetterList(body: HTMLElement, letters: SavedLetter[]) {
  for (const letter of letters) {
    const button = el('button', 'letter-entry', '', body);
    button.append(`${letter.from}給${letter.to}的${letter.mode === 'oral' ? '口信' : '信'}`);
    el('small', '', letter.reply === undefined ? '等朋友回答' : '朋友回話了', button);
    button.onclick = () => { sfx.blip(); void readLetter(letter); };
  }
}
