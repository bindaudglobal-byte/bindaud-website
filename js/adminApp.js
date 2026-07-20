async function runAdminEntry() {
  const { initAdminDashboard, initAdminLogin } = await import('./adminDashboard.js');
  const path = window.location.pathname || '';

  if (path.includes('admin-dashboard.html')) {
    await initAdminDashboard();
  }

  if (path.includes('admin-login.html')) {
    initAdminLogin();
  }
}

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      runAdminEntry();
    }, { once: true });
  } else {
    runAdminEntry();
  }
}
