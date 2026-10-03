# 工作台與公開問答的資料整合規格

- 文件版本：1.0
- 日期：2026-10-03
- 適用專案：[hansai-art/sat-ai-avatar-qa](https://github.com/hansai-art/sat-ai-avatar-qa)
- 目的：讓內部工作台與學生公開網站使用同一套問答識別與發布規則，避免同一題答案在兩個地方各自維護。

## 定案

這個專案採用「一套邏輯資料、兩個檢視」，不是把私人原始問答全部放進公開 repository。

| 檢視 | 內容 | 儲存位置 |
|---|---|---|
| 內部工作台 | 原始問題、學員環境、Hans 判斷、查證證據、教材影響、驗收與發布狀態 | ChatGPT Page、授權的來源資料與工作紀錄 |
| 學生公開網站 | 匿名化標題、結論、操作步驟、章節、來源、更新日期與相關題 | `src/content/questions/qa-xxxxxx.md` |

私人原始資料、未核對草稿、學員姓名與敏感截圖不得進入公開 repository。公開網站只接收已去識別化、已核對且允許公開的資料。

## 唯一識別

- 檔名去掉副檔名就是 canonical `qa_id`，例如 `qa-000001`。
- `qa_id` 建立後不可因標題、章節或答案改動而更名。
- 合併重複題目時，舊題保留網址並以 `publication: archived`、`supersededBy` 指向新的正本。
- 工作台新增問題時，先搜尋既有 `qa_id`；找不到時標為「待合併」，不能先複製成另一筆公開 FAQ。

## 狀態分離

同一筆問題至少分開記錄三種狀態：

| 狀態 | 意義 |
|---|---|
| `answer_status` | 答案是否已查證、已回答或需要更新 |
| `material_status` | 教材是否需要補 FAQ、改單元或重新驗收 |
| `publication` | 是否仍是草稿、已發布或已封存 |

「已回答」不代表「教材已更新」，也不代表「可以公開」。

公開 Markdown 使用既有欄位 `answerStatus` 與 `publication`。工作台使用對應的內部欄位，並以 `qa_id` 連回公開頁，不複製公開答案正文。

## 現有資料基準

目前公開資料已完成第一輪整理：

- 66 筆來源紀錄
- 61 筆含問題的來源紀錄
- 104 個子問題對應
- 62 筆正式 FAQ
- 公開網站：[sathans.pages.dev/questions](https://sathans.pages.dev/questions/)
- 匯入與去重紀錄：[docs/content-source-audit.json](content-source-audit.json)
- 完整匯入說明：[docs/FAQ-FULL-IMPORT.md](FAQ-FULL-IMPORT.md)

這些數字是內容基準，不代表所有後續 Gmail、SAT 或課程留言都已完成匯入。新問題仍要經過工作台去重、判斷與核對。

## 新問題流程

1. 在工作台保留原始問題、日期、來源與學員環境。
2. 搜尋既有 `qa_id`，判斷是既有題修訂、相關題，還是需要新題。
3. 先寫 Hans 判斷，再補現行教材、官方文件或實測證據。
4. 分別更新 `answer_status`、`material_status` 與 `publication`。
5. 只有通過去識別化與公開核對的內容，才新增或修訂 `src/content/questions/*.md`。
6. GitHub main 建置成功後由 Cloudflare Pages 發布；工作台回寫版本、發布連結與最後核對日。
7. 若答案過期，優先修訂既有 `qa_id`；若題目重複，封存舊題並指向替代題。

## 編輯邊界

- Markdown 是公開 FAQ 的唯一可編輯正本。
- Pagefind、`build-info.json` 與網站列表都是衍生資料，不可反向編輯。
- 工作台可以保存來源、判斷、版本和狀態，但不保存另一份完整公開答案。
- 若需要自動同步，應讀取公開 Markdown 的 `qa_id`、`publication`、`answerStatus`、`updatedAt` 與 `sourceRefs`，不可用頁面標題或搜尋結果文字當識別。
