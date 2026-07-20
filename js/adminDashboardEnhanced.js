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
let conditionDropdown, availabilityDropdown, visibilityDropdown;
let currentEditingProduct = null;
let selectedProductIds = new Set();
let productPage = 1;
const PRODUCTS_PER_PAGE = 8;
const PRODUCT_DRAFT_KEY = 'bindaud_admin_product_draft';

// Initialize component dropdowns
const initializeDropdowns = () => {
  const categories = ['Essentials', 'Premium', 'Limited'];
  const collections = ['tees', 'jackets', 'kimono', 'shirts', 'accessories'];
  const genders = ['Unisex', 'Mens', 'Womens', 'Kids'];
  const materials = ['Cotton', 'Polyester', 'Wool', 'Silk', 'Blend', 'Linen'];
  const fits = ['Oversized', 'Regular', 'Slim', 'Relaxed', 'Athletic'];
  const seasons = ['All Year', 'Summer', 'Winter', 'Spring', 'Fall'];
  const stocks = ['In Stock', 'Low Stock', 'Out of Stock'];
  const conditions = ['New', 'Used', 'Refurbished'];
  const availability = ['Available', 'Unavailable', 'Preorder'];

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

  conditionDropdown = new SearchableDropdown(
    'condition-dropdown',
    conditions,
    'Select condition',
    (value) => {
      select('#product-condition').value = value;
      select('#product-condition').setAttribute('data-value', value);
    }
  );

  availabilityDropdown = new SearchableDropdown(
    'availability-dropdown',
    availability,
    'Select availability',
    (value) => {
      select('#product-availability').value = value;
      select('#product-availability').setAttribute('data-value', value);
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
  imageUploader = new ImageUploader('product-image-uploader', (images) => {
    const imagePathInput = select('input[name="imagePath"]');
    const imageListInput = select('#product-images');
    const coverImage = images.find((item) => item.isCover) || images[0] || null;
    if (imagePathInput) {
      imagePathInput.value = coverImage?.url || 'assets/products/product1.jpg';
    }
    if (imageListInput) {
      imageListInput.value = JSON.stringify(images);
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

const saveProductDraft = () => {
  const form = select('#product-form');
  if (!form) return;
  const draft = {
    name: select('#product-name', form).value,
    code: select('#product-code', form).value,
    price: select('#product-price', form).value,
    oldPrice: select('#product-old-price', form).value,
    brand: select('#product-brand', form).value,
    description: select('#product-description', form).value,
    features: select('#product-features', form).value,
    tags: select('#product-tags', form).value,
    category: select('#product-category', form).value,
    collection: select('#product-collection', form).value,
    stock: select('#product-stock', form).value,
    gender: select('#product-gender', form).value,
    material: select('#product-material', form).value,
    fit: select('#product-fit', form).value,
    season: select('#product-season', form).value,
    quantity: select('#product-quantity', form).value,
    visibility: select('#product-visibility', form).value,
    condition: select('#product-condition', form).value,
    availability: select('#product-availability', form).value,
    seoTitle: select('#product-seo-title', form).value,
    metaDescription: select('#product-meta-description', form).value,
    slug: select('#product-slug', form).value,
    ogImage: select('#product-og-image', form).value,
    featured: select('#featured-toggle', form).checked,
    trending: select('#trending-toggle', form).checked,
    bestSeller: select('#best-seller-toggle', form).checked,
    newArrival: select('#new-arrival-toggle', form).checked,
    sale: select('#sale-toggle', form).checked,
    sizes: sizeSelector?.getValue() || [],
    colors: colorPicker?.getValue() || [],
    images: imageUploader?.getValue() || []
  };

  window.localStorage.setItem(PRODUCT_DRAFT_KEY, JSON.stringify(draft));
};

const loadProductDraft = () => {
  const raw = window.localStorage.getItem(PRODUCT_DRAFT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const clearProductDraft = () => {
  window.localStorage.removeItem(PRODUCT_DRAFT_KEY);
};

const generateSlugFromName = (name) => {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

const getFilteredOrders = () => {
  const orders = getOrders();
  const searchValue = (select('#orders-search')?.value || '').trim().toLowerCase();
  const statusValue = select('#orders-status-filter')?.value || 'all';
  const sortValue = select('#orders-sort')?.value || 'newest';
  let filtered = [...orders];

  if (searchValue) {
    filtered = filtered.filter((order) =>
      `${order.customerName || ''} ${order.city || ''} ${order.phone || ''}`.toLowerCase().includes(searchValue)
    );
  }

  if (statusValue !== 'all') {
    filtered = filtered.filter((order) => order.status === statusValue);
  }

  if (sortValue === 'highest') {
    filtered.sort((a, b) => (Number(b.total) || 0) - (Number(a.total) || 0));
  } else {
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  return filtered;
};

const exportOrdersToCsv = () => {
  const orders = getFilteredOrders();
  if (!orders.length) {
    Notifier.info('No orders available to export.');
    return;
  }

  const headers = ['Customer', 'Phone', 'Address', 'City', 'Products', 'Total', 'Status', 'Created At'];
  const rows = orders.map((order) => {
    const products = (order.products || []).map((item) => `${item.name} x ${item.quantity || 1}`).join('; ');
    return [
      order.customerName || '',
      order.phone || '',
      order.address || '',
      order.city || '',
      products,
      formatAdminCurrency(order.total),
      order.status || '',
      order.createdAt ? new Date(order.createdAt).toLocaleString() : ''
    ];
  });

  const csvContent = [headers, ...rows]
    .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
    .join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `bindaud-orders-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);

  Notifier.success('Orders exported as a spreadsheet file.');
};

const exportProductsToCsv = async () => {
  const products = await getProducts();
  if (!products.length) {
    Notifier.info('No products available to export.');
    return;
  }

  const headers = ['ID', 'Name', 'SKU', 'Category', 'Collection', 'Price', 'Old Price', 'Stock', 'Quantity', 'Visibility', 'Condition', 'Availability', 'Tags', 'Sizes', 'Colors', 'Slug', 'Barcode', 'Featured', 'Best Seller', 'New Arrival', 'Sale', 'Description', 'Images'];
  const rows = products.map((product) => [
    product.id || '',
    product.name || '',
    product.code || '',
    product.category || '',
    product.collection || '',
    product.price || 0,
    product.oldPrice || 0,
    product.stock || '',
    product.quantity || 0,
    product.visibility || 'Public',
    product.condition || 'New',
    product.availability || 'Available',
    (product.tags || []).join('|'),
    (product.sizeOptions || product.sizes || []).join('|'),
    (product.colorOptions || product.colors || []).join('|'),
    product.slug || '',
    product.barcode || '',
    product.featured ? 'Yes' : 'No',
    product.bestSeller ? 'Yes' : 'No',
    product.newArrival ? 'Yes' : 'No',
    product.sale ? 'Yes' : 'No',
    product.description || '',
    (product.images || []).map((img) => img.url).join('|')
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `bindaud-products-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  Notifier.success('Products exported as CSV.');
};

const exportProductsToExcel = async () => {
  const products = await getProducts();
  if (!products.length) {
    Notifier.info('No products available to export.');
    return;
  }

  const htmlRows = products.map((product) => `
    <tr>
      <td>${product.id || ''}</td>
      <td>${product.name || ''}</td>
      <td>${product.code || ''}</td>
      <td>${product.category || ''}</td>
      <td>${product.collection || ''}</td>
      <td>${product.price || ''}</td>
      <td>${product.oldPrice || ''}</td>
      <td>${product.stock || ''}</td>
      <td>${product.quantity || ''}</td>
      <td>${product.visibility || ''}</td>
      <td>${product.condition || ''}</td>
      <td>${product.availability || ''}</td>
      <td>${(product.tags || []).join(', ')}</td>
      <td>${(product.sizeOptions || product.sizes || []).join(', ')}</td>
      <td>${(product.colorOptions || product.colors || []).join(', ')}</td>
      <td>${product.slug || ''}</td>
      <td>${product.barcode || ''}</td>
      <td>${product.featured ? 'Yes' : ''}</td>
      <td>${product.bestSeller ? 'Yes' : ''}</td>
      <td>${product.newArrival ? 'Yes' : ''}</td>
      <td>${product.sale ? 'Yes' : ''}</td>
      <td>${product.description || ''}</td>
      <td>${(product.images || []).map((img) => img.url).join(' | ')}</td>
    </tr>
  `).join('');

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="UTF-8">
      </head>
      <body>
        <table>
          <thead>
            <tr>
              <th>ID</th><th>Name</th><th>SKU</th><th>Category</th><th>Collection</th><th>Price</th><th>Old Price</th><th>Stock</th><th>Quantity</th><th>Visibility</th><th>Condition</th><th>Availability</th><th>Tags</th><th>Sizes</th><th>Colors</th><th>Slug</th><th>Barcode</th><th>Featured</th><th>Best Seller</th><th>New Arrival</th><th>Sale</th><th>Description</th><th>Images</th>
            </tr>
          </thead>
          <tbody>
            ${htmlRows}
          </tbody>
        </table>
      </body>
    </html>
  `;

  const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `bindaud-products-${new Date().toISOString().slice(0, 10)}.xls`;
  link.click();
  URL.revokeObjectURL(url);
  Notifier.success('Products exported as Excel.');
};

const importProductsFromCsv = async (file) => {
  if (!file) {
    Notifier.error('Please choose a valid CSV file');
    return;
  }

  LoadingIndicator.show('Importing products...');

  try {
    const text = await file.text();
    const rows = text.trim().split(/\r?\n/).filter(Boolean);
    const [header, ...lines] = rows;
    const columns = header.split(',').map((cell) => cell.replace(/"/g, '').trim());

    const imported = lines.map((line) => {
      const values = line.split(',').map((cell) => cell.replace(/"/g, '').trim());
      const item = columns.reduce((acc, column, index) => {
        acc[column] = values[index] || '';
        return acc;
      }, {});
      return {
        id: item.ID || createProductId(),
        name: item.Name || 'Imported Product',
        code: item.SKU || '',
        category: item.Category || 'Essentials',
        collection: item.Collection || 'tees',
        price: Number(item.Price) || 0,
        oldPrice: Number(item['Old Price']) || 0,
        stock: item.Stock || 'In Stock',
        quantity: Number(item.Quantity) || 0,
        visibility: item.Visibility || 'Public',
        condition: item.Condition || 'New',
        availability: item.Availability || 'Available',
        tags: item.Tags ? item.Tags.split('|').map((value) => value.trim()).filter(Boolean) : [],
        sizeOptions: item.Sizes ? item.Sizes.split('|').map((value) => value.trim()).filter(Boolean) : [],
        colorOptions: item.Colors ? item.Colors.split('|').map((value) => value.trim()).filter(Boolean) : [],
        slug: item.Slug || generateSlugFromName(item.Name),
        barcode: item.Barcode || '',
        featured: item.Featured === 'Yes',
        bestSeller: item['Best Seller'] === 'Yes',
        newArrival: item['New Arrival'] === 'Yes',
        sale: item.Sale === 'Yes',
        description: item.Description || '',
        images: item.Images ? item.Images.split('|').map((url) => ({ id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, url: url.trim(), name: url.trim(), isCover: false })) : []
      };
    });

    const state = getAdminState();
    state.products = [...imported, ...state.products];
    saveAdminState(state);
    await renderProducts();
    Notifier.success('Products imported successfully.');
  } catch (error) {
    Notifier.error(`Product import failed: ${error.message}`);
  } finally {
    LoadingIndicator.hide();
  }
};

// Render functions (existing)
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
  conditionDropdown?.setValue(product?.condition || 'New');
  availabilityDropdown?.setValue(product?.availability || 'Available');
  visibilityDropdown?.setValue(product?.visibility || 'Public');

  // Size and color selectors
  sizeSelector?.setValue(product?.sizeOptions || product?.sizes || []);
  colorPicker?.setValue(product?.colorOptions || product?.colors || []);

  // Checkboxes
  select('#featured-toggle', form).checked = Boolean(product?.featured);
  select('#trending-toggle', form).checked = Boolean(product?.trending);
  select('#best-seller-toggle', form).checked = Boolean(product?.bestSeller);
  select('#new-arrival-toggle', form).checked = Boolean(product?.newArrival);
  select('#sale-toggle', form).checked = Boolean(product?.sale);
  select('#visibility-toggle', form).checked = Boolean(product?.visibility === 'Hidden');

  // SEO fields
  select('#product-seo-title', form).value = product?.seoTitle || '';
  select('#product-meta-description', form).value = product?.metaDescription || '';
  select('#product-slug', form).value = product?.slug || '';
  select('#product-barcode', form).value = product?.barcode || '';
  select('#product-og-image', form).value = product?.ogImage || '';

  // Image uploader
  imageUploader?.clear();
  const imagesToLoad = (product?.images && Array.isArray(product.images) && product.images.length)
    ? product.images
    : product?.image ? [{ url: product.image, name: `${product.name || 'Product'} cover`, isCover: true }] : [];

  if (imagesToLoad.length) {
    imageUploader?.loadImages(imagesToLoad);
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

};

const getFilteredProducts = (products) => {
  const searchValue = (select('#product-search')?.value || '').trim().toLowerCase();
  const categoryValue = select('#product-category-filter')?.value || 'all';
  const stockValue = select('#product-stock-filter')?.value || 'all';
  const visibilityValue = select('#product-visibility-filter')?.value || 'all';
  let filtered = [...products];

  if (searchValue) {
    filtered = filtered.filter((product) =>
      `${product.name || ''} ${product.code || ''} ${product.category || ''} ${product.collection || ''} ${(product.tags || []).join(' ')}`
        .toLowerCase()
        .includes(searchValue)
    );
  }

  if (categoryValue !== 'all') {
    filtered = filtered.filter((product) => product.category === categoryValue);
  }

  if (stockValue !== 'all') {
    filtered = filtered.filter((product) => product.stock === stockValue);
  }

  if (visibilityValue !== 'all') {
    filtered = filtered.filter((product) => product.visibility === visibilityValue);
  }

  filtered.sort((a, b) => {
    const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return dateB - dateA;
  });

  return filtered;
};

const renderProductPagination = (totalPages, currentPage) => {
  const pagination = select('#product-pagination');
  if (!pagination) return;

  if (totalPages <= 1) {
    pagination.innerHTML = '';
    return;
  }

  pagination.innerHTML = `
    <div class="pagination-controls">
      <button type="button" class="btn btn-ghost btn-sm" id="product-page-prev" ${currentPage === 1 ? 'disabled' : ''}>Previous</button>
      <span class="pagination-summary">Page ${currentPage} of ${totalPages}</span>
      <button type="button" class="btn btn-ghost btn-sm" id="product-page-next" ${currentPage === totalPages ? 'disabled' : ''}>Next</button>
    </div>
  `;
};

const updateProductBulkUI = () => {
  const bulkActions = select('#product-bulk-actions');
  const bulkCount = select('#product-bulk-count');
  if (!bulkActions || !bulkCount) return;
  const count = selectedProductIds.size;
  bulkCount.textContent = `${count} product${count === 1 ? '' : 's'} selected`;
  bulkActions.style.display = count ? 'flex' : 'none';
};

const renderProducts = async () => {
  const products = await getProducts();
  const list = select('#product-list');
  if (!list) return;

  if (!products.length) {
    list.innerHTML = '<p class="admin-empty">No products available.</p>';
    renderProductPagination(0, 1);
    updateProductBulkUI();
    return;
  }

  const filteredProducts = getFilteredProducts(products);
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE));
  productPage = Math.min(productPage, totalPages);
  const startIndex = (productPage - 1) * PRODUCTS_PER_PAGE;
  const pageProducts = filteredProducts.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);

  if (!pageProducts.length) {
    list.innerHTML = '<p class="admin-empty">No matching products found.</p>';
    renderProductPagination(totalPages, productPage);
    updateProductBulkUI();
    return;
  }

  list.innerHTML = pageProducts.map((product) => {
    const imageUrl = product.images?.find((img) => img.isCover)?.url || product.image || product.images?.[0]?.url || 'assets/products/product1.jpg';
    const coverUrl = imageUrl.startsWith('data:') ? imageUrl : resolveSitePath(imageUrl);
    const tags = (product.tags || []).slice(0, 5).join(', ');

    return `
      <article class="admin-list-item admin-product-card">
        <label class="admin-checkbox product-select">
          <input type="checkbox" data-product-select data-id="${product.id}" ${selectedProductIds.has(product.id) ? 'checked' : ''}>
        </label>
        <div class="admin-product-hero">
          <div class="product-image-wrapper">
            <img src="${coverUrl}" alt="${product.name}" loading="lazy" onerror="this.src='assets/products/product1.jpg'">
          </div>
          <div>
            <strong>${product.name}</strong>
            <p>${product.code || ''} • ${product.category || ''}</p>
            <p>${product.collection || ''}</p>
            <p class="admin-product-tags">${tags}</p>
          </div>
        </div>
        <div class="admin-product-meta">
          <span>${formatAdminCurrency(product.price)}</span>
          <span class="stock-badge ${product.stock === 'In Stock' ? 'in-stock' : 'low-stock'}">${product.stock}</span>
          <span class="stock-badge ${product.visibility === 'Public' ? 'in-stock' : 'low-stock'}">${product.visibility || 'Public'}</span>
        </div>
        <div class="admin-product-actions">
          <button type="button" class="btn btn-ghost btn-sm" data-action="quick-edit" data-id="${product.id}">Quick Edit</button>
          <button type="button" class="btn btn-ghost btn-sm" data-action="copy-link" data-id="${product.id}" data-slug="${product.slug || ''}">Copy Link</button>
          <button type="button" class="btn btn-ghost btn-sm" data-action="edit-product" data-id="${product.id}">Edit</button>
          <button type="button" class="btn btn-danger btn-sm" data-action="delete-product" data-id="${product.id}">Delete</button>
        </div>
      </article>
    `;
  }).join('');

  renderProductPagination(totalPages, productPage);
  updateProductBulkUI();
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

      const uploadedImage = imageUploader?.getFile();
      if (uploadedImage && typeof uploadedImage === 'object' && 'url' in uploadedImage) {
        imageValue = uploadedImage.url || imageValue;
      } else if (uploadedImage instanceof File || uploadedImage instanceof Blob) {
        imageValue = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(uploadedImage);
        });
      }

      const nameValue = String(formData.get('name') || '').trim();
      const priceValue = Number(formData.get('price')) || 0;

      if (!nameValue || priceValue <= 0) {
        Notifier.error('Please enter a valid product name and price.');
        LoadingIndicator.hide();
        return;
      }

      const images = imageUploader?.getValue() || [];
      const coverImage = images.find((item) => item.isCover) || images[0];
      const visibilityState = select('#visibility-toggle')?.checked ? 'Hidden' : 'Public';
      const slugValue = select('#product-slug')?.value || generateSlugFromName(nameValue);
      const barcodeValue = select('#product-barcode')?.value || '';

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
        features: (formData.get('features') || '').split(',').map((f) => f.trim()).filter(Boolean),
        tags: (formData.get('tags') || '').split(',').map((t) => t.trim()).filter(Boolean),
        code: formData.get('code') || '',
        quantity: Number(formData.get('quantity')) || 0,
        featured: Boolean(formData.get('featured')),
        trending: Boolean(formData.get('trending')),
        bestSeller: Boolean(formData.get('bestSeller')),
        newArrival: Boolean(formData.get('newArrival')),
        sale: Boolean(formData.get('sale')),
        visibility: visibilityState,
        condition: select('#product-condition')?.value || 'New',
        availability: select('#product-availability')?.value || 'Available',
        seoTitle: formData.get('seoTitle') || '',
        metaDescription: formData.get('metaDescription') || '',
        slug: slugValue,
        barcode: barcodeValue,
        ogImage: formData.get('ogImage') || '',
        images,
        image: coverImage?.url || imageValue
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

    if (action === 'quick-edit' && productId) {
      const products = await getProducts();
      const product = products.find((p) => p.id === productId);
      if (product) {
        populateProductForm(product);
        Notifier.info('Quick edit mode activated.');
      }
    }

    if (action === 'copy-link' && productId) {
      const slug = event.target.dataset.slug || '';
      const url = slug
        ? `${window.location.origin}/pages/product.html?slug=${encodeURIComponent(slug)}`
        : `${window.location.origin}/pages/product.html?id=${encodeURIComponent(productId)}`;
      await navigator.clipboard.writeText(url);
      Notifier.success('Product link copied to clipboard.');
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
        selectedProductIds.delete(productId);
        Notifier.success('Product deleted successfully!');
        await renderProducts();
        await renderSummary();
      }
    }

    if (event.target.id === 'product-page-prev' || event.target.id === 'product-page-next') {
      const products = await getProducts();
      const filteredProducts = getFilteredProducts(products);
      const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE));
      if (event.target.id === 'product-page-prev' && productPage > 1) {
        productPage -= 1;
        renderProducts();
      }
      if (event.target.id === 'product-page-next' && productPage < totalPages) {
        productPage += 1;
        renderProducts();
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
  const exportOrdersButton = select('#export-orders-btn');
  const productSearch = select('#product-search');
  const productCategoryFilter = select('#product-category-filter');
  const productStockFilter = select('#product-stock-filter');
  const productVisibilityFilter = select('#product-visibility-filter');
  const exportProductsCsvBtn = select('#export-products-csv');
  const exportProductsExcelBtn = select('#export-products-excel');
  const importProductsBtn = select('#import-products-btn');
  const importProductsFile = select('#import-products-file');
  const deleteSelectedProductsBtn = select('#delete-selected-products');

  ordersSearch?.addEventListener('input', renderOrders);
  ordersStatusFilter?.addEventListener('change', renderOrders);
  ordersSort?.addEventListener('change', renderOrders);
  exportOrdersButton?.addEventListener('click', exportOrdersToCsv);

  productSearch?.addEventListener('input', () => { productPage = 1; renderProducts(); });
  productCategoryFilter?.addEventListener('change', () => { productPage = 1; renderProducts(); });
  productStockFilter?.addEventListener('change', () => { productPage = 1; renderProducts(); });
  productVisibilityFilter?.addEventListener('change', () => { productPage = 1; renderProducts(); });
  exportProductsCsvBtn?.addEventListener('click', exportProductsToCsv);
  exportProductsExcelBtn?.addEventListener('click', exportProductsToExcel);
  importProductsBtn?.addEventListener('click', () => importProductsFile?.click());
  importProductsFile?.addEventListener('change', async (e) => {
    if (e.target.files?.[0]) {
      await importProductsFromCsv(e.target.files[0]);
    }
  });
  deleteSelectedProductsBtn?.addEventListener('click', async () => {
    if (!selectedProductIds.size) return;
    const confirmed = await ConfirmDialog.show(
      'Delete Selected Products',
      `Delete ${selectedProductIds.size} selected product${selectedProductIds.size === 1 ? '' : 's'}?`,
      'Delete',
      'Cancel'
    );
    if (!confirmed) return;

    LoadingIndicator.show('Deleting selected products...');
    await Promise.all(Array.from(selectedProductIds).map((id) => deleteProduct(id)));
    selectedProductIds.clear();
    LoadingIndicator.hide();
    Notifier.success('Selected products deleted.');
    await renderProducts();
    await renderSummary();
  });

  // Order status update and product pagination/select handlers
  document.addEventListener('change', async (event) => {
    const orderStatusSelect = event.target.getAttribute('data-order-status');
    if (orderStatusSelect) {
      const newStatus = event.target.value;
      updateOrderStatus(orderStatusSelect, newStatus);
      Notifier.success('Order status updated!');
      return;
    }

    const productCheckbox = event.target.closest('[data-product-select]');
    if (productCheckbox && event.target.type === 'checkbox') {
      const productId = event.target.dataset.id;
      if (productId) {
        if (event.target.checked) {
          selectedProductIds.add(productId);
        } else {
          selectedProductIds.delete(productId);
        }
        updateProductBulkUI();
      }
      return;
    }

    if (event.target.id === 'product-page-prev') {
      const products = await getProducts();
      const filteredProducts = getFilteredProducts(products);
      const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE));
      if (productPage > 1) {
        productPage -= 1;
        renderProducts();
      }
      return;
    }

    if (event.target.id === 'product-page-next') {
      const products = await getProducts();
      const filteredProducts = getFilteredProducts(products);
      const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE));
      if (productPage < totalPages) {
        productPage += 1;
        renderProducts();
      }
      return;
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
