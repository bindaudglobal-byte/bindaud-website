const CART_STORAGE_KEY = "binDaudCart";
const COUPON_STORAGE_KEY = "binDaudCoupon";
const TAX_SETTINGS_KEY = "bindaud_tax_settings";
const TAX_ENABLED_KEY = "bindaud_tax_enabled";

const getWindow = () => (typeof window === "undefined" ? null : window);

const dispatchCartUpdated = () => {
  const win = getWindow();
  if (!win) return;
  win.dispatchEvent(new CustomEvent("cart:updated", { detail: getCart() }));
};

const getCartState = () => {
  const win = getWindow();
  if (!win) return [];
  if (!Array.isArray(win.__BINDAUD_CART)) {
    win.__BINDAUD_CART = [];
  }
  return win.__BINDAUD_CART;
};

const setCartState = (cart) => {
  const win = getWindow();
  if (!win) return [];
  win.__BINDAUD_CART = Array.isArray(cart) ? cart : [];
  return win.__BINDAUD_CART;
};

const getApiBase = () => {
  const win = getWindow();
  if (win?.BINDAUD_CONFIG?.api?.adminBase) {
    return win.BINDAUD_CONFIG.api.adminBase;
  }
  return "/api/admin";
};

const getAdminSettings = () => {
  const win = getWindow();
  if (!win) return null;

  const directSettings = win.__BINDAUD_SITE_SETTINGS;
  if (directSettings && typeof directSettings === "object") {
    return directSettings;
  }

  const state =
    win.__BINDAUD_STORAGE__?.bindaud_admin_state || win.__BINDAUD_ADMIN_STATE;
  if (state?.settings && typeof state.settings === "object") {
    return state.settings;
  }

  try {
    const persistedState =
      typeof localStorage !== "undefined"
        ? localStorage.getItem("bindaud_admin_state")
        : null;
    if (persistedState) {
      const parsedState = JSON.parse(persistedState);
      if (parsedState?.settings && typeof parsedState.settings === "object") {
        return parsedState.settings;
      }
    }
  } catch (error) {
    console.warn("Unable to read admin settings from storage:", error.message);
  }

  return null;
};

const persistCartToServer = async (cart) => {
  const win = getWindow();
  if (!win) return;

  try {
    await fetch(`${getApiBase()}/cart`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cart }),
    });
  } catch (error) {
    console.warn("Cart sync to backend failed:", error.message);
  }
};

export const hydrateCartFromServer = async () => {
  const win = getWindow();
  if (!win) return getCart();

  try {
    const response = await fetch(`${getApiBase()}/cart`, {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });

    if (response.ok) {
      const result = await response.json();
      const cart = Array.isArray(result?.data?.cart) ? result.data.cart : [];
      setCartState(cart);
      if (result?.data?.sessionId) {
        win.__BINDAUD_CART_SESSION_ID = result.data.sessionId;
      }
      dispatchCartUpdated();
    }
  } catch (error) {
    console.warn("Cart hydration from backend failed:", error.message);
  }

  return getCart();
};

export const getCart = () => getCartState();

export const saveCart = (cart) => {
  setCartState(cart);
  dispatchCartUpdated();
  persistCartToServer(cart);
  return cart;
};

export const getCartCount = (cart = getCart()) =>
  cart.reduce((total, item) => total + Number(item.quantity || 0), 0);

export const buildCartItemId = (product) =>
  `${product.id}-${product.size}-${product.color}`;

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
      collection: product.collection,
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
  const validCoupons = ["WELCOME10", "BINDAUD5", "FREESHIP"];
  const win = getWindow();

  if (!validCoupons.includes(normalizedCoupon)) {
    if (win) {
      delete win[COUPON_STORAGE_KEY];
    }
    return {
      valid: false,
      message:
        "Invalid coupon code. Please try WELCOME10, BINDAUD5 or FREESHIP.",
    };
  }

  if (win) {
    win[COUPON_STORAGE_KEY] = normalizedCoupon;
  }
  return {
    valid: true,
    message: `Coupon ${normalizedCoupon} applied successfully.`,
  };
};

export const getAppliedCoupon = () => {
  const win = getWindow();
  return win?.[COUPON_STORAGE_KEY] || null;
};

export const clearCoupon = () => {
  const win = getWindow();
  if (win) {
    delete win[COUPON_STORAGE_KEY];
  }
};

// Get tax rate from admin settings (default 5%)
const getTaxEnabled = () => {
  const adminSettings = getAdminSettings() || {};
  if (Object.prototype.hasOwnProperty.call(adminSettings, "taxEnabled")) {
    return Boolean(adminSettings.taxEnabled);
  }

  const win = getWindow();
  if (!win) return true;

  if (Object.prototype.hasOwnProperty.call(win, TAX_ENABLED_KEY)) {
    return Boolean(win[TAX_ENABLED_KEY]);
  }

  return true;
};

const getTaxRate = () => {
  const adminSettings = getAdminSettings() || {};
  if (Object.prototype.hasOwnProperty.call(adminSettings, "tax")) {
    const parsedTax = Number(adminSettings.tax);
    if (!Number.isNaN(parsedTax)) {
      return parsedTax;
    }
  }

  const win = getWindow();
  if (!win) return 5;

  if (Object.prototype.hasOwnProperty.call(win, TAX_SETTINGS_KEY)) {
    const parsedTax = Number(win[TAX_SETTINGS_KEY]);
    if (!Number.isNaN(parsedTax)) {
      return parsedTax;
    }
  }

  return 5;
};

export const setTaxRate = (rate) => {
  const normalizedRate = Number(rate);
  const win = getWindow();
  if (!win) return;

  win[TAX_SETTINGS_KEY] = Number.isNaN(normalizedRate) ? 5 : normalizedRate;
  win.__BINDAUD_SITE_SETTINGS = {
    ...(win.__BINDAUD_SITE_SETTINGS || {}),
    tax: win[TAX_SETTINGS_KEY],
  };
};

export const calculateCartTotals = (cart = getCart()) => {
  const subtotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );
  const coupon = getAppliedCoupon();
  const taxEnabled = getTaxEnabled();
  const taxRateValue = getTaxRate();
  const taxRate = taxRateValue / 100;

  let discountAmount = 0;
  let shipping = subtotal > 0 ? (subtotal >= 10000 ? 0 : 300) : 0;

  if (coupon === "WELCOME10") {
    discountAmount = subtotal * 0.1;
  }

  if (coupon === "BINDAUD5") {
    discountAmount = subtotal * 0.05;
  }

  if (coupon === "FREESHIP") {
    shipping = 0;
  }

  const taxableBase = Math.max(0, subtotal - discountAmount + shipping);
  const tax =
    taxEnabled && taxRateValue > 0
      ? (subtotal - discountAmount + shipping) * taxRate
      : 0;
  const grandTotal = Math.max(0, taxableBase + tax);

  return {
    subtotal,
    discountAmount,
    shipping,
    tax,
    grandTotal,
    taxRate: getTaxRate(),
    taxEnabled,
    coupon,
  };
};
