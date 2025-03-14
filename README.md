# Cloudflare 瀏覽器渲染服務

這是一個基於 Cloudflare Workers 的網頁渲染服務，可以幫助您繞過常見的反爬蟲保護機制，並提供完整的網頁內容渲染。

## 功能特點

- 模擬真實瀏覽器環境，繞過常見的反爬蟲檢測
- 支持 CORS 跨域請求
- 自動處理 JavaScript 執行和 DOM 操作
- 用戶友好的界面，支持歷史記錄管理
- 可在新標籤頁中查看渲染結果

## 使用方法

1. 部署 Worker 到您的 Cloudflare Workers 帳戶
2. 打開 `index.html` 文件
3. 在表單中輸入您想要渲染的網頁 URL
4. 輸入您的 Worker URL (例如: `https://your-worker.your-account.workers.dev`)
5. 點擊「渲染網頁」按鈕

## 部署說明

### 前置條件

- Cloudflare 帳戶
- Wrangler CLI 工具 (可選，用於本地開發和部署)

### 部署步驟

1. 克隆此倉庫到本地
   ```
   git clone https://github.com/june0325/cloudflare-browser-renderer.git
   cd cloudflare-browser-renderer
   ```

2. 使用 Wrangler 部署 Worker
   ```
   wrangler publish
   ```

3. 或者，您可以直接在 Cloudflare Workers 控制台中創建一個新的 Worker，並將 `worker.js` 的內容複製到編輯器中

4. 部署完成後，您將獲得一個 Worker URL，可以用於渲染網頁

## 技術細節

- 使用 Cloudflare Workers 處理請求和響應
- 實現了用戶代理輪換以減少被檢測的風險
- 注入自定義腳本以模擬完整的瀏覽器環境
- 使用 localStorage 保存歷史記錄和設置

## 注意事項

- 此工具僅供學習和研究使用
- 請尊重網站的使用條款和隱私政策
- 不要過度請求同一網站，以避免 IP 被封鎖

## 許可證

MIT