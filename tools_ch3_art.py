# 第三章素材：米舟、小穗、點點、蘆哨球、泡腳栗、帆耳（頭目／不痛了）、紫結舊橋索、道具、戰鬥背景、章末圖
# 去背函式沿用 tools_ch2b_art.py（用四個角的顏色去背）
src=open('tools_ch2b_art.py',encoding='utf-8').read(); exec(src.split("row_save(key_bg('art_src/c10_badges.jpg')")[0])
row_save(key_bg('art_src/c3_mizhou.jpg'),['mizhou','mizhou_big'],[50,165],min_gap=20)
row_save(key_bg('art_src/c3_kids.jpg'),['xiaosui','xiaosui_big','diandian','diandian_big'],[44,165,46,165],min_gap=12)
row_save(key_bg('art_src/c3_monsters.jpg'),['reedpuff','footchestnut'],[80,80],min_gap=20)
boss=key_bg('art_src/c3_boss.jpg',holes=True); save(boss,'faner_boss',h=230); save(boss,'faner_map',h=64)
save(key_bg('art_src/c3_knot.jpg',holes=True,spill='green'),'ropeknot_boss',h=130)
save(key_bg('art_src/c3_calm.jpg',holes=True),'faner_calm',h=160)
rgba=key_bg('art_src/c3_props.jpg',holes=True,spill='cyan'); rs=rows_of(rgba); print('props rows',rs); assert len(rs)==2
for (y0,y1),nr,wr in zip(rs,[['c3_flag','c3_letter','c3_bucket','c3_seedpot'],['c3_reeds','c3_ferry','c3_clappers','c3_post']],[[40,34,32,32],[52,92,30,30]]):
    row_save(rgba[y0:y1],nr,wr,by='w')
for n in ['reedbg','bridgebg']: Image.open(f'art_src/{n}.jpg').convert('RGB').save(f'{OUT}/{n}.jpg',quality=85)
Image.open('art_src/c3_ending.jpg').convert('RGB').resize((390,693),Image.LANCZOS).save(f'{OUT}/c3_ending.jpg',quality=88)
