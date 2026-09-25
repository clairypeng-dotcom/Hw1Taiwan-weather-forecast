# 🌤️ Taiwan Weather Forecast (HW10)

本專案是一個完整的台灣天氣預報系統，支援 **雙軌架構**：
1. **Python + CWA API + SQLite + Streamlit + Folium** (HW10 作業核心架構)
2. **純原生前端 Web App (HTML/CSS/JS)** (支援 GitHub Pages 靜態託管展示)

---

## 🏗️ 系統架構流程 (HW10 Pipeline)

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
- 🗺️ **Folium 台灣互動地圖**：標示全台縣市中心點，點擊地圖標記即顯示該縣市當日與未來高低溫預報。
- 📍 **縣市選擇器**：下拉選單快速切換 22 縣市。
- 📈 **未來 7 日氣溫折線圖**：自動繪製最低溫 (MinT) 與最高溫 (MaxT) 雙軌趨勢。
- 🔄 **手動同步按鈕**：側邊欄提供一鍵呼叫 CWA API 並即時更新 SQLite `data.db`。
- 📋 **SQLite 資料檢視表**：直接呈現 `TemperatureForecasts` 資料表原始欄位。

---

## 🌐 保留之靜態前端網站 (GitHub Pages)

原有的純前端靜態網站依然完整保留：
- **靜態檔案**：`index.html`、`css/`、`js/`、`assets/`
- **本機執行**：`python3 -m http.server 8080` (開啟 `http://localhost:8080`)
- **GitHub 部署頁面**：[https://clairypeng-dotcom.github.io/Hw1Taiwan-weather-forecast/](https://clairypeng-dotcom.github.io/Hw1Taiwan-weather-forecast/)

---

## ☁️ 部署至 Streamlit Community Cloud

本專案已完全適配 Streamlit Community Cloud 免費雲端部署：

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
5. 點擊 **"Deploy!"**，數分鐘內即可完成雲端上線！

