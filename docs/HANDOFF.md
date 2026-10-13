# HANDOFF (update this before you stop working)

## Baseline (verified 2026-10-13 on commit ea54def)
- `npx tsc -b` passes. `npx vitest run`: 8 tests in 3 files pass. `npx vite build` passes (single 747 kB chunk). `npx oxlint`: warnings only.
- Production database has only `001_init.sql` in the repo, but production may have drifted (see defect F1 in `docs/MASTER_PROMPT.md`, section A3). Not yet audited.

## Owner decisions still needed (the project owner will answer)
- [ ] Is the live v1 app being used by real agents right now?
- [ ] Does the production database hold real farmer data or test data?
- [ ] Staging Supabase project created and keys placed in `.env.staging.local`?
- [ ] Vercel "Preview" environment variables point to staging (not production)?

## Phase status
| Phase | Backend slice | Frontend slice | Status |
|---|---|---|---|
| 0 Safety net and hotfix (A4) | Claude Code | Claude Code (small fixes only) | Not started |
| 1 Foundation, schema, RLS | Claude Code | none | Not started |
| 2 Admin basics | Claude Code | Antigravity | Not started |
| 3 Consent and onboarding | Claude Code | Antigravity | Not started |
| 4 Visit lifecycle | Claude Code | Antigravity | Not started |
| 5 Photos | Claude Code (storage rules) | Antigravity | Not started |
| 6 Monitoring and reporting | Claude Code (views, RPCs) | Antigravity | Not started |
| 7 Android | Claude Code (review) | Antigravity | Not started |
| 8 Release readiness and cutover | Claude Code (security review) | Antigravity (docs) | Not started |

## Next step
Phase 0, items 1 and 2 of section A4: repo hygiene, then write `scripts/audit-prod-schema.sql` and stop for the owner to run it in production and paste the output.

## Gotchas and notes
(add as you learn them)

## Log
(newest first: date, tool, what was done, test results, what the next tool must know)
