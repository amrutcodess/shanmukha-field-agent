-- Seed file: supabase/seed.sql
-- Shanmukha Agritech initial crops, products, and sample locations

-- Seed Crops
insert into public.crops (name_en, name_te, is_active) values
  ('Paddy', 'వరి', true),
  ('Cotton', 'పత్తి', true),
  ('Chilli', 'మిర్చి', true),
  ('Maize', 'మొక్కజొన్న', true),
  ('Groundnut', 'వేరుశనగ', true),
  ('Bengal Gram', 'శనగ', true)
on conflict do nothing;

-- Seed Products
insert into public.products (name_en, name_te, is_active) values
  ('Shanmukha Bio-Gro', 'షణ్ముఖ బయో-గ్రో', true),
  ('CropShield Max', 'క్రాప్‌షీల్డ్ మాక్స్', true),
  ('RootBoost Special', 'రూట్‌బూస్ట్ స్పెషల్', true),
  ('YieldPlus Nano', 'ఈల్డ్‌ప్లస్ నానో', true)
on conflict do nothing;

-- Seed Initial Locations via RPC
select public.get_or_create_location('Guntur Region', 'Guntur', 'Tenali');
select public.get_or_create_location('Guntur Region', 'Guntur', 'Mangalagiri');
select public.get_or_create_location('Warangal Region', 'Warangal', 'Narsampet');
select public.get_or_create_location('Warangal Region', 'Warangal', 'Parkal');
