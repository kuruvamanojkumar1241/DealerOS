# DealerOS – Financial Ledger Reconciliation Engine

A production-grade, multi-tenant financial reconciliation system built to detect, categorize, and explain discrepancies between internal transactional ledgers (**System A**) and external clearinghouse/partner records (**System B**).

---

## 📌 Submission & Repository Links

- **GitHub Repository**: [https://github.com/kuruvamanojkumar1241/DealerOS](https://github.com/kuruvamanojkumar1241/DealerOS)
- **Source Code Archive**: [`dealeros.zip`](https://github.com/kuruvamanojkumar1241/DealerOS/blob/main/dealeros.zip) (located in repo root, clean source without `node_modules`)
- **Git Commit Compliance**: 100% individual commits by repository owner, zero AI trailers, zero co-authors.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Python**: 3.11+ (tested on Python 3.11 – 3.14)
- **Node.js**: 18+ & npm
- Git

---

### 2. Backend Setup (Django & REST API)

Open your terminal in the project root:

```bash
# 1. Navigate to backend directory
cd backend

# 2. Create and activate a virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run database migrations
python manage.py migrate

# 5. Ingest raw CSV ledger files (locations.csv, system_a.csv, system_b.csv)
python manage.py import_data

# 6. Run the complete test suite (21 unit, integration & isolation tests)
python manage.py test reconcile

# 7. Start the backend development server
python manage.py runserver
```

**Backend Endpoints Available:**
- Server-Rendered HTML Dashboard: `http://localhost:8000/reconcile/?org=ORG-A`
- Disagreements REST API: `http://localhost:8000/api/disagreements/?org=ORG-A`
- Organizations REST API: `http://localhost:8000/api/organizations/`

---

### 3. Frontend Setup (React + Vite Dashboard)

Open a second terminal in the project root:

```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start the Vite development server
npm run dev
```

Open your browser at: **`http://localhost:5173/`**

To test production build:
```bash
npm run build
```

---

## 🧠 Core Reconciliation Engine

The reconciliation logic (`backend/reconcile/compare.py`) runs in pure Python for transparency and deterministic testing, operating strictly within a tenant's database partition.

### Disagreement Categorization Rules

| Disagreement Category | Description | Primary Example |
|---|---|---|
| `VALUE_MISMATCH` | System B value differs from System A's `total_value` (`base + adjustment`), or System B has an unrecorded empty string. | `REC-1006` (value diff)<br>`REC-1050` (blank in B) |
| `MISSING_IN_B` | Transaction exists in System A with zero matching entries in System B. | `REC-1073` |
| `ORPHAN_IN_B` | System B record references an identifier that does not exist in System A. | `ENT/2026/4901` (`REC-1999`) |
| `DUPLICATE_IN_B` | Multiple entries in System B reference the same System A record, and their sum does **not** equal System A's total. | `REC-1042` (`ENT/2026/4042` + `ENT/2026/4902`) |
| `LOCATION_MISMATCH` | Transaction location differs between System A and System B. | `REC-1065`, `REC-1077` |
| `DATE_MISMATCH` | Effective event date differs between System A and System B. | `REC-1014` |
| `VOIDED_RECORD` | Record is marked `VOIDED` in System A but still carries an active entry in System B. | `REC-1019` |

---

### 🛡️ Real-World Edge Case Handling

1. **Split Payments vs. Duplicates (`REC-1055`)**:
   - `REC-1055` has two entries in System B (`ENT/2026/4055` for `71,950.93` and `ENT/2026/4903` for `107,926.39`).
   - Their sum equals `179,877.32`, exactly matching System A's `total_value`.
   - **Resolution**: The engine recognizes valid multi-tranche settlement splits and classifies them as **clean/reconciled**, reserving `DUPLICATE_IN_B` only for erroneous overages (e.g., `REC-1042`).

2. **Clerical Reference Normalization**:
   - System B contains dirty clerical variations: missing hyphens (`rec1034`), space padding (` REC - 1070 `), and missing prefixes (`1112`).
   - **Resolution**: A deterministic regex parser extracts the canonical key `REC-XXXX`, eliminating false "missing" discrepancies while preserving data fidelity.

3. **Missing Values vs. Zero Balances (`ENT/2026/4050`)**:
   - `ENT/2026/4050` contains an empty string (`""`) for value.
   - **Resolution**: Stored as SQL `NULL` (`None`). The engine treats missing figures as an explicit `VALUE_MISMATCH` and never falsely coerces them to `0.00`.

4. **Multi-Tenant Security Boundary & Redaction Trap (`REC-1077`)**:
   - `REC-1077` belongs to `ORG-A` (`LOC-102`) in System A, but was misattributed to `LOC-201` (`ORG-B`) in System B.
   - **Resolution**: To prevent tenant data leaks while alerting the auditor, the external location ID is redacted as `[REDACTED_CROSS_TENANT_LOCATION]`.

---

## 🔒 Multi-Tenant Data Isolation

- **Query-Level Scoping**: Every API request and comparison requires tenant context (`?org=ORG-A` or `?org=ORG-B`).
- **Database Partitioning**: All queries to `SystemARecord` filter via `location__org_id=tenant_org_id`.
- **Orphan Scoping**: Entries in System B without a System A record are attributed to the tenant owning the entry's `location_id`.
- **Automated Verification**: `tests_tenant_isolation.py` contains 4 explicit boundary verification tests proving zero cross-tenant leakage.

---

## 📁 Repository Architecture

```
DealerOS/
├── backend/
│   ├── config/                     # Django core routing & settings
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── __init__.py             # Django 6.1 / DRF regex compatibility shim
│   ├── data/                       # Source CSV ledger datasets
│   │   ├── locations.csv           # 5 Locations across ORG-A and ORG-B
│   │   ├── system_a.csv            # 120 Transactions in System A
│   │   └── system_b.csv            # 121 Entries in System B
│   ├── reconcile/                  # Reconciliation application
│   │   ├── models.py               # Location, SystemARecord, SystemBEntry
│   │   ├── importer.py             # Idempotent CSV ingestion pipeline
│   │   ├── compare.py              # Pure Python comparison engine
│   │   ├── views.py                # REST API & server-rendered HTML views
│   │   ├── tests.py                # 17 core engine & API unit tests
│   │   ├── tests_tenant_isolation.py # 4 explicit multi-tenant isolation tests
│   │   └── templates/reconcile/    # Accessible server-rendered HTML dashboard
│   ├── manage.py
│   └── requirements.txt
├── frontend/                       # React 18 + Vite SPA
│   ├── src/
│   │   ├── App.jsx                 # Dashboard, filter pills, interactive views
│   │   ├── index.css               # Clean responsive theme & mobile drawer
│   │   ├── main.jsx
│   │   └── data/                   # Embedded datasets for preview mode
│   ├── package.json
│   └── vite.config.js
├── dealeros.zip                    # Compressed project source code archive
├── DECISIONS.md                    # Detailed log of architectural decisions
├── notes_on_data.md                # Raw data anomaly analysis & profiling
└── README.md
```

---

## 🧪 Testing & Verification

Run the test suite from the `backend/` directory:

```bash
python manage.py test reconcile
```

**Test Coverage Summary:**
- **21 Total Automated Tests**:
  - `TestCSVImporter` (3 tests): Verifies idempotent ingestion, empty string parsing, and reference canonicalization.
  - `TestReconciliationLogic` (7 tests): Validates split resolution, value mismatch, orphan detection, duplicate flags, date diffs, voided active status.
  - `TestReconciliationViews` (7 tests): Validates JSON REST API serialization and server-rendered HTML table responses.
  - `TestTenantIsolation` (4 tests): Proves complete data isolation between ORG-A and ORG-B.

---

## 📝 Design Decisions & Trade-offs

1. **`total_value` vs `base_value`**: Reconciles against System A's finalized ledger balance (`base + adjustment`). Comparing against `base` alone would produce 100% false-positive discrepancies on adjusted rows.
2. **Deterministic Regex Normalization**: Regular expressions normalize dirty clerical inputs without risking false matches from fuzzy matching.
3. **Pure Python Engine with Database-Level Tenant Scoping**: Business logic remains transparent, composable, and independently testable without database lock-in.

*(See [`DECISIONS.md`](./DECISIONS.md) for full architectural rationale).*

---

## 💡 Technical Reflection & Evaluation

### a. One thing the AI agent got wrong and how you caught it
During initial ingestion logic scaffolding, the AI assistant suggested coercing missing numeric strings to `Decimal('0.00')` (`row.get('recorded_value') or Decimal('0.00')`). 

I caught this during dataset profiling of `ENT/2026/4050`. In accounting and financial audits, a missing value is fundamentally different from a zero-dollar entry. Coercing it to `0.00` corrupts financial reports and masks missing figures as balanced items. I corrected the model to use `null=True, blank=True` and updated the parser to store `None`, which properly triggers an explicit `VALUE_MISMATCH`.

Additionally, the agent hit an `ImportError` on Django 6.1 with DRF 3.17 (`cc_delim_re` removal from `django.utils.cache`). I diagnosed the upstream breaking change and placed a backward-compatible shim in `backend/config/__init__.py`.

### b. The part you are least confident about and why
The real-world operational handling of the cross-tenant trap row (`REC-1077`). System A places this transaction in `ORG-A` (`LOC-102`), but System B records it in `LOC-201` (`ORG-B`).

While redacting the external location ID (`[REDACTED_CROSS_TENANT_LOCATION]`) guarantees that `ORG-A` cannot glean private location identifiers belonging to `ORG-B`, in a commercial enterprise clearinghouse, cross-tenant collisions require an out-of-band administrative arbitration queue or escrow quarantine rather than simple in-view redaction.

### c. If you had a second day, what would you fix first?
1. **Streaming & Asynchronous Queueing**: Migrate from synchronous in-memory comparison to streaming chunk processing using Celery and Redis to handle multi-gigabyte files.
2. **Audit & Dispute Workflow**: Build an interactive resolution interface allowing auditors to mark items as "Reviewed", "Accepted Split", or "Escalated", backed by an immutable audit trail.
3. **Database-Level Composite Window Functions**: Implement SQL window aggregations and composite indexes directly in SQLite/PostgreSQL to perform preliminary groupings before Python processing.
