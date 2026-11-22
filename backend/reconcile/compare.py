from decimal import Decimal
from typing import Any, Dict, List, Optional


def compare_records(
    a_rows: Dict[str, Dict[str, Any]],
    b_rows: List[Dict[str, Any]],
    target_org: Optional[str] = None,
    location_org_map: Optional[Dict[str, str]] = None
) -> List[Dict[str, Any]]:
    """
    Pure Python reconciliation comparison engine.

    :param a_rows: Dict mapping record_id -> dict with keys:
                   {'total': Decimal, 'location': str, 'date': date|str, 'state': str, 'org': str}
    :param b_rows: List of dicts with keys:
                   {'entry_id': str, 'ref': str|None, 'value': Decimal|None, 'location': str, 'date': date|str, 'org': str, 'label': str}
    :param target_org: Optional tenant filter ('ORG-A' or 'ORG-B'). If provided, ensures zero data leakage.
    :param location_org_map: Optional dict mapping location_id -> org_id for boundary redaction.
    :return: List of disagreement dicts.
    """
    disagreements: List[Dict[str, Any]] = []
    loc_to_org = location_org_map or {}

    # Group System B entries by cleaned reference
    b_by_ref: Dict[str, List[Dict[str, Any]]] = {}
    for entry in b_rows:
        ref = entry.get("ref")
        if ref:
            b_by_ref.setdefault(ref, []).append(entry)
        else:
            # Entry has unparseable or completely missing reference -> Orphan in B
            b_by_ref.setdefault("__NO_REF__", []).append(entry)

    # 1. Detect ORPHAN_IN_B (B entries that point to non-existent A records)
    for ref, entries in b_by_ref.items():
        if ref not in a_rows:
            for e in entries:
                entry_org = e.get("org") or loc_to_org.get(e["location"])
                if target_org and entry_org != target_org:
                    continue  # Tenant isolation: do not leak other org's orphans

                disagreements.append({
                    "reason": "ORPHAN_IN_B",
                    "record_id": ref if ref != "__NO_REF__" else None,
                    "entry_id": e["entry_id"],
                    "location": e["location"],
                    "org_id": entry_org,
                    "a_value": None,
                    "b_value": e["value"],
                    "difference": e["value"],
                    "details": f"System B entry {e['entry_id']} references non-existent record '{ref}'."
                })

    # 2. Iterate through System A records
    for rid, a in a_rows.items():
        a_org = a.get("org") or loc_to_org.get(a["location"])
        entries = b_by_ref.get(rid, [])

        # Check tenant relevance for this record:
        # A record belongs to target_org if its A location belongs to target_org,
        # OR if any B entry claims it at a location belonging to target_org.
        b_orgs = [e.get("org") or loc_to_org.get(e["location"]) for e in entries]
        is_relevant_to_org = (not target_org) or (a_org == target_org) or (target_org in b_orgs)

        if not is_relevant_to_org:
            continue

        # Case A: MISSING_IN_B (System A record has no B entries)
        if not entries:
            # If state is VOIDED and has no B entry, it was cancelled before entry: not an error
            if a.get("state") == "VOIDED":
                continue

            disagreements.append({
                "reason": "MISSING_IN_B",
                "record_id": rid,
                "entry_id": None,
                "location": a["location"],
                "org_id": a_org,
                "a_value": a["total"],
                "b_value": None,
                "difference": a["total"],
                "details": f"Record {rid} exists in System A but has no corresponding entry in System B."
            })
            continue

        # Case B: VOIDED Record in A that still has B entries
        if a.get("state") == "VOIDED":
            b_vals = [e["value"] for e in entries if e["value"] is not None]
            total_b = sum(b_vals, Decimal("0.00")) if b_vals else None
            disagreements.append({
                "reason": "VOIDED_RECORD",
                "record_id": rid,
                "entry_id": ", ".join(e["entry_id"] for e in entries),
                "location": a["location"],
                "org_id": a_org,
                "a_value": a["total"],
                "b_value": total_b,
                "difference": total_b,
                "details": f"Record {rid} was VOIDED in System A, but System B still maintains active entry."
            })
            continue

        # Case C: Check for Blank / Null values in B entries
        has_null_val = any(e.get("value") is None for e in entries)
        if has_null_val:
            disagreements.append({
                "reason": "VALUE_MISMATCH",
                "record_id": rid,
                "entry_id": ", ".join(e["entry_id"] for e in entries),
                "location": a["location"],
                "org_id": a_org,
                "a_value": a["total"],
                "b_value": None,
                "difference": None,
                "details": f"System B entry has blank/unknown value for record {rid} (System A expects {a['total']})."
            })
            continue

        # Case D: Multiple B entries for a single A record
        if len(entries) > 1:
            total_b = sum(e["value"] for e in entries)
            # If multiple entries sum exactly to A's total_value (valid split, e.g. 'part 2 of 2')
            if total_b != a["total"]:
                disagreements.append({
                    "reason": "DUPLICATE_IN_B",
                    "record_id": rid,
                    "entry_id": ", ".join(e["entry_id"] for e in entries),
                    "location": a["location"],
                    "org_id": a_org,
                    "a_value": a["total"],
                    "b_value": total_b,
                    "difference": total_b - a["total"],
                    "details": f"Record {rid} has multiple B entries totaling {total_b}, which differs from A total {a['total']}."
                })
            # Check if any entry in the split has location or date differences
            for e in entries:
                _check_metadata_mismatches(rid, a, e, a_org, target_org, loc_to_org, disagreements)
            continue

        # Single B entry checks
        e = entries[0]

        # Case E: Value mismatch
        if e["value"] != a["total"]:
            diff = (e["value"] - a["total"]) if (e["value"] is not None and a["total"] is not None) else None
            disagreements.append({
                "reason": "VALUE_MISMATCH",
                "record_id": rid,
                "entry_id": e["entry_id"],
                "location": a["location"],
                "org_id": a_org,
                "a_value": a["total"],
                "b_value": e["value"],
                "difference": diff,
                "details": f"Value discrepancy: System A has {a['total']}, but System B has {e['value']}."
            })

        # Case F: Location mismatch & Date mismatch
        _check_metadata_mismatches(rid, a, e, a_org, target_org, loc_to_org, disagreements)

    return disagreements


def _check_metadata_mismatches(
    rid: str,
    a: Dict[str, Any],
    e: Dict[str, Any],
    a_org: str,
    target_org: Optional[str],
    loc_to_org: Dict[str, str],
    disagreements: List[Dict[str, Any]]
):
    """
    Checks for location and date differences, strictly applying tenant isolation masks.
    """
    b_location = e["location"]
    b_org = e.get("org") or loc_to_org.get(b_location)

    # Location Mismatch
    if a["location"] != b_location:
        # Check tenant boundary (The Cross-Org Location Trap):
        # If target_org is specified and a_org == target_org but b_org != target_org,
        # we MUST redact b_location so ORG-A never sees ORG-B's internal location name/id!
        if target_org and a_org == target_org and b_org != target_org:
            sanitized_b_loc = "[REDACTED_CROSS_TENANT_LOCATION]"
            detail = f"Cross-tenant location mismatch: System A recorded at {a['location']}, while System B recorded at an external partner organization (cross-tenant location REDACTED)."
        elif target_org and b_org == target_org and a_org != target_org:
            sanitized_b_loc = b_location
            detail = f"System B recorded at {b_location}, but originating System A record belongs to an external tenant."
        else:
            sanitized_b_loc = b_location
            detail = f"Location mismatch: System A recorded at {a['location']}, System B recorded at {b_location}."

        disagreements.append({
            "reason": "LOCATION_MISMATCH",
            "record_id": rid,
            "entry_id": e["entry_id"],
            "location": a["location"] if (not target_org or a_org == target_org) else sanitized_b_loc,
            "org_id": target_org or a_org,
            "a_value": a["total"],
            "b_value": e["value"],
            "difference": None,
            "details": detail
        })

    # Date Mismatch
    a_date_str = str(a["date"])
    b_date_str = str(e["date"])
    if a_date_str != b_date_str:
        disagreements.append({
            "reason": "DATE_MISMATCH",
            "record_id": rid,
            "entry_id": e["entry_id"],
            "location": a["location"],
            "org_id": a_org,
            "a_value": a["total"],
            "b_value": e["value"],
            "difference": None,
            "details": f"Date mismatch: System A event date is {a_date_str}, but System B recorded date is {b_date_str}."
        })
