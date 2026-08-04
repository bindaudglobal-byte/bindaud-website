# API documentation

## Health
- GET /api/health
- Returns service health information.

## Admin session
- GET /api/admin/session
- Returns the authentication state for the current cookie-backed session.

## Cart
- GET /api/admin/cart
- PUT /api/admin/cart
- DELETE /api/admin/cart
- Manage the active cart session without browser storage.

## Orders
- GET /api/admin/orders/customer
- POST /api/admin/orders
- GET /api/admin/orders
- PUT /api/admin/orders/:id
- Serve and update orders through the Supabase-backed service layer when configured.

## Environment requirements
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- SESSION_SECRET
- CLIENT_URL
