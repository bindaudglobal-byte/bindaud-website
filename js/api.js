const DEFAULT_API_BASE_URL = 'http://localhost:5000/api';

const buildApiUrl = (path) => {
  const configuredBase = window.BINDAUD_CONFIG?.apiBaseUrl || window.__BINDAUD_API_URL || DEFAULT_API_BASE_URL;
  const normalizedBase = configuredBase.endsWith('/') ? configuredBase.slice(0, -1) : configuredBase;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
};

const requestJson = async (path, options = {}) => {
  const response = await fetch(buildApiUrl(path), {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
};

export const getProducts = async (params = {}) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  const result = await requestJson(`/products${queryString ? `?${queryString}` : ''}`);
  return result.data || [];
};

export const getProductById = async (productId) => {
  const result = await requestJson(`/products/${productId}`);
  return result.data || null;
};

export const normalizeProduct = (product) => {
  const image = product.images?.[0]?.url || product.image || 'assets/products/product1.jpg';
  const price = Number(product.salePrice && product.salePrice > 0 ? product.salePrice : product.price || 0);
  const oldPrice = Number(product.price || price || 0);
  const discountPercent = oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;
  const sizes = Array.isArray(product.sizes) && product.sizes.length ? product.sizes : ['S', 'M', 'L', 'XL'];
  const colors = Array.isArray(product.colors) && product.colors.length ? product.colors : ['Default'];
  const collectionName = (product.collectionName || product.category?.slug || product.category?.name || 'tees').toLowerCase();

  return {
    id: product._id || product.id,
    _id: product._id || product.id,
    name: product.name,
    image,
    price,
    oldPrice: oldPrice > price ? oldPrice : price + 500,
    discount: discountPercent ? `${discountPercent}%` : '0%',
    sizeOptions: sizes,
    colorOptions: colors,
    color: colors[0],
    code: `BD-${String(product._id || product.id || '').slice(-4).toUpperCase()}`,
    rating: Number(product.rating || 4.8),
    reviews: Array.isArray(product.reviews) ? product.reviews.length : Number(product.reviews || 120),
    stock: Number(product.stock || 0) > 0 ? 'In Stock' : 'Out of Stock',
    collection: collectionName,
    badge: product.bestSeller ? 'Best Seller' : product.featured ? 'New' : 'Featured',
    description: product.description || 'Premium piece crafted for modern streetwear styling.',
    features: [
      'Premium quality',
      'Limited drop',
      'Comfort-first fit',
      'Modern streetwear styling',
    ],
    shipping: 'Free shipping across Pakistan with 3–5 day delivery.',
    returns: 'Return within 7 days for a full refund or exchange.',
    category: product.category,
    images: product.images || [],
    video: product.video || null,
    available: Number(product.stock || 0) > 0,
  };
};
