import Phaser from 'phaser';
import { TILE } from '../data/maps';
// 程式繪製的像素地面與小圖示（暖色、童話感，與生成的美術素材搭配）
function rng(seed: number) { return () => { seed = (seed * 16807) % 2147483647; return (seed & 0xffff) / 0x10000; }; }
const SOLID_GRASS = '.,TGx';
export function buildGround(scene: Phaser.Scene, key: string, tiles: string[], forest = false, mist = false) {
  const h = tiles.length, w = tiles[0].length; const T = TILE;
  const tex = scene.textures.createCanvas(key, w * T, h * T)!; const c = tex.getContext(); const r = rng(1234 + w * h);
  const at = (x: number, y: number) => (y < 0 || y >= h || x < 0 || x >= w) ? 'T' : tiles[y][x];
  const px = (x: number, y: number, col: string, s = 2) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), s, s); };
  const grass = (X: number, Y: number, dark = false) => {
    c.fillStyle = dark ? '#5e9e44' : '#7cc35a'; c.fillRect(X, Y, T, T);
    for (let i = 0; i < 10; i++) px(X + r() * 30, Y + r() * 30, dark ? '#4f8a38' : (r() < .5 ? '#6aae4c' : '#93d36c'));
    for (let i = 0; i < 3; i++) { const gx = X + r() * 28, gy = Y + r() * 28; px(gx, gy, dark ? '#447a30' : '#5d9e43'); px(gx + 2, gy - 2, dark ? '#447a30' : '#5d9e43'); }
  };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const ch = tiles[y][x]; const X = x * T, Y = y * T;
    switch (ch) {
      case ',': grass(X, Y); for (let i = 0; i < 5; i++) { const fx = X + 3 + r() * 24, fy = Y + 3 + r() * 24; const col = ['#ffb3d1', '#fff2a8', '#ffffff', '#c9b3ff'][Math.floor(r() * 4)]; px(fx, fy, col); px(fx + 2, fy, col); px(fx, fy + 2, col); px(fx + 2, fy + 2, '#f5c542'); } break;
      case 'G': {
        grass(X, Y, true);
        for (let i = 0; i < 7; i++) { const gx = X + 2 + r() * 26, gy = Y + 6 + r() * 24; c.fillStyle = '#3f7a2c'; c.fillRect(gx, gy - 8, 2, 8); c.fillRect(gx - 3, gy - 6, 2, 6); c.fillRect(gx + 3, gy - 6, 2, 6); c.fillStyle = '#8fd06a'; c.fillRect(gx, gy - 9, 2, 2); }
        break;
      }
      case 'p': case 'x': {
        grass(X, Y); c.fillStyle = '#d9b47a'; const inset = (dx: number, dy: number) => !'px'.includes(at(x + dx, y + dy)) && !'sb'.includes(at(x + dx, y + dy));
        const l = inset(-1, 0) ? 4 : 0, rr = inset(1, 0) ? 4 : 0, t = inset(0, -1) ? 4 : 0, b = inset(0, 1) ? 4 : 0;
        c.fillRect(X + l, Y + t, T - l - rr, T - t - b);
        for (let i = 0; i < 6; i++) px(X + 4 + r() * 24, Y + 4 + r() * 24, r() < .5 ? '#c49a5e' : '#ead09d');
        break;
      }
      case 's': {
        c.fillStyle = '#d8cdb9'; c.fillRect(X, Y, T, T); c.fillStyle = '#b3a68f';
        for (let row = 0; row < 4; row++) { c.fillRect(X, Y + row * 8 + 7, T, 1); const off = (row + y) % 2 ? 0 : 8; for (let k = 0; k < 3; k++) c.fillRect(X + off + k * 16, Y + row * 8, 1, 8); }
        for (let i = 0; i < 4; i++) px(X + r() * 30, Y + r() * 30, '#e9e1d0');
        break;
      }
      case 'w': {
        c.fillStyle = '#4aa3df'; c.fillRect(X, Y, T, T);
        for (let i = 0; i < 3; i++) { c.fillStyle = '#8fd0f5'; c.fillRect(X + r() * 24, Y + 4 + r() * 24, 6, 2); }
        if (at(x, y - 1) !== 'w' && at(x, y - 1) !== 'b') { c.fillStyle = '#6aae4c'; c.fillRect(X, Y, T, 3); c.fillStyle = '#3b86bd'; c.fillRect(X, Y + 3, T, 3); }
        if (at(x, y + 1) !== 'w' && at(x, y + 1) !== 'b') { c.fillStyle = '#2f6f9e'; c.fillRect(X, Y + T - 4, T, 4); }
        break;
      }
      case 'b': {
        c.fillStyle = '#4aa3df'; c.fillRect(X, Y, T, T); c.fillStyle = '#b07a43'; c.fillRect(X + 3, Y, T - 6, T);
        c.fillStyle = '#7d522a'; for (let k = 0; k < 4; k++) c.fillRect(X + 3, Y + k * 8 + 7, T - 6, 1);
        c.fillStyle = '#6b4320'; c.fillRect(X + 1, Y, 3, T); c.fillRect(X + T - 4, Y, 3, T);
        break;
      }
      case 'f': {
        c.fillStyle = '#8b5a33'; c.fillRect(X, Y, T, T); c.fillStyle = '#74482a'; for (let k = 0; k < 4; k++) c.fillRect(X, Y + k * 8 + 5, T, 2);
        for (let k = 0; k < 2; k++) { if (r() < .35) { px(X + 6 + k * 14, Y + 10 + (k % 2) * 8, '#5a3a1f', 4); continue; } const cx = X + 8 + k * 14, cy = Y + 8 + ((x + k) % 2) * 10; c.fillStyle = '#7fcf5a'; c.beginPath(); c.arc(cx, cy, 5, 0, 7); c.fill(); c.fillStyle = '#a9e58a'; c.fillRect(cx - 2, cy - 2, 3, 3); }
        break;
      }
      case 'F': {
        grass(X, Y); c.fillStyle = '#8a5a2b'; c.fillRect(X, Y + 12, T, 4); c.fillRect(X, Y + 21, T, 4); c.fillStyle = '#6b4320'; c.fillRect(X + 2, Y + 6, 6, 24); c.fillRect(X + 18, Y + 6, 6, 24); c.fillStyle = '#b07a43'; c.fillRect(X + 3, Y + 6, 4, 2); c.fillRect(X + 19, Y + 6, 4, 2);
        break;
      }
      case 'o': case 'm': case 'l': case 'y': { // 室內：木地板（m 門口地墊、l 梯子、y 稻草堆會遇到魔物）
        c.fillStyle = '#c08a55'; c.fillRect(X, Y, T, T); c.fillStyle = '#a87443';
        for (let k = 0; k < 4; k++) { c.fillRect(X, Y + k * 8 + 7, T, 1); const off = ((y * 4 + k) * 5) % 3 * 10 + 4; c.fillRect(X + off, Y + k * 8, 1, 8); }
        for (let i = 0; i < 4; i++) px(X + r() * 30, Y + r() * 30, r() < .5 ? '#cf9a63' : '#b07a48');
        if (at(x, y - 1) === 'W') { c.fillStyle = 'rgba(60,30,10,.35)'; c.fillRect(X, Y, T, 5); }
        if (ch === 'm') { c.fillStyle = '#7a3e2a'; c.fillRect(X + 3, Y + 6, T - 6, T - 10); c.fillStyle = '#c9603f'; c.fillRect(X + 5, Y + 8, T - 10, T - 14); c.fillStyle = '#f0c27a'; for (let k = 0; k < 4; k++) c.fillRect(X + 8 + k * 5, Y + 14, 2, 4); }
        if (ch === 'l') { c.fillStyle = '#6b4320'; c.fillRect(X + 6, Y, 4, T); c.fillRect(X + T - 10, Y, 4, T); c.fillStyle = '#8a5a2b'; for (let k = 0; k < 4; k++) c.fillRect(X + 6, Y + 4 + k * 8, T - 12, 3); }
        if (ch === 'y') { for (let i = 0; i < 26; i++) { const gx = X + 1 + r() * 28, gy = Y + 2 + r() * 26; c.fillStyle = r() < .5 ? '#e6c25e' : '#c9a043'; c.fillRect(gx, gy, 2 + r() * 5, 2); } c.fillStyle = '#f3d77c'; for (let i = 0; i < 6; i++) c.fillRect(X + r() * 28, Y + r() * 28, 3, 1); }
        break;
      }
      case 'r': { // 地毯
        c.fillStyle = '#c08a55'; c.fillRect(X, Y, T, T);
        const e = (dx: number, dy: number) => at(x + dx, y + dy) !== 'r';
        const l = e(-1, 0) ? 3 : 0, rr = e(1, 0) ? 3 : 0, t = e(0, -1) ? 3 : 0, b = e(0, 1) ? 3 : 0;
        c.fillStyle = '#e3b04b'; c.fillRect(X + l, Y + t, T - l - rr, T - t - b);
        c.fillStyle = '#b8443a'; c.fillRect(X + l + (l ? 3 : 0), Y + t + (t ? 3 : 0), T - l - rr - (l ? 3 : 0) - (rr ? 3 : 0), T - t - b - (t ? 3 : 0) - (b ? 3 : 0));
        if ((x + y) % 2 === 0) { c.fillStyle = '#f0d27a'; c.fillRect(X + 13, Y + 13, 6, 6); }
        break;
      }
      case 'W': { // 室內牆：下面是地板的那一格畫成木板牆面，其他是深色牆頂
        const face = at(x, y + 1) !== 'W' && y + 1 < h;
        if (face) {
          c.fillStyle = '#e9d3a8'; c.fillRect(X, Y, T, T); c.fillStyle = '#d6bd8d'; for (let k = 0; k < 4; k++) c.fillRect(X + k * 8 + 3, Y, 1, T - 8);
          c.fillStyle = '#7d522a'; c.fillRect(X, Y + T - 8, T, 8); c.fillStyle = '#5e3c1e'; c.fillRect(X, Y + T - 2, T, 2); c.fillStyle = '#8a5a2b'; c.fillRect(X, Y, T, 3);
          if ((x * 5 + y * 3) % 7 === 2) { c.fillStyle = '#6b4320'; c.fillRect(X + 7, Y + 5, 18, 14); c.fillStyle = '#9fd8f5'; c.fillRect(X + 9, Y + 7, 14, 10); c.fillStyle = '#6b4320'; c.fillRect(X + 15, Y + 7, 2, 10); c.fillRect(X + 9, Y + 11, 14, 2); }
        } else { c.fillStyle = '#5a3a24'; c.fillRect(X, Y, T, T); c.fillStyle = '#4a2f1d'; for (let i = 0; i < 4; i++) px(X + r() * 30, Y + r() * 30, '#6b4628', 3); }
        break;
      }
      case 'k': { // 黑森林地面
        c.fillStyle = (mist ? '#615478' : '#2f4a37'); c.fillRect(X, Y, T, T);
        for (let i = 0; i < 9; i++) px(X + r() * 30, Y + r() * 30, r() < .5 ? (mist ? '#554769' : '#263d2d') : (mist ? '#75638d' : '#3b5a42'));
        if (r() < .12) { const mx = X + 6 + r() * 18, my = Y + 8 + r() * 16; c.fillStyle = '#9ff3ff'; c.fillRect(mx, my, 4, 2); c.fillStyle = '#e9fdff'; c.fillRect(mx + 1, my + 2, 2, 3); }
        break;
      }
      case 'g': { // 黑森林草叢（會遇到魔物）
        c.fillStyle = (mist ? '#524a6f' : '#29402f'); c.fillRect(X, Y, T, T);
        for (let i = 0; i < 7; i++) { const gx = X + 2 + r() * 26, gy = Y + 6 + r() * 24; c.fillStyle = (mist ? '#413653' : '#1d3324'); c.fillRect(gx, gy - 8, 2, 8); c.fillRect(gx - 3, gy - 6, 2, 6); c.fillRect(gx + 3, gy - 6, 2, 6); c.fillStyle = (mist ? '#9b83b6' : '#5f8f62'); c.fillRect(gx, gy - 9, 2, 2); }
        break;
      }
      case 'q': { // 黑森林小路
        c.fillStyle = (mist ? '#615478' : '#2f4a37'); c.fillRect(X, Y, T, T); c.fillStyle = (mist ? '#91738a' : '#5c4a35'); c.fillRect(X + 3, Y + 3, T - 6, T - 6);
        const isq = (dx: number, dy: number) => 'q'.includes(at(x + dx, y + dy));
        if (isq(-1, 0)) c.fillRect(X, Y + 3, 4, T - 6); if (isq(1, 0)) c.fillRect(X + T - 4, Y + 3, 4, T - 6); if (isq(0, -1)) c.fillRect(X + 3, Y, T - 6, 4); if (isq(0, 1)) c.fillRect(X + 3, Y + T - 4, T - 6, 4);
        for (let i = 0; i < 5; i++) px(X + 4 + r() * 24, Y + 4 + r() * 24, r() < .5 ? (mist ? '#765d76' : '#4b3b2a') : (mist ? '#ab87a0' : '#6e5a42'));
        break;
      }
      case 'd': { c.fillStyle = '#e8d39c'; c.fillRect(X, Y, T, T); for (let i = 0; i < 8; i++) px(X + r() * 30, Y + r() * 30, r() < .5 ? '#d6bd7f' : '#f3e2b5'); break; }
      default: if (forest) { c.fillStyle = '#1b2e22'; c.fillRect(X, Y, T, T); for (let i = 0; i < 6; i++) px(X + r() * 30, Y + r() * 30, '#24392b'); } else grass(X, Y, ch === 'T');
    }
  }
  tex.refresh();
  return SOLID_GRASS;
}
export function buildIcons(scene: Phaser.Scene) {
  const mk = (key: string, w: number, h: number, f: (c: CanvasRenderingContext2D) => void) => { if (scene.textures.exists(key)) return; const t = scene.textures.createCanvas(key, w, h)!; f(t.getContext()); t.refresh(); };
  mk('shadow', 32, 12, c => { c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(16, 6, 15, 5, 0, 0, 7); c.fill(); });
  mk('glow', 128, 128, c => { const g = c.createRadialGradient(64, 64, 4, 64, 64, 64); g.addColorStop(0, 'rgba(255,220,140,.85)'); g.addColorStop(.4, 'rgba(255,190,90,.35)'); g.addColorStop(1, 'rgba(255,170,60,0)'); c.fillStyle = g; c.fillRect(0, 0, 128, 128); });
  mk('sparkle', 24, 24, c => { c.fillStyle = '#fffbe0'; c.fillRect(11, 2, 2, 20); c.fillRect(2, 11, 20, 2); c.fillStyle = '#ffe17a'; c.fillRect(9, 9, 6, 6); c.fillStyle = '#fff'; c.fillRect(10, 10, 4, 4); c.fillStyle = 'rgba(255,240,170,.6)'; c.fillRect(6, 6, 2, 2); c.fillRect(16, 16, 2, 2); c.fillRect(16, 6, 2, 2); c.fillRect(6, 16, 2, 2); });
  mk('paw', 20, 20, c => { c.fillStyle = '#bff6ff'; c.beginPath(); c.ellipse(10, 13, 5, 4, 0, 0, 7); c.fill(); [[4, 7], [8, 4], [12, 4], [16, 7]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 2.2, 0, 7); c.fill(); }); });
  mk('prints', 30, 22, c => { c.fillStyle = '#5a3a1f'; [[4, 14], [14, 6], [22, 15]].forEach(([x, y]) => { c.fillRect(x, y, 3, 5); c.fillRect(x - 2, y - 3, 2, 3); c.fillRect(x + 1, y - 4, 2, 3); c.fillRect(x + 3, y - 3, 2, 3); }); });
  mk('mark', 26, 30, c => { c.fillStyle = '#5d3a17'; c.beginPath(); c.arc(13, 12, 12, 0, 7); c.fill(); c.fillStyle = '#ffd36e'; c.beginPath(); c.arc(13, 12, 10, 0, 7); c.fill(); c.fillStyle = '#5d3a17'; c.fillRect(11, 4, 4, 11); c.fillRect(11, 17, 4, 4); c.beginPath(); c.moveTo(8, 22); c.lineTo(18, 22); c.lineTo(13, 29); c.fill(); });
  mk('arrow', 22, 18, c => { c.fillStyle = '#5d3a17'; c.beginPath(); c.moveTo(0, 0); c.lineTo(22, 0); c.lineTo(11, 18); c.fill(); c.fillStyle = '#8ff0ff'; c.beginPath(); c.moveTo(4, 2); c.lineTo(18, 2); c.lineTo(11, 14); c.fill(); });
  mk('rock', 52, 40, c => { c.fillStyle = '#6f6a63'; c.beginPath(); c.ellipse(26, 24, 25, 15, 0, 0, 7); c.fill(); c.fillStyle = '#8f8a80'; c.beginPath(); c.ellipse(24, 20, 21, 12, 0, 0, 7); c.fill(); c.fillStyle = '#b1aca1'; c.fillRect(14, 12, 10, 4); c.fillRect(30, 15, 6, 3); c.fillStyle = '#4f4b45'; c.fillRect(8, 30, 36, 3); c.fillStyle = '#6aae4c'; c.fillRect(4, 34, 6, 3); c.fillRect(40, 33, 7, 3); });
  mk('slash', 80, 80, c => { c.strokeStyle = '#fff'; c.lineWidth = 6; c.beginPath(); c.arc(10, 70, 64, -1.4, -0.2); c.stroke(); c.strokeStyle = '#ffe17a'; c.lineWidth = 3; c.beginPath(); c.arc(10, 70, 58, -1.3, -0.3); c.stroke(); });
  mk('vignette', 256, 256, c => { const g = c.createRadialGradient(128, 128, 30, 128, 128, 150); g.addColorStop(0, 'rgba(4,10,24,.18)'); g.addColorStop(.55, 'rgba(4,10,24,.45)'); g.addColorStop(1, 'rgba(2,5,14,.92)'); c.fillStyle = g; c.fillRect(0, 0, 256, 256); });
  mk('fog', 96, 48, c => { const g = c.createRadialGradient(48, 24, 2, 48, 24, 46); g.addColorStop(0, 'rgba(190,120,255,.7)'); g.addColorStop(1, 'rgba(150,80,220,0)'); c.fillStyle = g; c.fillRect(0, 0, 96, 48); });
  mk('chick', 18, 18, c => { c.fillStyle = '#ffe14d'; c.beginPath(); c.arc(9, 11, 6, 0, 7); c.fill(); c.beginPath(); c.arc(9, 6, 4, 0, 7); c.fill(); c.fillStyle = '#ff9a2e'; c.fillRect(12, 6, 3, 2); c.fillStyle = '#3b2a1e'; c.fillRect(10, 5, 1, 1); c.fillStyle = '#ff9a2e'; c.fillRect(7, 16, 1, 2); c.fillRect(10, 16, 1, 2); });
  mk('heart', 18, 16, c => { c.fillStyle = '#ff8fb8'; c.beginPath(); c.arc(5, 5, 5, 0, 7); c.arc(13, 5, 5, 0, 7); c.fill(); c.beginPath(); c.moveTo(0, 6); c.lineTo(18, 6); c.lineTo(9, 16); c.fill(); });
}
