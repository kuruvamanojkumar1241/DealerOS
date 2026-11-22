import csv
import logging
import re
from datetime import datetime
from decimal import Decimal, InvalidOperation
from pathlib import Path

from django.db import transaction
from reconcile.models import Location, SystemARecord, SystemBEntry

logger = logging.getLogger(__name__)


def normalize_ref(raw: str | None) -> str | None:
    """
    Normalizes messy references:
    'rec1034', ' REC - 1070 ', '1112' -> 'REC-1034', 'REC-1070', 'REC-1112'.
    Returns None if no digits are present.
    """
    if not raw:
        return None
    s = str(raw).strip()
    match = re.search(r"\d+", s)
    if not match:
        return None
    return f"REC-{match.group()}"


def parse_amount(raw: str | None) -> Decimal | None:
    """
    Parses amount string to Decimal.
    Handles standard numbers as well as Indian-style comma groupings like '1,25,400.00'.
    Blank, empty, or unparseable strings return None (NEVER 0, as blank means unknown).
    """
    if raw is None:
        return None
    s = str(raw).strip().replace(",", "")
    if not s:
        return None
    try:
        return Decimal(s)
    except InvalidOperation:
        logger.warning(f"Could not parse amount '{raw}', storing as None.")
        return None


def parse_date(raw: str | None):
    """
    Parses DD-MM-YYYY dates (e.g., '03-04-2026') to Python date object.
    Falls back to YYYY-MM-DD if already ISO formatted.
    """
    if not raw:
        return None
    s = str(raw).strip()
    for fmt in ("%d-%m-%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            continue
    logger.warning(f"Could not parse date string '{raw}'.")
    return None


class DataImporter:
    """
    Idempotent data importer for DealerOS assessment.
    Reads locations.csv, system_a.csv, and system_b.csv into SQLite without dropping dirty rows.
    """

    def __init__(self, data_dir: Path | str | None = None):
        if data_dir is None:
            self.data_dir = Path(__file__).resolve().parent.parent / "data"
        else:
            self.data_dir = Path(data_dir)

    @transaction.atomic
    def import_locations(self) -> dict:
        filepath = self.data_dir / "locations.csv"
        read_count = 0
        saved_count = 0

        with open(filepath, mode="r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for row in reader:
                read_count += 1
                loc_id = row["location_id"].strip()
                org_id = row["org_id"].strip()
                loc_name = row.get("location_name", "").strip()

                Location.objects.update_or_create(
                    location_id=loc_id,
                    defaults={
                        "org_id": org_id,
                        "location_name": loc_name,
                    }
                )
                saved_count += 1

        return {"read": read_count, "saved": saved_count}

    @transaction.atomic
    def import_system_a(self) -> dict:
        filepath = self.data_dir / "system_a.csv"
        read_count = 0
        saved_count = 0
        null_actors = 0

        with open(filepath, mode="r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for row in reader:
                read_count += 1
                record_id = row["record_id"].strip()
                location_id = row["location_id"].strip()
                event_date = parse_date(row["event_date"])
                category_code = row["category_code"].strip()
                actor_id = row.get("actor_id", "").strip() or None
                if actor_id is None:
                    null_actors += 1

                base_value = parse_amount(row["base_value"])
                adjustment = parse_amount(row["adjustment"])
                total_value = parse_amount(row["total_value"])
                state = row.get("state", "CONFIRMED").strip()

                loc = Location.objects.get(location_id=location_id)

                SystemARecord.objects.update_or_create(
                    record_id=record_id,
                    defaults={
                        "location": loc,
                        "event_date": event_date,
                        "category_code": category_code,
                        "actor_id": actor_id,
                        "base_value": base_value,
                        "adjustment": adjustment,
                        "total_value": total_value,
                        "state": state,
                    }
                )
                saved_count += 1

        return {
            "read": read_count,
            "saved": saved_count,
            "null_actors": null_actors,
        }

    @transaction.atomic
    def import_system_b(self) -> dict:
        filepath = self.data_dir / "system_b.csv"
        read_count = 0
        saved_count = 0
        null_values = 0
        cleaned_refs = 0

        with open(filepath, mode="r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for row in reader:
                read_count += 1
                entry_id = row["entry_id"].strip()
                record_ref_raw = row["record_ref"]
                record_ref = normalize_ref(record_ref_raw)

                if record_ref_raw != record_ref:
                    cleaned_refs += 1

                location_id = row["location_id"].strip()
                recorded_on = parse_date(row["recorded_on"])
                value_raw = row.get("value", "")
                value = parse_amount(value_raw)

                if value is None:
                    null_values += 1

                label = row.get("label", "").strip()
                loc = Location.objects.get(location_id=location_id)

                SystemBEntry.objects.update_or_create(
                    entry_id=entry_id,
                    defaults={
                        "record_ref_raw": record_ref_raw,
                        "record_ref": record_ref,
                        "location": loc,
                        "recorded_on": recorded_on,
                        "value_raw": value_raw,
                        "value": value,
                        "label": label,
                    }
                )
                saved_count += 1

        return {
            "read": read_count,
            "saved": saved_count,
            "null_values": null_values,
            "cleaned_refs": cleaned_refs,
        }

    def import_all(self) -> dict:
        loc_res = self.import_locations()
        a_res = self.import_system_a()
        b_res = self.import_system_b()

        return {
            "locations": loc_res,
            "system_a": a_res,
            "system_b": b_res,
        }
