import { prefersReducedMotion } from './performance.js';

const REVEAL_SELECTOR = '.section, .hero, .hero-content, .hero-art, .about-card, .feature-card, .review-card, .product-card, .gallery-item, .collection-section, .newsletter-container, .footer-col, .form-card, .cart-item-card, .checkout-item-card';
const MAGNETIC_SELECTOR = '.btn, .cta, .nav-link, .social-icon, .brand, .product-card, .thumbnail-item, .collection-filter-btn, .wishlist-item, #cart-count';
const RIPPLE_SELECTOR = 'button, .btn, .cta, .social-icon, .nav-link';

function initScrollProgress() {
  if (document.querySelector('.scroll-progress')) return;

  const progress = document.createElement('div');
  progress.className = 'scroll-progress';
  document.body.appendChild(progress);

  const update = () => {
    const height = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = height > 0 ? (window.scrollY / height) * 100 : 0;
    progress.style.width = `${Math.min(100, Math.max(0, ratio))}%`;
  };

  update();
  window.addEventListener('scroll', () => {
    window.requestAnimationFrame(update);
  }, { passive: true });
}

function initRevealAnimations() {
  const elements = Array.from(document.querySelectorAll(REVEAL_SELECTOR));
  if (elements.length === 0) return;

  if (prefersReducedMotion()) {
    elements.forEach((element) => element.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.14,
    rootMargin: '0px 0px -10% 0px'
  });

  elements.forEach((element) => {
    element.classList.add('reveal');
    observer.observe(element);
  });
}

function initMagneticInteractions() {
  if (prefersReducedMotion()) return;

  const elements = Array.from(document.querySelectorAll(MAGNETIC_SELECTOR));
  elements.forEach((element) => {
    element.classList.add('is-magnetic');
    element.addEventListener('mousemove', (event) => {
      const rect = element.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const offsetX = ((x - rect.width / 2) / rect.width) * 8;
      const offsetY = ((y - rect.height / 2) / rect.height) * 8;

      element.style.setProperty('--magnet-x', `${offsetX}px`);
      element.style.setProperty('--magnet-y', `${offsetY}px`);
      element.classList.add('is-active');
    }, { passive: true });

    element.addEventListener('mouseleave', () => {
      element.classList.remove('is-active');
      element.style.removeProperty('--magnet-x');
      element.style.removeProperty('--magnet-y');
    }, { passive: true });
  });
}

function initRippleClicks() {
  const elements = Array.from(document.querySelectorAll(RIPPLE_SELECTOR));
  elements.forEach((element) => {
    element.addEventListener('click', (event) => {
      const rect = element.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.left = `${event.clientX - rect.left}px`;
      ripple.style.top = `${event.clientY - rect.top}px`;
      ripple.style.width = `${Math.max(rect.width, rect.height)}px`;
      ripple.style.height = `${Math.max(rect.width, rect.height)}px`;
      element.appendChild(ripple);
      window.setTimeout(() => ripple.remove(), 520);
    });
  });
}

function initCartFeedback() {
  window.addEventListener('cart:updated', () => {
    const badge = document.getElementById('cart-count');
    if (badge) {
      badge.classList.remove('is-bumped');
      window.requestAnimationFrame(() => badge.classList.add('is-bumped'));
    }
  }, { passive: true });
}

function initWishlistFeedback() {
  const wishlistButtons = Array.from(document.querySelectorAll('[data-wishlist], .wishlist-btn, .wishlist-toggle'));
  wishlistButtons.forEach((button) => {
    button.addEventListener('click', () => {
      button.classList.add('wishlist-active');
      window.setTimeout(() => button.classList.remove('wishlist-active'), 480);
    }, { passive: true });
  });
}

function initPageTransition() {
  document.addEventListener('click', (event) => {
    const anchor = event.target.closest('a[href]');
    if (!anchor || anchor.target || anchor.download) return;
    const href = anchor.getAttribute('href') || '';
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    const isExternal = /^https?:\/\//i.test(href);
    if (isExternal) return;
    document.body.classList.add('page-transitioning');
  });
}

function initLoadingExperience() {
  if (document.querySelector('.premium-loader')) return;

  const loader = document.createElement('div');
  loader.className = 'premium-loader';
  loader.innerHTML = '<div class="premium-loader__spinner"><div class="premium-loader__ring"></div><div class="premium-loader__label">Preparing experience</div></div>';
  document.body.appendChild(loader);

  const hideLoader = () => {
    loader.classList.add('is-hidden');
    document.body.classList.add('page-ready');
    window.setTimeout(() => loader.remove(), 90);
  };

  if (document.readyState === 'complete') {
    window.setTimeout(hideLoader, 40);
    return;
  }

  window.addEventListener('load', () => {
    window.setTimeout(hideLoader, 40);
  }, { once: true });
}

export function initPremiumInteractions() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__BINDAUD_INTERACTIONS_INITIALIZED) return;
  window.__BINDAUD_INTERACTIONS_INITIALIZED = true;

  if (prefersReducedMotion()) {
    document.body.classList.add('reduced-motion');
  }

  initLoadingExperience();
  initScrollProgress();
  initRevealAnimations();
  initMagneticInteractions();
  initRippleClicks();
  initCartFeedback();
  initWishlistFeedback();
  initPageTransition();
}
