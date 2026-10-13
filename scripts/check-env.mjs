#!/usr/bin/env node
/**
 * check-env.mjs
 *
 * Guard for Supabase commands. Run this before every migration, Edge Function
 * deploy, seed, or any other command that touches a Supabase project.
 *
 * It refuses to continue when the target project cannot be proven to be
 * non-production. The production project ref is NEVER hard-coded: it is read
 * from the PROD_PROJECT_REF environment variable.
 *
 * Usage:
 *   node scripts/check-env.mjs [--project-ref <ref>] [--confirm-production]
 *
 * The target ref is resolved in this order:
 *   1. --project-ref <ref>
 *   2. VITE_SUPABASE_URL in the process environment
 *   3. VITE_SUPABASE_URL in the first of .env.staging.local, .env.local, .env
 *
 * This script is read-only. It prints project refs only; it never prints any
 * URL, key, or other value from an environment file.
 *
 * Exit codes:
 *   0  safe to continue
 *   1  refused (production target, or safety could not be verified)
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ENV_CANDIDATES = ['.env.staging.local', '.env.local', '.env'];
const CONFIRM_FLAG = '--confirm-production';

/** Extract a Supabase project ref from a project URL. Returns null if absent. */
export function refFromUrl(url) {
  if (!url) return null;
  const value = String(url).trim().replace(/^["']|["']$/g, '');
  const match = value.match(/^https?:\/\/([a-z0-9-]+)\.supabase\.(co|in)(?:\/|$)/i);
  return match ? match[1].toLowerCase() : null;
}

/** Read a KEY=VALUE env file. Returns {} when the file is missing. */
function readEnvFile(name) {
  let text;
  try {
    text = readFileSync(join(REPO_ROOT, name), 'utf8');
  } catch {
    return {};
  }

  const values = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

/** Resolve the ref this command is about to act on, plus where it came from. */
export function resolveTargetRef(argv, env) {
  const flagIndex = argv.indexOf('--project-ref');
  if (flagIndex !== -1) {
    const value = argv[flagIndex + 1];
    if (!value) return { ref: null, source: '--project-ref (missing value)' };
    return { ref: value.trim().toLowerCase(), source: '--project-ref' };
  }

  if (env.VITE_SUPABASE_URL) {
    return { ref: refFromUrl(env.VITE_SUPABASE_URL), source: 'VITE_SUPABASE_URL (environment)' };
  }

  for (const name of ENV_CANDIDATES) {
    const values = readEnvFile(name);
    if (values.VITE_SUPABASE_URL) {
      return { ref: refFromUrl(values.VITE_SUPABASE_URL), source: `VITE_SUPABASE_URL (${name})` };
    }
  }

  return { ref: null, source: 'not found' };
}

const HOW_TO_FIX = [
  'Set the production project ref before running the command, for example:',
  '',
  '  PROD_PROJECT_REF=<prod-ref> node scripts/check-env.mjs --project-ref <staging-ref>',
  '',
  'PROD_PROJECT_REF must be the production project ref. It is intentionally not',
  'committed, because a ref baked into the repo cannot protect anything.',
].join('\n');

function refuse(reason, detail) {
  console.error('\ncheck-env: REFUSED\n');
  console.error(`  ${reason}`);
  if (detail) console.error(`  ${detail}`);
  console.error(`\n${HOW_TO_FIX}\n`);
  process.exit(1);
}

function main() {
  const argv = process.argv.slice(2);
  const confirmProduction = argv.includes(CONFIRM_FLAG);

  const prodRef = (process.env.PROD_PROJECT_REF || '').trim().toLowerCase();
  if (!prodRef) {
    refuse(
      'PROD_PROJECT_REF is not set, so this command cannot be proven safe.',
      'Refusing rather than guessing which project is production.'
    );
  }

  const { ref: targetRef, source } = resolveTargetRef(argv, process.env);
  if (!targetRef) {
    refuse(
      `Could not determine the target project ref (looked in: ${source}).`,
      'Pass --project-ref <ref>, or set VITE_SUPABASE_URL.'
    );
  }

  if (targetRef === prodRef) {
    if (!confirmProduction) {
      refuse(
        `Target project ref ${targetRef} is the PRODUCTION project.`,
        `Re-run with ${CONFIRM_FLAG} only with explicit written approval.`
      );
    }
    console.warn(`\ncheck-env: target ${targetRef} is PRODUCTION, allowed by ${CONFIRM_FLAG}.`);
    console.warn('check-env: this required explicit approval. Proceed only if that was given.\n');
    return;
  }

  console.log(`check-env: OK. target ref ${targetRef} (from ${source}) is not the production project.`);
}

// Only run when invoked directly, so tests can import the helpers above.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
