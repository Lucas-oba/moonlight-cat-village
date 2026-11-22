// 點地面走路的保護：關掉對話框、選單、面板的那一下（以及手機在放開手指後補送的「假滑鼠點擊」），
// 不可以被當成「點地面」。
// 做法：只要手指／滑鼠是按在畫布以外的東西（對話框、按鈕、面板、搖桿……）上，
// 或是對話、選單剛剛關掉，就在一小段時間內不接受點地面。
let blockUntil = 0;
export function blockTaps(ms = 450) { blockUntil = Math.max(blockUntil, performance.now() + ms); }
export function tapsBlocked() { return performance.now() < blockUntil; }
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  const onAny = (e: Event) => { const t = e.target as any; if (!(t && t.tagName === 'CANVAS')) blockTaps(); };
  for (const ev of ['pointerdown', 'pointerup', 'pointercancel', 'touchstart', 'touchend', 'touchcancel', 'mousedown', 'mouseup', 'click'])
    window.addEventListener(ev, onAny, { capture: true, passive: true });
}
