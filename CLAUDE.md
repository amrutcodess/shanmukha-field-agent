# Shanmukha Agritech Field Agent app (upgrade to v2)

Live app: React 19, Vite 8, Tailwind 4, TypeScript 6, Supabase (Postgres, Auth, Storage, Edge Functions), deployed on Vercel. **`main` auto-deploys to production.** Sensitive personal data (farmer names, phones, farm locations, photos, agent movements).

## Read first
- `docs/MASTER_PROMPT.md` is the full plan. Part A = how to change the live system safely. Part B = the target product spec. **Part A wins on conflicts.** Read only the section you need (search the headings); do not load the whole file unless necessary.
- `docs/HANDOFF.md` = current status, next step, gotchas. Read it at the start of every session and **update it before you stop.**

## Non-negotiable rules
1. **Never touch the production Supabase project or production keys.** Staging only. Never read, print, or commit `.env` files or keys.
2. Work on branch `v2`. **Never push to `main`. Never merge PRs.**
3. Migrations are additive and forward-only, new files only (`npx supabase migration new <name>`). Never edit `supabase/migrations/001_init.sql` (already applied in production). Run `scripts/check-env.mjs` before any database or deploy command.
4. The new visit table is `farm_visits` (the legacy `visits` table stays untouched until cutover).
5. No OTP bypass in production code. No secrets in client code. No personal data in logs.
6. UI strings go in `src/i18n/en.json` and `te.json`, with identical keys.
7. Do not downgrade or replace the stack.

## Two AI tools share this repo (one active at a time)
- **Claude Code owns:** `supabase/` (migrations, functions, DB tests), `scripts/`, `docs/API_CONTRACT.md`, security review. Also the Phase 0 repo hygiene, including the small `src/` fixes listed in A4.
- **Antigravity owns:** `src/`, `android/`, `public/`, Play Store docs.
- Do not edit the other tool's folders except to fix a build break; note it in `docs/HANDOFF.md`.
- Backend slice of a phase first, then the frontend slice. The contract between them is the migration, `docs/API_CONTRACT.md` (every RPC, its inputs and outputs), and the generated types.
- Commit before the other tool starts. Never run both tools at once in the same folder.

## Commands
- `npm ci`, `npx tsc -b`, `npx vitest run`, `npx oxlint`, `npx vite build`
- Use `npx supabase ...` (no global install; do not assume Docker). Database tests are SQL scripts in `supabase/tests/`, run against the **staging** project.

## Working style
- One slice per session; `/clear` between unrelated slices; plan before big changes.
- Commit small. Before stopping: `tsc` and `vitest` pass, `docs/HANDOFF.md` updated.
- Report real command output. Never claim a test passed without running it. If something cannot be verified (for example no live database access), say so.
