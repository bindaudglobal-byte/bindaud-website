-- Migration: add orders and order_items tables

-- Enable extensions if needed
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  customer_id text,
  customer_name text,
  email text,
  phone text,
  address text,
  city text,
  province text,
  postal_code text,
  notes text,
  products jsonb DEFAULT '[]'::jsonb,
  subtotal numeric DEFAULT 0,
  discount numeric DEFAULT 0,
  shipping numeric DEFAULT 0,
  tax numeric DEFAULT 0,
  total numeric DEFAULT 0,
  payment_method text,
  status text,
  payment_status text,
  tracking_number text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Order items table
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id text,
  name text,
  price numeric DEFAULT 0,
  sale_price numeric DEFAULT 0,
  quantity integer DEFAULT 1,
  size text,
  color text,
  image text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- Row level security: enable RLS to ensure server-side service role is used for writes/reads
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Do NOT create permissive policies here. Server-side service_role key bypasses RLS.
-- You can add policies later to allow client-side access if needed.

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_set_timestamp
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_timestamp();

CREATE TRIGGER order_items_set_timestamp
BEFORE UPDATE ON public.order_items
FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_timestamp();
