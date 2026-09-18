# 知識衛星 AI 分身課程問答庫

公開閱讀的課程問答網站。程式採 Astro 靜態網站，內容是一題一檔的 Markdown，搜尋由 Pagefind 在瀏覽器執行。網站不需要會員帳號、資料庫或 AI API 金鑰。

**目前交付網站架構。正式問答、圖片與影片由 Hans 提供。** tests/fixtures 中的 15 題皆明確標示為示範資料，另有 1 題合成草稿供排除測試。不是 15 題已確認的課程答案。指定新網址：[https://sathans.pages.dev](https://sathans.pages.dev)（首次部署待驗收）；舊示範站 [https://sat-ai-avatar-qa.pages.dev](https://sat-ai-avatar-qa.pages.dev) 在切換完成前維持服務。程式與內容管理：[https://github.com/hansai-art/sat-ai-avatar-qa](https://github.com/hansai-art/sat-ai-avatar-qa)。

## Codex 接手

直接依 [完整接手任務書](docs/CODEX-HANDOFF.md) 完成 GitHub 與 Cloudflare 公開部署。2026-09-18 已完成 GitHub 與 Cloudflare Pages Git integration，實際版本及驗收見 [驗收紀錄](docs/ACCEPTANCE.md)。

## 已包含的功能

- 首頁直接列出全部問題，搜尋支援中文與英文、工具別名、錯誤碼及命中片段。
- 可選擇截圖，在瀏覽器辨識繁中／英文，再由使用者確認文字後搜尋。圖片不會上傳，無付費 OCR API；首次選圖才下載辨識資產。
- 學員已問優先、延伸問題排後；正式學員問題標示提問者可公開名稱與原討論連結。
- 章節、工具與問題類型交叉篩選，更多條件預設收合。第一章集中顯示，不分小節；其他章節保留小節篩選。條件可由網址還原，清除篩選保留關鍵字。
- 第 1～9 章、跨章與通用入口。45 個小節標題取自「林思翰知識衛星課程回答」Skill 的 2026-09 教材快照，尚待核對最新課綱。
- 單題永久網址、Markdown 正文、圖片、程式碼、表格、影片外連、來源、相關問題及複製連結。
- 更新與人工確認日期、待更新提醒、封存與替代題。
- 桌面與手機版型；沒有 JavaScript 時仍可閱讀靜態列表與問題頁。
- GitHub Actions 品質檢查，包含根路徑與專案子路徑測試；Cloudflare Pages 自動發布 main。

## 本機開啟架構預覽

使用 `.nvmrc` 的 Node 24.19.0。本輪本機部署驗證使用 npm 11.17.0，套件確切版本以 `package.json` 與 `package-lock.json` 為準。

```sh
npm ci
npm run build:demo
npm run preview
```

開啟終端機顯示的本機網址。不要直接以 `file://` 開啟輸出 HTML，搜尋模組需要 HTTP。

`npm run dev` 適合調整頁面樣式，預設使用示範資料；Pagefind 與截圖辨識資產必須經 `build:demo` 產生後在 `preview` 驗證。

```sh
npm run check
npm run test:unit
npx playwright install chromium
npm run test:e2e
```

實際已執行的檢查與限制見 [驗收紀錄](docs/ACCEPTANCE.md)。測試程式存在不等於全部已執行。

## Hans 如何提供內容

直接交付原有回答、圖片與影片網址即可，無須先學 Markdown。可參考 [內容提供格式](templates/content-intake.md)。由整理者轉成網站問答，缺答案的題目保持草稿。

每題整理後的檔案包含：問題標題、簡答、對應章節／小節、工具、問題類型、正文、來源與更新日期。圖片與影片都有描述，避免搜尋只能找到文字。

## 編輯者新增一題

1. 搜尋已有答案，避免重複。原始留言與未處理截圖放在專案之外。
2. 執行 `npm run new:question`，會建立下一個未用 ID 的草稿與圖片資料夾，不覆蓋既有檔案。
3. 編輯 `src/content/questions/qa-xxxxxx.md`，參照 [資料規格](docs/SPEC.md)。檔名就是固定 ID，不因標題改動而更名。
4. 圖片放在 `src/assets/questions/qa-xxxxxx/`，再從 Markdown 使用相對路徑引用，例如 `../../assets/questions/qa-xxxxxx/screen.png`。圖片要有 alt，每張小於 2MiB，發布前完成去識別化。
5. `videos` 填安全 HTTPS 網址、標題與說明；不支援影片上傳或 iframe。
6. 學員已問設 `questionOrigin: asked`，填 `askedBy` 的可公開 `name` 與原討論 `sourceUrl`。推測問題設 `anticipated`、`askedBy: []`，需由實際問題延伸並另行核對答案。核對來源後填 `reviewedBy: hans` 與 `verifiedAt`，設定 `answerStatus: verified`、`publication: published`。`contentOrigin` 必須是 `real`。
7. 更新 `updatedAt`。只有重新人工確認，才更新 `verifiedAt`。
8. 執行品質檢查與正式建置，經分支／PR 合併。

也能在 GitHub 的檔案編輯介面修改 Markdown 與上傳已處理圖片，不一定要安裝程式編輯器。**公開 repository 的草稿仍然公開，不能拿 draft 狀態保護私人資料。**

### 圖片與影片寫法

```markdown
![畫面中需要學生核對的設定](../../assets/questions/qa-000017/settings.png)
```

影片的 YAML 格式：

```yaml
videos:
  - title: "影片標題"
    url: "https://example.com/replace-with-real-video"
    description: "這支影片說明哪個操作，能協助解決什麼問題。"
    timestampLabel: "從 03:20 開始"
```

上例網址只是格式示例，不是實際影片。課程影片保留在原平台，不搬到 GitHub。

## 正式內容與示範資料隔離

| 模式 | 指令 | 包含什麼 |
|---|---|---|
| 架構預覽 | `npm run build:demo` | 只包含 `contentOrigin: demo` 的發布／封存頁，全站 noindex、顯示示範橫幅 |
| 正式網站 | `npm run build` | 只包含 `contentOrigin: real` 的發布／封存頁；索引只收錄已發布問答 |

正式建置要求 `taxonomy.json` 的課綱已核對並設為 `confirmed: true`，且至少一筆真實已發布問答。未達條件會失敗，不會把示範站誤當正式問答庫上線。30～50 題是內容起步建議，不是程式硬性門檻。

示範題保留在 tests/fixtures/questions，使用 qa-900001 起的 ID；正式內容放 src/content/questions，從 qa-000001 開始。兩者在內容載入時就分開，包含示範圖片也不會進入正式產物。

## 首選：GitHub 管理、Cloudflare 免費發布

使用 [Cloudflare 部署設定](docs/CLOUDFLARE.md)，建置指令為 `npm run build:cloudflare`。公開網站流量由 Cloudflare 承擔，不占 GitHub Pages 配額。先發布明確標示的 demo，正式內容完成後再切換 production。已建立 Pages 專案並連接本 repository。main 更新會觸發 Cloudflare 建置，通過型別、單元測試與產物檢查後發布。GitHub Actions 的瀏覽器檢查獨立執行，Cloudflare 不等待它完成。

## 備用：GitHub Pages 部署

本專案不使用 GitHub Pages。備用工作流程 `deploy.yml` 已在 GitHub 停用，`PUBLISH_ENABLED` 未設定。以下是歷史備用操作，除非另行決定更換平台，不要執行。

1. 在 GitHub 建立公開 repository，將此專案的內容放在根目錄。包含 `.github/`、`src/`、`scripts/`、`tests/`、`templates/`、`docs/`、`public/`、設定檔與 lockfile；不要提交 `node_modules/`、`dist/`、`.astro/` 或私人輸入。
2. 在 Settings → Pages，把 Source 設為 **GitHub Actions**。
3. 在 Actions 執行 **Publish GitHub Pages**。展示架構選 `demo`；內容完成後選 `production`。
4. 部署成功後使用 GitHub 提供的網址，檢查首頁、搜尋、問題頁和圖片。
5. 正式上線後，可在 repository 的 Actions variables 新增 `PUBLISH_ENABLED=true`，讓 main 後續更新自動發布 production。預設不啟用，避免尚無正式內容時反覆失敗。

工作流程會從 Pages 設定取得 origin 與 base path，不硬編碼擁有者帳號、repository 名稱或自訂網域。建置成功、測試通過後部署同一份 `dist`。

要在本機驗證專案子路徑：

```sh
BASE_PATH=/sat-ai-avatar-qa/ SITE_URL=https://example.com npm run build:demo
BASE_PATH=/sat-ai-avatar-qa/ npm run preview
```

上例為 macOS／Linux 語法；Windows PowerShell 分別設定 `$env:BASE_PATH`、`$env:SITE_URL` 再執行指令。`example.com` 只作本機驗證，不是已部署網址。

## 公開站驗證與更新

修改後 commit／push 到 main，或在 GitHub 合併 PR，Cloudflare 會自動發布。日後導入正式內容時，必須先完成課綱與答案審核，再把 Cloudflare 的 `BUILD_MODE` 改為 `production`。目前新增到正式內容目錄的題目不會混入 demo。

```sh
VERIFY_URL=https://sathans.pages.dev npm run test:e2e
```

上述測試使用全新未登入瀏覽器情境，可加入 `VERIFY_COMMIT=<預期完整 SHA>` 比對線上 `build-info.json`。需先依前文安裝依賴、Chromium 並產生本機 demo 產物。

## 常見維護

- 改答案：保留 ID，修訂原檔，更新適用條件與日期。
- 標示過期：設 `answerStatus: needs-update`、填 `reviewNote`、取消 `featured`。
- 合併題目：舊題改 `publication: archived`、填原因，`supersededBy` 指向已發布正本。
- 回復一般錯誤：`git revert` 有問題的 commit，再經檢查與部署。
- 個資／密鑰意外公開：撤下內容與資產，處理受影響憑證及 Git 歷史；一般 revert 不能刪除歷史中的秘密。

## 文件與責任

- [PRD](docs/PRD.md)：產品範圍、公開閱讀與內容分工。
- [Spec](docs/SPEC.md)：欄位、搜尋、路由、部署與驗收規格。
- [實作與規格差異](docs/IMPLEMENTATION.md)：本次已實作部分與待內容到位的檢查。
- [驗收紀錄](docs/ACCEPTANCE.md)：已執行結果與未執行項目。

## 使用聲明

公開 repository 不等於已選定開源授權。本階段未替程式、問答、教材或圖片授予 MIT／CC 等對外授權；由 Hans 決定後另補相應聲明。第三方套件維持其原授權。
