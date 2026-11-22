# 奇幻內容（W1/W2）：圓圓、露露、捲捲 + 奇妙道具
exec(open('tools_process2.py').read().split("row2('art_src/companions.jpg'")[0])
row2('art_src/whimsy_chars.jpg',[('yuanyuan','yuanyuan_big'),('lulu','lulu_big'),('juanjuan','juanjuan_big')],[(40,140),(46,155),(52,165)],min_gap=10)
rgba_all=key('art_src/whimsy_props.jpg',True); Hh=rgba_all.shape[0]
a=rgba_all[...,3]>0; rowsum=a.sum(1)>2; rs=[];s=None
for y,v in enumerate(rowsum):
    if v and s is None:s=y
    if not v and s is not None: rs.append((s,y));s=None
if s is not None: rs.append((s,Hh))
rs=[r for r in rs if r[1]-r[0]>30]; print('rows',rs)
names=[['w_clock','w_shelf','w_dew','w_cookie'],['w_hedge','w_sunflower','w_tulip','w_bell'],['w_circle','w_mushflower','w_gear','w_ladder']]
widths=[[44,72,24,26],[72,44,40,40],[76,60,40,30]]
for (y0,y1),nr,wr in zip(rs,names,widths):
    sub=rgba_all[y0:y1]; segs=split_cols(sub,min_gap=14); print(nr,segs)
    for (s,e),n,w in zip(segs,nr,wr): save(sub[:,s:e],n,w=w)
