# 實作交付說明

版本：0.1.0；日期：2026-09-17。

公開閱讀已定案。Hans 提供正式問答、圖片與影片連結；本次交付網站程式、內容格式、分類架構及部署流程。沒有代寫或發布未經確認的課程答案。

## 已實作

| 部分 | 實際交付 |
|---|---|
| 網頁 | 首頁、全部問題、九章與通用入口、工具／問題類型列表、問題詳情、使用說明、404 |
| 查找 | 中文／英文與錯誤碼、工具別名、章節／小節／工具／類型交集、排序、每頁 12 題、網址還原 |
| 單題 | 摘要、正文、圖片、程式碼、表格、影片外連卡片、來源、相關問題、複製網址 |
| 維護 | 永久 ID、人工確認日、待更新狀態、草稿排除、封存替代題 |
| 內容 | Markdown 範本、原始內容提供表、建立新題指令、45 個課程小節標題快照 |
| 建置 | schema 與關聯驗證、Markdown 安全檢查、連結／圖片／base path 檢查、Pagefind 索引 |
| 發布 | GitHub Actions 品質檢查與 Pages 部署檔案；尚未在 GitHub 執行 |

## 與規格的具體對照

1. 使用 Astro 7.3.3、Pagefind 1.5.2、Node 24.19.0。確切依賴以 lockfile 為準。
2. `paths.mjs`、`search-state.mjs`、`schema.mjs` 使用可由 Node 直接執行的 JavaScript；Astro 與瀏覽器程式仍使用 TypeScript。檔案責任與 Spec 相同。
3. Pagefind npm 套件包含所需的 CJK 分詞。使用 Node API 明確加入已發布題目的 HTML，避免把封存頁或非問答頁算進索引；沒有另裝第二套搜尋服務。
4. 示範 Markdown 在 `tests/fixtures/questions/`，示範圖片在 `tests/fixtures/assets/`。正式模式僅載入 `src/content/questions/`，避免僅在頁面篩選時仍輸出示範媒體。
5. 15 題示範資料與 1 題合成草稿只用於驗證架構。影片網址是標示清楚的格式示例，沒有宣稱它是課程影片。
6. `taxonomy.json` 中 45 個小節標題取自指定的「林思翰知識衛星課程回答」Skill 教材快照（2026-09）；沒有複製付費正文。章名暫採第 1～9 章，所有真實章節與小節的 `confirmed` 保持 false，等 Hans 核對最新課綱。
7. 影片以 HTTPS 外連呈現，避免嵌入登入限定的課程播放器。圖片由 Astro 處理，正文必須附替代文字。
8. GitHub Pages 初次部署可手動選 `demo`。正式內容就緒後使用 `production`；設定 `PUBLISH_ENABLED=true` 才啟用 main 的自動正式發布。

## 正式上線前還需要

- Hans 提供首批問答與素材，核對章節／小節後整理成正式內容。至少一題才可正式建置；建議首批 30～50 題屬內容建議，並非強制門檻。
- 一個有寫入權限的 GitHub repository。目前未建立 repository、未設定 Pages，沒有可交付的公開網址。
- 在該 repository 實際跑完 Actions 與部署後檢查，再使用正式內容完成搜尋品質及真人試用。

本次已執行與尚未執行的檢查，逐項列於 [ACCEPTANCE.md](ACCEPTANCE.md)。文件與測試檔存在，不代表正式上線驗收已全部完成。

## 部署方案更新

主方案改為 GitHub 管理內容、Cloudflare Pages 免費發布；GitHub Pages 保留備用。`npm run build:cloudflare` 與 [Cloudflare 設定](CLOUDFLARE.md) 已加入；僅完成本機建置驗證，尚未建立雲端網站。
