# 政策光譜測驗

[![Live Demo](https://img.shields.io/badge/GitHub%20Pages-Live-2ea44f?style=flat&logo=githubpages&logoColor=white)](https://rh77-sudo.github.io/twpartygame/)
[![Version](https://img.shields.io/badge/version-2.1.9-0A66C2?style=flat)](https://github.com/rh77-sudo/twpartygame)
[![GitHub last commit](https://img.shields.io/github/last-commit/rh77-sudo/twpartygame?style=flat)](https://github.com/rh77-sudo/twpartygame/commits/master)
[![GitHub commit activity](https://img.shields.io/github/commit-activity/m/rh77-sudo/twpartygame?style=flat)](https://github.com/rh77-sudo/twpartygame/commits/master)
[![GitHub repo size](https://img.shields.io/github/repo-size/rh77-sudo/twpartygame?style=flat)](https://github.com/rh77-sudo/twpartygame)
[![GitHub language count](https://img.shields.io/github/languages/count/rh77-sudo/twpartygame?style=flat)](https://github.com/rh77-sudo/twpartygame)
[![Top language](https://img.shields.io/github/languages/top/rh77-sudo/twpartygame?style=flat)](https://github.com/rh77-sudo/twpartygame)
[![HTML · CSS · JS](https://img.shields.io/badge/stack-HTML%20%7C%20CSS%20%7C%20JS-F7DF1E?style=flat&logo=javascript&logoColor=black)](https://github.com/rh77-sudo/twpartygame)
[![Traditional Chinese](https://img.shields.io/badge/lang-zh--Hant-red?style=flat)](https://rh77-sudo.github.io/twpartygame/)
[![Questions](https://img.shields.io/badge/questions-55%20national%20%2B%20112%20city-informational?style=flat)](https://github.com/rh77-sudo/twpartygame)
[![GitHub issues](https://img.shields.io/github/issues/rh77-sudo/twpartygame?style=flat)](https://github.com/rh77-sudo/twpartygame/issues)
[![GitHub stars](https://img.shields.io/github/stars/rh77-sudo/twpartygame?style=social)](https://github.com/rh77-sudo/twpartygame/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/rh77-sudo/twpartygame?style=social)](https://github.com/rh77-sudo/twpartygame/network/members)
[![GitHub watchers](https://img.shields.io/github/watchers/rh77-sudo/twpartygame?style=social)](https://github.com/rh77-sudo/twpartygame/watchers)

**線上版：** [https://rh77-sudo.github.io/twpartygame/](https://rh77-sudo.github.io/twpartygame/)

用 **6 題**測試你的政策傾向（全國與城市相同）：每一題是一個公共議題，底下有**三個匿名路線**（三黨真實公開立場，順序打亂）。選你最認同的一個（或沒意見）；結束後才揭曉是誰的主張，看你**最常對齊哪一黨**。

## 為什麼做這個測驗？

我們常先問「是誰提的」，才決定要不要支持。本測驗先隱藏政黨標籤，請你只依內容選擇——**對事不對人**。

## 怎麼玩

1. 用瀏覽器開啟根目錄的 `index.html`（或開 GitHub Pages）。
2. 選擇**全國**或**城市**（六都＋新竹）。
3. 每題：中立議題 → 三匿名立場 A／B／C → 選一個或沒意見；可點立場右上角 **?** 看白話解釋。
4. 結束後看對齊長條圖與逐題揭曉。

## 題庫

| 檔案 | 規模 |
|------|------|
| `data/issues-data.js` | 全國 **55** 議題（含立場白話 `plain`） |
| `data/city-issues-data.js` | **7 市 × 16 題 = 112**（含立場白話 `plain`） |
| `research/issues-research.json` | 含來源 URL 的研究對照 |

立場依 2018–2026 公開政見、立院、市政與媒體紀錄濃縮，**非虛構政見**。白話說明不標示政黨，避免作答前劇透。

## 專案結構

```
twpartygame/
├── index.html          # 入口（GitHub Pages）
├── README.md
├── js/
│   └── game.js         # 測驗邏輯
├── data/
│   ├── issues-data.js      # 全國題庫
│   └── city-issues-data.js # 城市題庫
├── research/           # 研究素材／媒體論點 JSON（不直接載入頁面）
├── archive/            # 舊版題庫格式（僅參考）
├── tools/              # 維護腳本（如 anti-spoiler 稽核）
└── docs/               # 開發筆記／待辦
```

## 維護腳本

```bash
node tools/audit-spoilers.js
```

## 免責

僅供教育與自我檢視，非正式民調；立場摘要不代表本站立場。
