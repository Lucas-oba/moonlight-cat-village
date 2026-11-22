import type { ItemDef } from './types';
// 數值皆暫定（CHAPTER1.md）
export const ITEMS: Record<string, ItemDef> = {
  cookie: { id: 'cookie', name: '小魚乾餅乾', kind: 'heal', desc: '香香脆脆的小魚乾餅乾。回復 20 HP。', heal: 20, price: 10, battle: true },
  jelly: { id: 'jelly', name: '黏黏果凍', kind: 'material', desc: '史萊姆留下的果凍，Q 彈 Q 彈的。是魔物素材。' },
  wooden_sword: { id: 'wooden_sword', name: '小木劍', kind: 'weapon', desc: '橘貓守衛送的小木劍，會發出淡淡月光。攻擊 +2。', atk: 2 },
  moon_scale: { id: 'moon_scale', name: '月光鱗粉', kind: 'collect', desc: '月光蝴蝶的鱗粉，亮晶晶的。豆花送的禮物。' },
  courage_badge: { id: 'courage_badge', name: '勇氣徽章', kind: 'accessory', desc: '藏在大石頭下的舊徽章。拿著它，心裡就會湧出一點點勇氣。防禦 +1。', bonus: { def: 1 } },
  sweet_potato: { id: 'sweet_potato', name: '烤番薯', kind: 'heal', desc: '番薯伯種的番薯，烤得香香甜甜。回復 30 HP。', heal: 30, price: 18, battle: true },
  herb_candy: { id: 'herb_candy', name: '薄荷糖', kind: 'heal', desc: '銀杏婆婆做的草藥糖，涼涼的。回復 15 HP。', heal: 15, price: 7, battle: true },
  herb_tea: { id: 'herb_tea', name: '香草茶', kind: 'heal', desc: '暖暖的香草茶。回復 40 HP。', heal: 40, price: 25, battle: true },
  goblin_drawing: { id: 'goblin_drawing', name: '哥布林的畫', kind: 'key', desc: '用炭筆畫的圖：一群哥布林站在大樹下，大樹後面塗得黑黑的。' },
  forest_mushroom: { id: 'forest_mushroom', name: '森林蘑菇', kind: 'material', desc: '黑森林裡發光的小蘑菇。是素材。' },
  wolf_fur: { id: 'wolf_fur', name: '野狼的毛', kind: 'material', desc: '灰藍色、蓬蓬的毛。是素材。' },
  moon_flower: { id: 'moon_flower', name: '月見花', kind: 'collect', desc: '只在月光下開的小白花。薄荷說可以做藥。' },
  rock_tooth: { id: 'rock_tooth', name: '巨岩的木牙飾', kind: 'accessory', desc: '巨岩送的木頭牙齒項鍊。戴著它，好像有人在保護妳。HP +10。', bonus: { hp: 10 } },
  chick_feather: { id: 'chick_feather', name: '小雞的羽毛', kind: 'collect', desc: '黃黃軟軟的羽毛。小雞送的謝禮。' },
  moon_sword: { id: 'moon_sword', name: '月光木劍', kind: 'weapon', desc: '黑炭師傅用月光礦石強化的木劍，會發出月光。攻擊 +5。', atk: 5 },
  moon_ore: { id: 'moon_ore', name: '月光礦石', kind: 'material', desc: '黑森林裡會發光的石頭，摸起來涼涼的。' },
  sweet_herb: { id: 'sweet_herb', name: '香香草', kind: 'material', desc: '草原上的香草，聞起來好舒服。' },
  silver_fish: { id: 'silver_fish', name: '銀光小魚', kind: 'material', desc: '小溪裡亮晶晶的小魚。' },
  iron_pot: { id: 'iron_pot', name: '大鐵鍋', kind: 'key', desc: '黑炭師傅借的大鐵鍋，好重。' },
  fish_soup: { id: 'fish_soup', name: '月光魚湯', kind: 'heal', desc: '奶油老闆娘的招牌湯。全隊各回復 35 HP。', heal: 35, healAll: true, price: 40, battle: true },
  crate: { id: 'crate', name: '招財的貨箱', kind: 'key', desc: '寫著「划算喵」的木箱子。' },
  smoke_yarn: { id: 'smoke_yarn', name: '煙霧毛線球', kind: 'material', desc: '丟出去會冒煙的毛線球。（第一章先當收藏品）' },
  map_piece: { id: 'map_piece', name: '舊地圖碎片', kind: 'key', desc: '番薯伯年輕時畫的地圖，指向草原北邊的灌木叢。' },
  moon_berry: { id: 'moon_berry', name: '月光莓', kind: 'heal', desc: '在月光下長大的莓果。全隊各回復 25 HP。', heal: 25, healAll: true, battle: true },
  clover_clip: { id: 'clover_clip', name: '四葉草髮夾', kind: 'accessory', desc: '棉花送的髮夾。速度 +1。', bonus: { spd: 1 } },
  cotton_letter: { id: 'cotton_letter', name: '棉花的信', kind: 'key', desc: '粉紅色的信封，上面畫了一朵小花。' },
  mail: { id: 'mail', name: '柚子的信', kind: 'key', desc: '柚子要送的信。' },
  paw_shield: { id: 'paw_shield', name: '小貓掌盾', kind: 'accessory', desc: '阿栗專用的盾牌，上面有歪歪的貓掌印。阿栗防禦 +3。', bonus: { who: 'ali', def: 3 } },
  herb_note: { id: 'herb_note', name: '草藥筆記', kind: 'key', desc: '銀杏婆婆年輕時寫的草藥筆記的一頁。' },
  post_badge: { id: 'post_badge', name: '旅行郵差徽章', kind: 'accessory', desc: '柚子爸爸的徽章。柚子速度 +2。', bonus: { who: 'yuzu', spd: 2 } },
  postcard: { id: 'postcard', name: '柚子的明信片', kind: 'key', desc: '柚子寫給爸爸的明信片。' },
  mushroom_soup: { id: 'mushroom_soup', name: '蘑菇番薯湯', kind: 'key', desc: '咕咕第一次做的湯。鹽好像放太多了。' },
  jerky: { id: 'jerky', name: '肉乾', kind: 'material', desc: '香香的肉乾。帶在身上，野狼會比較願意聽妳說話。' },
  collector_pin: { id: 'collector_pin', name: '貼紙收藏家胸針', kind: 'accessory', desc: '長老送的胸針。觀察力 +1。地圖上有還看不到的閃光點時，胸針會閃一下提醒妳。' },
  cat_ears: { id: 'cat_ears', name: '貓耳髮箍', kind: 'collect', desc: '可愛的貓耳朵髮箍。（外觀）' },
  raincoat: { id: 'raincoat', name: '月光雨衣', kind: 'collect', desc: '黃色的小雨衣，會反射月光。（外觀）' },
  yarn_ball: { id: 'yarn_ball', name: '毛線球', kind: 'collect', desc: '掉在路上的毛線球。編織店的貓奶奶好像在找。' },
  star_candy: { id: 'star_candy', name: '星星糖', kind: 'heal', desc: '小學堂的獎品，甜甜的。回復 25 HP。', heal: 25, battle: true },
  sticker_book: { id: 'sticker_book', name: '喵喵貼紙簿', kind: 'key', desc: '做好事、交朋友、發現祕密，都會得到貼紙喔。' },
};
// 喵喵貼紙簿：收藏冊，沒有上限。總數 = 這裡定義的貼紙數量，之後新增貼紙（例如新章節）總數會自動往上加。
// 每一類（村民、魔物、風景…）在畫面上每 15 張自動分成一頁。
export const STICKER_PAGES: { id: string; name: string; ids: string[] }[] = [
  { id: 'village', name: '村民頁', ids: ['douhua_home', 'ali_join', 'mint_join', 'yuzu_join', 'chick_saved', 'sprout_saved', 'apology', 'letter_thanks', 'smithy_fire', 'fish_soup', 'merchant_luck', 'berry_taste', 'explorer', 'postcard', 'rock_friend'] },
  { id: 'monster', name: '魔物頁', ids: ['slime_talk', 'slime_defeat', 'goblin_talk', 'goblin_defeat', 'bat_talk', 'bat_defeat', 'fgoblin_talk', 'fgoblin_defeat', 'wolf_talk', 'wolf_defeat', 'mushroom_talk', 'mushroom_defeat'] },
  { id: 'scene', name: '風景頁', ids: ['meadow_day', 'meadow_night', 'forest_view', 'camp_fire', 'plaza_night', 'bell_view', 'orchard_night', 'nori_fish', 'windmill_top', 'tallest_tree', 'moon_feast', 'lantern_road'] },
  { id: 'secret', name: '祕密頁', ids: ['moon_paw', 'rock_badge', 'reflection', 'prophecy', 'windmill_box', 'spring', 'secret_path', 'birdnest', 'whitecat_roof1', 'whitecat_roof2', 'whitecat_roof3', 'nap_cat', 'charcoal_secret', 'goblin_drawing', 'quiz_star'] },
  { id: 'shiny', name: '閃亮頁', ids: ['shiny_slime', 'shiny_goblin', 'shiny_bat', 'shiny_fgoblin', 'shiny_wolf', 'shiny_mushroom'] },
];
export const STICKERS: Record<string, string> = {
  douhua_home: '豆花回家了', ali_join: '阿栗加入了', mint_join: '薄荷加入了', yuzu_join: '小郵差柚子', chick_saved: '救了小雞', sprout_saved: '救出小豆芽',
  apology: '對不起與沒關係', letter_thanks: '謝謝妳記得', smithy_fire: '鍋爐又點火了', fish_soup: '月光魚湯', merchant_luck: '幸運貓', berry_taste: '就是這個味道', explorer: '探險隊榮譽隊長', postcard: '寄給天空的明信片', rock_friend: '巨岩是朋友',
  slime_talk: '史萊姆（對話）', slime_defeat: '史萊姆（打倒）', goblin_talk: '哥布林（對話）', goblin_defeat: '哥布林（打倒）', bat_talk: '蝙蝠怪（對話）', bat_defeat: '蝙蝠怪（打倒）',
  fgoblin_talk: '森林哥布林（對話）', fgoblin_defeat: '森林哥布林（打倒）', wolf_talk: '森林野狼（對話）', wolf_defeat: '森林野狼（打倒）', mushroom_talk: '蘑菇怪（對話）', mushroom_defeat: '蘑菇怪（打倒）',
  rock_talk: '巨岩（說服）', rock_defeat: '巨岩（打倒）',
  meadow_day: '白天的草原', meadow_night: '晚上的草原', forest_view: '黑森林的入口', camp_fire: '營火邊', plaza_night: '晚上的廣場', bell_view: '鐘樓上看村子', orchard_night: '月光莓果園的夜景', nori_fish: '等魚的時間', windmill_top: '風車頂樓的月亮', tallest_tree: '最高的大樹', moon_feast: '月光宴會', lantern_road: '月光之路',
  moon_paw: '月光貓掌印', rock_badge: '勇氣徽章', reflection: '小溪的倒影', prophecy: '舊預言書頁', windmill_box: '老風車的小箱子', spring: '森林的回復泉', secret_path: '祕密小路', birdnest: '樹頂的鳥巢', whitecat_roof1: '屋頂上的小白貓 1', whitecat_roof2: '屋頂上的小白貓 2', whitecat_roof3: '屋頂上的小白貓 3', nap_cat: '午睡的貓', charcoal_secret: '黑炭師傅的祕密', goblin_drawing: '哥布林的畫', quiz_star: '小學堂之星',
  shiny_slime: '閃亮史萊姆', shiny_goblin: '閃亮哥布林', shiny_bat: '閃亮蝙蝠怪', shiny_fgoblin: '閃亮森林哥布林', shiny_wolf: '閃亮野狼', shiny_mushroom: '閃亮蘑菇怪',
};
// 動態計算（其他資料檔可能之後才把貼紙加進 STICKER_PAGES）
export const bookIds = () => STICKER_PAGES.flatMap(p => p.ids);
export const bookTotal = () => bookIds().length;
export const bookCount = (st: string[]) => { const ids = bookIds(); return st.filter(k => ids.includes(k)).length; };
export const STICKERS_PER_PAGE = 15;
// 畫面上的頁面：每一類超過 15 張時自動多出「第 2 頁」
export function bookPages() {
  return STICKER_PAGES.flatMap(c => { const n = Math.max(1, Math.ceil(c.ids.length / STICKERS_PER_PAGE)); return Array.from({ length: n }, (_, k) => ({ id: c.id, name: n > 1 ? `${c.name} ${k + 1}` : c.name, ids: c.ids.slice(k * STICKERS_PER_PAGE, (k + 1) * STICKERS_PER_PAGE) })); });
}
