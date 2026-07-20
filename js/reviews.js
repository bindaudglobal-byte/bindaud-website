import { PRODUCT_CATALOG, getQueryParam } from './helpers.js';

const REVIEWS_STORAGE_KEY = 'binDaudProductReviews';

const readReviews = () => {
  if (typeof window === 'undefined') return {};

  try {
    return JSON.parse(window.localStorage.getItem(REVIEWS_STORAGE_KEY)) || {};
  } catch (error) {
    return {};
  }
};

const writeReviews = (value) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(value));
};

const getSeedReviews = (productId) => {
  const seeded = {
    'BD-001': [
      { id: 'seed-1', name: 'Ayesha', rating: 5, title: 'Perfect fit', comment: 'The quality feels premium and the oversized cut is exactly what I wanted.', createdAt: '2026-06-15T09:00:00.000Z' },
      { id: 'seed-2', name: 'Hassan', rating: 5, title: 'Luxury feel', comment: 'Fast delivery and packaging that feels special from the first touch.', createdAt: '2026-06-22T12:30:00.000Z' }
    ],
    'BD-002': [
      { id: 'seed-3', name: 'Rida', rating: 5, title: 'Obsessed with this piece', comment: 'The detailing is exceptional and the fabric is super comfortable.', createdAt: '2026-06-16T11:15:00.000Z' }
    ]
  };

  return seeded[productId] || [
    { id: 'seed-4', name: 'Guest', rating: 5, title: 'Loved it', comment: 'A strong everyday luxury staple from BIN DAUD.', createdAt: '2026-06-10T15:00:00.000Z' }
  ];
};

export const getReviewsForProduct = (productId) => {
  const allReviews = readReviews();
  const stored = allReviews[productId];
  if (stored && stored.length) return stored;
  return getSeedReviews(productId);
};

export const submitReview = (productId, reviewData) => {
  const reviews = readReviews();
  const list = [
    ...getReviewsForProduct(productId),
    {
      id: `review-${Date.now()}`,
      name: reviewData.name || 'Guest',
      rating: Number(reviewData.rating) || 5,
      title: reviewData.title || 'Great purchase',
      comment: reviewData.comment || 'Thanks for the feedback.',
      createdAt: new Date().toISOString()
    }
  ];

  reviews[productId] = list;
  writeReviews(reviews);
  return list;
};

const renderStars = (rating) => '★'.repeat(rating) + '☆'.repeat(5 - rating);

export const initProductReviews = () => {
  const shell = document.querySelector('#product-reviews-shell');
  if (!shell) return;

  const productId = getQueryParam('id') || PRODUCT_CATALOG[0].id;
  const reviews = getReviewsForProduct(productId);
  const averageRating = (reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / reviews.length).toFixed(1);

  shell.innerHTML = `
    <div class="review-summary-card">
      <div>
        <p class="uppercase">Customer feedback</p>
        <h3>${averageRating}/5 average rating</h3>
      </div>
      <form id="review-form" class="review-form">
        <input type="text" name="name" class="newsletter-input" placeholder="Your name" aria-label="Your name" required>
        <select name="rating" class="newsletter-input" aria-label="Choose a rating" required>
          <option value="5">5 stars</option>
          <option value="4">4 stars</option>
          <option value="3">3 stars</option>
          <option value="2">2 stars</option>
          <option value="1">1 star</option>
        </select>
        <input type="text" name="title" class="newsletter-input" placeholder="Short headline" aria-label="Review headline" required>
        <textarea name="comment" class="newsletter-input" rows="3" placeholder="Tell us about your experience" aria-label="Review comment" required></textarea>
        <button type="submit" class="btn btn-primary">Submit Review</button>
      </form>
    </div>
    <div class="review-list">
      ${reviews.map((review) => `
        <article class="review-card">
          <div class="review-header">
            <div class="reviewer-avatar">${review.name.charAt(0).toUpperCase()}</div>
            <div class="reviewer-info">
              <h4 class="reviewer-name">${review.name}</h4>
              <p class="reviewer-location">${new Date(review.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          <div class="review-rating">${renderStars(Number(review.rating || 5))}</div>
          <p class="review-text"><strong>${review.title}</strong><br>${review.comment}</p>
        </article>
      `).join('')}
    </div>
  `;

  const form = shell.querySelector('#review-form');
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const nextReviews = submitReview(productId, {
      name: String(formData.get('name') || ''),
      rating: String(formData.get('rating') || '5'),
      title: String(formData.get('title') || ''),
      comment: String(formData.get('comment') || '')
    });
    form.reset();
    const reviewList = shell.querySelector('.review-list');
    if (reviewList) {
      reviewList.innerHTML = nextReviews.map((review) => `
        <article class="review-card">
          <div class="review-header">
            <div class="reviewer-avatar">${review.name.charAt(0).toUpperCase()}</div>
            <div class="reviewer-info">
              <h4 class="reviewer-name">${review.name}</h4>
              <p class="reviewer-location">${new Date(review.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          <div class="review-rating">${renderStars(Number(review.rating || 5))}</div>
          <p class="review-text"><strong>${review.title}</strong><br>${review.comment}</p>
        </article>
      `).join('');
    }

    const summary = shell.querySelector('.review-summary-card h3');
    if (summary) {
      const averageRating = (nextReviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / nextReviews.length).toFixed(1);
      summary.textContent = `${averageRating}/5 average rating`;
    }
  });
};
