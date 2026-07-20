/**
 * Dark Mode Manager
 * Manages theme switching across the entire BIN DAUD website
 * Persists user preference and ensures consistency everywhere
 */

const THEME_STORAGE_KEY = 'bindaud-theme-preference';
const DARK_MODE_CLASS = 'dark-mode';

export const themeManager = {
  /**
   * Initialize theme system
   * Checks user preference, system preference, and stored preference
   */
  init() {
    const stored = this.getStoredPreference();
    const system = this.getSystemPreference();
    const initial = stored || system || 'light';

    this.applyTheme(initial);
    this.updateToggleState(initial === 'dark');
    this.setupListeners();
  },

  /**
   * Get stored user preference from localStorage
   */
  getStoredPreference() {
    try {
      return localStorage.getItem(THEME_STORAGE_KEY);
    } catch (e) {
      return null;
    }
  },

  /**
   * Get system preference (prefers-color-scheme)
   */
  getSystemPreference() {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  },

  /**
   * Apply theme to the entire document
   */
  applyTheme(theme) {
    const isDark = theme === 'dark';
    const root = document.documentElement;

    if (isDark) {
      root.classList.add(DARK_MODE_CLASS);
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove(DARK_MODE_CLASS);
      root.style.colorScheme = 'light';
    }

    // Store preference
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (e) {
      console.warn('Failed to save theme preference');
    }

    // Emit custom event for components to listen
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme, isDark } }));
  },

  /**
   * Toggle between dark and light modes
   */
  toggle() {
    const current = document.documentElement.classList.contains(DARK_MODE_CLASS) ? 'dark' : 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    this.applyTheme(next);
    this.updateToggleState(next === 'dark');
  },

  /**
   * Update toggle button state
   */
  updateToggleState(isDark) {
    const toggles = document.querySelectorAll('[data-toggle-theme], #toggle-theme-btn');
    toggles.forEach((btn) => {
      btn.setAttribute('aria-pressed', isDark);
      btn.classList.toggle('active', isDark);
      if (btn.textContent.includes('🌙') || btn.textContent.includes('☀️')) {
        btn.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
      }
    });
  },

  /**
   * Setup theme toggle listeners
   */
  setupListeners() {
    const toggles = document.querySelectorAll('[data-toggle-theme], #toggle-theme-btn');
    toggles.forEach((btn) => {
      btn.addEventListener('click', () => this.toggle());
    });

    // Listen for system preference changes
    if (window.matchMedia) {
      const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      darkModeQuery.addEventListener('change', (e) => {
        if (!this.getStoredPreference()) {
          this.applyTheme(e.matches ? 'dark' : 'light');
        }
      });
    }
  },

  /**
   * Get current theme
   */
  getCurrentTheme() {
    return document.documentElement.classList.contains(DARK_MODE_CLASS) ? 'dark' : 'light';
  },

  /**
   * Set theme explicitly
   */
  setTheme(theme) {
    this.applyTheme(theme);
    this.updateToggleState(theme === 'dark');
  }
};

export default themeManager;
