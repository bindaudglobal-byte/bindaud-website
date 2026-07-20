const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeAdminProductPayload } = require('../utils/adminProductAdapter');

test('normalizes payloads from the admin UI into Mongo-ready product data', () => {
  const product = normalizeAdminProductPayload({
    name: 'Signature Tee',
    price: '1200',
    oldPrice: '1500',
    sizes: 'M, L',
    colors: 'Black, White',
    collection: 'tees',
    featured: 'true',
    bestSeller: 'true',
    visibility: 'Hidden',
    images: [
      { url: 'https://cdn.example.com/1.jpg', isCover: true },
      { url: 'https://cdn.example.com/2.jpg', isCover: false }
    ],
    image: 'https://cdn.example.com/1.jpg'
  });

  assert.equal(product.name, 'Signature Tee');
  assert.equal(product.price, 1200);
  assert.equal(product.salePrice, 1500);
  assert.deepEqual(product.sizes, ['M', 'L']);
  assert.deepEqual(product.colors, ['Black', 'White']);
  assert.equal(product.collectionName, 'tees');
  assert.equal(product.featured, true);
  assert.equal(product.bestSeller, true);
  assert.equal(product.isActive, false);
  assert.equal(product.images[0].url, 'https://cdn.example.com/1.jpg');
  assert.equal(product.images[1].url, 'https://cdn.example.com/2.jpg');
});
