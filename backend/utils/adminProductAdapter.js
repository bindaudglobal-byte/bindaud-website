const parseList = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }

  return [];
};

const normalizeImages = (value, fallbackUrl = '') => {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'string') {
          return item ? { url: item, publicId: '' } : null;
        }

        if (item && typeof item === 'object') {
          const url = item.url || item.image || '';
          if (!url) return null;
          return {
            url,
            publicId: item.publicId || '',
            isCover: Boolean(item.isCover),
          };
        }

        return null;
      })
      .filter(Boolean);
  }

  if (typeof value === 'string' && value) {
    return [{ url: value, publicId: '' }];
  }

  if (fallbackUrl) {
    return [{ url: fallbackUrl, publicId: '' }];
  }

  return [];
};

const normalizeAdminProductPayload = (payload = {}) => {
  const images = normalizeImages(payload.images, payload.image || '');
  const visibility = payload.visibility || 'Public';

  return {
    name: String(payload.name || 'New Product').trim(),
    description: String(payload.description || '').trim(),
    price: Number(payload.price || 0),
    salePrice: Number(payload.salePrice || payload.oldPrice || 0),
    category: String(payload.category || payload.collection || 'Essentials').trim(),
    sizes: parseList(payload.sizes || payload.sizeOptions),
    colors: parseList(payload.colors || payload.colorOptions),
    stock: Number(payload.stock || payload.quantity || 0),
    images,
    featured: payload.featured === true || payload.featured === 'true',
    bestSeller: payload.bestSeller === true || payload.bestSeller === 'true',
    collectionName: String(payload.collection || payload.collectionName || '').trim(),
    isActive: visibility !== 'Hidden' && payload.isActive !== false,
    code: String(payload.code || '').trim(),
    slug: String(payload.slug || '').trim(),
    seoTitle: String(payload.seoTitle || '').trim(),
    metaDescription: String(payload.metaDescription || '').trim(),
    barcode: String(payload.barcode || '').trim(),
    ogImage: String(payload.ogImage || '').trim(),
    tags: parseList(payload.tags),
  };
};

module.exports = {
  normalizeAdminProductPayload,
  normalizeImages,
};
