export const PRODUCT_CATALOG = [
  {
    id: 'BD-001',
    name: 'Oversized Dragon Tee',
    image: 'assets/products/product1.jpg',
    price: 2499,
    oldPrice: 3200,
    discount: '22%',
    sizeOptions: ['S', 'M', 'L', 'XL'],
    colorOptions: ['Black', 'Sand'],
    color: 'Black',
    code: 'BD-TEE-001',
    rating: 4.9,
    reviews: 324,
    stock: 'In Stock',
    collection: 'tees',
    badge: 'Best Seller',
    description: 'Legacy meets street culture in the Oversized Dragon Tee. Designed for the modern explorer with premium cotton and a relaxed silhouette.',
    features: ['Premium Cotton', 'Oversized Fit', 'Breathable', 'DTG Print'],
    shipping: 'Free shipping across Pakistan with 3–5 day delivery.',
    returns: 'Return within 7 days for a full refund or exchange.'
  },
  {
    id: 'BD-002',
    name: 'Urban Odyssey Cardigan',
    image: 'assets/products/product2.png',
    price: 1884,
    oldPrice: 2500,
    discount: '25%',
    sizeOptions: ['S', 'M', 'L', 'XL', '2XL'],
    colorOptions: ['Charcoal', 'Navy'],
    color: 'Charcoal',
    code: 'BD-CARD-002',
    rating: 4.8,
    reviews: 9911,
    stock: 'In Stock',
    collection: 'jackets',
    badge: 'New',
    description: 'A luxury cardigan with clean lines, premium texture, and an oversized fit inspired by urban motion and modern craftsmanship.',
    features: ['Premium Knit', 'Oversized Fit', 'Soft Interior', 'Limited Drop'],
    shipping: 'Fast dispatch and tracked delivery to all major cities.',
    returns: 'Comfortable exchanges with original packaging.'
  },
  {
    id: 'BD-003',
    name: 'Premium Kimono',
    image: 'assets/products/product3.png',
    price: 1899,
    oldPrice: 2399,
    discount: '21%',
    sizeOptions: ['S', 'M', 'L', 'XL'],
    colorOptions: ['Ivory', 'Graphite'],
    color: 'Ivory',
    code: 'BD-KIMO-003',
    rating: 4.7,
    reviews: 156,
    stock: 'Low Stock',
    collection: 'kimono',
    badge: 'Limited',
    description: 'A premium kimono that blends heritage-inspired tailoring with a modern streetwear silhouette.',
    features: ['Premium Fabric', 'Layered Design', 'Signature Print', 'Luxury Finish'],
    shipping: 'Secure packing and express delivery available.',
    returns: 'Free returns for unused pieces within 7 days.'
  },
  {
    id: 'BD-004',
    name: 'Crane Kimono',
    image: 'assets/products/product2.png',
    price: 1899,
    oldPrice: 2299,
    discount: '17%',
    sizeOptions: ['M', 'L', 'XL', '2XL'],
    colorOptions: ['Jet Black', 'Stone'],
    color: 'Jet Black',
    code: 'BD-KIMO-004',
    rating: 4.6,
    reviews: 208,
    stock: 'In Stock',
    collection: 'kimono',
    badge: 'Best Seller',
    description: 'A sculpted kimono for elevated layering, featuring smooth comfort and a contemporary oversized cut.',
    features: ['Relaxed Silhouette', 'Layer-Friendly', 'Minimal Branding', 'Premium Finish'],
    shipping: 'Tracked shipping and priority handling.',
    returns: 'Easy returns for changed mind orders.'
  },
  {
    id: 'BD-005',
    name: 'Premium Jacket',
    image: 'assets/products/product1.jpg',
    price: 4999,
    oldPrice: 6500,
    discount: '23%',
    sizeOptions: ['S', 'M', 'L', 'XL'],
    colorOptions: ['Olive', 'Graphite'],
    color: 'Olive',
    code: 'BD-JKT-005',
    rating: 4.9,
    reviews: 287,
    stock: 'In Stock',
    collection: 'jackets',
    badge: 'Best Seller',
    description: 'Constructed for seasonless performance and a luxury streetwear look, this jacket is built to stand out.',
    features: ['Weather Resistant', 'Soft Lining', 'Refined Trim', 'Luxury Finish'],
    shipping: 'Fast metro city delivery and secure packaging.',
    returns: 'Return within 7 days in original condition.'
  },
  {
    id: 'BD-006',
    name: 'Limited Edition',
    image: 'assets/products/product3.png',
    price: 5999,
    oldPrice: 7800,
    discount: '23%',
    sizeOptions: ['S', 'M', 'L', 'XL', '2XL'],
    colorOptions: ['Midnight', 'Cream'],
    color: 'Midnight',
    code: 'BD-LTD-006',
    rating: 4.8,
    reviews: 156,
    stock: 'In Stock',
    collection: 'tees',
    badge: 'New',
    description: 'A limited release that merges artistry with tailored comfort for an iconic wardrobe statement.',
    features: ['Collector Drop', 'Soft Cotton', 'Refined Detail', 'Premium Finish'],
    shipping: 'Fast delivery and tracking on every order.',
    returns: 'Hassle-free return policy for unopened pieces.'
  }
];

export const resolveSitePath = (path) => {
  const normalizedPath = path.replace(/^\.\//, '').replace(/^\//, '');
  const prefix = window.location.pathname.includes('/pages/') ? '../' : './';
  return new URL(`${prefix}${normalizedPath}`, window.location.href).href;
};

export const formatCurrency = (value) => `PKR ${Number(value).toLocaleString('en-PK')}`;

export const parsePrice = (value) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    return Number(value.replace(/[^\d.]/g, '')) || 0;
  }
  return 0;
};

export const clampQuantity = (value, min = 1, max = 20) => Math.min(max, Math.max(min, Number(value) || min));

export const getQueryParam = (key) => {
  const params = new URLSearchParams(window.location.search);
  return params.get(key);
};

export const createElement = (tag, options = {}) => {
  const element = document.createElement(tag);
  Object.entries(options).forEach(([key, value]) => {
    if (key === 'class') element.className = value;
    else if (key === 'text') element.textContent = value;
    else if (key === 'html') element.innerHTML = value;
    else if (key === 'attrs') {
      Object.entries(value).forEach(([attr, attrValue]) => element.setAttribute(attr, attrValue));
    }
  });
  return element;
};

export const buildProductLink = (productId) => {
  const link = resolveSitePath('pages/product.html');
  return `${link}${link.includes('?') ? '&' : '?'}id=${encodeURIComponent(productId)}`;
};
