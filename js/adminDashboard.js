import {
  authenticateAdmin,
  createCoupon,
  deleteCoupon,
  deleteProduct,
  getAdminSession,
  getAnalytics,
  getCoupons,
  getDeliverySettings,
  getOrders,
  getProducts,
  getWebsiteSettings,
  logoutAdmin,
  saveDeliverySettings,
  saveWebsiteSettings,
  upsertProduct,
  updateOrderStatus,
  formatAdminCurrency
} from './adminStorage.js';
import { resolveSitePath } from './helpers.js';
import { debounce, requestFrame } from './performance.js';

const select = (selector, parent = document) => parent.querySelector(selector);
const selectAll = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));

const renderSummary = () => {
  const orders = getOrders();
  const products = getProducts();
  const summaryCards = select('#summary-cards');

  if (!summaryCards) return;

  const totalOrders = orders.length;
  const pendingOrders = orders.filter((order) => order.status === 'Pending').length;
  const completedOrders = orders.filter((order) => order.status === 'Delivered').length;
  const cancelledOrders = orders.filter((order) => order.status === 'Cancelled').length;
  const revenue = orders.reduce((acc, order) => acc + (Number(order.total) || 0), 0);
  const todaysOrders = orders.filter((order) => {
    const createdAt = new Date(order.createdAt);
    const now = new Date();
    return createdAt.toDateString() === now.toDateString();
  }).length;

  summaryCards.innerHTML = `
    <article class="admin-card">
      <p class="admin-card-eyebrow">Total Orders</p>
      <h3>${totalOrders}</h3>
    </article>
    <article class="admin-card">
      <p class="admin-card-eyebrow">Pending Orders</p>
      <h3>${pendingOrders}</h3>
    </article>
    <article class="admin-card">
      <p class="admin-card-eyebrow">Completed Orders</p>
      <h3>${completedOrders}</h3>
    </article>
    <article class="admin-card">
      <p class="admin-card-eyebrow">Cancelled Orders</p>
      <h3>${cancelledOrders}</h3>
    </article>
    <article class="admin-card">
      <p class="admin-card-eyebrow">Products</p>
      <h3>${products.length}</h3>
    </article>
    <article class="admin-card">
      <p class="admin-card-eyebrow">Revenue</p>
      <h3>${formatAdminCurrency(revenue)}</h3>
    </article>
    <article class="admin-card">
      <p class="admin-card-eyebrow">Today's Orders</p>
      <h3>${todaysOrders}</h3>
    </article>
  `;
};

const renderRecentOrders = () => {
  const orders = getOrders();
  const container = select('#recent-orders-list');
  if (!container) return;

  if (!orders.length) {
    container.innerHTML = '<p class="admin-empty">No orders have been submitted yet.</p>';
    return;
  }

  container.innerHTML = orders.slice(0, 6).map((order) => `
    <article class="admin-list-item">
      <div>
        <strong>${order.customerName}</strong>
        <p>${order.city} • ${order.paymentMethod}</p>
      </div>
      <div>
        <strong>${formatAdminCurrency(order.total)}</strong>
        <p>${order.status}</p>
      </div>
    </article>
  `).join('');
};

const populateProductForm = (product = null) => {
  const form = select('#product-form');
  if (!form) return;

  form.reset();
  select('#product-id', form).value = product?.id || '';
  select('#product-name', form).value = product?.name || '';
  select('#product-price', form).value = product?.price || '';
  select('#product-old-price', form).value = product?.oldPrice || '';
  select('#product-category', form).value = product?.category || 'Essentials';
  select('#product-collection', form).value = product?.collection || 'tees';
  select('#product-stock', form).value = product?.stock || 'In Stock';
  select('#product-sizes', form).value = product?.sizeOptions?.join(', ') || '';
  select('#product-colors', form).value = product?.colorOptions?.join(', ') || '';
  select('#product-description', form).value = product?.description || '';
  select('#product-code', form).value = product?.code || '';
  select('#featured-toggle', form).checked = Boolean(product?.featured);
  select('#trending-toggle', form).checked = Boolean(product?.trending);
  select('#best-seller-toggle', form).checked = Boolean(product?.bestSeller);
  select('#product-image-file', form).value = '';
  select('#product-form-submit', form).textContent = product ? 'Update Product' : 'Add Product';
};

const renderProducts = () => {
  const products = getProducts();
  const list = select('#product-list');
  if (!list) return;

  if (!products.length) {
    list.innerHTML = '<p class="admin-empty">No products available.</p>';
    return;
  }

  list.innerHTML = products.map((product) => `
    <article class="admin-list-item admin-product-card">
      <div class="admin-product-hero">
        <img src="${resolveSitePath(product.image)}" alt="${product.name}" loading="lazy" decoding="async" width="96" height="96">
        <div>
          <strong>${product.name}</strong>
          <p>${product.code} • ${product.category}</p>
          <p>${product.collection}</p>
        </div>
      </div>
      <div class="admin-product-meta">
        <span>${formatAdminCurrency(product.price)}</span>
        <span>${product.stock}</span>
      </div>
      <div class="admin-product-actions">
        <button type="button" class="btn btn-ghost btn-sm" data-action="edit-product" data-id="${product.id}">Edit</button>
        <button type="button" class="btn btn-primary btn-sm" data-action="delete-product" data-id="${product.id}">Delete</button>
      </div>
    </article>
  `).join('');
};

const renderOrders = () => {
  const orders = getOrders();
  const tableBody = select('#orders-table-body');
  const searchInput = select('#orders-search');
  const statusFilter = select('#orders-status-filter');
  const sortSelect = select('#orders-sort');

  if (!tableBody) return;

  const searchValue = (searchInput?.value || '').trim().toLowerCase();
  const statusValue = statusFilter?.value || 'all';
  const sortValue = sortSelect?.value || 'newest';

  let filteredOrders = [...orders];

  if (searchValue) {
    filteredOrders = filteredOrders.filter((order) => `${order.customerName} ${order.city} ${order.phone}`.toLowerCase().includes(searchValue));
  }

  if (statusValue !== 'all') {
    filteredOrders = filteredOrders.filter((order) => order.status === statusValue);
  }

  if (sortValue === 'highest') {
    filteredOrders.sort((a, b) => (b.total || 0) - (a.total || 0));
  } else {
    filteredOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  if (!filteredOrders.length) {
    tableBody.innerHTML = '<tr><td colspan="7" class="admin-empty">No matching orders found.</td></tr>';
    return;
  }

  tableBody.innerHTML = filteredOrders.map((order) => `
    <tr>
      <td>${order.customerName}</td>
      <td>${order.phone}</td>
      <td>${order.address}</td>
      <td>${order.city}</td>
      <td>${order.products.map((item) => `${item.name} × ${item.quantity}`).join(', ')}</td>
      <td>${formatAdminCurrency(order.total)}</td>
      <td>
        <div class="admin-inline-actions">
          <select class="admin-select" data-order-status="${order.id}">
            <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
            <option value="Confirmed" ${order.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
            <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
            <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </div>
      </td>
    </tr>
  `).join('');
};

const renderDeliverySettings = () => {
  const delivery = getDeliverySettings();
  const form = select('#delivery-settings-form');
  if (!form) return;

  select('#delivery-islamabad', form).value = delivery.islamabad || '';
  select('#delivery-punjab', form).value = delivery.punjab || '';
  select('#delivery-kpk', form).value = delivery.kpk || '';
  select('#delivery-sindh', form).value = delivery.sindh || '';
  select('#delivery-balochistan', form).value = delivery.balochistan || '';
  select('#free-shipping-limit', form).value = delivery.freeShippingLimit || '';
  select('#express-shipping', form).checked = Boolean(delivery.expressShipping);
};

const renderCoupons = () => {
  const coupons = getCoupons();
  const list = select('#coupon-list');
  if (!list) return;

  if (!coupons.length) {
    list.innerHTML = '<p class="admin-empty">No coupons available.</p>';
    return;
  }

  list.innerHTML = coupons.map((coupon) => `
    <article class="admin-list-item">
      <div>
        <strong>${coupon.code}</strong>
        <p>${coupon.discount}% off • Expires ${coupon.expiry || 'No expiry'}</p>
      </div>
      <div>
        <strong>${coupon.used}/${coupon.usageLimit}</strong>
        <p>Used / Limit</p>
      </div>
      <button type="button" class="btn btn-primary btn-sm" data-action="delete-coupon" data-id="${coupon.id}">Delete</button>
    </article>
  `).join('');
};

const renderWebsiteSettings = () => {
  const settings = getWebsiteSettings();
  const form = select('#website-settings-form');
  if (!form) return;

  select('#business-name', form).value = settings.businessName || '';
  select('#whatsapp-number', form).value = settings.whatsappNumber || '';
  select('#facebook-link', form).value = settings.facebook || '';
  select('#instagram-link', form).value = settings.instagram || '';
  select('#google-business', form).value = settings.googleBusiness || '';
  select('#email-address', form).value = settings.email || '';
  select('#currency-input', form).value = settings.currency || 'PKR';
  select('#tax-input', form).value = settings.tax || '';
  select('#shipping-input', form).value = settings.shipping || '';
};

const renderAnalytics = () => {
  const analytics = getAnalytics();
  const topSelling = select('#top-selling-list');
  const mostViewed = select('#most-viewed-list');
  const revenueChart = select('#revenue-chart');
  const activityFeed = select('#activity-feed');

  if (!topSelling || !mostViewed || !revenueChart || !activityFeed) return;

  topSelling.innerHTML = analytics.topSelling.map((product) => `
    <li class="admin-list-item">
      <strong>${product.name}</strong>
      <span>${product.sales} sales</span>
    </li>
  `).join('');

  mostViewed.innerHTML = analytics.mostViewed.map((product) => `
    <li class="admin-list-item">
      <strong>${product.name}</strong>
      <span>${product.views} views</span>
    </li>
  `).join('');

  revenueChart.innerHTML = analytics.topSelling.slice(0, 4).map((product) => `
    <div class="chart-bar">
      <span>${product.name}</span>
      <div class="chart-track"><div style="width:${Math.min(100, (product.sales || 0) * 18)}%"></div></div>
    </div>
  `).join('');

  activityFeed.innerHTML = analytics.recentActivity.map((activity) => `
    <li class="admin-list-item">
      <strong>${activity.message}</strong>
      <span>${new Date(activity.createdAt).toLocaleString()}</span>
    </li>
  `).join('');
};

export const initAdminLogin = () => {
  const form = select('#admin-login-form');
  const session = getAdminSession();

  if (session?.loggedIn) {
    window.location.href = 'admin-dashboard.html';
    return;
  }

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const username = formData.get('username') || '';
    const password = formData.get('password') || '';
    const rememberMe = Boolean(formData.get('remember'));

    if (authenticateAdmin(username, password, rememberMe)) {
      window.location.href = 'admin-dashboard.html';
    } else {
      const error = select('#login-error');
      if (error) error.textContent = 'Username or password is incorrect.';
    }
  });
};

export const initAdminDashboard = () => {
  const session = getAdminSession();

  if (!session?.loggedIn) {
    window.location.href = 'admin-login.html';
    return;
  }

  const logoutButton = select('#admin-logout');
  logoutButton?.addEventListener('click', () => {
    logoutAdmin();
    window.location.href = 'admin-login.html';
  });

  const productForm = select('#product-form');
  const cancelEditButton = select('#cancel-product-edit');

  renderSummary();
  renderRecentOrders();
  renderProducts();
  renderOrders();
  renderDeliverySettings();
  renderCoupons();
  renderWebsiteSettings();
  renderAnalytics();

  productForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitButton = select('#product-form-submit', productForm);
    const formData = new FormData(productForm);

    submitButton?.setAttribute('disabled', 'disabled');

    const selectedFile = formData.get('image');
    let imageValue = formData.get('imagePath') || '';

    if (selectedFile && typeof selectedFile !== 'string' && selectedFile.size > 0) {
      imageValue = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });
    }

    const payload = {
      id: formData.get('id') || '',
      name: formData.get('name') || '',
      price: formData.get('price') || 0,
      oldPrice: formData.get('oldPrice') || 0,
      category: formData.get('category') || 'Essentials',
      collection: formData.get('collection') || 'tees',
      stock: formData.get('stock') || 'In Stock',
      sizeOptions: (formData.get('sizes') || '').split(',').map((size) => size.trim()).filter(Boolean),
      colorOptions: (formData.get('colors') || '').split(',').map((color) => color.trim()).filter(Boolean),
      description: formData.get('description') || '',
      code: formData.get('code') || '',
      featured: Boolean(formData.get('featured')),
      trending: Boolean(formData.get('trending')),
      bestSeller: Boolean(formData.get('bestSeller')),
      image: imageValue || 'assets/products/product1.jpg'
    };

    upsertProduct(payload);
    renderProducts();
    populateProductForm();
    submitButton?.removeAttribute('disabled');
  });

  cancelEditButton?.addEventListener('click', () => populateProductForm());

  select('#product-list')?.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const button = target.closest('[data-action]');
    if (!button) return;

    const productId = button.dataset.id;
    const action = button.dataset.action;

    if (action === 'edit-product') {
      const product = getProducts().find((item) => item.id === productId);
      populateProductForm(product);
    }

    if (action === 'delete-product') {
      deleteProduct(productId);
      renderProducts();
      renderSummary();
    }
  });

  const debouncedRenderOrders = debounce(() => requestFrame(renderOrders), 90);

  select('#orders-search')?.addEventListener('input', debouncedRenderOrders);
  select('#orders-status-filter')?.addEventListener('change', debouncedRenderOrders);
  select('#orders-sort')?.addEventListener('change', debouncedRenderOrders);

  select('#orders-table-body')?.addEventListener('change', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) return;

    const orderId = target.dataset.orderStatus;
    if (!orderId) return;

    updateOrderStatus(orderId, target.value);
    renderOrders();
    renderSummary();
    renderRecentOrders();
    renderAnalytics();
  });

  select('#delivery-settings-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const settings = {
      islamabad: Number(formData.get('islamabad')) || 0,
      punjab: Number(formData.get('punjab')) || 0,
      kpk: Number(formData.get('kpk')) || 0,
      sindh: Number(formData.get('sindh')) || 0,
      balochistan: Number(formData.get('balochistan')) || 0,
      freeShippingLimit: Number(formData.get('freeShippingLimit')) || 0,
      expressShipping: Boolean(formData.get('expressShipping'))
    };
    saveDeliverySettings(settings);
  });

  select('#coupon-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const coupon = {
      code: formData.get('code') || '',
      discount: formData.get('discount') || 0,
      expiry: formData.get('expiry') || '',
      usageLimit: formData.get('usageLimit') || 0
    };

    createCoupon(coupon);
    renderCoupons();
    event.currentTarget.reset();
  });

  select('#coupon-list')?.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const button = target.closest('[data-action="delete-coupon"]');
    if (!button) return;

    deleteCoupon(button.dataset.id);
    renderCoupons();
  });

  select('#website-settings-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const settings = {
      businessName: formData.get('businessName') || '',
      whatsappNumber: formData.get('whatsappNumber') || '',
      facebook: formData.get('facebook') || '',
      instagram: formData.get('instagram') || '',
      googleBusiness: formData.get('googleBusiness') || '',
      email: formData.get('email') || '',
      currency: formData.get('currency') || 'PKR',
      tax: formData.get('tax') || 0,
      shipping: formData.get('shipping') || ''
    };
    saveWebsiteSettings(settings);
  });

  window.addEventListener('storage', () => {
    renderSummary();
    renderRecentOrders();
    renderProducts();
    renderOrders();
    renderCoupons();
    renderAnalytics();
  });
};
