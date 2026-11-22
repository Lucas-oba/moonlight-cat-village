// 背景音樂：使用使用者自己的 BGM 音樂庫（E:\claude\BGM），重新壓成單聲道 MP3 放在 public/assets/bgm_*.mp3
// 用 WebAudio 播放：無縫循環、換場景時淡入淡出；要等玩家第一次點擊後才會開始（手機規定）。
import { ac, buses, onUnlock, loadBuf } from './sfx';

export type TrackId = 'title' | 'village' | 'field' | 'forest' | 'battle' | 'boss';
const FILES: Record<TrackId | 'victory', string> = { title: 'bgm_title', village: 'bgm_village', field: 'bgm_field', forest: 'bgm_forest', battle: 'bgm_battle', boss: 'bgm_boss', victory: 'bgm_victory' };
const LEVEL: Record<string, number> = { title: 0.9, village: 0.85, field: 0.85, battle: 0.8, victory: 0.9 };

let cur: { id: string; src: AudioBufferSourceNode; gain: GainNode } | null = null; let want: TrackId | null = null; let token = 0;
function stopCur(sec: number) {
  if (!cur) return; const c = ac()!; const { src, gain } = cur; const t = c.currentTime;
  gain.gain.cancelScheduledValues(t); gain.gain.setValueAtTime(gain.gain.value, t); gain.gain.linearRampToValueAtTime(0, t + sec);
  try { src.stop(t + sec + 0.05); } catch { /* ignore */ } cur = null;
}
async function start(id: string, loop: boolean, fadeIn: number, my: number) {
  const c = ac(); if (!c) return; let buf: AudioBuffer;
  try { buf = await loadBuf(FILES[id as TrackId]); } catch { return; }
  if (my !== token) return; // 等解碼時又換了曲子
  const src = c.createBufferSource(); src.buffer = buf; src.loop = loop;
  const gain = c.createGain(); gain.gain.value = 0; src.connect(gain).connect(buses().music);
  const t = c.currentTime; gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(LEVEL[id] ?? 0.85, t + fadeIn);
  src.start(t); cur = { id, src, gain };
  return src;
}
export const music = {
  play(id: TrackId | null) {
    if (want === id && (cur?.id === id)) return;
    want = id; const my = ++token;
    onUnlock(() => {
      if (my !== token) return;
      if (cur?.id === id) return;
      const fast = id === 'battle' || id === 'boss'; stopCur(fast ? 0.35 : 1.0);
      if (id) start(id, true, fast ? 0.3 : 1.2, my);
    });
  },
  // 戰鬥勝利的短音樂（播一次），播完由下一個 play() 接手
  async jingle(): Promise<void> {
    want = null; const my = ++token;
    if (!ac() ) return;
    stopCur(0.25);
    const src = await start('victory', false, 0.05, my);
    if (!src) return;
  },
  current() { return cur?.id ?? null; },
};
(window as any).__music = music;
