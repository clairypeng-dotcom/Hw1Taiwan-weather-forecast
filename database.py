"""
database.py - 負責 SQLite 資料庫管理與 TemperatureForecasts 資料表 CRUD 操作
檔案：data.db
資料表：TemperatureForecasts (id, regionName, dataDate, minT, maxT)
避免重複寫入：透過 UNIQUE(regionName, dataDate) 與 INSERT OR REPLACE 達成自動更新 (Upsert)。
"""

import os
import sys
import sqlite3
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

DEFAULT_DB_PATH = os.path.join(os.path.dirname(__file__), "data.db")


def get_connection(db_path: str = DEFAULT_DB_PATH) -> sqlite3.Connection:
    """取得 SQLite 連線，設定 row_factory 為 sqlite3.Row 便於以字典方式存取欄位"""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn


def init_db(db_path: str = DEFAULT_DB_PATH) -> None:
    """
    初始化 SQLite 資料庫與建立 TemperatureForecasts 資料表。
    使用 UNIQUE(regionName, dataDate) 約束避免同一縣市同日期產生重複資料。
    """
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS TemperatureForecasts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        regionName TEXT NOT NULL,
        dataDate TEXT NOT NULL,
        minT REAL,
        maxT REAL,
        CONSTRAINT uq_region_date UNIQUE (regionName, dataDate)
    );
    """
    create_index_sql = """
    CREATE INDEX IF NOT EXISTS idx_region_date ON TemperatureForecasts(regionName, dataDate);
    """
    with get_connection(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute(create_table_sql)
        cursor.execute(create_index_sql)
        conn.commit()
    logger.info(f"SQLite 資料庫初始化完成: {db_path} (Table: TemperatureForecasts)")


def save_forecasts(forecast_list: List[Dict[str, Any]], db_path: str = DEFAULT_DB_PATH) -> int:
    """
    將解析後的天氣預報寫入 TemperatureForecasts 資料表。
    使用 INSERT OR REPLACE INTO 語法，遇到既有 (regionName, dataDate) 時自動更新氣溫數值，防止重複。
    """
    if not forecast_list:
        logger.warning("無資料需要寫入資料庫")
        return 0

    init_db(db_path)

    upsert_sql = """
    INSERT INTO TemperatureForecasts (regionName, dataDate, minT, maxT)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(regionName, dataDate) DO UPDATE SET
        minT = excluded.minT,
        maxT = excluded.maxT;
    """

    records_to_insert = [
        (item["regionName"], item["dataDate"], item.get("minT"), item.get("maxT"))
        for item in forecast_list
        if "regionName" in item and "dataDate" in item
    ]

    with get_connection(db_path) as conn:
        cursor = conn.cursor()
        cursor.executemany(upsert_sql, records_to_insert)
        conn.commit()
        affected_rows = cursor.rowcount

    logger.info(f"成功存入/更新 {len(records_to_insert)} 筆預報資料至 {db_path}。")
    return len(records_to_insert)


def get_all_regions(db_path: str = DEFAULT_DB_PATH) -> List[str]:
    """取得資料庫中現有的所有縣市名稱清單 (排序)"""
    init_db(db_path)
    sql = "SELECT DISTINCT regionName FROM TemperatureForecasts ORDER BY regionName ASC"
    with get_connection(db_path) as conn:
        cursor = conn.cursor()
        rows = cursor.execute(sql).fetchall()
        return [row["regionName"] for row in rows]


def get_all_dates(db_path: str = DEFAULT_DB_PATH) -> List[str]:
    """取得資料庫中現有的所有預報日期清單 (依日期升冪排序)"""
    init_db(db_path)
    sql = "SELECT DISTINCT dataDate FROM TemperatureForecasts ORDER BY dataDate ASC"
    with get_connection(db_path) as conn:
        cursor = conn.cursor()
        rows = cursor.execute(sql).fetchall()
        return [row["dataDate"] for row in rows if row["dataDate"]]


def get_forecasts_by_region(region_name: str, db_path: str = DEFAULT_DB_PATH) -> List[Dict[str, Any]]:
    """依據縣市名稱查詢該地區所有未來日期的預報資料 (依日期升冪排序)"""
    init_db(db_path)
    sql = """
    SELECT id, regionName, dataDate, minT, maxT
    FROM TemperatureForecasts
    WHERE regionName = ?
    ORDER BY dataDate ASC;
    """
    with get_connection(db_path) as conn:
        cursor = conn.cursor()
        rows = cursor.execute(sql, (region_name,)).fetchall()
        return [dict(row) for row in rows]


def get_all_forecasts(db_path: str = DEFAULT_DB_PATH) -> List[Dict[str, Any]]:
    """取得全部縣市預報資料"""
    init_db(db_path)
    sql = """
    SELECT id, regionName, dataDate, minT, maxT
    FROM TemperatureForecasts
    ORDER BY regionName ASC, dataDate ASC;
    """
    with get_connection(db_path) as conn:
        cursor = conn.cursor()
        rows = cursor.execute(sql).fetchall()
        return [dict(row) for row in rows]


def update_database_from_api(db_path: str = DEFAULT_DB_PATH) -> int:
    """
    一鍵串接管線：fetch_weather -> parse_weather -> save_forecasts
    """
    from fetch_weather import get_weather_data
    from parse_weather import parse_weather_forecast

    logger.info("開始執行全自動資料更新管線...")
    raw = get_weather_data(allow_fallback=True)
    parsed = parse_weather_forecast(raw)
    count = save_forecasts(parsed, db_path=db_path)
    logger.info(f"管線執行完成！已同步 {count} 筆資料至 SQLite。")
    return count


if __name__ == "__main__":
    print("=" * 60)
    print("▶ 執行 database.py 檢驗流程")
    print("=" * 60)

    # 1. 執行更新管線
    count = update_database_from_api(DEFAULT_DB_PATH)
    print(f"\n[檢驗 1] 資料寫入 SQLite 筆數: {count} 筆")

    # 2. 檢查 data.db 檔案是否存在
    db_exists = os.path.exists(DEFAULT_DB_PATH)
    print(f"[檢驗 2] data.db 實體檔案存在: {'✅ 是' if db_exists else '❌ 否'}")

    # 3. 檢查 Table 是否存在
    with get_connection(DEFAULT_DB_PATH) as conn:
        cursor = conn.cursor()
        table_check = cursor.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='TemperatureForecasts';"
        ).fetchone()
        print(f"[檢驗 3] TemperatureForecasts 資料表存在: {'✅ 是' if table_check else '❌ 否'}")

        # 4. 執行 SELECT 查詢確認資料真實存在
        rows = cursor.execute("SELECT id, regionName, dataDate, minT, maxT FROM TemperatureForecasts LIMIT 5;").fetchall()
        print(f"[檢驗 4] 執行 SELECT 查詢確認資料存在 (前 5 筆)：")
        for r in rows:
            print(f"       id={r['id']} | {r['regionName']} | {r['dataDate']} | minT={r['minT']}°C | maxT={r['maxT']}°C")

        # 5. 檢查是否有重複資料 (UNIQUE 驗證)
        dup_query = """
        SELECT regionName, dataDate, COUNT(*) as cnt
        FROM TemperatureForecasts
        GROUP BY regionName, dataDate
        HAVING cnt > 1;
        """
        duplicates = cursor.execute(dup_query).fetchall()
        has_dup = len(duplicates) > 0
        print(f"[檢驗 5] 重複資料檢查: {'❌ 發現重複資料' if has_dup else '✅ 無任何重複資料 (0 筆重複)'}")

        # 6. 統計總筆數與地區數
        total_rows = cursor.execute("SELECT COUNT(*) FROM TemperatureForecasts;").fetchone()[0]
        distinct_regions = cursor.execute("SELECT COUNT(DISTINCT regionName) FROM TemperatureForecasts;").fetchone()[0]
        print(f"[檢驗 6] TemperatureForecasts 總筆數: {total_rows} 筆")
        print(f"[檢驗 7] 資料庫涵蓋地區數 (region 數量): {distinct_regions} 個地區")

    print(f"\n✅ database.py 執行成功！")

