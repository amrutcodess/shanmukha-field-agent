# HANDOFF (update this before you stop working)

## Baseline (verified 2026-10-13 on commit ea54def; re-verified on 5ebf495)
- `npx tsc -b` passes. `npx vitest run`: 8 tests in 3 files pass. `npx vite build` passes (single 747 kB chunk). `npx oxlint`: warnings only.
- Production database has only `001_init.sql` in the repo, but production may have drifted (see defect F1 in `docs/MASTER_PROMPT.md`, section A3). Not yet audited.

## Owner decisions confirmed (2026-10-14)
- [x] Is the live v1 app being used by real agents right now? **NO** (No live field use; hotfix stays on staging and ships with v2 at cutover).
- [x] Does the production database hold real farmer data or test data? **TEST ONLY** (Agent `harish001` is the owner's test account).
- [x] Staging Supabase project created? **YES** (Ref: `yexfigoxljwerignwvoj`). Migrations 001-003 applied and verified via `scripts/test-phase0-hotfix.sql`.
- [ ] Vercel "Preview" environment variables point to staging (not production)? Awaiting owner confirmation before any push to remote `v2`.

## Phase status
| Phase | Backend slice | Frontend slice | Status |
|---|---|---|---|
| 0 Safety net and hotfix (A4) | Complete | Complete | Completed & verified on staging |
| 1 Foundation, schema, RLS | Claude Code / Antigravity | none | Queued (awaiting Gate 1 approval) |
| 2 Admin basics | Claude Code | Antigravity | Not started |
| 3 Consent and onboarding | Claude Code | Antigravity | Not started |
| 4 Visit lifecycle | Claude Code | Antigravity | Not started |
| 5 Photos | Claude Code (storage rules) | Antigravity | Not started |
| 6 Monitoring and reporting | Claude Code (views, RPCs) | Antigravity | Not started |
| 7 Android | Claude Code (review) | Antigravity | Not started |
| 8 Release readiness and cutover | Claude Code (security review) | Antigravity (docs) | Not started |

## Next step
**Awaiting Gate 1 Approval.**
- Production Postgres version confirmed (via `SHOW server_version;`).
- Once Gate 1 is approved by the owner, start **Phase 1: Foundation, Schema & RLS**:
  - Write `supabase/migrations/004_v2_foundation.sql` (parallel tables: `farmers`, `farmer_assignments`, `crop_cycles`, `farm_visits`, `visit_photos`, `visit_track_points`, `visit_services`, `visit_purchase_items`, `app_events`, `consent_otps`, `farmer_consents`, `audit_log`, `app_config`, `crop_stages`, `product_sizes`, `value_added_services`; `btree_gist` non-overlapping exclusion constraint; append-only consent trigger).
  - Write `supabase/seed_placeholder_catalog.sql`.
  - Write Phase 1 database test suite.
- **Rule reminder**: Do not push to remote `v2` until Vercel Preview environment variables point to staging. Do not apply `004` to staging until Gate 1 is explicitly approved.

## Gotchas and notes
- **`.claude/settings.json` (shipped in the handoff pack) denies `Read(.env)`, `Read(.env.local)`, `Read(.env.staging.local)`, `Read(.env.production)`, `Read(.env.production.local)`, `Read(supabase/.temp/**)`.** These are enforced at the harness level.
- `scripts/check-env.mjs` is tested and verified by `src/tests/check-env.test.ts`. It refuses execution unless `PROD_PROJECT_REF` is set and non-production is verified.
- `scripts/test-phase0-hotfix.sql` is ready to run in staging to verify F1-F4 and F9 in PostgreSQL.

## Log
(newest first: date, tool, what was done, test results, what the next tool must know)

### 2026-10-14 — Antigravity
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
- Test results: `npm test` 15/15 tests pass across 4 suites (`check-env`, `export`, `location`, `status`). `npm run build` (`tsc -b && vite build`) passes with code 0.
- Ready for Phase 0 gate sign-off and Phase 1 kickoff.

### 2026-10-13 — Claude Code
- Setup, in order: moved `.env` and `.env.local` to `C:\Users\DELL\Documents\fieldagent-env-backup` (outside the repo, contents not read); confirmed both already ignored by `.gitignore:31` (`.env*`); extracted the handoff pack into the repo (`CLAUDE.md`, `docs/MASTER_PROMPT.md`, `docs/HANDOFF.md`, `.claude/settings.json`); created branch `v2` and committed those four as `4bcc87b`. The owner then created a fresh repo-root `.env` with staging values.
- **A4 item 1** (commit `5ebf495`): added `scripts/check-env.mjs`; `git rm -r --cached supabase/.temp` (9 files, still on disk); `.gitignore` gained `!.env.example` and `supabase/.temp/`; `vitest` moved to `devDependencies` and `package-lock.json` regenerated to match; F5 (removed the sign-in email `console.log`), F7 (viewport meta), F8 (`fontally:` -> `finally` in `MyVisits.tsx` and `Locations.tsx`); README stack line and clone URL.
- **A4 item 2**: added `scripts/audit-prod-schema.sql` (read-only; structure and counts only, storage first-folders masked when UUID-shaped).
- Test results after item 1: `npx tsc -b` pass, `npx vitest run` 8/8 pass, `npx vite build` pass (747 kB chunk), `npx oxlint` warnings only. Guard script exercised: refuses with `PROD_PROJECT_REF` unset, refuses when the target equals it, allows a differing target, warns rather than blocks under `--confirm-production`.
- **Note on F8**, for accuracy: `} fontally: {` was **not** a syntax error. It parses as a *labelled block statement*, so the original code already compiled and the flags already reset on the normal path. The fix only changes behaviour when the `catch` block rethrows. F8 was a real-defect-style cleanup, not a crash fix.
- The next tool must know: nothing has been pushed; `main` is untouched; `.env` is the owner's to manage; two commits sit on `v2`.
