-- Migration: add carts and cart_items tables + RLS policies
-- Run this in Supabase SQL Editor with service_role key or via CLI

BEGIN;

-- Carts table (one per authenticated user)
CREATE TABLE IF NOT EXISTS public.carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_carts_user ON public.carts (user_id);

-- Cart items
CREATE TABLE IF NOT EXISTS public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id uuid REFERENCES public.carts(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  cart_item_id text NOT NULL, -- semantic id used by frontend (product-size-color)
  quantity integer DEFAULT 1,
  unit_price numeric(12,2) DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON public.cart_items (cart_id);

-- Triggers to update updated_at
DROP TRIGGER IF EXISTS trg_carts_updated_at ON public.carts;
CREATE TRIGGER trg_carts_updated_at
  BEFORE UPDATE ON public.carts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_cart_items_updated_at ON public.cart_items;
CREATE TRIGGER trg_cart_items_updated_at
  BEFORE UPDATE ON public.cart_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Enable RLS and policies so users only access their own cart
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS carts_select_own ON public.carts;
CREATE POLICY carts_select_own ON public.carts
  FOR SELECT
  USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS carts_insert_authenticated ON public.carts;
CREATE POLICY carts_insert_authenticated ON public.carts
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS carts_update_own ON public.carts;
CREATE POLICY carts_update_own ON public.carts
  FOR UPDATE
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS carts_delete_own ON public.carts;
CREATE POLICY carts_delete_own ON public.carts
  FOR DELETE
  USING (auth.uid()::text = user_id::text);

-- Cart items RLS: allow operations only when the parent cart belongs to the user
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cart_items_select_own ON public.cart_items;
CREATE POLICY cart_items_select_own ON public.cart_items
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.carts c WHERE c.id = cart_items.cart_id AND c.user_id::text = auth.uid()::text));

DROP POLICY IF EXISTS cart_items_insert_via_cart ON public.cart_items;
CREATE POLICY cart_items_insert_via_cart ON public.cart_items
  FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.carts c WHERE c.id = cart_items.cart_id AND c.user_id::text = auth.uid()::text));

DROP POLICY IF EXISTS cart_items_update_own ON public.cart_items;
CREATE POLICY cart_items_update_own ON public.cart_items
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.carts c WHERE c.id = cart_items.cart_id AND c.user_id::text = auth.uid()::text))
  WITH CHECK (EXISTS (SELECT 1 FROM public.carts c WHERE c.id = cart_items.cart_id AND c.user_id::text = auth.uid()::text));

DROP POLICY IF EXISTS cart_items_delete_own ON public.cart_items;
CREATE POLICY cart_items_delete_own ON public.cart_items
  FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.carts c WHERE c.id = cart_items.cart_id AND c.user_id::text = auth.uid()::text));

COMMIT;

-- Notes:
-- 1) Admins requiring elevated access should be granted via server-side service_role key operations.
-- 2) When creating cart rows from the backend, set user_id to the Supabase Auth UID.
-- 3) For guest carts, the application should persist locally and merge into the authenticated cart after login.
