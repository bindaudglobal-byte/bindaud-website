import { debounce, requestFrame } from './performance.js';

const NAV_LINK_SELECTOR = '.nav-link';
const SCROLL_BUTTON_CLASS = 'scroll-top-button';

function normalizePath(path) {
  if (!path) return '/';
  let normalized = path.replace(/\\/g, '/');
  if (normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }
  if (!normalized) {
    return '/';
  }
  if (normalized === '/index.html' || normalized === '/index') {
    return '/index.html';
  }
  return normalized;
}

function getCurrentPath() {
  return normalizePath(window.location.pathname);
}

export function initSiteNavigation() {
  if (window.__BINDAUD_SITE_NAVIGATION_INITIALIZED) return;
  window.__BINDAUD_SITE_NAVIGATION_INITIALIZED = true;

  updateActiveNav();
  initScrollToTopButton();
}

function updateActiveNav() {
  const currentPath = getCurrentPath();
  const navLinks = Array.from(document.querySelectorAll(NAV_LINK_SELECTOR));

  navLinks.forEach((link) => {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#')) {
      return;
    }

    try {
      const resolvedUrl = new URL(href, window.location.href);
      const targetPath = normalizePath(resolvedUrl.pathname);
      const isCurrentPage = targetPath === currentPath;
      link.classList.toggle('active', isCurrentPage);
      if (isCurrentPage) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    } catch (error) {
      console.warn('Unable to resolve navigation link:', href, error);
    }
  });
}

function initScrollToTopButton() {
  if (document.querySelector(`.${SCROLL_BUTTON_CLASS}`)) {
    return;
  }

  const button = document.createElement('button');
  button.type = 'button';
  button.className = `btn btn-primary ${SCROLL_BUTTON_CLASS}`;
  button.setAttribute('aria-label', 'Scroll to top');
  button.innerHTML = '↑';
  button.style.position = 'fixed';
  button.style.right = '1.25rem';
  button.style.bottom = '5.75rem';
  button.style.zIndex = '1600';
  button.style.display = 'none';
  button.style.opacity = '0';
  button.style.transform = 'translateY(12px)';
  button.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
  button.style.width = '3rem';
  button.style.height = '3rem';
  button.style.borderRadius = '999px';
  button.style.padding = '0';
  button.style.fontSize = '1.15rem';
  button.style.touchAction = 'manipulation';

  button.addEventListener('click', () => {
    window.scrollTo({ top: 0 });
  });

  document.body.appendChild(button);

  const toggleButton = () => {
    const shouldShow = window.scrollY > 300;
    button.style.display = shouldShow ? 'inline-flex' : 'none';
    if (shouldShow) {
      button.style.opacity = '1';
      button.style.transform = 'translateY(0)';
    } else {
      button.style.opacity = '0';
      button.style.transform = 'translateY(12px)';
    }
  };

  toggleButton();
  window.addEventListener('scroll', toggleButton, { passive: true });
}
