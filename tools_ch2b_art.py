# 0.10 素材：稱號徽章、慢慢、迴聲蝙蝠、苔苔石、苔角（頭目／不痛了）、嘆氣藤、場景物件、迴聲谷與苔角窩戰鬥背景、章末圖
# 背景色不一定是洋紅（紫色東西用青色或綠色背景），所以用「四個角的顏色」去背。
import sys; sys.argv=['x']
exec(open('tools_process.py').read().split('# hero: 4 dirs')[0])
import numpy as np
from PIL import Image
from scipy import ndimage
def key_bg(path, th=70, holes=False, spill=None):
    im=np.array(Image.open(path).convert('RGB')).astype(int); h,w,_=im.shape
    c=np.concatenate([im[:8,:8].reshape(-1,3),im[:8,-8:].reshape(-1,3),im[-8:,:8].reshape(-1,3),im[-8:,-8:].reshape(-1,3)])
    bgc=np.median(c,0); d=np.sqrt(((im-bgc)**2).sum(-1)); bg=d<th
    lab,n=ndimage.label(bg); edge=set(np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]])))-{0}
    keep=np.isin(lab,list(edge))
    if holes:  # 被圍起來的背景色區塊（樹根中間、藤蔓縫隙）也去掉
        sizes=ndimage.sum(bg,lab,range(n+1)); keep|=np.isin(lab,[i for i in range(1,n+1) if sizes[i]>=12])
    bg=ndimage.binary_opening(keep,iterations=1)
    if spill=='cyan': R,G,B=im[...,0],im[...,1],im[...,2]; bg|=(np.minimum(G,B)-R>55)
    if spill=='green': R,G,B=im[...,0],im[...,1],im[...,2]; bg|=(G-np.maximum(R,B)>70)
    near=ndimage.binary_dilation(bg,iterations=2)&~bg
    a=np.where(bg,0,255).astype(np.uint8); out=np.dstack([im.astype(np.uint8),a])
    out[near&(d<th*1.6),3]=0
    return out
def rows_of(rgba,min_h=30):
    a=rgba[...,3]>0; rowsum=a.sum(1)>2; rs=[];s=None
    for y,v in enumerate(rowsum):
        if v and s is None:s=y
        if not v and s is not None: rs.append((s,y));s=None
    if s is not None: rs.append((s,rgba.shape[0]))
    return [r for r in rs if r[1]-r[0]>min_h]
def row_save(rgba,names,sizes,min_gap=14,by='h'):
    segs=split_cols(rgba,min_gap=min_gap); print(names,segs); assert len(segs)==len(names),(segs,names)
    for (s,e),n,sz in zip(segs,names,sizes):
        ns=n if isinstance(n,tuple) else (n,); ss=sz if isinstance(sz,tuple) else (sz,)
        for nn,v in zip(ns,ss): save(rgba[:,s:e],nn,**{by:v})
row_save(key_bg('art_src/c10_badges.jpg'),[f'badge_t{i}' for i in range(5)],[96]*5,min_gap=20)
row_save(key_bg('art_src/c10_manman.jpg'),['manman','manman_big'],[50,165],min_gap=20)
row_save(key_bg('art_src/c10_monsters.jpg'),['echobat','mossrock'],[90,95],min_gap=20)
save(key_bg('art_src/c10_boss.jpg'),'mossantler_boss',h=250)
save(key_bg('art_src/c10_vine.jpg',holes=True,spill='green'),'sighvine_boss',h=130)
save(key_bg('art_src/c10_calm.jpg'),'mossantler_calm',h=150)
rgba=key_bg('art_src/c10_props.jpg',holes=True,spill='cyan'); rs=rows_of(rgba); print('props rows',rs); assert len(rs)==2
for (y0,y1),nr,wr in zip(rs,[['c2_thorn','c2_boat','c2_rootwall','c2_sleepflower'],['c2_softmoss','c2_cake','c2_birdhouse','c2_seed']],[[40,90,120,40],[44,60,44,26]]):
    row_save(rgba[y0:y1],nr,wr,by='w')
for n in ['echobg','denbg']: Image.open(f'art_src/{n}.jpg').convert('RGB').save(f'{OUT}/{n}.jpg',quality=85)
Image.open('art_src/c2_ending.jpg').convert('RGB').resize((390,693),Image.LANCZOS).save(f'{OUT}/c2_ending.jpg',quality=88)
