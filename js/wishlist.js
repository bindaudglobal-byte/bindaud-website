import { PRODUCT_CATALOG, resolveSitePath } from './helpers.js';
import { requestFrame } from './performance.js';

const WISHLIST_KEY = 'binDaudWishlist';

const read = () => {
  try {
    return JSON.parse(localStorage.getItem(WISHLIST_KEY)) || [];
  } catch (e) {
    return [];
  }
};

const write = (value) => {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(value));
  window.dispatchEvent(new Event('storage'));
};

export const getWishlist = () => read();

export const isInWishlist = (productId) => {
  const list = read();
  return list.some((p) => p.id === productId);
};

export const toggleWishlist = (productOrId) => {
  const list = read();
  const id = typeof productOrId === 'string' ? productOrId : (productOrId && productOrId.id);

  if (!id) return null;

  const existingIndex = list.findIndex((p) => p.id === id);
  if (existingIndex >= 0) {
    list.splice(existingIndex, 1);
    write(list);
    return { action: 'removed', id };
  }

  // attempt to find product details from catalog
  const product = typeof productOrId === 'string' ? PRODUCT_CATALOG.find((p) => p.id === id) : productOrId;

  const entry = {
    id: product?.id || id,
    name: product?.name || 'Unknown product',
    price: product?.price || 0,
    image: product?.image || 'assets/products/product1.jpg',
    code: product?.code || '',
    addedAt: new Date().toISOString()
  };

  list.unshift(entry);
  write(list);
  return { action: 'added', item: entry };
};

export const clearWishlist = () => {
  write([]);
};

export const initWishlist = () => {
  if (window.__BINDAUD_WISHLIST_INITIALIZED) return;
  window.__BINDAUD_WISHLIST_INITIALIZED = true;

  const updateBadges = () => {
    const count = getWishlist().length;
    requestFrame(() => {
      document.querySelectorAll('#wishlist-count, .wishlist-count-badge').forEach((el) => {
        el.textContent = count;
        el.style.display = count > 0 ? 'inline-flex' : 'none';
      });
    });
  };

  updateBadges();
  window.addEventListener('storage', updateBadges, { passive: true });
};

export const renderWishlistPage = (container) => {
  if (!container) return;
  const list = getWishlist();
  if (!list.length) {
    container.innerHTML = '<p class="empty-state">Your wishlist is empty.</p>';
    return;
  }

  requestFrame(() => {
    container.innerHTML = list.map((item) => `
      <article class="wishlist-item">
        <img src="${resolveSitePath(item.image)}" alt="${item.name}" loading="lazy" decoding="async" width="96" height="96">
        <div>
          <h3>${item.name}</h3>
          <p>${item.code}</p>
          <strong>PKR ${Number(item.price).toLocaleString('en-PK')}</strong>
        </div>
        <div class="wishlist-actions">
          <button data-id="${item.id}" class="btn btn-ghost remove-wishlist">Remove</button>
          <a href="${new URL('./pages/product.html', window.location.href).href}?id=${encodeURIComponent(item.id)}" class="btn btn-primary">View</a>
        </div>
      </article>
    `).join('');

    container.querySelectorAll('.remove-wishlist').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        toggleWishlist(id);
        renderWishlistPage(container);
      });
    });
  });
};
