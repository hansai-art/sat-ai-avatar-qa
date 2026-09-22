# 操作圖片：小預覽與放大閱讀

2026-09-23。圖片放在答案的「先做這一步」之後。列表維持文字，詳細頁的每張圖只占一小列；點開才下載完整解析度的圖片。

## 已加入的真實截圖

| 問題 | 來源 | 截圖日期 | 用途 |
| --- | --- | --- | --- |
| [模型選單](https://sathans.pages.dev/questions/qa-000052/#operation-images) | Q060 講師回覆附圖 | 2026-09-16 | 展開選單後辨認 ChatGPT or Codex Subscription |
| [HTTP 429](https://sathans.pages.dev/questions/qa-000053/#operation-images) | Q058 學員附圖 | 2026-09-13 | 辨認錯誤訊息、切換服務商與複製錯誤按鈕 |

兩張均經目視檢查，沒有學生姓名、帳號、Token、API Key 或配對碼，也沒有 EXIF、XMP、IPTC。專案中的檔案與提供的原圖位元一致，不曾用生成圖片替代操作畫面。圖片未標示 Hermes 版本，前台明寫「未標示」。其他帶有聯絡人或配對碼的原始截圖沒有放進公開專案。

公開檔案 SHA-256：

- `model-provider-menu.jpg`：`8675c489e13e8c143660e85573252a0c1461a08373ae8c3cc57f44ee314c6cd9`
- `http-429-error.png`：`f32d11b7723eb50d741f11d35d78b06428869d600bcf306c55a388f4a809a087`

## 學生操作

- 點小預覽開啟看圖視窗，支援雙指縮放、雙擊縮放、拖曳及滑鼠滾輪。
- 固定提供「全圖」「縮小」「放大」「關閉」按鈕，點擊區至少 44px。
- Esc 關閉，Tab／Shift+Tab 在看圖視窗內循環；背景暫停互動，關閉後恢復原閱讀位置與焦點。
- 縮圖延遲載入，大圖與縮放程式在開啟時才載入。無 JavaScript 時，小預覽仍是可開啟大圖的普通連結。
- 圖片失敗顯示中文提示，仍可立即關閉。開啟不使用過場動畫，避免快速點擊關閉被忽略。

## 後續加入圖片

把核對過且可公開的檔案放在 `src/assets/questions/<問題 ID>/`。僅接受 png、jpg、jpeg、webp、avif，每個檔案不超過 2MiB。檔名用英文、數字與連字號，不含來源姓名。

在該題 frontmatter 新增 `screenshots`，沿用單行 JSON 格式，例如：

```yaml
screenshots: [{"file":"model-provider-menu.jpg","alt":"展開模型供應商選單","caption":"講師回覆附圖：在選單中找 ChatGPT or Codex Subscription。","capturedAt":"2026-09-16","version":"未標示","sourceRecord":"Q060"}]
```

`sourceRecord` 必須存在於同題 `sourceRefs`，日期不可在未來。圖說、日期、版本皆為必填，缺乏版本資訊就寫「未標示」，不要猜測。最多六張圖，沒有圖片時不顯示空區塊。既有 Markdown 圖片同樣支援縮放，新圖優先使用上述結構以產生小預覽及無 JavaScript 後備連結。

## 技術與驗收

沿用 Astro 圖片處理與 [PhotoSwipe 5.4.4](https://photoswipe.com/getting-started/)，由本站提供所有圖片與程式，不使用圖片 API、付費服務或資料庫。工具列沿用思源黑體；圖片本身保留截圖當時的介面字體。

`tests/browser/image-viewer.spec.ts` 驗證按鈕縮放、全圖、重複開關、載入失敗、鍵盤循環、返回位置、圖片下載時機、無 JavaScript 後備連結、360／390／430px 排版，以及 Chrome 觸控模擬的雙指縮放與單指拖曳。觸控模擬不等於 iPhone／Android 實機驗收。

另執行既有 FAQ 搜尋、三維篩選、分頁、匿名來源、手機排版與 OCR 測試。部署以 GitHub main 自動發布，公開版本需讀回 `build-info.json` 並核對 commit。

本機實際紀錄：Astro 檢查零錯誤、22 項單元測試通過；圖片瀏覽器 10 項測試通過。360、390、430px 工具列無溢出。以 Chrome 的實際字型回報確認新增按鈕使用 `SAT Han Sans TC`（思源黑體子集）。完整公開站結果另由 GitHub 的 Public site acceptance 工作流程保存。
