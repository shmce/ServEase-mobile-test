-- ServEase service category hierarchy
-- Run in Supabase SQL Editor

alter table provider_catalog_svc.service_categories
  add column if not exists parent_id uuid references provider_catalog_svc.service_categories(id) on delete set null;

alter table provider_catalog_svc.service_categories
  add column if not exists category_level text not null default 'subcategory';

alter table provider_catalog_svc.service_categories
  drop constraint if exists service_categories_category_level_check;

alter table provider_catalog_svc.service_categories
  add constraint service_categories_category_level_check
  check (category_level in ('category', 'subcategory'));

create index if not exists service_categories_parent_id_idx
  on provider_catalog_svc.service_categories(parent_id);

with parent_rows(name, slug, is_active) as (
  values
    ('Home Maintenance & Repair', 'home-maintenance-repair', true),
    ('Beauty, Wellness & Personal Care', 'beauty-wellness-personal-care', true),
    ('Education & Professional Services', 'education-professional-services', true),
    ('Domestic & Cleaning Services', 'domestic-cleaning-services', true),
    ('Pet Services', 'pet-services', true),
    ('Events & Entertainment', 'events-entertainment', true),
    ('Automotive & Tech Support', 'automotive-tech-support', true)
)
insert into provider_catalog_svc.service_categories (name, slug, is_active, category_level, parent_id)
select name, slug, is_active, 'category', null
from parent_rows
on conflict (slug) do update
set
  name = excluded.name,
  is_active = excluded.is_active,
  category_level = 'category',
  parent_id = null;

with subcategory_rows(parent_slug, name, slug, is_active) as (
  values
    ('home-maintenance-repair', 'Plumbing', 'plumbing', true),
    ('home-maintenance-repair', 'Electrical', 'electrical', true),
    ('home-maintenance-repair', 'Carpentry', 'carpentry', true),
    ('home-maintenance-repair', 'Painting', 'painting', true),
    ('home-maintenance-repair', 'Other', 'home-maintenance-other', true),
    ('beauty-wellness-personal-care', 'Hair Styling', 'hair-styling', true),
    ('beauty-wellness-personal-care', 'Makeup Artist', 'makeup-artist', true),
    ('beauty-wellness-personal-care', 'Massage Therapy', 'massage-therapy', true),
    ('beauty-wellness-personal-care', 'Nails', 'nails', true),
    ('beauty-wellness-personal-care', 'Other', 'beauty-wellness-other', true),
    ('education-professional-services', 'Academic Tutor', 'academic-tutor', true),
    ('education-professional-services', 'Language Teacher', 'language-teacher', true),
    ('education-professional-services', 'Music Lessons', 'music-lessons', true),
    ('education-professional-services', 'Other', 'education-professional-other', true),
    ('domestic-cleaning-services', 'House Cleaning', 'house-cleaning', true),
    ('domestic-cleaning-services', 'Laundry', 'laundry', true),
    ('domestic-cleaning-services', 'Ironing', 'ironing', true),
    ('domestic-cleaning-services', 'Deep Cleaning', 'deep-cleaning', true),
    ('domestic-cleaning-services', 'Other', 'domestic-cleaning-other', true),
    ('pet-services', 'Grooming', 'grooming', true),
    ('pet-services', 'Walking', 'walking', true),
    ('pet-services', 'Training', 'training', true),
    ('pet-services', 'Sitting', 'sitting', true),
    ('events-entertainment', 'Photography', 'photography', true),
    ('events-entertainment', 'DJ', 'dj', true),
    ('events-entertainment', 'Host', 'host', true),
    ('events-entertainment', 'Catering', 'catering', true),
    ('automotive-tech-support', 'Car Wash', 'car-wash', true),
    ('automotive-tech-support', 'Mechanic', 'mechanic', true),
    ('automotive-tech-support', 'Computer Repair', 'computer-repair', true),
    ('automotive-tech-support', 'Mobile Repair', 'mobile-repair', true)
)
insert into provider_catalog_svc.service_categories (name, slug, is_active, category_level, parent_id)
select
  s.name,
  s.slug,
  s.is_active,
  'subcategory',
  p.id
from subcategory_rows s
join provider_catalog_svc.service_categories p
  on p.slug = s.parent_slug
on conflict (slug) do update
set
  name = excluded.name,
  is_active = excluded.is_active,
  category_level = 'subcategory',
  parent_id = excluded.parent_id;

update provider_catalog_svc.service_categories
set
  category_level = case when parent_id is null then 'category' else 'subcategory' end
where category_level is distinct from case when parent_id is null then 'category' else 'subcategory' end;
