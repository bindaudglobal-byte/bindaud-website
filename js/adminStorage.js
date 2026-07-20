import { PRODUCT_CATALOG, formatCurrency } from './helpers.js';

const STORAGE_KEYS = {
  state: 'bindaud_admin_state',
  session: 'bindaud_admin_session'
};

const ensureString = (value, fallback = '') => (value == null ? fallback : String(value));

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
    products: state.products || createDefaultState().products,
    orders: state.orders || [],
    activity: state.activity || createDefaultState().activity
  };
};

export const saveAdminState = (state) => {
  writeStorage(STORAGE_KEYS.state, state);
  return state;
};

export const getAdminSession = () => readStorage(STORAGE_KEYS.session, null);

export const saveAdminSession = (session) => {
  writeStorage(STORAGE_KEYS.session, session);
  return session;
};

export const authenticateAdmin = (username, password, rememberMe = false) => {
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

export const logoutAdmin = () => {
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

export const getProducts = () => getAdminState().products;

export const saveProducts = (products) => {
  const state = getAdminState();
  state.products = products;
  saveAdminState(state);
  return state.products;
};

export const upsertProduct = (productData) => {
  const state = getAdminState();
  const product = {
    ...productData,
    id: productData.id || `BD-${String(state.products.length + 1).padStart(3, '0')}`,
    price: Number(productData.price) || 0,
    oldPrice: Number(productData.oldPrice) || 0,
    featured: Boolean(productData.featured),
    trending: Boolean(productData.trending),
    bestSeller: Boolean(productData.bestSeller),
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

  const existingIndex = state.products.findIndex((item) => item.id === product.id);

  if (existingIndex >= 0) {
    state.products[existingIndex] = product;
  } else {
    state.products.unshift(product);
  }

  state.activity.unshift({
    id: `activity-product-${Date.now()}`,
    type: 'product',
    message: `${product.name} ${existingIndex >= 0 ? 'updated' : 'created'} in the admin catalog.`,
    createdAt: new Date().toISOString()
  });

  saveAdminState(state);
  return product;
};

export const deleteProduct = (productId) => {
  const state = getAdminState();
  const product = state.products.find((item) => item.id === productId);
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

export const getOrders = () => getAdminState().orders;

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
