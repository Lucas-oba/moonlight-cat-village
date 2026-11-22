// 把 binpack/*.txt 還原成真正的二進位檔（圖片、音樂、字型）。
// 為什麼要這樣：交接時只能用「文字」上傳到 GitHub，所以圖片／音樂先轉成 base64 文字放在 binpack/。
// 每一行格式：<路徑>\t<sha256>\t<base64>
// 用法：node tools/restore_binaries.mjs            → 全部還原（已存在且內容相同的檔案會跳過）
//       node tools/restore_binaries.mjs --if-missing → npm install 時自動執行；沒有 binpack/ 就什麼都不做
import fs from 'fs'; import path from 'path'; import crypto from 'crypto';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const dir = path.join(root, 'binpack');
if (!fs.existsSync(dir)) { if (!process.argv.includes('--if-missing')) console.log('沒有 binpack/，不需要還原。'); process.exit(0); }
let wrote = 0, same = 0, bad = 0;
const entries = new Map(); // 路徑 → { sha, parts[] }（太大的檔案會分成好幾段，第 4 欄是「第幾段/共幾段」）
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.txt')).sort()) {
  for (const line of fs.readFileSync(path.join(dir, f), 'utf8').split('\n')) {
    if (!line.trim()) continue;
    const [rel, sha, b64, part] = line.split('\t'); const e = entries.get(rel) ?? { sha, parts: [] }; entries.set(rel, e);
    const k = part ? Number(part.split('/')[0]) - 1 : 0; e.parts[k] = b64;
  }
}
{
  for (const [rel, { sha, parts }] of entries) {
    const buf = Buffer.from(parts.join(''), 'base64');
    if (crypto.createHash('sha256').update(buf).digest('hex') !== sha) { console.error('sha256 不符：', rel); bad++; continue; }
    const out = path.join(root, rel);
    if (fs.existsSync(out) && crypto.createHash('sha256').update(fs.readFileSync(out)).digest('hex') === sha) { same++; continue; }
    fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, buf); wrote++;
  }
}
console.log(`binpack 還原：寫入 ${wrote} 個、已存在 ${same} 個、錯誤 ${bad} 個`);
if (bad) process.exit(1);
