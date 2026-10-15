# HANDOFF (update this before you stop working)

## Baseline (verified 2026-10-15 on commit 0605b57)
- `npx tsc -b` passes (0 errors, code 0).
- `npx vitest run`: 20 tests in 5 suites pass (code 0).
- `npx oxlint`: 0 errors, 36 warnings (code 0).
- Branch: `v2` (Local only; never pushed to remote without owner instruction).
- Target Environment: Staging (`yexfigoxljwerignwvoj`). Production untouched.

## Owner decisions confirmed
- [x] Is the live v1 app being used by real agents right now? **NO** (No live field use; hotfix stays on staging and ships with v2 at cutover).
- [x] Does the production database hold real farmer data or test data? **TEST ONLY** (Agent `harish001` is the owner's test account).
- [x] Staging Supabase project created? **YES** (Ref: `yexfigoxljwerignwvoj`). Migrations 001-009 applied.
- [ ] Vercel "Preview" environment variables point to staging (not production)? Awaiting owner confirmation before any push to remote `v2`.

## Phase status
| Phase | Backend slice | Frontend slice | Status |
|---|---|---|---|
| 0 Safety net and hotfix (A4) | Complete | Complete | ✅ **GATE PASSED** — 14/14 tests PASS on staging (commit 88cd071) |
| 1 Foundation, schema, RLS | Migration 010 prepared, Tests updated | Diagnostics & Tests ready | ⏳ **GATE 1 REVIEW REMEDIATION** — Ready for staging run |
| 2 Admin basics | Scope defined (includes MFA, forced pw, agent audit) | Scaffolding | ⛔ **NOT STARTED** (Blocked until Gate 1 approved) |
| 3 Consent and onboarding | Claude Code | Antigravity | Not started |
| 4 Visit lifecycle | Claude Code (RPC-only writes) | Antigravity | Not started |
| 5 Photos | Claude Code (storage rules) | Antigravity | Not started |
| 6 Monitoring and reporting | Claude Code (views, RPCs) | Antigravity | Not started |
| 7 Android | Claude Code (review) | Antigravity | Not started |
| 8 Release readiness and cutover | Claude Code (security review) | Antigravity (docs) | Not started |

---

## Gate 1 Independent Review Findings & Forward-Only Remediation

Claude Code independent review returned FAIL on Phase 1 gate. Per instructions, all fixes are packaged into forward-only migration `supabase/migrations/010_gate1_security_fixes.sql` without modifying applied migrations `001` through `009`.

### Blockers Addressed (B1–B6)
1. **B1: Views bypass RLS (`visits_full`, `farm_visits_full`, `farmers_full`)**:
   - Views set to `WITH (security_invoker = true)`.
   - Permissions revoked from `anon` and `public`; granted only to `authenticated`.
   - Inspection query provided to verify `reloptions` contains `security_invoker=true` and `relacl` has `anon` removed.
2. **B2: Visit times server-authoritative**:
   - `tr_validate_farm_visit_completion` trigger now fires on `BEFORE INSERT OR UPDATE`.
   - Added trigger `tr_enforce_farm_visit_authoritative_times` on `public.farm_visits`: non-admins cannot insert completed visits, cannot supply backdated/future `started_at` (>10s clock skew), cannot set `ended_at`/`duration_seconds`, and can never modify `started_at` or `time_source`.
   - Dropped default on `farm_visits.client_uuid`.
   - *Phase 4 Note*: Moving to RPC-only writes (`start_visit`, `end_visit`, `sync_offline_visit`), revoking direct INSERT and UPDATE permissions on `farm_visits`.
3. **B3: Consent bypass closure**:
   - Removed direct INSERT policies on `farmers` and `farmer_consents` for all authenticated roles. Only the service-role Edge Function inserts farmers upon OTP verification.
   - Dropped default on `farmers.consent_status`.
   - Ensured `farmer_code_seq` has `GRANT USAGE, SELECT` to `service_role` and `postgres`.
4. **B4: Client-viewer phone masking in the database**:
   - Revoked `client_viewer` access from base table `public.farmers` (returns 0 rows).
   - Created dedicated security barrier view `public.farmers_masked` (and `farmers_full_masked`) accessible only by admin and viewer.
   - Phone masked as `repeat('X', length(phone)-4) || right(phone, 4)` when `app_config.client_sees_phone` is false; unmasked in full when true.
5. **B5: Location merge & rename collision**:
   - `admin_merge_location` repoints `farmers.village_id` and legacy `visits.village_id` before deleting source village.
   - Handled colliding village repointing in district merge.
   - Added region merge support (`p_type = 'region'`) by cascading through district merges and repointing non-colliding districts.
   - `admin_rename_location` catches sibling collisions and returns a friendly error (`A location with name "..." already exists under this parent`).
   - Audit log rows recorded for both merge and rename operations.
6. **B6: Seed idempotency & unique catalog indexes**:
   - Deduplicated crops and products on staging safely repointing child FK references.
   - Added unique indexes: `idx_crops_lower_name_en` on `public.crops (lower(btrim(name_en)))` and `idx_products_lower_name_en` on `public.products (lower(btrim(name_en)))`.
   - Replaced `get_or_create_location` RPC calls in `seed.sql` with direct idempotent SQL inserts.

### Small Fixes Included in Migration 010
- `audit_log` INSERT policy requires `actor_id = auth.uid()`.
- `app_events` INSERT policy requires `visit_id` (if present) to belong to the caller.
- `visit_track_points.is_mock_location` default dropped (nullable).
- Server-stamp trigger `set_server_timestamps()` on `visit_photos.uploaded_at`, `visit_track_points.received_at`, and `app_events.at` overwriting client values with `now()`.
- Signed URLs expiration configured to 10 minutes (`createSignedUrl(path, 600)`) in `src/lib/image.ts`.
- Edge Function `admin-manage-agents` restricted to `ALLOWED_ORIGIN` env var with server-side detailed logging and sanitized generic client errors.

### Explicit Scope Moves to Phase 2 (Documented in DECISIONS.md)
1. **Admin MFA**: Enrolment and challenge UI screens delivered together with DB-level `aal2` enforcement and a recovery procedure for lost devices.
2. **Forced Password Change**: Edge Function sets `must_change_password = true` on create/reset, and the login UI enforces it before allowing access.
3. **Agent Management Audit Logs**: Audit log rows for agent creation, password reset, activation, and deactivation.

---

## Staging Verification Execution Instructions

1. **Pre-Fix View Inspection**:
   Run the following query in the Staging SQL Editor to observe `reloptions` (NULL) and `relacl` (anon present):
   ```sql
   select c.relname, pg_get_userbyid(c.relowner), c.reloptions, c.relacl
   from pg_class c
   join pg_namespace n on n.oid=c.relnamespace
   where n.nspname='public' and c.relkind='v' and c.relname in ('visits_full', 'farm_visits_full', 'farmers_full');
   ```

2. **Run Diagnostic Fail Test**:
   Execute `scripts/test-gate1-blockers-fail.sql` in Staging SQL Editor to observe current failures across B1-B6.

3. **Apply Migration 010**:
   Run `supabase/migrations/010_gate1_security_fixes.sql` in Staging SQL Editor.

4. **Post-Fix View Inspection**:
   Re-run the view query to verify `reloptions` shows `{security_invoker=true}` and `relacl` has `anon` revoked.

5. **Run Full Test Suite**:
   Execute `supabase/tests/database_test.sql` in Staging SQL Editor and verify 100% PASS across all assertions.

---

## Log
(newest first: date, tool, what was done, test results, what the next tool must know)

### 2026-10-15 — Antigravity (Gate 1 Blocker Remediation)
- Addressed all Gate 1 blockers B1-B6 and small fixes forward-only via `010_gate1_security_fixes.sql`.
- Created diagnostic script `scripts/test-gate1-blockers-fail.sql`.
- Updated `supabase/seed.sql` with direct idempotent inserts.
- Updated `supabase/tests/database_test.sql` testing all security requirements, views, server times, phone masking, merge repointing, and RLS policies.
- Refactored `src/tests/export.test.ts` (IST timezone verification), `src/tests/status.test.ts` (imports real code), and `src/tests/agent-management.test.ts` (tests real `admin-agents.ts`).
- Updated `src/lib/image.ts` to 600s signed URLs and `admin-manage-agents` Edge Function to use `ALLOWED_ORIGIN` and sanitized errors.
- Updated `DECISIONS.md` and `MIGRATION_PLAN.md`.
- Ran and verified local tools: `npx tsc -b` (0 errors), `npx vitest run` (20/20 pass), `npx oxlint` (0 errors, 36 warnings).
