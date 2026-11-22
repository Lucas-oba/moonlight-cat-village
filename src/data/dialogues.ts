import type { Dialogue } from './types';
// 對話腳本：s=說話者（npc id / hero / system / narr），{name}=主角名字
// 主線台詞取自 CHAPTER1.md；meow=系統啟動前貓咪說的話
// 旅店休息時的營火對話（資料在 data/bonds.ts 加進來）
export const INN_TALKS: { d: string; when?: import('./types').Cond }[] = [];
export const DIALOGUES: Record<string, Dialogue> = {
  // ===== 進村 =====
  arrive: [
    { s: 'narr', t: '{name}在村口的草地上醒來。天上是好大好大的月亮。' },
    { s: 'hero', t: '這、這裡是哪裡？剛剛的白貓呢……？' },
    { s: 'narr', t: '地上亮起了一個又一個發光的貓掌印，好像在說「往這邊走」。' },
    { s: 'narr', t: '【操作】拖動左下角的搖桿移動，或是直接點一下想去的地方。靠近別人時按右下角的按鈕就能說話。' },
  ],
  meadow_first: [
    { s: 'narr', t: '村外草原，風吹過高高的草叢，沙沙作響。' },
    { s: 'narr', t: '深綠色的高草叢裡可能有魔物喔。走路時要小心。' },
  ],
  gate_locked: [
    { s: 'narr', t: '村口外面黑漆漆的……晚上一個人出去好像不太好。' },
    { s: 'hero', t: '還是先在村子裡找找看有沒有人能幫我吧。', think: true },
  ],
  // ===== 主線 2：聽不懂的村莊 =====
  merchant_meow: [
    { s: 'merchant', t: '', meow: '喵喵？喵喵喵～喵！' },
    { s: 'hero', t: '（好像在推銷什麼東西……完全聽不懂。）', think: true },
  ],
  innkeeper_meow: [
    { s: 'innkeeper', t: '', meow: '喵——嗚？喵喵喵！' },
    { s: 'hero', t: '（她笑得好開心……可是在說什麼呢？）', think: true },
  ],
  farmer_meow: [
    { s: 'farmer', t: '', meow: '喵。喵喵……喵————。' },
    { s: 'hero', t: '（他好像在嘆氣……）', think: true },
  ],
  mochimom_meow: [
    { s: 'mochimom', t: '', meow: '喵喵喵喵喵喵喵喵！喵？喵喵！' },
    { s: 'hero', t: '（講、講得好快！）', think: true },
  ],
  douhua_meow: [
    { s: 'douhua', t: '', meow: '喵？' },
    { s: 'hero', t: '（好小的三花貓……好可愛。）', think: true },
  ],
  guard_meow: [
    { s: 'guard', t: '', meow: '喵。喵喵喵。' },
    { s: 'hero', t: '（好、好高大的貓……）', think: true },
  ],
  elder_wait: [
    { s: 'elder', t: '', meow: '喵……喵喵。' },
    { s: 'narr', t: '老灰貓用拐杖指了指廣場上的其他貓咪。' },
  ],
  main2_elder: [
    { s: 'narr', t: '一隻穿著長袍的老灰貓拄著拐杖走過來，看著{name}好一會兒。' },
    { s: 'elder', t: '', meow: '喵……喵喵喵。喵？' },
    { s: 'narr', t: '老灰貓撿起一根樹枝，努力在地上畫圖：一個小女孩、一把劍，還有一個圓圓的月亮。' },
    { s: 'hero', t: '嗯……女孩、劍、月亮……' },
    { s: 'hero', t: '是要我去吃月亮蛋糕嗎？' },
    { s: 'elder', t: '', meow: '喵！？喵喵喵喵！' },
    { s: 'narr', t: '老灰貓用力搖頭，鬍子都抖起來了。然後他指向北邊——守衛的訓練場。' },
    { s: 'hero', t: '要我去那邊嗎？好，我去看看！', act: [{ type: 'obj', quest: 'main2', obj: 'elder' }] },
  ],
  elder_point: [
    { s: 'elder', t: '', meow: '喵喵！' },
    { s: 'narr', t: '老灰貓又指了指北邊的訓練場。' },
  ],
  whitecat_default: [
    { s: 'narr', t: '小白貓眨了眨眼睛，金色的領結閃了一下。' },
    { s: 'hero', t: '你到底是誰呀……？', think: true },
  ],
  // ===== 主線 3：第一把木劍 =====
  main3_guard: [
    { s: 'narr', t: '高大的橘色虎斑貓守衛正在練劍。看到{name}，他停了下來。' },
    { s: 'guard', t: '', meow: '喵喵、喵喵喵喵喵……喵喵喵喵！喵喵喵，喵——！' },
    { s: 'narr', t: '他放下大劍，拿出一把小木劍，單膝跪下，遞給{name}。' },
    { s: 'hero', t: '給、給我的嗎？' },
    { s: 'narr', t: '{name}握住木劍。木劍發出淡淡的月光——', act: [{ type: 'systemActivate' }] },
    { s: 'narr', t: '下一秒，所有的「喵喵喵」都變成了聽得懂的話！' },
    { s: 'guard', t: '……所以剛剛那一大串，妳都沒聽懂？我還以為我講得很感人。' },
    { s: 'hero', t: '對、對不起！可是現在聽得懂了！' },
    { s: 'guard', t: '哈哈！那我就簡單說：歡迎妳，小小的勇者。這把木劍，從今天起就是妳的了。', act: [{ type: 'obj', quest: 'main3', obj: 'guard' }] },
    { s: 'system', t: '來看看妳的屬性吧喵！右上角的貓掌按鈕，隨時都能打開喵喵勇者系統喵。', act: [{ type: 'openPanel', tab: 'status', thenObj: ['main3', 'system'] }] },
  ],
  guard_default: [
    { s: 'guard', t: '長老在等妳喔。長老之家在村子的西北邊，紫色屋頂那間。' },
  ],
  elder_default: [
    { s: 'elder', t: '月光貓村的貓咪都很親切。有困難的話，就去幫幫他們吧。' },
  ],
  // ===== 主線 4：長老的預言 =====
  main4_story: [
    { s: 'elder', t: '孩子，歡迎來到月光貓村。這裡是魔法與奇幻生物的世界，我們貓族在月光守護下過著平靜的日子。' },
    { s: 'elder', t: '村裡一直流傳著一個古老的預言——' },
    { s: 'elder', t: '「當月光再次照進黑森林，一位來自遠方的小小勇者，會牽起貓族的手。」' },
    { s: 'hero', t: '我……我只是小學生耶。' },
    { s: 'elder', t: '勇者不一定要很強大。願意為別人踏出一步，就是勇者。' },
    { s: 'narr', t: '小白貓趴在長老之家的屋簷上，尾巴輕輕晃。長老看了牠一眼，什麼都沒說。' },
    { s: 'hero', t: '那……我要怎麼回家？' },
    { s: 'elder', t: '我也不知道。不過那隻白貓帶妳來，也許有一天，牠也會帶妳回去。', act: [{ type: 'obj', quest: 'main4', obj: 'story' }] },
    { s: 'system', t: '叮！任務日誌已更新喵！主線和支線會分開記錄，按「追蹤」就能在畫面上看到目標喵。', act: [{ type: 'openPanel', tab: 'quests', thenObj: ['main4', 'log'] }] },
  ],
  main4_end: [
    { s: 'elder', t: '今晚先去旅店休息吧。奶油老闆娘會幫妳準備房間的。' },
    { s: 'hero', t: '嗯……謝謝長老。', act: [{ type: 'nextMorning' }] },
    { s: 'narr', t: '隔天早上。陽光灑在月光貓村，屋簷下的小魚乾閃閃發亮。' },
    { s: 'system', t: '新的一天開始了喵！到村子裡到處走走，認識大家吧喵。' },
  ],
  // ===== 主線 5：新來的小勇者 =====
  main5_shop: [
    { s: 'merchant', t: '勇者大人第一次來，我送妳 100 魚乾幣當見面禮！只限這一次喔，下次就要算錢了喵。', act: [{ type: 'money', n: 100 }] },
    { s: 'merchant', t: '要不要買一個「小魚乾餅乾」？吃了可以回復體力喔，划算喵！',
      choices: [
        { label: '買一個（10 魚乾幣）', act: [{ type: 'buy', id: 'cookie', price: 10 }] },
        { label: '先不用了' },
      ] },
    { s: 'merchant', t: '以後常來喔！划算喵！', act: [{ type: 'obj', quest: 'main5', obj: 'shop' }] },
  ],
  merchant_shop: [
    { s: 'merchant', t: '歡迎光臨！今天也很划算喵！',
      choices: [
        { label: '買小魚乾餅乾（10 魚乾幣）', act: [{ type: 'buy', id: 'cookie', price: 10 }] },
        { label: '只是看看' },
      ] },
  ],
  main5_inn: [
    { s: 'innkeeper', t: '哎呀，昨晚睡得好嗎？妳就住在二樓那間吧。' },
    { s: 'innkeeper', t: '累了就回來睡覺，我會幫妳記住今天發生的事。哈哈哈！' },
    { s: 'system', t: '在旅店休息可以回復體力，還能「存檔」喵！冒險告一段落時，記得回來休息喵。', act: [{ type: 'obj', quest: 'main5', obj: 'inn' }] },
    { s: 'innkeeper', t: '要現在休息一下嗎？',
      choices: [
        { label: '休息並存檔', act: [{ type: 'rest' }, { type: 'save' }] },
        { label: '等一下再說' },
      ] },
  ],
  inn_default: [
    { s: 'innkeeper', t: '回來啦！要休息一下嗎？',
      choices: [
        { label: '休息並存檔', act: [{ type: 'rest' }, { type: 'save' }] },
        { label: '不用了' },
      ] },
  ],
  main5_farm: [
    { s: 'narr', t: '番薯伯在田邊唉聲嘆氣，菜園亂七八糟的。' },
    { s: 'farmer', t: '唉……唉……我的菜啊……' },
    { s: 'hero', t: '番薯伯，你怎麼了？' },
    { s: 'farmer', t: '哼，說來話長。妳先去村子裡逛逛，等等再來聽我抱怨吧。', act: [{ type: 'obj', quest: 'main5', obj: 'farm' }] },
  ],
  glint_fountain: [
    { s: 'narr', t: '噴水池旁邊，有什麼東西在閃閃發光……' },
    { s: 'narr', t: '是一個發著淡淡月光的貓掌印！' },
    { s: 'system', t: '這就是「閃光點」喵！觀察力越高，能看見的閃光點就越多喵。' },
    { s: 'system', t: '叮！送給妳一本「喵喵貼紙簿」！貓掌印變成了第一張貼紙喵！', act: [{ type: 'item', id: 'sticker_book' }, { type: 'sticker', id: 'moon_paw' }, { type: 'obj', quest: 'main5', obj: 'paw' }] },
  ],
  main5_end: [
    { s: 'system', t: '村民們好像有事情想拜託妳喵！頭上有「！」的貓咪，可以去跟牠聊聊喵。' },
  ],
  // ===== 主線 6：菜園遭殃了 =====
  main6_farmer: [
    { s: 'farmer', t: '我的胡蘿蔔！我的高麗菜！昨晚又被偷了，地上全是奇怪的小腳印。' },
    { s: 'hero', t: '小腳印？我幫你看看！', act: [{ type: 'obj', quest: 'main6', obj: 'farmer' }] },
  ],
  farmer_worry: [
    { s: 'farmer', t: '妳真的要幫我找小偷？……哼，小心一點啊。' },
  ],
  farmer_default: [
    { s: 'farmer', t: '番薯要慢慢烤才會甜。做人也一樣，急不得。' },
  ],
  glint_garden: [
    { s: 'narr', t: '{name}蹲下來仔細看。泥土上的小腳印，只有三根腳趾……' },
    { s: 'hero', t: '腳印往村子外面去了！村口好像有守衛在。' },
  ],
  main6_guard: [
    { s: 'guard', t: '要去草原調查？好樣的。' },
    { s: 'guard', t: '草原上有史萊姆，牠們不太兇，但會撞人。' },
    { s: 'guard', t: '打不過就逃跑，不丟臉。記住喔！', act: [{ type: 'obj', quest: 'main6', obj: 'guard' }] },
  ],
  guard_gate: [
    { s: 'guard', t: '村口交給我守著。出門前記得帶些小魚乾餅乾！' },
  ],
  tut1_intro: [{ s: 'narr', t: '草叢沙沙地動了一下——史萊姆跳出來了！' }],
  tut2_intro: [{ s: 'narr', t: '這次有兩隻史萊姆！' }],
  tut3_intro: [{ s: 'narr', t: '草叢裡有一隻看起來好睏的史萊姆……' }],
  tut3_talk: [
    { s: 'hero', t: '你是不是想睡覺？' },
    { s: 'slime', t: '噗嚕……太陽好曬……想去樹蔭下……' },
    { s: 'narr', t: '史萊姆慢慢滾走了，留下一顆「黏黏果凍」。' },
    { s: 'system', t: '對話成功！不用戰鬥，也能讓魔物離開喵。勇氣值越高，對話越容易成功喵。' },
  ],
  glint_fp1: [
    { s: 'narr', t: '草地上有三根腳趾的小腳印，往南邊去了。', act: [{ type: 'flag', id: 'fp1' }] },
  ],
  glint_fp2: [
    { s: 'narr', t: '又是同樣的小腳印！旁邊還掉了一片高麗菜葉。', act: [{ type: 'flag', id: 'fp2' }] },
  ],
  glint_fp3: [
    { s: 'narr', t: '小腳印在這裡轉了個彎，一路往草原東邊去了……', act: [{ type: 'flag', id: 'fp3' }] },
  ],
  main6_end: [
    { s: 'hero', t: '小偷一定在草原東邊！可是……三根腳趾的會是誰呢？' },
    { s: 'system', t: '小腳印往草原的東邊去了。去高麗菜田看看吧喵！' },
    { s: 'system', t: '訓練場的阿栗、草藥店的銀杏婆婆，好像也需要幫忙喔。頭上有「！」的就是喵。' },
  ],
  // ===== 支線 2：走失的豆花 =====
  side2_start: [
    { s: 'mochimom', t: '勇者大人！我家豆花說要去看蝴蝶，到現在都還沒回來！' },
    { s: 'mochimom', t: '怎麼辦怎麼辦怎麼辦，她那麼小，萬一迷路了、萬一肚子餓了、萬一……' },
    { s: 'hero', t: '麻糬媽媽，先不要急。',
      choices: [
        { label: '我幫妳找！', act: [{ type: 'startQuest', id: 'side2' }] },
        { label: '我等一下再來' },
      ] },
  ],
  side2_wait: [
    { s: 'mochimom', t: '豆花……拜託妳了。問問村裡的大家，也許有人看到她。' },
  ],
  side2_clue_merchant: [
    { s: 'merchant', t: '豆花？我剛剛看到她追著一隻發光的蝴蝶，往小溪那邊跑過去了喵。', act: [{ type: 'flag', id: 'clue_merchant' }, { type: 'obj', quest: 'side2', obj: 'ask' }] },
  ],
  side2_clue_innkeeper: [
    { s: 'innkeeper', t: '豆花早上來借水壺，說要去看「月光蝴蝶」呢。那種蝴蝶只在草原才有喔。', act: [{ type: 'flag', id: 'clue_innkeeper' }, { type: 'obj', quest: 'side2', obj: 'ask' }] },
  ],
  side2_clue_farmer: [
    { s: 'farmer', t: '那隻小三花？剛剛從我田邊跑過去啦，跳過小溪的橋，往村口的方向。', act: [{ type: 'flag', id: 'clue_farmer' }, { type: 'obj', quest: 'side2', obj: 'ask' }] },
  ],
  side2_clue_guard: [
    { s: 'guard', t: '有一隻小三花跑出村口，往草原去了！我叫她，她都沒聽見。草原西南邊的草叢很高，要仔細找。', act: [{ type: 'flag', id: 'clue_guard' }, { type: 'obj', quest: 'side2', obj: 'ask' }] },
  ],
  glint_douhua: [
    { s: 'narr', t: '高高的草叢裡，好像有一條三花色的尾巴在發抖……' },
    { s: 'douhua', t: '……是誰？' },
    { s: 'douhua', t: '我想抓一隻月光蝴蝶給媽媽……可是我迷路了，好可怕。' },
    { s: 'hero', t: '迷路的時候會怕很正常。我們一起回家吧。' },
    { s: 'douhua', t: '……嗯！', act: [{ type: 'obj', quest: 'side2', obj: 'find' }] },
    { s: 'narr', t: '豆花從草叢裡跑出來，緊緊跟在{name}身邊。', act: [{ type: 'sfx', id: 'newFriend' }] },
    { s: 'system', t: '豆花會跟著妳走喵！帶她回村子，找麻糬媽媽吧喵。' },
  ],
  side2_home: [
    { s: 'mochimom', t: '豆花！妳跑去哪裡了，媽媽擔心死了！擔心死了擔心死了！' },
    { s: 'douhua', t: '對不起，媽媽……' },
    { s: 'narr', t: '麻糬媽媽緊緊抱住豆花。' },
    { s: 'narr', t: '豆花偷偷塞了一片亮晶晶的東西到{name}手裡——是月光蝴蝶的鱗粉。' },
    { s: 'douhua', t: '這個給妳。謝謝妳帶我回家。', act: [{ type: 'obj', quest: 'side2', obj: 'home' }] },
  ],
  mochimom_thanks: [
    { s: 'mochimom', t: '謝謝妳，勇者大人。妳真是個溫柔的孩子。' },
  ],
  mochimom_default: [
    { s: 'mochimom', t: '今天天氣真好，適合曬棉被、曬小魚乾、曬貓咪！' },
  ],
  douhua_follow: [
    { s: 'douhua', t: '大姊姊，我會好好跟著妳，不會再亂跑了！' },
    { s: 'hero', t: '好！我們一起回家找媽媽。' },
  ],
  douhua_default: [
    { s: 'douhua', t: '大姊姊，妳是人類嗎？人類的尾巴藏在哪裡？' },
  ],
  douhua_after: [
    { s: 'douhua', t: '下次我們一起去抓月光蝴蝶！不過要先跟媽媽說喔。' },
  ],
  // ===== 小事件、隱藏發現 =====
  glint_reflection: [
    { s: 'narr', t: '小溪的水面映著月亮……還有一個看不清楚的影子。' },
    { s: 'hero', t: '咦？剛剛那是什麼？', act: [{ type: 'stat', observation: 1 }, { type: 'flag', id: 'ev_reflection' }, { type: 'sticker', id: 'reflection' }] },
    { s: 'system', t: '觀察力 +1 喵。' },
  ],
  glint_badge: [
    { s: 'narr', t: '大石頭底下，有一個舊舊的徽章在發光。' },
    { s: 'system', t: '獲得「勇氣徽章」！勇氣值 +1 喵！', act: [{ type: 'item', id: 'courage_badge' }, { type: 'sticker', id: 'rock_badge' }, { type: 'stat', courage: 1 }, { type: 'flag', id: 'got_badge' }] },
  ],
  // ===== 戰鬥失敗 =====
  rescued: [
    { s: 'narr', t: '……{name}眼前一黑。' },
    { s: 'narr', t: '迷迷糊糊之間，好像有一隻小白貓，用頭輕輕頂著她的手……' },
  ],
};
import { DIALOGUES_B } from './dialogues_ch1b';
Object.assign(DIALOGUES, DIALOGUES_B);
