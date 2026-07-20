import { getOrders } from './adminStorage.js';

const select = (selector, parent = document) => parent.querySelector(selector);

const findMatchingOrders = (query) => {
  const orders = getOrders();
  const normalized = query.trim().toLowerCase();

  if (!normalized) return orders.slice(0, 3);

  return orders.filter((order) => {
    const combined = `${order.orderNumber || ''} ${order.customerName || ''} ${order.phone || ''} ${order.city || ''}`.toLowerCase();
    return combined.includes(normalized);
  });
};

const renderResults = (container, orders) => {
  if (!container) return;

  if (!orders.length) {
    container.innerHTML = '<p class="empty-state">No orders matched your search yet. Try your phone number or order reference.</p>';
    return;
  }

  container.innerHTML = orders.map((order) => `
    <article class="review-card">
      <div class="review-header">
        <div class="reviewer-avatar">${(order.customerName || 'O').charAt(0).toUpperCase()}</div>
        <div class="reviewer-info">
          <h4 class="reviewer-name">${order.orderNumber || order.id}</h4>
          <p class="reviewer-location">${order.customerName || 'Guest Customer'}</p>
        </div>
      </div>
      <p class="review-text"><strong>Status:</strong> ${order.status || 'Pending'}<br><strong>Phone:</strong> ${order.phone || '—'}<br><strong>City:</strong> ${order.city || '—'}</p>
    </article>
  `).join('');
};

export const initOrderTracking = () => {
  const page = document.querySelector('.track-order-page');
  if (!page) return;

  const form = select('#track-order-form', page);
  const results = select('#track-order-results', page);
  const fallback = select('#latest-orders', page);

  if (!form || !results) return;

  const showLatest = () => {
    const latestOrders = getOrders().slice(0, 3);
    if (fallback) {
      fallback.innerHTML = latestOrders.map((order) => `
        <li class="admin-list-item">
          <strong>${order.orderNumber || order.id}</strong>
          <span>${order.status || 'Pending'}</span>
        </li>
      `).join('');
    }
  };

  showLatest();

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const query = String(formData.get('orderQuery') || '');
    renderResults(results, findMatchingOrders(query));
  });
};
