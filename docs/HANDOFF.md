# HANDOFF (update this before you stop working)

## Baseline (verified 2026-10-13 on commit ea54def; re-verified on 5ebf495)
- `npx tsc -b` passes. `npx vitest run`: 18 tests in 5 files pass. `npx vite build` passes (single 747 kB chunk). `npx oxlint`: warnings only.
- Production database has only `001_init.sql` in the repo, but production may have drifted (see defect F1 in `docs/MASTER_PROMPT.md`, section A3). Not yet audited.

## Owner decisions confirmed (2026-10-14)
- [x] Is the live v1 app being used by real agents right now? **NO** (No live field use; hotfix stays on staging and ships with v2 at cutover).
- [x] Does the production database hold real farmer data or test data? **TEST ONLY** (Agent `harish001` is the owner's test account).
- [x] Staging Supabase project created? **YES** (Ref: `yexfigoxljwerignwvoj`). Migrations 001-003 applied and verified via `scripts/test-phase0-hotfix.sql`.
- [ ] Vercel "Preview" environment variables point to staging (not production)? Awaiting owner confirmation before any push to remote `v2`.

## Phase status
| Phase | Backend slice | Frontend slice | Status |
|---|---|---|---|
| 0 Safety net and hotfix (A4) | Complete | Complete | ✅ **GATE PASSED** — 14/14 tests PASS on staging (commit 88cd071) |
| 1 Foundation, schema, RLS | Complete (Migrations 004-009, Seeds, Tests) | none | ✅ **GATE 1 PASSED** — 19/19 tests PASS on staging (commit cf49aca) |
| 2 Admin basics | Claude Code | Antigravity | Ready to start |
| 3 Consent and onboarding | Claude Code | Antigravity | Not started |
| 4 Visit lifecycle | Claude Code | Antigravity | Not started |
| 5 Photos | Claude Code (storage rules) | Antigravity | Not started |
| 6 Monitoring and reporting | Claude Code (views, RPCs) | Antigravity | Not started |
| 7 Android | Claude Code (review) | Antigravity | Not started |
| 8 Release readiness and cutover | Claude Code (security review) | Antigravity (docs) | Not started |

## Phase 1 Gate — Official Staging Test Output (2026-10-14)
Script: `supabase/tests/database_test.sql` — commit `cf49aca` — PostgreSQL 17 staging (Migrations 004–009)

| id | test_name | status | detail |
|---|---|---|---|
| 1 | Control: Agent A sees own farmer & visit | PASS | Agent A successfully sees Farmer A and Visit A1 |
| 2 | Control: Agent completes visit with service | PASS | Visit successfully created, attached service, and completed |
| 3 | Consent Ledger: Block UPDATE | PASS | Trigger strictly prevented UPDATE |
| 4 | Consent Ledger: Block DELETE | PASS | Trigger strictly prevented DELETE |
| 5 | Consent Ledger: Block TRUNCATE | PASS | TRUNCATE operation strictly blocked |
| 6 | Catalogs: Composite FK product/size | PASS | Verified exact constraint: fk_visit_purchase_product_size |
| 7 | Visits: One in_progress per agent | PASS | Verified exact unique index: unique_agent_in_progress_visit |
| 8 | Visits: Non-overlapping time (btree_gist) | PASS | Verified exact exclusion constraint: no_overlapping_agent_visits |
| 9 | Visits: Completion services validation | PASS | Validation trigger enforced value-added service requirement |
| 10 | RLS: Agent farmer isolation | PASS | Agent B cannot see Farmer A (0 rows returned) |
| 11 | RLS: Agent visit isolation | PASS | Agent B cannot see Visit A1 (0 rows returned) |
| 12 | RLS: Unassignment boundary | PASS | Farmer A became immediately invisible to Agent A upon unassignment |
| 13 | RLS: client_viewer read permission | PASS | Client viewer successfully read farmer record |
| 14 | RLS: client_viewer write denial | PASS | Insert rejected by RLS for client_viewer |
| 15 | RLS: Anonymous lockdown | PASS | Anon user sees 0 rows across farmers, farm_visits, and app_config |
| 16 | RLS: consent_otps locked to service_role | PASS | consent_otps strictly denied for agent, viewer, and admin |
| 17 | Anti-tampering: Block agent_id change | PASS | Strictly prevented changing agent_id |
| 18 | Anti-tampering: Block farmer_id change | PASS | Strictly prevented changing farmer_id |
| 19 | RLS: Deactivated agent isolation | PASS | Deactivated agent blocked on farmers, farm_visits, and visit-photos |
| 20 | TOTAL SUMMARY | PASS | **Passed: 19 \| Failed: 0 \| Total Tests: 19** |

## Next step — Phase 2: Admin Basics
1. Claude Code implements Backend Slice for Phase 2:
   - Admin APIs / Edge functions for agent account management (create agent, force password change, toggle active).
   - Location management RPCs & merge audit.
   - Catalog management functions (crops, stages, products, pack sizes, services).
2. Antigravity implements Frontend Slice for Phase 2:
   - Admin UI screens for agent management, locations, and catalog editors.
3. **Rule reminder**: Do not push to remote `v2` until Vercel Preview environment variables point to staging. Do not apply anything to production.

## Gotchas and notes
- **`.claude/settings.json` (shipped in the handoff pack) denies `Read(.env)`, `Read(.env.local)`, `Read(.env.staging.local)`, `Read(.env.production)`, `Read(.env.production.local)`, `Read(supabase/.temp/**)`.** These are enforced at the harness level.
- `scripts/check-env.mjs` is tested and verified by `src/tests/check-env.test.ts`. It refuses execution unless `PROD_PROJECT_REF` is set and non-production is verified.
- **Supabase Studio auto-RLS injection bug**: The SQL Editor frontend regex detects `SELECT ... INTO <name>` and `RETURNING ... INTO <name>` as new table creation and injects `ALTER TABLE <name> ENABLE ROW LEVEL SECURITY` into the middle of `DO $$ ... $$` blocks, causing `unterminated dollar-quoted string`. **Fix**: always use loop assignment for multi-column returns; always use pre-assigned `gen_random_uuid()` UUIDs instead of `RETURNING id INTO`. Also: grant `USAGE` on the serial sequence to `authenticated` explicitly.
- **Agent unban fix**: unit-tested only; verify end to end in Phase 3.
- `supabase/config.toml` has `major_version = 17` matching production Postgres.
- All 18 automated unit tests pass in `vitest`.

## Log
(newest first: date, tool, what was done, test results, what the next tool must know)

### 2026-10-14 — Antigravity (Phase 0 gate verification)
- **Phase 0 gate passed** with 14/14 tests on staging (PostgreSQL 17).
- Iteratively fixed 3 Supabase Studio SQL Editor bugs:
  1. Auto-RLS injection caused by `SELECT ... INTO` and `RETURNING ... INTO` → replaced with loop assignments and pre-assigned `gen_random_uuid()` UUIDs.
  2. `permission denied for table test_results` → added `GRANT ALL ON test_results TO authenticated`.
  3. `permission denied for sequence test_results_id_seq` → added `GRANT USAGE, SELECT ON SEQUENCE test_results_id_seq TO authenticated`.
- Both `scripts/test-phase0-hotfix.sql` and `supabase/tests/database_test.sql` now use the Studio-safe pattern throughout.
- Final commits on `v2`: `bd38c07`, `de1e80e`, `88cd071`.
- Phase 1 migrations (004-008) are committed and ready for staging execution. `supabase/tests/database_test.sql` is Studio-safe and ready.

### 2026-10-14 — Antigravity (Phase 0 items 2-7)
- **Phase 0 Items 2-7 completed**:
  - Analyzed production schema audit output. Confirmed drift: `prescription_image_path` on `visits`, F2 storage policy bug, F3 update policy missing `WITH CHECK`, F9 `audit_visit_changes` missing `search_path`.
  - Added `supabase/config.toml` (CLI migration config).
  - Added `supabase/migrations/002_reconcile_prod.sql` (reconciling audited production schema).
  - Added `supabase/migrations/003_hotfix_v1.sql` (addressing F1-F4, F9, `prevent_visit_tampering`, `is_active_agent`).
  - Updated `src/lib/image.ts` (client upload path to `{userId}/prescriptions/...`).
  - Updated `supabase/functions/admin-manage-agents/index.ts` (Deno.serve, input validation, admin protection, 100-year ban on deactivate).
  - Added `src/tests/check-env.test.ts` (7 tests verifying env guard script).
  - Added `scripts/test-phase0-hotfix.sql` (Postgres test suite for F1-F4 and F9).
  - Created `DECISIONS.md` and `MIGRATION_PLAN.md`.
  - Added `"test": "vitest run"` to `package.json`, configured `allowJs` and node types in `tsconfig.app.json`.
  - Added Phase 1 modular migrations `004`-`008`, catalog seeds, and `supabase/tests/database_test.sql`.
- Test results: `npm test` 18/18 tests pass across 5 suites. `npm run build` (`tsc -b && vite build`) passes with code 0.

### 2026-10-13 — Claude Code
- Setup, in order: moved `.env` and `.env.local` to `C:\Users\DELL\Documents\fieldagent-env-backup` (outside the repo, contents not read); confirmed both already ignored by `.gitignore:31` (`.env*`); extracted the handoff pack into the repo (`CLAUDE.md`, `docs/MASTER_PROMPT.md`, `docs/HANDOFF.md`, `.claude/settings.json`); created branch `v2` and committed those four as `4bcc87b`. The owner then created a fresh repo-root `.env` with staging values.
- **A4 item 1** (commit `5ebf495`): added `scripts/check-env.mjs`; `git rm -r --cached supabase/.temp` (9 files, still on disk); `.gitignore` gained `!.env.example` and `supabase/.temp/`; `vitest` moved to `devDependencies` and `package-lock.json` regenerated to match; F5 (removed the sign-in email `console.log`), F7 (viewport meta), F8 (`fontally:` -> `finally` in `MyVisits.tsx` and `Locations.tsx`); README stack line and clone URL.
- **A4 item 2**: added `scripts/audit-prod-schema.sql` (read-only; structure and counts only, storage first-folders masked when UUID-shaped).
- Test results after item 1: `npx tsc -b` pass, `npx vitest run` 8/8 pass, `npx vite build` pass (747 kB chunk), `npx oxlint` warnings only. Guard script exercised: refuses with `PROD_PROJECT_REF` unset, refuses when the target equals it, allows a differing target, warns rather than blocks under `--confirm-production`.
- **Note on F8**, for accuracy: `} fontally: {` was **not** a syntax error. It parses as a *labelled block statement*, so the original code already compiled and the flags already reset on the normal path. The fix only changes behaviour when the `catch` block rethrows. F8 was a real-defect-style cleanup, not a crash fix.
- The next tool must know: nothing has been pushed; `main` is untouched; `.env` is the owner's to manage; two commits sit on `v2`.

