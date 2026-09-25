# 🌤️ Taiwan Weather Forecast (HW10)

[![Streamlit App](https://static.streamlit.io/badges/streamlit_badge_black_white.svg)](https://hw1taiwan-weather-forecast-dqhwvp6gxevbtxpwiglajz.streamlit.app)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live%20Demo-blue?logo=github)](https://clairypeng-dotcom.github.io/Hw1Taiwan-weather-forecast/)

> 🔗 **線上即時展示網址 (Live Demos)**：
> - 🌤️ **Streamlit 雲端氣象預報系統 (HW1 核心成果)**：  
>   👉 **[https://hw1taiwan-weather-forecast-dqhwvp6gxevbtxpwiglajz.streamlit.app](https://hw1taiwan-weather-forecast-dqhwvp6gxevbtxpwiglajz.streamlit.app)**
> - 🌐 **GitHub Pages 靜態前端展示 (HW1 原生網頁)**：  
>   👉 **[https://clairypeng-dotcom.github.io/Hw1Taiwan-weather-forecast/](https://clairypeng-dotcom.github.io/Hw1Taiwan-weather-forecast/)**

本專案是一個完整的台灣天氣預報系統，支援 **雙軌架構**：
1. **Python + CWA API + SQLite + Streamlit + Folium** (HW10 作業核心架構)
2. **純原生前端 Web App (HTML/CSS/JS)** (支援 GitHub Pages 靜態託管展示)

---

## 🏗️ 系統架構流程 (HW1 Pipeline)

```text
中央氣象署 CWA Open Data API (F-D0047-091)
               ↓ (requests)
        fetch_weather.py
               ↓ (Raw JSON)
        parse_weather.py
               ↓ (regionName / dataDate / minT / maxT)
          database.py
               ↓ (Upsert / 防止重複)
       SQLite: data.db (TemperatureForecasts)
               ↓ (SQL Query)
             app.py
               ↓ (Streamlit + Folium)
    互動式氣象地圖與 7 天溫度趨勢圖表
```

---

## 📋 系統環境與需求

- **作業系統**：macOS / Linux / Windows
- **Python 版本**：Python 3.9 或以上 (建議 Python 3.10 / 3.11)

---

## 📦 安裝步驟 (Installation)

1. **進入專案目錄**：
   ```bash
   cd /Users/pengjie/Documents/0923hw1
   ```

2. **安裝所需 Python 套件**：
   ```bash
   pip install -r requirements.txt
   ```
   *(套件包含：requests, pandas, streamlit, folium, streamlit-folium)*

---

## 🔑 CWA API Key 設定方式

本專案**絕不將 API Key 寫死於程式碼中**。您可以透過以下兩種方式設定中央氣象署 API Key：

### 方式一：建立 `.env` 檔案（推薦）
在專案根目錄下建立 `.env` 檔案，填入您的 API 授權碼：
```env
CWA_API_KEY=CWA-XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
```

### 方式二：設定環境變數
在終端機中匯出環境變數：
```bash
export CWA_API_KEY="CWA-XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
```

> **💡 取得授權碼教學**：前往 [中央氣象署開放資料平臺](https://opendata.cwa.gov.tw/) 免費註冊會員，於「取得授權碼」複製您的專屬 Key。  
> **💡 離線測試 (Demo Mode)**：若尚未提供 API Key，系統具備自動容錯回退機制，會自動使用相容 Schema 的內建模擬預報資料，保證各模組皆可獨立執行！

---

## 🛠️ 各模組獨立執行方式

### 1. 抓取天氣資料 (Fetch)
測試使用 Python requests 呼叫 CWA API：
```bash
python fetch_weather.py
```
* 特點：包含 timeout 逾時機制、HTTP 例外捕獲，保留原始 JSON 結構。

### 2. 解析預報 JSON (Parse)
測試從原始 JSON 解析 22 縣市的一週 MinT / MaxT：
```bash
python parse_weather.py
```
* 特點：專門解析 `records`、`locations`、`weatherElement`，提取 `regionName`、`dataDate`、`minT`、`maxT`，遇到缺失欄位自動防護不崩潰。

### 3. 建立並同步 SQLite 資料庫 (Database)
建立 `data.db` 資料庫與 `TemperatureForecasts` 資料表：
```bash
python database.py
```
* **資料表欄位**：
  - `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
  - `regionName` (TEXT NOT NULL)
  - `dataDate` (TEXT NOT NULL)
  - `minT` (REAL)
  - `maxT` (REAL)
* **防重複機制**：使用 `UNIQUE(regionName, dataDate)` 與 `INSERT ... ON CONFLICT DO UPDATE` (Upsert)，重複執行不會累積重複資料。

---

## 🚀 啟動 Streamlit Web App

執行以下指令啟動 Streamlit 視覺化介面：

```bash
streamlit run app.py
```

啟動後於瀏覽器開啟：`http://localhost:8501`

### 網頁主要功能：
- 🗺️ **台灣互動氣象地圖 (Folium / Leaflet)**：
  - **🌡️ 溫度色階圓點**：地圖圓點依據當日最高氣溫 (MaxT) 自動套用氣象標準色彩：
    - `< 16°C`：寒冷（深天藍 `#2563EB`）
    - `16 ~ 20°C`：涼爽（青藍色 `#06B6D4`）
    - `20 ~ 24°C`：舒適（翠綠色 `#10B981`）
    - `24 ~ 28°C`：溫和（金黃色 `#EAB308`）
    - `28 ~ 32°C`：炎熱（亮橘色 `#F97316`）
    - `≥ 32°C`：酷熱（鮮紅色 `#EF4444`）
  - **🍃 空氣品質模式 (AQI)**：一鍵切換「依空氣品質著色」，地圖圓點即時切換為環境部 AQI 標準六色階（良好、普通、敏感不健康、不健康、非常不健康、危害）。
  - **動態圖例 (Legend)**：地圖下方提供動態色階對應圖例，數值範圍一目了然。
  - **鎖定光環與豐富彈窗**：點選地標立即呈現選中光環，Popup 與 Tooltip 同步呈現氣溫範圍、體感等級、AQI 數值與 PM2.5 濃度。
- 🍃 **即時空氣品質監測儀表板**：
  - **AQI 空氣指標卡片**：即時呈現數值與狀態徽章。
  - **PM2.5 與 PM10 濃度指標**：細懸浮微粒與懸浮微粒即時微克濃度。
  - **健康防護建議提示盒**：針對敏感族群與一般民眾提供專屬戶外防護建議。
- 📅 **預報日期下拉選單 (Date Selector)**：
  - **切換任意日期**：提供下拉選單自由選擇未來 7 天任意預報日期（dataDate）。
  - **全台地圖即時動態連動**：切換日期時，全台灣 28 區地圖圓點色階、標籤與 Popup 即時更新為該日期的預測高低溫。
  - **右側指標與表格高亮**：氣溫指標卡自動顯示所選日期的最低溫/最高溫，預報資料表亦同步高亮顯示所選日期列。
- 📍 **地區選擇器與捷徑列**：下拉選單快速切換 28 個地區（含 6 大分區與 22 縣市），並提供分區快捷鍵。
- 📈 **未來 7 日氣溫折線圖**：自動繪製最低溫 (MinT) 與最高溫 (MaxT) 雙軌趨勢（Altair / Chart.js）。
- 🔄 **手動同步按鈕**：側邊欄提供一鍵呼叫 CWA API 並即時更新 SQLite `data.db`。
- 📋 **預報資料表**：清楚呈現一週預報與資料表原始欄位。

---

## 🌐 GitHub Pages 線上網站 (全新 HW10 版本)

GitHub Pages 已同步升級為全新 HW10 台灣氣象預報系統：
- **線上網址**：👉 **[https://clairypeng-dotcom.github.io/Hw1Taiwan-weather-forecast/](https://clairypeng-dotcom.github.io/Hw1Taiwan-weather-forecast/)**
- **雙模式整合**：
  1. **Streamlit 雲端版 (預設)**：直接整合 Streamlit 雲端應用程式，支援即時連線。
  2. **極速獨立版**：免等待伺服器喚醒，直接於瀏覽器呈現互動式台灣地圖標記、28 地區預報、7 天高低溫折線圖與完整資料表。


---

## ☁️ 部署至 Streamlit Community Cloud (已正式上線)

本專案已成功部署上線至 Streamlit Community Cloud，可直接點擊下方網址存取：

👉 **正式線上存取網址**：**[https://hw1taiwan-weather-forecast-dqhwvp6gxevbtxpwiglajz.streamlit.app](https://hw1taiwan-weather-forecast-dqhwvp6gxevbtxpwiglajz.streamlit.app)**

### 雲端部署設定手冊：
1. 前往 [Streamlit Community Cloud](https://share.streamlit.io/) 並使用 GitHub 帳號登入。
2. 點擊 **"Create app"** ➔ **"Deploy an app"**。
3. 填入專案設定：
   - **Repository**: `clairypeng-dotcom/Hw1Taiwan-weather-forecast`
   - **Branch**: `main`
   - **Main file path**: `app.py`
4. *(選填)* 若有 CWA API Key，可點擊 **"Advanced settings"** ➔ **"Secrets"**，填入：
   ```toml
   CWA_API_KEY = "CWA-XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
   ```
5. 點擊 **"Deploy!"** 即可完成雲端發布與即時連線！


