from django.shortcuts import render
from decimal import Decimal
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from reconcile.compare import compare_records
from reconcile.models import Location, SystemARecord, SystemBEntry


def html_table_view(request):
    """
    Renders the plain HTML table view directly from Django templates.
    """
    org_id = request.GET.get("org", "ORG-A").strip().upper()
    reason_filter = request.GET.get("reason", "").strip().upper()
    sort_param = request.GET.get("sort", "-value")

    loc_org_map = dict(Location.objects.values_list("location_id", "org_id"))
    a_qs = SystemARecord.objects.filter(location__org_id=org_id)
    a_dict = {
        a.record_id: {
            "total": a.total_value,
            "location": a.location_id,
            "date": a.event_date,
            "state": a.state,
            "org": org_id,
        }
        for a in a_qs
    }

    b_qs = (
        SystemBEntry.objects.filter(location__org_id=org_id)
        | SystemBEntry.objects.filter(record_ref__in=a_dict.keys())
    ).distinct()

    b_list = [
        {
            "entry_id": b.entry_id,
            "ref": b.record_ref,
            "value": b.value,
            "location": b.location_id,
            "date": b.recorded_on,
            "org": loc_org_map.get(b.location_id),
            "label": b.label,
        }
        for b in b_qs
    ]

    disagreements = compare_records(a_dict, b_list, target_org=org_id, location_org_map=loc_org_map)

    if reason_filter:
        disagreements = [d for d in disagreements if d["reason"] == reason_filter]

    # Badge color helper
    badge_colors = {
        "MISSING_IN_B": "amber",
        "ORPHAN_IN_B": "rose",
        "DUPLICATE_IN_B": "purple",
        "VALUE_MISMATCH": "red",
        "LOCATION_MISMATCH": "cyan",
        "DATE_MISMATCH": "blue",
        "VOIDED_RECORD": "slate",
    }
    for d in disagreements:
        d["badge_color"] = badge_colors.get(d["reason"], "slate")

    # Sorting
    if sort_param:
        reverse = sort_param.startswith("-")
        sort_key = sort_param.lstrip("-")

        def get_sort_value(item):
            if sort_key == "value":
                val = item.get("a_value") if item.get("a_value") is not None else item.get("b_value")
            else:
                val = item.get(sort_key)
            if val is None:
                return Decimal("-999999999999") if not reverse else Decimal("999999999999")
            return val

        try:
            disagreements.sort(key=get_sort_value, reverse=reverse)
        except Exception:
            pass

    return render(
        request,
        "reconcile/table.html",
        {
            "disagreements": disagreements,
            "org_id": org_id,
            "reason": reason_filter,
            "sort": sort_param,
        }
    )


@api_view(["GET"])
def list_organizations(request):
    """
    Returns available organizations discovered from locations table.
    """
    orgs = Location.objects.values_list("org_id", flat=True).distinct().order_by("org_id")
    data = []
    for org in orgs:
        loc_count = Location.objects.filter(org_id=org).count()
        data.append({
            "org_id": org,
            "locations_count": loc_count,
            "locations": list(Location.objects.filter(org_id=org).values("location_id", "location_name"))
        })
    return Response(data)


@api_view(["GET"])
def get_disagreements(request):
    """
    Reconciliation Disagreements Endpoint.
    Strict tenant enforcement:
    - Filters records and entries at the database level by the specified organization.
    - Zero cross-tenant data leakage.

    Query parameters:
    - org: 'ORG-A' or 'ORG-B' (Required, defaults to ORG-A)
    - reason: Optional reason filter (e.g., 'VALUE_MISMATCH', 'MISSING_IN_B', etc.)
    - sort: Optional sorting field (e.g., 'value', '-value', 'difference', '-difference', 'record_id')
    """
    org_id = request.query_params.get("org", "ORG-A").strip().upper()

    # Validate org exists
    valid_orgs = set(Location.objects.values_list("org_id", flat=True).distinct())
    if org_id not in valid_orgs:
        return Response(
            {"error": f"Invalid org_id '{org_id}'. Available organizations: {list(valid_orgs)}"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # 1. Fetch only locations mapping for org verification
    loc_org_map = dict(Location.objects.values_list("location_id", "org_id"))

    # 2. Database-level tenant query:
    # Fetch System A records owned by this org
    a_qs = SystemARecord.objects.filter(location__org_id=org_id)
    a_dict = {}
    for a in a_qs:
        a_dict[a.record_id] = {
            "total": a.total_value,
            "location": a.location_id,
            "date": a.event_date,
            "state": a.state,
            "org": org_id,
        }

    # Fetch System B entries:
    # Those recorded at an org location OR pointing to a known A record of this org
    b_qs = SystemBEntry.objects.filter(
        location__org_id=org_id
    ) | SystemBEntry.objects.filter(
        record_ref__in=a_dict.keys()
    )
    b_qs = b_qs.distinct()

    b_list = []
    for b in b_qs:
        b_list.append({
            "entry_id": b.entry_id,
            "ref": b.record_ref,
            "value": b.value,
            "location": b.location_id,
            "date": b.recorded_on,
            "org": loc_org_map.get(b.location_id),
            "label": b.label,
        })

    # 3. Run pure comparison engine with tenant boundary enforcement
    disagreements = compare_records(
        a_rows=a_dict,
        b_rows=b_list,
        target_org=org_id,
        location_org_map=loc_org_map
    )

    # 4. Optional filtering by reason
    reason_filter = request.query_params.get("reason")
    if reason_filter:
        reason_filter = reason_filter.strip().upper()
        disagreements = [d for d in disagreements if d["reason"] == reason_filter]

    # 5. Optional sorting
    sort_param = request.query_params.get("sort")
    if sort_param:
        reverse = sort_param.startswith("-")
        sort_key = sort_param.lstrip("-")

        def get_sort_value(item):
            # Map 'value' to a_value or b_value
            if sort_key == "value":
                val = item.get("a_value") if item.get("a_value") is not None else item.get("b_value")
            else:
                val = item.get(sort_key)
            if val is None:
                return Decimal("-999999999999") if not reverse else Decimal("999999999999")
            if isinstance(val, (int, float, Decimal)):
                return val
            return str(val).lower()

        try:
            disagreements.sort(key=get_sort_value, reverse=reverse)
        except Exception:
            pass  # Fallback to unsorted if incomparable

    # 6. Reasons summary counts
    all_unfiltered = compare_records(a_dict, b_list, target_org=org_id, location_org_map=loc_org_map)
    reasons_summary = {}
    for d in all_unfiltered:
        reasons_summary[d["reason"]] = reasons_summary.get(d["reason"], 0) + 1

    return Response({
        "org": org_id,
        "total_disagreements": len(disagreements),
        "reasons_summary": reasons_summary,
        "disagreements": disagreements
    })
