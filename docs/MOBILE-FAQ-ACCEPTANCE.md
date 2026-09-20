# 手機優先 FAQ 驗收紀錄

日期：2026-09-20。網站：<https://sathans.pages.dev/>。

## 本次內容

- 沿用 Astro 靜態網站、Pagefind、GitHub main 與 Cloudflare Pages 自動建置。
- 22 題正式 FAQ，來自 44 筆 FAQ 筆記與課堂 HTML 去重後的 10 個主討論，共 54 筆輸入紀錄。30 筆紀錄的指定子題映射至本次 FAQ，其餘支持留言、未整理子題與未解追問均保留分類。
- 每題保留 `sourceRefs`、來源連結、核對日期。對照清單見 `content-source-audit.json`。私人原始 HTML、筆記與暫存擷取檔未加入儲存庫或網站產物。
- 使用編輯優先序 `faqOrder`，不宣稱真實人氣、不顯示熱門次數。同一學生的追問不算新學生，例如費用題 qa-000017 的 5 筆來源僅對應 3 名提問者。
- 第 0 章與正式課綱順序已補入，第 1 章仍集中瀏覽。SEO 外掛概念與 Rank Math 安裝分為兩題。
- 原有示範內容保留在 demo 建置中作為圖片、影片與 OCR 測試素材，正式建置只發布真實 FAQ。舊示範網址 qa-900001 至 qa-900015 透過 301 導向相關正式 FAQ，未把示範 ID 改稱真實提問。

## 本機驗收

環境：Node 24.19.0、Playwright Chromium。瀏覽器每個測試使用未登入的新 context。

| 檢查 | 實際結果 |
| --- | --- |
| Astro 靜態檢查 | 36 個檔案，0 errors、0 warnings、0 hints |
| 單元測試 | 16 PASS |
| 正式內容瀏覽器測試 | 42 PASS、20 SKIP，跳過項目為示範內容專用測試 |
| 示範根路徑回歸 | 40 PASS、22 SKIP，跳過項目為正式 FAQ 專用測試 |
| 示範 `/sat-ai-avatar-qa/` 子路徑回歸 | 40 PASS、22 SKIP |
| 正式建置產物 | 56 個 HTML、22 題、約 17.14 MiB，站內連結與錨點檢查通過 |
| 360、390、430 px 寬度 | 無水平溢出，展開答案與進階篩選仍正常 |
| 390 × 844 首屏 | 第一題標題約在 y=457，第二題約在 y=572，兩題完整標題可見 |
| 字體與點擊區 | 題名字級至少 16 px，搜尋按鈕、用途篩選與展開區至少 44 px |
| 四種入口 | 常見、課程順序、操作排錯、概念理解通過，包含課程與資源及交集篩選 |
| 搜尋 | 電腦要一直開嗎、BotFather、Gemini http、Harness Hermes、SEO 外掛皆找到對應 FAQ |
| 狀態保存 | 排序、關鍵字、用途、章節、頁碼可重載分享，返回全文前的列表時恢復展開項目與捲動位置 |
| 空結果 | 可清除篩選保留關鍵字，或返回課程提問 |
| 圖片、影片、OCR | demo 測試驗證圖片原尺寸、影片外連、瀏覽器內 OCR，未把示範素材發布成正式教材 |
| 繁體排版檢查 | PASS，另有一項人工核對提示「優化」，出自正式課綱名稱，保留原文；未宣稱 strict 模式零警告 |

檢查過程修正 Pagefind native 檔案寫入尚未落盤時關閉服務造成的空白 JS。改由 `getFiles()` 取得索引檔並同步寫入，建置另檢查主程式大小。子路徑第一次啟動超時源自前一輪根路徑預覽程序，結束該程序後重跑通過。

重跑指令：

```sh
npm ci
BUILD_MODE=production npm run check
npm run test:unit
SITE_URL=https://sathans.pages.dev npm run build
BUILD_MODE=production npx playwright test --workers=2 --reporter=line
```

## 公開站驗收

發布與公開站證據在 GitHub 推送及 Cloudflare 完成後補記於本節。

## 證據限制

- 編輯核對不等於 Hans 再次逐題審核，也不等於已在每位學生的電腦重現解決。網站來源區明確標示 AI 編輯核對。
- Telegram 自己的 bot `/help` 與錄影不同、Gemini 錯誤的個別環境根因、LINE 補課上架等未有完整證據，沒有寫成已解決。見來源清單的 `followupsPending`。
- 沒有正式學員操作觀察或可用性訪談，因此不把自動測試等同於「學生一定瞬間找到答案」。
- 正式截圖與影片尚未提供，本次真實 FAQ 使用文字與已核對來源。
- 改版前版本為 `9c5177044430096ff71300701c03c6f5c4083b5a`。若需回復整個示範版本，須同時恢復 demo 建置模式，避免舊程式以 production 發布空內容。
