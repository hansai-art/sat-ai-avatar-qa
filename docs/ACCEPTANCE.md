# 驗收紀錄

## 2026-09-18 搜尋優先改版（本機驗收）

- 首頁與全部問題頁完整列出 15 題示範題，含 1 題明確標示的延伸問題版型；沒有真實提問者或正式答案。
- 第一章無小節入口，舊 `lesson=ch01-03` 網址轉為整章查詢，返回 3 題。
- 學員已問排在延伸問題之前，適用靜態列表與 Pagefind 搜尋／排序。
- `429` 搜尋顯示命中片段；清除篩選保留關鍵字；從單題返回可還原首頁搜尋網址。
- 複製按鈕位於標題附近；來源區分官方、講師、課程、社群與補充資料。
- 本機：Astro 0 errors／warnings／hints，14 個單元測試通過，32 個桌面／手機瀏覽器案例通過（26.0 秒）。
- 360×800 首頁第一題起點約 510px，整頁寬度 360px；1440px 桌面整頁寬度 1440px。已實際檢查桌面與手機首頁、搜尋截圖。
- 純靜態產物：47 HTML、90 檔案、15 題索引、約 1.14 MiB；未新增套件、API、資料庫或 Functions。
- 首次建置因舊 Astro 內容快取未重新套用 schema 預設值而失敗，改以 `astro build --force` 後通過。
- 正式問題清單、提問者、原網址與答案來源仍待 Hans 提供。截圖文字辨識本輪未實作。
- 公開部署驗收尚待本次 push 後補記，以下為前一版本的部署證據。


## 2026-09-18 公開 demo 部署驗收

- 公開網站：[sat-ai-avatar-qa.pages.dev](https://sat-ai-avatar-qa.pages.dev)
- 公開 GitHub：[hansai-art/sat-ai-avatar-qa](https://github.com/hansai-art/sat-ai-avatar-qa)
- 功能驗收 commit：`bd68269c11bebbf56e44f96f7c2d2d86142b22a8`。
- Cloudflare deployment：`42aec65b-dc63-4cbc-9e87-8acd1954b657`，[該次產物](https://42aec65b.sat-ai-avatar-qa.pages.dev)。
- Cloudflare 成功時間：2026-09-18 00:16:09 Asia/Taipei；API `latest_stage=deploy/success`，`uses_functions=false`。
- 觸發來源：`github:push`，分支 main，Cloudflare commit 與公開 `/build-info.json` 一致。確實由 GitHub 更新觸發，未使用一次性手動上傳。
- GitHub CI：[Website checks #35245430046](https://github.com/hansai-art/sat-ai-avatar-qa/actions/runs/35245430046)，根路徑與子路徑兩個 job 均 success。

### 本輪執行結果

| 驗收項目 | 真實結果 |
|---|---|
| 指定執行環境 | Node 24.19.0、npm 11.17.0；依既有 lockfile 執行 npm ci，未升級依賴 |
| Cloudflare 建置 | 本機及雲端 Astro 0 errors／warnings／hints；13 項單元測試通過；47 HTML、87 檔案、15 題索引、約 1.12 MiB |
| 本機瀏覽器 | 26/26 通過（17.0 秒），desktop 與 360×800 viewport |
| GitHub 瀏覽器矩陣 | 根路徑與 /sat-ai-avatar-qa/ 子路徑 job 通過，各跑 desktop／mobile |
| 公開站未登入驗收 | 26/26 通過（20.4 秒），全新 Chromium browser context，無帳號或儲存登入狀態 |
| 搜尋與交叉篩選 | 429 命中 1 題；愛馬仕可找到結果，TG 命中 1 題；429＋第 2 章為無結果；章節、小節、工具、類型交集與重新整理還原通過 |
| 分頁與返回 | 15 題可前往第 2/2 頁，瀏覽器返回還原第 1/2 頁 |
| 問題頁與圖片 | 單題可直接開啟並重新整理；圖片 naturalWidth > 0、可點開圖片；複製按鈕與剪貼簿實值一致 |
| 影片外連 | 卡片有說明與 noopener noreferrer，實際開啟 example.org 新分頁；明確標示格式示例，沒有真實課程影片 |
| 草稿及錯誤 | 草稿搜尋標记零結果、草稿網址與不存在的頁面 HTTP 404；索引失敗出現重試和章節入口；HTML 搜尋字串不執行腳本 |
| 無 JavaScript | 靜態列表及問題正文可閱讀 |
| 手機與視覺 | 360px 搜尋與問題頁可操作，scrollWidth=360；1440px 首頁 scrollWidth=1440；已讀取並檢查三張公開頁面截圖 |
| 示範與網址 | BUILD_MODE=demo，保留示範提示、noindex/nofollow；首頁 canonical 指向固定 pages.dev，demo sitemap 無 loc |
| 費用與平台 | 僅建立純靜態 Pages；未購買網域、未新增付費方案/API/資料庫；GitHub has_pages=false，deploy.yml 已停用，PUBLISH_ENABLED 未設定 |

公開驗收指令：

```sh
VERIFY_URL=https://sat-ai-avatar-qa.pages.dev \
VERIFY_COMMIT=bd68269c11bebbf56e44f96f7c2d2d86142b22a8 \
npm run test:e2e -- --workers=2 --reporter=line
```

此處 SHA 是已驗收的功能版本，之後文件更新會產生新 SHA；核對目前版本時，以 main 與公開 build-info.json 的 commit 為準。Cloudflare 與 GitHub CI 獨立，沒有宣稱 GitHub 瀏覽器測試會阻擋 Cloudflare 發布。

### 發現與修正

附件首次 CI `35244903398` 失敗：篩選欄位 label 包住 option 文字，無法精確辨識；安全測例把 HTML 字串當成必然無結果，但 Pagefind 會回傳內容。已加入精確 aria-labelledby，安全測例改驗證輸入維持文字、沒有注入 img 或執行 dialog，沒有刪除安全檢查。

本機 Astro 在代理環境會自動啟動背景 preview，導致 Playwright 認為 webServer 提前退出；加上 --ignore-lock，讓測試自行管理前景 server。公開站首次部署前的驗收如預期回傳 522，部署後同項及完整 suite 轉為通過。以上修正均已提交。

### 必要限制

目前只有 15 題已發布合成示範、1 題排除草稿及測試圖片。真實問答、圖片、影片與課綱確認仍等 Hans 提供；沒有將 confirmed 改為 true，也未將示範題改標 real。尚未驗證真實內容正確性、各正式影片存取、真人試用、1,000 題容量、實體手機、Safari／Firefox、完整輔助技術及部署回復演練。這些不阻擋本次示範站交付。


## 2026-09-17 附件原始驗收（歷史紀錄）

以下保留交接前的實測與限制，外部部署狀態已由上方 2026-09-18 紀錄更新。當時尚未有正式問答或 GitHub 部署結果。

## 已執行

| 檢查 | 結果與範圍 |
|---|---|
| Astro 型別／模板 | `npm run check`：0 errors、0 warnings、0 hints |
| Node 單元測試 | `npm run test:unit`：13 項通過，涵蓋路徑、搜尋狀態、日期、審核及內容驗證 |
| 根路徑建置 | 15 題示範問答進入索引；47 個 HTML；產物與內部連結檢查通過 |
| 未完成內容的正式建置 | 正式問答為空、課綱未確認時，以非零狀態中止；沒有產生可誤發布的正式站 |
| GitHub 專案子路徑 | `/sat-ai-avatar-qa/` 示範建置與內部連結／資產檢查通過 |
| 真實搜尋互動 | 瀏覽器查詢 429 → 1 題、愛馬仕 → 4 題、TG → 1 題；全部為合成示範資料 |
| 篩選與 URL | 429 與第 2 章交集 → 0 題；重新載入保留條件並顯示無結果訊息 |
| 分頁與返回 | 最近更新排序共 15 題；第 2 頁 3 題，上一頁操作還原第 1 頁與網址 |
| 草稿排除 | 搜尋 `DRAFT_BODY_SENTINEL` → 0 題；輸出產物不含該草稿標記 |
| 圖片與複製 | 問題頁圖片成功載入（naturalWidth 800）；複製按鈕顯示「已複製連結」 |
| 360px 版型 | 以 360px iframe 檢視首頁、搜尋、問題頁；搜尋可操作，未見整頁水平溢出 |
| 無 JavaScript | sandbox iframe 禁止腳本後，問題正文、圖片、相關問題與站內連結仍可見 |
| 正式／示範隔離 | 暫時合成 1 題正式發布、1 題正式封存並確認課綱：正式建置成功，索引只有 1 題；無示範圖片；封存頁帶 noindex 與替代題連結。測例已移除，原課綱未確認狀態已還原 |

瀏覽器互動透過本次工作環境執行；360px iframe 不等同於完整真實手機設備驗收。圖片為媒體測試色塊，尚未測試 Hans 提供的真實截圖。

## 尚未執行／不能宣稱已通過

- 專案的 Playwright 自動測試檔已提供，尚未執行整套 desktop／mobile runner。這與上表實際瀏覽器互動檢查分開記錄。
- GitHub Actions、Pages 實際發布、正式網址下的搜尋與圖片、DNS／自訂網域、部署回復。
- 真實課程內容的 20 組搜尋相關性驗收、5 位使用者試用、各正式影片存取條件。
- 1,000 題資料量下的索引大小、載入時間與效能目標。
- 實體手機、Safari／Firefox、完整無障礙與輔助技術驗收。

## 放行判斷

可接手開發與整理內容，也可在 GitHub 建立清楚標示的架構展示站。尚不宣稱正式問答服務已上線。

首批真實內容完成、課綱核對、CI 通過並部署後，記錄 repository、commit、Actions run、Pages 網址及正式內容查找結果，再完成正式發布驗收。

## Cloudflare 部署準備補充

`CF_PAGES_URL=https://example.com BUILD_MODE=demo npm run build:cloudflare` 本機執行通過：Astro 檢查無錯誤、13 項測試通過、47 個 HTML、87 個總檔案、15 題示範索引、約 1.12MiB。這是本機模擬 Cloudflare 環境變數，example.com 不是已部署網址。未設定站台網址時會拒絕建置。Cloudflare 帳號連接、GitHub 專案建立與雲端部署尚未完成。
