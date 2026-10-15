# Database Migration & Cutover Plan

This document describes the schema evolution strategy from v1 to v2 for Shanmukha Agritech Field Agent.

---

## 1. Migration Sequence (Forward-Only)

| Step | Migration File | Description | Target Environment | Status |
|---|---|---|---|---|
| **001** | `001_init.sql` | Baseline v1 schema (Regions, Districts, Villages, Profiles, Crops, Products, Visits, Visit Audit, Storage). | Staging & Production | Applied |
| **002** | `002_reconcile_prod.sql` | Reconciles audited production schema: ensures `prescription_image_path` column on `visits`, rebuilds `visits_full`, aligns policy names. | Staging | Applied |
| **003** | `003_hotfix_v1.sql` | Security & integrity hotfixes: `is_active_agent()`, `prevent_visit_tampering()` trigger, split USING/WITH CHECK on `visits` UPDATE, `purchase-photos` path support, `search_path=public` on `SECURITY DEFINER` functions, location collision fixes. | Staging | Applied |
| **004** | `004_v2_roles_and_config.sql` | Extends profiles roles (`client_viewer`), adds `must_change_password`, creates `app_config` defaults and `audit_log` table. | Staging | Applied |
| **005** | `005_v2_tables.sql` | Creates v2 core tables (`farmers`, `farmer_assignments`, `crop_cycles`, `farm_visits`, `visit_photos`, `visit_track_points`, `visit_services`, `visit_purchase_items`, `app_events`, `consent_otps`, `farmer_consents`, `crop_stages`, `product_sizes`, `value_added_services`). | Staging | Applied |
| **006** | `006_v2_constraints_and_triggers.sql` | Non-overlapping visit exclusion (`btree_gist`), unique in-progress index, consent append-only triggers, visit completion validation, farmer code sequence. | Staging | Applied |
| **007** | `007_v2_rls_and_storage.sql` | Configures strict RLS across all tables, private `visit-photos` storage bucket and access policies, `farmers_full` and `farm_visits_full` views. | Staging | Applied |
| **008** | `008_v2_seed_catalogs.sql` | Seeds required value-added services and placeholder catalog items. | Staging | Applied |
| **009** | `009_fix_constraints.sql` | Corrects composite foreign key, agent in-progress uniqueness, and exclusion constraint definitions. | Staging | Applied |
| **010** | `010_gate1_security_fixes.sql` | Forward-only resolution of Gate 1 blockers B1-B6: sets `security_invoker = true` on views, enforces server-authoritative times on INSERT, closes consent bypass, enforces DB phone masking (`farmers_masked`), adds farmer repointing to `admin_merge_location`, deduplicates crops/products and adds unique indexes, and small fixes. | Staging | Applied |
| **011** | `011_gate1_fixes_2.sql` | Forward-only resolution of Gate 1 Gap A (server-calculated visit completion times & duration) and Gap B (explicit revocation of write privileges on views). | Staging | Ready for staging execution |
| **Phase 4** | `012_v2_rpcs_and_strict_writes.sql` | RPC-only writes (`start_visit`, `end_visit`, `sync_offline_visit`), revoking direct INSERT and UPDATE permissions on `farm_visits`. | Staging | **PENDING (Phase 4)** |
| **Phase 8** | `cutover_v1_to_v2.sql` | Final cutover script (executed only during maintenance window with owner approval): migrates legacy visit/farmer data if required, marks legacy `visits` read-only. | Staging rehearsal -> Production | **PENDING (Phase 8)** |

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
