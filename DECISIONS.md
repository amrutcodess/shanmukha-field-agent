# Architecture and Implementation Decisions (v2)

This document records key architectural decisions, conventions, and open questions for the Shanmukha Agritech Field Agent v2 upgrade.

---

## 1. Open Items & Client Defaults (Section B16)

The following items are configured with safe defaults and require final written sign-off from Shanmukha Agritech stakeholders / legal counsel:

| Item | Default Choice | Rationale / Notes | Status |
|---|---|---|---|
| **Crop cycle duration** | Configurable via `app_config` (no hard-coded limit) | Client did not specify total months. Cycles are closed on harvest or abandonment. | Open |
| **Catalog data (crops, stages, products, sizes, services)** | Placeholders seeded in `supabase/seed_placeholder_catalog.sql` | Client to provide official product catalogue and per-crop stages. Admin UI allows editing. | Pending client catalog |
| **Tracking scope** | Continuous tracking **only between Start Visit and End Visit** | Privacy & battery preservation; continuous tracking between visits is neither required nor legally advisable under DPDP without explicit employee surveillance consent. | Decided (per prompt B6.1) |
| **"No overlapping visits"** | Enforced at database level via `btree_gist` exclusion constraint per agent | An agent cannot have overlapping active/completed visit time ranges (`no_overlapping_agent_visits`). | Decided (per prompt B4.8) |
| **Client Viewer phone & export access** | `client_sees_phone = false`, `client_can_export = false` | DPDP data minimization and role separation. Masking enforced in DB views (`farmers_masked`, `farmers_full_masked`). Configurable in `app_config`. | Decided (per prompt B4.12) |
| **Farmer ID fields (Father's Name, Aadhaar, etc.)** | **Not collected** | DPDP Act 2023 mandates collecting only what is strictly necessary for advisory and yield verification. | Decided (Open item for client counsel) |
| **DPDP Consent Notice & Retention** | Placeholder draft notice in English and Telugu; retention period configurable | Requires formal vetting by Shanmukha Agritech legal counsel and Telugu native speaker. | Pending legal review |
| **iPhone agent support** | Web PWA fallback (`tracking_mode = 'web_basic'`) | iPhone users use Safari web app capturing start/end fixes and while-open tracking points. Android receives full native Capacitor app with foreground service. | Decided (per prompt B2) |

---

## 2. Explicit Scope Movements to Phase 2

The following items were explicitly moved from Phase 1 to Phase 2 (Admin Basics) to ensure clean delivery:

1. **Admin MFA**:
   - Deliver enrolment and challenge UI screens together with database-level `aal2` enforcement.
   - The database check must NOT be enabled before user-facing enrolment and challenge screens exist.
   - Include a recovery procedure for lost or reset authenticator devices.
2. **Forced Password Change**:
   - `admin-manage-agents` Edge Function sets `must_change_password = true` on agent creation and password reset.
   - The login screen and auth provider intercept and honour `must_change_password`, forcing the user to establish a new password before granting app access.
3. **Agent Management Audit Logs**:
   - Audit log rows recorded for agent creation, password reset, account activation, and account deactivation.

---

## 3. Database & Migration Strategy

1. **Forward-Only, Additive Migrations**:
   - `001_init.sql` is strictly preserved and never modified.
   - `002_reconcile_prod.sql` synchronizes drift discovered during production audit (`prescription_image_path`, `visits_full`, policy naming).
   - `003_hotfix_v1.sql` addresses security/data integrity hotfixes F1–F4 and F9 while keeping v1 operational.
   - `004_v2_roles_and_config.sql` adds roles, config defaults, and audit table.
   - `005_v2_tables.sql` creates v2 core tables (`farmers`, `farm_visits`, etc.).
   - `006_v2_constraints_and_triggers.sql` adds integrity constraints, exclusion rules, and triggers.
   - `007_v2_rls_and_storage.sql` configures RLS and storage policies.
   - `008_v2_seed_catalogs.sql` seeds catalog placeholders and exact value-added services.
   - `009_fix_constraints.sql` tightens composite FK, unique index, and exclusion constraints.
   - `010_gate1_security_fixes.sql` addresses Gate 1 blockers B1-B6 forward-only (view security_invoker, authoritative times, consent RLS lockdown, phone masking, merge location repointing, unique catalog indexes, and small fixes).
   - `011_gate1_fixes_2.sql` resolves Gate 1 Gap A (server-calculated visit completion times and duration) and Gap B (explicit revocation of write privileges on views).
2. **Target Table Naming**:
   - v2 visit records reside in `public.farm_visits` and `public.farm_visits_full` to ensure 100% uninterrupted operation of legacy `public.visits` until final cutover.
3. **Storage Buckets**:
   - Legacy photos continue using `purchase-photos` with security-hardened folder policies.
   - v2 photos reside in private bucket `visit-photos` with signed URLs (10 minutes expiration).

---

## 4. Security & DPDP Compliance

1. **Consent Before Storage**:
   - Direct INSERT on `farmers` and `farmer_consents` is revoked for authenticated users (including admin). Only the service-role Edge Function inserts farmer records upon OTP verification. Test fixtures run as superuser / postgres.
   - `farmer_consents` is strictly append-only, enforced by database triggers preventing `UPDATE`, `DELETE`, and `TRUNCATE`.
2. **OTP Security**:
   - OTPs are stored only as SHA-256 hashes with HMAC phone identifiers in service-role-only table `consent_otps`.
   - Never returned to the client, never logged, auto-expires in 10 minutes.
3. **Time and Audit Integrity**:
   - **Phase 1 Enforced**: Visit times are server-authoritative via `tr_enforce_farm_visit_authoritative_times` (non-admins cannot insert completed visits, cannot specify self-chosen times, cannot modify `started_at` or `time_source`). Triggers overwrite client timestamps on `visit_photos.uploaded_at`, `visit_track_points.received_at`, and `app_events.at`.
   - **Phase 4 Scheduled (PENDING)**: Full transition to RPC-only writes (`start_visit`, `end_visit`, `sync_offline_visit`), revoking direct INSERT and UPDATE permissions on `farm_visits`.
