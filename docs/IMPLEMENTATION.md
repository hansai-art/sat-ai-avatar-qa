# 實作交付說明

版本：0.1.0；部署更新：2026-09-18。

公開閱讀已定案。Hans 提供正式問答、圖片與影片連結；本次交付網站程式、內容格式、分類架構及已上線的 Cloudflare demo。沒有代寫或發布未經確認的課程答案。

## 已實作

| 部分 | 實際交付 |
|---|---|
| 網頁 | 首頁、全部問題、九章與通用入口、工具／問題類型列表、問題詳情、使用說明、404 |
| 查找 | 中文／英文與錯誤碼、工具別名、章節／小節／工具／類型交集、學員已問優先、搜尋每頁 12 題、網址還原；首頁與第一章顯示完整列表 |
| 單題 | 摘要、正文、圖片、程式碼、表格、影片外連卡片、來源、相關問題、複製網址 |
| 維護 | 永久 ID、人工確認日、待更新狀態、草稿排除、封存替代題 |
| 內容 | Markdown 範本、原始內容提供表、建立新題指令、45 個課程小節標題快照 |
| 建置 | schema 與關聯驗證、Markdown 安全檢查、連結／圖片／base path 檢查、Pagefind 索引 |
| 發布 | GitHub Actions 品質檢查已通過，Cloudflare Pages Git integration 自動發布 main |

## 與規格的具體對照

1. 使用 Astro 7.3.3、Pagefind 1.5.2、Node 24.19.0。確切依賴以 lockfile 為準。
2. `paths.mjs`、`search-state.mjs`、`schema.mjs` 使用可由 Node 直接執行的 JavaScript；Astro 與瀏覽器程式仍使用 TypeScript。檔案責任與 Spec 相同。
3. Pagefind npm 套件包含所需的 CJK 分詞。使用 Node API 明確加入已發布題目的 HTML，避免把封存頁或非問答頁算進索引；沒有另裝第二套搜尋服務。
4. 示範 Markdown 在 `tests/fixtures/questions/`，示範圖片在 `tests/fixtures/assets/`。正式模式僅載入 `src/content/questions/`，避免僅在頁面篩選時仍輸出示範媒體。
5. 15 題示範資料與 1 題合成草稿只用於驗證架構。影片網址是標示清楚的格式示例，沒有宣稱它是課程影片。
6. `taxonomy.json` 中 45 個小節標題取自指定的「林思翰知識衛星課程回答」Skill 教材快照（2026-09）；沒有複製付費正文。章名暫採第 1～9 章，所有真實章節與小節的 `confirmed` 保持 false，等 Hans 核對最新課綱。
7. 影片以 HTTPS 外連呈現，避免嵌入登入限定的課程播放器。圖片由 Astro 處理，正文必須附替代文字。
8. Cloudflare Pages 使用 `BUILD_MODE=demo`、`BASE_PATH=/`、新站固定 `SITE_URL=https://sathans.pages.dev`（首次發布待驗收）。GitHub Pages 已停用。
9. 本輪必要修正：篩選／排序加入精確的可及名稱；Playwright 使用前景 preview、支援 `VERIFY_URL` 與 `VERIFY_COMMIT`；建置資訊包含來源 commit。修正 XSS 測例將「HTML 字串不可執行」誤當「一定零結果」的假設，保留並強化不可執行的斷言。

## 正式上線前還需要

- Hans 提供首批問答與素材，核對章節／小節後整理成正式內容。至少一題才可正式建置；建議首批 30～50 題屬內容建議，並非強制門檻。
- GitHub 與 demo 已上線；正式內容模式仍未啟用。網址與部署證據見 [ACCEPTANCE.md](ACCEPTANCE.md)。
- 使用正式內容完成搜尋品質及真人試用；不能以 demo 測試取代答案審核。

本次已執行與尚未執行的檢查，逐項列於 [ACCEPTANCE.md](ACCEPTANCE.md)。文件與測試檔存在，不代表正式上線驗收已全部完成。

## 部署方案更新

主方案改為 GitHub 管理內容、Cloudflare Pages 免費發布；GitHub Pages 保留備用。`npm run build:cloudflare` 與 [Cloudflare 設定](CLOUDFLARE.md) 已加入；已完成雲端建置與公開發布；本輪實測見 [驗收紀錄](ACCEPTANCE.md)。

## 2026-09-18 搜尋優先改版

沿用 Astro 與 Pagefind，未新增套件。首頁改用共用 Listing，完整列出所有問題；第一章不分小節。新增 questionOrigin、askedBy 與公開名稱／來源驗證。搜尋依提問來源分組，保留組內關聯度或更新排序，顯示安全的命中片段。手機篩選收合、清除條件保留關鍵字、複製連結移至標題附近。

Astro 的內容快取存於 node_modules/.astro；只清 .astro 無法更新匯入 schema 的預設值。build 改用官方 --force 選項，確保既有 Markdown 在 schema 更新後重新解析。

公開瀏覽器測試發現快速返回會早於問題頁的外部 module 完成載入。返回連結改用緊鄰導覽的 inline script，先驗證同來源與允許的搜尋路徑，再從 sessionStorage 還原；不依賴網路載入後才更新連結。已加入阻擋外部 script 的回歸案例與惡意返回網址測試。

## 2026-09-18 截圖搜尋

新增本機 OCR，使用者選擇圖片後才載入 Tesseract.js worker、核心與繁中／英文資料。無雲端辨識 API，build 從固定 npm 依賴複製同站資產。截圖不儲存，文字確認後才交給既有 Pagefind 搜尋。小字辨識前最多放大 2 倍，總像素限制 800 萬；保留人工修改與文字搜尋入口。

實際回歸包含繁中／英文與 429 辨識、未選圖不載入 OCR、同來源 GET 請求、確認前不更新查詢、格式／容量拒絕、離線載入失敗、取消、重試與過長文字拒絕。測試圖片為合成測例，不是正式問題或學員截圖。
