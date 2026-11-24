# AGENTS.md — 《月光貓村》交接說明（給 Codex／AI 程式助理）

> 這份文件是專案的工作守則。**回覆擁有者、寫進遊戲裡的所有文字，一律使用繁體中文。** 指令與程式碼照常用英文。

## 0. 第一次接手先做這件事（重要）

這個 `source` 分支是用「只能上傳文字」的工具推上 GitHub 的，所以**圖片、音樂、字型等二進位檔被轉成 base64 文字放在 `binpack/`**。
`npm ci`／`npm install` 會自動執行 `tools/restore_binaries.mjs --if-missing`，把它們還原到 `public/`、`art_src/`、`docs/screenshots/`（會逐檔驗證 sha256）。

如果你（Codex）有 git 推送權限，建議第一個任務就是：

```bash
npm ci                          # 還原二進位檔
git add public art_src docs     # 把真正的圖片／音樂／字型提交進來
git rm -r binpack               # 之後就不需要 binpack 了
# 同時把 package.json 的 "postinstall" 拿掉（或保留也沒關係：沒有 binpack/ 時它什麼都不做）
git commit -m "還原二進位素材為真正的檔案，移除 binpack"
```

要重新產生 binpack（通常不需要）：`python3 tools/make_binpack.py`。

## 1. 專案概要

- 《月光貓村》：給小朋友（國小三～五年級）玩的單人 2D 像素風 RPG。小朋友穿越到貓咪的異世界，一章學一種心意。
- 技術：**Phaser 3 + TypeScript + Vite**，手機**直式 390×844**（觸控：虛擬搖桿＋點地面走路）。存檔用 `localStorage`。
- 全 6 章，主題順序固定：**第一章 勇氣 → 第二章 善良 → 第三章 友誼 → 第四章 誠實與負責 → 第五章 愛 → 第六章 希望**（擁有者特別指定「先愛、最後希望」）。
- 目前原始碼進度為**試玩版 0.11.0**。第一～三章內容完整。第三章「橋的另一頭」有 12 個主線、14 個支線、新夥伴米舟、朋友信與帆耳頭目戰。
- 線上試玩：https://lucas-oba.github.io/moonlight-cat-village/
- 每章大約 4～5 小時（第一章 3.5～4 小時），長度靠支線與探索，不靠練等。

## 2. 擁有者的固定規則（一定要遵守）

1. **全部繁體中文**：遊戲內文字、任務說明、回覆擁有者都用繁體中文；任務說明要簡單白話（給小學生看）。
2. **新機制要先提案**：擁有者的世界觀文件寫明「未經確認，不要自行將世界觀設定擴充為已確定的遊戲機制。」——新玩法、新規則、新的世界觀設定、各章劇情，都要**先寫提案給擁有者確認**，同意後才實作。修 bug、平衡數值、補完已同意的內容不用另外問。
3. **奇幻元素：輕微的「愛麗絲夢遊仙境」感，但角色一定要原創**。已有的原創角色：小倉鼠「圓圓」（國語）、小兔子「露露」（自然）、松鼠「捲捲」（數學、英文）。**不可以**出現毛毛蟲、撲克牌（士兵）、會隱身只留笑容的貓、拿懷錶的兔子等明顯抄襲的元素。奇幻魔物也要原創（目前：茶杯蝸牛、倒立菇）。
4. **解題**：國語、英文、數學、自然四科，程度是台灣國小三～五年級。**答錯沒有懲罰**：貓咪給提示、可以一直重答。每題答案都要逐題核對正確（`answer` 一律放在第 0 個選項，畫面會打亂順序）。
5. **貼紙簿不設上限**：收藏類，有新貼紙就往上加，總數由資料自動計算。
6. **主題要配合各章**：第一章的故事都扣「勇氣」（敢開口、敢承認錯、敢請別人幫忙也是勇氣）。
7. 音樂、音效是擁有者自己做的，同意公開。
8. 小改動也要記得：一般戰鬥不能太難（看第 6 節的平衡目標）；介面點擊不能誤觸地面走路。

## 3. 安裝、開發、建置

需要 Node 18+（測試用 Playwright；工具腳本用 Python 3 + Pillow／fonttools）。

```bash
npm ci                     # 安裝並自動還原 binpack 二進位檔
npm run dev                # 開發伺服器（http://localhost:5173）
npm run build              # tsc 型別檢查 + vite build → dist/
npx vite preview --port 4173   # 預覽 dist/（多數測試預設連 4173）
```

除錯網址參數：
- `?debug=1`：主控台可用 `window.__mcv = { G, game, NPCS, check, DIALOGUES, GLINTS, TRIGGERS, QUESTS, MAPS, WONDERS }`
- `?debug=1&skip=1`：跳過標題直接開新遊戲（測試都用這個）

## 4. 資料夾地圖

```
src/
  main.ts              進入點：載入圖片清單 IMAGES、場景、資料模組的匯入順序、戰鬥串接、__mcv
  style.css            所有 DOM 介面的樣式（對話框、面板、解題、貼紙簿…）
  core/
    game.ts            G：全域遊戲狀態、對話執行器 run()、動作 exec()、事件佇列 enqueue()
    state.ts           GameState、存檔／讀檔（localStorage key：mcv_save_v1）
    quests.ts          任務進度、目標判定、notify()
    conditions.ts      條件 Cond 判斷 check()
    battle.ts          戰鬥公式
    sfx.ts / music.ts  合成音效、每隻貓不同的叫聲、BGM 淡入淡出
    tapguard.ts        防止「關掉對話框／面板的那一下」被當成點地面（0.8.2）
    bus.ts             事件匯流排
  scenes/
    World.ts           地圖場景：移動、NPC、閃光點、觸發點、出口、奇妙圈圈（變大變小）、跟隨者
    Battle.ts          回合制戰鬥（攻擊、技能、道具、防禦、逃跑、對話）
    textures.ts        地面貼圖產生
  ui/
    ui.ts              HUD、搖桿、對話框、系統面板、商店、貼紙簿、魔物圖鑑、燈籠、交換小攤、章末畫面
    quiz.ts            解題面板
  data/                ★ 內容都在這裡（資料驅動）
    types.ts           所有資料型別（Action、Cond、QuestDef、MapDef、NpcDef、EnemyDef…）
    maps.ts            地圖 MAPS、閃光點 GLINTS、觸發點 TRIGGERS、奇妙圈圈 WONDERS
    npcs.ts            NPC 與每隻貓的聲音設定 voice
    dialogues.ts / dialogues_ch1b.ts   對話
    quests.ts          主線、支線（QUESTS、QUEST_ORDER）
    enemies.ts         魔物 ENEMIES、遇敵表 ENCOUNTERS、固定戰鬥 FIXED
    items.ts           道具 ITEMS、貼紙 STICKERS、貼紙頁 STICKER_PAGES
    characters.ts      夥伴（阿栗、薄荷、柚子）與成長
    quiz.ts            題庫（英數自）＋ quiz_zh.ts（國語）
    ch1c.ts / interiors.ts / bonds.ts / events.ts / whimsy.ts / whimsy2.ts
                       追加內容模組：它們「修改」上面的共用資料表（push / Object.assign）
    ch3_maps.ts / ch3_enemies.ts / ch3_boss.ts     河岸三張地圖、一般遇敵、帆耳頭目戰
    ch3_story.ts / ch3_finale.ts                   第三章主線、米舟招募與羈絆
    ch3_collection.ts / ch3_sides.ts               河岸貼紙、夥伴與村民委託、奇幻支線
    ch3_school.ts / quiz_ch3.ts                    第三章喵喵小學堂與四科題庫
    letters.ts                                    朋友信與口信資料型別（介面在 ui/letters.ts）
public/
  assets/              遊戲圖片（png/jpg）、BGM 與音效（mp3）
  fonts/huninn.woff2   字型子集（jf 粉圓，OFL）
art_src/               AI 生成的原始圖（洋紅色背景），tools_*.py 從這裡切圖到 public/assets/
tests/                 Playwright 測試（見第 5 節）
sim/                   無畫面的戰鬥模擬器（見第 6 節）
tools_singlefile.py    打包單檔版（見第 7 節）
tools_process*.py / tools_whimsy*.py / tools_outfits.py   美術處理流程（去背、切圖、縮放）
tools_font_subset.py   重新產生字型子集
tools/                 binpack 還原／產生
docs/screenshots/      幾張代表性截圖
DESIGN.md              世界觀與已確認的設計決定
CHAPTER1.md            第一章完整企劃（v2，已核准）＋奇幻追加
CH1_WHIMSY_PROPOSAL.md 第一章奇幻內容提案（已核准、已實作）
CHAPTERS3_6_PROPOSAL.md 第三～六章提案，先讀「✅ 已確認」
docs/CH3_SPEC.md       第三章製作規格
docs/QUIZ_CH3.md       第三章 40 題的逐題核對表
SLICE1_NOTES.md        各版本實作紀錄、BGM 對照表
```

### 加內容的方式
- 新內容寫成一個新的資料模組（參考 `src/data/whimsy2.ts`），在 `src/main.ts` 匯入（**順序：ch1c → interiors → bonds → events → whimsy → whimsy2**，新的放最後）。
- 新圖片要加進 `src/main.ts` 的 `IMAGES` 陣列。
- 對話動作 `Action`（`types.ts`）：`startQuest`、`obj`、`item`、`flag`、`sticker`、`battle`、`quiz`…
  解題：`{ type: 'quiz', subject: 'chinese'|'math'|'english'|'science'|'mix', tier: 1|2|3, n, by, title, ids? }`
- 魔物貼紙會自動用 `<sticker>_talk`／`<sticker>_defeat`，要加進 `STICKER_PAGES` 的 `monster` 頁；魔物圖鑑會自動列出。
- 加了新的中文字以後，跑 `python3 tools_font_subset.py --check`（見第 9 節已知問題）。

## 5. 測試（Playwright）

```bash
npx playwright install chromium        # 第一次
npm run build && npx vite preview --port 4173 &   # 多數測試連 http://localhost:4173/
URL=http://localhost:4173/ node tests/p21_dlg_tap.mjs    # 點對話框不會誤走（快速，約 30 秒）
URL=http://localhost:4173/ node tests/p20.mjs            # 奇幻 W2：茶會、顛倒小徑、新魔物
URL=http://localhost:4173/ node tests/p18.mjs            # 奇幻 W1：鐘樓、變大變小、花園
```

- `tests/lib.mjs`：`launch`、`advance`（自動點對話／選項／獎勵）、`tapTo`、`tapNpc`、`battle2`、`shot`（截圖存到 `screenshots/`，已被 .gitignore 忽略）。
- **自動解任務** `tests/qsolve.mjs`：自己找 NPC／閃光點、走過去、點完對話、打完戰鬥、答完題。
  ```bash
  URL=http://localhost:4173/ node tests/qsolve.mjs side21,side23           # 用預設進度（主線 1～10 完成）解指定支線
  URL=http://localhost:4173/ FRESH=1 node tests/qsolve.mjs main1,main2,...  # 從新遊戲開始
  URL=... RESET=side5 node tests/qsolve.mjs side5                          # 先把某任務重設再解
  ```
- `tests/p2.mjs → p3 → p4 → p5…` 是早期的串連流程，會用 `/tmp/ckpt_*.json` 傳遞存檔，要照順序跑。
- `tests/smoke_single.mjs <網址>`：單檔版／線上版冒煙測試（標題、版本號、主控台錯誤）。
- `npx tsx tests/chk_refs.ts`（或 esbuild 後執行）：檢查對話、NPC、任務之間的 id 參照。
- 測試注意：在 `page.evaluate` 裡**不要回傳 `G.run(...)` 的 Promise**（會卡住），要包成 `{ G.run(...); }`。

### 第三章回歸

先跑 `timeout 600 npm run build`，再開一個 `npx vite preview --port 4173 --strictPort`。用完按 Ctrl+C 關閉預覽。另開終端機，依序執行下列指令；每次只開一個瀏覽器。

```bash
export URL=http://localhost:4173/
for t in p28_stats4 p29_ch3a p30_ch3b p31_ch3_sides; do
  result=0
  timeout 600 node "tests/$t.mjs" || result=$?
  pkill -f '[h]eadless_shell' || true
  pkill -f '[c]hrome-headless' || true
  [ "$result" -eq 0 ] || break
done
```

- `p28_stats4` 驗證舊存檔、四種心意和朋友信。`p29_ch3a` 從 `ch2_done.json` 走完主線 1～6 與米舟招募。`p30_ch3b` 從 `ch3_m6.json` 走完主線 7～12、章末統計與日記。
- `p31_ch3_sides` 從第三章存檔走完 14 個支線。存檔在 `tests/fixtures/`，截圖在 `docs/screenshots/ch3/`。`CH3_SCREENSHOTS` 可指定暫存截圖目錄。
- 單跑支線可用 `URL=http://localhost:4173/ timeout 600 node tests/qsolve.mjs c3s3,c3s9`。指定第三章支線時，預設讀取 `ch3_done.json`。
- 老夥伴的第 4 級與專屬技能由第二章羈絆任務解鎖。完成第三章羈絆支線可拿回憶貼紙，已到第 4 級的夥伴還會提起兩人一起做過的事。

## 6. 戰鬥模擬器與平衡目標

```bash
node sim/build.mjs                       # 用 esbuild 把真正的戰鬥規則打包成 sim/out/sim.mjs
node sim/out/sim.mjs 1000 all            # 每個情境 × 等級 × 隊伍 × 玩家類型各打 1000 場
node sim/out/sim.mjs 1000 巨岩           # 只跑名稱含「巨岩」的情境
node sim/out/sim.mjs --curve             # 照第一章順序打一遍的升級曲線
TUNE='{"ENEMIES":{"rock":{"atk":20}}}' node sim/out/sim.mjs 600 巨岩   # 試調數值
node sim/out/sim.mjs 1000 顛倒 --json sim/flippath_v08.json            # 存結果
```

- 玩家類型：`child`（小孩：大多按攻擊）、`smart`（會用技能、補血、對話）。詳見 `sim/README.md`。
- 平衡目標（child 玩法、在該有的等級）：
  - 一般遇敵：勝率約 100%，平均 2～3 回合，剩血 85% 以上；不需要刻意練等。
  - 支線固定戰鬥：勝率 96～100%，不會卡住（40 回合沒結束算卡住）。
  - 巨岩王（主線 11）：帶一位夥伴約 85～90% 勝、9～10 回合；三人全帶約 98%。
- 新魔物要加新情境到 `sim/sim.ts` 的 `SCENARIOS`，數值對齊同區域既有魔物。

## 7. 打包單檔版與發佈

GitHub Pages 上放的是「單檔版」：所有圖片、聲音、字型都用 data URI 塞進檔案裡。因為一次推太大的檔案 GitHub 會回 **413**，所以素材分裝成 pack1..N（目前 6 個），每個檔案約 3MB 以下。

```bash
npm run build
python3 tools_singlefile.py        # dist/ → single/index.html + single/pack1..N.js
python3 -m http.server 4180 -d single &
node tests/smoke_single.mjs http://localhost:4180/
```

發佈（要擁有者同意的版本才發）：
1. 版本號：`src/ui/ui.ts` 標題畫面的「試玩版 x.y.z」、`single/README.md` 第一行（手動改）、`package.json` 的 version，並在 `SLICE1_NOTES.md` 記一筆。
2. 把 `single/` 裡**有變動的檔案**推到 `main` 分支根目錄，**再**推到 `gh-pages` 分支根目錄（兩個分支內容相同；一次推一個分支，不要同時）。`.nojekyll` 要保留。
3. 約 1 分鐘後比對線上檔案的 hash：
   ```bash
   for path in single/index.html single/pack*.js; do
     f=${path##*/}
     a=$(sha256sum single/$f | cut -c1-12); b=$(curl -s "https://lucas-oba.github.io/moonlight-cat-village/$f?v=$RANDOM" | sha256sum | cut -c1-12)
     echo "$f $a $b"; done
   node tests/smoke_single.mjs https://lucas-oba.github.io/moonlight-cat-village/
   ```
4. 原始碼的變更提交到 `source` 分支（不要把 `single/`、`dist/` 提交到 `source`）。

## 8. 存檔相容性

- 存檔在 `localStorage['mcv_save_v1']`，`version: 1`。讀檔時 `Object.assign(newState(), 存檔)`，所以**新增欄位要在 `newState()` 給預設值**，舊存檔就能繼續玩。
- 不要改名或移除既有的任務 id、旗標 id、道具 id、貼紙 id（小朋友的存檔會壞掉）。真的要改，就寫遷移程式，並把 `version` 升級。
- 「新的一天」會重設 `daily_*` 旗標（每日事件用）。
- 讀檔時會把變大／變小狀態重設成正常大小。

## 9. 已知問題與未定事項

- **沒有在真的手機上測過**（尤其 iPhone／iOS Safari 的聲音、觸控、效能），只用 Playwright 模擬手機測。
- **字型子集**：0.11.0 已補入第三章用字。加台詞後先跑 `timeout 600 python3 tools_font_subset.py --check`。若有缺字，用 `python3 tools_font_subset.py` 從 `art_src/huninn.ttf` 重建，再檢查一次。
- **新動物（圓圓、露露、捲捲）從哪裡來**：擁有者刻意還沒決定，台詞裡**不要解釋來歷**。
- 服裝只改地圖上的外觀，戰鬥畫面不變。
- 第四章「水輪少了一格」接在第三章後面。故事與機制的已確認範圍記在 `CHAPTERS3_6_PROPOSAL.md`。
