# Codex 接手任務：將課程問答庫發布成免費公開互動網站

2026-09-18 最新範圍：首頁改為搜尋與完整問題列表，第一章不分小節。已問問題優先、延伸問題排後；正式題需要可公開的提問者與原討論網址。公開站暫維持 demo，真實清單尚待 Hans 提供。此段取代下文舊首頁編排，部署權限沿用既有授權，不需重新安裝或逐步確認。 搜尋優先改版已公開發布，34 項未登入瀏覽器驗收通過，版本與來源見 [ACCEPTANCE.md](ACCEPTANCE.md)。

此為原始交接任務與後續維護背景。2026-09-18 已完成 GitHub 管理及 Cloudflare demo 發布；最新網址、部署 commit、CI 與公開驗收結果見 [ACCEPTANCE.md](ACCEPTANCE.md)。後續接手應先讀該紀錄，不必重建專案。

## 1. 這次必須完成的成果

把附件 `sat-ai-avatar-qa-starter.zip` 中已完成的網站，放到我的 GitHub，使用 Cloudflare Pages 免費發布。最後交付一個一般學生不需登入、手機與電腦皆可使用的公開 HTTPS 網址。

本次先上線「架構示範站」。正式課程問答、圖片與影片由我（Hans 林思翰）之後提供，不要因為缺少正式內容而停止部署，也不要自行捏造課程答案。

網站至少可搜尋問題、依章節／小節／工具／問題類型篩選、查看單題正文與圖片、開啟影片連結、分頁及複製單題網址。

## 2. 已定案，不需要再詢問

- 公開閱讀，不需會員、不驗證購課資格。
- GitHub 管理程式與經整理的公開內容；Cloudflare Pages 提供網站。不要啟用 GitHub Pages 承擔網站流量。
- 使用免費 pages.dev 網址，不買網域、不開付費方案。
- 沿用 Astro＋Markdown＋Pagefind。搜尋在瀏覽器執行，不加 AI API、向量資料庫、會員後端或伺服器資料庫。
- 文字與已處理的圖片放專案；影片保留在 YouTube 或原課程平台，只放外連。
- 我已授權完成本專案所需的程式修改、依賴安裝、建立公開專案、commit／push、免費部署及公開發布。依環境安全規則與實際存取能力執行，不需要逐步重複問我是否同意。
- 涉及付款、刪除或覆寫不屬於本專案的既有網站時，停止該項操作並說明。

遵循 ponytail：先讀現有程式，沿用已完成的架構，用最少改動完成部署。不要為了接手重新開發整個網站。

## 3. 最新帳號狀態

- **Cloudflare：我已確認完成串接。** 不要沿用舊文件的「尚未連接」判斷或直接要求重新安裝。
- 接手後先確認你所在的 Codex 環境能否看見 Cloudflare 連線、實際帳號及 Pages 操作能力。換一個執行環境不代表原本連線會自動帶過去。
- GitHub 帳號先前已核對為 `hansai-art`，本次仍應從實際連線確認。
- 已核實建立公開 repository：`hansai-art/sat-ai-avatar-qa`。
- 本輪本機 GitHub CLI 具備建立 repository、commit 與 push 能力；Cloudflare API 已建立 Pages 與 Git integration。
- Cloudflare 與 GitHub 的帳號連線、Cloudflare 對該 repository 的 Git integration 是不同狀態。要核對後者是否完成，不能只看到外掛已連接就宣稱會自動部署。

如本環境缺少必要操作能力，先完成所有不受影響的工作，再一次列出最小必要人工操作。指出「哪個環境／哪項操作無法使用」，不要要求我提供密碼或把 API token 貼進聊天、程式碼或 GitHub。

## 4. 先讀檔案，再修改

解壓縮並確認專案根目錄，根目錄必須直接包含 package.json。解壓後的外層資料夾不要再多包一層推到 repository。

先閱讀：

1. `README.md`
2. `docs/CLOUDFLARE.md`
3. `docs/PRD.md`、`docs/SPEC.md`
4. `docs/IMPLEMENTATION.md`、`docs/ACCEPTANCE.md`
5. `package.json`、`.nvmrc`、`scripts/build-cloudflare.mjs`
6. `src/content.config.ts`、`src/data/taxonomy.json`、`tests/browser/site.spec.ts`

如果 GitHub 上已經有這個專案，先檢查遠端內容與最新 commit，不要用附件直接覆蓋別人後來做的修改。以遠端現況整合必要變更。若同名 repository 屬於不同用途，不要拿來替換。

本任務書記載的是最新需求；舊文件中的 GitHub Pages 部署方式只作備用，舊帳號狀態以這裡為準。請同步修正文件中已過時的狀態。

## 5. 現有成果與真實限制

現有程式包含首頁、九章與通用入口、工具與問題類型列表、單題頁、搜尋／篩選／排序／分頁、圖片、影片外連、相關問題、草稿／封存／待更新狀態。

內容與資產分開載入：

| 類別 | 路徑與狀態 |
|---|---|
| 正式問答 | `src/content/questions/`，目前沒有正式已發布資料 |
| 正式圖片 | `src/assets/questions/` |
| 示範問答 | `tests/fixtures/questions/`，15 題已發布示範、1 題合成草稿 |
| 示範圖片 | `tests/fixtures/assets/` |
| 分類與課綱 | `src/data/taxonomy.json` |
| 新題範本 | `templates/question.md` |
| 我提供原始內容的格式 | `templates/content-intake.md` |

課綱已有第 1～9 章及 45 個小節標題，取自指定的「林思翰知識衛星課程回答」Skill 教材快照。真實章節／小節的 confirmed 保持 false，等我核對。不要為了讓正式建置通過，就批次改成 true。

目前曾通過的檢查：Astro check、13 項 Node 單元測試、根路徑與 GitHub 專案子路徑建置、部分真實瀏覽器互動。Cloudflare 建置指令曾在本機模擬環境成功，產物約 1.12MiB。

本輪新增實證：完整 Playwright runner、遠端 GitHub Actions、Cloudflare 部署與公開網址驗收，詳見 ACCEPTANCE.md。正式內容、實體手機、Safari／Firefox、回復演練與容量測試仍未驗收。

## 6. 執行順序

### A. 核對存取並準備 GitHub

1. 確認附件或工作區完整，核對目前 GitHub／Cloudflare 帳號與權限。
2. 搜尋並核對 `hansai-art/sat-ai-avatar-qa` 是否已存在。若不存在且你具備建立能力，建立 Public repository；若缺少能力，只請我建立空白專案並提供網址，其餘由你完成。
3. 使用正確專案目錄建立或沿用 Git。不要提交 node_modules、dist、.astro、憑證、原始學員資料或私人截圖。
4. 保留 package-lock.json、.nvmrc、.gitignore、.github、所有 source、templates、docs、scripts 與測試資料。不要 force-push 覆蓋未知遠端工作。

### B. 安裝、建置與驗證

1. 使用 `.nvmrc` 指定的 Node 24.19.0，執行 `npm ci`。除非相容性問題確實阻擋部署，不要順手全面升級依賴。
2. 本機架構建置可執行：

   ```sh
   CF_PAGES_URL=https://example.com BUILD_MODE=demo npm run build:cloudflare
   ```

   這個 example.com 只用於本機驗證，不能宣稱它是正式網址。Windows 環境請使用等效環境變數設定。
3. 該指令已包含 Astro check、Node 單元測試、靜態建置、Pagefind 索引、連結及 Cloudflare 檔案額度檢查，避免不必要地重複整套流程。
4. 按 README 安裝 Chromium 並執行 `npm run test:e2e`。若環境限制不能執行，使用本環境允許的瀏覽器驗證，並在具備能力的 CI 執行既有測試。清楚記錄哪一項尚未完成。
5. 遇到錯誤先修根因，再重跑相關檢查。不要刪掉測試、放寬內容驗證或把缺少課綱確認當成可以略過的錯誤。

### C. 建立 Cloudflare Pages 並部署

優先使用已串接、具備寫入能力的 Cloudflare 操作途徑，連接正確 GitHub repository；若只提供查詢或文件能力，不要假裝已完成部署。

設定值：

| 欄位 | 本次設定 |
|---|---|
| 平台 | Cloudflare Pages，純靜態網站 |
| Production branch | main |
| Framework preset | Astro |
| Root directory | 空白，使用 repository 根目錄 |
| Build command | npm run build:cloudflare |
| Build output directory | dist |
| NODE_VERSION | 24.19.0 |
| BUILD_MODE | demo |
| SITE_URL | 優先填實際分配的固定公開根網址；尚未取得時 demo 可用平台提供的 CF_PAGES_URL |
| base path | `/`，既有 Cloudflare 建置指令已處理 |

這裡的 Production branch 指公開網站使用的分支，不代表現在要切成正式內容模式。**本次仍用 BUILD_MODE=demo**。

- 使用 Cloudflare 實際回傳的 pages.dev 網址，不猜測名稱一定可用。
- 第一次取得固定公開網址後，核對 canonical、sitemap、站內路徑及搜尋結果網址，必要時補 SITE_URL 並重建。
- 不安裝 Astro 的 SSR adapter，不建立 Functions、資料庫、R2 或付費 AI 服務；現有靜態功能已足夠。
- 不啟用 GitHub Pages，也不要設定 PUBLISH_ENABLED=true。
- GitHub Actions 維持程式品質檢查。Cloudflare Git integration 不一定會等待 GitHub 的所有 CI 完成；核對實際發布條件，不要宣稱存在未設定的阻擋機制。
- 實際完成 GitHub 更新後的自動發布確認，避免最後只是一次性手動上傳。只需最少必要的一次驗證，不要製造大量空提交。
- 保持全站「架構示範／非正式課程答案」提示及 noindex。公開可讀和禁止搜尋引擎索引是不同設定，noindex 不會阻擋學生開啟網址。

### D. 以公開網址驗收

必須使用未登入學生也能開啟的正式公開網址，不能只檢查本機。

| 項目 | 完成條件 |
|---|---|
| 公開閱讀 | 一般未登入瀏覽器可開首頁和問題頁，不出現 Cloudflare Access 登入要求 |
| 搜尋 | `429` 找到對應示範題；`愛馬仕`、`TG` 可找到工具別名結果 |
| 交叉篩選 | `429` 搭配第 2 章得到無結果提示；重新整理保留條件 |
| 分頁 | 15 題列表可前往第 2 頁，返回時還原狀態 |
| 單題頁 | 直接貼入單題網址、重新整理皆正常，能複製單題連結 |
| 圖片 | 圖片確實載入且手機不造成整頁水平溢出 |
| 影片 | 外連卡片與描述正常；目前格式示例不能宣稱是已驗證的真實影片 |
| 草稿 | 草稿無可公開問題頁，也不進搜尋索引 |
| 行動裝置 | 至少 360px 寬度下可搜尋、篩選與閱讀 |
| 錯誤處理 | 搜尋無結果、索引載入失敗、404 有可理解的提示或返回入口 |
| 更新 | 對應 repository 更新能觸發 Cloudflare 正確建置與公開版本更新 |
| 費用 | 沒有為本專案啟用付費方案、付費 API 或不需要的後端服務 |

不要用大量流量壓力測試來驗證免費額度。本次沒有正式內容，不需等候真人試用或完成 1,000 題效能驗收才交付示範站。

## 7. 內容到位後才做的事

我之後提供真實問答、圖片與影片連結，再整理到正式內容目錄。保留來源、日期、人工確認資訊及去識別化處理。

只有課綱核對、正式內容與審核資訊齊備後，才把 BUILD_MODE 改成 production。不要冒充我已審核，也不要為了上線直接把示範題改標 real。示範資料與圖片不得混進正式產物。

## 8. 文件與交付

將 README 寫清楚網站用途、公開網址、GitHub 位址，以及日後如何新增問答／圖片／影片、如何更新和回復。更新 docs/CLOUDFLARE.md、docs/ACCEPTANCE.md 與相關規格的真實狀態，讓下一個 AI 可以接手。

部署資料記錄實際 GitHub commit、Cloudflare 部署紀錄與驗收日期，保留在專案文件；不用把大量技術紀錄塞進最後回覆。

最後只回報：

1. 可公開開啟的網站網址。
2. GitHub 專案網址。
3. 本輪實際驗證通過的功能與必要限制。
4. 目前為示範資料，正式內容等我提供。

如因外部存取能力仍無法部署，明確寫「尚未上線」、具體卡住的操作，以及我只需要完成的最少步驟。不要以重新提供 ZIP、規劃書或本機截圖冒充公開網站交付。
