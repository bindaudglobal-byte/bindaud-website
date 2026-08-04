import { initSite } from "./cart.js";
import { initSiteNavigation } from "./site-navigation.js";
import { initChatbot } from "./chatbot.js";
import { initProductReviews } from "./reviews.js";
import { initOrderTracking } from "./orderTracking.js";
import { initCursorSystem } from "./cursor.js";
import { initPremiumInteractions } from "./interactions.js";
import { requestFrame } from "./performance.js";
import { themeManager } from "./themeManager.js";
import { initializeSupabaseAuth } from "./supabaseAuth.js";

if (typeof window !== "undefined") {
  const initializeApp = () => {
    if (window.__BINDAUD_APP_STARTED) return;
    window.__BINDAUD_APP_STARTED = true;

    requestFrame(() => {
      themeManager.init();
      initCursorSystem();
      initPremiumInteractions();
      initSiteNavigation();
      initSite();
      initChatbot();
      initProductReviews();
      initOrderTracking();
      initializeSupabaseAuth().catch((error) => {
        console.warn("Supabase auth initialization skipped:", error.message);
      });
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeApp, {
      once: true,
    });
  } else {
    initializeApp();
  }

  window.addEventListener("load", initializeApp, { once: true });
}
