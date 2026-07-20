# BIN DAUD Backend

A production-ready Node.js and Express backend for the BIN DAUD storefront.

## Features

- JWT authentication for customers and admins
- Secure password hashing with bcrypt
- Product catalog with search, filtering, pagination, and featured/best-seller support
- Categories, coupons, reviews, cart, wishlist, orders, payments, and store settings
- Cloudinary-powered image and video uploads
- Email notifications for order confirmation, shipping updates, and password resets
- Security middleware including Helmet, CORS, rate limiting, and validated input handling

## Project Structure

- `config/` – database and Cloudinary configuration
- `controllers/` – business logic for auth, products, orders, payments, and more
- `middleware/` – auth, admin authorization, uploads, and error handling
- `models/` – MongoDB schemas for all major entities
- `routes/` – REST API routes
- `services/` – email and order/payment services
- `utils/` – logging and helper functions
- `uploads/` – local storage fallback for uploaded files

## Installation

1. Open the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the example environment file and update the values:
   ```bash
   copy .env.example .env
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

Create a `.env` file with the following variables:

- `PORT` – server port, usually `5000`
- `NODE_ENV` – `development` or `production`
- `MONGODB_URI` – MongoDB connection string
- `JWT_SECRET` – long random secret key
- `JWT_EXPIRES_IN` – token expiration, e.g. `7d`
- `CLIENT_URL` – frontend URL, e.g. `http://localhost:3000`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `EMAIL_HOST`
- `EMAIL_PORT`
- `EMAIL_USER`
- `EMAIL_PASS`
- `EMAIL_FROM`
- `RATE_LIMIT_WINDOW_MS`
- `RATE_LIMIT_MAX`
- `MAX_FILE_SIZE`

## Database Setup

Make sure MongoDB is running locally or use MongoDB Atlas.

Example local connection:
```env
MONGODB_URI=mongodb://127.0.0.1:27017/bindaud
```

## API Overview

### Authentication
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/auth/me`

### Products
- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/products`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`

### Orders
- `POST /api/orders`
- `GET /api/orders`
- `GET /api/orders/:id`
- `PUT /api/orders/:id`
- `POST /api/orders/cancel/:id`
- `GET /api/orders/track/:orderNumber`

### Admin
- `POST /api/admin/auth/register`
- `POST /api/admin/auth/login`
- `GET /api/admin/profile`
- `GET /api/admin/dashboard`

## Deployment

This backend is ready for deployment on Render, Railway, Fly.io, Heroku, or a VPS.

Recommended deployment checklist:
1. Set all environment variables in your hosting platform.
2. Use a managed MongoDB instance such as MongoDB Atlas.
3. Set `NODE_ENV=production`.
4. Start the app with `npm start`.
