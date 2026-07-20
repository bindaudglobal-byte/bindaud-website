import { PRODUCT_CATALOG, formatCurrency } from './helpers.js';
import {
  isSupabaseEnabled,
  getSupabaseProducts,
  upsertSupabaseProduct,
  deleteSupabaseProduct,
  getSupabaseOrders,
  createSupabaseOrder
} from './supabaseStorage.js';

const STORAGE_KEYS = {
  state: 'bindaud_admin_state',
  session: 'bindaud_admin_session',
  token: 'bindaud_admin_token'
};

const API_BASE = (() => {
  if (typeof window !== 'undefined' && window.BINDAUD_CONFIG?.api?.adminBase) {
    return window.BINDAUD_CONFIG.api.adminBase;
  }
  return '/api/admin';
})();

const ensureString = (value, fallback = '') => (value == null ? fallback : String(value));

const createProductId = () => `BD-${Date.now().toString().slice(-8)}`;
const generateProductSlug = (value) => {
  const text = ensureString(value).trim().toLowerCase();
  return text
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

const generateProductBarcode = () => `BD${Math.floor(100000000 + Math.random() * 900000000)}`;

const readStorage = (key, fallback) => {
  if (typeof window === 'undefined') return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
};

const writeStorage = (key, value) => {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(key, JSON.stringify(value));
};

const syncCatalogSnapshot = (state) => {
  if (typeof window === 'undefined') return;

  const catalog = Array.isArray(state?.products) ? state.products : [];
  window.__BINDAUD_PRODUCTS = catalog;

  try {
    window.dispatchEvent(new CustomEvent('catalog:updated', { detail: catalog }));
  } catch (error) {
    console.warn('Catalog sync event failed:', error.message);
  }
};

const getToken = () => readStorage(STORAGE_KEYS.token, '');

const setToken = (token) => {
  writeStorage(STORAGE_KEYS.token, token);
};

const clearToken = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEYS.token);
};

const createInitialProducts = () => PRODUCT_CATALOG.map((product, index) => ({
  ...product,
  image: product.image,
  featured: index === 0 || product.badge === 'Best Seller',
  trending: product.badge === 'New' || product.collection === 'jackets',
  bestSeller: product.badge === 'Best Seller',
  views: 12 + index * 4,
  sales: 3 + index
}));

const createDefaultState = () => ({
  admin: {
    username: 'admin',
    password: 'Bindaud@2026'
  },
  session: {
    loggedIn: false,
    rememberMe: false,
    lastLogin: null,
    username: ''
  },
  products: createInitialProducts(),
  orders: [],
  coupons: [
    {
      id: 'coupon-welcome',
      code: 'WELCOME10',
      discount: 10,
      expiry: '2026-12-31',
      usageLimit: 100,
      used: 12
    },
    {
      id: 'coupon-bindaud',
      code: 'BINDAUD5',
      discount: 5,
      expiry: '2026-10-31',
      usageLimit: 75,
      used: 24
    }
  ],
  delivery: {
    islamabad: 250,
    punjab: 300,
    kpk: 400,
    sindh: 500,
    balochistan: 700,
    freeShippingLimit: 8000,
    expressShipping: true
  },
  settings: {
    businessName: 'BIN DAUD',
    whatsappNumber: '923288582902',
    facebook: 'https://www.facebook.com/profile.php?id=61591782530716',
    instagram: 'https://www.instagram.com/bindaudglobal/',
    googleBusiness: 'BIN DAUD Luxury Streetwear',
    email: 'hello@bindaud.com',
    currency: 'PKR',
    tax: 5,
    shipping: 'Free delivery on orders above PKR 8,000.'
  },
  activity: [
    {
      id: 'activity-seed',
      type: 'system',
      message: 'Admin dashboard initialized with the current BIN DAUD catalog.',
      createdAt: new Date().toISOString()
    }
  ]
});

const requestAdminApi = async (path, options = {}) => {
  if (typeof window === 'undefined') {
    throw new Error('Admin API is only available in the browser.');
  }

  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Admin API request failed');
  }

  return data;
};

export const getAdminState = () => {
  const state = readStorage(STORAGE_KEYS.state, null);

  if (!state) {
    const defaultState = createDefaultState();
    writeStorage(STORAGE_KEYS.state, defaultState);
    return defaultState;
  }

  return {
    ...createDefaultState(),
    ...state,
    admin: {
      ...createDefaultState().admin,
      ...(state.admin || {})
    },
    delivery: {
      ...createDefaultState().delivery,
      ...(state.delivery || {})
    },
    settings: {
      ...createDefaultState().settings,
      ...(state.settings || {})
    },
    coupons: state.coupons || createDefaultState().coupons,
    products: state.products || createInitialProducts(),
    orders: state.orders || [],
    activity: state.activity || createDefaultState().activity
  };
};

export const saveAdminState = (state) => {
  writeStorage(STORAGE_KEYS.state, state);
  syncCatalogSnapshot(state);
  return state;
};

export const getAdminSession = () => readStorage(STORAGE_KEYS.session, null);

export const saveAdminSession = (session) => {
  writeStorage(STORAGE_KEYS.session, session);
  return session;
};

const localAuthenticateAdmin = (username, password, rememberMe = false) => {
  const state = getAdminState();
  const normalizedUsername = ensureString(username).trim().toLowerCase();
  const normalizedPassword = ensureString(password).trim();

  const isValid = normalizedUsername === ensureString(state.admin.username).trim().toLowerCase() && normalizedPassword === ensureString(state.admin.password).trim();

  if (!isValid) {
    return false;
  }

  const session = {
    loggedIn: true,
    rememberMe,
    lastLogin: new Date().toISOString(),
    username: state.admin.username
  };

  state.session = session;
  saveAdminState(state);
  saveAdminSession(session);

  return true;
};

export const authenticateAdmin = async (username, password, rememberMe = false) => {
  const normalizedUsername = ensureString(username).trim();
  const normalizedPassword = ensureString(password).trim();

  try {
    const result = await requestAdminApi('/login', {
      method: 'POST',
      body: JSON.stringify({ username: normalizedUsername, password: normalizedPassword })
    });

    if (result.success && result.token) {
      setToken(result.token);
      const session = {
        loggedIn: true,
        rememberMe,
        lastLogin: new Date().toISOString(),
        username: normalizedUsername
      };
      saveAdminSession(session);
      return true;
    }
  } catch (error) {
    console.warn('Admin API login failed, falling back to local auth:', error.message);
  }

  return localAuthenticateAdmin(normalizedUsername, normalizedPassword, rememberMe);
};

export const logoutAdmin = () => {
  clearToken();
  const state = getAdminState();
  state.session = {
    loggedIn: false,
    rememberMe: false,
    lastLogin: null,
    username: ''
  };
  saveAdminState(state);
  saveAdminSession(state.session);
};

export const getProducts = async () => {
  if (isSupabaseEnabled()) {
    try {
      return await getSupabaseProducts();
    } catch (error) {
      console.warn('Supabase product load failed. Using local storage fallback.', error.message);
    }
  }

  try {
    const result = await requestAdminApi('/products');
    if (Array.isArray(result.products)) {
      return result.products;
    }
  } catch (error) {
    console.warn('Failed to load admin products from API. Using local storage fallback.', error.message);
  }

  return getAdminState().products;
};

export const saveProducts = (products) => {
  const state = getAdminState();
  state.products = products;
  saveAdminState(state);
  return state.products;
};

export const upsertProduct = async (productData) => {
  const payload = {
    ...productData,
    id: ensureString(productData.id, ''),
    price: Number(productData.price) || 0,
    oldPrice: Number(productData.oldPrice) || 0,
    featured: Boolean(productData.featured),
    trending: Boolean(productData.trending),
    bestSeller: Boolean(productData.bestSeller),
    newArrival: Boolean(productData.newArrival),
    sale: Boolean(productData.sale),
    visibility: ensureString(productData.visibility, 'Public'),
    condition: ensureString(productData.condition, 'New'),
    availability: ensureString(productData.availability, 'Available'),
    seoTitle: ensureString(productData.seoTitle, ''),
    metaDescription: ensureString(productData.metaDescription, ''),
    ogImage: ensureString(productData.ogImage, ''),
    slug: ensureString(productData.slug, ''),
    barcode: ensureString(productData.barcode, ''),
    images: Array.isArray(productData.images) ? productData.images : [],
    variants: Array.isArray(productData.variants) ? productData.variants : [],
    views: Number(productData.views) || 0,
    sales: Number(productData.sales) || 0,
    stock: ensureString(productData.stock, 'In Stock'),
    collection: ensureString(productData.collection, 'tees'),
    category: ensureString(productData.category, 'Essentials'),
    description: ensureString(productData.description, 'Premium BIN DAUD piece.'),
    code: ensureString(productData.code, 'BD-NEW'),
    name: ensureString(productData.name, 'New Product'),
    image: ensureString(productData.image, 'assets/products/product1.jpg')
  };

  const localState = getAdminState();
  const existingIndex = localState.products.findIndex((item) => item.id === payload.id);
  const isUpdate = Boolean(payload.id && existingIndex >= 0);

  if (isSupabaseEnabled()) {
    try {
      const saved = await upsertSupabaseProduct(payload);
      if (isUpdate) {
        localState.products[existingIndex] = saved;
      } else {
        localState.products.unshift(saved);
      }

      localState.activity.unshift({
        id: `activity-product-${Date.now()}`,
        type: 'product',
        message: `${saved.name} ${isUpdate ? 'updated' : 'created'} in the admin catalog.`,
        createdAt: new Date().toISOString()
      });

      saveAdminState(localState);
      return saved;
    } catch (error) {
      console.warn('Supabase save failed. Trying admin API or local fallback.', error.message);
    }
  }

  const endpoint = isUpdate ? `/products/${payload.id}` : '/products';
  const method = isUpdate ? 'PUT' : 'POST';

  try {
    const result = await requestAdminApi(endpoint, {
      method,
      body: JSON.stringify(payload)
    });

    const saved = result.product || payload;
    if (isUpdate) {
      localState.products[existingIndex] = saved;
    } else {
      localState.products.unshift(saved);
    }

    localState.activity.unshift({
      id: `activity-product-${Date.now()}`,
      type: 'product',
      message: `${saved.name} ${isUpdate ? 'updated' : 'created'} in the admin catalog.`,
      createdAt: new Date().toISOString()
    });

    saveAdminState(localState);
    return saved;
  } catch (error) {
    console.warn('Admin API save failed. Using local update fallback.', error.message);
  }

  const localProduct = {
    ...payload,
    id: payload.id || createProductId(),
    slug: payload.slug || generateProductSlug(payload.name || payload.code || localState.products.length + 1),
    barcode: payload.barcode || generateProductBarcode(),
    images: payload.images || [payload.image],
    image: payload.image || (Array.isArray(payload.images) && payload.images[0]) || 'assets/products/product1.jpg'
  };

  if (existingIndex >= 0) {
    localState.products[existingIndex] = localProduct;
  } else {
    localState.products.unshift(localProduct);
  }

  localState.activity.unshift({
    id: `activity-product-${Date.now()}`,
    type: 'product',
    message: `${localProduct.name} ${existingIndex >= 0 ? 'updated' : 'created'} in the admin catalog.`,
    createdAt: new Date().toISOString()
  });

  saveAdminState(localState);
  return localProduct;
};

export const deleteProduct = async (productId) => {
  const state = getAdminState();
  const product = state.products.find((item) => item.id === productId);

  if (isSupabaseEnabled()) {
    try {
      await deleteSupabaseProduct(productId);
    } catch (error) {
      console.warn('Supabase delete failed. Trying admin API/local fallback.', error.message);
    }
  } else {
    try {
      await requestAdminApi(`/products/${productId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.warn('Admin API delete failed. Using local fallback.', error.message);
    }
  }

  state.products = state.products.filter((item) => item.id !== productId);
  state.activity.unshift({
    id: `activity-delete-${Date.now()}`,
    type: 'product',
    message: `${product?.name || 'Product'} removed from the admin catalog.`,
    createdAt: new Date().toISOString()
  });

  saveAdminState(state);
  return state.products;
};

export const uploadProductImage = async (file, filename) => {
  try {
    const result = await requestAdminApi('/upload', {
      method: 'POST',
      body: JSON.stringify({ file, filename })
    });

    return result.file?.path || filename;
  } catch (error) {
    console.warn('Image upload failed. Using local file data.', error.message);
    return filename;
  }
};

export const getOrders = () => getAdminState().orders;

export const getOrdersAsync = async () => {
  if (isSupabaseEnabled()) {
    try {
      return await getSupabaseOrders();
    } catch (error) {
      console.warn('Supabase order load failed. Using local storage fallback.', error.message);
    }
  }

  // Try to fetch from backend API
  try {
    const response = await fetch('/api/admin/orders');
    if (response.ok) {
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        return result.data;
      }
    }
  } catch (error) {
    console.warn('Backend order fetch failed. Using local storage fallback.', error.message);
  }

  return getAdminState().orders;
};

export const createOrder = (orderData) => {
  const state = getAdminState();
  const timestamp = new Date();
  const order = {
    id: `ORD-${timestamp.getTime()}`,
    orderNumber: `ORD-${timestamp.getTime().toString().slice(-6)}`,
    customerName: ensureString(orderData.customerName, 'Guest Customer'),
    phone: ensureString(orderData.phone, '—'),
    address: ensureString(orderData.address, '—'),
    city: ensureString(orderData.city, '—'),
    products: orderData.products || [],
    total: Number(orderData.total) || 0,
    paymentMethod: ensureString(orderData.paymentMethod, 'Cash on Delivery'),
    status: 'Pending',
    createdAt: timestamp.toISOString(),
    updatedAt: timestamp.toISOString()
  };

  state.orders.unshift(order);
  state.activity.unshift({
    id: `activity-order-${Date.now()}`,
    type: 'order',
    message: `Order ${order.orderNumber} received from ${order.customerName}.`,
    createdAt: timestamp.toISOString()
  });

  saveAdminState(state);
  return order;
};

export const createOrderAsync = async (orderData) => {
  const order = createOrder(orderData);

  if (isSupabaseEnabled()) {
    try {
      return await createSupabaseOrder(order);
    } catch (error) {
      console.warn('Supabase order save failed. Using local storage fallback.', error.message);
    }
  }

  return order;
};

export const updateOrderStatus = (orderId, status) => {
  const state = getAdminState();
  const order = state.orders.find((item) => item.id === orderId);

  if (!order) return null;

  order.status = status;
  order.updatedAt = new Date().toISOString();
  state.activity.unshift({
    id: `activity-status-${Date.now()}`,
    type: 'order',
    message: `Order ${order.orderNumber} marked as ${status}.`,
    createdAt: order.updatedAt
  });

  saveAdminState(state);

  // Try to sync to backend API
  fetch(`/api/admin/orders/${orderId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, orderStatus: status })
  }).catch((error) => {
    console.warn('Failed to sync order status to backend:', error.message);
  });

  return order;
};

export const getCoupons = () => getAdminState().coupons;

export const saveCoupons = (coupons) => {
  const state = getAdminState();
  state.coupons = coupons;
  saveAdminState(state);
  return state.coupons;
};

export const createCoupon = (couponData) => {
  const state = getAdminState();
  const coupon = {
    id: `coupon-${Date.now()}`,
    code: ensureString(couponData.code, 'NEWCOUPON').toUpperCase(),
    discount: Number(couponData.discount) || 0,
    expiry: ensureString(couponData.expiry, ''),
    usageLimit: Number(couponData.usageLimit) || 0,
    used: 0
  };

  state.coupons.unshift(coupon);
  state.activity.unshift({
    id: `activity-coupon-${Date.now()}`,
    type: 'coupon',
    message: `Coupon ${coupon.code} created for the storefront.`,
    createdAt: new Date().toISOString()
  });

  saveAdminState(state);
  return coupon;
};

export const deleteCoupon = (couponId) => {
  const state = getAdminState();
  const coupon = state.coupons.find((item) => item.id === couponId);
  state.coupons = state.coupons.filter((item) => item.id !== couponId);

  state.activity.unshift({
    id: `activity-delete-coupon-${Date.now()}`,
    type: 'coupon',
    message: `Coupon ${coupon?.code || 'coupon'} removed.`,
    createdAt: new Date().toISOString()
  });

  saveAdminState(state);
  return state.coupons;
};

export const getDeliverySettings = () => getAdminState().delivery;

export const saveDeliverySettings = (settings) => {
  const state = getAdminState();
  state.delivery = {
    ...state.delivery,
    ...settings,
    expressShipping: Boolean(settings.expressShipping)
  };
  saveAdminState(state);
  return state.delivery;
};

export const getWebsiteSettings = () => getAdminState().settings;

export const saveWebsiteSettings = (settings) => {
  const state = getAdminState();
  state.settings = {
    ...state.settings,
    ...settings,
    tax: Number(settings.tax) || 0
  };
  saveAdminState(state);
  return state.settings;
};

export const recordProductView = (productId) => {
  const state = getAdminState();
  const product = state.products.find((item) => item.id === productId);

  if (!product) return null;

  product.views = Number(product.views || 0) + 1;
  state.activity.unshift({
    id: `activity-view-${Date.now()}`,
    type: 'analytics',
    message: `${product.name} was viewed from the storefront.`,
    createdAt: new Date().toISOString()
  });

  saveAdminState(state);
  return product;
};

export const getActivityFeed = () => getAdminState().activity.slice(0, 8);

export const getAnalytics = () => {
  const state = getAdminState();
  const products = [...state.products].sort((a, b) => (b.sales || 0) - (a.sales || 0));
  const topSelling = products.slice(0, 4);
  const mostViewed = [...products].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 4);
  const ordersThisMonth = state.orders.filter((order) => {
    const createdAt = new Date(order.createdAt);
    const now = new Date();
    return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
  }).length;

  const revenue = state.orders.reduce((acc, order) => acc + (Number(order.total) || 0), 0);

  return {
    topSelling,
    mostViewed,
    ordersThisMonth,
    revenue,
    recentActivity: state.activity.slice(0, 8)
  };
};

export const formatAdminCurrency = (value) => formatCurrency(value);
