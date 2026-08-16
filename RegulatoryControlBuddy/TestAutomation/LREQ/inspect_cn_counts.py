import oracledb


def main() -> None:
    dsn = oracledb.makedsn("lin020.dev.e2open.com", 1521, sid="GTM")
    con = oracledb.connect(user="GK_GTM_OWNER", password="GK_WORLD", dsn=dsn)
    cur = con.cursor()

    queries = {
        "import_latest_no_flag": """
            SELECT COUNT(DISTINCT a.country_id)
            FROM lcs_country_chart_global a
            WHERE a.export_country_id = 'CN'
              AND a.rec_status = 'A'
              AND a.effective_date = (
                    SELECT MAX(b.effective_date)
                    FROM lcs_country_chart_global b
                    WHERE a.export_country_id = b.export_country_id
                      AND a.export_cntry_group = b.export_cntry_group
                      AND a.country_id = b.country_id
                      AND b.effective_date <= SYSDATE
              )
        """,
        "ecn_latest_no_flag": """
            SELECT COUNT(DISTINCT a.eccnum)
            FROM lcs_eccn_chart_global a
            WHERE a.export_country_id = 'CN'
              AND a.rs2 IS NULL
              AND a.rec_status = 'A'
              AND a.effective_date = (
                    SELECT MAX(b.effective_date)
                    FROM lcs_eccn_chart_global b
                    WHERE a.export_country_id = b.export_country_id
                      AND a.export_cntry_group = b.export_cntry_group
                      AND a.eccnum = b.eccnum
                      AND b.effective_date <= SYSDATE
              )
        """,
        "ecn_latest_control_attr16_y": """
            SELECT COUNT(DISTINCT a.eccnum)
            FROM lcs_eccn_chart_global a
            WHERE a.export_country_id = 'CN'
              AND a.control_attribute16 = 'Y'
              AND a.rs2 IS NULL
              AND a.rec_status = 'A'
              AND a.effective_date = (
                    SELECT MAX(b.effective_date)
                    FROM lcs_eccn_chart_global b
                    WHERE a.export_country_id = b.export_country_id
                      AND a.export_cntry_group = b.export_cntry_group
                      AND a.eccnum = b.eccnum
                      AND b.effective_date <= SYSDATE
              )
        """,
    }

    for name, query in queries.items():
        cur.execute(query)
        print(name, cur.fetchone()[0])

    cur.execute(
      """
      SELECT column_name
      FROM user_tab_columns
      WHERE table_name = 'LCS_ABSOLUTE_EMBARGO'
      ORDER BY column_id
      """
    )
    embargo_cols = [r[0] for r in cur.fetchall()]
    print("embargo_columns", embargo_cols)

    cur.close()
    con.close()


if __name__ == "__main__":
    main()
