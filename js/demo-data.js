/**
 * demo-data.js - 全台 22 縣市高擬真模擬氣象資料庫 (Demo Mode)
 * 模擬中央氣象署 O-A0003-001 觀測資料與預報資料結構，確保無 API Key 時仍能提供完整的儀表板與圖表體驗。
 */

const DEMO_DATA = {
  // 縣市對照表
  counties: {
    keelung: {
      id: 'keelung',
      name: '基隆市',
      region: 'north',
      stationName: '基隆',
      stationId: '466940',
      temp: 24.8,
      apparentTemp: 26.2,
      minTemp: 22.1,
      maxTemp: 27.5,
      weather: '多雲短暫雨',
      icon: 'rain-light',
      humidity: 84,
      rainProb: 60,
      precipitation: 1.5,
      windSpeed: 4.8,
      windDirection: '東北風',
      uvIndex: 4,
      airPressure: 1014.2,
      comfort: '舒適稍有涼意'
    },
    taipei: {
      id: 'taipei',
      name: '臺北市',
      region: 'north',
      stationName: '臺北',
      stationId: '466920',
      temp: 26.5,
      apparentTemp: 28.0,
      minTemp: 22.8,
      maxTemp: 30.2,
      weather: '晴時多雲',
      icon: 'partly-cloudy',
      humidity: 68,
      rainProb: 20,
      precipitation: 0.0,
      windSpeed: 2.5,
      windDirection: '偏東風',
      uvIndex: 7,
      airPressure: 1013.5,
      comfort: '溫暖舒適'
    },
    newtaipei: {
      id: 'newtaipei',
      name: '新北市',
      region: 'north',
      stationName: '新北 (板橋)',
      stationId: '466880',
      temp: 26.2,
      apparentTemp: 27.8,
      minTemp: 22.4,
      maxTemp: 29.8,
      weather: '多雲',
      icon: 'cloudy',
      humidity: 71,
      rainProb: 30,
      precipitation: 0.0,
      windSpeed: 2.8,
      windDirection: '東北東風',
      uvIndex: 6,
      airPressure: 1013.8,
      comfort: '舒適'
    },
    taoyuan: {
      id: 'taoyuan',
      name: '桃園市',
      region: 'north',
      stationName: '新屋',
      stationId: '467050',
      temp: 25.8,
      apparentTemp: 27.1,
      minTemp: 21.9,
      maxTemp: 28.9,
      weather: '多雲時晴',
      icon: 'partly-cloudy',
      humidity: 73,
      rainProb: 20,
      precipitation: 0.0,
      windSpeed: 4.2,
      windDirection: '東北風',
      uvIndex: 6,
      airPressure: 1013.9,
      comfort: '舒適微風'
    },
    hsinchucity: {
      id: 'hsinchucity',
      name: '新竹市',
      region: 'north',
      stationName: '新竹',
      stationId: '467570',
      temp: 26.0,
      apparentTemp: 27.4,
      minTemp: 22.0,
      maxTemp: 29.1,
      weather: '晴天',
      icon: 'sunny',
      humidity: 65,
      rainProb: 10,
      precipitation: 0.0,
      windSpeed: 5.1,
      windDirection: '東北風',
      uvIndex: 8,
      airPressure: 1013.2,
      comfort: '舒適稍有陣風'
    },
    hsinchucounty: {
      id: 'hsinchucounty',
      name: '新竹縣',
      region: 'north',
      stationName: '竹北',
      stationId: 'C0D570',
      temp: 25.6,
      apparentTemp: 27.0,
      minTemp: 21.5,
      maxTemp: 28.8,
      weather: '晴時多雲',
      icon: 'partly-cloudy',
      humidity: 68,
      rainProb: 15,
      precipitation: 0.0,
      windSpeed: 3.8,
      windDirection: '東北風',
      uvIndex: 7,
      airPressure: 1013.4,
      comfort: '溫和舒適'
    },
    miaoli: {
      id: 'miaoli',
      name: '苗栗縣',
      region: 'central',
      stationName: '國一N125K',
      stationId: 'C0E420',
      temp: 26.4,
      apparentTemp: 27.9,
      minTemp: 21.8,
      maxTemp: 29.6,
      weather: '晴天',
      icon: 'sunny',
      humidity: 66,
      rainProb: 10,
      precipitation: 0.0,
      windSpeed: 3.2,
      windDirection: '偏北風',
      uvIndex: 8,
      airPressure: 1012.9,
      comfort: '舒適乾爽'
    },
    taichung: {
      id: 'taichung',
      name: '臺中市',
      region: 'central',
      stationName: '臺中',
      stationId: '467490',
      temp: 28.1,
      apparentTemp: 30.0,
      minTemp: 23.2,
      maxTemp: 31.5,
      weather: '晴朗陽光',
      icon: 'sunny',
      humidity: 62,
      rainProb: 10,
      precipitation: 0.0,
      windSpeed: 2.1,
      windDirection: '微風',
      uvIndex: 8,
      airPressure: 1012.1,
      comfort: '溫暖稍熱'
    },
    changhua: {
      id: 'changhua',
      name: '彰化縣',
      region: 'central',
      stationName: '員林',
      stationId: 'C0G640',
      temp: 27.8,
      apparentTemp: 29.8,
      minTemp: 23.0,
      maxTemp: 31.0,
      weather: '晴天',
      icon: 'sunny',
      humidity: 64,
      rainProb: 10,
      precipitation: 0.0,
      windSpeed: 2.9,
      windDirection: '北北西風',
      uvIndex: 8,
      airPressure: 1012.3,
      comfort: '溫和舒適'
    },
    nantou: {
      id: 'nantou',
      name: '南投縣',
      region: 'central',
      stationName: '日月潭',
      stationId: '467650',
      temp: 24.5,
      apparentTemp: 25.8,
      minTemp: 19.8,
      maxTemp: 27.8,
      weather: '多雲午後局部陣雨',
      icon: 'rain-light',
      humidity: 78,
      rainProb: 40,
      precipitation: 0.5,
      windSpeed: 1.6,
      windDirection: '靜風',
      uvIndex: 6,
      airPressure: 1011.8,
      comfort: '舒適宜人'
    },
    yunlin: {
      id: 'yunlin',
      name: '雲林縣',
      region: 'central',
      stationName: '四湖',
      stationId: 'C0K400',
      temp: 27.6,
      apparentTemp: 29.5,
      minTemp: 22.8,
      maxTemp: 30.8,
      weather: '晴時多雲',
      icon: 'partly-cloudy',
      humidity: 67,
      rainProb: 15,
      precipitation: 0.0,
      windSpeed: 3.1,
      windDirection: '偏北風',
      uvIndex: 8,
      airPressure: 1012.4,
      comfort: '溫和晴朗'
    },
    chiayicity: {
      id: 'chiayicity',
      name: '嘉義市',
      region: 'south',
      stationName: '嘉義',
      stationId: '467480',
      temp: 28.4,
      apparentTemp: 30.5,
      minTemp: 23.0,
      maxTemp: 31.8,
      weather: '晴天',
      icon: 'sunny',
      humidity: 63,
      rainProb: 10,
      precipitation: 0.0,
      windSpeed: 2.2,
      windDirection: '東北風',
      uvIndex: 9,
      airPressure: 1011.9,
      comfort: '溫暖稍悶'
    },
    chiayicounty: {
      id: 'chiayicounty',
      name: '嘉義縣',
      region: 'south',
      stationName: '阿里山',
      stationId: '467530',
      temp: 22.8,
      apparentTemp: 23.5,
      minTemp: 16.5,
      maxTemp: 25.2,
      weather: '多雲時晴',
      icon: 'partly-cloudy',
      humidity: 76,
      rainProb: 25,
      precipitation: 0.0,
      windSpeed: 1.8,
      windDirection: '微風',
      uvIndex: 7,
      airPressure: 1012.0,
      comfort: '山區涼爽舒適'
    },
    tainan: {
      id: 'tainan',
      name: '臺南市',
      region: 'south',
      stationName: '臺南',
      stationId: '467410',
      temp: 29.0,
      apparentTemp: 31.4,
      minTemp: 24.2,
      maxTemp: 32.2,
      weather: '晴朗陽光',
      icon: 'sunny',
      humidity: 66,
      rainProb: 10,
      precipitation: 0.0,
      windSpeed: 3.0,
      windDirection: '偏北風',
      uvIndex: 9,
      airPressure: 1011.7,
      comfort: '晴朗微熱'
    },
    kaohsiung: {
      id: 'kaohsiung',
      name: '高雄市',
      region: 'south',
      stationName: '高雄',
      stationId: '467440',
      temp: 29.5,
      apparentTemp: 32.0,
      minTemp: 24.8,
      maxTemp: 32.8,
      weather: '晴天',
      icon: 'sunny',
      humidity: 65,
      rainProb: 10,
      precipitation: 0.0,
      windSpeed: 3.5,
      windDirection: '北北西風',
      uvIndex: 9,
      airPressure: 1011.5,
      comfort: '陽光明媚稍熱'
    },
    pingtung: {
      id: 'pingtung',
      name: '屏東縣',
      region: 'south',
      stationName: '恆春',
      stationId: '467590',
      temp: 28.8,
      apparentTemp: 31.0,
      minTemp: 24.5,
      maxTemp: 31.6,
      weather: '晴時多雲',
      icon: 'partly-cloudy',
      humidity: 70,
      rainProb: 20,
      precipitation: 0.0,
      windSpeed: 5.6,
      windDirection: '東北風 (落山風)',
      uvIndex: 8,
      airPressure: 1011.6,
      comfort: '溫熱風勁'
    },
    yilan: {
      id: 'yilan',
      name: '宜蘭縣',
      region: 'east',
      stationName: '宜蘭',
      stationId: '467080',
      temp: 25.1,
      apparentTemp: 26.8,
      minTemp: 22.0,
      maxTemp: 28.4,
      weather: '陰局部短暫雨',
      icon: 'rain-light',
      humidity: 82,
      rainProb: 50,
      precipitation: 2.0,
      windSpeed: 2.7,
      windDirection: '偏東風',
      uvIndex: 5,
      airPressure: 1013.6,
      comfort: '舒適稍濕涼'
    },
    hualien: {
      id: 'hualien',
      name: '花蓮縣',
      region: 'east',
      stationName: '花蓮',
      stationId: '466990',
      temp: 26.3,
      apparentTemp: 28.2,
      minTemp: 23.0,
      maxTemp: 29.5,
      weather: '多雲短暫陣雨',
      icon: 'rain-light',
      humidity: 77,
      rainProb: 35,
      precipitation: 0.5,
      windSpeed: 3.3,
      windDirection: '東北東風',
      uvIndex: 7,
      airPressure: 1013.0,
      comfort: '舒適清涼'
    },
    taitung: {
      id: 'taitung',
      name: '臺東縣',
      region: 'east',
      stationName: '臺東',
      stationId: '467660',
      temp: 27.2,
      apparentTemp: 29.3,
      minTemp: 23.5,
      maxTemp: 30.5,
      weather: '多雲時晴',
      icon: 'partly-cloudy',
      humidity: 74,
      rainProb: 25,
      precipitation: 0.0,
      windSpeed: 3.6,
      windDirection: '偏東北風',
      uvIndex: 8,
      airPressure: 1012.6,
      comfort: '舒適溫和'
    },
    penghu: {
      id: 'penghu',
      name: '澎湖縣',
      region: 'islands',
      stationName: '澎湖',
      stationId: '467350',
      temp: 26.8,
      apparentTemp: 28.5,
      minTemp: 23.6,
      maxTemp: 29.4,
      weather: '晴天海風強',
      icon: 'wind',
      humidity: 72,
      rainProb: 10,
      precipitation: 0.0,
      windSpeed: 6.8,
      windDirection: '東北風',
      uvIndex: 8,
      airPressure: 1012.7,
      comfort: '舒適海風強勁'
    },
    kinmen: {
      id: 'kinmen',
      name: '金門縣',
      region: 'islands',
      stationName: '金門',
      stationId: '467110',
      temp: 24.9,
      apparentTemp: 26.0,
      minTemp: 21.0,
      maxTemp: 28.0,
      weather: '晴時多雲',
      icon: 'partly-cloudy',
      humidity: 69,
      rainProb: 15,
      precipitation: 0.0,
      windSpeed: 4.5,
      windDirection: '偏東北風',
      uvIndex: 7,
      airPressure: 1014.0,
      comfort: '秋高氣爽'
    },
    lienchiang: {
      id: 'lienchiang',
      name: '連江縣',
      region: 'islands',
      stationName: '馬祖',
      stationId: '467990',
      temp: 22.4,
      apparentTemp: 22.8,
      minTemp: 19.5,
      maxTemp: 25.0,
      weather: '多雲稍有霧',
      icon: 'cloudy',
      humidity: 80,
      rainProb: 20,
      precipitation: 0.0,
      windSpeed: 5.2,
      windDirection: '東北風',
      uvIndex: 5,
      airPressure: 1015.2,
      comfort: '涼爽微涼'
    }
  },

  // 產生指定縣市未來 24 小時預報（每 3 小時一組，共 8 組）
  generateHourlyForecast(county) {
    const hours = [];
    const now = new Date();
    const baseHour = Math.floor(now.getHours() / 3) * 3;
    const baseTemp = county.temp;

    for (let i = 0; i < 8; i++) {
      const forecastHour = (baseHour + i * 3) % 24;
      const isNight = forecastHour < 6 || forecastHour >= 18;
      // 日夜氣溫微調
      let tempDelta = 0;
      if (forecastHour >= 11 && forecastHour <= 15) tempDelta = 2.5;
      else if (forecastHour >= 7 && forecastHour < 11) tempDelta = 1.0;
      else if (forecastHour >= 16 && forecastHour < 19) tempDelta = 0.5;
      else if (forecastHour >= 19 && forecastHour < 23) tempDelta = -1.5;
      else tempDelta = -2.8;

      const hourTemp = Math.round((baseTemp + tempDelta + (Math.random() * 0.6 - 0.3)) * 10) / 10;
      const hourRain = Math.max(0, Math.min(100, Math.round(county.rainProb + (Math.random() * 15 - 8))));

      let icon = county.icon;
      if (hourRain >= 50) icon = 'rain-light';
      else if (isNight && icon === 'sunny') icon = 'partly-cloudy';

      const timeLabel = `${forecastHour.toString().padStart(2, '0')}:00`;
      hours.push({
        time: timeLabel,
        temp: hourTemp,
        rainProb: hourRain,
        weather: hourRain >= 50 ? '短暫陣雨' : (hourRain > 20 ? '多雲' : '晴天'),
        icon: icon
      });
    }
    return hours;
  },

  // 產生指定縣市未來 7 日天氣趨勢
  generateWeeklyForecast(county) {
    const days = [];
    const weekdays = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
    const now = new Date();

    for (let i = 0; i < 7; i++) {
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() + i);

      const month = targetDate.getMonth() + 1;
      const dateNum = targetDate.getDate();
      const weekday = i === 0 ? '今天' : (i === 1 ? '明天' : weekdays[targetDate.getDay()]);

      // 產生自然波動
      const variance = (Math.sin(i * 1.2) * 1.5);
      const highTemp = Math.round((county.maxTemp + variance + (Math.random() * 0.8 - 0.4)) * 10) / 10;
      const lowTemp = Math.round((county.minTemp + variance * 0.8 + (Math.random() * 0.8 - 0.4)) * 10) / 10;
      const rain = Math.max(5, Math.min(90, Math.round(county.rainProb + (Math.sin(i) * 20))));

      let dayIcon = county.icon;
      if (rain >= 55) dayIcon = 'rain';
      else if (rain >= 35) dayIcon = 'rain-light';
      else if (rain <= 15) dayIcon = 'sunny';
      else dayIcon = 'partly-cloudy';

      days.push({
        date: `${month}/${dateNum}`,
        weekday: weekday,
        highTemp: highTemp,
        lowTemp: lowTemp,
        weather: rain >= 50 ? '陰短暫雨' : (rain >= 30 ? '多雲時晴' : '晴天'),
        icon: dayIcon,
        rainProb: rain
      });
    }
    return days;
  },

  // 取得完整縣市氣象資料套件
  getCountyData(countyId) {
    const county = this.counties[countyId] || this.counties['taipei'];
    const nowStr = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
    return {
      ...county,
      obsTime: nowStr,
      hourlyForecast: this.generateHourlyForecast(county),
      weeklyForecast: this.generateWeeklyForecast(county)
    };
  },

  // 取得所有縣市即時摘要清單
  getAllCounties() {
    return Object.values(this.counties).map(c => ({
      id: c.id,
      name: c.name,
      region: c.region,
      stationName: c.stationName,
      temp: c.temp,
      weather: c.weather,
      icon: c.icon,
      maxTemp: c.maxTemp,
      minTemp: c.minTemp,
      rainProb: c.rainProb
    }));
  }
};

window.DEMO_DATA = DEMO_DATA;
