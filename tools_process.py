import numpy as np
from PIL import Image
from scipy import ndimage
import os
OUT='public/assets'
def key(path,glob_loose=False):
    im=np.array(Image.open(path).convert('RGB')).astype(int)
    R,G,B=im[...,0],im[...,1],im[...,2]
    mag=np.minimum(R,B)-G
    loose=(mag>60)&(R>150)
    strict=(mag>130)&(R>190)
    lab,n=ndimage.label(loose)
    edge=set(np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]])))-{0}
    bg=np.isin(lab,list(edge))|strict
    if glob_loose: bg|=loose
    bg=ndimage.binary_opening(bg,iterations=1)|strict
    a=np.where(bg,0,255).astype(np.uint8)
    rgba=np.dstack([im.astype(np.uint8),a])
    # despill: pixels adjacent to bg with magenta tint -> pull toward neutral
    near=ndimage.binary_dilation(bg,iterations=2)&~bg
    sp=near&(mag>10)
    rgba[sp,0]=np.minimum(rgba[sp,0],(G[sp]+mag[sp]//3).clip(0,255)).astype(np.uint8)
    rgba[sp,2]=np.minimum(rgba[sp,2],(G[sp]+mag[sp]//3).clip(0,255)).astype(np.uint8)
    return rgba
def split_cols(rgba,min_gap=8):
    a=rgba[...,3]>0
    col=a.sum(0)>2
    segs=[];s=None
    for x,v in enumerate(col):
        if v and s is None:s=x
        if not v and s is not None:
            segs.append((s,x));s=None
    if s is not None:segs.append((s,len(col)))
    # merge segments separated by small gaps
    m=[]
    for seg in segs:
        if m and seg[0]-m[-1][1]<min_gap: m[-1]=(m[-1][0],seg[1])
        else: m.append(seg)
    return [s for s in m if s[1]-s[0]>20]
def crop(rgba):
    a=rgba[...,3]>0
    ys,xs=np.where(a)
    return rgba[ys.min():ys.max()+1,xs.min():xs.max()+1]
def clean_small(rgba):
    a=rgba[...,3]>0
    lab,n=ndimage.label(a)
    if n>1:
        sizes=ndimage.sum(a,lab,range(1,n+1))
        big=max(sizes)
        for i,s in enumerate(sizes):
            if s<big*0.02: rgba[lab==i+1,3]=0
    return rgba
def save(rgba,name,h=None,w=None):
    rgba=crop(clean_small(rgba.copy()))
    im=Image.fromarray(rgba,'RGBA')
    if h: im=im.resize((max(1,round(im.width*h/im.height)),h),Image.LANCZOS)
    if w: im=im.resize((w,max(1,round(im.height*w/im.width))),Image.LANCZOS)
    arr=np.array(im); arr[...,3]=np.where(arr[...,3]>110,255,0)
    Image.fromarray(arr).save(f'{OUT}/{name}.png'); print(name,im.size)
def row(path,names,heights,cuts=None):
    rgba=key(path); segs=split_cols(rgba)
    if cuts:
        out=[]
        for s,e in segs:
            c=[x for x in cuts if s<x<e]
            pts=[s]+c+[e]
            out+= [(pts[i],pts[i+1]) for i in range(len(pts)-1)]
        segs=out
    print(path,segs)
    assert len(segs)==len(names),(len(segs),names)
    for (s,e),n,h in zip(segs,names,heights): save(rgba[:,s:e],n,h=h)
# hero: 4 dirs, fixed frame 48 tall, pack as spritesheet with common frame size bottom aligned
rgba=key('art_src/hero.jpg'); segs=split_cols(rgba); print('hero',segs)
frames=[crop(clean_small(rgba[:,s:e].copy())) for s,e in segs]
H=max(f.shape[0] for f in frames); scale=56/H
ims=[Image.fromarray(f,'RGBA') for f in frames]
ims=[i.resize((round(i.width*scale),round(i.height*scale)),Image.LANCZOS) for i in ims]
FW=max(i.width for i in ims)+2; FH=58
sheet=Image.new('RGBA',(FW*4,FH))
for k,i in enumerate(ims): sheet.paste(i,(k*FW+(FW-i.width)//2,FH-i.height-1))
arr=np.array(sheet); arr[...,3]=np.where(arr[...,3]>110,255,0); Image.fromarray(arr).save(f'{OUT}/hero.png'); print('hero frame',FW,FH)
open(f'{OUT}/hero.json','w').write('{"frameWidth":%d,"frameHeight":%d}'%(FW,FH))
# big hero portrait for battle/dialog
save(rgba[:,segs[0][0]:segs[0][1]],'hero_big',h=150)
row('art_src/cats_main.jpg',['whitecat','elder','guard'],[34,64,80])
rgba=key('art_src/cats_main.jpg');segs=split_cols(rgba)
for (s,e),n,h in zip(segs,['whitecat_big','elder_big','guard_big'],[110,170,190]): save(rgba[:,s:e],n,h=h)
row('art_src/villagers.jpg',['merchant','innkeeper','farmer','mochimom','douhua'],[58,58,60,58,36],cuts=[797])
rgba=key('art_src/villagers.jpg');segs=[(52,260),(272,525),(540,797),(797,1050),(1070,1223)]
for (s,e),n,h in zip(segs,['merchant_big','innkeeper_big','farmer_big','mochimom_big','douhua_big'],[170,170,175,170,110]): save(rgba[:,s:e],n,h=h)
rgba=key('art_src/slime.jpg'); save(rgba,'slime',w=150); save(rgba,'slime_small',w=40)
# props grid 4x3
rgba_n=key('art_src/props.jpg'); rgba=key('art_src/props.jpg',True); Hh=rgba.shape[0]
a=rgba[...,3]>0; rowsum=a.sum(1)>2
rs=[];s=None
for y,v in enumerate(rowsum):
    if v and s is None:s=y
    if not v and s is not None: rs.append((s,y));s=None
if s is not None: rs.append((s,Hh))
rs=[r for r in rs if r[1]-r[0]>30]; print('prop rows',rs)
names=[['house','inn','elderhouse','fountain'],['tree','fence','fishrack','stall'],['hay','flowerpot','dummy','lamp']]
widths=[[110,130,110,84],[72,64,64,84],[40,34,40,30]]
for (y0,y1),nr,wr in zip(rs,names,widths):
    sub=rgba[y0:y1]; segs=split_cols(sub,min_gap=14); print(nr,segs)
    for (s,e),n,w in zip(segs,nr,wr): save((rgba_n[y0:y1] if n=='flowerpot' else sub)[:,s:e],n,w=w)
for n in ['prologue1','prologue2','prologue3','battlebg','title']:
    im=Image.open(f'art_src/{n}.jpg').convert('RGB'); im.save(f'{OUT}/{n}.jpg',quality=85); print(n,im.size)
