-- scripts/audit-prod-schema.sql
--
-- READ-ONLY schema audit for the PRODUCTION Supabase project.
--
-- Run this in the production SQL editor and paste the single result set back.
-- The whole script is wrapped in BEGIN READ ONLY ... ROLLBACK, so it cannot
-- modify anything even if a statement were wrong.
--
-- It selects structure and counts only. No names, phone numbers, emails or
-- other row contents are returned. Storage first-folder values are masked when
-- they look like a UUID, so no user id is exposed either.
--
-- It returns ONE result set (the last statement), which is the one to paste.
--
-- IF YOUR EDITOR SHOWS NO ROWS: some editors only display the result of the
-- final statement, which here is ROLLBACK. In that case run the file again
-- without the first and last lines (BEGIN READ ONLY ... and ROLLBACK) -- every
-- query below is a pure SELECT and cannot modify anything. If the editor warns
-- "there is already a transaction in progress", that is a harmless warning.
--
-- Assumes public.visits, public.visit_audit and public.profiles exist, per
-- section A2 of docs/MASTER_PROMPT.md. If one of them is missing you will get
-- an error naming it; tell me and I will adjust.
--
-- The audit answers, in order:
--   1  columns of public.visits
--   2  every policy in pg_policies for schemas public and storage
--   3  every function in public and storage, with prosecdef and proconfig
--   4  whether RLS is enabled per table (public, storage)
--   5  storage buckets, and object counts by bucket and first folder
--   6  row counts: profiles by role, visits (with/without deleted_at), visit_audit

begin read only;

with
-- 1. Columns of public.visits
visits_columns as (
  select 1 as sect,
         row_number() over (order by c.ordinal_position) as ord,
         '1. public.visits columns'::text as section,
         c.column_name::text as item,
         (c.data_type
          || case when c.is_nullable = 'YES' then ' NULL' else ' NOT NULL' end
          || coalesce(' DEFAULT ' || left(c.column_default, 80), ''))::text as detail
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = 'visits'
),

-- 2. Every policy in pg_policies for public and storage
policies as (
  select 2 as sect,
         row_number() over (order by p.schemaname, p.tablename, p.policyname) as ord,
         '2. RLS policies (public, storage)'::text as section,
         (p.schemaname || '.' || p.tablename || ' :: ' || p.policyname)::text as item,
         ('cmd=' || p.cmd
          || ' permissive=' || p.permissive
          || ' roles=' || array_to_string(p.roles, ',')
          || ' using=' || coalesce(p.qual, '-')
          || ' check=' || coalesce(p.with_check, '-'))::text as detail
  from pg_policies p
  where p.schemaname in ('public', 'storage')
),

-- 3. Every function in public and storage, with security-definer flag and config.
-- Extension schemas (extensions, pg_catalog, ...) are excluded to keep the
-- output focused on code this project owns.
functions as (
  select 3 as sect,
         row_number() over (order by p.prosecdef desc, n.nspname, p.proname) as ord,
         '3. functions (security definer / search_path)'::text as section,
         (n.nspname || '.' || p.proname || '('
          || pg_get_function_identity_arguments(p.oid) || ')')::text as item,
         ('security_definer=' || p.prosecdef
          || ' config=' || coalesce(array_to_string(p.proconfig, ','), '(none)'))::text as detail
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname in ('public', 'storage')
),

-- 4. RLS enabled per table
rls_status as (
  select 4 as sect,
         row_number() over (order by n.nspname, c.relname) as ord,
         '4. RLS status'::text as section,
         (n.nspname || '.' || c.relname)::text as item,
         ('rls_enabled=' || c.relrowsecurity
          || ' rls_forced=' || c.relforcerowsecurity)::text as detail
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where c.relkind = 'r'
    and n.nspname in ('public', 'storage')
),

-- 5a. Storage buckets
buckets as (
  select 5 as sect,
         row_number() over (order by b.name) as ord,
         '5a. storage buckets'::text as section,
         b.name::text as item,
         ('public=' || b."public"
          || ' file_size_limit=' || coalesce(b.file_size_limit::text, '-')
          || ' allowed_mime_types=' || coalesce(array_to_string(b.allowed_mime_types, ','), '-'))::text as detail
  from storage.buckets b
),

-- 5b. Object counts per bucket
bucket_counts as (
  select 5 as sect,
         row_number() over (order by o.bucket_id) as ord,
         '5b. storage objects per bucket'::text as section,
         o.bucket_id::text as item,
         ('objects=' || count(*)
          || ' distinct_first_folders=' || count(distinct split_part(o.name, '/', 1)))::text as detail
  from storage.objects o
  group by o.bucket_id
),

-- 5c. Object counts per first path segment (uuid segments masked)
folder_counts as (
  select 5 as sect,
         row_number() over (order by t.bucket_id, t.objects desc, t.folder) as ord,
         '5c. storage objects by first folder (uuid masked)'::text as section,
         (t.bucket_id || ' / ' || t.folder)::text as item,
         ('objects=' || t.objects)::text as detail
  from (
    select o.bucket_id,
           case
             when split_part(o.name, '/', 1) ~*
                  '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
               then '<uuid>'
             else split_part(o.name, '/', 1)
           end as folder,
           count(*) as objects
    from storage.objects o
    group by 1, 2
  ) t
),

-- 6a. profiles by role
profile_roles as (
  select 6 as sect,
         row_number() over (order by p.role::text) as ord,
         '6a. public.profiles by role'::text as section,
         coalesce(p.role::text, '(null)') as item,
         ('count=' || count(*))::text as detail
  from public.profiles p
  group by p.role
),

-- 6b. visits, with and without deleted_at
-- to_jsonb avoids assuming the column exists. The ->> operator (not ->) is used
-- on purpose: -> returns a JSON null for a NULL column, which count() would
-- count, whereas ->> returns SQL NULL. The ? operator reports column presence.
visit_counts as (
  select 6 as sect,
         2 as ord,
         '6b. public.visits row counts'::text as section,
         'public.visits'::text as item,
         ('total=' || count(*)
          || ' with_deleted_at=' || count(to_jsonb(v) ->> 'deleted_at')
          || ' without_deleted_at=' || (count(*) - count(to_jsonb(v) ->> 'deleted_at'))
          || ' has_deleted_at_column='
          || (select exists (
                select 1 from information_schema.columns
                where table_schema = 'public'
                  and table_name = 'visits'
                  and column_name = 'deleted_at'
             ))::text)::text as detail
  from public.visits v
),

-- 6c. visit_audit row count
audit_counts as (
  select 6 as sect,
         3 as ord,
         '6c. public.visit_audit row count'::text as section,
         'public.visit_audit'::text as item,
         ('count=' || count(*))::text as detail
  from public.visit_audit
)

select q.section, q.item, q.detail
from (
        select * from visits_columns
  union all select * from policies
  union all select * from functions
  union all select * from rls_status
  union all select * from buckets
  union all select * from bucket_counts
  union all select * from folder_counts
  union all select * from profile_roles
  union all select * from visit_counts
  union all select * from audit_counts
) q
order by q.sect, q.ord;

rollback;
