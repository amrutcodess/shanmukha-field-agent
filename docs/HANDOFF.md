# HANDOFF (update this before you stop working)

## Baseline (verified 2026-10-13 on commit ea54def; re-verified on 5ebf495)
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
| 0 Safety net and hotfix (A4) | Claude Code | Claude Code (small fixes only) | In progress: items 1-2 done, waiting on owner audit output |
| 1 Foundation, schema, RLS | Claude Code | none | Not started |
| 2 Admin basics | Claude Code | Antigravity | Not started |
| 3 Consent and onboarding | Claude Code | Antigravity | Not started |
| 4 Visit lifecycle | Claude Code | Antigravity | Not started |
| 5 Photos | Claude Code (storage rules) | Antigravity | Not started |
| 6 Monitoring and reporting | Claude Code (views, RPCs) | Antigravity | Not started |
| 7 Android | Claude Code (review) | Antigravity | Not started |
| 8 Release readiness and cutover | Claude Code (security review) | Antigravity (docs) | Not started |

## Next step
**Blocked on the owner.** Waiting for the owner to run `scripts/audit-prod-schema.sql` in the **production** SQL editor and paste the single result set.

Once it arrives: diff it against `supabase/migrations/001_init.sql` and report **all** schema drift (this is the rest of A4 item 2, and it feeds defect F1). A4 items 3-7 are **not** started.

## Gotchas and notes
- **`.claude/settings.json` (shipped in the handoff pack) denies `Read(.env)`, `Read(.env.local)`, `Read(.env.staging.local)`, `Read(.env.production)`, `Read(.env.production.local)`, `Read(supabase/.temp/**)`.** These are enforced at the harness level, not just for the Read tool: `Write` to a denied path and **Bash redirection** into one are blocked too. Creating or editing `.env` must therefore be done **by the owner outside these tools**.
- A repo-root `.env` exists with **staging** values (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`). It is untracked and ignored by `.env*`. Never read, print, or commit it.
- `supabase/.temp/` **was committed and was linked to a project (likely production)**. It is now untracked and ignored (files remain on disk). Before running **any** Supabase command, the CLI must be re-linked to staging: `npx supabase link --project-ref <staging-ref>`.
- `scripts/check-env.mjs` **fails closed**: it refuses unless `PROD_PROJECT_REF` is set and the resolved target ref differs from it. Run it before every migration, deploy, or seed. A test that it refuses production is still owed (A4 item 7).
- **Do not run any Supabase command during Phase 0** (A4 items 1-2).
- `scripts/audit-prod-schema.sql` is written but **has never been executed**: there is no local Postgres or psql in this environment, and installing a parser outside the repo is blocked. It is unverified against a real server. It is read-only by construction (`BEGIN READ ONLY` ... `ROLLBACK`, pure `SELECT`s).

## Log
(newest first: date, tool, what was done, test results, what the next tool must know)

### 2026-10-13 — Claude Code
- Setup, in order: moved `.env` and `.env.local` to `C:\Users\DELL\Documents\fieldagent-env-backup` (outside the repo, contents not read); confirmed both already ignored by `.gitignore:31` (`.env*`); extracted the handoff pack into the repo (`CLAUDE.md`, `docs/MASTER_PROMPT.md`, `docs/HANDOFF.md`, `.claude/settings.json`); created branch `v2` and committed those four as `4bcc87b`. The owner then created a fresh repo-root `.env` with staging values.
- **A4 item 1** (commit `5ebf495`): added `scripts/check-env.mjs`; `git rm -r --cached supabase/.temp` (9 files, still on disk); `.gitignore` gained `!.env.example` and `supabase/.temp/`; `vitest` moved to `devDependencies` and `package-lock.json` regenerated to match; F5 (removed the sign-in email `console.log`), F7 (viewport meta), F8 (`fontally:` -> `finally` in `MyVisits.tsx` and `Locations.tsx`); README stack line and clone URL.
- **A4 item 2**: added `scripts/audit-prod-schema.sql` (read-only; structure and counts only, storage first-folders masked when UUID-shaped).
- Test results after item 1: `npx tsc -b` pass, `npx vitest run` 8/8 pass, `npx vite build` pass (747 kB chunk), `npx oxlint` warnings only. Guard script exercised: refuses with `PROD_PROJECT_REF` unset, refuses when the target equals it, allows a differing target, warns rather than blocks under `--confirm-production`.
- **Note on F8**, for accuracy: `} fontally: {` was **not** a syntax error. It parses as a *labelled block statement*, so the original code already compiled and the flags already reset on the normal path. The fix only changes behaviour when the `catch` block rethrows. F8 was a real-defect-style cleanup, not a crash fix.
- The next tool must know: nothing has been pushed; `main` is untouched; `.env` is the owner's to manage; two commits sit on `v2`.
