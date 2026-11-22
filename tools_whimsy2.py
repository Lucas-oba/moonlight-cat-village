# 奇幻 W2：茶杯蝸牛、倒立菇、茶會桌、茶壺、倒立樹、反向路牌
exec(open('tools_process2.py').read().split("row2('art_src/companions.jpg'")[0])
import numpy as np
rgba_all=key('art_src/whimsy2.jpg',True); Hh=rgba_all.shape[0]
a=rgba_all[...,3]>0; rowsum=a.sum(1)>2; rs=[];s=None
for y,v in enumerate(rowsum):
    if v and s is None:s=y
    if not v and s is not None: rs.append((s,y));s=None
if s is not None: rs.append((s,Hh))
rs=[r for r in rs if r[1]-r[0]>30]; print('rows',rs)
names=[['teasnail','flipmush','w_teatable'],['w_teapot','w_ftree','w_rsign']]
widths=[[110,96,112],[26,80,34]]
for (y0,y1),nr,wr in zip(rs,names,widths):
    sub=rgba_all[y0:y1]; segs=split_cols(sub,min_gap=14); print(nr,segs)
    for (s,e),n,w in zip(segs,nr,wr):
        img=sub[:,s:e]
        if n=='flipmush': img=img[::-1]
        if n=='w_rsign': img=img[:,::-1]
        save(img,n,w=w)
# 倒立菇：身體倒立（站在菇傘上），但臉要正的、笑笑的 → 把臉的區域再翻回來
from PIL import Image, ImageOps
_im=Image.open('public/assets/flipmush.png').convert('RGBA'); _b=(25,20,71,39); _im.paste(ImageOps.flip(_im.crop(_b)),_b); _im.save('public/assets/flipmush.png')
