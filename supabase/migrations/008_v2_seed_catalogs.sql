-- Migration: 008_v2_seed_catalogs.sql
-- Part of Phase 1: Foundation
-- Seeds exact required value_added_services and clearly labeled placeholder crops, stages, products, and pack sizes.

-- 1. Exact Value Added Services (Section B4.6)
insert into public.value_added_services (code, name_en, name_te, sort_order, is_active)
values
  ('sticky_traps', 'Sticky Traps', 'జిగురు అట్టలు', 1, true),
  ('haqdarshak', 'Haqdarshak', 'హక్‌దర్శక్', 2, true),
  ('drone_spraying', 'Drone Spraying', 'డ్రోన్ స్ప్రేయింగ్', 3, true),
  ('soil_testing', 'Soil Testing', 'మట్టి పరీక్ష', 4, true),
  ('weather_updates', 'Weather Updates', 'వాతావరణ సమాచారం', 5, true)
on conflict (code) do update set
  name_en = excluded.name_en,
  name_te = excluded.name_te,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- 2. Placeholder Crops & Per-Crop Stages
do $$
declare
  v_crop_paddy_id uuid;
  v_crop_cotton_id uuid;
  v_crop_chilli_id uuid;
  v_crop_maize_id uuid;
begin
  -- Insert or get Crops
  insert into public.crops (name_en, name_te, is_active)
  values ('Paddy', 'వరి', true)
  on conflict do nothing;
  select id into v_crop_paddy_id from public.crops where lower(btrim(name_en)) = 'paddy' limit 1;

  insert into public.crops (name_en, name_te, is_active)
  values ('Cotton', 'పత్తి', true)
  on conflict do nothing;
  select id into v_crop_cotton_id from public.crops where lower(btrim(name_en)) = 'cotton' limit 1;

  insert into public.crops (name_en, name_te, is_active)
  values ('Chilli', 'మిరప', true)
  on conflict do nothing;
  select id into v_crop_chilli_id from public.crops where lower(btrim(name_en)) = 'chilli' limit 1;

  insert into public.crops (name_en, name_te, is_active)
  values ('Maize', 'మొక్కజొన్న', true)
  on conflict do nothing;
  select id into v_crop_maize_id from public.crops where lower(btrim(name_en)) = 'maize' limit 1;

  -- Paddy Stages (Vegetative -> Tillering -> Panicle -> Flowering -> Grain Filling -> Harvest)
  if v_crop_paddy_id is not null then
    insert into public.crop_stages (crop_id, name_en, name_te, sort_order) values
      (v_crop_paddy_id, 'Seedling', 'నారు దశ', 1),
      (v_crop_paddy_id, 'Tillering', 'పిలకల దశ', 2),
      (v_crop_paddy_id, 'Panicle Initiation', 'చిరుపొట్ట దశ', 3),
      (v_crop_paddy_id, 'Flowering', 'పూత దశ', 4),
      (v_crop_paddy_id, 'Grain Filling', 'గింజ పాలుపోసుకునే దశ', 5),
      (v_crop_paddy_id, 'Harvest', 'కోత దశ', 6)
    on conflict do nothing;
  end if;

  -- Cotton Stages
  if v_crop_cotton_id is not null then
    insert into public.crop_stages (crop_id, name_en, name_te, sort_order) values
      (v_crop_cotton_id, 'Vegetative', 'శాఖీయ దశ', 1),
      (v_crop_cotton_id, 'Squaring', 'మొగ్గ దశ', 2),
      (v_crop_cotton_id, 'Flowering', 'పూత దశ', 3),
      (v_crop_cotton_id, 'Boll Formation', 'కాయ దశ', 4),
      (v_crop_cotton_id, 'Boll Opening / Harvest', 'పత్తి పగులు దశ / కోత', 5)
    on conflict do nothing;
  end if;

  -- Chilli Stages
  if v_crop_chilli_id is not null then
    insert into public.crop_stages (crop_id, name_en, name_te, sort_order) values
      (v_crop_chilli_id, 'Vegetative', 'శాఖీయ దశ', 1),
      (v_crop_chilli_id, 'Flowering', 'పూత దశ', 2),
      (v_crop_chilli_id, 'Fruit Setting', 'కాయల దశ', 3),
      (v_crop_chilli_id, 'Fruit Ripening', 'పండు దశ', 4),
      (v_crop_chilli_id, 'Harvest / Picking', 'కోత దశ', 5)
    on conflict do nothing;
  end if;

  -- Maize Stages
  if v_crop_maize_id is not null then
    insert into public.crop_stages (crop_id, name_en, name_te, sort_order) values
      (v_crop_maize_id, 'Seedling', 'మొలక దశ', 1),
      (v_crop_maize_id, 'Knee-high', 'మోకాలు ఎత్తు దశ', 2),
      (v_crop_maize_id, 'Tasseling / Silking', 'కంకి పూత దశ', 3),
      (v_crop_maize_id, 'Grain Filling', 'గింజ దశ', 4),
      (v_crop_maize_id, 'Harvest', 'కోత దశ', 5)
    on conflict do nothing;
  end if;
end $$;

-- 3. Placeholder Products & Product Pack Sizes (with composite key)
do $$
declare
  v_prod1_id uuid;
  v_prod2_id uuid;
  v_prod3_id uuid;
  v_prod4_id uuid;
begin
  insert into public.products (name_en, name_te, is_active)
  values ('Shanmukha Bio-Shield', 'షణ్ముఖ బయో-షీల్డ్', true)
  on conflict do nothing;
  select id into v_prod1_id from public.products where name_en = 'Shanmukha Bio-Shield' limit 1;

  insert into public.products (name_en, name_te, is_active)
  values ('Shanmukha Crop-Guard', 'షణ్ముఖ క్రాప్-గార్డ్', true)
  on conflict do nothing;
  select id into v_prod2_id from public.products where name_en = 'Shanmukha Crop-Guard' limit 1;

  insert into public.products (name_en, name_te, is_active)
  values ('Shanmukha Root-Max', 'షణ్ముఖ రూట్-మ్యాక్స్', true)
  on conflict do nothing;
  select id into v_prod3_id from public.products where name_en = 'Shanmukha Root-Max' limit 1;

  insert into public.products (name_en, name_te, is_active)
  values ('Shanmukha Micro-Gold', 'షణ్ముఖ మైక్రో-గోల్డ్', true)
  on conflict do nothing;
  select id into v_prod4_id from public.products where name_en = 'Shanmukha Micro-Gold' limit 1;

  -- Sizes for Product 1
  if v_prod1_id is not null then
    insert into public.product_sizes (product_id, size_label, sort_order) values
      (v_prod1_id, '250 ml', 1),
      (v_prod1_id, '500 ml', 2),
      (v_prod1_id, '1000 ml', 3)
    on conflict do nothing;
  end if;

  -- Sizes for Product 2
  if v_prod2_id is not null then
    insert into public.product_sizes (product_id, size_label, sort_order) values
      (v_prod2_id, '100 ml', 1),
      (v_prod2_id, '250 ml', 2),
      (v_prod2_id, '500 ml', 3)
    on conflict do nothing;
  end if;

  -- Sizes for Product 3
  if v_prod3_id is not null then
    insert into public.product_sizes (product_id, size_label, sort_order) values
      (v_prod3_id, '500 gm', 1),
      (v_prod3_id, '1 kg', 2),
      (v_prod3_id, '5 kg', 3)
    on conflict do nothing;
  end if;

  -- Sizes for Product 4
  if v_prod4_id is not null then
    insert into public.product_sizes (product_id, size_label, sort_order) values
      (v_prod4_id, '250 gm', 1),
      (v_prod4_id, '500 gm', 2),
      (v_prod4_id, '1 kg', 3)
    on conflict do nothing;
  end if;
end $$;
