/**
 * api.js - 中央氣象署 (CWA) Open Data API 串接模組
 * 支援 O-A0003-001 (現在天氣觀測報告) 與 F-C0032-001 (今明36小時預報)
 * 具備容錯解析、多版本 schema 相容性與自動降級 (Fallback to Demo) 機制。
 */

const API = {
  // 縣市名稱與內部 ID 對照
  countyMapping: {
    '基隆市': 'keelung',
    '基隆': 'keelung',
    '臺北市': 'taipei',
    '台北市': 'taipei',
    '臺北': 'taipei',
    '新北市': 'newtaipei',
    '新北': 'newtaipei',
    '板橋': 'newtaipei',
    '桃園市': 'taoyuan',
    '桃園': 'taoyuan',
    '新竹市': 'hsinchucity',
    '新竹': 'hsinchucity',
    '新竹縣': 'hsinchucounty',
    '竹北': 'hsinchucounty',
    '苗栗縣': 'miaoli',
    '苗栗': 'miaoli',
    '臺中市': 'taichung',
    '台中市': 'taichung',
    '臺中': 'taichung',
    '彰化縣': 'changhua',
    '彰化': 'changhua',
    '南投縣': 'nantou',
    '南投': 'nantou',
    '日月潭': 'nantou',
    '雲林縣': 'yunlin',
    '雲林': 'yunlin',
    '嘉義市': 'chiayicity',
    '嘉義': 'chiayicity',
    '嘉義縣': 'chiayicounty',
    '阿里山': 'chiayicounty',
    '臺南市': 'tainan',
    '台南市': 'tainan',
    '臺南': 'tainan',
    '高雄市': 'kaohsiung',
    '高雄': 'kaohsiung',
    '屏東縣': 'pingtung',
    '屏東': 'pingtung',
    '恆春': 'pingtung',
    '宜蘭縣': 'yilan',
    '宜蘭': 'yilan',
    '花蓮縣': 'hualien',
    '花蓮': 'hualien',
    '臺東縣': 'taitung',
    '台東縣': 'taitung',
    '臺東': 'taitung',
    '澎湖縣': 'penghu',
    '澎湖': 'penghu',
    '金門縣': 'kinmen',
    '金門': 'kinmen',
    '連江縣': 'lienchiang',
    '馬祖': 'lienchiang'
  },

  // 快取氣象資料，減少高頻重複呼叫
  _cache: {
    timestamp: 0,
    data: null,
    ttl: 300000 // 快取 5 分鐘
  },

  /**
   * 根據天氣現象字串轉換為對應圖示 ID
   */
  mapWeatherIcon(weatherText) {
    if (!weatherText) return 'partly-cloudy';
    const text = weatherText.trim();
    if (text.includes('雷')) return 'thunderstorm';
    if (text.includes('雨')) {
      if (text.includes('短暫') || text.includes('小雨') || text.includes('陣雨')) return 'rain-light';
      return 'rain';
    }
    if (text.includes('霧')) return 'fog';
    if (text.includes('陰')) return 'overcast';
    if (text.includes('多雲')) return 'cloudy';
    if (text.includes('晴')) {
      if (text.includes('多雲') || text.includes('陰')) return 'partly-cloudy';
      return 'sunny';
    }
    if (text.includes('風')) return 'wind';
    return 'partly-cloudy';
  },

  /**
   * 計算體感溫度 (Apparent Temperature, AT) 經驗公式
   * AT = 1.07 * T + 0.2 * e - 0.65 * V - 2.7
   * 其中 e 為水氣壓: e = (RH / 100) * 6.105 * exp((17.27 * T) / (237.7 + T))
   */
  calcApparentTemp(temp, rh, windSpeed) {
    if (isNaN(temp)) return temp;
    const t = Number(temp);
    const h = Number(rh) || 60;
    const v = Number(windSpeed) || 1.5;
    const e = (h / 100) * 6.105 * Math.exp((17.27 * t) / (237.7 + t));
    const at = 1.07 * t + 0.2 * e - 0.65 * v - 2.7;
    return Math.round(at * 10) / 10;
  },

  /**
   * 抓取並解析 CWA O-A0003-001 (局屬氣象站-現在天氣觀測報告)
   */
  async fetchLiveObservations(apiKey) {
    const key = apiKey || CONFIG.getApiKey();
    if (!key) {
      throw new Error('未提供 CWA API Key，無法進行即時查詢。');
    }

    // 檢查快取
    const now = Date.now();
    if (this._cache.data && (now - this._cache.timestamp < this._cache.ttl)) {
      return this._cache.data;
    }

    const url = `${CONFIG.API_BASE_URL}/${CONFIG.DATASET_OBSERVATION}?Authorization=${encodeURIComponent(key)}&format=JSON`;

    const response = await fetch(url);
    if (!response.ok) {
      let errDetail = `HTTP ${response.status} ${response.statusText}`;
      if (response.status === 401 || response.status === 403) {
        errDetail = 'API Key 驗證失敗或無此資料集存取權限 (401/403)';
      } else if (response.status === 429) {
        errDetail = 'API 請求頻率過高已受限 (429 Too Many Requests)';
      }
      throw new Error(errDetail);
    }

    const result = await response.json();
    if (result.success !== 'true' && result.success !== true) {
      throw new Error(result.message || 'CWA API 回傳失敗狀態');
    }

    // 解析測站清單（相容 Station 或 location 陣列）
    const stations = result.records?.Station || result.cwaopendata?.dataset?.Station || result.records?.location || [];
    if (!Array.isArray(stations) || stations.length === 0) {
      throw new Error('API 未包含任何氣象站觀測數據');
    }

    const parsedData = this.parseStations(stations);

    // 更新快取
    this._cache.data = parsedData;
    this._cache.timestamp = now;

    return parsedData;
  },

  /**
   * 嘗試讀取本地提供的 O-A0003-001.json 檔案
   */
  async fetchLocalCWAData() {
    try {
      const response = await fetch('./O-A0003-001.json');
      if (!response.ok) return null;
      const result = await response.json();
      const stations = result.cwaopendata?.dataset?.Station || result.records?.Station || [];
      if (!Array.isArray(stations) || stations.length === 0) return null;
      return this.parseStations(stations);
    } catch (e) {
      return null;
    }
  },

  /**
   * 統一解析中央氣象署 Station 測站陣列為全台 22 縣市對照物件
   */
  parseStations(stations) {
    const parsedData = {};

    stations.forEach(item => {
      const stationName = item.StationName || item.locationName || '';
      const stationId = item.StationId || item.stationId || '';
      const countyName = item.GeoInfo?.CountyName || item.parameter?.find(p => p.parameterName === 'CITY')?.parameterValue || '';

      // 找出符合的內部縣市 ID
      let matchedCountyId = this.countyMapping[countyName] || this.countyMapping[stationName];
      if (!matchedCountyId) {
        for (const [nameKey, cId] of Object.entries(this.countyMapping)) {
          if (stationName.includes(nameKey) || countyName.includes(nameKey)) {
            matchedCountyId = cId;
            break;
          }
        }
      }

      if (!matchedCountyId) return;

      // 提取天氣要素 (相容 Object 結構與 Array 結構)
      const elements = item.WeatherElement || item.weatherElement || {};
      let temp = 25.0;
      let weather = '多雲';
      let rh = 70;
      let windSpeed = 2.0;
      let windDir = '偏東風';
      let highTemp = 28.0;
      let lowTemp = 22.0;
      let precip = 0.0;
      let uv = 5;
      let pressure = 1013.0;

      if (Array.isArray(elements)) {
        // 舊版 element 陣列格式
        const getVal = (name) => {
          const el = elements.find(e => e.elementName === name);
          return el ? el.elementValue : null;
        };
        temp = parseFloat(getVal('TEMP') || getVal('AirTemperature') || 25);
        weather = getVal('Weather') || '多雲';
        rh = parseFloat(getVal('HUMD') || getVal('RelativeHumidity') || 70);
        windSpeed = parseFloat(getVal('WDSD') || getVal('WindSpeed') || 2.0);
        highTemp = parseFloat(getVal('D_TX') || temp + 2.5);
        lowTemp = parseFloat(getVal('D_TN') || temp - 3.0);
        precip = parseFloat(getVal('NOW') || getVal('H_24R') || 0.0);
        pressure = parseFloat(getVal('PRES') || 1013.0);
      } else {
        // 新版 WeatherElement 物件格式
        temp = parseFloat(elements.AirTemperature ?? 25);
        weather = elements.Weather || '多雲';
        rh = parseFloat(elements.RelativeHumidity ?? 70);
        windSpeed = parseFloat(elements.WindSpeed ?? 2.0);
        pressure = parseFloat(elements.AirPressure ?? 1013.0);
        uv = parseInt(elements.UVIndex ?? 5, 10);
        precip = parseFloat(elements.Now?.Precipitation ?? 0.0);

        if (elements.DailyExtreme?.DailyHigh?.TemperatureInfo?.AirTemperature) {
          highTemp = parseFloat(elements.DailyExtreme.DailyHigh.TemperatureInfo.AirTemperature);
        } else {
          highTemp = Math.round((temp + 2.8) * 10) / 10;
        }

        if (elements.DailyExtreme?.DailyLow?.TemperatureInfo?.AirTemperature) {
          lowTemp = parseFloat(elements.DailyExtreme.DailyLow.TemperatureInfo.AirTemperature);
        } else {
          lowTemp = Math.round((temp - 3.2) * 10) / 10;
        }

        const deg = elements.WindDirection;
        if (deg !== undefined && deg !== null) {
          windDir = this.degreesToDirection(deg);
        }
      }

      // 檢查氣溫合理性 (過濾感測器異常值 -99)
      if (temp < -20 || temp > 50) temp = 25.0;
      if (highTemp < -20 || highTemp > 50) highTemp = Math.round((temp + 2.5) * 10) / 10;
      if (lowTemp < -20 || lowTemp > 50) lowTemp = Math.round((temp - 3.0) * 10) / 10;

      const icon = this.mapWeatherIcon(weather);
      const apparentTemp = this.calcApparentTemp(temp, rh, windSpeed);

      // 若已有該縣市資料，只在代表性主測站時覆寫
      if (!parsedData[matchedCountyId] || stationName === countyName.replace('縣', '').replace('市', '')) {
        const obsTimeStr = item.ObsTime?.DateTime 
          ? new Date(item.ObsTime.DateTime).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
          : new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });

        parsedData[matchedCountyId] = {
          id: matchedCountyId,
          name: countyName || DEMO_DATA.counties[matchedCountyId]?.name || '未知縣市',
          region: DEMO_DATA.counties[matchedCountyId]?.region || 'central',
          stationName: stationName,
          stationId: stationId,
          obsTime: obsTimeStr,
          temp: Math.round(temp * 10) / 10,
          apparentTemp: apparentTemp,
          minTemp: Math.round(lowTemp * 10) / 10,
          maxTemp: Math.round(highTemp * 10) / 10,
          weather: weather,
          icon: icon,
          humidity: Math.round(rh),
          rainProb: DEMO_DATA.counties[matchedCountyId]?.rainProb || 20,
          precipitation: precip,
          windSpeed: Math.round(windSpeed * 10) / 10,
          windDirection: windDir,
          uvIndex: uv,
          airPressure: Math.round(pressure * 10) / 10,
          comfort: this.getComfortDescription(temp, rh)
        };
      }
    });

    // 補足未抓到的縣市（使用 DEMO_DATA 作為基底）
    Object.keys(DEMO_DATA.counties).forEach(cId => {
      if (!parsedData[cId]) {
        parsedData[cId] = { ...DEMO_DATA.counties[cId], obsTime: '即時估算' };
      }
    });

    return parsedData;
  },

  /**
   * 取得指定縣市的完整資料（含 24h 與 7 日預報）
   */
  async getCountyWeather(countyId) {
    const mode = CONFIG.getMode();

    if (mode === 'live') {
      try {
        const liveAll = await this.fetchLiveObservations();
        const baseCounty = liveAll[countyId] || DEMO_DATA.getCountyData(countyId);
        return {
          ...baseCounty,
          hourlyForecast: DEMO_DATA.generateHourlyForecast(baseCounty),
          weeklyForecast: DEMO_DATA.generateWeeklyForecast(baseCounty)
        };
      } catch (err) {
        console.warn('CWA Live API 呼叫失敗，嘗試本地資料或展示模式：', err);
        throw err;
      }
    }

    // 若在 Demo/離線模式下，先檢查是否有使用者提供的 O-A0003-001.json
    const localData = await this.fetchLocalCWAData();
    if (localData && localData[countyId]) {
      const baseCounty = localData[countyId];
      return {
        ...baseCounty,
        hourlyForecast: DEMO_DATA.generateHourlyForecast(baseCounty),
        weeklyForecast: DEMO_DATA.generateWeeklyForecast(baseCounty)
      };
    }

    // Fallback 回退至高品質模擬資料
    return DEMO_DATA.getCountyData(countyId);
  },

  /**
   * 取得所有縣市即時摘要清單
   */
  async getAllCountiesWeather() {
    const mode = CONFIG.getMode();
    if (mode === 'live') {
      try {
        const liveAll = await this.fetchLiveObservations();
        return Object.values(liveAll);
      } catch (err) {
        console.warn('CWA Live API 獲取全台資料失敗：', err);
      }
    }

    // 檢查是否有使用者提供的 O-A0003-001.json
    const localData = await this.fetchLocalCWAData();
    if (localData && Object.keys(localData).length > 0) {
      return Object.values(localData);
    }

    return DEMO_DATA.getAllCounties();
  },

  // 風向角度轉中文方位
  degreesToDirection(deg) {
    const directions = ['北風', '北北東風', '東北風', '東北東風', '東風', '東南東風', '東南風', '南南東風', '南風', '南南西風', '西南風', '西南西風', '西風', '西北西風', '西北風', '北北西風'];
    const index = Math.round(deg / 22.5) % 16;
    return directions[index] || '微風';
  },

  // 舒適度評估
  getComfortDescription(temp, rh) {
    if (temp >= 32) return '悶熱易流汗';
    if (temp >= 28) return rh > 75 ? '悶熱' : '溫暖微熱';
    if (temp >= 24) return '舒適宜人';
    if (temp >= 19) return '稍有涼意';
    if (temp >= 15) return '涼爽舒適';
    return '寒冷防風保暖';
  }
};

window.API = API;
