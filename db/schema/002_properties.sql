-- Property schema applied to Supabase production.
-- Database access model: Railway backend only; RLS is enabled with no public policies.

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  title text not null,
  city text not null,
  address text not null,
  description text not null default '',
  price_per_night numeric(12,2) not null check (price_per_night > 0),
  currency text not null default 'BYN' check (currency = 'BYN'),
  max_guests integer not null check (max_guests between 1 and 50),
  amenities jsonb not null default '[]'::jsonb check (jsonb_typeof(amenities) = 'array'),
  house_rules text not null default '',
  check_in_time time,
  check_out_time time,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists properties_owner_id_idx on public.properties(owner_id);
create index if not exists properties_status_city_idx on public.properties(status, city);
alter table public.properties enable row level security;

create table if not exists public.property_photos (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  storage_path text not null,
  sort_order integer not null default 0 check (sort_order >= 0),
  is_cover boolean not null default false,
  created_at timestamptz not null default now(),
  unique(property_id, storage_path)
);

create index if not exists property_photos_property_id_idx
  on public.property_photos(property_id, sort_order);
alter table public.property_photos enable row level security;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'property-photos',
  'property-photos',
  true,
  10485760,
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
