import oracledb


def main() -> None:
    dsn = oracledb.makedsn("lin020.dev.e2open.com", 1521, sid="GTM")
    con = oracledb.connect(user="GK_GTM_OWNER", password="GK_WORLD", dsn=dsn)
    cur = con.cursor()

    cur.execute(
        """
        SELECT DISTINCT a.country_id
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
        """
    )
    imports = {r[0] for r in cur.fetchall()}

    cur.execute(
        """
        SELECT DISTINCT a.eccnum, NVL(a.control_attribute16,'NULL')
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
        """
    )
    ecn_rows = cur.fetchall()
    all_ecn = {r[0] for r in ecn_rows}
    dos_y = {r[0] for r in ecn_rows if (r[1] or "").upper() == "Y"}
    dos_n = all_ecn - dos_y
    noclass_y = {e for e in all_ecn if e.upper() == "NOCLASS"}
    noclass_n = all_ecn - noclass_y

    cur.execute(
        """
        SELECT DISTINCT imp_country
        FROM lcs_absolute_embargo
        WHERE exp_country = 'CN'
          AND rec_status = 'A'
          AND absolute = 'Y'
          AND imp_country IS NOT NULL
        """
    )
    embargo_y = {r[0] for r in cur.fetchall()}

    cur.execute(
        """
        SELECT DISTINCT imp_country
        FROM lcs_absolute_embargo
        WHERE exp_country = 'CN'
          AND rec_status = 'A'
          AND absolute = 'N'
          AND imp_country IS NOT NULL
        """
    )
    sanction_y = {r[0] for r in cur.fetchall()}
    sanction_n = imports - embargo_y - sanction_y

    print("COUNTS")
    print("imports", len(imports))
    print("embargo_y", len(embargo_y))
    print("sanction_y", len(sanction_y))
    print("sanction_n", len(sanction_n))
    print("ecn_all", len(all_ecn))
    print("dos_y", len(dos_y))
    print("dos_n", len(dos_n))
    print("noclass_y", len(noclass_y))
    print("noclass_n", len(noclass_n))

    def combos(countries: int, ecns: int, euds: int) -> int:
        return countries * ecns * euds

    print("\nESTIMATED SCENARIO ROWS")
    print("S1 EmbargoY all EUD", combos(len(embargo_y), len(all_ecn), 3))
    print("S2 EmbargoN SanctionY MilitaryY", combos(len(sanction_y), len(all_ecn), 2))
    print("S3 EmbargoN SanctionY MilitaryN DOSY", combos(len(sanction_y), len(dos_y), 1))
    print("S4 EmbargoN SanctionY MilitaryN DOSN NoClassY", combos(len(sanction_y), len(noclass_y & dos_n), 1))
    print("S5 EmbargoN SanctionY MilitaryN DOSN NoClassN", combos(len(sanction_y), len(noclass_n & dos_n), 1))
    print("S6 EmbargoN SanctionN DOSY all EUD", combos(len(sanction_n), len(dos_y), 3))
    print("S7 EmbargoN SanctionN DOSN NoClassY all EUD", combos(len(sanction_n), len(noclass_y & dos_n), 3))
    print("S8 EmbargoN SanctionN DOSN NoClassN all EUD", combos(len(sanction_n), len(noclass_n & dos_n), 3))

    cur.close()
    con.close()


if __name__ == "__main__":
    main()
