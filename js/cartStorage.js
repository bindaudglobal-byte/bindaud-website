const CART_STORAGE_KEY = 'binDaudCart';
const COUPON_STORAGE_KEY = 'binDaudCoupon';

const dispatchCartUpdated = () => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('cart:updated', { detail: getCart() }));
};

const readStorage = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch (error) {
    return null;
  }
};

const writeStorage = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const getCart = () => readStorage(CART_STORAGE_KEY) || [];

export const saveCart = (cart) => {
  writeStorage(CART_STORAGE_KEY, cart);
  dispatchCartUpdated();
  return cart;
};

export const getCartCount = (cart = getCart()) => cart.reduce((total, item) => total + Number(item.quantity || 0), 0);

export const buildCartItemId = (product) => `${product.id}-${product.size}-${product.color}`;

export const addToCart = (product) => {
  const cart = getCart();
  const cartItemId = buildCartItemId(product);
  const existingItem = cart.find((item) => item.cartItemId === cartItemId);

  if (existingItem) {
    existingItem.quantity += Number(product.quantity || 1);
    existingItem.quantity = Math.min(existingItem.quantity, 20);
  } else {
    cart.push({
      cartItemId,
      id: product.id,
      name: product.name,
      image: product.image,
      price: Number(product.price),
      oldPrice: Number(product.oldPrice || product.price),
      size: product.size,
      color: product.color,
      quantity: Number(product.quantity || 1),
      code: product.code,
      rating: product.rating,
      reviews: product.reviews,
      stock: product.stock,
      collection: product.collection
    });
  }

  saveCart(cart);
  return cart;
};

export const updateCartQuantity = (cartItemId, delta) => {
  const cart = getCart();
  const item = cart.find((entry) => entry.cartItemId === cartItemId);

  if (!item) return cart;

  item.quantity = Math.min(20, Math.max(1, item.quantity + delta));
  saveCart(cart);
  return cart;
};

export const removeCartItem = (cartItemId) => {
  const cart = getCart().filter((item) => item.cartItemId !== cartItemId);
  saveCart(cart);
  return cart;
};

export const setCoupon = (couponCode) => {
  const normalizedCoupon = couponCode.trim().toUpperCase();
  const validCoupons = ['WELCOME10', 'BINDAUD5', 'FREESHIP'];

  if (!validCoupons.includes(normalizedCoupon)) {
    localStorage.removeItem(COUPON_STORAGE_KEY);
    return { valid: false, message: 'Invalid coupon code. Please try WELCOME10, BINDAUD5 or FREESHIP.' };
  }

  localStorage.setItem(COUPON_STORAGE_KEY, normalizedCoupon);
  return { valid: true, message: `Coupon ${normalizedCoupon} applied successfully.` };
};

export const getAppliedCoupon = () => localStorage.getItem(COUPON_STORAGE_KEY);

export const clearCoupon = () => {
  localStorage.removeItem(COUPON_STORAGE_KEY);
};

// Get tax rate from admin settings (default 5%)
const getTaxRate = () => {
  try {
    const adminState = JSON.parse(localStorage.getItem('bindaud_admin_state') || '{}');
    const adminSettings = adminState.settings || {};

    if (Object.prototype.hasOwnProperty.call(adminSettings, 'tax')) {
      const parsedTax = Number(adminSettings.tax);
      if (!Number.isNaN(parsedTax)) {
        return parsedTax;
      }
    }

    if (adminSettings.taxEnabled === false) {
      return 0;
    }

    const settings = JSON.parse(localStorage.getItem('bindaud_tax_settings') || '{}');
    if (Object.prototype.hasOwnProperty.call(settings, 'taxRate')) {
      const parsedTaxRate = Number(settings.taxRate);
      if (!Number.isNaN(parsedTaxRate)) {
        return parsedTaxRate;
      }
    }

    return 5;
  } catch {
    return 5;
  }
};

export const setTaxRate = (rate) => {
  const normalizedRate = Number(rate);
  const settings = JSON.parse(localStorage.getItem('bindaud_tax_settings') || '{}');
  settings.taxRate = Number.isNaN(normalizedRate) ? 5 : normalizedRate;
  localStorage.setItem('bindaud_tax_settings', JSON.stringify(settings));

  try {
    const adminState = JSON.parse(localStorage.getItem('bindaud_admin_state') || '{}');
    if (adminState?.settings) {
      adminState.settings.tax = settings.taxRate;
      localStorage.setItem('bindaud_admin_state', JSON.stringify(adminState));
    }
  } catch {
    // Ignore storage write issues and continue with the fallback.
  }
};

export const calculateCartTotals = (cart = getCart()) => {
  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const coupon = getAppliedCoupon();
  const taxRateValue = getTaxRate();
  const taxRate = taxRateValue / 100;

  let discountAmount = 0;
  let shipping = subtotal > 0 ? (subtotal >= 10000 ? 0 : 300) : 0;

  if (coupon === 'WELCOME10') {
    discountAmount = subtotal * 0.1;
  }

  if (coupon === 'BINDAUD5') {
    discountAmount = subtotal * 0.05;
  }

  if (coupon === 'FREESHIP') {
    shipping = 0;
  }

  const taxableBase = Math.max(0, subtotal - discountAmount + shipping);
  const tax = taxRateValue > 0 ? taxableBase * taxRate : 0;
  const grandTotal = Math.max(0, taxableBase + tax);

  return {
    subtotal,
    discountAmount,
    shipping,
    tax,
    grandTotal,
    taxRate: getTaxRate(),
    coupon
  };
};
