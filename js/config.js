/**
 * config.js - 應用程式全域設定與 API Key 管理
 * 支援將使用者輸入之 CWA API Key 儲存於瀏覽器 LocalStorage，確保金鑰不外洩或上傳 GitHub。
 */

const CONFIG = {
  // CWA 中央氣象署 Open Data API 端點
  API_BASE_URL: 'https://opendata.cwa.gov.tw/api/v1/rest/datastore',
  // 主要即時觀測資料集：O-A0003-001 (局屬氣象站-現在天氣觀測報告)
  DATASET_OBSERVATION: 'O-A0003-001',
  // 一般天氣預報資料集：F-C0032-001 (今明36小時預報)
  DATASET_FORECAST_36H: 'F-C0032-001',

  // LocalStorage 儲存 Key 名稱
  STORAGE_KEYS: {
    API_KEY: 'cwa_weather_api_key',
    APP_MODE: 'cwa_weather_app_mode', // 'demo' | 'live'
    LAST_COUNTY: 'cwa_last_selected_county'
  },

  // 取得儲存的 API Key
  getApiKey() {
    return localStorage.getItem(this.STORAGE_KEYS.API_KEY) || '';
  },

  // 設定並儲存 API Key
  setApiKey(key) {
    const trimmed = (key || '').trim();
    if (trimmed) {
      localStorage.setItem(this.STORAGE_KEYS.API_KEY, trimmed);
    } else {
      localStorage.removeItem(this.STORAGE_KEYS.API_KEY);
    }
  },

  // 取得目前運行模式 ('demo' 或 'live')
  getMode() {
    const savedMode = localStorage.getItem(this.STORAGE_KEYS.APP_MODE);
    if (savedMode === 'live' && this.getApiKey()) {
      return 'live';
    }
    return 'demo'; // 預設或未提供 API Key 時使用 Demo Mode
  },

  // 設定運行模式
  setMode(mode) {
    if (mode === 'live' && !this.getApiKey()) {
      throw new Error('未設定 API Key，無法切換至即時連線模式！');
    }
    localStorage.setItem(this.STORAGE_KEYS.APP_MODE, mode);
  },

  // 記住上次選取的縣市
  getLastCounty() {
    return localStorage.getItem(this.STORAGE_KEYS.LAST_COUNTY) || 'taipei';
  },

  setLastCounty(countyId) {
    localStorage.setItem(this.STORAGE_KEYS.LAST_COUNTY, countyId);
  }
};

window.CONFIG = CONFIG;
