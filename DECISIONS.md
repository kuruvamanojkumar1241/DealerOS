# Architectural & Algorithmic Decisions

## Decision: Compare System B value with System A's total_value
- Rejected: Comparing directly against System A's `base_value`.
- Why: System A records an initial base amount alongside an adjustment amount whose algebraic sum forms the finalized ledger balance (`total_value`). Reconciling against `base_value` would falsely flag every standard adjusted transaction as a value discrepancy.

## Decision: Normalize record references by extracting canonical numeric identifiers
- Rejected: Exact string matching or heavy fuzzy string matching algorithms.
- Why: System B contains dirty clerical variations including missing hyphens (`rec1034`), surrounding whitespace padding (` REC - 1070 `), and missing prefixes (`1112`). Extracting the digits via regex deterministically maps all valid references to canonical `REC-XXXX` identifiers without introducing false positive matches.

## Decision: Store empty and whitespace-only values as NULL (None)
- Rejected: Coercing blank values to `Decimal('0.00')`.
- Why: In double-entry bookkeeping and audit reconciliations, missing data is fundamentally distinct from a zero-balance entry. Defaulting missing values to zero corrupts audit accuracy; storing `None` correctly triggers an explicit `VALUE_MISMATCH` indicating missing transactional figures.

## Decision: Permit split entries in System B when their sum equals System A's total
- Rejected: Flagging all records with multiple System B entries unconditionally as duplicates.
- Why: Financial systems frequently settle single transactions across multiple installments or partial tranches (e.g., `REC-1055` split between `ENT/2026/4055` and `ENT/2026/4903`). Aggregating splits ensures legitimate multi-part entries reconcile cleanly, reserving `DUPLICATE_IN_B` exclusively for unaligned overages like `REC-1042`.

## Decision: Redact cross-tenant location metadata on the trap row (REC-1077)
- Rejected: Exposing the external tenant's location ID or silently dropping the mismatched record.
- Why: `REC-1077` belongs to `ORG-A` at `LOC-102` in System A but was misattributed to `LOC-201` (`ORG-B`) in System B. Completely hiding the row conceals a real discrepancy from the tenant, while leaking `LOC-201` breaches multi-tenant isolation; masking the external location ID preserves security while alerting the auditor.

## Decision: Flag VOIDED records with active System B entries as explicit disagreements
- Rejected: Silently discarding VOIDED records during CSV ingestion or filtering them out prior to comparison.
- Why: A transaction cancelled or voided in the primary system that still carries active entries in the secondary system represents an acute financial and operational hazard. Surfacing it under `VOIDED_RECORD` provides immediate visibility to prevent unauthorized settlement.

## Decision: Pure Python in-memory comparison engine with database-level tenant scoping
- Rejected: Implementing reconciliation entirely via complex SQL window functions / full outer joins.
- Why: Database queries are strictly scoped by tenant organization prior to comparison, while pure Python logic makes multi-entry aggregations, dirty format normalizations, and explanation formatting transparent, maintainable, and independently unit-testable.

## Decision: Dual interface support (React SPA and zero-dependency Django HTML fallback)
- Rejected: Building solely as an API or exclusively as a server-rendered monolith.
- Why: The modern Vite + React SPA delivers a responsive, interactive experience with dynamic search and sorting, while the Django server-rendered HTML template guarantees immediate operational usability without requiring a Node.js runtime.
