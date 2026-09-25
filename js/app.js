/**
 * app.js - 台灣氣象預報網站主協調入口程式
 * 協同 map.js, chart.js, ui.js, api.js, config.js 完成全站事件掛載、資料同步與錯誤降級。
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 全域狀態
  const state = {
    currentCountyId: CONFIG.getLastCounty() || 'taipei',
    currentRegion: 'all',
    searchKeyword: '',
    allCountiesData: [],
    chartInstance: null,
    mapInstance: null
  };

  // 1. 初始化趨勢圖表
  const canvasEl = document.getElementById('trend-canvas');
  if (canvasEl) {
    state.chartInstance = new WeatherTrendChart(canvasEl);
  }

  // 2. 初始化台灣向量地圖
  state.mapInstance = new TaiwanMap('taiwan-map-container', {
    tooltipId: 'map-tooltip',
    onSelect: (countyId) => {
      loadCountyWeather(countyId);
    }
  });

  // 3. 更新目前運行模式徽章
  UI.updateModeBadge(CONFIG.getMode());

  // 4. 載入並渲染所有縣市列表
  async function loadAllCountiesOverview() {
    try {
      state.allCountiesData = await API.getAllCountiesWeather();
      // 同步地圖的 Tooltip 氣象數據
      const mapDataDict = {};
      state.allCountiesData.forEach(c => { mapDataDict[c.id] = c; });
      if (state.mapInstance) state.mapInstance.updateData(mapDataDict);

      // 渲染全台縣市卡片清單
      UI.renderCountyGrid(state.allCountiesData, state.currentCountyId, (selectedId) => {
        loadCountyWeather(selectedId);
      });
      applyFilters();
    } catch (err) {
      console.error('載入全台縣市資料失敗：', err);
    }
  }

  // 5. 核心：切換並載入特定縣市氣象資料
  async function loadCountyWeather(countyId) {
    state.currentCountyId = countyId;
    CONFIG.setLastCounty(countyId);

    // 同步地圖與卡片高亮狀態
    if (state.mapInstance) state.mapInstance.highlightCounty(countyId);
    UI.updateActiveCountyCard(countyId);

    try {
      const data = await API.getCountyWeather(countyId);
      UI.renderHero(data);
      UI.renderHourly(data.hourlyForecast);
      if (state.chartInstance && data.weeklyForecast) {
        state.chartInstance.render(data.weeklyForecast);
      }
    } catch (err) {
      console.warn('載入縣市天氣時 API 異常，切換至展示模式：', err);
      UI.showToast(
        `氣象署 API 連線異常（${err.message || '連線逾時'}），已自動切換為 Demo 展示模式`,
        'error',
        '切換至展示模式',
        () => {
          CONFIG.setMode('demo');
          UI.updateModeBadge('demo');
          loadCountyWeather(countyId);
          loadAllCountiesOverview();
        }
      );
      // 容錯渲染 Demo 資料保證介面完整性
      const fallbackData = DEMO_DATA.getCountyData(countyId);
      UI.renderHero(fallbackData);
      UI.renderHourly(fallbackData.hourlyForecast);
      if (state.chartInstance) {
        state.chartInstance.render(fallbackData.weeklyForecast);
      }
    }
  }

  // 6. 搜尋與分區篩選邏輯
  function applyFilters() {
    const cards = document.querySelectorAll('.county-card');
    const keyword = state.searchKeyword.trim().toLowerCase();
    const region = state.currentRegion;

    cards.forEach(card => {
      const cId = card.getAttribute('data-id');
      const cRegion = card.getAttribute('data-region');
      const name = card.querySelector('.county-card-name')?.textContent || '';

      const matchRegion = (region === 'all' || cRegion === region);
      const matchKeyword = (!keyword || name.toLowerCase().includes(keyword) || cId.includes(keyword));

      if (matchRegion && matchKeyword) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });
  }

  // 綁定區域分頁按鈕
  document.querySelectorAll('.region-tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.region-tab-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      state.currentRegion = e.target.getAttribute('data-region');
      applyFilters();
    });
  });

  // 綁定搜尋輸入框
  const searchInput = document.getElementById('county-search-input');
  const searchClear = document.getElementById('search-clear-btn');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchKeyword = e.target.value;
      if (searchClear) {
        searchClear.style.display = state.searchKeyword ? 'block' : 'none';
      }
      applyFilters();
    });

    if (searchClear) {
      searchClear.addEventListener('click', () => {
        searchInput.value = '';
        state.searchKeyword = '';
        searchClear.style.display = 'none';
        applyFilters();
        searchInput.focus();
      });
    }
  }

  // 7. 設定 Modal (API Key 設定與展示模式切換)
  const modal = document.getElementById('settings-modal');
  const btnOpen = document.getElementById('btn-open-settings');
  const btnClose = document.getElementById('btn-close-modal');
  const inputKey = document.getElementById('input-api-key');
  const btnSave = document.getElementById('btn-save-api-key');
  const btnClear = document.getElementById('btn-clear-api-key');
  const btnDemo = document.getElementById('btn-switch-demo');

  if (btnOpen && modal) {
    btnOpen.addEventListener('click', () => {
      if (inputKey) inputKey.value = CONFIG.getApiKey();
      modal.classList.add('visible');
    });

    btnClose.addEventListener('click', () => {
      modal.classList.remove('visible');
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('visible');
    });

    // 儲存 API Key 並嘗試連線
    btnSave.addEventListener('click', async () => {
      const key = (inputKey.value || '').trim();
      if (!key) {
        UI.showToast('請先輸入中央氣象署 API 授權碼！', 'warning');
        return;
      }

      btnSave.disabled = true;
      btnSave.textContent = '驗證連線中...';

      try {
        CONFIG.setApiKey(key);
        CONFIG.setMode('live');
        // 嘗試測試抓取一次
        await API.fetchLiveObservations(key);
        UI.updateModeBadge('live');
        modal.classList.remove('visible');
        UI.showToast('中央氣象署 API 連線成功！已切換為即時觀測模式。', 'success');

        await loadCountyWeather(state.currentCountyId);
        await loadAllCountiesOverview();
      } catch (err) {
        console.error('API 驗證失敗：', err);
        UI.showToast(`API 連線驗證失敗：${err.message || '金鑰錯誤或無效'}`, 'error');
        CONFIG.setMode('demo');
        UI.updateModeBadge('demo');
      } finally {
        btnSave.disabled = false;
        btnSave.textContent = '儲存並套用';
      }
    });

    // 清除金鑰
    btnClear.addEventListener('click', () => {
      CONFIG.setApiKey('');
      CONFIG.setMode('demo');
      if (inputKey) inputKey.value = '';
      UI.updateModeBadge('demo');
      UI.showToast('已清除儲存的 API Key，恢復為展示模式。', 'info');
      modal.classList.remove('visible');
      loadCountyWeather(state.currentCountyId);
      loadAllCountiesOverview();
    });

    // 一鍵切換展示模式
    btnDemo.addEventListener('click', () => {
      CONFIG.setMode('demo');
      UI.updateModeBadge('demo');
      UI.showToast('已切換為展示模式 (Demo Mode)。', 'info');
      modal.classList.remove('visible');
      loadCountyWeather(state.currentCountyId);
      loadAllCountiesOverview();
    });
  }

  // 8. 首次載入流程
  await loadCountyWeather(state.currentCountyId);
  await loadAllCountiesOverview();

  // 若尚未設定過 API Key，顯示精緻引導提示
  if (!CONFIG.getApiKey()) {
    setTimeout(() => {
      UI.showToast(
        '目前處於展示模式（含全台真實模擬數據）。若有氣象署授權碼，請點擊右上角「設定 API Key」啟用即時觀測！',
        'info',
        '設定 API',
        () => {
          if (btnOpen) btnOpen.click();
        }
      );
    }, 1200);
  }
});
