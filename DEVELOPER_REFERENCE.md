# 🔧 BIN DAUD Developer Quick Reference

## Quick Start

### Run Backend
```bash
cd backend
npm install  # First time only
npm start
# Backend runs on http://127.0.0.1:5000
```

### Run Frontend
```bash
# In project root
npx http-server -p 8000
# Frontend runs on http://127.0.0.1:8000
```

### Test Admin
- URL: `http://127.0.0.1:8000/pages/admin-login.html`
- Username: `admin`
- Password: `Bindaud@2026`

---

## File Quick Links

### New Production Files
| File | Purpose | Lines |
|------|---------|-------|
| [js/productAPI.js](js/productAPI.js) | MongoDB client | 120 |
| [js/themeManager.js](js/themeManager.js) | Dark mode system | 80 |
| [css/dark-mode.css](css/dark-mode.css) | Dark theme | 300 |
| [js/adminDashboardProduction.js](js/adminDashboardProduction.js) | Admin init | 100 |

### Documentation
| File | Purpose |
|------|---------|
| [PRODUCTION_SETUP.md](PRODUCTION_SETUP.md) | Deployment guide |
| [DARK_MODE_ROLLOUT.md](DARK_MODE_ROLLOUT.md) | Dark mode docs |
| [IMPLEMENTATION_COMPLETE.md](IMPLEMENTATION_COMPLETE.md) | Full summary |
| [README.md](README.md) | Project overview |

---

## API Endpoints Reference

### Products (Public)
```javascript
GET  /api/products               // All products
GET  /api/products/:id           // Single product
GET  /api/products?search=query  // Search
```

### Products (Admin Only)
```javascript
POST   /api/products          // Create (requires auth token)
PUT    /api/products/:id      // Update (requires auth token)
DELETE /api/products/:id      // Delete (requires auth token)
```

### Auth
```javascript
POST /api/admin/login          // Get JWT token
POST /api/admin/register       // Create admin account
```

---

## Code Snippets

### Get All Products
```javascript
import productAPI from './js/productAPI.js';

const products = await productAPI.getAllProducts();
products.forEach(p => {
  console.log(`${p.name}: PKR ${p.price}`);
});
```

### Create Product
```javascript
const token = localStorage.getItem('bindaud-admin-token');
const newProduct = await productAPI.createProduct({
  name: 'Product Name',
  price: 999,
  description: 'Product description',
  category: 'Essentials',
  stock: 50
}, token);
```

### Toggle Dark Mode
```javascript
import { themeManager } from './js/themeManager.js';

// Toggle
themeManager.toggle();

// Set theme
themeManager.setTheme('dark');  // or 'light'

// Get current
const theme = themeManager.getCurrentTheme();
```

### Listen for Theme Changes
```javascript
document.addEventListener('theme-changed', (e) => {
  console.log('New theme:', e.detail.theme);
});
```

---

## Environment Variables

### Backend `.env`
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/bindaud
JWT_SECRET=your-secret-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

---

## MongoDB Database

### Connect Locally
```bash
# Start MongoDB (if installed)
mongod

# Or use MongoDB Atlas cloud
# Update MONGODB_URI in .env
```

### Database Name
```javascript
bindaud  // Default database
```

### Collections
- `products` - Product catalog
- `orders` - Customer orders
- `categories` - Product categories
- `admins` - Admin users

---

## Cloudinary Setup

### Current Credentials (Test Account)
```
Cloud Name: dpu9gj7vl
API Key: 843844881976686
API Secret: GYGDYbTMvQvvVWZpWzaS2XZJWRo
```

### Image Upload Flow
1. Admin selects image in form
2. Frontend sends to backend `/api/products` (POST)
3. Backend uploads to Cloudinary
4. Cloudinary returns secure_url
5. URL stored in MongoDB
6. Frontend displays image from Cloudinary CDN

---

## Dark Mode

### Enable Dark Mode on New Page
1. Add CSS link: `<link rel="stylesheet" href="../css/dark-mode.css">`
2. Add init script in `<head>`:
```html
<script>
  const stored = localStorage.getItem('bindaud-theme-preference');
  const system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const theme = stored || system || 'light';
  if (theme === 'dark') document.documentElement.classList.add('dark-mode');
</script>
```
3. Add toggle button: `<button id="toggle-theme-btn" class="nav-link">🌙 Dark Mode</button>`

### CSS Variables
```css
:root {
  --color-bg-primary: #ffffff;
  --color-text-primary: #000000;
}

html.dark-mode {
  --color-bg-primary: #0f0f0f;
  --color-text-primary: #f5f5f5;
}
```

---

## Debugging

### Check Backend Connection
```javascript
// In browser console
fetch('http://127.0.0.1:5000/api/products')
  .then(r => r.json())
  .then(d => console.log(d));
```

### Check Dark Mode
```javascript
// Get current theme
localStorage.getItem('bindaud-theme-preference');

// Clear saved theme
localStorage.removeItem('bindaud-theme-preference');

// Check HTML class
document.documentElement.classList;
```

### Check Admin Token
```javascript
// Get stored token
localStorage.getItem('bindaud-admin-token');

// Remove token (logout)
localStorage.removeItem('bindaud-admin-token');
```

### View Database
```bash
# Connect to MongoDB
mongo mongodb://127.0.0.1:27017/bindaud

# List collections
show collections

# View products
db.products.find().pretty()

# Count products
db.products.countDocuments()
```

---

## Testing Commands

### Test API
```bash
# Get all products
curl http://127.0.0.1:5000/api/products

# Get single product
curl http://127.0.0.1:5000/api/products/[ID]

# Create product (requires token)
curl -X POST http://127.0.0.1:5000/api/products \
  -H "Authorization: Bearer [TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","price":999}'
```

### Test Dark Mode
```javascript
// Toggle via console
document.documentElement.classList.toggle('dark-mode');

// Set theme via console
localStorage.setItem('bindaud-theme-preference', 'dark');
location.reload();
```

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Products not showing | Check backend is running on port 5000 |
| Images not uploading | Verify Cloudinary credentials in .env |
| Dark mode not persisting | Clear localStorage & cache |
| 404 on API calls | Check API endpoint URLs match backend |
| CORS errors | Verify CORS configured in backend/app.js |

---

## Performance Tips

### Optimize Images
```javascript
// Use Cloudinary transformations
const optimizedUrl = `${cloudinaryUrl}?w=400&q=80`;
```

### Cache Products
```javascript
// Cache in localStorage (if needed)
const cached = JSON.parse(localStorage.getItem('products'));
if (cached) return cached;
```

### Lazy Load
```javascript
// Load products when needed
const products = await productAPI.getAllProducts();
// Don't load on page init unless necessary
```

---

## Deployment Checklist

- [ ] MongoDB running
- [ ] Backend environment variables set
- [ ] Cloudinary account active
- [ ] Backend compiled/running
- [ ] Frontend files in correct location
- [ ] API endpoints accessible
- [ ] Dark mode works on all pages
- [ ] Products persist after refresh
- [ ] Images display correctly
- [ ] Admin can create products
- [ ] No console errors
- [ ] Performance acceptable

---

## Resources

- **Backend**: `backend/README.md` (if exists)
- **Frontend**: `README.md`
- **Docs**: `PRODUCTION_SETUP.md`
- **API**: `backend/routes/productRoutes.js`
- **Models**: `backend/models/Product.js`

---

## Key Technologies

| Technology | Purpose |
|-----------|---------|
| **Node.js/Express** | Backend server |
| **MongoDB** | Database |
| **Cloudinary** | Image hosting |
| **JWT** | Authentication |
| **localStorage** | Theme persistence |
| **CSS Variables** | Dark mode theming |
| **Fetch API** | HTTP requests |

---

## Contact & Support

For issues or questions:
1. Check this guide first
2. Review `PRODUCTION_SETUP.md`
3. Check browser console for errors
4. Review backend logs
5. Check MongoDB connection

---

**Version:** 2.0.0 Production Ready
**Last Updated:** January 2026

Happy coding! 🚀
