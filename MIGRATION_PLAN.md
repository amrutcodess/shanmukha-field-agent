# Database Migration & Cutover Plan

This document describes the schema evolution strategy from v1 to v2 for Shanmukha Agritech Field Agent.

---

## 1. Migration Sequence

| Step | Migration File | Description | Target Environment |
|---|---|---|---|
| **001** | `001_init.sql` | Baseline v1 schema (Regions, Districts, Villages, Profiles, Crops, Products, Visits, Visit Audit, Storage). | Already in production |
| **002** | `002_reconcile_prod.sql` | Reconciles audited production schema: ensures `prescription_image_path` column on `visits`, rebuilds `visits_full`, aligns policy names. | Staging rehearsal -> Production |
| **003** | `003_hotfix_v1.sql` | Security & integrity hotfixes: `is_active_agent()`, `prevent_visit_tampering()` trigger, split USING/WITH CHECK on `visits` UPDATE, `purchase-photos` path support, `search_path=public` on `SECURITY DEFINER` functions, location collision fixes. | Staging rehearsal -> Production (if v1 is live) |
| **004** | `004_v2_foundation.sql` | Creates v2 foundation tables: `farmers`, `farmer_assignments`, `crop_cycles`, `farm_visits`, `visit_photos`, `visit_track_points`, `visit_services`, `visit_purchase_items`, `app_events`, `consent_otps`, `farmer_consents`, `audit_log`, `app_config`, `crop_stages`, `product_sizes`, `value_added_services`. Non-overlapping visit constraints, append-only consent trigger. | Staging |
| **005** | `005_v2_functions_rpcs.sql` | Server-time visit RPCs (`start_visit`, `end_visit`, `sync_offline_visit`), `get_server_time`, `create_farmer_with_consent`, `withdraw_consent`, `haversine_m`. | Staging |
| **006** | `006_cutover_v1_to_v2.sql` | Final cutover script (executed only during Phase 8 maintenance window with owner approval): migrates legacy visit/farmer data if required, marks legacy `visits` read-only. | Staging rehearsal -> Production |

---

## 2. Legacy Data Strategy

Per Section A7:
- If production database contains **test data only**:
  - Export full backup of legacy records.
  - Purge test records cleanly.
- If production database contains **real farmer data**:
  - Migrate legacy visits into `farmers` table with `consent_status = 'legacy_unverified'`.
  - Inactive for new visits until DPDP OTP consent is explicitly recorded by an agent during the first v2 visit.
  - Legacy `visits` remain readable in `visits_full` for historical continuity.

---

## 3. Rollback Plan (`cutover_down.sql`)

If a rollback is required during cutover:
1. Re-enable write permissions on legacy `visits` table.
2. Point Vercel production deployment back to the v1 stable release tag.
3. Keep v2 tables dormant (no destructive drops needed).
