-- Full production-ready Supabase / Postgres schema for BIN DAUD
-- Idempotent: safe to run multiple times
-- Creates tables, indexes, constraints, triggers, and Row Level Security (RLS) policies
-- NOTE: Run this in Supabase SQL Editor or via `supabase sql query` with an admin/service-role key

-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Helper: upsert timestamp trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- SCHEMA: Users
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_uid uuid UNIQUE, -- Supabase Auth user id (if available)
  email text UNIQUE,
  full_name text,
  phone text,
  role text DEFAULT 'customer', -- customer, admin
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (email);
DROP TRIGGER IF EXISTS trg_users_updated_at ON public.users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- SCHEMA: Admin Users (optional pointer to users)
CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  display_name text,
  role text DEFAULT 'admin',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
DROP TRIGGER IF EXISTS trg_admin_users_updated_at ON public.admin_users;
CREATE TRIGGER trg_admin_users_updated_at
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- SCHEMA: Categories
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories (slug);
DROP TRIGGER IF EXISTS trg_categories_updated_at ON public.categories;
CREATE TRIGGER trg_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- SCHEMA: Products
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text UNIQUE,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  price numeric(12,2) DEFAULT 0,
  currency text DEFAULT 'PKR',
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products (slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category_id);
DROP TRIGGER IF EXISTS trg_products_updated_at ON public.products;
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- SCHEMA: Product Images (stores object path + metadata)
CREATE TABLE IF NOT EXISTS public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  storage_path text NOT NULL, -- path in Supabase Storage
  alt_text text,
  position integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON public.product_images (product_id);
DROP TRIGGER IF EXISTS trg_product_images_updated_at ON public.product_images;
CREATE TRIGGER trg_product_images_updated_at
  BEFORE UPDATE ON public.product_images
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- SCHEMA: Product Variants (size / color / SKU-level price)
CREATE TABLE IF NOT EXISTS public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  sku text,
  size text,
  color text,
  price_override numeric(12,2),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON public.product_variants (product_id);
DROP TRIGGER IF EXISTS trg_product_variants_updated_at ON public.product_variants;
CREATE TRIGGER trg_product_variants_updated_at
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- SCHEMA: Inventory (per variant or product fallback)
CREATE TABLE IF NOT EXISTS public.inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE CASCADE,
  quantity integer DEFAULT 0,
  reserved integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_inventory_product ON public.inventory (product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_variant ON public.inventory (variant_id);

-- SCHEMA: Customer Addresses
CREATE TABLE IF NOT EXISTS public.customer_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  label text,
  line1 text,
  line2 text,
  city text,
  province text,
  postal_code text,
  country text DEFAULT 'Pakistan',
  is_default boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_user ON public.customer_addresses (user_id);
DROP TRIGGER IF EXISTS trg_customer_addresses_updated_at ON public.customer_addresses;
CREATE TRIGGER trg_customer_addresses_updated_at
  BEFORE UPDATE ON public.customer_addresses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- SCHEMA: Orders
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  guest_email text,
  billing_address_id uuid REFERENCES public.customer_addresses(id) ON DELETE SET NULL,
  shipping_address_id uuid REFERENCES public.customer_addresses(id) ON DELETE SET NULL,
  subtotal numeric(12,2) DEFAULT 0,
  discount numeric(12,2) DEFAULT 0,
  shipping numeric(12,2) DEFAULT 0,
  tax numeric(12,2) DEFAULT 0,
  total numeric(12,2) DEFAULT 0,
  payment_method text,
  status text DEFAULT 'pending',
  payment_status text DEFAULT 'unpaid',
  payment_proof_id uuid REFERENCES public.payment_proofs(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);
DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- SCHEMA: Order Items
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  quantity integer DEFAULT 1,
  unit_price numeric(12,2) DEFAULT 0,
  total numeric(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items (order_id);

-- SCHEMA: Reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  rating smallint CHECK (rating >= 1 AND rating <= 5),
  title text,
  body text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON public.reviews (product_id);
DROP TRIGGER IF EXISTS trg_reviews_updated_at ON public.reviews;
CREATE TRIGGER trg_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- SCHEMA: Wishlist
CREATE TABLE IF NOT EXISTS public.wishlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_wishlist_user_product ON public.wishlist (user_id, product_id);

-- SCHEMA: Coupons
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  description text,
  discount_type text DEFAULT 'percent', -- percent | fixed
  discount_amount numeric(12,2) DEFAULT 0,
  active boolean DEFAULT true,
  starts_at timestamptz,
  expires_at timestamptz,
  usage_limit integer,
  used_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
DROP TRIGGER IF EXISTS trg_coupons_updated_at ON public.coupons;
CREATE TRIGGER trg_coupons_updated_at
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- SCHEMA: Contact Messages
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  email text,
  subject text,
  message text,
  status text DEFAULT 'new',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- SCHEMA: Newsletter Subscribers
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  subscribed_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- SCHEMA: Payment Proofs
CREATE TABLE IF NOT EXISTS public.payment_proofs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  storage_path text, -- path in Supabase Storage
  status text DEFAULT 'pending',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- SCHEMA: Shipping Information
CREATE TABLE IF NOT EXISTS public.shipping_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  carrier text,
  tracking_number text,
  status text,
  estimated_delivery_date date,
  shipped_at timestamptz,
  delivered_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
DROP TRIGGER IF EXISTS trg_shipping_info_updated_at ON public.shipping_info;
CREATE TRIGGER trg_shipping_info_updated_at
  BEFORE UPDATE ON public.shipping_info
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- SCHEMA: Order Tracking History
CREATE TABLE IF NOT EXISTS public.order_tracking_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  status text,
  note text,
  created_by uuid, -- admin user id
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_order_tracking_order ON public.order_tracking_history (order_id);

-- SCHEMA: Website Settings (single row key-value store)
CREATE TABLE IF NOT EXISTS public.website_settings (
  id serial PRIMARY KEY,
  key text UNIQUE NOT NULL,
  value jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
DROP TRIGGER IF EXISTS trg_website_settings_updated_at ON public.website_settings;
CREATE TRIGGER trg_website_settings_updated_at
  BEFORE UPDATE ON public.website_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products (price);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders (order_number);

-- RLS Policies (examples)
-- Enable RLS on users and orders so customers only see their own data
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS users_self_access ON public.users;
CREATE POLICY users_self_access ON public.users
  FOR ALL
  USING (auth.uid()::text = auth_uid::text)
  WITH CHECK (auth.uid()::text = auth_uid::text);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS orders_authenticated_insert ON public.orders;
CREATE POLICY orders_authenticated_insert ON public.orders
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS orders_select_own ON public.orders;
CREATE POLICY orders_select_own ON public.orders
  FOR SELECT
  USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS orders_update_status_admin ON public.orders;
CREATE POLICY orders_update_status_admin ON public.orders
  FOR UPDATE
  USING (false)
  WITH CHECK (false);
-- Note: updates to orders (status changes) should be performed server-side with the service_role key

-- Public tables that do not require RLS: products, categories, product_images
-- Storage buckets: create recommended buckets if storage extension is available
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'storage_create_bucket') THEN
    -- create product images bucket (private by default)
    PERFORM storage.create_bucket('product-images', false);
    PERFORM storage.create_bucket('user-uploads', false);
  END IF;
END$$;

-- Storage policies guidance (can't reliably create via SQL in all environments)
-- Example policy for allowing authenticated users to upload to `user-uploads`:
-- INSERT INTO storage.objects is controlled by storage policies visible in Supabase UI.

-- Triggers / housekeeping
-- Optionally, add triggers to keep `order_number` incremental human-friendly values (requires sequence)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'order_number_seq') THEN
    CREATE SEQUENCE order_number_seq START 100000;
  END IF;
END$$;

ALTER TABLE public.orders ALTER COLUMN order_number SET DEFAULT ('ORD-' || nextval('order_number_seq'));

-- Best practices notes (kept here as comments):
-- 1) Use service_role key on backend only; never expose it in client-side code.
-- 2) Keep buckets private by default; create secure storage policies that allow only authenticated users to upload and public read for product images if desired.
-- 3) Use RLS to restrict access to user-specific resources and rely on server-side service role for admin actions.
-- 4) Index foreign keys and frequently queried columns (created_at, status, order_number) for performance.
-- 5) Keep JSONB fields for flexible metadata; use functional indexes for frequent JSON queries when needed.
-- 6) Consider partitioning `orders` table by created_at range for very large datasets.

-- End of schema
