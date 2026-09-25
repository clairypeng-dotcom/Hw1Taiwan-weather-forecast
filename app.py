"""
app.py - Taiwan Weather Forecast (HW10)
Streamlit Web App:
- 資料來源：SQLite data.db (TemperatureForecasts)
- 核心功能：
  1. 台灣互動地圖 (Folium)：點選縣市標記即時切換地區並更新右側預報
  2. 地區下拉選單 (st.selectbox)：從 SQLite 動態取得並雙向連動
  3. 最高/最低溫折線圖 (Altair)：X 軸 dataDate, Y 軸 temperature °C, MaxT & MinT 雙軌
  4. 一週預報資料表 (Date, MinT, MaxT)
  5. 友善錯誤處理 (Crash-safe)
  6. 藍白色現代氣象儀表板風格
"""

import os
import sqlite3
import pandas as pd
import streamlit as st
import altair as alt
import folium
from streamlit_folium import st_folium

# 頁面配置
st.set_page_config(
    page_title="Taiwan Weather Forecast",
    page_icon="🌤️",
    layout="wide"
)

DB_PATH = os.path.join(os.path.dirname(__file__), "data.db")

# 台灣 22 縣市與 6 大分區代表座標 (用於 Folium 地圖標記點選)
REGION_COORDINATES = {
    # 6 大分區代表座標
    "北部地區": (25.045, 121.525),
    "中部地區": (24.160, 120.670),
    "南部地區": (22.990, 120.215),
    "東北部地區": (24.700, 121.740),
    "東部地區": (23.985, 121.600),
    "東南部地區": (22.760, 121.145),
    # 22 縣市代表座標
    "基隆市": (25.1276, 121.7392),
    "臺北市": (25.0375, 121.5637),
    "新北市": (25.0118, 121.4628),
    "桃園市": (24.9936, 121.3010),
    "新竹市": (24.8138, 120.9675),
    "新竹縣": (24.8387, 121.0177),
    "苗栗縣": (24.5602, 120.8214),
    "臺中市": (24.1477, 120.6736),
    "彰化縣": (24.0518, 120.5161),
    "南投縣": (23.9609, 120.9719),
    "雲林縣": (23.7092, 120.4313),
    "嘉義市": (23.4800, 120.4491),
    "嘉義縣": (23.4518, 120.2555),
    "臺南市": (22.9997, 120.2270),
    "高雄市": (22.6273, 120.3014),
    "屏東縣": (22.5519, 120.5487),
    "宜蘭縣": (24.7021, 121.7377),
    "花蓮縣": (23.9872, 121.6016),
    "臺東縣": (22.7583, 121.1444),
    "澎湖縣": (23.5712, 119.5793),
    "金門縣": (24.4491, 118.3766),
    "連江縣": (26.1558, 119.9519)
}


def find_closest_region(lat: float, lng: float) -> str | None:
    """根據點擊的經緯度，比對距離最近的地區名稱"""
    min_dist = float("inf")
    closest_name = None
    for name, (r_lat, r_lng) in REGION_COORDINATES.items():
        dist = (r_lat - lat) ** 2 + (r_lng - lng) ** 2
        if dist < min_dist:
            min_dist = dist
            closest_name = name
    # 允許在標記點周圍約 0.6 度內判定有效點選
    if min_dist < 0.6:
        return closest_name
    return None


# 注入藍白現代氣象儀表板 CSS (維持精緻視覺風格)
st.markdown("""
<style>
    .stApp {
        background: linear-gradient(180deg, #F0F6FF 0%, #FFFFFF 60%);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans TC", sans-serif;
    }
    
    .main-header {
        background: linear-gradient(135deg, #1E3A8A 0%, #2563EB 60%, #38BDF8 100%);
        color: white;
        padding: 24px 30px;
        border-radius: 16px;
        box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.3);
        margin-bottom: 24px;
    }
    .main-header h1 {
        color: white !important;
        font-size: 2.2rem;
        font-weight: 800;
        margin: 0;
        padding: 0;
    }
    .main-header p {
        color: rgba(255, 255, 255, 0.88);
        font-size: 0.95rem;
        margin: 6px 0 0 0;
    }

    div[data-testid="stMetricValue"] {
        font-size: 1.8rem;
        font-weight: 700;
        color: #1E3A8A;
    }
</style>
""", unsafe_allow_html=True)


def check_database() -> tuple[bool, str]:
    """檢查 SQLite 資料庫檔案與資料表，發生問題時提供友善訊息，不崩潰"""
    if not os.path.exists(DB_PATH):
        return False, f"⚠️ 找不到資料庫檔案 `{DB_PATH}`！請先於終端機執行 `python database.py` 初始化資料庫並匯入資料。"

    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='TemperatureForecasts';")
        if not cursor.fetchone():
            conn.close()
            return False, "⚠️ 資料庫中缺少 `TemperatureForecasts` 資料表！請先執行 `python database.py` 建立資料表。"

        cursor.execute("SELECT COUNT(*) FROM TemperatureForecasts;")
        count = cursor.fetchone()[0]
        conn.close()

        if count == 0:
            return False, "ℹ️ `TemperatureForecasts` 資料表中目前尚無任何預報資料。請先執行 `python database.py` 擷取資料。"

        return True, ""
    except sqlite3.Error as e:
        return False, f"⚠️ 連線 SQLite 資料庫時發生錯誤: {e}"


def get_regions_from_db() -> list[str]:
    """從 SQLite data.db 動態查詢所有可用地區名稱 (regionName)"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT DISTINCT regionName FROM TemperatureForecasts;")
        rows = cursor.fetchall()
        conn.close()

        db_regions = [r[0] for r in rows if r[0]]
        
        # 優先排入作業要求的 6 大分區
        priority = ["北部地區", "中部地區", "南部地區", "東北部地區", "東部地區", "東南部地區"]
        sorted_regions = [p for p in priority if p in db_regions]
        for r in sorted(db_regions):
            if r not in sorted_regions:
                sorted_regions.append(r)

        return sorted_regions
    except Exception:
        return []


def query_forecasts_from_db(region_name: str) -> pd.DataFrame:
    """從 SQLite 查詢特定地區未來 7 天預報資料 (嚴格禁止假資料)"""
    try:
        conn = sqlite3.connect(DB_PATH)
        query = """
        SELECT regionName, dataDate, minT, maxT
        FROM TemperatureForecasts
        WHERE regionName = ?
        ORDER BY dataDate ASC;
        """
        df = pd.read_sql_query(query, conn, params=(region_name,))
        conn.close()
        return df
    except Exception as e:
        st.error(f"查詢資料庫失敗: {e}")
        return pd.DataFrame()


def query_all_latest_temps() -> dict[str, dict]:
    """查詢所有地區第一天的氣溫，用於地圖標記 Popup 顯示"""
    try:
        conn = sqlite3.connect(DB_PATH)
        query = """
        SELECT regionName, dataDate, minT, maxT
        FROM TemperatureForecasts
        GROUP BY regionName
        ORDER BY dataDate ASC;
        """
        df = pd.read_sql_query(query, conn)
        conn.close()
        result = {}
        for _, row in df.iterrows():
            result[row["regionName"]] = {
                "date": row["dataDate"],
                "minT": row["minT"],
                "maxT": row["maxT"]
            }
        return result
    except Exception:
        return {}


def get_dates_from_db() -> list[str]:
    """從 SQLite data.db 動態查詢所有可用預報日期 (dataDate)"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT DISTINCT dataDate FROM TemperatureForecasts ORDER BY dataDate ASC;")
        rows = cursor.fetchall()
        conn.close()
        return [r[0] for r in rows if r[0]]
    except Exception:
        return []


def query_all_temps_by_date(target_date: str) -> dict[str, dict]:
    """查詢所有地區在指定預報日期的氣溫，用於地圖標記著色與 Popup 顯示"""
    try:
        conn = sqlite3.connect(DB_PATH)
        query = """
        SELECT regionName, dataDate, minT, maxT
        FROM TemperatureForecasts
        WHERE dataDate = ?;
        """
        df = pd.read_sql_query(query, conn, params=(target_date,))
        conn.close()
        result = {}
        for _, row in df.iterrows():
            result[row["regionName"]] = {
                "date": row["dataDate"],
                "minT": row["minT"],
                "maxT": row["maxT"]
            }
        return result
    except Exception:
        return {}


def main():
    # 頂部藍白儀表板橫幅
    st.markdown("""
    <div class="main-header">
        <h1>🌤️ Taiwan Weather Forecast</h1>
        <p>基於 SQLite (data.db / TemperatureForecasts) · 點選地圖地標即時連動切換地區氣象</p>
    </div>
    """, unsafe_allow_html=True)

    # 檢查資料庫狀態 (若初次部署至 Streamlit Cloud，自動初始化 SQLite 資料庫)
    db_ok, error_msg = check_database()
    if not db_ok:
        with st.spinner("正在初始化天氣預報資料庫 (SQLite data.db)..."):
            try:
                import database
                database.update_database_from_api()
                db_ok, error_msg = check_database()
            except Exception as e:
                st.error(f"資料庫自動初始化失敗: {e}")
                st.info("💡 提示：請於終端機執行 `python database.py` 自動建立並同步資料庫。")
                return
        if not db_ok:
            st.error(error_msg)
            return

    # 動態從 SQLite 取得地區與日期清單
    regions = get_regions_from_db()
    dates = get_dates_from_db()
    if not regions:
        st.warning("⚠️ 無法從資料庫取得任何地區清單。")
        return
    if not dates:
        st.warning("⚠️ 無法從資料庫取得任何預報日期清單。")
        return

    # 關鍵狀態管理：若有地圖點選或捷徑按鈕觸發的 pending_region，需在 selectbox 建立前設定
    if "pending_region" in st.session_state:
        st.session_state["selected_region"] = st.session_state.pop("pending_region")

    if "selected_region" not in st.session_state or st.session_state["selected_region"] not in regions:
        st.session_state["selected_region"] = "北部地區" if "北部地區" in regions else regions[0]

    if "selected_date" not in st.session_state or st.session_state["selected_date"] not in dates:
        st.session_state["selected_date"] = dates[0]

    # 側邊欄控制：地區與日期選擇下拉選單
    st.sidebar.markdown("### 📍 地區與日期選擇")
    st.sidebar.selectbox(
        "請選擇預報地區 (regionName)：",
        options=regions,
        key="selected_region"
    )
    st.sidebar.selectbox(
        "📅 請選擇預報日期 (dataDate)：",
        options=dates,
        key="selected_date"
    )

    current_region = st.session_state["selected_region"]
    current_date = st.session_state["selected_date"]

    # 側邊欄地圖視覺模式切換
    st.sidebar.markdown("---")
    st.sidebar.markdown("### 🎨 地圖視覺模式")
    map_color_mode = st.sidebar.radio(
        "地圖圓點著色依據：",
        ["🌡️ 依氣溫色階 (MaxT)", "🍃 依空氣品質 (AQI)"],
        index=0,
        help="切換地圖上 28 個地區圓點的著色依據：以預報最高氣溫或即時空氣品質指標著色。"
    )

    # 側邊欄重新整理按鈕
    st.sidebar.markdown("---")
    st.sidebar.markdown("### ⚙️ 資料庫管理")
    if st.sidebar.button("🔄 重新從 CWA 抓取並更新資料庫"):
        with st.spinner("正在執行資料管線更新 SQLite..."):
            try:
                import database
                count = database.update_database_from_api()
                st.sidebar.success(f"成功更新 {count} 筆資料至 SQLite！")
                st.rerun()
            except Exception as e:
                st.sidebar.error(f"更新失敗: {e}")

    # 取得指定預報日期的氣象與即時空氣品質資料
    all_latest = query_all_temps_by_date(current_date)
    from air_quality import fetch_all_air_quality, get_temp_info, get_aqi_info
    all_aq = fetch_all_air_quality()

    # 主畫面佈局：左側互動地圖 (Folium) ＋ 右側 7 天氣溫趨勢圖表
    col_map, col_forecast = st.columns([1, 1], gap="medium")

    with col_map:
        st.markdown(f"### 🗺️ 台灣氣象預報地圖 (📅 {current_date})")
        st.caption(f"💡 目前地圖呈現 **{current_date}** 之氣象預報。點擊地標圓點即可即時切換地區！")

        # 快速分區標籤快捷鈕 (點擊可立即切換)
        st.markdown("**常用分區捷徑：**")
        btn_cols = st.columns(6)
        quick_regions = ["北部地區", "中部地區", "南部地區", "東北部地區", "東部地區", "東南部地區"]
        for idx, q_reg in enumerate(quick_regions):
            if q_reg in regions:
                is_active = (q_reg == current_region)
                label = f"📍 {q_reg[:2]}" if is_active else q_reg[:2]
                if btn_cols[idx].button(label, key=f"quick_btn_{q_reg}"):
                    st.session_state["pending_region"] = q_reg
                    st.rerun()

        # 地圖色階圖例 (Legend) 標籤
        if "氣溫" in map_color_mode:
            st.markdown("""
            <div style="background: white; border: 1px solid #E2E8F0; border-radius: 8px; padding: 6px 10px; margin-bottom: 10px; font-size: 0.78rem; display: flex; flex-wrap: wrap; gap: 5px; align-items: center;">
                <b style="color:#1E3A8A; margin-right:4px;">🌡️ 氣溫圖例：</b>
                <span style="background:#2563EB; color:white; padding:2px 6px; border-radius:4px; font-weight:600;">&lt;16°C 寒冷</span>
                <span style="background:#06B6D4; color:white; padding:2px 6px; border-radius:4px; font-weight:600;">16-20°C 涼爽</span>
                <span style="background:#10B981; color:white; padding:2px 6px; border-radius:4px; font-weight:600;">20-24°C 舒適</span>
                <span style="background:#EAB308; color:black; padding:2px 6px; border-radius:4px; font-weight:600;">24-28°C 溫和</span>
                <span style="background:#F97316; color:white; padding:2px 6px; border-radius:4px; font-weight:600;">28-32°C 炎熱</span>
                <span style="background:#EF4444; color:white; padding:2px 6px; border-radius:4px; font-weight:600;">&ge;32°C 酷熱</span>
            </div>
            """, unsafe_allow_html=True)
        else:
            st.markdown("""
            <div style="background: white; border: 1px solid #E2E8F0; border-radius: 8px; padding: 6px 10px; margin-bottom: 10px; font-size: 0.78rem; display: flex; flex-wrap: wrap; gap: 5px; align-items: center;">
                <b style="color:#1E3A8A; margin-right:4px;">🍃 空品圖例 (AQI)：</b>
                <span style="background:#10B981; color:white; padding:2px 6px; border-radius:4px; font-weight:600;">0-50 良好</span>
                <span style="background:#EAB308; color:black; padding:2px 6px; border-radius:4px; font-weight:600;">51-100 普通</span>
                <span style="background:#F97316; color:white; padding:2px 6px; border-radius:4px; font-weight:600;">101-150 敏感族群不健康</span>
                <span style="background:#EF4444; color:white; padding:2px 6px; border-radius:4px; font-weight:600;">151-200 不健康</span>
                <span style="background:#8B5CF6; color:white; padding:2px 6px; border-radius:4px; font-weight:600;">201-300 非常不健康</span>
                <span style="background:#881337; color:white; padding:2px 6px; border-radius:4px; font-weight:600;">300+ 危害</span>
            </div>
            """, unsafe_allow_html=True)

        # 建立 Folium 地圖，中心對準台灣本島 (使用穩定之 OpenStreetMap 圖資)
        m = folium.Map(
            location=[23.8, 121.0],
            zoom_start=7,
            tiles="OpenStreetMap"
        )

        # 在地圖上放置所有支援地區的標記
        for r_name, coords in REGION_COORDINATES.items():
            if r_name not in regions:
                continue

            is_selected = (r_name == current_region)
            temp_info = all_latest.get(r_name, {})
            min_t = temp_info.get("minT", "--")
            max_t = temp_info.get("maxT", "--")

            t_stat = get_temp_info(max_t)
            aq_info = all_aq.get(r_name, get_aqi_info(50))

            # 根據當前選擇之視覺模式決定圓點填色
            if "氣溫" in map_color_mode:
                marker_color = t_stat["color"]
            else:
                marker_color = aq_info["color"]

            # 彈出視窗內容 (整合預報日期、氣溫與即時空氣品質)
            popup_html = f"""
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; min-width: 175px;">
                <h4 style="margin: 0 0 4px 0; color: #1E3A8A; font-size: 15px;">{r_name}</h4>
                <p style="margin: 0 0 6px 0; color: #64748B; font-size: 11px; border-bottom: 1px solid #E2E8F0; padding-bottom: 4px;">📅 預報日期：<b>{current_date}</b></p>
                <p style="margin: 3px 0; font-size: 13px;"><b>🌡️ 氣溫：</b><span style="color:#0284C7;">{min_t}°C</span> ~ <span style="color:#EA580C; font-weight:700;">{max_t}°C</span> <span style="background:{t_stat['bg']}; color:{t_stat['color']}; padding:1px 5px; border-radius:4px; font-size:11px; font-weight:700;">{t_stat['category']}</span></p>
                <p style="margin: 3px 0; font-size: 13px;"><b>🍃 空品：</b><span style="font-weight:700;">AQI {aq_info['aqi']}</span> <span style="background:{aq_info['bg']}; color:{aq_info['color']}; padding:1px 5px; border-radius:4px; font-size:11px; font-weight:700;">{aq_info['status']}</span></p>
                <p style="margin: 3px 0; font-size: 12px; color:#64748B;">PM2.5: {aq_info['pm2_5']} μg/m³ · PM10: {aq_info['pm10']} μg/m³</p>
                <p style="margin: 6px 0 0 0; color: #2563EB; font-size: 11px; font-weight:600;">(點選更新右側預報與空氣品質)</p>
            </div>
            """

            # 圓點標記樣式：被選中時放大並具外光環
            radius_size = 14 if is_selected else 9
            border_color = "#0F172A" if is_selected else "#FFFFFF"
            weight_size = 3 if is_selected else 2

            if is_selected:
                # 選取狀態的外圈鎖定環
                folium.CircleMarker(
                    location=coords,
                    radius=20,
                    color="#2563EB",
                    weight=2.5,
                    fill=False,
                    opacity=0.85
                ).add_to(m)

            folium.CircleMarker(
                location=coords,
                radius=radius_size,
                color=border_color,
                weight=weight_size,
                fill=True,
                fill_color=marker_color,
                fill_opacity=0.92,
                tooltip=f"{r_name} ({current_date}) | 🌡️ {max_t}°C ({t_stat['category']}) | 🍃 AQI {aq_info['aqi']} ({aq_info['status']})",
                popup=folium.Popup(popup_html, max_width=240)
            ).add_to(m)

        # 渲染 Folium 地圖並監聽點擊事件
        map_data = st_folium(
            m,
            width=550,
            height=470,
            key=f"taiwan_folium_{current_region}_{map_color_mode}",
            returned_objects=[
                "last_object_clicked",
                "last_object_clicked_tooltip",
                "last_object_clicked_popup",
                "last_clicked"
            ]
        )

        # 綜合多層級點擊事件判定 (精確比對 Tooltip / Popup / 點擊經緯度)
        clicked_region = None
        if map_data:
            # 1. 檢查 Tooltip
            raw_tooltip = map_data.get("last_object_clicked_tooltip")
            if raw_tooltip:
                clean_tip = str(raw_tooltip).strip()
                if clean_tip in regions:
                    clicked_region = clean_tip
                else:
                    for r in regions:
                        if r in clean_tip:
                            clicked_region = r
                            break

            # 2. 檢查 Popup 內容
            if not clicked_region and map_data.get("last_object_clicked_popup"):
                raw_pop = str(map_data["last_object_clicked_popup"])
                for r in regions:
                    if f">{r}<" in raw_pop:
                        clicked_region = r
                        break
                if not clicked_region:
                    for r in regions:
                        if r in raw_pop:
                            clicked_region = r
                            break

            # 3. 檢查點選物件的經緯度座標
            if not clicked_region and map_data.get("last_object_clicked"):
                loc = map_data["last_object_clicked"]
                if isinstance(loc, dict) and "lat" in loc and "lng" in loc:
                    clicked_region = find_closest_region(loc["lat"], loc["lng"])

            # 4. 檢查點選地圖的經緯度座標
            if not clicked_region and map_data.get("last_clicked"):
                loc = map_data["last_clicked"]
                if isinstance(loc, dict) and "lat" in loc and "lng" in loc:
                    clicked_region = find_closest_region(loc["lat"], loc["lng"])

        # 若成功識別點擊地區且與當前不同，使用 pending_region 觸發狀態更新並重新執行
        if clicked_region and clicked_region in regions and clicked_region != current_region:
            st.session_state["pending_region"] = clicked_region
            st.rerun()

    with col_forecast:
        # 4. 根據當前選擇地區從 SQLite 查詢未來 7 天資料
        df = query_forecasts_from_db(current_region)

        if df.empty:
            st.warning(f"查無 【{current_region}】 的預報資料。")
        else:
            st.markdown(f"### 📍 【{current_region}】未來一週氣溫與空氣品質")

            # 所選預報日期之氣溫指標卡
            matching_rows = df[df["dataDate"] == current_date]
            target_row = matching_rows.iloc[0] if not matching_rows.empty else df.iloc[0]

            m1, m2, m3 = st.columns(3)
            m1.metric("預報日期", target_row["dataDate"])
            m1_t = target_row["minT"]
            m2_t = target_row["maxT"]
            t_curr = get_temp_info(m2_t)
            m2.metric("最低氣溫 (MinT)", f"{m1_t} °C")
            m3.metric("最高氣溫 (MaxT)", f"{m2_t} °C", f"{t_curr['category']}")

            # 即時空氣品質指標區塊 (AQI, PM2.5, PM10)
            curr_aq = all_aq.get(current_region, get_aqi_info(50))
            st.markdown("<div style='margin-top: 14px;'></div>", unsafe_allow_html=True)
            st.markdown("#### 🍃 即時空氣品質監測 (Air Quality)")

            aq1, aq2, aq3, aq4 = st.columns(4)
            aq1.metric("空氣指標 (AQI)", f"{curr_aq['aqi']}", f"{curr_aq['status']}")
            aq2.metric("品質狀態", f"{curr_aq['icon']} {curr_aq['status']}")
            aq3.metric("細懸浮微粒 (PM2.5)", f"{curr_aq['pm2_5']} μg/m³")
            aq4.metric("懸浮微粒 (PM10)", f"{curr_aq['pm10']} μg/m³")

            # 健康防護建議提示條
            st.markdown(
                f"""
                <div style="background:{curr_aq['bg']}; border-left: 4px solid {curr_aq['color']}; padding: 10px 14px; border-radius: 8px; margin-top: 6px; margin-bottom: 18px;">
                    <span style="font-size: 1.15rem; vertical-align: middle;">{curr_aq['icon']}</span>
                    <strong style="color: #0F172A; margin-left: 6px;">健康防護提示：</strong>
                    <span style="color: #334155; font-size: 0.92rem;">{curr_aq['tip']}</span>
                </div>
                """,
                unsafe_allow_html=True
            )

            # 5. 最高 / 最低溫雙曲線折線圖 (X 軸: dataDate, Y 軸: temperature °C, 兩條線: MaxT, MinT)
            st.markdown("#### 📈 氣溫折線圖 (MaxT / MinT)")

            # 長表格格式供 Altair 繪製雙軌平滑曲線
            melted_df = df.melt(
                id_vars=["dataDate"],
                value_vars=["maxT", "minT"],
                var_name="指標",
                value_name="temperature"
            )
            melted_df["氣溫指標"] = melted_df["指標"].map({
                "maxT": "最高溫 MaxT (°C)",
                "minT": "最低溫 MinT (°C)"
            })

            y_min = int(df["minT"].min() - 2)
            y_max = int(df["maxT"].max() + 2)

            chart = (
                alt.Chart(melted_df)
                .mark_line(point=alt.OverlayMarkDef(filled=True, size=55), strokeWidth=3)
                .encode(
                    x=alt.X("dataDate:N", title="預報日期 (dataDate)", axis=alt.Axis(labelAngle=-25)),
                    y=alt.Y("temperature:Q", title="氣溫 (temperature °C)", scale=alt.Scale(domain=[y_min, y_max])),
                    color=alt.Color(
                        "氣溫指標:N",
                        title="要素",
                        scale=alt.Scale(
                            domain=["最高溫 MaxT (°C)", "最低溫 MinT (°C)"],
                            range=["#F97316", "#0284C7"]  # 暖橙與蔚藍對比
                        )
                    ),
                    tooltip=[
                        alt.Tooltip("dataDate:N", title="日期"),
                        alt.Tooltip("氣溫指標:N", title="要素"),
                        alt.Tooltip("temperature:Q", title="氣溫 (°C)", format=".1f")
                    ]
                )
                .properties(height=320)
                .interactive()
            )

            st.altair_chart(chart, use_container_width=True)

            # 6. 一週預報資料表 (Date, MinT, MaxT)
            st.markdown("#### 📋 一週預報資料表")
            display_table = df[["dataDate", "minT", "maxT"]].copy()
            display_table.columns = ["Date", "MinT (°C)", "MaxT (°C)"]
            
            st.dataframe(
                display_table,
                use_container_width=True,
                hide_index=True
            )

    # 頁尾
    st.markdown("---")
    st.caption("資料來源：交通部中央氣象署 (CWA) 開放資料平臺 · SQLite data.db / TemperatureForecasts")


if __name__ == "__main__":
    main()
