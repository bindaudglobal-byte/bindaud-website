import { initSite } from './cart.js';
import { initSiteNavigation } from './site-navigation.js';
import { initChatbot } from './chatbot.js';
import { initProductReviews } from './reviews.js';
import { initOrderTracking } from './orderTracking.js';
import { requestFrame } from './performance.js';

if (typeof window !== 'undefined') {
  const initializeApp = () => {
    if (window.__BINDAUD_APP_STARTED) return;
    window.__BINDAUD_APP_STARTED = true;

    requestFrame(() => {
      initSiteNavigation();
      initSite();
      initChatbot();
      initProductReviews();
      initOrderTracking();
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp, { once: true });
  } else {
    initializeApp();
  }

  window.addEventListener('load', initializeApp, { once: true });
}

