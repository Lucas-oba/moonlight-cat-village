import base64, os, re, json, glob
D='dist'; OUT='single'
os.makedirs(OUT, exist_ok=True)
html=open(f'{D}/index.html',encoding='utf-8').read()
js_path=re.search(r'src="\./(assets/index-[^"]+\.js)"',html).group(1)
css_path=re.search(r'href="\./(assets/index-[^"]+\.css)"',html).group(1)
def uri(p):
    ext=p.rsplit('.',1)[1]; mime={'png':'image/png','jpg':'image/jpeg','woff2':'font/woff2','mp3':'audio/mpeg'}[ext]
    return f'data:{mime};base64,'+base64.b64encode(open(p,'rb').read()).decode()
assets={os.path.basename(p):uri(p) for p in glob.glob(f'{D}/assets/*') if p.endswith(('.png','.jpg'))}
# 音樂／音效和圖片一起分裝進 packN.js（舊的 audio.js 已不再使用，已從 GitHub 刪除）
audio={os.path.basename(p):uri(p) for p in glob.glob(f'{D}/assets/*') if p.endswith('.mp3')}
css=open(f'{D}/{css_path}',encoding='utf-8').read().replace('url(../fonts/huninn.woff2)',f'url({uri(D+"/fonts/huninn.woff2")})')
assert 'huninn.woff2' not in css
js=open(f'{D}/{js_path}',encoding='utf-8').read()
print('</script occurrences', js.count('</script'))
js=js.replace('</script','<\\/script')
html=re.sub(r'\s*<script type="module"[^>]*></script>\s*<link rel="stylesheet"[^>]*>','\n',html)
# 圖片和聲音分裝成好幾個 packN.js（每個檔案不超過約 3MB，GitHub 上傳才不會失敗）
for old in glob.glob(f'{OUT}/pack*.js')+glob.glob(f'{OUT}/audio*.js'): os.remove(old)
items=sorted({**assets, **audio}.items(), key=lambda kv: -len(kv[1]))
packs=[]
for k,v in items:
    for pk in packs:
        if pk['size']+len(v) < 3_000_000: pk['d'][k]=v; pk['size']+=len(v); break
    else: packs.append({'d':{k:v},'size':len(v)})
tags=''
for i,pk in enumerate(packs,1):
    open(f'{OUT}/pack{i}.js','w').write('window.__MCV_ASSETS=Object.assign(window.__MCV_ASSETS||{},'+json.dumps(pk['d'])+');\n')
    tags+=f'<script src="./pack{i}.js"></script>\n'
head=f'<style>{css}</style>\n{tags}'
html=html.replace('</head>',head+'</head>')
html=html.replace('</body>',f'<script type="module">{js}</script>\n</body>')
open(f'{OUT}/index.html','w',encoding='utf-8').write(html)
open(f'{OUT}/.nojekyll','w').close()
print('size', os.path.getsize(f'{OUT}/index.html'), 'packs', [os.path.getsize(f'{OUT}/pack{i}.js') for i in range(1,len(packs)+1)])
