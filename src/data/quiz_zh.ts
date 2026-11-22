// 國語題（台灣國小三～五年級）。answer 一律是第 0 個（畫面上會打亂順序）。
import { QUIZ, type QuizQ } from './quiz';
const Z: QuizQ[] = [
  // ===== 第 1 級（三年級） =====
  { id: 'z01', subject: 'chinese', grade: 3, tier: 1, q: '「河」這個字的部首是什麼？', choices: ['水（氵）', '口', '可', '木'], answer: 0, hint: '河裡面有什麼？和「湖」「海」是一家人喔。', explain: '河、湖、海都和水有關，部首是「水」，寫在左邊時變成「氵」。' },
  { id: 'z02', subject: 'chinese', grade: 3, tier: 1, q: '一（　）魚。括號裡要填哪個字？', choices: ['條', '本', '張', '把'], answer: 0, hint: '魚長長的，像繩子一樣的東西，我們會說一「？」。', explain: '長長的東西用「條」：一條魚、一條河、一條路。' },
  { id: 'z03', subject: 'chinese', grade: 3, tier: 1, q: '「勇敢」的相反詞是什麼？', choices: ['膽小', '勇猛', '大膽', '開心'], answer: 0, hint: '相反詞就是意思完全反過來。不敢、會害怕的樣子叫什麼？', explain: '勇敢的相反是「膽小」。' },
  { id: 'z04', subject: 'chinese', grade: 3, tier: 1, q: '一（　）書。括號裡要填哪個字？', choices: ['本', '條', '匹', '顆'], answer: 0, hint: '圓圓最愛的東西！一「？」故事書。', explain: '書要用「本」：一本書、一本筆記本。' },
  { id: 'z05', subject: 'chinese', grade: 3, tier: 1, q: '「快樂」的相反詞是什麼？', choices: ['難過', '高興', '歡喜', '好玩'], answer: 0, hint: '高興、歡喜都和快樂意思很像。反過來，心裡不舒服是什麼？', explain: '快樂的相反是「難過」。' },
  { id: 'z06', subject: 'chinese', grade: 3, tier: 1, q: '「媽」這個字的部首是什麼？', choices: ['女', '馬', '口', '人'], answer: 0, hint: '「姐」「妹」「奶」也有同一個部首喔。', explain: '媽、姐、妹、奶的部首都是「女」。右邊的「馬」是讀音的提示。' },
  { id: 'z07', subject: 'chinese', grade: 3, tier: 1, q: '「貓」的注音是哪一個？', choices: ['ㄇㄠ', 'ㄇㄛ', 'ㄇㄡ', 'ㄋㄠ'], answer: 0, hint: '慢慢念「貓——」，嘴巴最後是圓圓的「ㄠ」。', explain: '貓念作「ㄇㄠ」。' },
  { id: 'z08', subject: 'chinese', grade: 3, tier: 1, q: '一（　）花。括號裡要填哪個字？', choices: ['朵', '條', '隻', '本'], answer: 0, hint: '花和雲都用同一個字：一「？」白雲。', explain: '花和雲用「朵」：一朵花、一朵雲。' },
  { id: 'z09', subject: 'chinese', grade: 3, tier: 1, q: '哪個詞的意思和「美麗」最像？', choices: ['漂亮', '難看', '高大', '聰明'], answer: 0, hint: '意思很像的詞叫「相似詞」。看到好看的花，會說它很……？', explain: '美麗和「漂亮」意思很像。' },
  { id: 'z10', subject: 'chinese', grade: 3, tier: 1, q: '哪一句的順序是對的？', choices: ['小貓在樹下睡覺。', '樹下睡覺在小貓。', '睡覺小貓樹下在。', '在睡覺樹下小貓。'], answer: 0, hint: '先說「誰」，再說「在哪裡」，最後說「做什麼」。', explain: '誰（小貓）＋在哪裡（在樹下）＋做什麼（睡覺）。' },
  { id: 'z11', subject: 'chinese', grade: 3, tier: 1, q: '紅（　）的蘋果。括號裡填哪個最好？', choices: ['通通', '綠綠', '白白', '藍藍'], answer: 0, hint: '蘋果是紅色的，要選和「紅」放在一起念起來最順的。', explain: '「紅通通」形容很紅的樣子。' },
  // ===== 第 2 級（四年級） =====
  { id: 'z12', subject: 'chinese', grade: 4, tier: 2, q: '成語「半途而（　）」，括號裡是哪個字？', choices: ['廢', '止', '走', '停'], answer: 0, hint: '意思是做到一半就放棄了。「荒廢」的廢。', explain: '「半途而廢」：事情做到一半就放棄。勇者不要半途而廢喔！' },
  { id: 'z13', subject: 'chinese', grade: 4, tier: 2, q: '「想」這個字的部首是什麼？', choices: ['心', '木', '目', '相'], answer: 0, hint: '想事情要用到哪裡？「思」「念」「忘」也是同一個部首。', explain: '想、思、念、忘的部首都是「心」。' },
  { id: 'z14', subject: 'chinese', grade: 4, tier: 2, q: '哪一個詞語沒有錯字？', choices: ['游泳', '遊泳', '游永', '油泳'], answer: 0, hint: '在水裡的動作，兩個字都要有「氵」喔。', explain: '正確是「游泳」，兩個字都有水字旁。' },
  { id: 'z15', subject: 'chinese', grade: 4, tier: 2, q: '一（　）山。括號裡要填哪個字？', choices: ['座', '隻', '本', '顆'], answer: 0, hint: '山、橋、城堡這種又大又穩的東西，都用同一個字。', explain: '山要用「座」：一座山、一座城堡。' },
  { id: 'z16', subject: 'chinese', grade: 4, tier: 2, q: '「膽小如鼠」是什麼意思？', choices: ['膽子很小', '老鼠很可愛', '跑得很快', '很會躲藏'], answer: 0, hint: '「如」是「像」的意思。膽子像老鼠一樣……', explain: '「膽小如鼠」是說膽子像老鼠一樣小。（圓圓說：倉鼠其實很勇敢的！）' },
  { id: 'z17', subject: 'chinese', grade: 4, tier: 2, q: '「出發」的相反詞是什麼？', choices: ['到達', '離開', '出去', '起飛'], answer: 0, hint: '出發是開始走；走到終點的時候叫什麼？', explain: '出發的相反是「到達」。' },
  { id: 'z18', subject: 'chinese', grade: 4, tier: 2, q: '「因為下雨了，（　）我帶了雨傘。」要填什麼？', choices: ['所以', '但是', '而且', '如果'], answer: 0, hint: '「因為」常常和誰是好朋友，一起出現？', explain: '「因為……所以……」說明原因和結果。' },
  { id: 'z19', subject: 'chinese', grade: 4, tier: 2, q: '「你今天開心嗎（　）」最後要放哪個標點？', choices: ['？', '。', '，', '！'], answer: 0, hint: '句子裡有「嗎」，是在問問題喔。', explain: '問問題的句子，最後要用問號「？」。' },
  { id: 'z20', subject: 'chinese', grade: 4, tier: 2, q: '「跑」這個字的部首是什麼？', choices: ['足', '包', '走', '口'], answer: 0, hint: '跑步要用腳！「跳」「踢」也是同一個部首。', explain: '跑、跳、踢的部首都是「足」。' },
  { id: 'z21', subject: 'chinese', grade: 4, tier: 2, q: '哪一個是貓咪的叫聲？', choices: ['喵喵', '汪汪', '呱呱', '咩咩'], answer: 0, hint: '月光貓村的大家都是這樣叫的！', explain: '喵喵是貓、汪汪是狗、呱呱是青蛙、咩咩是羊。' },
  { id: 'z22', subject: 'chinese', grade: 4, tier: 2, q: '「小心翼翼」是什麼意思？', choices: ['非常小心', '很粗心', '非常生氣', '很開心'], answer: 0, hint: '詞語裡就有「小心」兩個字喔。', explain: '「小心翼翼」形容做事非常小心、謹慎。' },
  // ===== 第 3 級（五年級） =====
  { id: 'z23', subject: 'chinese', grade: 5, tier: 3, q: '成語「勇往直（　）」，括號裡是哪個字？', choices: ['前', '後', '上', '走'], answer: 0, hint: '勇敢地一直往哪個方向走？', explain: '「勇往直前」：勇敢地一直向前進，不害怕。' },
  { id: 'z24', subject: 'chinese', grade: 5, tier: 3, q: '哪一句用了「譬喻（比喻）」的寫法？', choices: ['月亮像一艘小船。', '月亮很亮。', '我看月亮。', '月亮出來了。'], answer: 0, hint: '譬喻就是用「像」把一樣東西比成另一樣東西。', explain: '把彎彎的月亮比成「小船」，就是譬喻。' },
  { id: 'z25', subject: 'chinese', grade: 5, tier: 3, q: '「畫蛇添足」是什麼意思？', choices: ['做多餘的事，反而把事情弄壞', '畫畫很厲害', '蛇有很多腳', '做事很仔細'], answer: 0, hint: '蛇本來有腳嗎？硬要幫牠畫上腳，會怎樣？', explain: '蛇本來沒有腳，畫上腳反而不像蛇了。比喻做多餘的事，反而壞事。' },
  { id: 'z26', subject: 'chinese', grade: 5, tier: 3, q: '「雖然很害怕，（　）她還是往前走。」要填什麼？', choices: ['但是', '因為', '所以', '如果'], answer: 0, hint: '「雖然」後面的事情，和後半句是相反的意思。', explain: '「雖然……但是……」表示轉折。害怕還往前走，就是勇氣！' },
  { id: 'z27', subject: 'chinese', grade: 5, tier: 3, q: '哪一個成語寫對了？', choices: ['再接再厲', '再接再勵', '在接在厲', '再接在厲'], answer: 0, hint: '兩個都是「再一次」的再；最後一個字是「厲害」的厲。', explain: '正確是「再接再厲」：一次又一次繼續努力。' },
  { id: 'z28', subject: 'chinese', grade: 5, tier: 3, q: '「鐘」這個字的部首是什麼？', choices: ['金', '立', '里', '重'], answer: 0, hint: '大鐘是用什麼做的？「鐵」「銅」「針」也是同一個部首。', explain: '鐘、鐵、銅、針的部首都是「金」。' },
  { id: 'z29', subject: 'chinese', grade: 5, tier: 3, q: '「守株待兔」是什麼意思？', choices: ['只想等好運，不肯努力', '很會抓兔子', '守護大樹', '兔子很聰明'], answer: 0, hint: '農夫撿到一隻撞到樹的兔子，就每天坐在樹旁邊等……', explain: '比喻不努力、只想等好運氣自己來。（露露說：兔子才不會一直撞樹呢！）' },
  { id: 'z30', subject: 'chinese', grade: 5, tier: 3, q: '哪一句用了「擬人」的寫法？', choices: ['花兒笑著向我點頭。', '花很香。', '我摘了一朵花。', '花是紅色的。'], answer: 0, hint: '擬人就是讓東西像人一樣，會笑、會說話、會點頭。', explain: '花兒會「笑」、會「點頭」，把花寫得像人一樣，就是擬人。' },
  { id: 'z31', subject: 'chinese', grade: 5, tier: 3, q: '一（　）信。括號裡要填哪個字？', choices: ['封', '條', '隻', '朵'], answer: 0, hint: '信要裝進信封裡，封起來再寄出去。', explain: '信要用「封」：一封信。' },
  { id: 'z32', subject: 'chinese', grade: 5, tier: 3, q: '「倒轉」是什麼意思？', choices: ['往相反的方向轉', '停下來不動', '轉得很快', '掉下來'], answer: 0, hint: '倒轉鐘樓的指針是怎麼走的？', explain: '「倒轉」就是往反方向轉。' },
  { id: 'z33', subject: 'chinese', grade: 5, tier: 3, q: '「整齊」的相反詞是什麼？', choices: ['凌亂', '乾淨', '漂亮', '安靜'], answer: 0, hint: '東西亂七八糟、到處都是的樣子叫什麼？', explain: '整齊的相反是「凌亂」。' },
  { id: 'z34', subject: 'chinese', grade: 5, tier: 3, q: '「井底之蛙」是在說什麼樣的人？', choices: ['見識很少的人', '很會游泳的人', '住在井裡很快樂的人', '跳得很高的人'], answer: 0, hint: '青蛙在井底往上看，只看得到一小塊天空……', explain: '比喻看得少、知道得少，卻以為自己什麼都懂的人。' },
];
QUIZ.push(...Z);
