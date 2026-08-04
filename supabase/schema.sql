-- Supabase schema for BIN DAUD
-- Run in Supabase SQL Editor.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  address text,
  city text,
  country text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.categories (
  id text primary key,
  name text not null,
  slug text,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.products (
  id text primary key,
  name text,
  slug text,
  price numeric default 0,
  description text,
  sku text,
  inventory integer default 0,
  images jsonb,
  metadata jsonb,
  category_id text references public.categories(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.orders (
  id text primary key,
  user_id uuid references auth.users(id),
  order_number text,
  customer_name text,
  email text,
  phone text,
  address text,
  city text,
  province text,
  postal_code text,
  notes text,
  products jsonb,
  subtotal numeric default 0,
  discount numeric default 0,
  shipping numeric default 0,
  tax numeric default 0,
  total numeric default 0,
  payment_method text,
  status text default 'Pending',
  payment_status text default 'pending',
  tracking_number text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.order_items (
  id text primary key,
  order_id text references public.orders(id) on delete cascade,
  product_id text references public.products(id),
  name text,
  quantity integer default 1,
  price numeric default 0,
  created_at timestamptz default now()
);

create table if not exists public.reviews (
  id text primary key,
  product_id text references public.products(id) on delete cascade,
  user_id uuid references auth.users(id),
  rating integer default 5,
  comment text,
  created_at timestamptz default now()
);

create table if not exists public.contact_messages (
  id text primary key,
  name text,
  email text,
  subject text,
  message text,
  created_at timestamptz default now()
);

create table if not exists public.wishlists (
  id text primary key,
  user_id uuid references auth.users(id),
  product_id text references public.products(id) on delete cascade,
  created_at timestamptz default now()
);

create index if not exists idx_orders_user_id on public.orders(user_id);
create index if not exists idx_orders_created_at on public.orders(created_at desc);
create index if not exists idx_reviews_product_id on public.reviews(product_id);
create index if not exists idx_wishlists_user_id on public.wishlists(user_id);

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.reviews enable row level security;
alter table public.contact_messages enable row level security;
alter table public.wishlists enable row level security;

drop policy if exists profiles_self_access on public.profiles;
create policy profiles_self_access on public.profiles
  for all using (auth.uid()::text = id::text) with check (auth.uid()::text = id::text);

drop policy if exists categories_public_read on public.categories;
create policy categories_public_read on public.categories
  for select using (true);

drop policy if exists products_public_read on public.products;
create policy products_public_read on public.products
  for select using (true);

drop policy if exists orders_public_insert on public.orders;
create policy orders_public_insert on public.orders
  for insert with check (true);

drop policy if exists orders_public_read on public.orders;
create policy orders_public_read on public.orders
  for select using (true);

drop policy if exists orders_public_update on public.orders;
create policy orders_public_update on public.orders
  for update using (true) with check (true);

drop policy if exists contact_messages_public_insert on public.contact_messages;
create policy contact_messages_public_insert on public.contact_messages
  for insert with check (true);

drop policy if exists product_images_public_read on storage.objects;
create policy product_images_public_read on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists user_uploads_authenticated_insert on storage.objects;
create policy user_uploads_authenticated_insert on storage.objects
  for insert to authenticated with check (bucket_id = 'user-uploads');
