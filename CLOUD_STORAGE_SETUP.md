# BIN DAUD Cloud Storage Setup

This document explains how to connect BIN DAUD admin storage to an online shared backend.

## Why this is needed
The current admin panel stores products, orders, and settings in `localStorage`. That means:
- data is only visible in the browser where it was created
- other users/devices do not see new products or orders
- the system is not truly online shared storage

To make the admin panel shared across users, you need a centralized backend or database.

## Recommended options

### Option 1 — Deploy the existing backend
This repository already includes a Node.js backend in `backend/`.
It supports products, orders, admin auth, and more.

Steps:
1. Open `backend/.env.example` and copy it to `backend/.env`.
2. Set up a MongoDB database (MongoDB Atlas or local).
3. Set `MONGODB_URI` to your database connection string.
4. Set `JWT_SECRET`, `CLIENT_URL`, and other required values.
5. Run `npm install` inside `backend`.
6. Start the backend with `npm run dev` or deploy it with `npm start`.

If you deploy the backend at `https://api.bindaud.com`, set the frontend config:
```js
window.BINDAUD_CONFIG.api.adminBase = 'https://api.bindaud.com/api/admin';
```

### Option 2 — Use Supabase (best for static hosting)
Supabase is the easiest online database for frontend apps.
It gives you real shared storage, authentication, and a proper database.

#### Setup steps:
1. Create a Supabase account at https://app.supabase.com.
2. Create a new project.
3. Create tables for `products` and `orders`.
4. Define the columns your admin panel needs.
   - `products`: id, name, price, oldPrice, category, collection, stock, code, description, image, brand, gender, material, fit, season, quantity, featured, trending, bestSeller, sizeOptions, colorOptions, features, tags, createdAt, updatedAt.
   - `orders`: id, orderNumber, customerName, phone, address, city, products, total, paymentMethod, status, createdAt, updatedAt.
5. In Supabase settings, copy the **URL** and **anon key**.
6. Set those values in `js/config.js`:
```js
window.BINDAUD_CONFIG.api.supabaseUrl = 'https://your-project.supabase.co';
window.BINDAUD_CONFIG.api.supabaseAnonKey = 'your-anon-key';
```
7. Add row level security (RLS) rules so anonymous users can read products and insert orders if needed.

#### Why Supabase is a good choice:
- Fast shared database
- Works with frontend-only static sites
- Can be secured with policies
- Can store orders and products centrally

### Option 3 — Use Google Sheets as backend
Google Sheets can work as a lightweight online storage system.
This requires a server-side connector or Google Apps Script because you cannot safely embed Google API credentials in the frontend.

#### Steps:
1. Create a Google Sheet in your account.
2. Open Google Apps Script and create a new script bound to that sheet.
3. Add endpoints for reading and writing rows.
4. Deploy the script as a web app.
5. Set the web app URL in `window.BINDAUD_CONFIG.api.googleSheetsEndpoint`.
6. Update the frontend to call that endpoint.

#### Important:
- Google Sheets is not ideal for product catalogs or production workloads.
- Use it only as a temporary online order backup or simple shared list.
- Supabase or the existing backend is a stronger long-term solution.

## What I changed in the code
- `js/config.js` now includes optional cloud settings:
  - `api.adminBase`
  - `api.supabaseUrl`
  - `api.supabaseAnonKey`
  - `api.googleSheetsEndpoint`
- `js/adminStorage.js` now respects `window.BINDAUD_CONFIG.api.adminBase` when calling the admin backend.

## Next step for your project
If you want the admin product changes to show to everyone, choose one of these:
- Deploy the existing backend and point `adminBase` at it.
- Set up Supabase and connect the frontend to it.
- (Optional) create a Google Sheets endpoint if you want to store orders there.

## Recommended path
1. **Deploy the existing backend** (best if you want a real store system).
2. **Use Supabase** if you want a hosted frontend-friendly database without managing a server.
3. **Use Google Sheets** only for a temporary lightweight order log.

If you want, I can now implement the Supabase integration code directly so the admin panel syncs products and orders centrally.
