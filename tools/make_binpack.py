# 交接用：把二進位檔（public/、art_src/、docs/screenshots/）轉成 binpack/*.txt（base64 文字），每個檔案約 4.5MB 以下。
# 之後有 git 推送權限時，直接提交真正的二進位檔就好，可以把 binpack/ 刪掉。
import base64, hashlib, os, sys
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BIN = ('.png', '.jpg', '.jpeg', '.mp3', '.woff2', '.ttf', '.ogg', '.wav')
groups = {'public': ['public'], 'art_src': ['art_src'], 'docs': ['docs/screenshots']}
out = os.path.join(root, 'binpack'); os.makedirs(out, exist_ok=True)
for f in os.listdir(out):
    if f.endswith('.txt'): os.remove(os.path.join(out, f))
LIMIT = 4_500_000
for g, dirs in groups.items():
    lines = []
    for d in dirs:
        for dp, _, fs in os.walk(os.path.join(root, d)):
            for fn in sorted(fs):
                if not fn.lower().endswith(BIN): continue
                p = os.path.join(dp, fn); rel = os.path.relpath(p, root).replace(os.sep, '/')
                b = open(p, 'rb').read()
                sha = hashlib.sha256(b).hexdigest(); e = base64.b64encode(b).decode(); C = 3_000_000
                if len(e) <= C: lines.append(f"{rel}\t{sha}\t{e}\n")
                else:  # 太大的檔案切成好幾段：第 4 欄是「第幾段/共幾段」
                    n = (len(e) + C - 1) // C
                    for k in range(n): lines.append(f"{rel}\t{sha}\t{e[k*C:(k+1)*C]}\t{k+1}/{n}\n")
    parts, cur, size = [], [], 0
    for l in sorted(lines):
        if cur and size + len(l) > LIMIT: parts.append(cur); cur, size = [], 0
        cur.append(l); size += len(l)
    if cur: parts.append(cur)
    for i, pl in enumerate(parts, 1):
        open(os.path.join(out, f'{g}_{i:02d}.txt'), 'w').write(''.join(pl))
        print(f'{g}_{i:02d}.txt', sum(map(len, pl)), len(pl))
