# 免費公開部署設定

部署目標：GitHub 管理程式與問答，Cloudflare Pages 提供公開網站。使用免費 pages.dev 網址、純靜態輸出，不啟用 Workers Functions、D1、R2、AI API 或付費方案。

目前狀態：程式及本機建置設定已準備；Hans 已確認 Cloudflare 完成串接；接手環境仍需核對實際可用的 Pages 操作能力，GitHub 專案尚未確認建立。沒有已部署的公開網址。不能把本文件視為雲端設定已完成。

## 接手與部署設定

完整執行任務見 [CODEX-HANDOFF.md](CODEX-HANDOFF.md)。Cloudflare 帳號串接與 GitHub 自動部署整合須分別核對。

| 欄位 | 值 |
|---|---|
| GitHub 專案名稱 | 建議 sat-ai-avatar-qa，實際建立後核對 |
| Production branch | main |
| Framework preset | Astro |
| Root directory | 空白（專案根目錄） |
| Build command | npm run build:cloudflare |
| Build output directory | dist |
| NODE_VERSION | 24.19.0（亦已在 .nvmrc） |
| BUILD_MODE | demo；內容驗收後才改 production |
| SITE_URL | 正式模式必填實際 pages.dev 根網址；demo 可留空使用 CF_PAGES_URL |

`build:cloudflare` 依序執行 Astro check、Node 單元測試、網站建置及 Pagefind 索引，任何失敗會阻止發布。base 固定 `/`，避免沿用 GitHub 專案子路徑。正式模式仍要求課綱確認及真實發布內容。

只有 Cloudflare 的 Git integration 接通後，GitHub 更新才會自動發布。GitHub Pages 工作流程保留備用，預設未開啟 `PUBLISH_ENABLED`，本方案不啟用它。

若連線外掛不支援建立 Pages 或連接 GitHub，仍須由帳號持有人完成該項帳號操作；不要索取或把 API token 寫入公開 repository。

## 費用與用量控制

- 靜態頁面、搜尋檔案與壓縮圖片由 Cloudflare 提供，不經 GitHub Pages 承擔網站流量。
- 影片只放外連，保留在 YouTube 或原課程平台。
- 建議圖片 100～300KB，以可閱讀為前提；避免大 GIF 與影片原檔。
- 免費方案每月 500 次建置；整理成批次更新，必要時只自動發布 main，停用不需要的分支預覽。
- 建置檢查最多 20,000 個檔案、每個檔案不超過 25MiB。月份建置次數仍以 Cloudflare 後台為準。
- 不宣稱無條件永久免費；以當時平台免費額度與使用規則為準。

官方依據：
- [Cloudflare 靜態請求免費且不限次數](https://developers.cloudflare.com/pages/functions/pricing/)
- [免費方案限制](https://developers.cloudflare.com/pages/platform/limits/)
- [GitHub 自動部署](https://developers.cloudflare.com/pages/get-started/git-integration/)
- [CF_PAGES_URL 等建置環境變數](https://developers.cloudflare.com/pages/configuration/build-configuration/)
