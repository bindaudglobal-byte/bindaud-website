import { prefersReducedMotion } from './performance.js';

const DOT_CLASS = 'cursor-dot';
const RING_CLASS = 'cursor-ring';
const GLOW_CLASS = 'cursor-glow';
const POINTER_STATE_CLASS = 'cursor-active';
const DISABLED_CLASS = 'cursor-disabled';

let pointerX = 0;
let pointerY = 0;
let dotX = 0;
let dotY = 0;
let ringX = 0;
let ringY = 0;
let rafId = null;
let dotEl;
let ringEl;
let glowEl;
let isActive = false;
let isEnabled = false;

function shouldDisable() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return true;
  if (prefersReducedMotion()) return true;
  if (window.matchMedia('(pointer: coarse)').matches) return true;
  return false;
}

function getCursorState(element) {
  if (!element) return 'default';
  if (element.closest('button, .btn, .cta, .nav-link, .social-icon, .brand, .wishlist-item, .cart-item-card, .collection-filter-btn')) {
    const buttonMatch = element.closest('button, .btn, .cta');
    if (buttonMatch) return 'button';
    const navMatch = element.closest('.nav-link, .brand');
    if (navMatch) return navMatch.classList.contains('brand') ? 'logo' : 'nav';
    if (element.closest('.social-icon')) return 'social';
    if (element.closest('.wishlist-item, .wishlist-btn')) return 'wishlist';
    if (element.closest('.cart-item-card, #cart-count')) return 'cart';
    if (element.closest('.collection-filter-btn')) return 'button';
    return 'button';
  }
  if (element.closest('.product-card, .feature-card, .review-card, .collection-section, .gallery-item')) return 'product';
  if (element.closest('img, picture, video, .image-zoom, .thumbnail-item')) return 'image';
  if (element.closest('form, input, textarea, select, .newsletter-input, .site-search')) return 'form';
  if (element.closest('.video, video')) return 'video';
  if (element.closest('.admin-panel, .admin-list-item, .admin-form')) return 'admin';
  return 'default';
}

function setCursorState(state) {
  document.body.classList.remove('cursor-hover-button', 'cursor-hover-nav', 'cursor-hover-product', 'cursor-hover-image', 'cursor-hover-cart', 'cursor-hover-wishlist', 'cursor-hover-social', 'cursor-hover-form', 'cursor-hover-logo', 'cursor-hover-video', 'cursor-hover-admin');
  if (state === 'button') {
    document.body.classList.add('cursor-hover-button');
  } else if (state === 'nav') {
    document.body.classList.add('cursor-hover-nav');
  } else if (state === 'product') {
    document.body.classList.add('cursor-hover-product');
  } else if (state === 'image') {
    document.body.classList.add('cursor-hover-image');
  } else if (state === 'cart') {
    document.body.classList.add('cursor-hover-cart');
  } else if (state === 'wishlist') {
    document.body.classList.add('cursor-hover-wishlist');
  } else if (state === 'social') {
    document.body.classList.add('cursor-hover-social');
  } else if (state === 'form') {
    document.body.classList.add('cursor-hover-form');
  } else if (state === 'logo') {
    document.body.classList.add('cursor-hover-logo');
  } else if (state === 'video') {
    document.body.classList.add('cursor-hover-video');
  } else if (state === 'admin') {
    document.body.classList.add('cursor-hover-admin');
  }
}

function updateCursor() {
  dotX += (pointerX - dotX) * 0.22;
  dotY += (pointerY - dotY) * 0.22;
  ringX += (pointerX - ringX) * 0.16;
  ringY += (pointerY - ringY) * 0.16;

  dotEl.style.transform = `translate(${dotX}px, ${dotY}px)`;
  ringEl.style.transform = `translate(${ringX}px, ${ringY}px)`;
  glowEl.style.transform = `translate(${ringX}px, ${ringY}px)`;

  rafId = window.requestAnimationFrame(updateCursor);
}

function attachEvents() {
  document.addEventListener('mousemove', (event) => {
    pointerX = event.clientX;
    pointerY = event.clientY;
    if (!isActive) {
      isActive = true;
      document.body.classList.add(POINTER_STATE_CLASS);
    }
  }, { passive: true });

  document.addEventListener('mouseleave', () => {
    document.body.classList.remove(POINTER_STATE_CLASS);
    isActive = false;
  }, { passive: true });

  document.addEventListener('mousedown', () => {
    document.body.classList.add('cursor-active');
  }, { passive: true });

  document.addEventListener('mouseup', () => {
    document.body.classList.remove('cursor-active');
  }, { passive: true });

  document.addEventListener('mouseover', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const state = getCursorState(target);
    setCursorState(state);
  }, { passive: true });

  document.addEventListener('mouseout', (event) => {
    const related = event.relatedTarget instanceof Element ? event.relatedTarget : null;
    if (!related || !document.body.contains(related)) {
      setCursorState('default');
    }
  }, { passive: true });
}

export function initCursorSystem() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__BINDAUD_CURSOR_INITIALIZED) return;
  window.__BINDAUD_CURSOR_INITIALIZED = true;

  if (shouldDisable()) {
    document.body.classList.add(DISABLED_CLASS);
    document.documentElement.classList.remove('has-custom-cursor');
    return;
  }

  document.documentElement.classList.add('has-custom-cursor');
  document.body.classList.remove(DISABLED_CLASS);

  dotEl = document.createElement('div');
  dotEl.className = DOT_CLASS;
  ringEl = document.createElement('div');
  ringEl.className = RING_CLASS;
  glowEl = document.createElement('div');
  glowEl.className = GLOW_CLASS;

  document.body.appendChild(glowEl);
  document.body.appendChild(ringEl);
  document.body.appendChild(dotEl);

  isEnabled = true;
  attachEvents();
  if (rafId === null) {
    rafId = window.requestAnimationFrame(updateCursor);
  }
}
