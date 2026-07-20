/**
 * Production-ready Product API Client
 * Handles all product CRUD operations with MongoDB backend
 * All products are persisted and visible to all users
 */

const resolveApiBase = () => {
  if (typeof window !== 'undefined' && window.BINDAUD_CONFIG?.api?.base) {
    return window.BINDAUD_CONFIG.api.base;
  }

  if (typeof window !== 'undefined' && window.BINDAUD_CONFIG?.api?.adminBase) {
    return window.BINDAUD_CONFIG.api.adminBase.replace(/\/admin$/, '');
  }

  return '/api';
};

const API_BASE = resolveApiBase();

export const productAPI = {
  /**
   * Fetch all products from backend (public endpoint)
   * Available to all visitors without authentication
   */
  async getAllProducts() {
    try {
      const response = await fetch(`${API_BASE}/products`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.statusText}`);
      }

      const data = await response.json();
      return Array.isArray(data.products)
        ? data.products
        : Array.isArray(data.data)
          ? data.data
          : Array.isArray(data)
            ? data
            : [];
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  },

  /**
   * Fetch single product by ID
   */
  async getProductById(id) {
    try {
      const response = await fetch(`${API_BASE}/products/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch product: ${response.statusText}`);
      }

      const data = await response.json();
      return data.product || data.data || data;
    } catch (error) {
      console.error(`Error fetching product ${id}:`, error);
      return null;
    }
  },

  /**
   * Create new product (admin only)
   * Stores in MongoDB with Cloudinary images
   */
  async createProduct(productData, token) {
    if (!token) {
      throw new Error('Authentication required to create products');
    }

    const formData = new FormData();

    // Add product fields
    Object.keys(productData).forEach((key) => {
      if (key === 'images' && Array.isArray(productData[key])) {
        productData[key].forEach((file, index) => {
          if (file instanceof File) {
            formData.append('images', file);
          }
        });
      } else if (key !== 'video') {
        formData.append(key, typeof productData[key] === 'object' ? JSON.stringify(productData[key]) : productData[key]);
      }
    });

    try {
      const response = await fetch(`${API_BASE}/admin/products`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create product');
      }

      const data = await response.json();
      return data.product || data.data || data;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  },

  /**
   * Update existing product (admin only)
   */
  async updateProduct(id, productData, token) {
    if (!token) {
      throw new Error('Authentication required to update products');
    }

    const formData = new FormData();

    Object.keys(productData).forEach((key) => {
      if (key === 'images' && Array.isArray(productData[key])) {
        productData[key].forEach((file, index) => {
          if (file instanceof File) {
            formData.append('images', file);
          }
        });
      } else if (key !== 'video') {
        formData.append(key, typeof productData[key] === 'object' ? JSON.stringify(productData[key]) : productData[key]);
      }
    });

    try {
      const response = await fetch(`${API_BASE}/admin/products/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update product');
      }

      const data = await response.json();
      return data.product || data.data || data;
    } catch (error) {
      console.error(`Error updating product ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete product (admin only)
   */
  async deleteProduct(id, token) {
    if (!token) {
      throw new Error('Authentication required to delete products');
    }

    try {
      const response = await fetch(`${API_BASE}/admin/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete product');
      }

      return await response.json();
    } catch (error) {
      console.error(`Error deleting product ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get admin products (with full metadata)
   */
  async getAdminProducts(token) {
    if (!token) {
      throw new Error('Authentication required');
    }

    try {
      const response = await fetch(`${API_BASE}/admin/products`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch admin products: ${response.statusText}`);
      }

      const data = await response.json();
      return Array.isArray(data.products)
        ? data.products
        : Array.isArray(data.data)
          ? data.data
          : Array.isArray(data)
            ? data
            : [];
    } catch (error) {
      console.error('Error fetching admin products:', error);
      return [];
    }
  },

  /**
   * Search products
   */
  async searchProducts(query) {
    try {
      const response = await fetch(`${API_BASE}/products?search=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();
      return Array.isArray(data.products)
        ? data.products
        : Array.isArray(data.data)
          ? data.data
          : Array.isArray(data)
            ? data
            : [];
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  }
};

export default productAPI;
