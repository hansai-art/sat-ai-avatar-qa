# 免費公開部署設定

部署目標：GitHub 管理程式與問答，Cloudflare Pages 提供公開網站。使用免費 pages.dev 網址、純靜態輸出，不啟用 Workers Functions、D1、R2、AI API 或付費方案。

2026-09-18 實際狀態：已透過 Cloudflare API 建立 Pages 並發布 demo。帳號為 `Hans@groupg.org's Account`（`73e4fbfb5c70c02d085384521c48592d`），Pages 專案 ID 為 `c5b1a0c2-bf29-44ba-b17c-662ea2c3689b`。

- 公開網站：[https://sat-ai-avatar-qa.pages.dev](https://sat-ai-avatar-qa.pages.dev)
- 公開 repository：[https://github.com/hansai-art/sat-ai-avatar-qa](https://github.com/hansai-art/sat-ai-avatar-qa)
- 部署與驗收證據：[ACCEPTANCE.md](ACCEPTANCE.md)
- 純靜態 Pages，沒有 Functions 或任何資料庫綁定，未新增付費方案。

## 接手與部署設定

完整執行任務見 [CODEX-HANDOFF.md](CODEX-HANDOFF.md)。Cloudflare 帳號串接與 GitHub 自動部署整合須分別核對。

| 欄位 | 值 |
|---|---|
| GitHub 專案名稱 | hansai-art/sat-ai-avatar-qa（public） |
| Production branch | main |
| Framework | Astro 靜態輸出；API 直接設定下列建置值 |
| Root directory | 空白（專案根目錄） |
| Build command | npm run build:cloudflare |
| Build output directory | dist |
| NODE_VERSION | 24.19.0（亦已在 .nvmrc） |
| BUILD_MODE | demo；內容驗收後才改 production |
| SITE_URL | https://sat-ai-avatar-qa.pages.dev |

`build:cloudflare` 依序執行 Astro check、Node 單元測試、網站建置及 Pagefind 索引，任何失敗會阻止發布。base 固定 `/`，避免沿用 GitHub 專案子路徑。正式模式仍要求課綱確認及真實發布內容。

Git integration 已連接 repository ID `1374704009`，`production_deployments_enabled=true`、`preview_deployment_setting=none`，只有 main 更新自動發布。GitHub Pages 的 `deploy.yml` 已停用，`PUBLISH_ENABLED` 未設定。

Cloudflare 的建置指令會阻擋型別、單元測試、內容與產物錯誤；GitHub Actions 另跑桌面／手機瀏覽器測試，兩者獨立，並未設定等待 GitHub CI 的部署閘門。

本輪使用現有 Cloudflare 連線與本機 GitHub CLI，已具備建立、push、Pages 設定與 Git 整合能力，不需重新安裝或提供 token。

更新：提交至 main 後，在 Cloudflare 部署紀錄核對 `github:push` 及 commit；公開 `/build-info.json` 的 `commit` 應一致。回復：對問題 commit 執行 `git revert` 並 push，由相同流程重建；本輪未實際演練回復。

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
