# BIN DAUD - Premium Luxury Streetwear eCommerce Platform

**Complete AI Developer Guide**

*This document is written for AI developers continuing this project. Read completely before modifying.*

---

## 1. PROJECT OVERVIEW

**What is BIN DAUD?**

BIN DAUD is a **production-quality luxury streetwear eCommerce website** built with:
- Plain HTML5, CSS3, and ES6+ JavaScript (no frameworks)
- localStorage for state management (cart, orders, admin data)
- WhatsApp integration for checkout/ordering
- Frontend-only admin dashboard (no backend required)

**Key Metrics:**
- 6 core products (extensible via admin)
- 7 collection categories
- Full cart, checkout, and order management
- Admin system with product, order, and settings management
- Pakistan-focused (PKR currency, local delivery zones)

**Current Status:** Fully functional MVP with admin dashboard plus a premium floating AI assistant

**Target Users:**
1. **Customers:** Browse, add to cart, checkout via WhatsApp
2. **Admins:** Manage products, orders, delivery zones, coupons, and website settings
3. **Future Backend:** Structure supports easy migration to Node.js/Supabase/Firebase

---

## 2. FOLDER STRUCTURE & FILE EXPLANATIONS

### **Root Level**

```
├── index.html                 # Home page / Landing page
├── about.html                 # Brand story page
├── thank-you.html            # Post-order success page
├── README.md                 # This file
├── css/                      # All styling
├── assets/                   # Images, logos, banners, products
├── js/                       # JavaScript modules
└── pages/                    # All page routes
```

### **CSS Directory** (`css/`)

| File | Purpose | Size |
|------|---------|------|
| `style.css` | Core design system, components, layouts, admin UI | ~2000 lines |
| `responsive.css` | Mobile/tablet breakpoints (640px, 900px, 1200px) | ~300 lines |
| `animation.css` | Hover effects, transitions, scale animations | ~200 lines |

**Key Design Variables in style.css:**
```css
--color-primary: #214B6B (BIN DAUD Navy)
--color-accent: #D4A574 (Gold)
--color-text: #1a1a1a
--color-muted: #666
--color-surface: #fff
--color-border: #e0e0e0
--shadow-light: 0 2px 8px rgba(0,0,0,0.08)
```

**DO NOT CHANGE:** Existing color variables, spacing system, or grid system.

### **Assets Directory** (`assets/`)

```
assets/
├── logo/
│   └── logo.png              # BIN DAUD brand logo (55x55px)
├── banners/
│   └── banner.png            # Hero image for homepage
├── products/
│   ├── product1.jpg          # Dragon Tee + Premium Jacket
│   ├── product2.png          # Cardigan + Crane Kimono
│   └── product3.png          # Premium Kimono + Limited Edition
├── images/                   # Gallery/decorative images (unused)
├── icons/                    # SVG icons (unused)
└── videos/                   # Video files (unused, no video player)
```

**Image Path Resolution:**
- Images are resolved relative to the current page location
- The `resolveSitePath()` function handles this automatically
- **Never hardcode paths like `../assets/products/`** - always use `resolveSitePath(path)`

### **JavaScript Directory** (`js/`)

#### **Entry Points**

#### **New Assistant Modules**
- `config.js` - Shared business details for the assistant (WhatsApp, Instagram, Facebook, Google Business, phone, email, shipping, COD, hours, currency)
- `faq.js` - FAQ data store for assistant matching and quick answers
- `chatbot.js` - Floating AI assistant UI, routing, quick actions, feedback capture, and future-ready modular messaging hooks

#### **Assistant Styling**
- `css/chatbot.css` - Premium glassmorphism styling for the floating assistant and scroll-to-top button
- `app.js` - Storefront initialization (called from home, shop, product, cart, checkout, collections pages)
- `adminApp.js` - Admin panel initialization (called from admin login and dashboard pages)

#### **Core Modules**

| Module | Responsibility | Key Exports |
|--------|-----------------|-------------|
| `helpers.js` | Product catalog, path resolution, currency formatting, utilities | `PRODUCT_CATALOG`, `resolveSitePath()`, `formatCurrency()`, `buildProductLink()` |
| `cartStorage.js` | localStorage cart persistence and calculations | `addToCart()`, `getCart()`, `calculateCartTotals()`, `setCoupon()` |
| `cart.js` | Main app orchestrator (950 lines!) | `initSite()`, `renderShopPage()`, `initCheckoutPage()`, `populateProductPage()` |
| `toast.js` | Toast notification system | `showToast(message)` |
| `adminStorage.js` | Admin localStorage management | `getAdminState()`, `authenticateAdmin()`, `upsertProduct()`, `createOrder()` |
| `adminDashboard.js` | Admin UI rendering and event handling | `initAdminLogin()`, `initAdminDashboard()` |
| `adminApp.js` | Admin page routing | Auto-routes to login or dashboard |

#### **Module Dependencies**
```
NO CIRCULAR DEPENDENCIES ✓

app.js 
  └─> cart.js
       ├─> helpers.js
       ├─> cartStorage.js
       ├─> adminStorage.js
       └─> toast.js

adminApp.js
  └─> adminDashboard.js
       ├─> adminStorage.js
       └─> helpers.js
```

### **Pages Directory** (`pages/`)

| Page | Purpose | Purpose Description |
|------|---------|---------------------|
| `shop.html` | Product listing with filters and sorting | Browse all products, filter by collection, sort by price/popularity |
| `product.html` | Single product detail view | View product details, select size/color, add to cart, view images |
| `cart.html` | Shopping cart review | View cart items, adjust quantities, apply coupons, proceed to checkout |
| `checkout.html` | Order form and WhatsApp link | Enter customer info, review order, send via WhatsApp |
| `collections.html` | Curated product groupings | Browse 7 collection categories, filter, search, sort |
| `admin-login.html` | Admin authentication | Login with admin credentials |
| `admin-dashboard.html` | Admin control panel | Manage products, orders, settings, view analytics |

---

## 3. WEBSITE FLOW (User Journey)

### **Customer Flow**

```
┌─────────────┐
│ index.html  │  (Home page with featured products)
└──────┬──────┘
       │ "Shop Now" / "Collections"
       ▼
┌─────────────────────┐
│ pages/shop.html     │  (Browse all products)
│  • Filter by type   │
│  • Sort by price    │
└──────┬──────────────┘
       │ Click product
       ▼
┌──────────────────────┐
│ pages/product.html   │  (Product detail)
│  • View images       │
│  • Select size/color │
│  • Add to cart       │
└──────┬───────────────┘
       │ "Add to Cart"
       ▼
┌──────────────────────┐
│ pages/cart.html      │  (Review cart)
│  • Update quantities │
│  • Apply coupon      │
└──────┬───────────────┘
       │ "Checkout"
       ▼
┌──────────────────────┐
│ pages/checkout.html  │  (Fill order form)
│  • Enter address     │
│  • Confirm details   │
│  • Submit via WA     │
└──────┬───────────────┘
       │ "Send Order"
       ▼
┌──────────────────────┐
│ thank-you.html       │  (Order confirmation)
│  • Thank you message │
│  • Return to shop    │
└──────────────────────┘
```

### **Admin Flow**

```
┌────────────────────────┐
│ admin-login.html       │  (Login page)
│ Username: admin        │
│ Password: admin123     │
└──────┬─────────────────┘
       │ Submit credentials
       ▼
┌─────────────────────────┐
│ admin-dashboard.html    │  (Main dashboard)
├─────────────────────────┤
│ ✓ Product Manager       │  Add, edit, delete products
│ ✓ Order Manager         │  View & update order status
│ ✓ Delivery Settings     │  Set shipping costs/zones
│ ✓ Coupon Manager        │  Create discount codes
│ ✓ Website Settings      │  Edit business info/links
│ ✓ Analytics             │  View sales & views
├─────────────────────────┤
│ Logout                  │  Return to login
└─────────────────────────┘
```

---

## 4. NAVIGATION MAP

### **Header Navigation (All Pages)**
```
[BIN DAUD Logo] ──────────────────────────────── [Shop Now Button]
  ↓
  Home  |  Shop  |  Cart (Badge)  |  Collections  |  About  |  Contact
```

**Key Navigation Rules:**
- From `/pages/` → use relative paths `../index.html`
- From root → use direct paths `pages/shop.html`
- Cart badge shows count automatically via `updateCartBadge()`
- Contact link is placeholder (links to `#`)

### **Page Cross-References**

| From | To | Link | Element |
|------|-----|------|---------|
| Home | Shop | `pages/shop.html` | "Shop Collection" button |
| Home | Collections | `pages/collections.html` | Nav link |
| Shop | Product | `pages/product.html?id={productId}` | Product card click |
| Product | Cart | `pages/cart.html` | "Add to Cart" button |
| Cart | Checkout | `pages/checkout.html` | "Checkout" button |
| Checkout | Thank You | `thank-you.html` | After WhatsApp |
| All | Home | `index.html` | Logo click |
| Admin Login | Admin Dashboard | `admin-dashboard.html` | Login success |

---

## 5. DESIGN SYSTEM

### **Colors**
```css
Primary:      #214B6B (Navy - BIN DAUD brand)
Accent:       #D4A574 (Gold - luxury element)
Text:         #1a1a1a (Nearly black)
Muted:        #666 (Secondary text)
Border:       #e0e0e0 (Light gray)
Success:      #4CAF50
Error:        #F44336
```

### **Typography**
```css
Font Family 1: "Poppins" (Regular text, body)
Font Family 2: "Montserrat" (Headings, bold)

Sizes:
- h1: 2.5rem (40px)
- h2: 2rem (32px)
- h3: 1.5rem (24px)
- body: 1rem (16px)
- small: 0.875rem (14px)
```

### **Spacing**
```css
Base unit: 1rem (16px)
Grid gaps: 1rem, 1.5rem, 2rem
Padding: 0.5rem, 1rem, 1.5rem, 2rem
```

### **Breakpoints**
```css
Mobile:         max-width: 640px
Tablet:         640px - 1024px
Desktop:        1024px - 1440px
Large Desktop:  1440px+
```

### **Components**

#### **Buttons**
```html
<!-- Primary Button -->
<a href="#" class="btn btn-primary">Shop Now</a>

<!-- Ghost Button -->
<a href="#" class="btn btn-ghost">Learn More</a>

<!-- Small Button -->
<button class="btn btn-primary btn-sm">Add to Cart</button>
```

#### **Grids**
```html
<!-- 3-column grid -->
<div class="grid--3">
  <div class="product-card">...</div>
</div>

<!-- 4-column grid (shop) -->
<div class="grid--4 shop-products-grid">...</div>
```

#### **Cards**
```html
<article class="product-card">
  <div class="product-media">
    <img src="..." alt="...">
  </div>
  <div class="product-body">
    <h3 class="product-title">Product Name</h3>
    <p class="product-price">PKR 2,499</p>
  </div>
</article>
```

---

## 6. JAVASCRIPT ARCHITECTURE

### **How app.js Boots the Storefront**

**File:** `js/app.js`
```javascript
import { initSite } from './cart.js';

if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initSite();
  });
}
```

**What initSite() does:**
1. `initStickyHeader()` - Makes header sticky on scroll
2. `initMobileMenu()` - Handles hamburger menu toggle
3. `updateCartBadge()` - Shows cart item count
4. Detects current page and calls appropriate initializer:
   - `.shop-products-grid` → `renderShopPage()`
   - `#collections-shell` → `initCollectionsPage()`
   - `.product-details-section` → `populateProductPage()` + gallery init
   - `.cart-layout` → `initCartPage()`
   - `.checkout-page` → `initCheckoutPage()`

**Key Pattern:** Page-specific HTML elements trigger page-specific JavaScript. This means:
- Each HTML file must have the correct CSS selectors
- No page gets initialized if the selector doesn't exist
- This is GOOD for performance (conditional loading)

### **localStorage Structure**

#### **Cart Storage** (cartStorage.js)
```javascript
localStorage.bindaud_cart = JSON.stringify([
  {
    cartItemId: "unique-id",
    id: "BD-001",
    name: "Oversized Dragon Tee",
    price: 2499,
    oldPrice: 3200,
    quantity: 1,
    size: "L",
    color: "Black",
    collection: "tees",
    code: "BD-TEE-001",
    image: "assets/products/product1.jpg"
  }
])

localStorage.bindaud_cart_coupon = JSON.stringify({
  code: "WELCOME10",
  discount: 10
})
```

#### **Admin State** (adminStorage.js)
```javascript
localStorage.bindaud_admin_state = JSON.stringify({
  admin: { username: "admin", password: "admin123" },
  session: { loggedIn: false, rememberMe: false },
  products: [...PRODUCT_CATALOG],
  orders: [...],
  coupons: [...],
  delivery: { islamabad: 250, punjab: 300, ... },
  settings: { businessName: "BIN DAUD", ... },
  activity: [...]
})

localStorage.bindaud_admin_session = JSON.stringify({
  loggedIn: true,
  rememberMe: false,
  lastLogin: "2026-07-19T...",
  username: "admin"
})
```

### **Key Functions by Module**

#### **helpers.js**
```javascript
// Product catalog (6 items, expandable via admin)
PRODUCT_CATALOG[]

// Resolve image paths relative to current location
resolveSitePath(path) → String

// Format numbers as currency
formatCurrency(value) → "PKR 2,499"

// Extract URL search parameters
getQueryParam(key) → String

// Clamp numbers to min/max
clampQuantity(value, min, max) → Number

// Build product detail page links
buildProductLink(productId) → "pages/product.html?id=BD-001"
```

#### **cartStorage.js**
```javascript
// Add item to cart
addToCart(product) → void

// Get all cart items
getCart() → Array<cartItem>

// Update quantity (+1 or -1)
updateCartQuantity(cartItemId, delta) → void

// Remove item from cart
removeCartItem(cartItemId) → void

// Calculate totals (subtotal, discount, shipping, tax, grandTotal)
calculateCartTotals(cart) → {
  subtotal: Number,
  discountAmount: Number,
  shipping: Number,
  tax: Number,
  grandTotal: Number,
  coupon: String
}

// Apply coupon code
setCoupon(code) → { message: String, success: Boolean }

// Get active coupon
getAppliedCoupon() → Object | null

// Clear coupon
clearCoupon() → void

// Get cart item count
getCartCount() → Number

// Save cart to localStorage
saveCart(cartArray) → void
```

#### **cart.js (Main App Logic)**
```javascript
// Render product grid on shop page
renderShopPage() → void

// Populate single product page
populateProductPage() → void

// Initialize product image gallery
initProductGallery() → void

// Initialize product description tabs
initProductTabs() → void

// Initialize quantity +/- buttons
initProductQuantityControls() → void

// Initialize collections page with 7 sections
initCollectionsPage() → void

// Render cart items and summary
renderCartPage() → void

// Initialize checkout form and WhatsApp integration
initCheckoutPage() → void

// Update cart badge count
updateCartBadge() → void

// Make header sticky on scroll
initStickyHeader() → void

// Handle mobile menu toggle
initMobileMenu() → void
```

#### **adminStorage.js**
```javascript
// Get entire admin state from localStorage
getAdminState() → Object

// Authenticate admin user
authenticateAdmin(username, password, rememberMe) → Boolean

// Logout admin
logoutAdmin() → void

// Get/set products array
getProducts() → Array
upsertProduct(productData) → Object

// Delete product by ID
deleteProduct(productId) → Array

// Get all orders
getOrders() → Array

// Create new order
createOrder(orderData) → Object

// Update order status
updateOrderStatus(orderId, status) → Object

// Get/create coupons
getCoupons() → Array
createCoupon(couponData) → Object
deleteCoupon(couponId) → Array

// Get/save delivery and website settings
getDeliverySettings() → Object
saveDeliverySettings(settings) → void
getWebsiteSettings() → Object
saveWebsiteSettings(settings) → void

// Analytics
getAnalytics() → { topSelling, mostViewed, revenue, ordersThisMonth }
recordProductView(productId) → Object
getActivityFeed() → Array

// Currency formatting
formatAdminCurrency(value) → String
```

#### **adminDashboard.js**
```javascript
// Initialize admin login page
initAdminLogin() → void

// Initialize admin dashboard with all sections
initAdminDashboard() → void

// Render summary cards (orders, products, revenue, etc.)
renderSummary() → void

// Render product list with edit/delete buttons
renderProducts() → void

// Render orders table with search/sort/filter
renderOrders() → void

// Render delivery settings form
renderDeliverySettings() → void

// Render coupon list
renderCoupons() → void

// Render website settings form
renderWebsiteSettings() → void

// Render analytics and charts
renderAnalytics() → void

// Populate product form for editing
populateProductForm(product) → void
```

---

## 7. HOW PRODUCTS WORK

### **Where Products Are Stored**

**Initial Load:** `js/helpers.js`
```javascript
export const PRODUCT_CATALOG = [
  {
    id: 'BD-001',
    name: 'Oversized Dragon Tee',
    image: 'assets/products/product1.jpg',
    price: 2499,
    oldPrice: 3200,
    sizeOptions: ['S', 'M', 'L', 'XL'],
    colorOptions: ['Black', 'Sand'],
    collection: 'tees',
    badge: 'Best Seller',
    // ... more fields
  },
  // 5 more products
]
```

**After Admin Adds Product:** `localStorage.bindaud_admin_state.products`
- Admin-created products override PRODUCT_CATALOG
- When admin saves a product, it goes to localStorage
- On page load, admin module loads from localStorage (not helpers.js)

### **How Products Display Across Pages**

#### **On Shop Page** (shop.html)
1. `initSite()` detects `.shop-products-grid` selector
2. Calls `renderShopPage()`
3. Gets filtered PRODUCT_CATALOG (or admin products)
4. For each product, calls `createProductCard(product)`
5. `createProductCard()` builds HTML with:
   - Product image (with resolveSitePath)
   - Product name, price, discount
   - Size/color dropdowns
   - "Quick View" link to `product.html?id=BD-001`
   - "Add to Cart" button
6. Cards inserted into grid

#### **On Product Detail Page** (product.html)
1. `initSite()` detects `.product-details-section` selector
2. Calls `populateProductPage()`
3. Gets product ID from URL: `getQueryParam('id')`
4. Finds product in PRODUCT_CATALOG
5. Populates all fields:
   - Title, price, old price, discount
   - Rating and review count
   - Description, features, shipping, returns
   - Main image and thumbnails
6. Initializes interactions:
   - Gallery thumbnail clicks
   - Description/specs/shipping/returns tabs
   - Quantity +/- buttons
   - Add to Cart button

#### **On Collections Page** (collections.html)
1. `initSite()` detects `#collections-shell` selector
2. Calls `initCollectionsPage()`
3. Creates 7 collection sections:
   - Dragon Collection
   - Crane Collection
   - Limited Edition
   - Premium Streetwear
   - Summer Collection
   - New Arrivals
   - Best Sellers
4. For each section, filters PRODUCT_CATALOG by keywords/badges
5. Each section has:
   - Banner image (first product in collection)
   - Collection title and description
   - Filter buttons (All, Tees, Kimonos, Jackets)
   - Search box and sort dropdown
   - Product grid with cards

### **How Admin Adds Products**

**Via Admin Dashboard:**
1. Login at `pages/admin-login.html`
2. Go to "Product Manager" section
3. Fill out form:
   - Product Name
   - Price / Old Price
   - Category / Collection
   - Stock / Sizes / Colors
   - Description
   - Optional image upload
   - Checkboxes for Featured/Trending/Best Seller
4. Click "Add Product"
5. `upsertProduct()` in adminStorage.js:
   - Generates unique ID (BD-NNN)
   - Saves to localStorage
   - Records activity
6. Product immediately appears on shop and collections

**Data Structure for Admin Product:**
```javascript
{
  id: "BD-007",
  name: "New Product Name",
  price: 5000,
  oldPrice: 6000,
  category: "Essentials",
  collection: "jackets",
  stock: "In Stock",
  sizeOptions: ["S", "M", "L"],
  colorOptions: ["Black", "Navy"],
  description: "Product description...",
  code: "BD-NEW-007",
  featured: true,
  trending: false,
  bestSeller: false,
  image: "data:image/jpeg;base64,...", // Base64 if uploaded
  views: 0,
  sales: 0
}
```

### **How Shop Updates**

**When a product is added/edited/deleted:**
1. Admin saves product
2. localStorage updated with new admin state
3. Admin sees updated product list
4. **Customer side:** Doesn't see update until page reload OR...
5. Better: Add event listener to storage events:
```javascript
window.addEventListener('storage', () => {
  renderShopPage(); // Re-render on any admin changes
});
```

**Current Status:** ✅ Already implemented in admin dashboard

### **How Collections Update**

Collections are **dynamically computed** based on:
- Product keywords (e.g., "dragon" matches "Oversized Dragon Tee")
- Product badges (e.g., "New" badge → New Arrivals collection)
- Product collection field (e.g., collection="jackets" → Premium Streetwear)

When admin adds product with keyword/badge/collection, it automatically appears in matching collections.

**Current collections filter logic:**
```javascript
const getProductsForCollection = (definition) => 
  PRODUCT_CATALOG.filter((product) => {
    // Check if product name/description contains keywords
    if (definition.keywords.some(k => 
        product.name.toLowerCase().includes(k))) 
      return true;
    
    // Check if product has matching badge
    if (definition.badges?.some(b => 
        product.badge.toLowerCase() === b.toLowerCase())) 
      return true;
    
    // Check if product in matching collection
    if (definition.collections?.some(c => 
        product.collection === c)) 
      return true;
    
    return false;
  });
```

### **How Product Pages Update**

**Product detail page URL structure:**
```
pages/product.html?id=BD-001
```

When user clicks "Quick View" on any product card, the card renders link:
```javascript
<a href="${buildProductLink(product.id)}" class="btn btn-ghost">
  Quick View
</a>
```

Which generates:
```
pages/product.html?id=BD-001
```

On page load, `populateProductPage()` reads the ID from URL and fetches product data.

---

## 8. HOW ORDERS WORK

### **Cart System**

**Storage:** `localStorage.bindaud_cart`
```javascript
[
  {
    cartItemId: "unique-id",     // Generated at add time
    id: "BD-001",                 // Product ID
    name: "Product Name",
    price: 2499,
    quantity: 2,
    size: "L",
    color: "Black",
    image: "assets/products/...",
    // ... all product fields
  }
]
```

**Key Operations:**

1. **Add to Cart**
   ```javascript
   addToCart(product)
   // Generates unique cartItemId
   // Adds to localStorage
   // Updates cart badge
   ```

2. **Update Quantity**
   ```javascript
   updateCartQuantity(cartItemId, delta)
   // delta = +1 or -1
   // Clamps between 1-20
   ```

3. **Calculate Totals**
   ```javascript
   calculateCartTotals(cart)
   // Returns: {
   //   subtotal: sum of (price × qty),
   //   discountAmount: based on coupon,
   //   shipping: based on zone,
   //   tax: 5% of subtotal,
   //   grandTotal: subtotal - discount + shipping + tax,
   //   coupon: code
   // }
   ```

### **Checkout Flow**

**Step-by-step on pages/checkout.html:**

1. **Form Input**
   - Full name
   - Phone number
   - Email
   - City (Islamabad, Punjab, KPK, Sindh, Balochistan)
   - Complete address
   - Postal code
   - Province
   - Special notes
   - Payment method (Cash on Delivery, other options TBA)

2. **Form Validation**
   - Required fields: name, phone, city, address
   - Shows error messages if empty
   - Highlights invalid fields

3. **Order Preview**
   - Shows all cart items with quantities and prices
   - Shows subtotal, discount, shipping, tax, grandTotal
   - Shows customer details

4. **WhatsApp Submission**
   - Builds formatted message with:
     - Customer details
     - Product list
     - Order totals
   - Opens WhatsApp Web with pre-filled message
   - Message sent to: **923288582902** (hardcoded, should be configurable)

5. **Order Confirmation Modal**
   - "Do you want to proceed to thank you page?"
   - If YES: Clear cart, redirect to thank-you.html
   - If NO: Keep cart, stay on checkout

6. **Order Creation**
   - When form submits, `createOrder()` is called
   - Order saved to `localStorage.bindaud_admin_state.orders`
   - Order gets unique ID: `ORD-{timestamp}`
   - Status set to "Pending"
   - Timestamp recorded

### **Admin Order Management**

**Order Data Structure:**
```javascript
{
  id: "ORD-1689875230000",
  orderNumber: "ORD-875230",
  customerName: "Ahmed Khan",
  phone: "03001234567",
  address: "123 Main St",
  city: "Islamabad",
  products: [
    {
      name: "Oversized Dragon Tee",
      quantity: 2,
      price: 2499,
      code: "BD-TEE-001"
    }
  ],
  total: 5498,
  paymentMethod: "Cash on Delivery",
  status: "Pending",           // Can change to: Confirmed, Delivered, Cancelled
  createdAt: "2026-07-19T...",
  updatedAt: "2026-07-19T..."
}
```

**Admin Operations:**
1. **View Orders** - Table with search, sort, filter
2. **Update Status** - Dropdown to change status
3. **Search** - By customer name, city, phone
4. **Sort** - By date (newest first) or total amount
5. **Filter** - By status (Pending, Confirmed, Delivered, Cancelled)

---

## 9. HOW TO ADD NEW PRODUCTS

### **Method 1: Via Admin Dashboard (Recommended)**

1. Navigate to `pages/admin-login.html`
2. Enter credentials:
   - Username: `admin`
   - Password: `admin123`
3. Click "Product Manager" section
4. Fill in form:
   ```
   Product Name:        [required]
   Price:              [required]
   Old Price:          [optional, for discount display]
   Category:           [e.g., "Essentials"]
   Collection:         [e.g., "tees", "jackets", "kimono"]
   Stock:              [e.g., "In Stock", "Low Stock"]
   Sizes:              [comma-separated: "S, M, L, XL"]
   Colors:             [comma-separated: "Black, Navy"]
   Product Code:       [e.g., "BD-TEE-007"]
   Description:        [product info]
   Image Upload:       [optional, drag & drop or browse]
   Featured:           [checkbox]
   Trending:           [checkbox]
   Best Seller:        [checkbox]
   ```
5. Click "Add Product"
6. Product appears immediately on shop and collections

### **Method 2: Direct Hardcode (Development Only)**

**File:** `js/helpers.js`

Add to `PRODUCT_CATALOG` array:
```javascript
{
  id: 'BD-007',
  name: 'New Product Name',
  image: 'assets/products/product1.jpg',
  price: 3999,
  oldPrice: 4999,
  discount: '20%',
  sizeOptions: ['S', 'M', 'L', 'XL'],
  colorOptions: ['Black', 'Navy'],
  color: 'Black',
  code: 'BD-NEW-007',
  rating: 4.8,
  reviews: 150,
  stock: 'In Stock',
  collection: 'tees',
  badge: 'New',
  description: 'Premium product description...',
  features: ['Feature 1', 'Feature 2'],
  shipping: 'Free shipping across Pakistan...',
  returns: 'Return within 7 days...'
}
```

⚠️ **Warning:** Hardcoded products are overwritten by admin products in localStorage. Use admin dashboard for production.

### **Required Fields vs Optional**

| Field | Required | Notes |
|-------|----------|-------|
| `id` | Yes | Format: BD-NNN (auto-generated by admin) |
| `name` | Yes | Product title displayed everywhere |
| `price` | Yes | Current selling price (number) |
| `image` | Yes | Path or data URL |
| `collection` | Yes | Must be: tees, jackets, kimono |
| `sizeOptions` | Yes | Array of strings |
| `colorOptions` | Yes | Array of strings |
| `code` | Yes | Product SKU for inventory |
| `oldPrice` | No | For discount display |
| `badge` | No | "New", "Best Seller", "Limited" |
| `description` | No | Full product description |
| `rating` | No | 0-5 stars |
| `reviews` | No | Customer review count |
| `features` | No | Array of feature bullets |
| `shipping` | No | Shipping info text |
| `returns` | No | Return policy text |

---

## 10. HOW TO CHANGE PRICES

### **Method 1: Via Admin Dashboard**

1. Login to admin at `pages/admin-login.html`
2. Find product in "Product Manager" list
3. Click "Edit" button
4. Change price in form
5. Click "Update Product"

### **Method 2: Direct Edit**

**File:** `js/helpers.js`

Find product in PRODUCT_CATALOG and update:
```javascript
{
  id: 'BD-001',
  name: 'Oversized Dragon Tee',
  price: 2499,      // ← Change this
  oldPrice: 3200,   // ← And/or this (for discount)
  discount: '22%',  // ← Discount % display
  // ...
}
```

**Discount Calculation:**
```
discount = ((oldPrice - price) / oldPrice) * 100
```

Example:
- Old Price: 3200
- New Price: 2499
- Discount: ((3200-2499)/3200) × 100 = 22%

### **Bulk Price Updates**

To update all products at once:
```javascript
// In helpers.js
PRODUCT_CATALOG.forEach(product => {
  product.price = Math.floor(product.price * 1.1); // 10% increase
});
```

---

## 11. HOW TO CHANGE DELIVERY CHARGES

### **Via Admin Dashboard**

1. Login to admin
2. Find "Delivery Settings" section
3. Update:
   ```
   Islamabad Delivery:     [amount in PKR]
   Punjab Delivery:        [amount in PKR]
   KPK Delivery:          [amount in PKR]
   Sindh Delivery:        [amount in PKR]
   Balochistan Delivery:  [amount in PKR]
   Free Shipping Limit:   [amount in PKR]
   Express Shipping:      [checkbox]
   ```
4. Click "Save Delivery Settings"

**Example:**
- Islamabad: 250 PKR
- Punjab: 300 PKR
- KPK: 400 PKR
- Free above: 8,000 PKR

### **How Shipping is Calculated**

**File:** `js/cartStorage.js`
```javascript
calculateCartTotals(cart) {
  // Get delivery zone from admin settings
  const deliverySettings = getDeliverySettings();
  
  // Get city from checkout form
  const city = getCity(); // "Islamabad"
  
  // Get shipping cost
  let shipping = deliverySettings[city.toLowerCase()] || 0;
  
  // Apply free shipping threshold
  if (subtotal >= deliverySettings.freeShippingLimit) {
    shipping = 0;
  }
  
  // Express shipping (double cost?)
  if (deliverySettings.expressShipping) {
    // TBA - not yet implemented
  }
}
```

---

## 12. HOW TO CHANGE SOCIAL LINKS & BUSINESS INFO

### **Via Admin Dashboard**

1. Login to admin
2. Go to "Website Settings" section
3. Update:
   ```
   Business Name:       [BIN DAUD]
   WhatsApp Number:     [923288582902]
   Facebook:            [URL]
   Instagram:           [URL]
   Google Business:     [Business name/URL]
   Email:              [contact email]
   Currency:           [PKR]
   Tax (%):            [5]
   Shipping:           [Info text]
   ```
4. Click "Save Settings"

### **Where These Are Used**

| Setting | Used In | HTML Element |
|---------|---------|--------------|
| Business Name | Footer, settings page | Footer copyright |
| WhatsApp Number | Checkout WhatsApp link | Hardcoded in cart.js (line ~890) |
| Facebook | Footer social links | Footer nav |
| Instagram | Footer social links | Footer nav |
| Email | Footer contact | Footer contact section |
| Currency | All prices | Prefix in formatCurrency() |
| Tax | Cart totals | calculateCartTotals() calculation |

### **Direct Edit (Development)**

**File:** `js/adminStorage.js`
```javascript
const createDefaultState = () => ({
  // ...
  settings: {
    businessName: 'BIN DAUD',
    whatsappNumber: '923288582902',
    facebook: 'https://www.facebook.com/...',
    instagram: 'https://www.instagram.com/...',
    email: 'hello@bindaud.com',
    currency: 'PKR',
    tax: 5,
    shipping: 'Free delivery on orders above PKR 8,000.'
  }
});
```

---

## 13. HOW TO DEPLOY WEBSITE

### **Current Setup**

The website runs **entirely in the browser**:
- No backend required
- No server needed
- Works from any static file hosting

### **Deployment Options**

#### **Option 1: Vercel (Recommended - Free)**
1. Push code to GitHub
2. Connect GitHub to Vercel
3. Vercel auto-deploys on push
4. Get instant HTTPS and global CDN

#### **Option 2: Netlify (Free)**
1. Push code to GitHub
2. Connect GitHub to Netlify
3. Netlify builds and deploys
4. Get HTTPS and continuous deployment

#### **Option 3: GitHub Pages (Free)**
1. Push to GitHub
2. Enable GitHub Pages in repo settings
3. Site live at `username.github.io/BINDAUD`

#### **Option 4: Traditional Hosting**
1. Buy hosting plan (any provider)
2. FTP upload all files
3. Set root directory to project folder
4. Works immediately

### **Pre-Deployment Checklist**

- [ ] All links use correct relative paths
- [ ] Images verified in browser
- [ ] Admin login works
- [ ] Cart persists on reload
- [ ] Checkout WhatsApp link works
- [ ] Mobile responsive tested
- [ ] No console errors
- [ ] Meta descriptions present
- [ ] Favicon configured (optional)

### **After Deployment**

1. Test all pages on live domain
2. Test mobile experience
3. Test cart → checkout → WhatsApp flow
4. Test admin login
5. Create first test order
6. Monitor localStorage (browser DevTools)

---

## 14. HOW TO CONVERT TO BACKEND LATER

### **Current Architecture (Frontend-Only)**

```
Browser
  ├─ localStorage (Cart, Admin, Orders)
  └─ Static HTML/CSS/JS files
```

### **Future Backend Architecture Options**

#### **Option A: Node.js + Express**

```
Browser ← HTTPS ← Express Server
                    ├─ MongoDB (Products, Orders, Users)
                    ├─ Authentication (JWT)
                    ├─ Payment Processing
                    └─ Email/SMS Notifications
```

**Migration Steps:**

1. **Keep Frontend Unchanged**
   - HTML files stay the same
   - CSS unchanged
   - Most JavaScript unchanged

2. **Move Data Endpoints**
   - Replace `PRODUCT_CATALOG` from helpers.js with API fetch
   - Replace localStorage operations with API calls
   - Update adminStorage.js to use API instead of localStorage

3. **Create Backend API**
   ```
   GET  /api/products          → List all products
   POST /api/products          → Create product (admin only)
   PUT  /api/products/:id      → Update product (admin only)
   GET  /api/orders            → List orders (admin only)
   POST /api/orders            → Create order
   PUT  /api/orders/:id        → Update order status (admin only)
   POST /api/auth/login        → Admin login
   ```

4. **Add Authentication**
   - JWT tokens for admin
   - Store token in localStorage
   - Send with each admin request

5. **Add Payment Processing**
   - Keep WhatsApp for now OR
   - Integrate Stripe/JazzCash/EasyPaisa
   - Update checkout.html and initCheckoutPage()

#### **Option B: Firebase/Supabase (BaaS)**

```
Browser
  ├─ Firestore (Database)
  ├─ Firebase Auth
  ├─ Cloud Storage (Images)
  └─ Cloud Functions (Business Logic)
```

**Advantages:**
- No server to manage
- Real-time database updates
- Built-in authentication
- File upload handling

**Migration:**

1. Install Firebase SDK
2. Replace localStorage with Firestore calls
3. Add Firebase Auth for admin login
4. Move product images to Cloud Storage
5. Use Cloud Functions for order processing

#### **Option C: Supabase (Postgres + Auth)**

```
Browser
  ├─ PostgreSQL (Database)
  ├─ Auth (JWT)
  ├─ File Storage (Images)
  └─ REST API (auto-generated)
```

**Similar to Firebase but with:**
- Standard SQL database
- Better control
- Lower costs at scale

### **Key Files to Modify**

1. **helpers.js**
   ```javascript
   // Replace:
   export const PRODUCT_CATALOG = [...]
   
   // With:
   export const getProducts = async () => {
     const response = await fetch('/api/products');
     return response.json();
   }
   ```

2. **cartStorage.js**
   ```javascript
   // Replace localStorage with:
   export const createOrder = async (orderData) => {
     const response = await fetch('/api/orders', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(orderData)
     });
     return response.json();
   }
   ```

3. **adminStorage.js**
   ```javascript
   // Replace localStorage with API calls
   export const authenticateAdmin = async (username, password) => {
     const response = await fetch('/api/auth/login', {
       method: 'POST',
       body: JSON.stringify({ username, password })
     });
     const { token } = await response.json();
     localStorage.setItem('admin_token', token);
     return true;
   }
   ```

4. **cart.js**
   ```javascript
   // Add JWT header to all admin requests:
   const getAuthHeader = () => ({
     'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
   });
   ```

### **Testing Migration**

1. Run both versions in parallel
2. Verify data matches
3. Test all user flows
4. Performance test
5. Load test
6. Gradually migrate users

---

## 15. FUTURE ROADMAP

### **Phase 2: Enhanced Features (Q3 2026)**
- [ ] **Wishlist** - Save favorite products
- [ ] **Product Reviews** - Customer ratings and comments
- [ ] **Advanced Filters** - Size, color, price range
- [ ] **Search Bar** - Full-text product search
- [ ] **Email Notifications** - Order confirmation emails
- [ ] **SMS Notifications** - Order status updates
- [ ] **Inventory Sync** - Real-time stock updates
- [ ] **Customer Accounts** - Save addresses, order history
- [ ] **Analytics Dashboard** - Traffic, conversion, top products

### **Phase 3: Payment Integration (Q4 2026)**
- [ ] **Stripe Integration** - International payments
- [ ] **JazzCash Integration** - Pakistan payments
- [ ] **EasyPaisa Integration** - Pakistan payments
- [ ] **Installments** - Flexible payment options
- [ ] **Invoicing** - Automatic receipt generation

### **Phase 4: Backend Migration (2027)**
- [ ] **Node.js/Express Backend**
- [ ] **PostgreSQL Database**
- [ ] **Docker Deployment**
- [ ] **API Documentation**
- [ ] **Admin Authentication** - Secure backend auth
- [ ] **Email Service** - SendGrid/Mailgun
- [ ] **Image CDN** - Cloudinary/AWS S3

### **Phase 5: Mobile App (2027)**
- [ ] **React Native App**
- [ ] **iOS Distribution**
- [ ] **Android Distribution**
- [ ] **Push Notifications**

### **Phase 6: Advanced (2028+)**
- [ ] **AI Recommendations** - "You might like"
- [ ] **Augmented Reality** - Try-on feature
- [ ] **Subscription Boxes** - Monthly collections
- [ ] **Loyalty Program** - Points and rewards
- [ ] **Referral System** - Earn by inviting friends

---

## 16. CODING STANDARDS & BEST PRACTICES

### **JavaScript Standards**

1. **Use ES6+ Features**
   ```javascript
   // ✓ Good
   const products = catalog.map(p => ({ ...p, featured: true }));
   
   // ✗ Avoid
   var products = [];
   for (var i = 0; i < catalog.length; i++) {
     products.push(Object.assign({}, catalog[i], { featured: true }));
   }
   ```

2. **Always Check for Element Existence**
   ```javascript
   // ✓ Good
   const grid = select('.shop-products-grid');
   if (!grid) return;
   
   // ✗ Avoid
   select('.shop-products-grid').innerHTML = products; // May crash
   ```

3. **Use const/let, never var**
   ```javascript
   // ✓ Good
   const immutable = 'value';
   let mutable = 'value';
   
   // ✗ Avoid
   var global = 'value'; // Global scope pollution
   ```

4. **Comment Complex Logic**
   ```javascript
   // ✓ Good
   // Calculate discount percentage: ((oldPrice - price) / oldPrice) * 100
   const discountPercent = ((product.oldPrice - product.price) / product.oldPrice) * 100;
   
   // ✗ Avoid
   const d = ((p.o - p.p) / p.o) * 100; // Unclear
   ```

5. **Use Descriptive Names**
   ```javascript
   // ✓ Good
   const cartTotals = calculateCartTotals(cart);
   const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
   
   // ✗ Avoid
   const t = calculateCartTotals(c);
   const valid = /.+@.+\..+/.test(e);
   ```

### **CSS Standards**

1. **Use Existing Variables**
   ```css
   /* ✓ Good */
   .button {
     background: var(--color-primary);
     padding: 1rem;
   }
   
   /* ✗ Avoid */
   .button {
     background: #214B6B;
     padding: 16px;
   }
   ```

2. **Mobile-First Responsive**
   ```css
   /* ✓ Good */
   .grid {
     grid-template-columns: 1fr;
   }
   @media (min-width: 640px) {
     .grid {
       grid-template-columns: repeat(2, 1fr);
     }
   }
   
   /* ✗ Avoid */
   .grid {
     grid-template-columns: repeat(4, 1fr);
   }
   @media (max-width: 1024px) {
     .grid {
       grid-template-columns: repeat(2, 1fr);
     }
   }
   ```

3. **Use Class Naming Conventions**
   ```css
   /* ✓ Good BEM-style */
   .product-card { }
   .product-card__image { }
   .product-card--featured { }
   
   /* ✗ Avoid */
   .product { }
   .product img { }
   .featured-product { }
   ```

### **HTML Standards**

1. **Always Include alt Text**
   ```html
   <!-- ✓ Good -->
   <img src="product.jpg" alt="Oversized Dragon Tee in black">
   
   <!-- ✗ Avoid -->
   <img src="product.jpg">
   <img src="product.jpg" alt="image">
   ```

2. **Use Semantic HTML**
   ```html
   <!-- ✓ Good -->
   <article class="product-card">
     <header>
       <h3>Product Title</h3>
     </header>
     <section>
       <img src="...">
     </section>
   </article>
   
   <!-- ✗ Avoid -->
   <div class="product-card">
     <div class="header">
       <div class="title">Product Title</div>
     </div>
   </div>
   ```

3. **Include ARIA Labels**
   ```html
   <!-- ✓ Good -->
   <button aria-label="Add to cart">+</button>
   <input type="search" aria-label="Search products">
   
   <!-- ✗ Avoid -->
   <button>+</button>
   <input type="search">
   ```

---

## 17. AI DEVELOPER INSTRUCTIONS

### **CRITICAL: DO NOT**

1. ❌ **DO NOT redesign the website**
   - Preserve current aesthetic
   - Keep color scheme
   - Maintain layout structure
   - Reuse existing components

2. ❌ **DO NOT replace working features**
   - Cart system works ✓
   - Checkout flow works ✓
   - Admin dashboard works ✓
   - Product display works ✓
   - Just enhance or extend

3. ❌ **DO NOT rewrite working code**
   - If it works, don't touch it
   - Make incremental improvements
   - Refactor only when necessary
   - Always test after changes

4. ❌ **DO NOT remove files or modules**
   - Each file serves a purpose
   - Even unused code may be needed
   - Archive before deleting
   - Check dependencies first

5. ❌ **DO NOT change the design system**
   - Colors: Already perfect
   - Typography: Established
   - Spacing: Consistent
   - Components: Proven

### **CRITICAL: DO THIS**

1. ✅ **Always analyze before coding**
   - Read entire project first
   - Understand dependencies
   - Check existing patterns
   - Look for duplication

2. ✅ **Always improve incrementally**
   - One feature at a time
   - Test after each change
   - Get user feedback
   - Iterate based on feedback

3. ✅ **Always preserve backward compatibility**
   - Keep existing APIs
   - Don't break localStorage
   - Maintain URL structure
   - Support old browsers

4. ✅ **Always document changes**
   - Explain why you changed it
   - Update this README
   - Comment complex logic
   - Leave breadcrumbs for next developer

5. ✅ **Always test before deploying**
   - All pages load
   - Cart persists
   - Checkout works
   - Admin functions
   - Mobile responsive

### **Reusable Components to Leverage**

| Component | File | Usage |
|-----------|------|-------|
| Product Card | cart.js `createProductCard()` | Shop, Collections |
| Price Display | helpers.js `formatCurrency()` | All pages |
| Path Resolution | helpers.js `resolveSitePath()` | All image/link paths |
| Toast Notification | toast.js `showToast()` | User feedback |
| Select Helper | cart.js `const select = ...` | DOM queries |
| Cart Total | cartStorage.js `calculateCartTotals()` | Cart, Checkout, Admin |
| Button Styles | css/style.css `.btn` family | All CTAs |
| Grid System | css/style.css `.grid--3`, `.grid--4` | Layouts |
| Responsive Text | css/responsive.css | Mobile layouts |

### **Architecture Patterns to Follow**

1. **Query Parameter Routing**
   ```javascript
   // Get product ID from URL
   const productId = getQueryParam('id');
   ```

2. **Conditional Initialization**
   ```javascript
   // Only initialize if element exists
   if (document.querySelector('.shop-products-grid')) {
     renderShopPage();
   }
   ```

3. **localStorage Persistence**
   ```javascript
   // Always save to localStorage
   saveCart(updatedCart);
   // Verify on page load
   const cart = getCart();
   ```

4. **Event Delegation**
   ```javascript
   // Listen on parent, act on children
   grid.addEventListener('click', (e) => {
     const button = e.target.closest('.btn');
     if (!button) return;
     // Handle click
   });
   ```

### **Documentation You Must Update**

When making changes:

1. **Update this README** if architecture changes
2. **Add comments** to complex functions
3. **Update code comments** when logic changes
4. **Log breaking changes** in changelog
5. **Test and verify** all flows

---

## 18. TROUBLESHOOTING GUIDE

### **Products Not Showing on Shop Page**

**Symptoms:** Shop page is blank or shows "No products"

**Debug Steps:**
1. Open browser DevTools (F12)
2. Check Console for JavaScript errors
3. Check `.shop-products-grid` selector exists in shop.html
4. Verify PRODUCT_CATALOG has items
5. Check localStorage for admin products
6. Verify image paths are correct

**Solution:**
```javascript
// In console:
// Check products exist
console.log(PRODUCT_CATALOG);

// Check grid element exists
console.log(document.querySelector('.shop-products-grid'));

// Check if renderShopPage was called
console.log('renderShopPage called');
```

### **Images Not Loading**

**Symptoms:** Product images show broken image icon

**Debug Steps:**
1. Right-click image, "Inspect"
2. Check `src` attribute value
3. Manually navigate to that path in address bar
4. Check file exists in assets folder

**Solution:**
- Use `resolveSitePath()` function for all image paths
- Ensure images exist in `assets/products/`
- Check image file extensions (.jpg, .png, etc.)

### **Cart Not Persisting**

**Symptoms:** Cart items disappear after page reload

**Debug Steps:**
1. Add item to cart
2. Open DevTools → Application → localStorage
3. Look for `bindaud_cart` key
4. Reload page, check if key still exists

**Likely Cause:** Privacy mode or localStorage disabled
**Solution:** Graceful fallback or user notification

### **Admin Login Not Working**

**Symptoms:** Wrong password message every time

**Debug Steps:**
1. Check hardcoded credentials: admin / admin123
2. Ensure no extra spaces in password input
3. Check browser localStorage for session data
4. Verify adminStorage.js loaded correctly

**Solution:**
```javascript
// In console:
console.log(localStorage.getItem('bindaud_admin_session'));
// Should show session object after successful login
```

### **Checkout WhatsApp Not Opening**

**Symptoms:** No WhatsApp window opens after submit

**Debug Steps:**
1. Check phone number: 923288582902
2. Verify internet connection (WhatsApp Web needs connection)
3. Check browser popup blocker
4. Test with desktop browser first

**Solution:**
```javascript
// Manually test:
window.open('https://wa.me/923288582902', '_blank');
```

---

## 19. SUPPORT & CONTACT

**For questions about this project:**
1. Read this README completely
2. Check troubleshooting guide
3. Search JavaScript console for errors
4. Examine localStorage data
5. Review existing code patterns

**For feature requests:**
- Check Phase 2/3/4 roadmap
- Consider fit with current architecture
- Propose PR with changes
- Include testing evidence

**For bug reports:**
- Reproduce the issue
- Document exact steps
- Include DevTools console errors
- Specify browser version

---

## 17. BACKEND INTEGRATION GUIDE

### **What's Included**

The BIN DAUD project now includes a complete **Node.js + Express + MongoDB backend** located in the `backend/` directory. This backend powers the storefront with:

- **Product Management API** - Fetch, filter, and manage products from MongoDB
- **User Authentication** - JWT-based auth for customers and admins
- **Order Management** - Create, retrieve, and track orders
- **Payment Processing** - Integration-ready for Stripe/JazzCash
- **File Uploads** - Image uploads via Cloudinary
- **Admin Controls** - Product CRUD, settings, analytics
- **Email Notifications** - Order confirmations and notifications
- **Security Features** - Rate limiting, helmet protection, input validation

### **Quick Start**

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Configure Environment**
   - Copy `.env.example` to `.env`
   - Set `MONGODB_URI=mongodb://127.0.0.1:27017/bindaud` (local) or your MongoDB Atlas URI
   - Update `JWT_SECRET`, `CLOUDINARY_*`, and email settings

3. **Start the Server**
   ```bash
   npm start
   # Server runs on http://localhost:5000
   ```

4. **Test the API**
   ```bash
   curl http://localhost:5000/api/products
   ```

### **Frontend Integration**

The frontend is **already connected** to the backend:

- **`js/api.js`** - New API client module that handles all backend communication
- **`js/cart.js`** - Updated to fetch products from `/api/products` instead of static catalog
- **`js/search.js`** - Updated to search across live product data
- **Fallback Support** - If the backend is unavailable, the frontend automatically falls back to the static `PRODUCT_CATALOG`

### **How It Works**

```javascript
// Frontend loads products from backend
import { getProducts, normalizeProduct } from './api.js';

const loadProductCatalog = async () => {
  try {
    const products = await getProducts({ limit: 50 });
    return products.map(normalizeProduct); // Normalize backend format to frontend format
  } catch (error) {
    // Fall back to static catalog if backend is down
    return PRODUCT_CATALOG;
  }
};
```

### **API Endpoints**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/products` | GET | List all products with pagination/filtering |
| `/api/products/:id` | GET | Get single product details |
| `/api/auth/login` | POST | User/admin login (returns JWT) |
| `/api/orders` | POST | Create new order |
| `/api/orders/:id` | GET | Get order details |
| `/api/users/:id/wishlist` | GET | Get user wishlist |
| `/api/admin/products` | POST | Create product (admin only) |
| `/api/admin/products/:id` | PUT | Update product (admin only) |
| `/api/admin/settings` | GET/PUT | Get/update site settings (admin only) |

See `backend/README.md` for complete API documentation.

### **Database Schema**

MongoDB collections created automatically:
- `products` - Product catalog
- `orders` - Customer orders
- `users` - User accounts and profiles
- `reviews` - Product reviews
- `coupons` - Discount codes
- `settings` - Site configuration
- `wishlist` - User wishlists

### **Deployment**

**Backend Deployment Options:**
- **Vercel** - `npm run build` (uses next.js/express serverless)
- **Railway** - Direct Git push, automatic deploys
- **Heroku** - `git push heroku main`
- **AWS/Azure** - Docker containerization available
- **DigitalOcean** - App Platform with GitHub integration

**Database Deployment:**
- **MongoDB Atlas** - Cloud MongoDB (free tier available)
- **Firebase** - Firestore alternative (requires schema refactor)
- **PostgreSQL** - For SQL-based setup (requires ORM migration)

See `backend/README.md` for detailed deployment instructions.

### **Development Workflow**

1. **Start Backend**
   ```bash
   cd backend && npm start
   ```

2. **Start Frontend** (in another terminal)
   ```bash
   # Serve index.html via local server
   # Option 1: Python
   python -m http.server 8000
   
   # Option 2: Node.js
   npx http-server
   
   # Then visit http://localhost:8000
   ```

3. **Test Products API**
   ```bash
   curl http://localhost:5000/api/products
   ```

### **Common Issues & Troubleshooting**

| Issue | Cause | Solution |
|-------|-------|----------|
| Backend won't start | MongoDB not running | Start MongoDB: `mongod` or use MongoDB Atlas |
| 404 on `/api/products` | Backend not running | Run `npm start` in `backend/` |
| Products not loading | CORS error | Check `CLIENT_URL` in `.env` matches frontend URL |
| Images not displaying | Cloudinary not configured | Set dummy Cloudinary keys in `.env` for dev |
| JWT token expired | Session too old | Login again or extend `JWT_EXPIRES_IN` in `.env` |

---

## 20. VERSION HISTORY

| Date | Version | Changes |
|------|---------|---------|
| 2026-07-19 | 1.0 | Initial MVP launch with cart, checkout, admin |
| 2026-07-19 | 1.1 | Backend integration: Node.js API + MongoDB + product sync |
| TBD | 2.0 | Payment gateway + advanced analytics |

---

**Last Updated:** July 19, 2026  
**Next Review:** After next feature release  
**Document Status:** Complete for production handoff

**End of README**

---

*This document is THE source of truth for BIN DAUD. Bookmark it. Reference it. Update it after every change.*
