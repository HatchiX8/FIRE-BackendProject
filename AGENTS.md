# Agent Rules

本文件為 Codex 任務執行時的規則載入與行為控制入口。

## File Encoding Rules

所有檔案讀取、檢視、修改與輸出，皆必須使用 UTF-8 編碼。

若檔案內容包含中文，必須確保：

- 使用 UTF-8 解碼檢視檔案
- 不得使用錯誤編碼導致中文亂碼
- 修改檔案後必須維持 UTF-8 編碼
- 不得因編碼問題移除、替換或改寫中文內容
- 若偵測到中文亂碼，必須停止修改並回報問題

若工具或環境無法確認編碼：

- 不得直接覆寫原檔
- 必須先回報編碼風險
- 必須保留原始中文內容

## Rule Bootstrap

若專案根目錄不存在 `agents/`：

- 停止任務執行
- 不得自行推測規則
- 不得直接開始修改程式碼
- 回報缺少規則環境

若必要規則檔案不存在：

- 停止任務執行
- 列出缺少的規則檔案
- 不得以預設推測補齊規則
- 不得使用模型預設最佳實踐取代專案規則

## Architecture Task

若任務涉及新增、移動、刪除、拆分資料夾或檔案，或調整 import direction、專案分層，必須先閱讀 `agents/architecture.md`。

`agents/architecture.md` 是 Architecture Task 的載入入口，不保存特定專案的資料夾結構、模組責任或 import direction。

專案客製結構規則由 `agents/architecture.md` 引導讀取 `agents/skills/project-structure.md`。

需額外閱讀：

- agents/architecture.md
- agents/review.md

## 任務模式

任務開始時，可在 prompt 開頭明確指定模式：

- 學習模式：啟用 `agents/workflow.md` 的 Learning-oriented Output
- 正式專案模式：啟用 `agents/logging.md` 的 task log

若 prompt 未明確指定：

- 預設不啟用學習模式
- 預設不啟用正式專案模式
- 不輸出 Learning-oriented Output
- 不更新 task log

模式可同時啟用，例如：

```txt
任務模式：學習模式、正式專案模式
```

若任務明確指定 skill，需額外閱讀 agents/skills/<skill-name>.md。
若 skill 檔案不存在，停止執行並回報缺少的 skill 規則。

## 必讀規則

所有任務都必須先閱讀：

- agents/core.md
- agents/restrictions.md
- agents/workflow.md

---

## Refactor Task

若任務明確要求重構、整理既有邏輯、降低重複、拆分 function、改善可讀性或調整責任邊界，需額外閱讀：

- agents/skills/refactor/general-refactor.md
- agents/review.md

若重構涉及新增、移動、刪除、拆分資料夾或檔案，或調整 import direction、專案分層，仍必須同時依 Architecture Task 載入：

- agents/architecture.md
- agents/skills/project-structure.md

---

## 前端任務

需額外閱讀：

- agents/frontend.md
- agents/review.md

適用情境：

- Vue component
- composables
- stores
- UI modules
- frontend refactor

---

## 後端任務

需額外閱讀：

- agents/backend.md
- agents/review.md

適用情境：

- API 開發
- database
- service logic
- backend refactor

---

## Python 工具任務

需額外閱讀：

- agents/python-tool.md
- agents/review.md

適用情境：

- CLI 工具
- 檔案整理、轉換、批次處理
- 資料匯入、匯出、清洗
- 開發流程自動化
- 本機維運或檢查腳本

---

## Review Task

需閱讀：

- agents/core.md
- agents/restrictions.md
- agents/workflow.md
- agents/review.md

## 規則優先級

規則衝突時，依以下優先級處理：

1. agents/restrictions.md
2. 明確指定或任務觸發載入的 agents/skills/\*.md
3. agents/architecture.md
4. agents/core.md
5. agents/workflow.md
6. agents/frontend.md / agents/backend.md / agents/python-tool.md
7. agents/review.md

## 未知情況處理

若規則未明確定義：

- 優先維持既有架構
- 優先維持資料流穩定
- 不主動新增抽象層
- 不主動進行大型重構
- 採用最小影響原則
