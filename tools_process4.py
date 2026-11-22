# 室內家具（Milestone D）
exec(open('tools_process2.py').read().split("row2('art_src/companions.jpg'")[0])
rgba_all=key('art_src/interior_props.jpg',True); Hh=rgba_all.shape[0]
a=rgba_all[...,3]>0; rowsum=a.sum(1)>2; rs=[];s=None
for y,v in enumerate(rowsum):
    if v and s is None:s=y
    if not v and s is not None: rs.append((s,y));s=None
if s is not None: rs.append((s,Hh))
rs=[r for r in rs if r[1]-r[0]>30]; print('rows',rs)
names=[['f_bed','f_table','f_shelf','f_fireplace','f_barrel'],['f_counter','f_anvil','f_loom','f_flowers','f_stove'],['f_herbs','f_sacks','f_plant','f_cupboard','f_rocker']]
widths=[[70,72,48,64,36],[80,70,64,64,64],[66,56,36,52,40]]
for (y0,y1),nr,wr in zip(rs,names,widths):
    sub=rgba_all[y0:y1]; segs=split_cols(sub,min_gap=14); print(nr,segs)
    for (s,e),n,w in zip(segs,nr,wr): save(sub[:,s:e],n,w=w)
