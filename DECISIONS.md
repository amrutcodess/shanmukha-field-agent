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
| **"No overlapping visits"** | Enforced at database level via `btree_gist` exclusion constraint per agent | An agent cannot have overlapping active/completed visit time ranges. | Decided (per prompt B4.8) |
| **Client Viewer phone & export access** | `client_sees_phone = false`, `client_can_export = false` | DPDP data minimization and role separation. Configurable by admin in `app_config`. | Decided (per prompt B4.12) |
| **Farmer ID fields (Father's Name, Aadhaar, etc.)** | **Not collected** | DPDP Act 2023 mandates collecting only what is strictly necessary for advisory and yield verification. | Decided (Open item for client counsel) |
| **DPDP Consent Notice & Retention** | Placeholder draft notice in English and Telugu; retention period configurable | Requires formal vetting by Shanmukha Agritech legal counsel and Telugu native speaker. | Pending legal review |
| **iPhone agent support** | Web PWA fallback (`tracking_mode = 'web_basic'`) | iPhone users use Safari web app capturing start/end fixes and while-open tracking points. Android receives full native Capacitor app with foreground service. | Decided (per prompt B2) |

---

## 2. Database & Migration Strategy

1. **Forward-Only, Additive Migrations**:
   - `001_init.sql` is strictly preserved and never modified.
   - `002_reconcile_prod.sql` synchronizes drift discovered during production audit (`prescription_image_path`, `visits_full`, policy naming).
   - `003_hotfix_v1.sql` addresses security/data integrity hotfixes F1–F4 and F9 while keeping v1 operational.
   - `004_v2_foundation.sql` creates the v2 schema in parallel (`farm_visits`, `farmers`, `farmer_consents`, etc.) without dropping or breaking legacy v1 tables.
2. **Target Table Naming**:
   - v2 visit records will reside in `public.farm_visits` and `public.farm_visits_full` to ensure 100% uninterrupted operation of legacy `public.visits` until final cutover.
3. **Storage Buckets**:
   - Legacy photos continue using `purchase-photos` with security-hardened folder policies.
   - v2 photos will reside in private bucket `visit-photos` with path `farmers/{farmer_id}/visits/{visit_id}/{kind}-{uuid}.jpg`.

---

## 3. Security & DPDP Compliance

1. **Consent Before Storage**:
   - No farmer personal record is written to `farmers` until OTP verification succeeds.
   - `farmer_consents` is strictly append-only, enforced by RLS and database triggers that throw exceptions on any `UPDATE` or `DELETE` attempt by ANY role.
2. **OTP Security**:
   - OTPs are stored only as SHA-256 hashes with HMAC phone identifiers in a service-role-only table `consent_otps`.
   - Never returned to the client, never logged, and auto-expires in 10 minutes.
   - Zero bypass in production (`APP_ENV=production` rejects any bypass).
3. **Time and Audit Integrity**:
   - Visit start and end timestamps are generated solely by the server (`now()` in RPCs).
   - Immutable visit audit columns (`agent_id`, `client_uuid`, `created_at`, `deleted_at`) cannot be modified by agents.
