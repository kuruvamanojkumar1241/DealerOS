# DealerOS – Financial Ledger Reconciliation Engine

A high-integrity multi-tenant reconciliation system designed to identify and categorize ledger disagreements between two independent transactional record-keeping systems: **System A** (internal ERP/ledger) and **System B** (external partner/clearing records).

---

## 1. Quick Start

### Prerequisites
- **Python**: 3.11+ (verified up to Python 3.14)
- **Node.js**: 18+ (for frontend development/build)
- **Virtual Environment**: recommended

### Setup Backend

1. Navigate to the backend directory:
   ```bash
   cd dealeros/backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run database migrations:
   ```bash
   python manage.py migrate
   ```

5. Import the raw CSV ledger datasets:
   ```bash
   python manage.py import_data
   ```
   *Note: This command is fully idempotent and safely ingests `locations.csv`, `system_a.csv`, and `system_b.csv`.*

6. Run the test suite:
   ```bash
   python manage.py test
   ```

7. Start the backend development server:
   ```bash
   python manage.py runserver
   ```
   - Server-rendered HTML dashboard: `http://localhost:8000/reconcile/`
   - REST API endpoints: `http://localhost:8000/api/disagreements/?org=ORG-A`

---

### Setup Frontend (React SPA)

1. Navigate to the frontend directory:
   ```bash
   cd dealeros/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the frontend development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173/` in your browser.

4. To build for production:
   ```bash
   npm run build
   ```

---

## 2. System Architecture

```
dealeros/
├── backend/
│   ├── config/                     # Django core settings & routing
│   │   ├── __init__.py             # Django 6.1 / DRF compatibility shims
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── data/                       # Raw source CSV datasets
│   │   ├── locations.csv           # 5 Locations across ORG-A and ORG-B
│   │   ├── system_a.csv            # 120 Transactions in System A
│   │   └── system_b.csv            # 121 Entries in System B
│   ├── reconcile/                  # Core reconciliation domain app
│   │   ├── models.py               # Location, SystemARecord, SystemBEntry
│   │   ├── importer.py             # Resilient, idempotent CSV parser
│   │   ├── compare.py              # Pure Python comparison engine
│   │   ├── views.py                # REST API & server-rendered HTML views
│   │   ├── serializers.py          # DRF serializers
│   │   ├── templates/reconcile/    # Accessible Django HTML table view
│   │   ├── tests.py                # Core unit & API integration tests
│   │   ├── tests_tenant_isolation.py # Explicit multi-tenant boundary tests
│   │   └── management/commands/    # CLI management commands (import_data)
│   ├── manage.py
│   └── requirements.txt
├── frontend/                       # Modern React + Vite SPA
│   ├── src/
│   │   ├── App.jsx                 # Dashboard with metrics, filters & table
│   │   ├── App.css                 # Clean responsive design styling
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── DECISIONS.md                    # Structured architectural log
├── notes_on_data.md                # Data anomalies and inspection findings
└── README.md
```

---

## 3. Core Reconciliation Rules

The pure Python comparison engine (`reconcile/compare.py`) processes records strictly scoped by tenant organization and categorizes disagreements into the following reasons:

| Disagreement Reason | Description | Example Case |
|---|---|---|
| `MISSING_IN_B` | Record exists in System A but has zero matching entries in System B. | `REC-1073` |
| `ORPHAN_IN_B` | Entry exists in System B referencing a record ID absent in System A. | `ENT/2026/4901` (`REC-1999`) |
| `DUPLICATE_IN_B` | Multiple entries exist in System B for one System A record, and their sum does not equal System A's total. | `REC-1042` (`ENT/2026/4042` + `ENT/2026/4902`) |
| `VALUE_MISMATCH` | System B value differs from System A's `total_value` (`base + adjustment`), or System B value is empty/NULL. | `REC-1006` (value diff) & `REC-1050` (blank in B) |
| `LOCATION_MISMATCH` | Location metadata diverges between System A and System B. | `REC-1065`, `REC-1077` |
| `DATE_MISMATCH` | Transaction event date differs between System A and System B. | `REC-1014` |
| `VOIDED_RECORD` | Record is marked `VOIDED` in System A but still carries an active entry in System B. | `REC-1019` |

### Special Edge-Case Handling:
1. **Split Payments vs. Duplicates**: `REC-1055` has two entries in System B (`ENT/2026/4055` for 71,950.93 and `ENT/2026/4903` for 107,926.39) that sum to exactly `179,877.32` (`total_value` in A). The engine recognizes this as a valid split transaction and does **not** flag it as a duplicate.
2. **Reference Normalization**: Dirty references in System B such as `rec1034`, ` REC - 1070 `, and `1112` are normalized deterministically to canonical keys (`REC-1034`, `REC-1070`, `REC-1112`).
3. **No Coercion of Blank Values**: `ENT/2026/4050` contains an empty value string. It is stored as `None` (SQL NULL) and classified as a `VALUE_MISMATCH` rather than coerced to `0.00`.
4. **Tenant Isolation & Redaction**: `REC-1077` is an `ORG-A` transaction recorded at `LOC-102` in System A, but recorded at `LOC-201` (`ORG-B`) in System B. To prevent data leakage while alerting the auditor, the external location metadata is redacted as `[REDACTED_CROSS_TENANT_LOCATION]`.

---

## 4. Multi-Tenant Isolation

- Every API endpoint and view requires a tenant context (`?org=ORG-A` or `?org=ORG-B`).
- All queries to `SystemARecord` filter via `location__org_id=tenant_org_id`.
- Orphan entries in System B are attributed to the tenant owning the entry's `location_id`.
- The test suite includes 4 explicit tests in `tests_tenant_isolation.py` proving zero cross-tenant leakage.

---

## 5. Deliberately Omitted Features

To keep the solution focused, maintainable, and aligned with standard assessment boundaries:
- **Authentication/SSO**: Multi-tenancy is demonstrated via scoped tenant parameterization rather than an OAuth/JWT provider.
- **Asynchronous Task Queues (Celery/Redis)**: Datasets of 100–10,000 rows run synchronously in milliseconds. For production scale (millions of rows), this would be offloaded to background workers.
- **Heavy Frontend Component Libraries**: Built using vanilla React and modern CSS for transparency, performance, and zero dependency overhead.

---

## 6. How AI Was Used & Reflective Evaluation

AI tooling was utilized as a pair-programming collaborator for rapid data profiling, regex pattern synthesis, boilerplate test generation, and frontend component drafting. All logic, architecture, and verification were steered and confirmed through rigorous testing.

### Mandatory Questions:

#### a. One thing the AI agent got wrong and how you caught it
During initial data ingestion logic generation, the AI agent suggested defaulting empty numeric strings to `Decimal('0.00')` (`row.get('recorded_value') or Decimal('0.00')`). 

I caught this during the CSV profiling of `ENT/2026/4050`. In accounting and financial audit systems, an unrecorded or missing value is fundamentally different from a zero-dollar entry. Coercing it to `0.00` would corrupt audit reporting, skew totals, and mask a missing figure as a deliberate zero-sum transaction. I corrected this by modifying the model field to allow `null=True, blank=True` and ensuring the importer persists unrecorded values as `None`.

Additionally, the agent initially hit a runtime `ImportError` on Django 6.1 with DRF 3.17 (`cc_delim_re` removal from `django.utils.cache`). I diagnosed the framework mismatch and introduced a minimal backward-compatibility regex shim in the Django configuration layer.

#### b. The part you are least confident about and why
The handling of the cross-tenant trap row (`REC-1077`). In this case, System A places the transaction in `ORG-A` (`LOC-102`), but System B records it in `LOC-201` (`ORG-B`). 

While redacting the external location ID (`[REDACTED_CROSS_TENANT_LOCATION]`) guarantees that `ORG-A` cannot glean internal location identifiers belonging to `ORG-B`, in a real-world banking clearinghouse or automotive dealership network, cross-entity ledger collisions often require an out-of-band arbitration queue or escrow quarantine rather than simple metadata redaction in the tenant's view.

#### c. If you had a second day, what would you fix first?
1. **Streaming CSV Ingestion & Chunked Reconciliation**: Migrate from synchronous in-memory reconciliation to streaming chunk processing with Django database transactions and a Celery background worker queue to handle multi-gigabyte files.
2. **Audit Trails & Dispute Resolution Workflow**: Add an interactive resolution mechanism allowing operators to mark disagreements as "Reviewed", "Accepted Split", or "Disputed", with full immutable audit logging tracking who resolved each item and why.
3. **Database-Level Window Functions for Million-Row Reconciliation**: Implement composite SQL index strategies and SQL window queries to perform pre-filtering directly in SQLite/PostgreSQL prior to engine processing.
