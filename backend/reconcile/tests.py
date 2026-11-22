from datetime import date
from decimal import Decimal
from django.test import TestCase

from reconcile.compare import compare_records
from reconcile.importer import normalize_ref, parse_amount, parse_date


class ReconciliationComparisonTests(TestCase):
    """
    Unit tests covering each comparison rule, data cleaning, and tenant isolation.
    """

    def setUp(self):
        self.loc_map = {
            "LOC-101": "ORG-A",
            "LOC-102": "ORG-A",
            "LOC-103": "ORG-A",
            "LOC-201": "ORG-B",
            "LOC-202": "ORG-B",
        }

    def test_clean_row_produces_no_disagreements(self):
        """A matching pair produces zero disagreements."""
        a = {
            "REC-1001": {
                "total": Decimal("100.00"),
                "location": "LOC-101",
                "date": date(2026, 3, 1),
                "state": "CONFIRMED",
                "org": "ORG-A"
            }
        }
        b = [
            {
                "entry_id": "ENT/1",
                "ref": "REC-1001",
                "value": Decimal("100.00"),
                "location": "LOC-101",
                "date": date(2026, 3, 1),
                "org": "ORG-A",
                "label": "Test"
            }
        ]
        result = compare_records(a, b, target_org="ORG-A", location_org_map=self.loc_map)
        self.assertEqual(len(result), 0)

    def test_missing_in_b(self):
        """An A record with no B entry is flagged as MISSING_IN_B."""
        a = {
            "REC-1015": {
                "total": Decimal("41095.33"),
                "location": "LOC-103",
                "date": date(2026, 4, 2),
                "state": "CONFIRMED",
                "org": "ORG-A"
            }
        }
        b = []
        result = compare_records(a, b, target_org="ORG-A", location_org_map=self.loc_map)
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["reason"], "MISSING_IN_B")
        self.assertEqual(result[0]["record_id"], "REC-1015")
        self.assertEqual(result[0]["a_value"], Decimal("41095.33"))
        self.assertIsNone(result[0]["b_value"])

    def test_orphan_in_b(self):
        """A B entry with an unknown reference is flagged as ORPHAN_IN_B."""
        a = {}
        b = [
            {
                "entry_id": "ENT/2026/4901",
                "ref": "REC-1999",
                "value": Decimal("41250.00"),
                "location": "LOC-102",
                "date": date(2026, 3, 18),
                "org": "ORG-A",
                "label": "Orphan"
            }
        ]
        result = compare_records(a, b, target_org="ORG-A", location_org_map=self.loc_map)
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["reason"], "ORPHAN_IN_B")
        self.assertEqual(result[0]["entry_id"], "ENT/2026/4901")
        self.assertIsNone(result[0]["a_value"])
        self.assertEqual(result[0]["b_value"], Decimal("41250.00"))

    def test_duplicate_in_b(self):
        """One record entered multiple times that do not sum to total is flagged as DUPLICATE_IN_B."""
        a = {
            "REC-1042": {
                "total": Decimal("112837.06"),
                "location": "LOC-101",
                "date": date(2026, 3, 4),
                "state": "CONFIRMED",
                "org": "ORG-A"
            }
        }
        b = [
            {
                "entry_id": "ENT/2026/4042",
                "ref": "REC-1042",
                "value": Decimal("112837.06"),
                "location": "LOC-101",
                "date": date(2026, 3, 4),
                "org": "ORG-A",
                "label": "Copy 1"
            },
            {
                "entry_id": "ENT/2026/4902",
                "ref": "REC-1042",
                "value": Decimal("112837.06"),
                "location": "LOC-101",
                "date": date(2026, 3, 4),
                "org": "ORG-A",
                "label": "Copy 2"
            }
        ]
        result = compare_records(a, b, target_org="ORG-A", location_org_map=self.loc_map)
        self.assertTrue(any(r["reason"] == "DUPLICATE_IN_B" for r in result))

    def test_split_that_sums_is_not_an_error(self):
        """Two entry parts that sum exactly to A's total (e.g. REC-1055) are not flagged."""
        a = {
            "REC-1055": {
                "total": Decimal("179877.32"),
                "location": "LOC-103",
                "date": date(2026, 3, 14),
                "state": "CONFIRMED",
                "org": "ORG-A"
            }
        }
        b = [
            {
                "entry_id": "ENT/2026/4055",
                "ref": "REC-1055",
                "value": Decimal("71950.93"),
                "location": "LOC-103",
                "date": date(2026, 3, 14),
                "org": "ORG-A",
                "label": "Part 1"
            },
            {
                "entry_id": "ENT/2026/4903",
                "ref": "REC-1055",
                "value": Decimal("107926.39"),
                "location": "LOC-103",
                "date": date(2026, 3, 14),
                "org": "ORG-A",
                "label": "Entry part 2 of 2"
            }
        ]
        result = compare_records(a, b, target_org="ORG-A", location_org_map=self.loc_map)
        # 71950.93 + 107926.39 == 179877.32 -> Split is valid, no duplicate or value error
        self.assertEqual(len(result), 0)

    def test_value_mismatch(self):
        """Discrepancies in total value are flagged as VALUE_MISMATCH."""
        a = {
            "REC-1003": {
                "total": Decimal("121388.01"),
                "location": "LOC-202",
                "date": date(2026, 3, 4),
                "state": "CONFIRMED",
                "org": "ORG-B"
            }
        }
        b = [
            {
                "entry_id": "ENT/2026/4003",
                "ref": "REC-1003",
                "value": Decimal("94834.38"),  # Sent base_value instead of total_value!
                "location": "LOC-202",
                "date": date(2026, 3, 4),
                "org": "ORG-B",
                "label": "Entry"
            }
        ]
        result = compare_records(a, b, target_org="ORG-B", location_org_map=self.loc_map)
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["reason"], "VALUE_MISMATCH")
        self.assertEqual(result[0]["difference"], Decimal("94834.38") - Decimal("121388.01"))

    def test_blank_value_is_flagged_and_not_zero(self):
        """A blank B value is flagged as VALUE_MISMATCH and never coerced to 0."""
        a = {
            "REC-1050": {
                "total": Decimal("160405.85"),
                "location": "LOC-202",
                "date": date(2026, 3, 20),
                "state": "CONFIRMED",
                "org": "ORG-B"
            }
        }
        b = [
            {
                "entry_id": "ENT/2026/4050",
                "ref": "REC-1050",
                "value": None,
                "location": "LOC-202",
                "date": date(2026, 3, 20),
                "org": "ORG-B",
                "label": "Empty"
            }
        ]
        result = compare_records(a, b, target_org="ORG-B", location_org_map=self.loc_map)
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["reason"], "VALUE_MISMATCH")
        self.assertIsNone(result[0]["b_value"])

    def test_voided_record_with_entry(self):
        """A VOIDED record in System A that still has an active B entry is flagged."""
        a = {
            "REC-1019": {
                "total": Decimal("57092.35"),
                "location": "LOC-202",
                "date": date(2026, 4, 5),
                "state": "VOIDED",
                "org": "ORG-B"
            }
        }
        b = [
            {
                "entry_id": "ENT/2026/4019",
                "ref": "REC-1019",
                "value": Decimal("57092.35"),
                "location": "LOC-202",
                "date": date(2026, 4, 5),
                "org": "ORG-B",
                "label": "Voided test"
            }
        ]
        result = compare_records(a, b, target_org="ORG-B", location_org_map=self.loc_map)
        self.assertTrue(any(r["reason"] == "VOIDED_RECORD" for r in result))

    def test_date_and_location_mismatch(self):
        """Metadata divergences between A and B are flagged."""
        a = {
            "REC-1009": {
                "total": Decimal("111699.30"),
                "location": "LOC-201",
                "date": date(2026, 3, 31),
                "state": "CONFIRMED",
                "org": "ORG-B"
            }
        }
        b = [
            {
                "entry_id": "ENT/2026/4009",
                "ref": "REC-1009",
                "value": Decimal("111699.30"),
                "location": "LOC-201",
                "date": date(2026, 4, 2),  # 2 days later!
                "org": "ORG-B",
                "label": "Date divergence"
            }
        ]
        result = compare_records(a, b, target_org="ORG-B", location_org_map=self.loc_map)
        self.assertTrue(any(r["reason"] == "DATE_MISMATCH" for r in result))

    def test_cleaning_helpers(self):
        """Test reference normalization and amount parsing with Indian commas."""
        self.assertEqual(normalize_ref("rec1034"), "REC-1034")
        self.assertEqual(normalize_ref(" REC - 1070 "), "REC-1070")
        self.assertEqual(normalize_ref("1112"), "REC-1112")
        self.assertIsNone(normalize_ref(""))

        self.assertEqual(parse_amount("1,25,400.00"), Decimal("125400.00"))
        self.assertEqual(parse_amount(" 69507.75 "), Decimal("69507.75"))
        self.assertIsNone(parse_amount(""))
        self.assertIsNone(parse_amount(None))

    def test_tenant_isolation_zero_leakage(self):
        """Strict test that ORG-A never sees ORG-B data and vice versa."""
        # Include a record from ORG-A and a record from ORG-B
        a = {
            "REC-A": {
                "total": Decimal("100.00"),
                "location": "LOC-101",
                "date": date(2026, 3, 1),
                "state": "CONFIRMED",
                "org": "ORG-A"
            },
            "REC-B": {
                "total": Decimal("200.00"),
                "location": "LOC-201",
                "date": date(2026, 3, 1),
                "state": "CONFIRMED",
                "org": "ORG-B"
            }
        }
        b = [
            {
                "entry_id": "ENT-A",
                "ref": "REC-A",
                "value": Decimal("90.00"),  # mismatch
                "location": "LOC-101",
                "date": date(2026, 3, 1),
                "org": "ORG-A",
                "label": "A"
            },
            {
                "entry_id": "ENT-B",
                "ref": "REC-B",
                "value": Decimal("180.00"),  # mismatch
                "location": "LOC-201",
                "date": date(2026, 3, 1),
                "org": "ORG-B",
                "label": "B"
            }
        ]

        # Query as ORG-A
        res_a = compare_records(a, b, target_org="ORG-A", location_org_map=self.loc_map)
        for row in res_a:
            self.assertEqual(row["org_id"], "ORG-A")
            self.assertNotEqual(row["location"], "LOC-201")
            self.assertNotEqual(row["record_id"], "REC-B")

        # Query as ORG-B
        res_b = compare_records(a, b, target_org="ORG-B", location_org_map=self.loc_map)
        for row in res_b:
            self.assertEqual(row["org_id"], "ORG-B")
            self.assertNotEqual(row["location"], "LOC-101")
            self.assertNotEqual(row["record_id"], "REC-A")

    def test_trap_cross_tenant_location_redaction(self):
        """
        The Trap Row (REC-1077):
        System A says LOC-102 (ORG-A), but System B says LOC-201 (ORG-B).
        When viewed by ORG-A, System B's internal location must be masked.
        """
        a = {
            "REC-1077": {
                "total": Decimal("83361.40"),
                "location": "LOC-102",
                "date": date(2026, 3, 19),
                "state": "CONFIRMED",
                "org": "ORG-A"
            }
        }
        b = [
            {
                "entry_id": "ENT/2026/4077",
                "ref": "REC-1077",
                "value": Decimal("83361.40"),
                "location": "LOC-201",  # ORG-B location!
                "date": date(2026, 3, 19),
                "org": "ORG-B",
                "label": "Cross Org Trap"
            }
        ]

        # Call as ORG-A
        res_a = compare_records(a, b, target_org="ORG-A", location_org_map=self.loc_map)
        loc_mismatch = next((r for r in res_a if r["reason"] == "LOCATION_MISMATCH"), None)
        self.assertIsNotNone(loc_mismatch)
        # Ensure ORG-B's private location ID 'LOC-201' is NEVER exposed in the location field for ORG-A
        self.assertNotIn("LOC-201", loc_mismatch["location"])
        self.assertIn("REDACTED", loc_mismatch["details"])


class DisagreementsApiIntegrationTests(TestCase):
    """
    Integration tests for the REST API endpoints and database-backed tenant isolation.
    """

    def setUp(self):
        from reconcile.importer import DataImporter
        # Load sample data into database
        DataImporter().import_all()

    def test_api_organizations_list(self):
        response = self.client.get("/api/organizations/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        org_ids = [item["org_id"] for item in data]
        self.assertIn("ORG-A", org_ids)
        self.assertIn("ORG-B", org_ids)

    def test_api_disagreements_org_a(self):
        response = self.client.get("/api/disagreements/?org=ORG-A")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["org"], "ORG-A")
        self.assertGreater(data["total_disagreements"], 0)

        # Tenant isolation check: zero records should contain an unmasked ORG-B location
        for row in data["disagreements"]:
            self.assertNotEqual(row.get("location"), "LOC-201")
            self.assertNotEqual(row.get("location"), "LOC-202")

    def test_api_disagreements_org_b(self):
        response = self.client.get("/api/disagreements/?org=ORG-B")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["org"], "ORG-B")
        self.assertGreater(data["total_disagreements"], 0)

        # Tenant isolation check: zero records should contain an ORG-A location
        for row in data["disagreements"]:
            self.assertNotEqual(row.get("location"), "LOC-101")
            self.assertNotEqual(row.get("location"), "LOC-102")
            self.assertNotEqual(row.get("location"), "LOC-103")

    def test_api_filter_by_reason(self):
        response = self.client.get("/api/disagreements/?org=ORG-A&reason=MISSING_IN_B")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        for row in data["disagreements"]:
            self.assertEqual(row["reason"], "MISSING_IN_B")

    def test_api_sort_by_value(self):
        response = self.client.get("/api/disagreements/?org=ORG-A&sort=-value")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        disagreements = data["disagreements"]
        self.assertGreater(len(disagreements), 0)
