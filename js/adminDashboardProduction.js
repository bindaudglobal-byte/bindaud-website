/**
 * Production Admin Dashboard Initializer
 * Connects to MongoDB backend via Express API
 * Syncs products across all users in real-time
 * Handles image uploads via Cloudinary
 */

import productAPI from './productAPI.js';
import { themeManager } from './themeManager.js';

export const initProductionAdminDashboard = async () => {
  // Ensure theme is initialized
  themeManager.init();

  const container = document.getElementById('product-list');
  if (!container) return;

  // Load products from MongoDB backend
  try {
    const token = localStorage.getItem('bindaud-admin-token');
    const products = await productAPI.getAdminProducts(token || '');

    if (Array.isArray(products) && products.length > 0) {
      renderProductsFromBackend(products);
    } else {
      container.innerHTML = '<p class="admin-empty">No products available. Create your first product!</p>';
    }
  } catch (error) {
    console.error('Failed to load products from backend:', error);
    container.innerHTML = `<p class="admin-empty" style="color: #f87171;">Error loading products: ${error.message}</p>`;
  }
};

const renderProductsFromBackend = (products) => {
  const container = document.getElementById('product-list');
  if (!container) return;

  if (!Array.isArray(products) || products.length === 0) {
    container.innerHTML = '<p class="admin-empty">No products found.</p>';
    return;
  }

  container.innerHTML = products.map((product) => {
    const imageUrl = product.images?.[0]?.url || 'assets/products/product1.jpg';
    const tags = (product.tags || []).slice(0, 3).join(', ');

    return `
      <article class="admin-list-item admin-product-card">
        <div class="admin-product-hero">
          <div class="product-image-wrapper">
            <img src="${imageUrl}" alt="${product.name}" loading="lazy" onerror="this.src='assets/products/product1.jpg'">
          </div>
          <div>
            <strong>${product.name}</strong>
            <p>${product.category || 'Uncategorized'}</p>
            <p class="admin-product-tags">${tags}</p>
          </div>
        </div>
        <div class="admin-product-meta">
          <span>PKR ${Number(product.price || 0).toLocaleString()}</span>
          <span class="stock-badge ${product.stock > 0 ? 'in-stock' : 'low-stock'}">${product.stock > 0 ? 'In Stock' : 'Out of Stock'}</span>
          <span class="stock-badge ${product.isActive ? 'in-stock' : 'low-stock'}">${product.isActive ? 'Active' : 'Inactive'}</span>
        </div>
        <div class="admin-product-actions">
          <button type="button" class="btn btn-ghost btn-sm" data-action="edit-product" data-id="${product._id}">Edit</button>
          <button type="button" class="btn btn-danger btn-sm" data-action="delete-product" data-id="${product._id}">Delete</button>
        </div>
      </article>
    `;
  }).join('');

  // Add event listeners
  container.querySelectorAll('[data-action="edit-product"]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const productId = e.target.dataset.id;
      editProductFromBackend(productId);
    });
  });

  container.querySelectorAll('[data-action="delete-product"]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const productId = e.target.dataset.id;
      const confirmed = confirm('Are you sure you want to delete this product?');
      if (!confirmed) return;

      try {
        const token = localStorage.getItem('bindaud-admin-token');
        await productAPI.deleteProduct(productId, token);
        initProductionAdminDashboard();
      } catch (error) {
        alert('Failed to delete product: ' + error.message);
      }
    });
  });
};

const editProductFromBackend = async (productId) => {
  try {
    const token = localStorage.getItem('bindaud-admin-token');
    const product = await productAPI.getProductById(productId);
    
    // Populate form with product data
    const form = document.getElementById('product-form');
    if (form) {
      form.querySelector('[name="id"]').value = product._id;
      form.querySelector('[name="name"]').value = product.name;
      form.querySelector('[name="price"]').value = product.price;
      form.querySelector('[name="salePrice"]').value = product.salePrice || 0;
      form.querySelector('[name="description"]').value = product.description;
      form.querySelector('[name="sizes"]').value = Array.isArray(product.sizes) ? product.sizes.join(', ') : '';
      form.querySelector('[name="colors"]').value = Array.isArray(product.colors) ? product.colors.join(', ') : '';
      form.querySelector('[name="stock"]').value = product.stock || 0;
      form.querySelector('[name="featured"]').checked = Boolean(product.featured);
      form.querySelector('[name="bestSeller"]').checked = Boolean(product.bestSeller);
      
      // Update submit button text
      const submitBtn = form.querySelector('[type="submit"]');
      if (submitBtn) submitBtn.textContent = 'Update Product';

      // Scroll to form
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  } catch (error) {
    alert('Failed to load product: ' + error.message);
  }
};

export default initProductionAdminDashboard;
