# 《月光貓村》原始碼（source 分支）

給小朋友玩的貓咪奇幻冒險 RPG（Phaser 3 + TypeScript + Vite，手機直式 390×844）。目前是 **試玩版 0.8.2**，第一章（主題：勇氣）已完成。

- 線上試玩：https://lucas-oba.github.io/moonlight-cat-village/
- `main`／`gh-pages` 分支只放打包好的單檔版遊戲（給 GitHub Pages 用），**原始碼在這個 `source` 分支**。
- 開發、測試、發佈的完整說明（也是給 AI 程式助理看的交接文件）：**[AGENTS.md](AGENTS.md)**
- 設計文件：[DESIGN.md](DESIGN.md)、[CHAPTER1.md](CHAPTER1.md)、[CH1_WHIMSY_PROPOSAL.md](CH1_WHIMSY_PROPOSAL.md)、[SLICE1_NOTES.md](SLICE1_NOTES.md)

```bash
npm ci          # 會自動把 binpack/ 還原成圖片、音樂、字型
npm run dev     # 開發
npm run build   # 建置到 dist/
```

## 授權與素材
- 背景音樂、音效：作者（林楊清）自己製作，同意公開。
- 字型：jf 粉圓（Huninn），SIL Open Font License。
- 圖片：本專案用 AI 生成後處理的像素圖。
