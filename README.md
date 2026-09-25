# 🌤️ Taiwan Weather Forecast 台灣氣象預報網站

一個美觀、現代化、純原生前端開發的台灣天氣預報 Web App。視覺設計採高質感的藍白氣象儀表板風格，整合交通部中央氣象署（CWA）開放資料平臺 API，支援互動式台灣向量地圖、24 小時時段預報、7 日溫度趨勢曲線圖表與全台 22 縣市即時氣象觀測。

---

## 🌟 核心特色與功能

1. **🗺️ 互動式台灣向量地圖 (SVG)**：
   - 包含台灣本島 19 縣市與澎湖、金門、連江（馬祖）離島。
   - 支援滑鼠懸浮預覽氣溫與天氣現象（Tooltip 跟隨）。
   - 點擊縣市即時切換右側氣象儀表板，並同步高亮當前選取縣市。

2. **📊 藍白現代氣象儀表板**：
   - **核心資訊**：目前氣溫、體感溫度、天氣現象、今日最高溫與最低溫。
   - **六大關鍵指標**：相對濕度 (%)、降雨機率與降雨量 (mm)、平均風速與風向、紫外線指數 (UV)、大氣壓力 (hPa)、舒適度簡評。
   - **微動畫回饋**：微浮動天氣圖示、氣溫進場彈跳轉場效果。

3. **⏱️ 未來 24 小時時段預報**：
   - 橫向流暢滾動的時段預報卡片，標示時段、對應天氣圖示、預測氣溫與降雨機率。

4. **📈 未來 7 日溫度趨勢曲線圖**：
   - 使用輕量級原生 HTML5 Canvas 繪製高解析度（Retina 2x/3x 相容）平滑貝茲曲線。
   - 同時展示未來一週最高溫與最低溫雙軌曲線、漸層填色與游標懸浮參考輔助線。

5. **🔍 縣市搜尋與分區快速選取**：
   - 支援縣市即時搜尋（輸入關鍵字即時過濾）。
   - 提供「全台灣、北部、中部、南部、東部、外島」分區頁籤，一鍵快速篩選。

6. **🔒 API 安全性與 Demo 展示模式**：
   - **絕不將 API Key 寫死於原始碼**：避免金鑰提交至 GitHub 或公開外洩。
   - **預設 Demo 模式**：未設定 API Key 時自動啟用高品質模擬數據庫，隨開隨用。
   - **LocalStorage 安全存放**：右上角提供「API 設定」彈窗，使用者輸入的中央氣象署授權碼僅保存在本機瀏覽器。
   - **自動容錯降級**：當 API 發生網路問題、額度超限或金鑰無效時，自動顯示友善提示並安全切換回展示模式。

---

## 🛠️ 技術架構

- **HTML5**：語意化標籤架構、SEO Meta 標籤。
- **Vanilla CSS (純原生 CSS)**：自訂色彩變數系統、玻璃擬態 (Glassmorphism)、微陰影與響應式斷點（支援桌面、平板、手機）。
- **Vanilla JavaScript (ES6+)**：純原生 JavaScript 模組化設計（地圖、圖表、UI、API、設定獨立分離），無須任何 npm build 或 Webpack 編譯。
- **資料來源**：
  - 中央氣象署 (CWA) Open Data API：`O-A0003-001` (局屬氣象站-現在天氣觀測報告)。

---

## 📁 檔案結構

```text
0923hw1/
├── index.html              # 主頁面結構與儀表板佈局
├── css/
│   ├── style.css           # 全域變數、色彩系統與響應式網格
│   ├── dashboard.css       # 天氣英雄卡、指標格、24h預報與圖表佈局
│   ├── map.css             # 台灣 SVG 地圖互動樣式與懸浮提示 Tooltip
│   └── components.css      # 導覽列、搜尋列、分頁籤、Modal 與 Toast
├── js/
│   ├── config.js           # API Key 存取與運行模式 (Demo/Live) 管理
│   ├── demo-data.js        # 全台 22 縣市擬真氣象與預報模擬資料庫
│   ├── api.js              # CWA O-A0003-001 API 連線、解析與容錯轉換
│   ├── map.js              # 台灣 SVG 地圖載入、Hover/點擊事件與連動
│   ├── chart.js            # 原生 Canvas 雙溫度趨勢曲線繪製模組
│   ├── ui.js               # 畫面資料渲染與 DOM 更新邏輯
│   └── app.js              # 主入口協調腳本
├── assets/
│   ├── icons/              # 晴天、多雲、陰、雨、雷雨等純向量 SVG 圖示
│   └── taiwan-map.svg      # 台灣 22 縣市向量地圖
├── .gitignore              # 忽略暫存檔與金鑰檔案
└── README.md               # 專案說明手冊
```

---

## 💻 本機啟動方式 (localhost:8080)

本專案為靜態網頁，您可以直接使用常見的本機伺服器在 `8080` 連接埠啟動：

### 方式一：使用 Python 3（Mac / Linux / Windows 內建，推薦）

開啟終端機（Terminal）進入專案目錄，執行：

```bash
python3 -m http.server 8080
```

啟動後於瀏覽器開啟：`http://localhost:8080`

### 方式二：使用 Node.js `npx http-server`

若您電腦有安裝 Node.js，可直接執行：

```bash
npx -y http-server -p 8080 -c-1
```

### 方式三：使用 VS Code Live Server 擴充套件

直接在 VS Code 中開啟專案目錄，右鍵點擊 `index.html` 選擇「Open with Live Server」。

---

## 🔑 如何設定中央氣象署 API Key (授權碼)

1. 前往 [中央氣象署開放資料平臺](https://opendata.cwa.gov.tw/) 免費註冊會員並登入。
2. 點擊右上角「使用者帳號」➔「取得授權碼」。
3. 複製您的 API 授權碼（格式通常為 `CWA-XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX`）。
4. 在本網站點擊右上角「**API 設定**」按鈕。
5. 將授權碼貼入輸入框，點擊「**儲存並套用**」。
6. 網站將立即透過 `O-A0003-001` 連線至氣象署局屬測站，頂部狀態徽章將顯示「**中央氣象署 API (即時連線)**」！

> **🔒 隱私與安全性聲明**：您的 API 授權碼僅會加密保存在您個人瀏覽器的 `localStorage` 中，不會傳送至任何第三方伺服器，更不會被提交至 GitHub。

---

## 🚀 部署至 GitHub Pages 步驟

本專案使用相對路徑設計，且無任何編譯打包步驟，可直接部屬至 GitHub Pages：

1. **建立 GitHub Repository**：
   在 GitHub 上建立一個新的 Public Repository（例如 `taiwan-weather`）。

2. **推送本地程式碼**：
   在專案終端機執行：
   ```bash
   git add .
   git commit -m "feat: initial commit for Taiwan Weather Forecast web app"
   git remote add origin https://github.com/<您的GitHub帳號>/<專案名稱>.git
   git branch -M main
   git push -u origin main
   ```

3. **啟用 GitHub Pages**：
   - 進入 GitHub 專案頁面 ➔ 點選「**Settings**」分頁。
   - 在左側選單點選「**Pages**」。
   - 在「**Build and deployment**」區塊：
     - Source 選擇：`Deploy from a branch`。
     - Branch 選擇：`main`，目錄選擇：`/ (root)`。
   - 點擊「**Save**」。
   - 等待約 1~2 分鐘後，即可透過提供的網址（如 `https://<帳號>.github.io/<專案名稱>/`）公開造訪您的台灣氣象預報網站！
