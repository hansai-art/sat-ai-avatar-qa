# 免費公開部署設定

部署目標：GitHub 管理程式與問答，Cloudflare Pages 提供公開網站。使用免費 pages.dev 網址、純靜態輸出，不啟用 Workers Functions、D1、R2、AI API 或付費方案。

## 2026-09-18 指定網址遷移

帳號：Hans@groupg.org's Account（`73e4fbfb5c70c02d085384521c48592d`）。2026-09-18 本機 Codex 已重新 GET 兩個專案，完成舊站轉址及 GitHub homepage 更新；API、公開 HTTP 與手機瀏覽器證據見 ACCEPTANCE.md。

| 用途 | Pages 名稱 | 專案 ID | 狀態 |
|---|---|---|---|
| 新目標 | sathans | 2ffb3e76-00d5-4ff9-8f2c-fa319b2953e8 | 新網址已公開上線；版本與驗收見 ACCEPTANCE.md |
| 舊站 | sat-ai-avatar-qa | c5b1a0c2-bf29-44ba-b17c-662ea2c3689b | 保留為 301 轉址，路徑及 query 保留，自動部署已停用 |

- 指定新網址：https://sathans.pages.dev
- 舊站：https://sat-ai-avatar-qa.pages.dev
- 原 repository：https://github.com/hansai-art/sat-ai-avatar-qa
- 新舊皆連同一 repository；只有新站 main 更新會自動發布，舊站保留已部署的轉址。新站 production／preview SITE_URL 使用新網址。不要再建立另一個專案。
- 歷史部署與驗收證據：[ACCEPTANCE.md](ACCEPTANCE.md)，不改寫當時網址。
- 無 Functions 或資料庫，不新增付費方案。

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
| SITE_URL | https://sathans.pages.dev（新站；舊站只供應獨立轉址產物） |

`build:cloudflare` 依序執行 Astro check、Node 單元測試、網站建置及 Pagefind 索引，任何失敗會阻止發布。base 固定 `/`，避免沿用 GitHub 專案子路徑。正式模式仍要求課綱確認及真實發布內容。

新站 Git integration 已連接 repository ID `1374704009`，`production_deployments_enabled=true`、`preview_deployment_setting=none`，只有 main 更新自動發布。舊站 production_deployments_enabled=false、preview_deployment_setting=none，不重複建置。GitHub Pages 的 `deploy.yml` 已停用，`PUBLISH_ENABLED` 未設定。

Cloudflare 的建置指令會阻擋型別、單元測試、內容與產物錯誤；GitHub Actions 另跑桌面／手機瀏覽器測試，兩者獨立，並未設定等待 GitHub CI 的部署閘門。

本次雲端 GPT 已實際寫入 GitHub 並觸發新站發布，本機 Codex 補完 Cloudflare 設定及 GitHub metadata。日常內容更新只需提交至 main；更改網域或部署設定才需要相應帳號操作能力。權限仍依接手環境核對，不要求提供明文 token。

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

## 舊站轉址設定與回復

以下切換已於 2026-09-18 完成，保留步驟供查核，無需重新執行。舊轉址 deployment 為 `47c0516c-eb23-46f2-9210-75a8e363064b`，6 組路徑／query 實測皆為 301 至新站且最終 200，無迴圈。若需修改轉址，先更新獨立產物，再以舊專案部署 API 手動發布；其自動建置保持關閉。

獨立轉址產物放在 `deploy/legacy-redirect/`，不在 public/ 或新站 dist 內。新站繼續使用 `npm run build:cloudflare` 與 dist。

具備 Cloudflare Pages 權限的執行者應：

1. 重新 GET 兩專案，確認新站最新部署成功且與 GitHub main commit 一致；記錄 `github:push` 事件。
2. 新站 c44cbd97d0601f88817ba956b8a6beb80f3adadf 已通過全部 40 項公開驗收（含 canonical、OCR 與複製網址），證據見 ACCEPTANCE.md。接手先核對部署狀態；若網站功能另有變更，再跑必要回歸。
3. **只修改舊專案 sat-ai-avatar-qa**：build command=`exit 0`，destination directory=`deploy/legacy-redirect`，root 空白。不要將此設定套到 sathans。
4. 觸發舊專案部署，確認首頁、`/chapters/ch01/`、`/questions/qa-900001/` 及 `/?q=429`、`/questions/qa-900001/?q=429` 回傳 301，Location 指向新站且保留路徑及 query，追蹤後無迴圈。
5. `_redirects` 的 query 是否如預期保留必須實測；不把規則檔存在當成轉址已成功。若不符預期，先保留／恢復舊站原建置設定，不交付丟失查詢的轉址。
6. 舊轉址發布確認後，才關閉**舊專案** `production_deployments_enabled`，新站維持 main 自動發布。
7. 將 GitHub repository homepage 設為 https://sathans.pages.dev，更新實際驗收結果。

若新站故障而需要恢復舊站，可重新設定舊專案 build command=npm run build:cloudflare、destination directory=dist，使用原 SITE_URL，手動發布並驗證；本輪未演練此回復流程。不要刪除舊專案或將轉址產物設定套用到新站。

官方轉址規則：[Cloudflare Pages redirects](https://developers.cloudflare.com/pages/configuration/redirects/)。

公開驗收可在 GitHub Actions 手動執行 Public site acceptance；其 VERIFY_COMMIT 取所選分支提交，等待新站發布相同版本後才測試，不依賴 Cloudflare token。
