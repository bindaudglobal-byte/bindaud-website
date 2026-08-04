-- Supabase schema: create orders and products tables
-- Run this SQL in Supabase SQL Editor or via the supabase CLI

-- Orders table
create table if not exists public.orders (
  id text primary key,
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
  status text,
  payment_status text,
  tracking_number text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index on created_at for ordering
create index if not exists idx_orders_created_at on public.orders (created_at desc);

-- Products table
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
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_products_created_at on public.products (created_at desc);

-- NOTE: Enable Row Level Security (RLS) and create policies to control access.
-- For example, to allow authenticated users to insert orders from the client you
-- should create a policy scoped to authenticated roles, or keep all insertions
-- server-side using the service role key for stronger security.
