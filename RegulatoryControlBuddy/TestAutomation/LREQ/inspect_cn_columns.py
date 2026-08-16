import oracledb


def main() -> None:
    dsn = oracledb.makedsn("lin020.dev.e2open.com", 1521, sid="GTM")
    con = oracledb.connect(user="GK_GTM_OWNER", password="GK_WORLD", dsn=dsn)
    cur = con.cursor()

    cur.execute(
        """
        SELECT column_name
        FROM user_tab_columns
        WHERE table_name = 'LCS_COUNTRY_CHART_GLOBAL'
          AND (column_name LIKE '%A1' OR column_name LIKE '%B1')
        ORDER BY column_name
        """
    )
    country_cols = [r[0] for r in cur.fetchall()]

    cur.execute(
        """
        SELECT column_name
        FROM user_tab_columns
        WHERE table_name = 'LCS_ECCN_CHART_GLOBAL'
          AND (column_name LIKE '%A1' OR column_name LIKE '%B1' OR column_name = 'CONTROL_ATTRIBUTE16')
        ORDER BY column_name
        """
    )
    eccn_cols = [r[0] for r in cur.fetchall()]

    print("COUNTRY_COLS", country_cols)
    print("ECCN_COLS", eccn_cols)

    for code in ("CN", "CH", "GB", "FR"):
        cur.execute(
            """
            SELECT COUNT(*)
            FROM lcs_country_chart_global
            WHERE export_country_id = :code
              AND rec_status = 'A'
            """,
            {"code": code},
        )
        c_count = cur.fetchone()[0]

        cur.execute(
            """
            SELECT COUNT(*)
            FROM lcs_eccn_chart_global
            WHERE export_country_id = :code
              AND rec_status = 'A'
            """,
            {"code": code},
        )
        e_count = cur.fetchone()[0]

        print(f"ROW_COUNTS_{code}", {"country": c_count, "eccn": e_count})

    cur.execute(
        """
        SELECT NVL(cb1, 'NULL') AS cb1_val, COUNT(*)
        FROM lcs_country_chart_global
        WHERE export_country_id = 'CN'
          AND rec_status = 'A'
        GROUP BY NVL(cb1, 'NULL')
        ORDER BY 2 DESC
        """
    )
    print("CN_COUNTRY_CB1_DIST", cur.fetchall())

    cur.execute(
        """
        SELECT NVL(a1, 'NULL') AS a1_val, COUNT(*)
        FROM lcs_country_chart_global
        WHERE export_country_id = 'CN'
          AND rec_status = 'A'
        GROUP BY NVL(a1, 'NULL')
        ORDER BY 2 DESC
        """
    )
    print("CN_COUNTRY_A1_DIST", cur.fetchall())

    cur.execute(
        """
        SELECT NVL(cb1, 'NULL') AS cb1_val, COUNT(*)
        FROM lcs_eccn_chart_global
        WHERE export_country_id = 'CN'
          AND rec_status = 'A'
        GROUP BY NVL(cb1, 'NULL')
        ORDER BY 2 DESC
        """
    )
    print("CN_ECCN_CB1_DIST", cur.fetchall())

    cur.close()
    con.close()


if __name__ == "__main__":
    main()
