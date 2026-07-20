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
  getOrdersAsync,
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

const select = (selector, parent = document) => parent.querySelector(selector);
const selectAll = (selector, parent = document) => parent.querySelectorAll(selector);

// Image preview and validation
const handleImagePreview = (fileInput) => {
  const preview = fileInput.parentElement.querySelector('.image-preview');
  const file = fileInput.files?.[0];

  if (!file) {
    if (preview) preview.remove();
    return;
  }

  // Validate image file
  if (!file.type.startsWith('image/')) {
    alert('Please select a valid image file');
    fileInput.value = '';
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    alert('Image must be smaller than 5MB');
    fileInput.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    let existingPreview = fileInput.parentElement.querySelector('.image-preview');
    if (!existingPreview) {
      existingPreview = document.createElement('div');
      existingPreview.className = 'image-preview';
      fileInput.parentElement.insertBefore(existingPreview, fileInput.nextSibling);
    }
    existingPreview.innerHTML = `
      <img src="${e.target.result}" alt="Preview" style="max-width: 200px; max-height: 150px; border-radius: 0.5rem; margin-top: 0.5rem;">
      <p style="font-size: 0.85rem; color: #666; margin-top: 0.3rem;">${(file.size / 1024).toFixed(2)} KB</p>
    `;
  };
  reader.readAsDataURL(file);
};

// Data export/import for cross-device sync
const exportAdminData = () => {
  const state = window.localStorage.getItem('bindaud_admin_state');
  if (!state) {
    alert('No data to export');
    return;
  }

  const dataStr = JSON.stringify(JSON.parse(state), null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `bindaud-admin-backup-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

const importAdminData = async (file) => {
  if (!file || !file.type.includes('json')) {
    alert('Please select a valid JSON file');
    return;
  }

  try {
    const text = await file.text();
    const data = JSON.parse(text);
    window.localStorage.setItem('bindaud_admin_state', JSON.stringify(data));
    alert('Data imported successfully! Reloading...');
    window.location.reload();
  } catch (error) {
    alert(`Import failed: ${error.message}`);
  }
};

const renderSummary = async () => {
  const orders = await getOrdersAsync();
  const products = await getProducts();
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

const renderRecentOrders = async () => {
  const orders = await getOrdersAsync();
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
  select('#product-code', form).value = product?.code || '';
  select('#featured-toggle', form).checked = Boolean(product?.featured);
  select('#trending-toggle', form).checked = Boolean(product?.trending);
  select('#best-seller-toggle', form).checked = Boolean(product?.bestSeller);
  select('#product-image-file', form).value = '';

  // Optional fields - set to empty strings
  select('#product-description', form).value = product?.description || '';
  select('#product-seo-title', form).value = product?.seoTitle || '';
  select('#product-meta-description', form).value = product?.metaDescription || '';
  select('#product-slug', form).value = product?.slug || '';
  select('#product-barcode', form).value = product?.barcode || '';
  select('#product-og-image', form).value = product?.ogImage || '';
  select('#product-features', form).value = product?.features || '';
  select('#product-tags', form).value = product?.tags || '';

  // Remove existing image preview
  const preview = form.querySelector('.image-preview');
  if (preview) preview.remove();

  // Show current product image if editing
  if (product?.image && !product.image.startsWith('data:')) {
    const previewDiv = document.createElement('div');
    previewDiv.className = 'image-preview';
    previewDiv.innerHTML = `<img src="${resolveSitePath(product.image)}" alt="${product.name}" style="max-width: 200px; max-height: 150px; border-radius: 0.5rem; margin-top: 0.5rem;">`;
    select('#product-image-file', form).parentElement.insertBefore(previewDiv, select('#product-image-file', form).nextSibling);
  }

  select('#product-form-submit', form).textContent = product ? 'Update Product' : 'Add Product';
};

const renderProducts = async () => {
  const products = await getProducts();
  const list = select('#product-list');
  if (!list) return;

  if (!products.length) {
    list.innerHTML = '<p class="admin-empty">No products available.</p>';
    return;
  }

  list.innerHTML = products.map((product) => `
    <article class="admin-list-item admin-product-card">
      <div class="admin-product-hero">
        <div class="product-image-wrapper">
          <img src="${product.image && product.image.startsWith('data:') ? product.image : resolveSitePath(product.image)}" alt="${product.name}" loading="lazy" onerror="this.src='assets/products/product1.jpg'">
        </div>
        <div>
          <strong>${product.name}</strong>
          <p>${product.code} • ${product.category}</p>
          <p>${product.collection}</p>
        </div>
      </div>
      <div class="admin-product-meta">
        <span>${formatAdminCurrency(product.price)}</span>
        <span class="stock-badge ${product.stock === 'In Stock' ? 'in-stock' : 'low-stock'}">${product.stock}</span>
      </div>
      <div class="admin-product-actions">
        <button type="button" class="btn btn-ghost btn-sm" data-action="edit-product" data-id="${product.id}">Edit</button>
        <button type="button" class="btn btn-primary btn-sm" data-action="delete-product" data-id="${product.id}">Delete</button>
      </div>
    </article>
  `).join('');
};

const renderOrders = async () => {
  const orders = await getOrdersAsync();
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
      <td>${(order.products || []).map((item) => `${item.name} × ${item.quantity}`).join(', ')}</td>
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

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const username = formData.get('username') || '';
    const password = formData.get('password') || '';
    const rememberMe = Boolean(formData.get('remember'));

    try {
      const success = await authenticateAdmin(username, password, rememberMe);
      if (success) {
        window.location.href = '/pages/admin-dashboard.html';
      } else {
        const error = select('#login-error');
        if (error) error.textContent = 'Username or password is incorrect.';
      }
    } catch (e) {
      console.error('Admin login error', e);
      const error = select('#login-error');
      if (error) error.textContent = 'Authentication error. Check console.';
    }
  });
};

export const initAdminDashboard = async () => {
  const session = getAdminSession();
  if (!session?.loggedIn) {
    window.location.href = '/pages/admin-login.html';
    return;
  }

  const logoutButton = select('#admin-logout');
  logoutButton?.addEventListener('click', () => {
    logoutAdmin();
    window.location.href = 'admin-login.html';
  });

  // Data management
  const exportBtn = select('#export-data-btn');
  const importBtn = select('#import-data-btn');
  const importFile = select('#import-data-file');

  exportBtn?.addEventListener('click', exportAdminData);
  importBtn?.addEventListener('click', () => importFile?.click());
  importFile?.addEventListener('change', (e) => {
    if (e.target.files?.[0]) {
      importAdminData(e.target.files[0]);
    }
  });

  const productForm = select('#product-form');
  const cancelEditButton = select('#cancel-product-edit');
  const imageInput = select('#product-image-file');

  // Image preview listener
  imageInput?.addEventListener('change', (e) => handleImagePreview(e.target));

  await renderSummary();
  await renderRecentOrders();
  await renderProducts();
  await renderOrders();
  renderDeliverySettings();
  renderCoupons();
  renderWebsiteSettings();
  renderAnalytics();

  productForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(productForm);
    let imageValue = formData.get('imagePath') || '';
    const selectedFile = formData.get('image');

    if (selectedFile && typeof selectedFile !== 'string' && selectedFile.size > 0) {
      imageValue = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });
    }

    const nameValue = String(formData.get('name') || '').trim();
    const priceValue = Number(formData.get('price')) || 0;

    if (!nameValue || priceValue <= 0) {
      alert('Please enter a valid product name and price.');
      return;
    }

    const payload = {
      id: formData.get('id') || '',
      name: nameValue,
      price: priceValue,
      oldPrice: Number(formData.get('oldPrice')) || 0,
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
      image: imageValue || 'assets/products/product1.jpg',
      seoTitle: formData.get('seoTitle') || '',
      metaDescription: formData.get('metaDescription') || '',
      slug: formData.get('slug') || '',
      barcode: formData.get('barcode') || '',
      ogImage: formData.get('ogImage') || '',
      features: formData.get('features') || '',
      tags: formData.get('tags') || ''
    };

    try {
      await upsertProduct(payload);
      await renderProducts();
      await renderSummary();
      populateProductForm();
      alert(`Product ${payload.id ? 'updated' : 'added'} successfully!`);
    } catch (error) {
      alert(`Error saving product: ${error.message}`);
    }
  });

  cancelEditButton?.addEventListener('click', () => populateProductForm());

  select('#product-list')?.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const button = target.closest('[data-action]');
    if (!button) return;

    const productId = button.dataset.id;
    const action = button.dataset.action;

    if (action === 'edit-product') {
      const product = (await getProducts()).find((item) => item.id === productId);
      populateProductForm(product);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (action === 'delete-product') {
      if (confirm('Are you sure you want to delete this product?')) {
        await deleteProduct(productId);
        await renderProducts();
        await renderSummary();
      }
    }
  });

  select('#orders-search')?.addEventListener('input', async () => {
    await renderOrders();
  });
  select('#orders-status-filter')?.addEventListener('change', async () => {
    await renderOrders();
  });
  select('#orders-sort')?.addEventListener('change', async () => {
    await renderOrders();
  });

  select('#orders-table-body')?.addEventListener('change', async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) return;
    const orderId = target.dataset.orderStatus;
    if (!orderId) return;

    updateOrderStatus(orderId, target.value);
    await renderOrders();
    await renderSummary();
    await renderRecentOrders();
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
    alert('Delivery settings saved!');
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

    if (!coupon.code) {
      alert('Please enter a coupon code');
      return;
    }

    createCoupon(coupon);
    renderCoupons();
    event.currentTarget.reset();
    alert('Coupon created successfully!');
  });

  select('#coupon-list')?.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const button = target.closest('[data-action="delete-coupon"]');
    if (!button) return;

    if (confirm('Delete this coupon?')) {
      deleteCoupon(button.dataset.id);
      renderCoupons();
    }
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
    alert('Website settings saved!');
  });

  window.addEventListener('storage', async () => {
    await renderSummary();
    await renderRecentOrders();
    await renderProducts();
    await renderOrders();
    renderCoupons();
    renderAnalytics();
  });
};
