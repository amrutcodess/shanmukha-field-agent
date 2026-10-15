-- Seed file: supabase/seed.sql
-- Shanmukha Agritech initial crops, products, and sample locations

-- Seed Crops (idempotent with unique index on lower(btrim(name_en)))
insert into public.crops (name_en, name_te, is_active) values
  ('Paddy', 'వరి', true),
  ('Cotton', 'పత్తి', true),
  ('Chilli', 'మిర్చి', true),
  ('Maize', 'మొక్కజొన్న', true),
  ('Groundnut', 'వేరుశనగ', true),
  ('Bengal Gram', 'శనగ', true)
on conflict do nothing;

-- Seed Products (idempotent with unique index on lower(btrim(name_en)))
insert into public.products (name_en, name_te, is_active) values
  ('Shanmukha Bio-Gro', 'షణ్ముఖ బయో-గ్రో', true),
  ('CropShield Max', 'క్రాప్‌షీల్డ్ మాక్స్', true),
  ('RootBoost Special', 'రూట్‌బూస్ట్ స్పెషల్', true),
  ('YieldPlus Nano', 'ఈల్డ్‌ప్లస్ నానో', true)
on conflict do nothing;

-- Seed Initial Locations with direct idempotent inserts
do $$
declare
  v_reg_guntur uuid;
  v_reg_warangal uuid;
  v_dist_guntur uuid;
  v_dist_warangal uuid;
begin
  -- Regions
  insert into public.regions (name) values ('Guntur Region')
  on conflict do nothing;
  select id into v_reg_guntur from public.regions where lower(btrim(name)) = lower('Guntur Region') limit 1;

  insert into public.regions (name) values ('Warangal Region')
  on conflict do nothing;
  select id into v_reg_warangal from public.regions where lower(btrim(name)) = lower('Warangal Region') limit 1;

  -- Districts & Villages for Guntur Region
  if v_reg_guntur is not null then
    insert into public.districts (region_id, name) values (v_reg_guntur, 'Guntur')
    on conflict do nothing;
    select id into v_dist_guntur from public.districts where region_id = v_reg_guntur and lower(btrim(name)) = lower('Guntur') limit 1;

    if v_dist_guntur is not null then
      insert into public.villages (district_id, name) values
        (v_dist_guntur, 'Tenali'),
        (v_dist_guntur, 'Mangalagiri')
      on conflict do nothing;
    end if;
  end if;

  -- Districts & Villages for Warangal Region
  if v_reg_warangal is not null then
    insert into public.districts (region_id, name) values (v_reg_warangal, 'Warangal')
    on conflict do nothing;
    select id into v_dist_warangal from public.districts where region_id = v_reg_warangal and lower(btrim(name)) = lower('Warangal') limit 1;

    if v_dist_warangal is not null then
      insert into public.villages (district_id, name) values
        (v_dist_warangal, 'Narsampet'),
        (v_dist_warangal, 'Parkal')
      on conflict do nothing;
    end if;
  end if;
end $$;
