-- ServEase address schema
-- Add your SQL migrations here

-- Service Categories Table
create table if not exists public.service_categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  description text,
  icon_name text default 'wrench',
  bg_color text default '#E8F5E9',
  icon_color text default '#2E7D32',
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Enable RLS
alter table public.service_categories enable row level security;

-- Allow public read access
create policy "service_categories are publicly readable" on public.service_categories
  for select
  using (true);

-- Insert seed data
insert into public.service_categories (name, description, icon_name, bg_color, icon_color) values
  ('Plumbing', 'Pipe repairs, installations, and water systems', 'pipe', '#E3F2FD', '#1565C0'),
  ('Electrical', 'Wiring, repairs, and electrical system maintenance', 'lightning-bolt', '#FFF3E0', '#E65100'),
  ('Cleaning', 'House cleaning, carpet cleaning, and deep cleaning services', 'broom', '#F3E5F5', '#6A1B9A'),
  ('Carpentry', 'Wood work, furniture repair, and home renovations', 'hammer', '#FCE4EC', '#C2185B'),
  ('HVAC', 'Air conditioning, heating, and ventilation services', 'snowflake', '#E0F2F1', '#00695C'),
  ('Locksmith', 'Lock installation, repair, and key replacement', 'lock', '#FBE9E7', '#BF360C'),
  ('Pest Control', 'Termite treatment and pest elimination services', 'bug', '#F1F8E9', '#558B2F'),
  ('Painting', 'Interior and exterior painting services', 'paint-brush', '#EDE7F6', '#3F51B5')
on conflict (name) do nothing;
