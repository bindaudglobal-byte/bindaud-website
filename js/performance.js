export const requestFrame = (callback) => {
  if (typeof window === 'undefined') return null;
  return window.requestAnimationFrame(() => {
    callback?.();
  });
};

export const debounce = (callback, wait = 120) => {
  let timeoutId = null;
  return (...args) => {
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
    }
    timeoutId = window.setTimeout(() => callback(...args), wait);
  };
};

export const prefersReducedMotion = () => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

export const scheduleIdle = (callback) => {
  if (typeof window === 'undefined') return null;
  if (typeof window.requestIdleCallback === 'function') {
    return window.requestIdleCallback(callback);
  }
  return window.setTimeout(callback, 16);
};
