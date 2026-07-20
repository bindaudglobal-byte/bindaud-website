import test from 'node:test';
import assert from 'node:assert/strict';

let storage = new Map();

globalThis.localStorage = {
  getItem(key) {
    return storage.has(key) ? storage.get(key) : null;
  },
  setItem(key, value) {
    storage.set(key, value);
  },
  removeItem(key) {
    storage.delete(key);
  }
};

globalThis.window = {
  dispatchEvent() {}
};

test('zero tax rate remains zero and does not fall back to 5%', async () => {
  const { calculateCartTotals } = await import('../js/cartStorage.js');
  const cart = [{ price: 1884, quantity: 1 }];

  storage.set('bindaud_admin_state', JSON.stringify({ settings: { tax: 0 } }));
  const totals = calculateCartTotals(cart);

  assert.equal(totals.tax, 0);
  assert.equal(totals.grandTotal, 2184);
  assert.equal(totals.taxRate, 0);
});

test('tax rate 5% still adds the expected tax value', async () => {
  const { calculateCartTotals } = await import('../js/cartStorage.js');
  const cart = [{ price: 1884, quantity: 1 }];

  storage.set('bindaud_admin_state', JSON.stringify({ settings: { tax: 5 } }));
  const totals = calculateCartTotals(cart);

  assert.equal(totals.tax, 109.2);
  assert.equal(totals.grandTotal, 2293.2);
  assert.equal(totals.taxRate, 5);
});
