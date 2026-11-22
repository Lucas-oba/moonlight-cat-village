# 第一章後半的新素材（夥伴、哥布林、森林魔物、頭目、森林道具）
import sys; sys.argv=['x']
exec(open('tools_process.py').read().split('# hero: 4 dirs')[0])
def row2(path,names,heights,min_gap=8,cuts=()):
    rgba=key(path); segs=split_cols(rgba,min_gap)
    out=[]
    for s0,e0 in segs:
        pts=[s0]+[c for c in cuts if s0<c<e0]+[e0]; out+=[(pts[i],pts[i+1]) for i in range(len(pts)-1)]
    segs=out; print(path,segs)
    assert len(segs)==len(names),(len(segs),names)
    for (s,e),n,h in zip(segs,names,heights):
        for nn,hh in zip(n if isinstance(n,tuple) else (n,), h if isinstance(h,tuple) else (h,)): save(rgba[:,s:e],nn,h=hh)
row2('art_src/companions.jpg',[('ali','ali_big'),('mint','mint_big'),('yuzu','yuzu_big'),('ginkgo','ginkgo_big')],[(50,160),(52,165),(54,170),(54,165)])
row2('art_src/goblins.jpg',[('gugu','gugu_big','goblin'),('sprout','sprout_big'),('chief','chief_big'),('fgoblin','fgoblin_big','fgoblin_b')],[(40,140,120),(30,105),(56,170),(44,150,125)],cuts=(359,909))
rgba=key('art_src/boss_rock.jpg'); save(rgba,'rock_boss',h=260); save(rgba,'rock_map',h=110); save(rgba,'rock_big',h=200)
row2('art_src/forest_enemies.jpg',['wolf','mushroom','bat'],[120,100,90],min_gap=20,cuts=(807,))
im=Image.open('art_src/forestbg.jpg').convert('RGB'); im.save(f'{OUT}/forestbg.jpg',quality=85)
rgba_all=key('art_src/forest_props.jpg',True); Hh=rgba_all.shape[0]
a=rgba_all[...,3]>0; rowsum=a.sum(1)>2; rs=[];s=None
for y,v in enumerate(rowsum):
    if v and s is None:s=y
    if not v and s is not None: rs.append((s,y));s=None
if s is not None: rs.append((s,Hh))
rs=[r for r in rs if r[1]-r[0]>30]; print('rows',rs)
names=[['ftree','glowshroom','tent','campfire'],['log','veggies','lantern_off','lantern_on'],['cabbage','sign','gate','stump']]
widths=[[76,44,96,40],[120,52,26,26],[30,32,64,34]]
for (y0,y1),nr,wr in zip(rs,names,widths):
    sub=rgba_all[y0:y1]; segs=split_cols(sub,min_gap=14); print(nr,segs)
    for (s,e),n,w in zip(segs,nr,wr): save(sub[:,s:e],n,w=w)
