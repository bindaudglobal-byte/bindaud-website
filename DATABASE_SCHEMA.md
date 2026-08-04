# Database schema overview

## Primary persistence layers
- Supabase: primary production path for orders, admin-facing data, and optional product metadata.
- MongoDB: legacy fallback path retained for compatibility but no longer required for the core storefront and admin order flows.

## Supabase tables
- products
- categories
- orders
- order_items (optional)
- reviews (optional)
- contact_messages (optional)
- wishlists (optional)

## Storage buckets
- product-images
- user-uploads

## RLS guidance
- Public read access is enabled for catalog data.
- Orders and storage actions are intended to be handled via server-side service-role access in production.
