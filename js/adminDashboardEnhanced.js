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
import {
  SizeChipSelector,
  ColorPicker,
  SearchableDropdown,
  ImageUploader,
  RichTextEditor,
  SKUGenerator,
  Notifier,
  KeyboardShortcuts,
  ConfirmDialog,
  LoadingIndicator,
  ProductDuplicator
} from './adminComponents.js';

const select = (selector, parent = document) => parent.querySelector(selector);
const selectAll = (selector, parent = document) => parent.querySelectorAll(selector);

// Global component instances
let sizeSelector, colorPicker, imageUploader;
let categoryDropdown, collectionDropdown, brandDropdown, genderDropdown;
let materialDropdown, fitDropdown, seasonDropdown, stockDropdown;
let currentEditingProduct = null;

// Initialize component dropdowns
const initializeDropdowns = () => {
  const categories = ['Essentials', 'Premium', 'Limited'];
  const collections = ['tees', 'jackets', 'kimono', 'shirts', 'accessories'];
  const genders = ['Unisex', 'Mens', 'Womens', 'Kids'];
  const materials = ['Cotton', 'Polyester', 'Wool', 'Silk', 'Blend', 'Linen'];
  const fits = ['Oversized', 'Regular', 'Slim', 'Relaxed', 'Athletic'];
  const seasons = ['All Year', 'Summer', 'Winter', 'Spring', 'Fall'];
  const stocks = ['In Stock', 'Low Stock', 'Out of Stock'];

  categoryDropdown = new SearchableDropdown(
    'category-dropdown',
    categories,
    'Select category',
    (value) => {
      select('#product-category').value = value;
      select('#product-category').setAttribute('data-value', value);
    }
  );

  collectionDropdown = new SearchableDropdown(
    'collection-dropdown',
    collections,
    'Select collection',
    (value) => {
      select('#product-collection').value = value;
      select('#product-collection').setAttribute('data-value', value);
    }
  );

  genderDropdown = new SearchableDropdown(
    'gender-dropdown',
    genders,
    'Select gender',
    (value) => {
      select('#product-gender').value = value;
      select('#product-gender').setAttribute('data-value', value);
    }
  );

  materialDropdown = new SearchableDropdown(
    'material-dropdown',
    materials,
    'Select material',
    (value) => {
      select('#product-material').value = value;
      select('#product-material').setAttribute('data-value', value);
    }
  );

  fitDropdown = new SearchableDropdown(
    'fit-dropdown',
    fits,
    'Select fit',
    (value) => {
      select('#product-fit').value = value;
      select('#product-fit').setAttribute('data-value', value);
    }
  );

  seasonDropdown = new SearchableDropdown(
    'season-dropdown',
    seasons,
    'Select season',
    (value) => {
      select('#product-season').value = value;
      select('#product-season').setAttribute('data-value', value);
    }
  );

  stockDropdown = new SearchableDropdown(
    'stock-dropdown',
    stocks,
    'Select stock status',
    (value) => {
      select('#product-stock').value = value;
      select('#product-stock').setAttribute('data-value', value);
    }
  );
};

// Initialize interactive components
const initializeComponents = () => {
  // Size selector
  sizeSelector = new SizeChipSelector('size-selector', []);

  // Color picker
  colorPicker = new ColorPicker('color-picker', []);

  // Image uploader
  imageUploader = new ImageUploader('product-image-uploader', (file, dataUrl) => {
    if (dataUrl) {
      select('input[name="imagePath"]').value = dataUrl;
    }
  });

  // Rich text editor for description
  new RichTextEditor('product-description');

  // Initialize keyboard shortcuts
  new KeyboardShortcuts();
};

// Data export/import for cross-device sync
const exportAdminData = () => {
  LoadingIndicator.show('Preparing export...');
  setTimeout(() => {
    const state = window.localStorage.getItem('bindaud_admin_state');
    if (!state) {
      Notifier.error('No data to export');
      LoadingIndicator.hide();
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
    
    LoadingIndicator.hide();
    Notifier.success(`Data exported: ${link.download}`);
  }, 500);
};

const importAdminData = async (file) => {
  if (!file || !file.type.includes('json')) {
    Notifier.error('Please select a valid JSON file');
    return;
  }

  LoadingIndicator.show('Importing data...');
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    window.localStorage.setItem('bindaud_admin_state', JSON.stringify(data));
    
    LoadingIndicator.hide();
    Notifier.success('Data imported successfully! Reloading...');
    
    setTimeout(() => window.location.reload(), 1500);
  } catch (error) {
    LoadingIndicator.hide();
    Notifier.error(`Import failed: ${error.message}`);
  }
};

// Render functions (existing)
const renderSummary = async () => {
  const orders = getOrders();
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
  currentEditingProduct = product;

  // Basic info
  select('#product-id', form).value = product?.id || '';
  select('#product-name', form).value = product?.name || '';
  select('#product-price', form).value = product?.price || '';
  select('#product-old-price', form).value = product?.oldPrice || '';
  select('#product-brand', form).value = product?.brand || 'BIN DAUD';
  select('#product-code', form).value = product?.code || '';
  select('#product-description', form).value = product?.description || '';
  select('#product-features', form).value = (product?.features || []).join(', ');
  select('#product-tags', form).value = (product?.tags || []).join(', ');
  select('#product-quantity', form).value = product?.quantity || 0;

  // Dropdowns
  categoryDropdown?.setValue(product?.category || 'Essentials');
  collectionDropdown?.setValue(product?.collection || 'tees');
  genderDropdown?.setValue(product?.gender || 'Unisex');
  materialDropdown?.setValue(product?.material || 'Cotton');
  fitDropdown?.setValue(product?.fit || 'Regular');
  seasonDropdown?.setValue(product?.season || 'All Year');
  stockDropdown?.setValue(product?.stock || 'In Stock');

  // Size and color selectors
  sizeSelector?.setValue(product?.sizeOptions || []);
  colorPicker?.setValue(product?.colorOptions || []);

  // Checkboxes
  select('#featured-toggle', form).checked = Boolean(product?.featured);
  select('#trending-toggle', form).checked = Boolean(product?.trending);
  select('#best-seller-toggle', form).checked = Boolean(product?.bestSeller);

  // Image uploader
  imageUploader?.clear();
  if (product?.image) {
    const imageUrl = product.image.startsWith('data:')
      ? product.image
      : resolveSitePath(product.image);
    
    // Show preview for existing image
    const previewContainer = select('.preview-container', imageUploader?.container);
    if (previewContainer) {
      previewContainer.innerHTML = `
        <div class="preview-item">
          <img src="${imageUrl}" alt="${product.name}">
          <div class="preview-info">
            <p class="preview-name">${product.name}</p>
            <p class="preview-size">Existing image</p>
          </div>
        </div>
      `;
    }
  }

  // Update button text
  const submitBtn = select('#product-form-submit', form);
  const duplicateBtn = select('#duplicate-product-btn', form);
  if (submitBtn) {
    submitBtn.textContent = product ? 'Update Product' : 'Add Product';
  }
  if (duplicateBtn) {
    duplicateBtn.style.display = product ? '' : 'none';
  }

  // Auto-generate SKU if new product
  if (!product) {
    select('#auto-sku-btn', form)?.addEventListener('click', (e) => {
      e.preventDefault();
      const name = select('#product-name', form).value;
      const category = categoryDropdown?.getValue() || 'Product';
      const sku = SKUGenerator.generate(name, category);
      select('#product-code', form).value = sku;
      Notifier.success(`SKU generated: ${sku}`);
    });
  }
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
    filteredOrders = filteredOrders.filter((order) =>
      `${order.customerName} ${order.city} ${order.phone}`.toLowerCase().includes(searchValue)
    );
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

export const initAdminDashboard = async () => {
  const session = getAdminSession();
  if (!session?.loggedIn) {
    window.location.href = '/pages/admin-login.html';
    return;
  }

  // Add notification container
  if (!select('#notifications')) {
    const notificationContainer = document.createElement('div');
    notificationContainer.id = 'notifications';
    document.body.appendChild(notificationContainer);
  }

  // Initialize components
  initializeDropdowns();
  initializeComponents();

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
  const autoSkuBtn = select('#auto-sku-btn');
  const duplicateBtn = select('#duplicate-product-btn');

  // Auto SKU button
  autoSkuBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    const name = select('#product-name').value;
    const category = categoryDropdown?.getValue() || 'Product';
    if (!name.trim()) {
      Notifier.error('Enter a product name first');
      return;
    }
    const sku = SKUGenerator.generate(name, category);
    select('#product-code').value = sku;
    Notifier.success(`SKU generated: ${sku}`);
  });

  // Product duplicate button
  duplicateBtn?.addEventListener('click', async (e) => {
    e.preventDefault();
    if (!currentEditingProduct) return;

    const duplicated = ProductDuplicator.duplicate(currentEditingProduct, `${currentEditingProduct.name} (Copy)`);
    populateProductForm(null); // Reset form for new product
    select('#product-name').value = duplicated.name;
    Notifier.info('Product duplicated. Customize and save as new.');
  });

  // Product form submit
  productForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    LoadingIndicator.show('Saving product...');

    try {
      const formData = new FormData(productForm);
      let imageValue = formData.get('imagePath') || 'assets/products/product1.jpg';

      const file = imageUploader?.getFile();
      if (file) {
        imageValue = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      const nameValue = String(formData.get('name') || '').trim();
      const priceValue = Number(formData.get('price')) || 0;

      if (!nameValue || priceValue <= 0) {
        Notifier.error('Please enter a valid product name and price.');
        LoadingIndicator.hide();
        return;
      }

      const payload = {
        id: formData.get('id') || '',
        name: nameValue,
        price: priceValue,
        oldPrice: Number(formData.get('oldPrice')) || 0,
        category: categoryDropdown?.getValue() || 'Essentials',
        collection: collectionDropdown?.getValue() || 'tees',
        stock: stockDropdown?.getValue() || 'In Stock',
        gender: genderDropdown?.getValue() || 'Unisex',
        material: materialDropdown?.getValue() || 'Cotton',
        fit: fitDropdown?.getValue() || 'Regular',
        season: seasonDropdown?.getValue() || 'All Year',
        brand: formData.get('brand') || 'BIN DAUD',
        sizeOptions: sizeSelector?.getValue() || [],
        colorOptions: colorPicker?.getValue() || [],
        description: formData.get('description') || '',
        features: (formData.get('features') || '').split(',').map(f => f.trim()).filter(Boolean),
        tags: (formData.get('tags') || '').split(',').map(t => t.trim()).filter(Boolean),
        code: formData.get('code') || '',
        quantity: Number(formData.get('quantity')) || 0,
        featured: Boolean(formData.get('featured')),
        trending: Boolean(formData.get('trending')),
        bestSeller: Boolean(formData.get('bestSeller')),
        image: imageValue
      };

      await upsertProduct(payload);

      LoadingIndicator.hide();
      Notifier.success(payload.id ? 'Product updated successfully!' : 'Product added successfully!');

      productForm.reset();
      populateProductForm(null);
      imageUploader?.clear();
      await renderProducts();
      await renderSummary();

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      LoadingIndicator.hide();
      Notifier.error(`Error saving product: ${error.message}`);
    }
  });

  cancelEditButton?.addEventListener('click', (e) => {
    e.preventDefault();
    productForm?.reset();
    populateProductForm(null);
    imageUploader?.clear();
    currentEditingProduct = null;
  });

  await renderSummary();
  renderRecentOrders();
  await renderProducts();
  renderOrders();
  renderDeliverySettings();
  renderCoupons();
  renderWebsiteSettings();
  renderAnalytics();

  // Initial product form setup
  populateProductForm(null);

  // Event delegation for product actions
  document.addEventListener('click', async (event) => {
    const action = event.target.getAttribute('data-action');
    const productId = event.target.getAttribute('data-id');

    if (action === 'edit-product' && productId) {
      const products = await getProducts();
      const product = products.find((p) => p.id === productId);
      if (product) {
        populateProductForm(product);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }

    if (action === 'delete-product' && productId) {
      const confirmed = await ConfirmDialog.show(
        'Delete Product',
        'Are you sure you want to delete this product? This action cannot be undone.',
        'Delete',
        'Cancel'
      );

      if (confirmed) {
        LoadingIndicator.show('Deleting product...');
        await deleteProduct(productId);
        LoadingIndicator.hide();
        Notifier.success('Product deleted successfully!');
        await renderProducts();
        await renderSummary();
      }
    }

    if (action === 'delete-coupon' && productId) {
      const confirmed = await ConfirmDialog.show(
        'Delete Coupon',
        'Are you sure you want to delete this coupon?',
        'Delete',
        'Cancel'
      );

      if (confirmed) {
        await deleteCoupon(productId);
        Notifier.success('Coupon deleted!');
        renderCoupons();
      }
    }
  });

  // Order filters
  const ordersSearch = select('#orders-search');
  const ordersStatusFilter = select('#orders-status-filter');
  const ordersSort = select('#orders-sort');

  ordersSearch?.addEventListener('input', renderOrders);
  ordersStatusFilter?.addEventListener('change', renderOrders);
  ordersSort?.addEventListener('change', renderOrders);

  // Order status update
  document.addEventListener('change', (event) => {
    const orderStatusSelect = event.target.getAttribute('data-order-status');
    if (orderStatusSelect) {
      const newStatus = event.target.value;
      updateOrderStatus(orderStatusSelect, newStatus);
      Notifier.success('Order status updated!');
    }
  });

  // Delivery settings form
  const deliveryForm = select('#delivery-settings-form');
  deliveryForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(deliveryForm);
    const settings = {
      islamabad: Number(formData.get('islamabad')) || 250,
      punjab: Number(formData.get('punjab')) || 300,
      kpk: Number(formData.get('kpk')) || 400,
      sindh: Number(formData.get('sindh')) || 500,
      balochistan: Number(formData.get('balochistan')) || 700,
      freeShippingLimit: Number(formData.get('freeShippingLimit')) || 8000,
      expressShipping: Boolean(formData.get('expressShipping'))
    };
    saveDeliverySettings(settings);
    Notifier.success('Delivery settings saved!');
  });

  // Coupon form
  const couponForm = select('#coupon-form');
  couponForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(couponForm);
    createCoupon({
      code: (formData.get('code') || '').toUpperCase(),
      discount: Number(formData.get('discount')) || 0,
      expiry: formData.get('expiry') || '',
      usageLimit: Number(formData.get('usageLimit')) || 0
    });
    couponForm.reset();
    Notifier.success('Coupon created!');
    renderCoupons();
  });

  // Website settings form
  const websiteForm = select('#website-settings-form');
  websiteForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(websiteForm);
    const settings = {
      businessName: formData.get('businessName') || '',
      whatsappNumber: formData.get('whatsappNumber') || '',
      facebook: formData.get('facebook') || '',
      instagram: formData.get('instagram') || '',
      googleBusiness: formData.get('googleBusiness') || '',
      email: formData.get('email') || '',
      currency: formData.get('currency') || 'PKR',
      tax: Number(formData.get('tax')) || 0,
      shipping: formData.get('shipping') || ''
    };
    saveWebsiteSettings(settings);
    Notifier.success('Website settings saved!');
  });
};
