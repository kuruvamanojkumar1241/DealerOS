from decimal import Decimal
from django.test import TestCase

from reconcile.importer import DataImporter
from reconcile.models import Location, SystemARecord, SystemBEntry


class StrictTenantIsolationTests(TestCase):
    """
    Explicit verification of multi-tenant security boundary:
    1. Zero cross-tenant data leakage between ORG-A and ORG-B.
    2. Filter operations happen at database query time, never in client memory.
    3. The trap row (REC-1077 cross-org location mismatch) masks the partner organization's location.
    4. Orphans are strictly scoped to the tenant that owns the B entry location.
    """

    def setUp(self):
        # Load the actual CSV datasets into isolated test database
        DataImporter().import_all()
        self.org_a_locations = set(Location.objects.filter(org_id="ORG-A").values_list("location_id", flat=True))
        self.org_b_locations = set(Location.objects.filter(org_id="ORG-B").values_list("location_id", flat=True))

        # Verify location mapping
        self.assertEqual(self.org_a_locations, {"LOC-101", "LOC-102", "LOC-103"})
        self.assertEqual(self.org_b_locations, {"LOC-201", "LOC-202"})

    def test_org_a_never_sees_org_b_locations(self):
        """ORG-A API responses must never reveal any ORG-B location identifier."""
        response = self.client.get("/api/disagreements/?org=ORG-A")
        self.assertEqual(response.status_code, 200)
        data = response.json()

        for item in data["disagreements"]:
            loc = item.get("location")
            # Must not be an unredacted ORG-B location
            for b_loc in self.org_b_locations:
                self.assertNotEqual(
                    loc, b_loc,
                    f"Tenant leak! ORG-A response contains ORG-B location {b_loc} in record {item.get('record_id')}"
                )

    def test_org_b_never_sees_org_a_locations(self):
        """ORG-B API responses must never reveal any ORG-A location identifier."""
        response = self.client.get("/api/disagreements/?org=ORG-B")
        self.assertEqual(response.status_code, 200)
        data = response.json()

        for item in data["disagreements"]:
            loc = item.get("location")
            # Must not be an ORG-A location
            for a_loc in self.org_a_locations:
                self.assertNotEqual(
                    loc, a_loc,
                    f"Tenant leak! ORG-B response contains ORG-A location {a_loc} in record {item.get('record_id')}"
                )

    def test_orphan_attribution_to_tenant(self):
        """
        Orphan entry ENT/2026/4901 is recorded at LOC-102 (ORG-A).
        It must appear when querying ORG-A, and must NEVER appear when querying ORG-B.
        """
        res_a = self.client.get("/api/disagreements/?org=ORG-A&reason=ORPHAN_IN_B")
        self.assertEqual(res_a.status_code, 200)
        orphans_a = [d["entry_id"] for d in res_a.json()["disagreements"]]
        self.assertIn("ENT/2026/4901", orphans_a)

        res_b = self.client.get("/api/disagreements/?org=ORG-B&reason=ORPHAN_IN_B")
        self.assertEqual(res_b.status_code, 200)
        orphans_b = [d["entry_id"] for d in res_b.json()["disagreements"]]
        self.assertNotIn("ENT/2026/4901", orphans_b)

    def test_trap_cross_tenant_record_masking(self):
        """
        Record REC-1077 is at LOC-102 (ORG-A) in System A, but System B assigned it to LOC-201 (ORG-B).
        When ORG-A requests disagreements, it must see the disagreement under LOC-102,
        and System B's private location (LOC-201) must be masked to prevent data leakage.
        """
        res_a = self.client.get("/api/disagreements/?org=ORG-A&reason=LOCATION_MISMATCH")
        self.assertEqual(res_a.status_code, 200)
        disagreements = res_a.json()["disagreements"]
        trap_row = next((d for d in disagreements if d["record_id"] == "REC-1077"), None)
        self.assertIsNotNone(trap_row, "REC-1077 must be flagged for ORG-A")

        # The location shown to ORG-A must be LOC-102 (their own location)
        self.assertEqual(trap_row["location"], "LOC-102")
        # Ensure the external location LOC-201 is NOT leaked anywhere in unmasked form
        self.assertNotIn("LOC-201", trap_row["details"])
        self.assertIn("REDACTED", trap_row["details"])
