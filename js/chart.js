/**
 * chart.js - 未來數日天氣趨勢折線圖 (Vanilla HTML5 Canvas)
 * 雙曲線繪製（今日與未來數日最高溫、最低溫曲線）
 * 支援高解析度 Retina 螢幕、貝茲曲線平滑過渡、漸層填色與游標懸浮 Tooltip 互動。
 */

class WeatherTrendChart {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.data = [];
    this.hoverIndex = -1;
    this.padding = { top: 40, right: 35, bottom: 40, left: 35 };

    this.initEvents();
  }

  initEvents() {
    window.addEventListener('resize', () => {
      if (this.data && this.data.length > 0) {
        this.render(this.data);
      }
    });

    this.canvas.addEventListener('mousemove', (e) => {
      this.handleMouseMove(e);
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.hoverIndex = -1;
      this.draw();
    });
  }

  handleMouseMove(e) {
    if (!this.data || this.data.length === 0) return;
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const width = rect.width;
    const chartW = width - this.padding.left - this.padding.right;
    const step = chartW / (this.data.length - 1);

    let closestIdx = Math.round((mouseX - this.padding.left) / step);
    closestIdx = Math.max(0, Math.min(this.data.length - 1, closestIdx));

    if (this.hoverIndex !== closestIdx) {
      this.hoverIndex = closestIdx;
      this.draw();
    }
  }

  render(weeklyData) {
    this.data = weeklyData || [];
    if (!this.canvas || !this.data || this.data.length === 0) return;

    // 處理 Retina 高解析度縮放
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    const displayWidth = rect.width || this.canvas.parentElement.clientWidth || 600;
    const displayHeight = 240;

    this.canvas.width = displayWidth * dpr;
    this.canvas.height = displayHeight * dpr;
    this.canvas.style.width = `${displayWidth}px`;
    this.canvas.style.height = `${displayHeight}px`;

    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);

    this.draw();
  }

  draw() {
    if (!this.data || this.data.length === 0) return;

    const width = parseFloat(this.canvas.style.width);
    const height = parseFloat(this.canvas.style.height);
    const ctx = this.ctx;

    ctx.clearRect(0, 0, width, height);

    // 計算溫度上下界
    let minVal = 100;
    let maxVal = -100;
    this.data.forEach(d => {
      if (d.highTemp > maxVal) maxVal = d.highTemp;
      if (d.lowTemp < minVal) minVal = d.lowTemp;
    });

    // 預留垂直緩衝區
    minVal = Math.floor(minVal - 2);
    maxVal = Math.ceil(maxVal + 2);
    const range = maxVal - minVal || 1;

    const chartW = width - this.padding.left - this.padding.right;
    const chartH = height - this.padding.top - this.padding.bottom;
    const step = chartW / (this.data.length - 1);

    // 座標映射
    const getY = (val) => {
      return this.padding.top + chartH - ((val - minVal) / range) * chartH;
    };

    const highPoints = this.data.map((d, i) => ({
      x: this.padding.left + i * step,
      y: getY(d.highTemp),
      val: d.highTemp
    }));

    const lowPoints = this.data.map((d, i) => ({
      x: this.padding.left + i * step,
      y: getY(d.lowTemp),
      val: d.lowTemp
    }));

    // 繪製背景水平參考線
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.6)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    for (let t = Math.ceil(minVal / 5) * 5; t <= maxVal; t += 5) {
      const y = getY(t);
      if (y >= this.padding.top && y <= height - this.padding.bottom) {
        ctx.beginPath();
        ctx.moveTo(this.padding.left, y);
        ctx.lineTo(width - this.padding.right, y);
        ctx.stroke();

        ctx.fillStyle = '#94A3B8';
        ctx.font = '10px Outfit, "Noto Sans TC", sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`${t}°`, this.padding.left - 8, y + 3);
      }
    }
    ctx.setLineDash([]); // 恢復實線

    // 繪製最高溫區域漸層 (溫暖橙色)
    const highGrad = ctx.createLinearGradient(0, this.padding.top, 0, height - this.padding.bottom);
    highGrad.addColorStop(0, 'rgba(249, 115, 22, 0.22)');
    highGrad.addColorStop(1, 'rgba(249, 115, 22, 0.01)');
    this.drawCurvedArea(highPoints, highGrad);

    // 繪製最低溫區域漸層 (清爽天藍色)
    const lowGrad = ctx.createLinearGradient(0, this.padding.top, 0, height - this.padding.bottom);
    lowGrad.addColorStop(0, 'rgba(2, 132, 199, 0.18)');
    lowGrad.addColorStop(1, 'rgba(2, 132, 199, 0.01)');
    this.drawCurvedArea(lowPoints, lowGrad);

    // 繪製最高溫平滑曲線
    this.drawCurvedLine(highPoints, '#F97316', 3);

    // 繪製最低溫平滑曲線
    this.drawCurvedLine(lowPoints, '#0284C7', 3);

    // 繪製節點圓點與數值標籤
    this.data.forEach((d, i) => {
      const hp = highPoints[i];
      const lp = lowPoints[i];

      // 高溫圓點
      ctx.beginPath();
      ctx.arc(hp.x, hp.y, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.strokeStyle = '#F97316';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // 高溫文字
      ctx.fillStyle = '#C2410C';
      ctx.font = '600 12px Outfit, "Noto Sans TC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(d.highTemp)}°`, hp.x, hp.y - 10);

      // 低溫圓點
      ctx.beginPath();
      ctx.arc(lp.x, lp.y, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.strokeStyle = '#0284C7';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // 低溫文字
      ctx.fillStyle = '#0369A1';
      ctx.font = '600 12px Outfit, "Noto Sans TC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(d.lowTemp)}°`, lp.x, lp.y + 18);

      // 底部星期與日期標籤
      ctx.fillStyle = i === 0 ? '#2563EB' : '#475569';
      ctx.font = i === 0 ? '700 12px "Noto Sans TC", sans-serif' : '500 12px "Noto Sans TC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(d.weekday, hp.x, height - 18);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '10px Outfit, sans-serif';
      ctx.fillText(d.date, hp.x, height - 5);
    });

    // 懸浮指示線與 Tooltip 卡片
    if (this.hoverIndex >= 0 && this.hoverIndex < this.data.length) {
      const activeData = this.data[this.hoverIndex];
      const hx = highPoints[this.hoverIndex].x;

      ctx.strokeStyle = 'rgba(37, 99, 235, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(hx, this.padding.top - 10);
      ctx.lineTo(hx, height - this.padding.bottom + 5);
      ctx.stroke();
      ctx.setLineDash([]);

      // 高亮當前節點外圈
      [highPoints[this.hoverIndex], lowPoints[this.hoverIndex]].forEach((pt, idx) => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 7, 0, Math.PI * 2);
        ctx.fillStyle = idx === 0 ? 'rgba(249, 115, 22, 0.25)' : 'rgba(2, 132, 199, 0.25)';
        ctx.fill();
      });
    }
  }

  // 平滑貝茲曲線線條
  drawCurvedLine(points, strokeColor, lineWidth) {
    if (points.length < 2) return;
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const midX = (p0.x + p1.x) / 2;
      ctx.bezierCurveTo(midX, p0.y, midX, p1.y, p1.x, p1.y);
    }

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }

  // 平滑區域填色
  drawCurvedArea(points, fillStyle) {
    if (points.length < 2) return;
    const ctx = this.ctx;
    const height = parseFloat(this.canvas.style.height);
    const bottomY = height - this.padding.bottom;

    ctx.beginPath();
    ctx.moveTo(points[0].x, bottomY);
    ctx.lineTo(points[0].x, points[0].y);

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const midX = (p0.x + p1.x) / 2;
      ctx.bezierCurveTo(midX, p0.y, midX, p1.y, p1.x, p1.y);
    }

    ctx.lineTo(points[points.length - 1].x, bottomY);
    ctx.closePath();
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }
}

window.WeatherTrendChart = WeatherTrendChart;
