# MASTER PROMPT FOR ANTIGRAVITY: Upgrade the EXISTING Shanmukha Agritech Field Agent app to v2

Repo: `github.com/amrutcodess/shanmukha-field-agent` (live at `shanmukha-field-agent.vercel.app`, Supabase backend).
**This is an upgrade of working code, not a rewrite.** Read the code before you change it. Keep what works, change what must change, and never break the live app without my approval. The data is sensitive (farmer names, phone numbers, farm locations, photos, agent movements), so correctness and security matter more than speed or feature count.

This is ONE document with two parts:
- **Part A (sections A1 to A9):** how to change the live codebase safely: rules, defects found, Phase 0, mapping, phases, cutover, tests.
- **Part B (sections B1 to B17):** the full target product specification. Inside Part B, "section N" means section BN.
- **If Part A and Part B conflict, Part A wins.**

## A0. Start here, in this order

1. Create the branch `v2` and, as your first commit, save this entire prompt into the repo as `docs/MASTER_PROMPT.md` so every later session can re-read it.
2. Read Part A and Part B completely, then read the repository before changing anything.
3. **Do Phase 0 (section A4) ONLY. Then stop and wait for me.** Do not start any v2 feature work until I confirm.

**Overrides that apply everywhere in Part B** (the database already exists and is live):
- Part B calls the new visit table `visits` and the view `visits_full`. In this database those names belong to the live legacy table and view. **Use `farm_visits` and `farm_visits_full` for the new ones.** Child tables (`visit_photos`, `visit_track_points`, `visit_services`, `visit_purchase_items`, `app_events`) keep their names and reference `farm_visits`. The legacy `visit_audit` table stays as is; the new general `audit_log` is added.
- The tables `profiles`, `regions`, `districts`, `villages`, `crops` and `products` **already exist**. Extend them with `ALTER` (for example the `role` check on `profiles`, new columns). Never drop or recreate them. Only the new tables in Part B are created from scratch.
- Part B's storage layout `farmers/{farmer_id}/visits/{visit_id}/...` goes in a **new private bucket `visit-photos`**. The existing `purchase-photos` bucket stays, read-only, for legacy files.
- Part B's "repo structure" and "environment handling" items are already decided by Part A. Do not restructure the repository or replace the stack. Do not downgrade React, Vite, Tailwind or TypeScript.

## A1. Rules for working on a live system (non-negotiable)

1. **Never run anything against the production Supabase project.** I will create a separate **staging** Supabase project and give you its URL and keys in `.env.staging.local` (git-ignored). All migrations, Edge Function deploys, and tests run against staging only.
2. Add `scripts/check-env.mjs`, a guard that every migration, deploy, and seed script runs first. It refuses to continue if the target project ref equals `PROD_PROJECT_REF` (taken from env, never hard-coded), unless I pass an explicit `--confirm-production` flag.
3. Work on a branch named `v2`. **Never push to `main`** (it auto-deploys to production on Vercel) without my explicit approval. Open work through Vercel **preview** deployments that use the staging env vars.
4. **Migrations are additive and forward-only** (expand, then cut over, then contract). Never edit `001_init.sql` (it is already applied in production). Add new files with the Supabase CLI naming (`supabase migration new ...`). Every migration must be idempotent where possible and come with a tested rollback note.
5. Before any production migration there must be a **fresh backup** and my written go-ahead. Print the exact commands for me to run; do not run them yourself.
6. Stop at the end of each phase in section A6 and report: what changed, test results (real output), manual steps for me, and risks. Wait for my confirmation.
7. Do not invent requirements. Unspecified values go in `app_config` with a documented default, and every decision goes in `DECISIONS.md`.
8. Do not weaken security to make a test pass. No secrets in the client. No OTP bypass in production. No emoji or fancy glyphs in image stamps.
9. Every file you touch must have no hard-coded UI strings: move them to `src/i18n/en.json` and `te.json` (they currently hold many English-only strings, for example in `pages/agent/VisitDetail.tsx`). Add a unit test that fails if the two files have different keys.

## A2. What exists today (verified by reading the code and running the project)

- **Stack:** React 19, Vite 8, Tailwind 4, TypeScript 6, `vite-plugin-pwa`, `idb`, `xlsx`, `browser-image-compression`, vitest. `tsc -b`, `vitest run` (8 tests, 3 files), and `vite build` all pass. `oxlint` gives warnings only.
- **Database:** only `supabase/migrations/001_init.sql`: `profiles` (roles `admin`, `agent`), `regions`, `districts`, `villages`, `crops`, `products`, a flat `visits` table (farmer name and phone typed on every visit), `visit_audit`, view `visits_full`, RPCs `get_or_create_location`, `admin_rename_location`, `admin_merge_location`, private bucket `purchase-photos`. Migrations are applied by pasting into the SQL editor (no CLI tracking, no `config.toml`).
- **Edge Function:** `admin-manage-agents` (`create`, `reset_password`, `set_active`).
- **Frontend:** agent routes `/agent/new-visit`, `/agent/my-visits`, `/agent/visit/:id`; admin routes dashboard, agents, visits, locations, crops-products, export, more, print-report. Offline queue = `lib/db.ts` + `lib/sync.ts` + `hooks/useOfflineQueue.ts` (IndexedDB). GPS is a single `getCurrentPosition` in `NewVisit.tsx`. Photos use `<input capture>` and `lib/image.ts`.
- **Deployment hints:** the Supabase project is in the Mumbai region. `vercel.json` has SPA rewrites.

## A3. Defects found in the current code (confirm each, then fix)

I read these in the repo. I could not test the live database, so **verify each against real behaviour in staging before fixing**, and write a failing test first where possible.

| # | Finding | Why it matters |
|---|---|---|
| F1 | `NewVisit.tsx` inserts `prescription_image_path`, but `001_init.sql` has no such column (and `visits_full` lacks it). Either production was changed by hand (schema drift) or every online insert fails. | When the insert errors, the code **silently saves an offline draft** and still shows the green "Successfully Submitted... uploaded" banner. The draft has no prescription photo, so the photo is lost. Failures are hidden. |
| F2 | `uploadPrescriptionPhoto` uploads to `prescriptions/{uid}/...`, but the storage policy requires the first folder to equal the user's id. | Agents are probably refused, which feeds F1's silent fallback. |
| F3 | The agent UPDATE policy on `visits` has only `USING (... status = 'pending')` and no separate `WITH CHECK`. Postgres reuses USING as the check on the new row. | An agent changing a visit to `final` or `closed` ("farmer bought", "close") is probably rejected. Verify with an agent account. |
| F4 | Deactivation is enforced only in the login screen and `ProtectedRoute`. RLS reads, storage uploads, and `get_or_create_location` do not check `is_active`. The Edge Function sets `is_active = false` but does not ban the auth user. It can also deactivate admins, itself, or reset an admin's password, and accepts any password. | A deactivated agent with a live session keeps working. Sensitive-data risk. |
| F5 | `AuthContext.tsx` logs the sign-in email with `console.log`. | Personal data in the browser console. |
| F6 | `supabase/.temp/*` (project ref, org slug, pooler URL) is committed. `.gitignore` has `.env*`, which also hides `.env.example`. | Repo hygiene. |
| F7 | `index.html` viewport tag is corrupted (`maximum-[#1.0]`) and has `user-scalable=no`. | Blocks zoom for low-vision users and is invalid. |
| F8 | `pages/admin/Locations.tsx` and `pages/agent/MyVisits.tsx` contain a stray label `fontally:` where `finally` was meant. | Loading and submitting flags may not reset on errors. |
| F9 | `audit_visit_changes()` is `SECURITY DEFINER` without a fixed `search_path`. `admin_merge_location` fails on name collisions when merging districts, and it does not write an audit entry. | Security and correctness. |
| F10 | `vitest` is in `dependencies`. The whole app (including `xlsx`) is one 747 kB chunk. README is stale (says React 18, `your-org`). | Slow first load on weak networks. |
| F11 | Visit time, duration and `finalized_at` come from the client device. | Superseded by Part B (server time). |

## A4. Phase 0: safety net and hotfix (do this before any v2 feature)

1. **Repo hygiene:** create the `v2` branch; add `scripts/check-env.mjs`; `git rm -r --cached supabase/.temp`, add `supabase/.temp/` to `.gitignore`, and change `.env*` to `.env*` plus `!.env.example`; move `vitest` to `devDependencies`; fix the F5, F7, F8 items; fix the stale README basics.
2. **Audit script:** write `scripts/audit-prod-schema.sql`, **read-only** queries I will run in the production SQL editor and paste back to you: the columns of `public.visits`; every policy in `pg_policies` for schemas `public` and `storage`; every function with `prosecdef` and `proconfig`; whether RLS is enabled per table; storage buckets and a count of objects by first folder; row counts of `profiles` by role, `visits` (with and without `deleted_at`), and `visit_audit`. **Stop and wait for my paste.** Then diff it against `001_init.sql` and report all drift.
3. **Adopt the Supabase CLI for migrations:** add `supabase/config.toml`, write `002_reconcile_prod.sql` to bring the repo in line with what production really has, and from here on use only CLI migrations.
4. **Hotfix migration `003_hotfix_v1.sql`** (staging first), covering F1 to F4 and F9: add `prescription_image_path` if missing and extend `visits_full` (append only); fix the prescription path (new client path `{uid}/prescriptions/...`, with a policy that also still reads the legacy `prescriptions/{uid}/` prefix); split the agent UPDATE policy into `USING (own, pending, not deleted)` and a `WITH CHECK` that allows `pending`, `final`, or `closed` for own, non-deleted rows, plus a trigger that blocks agents from changing `agent_id`, `client_uuid`, `created_at` and `deleted_at`; add `is_active_agent()` and use it in every agent policy, in storage policies, and inside `get_or_create_location`; set `search_path` on all `SECURITY DEFINER` functions; make `admin_merge_location` handle name collisions.
5. **Edge Function hotfix** (`admin-manage-agents`): on deactivate, ban the auth user (and un-ban on activate); refuse to target admins or yourself; validate username (`^[a-z0-9._-]{3,30}$`) and password length (8 or more); use `Deno.serve` and a current supabase-js; keep the same name and request shape so the deployed frontend keeps working.
6. **Frontend hotfix, only if I tell you v1 is in live use** (ask me): queue to offline **only on real network errors**; show real server errors (RLS, schema, validation) to the agent instead of hiding them; show an amber "Saved on phone, will upload when online" banner instead of the green "uploaded" one when offline; store the prescription photo in the draft and `sync.ts`. If v1 is still only being tested, skip this item and let the v2 rewrite replace it.
7. **Tests:** write DB tests (SQL script switching roles, runnable in staging) proving F1 to F4 are fixed: agent can create a visit with a prescription path and a photo; agent can move own pending visit to final or closed; agent cannot touch another agent's visit or change `agent_id`; a deactivated agent cannot read, write, upload, or call the location RPC. Keep all existing unit tests green.

**Phase 0 gate:** report, then wait for me. If I say v1 is live, the hotfix ships to production first (through me), separate from v2.

## A5. Mapping the existing code to Part B

**Keep and extend:** `Login.tsx` (add `client_viewer`, forced password change, admin MFA), `AuthContext.tsx`, `ProtectedRoute.tsx` (add the role, redirect rules), `Header`, `BottomNav`, `i18n` files, `Locations.tsx` (also merge farmers), `CropsProducts.tsx` (add crop stages, product pack sizes, services tabs), `Agents.tsx` and `AgentDetail.tsx` (assignments, compliance), `Dashboard.tsx`, `ExportPrint.tsx`, `PrintReport.tsx`, `lib/export.ts` and its tests (keep the forced-English rule; add sheets Farmers, Visits, Purchases, Yield), `lib/location.ts`, `lib/image.ts` (keep compression, change upload paths), PWA setup.

**Replace:** `pages/agent/NewVisit.tsx` (880 lines) becomes two flows: farmer onboarding with consent, and the active-visit form. `pages/agent/MyVisits.tsx` becomes Farmers list plus Visits history. `pages/agent/VisitDetail.tsx` becomes Farmer profile plus visit detail. `types.ts` is rewritten. `lib/db.ts`, `lib/sync.ts` and `hooks/useOfflineQueue.ts` are replaced by a storage layer with one interface and two implementations (IndexedDB for the web fallback, encrypted SQLite for the Android app).

**Add:** Edge Functions `consent-send-otp` and `consent-verify-otp`; extend `admin-manage-agents` with a new action set (keep the old actions working until cutover) instead of renaming it; `watermark.ts`; map components; Capacitor project; `scripts/`, `docs/`.

**Routes:** add `/agent/home`, `/agent/farmers`, `/agent/farmers/:id`, `/agent/visit/:id/active`, `/agent/visits`. Keep the old agent routes working (redirecting where sensible) until cutover.

**Database (expand phase):** all new tables from Part B are added **next to** the legacy ones. The legacy `visits` table keeps working untouched for v1 until the cutover migration.

## A6. Phases (stop and report after each)

Use the phase content from section B17, with these adjustments:

1. **P1 foundation:** CLI migrations; roles (`profiles.role` check extended with `client_viewer`; `must_change_password`); RLS helpers; new tables (`farmers`, `farmer_assignments`, `crop_cycles`, `farm_visits`, children, `consent_otps`, `farmer_consents`, `audit_log`, `app_config`, catalogs with stages, sizes, services); constraints (one open visit per agent, no overlapping visits, composite product-size FK); placeholder catalog seed; DB tests; admin MFA.
2. **P2 admin basics:** extend existing admin pages; farmers directory and assignments.
3. **P3 consent and onboarding:** as in Part B, SMS provider interface with MSG91, DLT template config, no production bypass, tests.
4. **P4 visit lifecycle (web):** new agent screens, start/end RPCs with server time, geofence, DAS, products with sizes, services, harvest.
5. **P5 photos:** new bucket `visit-photos`, live capture, watermark, hash, storage policies matching the data rules.
6. **P6 monitoring and reporting:** maps and routes, day view, compliance, yield report, English exports with audit entries. Lazy-load `xlsx` and split routes so the first load is small (current bundle 747 kB).
7. **P7 Android:** add Capacitor, foreground tracking, encrypted SQLite sync, secure token storage, forced update. Generate PNG icons (the current PWA manifest only has an SVG).
8. **P8 release readiness and cutover** (section A7).

## A7. Cutover and rollback

1. **Legacy data decision (ask me first):** I will tell you whether production holds real farmer data or test data only.
   - **Test data:** archive it (export), then remove it.
   - **Real data:** the old visits hold farmer names and phones without OTP consent. Migrate them into `farmers` flagged `consent_status = 'legacy_unverified'`. These farmers cannot receive new visits until consent is captured by OTP. Retention of that legacy data is a question for the client's counsel; list it in `DECISIONS.md`.
2. **Staging rehearsal:** run the full cutover on staging with a copy of production-like data and report results.
3. **Production cutover** (only after my written approval): backup; apply migrations; set legacy `visits` to read-only (a policy and revoked write grants, no table drops); deploy the v2 frontend; the PWA service worker auto-updates, so also add a visible "new version available, reload" prompt; run smoke tests (one agent, one admin, one client viewer); keep the previous Vercel production deployment ready for **instant rollback**, and provide a `cutover_down.sql` that re-enables legacy writes.
4. **Contract (later, separate approval):** only after a stable period and a verified backup, retire the legacy table and bucket.

## A8. Tests and definition of done

- All existing tests stay green. Add unit, DB, and Edge Function tests exactly as listed in section B15, plus: i18n key parity, the F1 to F4 regression tests, and a test that `check-env.mjs` refuses production.
- Provide `TESTING.md` with the real-device checklist from Part B.
- Run Part B's acceptance checklist at the end and report pass or fail with evidence (real output, not assertions).
- Update `README.md`, `DECISIONS.md`, `MIGRATION_PLAN.md` and a short `RUNBOOK.md` (backup, restore, rollback, rotate keys, deactivate an agent, withdraw a farmer's consent).

## A9. What I will do or provide (do not do these yourself)

- Create the staging Supabase project and give you its keys; set Vercel environment variables so only `main` uses production values.
- Run `scripts/audit-prod-schema.sql` in production and paste the results.
- Tell you whether v1 is in live use and whether production data is real.
- Handle DLT registration, the client's Play account, legal review of the consent notice and privacy policy, and the Telugu review.
- Provide the client's crop stages, products, and pack sizes (placeholders until then).

---

# PART B: FULL TARGET PRODUCT SPECIFICATION (reference for Phases 1 to 8)

In this part, "section N" means section BN. Apply the overrides in section A0.

## B1. Product summary

Shanmukha Agritech monitors farmers in selected districts through Field Agents (FAs). Each FA is assigned a set of farmers and visits each at least weekly for the length of a crop cycle (the number of months is not yet decided, so make it configurable). On the first visit the FA onboards the farmer (with DPDP consent via OTP). On every later visit the FA opens the farmer's profile, starts a visit, records observations, crop stage, products, services and photos, and ends the visit. Visit time and location are captured automatically. After harvest, the company wants to show the increase in yield attributable to the advisory and product use, so **baseline yield and harvest yield must be recorded**.

Admins and read-only client viewers monitor farmers, agents, routes, compliance, and yield outcomes, and export or print reports in English.

## B2. Platform and stack

- **Agents use an Android app** built by wrapping the web app with **Capacitor** (current stable). Package id configurable, default `com.shanmukhaagritech.fieldagent`. Publish via Google Play (client-owned developer account).
- **Admins and client viewers use the same codebase as a responsive web app** deployed on Vercel (also usable on a phone). No Play Store is needed for them.
- **iPhone fallback:** some agents may use iPhones. Keep all code platform-neutral so an iOS app can be added later. Until then, iPhone agents use the **web build in Safari** with *basic tracking only* (start and end fixes, plus fixes while the page is open). Every visit stores `tracking_mode` ('native_continuous' | 'web_basic') so admins can see the difference. Do not add iOS native projects now.
- **Keep the existing stack** (React 19, Vite 8, Tailwind 4, TypeScript 6, react-router 7, `react-i18next`, `@supabase/supabase-js`, `idb`, `vite-plugin-pwa`, `xlsx`, vitest). Add only what the product needs (Leaflet, Capacitor and its plugins). Do not downgrade anything.
- Maps: Leaflet (+ react-leaflet) with a **configurable tile URL** (`VITE_MAP_TILE_URL`). Default to OpenStreetMap for development only and document in the README that production must use a tile provider whose terms allow the expected traffic.
- Excel export: `xlsx`, lazy-loaded.
- Backend: **Supabase only** (Postgres, Auth, Storage, Edge Functions, `pg_cron`). Use two separate Supabase projects: `staging` and `prod`, selected by env files (see section A1 for how production is protected). Region for prod: Mumbai (ap-south-1), documented in the README.
- Fonts: bundle **Noto Sans** and **Noto Sans Telugu** inside the app (do not load from Google Fonts), so they work offline.

## B3. Roles

- `admin`: full control.
- `agent` (Field Agent): sees and works only with farmers currently assigned to them.
- `client_viewer`: **read-only** access to dashboards, farmer and visit data, maps, and reports. Farmer phone numbers are masked for this role by default (config `client_sees_phone = false`). Cannot export unless config `client_can_export = true`.

There is **no public sign-up**. Only admins create accounts (via an Edge Function). Agents log in with username + password (stored as `<username>@agents.<configurable-domain>` in Supabase Auth). Admins and client viewers log in with email + password. The login screen has a language toggle (English / తెలుగు) and a role toggle used **only for UX**; authorization always comes from `profiles.role`. Inactive users cannot sign in. New accounts get `must_change_password = true` and are forced to set a new password at first login. **Admin accounts must enroll TOTP multi-factor authentication** before accessing admin screens.

## B4. Data model

Write as ordered SQL migrations in `supabase/migrations/`. Use uuid primary keys, `created_at`/`updated_at` (trigger), and soft deletes (`deleted_at`) where noted. **Enable RLS on every table with no permissive default.**

### 4.1 profiles
`id` (= auth.users.id), `role`, `full_name`, `username`, `phone`, `is_active`, `preferred_language`, `must_change_password`.

### 4.2 Locations
`regions`, `districts`, `villages` with unique case-insensitive trimmed names within the parent, and RPC `get_or_create_location(region, district, village)` (trims, collapses spaces, case-insensitive match, Title Case for new English names). Admin can rename and merge locations (merge re-points farmers and removes the duplicate).

### 4.3 farmers
`id`, `farmer_code` (unique, human-readable, auto-generated e.g. `SA-000123`), `full_name`, `phone` (normalized to +91XXXXXXXXXX, **unique**), `village_id`, `farm_lat`, `farm_lng`, `farm_accuracy_m` (captured at onboarding by standing at the farm), `consent_status` ('granted' | 'withdrawn'), `consent_verified_at`, `onboarded_by` (agent), `deleted_at`, `anonymized_at`.
Do **not** add Father's Name, Ujjwal Kisan ID, Aadhaar-like or other ID fields. Add them only if the client confirms in writing (data minimization). List this in `DECISIONS.md` under "Open items".

### 4.4 farmer_assignments
`id`, `farmer_id`, `agent_id`, `assigned_at`, `unassigned_at` (null = active), `assigned_by`. Unique partial index: only one active assignment per farmer. Reassignment closes the old row and opens a new one. Agents see only farmers with an active assignment to them. Admin UI: assign, reassign, and bulk assign by selecting multiple farmers.

### 4.5 Consent (append-only)
- `consent_otps` (service-role only, RLS denies everyone else): `id`, `phone_hmac`, `otp_hash`, `expires_at`, `attempts`, `max_attempts`, `verified_at`, `requested_by`, `created_at`. Never store the OTP in plaintext, never return it to any client, never log it.
- `farmer_consents` (**append-only**): `id`, `farmer_id`, `agent_id`, `event` ('granted' | 'withdrawn'), `notice_version`, `notice_language` ('en' | 'te'), `lat`, `lng`, `accuracy_m`, `request_ip`, `app_version`, `created_at` (server time). No UPDATE or DELETE policies, **plus a trigger that raises an exception on any UPDATE or DELETE for every role**. A withdrawal is a new row.

### 4.6 Catalogs (admin-managed, bilingual: `name_en`, `name_te`, `is_active`)
- `crops`
- `crop_stages` (`crop_id`, `name_en`, `name_te`, `sort_order`): stages are **per crop**.
- `products`
- `product_sizes` (`product_id`, `size_label`, `sort_order`, `is_active`, plus a unique constraint on (`product_id`, `id`))
- `value_added_services`: seed exactly: Sticky Traps, Haqdarshak, Drone Spraying, Soil Testing, Weather Updates.
Seed **clearly labelled placeholder** crops, stages, products, and sizes in `supabase/seed_placeholder_catalog.sql` and state in the README that the client's real lists will replace them. Admin can add, edit, reorder, and deactivate all of these. Deactivating never deletes history.

### 4.7 crop_cycles
`id`, `farmer_id`, `crop_id`, `season` (text, e.g. "Kharif 2026"), `plot_name` (optional), `acreage` (numeric > 0), `sowing_date`, `status` ('active' | 'harvested' | 'abandoned'), `cohort` ('advised' | 'comparison', default 'advised'), `baseline_yield` (numeric, nullable), `baseline_yield_unit` (e.g. 'quintal_per_acre'), `baseline_source` ('farmer_reported' | 'records'), `harvest_date`, `harvest_total_yield`, `harvest_yield_unit`, `yield_per_acre` (computed), `harvest_recorded_by`, `notes`.
A farmer may have several crop cycles over time. Sowing date lives here, **not on the farmer**.

### 4.8 visits
`id`, `client_uuid` (unique, generated on device), `farmer_id`, `crop_cycle_id`, `agent_id`,
`status` ('in_progress' | 'completed' | 'auto_closed' | 'cancelled'),
`started_at`, `ended_at` (**set by the server, never sent by the client**), `time_source` ('server' | 'device_offline'),
`duration_seconds` (computed on end),
`start_lat`, `start_lng`, `start_accuracy_m`, `end_lat`, `end_lng`, `end_accuracy_m`,
`start_distance_from_farm_m`, `end_distance_from_farm_m`, `outside_geofence` (boolean), `outside_geofence_reason` (text),
`crop_stage_id`, `das` (integer snapshot, see 6.4),
`observations_diagnosis` (text, required to complete; this single field replaces separate diagnosis and prescription text),
`prescription_given` (boolean),
`no_services_chosen` (boolean),
`video_link` (text, optional, must be https),
`tracking_mode`, `app_version`, `device_model`, `cancel_reason`, `flags` (jsonb, for items like short duration, clock skew, offline recorded).

**Overlap prevention, enforced in the database:**
- A unique partial index allowing only one `in_progress` visit per agent.
- An exclusion constraint (using `btree_gist`) on (`agent_id`, `tstzrange(started_at, coalesce(ended_at, 'infinity'))`) so an agent's visits can never overlap in time, for statuses in progress, completed, or auto closed.

### 4.9 Visit child tables
- `visit_services` (`visit_id`, `service_id`). Rule: a completed visit must have either at least one service row or `no_services_chosen = true`, never both and never neither. Enforce with a validation function or trigger on completion.
- `visit_purchase_items` (`visit_id`, `product_id`, `product_size_id`, `quantity` int > 0, plus name and size snapshots). A **composite foreign key (`product_id`, `product_size_id`) to `product_sizes(product_id, id)`** guarantees a size always belongs to its product at the database level.
- `visit_photos`: `id`, `visit_id`, `kind` ('field' | 'prescription' | 'receipt'), `storage_path`, `sha256`, `lat`, `lng`, `accuracy_m`, `captured_at` (corrected time), `uploaded_at` (server), `width`, `height`.
  Completion rules: at least one `field` photo (max 5); `receipt` photo required if any purchase items exist; `prescription` photo optional and only when `prescription_given = true`.
- `visit_track_points`: `id`, `visit_id`, `agent_id`, `recorded_at` (device), `received_at` (server), `lat`, `lng`, `accuracy_m`, `speed`, `heading`, `is_mock_location` (nullable boolean), `source`. Insert allowed only for the agent's own `in_progress` visit, in batches.
- `app_events`: `id`, `visit_id`, `agent_id`, `type` ('app_backgrounded' | 'app_foregrounded' | 'gps_disabled' | 'gps_enabled' | 'permission_revoked' | 'network_lost' | 'network_restored' | 'clock_skew_detected' | 'service_restarted'), `at`, `details` (jsonb).

### 4.10 audit_log
`id`, `actor_id`, `action`, `entity`, `entity_id`, `details` (jsonb), `created_at`. Log: admin edits to visits, farmer reassignment, agent activation/deactivation, password resets, consent withdrawal, data erasure, config changes, and **every export or print** (who, what scope, when, record count). Readable by admins only. Not editable.

### 4.11 Views and functions
- `visits_full` and `farmers_full` views joining names for filtering and export.
- `haversine_m(lat1, lng1, lat2, lng2)` function.
- RPCs: `start_visit`, `end_visit`, `sync_offline_visit`, `get_server_time`, `create_farmer_with_consent` (service-role only, called by the Edge Function), `withdraw_consent`.

### 4.12 app_config (admin-editable key/value, with defaults)
`visit_frequency_days = 7`, `track_interval_seconds = 30`, `track_min_distance_m = 10`, `gps_accuracy_max_m = 50`, `geofence_radius_m = 200`, `geofence_mode = 'flag'` ('flag' | 'block'), `min_visit_minutes = 10` (flag only), `max_visit_hours = 4` (auto close), `min_app_version`, `consent_notice_version`, `client_sees_phone = false`, `client_can_export = false`, `sms_template_text`.

## B5. Consent flow (DPDP), strict

**No farmer data is stored in the database until the OTP is verified.** Until then, onboarding data lives only in the app's memory.

Onboarding flow (agent app, needs network; show a clear message when offline):
1. Agent enters farmer name, phone (10-digit validation), village (autocomplete via `get_or_create_location`), captures farm location (stand at the farm, wait for accuracy under the configured limit), and the first crop cycle (crop, season, acreage, sowing date, optional baseline yield).
2. App shows the **consent notice** full-screen with a big English/Telugu toggle. The agent reads it to the farmer. Content (editable text, versioned with `consent_notice_version`): who is collecting the data (Shanmukha Agritech), what is collected (name, phone, farm location, crop details, photos of the field, prescription and receipts), why (monitoring crop progress, advisory, and analysis of yield outcomes), who can see it, how long it is kept (config placeholder), how to withdraw consent, and a contact for grievances (config placeholder). Draft the English and Telugu text in plain language and mark it `NEEDS LEGAL AND NATIVE-SPEAKER REVIEW` in the README. I will have it reviewed.
3. Agent taps **Send OTP**. Edge Function `consent-send-otp`: verifies the caller is an active agent, normalizes the phone, enforces **rate limits** (max 3 sends per phone per hour, 60-second resend cooldown, max 10 sends per agent per hour), generates a 6-digit OTP with a cryptographically secure generator, stores only `HMAC(phone)` and `hash(OTP)` with a 10-minute expiry and `max_attempts = 5`, and sends the SMS through an SMS provider.
4. **SMS text** (must match the DLT-approved template exactly; keep it in `sms_template_text` and in the function's config): `{{OTP}} is the OTP for consent form of {{APP_NAME}}. Giving this OTP to the Field Agent shows your consent to record your farm data.` Keep the client's wording; only the OTP position may be adjusted to match the approved template. Do not alter it otherwise.
5. Agent enters the OTP the farmer reads out. Edge Function `consent-verify-otp` checks it in constant time, enforces attempts and expiry, and on success calls `create_farmer_with_consent` **in a single transaction**: create the farmer, the first crop cycle, the assignment to this agent, and the `granted` consent row (notice version, language shown, server time, GPS, IP from the request headers, app version). Invalidate the OTP.
6. If a farmer with this phone already exists, do not create a duplicate: tell the agent the farmer already exists and to ask the admin to assign them.
7. SMS provider: build behind an interface (`SmsProvider`) with an **MSG91** implementation reading keys from Edge Function secrets. Document the **DLT registration** requirement (sender ID, principal entity, template approval) in the README as a manual prerequisite owned by the client.
8. **There must be no OTP bypass in production.** For the dev project only, a `TEST_PHONE_NUMBERS` secret may map specific numbers to a fixed OTP. The function must ignore this when `APP_ENV=production`, and a test must prove it.

Withdrawal and erasure (admin): `withdraw_consent(farmer_id)` appends a `withdrawn` row, sets `consent_status = 'withdrawn'`, and blocks new visits for that farmer. A separate admin action **Erase personal data** replaces name and phone with anonymized values, deletes the farmer's photos from storage, sets `anonymized_at`, and keeps aggregate visit and yield numbers plus the consent log (which holds no personal data beyond the farmer id). Both actions require a confirmation dialog and are written to `audit_log`.

## B6. Visit lifecycle, GPS, time, DAS

### 6.1 Rules
- Tracking runs **only between Start Visit and End Visit**. Never track outside a visit. Show a clear "Location is being recorded for this visit" notice. Document in the README and in the in-app first-run notice that agents are informed their location is recorded during visits.
- All visit times come from the **server** (`now()` inside `start_visit` and `end_visit`). The client never submits start or end times. Duration = `ended_at - started_at`.
- At app launch, call `get_server_time` and compute the clock offset. If the device clock differs by more than 2 minutes, log a `clock_skew_detected` event, flag the visit, and show the agent a warning to enable automatic date and time.

### 6.2 Start Visit (from a farmer profile)
1. Block if the farmer's consent is withdrawn, there is no active crop cycle, or the agent already has an `in_progress` visit (show a button to resume that one).
2. Check permissions in order: precise location, notifications (needed for the foreground service on Android 13+), and that GPS is switched on. If something is missing, show a clear translated screen with a button that opens the right Android settings page. The visit cannot start until all are satisfied.
3. Get a fix with accuracy at or below `gps_accuracy_max_m` (wait up to 30 seconds, showing "Waiting for GPS"; allow retry; if it cannot reach the accuracy, allow starting with a flag `low_accuracy`).
4. Compute distance from the farm location. If beyond `geofence_radius_m`: in `flag` mode ask the agent for a short reason and set `outside_geofence = true`; in `block` mode refuse.
5. Call `start_visit` (server time). Start the native foreground tracking service and show a persistent in-app banner with a running timer based on server `started_at`. The banner appears on every screen. The visit survives app restarts: on launch, if an `in_progress` visit exists, restore it and resume tracking.

### 6.3 During the visit
Record a track point every `track_interval_seconds` or `track_min_distance_m`, whichever comes first, with accuracy and the mock-location flag when available. Log `app_events` for backgrounding, foregrounding, GPS off/on, permission revoked, and connectivity changes. Upload track points in batches; queue offline.

### 6.4 Crop stage and DAS
- Crop stage dropdown shows only the stages of the cycle's crop (in the UI language).
- **DAS = visit date minus sowing date**, in whole days, using the corrected server date. Show it read-only on the form as it is calculated, and **store it on the visit when the visit completes** so later edits of the sowing date never rewrite history. If sowing date is in the future, block with a clear message.

### 6.5 End Visit
Validate: observations text, crop stage, at least one field photo, receipt photo if purchases exist, services chosen or "None chosen". Take a final fix, call `end_visit` (server time), stop the foreground service, upload the remaining data, and show a summary (duration, distance from farm). Flag visits shorter than `min_visit_minutes`. A scheduled `pg_cron` job closes visits `in_progress` longer than `max_visit_hours` as `auto_closed` with a flag.
Agents may **cancel** a visit only with a reason; cancelled visits are kept, never deleted.

## B7. Photos and geo-watermark

- Use the **native camera in live-capture mode only** (`@capacitor/camera`, source camera, `saveToGallery: false`). No gallery picking for visit photos. On the iPhone web fallback use an in-page `getUserMedia` camera.
- Implement `src/lib/watermark.ts`: takes the captured image plus context and burns a semi-transparent black bar along the bottom (about 12% of image height, font scaled to image width) with white text in plain text (**no emoji**): date and time (IST, using the server-corrected clock), latitude and longitude to 5 decimals with N/S and E/W, GPS accuracy in meters, Farmer Code, Agent username, short Visit ID, and the photo type (Field / Prescription / Receipt). Use only numerals and English letters so rendering is identical on every phone.
- Before stamping, take a **fresh fix** (not older than 60 seconds) at the moment of capture.
- After stamping, compress to about 1 MB JPEG and compute the **SHA-256** of the final bytes. Upload to a private bucket at `farmers/{farmer_id}/visits/{visit_id}/{kind}-{uuid}.jpg`, then insert the `visit_photos` row with the hash and coordinates. Delete the temporary unstamped file from the device cache immediately.
- Apply the same stamp to all three photo kinds.
- Signed URLs for viewing expire in 10 minutes. Storage policies must follow the same access rules as the data tables (agent: only their assigned farmers' folders; admin and client viewer: read).

## B8. Agent app screens (mobile, very simple)

Visual style: shades of **green and white**, large touch targets (48px or more), 16px or larger text, one main action per screen, plain icons with text labels, no decorative graphics. Bottom navigation: **Home, Farmers, Visits, Account**.
- **First-run setup check:** a screen with green ticks for precise location, notifications, camera, battery setting ("Unrestricted" / do not optimize, with step-by-step help for common phones that stop background services), and device clock accuracy. Reachable again from Account.
- **Home:** the in-progress visit banner if any; "Due this week" list (farmers not visited within `visit_frequency_days`, overdue first, with days since last visit); counts; Pending uploads indicator; **Add New Farmer** button.
- **Farmers:** searchable list of assigned farmers with village, crop and stage, DAS today, last visit date, and an overdue badge.
- **Farmer profile:** header (code, name, village, tap-to-call), consent badge, active crop cycle with current stage and DAS, a **visit timeline** (every past visit with date, stage, DAS, observations preview, products, services, photo count, duration), and a large **Start Visit** button. If the crop cycle's stage is the harvest stage, show **Record Harvest** (harvest date, total yield and unit, acreage confirmation) which marks the cycle `harvested`.
- **Active visit form** (single scrollable page, sections in cards): Crop stage and DAS; Observations and Diagnosis (large text; mention that the keyboard's voice typing works in Telugu); **Prescription given?** toggle that reveals an optional prescription photo; **Products bought?** toggle that reveals rows of Product, then Size (only that product's sizes), then Quantity, with Add Row and a required receipt photo; **Value-added services** multi-select with **None chosen**; Field photos (at least one); optional **video link** (https only, hint to share as "Anyone with the link"). Sticky **Complete and End Visit** button. The form auto-saves locally as a draft.
- **Visits:** the agent's own history.
- Everything in English and Telugu.

## B9. Admin and client viewer screens (responsive web)

- **Dashboard:** farmers, active crop cycles, visits this week, **weekly compliance** (percentage of farmers visited within the frequency window, overall and per agent), farmers overdue, visits flagged (outside geofence, low accuracy, short duration, offline recorded, clock skew), visits per agent. Date range filter.
- **Farmers:** directory with filters (agent, region, district, village, crop, stage, overdue, consent status), assignment tools, farmer profile with timeline, crop cycles, photos gallery, consent history, and withdraw / erase actions (admin only).
- **Agents:** create, deactivate, reset password; agent detail with their visits, compliance, and a **day view**.
- **Visit detail:** all fields, photos (tap to enlarge), duration, flags, app events timeline, and a **map** showing the farm marker with the geofence circle, the start and end markers, and the **route polyline** from track points. Gaps in tracking are shown visibly (dashed segments) and listed.
- **Agent day view (the Strava-like view):** pick an agent and a date to see all of that day's visits as separate colored routes on one map, in time order, with a list. No overlaps should exist (enforced by the database); if the data ever shows one, flag it loudly.
- **Locations:** tree Region, District, Village with rename and merge.
- **Catalogs:** crops, stages, products and sizes, services (bilingual), reorder and deactivate.
- **Yield report:** by crop, season, district, and cohort: number of farmers, average baseline yield per acre, average harvest yield per acre, absolute and percentage change, with a visible note "Baseline is farmer-reported; this is not a controlled trial" (editable text in config). Also show product usage per farmer and in total.
- **Export / Print (English only):** Excel (multi-sheet: Farmers, Visits, Purchases, Yield), CSV, and a print-friendly A4 view. Always English regardless of UI language (use a fixed English translator for headings and values); dates `DD-MM-YYYY`, times `hh:mm AM/PM` IST. Observations text is exported as typed by the agent; admins can add an optional English version (`observations_en`) which exports prefer. Every export or print writes an `audit_log` entry.
- **Settings:** `app_config` values, minimum app version, consent notice version.
- Client viewer sees the same read-only screens, with phone masking per config, and no admin actions.

## B10. Languages

Complete `en.json` and `te.json`; no hard-coded UI strings. Simple spoken-style Telugu; Western digits. Catalog names show the Telugu or English name by UI language. User-typed text is stored as typed. Mark `te.json` and the consent notice for native-speaker review in the README.

## B11. Android and Capacitor requirements

- Portrait only; green status bar; handle Android edge-to-edge insets.
- Plugins: `@capacitor/camera`, `@capacitor/geolocation`, a **foreground-service background geolocation plugin** (evaluate `@capacitor-community/background-geolocation` first; if it is unmaintained or unsuitable for the current Capacitor version, use a maintained alternative and explain the choice in `DECISIONS.md`; requirements: foreground service with persistent notification, batching, mock-location flag exposed or added via a small custom native module), `@capacitor/network`, `@capacitor/app`, `@capacitor/device`, `@capacitor/filesystem`, `@capacitor/status-bar`, `@capacitor/keyboard`, secure storage for auth tokens (Android Keystore backed), and `@capacitor-community/sqlite` with **encryption enabled** (passphrase generated per install and kept in secure storage).
- Permissions in the manifest: `INTERNET`, `ACCESS_NETWORK_STATE`, `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`, `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_LOCATION`, `POST_NOTIFICATIONS`, `CAMERA`. **Do not request `ACCESS_BACKGROUND_LOCATION`** unless you can show it is truly required; the design starts the foreground service while the app is open at Start Visit. Declare the foreground service type `location`. If testing shows background location is needed on some devices, stop and tell me before adding it, because it triggers a stricter Play review.
- `android:allowBackup="false"`, cleartext traffic disabled, release build with minification, no personal data in logs in release builds.
- Supabase auth storage adapter uses the secure storage plugin.
- **Forced update:** at launch compare the app version with `min_app_version`; if lower, block the app with an "Update required" screen linking to the Play listing.
- **Logout:** blocked while there are unsynced items; otherwise wipe the local database and cached files.
- App icon and splash: simple green and white leaf mark, generated with `@capacitor/assets` including an adaptive icon.
- Build outputs: signed **.aab** via Gradle `bundleRelease`; `versionName`/`versionCode` scheme documented. README must explain generating the upload keystore and that the **client must hold a backup of the keystore and passwords**, and use Play App Signing.

## B12. Offline behavior

- The app shell and assets are bundled and open offline.
- Cache assigned farmers, their crop cycles, and recent visits in the encrypted SQLite database (needed so agents can open profiles in villages with no signal).
- Offline capabilities: start and end a visit (flagged `time_source = 'device_offline'`, device times sanity-checked: not in the future and not older than a configurable limit), fill the form, take stamped photos, and record track points.
- **Not available offline:** onboarding a new farmer (needs OTP), admin actions.
- Sync worker: idempotent (uses `client_uuid`s), uploads photos first, then track points, then completes the visit via `sync_offline_visit`. Retry with backoff. Show Pending uploads with a manual Retry. Conflicts and server rejections show a clear message and never silently drop data.
- Overlap and one-active-visit rules are re-validated on sync; if an offline visit conflicts, keep it as `flagged` for admin review instead of discarding it.

## B13. Security and privacy requirements

- RLS on all tables and storage. Policies: agent sees and writes only for farmers with an active assignment to them and only their own visits; agent cannot read other agents' data, track points, or photos; `client_viewer` is read-only; `anon` has no access.
- Admin-only Edge Function `admin-manage-users` (create agent or client viewer, reset password, activate or deactivate). Every Edge Function verifies the caller's JWT and role server-side.
- Short-lived signed URLs only; private buckets.
- No personal data in analytics. If error monitoring is added, scrub personal data and never send photos or phone numbers.
- Password policy minimum 8 characters; forced change on first login; rely on Supabase auth rate limits and add a lockout message.
- Document in the README: Supabase **Pro** plan with daily backups (consider point-in-time recovery), Mumbai region, separate dev and prod projects, how to restore, and a data retention and deletion procedure (retention period is a client and counsel decision).

## B14. Play Store packaging deliverables (documents and code only)

- A public, no-login route `/privacy` in the web app with a **privacy policy template** covering: data collected (name, phone, farm location, crop data, photos, agent location during visits), purpose, who can access it, storage and security, retention, how a farmer can withdraw consent or request erasure, and a contact. Mark placeholders clearly. The client's counsel must review it.
- `PLAY_STORE_CHECKLIST.md`: Data safety form draft answers matched to what the app really collects; location permission justification text ("to record the agent's travel path during an active farm visit, using a foreground service with a visible notification"); content rating and target audience notes (adults only); required screenshots; how to use the **internal or closed testing track** to distribute to a limited set of agents; and a note that a **reviewer test account** must be provided, with a demo agent and demo farmers in a separate demo dataset.
- Explain in that file that reviewers cannot receive OTP SMS, so provide a short screen-recording link demonstrating onboarding instead of adding any production OTP bypass.

## B15. Tests (write and run)

1. **Unit tests:** haversine distance; DAS calculation (including future sowing date); OTP rules (expiry, attempts, cooldown, rate limits); English-only export formatter; location normalization.
2. **Database tests** (pgTAP or a SQL script that switches roles): agent A cannot read agent B's farmers, visits, photos, or track points; an agent cannot read a farmer after unassignment; `client_viewer` cannot write; anon sees nothing; `farmer_consents` cannot be updated or deleted by any role; a size from product A cannot attach to product B; a second `in_progress` visit for the same agent fails; overlapping visits fail; completing a visit without a field photo or without a services decision fails.
3. **Edge Function tests:** a non-agent cannot send OTP; the OTP is never present in any response or log; a wrong OTP five times locks the request; an expired OTP fails; **with `APP_ENV=production` the test-phone bypass is ignored**; a duplicate phone does not create a second farmer.
4. `TESTING.md` with a **real-device checklist**: start a visit then lock the screen for 60 minutes and confirm the route continues; airplane mode mid-visit; kill the app mid-visit and reopen; deny and revoke permissions; GPS off mid-visit; a mock-location app (the flag appears); change the device clock (skew flagged); a low-end phone with aggressive battery management; Telugu rendering on several phones; photo stamp readability in bright sun.

## B16. Open items (use these defaults, record in DECISIONS.md, I will confirm with the client)

- Number of months per crop cycle: not set (nothing hard-coded).
- Crop stage lists, product list, and pack sizes: placeholders until provided.
- Whether continuous route tracking is required between farms (current design: only during a visit).
- Meaning of "no overlapping": implemented as no overlapping visits per agent.
- Whether clients may see phone numbers or export.
- Whether Father's Name or any ID fields are needed (default: not collected).
- Consent notice wording, retention period, and grievance contact: need legal review.
- iPhone agents: web fallback with basic tracking until decided.

## B17. Phases (stop and report after each)

1. **Phase 1, foundation:** repo structure (web, Capacitor Android, supabase), env handling for dev and prod, theme, i18n scaffold, routing, login, roles, forced password change, admin MFA, all migrations with RLS, audit log, config table, placeholder seeds, and the database tests.
2. **Phase 2, admin basics (web):** user management Edge Function, locations, catalogs, farmers directory, assignments (single and bulk), app_config screen.
3. **Phase 3, consent and onboarding:** Edge Functions `consent-send-otp` and `consent-verify-otp`, SMS provider interface with MSG91 implementation, onboarding UI, withdrawal and erasure, and the Edge Function tests.
4. **Phase 4, visit lifecycle:** farmer profile and timeline, start and end RPCs, geofence, overlap constraints, form (stage and DAS, observations, prescription toggle, products with dependent sizes, services, video link), harvest recording, compliance lists.
5. **Phase 5, photos:** live camera, watermark engine, hashing, upload, private storage policies, viewing with signed URLs.
6. **Phase 6, monitoring and reporting:** visit map and route, agent day view, dashboard and compliance, yield report, English exports and print, audit entries for exports.
7. **Phase 7, Android hardening:** foreground tracking service, setup check screen, track point batching, encrypted SQLite offline cache and sync, secure token storage, forced update, logout rules, manifest permissions, signing instructions, release `.aab`.
8. **Phase 8, release readiness:** privacy policy route, Play Store checklist and Data safety draft, `TESTING.md`, README, final full test run, and a written list of known limitations.

After Phase 8, run this acceptance checklist and report pass or fail for each item with evidence:
- [ ] Agent A cannot access agent B's data by any route (tables, storage, RPC)
- [ ] No farmer record exists before OTP verification succeeds
- [ ] OTP is never exposed in responses or logs; no bypass in production
- [ ] Consent log cannot be altered or deleted by any role
- [ ] Visit start and end times come only from the server; offline visits are clearly flagged
- [ ] One active visit per agent, and overlapping visits are impossible
- [ ] Tracking runs only during an active visit and continues with the screen locked on a real phone
- [ ] Every photo carries the burnt-in stamp, a stored hash, and coordinates
- [ ] Product sizes shown always belong to the selected product, enforced in the database
- [ ] DAS is computed correctly and stored on completion
- [ ] Baseline and harvest yield are captured and the yield report is correct
- [ ] Exports and prints are in English with the UI set to Telugu, and each is audit-logged
- [ ] Client viewer is read-only with phone numbers masked by default
- [ ] No secrets in the client bundle or the Android package
- [ ] Release `.aab` builds, signs, and installs on a clean phone
