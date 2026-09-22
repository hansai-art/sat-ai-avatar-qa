# 網站字型

標題、正文與介面使用 Adobe 思源黑體的臺灣繁中區域版本 **Source Han Sans TW VF**，同時涵蓋繁體中文與拉丁字母。字重範圍為 250–900，保留網站既有標題與內文層級。

- 上游：[Adobe Source Han Sans](https://github.com/adobe-fonts/source-han-sans)
- 固定來源 commit：`a4f7cf94edfb9d7ffbdfc4841de276358bd7e0f2`
- 原檔：`Variable/WOFF2/TTF/Subset/SourceHanSansTW-VF.ttf.woff2`
- 原檔 SHA-256：`02d13bf72beafab07aa4a738477e7bccf6ed5cfc29d17b24908fb3b67e9f9318`
- 授權：SIL Open Font License 1.1，完整授權隨公開網站提供於 `/fonts/LICENSE.txt`。

為避免手機首次閱讀就下載整套 CJK 字型，採用字元互斥的四份 WOFF2：拉丁字母、首頁字元、其餘文章字元、擴充字元。瀏覽器按 `unicode-range` 自動載入需要的檔案；所有原字型的 Unicode 字元均保留，新增文章不必重新產製字型才能顯示。

分段檔依 OFL 保留名稱規範，內部名稱改為 `SAT Han Sans TC`，字形仍來自上述思源黑體。CSS 使用同一名稱；`font-display: swap` 讓文字可立即閱讀，下載完成後換成思源黑體。檔案由 Astro 產生帶雜湊的網址並隨 Cloudflare Pages 發布，不使用第三方字型服務。

`src/styles/global.css` 的 `--font-site` 同時指定所有 typography 字型 token，避免英文與引文落到另一套字型；2026-09-22 依新規格僅讓操作路徑、指令與錯誤訊息使用系統等寬字型，中文 fallback 仍為思源黑體。原始通用繁中排版規範保留不動。

只有要依新內容重新調整分段效能時，才需先建置網站，再以 Python 與 `fonttools[woff]` 執行：

```sh
python3 scripts/subset-font.py /path/to/SourceHanSansTW-VF.ttf.woff2
```

日常內容更新與 Cloudflare 建置直接使用已提交的字型，不需要 Python 或外部下載。

2026-09-21 本機驗證：Cloudflare 建置檢查通過；瀏覽器驗收 42 項通過（20 項示範資料測試不適用）。390×844 截圖與 360／390／430px 測試通過。Chrome 實際字型檢查確認標題、中英文題名、按鈕、正文及英文錯誤訊息均使用自訂思源黑體；首頁首次字型下載 213,120 bytes，只載入首頁與拉丁分段。四份分段無重疊且完整保留原字型 20,763 個 Unicode 對應。

2026-09-22 改版驗證：標題、介面按鈕與正文的 Chrome 實際字型為 `SAT Han Sans TC`，操作指令依新規格使用 Menlo 等系統等寬字型。390px 首頁只下載 home 與 latin 分段，合計 139,580 bytes，沒有載入約 5MB 的 extended 分段。四份字型仍完整覆蓋原字型 20,763 個 Unicode 對應。

2026-09-23 全部問答匯入後：62 題保留完整思源黑體覆蓋，首頁 home 與 latin 共 183,144 bytes。390px 實際字型與網路紀錄確認未載入 extended 分段。
