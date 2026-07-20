import { initAdminDashboard, initAdminLogin } from './adminDashboard.js';

if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('admin-dashboard.html')) {
      initAdminDashboard();
    }

    if (window.location.pathname.includes('admin-login.html')) {
      initAdminLogin();
    }
  });
}
