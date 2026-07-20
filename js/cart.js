import {
  PRODUCT_CATALOG,
  resolveSitePath,
  formatCurrency,
  parsePrice,
  clampQuantity,
  getQueryParam,
  buildProductLink
} from './helpers.js';
import { getProducts, getProductById, normalizeProduct } from './api.js';
import {
  addToCart,
  calculateCartTotals,
  clearCoupon,
  getAppliedCoupon,
  getCart,
  getCartCount,
  removeCartItem,
  saveCart,
  setCoupon,
  updateCartQuantity
} from './cartStorage.js';
import { showToast } from './toast.js';
import { createOrder, recordProductView } from './adminStorage.js';
import { initNewsletter } from './newsletter.js';
import { initSearch } from './search.js';
import { initWishlist, toggleWishlist, isInWishlist } from './wishlist.js';
import { queueOrderEmail } from './email.js';
import { debounce, requestFrame } from './performance.js';

const select = (selector, parent = document) => parent.querySelector(selector);
const selectAll = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));
let activeCatalog = [...PRODUCT_CATALOG];

const setCatalog = (products) => {
  activeCatalog = Array.isArray(products) ? products : [...PRODUCT_CATALOG];
  window.__BINDAUD_PRODUCTS = activeCatalog;
  return activeCatalog;
};

export const getCatalogProducts = () => activeCatalog;

export const initSite = async () => {
  if (window.__BINDAUD_SITE_INITIALIZED) return;
  window.__BINDAUD_SITE_INITIALIZED = true;

  updateCartBadge();
  initStickyHeader();
  initMobileMenu();
  initNewsletter();
  initSearch();
  initWishlist();

  if (document.querySelector('.product-details-section')) {
    initProductGallery();
    initProductTabs();
    initProductQuantityControls();
    await populateProductPage();
  }

  if (document.querySelector('.shop-products-grid')) {
    await renderShopPage();
  }

  if (document.querySelector('#collections-shell')) {
    await initCollectionsPage();
  }

  if (document.querySelector('.cart-layout')) {
    initCartPage();
  }

  if (document.querySelector('.checkout-page')) {
    initCheckoutPage();
  }

  window.addEventListener('cart:updated', updateCartBadge, { passive: true });
  window.addEventListener('storage', updateCartBadge, { passive: true });
  window.addEventListener('catalog:updated', async () => {
    if (document.querySelector('.shop-products-grid')) {
      await renderShopPage();
    }

    if (document.querySelector('.product-details-section')) {
      await populateProductPage();
    }
  }, { passive: true });
};

export const loadProductCatalog = async () => {
  if (window.__BINDAUD_PRODUCTS?.length) {
    activeCatalog = window.__BINDAUD_PRODUCTS.map((product) => normalizeProduct(product));
    return activeCatalog;
  }

  try {
    const adminStateRaw = window.localStorage.getItem('bindaud_admin_state');
    if (adminStateRaw) {
      const adminState = JSON.parse(adminStateRaw);
      if (Array.isArray(adminState?.products) && adminState.products.length) {
        return setCatalog(adminState.products.map(normalizeProduct));
      }
    }
  } catch (error) {
    console.warn('Admin catalog load failed:', error.message);
  }

  try {
    const catalogResponse = await fetch(resolveSitePath('data/products.json'));
    if (catalogResponse.ok) {
      const catalogData = await catalogResponse.json();
      if (Array.isArray(catalogData.products) && catalogData.products.length) {
        return setCatalog(catalogData.products.map(normalizeProduct));
      }
    }
  } catch (error) {
    console.warn('Static catalog load failed:', error.message);
  }

  try {
    const products = await getProducts({ limit: 50 });
    if (!Array.isArray(products) || products.length === 0) {
      console.warn('Backend returned no products, falling back to static catalog');
      return setCatalog([...PRODUCT_CATALOG]);
    }
    return setCatalog(products.map(normalizeProduct));
  } catch (error) {
    console.warn('Falling back to static catalog:', error.message);
    return setCatalog([...PRODUCT_CATALOG]);
  }
};

export const updateCartBadge = () => {
  const badgeElements = selectAll('#cart-count');
  const count = getCartCount();

  badgeElements.forEach((badge) => {
    badge.textContent = count;
    badge.classList.toggle('has-items', count > 0);
    badge.style.display = count > 0 ? 'inline-flex' : 'inline-flex';
  });
};

export const initStickyHeader = () => {
  const header = select('.site-header');
  if (!header) return;

  const toggleSticky = () => {
    header.classList.toggle('is-sticky', window.scrollY > 20);
  };

  toggleSticky();
  window.addEventListener('scroll', toggleSticky, { passive: true });
};

export const initMobileMenu = () => {
  const navToggle = select('#nav-toggle');
  const navLinks = selectAll('.primary-nav .nav-link');
  const header = select('.site-header');

  if (!navToggle || navLinks.length === 0) return;

  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 900 && navToggle.checked) {
        navToggle.checked = false;
        header?.classList.remove('menu-open');
      }
    });
  });

  navToggle.addEventListener('change', () => {
    header?.classList.toggle('menu-open', navToggle.checked);
  });
};

export const initProductGallery = () => {
  const productPage = select('.product-details-section');
  if (!productPage) return;

  const mainImage = select('#main-product-image', productPage);
  const thumbnails = selectAll('.thumbnail-item', productPage);

  if (!mainImage || thumbnails.length === 0) return;

  thumbnails.forEach((thumb) => {
    thumb.addEventListener('click', () => {
      const nextImage = thumb.dataset.image;
      if (!nextImage || thumb.classList.contains('active')) return;
      thumbnails.forEach((item) => item.classList.remove('active'));
      thumb.classList.add('active');

      requestFrame(() => {
        mainImage.style.opacity = '0.5';
        mainImage.src = nextImage;
        mainImage.style.opacity = '1';
      });
    });
  });
};

export const initProductTabs = () => {
  const productPage = select('.product-details-section');
  if (!productPage) return;

  const tabLinks = selectAll('.tab-link', productPage);
  const tabContents = selectAll('.tab-content', productPage);

  if (tabLinks.length === 0 || tabContents.length === 0) return;

  tabLinks.forEach((link) => {
    link.addEventListener('click', () => {
      const target = link.dataset.tab;
      if (!target) return;
      tabLinks.forEach((item) => item.classList.remove('active'));
      link.classList.add('active');
      tabContents.forEach((content) => {
        content.classList.toggle('active', content.id === target);
      });
    });
  });
};

export const initProductQuantityControls = () => {
  const productPage = select('.product-details-section');
  if (!productPage) return;

  const quantityInput = select('.quantity-input input', productPage);
  const decreaseBtn = select('.quantity-btn[aria-label="Decrease quantity"]', productPage);
  const increaseBtn = select('.quantity-btn[aria-label="Increase quantity"]', productPage);

  if (!quantityInput || !decreaseBtn || !increaseBtn) return;

  decreaseBtn.addEventListener('click', () => {
    quantityInput.value = clampQuantity(Number(quantityInput.value) - 1);
  });

  increaseBtn.addEventListener('click', () => {
    quantityInput.value = clampQuantity(Number(quantityInput.value) + 1);
  });

  quantityInput.addEventListener('change', () => {
    quantityInput.value = clampQuantity(quantityInput.value);
  });
};

export const populateProductPage = async () => {
  const productPage = select('.product-details-section');
  if (!productPage) return;

  const catalog = await loadProductCatalog();
  const productId = getQueryParam('id') || catalog[0]?.id;
  const product = catalog.find((item) => item.id === productId) || catalog[0] || PRODUCT_CATALOG[0];

  const title = select('.product-main-title', productPage);
  const price = select('.current-price', productPage);
  const oldPrice = select('.old-price', productPage);
  const saveBadge = select('.save-badge', productPage);
  const ratingValue = select('.rating-value', productPage);
  const customerCount = select('.customer-count', productPage);
  const metaDetails = select('.product-meta-details', productPage);
  const description = select('#description', productPage);
  const features = select('#features', productPage);
  const shipping = select('#shipping', productPage);
  const returns = select('#returns', productPage);
  const mainImage = select('#main-product-image', productPage);
  const thumbnails = selectAll('.thumbnail-item', productPage);
  const addButton = select('.product-actions .btn-primary', productPage);
  const wishlistButton = select('.btn-wishlist', productPage);
  const quantityInput = select('.quantity-input input', productPage);

  if (title) title.textContent = product.name;
  if (price) price.textContent = formatCurrency(product.price);
  if (oldPrice) oldPrice.textContent = formatCurrency(product.oldPrice);
  if (saveBadge) saveBadge.textContent = `Save ${product.discount}`;
  if (ratingValue) ratingValue.textContent = product.rating.toFixed(1);
  if (customerCount) customerCount.textContent = `${product.reviews.toLocaleString()}+ Customers`;
  if (metaDetails) {
    metaDetails.innerHTML = `
      <p><strong>Product Code:</strong> ${product.code}</p>
      <p><strong>Availability:</strong> <span class="in-stock">${product.stock}</span></p>
      <p>✓ Free Shipping</p>
      <p>✓ Return within 7 Days</p>
    `;
  }

  if (description) description.innerHTML = `<p>${product.description}</p>`;
  if (features) {
    features.innerHTML = `<ul class="feature-list">${product.features.map((feature) => `<li>${feature}</li>`).join('')}</ul>`;
  }
  if (shipping) shipping.innerHTML = `<p>${product.shipping}</p>`;
  if (returns) returns.innerHTML = `<p>${product.returns}</p>`;

  if (mainImage) {
    mainImage.src = resolveSitePath(product.image);
    mainImage.alt = product.name;
  }

  recordProductView(product.id);

  const thumbnailProducts = catalog.length > 0 ? catalog : PRODUCT_CATALOG;
  thumbnails.forEach((thumb, index) => {
    const thumbImage = thumb.querySelector('img');
    if (!thumbImage) return;
    const fallbackProduct = thumbnailProducts[(index + 1) % thumbnailProducts.length];
    const imagePath = fallbackProduct?.image || product.image;
    thumb.dataset.image = resolveSitePath(imagePath);
    thumbImage.src = resolveSitePath(imagePath);
    thumbImage.alt = fallbackProduct?.name || product.name;
  });

  if (quantityInput) quantityInput.value = '1';

  if (addButton && !addButton.dataset.bound) {
    addButton.dataset.bound = 'true';
    addButton.addEventListener('click', () => {
      const selectedSize = select('input[name="size"]:checked', productPage)?.value || product.sizeOptions[0];
      const selectedProduct = {
        ...product,
        id: product.id,
        name: product.name,
        price: product.price,
        oldPrice: product.oldPrice,
        size: selectedSize,
        color: product.color,
        quantity: Number(quantityInput?.value || 1),
        code: product.code,
        rating: product.rating,
        reviews: product.reviews,
        stock: product.stock,
        collection: product.collection
      };

      addToCart(selectedProduct);
      showToast(`Added to cart • ${product.name}`);
    });
  }

  if (wishlistButton && !wishlistButton.dataset.bound) {
    wishlistButton.dataset.bound = 'true';
    wishlistButton.addEventListener('click', () => {
      const result = toggleWishlist(product);
      const inList = isInWishlist(product.id);
      showToast(result?.action === 'added' ? `Added to wishlist • ${product.name}` : `Removed from wishlist • ${product.name}`);
      wishlistButton.classList.toggle('is-favorited', inList);
    });
  }
};

const createProductCard = (product) => {
  const card = document.createElement('article');
  card.className = 'product-card';
  card.dataset.productId = product.id;
  card.innerHTML = `
    <div class="product-media product-media--badge">
      <span class="badge badge-hot">${product.badge}</span>
      <img src="${resolveSitePath(product.image)}" alt="${product.name}" loading="lazy" decoding="async" width="360" height="360">
    </div>
    <div class="product-body">
      <h3 class="product-title">${product.name}</h3>
      <div class="product-pricing-stack">
        <div class="product-prices">
          <span class="current-price">${formatCurrency(product.price)}</span>
          <span class="old-price">${formatCurrency(product.oldPrice)}</span>
        </div>
        <span class="product-discount">-${product.discount}</span>
      </div>
      <div class="product-card-actions">
        <button type="button" class="btn btn-ghost btn-sm wishlist-btn" aria-label="Add ${product.name} to wishlist">Wishlist</button>
        <button type="button" class="btn btn-ghost btn-sm add-to-cart-btn" aria-label="Add ${product.name} to cart">Add to Cart</button>
        <a href="${buildProductLink(product.id)}" class="btn btn-primary btn-sm" aria-label="Buy ${product.name}">Buy</a>
      </div>
    </div>
  `;

  const sizeSelect = card.querySelector('[data-role="size"]');
  const colorSelect = card.querySelector('[data-role="color"]');
  const wishlistButton = card.querySelector('.wishlist-btn');
  const addButton = card.querySelector('.add-to-cart-btn');

  if (sizeSelect) sizeSelect.value = product.sizeOptions[0];
  if (colorSelect) colorSelect.value = product.colorOptions[0];

  if (wishlistButton && !wishlistButton.dataset.bound) {
    wishlistButton.dataset.bound = 'true';
    wishlistButton.addEventListener('click', () => {
      const result = toggleWishlist(product);
      const inList = isInWishlist(product.id);
      showToast(result?.action === 'added' ? `Added ${product.name} to wishlist` : `Removed ${product.name} from wishlist`);
      wishlistButton.classList.toggle('is-favorited', inList);
    });
  }

  if (addButton && !addButton.dataset.bound) {
    addButton.dataset.bound = 'true';
    addButton.addEventListener('click', () => {
      const selectedProduct = {
        ...product,
        size: sizeSelect?.value || product.sizeOptions[0],
        color: colorSelect?.value || product.colorOptions[0],
        quantity: 1
      };
      addToCart(selectedProduct);
      showToast(`Added ${product.name} to cart`);
    });
  }

  return card;
};

export const renderShopPage = async () => {
  const grid = select('.shop-products-grid');
  if (!grid) return;

  const filterSelect = select('#filter-collection');
  const sortSelect = select('#sort-by');
  const catalog = await loadProductCatalog();

  const getFilteredProducts = () => {
    const collectionValue = filterSelect?.value || 'all';
    const sortValue = sortSelect?.value || 'featured';

    let filtered = [...catalog];

    if (collectionValue !== 'all') {
      filtered = filtered.filter((product) => product.collection === collectionValue);
    }

    if (sortValue === 'price-asc') {
      filtered.sort((a, b) => a.price - b.price);
    }

    if (sortValue === 'price-desc') {
      filtered.sort((a, b) => b.price - a.price);
    }

    if (sortValue === 'best-selling') {
      filtered.sort((a, b) => b.reviews - a.reviews);
    }

    return filtered;
  };

  const renderProducts = () => {
    const products = getFilteredProducts();
    grid.innerHTML = '';

    products.forEach((product) => {
      grid.appendChild(createProductCard(product));
    });
  };

  renderProducts();
  [filterSelect, sortSelect].forEach((selectField) => {
    selectField?.addEventListener('change', renderProducts);
  });
};

const getCollectionDefinitions = (catalog) => {
  const imageCount = new Set(catalog.map((product) => product.image.split('/').pop())).size;

  return [
    {
      id: 'dragon',
      title: 'Dragon Collection',
      description: `Bold silhouettes and elevated streetwear energy curated from ${imageCount} premium product images.`,
      keywords: ['dragon'],
      collections: []
    },
    {
      id: 'crane',
      title: 'Crane Collection',
      description: 'Minimal structure, refined texture, and graceful layering for an editorial wardrobe statement.',
      keywords: ['crane'],
      collections: []
    },
    {
      id: 'limited',
      title: 'Limited Edition',
      description: 'Collector-driven drops and premium finishing that make every piece feel exceptional.',
      keywords: ['limited'],
      collections: []
    },
    {
      id: 'premium',
      title: 'Premium Streetwear',
      description: 'A modern mix of premium jackets and elevated essentials built for everyday luxury.',
      keywords: ['premium'],
      collections: ['jackets', 'kimono']
    },
    {
      id: 'summer',
      title: 'Summer Collection',
      description: 'Lightweight layers and clean, airy pieces that bring effortless elegance to the season.',
      keywords: ['tee', 'summer'],
      collections: ['tees']
    },
    {
      id: 'new',
      title: 'New Arrivals',
      description: 'Fresh edits with contemporary styling and the latest premium pieces in the BIN DAUD lineup.',
      keywords: [],
      badges: ['New']
    },
    {
      id: 'bestsellers',
      title: 'Best Sellers',
      description: 'The pieces most loved by customers for comfort, quality, and timeless appeal.',
      keywords: [],
      badges: ['Best Seller']
    }
  ];
};

const getProductsForCollection = (definition, catalog) => catalog.filter((product) => {
  const name = product.name.toLowerCase();
  const description = product.description.toLowerCase();
  const badge = product.badge.toLowerCase();

  if (definition.keywords.some((keyword) => name.includes(keyword) || description.includes(keyword))) {
    return true;
  }

  if (definition.badges?.some((badgeName) => badge === badgeName.toLowerCase())) {
    return true;
  }

  if (definition.collections?.some((collectionValue) => product.collection === collectionValue)) {
    return true;
  }

  return false;
});

export const initCollectionsPage = async () => {
  const shell = select('#collections-shell');
  if (!shell) return;

  const catalog = await loadProductCatalog();
  const definitions = getCollectionDefinitions(catalog);
  shell.innerHTML = definitions.map((definition) => {
    const collectionProducts = getProductsForCollection(definition, catalog);
    const featuredImage = collectionProducts[0]?.image || catalog[0]?.image || PRODUCT_CATALOG[0].image;

    return `
      <section class="collection-section" data-collection-id="${definition.id}">
        <div class="collection-hero">
          <div class="collection-hero-copy">
            <span class="collection-pill">Curated edit</span>
            <h2 class="collection-title">${definition.title}</h2>
            <p class="collection-description">${definition.description}</p>
          </div>
          <div class="collection-hero-image">
            <img src="${resolveSitePath(featuredImage)}" alt="${definition.title}" loading="lazy" decoding="async" width="360" height="360">
          </div>
        </div>
        <div class="collection-body">
          <div class="collection-toolbar">
            <div class="collection-filter-group">
              <button type="button" class="collection-filter-btn active" data-filter="all">All</button>
              <button type="button" class="collection-filter-btn" data-filter="tees">Tees</button>
              <button type="button" class="collection-filter-btn" data-filter="kimono">Kimonos</button>
              <button type="button" class="collection-filter-btn" data-filter="jackets">Jackets</button>
            </div>
            <div class="collection-search-row">
              <input type="search" class="collection-search" placeholder="Search this collection" aria-label="Search this collection">
              <select class="collection-sort" aria-label="Sort products">
                <option value="featured">Featured</option>
                <option value="price-asc">Price, low to high</option>
                <option value="price-desc">Price, high to low</option>
                <option value="best-selling">Best selling</option>
              </select>
            </div>
          </div>
          <div class="collection-grid" data-collection-grid></div>
        </div>
      </section>
    `;
  }).join('');

  const collectionSections = selectAll('.collection-section', shell);

  collectionSections.forEach((section) => {
    const collectionId = section.dataset.collectionId;
    const definition = definitions.find((item) => item.id === collectionId);
    const collectionProducts = getProductsForCollection(definition, catalog);
    const grid = select('[data-collection-grid]', section);
    const searchInput = select('.collection-search', section);
    const sortSelect = select('.collection-sort', section);
    const filterButtons = selectAll('.collection-filter-btn', section);

    if (!grid || !definition) return;

    const renderCollectionProducts = () => {
      const activeFilter = section.dataset.activeFilter || 'all';
      const searchValue = searchInput?.value?.trim().toLowerCase() || '';
      const sortValue = sortSelect?.value || 'featured';

      let filtered = [...collectionProducts];

      if (activeFilter !== 'all') {
        filtered = filtered.filter((product) => product.collection === activeFilter);
      }

      if (searchValue) {
        filtered = filtered.filter((product) => `${product.name} ${product.description}`.toLowerCase().includes(searchValue));
      }

      if (sortValue === 'price-asc') filtered.sort((a, b) => a.price - b.price);
      if (sortValue === 'price-desc') filtered.sort((a, b) => b.price - a.price);
      if (sortValue === 'best-selling') filtered.sort((a, b) => b.reviews - a.reviews);

      grid.innerHTML = '';

      if (filtered.length === 0) {
        grid.innerHTML = '<div class="collection-empty">No pieces match this view yet. Try a broader filter.</div>';
        return;
      }

      filtered.forEach((product) => {
        grid.appendChild(createProductCard(product));
      });
    };

    filterButtons.forEach((button) => {
      button.addEventListener('click', () => {
        filterButtons.forEach((item) => item.classList.remove('active'));
        button.classList.add('active');
        section.dataset.activeFilter = button.dataset.filter || 'all';
        renderCollectionProducts();
      });
    });

    searchInput?.addEventListener('input', renderCollectionProducts);
    sortSelect?.addEventListener('change', renderCollectionProducts);
    renderCollectionProducts();
  });
};

export const renderCartPage = () => {
  const cartLayout = select('.cart-layout');
  const itemsColumn = select('.cart-items-column');
  const emptyCart = select('.empty-cart-container');
  const cart = getCart();

  if (!cartLayout || !itemsColumn || !emptyCart) return;

  if (cart.length === 0) {
    cartLayout.style.display = 'none';
    emptyCart.style.display = 'block';
    return;
  }

  cartLayout.style.display = 'grid';
  emptyCart.style.display = 'none';
  itemsColumn.innerHTML = '';

  cart.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'cart-item-card';
    card.dataset.cartItemId = item.cartItemId;
    const subtotal = item.price * item.quantity;

    card.innerHTML = `
      <div class="cart-item-details">
        <div class="cart-item-image">
          <img src="${resolveSitePath(item.image)}" alt="${item.name}" loading="lazy" decoding="async" width="180" height="180">
        </div>
        <div class="cart-item-info">
          <h3 class="cart-item-title">${item.name}</h3>
          <p class="cart-item-meta">Product Code: ${item.code}</p>
          <p class="cart-item-meta">Selected Size: ${item.size}</p>
          <p class="cart-item-meta">Selected Color: ${item.color}</p>
        </div>
        <div class="cart-item-quantity">
          <div class="quantity-input">
            <button type="button" class="quantity-btn decrease-qty" aria-label="Decrease quantity">-</button>
            <input type="number" value="${item.quantity}" min="1" max="20" aria-label="Product quantity" readonly>
            <button type="button" class="quantity-btn increase-qty" aria-label="Increase quantity">+</button>
          </div>
        </div>
        <div class="cart-item-price">
          <span class="current-price">${formatCurrency(subtotal)}</span>
          <span class="old-price">${formatCurrency(item.oldPrice * item.quantity)}</span>
        </div>
        <div class="cart-item-actions">
          <button type="button" class="btn-icon remove-item" aria-label="Remove ${item.name}">🗑️</button>
          <button type="button" class="btn-icon save-later" aria-label="Save ${item.name} for later">🔖</button>
          <button type="button" class="btn-icon wishlist-item" aria-label="Add ${item.name} to wishlist">❤</button>
        </div>
      </div>
      <div class="cart-item-footer">
        <p>✓ Estimated Delivery: 3–5 Business Days</p>
        <span class="badge badge-new">Free Shipping</span>
      </div>
    `;

    const decreaseButton = card.querySelector('.decrease-qty');
    const increaseButton = card.querySelector('.increase-qty');
    const removeButton = card.querySelector('.remove-item');
    const saveLaterButton = card.querySelector('.save-later');
    const wishlistButton = card.querySelector('.wishlist-item');

    decreaseButton?.addEventListener('click', () => {
      updateCartQuantity(item.cartItemId, -1);
      renderCartPage();
      updateCartBadge();
    });

    increaseButton?.addEventListener('click', () => {
      updateCartQuantity(item.cartItemId, 1);
      renderCartPage();
      updateCartBadge();
    });

    removeButton?.addEventListener('click', () => {
      removeCartItem(item.cartItemId);
      renderCartPage();
      updateCartBadge();
      showToast('Removed from cart');
    });

    saveLaterButton?.addEventListener('click', () => {
      removeCartItem(item.cartItemId);
      renderCartPage();
      updateCartBadge();
      showToast('Saved for later');
    });

    wishlistButton?.addEventListener('click', () => {
      const result = toggleWishlist(item.id);
      const inList = isInWishlist(item.id);
      showToast(result?.action === 'added' ? `Added ${item.name} to wishlist` : `Removed ${item.name} from wishlist`);
      wishlistButton.classList.toggle('is-favorited', inList);
    });

    itemsColumn.appendChild(card);
  });

  renderCartSummary();
};

export const renderCartSummary = () => {
  const totals = calculateCartTotals();
  const subtotalElement = select('#summary-subtotal-value');
  const discountElement = select('#summary-discount-value');
  const shippingElement = select('#summary-shipping-value');
  const taxElement = select('#summary-tax-value');
  const grandTotalElement = select('#summary-grand-total-value');
  const couponMessage = select('#coupon-message');

  if (subtotalElement) subtotalElement.textContent = formatCurrency(totals.subtotal);
  if (discountElement) discountElement.textContent = `- ${formatCurrency(totals.discountAmount)}`;
  if (shippingElement) shippingElement.textContent = totals.shipping === 0 ? 'FREE' : formatCurrency(totals.shipping);
  if (taxElement) taxElement.textContent = formatCurrency(totals.tax);
  if (grandTotalElement) grandTotalElement.textContent = formatCurrency(totals.grandTotal);
  if (couponMessage) {
    couponMessage.textContent = totals.coupon ? `Coupon ${totals.coupon} active.` : 'No coupon applied.';
  }
};

export const initCartPage = () => {
  const cartPage = select('.cart-layout');
  if (!cartPage) return;

  renderCartPage();

  const couponForm = select('.coupon-form');
  const couponInput = select('.coupon-input');
  const checkoutButton = select('.summary-actions .btn-primary');
  const continueButton = select('.summary-actions .btn-ghost');

  couponForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const couponResult = setCoupon(couponInput?.value || '');
    renderCartSummary();
    showToast(couponResult.message);
  });

  checkoutButton?.addEventListener('click', () => {
    window.location.href = resolveSitePath('pages/checkout.html');
  });

  continueButton?.addEventListener('click', () => {
    window.location.href = resolveSitePath('pages/shop.html');
  });
};

const getCheckoutCustomerData = (form) => ({
  fullName: select('#checkout-full-name', form)?.value?.trim() || '',
  phone: select('#checkout-phone', form)?.value?.trim() || '',
  email: select('#checkout-email', form)?.value?.trim() || '',
  city: select('#checkout-city', form)?.value?.trim() || '',
  address: select('#checkout-address', form)?.value?.trim() || '',
  postalCode: select('#checkout-postal-code', form)?.value?.trim() || '',
  province: select('#checkout-province', form)?.value?.trim() || '',
  notes: select('#checkout-notes', form)?.value?.trim() || '',
  paymentMethod: select('input[name="paymentMethod"]:checked', form)?.value || 'Cash on Delivery'
});

const buildCheckoutPreviewMarkup = (customer, cart, totals) => {
  const itemList = cart.map((item, index) => `
    <p><strong>${index + 1}.</strong> ${item.name} • Qty ${item.quantity} • ${formatCurrency(item.price * item.quantity)}</p>
  `).join('');

  return `
    <div class="checkout-preview-card">
      <h3>Customer Details</h3>
      <p><strong>Name:</strong> ${customer.fullName || '—'}</p>
      <p><strong>Phone:</strong> ${customer.phone || '—'}</p>
      <p><strong>City:</strong> ${customer.city || '—'}</p>
      <p><strong>Address:</strong> ${customer.address || '—'}</p>
      <p><strong>Payment:</strong> ${customer.paymentMethod}</p>
    </div>
    <div class="checkout-preview-card">
      <h3>Order Snapshot</h3>
      ${itemList || '<p>No items in the cart.</p>'}
      <p><strong>Shipping:</strong> ${totals.shipping === 0 ? 'FREE' : formatCurrency(totals.shipping)}</p>
      <p><strong>Grand Total:</strong> ${formatCurrency(totals.grandTotal)}</p>
    </div>
  `;
};

const buildWhatsAppMessage = (customer, cart, totals) => {
  const lines = [
    '🛍️ *NEW ORDER - BIN DAUD*',
    '━━━━━━━━━━━━━━━━━━━━',
    '👤 Customer Details',
    `Name: ${customer.fullName || '—'}`,
    `Phone: ${customer.phone || '—'}`,
    `City: ${customer.city || '—'}`,
    `Address: ${customer.address || '—'}`,
    `Payment Method: ${customer.paymentMethod}`,
    '━━━━━━━━━━━━━━━━━━━━',
    '🛒 Ordered Items'
  ];

  cart.forEach((item, index) => {
    lines.push(
      `${index + 1}.`,
      `Product: ${item.name}`,
      `Code: ${item.code}`,
      `Size: ${item.size}`,
      `Color: ${item.color}`,
      `Qty: ${item.quantity}`,
      `Price: ${formatCurrency(item.price * item.quantity)}`,
      ''
    );
  });

  lines.push(
    '━━━━━━━━━━━━━━━━━━━━',
    `Subtotal: ${formatCurrency(totals.subtotal)}`,
    `Shipping: ${totals.shipping === 0 ? 'FREE' : formatCurrency(totals.shipping)}`,
    `Grand Total: ${formatCurrency(totals.grandTotal)}`,
    '━━━━━━━━━━━━━━━━━━━━',
    `📝 Notes: ${customer.notes || 'No additional notes.'}`,
    '━━━━━━━━━━━━━━━━━━━━',
    'Thank you for shopping with BIN DAUD ❤️'
  );

  return lines.join('\n');
};

const renderCheckoutSummary = (cart, totals) => {
  const itemList = select('.checkout-items');
  const subtotalElement = select('#checkout-subtotal');
  const discountElement = select('#checkout-discount');
  const shippingElement = select('#checkout-shipping');
  const taxElement = select('#checkout-tax');
  const grandTotalElement = select('#checkout-grand-total');
  const couponBadge = select('#checkout-coupon');
  const submitButton = select('#whatsapp-submit');
  const paymentMessage = select('#payment-method-message');

  if (!itemList) return;

  if (cart.length === 0) {
    itemList.innerHTML = '<p class="empty-state">Your cart is empty. Add a few pieces to continue.</p>';
    submitButton?.setAttribute('disabled', 'true');
    return;
  }

  itemList.innerHTML = cart.map((item) => `
    <article class="checkout-item-card">
      <img src="${resolveSitePath(item.image)}" alt="${item.name}" loading="lazy">
      <div>
        <h3>${item.name}</h3>
        <p>Code: ${item.code}</p>
        <p>Size: ${item.size} • Color: ${item.color}</p>
        <p>Quantity: ${item.quantity}</p>
      </div>
      <strong>${formatCurrency(item.price * item.quantity)}</strong>
    </article>
  `).join('');

  submitButton?.removeAttribute('disabled');
  if (subtotalElement) subtotalElement.textContent = formatCurrency(totals.subtotal);
  if (discountElement) discountElement.textContent = `- ${formatCurrency(totals.discountAmount)}`;
  if (shippingElement) shippingElement.textContent = totals.shipping === 0 ? 'FREE' : formatCurrency(totals.shipping);
  if (taxElement) taxElement.textContent = formatCurrency(totals.tax);
  if (grandTotalElement) grandTotalElement.textContent = formatCurrency(totals.grandTotal);
  if (couponBadge) couponBadge.textContent = totals.coupon ? `Coupon: ${totals.coupon}` : 'No coupon applied';
  if (paymentMessage) {
    const selectedPayment = select('input[name="paymentMethod"]:checked', document.querySelector('.checkout-page'))?.value || 'Cash on Delivery';
    paymentMessage.textContent = `${selectedPayment} selected. We'll confirm the payment step and share banking details after checkout.`;
  }
};

const validateCheckoutForm = (form) => {
  const formErrors = select('#checkout-form-errors', form);
  const validationErrors = [];

  const fields = [
    { id: 'checkout-full-name', name: 'fullName', message: 'Full name is required.' },
    { id: 'checkout-phone', name: 'phone', message: 'Phone number is required.' },
    { id: 'checkout-city', name: 'city', message: 'City is required.' },
    { id: 'checkout-address', name: 'address', message: 'Complete address is required.' }
  ];

  selectAll('.form-field', form).forEach((field) => field.classList.remove('has-error'));
  if (formErrors) formErrors.innerHTML = '';

  fields.forEach(({ id, name, message }) => {
    const field = select(`#${id}`, form);
    const errorElement = select(`[data-error-for="${id}"]`, form);
    const value = field?.value?.trim() || '';

    if (!value) {
      validationErrors.push(message);
      field?.classList.add('has-error');
      if (errorElement) errorElement.textContent = message;
    } else if (errorElement) {
      errorElement.textContent = '';
    }
  });

  if (validationErrors.length > 0 && formErrors) {
    formErrors.innerHTML = `<p>${validationErrors.join('</p><p>')}</p>`;
  }

  return validationErrors.length === 0;
};

export const initCheckoutPage = () => {
  const checkoutPage = select('.checkout-page');
  if (!checkoutPage) return;

  const form = select('#checkout-form');
  const preview = select('#checkout-preview');
  const confirmationModal = select('#checkout-confirmation-modal');
  const confirmYes = select('#confirm-order-yes');
  const confirmNo = select('#confirm-order-no');
  const submitButton = select('#whatsapp-submit');
  const couponForm = select('#checkout-coupon-form');
  const couponInput = select('#checkout-coupon-input');

  const syncCheckoutPreview = () => {
    const cart = getCart();
    const totals = calculateCartTotals(cart);
    const customerData = getCheckoutCustomerData(form);
    renderCheckoutSummary(cart, totals);
    if (preview) preview.innerHTML = buildCheckoutPreviewMarkup(customerData, cart, totals);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form) return;

    const cart = getCart();
    if (cart.length === 0) {
      showToast('Your cart is empty. Add a few pieces to continue.');
      return;
    }

    if (!validateCheckoutForm(form)) {
      showToast('Please complete the required fields before sending your order.');
      return;
    }

    const customerData = getCheckoutCustomerData(form);
    const totals = calculateCartTotals(cart);
    const orderPayload = {
      customerName: customerData.fullName,
      phone: customerData.phone,
      address: customerData.address,
      city: customerData.city,
      products: cart.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        code: item.code
      })),
      total: totals.grandTotal,
      paymentMethod: customerData.paymentMethod
    };

    createOrder(orderPayload);
    queueOrderEmail(customerData, orderPayload, totals);
    const whatsappMessage = buildWhatsAppMessage(customerData, cart, totals);
    const whatsappUrl = `https://wa.me/923288582902?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');

    if (confirmationModal) {
      confirmationModal.hidden = false;
    }
  };

  syncCheckoutPreview();

  form?.addEventListener('input', syncCheckoutPreview);
  form?.addEventListener('change', syncCheckoutPreview);
  form?.addEventListener('submit', handleSubmit);
  submitButton?.addEventListener('click', handleSubmit);

  couponForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const couponResult = setCoupon(couponInput?.value || '');
    syncCheckoutPreview();
    showToast(couponResult.message);
  });

  confirmYes?.addEventListener('click', () => {
    saveCart([]);
    clearCoupon();
    updateCartBadge();
    if (confirmationModal) confirmationModal.hidden = true;
    window.location.href = resolveSitePath('thank-you.html');
  });

  confirmNo?.addEventListener('click', () => {
    if (confirmationModal) confirmationModal.hidden = true;
    showToast('Your cart remains intact.');
  });

  confirmationModal?.addEventListener('click', (event) => {
    if (event.target === confirmationModal) {
      confirmationModal.hidden = true;
    }
  });
};

