-- ─────────────────────────────────────────────────────────
--  SafeDrive Sentinel Global — Supabase PostgreSQL Schema
--  Run this in: Supabase Dashboard → SQL Editor → New Query
-- ─────────────────────────────────────────────────────────

-- Enable PostGIS for geography (GPS coords)
create extension if not exists postgis;

-- ─── ENUMS ────────────────────────────────────────────────
create type user_role       as enum ('customer','provider','driver','admin');
create type kyc_status      as enum ('pending','submitted','approved','rejected');
create type sub_tier        as enum ('free','starter','pro','enterprise');
create type provider_status as enum ('pending','active','suspended');
create type flatbed_status  as enum ('available','on_job','offline','maintenance');
create type flatbed_type    as enum ('standard','lowboy','rollback','heavy_duty','luxury');
create type booking_status  as enum (
  'searching','matched','accepted','en_route','arrived',
  'loading','in_transit','delivered','completed','cancelled'
);
create type service_type    as enum (
  'emergency_rescue','flatbed_tow','luxury_transport',
  'cross_border','ev_recovery','car_relocation','fleet_transport'
);
create type payment_status  as enum (
  'pending','captured','held','released','refunded','failed'
);

-- ─── USERS (extends Supabase auth.users) ─────────────────
create table public.users (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text unique not null,
  phone        text,
  full_name    text not null default '',
  avatar_url   text,
  role         user_role not null default 'customer',
  kyc_status   kyc_status not null default 'pending',
  paypal_id    text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Auto-create user profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── PROVIDERS ────────────────────────────────────────────
create table public.providers (
  id                uuid primary key default gen_random_uuid(),
  owner_id          uuid not null references public.users(id) on delete cascade,
  company_name      text not null,
  license_url       text,
  insurance_url     text,
  service_regions   text[] not null default '{}',
  rating            numeric(3,2) not null default 5.00,
  total_reviews     int not null default 0,
  subscription_tier sub_tier not null default 'free',
  status            provider_status not null default 'pending',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index idx_providers_owner on public.providers(owner_id);
create index idx_providers_status on public.providers(status);

-- ─── FLATBEDS ─────────────────────────────────────────────
create table public.flatbeds (
  id                 uuid primary key default gen_random_uuid(),
  provider_id        uuid not null references public.providers(id) on delete cascade,
  assigned_driver_id uuid references public.users(id) on delete set null,
  plate_number       text unique not null,
  make               text not null,
  model              text not null,
  year               int not null,
  flatbed_type       flatbed_type not null default 'standard',
  capacity_tons      numeric(5,2) not null default 5.0,
  status             flatbed_status not null default 'offline',
  last_location      geography(point, 4326),
  last_location_at   timestamptz,
  photo_url          text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index idx_flatbeds_provider on public.flatbeds(provider_id);
create index idx_flatbeds_status on public.flatbeds(status);
create index idx_flatbeds_location on public.flatbeds using gist(last_location);

-- Helper: find nearby available flatbeds (radius in km)
create or replace function public.nearby_flatbeds(
  lat float, lng float, radius_km float default 50
)
returns setof public.flatbeds language sql stable as $$
  select * from public.flatbeds
  where status = 'available'
    and last_location is not null
    and st_dwithin(
      last_location,
      st_makepoint(lng, lat)::geography,
      radius_km * 1000
    )
  order by last_location <-> st_makepoint(lng, lat)::geography;
$$;

-- ─── BOOKINGS ─────────────────────────────────────────────
create table public.bookings (
  id                     uuid primary key default gen_random_uuid(),
  customer_id            uuid not null references public.users(id),
  flatbed_id             uuid references public.flatbeds(id) on delete set null,
  service_type           service_type not null,
  status                 booking_status not null default 'searching',
  pickup_location        geography(point, 4326) not null,
  pickup_address         text not null,
  dropoff_location       geography(point, 4326) not null,
  dropoff_address        text not null,
  vehicle_description    text not null,
  special_notes          text,
  distance_km            numeric(8,2),
  estimated_duration_min int,
  fare_amount            numeric(10,2),
  final_amount           numeric(10,2),
  created_at             timestamptz not null default now(),
  accepted_at            timestamptz,
  completed_at           timestamptz,
  updated_at             timestamptz not null default now()
);
create index idx_bookings_customer on public.bookings(customer_id);
create index idx_bookings_flatbed  on public.bookings(flatbed_id);
create index idx_bookings_status   on public.bookings(status);
create index idx_bookings_created  on public.bookings(created_at desc);

-- ─── PAYMENTS ─────────────────────────────────────────────
create table public.payments (
  id                uuid primary key default gen_random_uuid(),
  booking_id        uuid not null references public.bookings(id) on delete cascade,
  paypal_order_id   text unique,
  paypal_capture_id text,
  amount            numeric(10,2) not null,
  commission_pct    numeric(5,4) not null default 0.18,
  commission_amount numeric(10,2) not null,
  provider_payout   numeric(10,2) not null,
  currency          char(3) not null default 'USD',
  status            payment_status not null default 'pending',
  created_at        timestamptz not null default now(),
  settled_at        timestamptz
);
create index idx_payments_booking on public.payments(booking_id);
create index idx_payments_status  on public.payments(status);

-- ─── GPS TRACKS ───────────────────────────────────────────
create table public.gps_tracks (
  id          bigint generated always as identity primary key,
  flatbed_id  uuid not null references public.flatbeds(id) on delete cascade,
  booking_id  uuid references public.bookings(id) on delete set null,
  location    geography(point, 4326) not null,
  speed_kmh   numeric(6,2),
  heading     numeric(6,2),
  recorded_at timestamptz not null default now()
);
create index idx_gps_flatbed   on public.gps_tracks(flatbed_id, recorded_at desc);
create index idx_gps_booking   on public.gps_tracks(booking_id);
create index idx_gps_location  on public.gps_tracks using gist(location);

-- ─── REVIEWS ──────────────────────────────────────────────
create table public.reviews (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid not null references public.bookings(id) on delete cascade,
  reviewer_id uuid not null references public.users(id),
  provider_id uuid not null references public.providers(id),
  rating      int not null check (rating between 1 and 5),
  comment     text,
  created_at  timestamptz not null default now()
);
create unique index idx_reviews_booking_reviewer on public.reviews(booking_id, reviewer_id);

-- Update provider rating on new review
create or replace function public.update_provider_rating()
returns trigger language plpgsql as $$
begin
  update public.providers
  set
    rating = (select avg(rating) from public.reviews where provider_id = new.provider_id),
    total_reviews = (select count(*) from public.reviews where provider_id = new.provider_id),
    updated_at = now()
  where id = new.provider_id;
  return new;
end;
$$;
create trigger on_review_insert
  after insert on public.reviews
  for each row execute function public.update_provider_rating();

-- ─── ROW LEVEL SECURITY ───────────────────────────────────
alter table public.users     enable row level security;
alter table public.providers enable row level security;
alter table public.flatbeds  enable row level security;
alter table public.bookings  enable row level security;
alter table public.payments  enable row level security;
alter table public.gps_tracks enable row level security;
alter table public.reviews   enable row level security;

-- Users: own profile
create policy "users_own_profile" on public.users
  for all using (auth.uid() = id);

-- Providers: owner full access; public read approved
create policy "providers_owner_all" on public.providers
  for all using (auth.uid() = owner_id);
create policy "providers_public_read" on public.providers
  for select using (status = 'active');

-- Flatbeds: provider owner; customers read available
create policy "flatbeds_provider_all" on public.flatbeds
  for all using (
    provider_id in (select id from public.providers where owner_id = auth.uid())
  );
create policy "flatbeds_driver_read" on public.flatbeds
  for select using (assigned_driver_id = auth.uid());
create policy "flatbeds_public_read" on public.flatbeds
  for select using (status = 'available');

-- Bookings: customer owns; provider's flatbed driver can read
create policy "bookings_customer_all" on public.bookings
  for all using (customer_id = auth.uid());
create policy "bookings_driver_read" on public.bookings
  for select using (
    flatbed_id in (select id from public.flatbeds where assigned_driver_id = auth.uid())
  );

-- Payments: booking parties
create policy "payments_parties" on public.payments
  for select using (
    booking_id in (select id from public.bookings where customer_id = auth.uid())
  );

-- GPS: flatbed driver writes; booking customer reads
create policy "gps_driver_insert" on public.gps_tracks
  for insert with check (
    flatbed_id in (select id from public.flatbeds where assigned_driver_id = auth.uid())
  );
create policy "gps_customer_read" on public.gps_tracks
  for select using (
    booking_id in (select id from public.bookings where customer_id = auth.uid())
  );

-- ─── SEED DATA (optional demo) ────────────────────────────
-- insert into public.users (id, email, full_name, role, kyc_status)
-- values ('00000000-0000-0000-0000-000000000001','demo@safedrive.io','Demo Admin','admin','approved');
