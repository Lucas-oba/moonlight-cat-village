// 所有聲音都用 WebAudio 即時合成（不需要音檔，也沒有版權問題）
// 手機瀏覽器規定：要等玩家第一次點擊後才能出聲，所以 unlock() 會在第一次點擊時呼叫。
export type Voice = { base: number; len: number; type?: OscillatorType; bend?: number; drop?: number; vib?: number; chirps?: number; gap?: number; bright?: number; vol?: number };
type Settings = { music: boolean; sfx: boolean; vol: number };
const SKEY = 'mcv_settings_v1';
export const settings: Settings = (() => { try { return { music: true, sfx: true, vol: 0.7, ...JSON.parse(localStorage.getItem(SKEY) || '{}') }; } catch { return { music: true, sfx: true, vol: 0.7 }; } })();
export function saveSettings() { try { localStorage.setItem(SKEY, JSON.stringify(settings)); } catch { /* ignore */ } applySettings(); }

let ctx: AudioContext | null = null; let sfxBus: GainNode | null = null; let musicBus: GainNode | null = null; let unlocked = false;
const unlockCbs: (() => void)[] = [];
export function ac() {
  if (!ctx) {
    try { ctx = new (window.AudioContext || (window as any).webkitAudioContext)(); } catch { return null; }
    sfxBus = ctx.createGain(); sfxBus.connect(ctx.destination); musicBus = ctx.createGain(); musicBus.connect(ctx.destination); applySettings();
    document.addEventListener('visibilitychange', () => { if (!ctx) return; if (document.hidden) ctx.suspend(); else if (unlocked) ctx.resume(); });
  }
  return ctx;
}
export function buses() { ac(); return { sfx: sfxBus!, music: musicBus! }; }
export function onUnlock(cb: () => void) { if (unlocked) cb(); else unlockCbs.push(cb); }
export function isUnlocked() { return unlocked; }
function applySettings() {
  if (!ctx || !sfxBus || !musicBus) return; const t = ctx.currentTime;
  sfxBus.gain.setTargetAtTime(settings.sfx ? settings.vol : 0, t, 0.05);
  musicBus.gain.setTargetAtTime(settings.music ? settings.vol * 0.55 : 0, t, 0.15);
}
function unlockNow() {
  const c = ac(); if (!c) return;
  if (c.state === 'suspended') c.resume();
  if (!unlocked) {
    unlocked = true;
    // iOS：播一個無聲的 buffer 解鎖
    try { const b = c.createBuffer(1, 1, 22050); const s = c.createBufferSource(); s.buffer = b; s.connect(c.destination); s.start(0); } catch { /* ignore */ }
    unlockCbs.splice(0).forEach(f => f());
  }
}
// 任何第一次觸控／點擊都解鎖聲音
['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'].forEach(ev => window.addEventListener(ev, unlockNow, { capture: true, passive: true }));

// ---------- 音檔（使用者自己的音效庫）----------
const assetUrl = (name: string) => ((window as any).__MCV_ASSETS?.[name + '.mp3'] as string) ?? `./assets/${name}.mp3`;
const bufCache: Record<string, Promise<AudioBuffer>> = {}; const ready: Record<string, AudioBuffer> = {};
export function loadBuf(name: string): Promise<AudioBuffer> {
  const c = ac(); if (!c) return Promise.reject(new Error('no audio'));
  return bufCache[name] ??= fetch(assetUrl(name)).then(r => r.arrayBuffer()).then(a => new Promise<AudioBuffer>((res, rej) => c.decodeAudioData(a, res, rej))).then(b => (ready[name] = b));
}
const SFX_FILES = ['sfx_click', 'sfx_attack', 'sfx_heal', 'sfx_levelup', 'sfx_newfriend', 'sfx_reward', 'sfx_transition', 'sfx_enemydown', 'sfx_claim'];
onUnlock(() => SFX_FILES.forEach(n => loadBuf(n).catch(() => { /* 用合成音代替 */ })));
function sample(name: string, vol: number, fallback: () => void) {
  const c = ac(); if (!c || !unlocked) return; const b = ready[name]; if (!b) { fallback(); return; }
  const s = c.createBufferSource(); s.buffer = b; const g = c.createGain(); g.gain.value = vol; s.connect(g).connect(sfxBus!); s.start();
}
function out() { const c = ac(); if (!c || !unlocked) return null; return { c, bus: sfxBus! }; }
function tone(f: number, d: number, type: OscillatorType = 'square', vol = 0.06, slide = 0, delay = 0) {
  const o0 = out(); if (!o0) return; const { c, bus } = o0; const t = c.currentTime + delay;
  const o = c.createOscillator(); const g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, f + slide), t + d);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(g).connect(bus); o.start(t); o.stop(t + d + 0.02);
}
// 貓叫聲：音高「上揚再下滑」＋濾波器開合（像「咪—嗚」的嘴型）
function meowOnce(v: Voice, delay: number) {
  const o0 = out(); if (!o0) return; const { c, bus } = o0; const t = c.currentTime + delay; const L = v.len;
  const f = v.base, peak = f * (v.bend ?? 1.35), end = f * (v.drop ?? 0.75);
  const o = c.createOscillator(); o.type = v.type ?? 'sawtooth';
  o.frequency.setValueAtTime(f * 0.85, t); o.frequency.exponentialRampToValueAtTime(peak, t + L * 0.35); o.frequency.exponentialRampToValueAtTime(end, t + L);
  const o2 = c.createOscillator(); o2.type = 'sine'; o2.frequency.setValueAtTime(f * 1.7, t); o2.frequency.exponentialRampToValueAtTime(peak * 2, t + L * 0.35); o2.frequency.exponentialRampToValueAtTime(end * 2, t + L);
  if (v.vib) { const lfo = c.createOscillator(); const lg = c.createGain(); lfo.frequency.value = v.vib; lg.gain.value = f * 0.04; lfo.connect(lg); lg.connect(o.frequency); lfo.start(t); lfo.stop(t + L + 0.05); }
  const flt = c.createBiquadFilter(); flt.type = 'lowpass'; flt.Q.value = 6; const br = v.bright ?? 1;
  flt.frequency.setValueAtTime(f * 1.5 * br, t); flt.frequency.exponentialRampToValueAtTime(f * 5 * br, t + L * 0.4); flt.frequency.exponentialRampToValueAtTime(f * 1.6 * br, t + L);
  const g = c.createGain(); const vol = (v.vol ?? 1) * 0.11; const g2 = c.createGain(); g2.gain.value = 0.25;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.04, L * 0.2)); g.gain.setValueAtTime(vol, t + L * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + L);
  o.connect(flt); o2.connect(g2).connect(flt); flt.connect(g).connect(bus);
  o.start(t); o2.start(t); o.stop(t + L + 0.05); o2.stop(t + L + 0.05);
}
export const DEFAULT_VOICE: Voice = { base: 650, len: 0.28, type: 'triangle' };
export const sfx = {
  unlock() { unlockNow(); },
  blip() { sample('sfx_click', 0.5, () => tone(880, 0.04, 'square', 0.025)); },
  talkBlip() { tone(520, 0.05, 'triangle', 0.03); },
  ok() { sample('sfx_click', 0.7, () => { tone(660, 0.06, 'square', 0.05); tone(990, 0.08, 'square', 0.05, 0, 0.06); }); },
  meow() { tone(700, 0.25, 'triangle', 0.08, 500); tone(1200, 0.2, 'sine', 0.05, -400, 0.18); },
  voice(v: Voice = DEFAULT_VOICE) { const n = v.chirps ?? 1; for (let i = 0; i < n; i++) meowOnce(v, i * (v.len + (v.gap ?? 0.04))); },
  goblin() { tone(180, 0.09, 'square', 0.05, 90); tone(240, 0.1, 'square', 0.045, -80, 0.1); },
  blob() { tone(260, 0.12, 'sine', 0.07, 180); tone(200, 0.14, 'sine', 0.06, -60, 0.1); },
  claim() { sample('sfx_claim', 0.85, () => sfx.chime()); },
  reward() { sample('sfx_reward', 0.8, () => sfx.chime()); },
  levelUp() { sample('sfx_levelup', 0.8, () => sfx.win()); },
  newFriend() { sample('sfx_newfriend', 0.8, () => sfx.chime()); },
  transition() { sample('sfx_transition', 0.6, () => {}); },
  enemyDown() { sample('sfx_enemydown', 0.8, () => tone(300, 0.2, 'square', 0.05, -200)); },
  chime() { [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.25, 'sine', 0.06, 0, i * 0.09)); },
  hit() { sample('sfx_attack', 0.8, () => tone(220, 0.12, 'sawtooth', 0.07, -120)); },
  hurt() { tone(160, 0.18, 'square', 0.07, -80); },
  heal() { sample('sfx_heal', 0.8, () => sfx.healSynth()); },
  healSynth() { [523, 659, 784].forEach((f, i) => tone(f, 0.15, 'sine', 0.06, 0, i * 0.07)); },
  encounter() { [392, 523, 392, 659].forEach((f, i) => tone(f, 0.09, 'square', 0.05, 0, i * 0.07)); },
  win() { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, 0.16, 'square', 0.05, 0, i * 0.11)); },
  lose() { [392, 349, 330, 262].forEach((f, i) => tone(f, 0.25, 'triangle', 0.06, 0, i * 0.2)); },
  step() { tone(120, 0.03, 'triangle', 0.02); },
};
