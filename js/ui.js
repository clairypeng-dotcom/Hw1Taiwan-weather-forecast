/**
 * ui.js - 視覺介面渲染與 DOM 互動管理模組
 * 包含氣象主儀表板、未來 24 小時預報橫列、全台縣市速覽卡片、搜尋過濾、API 設定 Modal 與 Toast 提示系統。
 */

const UI = {
  // DOM 元素引用快取
  elements: {
    cityName: document.getElementById('hero-city-name'),
    stationName: document.getElementById('hero-station-name'),
    obsTime: document.getElementById('hero-obs-time'),
    currentTemp: document.getElementById('hero-temp-val'),
    conditionText: document.getElementById('hero-condition-text'),
    conditionIcon: document.getElementById('hero-weather-icon'),
    todayHigh: document.getElementById('hero-today-high'),
    todayLow: document.getElementById('hero-today-low'),

    // 指標卡
    metricApparent: document.getElementById('metric-apparent'),
    metricHumidity: document.getElementById('metric-humidity'),
    metricRain: document.getElementById('metric-rain'),
    metricWind: document.getElementById('metric-wind'),
    metricWindDir: document.getElementById('metric-wind-dir'),
    metricUv: document.getElementById('metric-uv'),
    metricPressure: document.getElementById('metric-pressure'),
    metricComfort: document.getElementById('metric-comfort'),

    // 容器
    hourlyList: document.getElementById('hourly-forecast-list'),
    countyGrid: document.getElementById('county-cards-grid'),
    toastContainer: document.getElementById('toast-container'),

    // 模式標籤與按鈕
    modeBadge: document.getElementById('app-mode-badge'),
    btnOpenSettings: document.getElementById('btn-open-settings'),
    settingsModal: document.getElementById('settings-modal'),
    inputApiKey: document.getElementById('input-api-key'),
    btnSaveApiKey: document.getElementById('btn-save-api-key'),
    btnClearApiKey: document.getElementById('btn-clear-api-key'),
    btnSwitchDemo: document.getElementById('btn-switch-demo'),
    btnCloseModal: document.getElementById('btn-close-modal'),

    // 搜尋與區域篩選
    searchInput: document.getElementById('county-search-input'),
    searchClear: document.getElementById('search-clear-btn'),
    regionTabs: document.querySelectorAll('.region-tab-btn')
  },

  /**
   * 渲染主儀表板即時氣象資訊
   */
  renderHero(data) {
    if (!data) return;

    this.elements.cityName.textContent = data.name;
    this.elements.stationName.textContent = data.stationName ? `測站：${data.stationName}` : '';
    this.elements.obsTime.textContent = `更新於 ${data.obsTime || '剛剛'}`;

    this.elements.currentTemp.textContent = Math.round(data.temp);
    this.elements.conditionText.textContent = data.weather;
    this.elements.conditionIcon.src = `assets/icons/${data.icon}.svg`;
    this.elements.conditionIcon.alt = data.weather;

    this.elements.todayHigh.textContent = `${Math.round(data.maxTemp)}°`;
    this.elements.todayLow.textContent = `${Math.round(data.minTemp)}°`;

    // 六大指標數值
    this.elements.metricApparent.textContent = `${Math.round(data.apparentTemp || data.temp)}°C`;
    this.elements.metricHumidity.textContent = `${data.humidity}%`;
    this.elements.metricRain.textContent = `${data.rainProb}%`;
    this.elements.metricWind.textContent = `${data.windSpeed} m/s`;
    this.elements.metricWindDir.textContent = data.windDirection || '微風';
    this.elements.metricUv.textContent = `${data.uvIndex ?? 5} 級`;
    this.elements.metricPressure.textContent = `${data.airPressure || 1013} hPa`;
    this.elements.metricComfort.textContent = data.comfort || '舒適';

    // 氣溫數字微進場動畫
    this.elements.currentTemp.classList.remove('temp-bounce');
    void this.elements.currentTemp.offsetWidth;
    this.elements.currentTemp.classList.add('temp-bounce');
  },

  /**
   * 渲染未來 24 小時時段預報橫向卡片
   */
  renderHourly(hourlyList) {
    if (!this.elements.hourlyList) return;
    this.elements.hourlyList.innerHTML = '';

    if (!hourlyList || hourlyList.length === 0) {
      this.elements.hourlyList.innerHTML = '<div class="empty-hint">暫無預報資料</div>';
      return;
    }

    hourlyList.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = `hourly-card ${index === 0 ? 'is-now' : ''}`;
      card.innerHTML = `
        <span class="hourly-time">${index === 0 ? '現在' : item.time}</span>
        <img src="assets/icons/${item.icon}.svg" class="hourly-icon" alt="${item.weather}">
        <span class="hourly-temp">${Math.round(item.temp)}°</span>
        <div class="hourly-pop">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#0284C7" stroke-width="2">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
          </svg>
          <span>${item.rainProb}%</span>
        </div>
      `;
      this.elements.hourlyList.appendChild(card);
    });
  },

  /**
   * 渲染全台各縣市速覽卡片清單
   */
  renderCountyGrid(countiesList, activeCountyId, onSelectCallback) {
    if (!this.elements.countyGrid) return;
    this.elements.countyGrid.innerHTML = '';

    countiesList.forEach(county => {
      const card = document.createElement('div');
      const isActive = county.id === activeCountyId;
      card.className = `county-card ${isActive ? 'active' : ''}`;
      card.setAttribute('data-id', county.id);
      card.setAttribute('data-region', county.region);

      card.innerHTML = `
        <div class="county-card-head">
          <span class="county-card-name">${county.name}</span>
          <span class="county-card-temp">${Math.round(county.temp)}°</span>
        </div>
        <div class="county-card-body">
          <div class="county-card-desc">
            <img src="assets/icons/${county.icon}.svg" class="county-card-icon" alt="${county.weather}">
            <span class="county-card-weather">${county.weather}</span>
          </div>
          <div class="county-card-range">
            <span class="range-high">${Math.round(county.maxTemp)}°</span>
            <span class="range-divider">/</span>
            <span class="range-low">${Math.round(county.minTemp)}°</span>
          </div>
        </div>
      `;

      card.addEventListener('click', () => {
        if (typeof onSelectCallback === 'function') {
          onSelectCallback(county.id);
        }
      });

      this.elements.countyGrid.appendChild(card);
    });
  },

  /**
   * 快速更新全台卡片中的 active 高亮
   */
  updateActiveCountyCard(activeCountyId) {
    if (!this.elements.countyGrid) return;
    this.elements.countyGrid.querySelectorAll('.county-card').forEach(card => {
      if (card.getAttribute('data-id') === activeCountyId) {
        card.classList.add('active');
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      } else {
        card.classList.remove('active');
      }
    });
  },

  /**
   * 更新頂部模式狀態徽章 (Demo vs Live)
   */
  updateModeBadge(mode) {
    if (!this.elements.modeBadge) return;
    if (mode === 'live') {
      this.elements.modeBadge.className = 'mode-badge live';
      this.elements.modeBadge.innerHTML = `
        <span class="mode-dot"></span>
        <span>中央氣象署 API (即時連線)</span>
      `;
    } else {
      this.elements.modeBadge.className = 'mode-badge demo';
      this.elements.modeBadge.innerHTML = `
        <span class="mode-dot"></span>
        <span>展示模式 (全台真實模擬)</span>
      `;
    }
  },

  /**
   * 彈出通用 Toast 提示訊息
   */
  showToast(message, type = 'info', actionText = null, onAction = null) {
    if (!this.elements.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type}`;

    let actionBtnHtml = '';
    if (actionText) {
      actionBtnHtml = `<button class="toast-action-btn">${actionText}</button>`;
    }

    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon">${type === 'error' ? '⚠️' : (type === 'success' ? '✅' : 'ℹ️')}</span>
        <span class="toast-text">${message}</span>
      </div>
      ${actionBtnHtml}
      <button class="toast-close-btn" aria-label="關閉">&times;</button>
    `;

    if (actionText && typeof onAction === 'function') {
      const btn = toast.querySelector('.toast-action-btn');
      if (btn) {
        btn.addEventListener('click', () => {
          onAction();
          toast.remove();
        });
      }
    }

    const closeBtn = toast.querySelector('.toast-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => toast.remove());
    }

    this.elements.toastContainer.appendChild(toast);

    // 5 秒後自動消失
    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.animation = 'toastOut 0.3s forwards ease-in';
        setTimeout(() => toast.remove(), 300);
      }
    }, 5500);
  }
};

window.UI = UI;
