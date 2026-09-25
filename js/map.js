/**
 * map.js - 台灣向量地圖互動控制模組
 * 負責 SVG 地圖渲染、各縣市點擊事件綁定、Hover 浮動氣象資訊 Tooltip 及雙向聯動高亮。
 */

class TaiwanMap {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.tooltip = document.getElementById(options.tooltipId || 'map-tooltip');
    this.onSelect = options.onSelect || (() => {});
    this.currentCounty = 'taipei';
    this.countiesData = {};

    this.init();
  }

  async init() {
    if (!this.container) return;

    try {
      // 載入台灣 SVG 地圖檔案
      const res = await fetch('assets/taiwan-map.svg');
      if (!res.ok) throw new Error(`無法載入地圖 SVG: ${res.statusText}`);
      const svgText = await res.text();
      this.container.innerHTML = svgText;

      this.bindMapEvents();
      this.highlightCounty(this.currentCounty);
    } catch (err) {
      console.error('初始化台灣地圖失敗：', err);
      this.container.innerHTML = `<div class="map-error-state"><p>地圖載入中或發生異常</p></div>`;
    }
  }

  // 更新地圖各縣市氣溫快取（供 Tooltip 顯示最新數據）
  updateData(countiesDataMap) {
    this.countiesData = countiesDataMap || {};
  }

  bindMapEvents() {
    const paths = this.container.querySelectorAll('.county-path');

    paths.forEach(path => {
      const countyId = path.getAttribute('data-id');
      const countyName = path.getAttribute('data-name');

      // 點擊選取縣市
      path.addEventListener('click', () => {
        this.highlightCounty(countyId);
        this.onSelect(countyId);
      });

      // 滑鼠進入與懸浮跟隨
      path.addEventListener('mouseenter', (e) => {
        this.showTooltip(e, countyId, countyName);
      });

      path.addEventListener('mousemove', (e) => {
        this.moveTooltip(e);
      });

      path.addEventListener('mouseleave', () => {
        this.hideTooltip();
      });
    });
  }

  highlightCounty(countyId) {
    this.currentCounty = countyId;
    if (!this.container) return;

    // 移除現有 active
    this.container.querySelectorAll('.county-path.active').forEach(el => {
      el.classList.remove('active');
    });

    // 加上當前 active
    const target = this.container.querySelector(`.county-path[data-id="${countyId}"]`);
    if (target) {
      target.classList.add('active');
    }

    // 若為離島，外框也加強醒目
    this.container.querySelectorAll('.island-box').forEach(box => box.classList.remove('active'));
    if (['penghu', 'kinmen', 'lienchiang'].includes(countyId)) {
      const box = this.container.querySelector(`#inset-${countyId}`);
      if (box) box.classList.add('active');
    }
  }

  showTooltip(e, countyId, countyName) {
    if (!this.tooltip) return;

    const data = this.countiesData[countyId] || DEMO_DATA.counties[countyId];
    const tempStr = data ? `${Math.round(data.temp)}°C` : '--°C';
    const weatherStr = data ? data.weather : '讀取中';
    const iconName = data ? data.icon : 'partly-cloudy';

    this.tooltip.innerHTML = `
      <div class="map-tip-header">
        <span class="map-tip-name">${countyName}</span>
        <span class="map-tip-temp">${tempStr}</span>
      </div>
      <div class="map-tip-body">
        <img src="assets/icons/${iconName}.svg" class="map-tip-icon" alt="${weatherStr}">
        <span>${weatherStr}</span>
      </div>
    `;

    this.tooltip.classList.add('visible');
    this.moveTooltip(e);
  }

  moveTooltip(e) {
    if (!this.tooltip) return;
    const offset = 14;
    let x = e.clientX + offset;
    let y = e.clientY + offset;

    // 防止超出視窗右邊界
    const tipRect = this.tooltip.getBoundingClientRect();
    if (x + tipRect.width > window.innerWidth - 10) {
      x = e.clientX - tipRect.width - offset;
    }
    // 防止超出視窗底邊界
    if (y + tipRect.height > window.innerHeight - 10) {
      y = e.clientY - tipRect.height - offset;
    }

    this.tooltip.style.left = `${x}px`;
    this.tooltip.style.top = `${y}px`;
  }

  hideTooltip() {
    if (this.tooltip) {
      this.tooltip.classList.remove('visible');
    }
  }
}

window.TaiwanMap = TaiwanMap;
