import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { refFromUrl, resolveTargetRef } from '../../scripts/check-env.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('check-env utility', () => {
  it('extracts project ref from supabase URLs', () => {
    expect(refFromUrl('https://xyzcompany.supabase.co')).toBe('xyzcompany');
    expect(refFromUrl('https://abc-123.supabase.in')).toBe('abc-123');
    expect(refFromUrl('https://test-ref.supabase.co/rest/v1')).toBe('test-ref');
    expect(refFromUrl('not-a-url')).toBeNull();
    expect(refFromUrl('')).toBeNull();
  });

  it('resolves target ref from CLI arguments', () => {
    const res = resolveTargetRef(['--project-ref', 'my-staging-ref'], {});
    expect(res.ref).toBe('my-staging-ref');
    expect(res.source).toBe('--project-ref');
  });

  it('resolves target ref from environment variables', () => {
    const res = resolveTargetRef([], { VITE_SUPABASE_URL: 'https://staging-env.supabase.co' });
    expect(res.ref).toBe('staging-env');
    expect(res.source).toContain('VITE_SUPABASE_URL');
  });

  describe('CLI execution guard tests', () => {
    const scriptPath = join(__dirname, '../../scripts/check-env.mjs');

    it('refuses when PROD_PROJECT_REF is missing', () => {
      const result = spawnSync(process.execPath, [scriptPath, '--project-ref', 'staging-ref'], {
        env: { ...process.env, PROD_PROJECT_REF: '' },
        encoding: 'utf8',
      });
      expect(result.status).toBe(1);
      expect(result.stderr).toContain('PROD_PROJECT_REF is not set');
    });

    it('refuses when target matches PROD_PROJECT_REF without confirmation', () => {
      const result = spawnSync(process.execPath, [scriptPath, '--project-ref', 'prod-ref-123'], {
        env: { ...process.env, PROD_PROJECT_REF: 'prod-ref-123' },
        encoding: 'utf8',
      });
      expect(result.status).toBe(1);
      expect(result.stderr).toContain('is the PRODUCTION project');
    });

    it('allows execution when target differs from PROD_PROJECT_REF', () => {
      const result = spawnSync(process.execPath, [scriptPath, '--project-ref', 'staging-ref-456'], {
        env: { ...process.env, PROD_PROJECT_REF: 'prod-ref-123' },
        encoding: 'utf8',
      });
      expect(result.status).toBe(0);
      expect(result.stdout).toContain('is not the production project');
    });

    it('allows execution against production when --confirm-production is passed', () => {
      const result = spawnSync(process.execPath, [scriptPath, '--project-ref', 'prod-ref-123', '--confirm-production'], {
        env: { ...process.env, PROD_PROJECT_REF: 'prod-ref-123' },
        encoding: 'utf8',
      });
      expect(result.status).toBe(0);
      expect(result.stderr).toContain('allowed by --confirm-production');
    });
  });
});
