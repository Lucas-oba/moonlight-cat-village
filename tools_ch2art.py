# 第二章 0.9 素材：布丁、蓬蓬、小松鼠寶寶、五隻新魔物、苔角（睡著）、場景物件、大樹、紫霧戰鬥背景
import sys; sys.argv=['x']
exec(open('tools_process.py').read().split('# hero: 4 dirs')[0])
import numpy as np
from PIL import Image
def rows_of(rgba,min_h=30):
    a=rgba[...,3]>0; rowsum=a.sum(1)>2; rs=[];s=None
    for y,v in enumerate(rowsum):
        if v and s is None:s=y
        if not v and s is not None: rs.append((s,y));s=None
    if s is not None: rs.append((s,rgba.shape[0]))
    return [r for r in rs if r[1]-r[0]>min_h]
def sheet(path,names,sizes,min_gap=14,loose=True):
    rgba=key(path,loose); rs=rows_of(rgba); print(path,'rows',rs)
    assert len(rs)==len(names),(rs,names)
    for (y0,y1),nr,sr in zip(rs,names,sizes):
        sub=rgba[y0:y1]; segs=split_cols(sub,min_gap=min_gap); print(' ',nr,segs)
        assert len(segs)==len(nr),(segs,nr)
        for (s,e),n,sz in zip(segs,nr,sr):
            ns=n if isinstance(n,tuple) else (n,); ss=sz if isinstance(sz,tuple) else (sz,)
            for nn,hh in zip(ns,ss): save(sub[:,s:e],nn,h=hh)
# 角色：地圖小圖約 50px 高（夥伴同級）、大圖約 165px
sheet('art_src/ch2_chars.jpg',[[('pudding','pudding_big'),('pengpeng','pengpeng_big'),'squirrelkid']],[[(52,165),(48,150),30]],min_gap=4)
# 魔物戰鬥圖
sheet('art_src/ch2_monsters.jpg',[['mistpuff','thornling','cryshroom','mistwolf','yarnweasel']],[[80,90,95,120,95]],min_gap=20)
# 苔角（睡著，地圖上用）
rgba=key('art_src/ch2_mossantler.jpg',True); save(rgba,'mossantler_map',h=150)
# 大樹
rgba=key('art_src/ch2_bigtree.jpg',True); save(rgba,'c2_bigtree',h=300)
# 場景物件（依寬度）
rgba=key('art_src/ch2_props.jpg',True); rs=rows_of(rgba); print('props rows',rs)
names=[['c2_house_broken','c2_house_fixed','c2_door'],['c2_vine','c2_net','c2_mosslog','c2_cloudline'],['c2_lamp_off','c2_lamp_on','c2_planks','c2_footprint']]
widths=[[100,100,56],[72,40,90,96],[26,26,56,30]]
for (y0,y1),nr,wr in zip(rs,names,widths):
    sub=rgba[y0:y1]; segs=split_cols(sub,min_gap=14); print(' ',nr,segs); assert len(segs)==len(nr)
    for (s,e),n,w in zip(segs,nr,wr): save(sub[:,s:e],n,w=w)
Image.open('art_src/mistbg.jpg').convert('RGB').save(f'{OUT}/mistbg.jpg',quality=85)
# 苔角的紫色藤蔓和小鈴鐺接近洋紅色，用比較嚴格的去背重做
def key_strict(path,th=150):
    im=np.array(Image.open(path).convert('RGB')).astype(int); R,G,B=im[...,0],im[...,1],im[...,2]
    mag=np.minimum(R,B)-G; bg=(mag>th)&(R>190)
    lab,n=ndimage.label(bg); edge=set(np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]])))-{0}
    bg=np.isin(lab,list(edge)); bg=ndimage.binary_opening(bg,iterations=1)
    near=ndimage.binary_dilation(bg,iterations=2)&~bg; a=np.where(bg,0,255).astype(np.uint8)
    out=np.dstack([im.astype(np.uint8),a]); sp=near&(mag>110)
    out[sp,3]=0
    return out
save(key_strict('art_src/ch2_mossantler.jpg'),'mossantler_map',h=150)
