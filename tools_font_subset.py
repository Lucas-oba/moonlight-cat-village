# 重新產生遊戲用的字型子集 public/fonts/huninn.woff2（jf 粉圓 Huninn，OFL 授權）。
# 收集 src/、index.html 裡出現的所有字，加上常用標點、注音、英數，從 art_src/huninn.ttf 切出子集。
# 需要：pip install fonttools brotli
# 用法：python3 tools_font_subset.py          → 產生新的子集
#       python3 tools_font_subset.py --check  → 只檢查有哪些字不在目前的子集裡
import glob, sys
from fontTools.ttLib import TTFont
from fontTools import subset
SRC = glob.glob('src/**/*.ts', recursive=True) + glob.glob('src/**/*.css', recursive=True) + ['index.html']
chars = set()
for p in SRC: chars |= set(open(p, encoding='utf-8').read())
chars |= set('，。、！？：；「」『』（）《》〈〉…—～・＋－×÷＝％０１２３４５６７８９') | set(chr(c) for c in range(0x20, 0x7f)) | set(chr(c) for c in range(0x3105, 0x312a)) | set('ˊˇˋ˙')
full = TTFont('art_src/huninn.ttf'); fcmap = full.getBestCmap()
want = sorted(c for c in chars if ord(c) in fcmap)
if '--check' in sys.argv:
    cur = TTFont('public/fonts/huninn.woff2').getBestCmap()
    miss = [c for c in want if ord(c) not in cur]
    print('目前子集', len(cur), '字；缺少', len(miss), '字：', ''.join(miss)); sys.exit(1 if miss else 0)
opts = subset.Options(); opts.flavor = 'woff2'; opts.layout_features = ['*']
s = subset.Subsetter(opts); s.populate(unicodes=[ord(c) for c in want]); s.subset(full)
subset.save_font(full, 'public/fonts/huninn.woff2', opts)
print('寫入 public/fonts/huninn.woff2，共', len(want), '字')
