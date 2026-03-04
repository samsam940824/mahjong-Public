# 🀄 麻將戰績紀錄系統 (Serverless Edition)

這是一個輕量、安全且完全免費的麻將戰績管理系統。
本專案已從傳統後端架構重構為 **純前端靜態網頁 (Vanilla JS)** 搭配 **BaaS 雲端資料庫**，達成零伺服器維護成本的高效能運作。

## 🚀 技術架構

* **前端 UI**：HTML5, CSS3, Vanilla JavaScript (無依賴任何前端框架)。
* **雲端資料庫**：[Supabase](https://supabase.com/) (PostgreSQL)。
* **身分驗證**：Supabase Auth (Row Level Security 資料列層級安全防護)。
* **部署環境**：GitHub Pages。

## ✨ 核心功能

* **無伺服器 API 串接**：透過 Supabase JS SDK 直接於前端進行 CRUD 操作。
* **動態排行榜**：前端自動聚合計算「本月」、「今年」、「總累積」戰績排行。
* **多表關聯寫入**：支援場次 (Sessions) 與流水帳 (Ledgers) 的連動寫入與前端 Rollback 機制。
* **純前端 CSV 匯出**：無須後端，利用 JavaScript Blob 即時打包下載戰績明細。
* **極致安全**：啟用 BFCache (上一頁快取) 防護與 XSS 攻擊防禦 (`escapeHTML`)。

## 🛠️ 本地開發與測試

本專案為純靜態網頁，無需 `npm install` 或編譯打包過程。

1. 將專案 Clone 至本地。
2. 確認 `config.js` 中已填寫對應的 Supabase URL 與 Anon Key。
3. 使用 VS Code 的 **Live Server** 套件，或使用 Python 內建伺服器啟動：
   ```bash
   python -m http.server 8000
   ```
4. 打開瀏覽器前往 `http://localhost:8000` 即可開始使用。
