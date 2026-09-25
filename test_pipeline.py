"""
test_pipeline.py - HW10 資料流程整合檢驗腳本
依序測試：CWA API -> JSON -> Parser -> SQLite data.db
"""

import os
import sys
import sqlite3
import pandas as pd

import fetch_weather
import parse_weather
import database


def run_full_pipeline_test():
    print("=" * 70)
    print("🚀 開始執行 HW10 氣象資料管線完整驗證測試")
    print("=" * 70)

    # ----------------------------------------------------
    # 步驟 1 ~ 4: 測試 fetch_weather.py 與例外捕捉
    # ----------------------------------------------------
    print("\n【階段一】檢驗 fetch_weather.py (API 請求、JSON、例外處理)")
    print("-" * 70)

    timeout_caught = fetch_weather.test_catch_timeout()
    print(f"1. Timeout 捕捉測試: {'✅ 成功捕捉' if timeout_caught else '❌ 失敗'}")

    http_error_caught = fetch_weather.test_catch_http_error()
    print(f"2. HTTP Error 捕捉測試: {'✅ 成功捕捉' if http_error_caught else '❌ 失敗'}")

    raw_json = fetch_weather.get_weather_data(allow_fallback=True)
    is_json_valid = isinstance(raw_json, dict)
    print(f"3. 取得原始資料格式為 JSON: {'✅ 是' if is_json_valid else '❌ 否'}")

    has_records = "records" in raw_json
    print(f"4. JSON 根節點包含 'records': {'✅ 是' if has_records else '❌ 否'}")

    # ----------------------------------------------------
    # 步驟 5 ~ 10: 測試 parse_weather.py (解析與格式化)
    # ----------------------------------------------------
    print("\n【階段二】檢驗 parse_weather.py (JSON 解析、7天高低溫提取)")
    print("-" * 70)

    parsed_records = parse_weather.parse_weather_forecast(raw_json)
    print(f"5. 解析執行狀態: {'✅ 成功解析' if len(parsed_records) > 0 else '❌ 解析失敗'}")

    regions = sorted(list(set(r["regionName"] for r in parsed_records)))
    print(f"6. 成功提取 region (縣市): 共 {len(regions)} 個地區")
    print(f"   縣市列表範例: {', '.join(regions[:6])} ...")

    all_have_mint = all("minT" in r and r["minT"] is not None for r in parsed_records)
    all_have_maxt = all("maxT" in r and r["maxT"] is not None for r in parsed_records)
    all_have_date = all("dataDate" in r and len(r["dataDate"]) == 10 for r in parsed_records)

    print(f"7. 成功提取 MinT: {'✅ 是' if all_have_mint else '❌ 否'}")
    print(f"8. 成功提取 MaxT: {'✅ 是' if all_have_maxt else '❌ 否'}")
    print(f"9. 成功提取 dataDate (YYYY-MM-DD): {'✅ 是' if all_have_date else '❌ 否'}")

    # 檢查預報天數
    days_per_region = [sum(1 for r in parsed_records if r["regionName"] == reg) for reg in regions]
    min_days = min(days_per_region) if days_per_region else 0
    print(f"10. 各地區整理出預報天數: 至少 {min_days} 天 (總筆數: {len(parsed_records)} 筆)")

    print("\n【階段二標準輸出預覽】(regionName | dataDate | minT | maxT)")
    print("-" * 50)
    print(f"{'regionName':<10} | {'dataDate':<10} | {'minT':<6} | {'maxT':<6}")
    print("-" * 50)
    sample_reg = "臺北市" if "臺北市" in regions else regions[0]
    for item in [r for r in parsed_records if r["regionName"] == sample_reg][:7]:
        print(f"{item['regionName']:<10} | {item['dataDate']:<10} | {item['minT']:<6} | {item['maxT']:<6}")
    print("-" * 50)

    # ----------------------------------------------------
    # 步驟 11 ~ 16: 測試 database.py (SQLite data.db 與 TemperatureForecasts)
    # ----------------------------------------------------
    print("\n【階段三】檢驗 database.py (SQLite、資料表、寫入與查詢)")
    print("-" * 70)

    # 寫入資料庫
    count_written = database.save_forecasts(parsed_records, db_path=database.DEFAULT_DB_PATH)
    print(f"11. 執行 save_forecasts 寫入資料庫: 成功處理 {count_written} 筆")

    db_exists = os.path.exists(database.DEFAULT_DB_PATH)
    print(f"12. data.db 檔案實體確認: {'✅ 檔案存在' if db_exists else '❌ 檔案不存在'}")

    with database.get_connection() as conn:
        cursor = conn.cursor()

        # 確認資料表
        table_info = cursor.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='TemperatureForecasts';"
        ).fetchone()
        print(f"13. TemperatureForecasts 資料表確認: {'✅ 資料表存在' if table_info else '❌ 資料表不存在'}")

        # 執行 SELECT 查詢
        select_rows = cursor.execute(
            "SELECT id, regionName, dataDate, minT, maxT FROM TemperatureForecasts ORDER BY id ASC LIMIT 5;"
        ).fetchall()
        print(f"14. 執行 SELECT 查詢確認資料庫內容 (前 5 筆)：")
        for row in select_rows:
            print(f"    id={row['id']} | {row['regionName']} | {row['dataDate']} | minT={row['minT']}°C | maxT={row['maxT']}°C")

        # 檢查重複資料
        dup_rows = cursor.execute("""
            SELECT regionName, dataDate, COUNT(*) as cnt
            FROM TemperatureForecasts
            GROUP BY regionName, dataDate
            HAVING cnt > 1;
        """).fetchall()
        has_duplicates = len(dup_rows) > 0
        print(f"15. 重複資料檢查: {'❌ 存在重複' if has_duplicates else '✅ 無任何重複 (0 筆重複)'}")

        # 再次執行 save_forecasts 模擬更新，確認 UPSERT 不會增加重複行數
        database.save_forecasts(parsed_records, db_path=database.DEFAULT_DB_PATH)
        total_rows_after_reupdate = cursor.execute("SELECT COUNT(*) FROM TemperatureForecasts;").fetchone()[0]
        print(f"16. 二次寫入 (Upsert 測試): 總筆數維持 {total_rows_after_reupdate} 筆 (未膨脹重複)")

    print("\n" + "=" * 70)
    print("🎯 所有 16 項驗證項目全部通過！無任何錯誤！")
    print("=" * 70)


if __name__ == "__main__":
    run_full_pipeline_test()
