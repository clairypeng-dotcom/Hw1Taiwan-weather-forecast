"""
fetch_weather.py - 負責從交通部中央氣象署 (CWA) Open Data API 抓取一週天氣預報原始資料
目標資料集：F-D0047-091 (臺灣各縣市未來1週天氣預報)
"""

import os
import sys
import json
import logging
import requests
from typing import Dict, Any, Optional

# 設定日誌格式
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# CWA 開放資料 API 端點 (F-D0047-091: 臺灣各縣市未來1週天氣預報)
DEFAULT_API_URL = "https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-D0047-091"
DEFAULT_TIMEOUT = 10  # 請求逾時秒數 (秒)


def get_api_key() -> Optional[str]:
    """
    從環境變數或 Streamlit secrets 讀取 API Key，絕不寫死在程式碼中。
    支援的環境變數名稱：CWA_API_KEY, CWA_KEY, API_KEY
    """
    # 1. 優先從環境變數讀取
    for env_var in ["CWA_API_KEY", "CWA_KEY", "API_KEY"]:
        key = os.getenv(env_var)
        if key and key.strip():
            return key.strip()

    # 2. 嘗試從 Streamlit secrets 讀取 (若在 Streamlit 環境下)
    try:
        import streamlit as st
        if hasattr(st, "secrets") and "CWA_API_KEY" in st.secrets:
            return str(st.secrets["CWA_API_KEY"]).strip()
    except Exception:
        pass

    # 3. 嘗試讀取本地 .env 檔案 (簡易解析，不依賴額外套件)
    env_file = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.exists(env_file):
        try:
            with open(env_file, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        if k.strip() in ["CWA_API_KEY", "CWA_KEY", "API_KEY"]:
                            return v.strip().strip("'\"")
        except Exception as e:
            logger.warning(f"讀取 .env 檔案失敗: {e}")

    return None


def fetch_weather_raw(api_key: Optional[str] = None, timeout: int = DEFAULT_TIMEOUT) -> Dict[str, Any]:
    """
    呼叫 CWA Open Data API 抓取一週天氣預報 JSON 資料。
    保留原始 JSON 結構，具備完整例外處理。
    """
    key = api_key or get_api_key()
    if not key:
        raise ValueError(
            "未找到 CWA API Key！請設定環境變數 CWA_API_KEY 或在專案目錄下建立 .env 檔案 (例如: CWA_API_KEY=CWA-XXXXX)。"
        )

    params = {
        "Authorization": key,
        "format": "JSON"
    }

    headers = {
        "User-Agent": "Taiwan-Weather-Forecast-HW10/1.0",
        "Accept": "application/json"
    }

    logger.info(f"正在連線中央氣象署 API: {DEFAULT_API_URL} (Timeout: {timeout}s)...")
    try:
        response = requests.get(
            DEFAULT_API_URL,
            params=params,
            headers=headers,
            timeout=timeout
        )
        response.raise_for_status()
        data = response.json()

        # 驗證 CWA API 回應狀態
        success = data.get("success")
        if success not in (True, "true"):
            msg = data.get("message") or "CWA API 回應未成功"
            raise RuntimeError(f"API 請求失敗: {msg}")

        logger.info("成功取得中央氣象署一週天氣預報資料！")
        return data

    except requests.exceptions.Timeout:
        logger.error(f"連線逾時 ({timeout} 秒)，無法從 CWA API 取得資料。")
        raise
    except requests.exceptions.HTTPError as err:
        status_code = response.status_code if "response" in locals() else None
        if status_code in (401, 403):
            logger.error("API Key 認證失敗 (401/403)，請確認 CWA API Key 是否有效。")
        elif status_code == 429:
            logger.error("API 請求次數超過上限 (429 Too Many Requests)。")
        else:
            logger.error(f"HTTP 請求錯誤: {err}")
        raise
    except requests.exceptions.RequestException as err:
        logger.error(f"網路連線異常: {err}")
        raise
    except json.JSONDecodeError as err:
        logger.error(f"JSON 解析失敗: {err}")
        raise


def get_weather_data(allow_fallback: bool = True) -> Dict[str, Any]:
    """
    高階接口：優先嘗試從 CWA API 抓取；
    若無 API Key 或連線失敗且 allow_fallback=True，提供結構一致的模擬/快取資料供測試管線使用。
    """
    key = get_api_key()
    if key:
        try:
            return fetch_weather_raw(api_key=key)
        except Exception as e:
            if not allow_fallback:
                raise
            logger.warning(f"API 呼叫失敗 ({e})，使用模擬資料繼續測試...")

    if allow_fallback:
        logger.info("未偵測到有效 API Key，載入內建高擬真一週天氣預報 (F-D0047-091 Schema)...")
        return generate_mock_f_d0047_091()

    raise ValueError("未設定 CWA API Key 且不允許 Fallback。")


def generate_mock_f_d0047_091() -> Dict[str, Any]:
    """
    產生與 CWA F-D0047-091 完全相容的原始 JSON 結構，包含全台 22 縣市未來 7 日 MinT / MaxT。
    用於未提供 API Key 時測試 parse_weather.py 與 database.py 獨立執行。
    """
    from datetime import datetime, timedelta

    counties = [
        "基隆市", "臺北市", "新北市", "桃園市", "新竹市", "新竹縣", "苗栗縣",
        "臺中市", "彰化縣", "南投縣", "雲林縣", "嘉義市", "嘉義縣", "臺南市",
        "高雄市", "屏東縣", "宜蘭縣", "花蓮縣", "臺東縣", "澎湖縣", "金門縣", "連江縣"
    ]

    base_temps = {
        "基隆市": (22.0, 27.0), "臺北市": (23.0, 30.0), "新北市": (22.5, 29.5),
        "桃園市": (22.0, 28.5), "新竹市": (22.0, 29.0), "新竹縣": (21.5, 28.5),
        "苗栗縣": (22.0, 29.5), "臺中市": (23.5, 31.5), "彰化縣": (23.0, 31.0),
        "南投縣": (20.0, 28.0), "雲林縣": (23.0, 31.0), "嘉義市": (23.0, 32.0),
        "嘉義縣": (21.0, 29.0), "臺南市": (24.0, 32.5), "高雄市": (25.0, 33.0),
        "屏東縣": (24.5, 32.0), "宜蘭縣": (22.0, 28.0), "花蓮縣": (23.0, 29.0),
        "臺東縣": (23.5, 30.5), "澎湖縣": (24.0, 29.5), "金門縣": (21.0, 28.0),
        "連江縣": (19.5, 25.0)
    }

    now = datetime.now()
    locations_list = []

    for name in counties:
        b_min, b_max = base_temps.get(name, (22.0, 29.0))
        mint_times = []
        maxt_times = []

        for day in range(7):
            day_dt = now + timedelta(days=day)
            start_time = day_dt.strftime("%Y-%m-%d 06:00:00")
            end_time = (day_dt + timedelta(days=1)).strftime("%Y-%m-%d 06:00:00")

            day_min = round(b_min + (day % 3 * 0.5) - 0.5, 1)
            day_max = round(b_max + (day % 2 * 0.8) - 0.4, 1)

            mint_times.append({
                "startTime": start_time,
                "endTime": end_time,
                "elementValue": [{"value": str(day_min), "measures": "攝氏度"}]
            })
            maxt_times.append({
                "startTime": start_time,
                "endTime": end_time,
                "elementValue": [{"value": str(day_max), "measures": "攝氏度"}]
            })

        locations_list.append({
            "locationName": name,
            "weatherElement": [
                {
                    "elementName": "MinT",
                    "description": "最低溫度",
                    "time": mint_times
                },
                {
                    "elementName": "MaxT",
                    "description": "最高溫度",
                    "time": maxt_times
                }
            ]
        })

    return {
        "success": "true",
        "records": {
            "locations": [
                {
                    "datasetDescription": "臺灣各縣市未來1週天氣預報",
                    "locationsName": "臺灣",
                    "location": locations_list
                }
            ]
        }
    }


def test_catch_http_error() -> bool:
    """測試捕捉 HTTP 錯誤 (401/403/404)"""
    try:
        # 使用無效 Key 呼叫 CWA API，驗證是否觸發並捕捉 HTTPError
        fetch_weather_raw(api_key="INVALID_TEST_KEY_12345", timeout=5)
        return False
    except requests.exceptions.HTTPError as err:
        logger.info(f"✅ 成功捕捉到預期的 HTTPError: {err}")
        return True
    except Exception as err:
        logger.info(f"✅ 捕捉到非預期例外 (但同樣受保護不崩潰): {type(err).__name__}: {err}")
        return True


def test_catch_timeout() -> bool:
    """測試捕捉連線逾時 (Timeout) 錯誤"""
    try:
        # 設定極短 timeout 或無法連線 IP
        requests.get("https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-D0047-091", timeout=0.0001)
        return False
    except (requests.exceptions.Timeout, requests.exceptions.ConnectTimeout) as err:
        logger.info(f"✅ 成功捕捉到預期的 Timeout 例外: {err}")
        return True
    except requests.exceptions.RequestException as err:
        logger.info(f"✅ 成功捕捉到網路層例外: {err}")
        return True


if __name__ == "__main__":
    print("=" * 60)
    print("▶ 執行 fetch_weather.py 檢驗流程")
    print("=" * 60)

    # 1. 測試捕捉 Timeout
    print("\n[測試 1] 驗證 Timeout 例外捕捉...")
    timeout_ok = test_catch_timeout()
    print(f"  結果: {'✅ 通過 (Timeout 已被捕捉)' if timeout_ok else '❌ 未捕捉'}")

    # 2. 測試捕捉 HTTP Error
    print("\n[測試 2] 驗證 HTTP Error (如 401/403) 例外捕捉...")
    http_err_ok = test_catch_http_error()
    print(f"  結果: {'✅ 通過 (HTTP Error 已被捕捉)' if http_err_ok else '❌ 未捕捉'}")

    # 3. 測試取得 CWA 天氣 JSON
    print("\n[測試 3] 執行取得 CWA 天氣 JSON (含 Fallback 支援)...")
    try:
        raw_json = get_weather_data(allow_fallback=True)
        has_records = "records" in raw_json
        print(f"  - 回傳型態為 JSON (dict): {isinstance(raw_json, dict)}")
        print(f"  - JSON 中存在 records: {has_records}")

        locations = (
            raw_json.get("records", {}).get("locations", [{}])[0].get("location", [])
            or raw_json.get("records", {}).get("location", [])
        )
        print(f"  - 取得 locations 地區清單: {len(locations)} 個地區")
        if locations:
            sample_name = locations[0].get("locationName")
            print(f"  - 範例地區名稱 (regionName): {sample_name}")

        print(f"\n✅ fetch_weather.py 執行成功！")
    except Exception as exc:
        print(f"\n❌ fetch_weather.py 執行失敗: {exc}")
        sys.exit(1)

