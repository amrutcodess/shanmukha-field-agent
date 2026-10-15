# HANDOFF (update this before you stop working)

## Baseline (verified 2026-10-15 on commit 0d57a3f)
- `npx tsc -b` passes (0 errors, code 0).
- `npx vitest run`: 20 tests in 5 suites pass (code 0).
- `npx oxlint`: 0 errors, 36 warnings (code 0).
- Branch: `v2` (Local only; never pushed to remote without owner instruction).
- Target Environment: Staging (`yexfigoxljwerignwvoj`). Production untouched.

## Owner decisions confirmed
- [x] Is the live v1 app being used by real agents right now? **NO** (No live field use; hotfix stays on staging and ships with v2 at cutover).
- [x] Does the production database hold real farmer data or test data? **TEST ONLY** (Agent `harish001` is the owner's test account).
- [x] Staging Supabase project created? **YES** (Ref: `yexfigoxljwerignwvoj`). Migrations 001-010 applied on staging.
- [ ] Vercel "Preview" environment variables point to staging (not production)? Awaiting owner confirmation before any push to remote `v2`.

## Phase status
| Phase | Backend slice | Frontend slice | Status |
|---|---|---|---|
| 0 Safety net and hotfix (A4) | Complete | Complete | ✅ **GATE PASSED** — 14/14 tests PASS on staging (commit 88cd071) |
| 1 Foundation, schema, RLS | Migrations 004-010 applied; 011 ready | Diagnostics & Tests ready | ⏳ **GATE 1 REMEDIATION (ROUND 2)** — Ready for staging run |
| 2 Admin basics | Scope defined (includes MFA, forced pw, agent audit) | Scaffolding | ⛔ **NOT STARTED** (Blocked until Gate 1 approved) |
| 3 Consent and onboarding | Claude Code | Antigravity | Not started |
| 4 Visit lifecycle | Claude Code (RPC-only writes) | Antigravity | Not started |
| 5 Photos | Claude Code (storage rules) | Antigravity | Not started |
| 6 Monitoring and reporting | Claude Code (views, RPCs) | Antigravity | Not started |
| 7 Android | Claude Code (review) | Antigravity | Not started |
| 8 Release readiness and cutover | Claude Code (security review) | Antigravity (docs) | Not started |

---

## Gate 1 Round 2 Remediation Details

### 1. Test Harness Root Causes & Fixes in `supabase/tests/database_test.sql`
- **GUC Abort Isolation**: When an inner `BEGIN ... EXCEPTION` block catches an exception, PostgreSQL reverts GUC settings made inside the block. Every test block now explicitly sets `role`, `request.jwt.claim.sub`, and `request.jwt.claims` at its start.
- **Trigger Text Matching**: Tests 3, 4, 5 now match on `'immutable append-only ledger'` instead of legacy text.
- **Constraint Visibility**: Tests 6 (composite FK), 7 (unique in-progress visit), and 8 (`btree_gist` overlap) run as `postgres` with admin claims (`sub = v_admin_id`) so visit triggers do not mask constraint violations. Exact constraint names are asserted (`fk_visit_purchase_product_size`, `unique_agent_in_progress_visit`, `no_overlapping_agent_visits`).
- **Test 9**: Runs as Agent A on Agent A's own in-progress visit with `visit_services` absent, asserting `Must choose at least one value-added service`.
- **Zero Bare Passes**: Every expected error test strictly verifies either the exact constraint name or specific error message. Any mismatch records `FAIL`.
- **Single Result Grid**: Removed trailing summary query so Supabase SQL editor displays the complete single test results table.

### 2. Gaps Addressed Forward-Only in `011_gate1_fixes_2.sql`
- **Gap A (Server-authoritative Visit Completion Times)**:
  In `enforce_farm_visit_authoritative_times()`, non-admin transitions to `completed` unconditionally overwrite `new.ended_at := now()` and compute `new.duration_seconds := round(extract(epoch from (new.ended_at - new.started_at)))::int`. Standalone changes to `ended_at` or `duration_seconds` outside of completion are strictly rejected.
- **Gap B (Views Write Privileges Revocation)**:
  Explicitly revoked all write permissions (`INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`) on `visits_full`, `farm_visits_full`, `farmers_full`, `farmers_masked`, `farmers_viewer_masked`, and `farmers_full_masked` from `authenticated`, `anon`, and `public`, granting `SELECT` only.

---

## Staging Execution Instructions

Please execute in the following exact order in the **Staging SQL Editor**:

1. **Apply Migration 011**:
   Run `supabase/migrations/011_gate1_fixes_2.sql`.

2. **Run Comprehensive Test Suite**:
   Run `supabase/tests/database_test.sql`. It outputs exactly one result grid and rolls back at the end.

---

## Log
(newest first: date, tool, what was done, test results, what the next tool must know)

### 2026-10-15 — Antigravity (Gate 1 Round 2 Fixes)
- Addressed test harness isolation bugs by adding explicit per-block GUC configuration.
- Aligned consent trigger error assertions to match `immutable append-only ledger`.
- Corrected constraint tests (6, 7, 8) to run with admin context and assert exact constraint names.
- Created `011_gate1_fixes_2.sql` resolving Gap A (server-calculated visit completion times) and Gap B (revocation of write privileges on all views).
- Added diagnostic script `scripts/test-gaps-fail.sql` confirming Gap A and Gap B fail on staging prior to 011.
- Updated `database_test.sql` to output a single result grid and eliminated all bare error catches.
- Updated `DECISIONS.md` and `MIGRATION_PLAN.md`.
- Ran and verified local checks: `npx tsc -b` (0 errors), `npx vitest run` (20/20 passed), `npx oxlint` (0 errors, 36 warnings).
