# 外觀服裝（CHAPTER1.md 六-3 貼紙獎勵）：用程式在原本的像素圖上加東西，不影響數值
import numpy as np
from PIL import Image
A='public/assets'
def load(n): return np.array(Image.open(f'{A}/{n}.png').convert('RGBA'))
def save(a,n): Image.fromarray(a).save(f'{A}/{n}.png'); print('saved',n,a.shape)
hero=load('hero_walk'); FW=25
def ears(a):
    a=a.copy()
    for f in range(a.shape[1]//FW):
        sub=a[:,f*FW:(f+1)*FW]; op=sub[...,3]>0
        rows=np.where(op.any(1))[0]; top=rows[0]
        cols=np.where(op[top+3])[0]; l,r=cols[0],cols[-1]; cx=(l+r)/2; hw=(r-l)/2
        for side in (-1,1):
            bx=int(round(cx+side*hw*0.55))
            for k in range(6):  # 三角形耳朵，往上 6 格
                y=top+1-k; w=max(0,3-k//2)
                for x in range(bx-w,bx+w+1):
                    if 0<=x<FW and y>=0:
                        inner = abs(x-bx)<=w-2 and 0<k<4
                        sub[y,x]=[255,170,200,255] if inner else [40,32,44,255]
        # 髮箍
        y=top+2
        for x in range(l+2,r-1):
            if op[y,x]: sub[y,x]=[235,90,140,255]
    return a
def coat(a):
    a=a.copy(); rgb=a[...,:3].astype(int); op=a[...,3]>0
    R,G,B=rgb[...,0],rgb[...,1],rgb[...,2]
    white=op&(R>185)&(G>185)&(B>185)
    navy=op&(B>R+25)&(B>G+10)&(R<110)
    lum=(R+G+B)/3
    for m,base in ((white,(255,226,96)),(navy,(255,200,50))):
        L=lum[m]; k=(0.72+0.28*(L-L.min())/max(1,L.max()-L.min()))[:,None]
        a[m,:3]=np.clip(np.array(base)[None,:]*k,0,255).astype(np.uint8)
    # 雨衣下襬加一條月光色的反光線
    return a
for H in range(1,0,-1): pass
pad=np.zeros((8,hero.shape[1],4),np.uint8)
base=np.concatenate([pad,hero],0)  # 上面多留 8 格給耳朵
save(ears(base),'hero_walk_ears'); save(coat(base),'hero_walk_coat'); save(ears(coat(base)),'hero_walk_coat_ears'); save(base,'hero_walk_pad')
# 夥伴的月光宴會裝：頭上一頂小小的星星宴會帽＋脖子上的月光領結
for n in ('ali','mint','yuzu'):
    a=load(n); a=np.concatenate([np.zeros((10,a.shape[1],4),np.uint8),a],0); op=a[...,3]>0
    rows=np.where(op.any(1))[0]; top=rows[0]; Hh=rows[-1]-top
    cols=np.where(op[top:top+Hh//3].any(0))[0]; cx=int((cols[0]+cols[-1])/2)
    for k in range(10):
        w=k//2; y=top+2-10+k
        for x in range(cx-w,cx+w+1): a[y,x]=[120,90,220,255] if (k+x)%4 else [255,226,110,255]
    a[top-9,cx]=[255,245,170,255]; a[top-10,cx]=[255,245,170,255]
    # 領結
    ny=top+int(Hh*0.42)
    for dx in range(-4,5):
        for dy in range(-2,3):
            if abs(dy)<=abs(dx)//2+ (1 if abs(dx)<=1 else 0):
                x=cx+dx; y=ny+dy
                if op[y,x] or abs(dx)<=1: a[y,x]=[255,230,120,255] if abs(dx)<=1 else [90,110,230,255]
    save(a,n+'_feast')
# 守衛練習對打用的戰鬥圖（把守衛的大圖縮成一般魔物的大小）
from PIL import Image as _I
g=_I.open(f'{A}/guard_big.png'); h=125; g.resize((round(g.width*h/g.height),h),_I.LANCZOS).save(f'{A}/guard_spar.png'); print('saved guard_spar')
