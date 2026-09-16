create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  guest_id uuid not null references public.users(id) on delete cascade,
  check_in date not null,
  check_out date not null,
  guests integer not null check (guests between 1 and 50),
  status text not null default 'pending' check (status in ('pending','confirmed','declined','cancelled')),
  price_per_night numeric(12,2) not null check (price_per_night > 0),
  currency text not null default 'BYN' check (currency = 'BYN'),
  total_price numeric(12,2) not null check (total_price > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (check_out > check_in)
);

create index if not exists bookings_property_dates_idx on public.bookings(property_id, check_in, check_out);
create index if not exists bookings_guest_id_idx on public.bookings(guest_id, created_at desc);
create index if not exists bookings_status_idx on public.bookings(status);

alter table public.bookings enable row level security;

comment on table public.bookings is 'Booking requests created by Telegram-authenticated guests. Direct public Data API access is intentionally blocked by RLS; application backend uses direct Postgres.';
