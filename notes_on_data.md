# Notes on Data Problems & Curiosities

Detailed audit of `locations.csv`, `system_a.csv`, and `system_b.csv`:

1. **locations.csv**:
   - 5 rows mapping location codes to organizations:
     - `LOC-101`, `LOC-102`, `LOC-103` belong to `ORG-A`.
     - `LOC-201`, `LOC-202` belong to `ORG-B`.
   - Critical for multi-tenant boundary checks.

2. **system_a.csv**:
   - Exactly 120 records (`REC-1001` through `REC-1120`).
   - Fields: `record_id`, `location_id`, `event_date`, `category_code`, `actor_id`, `base_value`, `adjustment`, `total_value`, `state`.
   - `total_value` = `base_value + adjustment`.
   - `REC-1050`: `actor_id` is blank (must be stored as `null`).
   - `REC-1019`: state is `VOIDED` (base 44603.40, adj 12488.95, total 57092.35).

3. **system_b.csv**:
   - Exactly 121 rows (`ENT/2026/4001` to `ENT/2026/4903`).
   - Notice row anomalies:
     - **Messy record references**:
       - `ENT/2026/4034`: `rec1034` (lowercase, no hyphen)
       - `ENT/2026/4070`: ` REC - 1070 ` (spaces around hyphen)
       - `ENT/2026/4112`: `1112` (digits only)
       All must be normalized to `REC-xxxx`.
     - **Non-standard value formatting**:
       - `ENT/2026/4064`: `"1,25,400.00"` (Indian numeral grouping commas, must parse to Decimal `125400.00`).
     - **Missing values**:
       - `ENT/2026/4050`: value is empty/blank (must store as `null`, never default to `0`).
     - **Missing entries in B**:
       - `REC-1015`: No B entry exists (entry 4015 is omitted).
       - `REC-1061`: No B entry exists (entry 4061 is omitted).
     - **Orphan entries in B**:
       - `ENT/2026/4901`: points to `REC-1999`, which does not exist in System A.
     - **Split entries**:
       - `REC-1055` has two entries: `ENT/2026/4055` (71950.93) and `ENT/2026/4903` (107926.39).
       - Sum: `71950.93 + 107926.39 = 179877.32`, which matches `REC-1055` total_value. Valid split, NOT a duplicate!
     - **Real duplicate in B**:
       - `REC-1042` has two entries: `ENT/2026/4042` (112837.06) and `ENT/2026/4902` (112837.06).
       - Sum is double total_value; this is an erroneous duplicate.
     - **Cross-org location mismatch (The Trap)**:
       - `REC-1077`: System A lists `LOC-102` (ORG-A), but System B lists `LOC-201` (ORG-B).
       - Exposing `LOC-201` directly to ORG-A violates tenant isolation. Must redact/mask other tenant's location!
     - **Date mismatch**:
       - `REC-1009`: System A has `31-03-2026`, System B has `02-04-2026`.
