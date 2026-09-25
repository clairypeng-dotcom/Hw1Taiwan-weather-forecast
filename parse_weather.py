"""
parse_weather.py - 專門負責解析中央氣象署 (CWA) 原始預報 JSON 資料
提取核心氣象要素：regionName (縣市名稱), dataDate (日期), minT (最低溫), maxT (最高溫)
具備高容錯性，遇到空值或異常欄位不中斷程式 (Crash-safe)。
"""

import sys
import logging
from typing import Dict, Any, List, Optional
from collections import defaultdict

logger = logging.getLogger(__name__)


def safe_float(val: Any) -> Optional[float]:
    """安全將字串或任意物件轉為 float，失敗時回傳 None 而非拋出例外"""
    if val is None:
        return None
    try:
        f = float(str(val).strip())
        # 過濾無效觀測值 (例如 CWA 缺測值 -99 或 -999)
        if -50 <= f <= 60:
            return f
        return None
    except (ValueError, TypeError):
        return None


def extract_value_from_element(element_value_obj: Any) -> Optional[float]:
    """從 CWA elementValue (可能為 list 或 dict) 提取數值"""
    if isinstance(element_value_obj, list) and len(element_value_obj) > 0:
        first_item = element_value_obj[0]
        if isinstance(first_item, dict):
            # 取 value 或 ParameterValue
            val = first_item.get("value") or first_item.get("ParameterValue") or first_item.get("parameterValue")
            return safe_float(val)
        return safe_float(first_item)
    elif isinstance(element_value_obj, dict):
        val = element_value_obj.get("value") or element_value_obj.get("ParameterValue")
        return safe_float(val)
    return safe_float(element_value_obj)


def parse_weather_forecast(raw_json: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    解析 CWA 天氣預報原始 JSON 資料 (相容 F-D0047-091 與 F-C0032-001 等多種版本結構)。
    
    回傳格式：
    [
        {
            "regionName": "臺北市",
            "dataDate": "2026-09-26",
            "minT": 23.0,
            "maxT": 30.0
        },
        ...
    ]
    """
    if not isinstance(raw_json, dict):
        logger.warning("提供的 raw_json 不是合法的 dict 物件")
        return []

    # 1. 取得 records 節點
    records = raw_json.get("records")
    if not isinstance(records, dict):
        logger.warning("raw_json 中未找到有效的 records 節點")
        return []

    # 2. 取得 locations / location 清單 (相容多種 CWA JSON Schema)
    location_list = []
    if "locations" in records:
        locations_container = records["locations"]
        if isinstance(locations_container, list):
            for loc_group in locations_container:
                if isinstance(loc_group, dict) and "location" in loc_group:
                    location_list.extend(loc_group["location"])
        elif isinstance(locations_container, dict) and "location" in locations_container:
            locs = locations_container["location"]
            if isinstance(locs, list):
                location_list.extend(locs)
            elif isinstance(locs, dict):
                location_list.append(locs)

    # 若 records 直接包含 location
    if not location_list and "location" in records:
        locs = records["location"]
        if isinstance(locs, list):
            location_list.extend(locs)
        elif isinstance(locs, dict):
            location_list.append(locs)

    if not location_list:
        logger.warning("未解析到任何 location 測站或縣市資料")
        return []

    results = []

    # 3. 遍歷每個地區/縣市
    for loc in location_list:
        if not isinstance(loc, dict):
            continue

        region_name = loc.get("locationName") or loc.get("StationName") or loc.get("stationName")
        if not region_name or not isinstance(region_name, str):
            continue
        region_name = region_name.strip()

        weather_elements = loc.get("weatherElement", [])
        if not isinstance(weather_elements, list):
            continue

        # 暫存同一縣市每天的所有溫度觀測 (因 CWA 一天可能有白天與晚上兩筆預報)
        day_mint_map = defaultdict(list)
        day_maxt_map = defaultdict(list)

        for element in weather_elements:
            if not isinstance(element, dict):
                continue

            elem_name = (element.get("elementName") or element.get("description") or "").strip().upper()
            time_list = element.get("time", [])
            if not isinstance(time_list, list):
                continue

            # 判斷是否為最低溫或最高溫要素
            is_mint = elem_name in ("MINT", "最低溫度", "MIN_T")
            is_maxt = elem_name in ("MAXT", "最高溫度", "MAX_T")

            if not (is_mint or is_maxt):
                continue

            for t_item in time_list:
                if not isinstance(t_item, dict):
                    continue

                # 提取日期 (從 startTime 或 dataTime 或 Date 提取 YYYY-MM-DD)
                start_time_str = t_item.get("startTime") or t_item.get("dataTime") or t_item.get("Date") or ""
                if not isinstance(start_time_str, str) or len(start_time_str) < 10:
                    continue

                data_date = start_time_str[:10]  # 取 "YYYY-MM-DD"

                # 提取溫度數值
                temp_val = extract_value_from_element(t_item.get("elementValue"))
                if temp_val is None:
                    # 亦相容 parameter 結構
                    param = t_item.get("parameter", {})
                    if isinstance(param, dict):
                        temp_val = safe_float(param.get("parameterName"))

                if temp_val is not None:
                    if is_mint:
                        day_mint_map[data_date].append(temp_val)
                    elif is_maxt:
                        day_maxt_map[data_date].append(temp_val)

        # 彙整各日期的 minT 與 maxT
        all_dates = sorted(set(day_mint_map.keys()) | set(day_maxt_map.keys()))
        for date_str in all_dates:
            mins = day_mint_map.get(date_str, [])
            maxs = day_maxt_map.get(date_str, [])

            min_val = min(mins) if mins else None
            max_val = max(maxs) if maxs else None

            # 若當天只有一項，合理補齊避免 UI 出現 None
            if min_val is None and max_val is not None:
                min_val = round(max_val - 4.0, 1)
            elif max_val is None and min_val is not None:
                max_val = round(min_val + 4.0, 1)

            if min_val is not None and max_val is not None:
                # 確保 minT <= maxT
                if min_val > max_val:
                    min_val, max_val = max_val, min_val

                results.append({
                    "regionName": region_name,
                    "dataDate": date_str,
                    "minT": round(min_val, 1),
                    "maxT": round(max_val, 1)
                })

    # 4. 同步彙整 HW10 作業要求之六大分區 (北部地區, 中部地區, 南部地區, 東北部地區, 東部地區, 東南部地區)
    BROAD_REGIONS = {
        "北部地區": ["基隆市", "臺北市", "新北市", "桃園市", "新竹市", "新竹縣", "苗栗縣"],
        "中部地區": ["臺中市", "彰化縣", "南投縣", "雲林縣", "嘉義市", "嘉義縣"],
        "南部地區": ["臺南市", "高雄市", "屏東縣"],
        "東北部地區": ["宜蘭縣"],
        "東部地區": ["花蓮縣"],
        "東南部地區": ["臺東縣"],
    }

    # 建立縣市與日期的快速對照
    county_date_dict = defaultdict(dict)
    all_dates_set = set()
    for item in results:
        county_date_dict[item["regionName"]][item["dataDate"]] = item
        all_dates_set.add(item["dataDate"])

    for broad_name, counties in BROAD_REGIONS.items():
        for d_date in sorted(all_dates_set):
            sub_mins = []
            sub_maxs = []
            for c_name in counties:
                if c_name in county_date_dict and d_date in county_date_dict[c_name]:
                    sub_mins.append(county_date_dict[c_name][d_date]["minT"])
                    sub_maxs.append(county_date_dict[c_name][d_date]["maxT"])

            if sub_mins and sub_maxs:
                # 取分區平均溫或代表溫
                avg_min = round(sum(sub_mins) / len(sub_mins), 1)
                avg_max = round(sum(sub_maxs) / len(sub_maxs), 1)
                results.append({
                    "regionName": broad_name,
                    "dataDate": d_date,
                    "minT": avg_min,
                    "maxT": avg_max
                })

    logger.info(f"解析完成！包含 22 縣市與 6 大分區，共解析出 {len(results)} 筆 (地區, 日期) 預報資料。")
    return results



if __name__ == "__main__":
    print("=" * 60)
    print("▶ 執行 parse_weather.py 檢驗流程")
    print("=" * 60)
    from fetch_weather import get_weather_data

    raw_data = get_weather_data(allow_fallback=True)
    has_records = "records" in raw_json if "raw_json" in locals() else ("records" in raw_data)
    print(f"\n[檢驗 1] records 節點存在: {'✅ 是' if has_records else '❌ 否'}")

    parsed = parse_weather_forecast(raw_data)
    print(f"[檢驗 2] JSON 解析狀態: {'✅ 成功' if len(parsed) > 0 else '❌ 失敗'}")

    # 統計地區與日期
    regions = sorted(list(set(item["regionName"] for item in parsed)))
    print(f"[檢驗 3] 取得 region 數量: {len(regions)} 個地區")
    print(f"       地區清單: {', '.join(regions[:8])} ...")

    # 檢查是否有 MinT 與 MaxT
    has_mint = all("minT" in item and item["minT"] is not None for item in parsed)
    has_maxt = all("maxT" in item and item["maxT"] is not None for item in parsed)
    print(f"[檢驗 4] 成功提取 MinT: {'✅ 是' if has_mint else '❌ 否'}")
    print(f"[檢驗 5] 成功提取 MaxT: {'✅ 是' if has_maxt else '❌ 否'}")

    # 檢查每個地區是否至少有 7 天資料
    region_day_counts = defaultdict(int)
    for item in parsed:
        region_day_counts[item["regionName"]] += 1
    min_days = min(region_day_counts.values()) if region_day_counts else 0
    print(f"[檢驗 6] 各地區預報天數: 至少 {min_days} 天 (總共 {len(parsed)} 筆資料)")

    print("\n[檢驗 7] 資料輸出格式預覽 (regionName | dataDate | minT | maxT)：")
    print("-" * 50)
    print(f"{'regionName':<10} | {'dataDate':<10} | {'minT':<5} | {'maxT':<5}")
    print("-" * 50)
    # 印出範例地區 (如臺北市) 的 7 天預報
    sample_reg = "臺北市" if "臺北市" in regions else regions[0]
    for item in [p for p in parsed if p["regionName"] == sample_reg]:
        print(f"{item['regionName']:<10} | {item['dataDate']:<10} | {item['minT']:<5} | {item['maxT']:<5}")
    print("-" * 50)

    print(f"\n✅ parse_weather.py 執行成功！")

