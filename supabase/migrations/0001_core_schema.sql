-- Regal Furnitures order portal: core schema.
-- Tables, enums, constraints and indexes. Behaviour (triggers), security (RLS),
-- views/RPCs and storage live in the following migrations.

create extension if not exists pg_trgm with schema extensions;

-- Helpers that RLS policies and triggers call live here, outside the API-exposed schema.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('admin', 'staff');

create type public.production_status as enum (
  'new',
  'in_production',
  'ready_for_delivery',
  'delivered',
  'on_hold',
  'cancelled'
);

create type public.item_status as enum ('pending', 'in_production', 'ready');

create type public.payment_method as enum ('cash', 'bank_transfer', 'cheque', 'other');

create type public.attention_level as enum ('overdue', 'due_soon', 'needs_to_start', 'on_track');

-- ---------------------------------------------------------------------------
-- People
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (char_length(btrim(full_name)) between 1 and 120),
  phone text check (char_length(phone) <= 40),
  role public.user_role not null default 'staff',
  is_active boolean not null default true,
  is_seed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.profiles is 'One row per portal user. No row (or inactive) means no access.';

create index profiles_role_active_idx on public.profiles (role, is_active);

-- ---------------------------------------------------------------------------
-- Settings (single row)
-- ---------------------------------------------------------------------------
create table public.settings (
  id smallint primary key default 1 check (id = 1),
  due_soon_days integer not null default 3 check (due_soon_days between 0 and 60),
  start_warning_days integer not null default 10 check (start_warning_days between 0 and 180),
  not_started_grace_days integer not null default 2 check (not_started_grace_days between 0 and 60),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

insert into public.settings (id) values (1) on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Clients
-- ---------------------------------------------------------------------------
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 160),
  phone text check (char_length(phone) <= 40),
  alt_phone text check (char_length(alt_phone) <= 40),
  company text check (char_length(company) <= 160),
  address text check (char_length(address) <= 500),
  city text check (char_length(city) <= 80),
  notes text check (char_length(notes) <= 2000),
  -- Digits of both phone numbers, so "03001234567" finds "0300-123 4567".
  phone_digits text generated always as (
    regexp_replace(coalesce(phone, '') || ' ' || coalesce(alt_phone, ''), '\D', '', 'g')
  ) stored,
  is_seed boolean not null default false,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index clients_name_trgm_idx on public.clients using gin (name extensions.gin_trgm_ops);
create index clients_phone_digits_trgm_idx on public.clients using gin (phone_digits extensions.gin_trgm_ops);
create index clients_company_trgm_idx on public.clients using gin (company extensions.gin_trgm_ops);
create index clients_name_idx on public.clients (name);

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------
create table private.order_counters (
  year integer primary key,
  last_value integer not null default 0 check (last_value >= 0)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  -- Always assigned by trigger as RF-YYYY-NNNN; the default only satisfies NOT NULL typing.
  order_number text not null default '',
  bill_number text check (char_length(bill_number) <= 60),
  client_id uuid not null references public.clients (id) on delete restrict,
  delivery_address text check (char_length(delivery_address) <= 500),
  order_date date not null default ((now() at time zone 'Asia/Karachi')::date),
  delivery_deadline date not null,
  status public.production_status not null default 'new',
  delivered_at timestamptz,
  responsible_id uuid references public.profiles (id) on delete set null,
  special_instructions text check (char_length(special_instructions) <= 4000),
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  is_archived boolean not null default false,
  archived_at timestamptz,
  is_seed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_order_number_key unique (order_number),
  constraint orders_deadline_not_before_order check (delivery_deadline >= order_date),
  constraint orders_archived_at_consistent check (is_archived = (archived_at is not null))
);

create index orders_deadline_idx on public.orders (delivery_deadline) where not is_archived;
create index orders_status_idx on public.orders (status) where not is_archived;
create index orders_responsible_idx on public.orders (responsible_id);
create index orders_client_idx on public.orders (client_id, delivery_deadline desc);
create index orders_delivered_at_idx on public.orders (delivered_at) where status = 'delivered';
create index orders_created_at_idx on public.orders (created_at desc);
create index orders_number_trgm_idx on public.orders using gin (order_number extensions.gin_trgm_ops);
create index orders_bill_trgm_idx on public.orders using gin (bill_number extensions.gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- Money (admin only — kept out of `orders` so RLS can hide it from staff)
-- ---------------------------------------------------------------------------
create table public.order_finance (
  order_id uuid primary key references public.orders (id) on delete cascade,
  order_amount bigint check (order_amount between 0 and 100000000000),
  delivery_charges bigint not null default 0 check (delivery_charges between 0 and 100000000000),
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid() references public.profiles (id) on delete set null
);
comment on column public.order_finance.order_amount is 'Whole rupees. NULL means the amount has not been set yet.';

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  amount bigint not null check (amount between 1 and 100000000000),
  paid_on date not null default ((now() at time zone 'Asia/Karachi')::date),
  method public.payment_method not null default 'cash',
  note text check (char_length(note) <= 500),
  recorded_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payments_order_idx on public.payments (order_id, paid_on desc);

-- ---------------------------------------------------------------------------
-- Items
-- ---------------------------------------------------------------------------
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  sort_order integer not null default 0 check (sort_order >= 0),
  name text not null check (char_length(btrim(name)) between 1 and 200),
  quantity integer not null check (quantity between 1 and 100000),
  size text check (char_length(size) <= 200),
  sheet_code text check (char_length(sheet_code) <= 200),
  metal_colour text check (char_length(metal_colour) <= 200),
  pc text check (char_length(pc) <= 200),
  rack text check (char_length(rack) <= 200),
  fabric text check (char_length(fabric) <= 200),
  leather text check (char_length(leather) <= 200),
  foam text check (char_length(foam) <= 200),
  railing text check (char_length(railing) <= 200),
  lock text check (char_length(lock) <= 200),
  note text check (char_length(note) <= 2000),
  image_path text check (char_length(image_path) <= 300),
  status public.item_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Images must live under this order's folder in the item-images bucket.
  constraint order_items_image_path_scoped
    check (image_path is null or image_path like 'orders/' || order_id::text || '/%')
);

create index order_items_order_idx on public.order_items (order_id, sort_order);

-- ---------------------------------------------------------------------------
-- Notes (append-only log) and status history (written by trigger only)
-- ---------------------------------------------------------------------------
create table public.order_notes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  author_id uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index order_notes_order_idx on public.order_notes (order_id, created_at desc);

create table public.status_history (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  from_status public.production_status,
  to_status public.production_status not null,
  changed_by uuid references public.profiles (id) on delete set null,
  changed_at timestamptz not null default now()
);

create index status_history_order_idx on public.status_history (order_id, changed_at desc);
