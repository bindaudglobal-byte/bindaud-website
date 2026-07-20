#!/usr/bin/env node

/**
 * BINDAUD Deployment Validation Script
 * Checks all critical systems before production deployment
 */

const fs = require('fs');
const path = require('path');

const CHECKS = [];
let PASSED = 0;
let FAILED = 0;

function addCheck(name, result, message = '') {
  CHECKS.push({ name, result, message });
  if (result) {
    console.log(`✓ ${name}`);
    PASSED++;
  } else {
    console.log(`✗ ${name}${message ? ': ' + message : ''}`);
    FAILED++;
  }
}

function fileExists(filePath) {
  return fs.existsSync(path.resolve(__dirname, filePath));
}

function readFile(filePath) {
  return fs.readFileSync(path.resolve(__dirname, filePath), 'utf8');
}

console.log('\n🔍 BINDAUD DEPLOYMENT VALIDATION\n');

// 1. Check Backend Structure
console.log('📂 Backend Structure:');
addCheck('API entry point exists', fileExists('api/index.js'), '');
addCheck('Backend routes exist', fileExists('backend/routes'), '');
addCheck('Database models exist', fileExists('backend/models'), '');
addCheck('Email service exists', fileExists('backend/services/emailService.js'), '');

// 2. Check Frontend Files
console.log('\n📄 Frontend Files:');
addCheck('Index page exists', fileExists('index.html'), '');
addCheck('Cart storage exists', fileExists('js/cartStorage.js'), '');
addCheck('Admin dashboard exists', fileExists('js/adminDashboard.js'), '');
addCheck('Email module exists', fileExists('js/email.js'), '');
addCheck('Admin storage exists', fileExists('js/adminStorage.js'), '');

// 3. Check CSS Files
console.log('\n🎨 CSS Files:');
addCheck('Admin CSS exists', fileExists('css/admin.css'), '');
addCheck('Main CSS exists', fileExists('css/style.css'), '');
addCheck('Responsive CSS exists', fileExists('css/responsive.css'), '');

// 4. Check Configuration Files
console.log('\n⚙️  Configuration:');
addCheck('Package.json exists', fileExists('package.json'), '');
addCheck('Vercel config exists', fileExists('vercel.json'), '');
addCheck('.env.example exists', fileExists('.env.example'), '');

// 5. Check Key Backend Endpoints
console.log('\n🔗 Backend Endpoints:');
const adminRoutes = readFile('backend/routes/simpleAdminRoutes.js');
addCheck('POST /api/admin/orders endpoint', adminRoutes.includes("router.post('/orders'"), 'Public order creation');
addCheck('GET /api/admin/orders endpoint', adminRoutes.includes("router.get('/orders'"), 'Fetch all orders');
addCheck('PUT /api/admin/orders/:id endpoint', adminRoutes.includes("router.put('/orders/:id'"), 'Update order status');
addCheck('POST /api/admin/email endpoint', adminRoutes.includes("router.post('/email'"), 'Send email notifications');

// 6. Check Frontend Integration
console.log('\n🔌 Frontend Integration:');
const emailJs = readFile('js/email.js');
addCheck('Email backend integration', emailJs.includes('sendEmailViaBackend'), 'Backend API call added');
addCheck('Email async/await', emailJs.includes('async'), 'Async email functions');

const cartJs = readFile('js/cart.js');
addCheck('Cart backend order POST', cartJs.includes("fetch('/api/admin/orders'"), 'Order POST to backend');
addCheck('Cart email awaiting', cartJs.includes('await queueOrderEmail'), 'Email async handling');

const adminDashboard = readFile('js/adminDashboard.js');
addCheck('Admin async renderOrders', adminDashboard.includes('async () => { await renderOrders()'), 'Event listeners async');
addCheck('Admin getOrdersAsync', adminDashboard.includes('getOrdersAsync'), 'Backend order fetching');

const cartStorage = readFile('js/cartStorage.js');
addCheck('Tax getTaxRate function', cartStorage.includes('getTaxRate()'), 'Tax configuration');
addCheck('Tax calculation updated', cartStorage.includes('(subtotal - discountAmount + shipping) * taxRate'), 'Tax formula');

// 7. Check Mobile CSS
console.log('\n📱 Mobile Responsiveness:');
const adminCss = readFile('css/admin.css');
addCheck('Tablet breakpoint (768px)', adminCss.includes('max-width: 768px'), '');
addCheck('Mobile breakpoint (480px)', adminCss.includes('max-width: 480px'), '');
addCheck('Toolbar responsive styles', adminCss.includes('.admin-toolbar-row'), '');

// 8. Check Environment Requirements
console.log('\n🔐 Environment Variables:');
const envExample = readFile('.env.example');
addCheck('MONGODB_URI in example', envExample.includes('MONGODB_URI'), 'Database connection');
addCheck('JWT_SECRET in example', envExample.includes('JWT_SECRET'), 'Authentication');
addCheck('EMAIL config in example', envExample.includes('EMAIL_HOST'), 'Email service');

// 9. Check Dependencies
console.log('\n📦 Dependencies:');
const packageJson = JSON.parse(readFile('package.json'));
const requiredDeps = ['express', 'mongoose', 'nodemailer', 'bcrypt', 'jsonwebtoken', 'cors'];
requiredDeps.forEach(dep => {
  addCheck(`${dep} installed`, Object.keys(packageJson.dependencies).includes(dep), '');
});

// 10. Summary
console.log('\n' + '='.repeat(50));
console.log(`\n✅ Passed: ${PASSED}`);
console.log(`❌ Failed: ${FAILED}`);
console.log(`📊 Total: ${CHECKS.length}`);

if (FAILED === 0) {
  console.log('\n🚀 ALL CHECKS PASSED - READY FOR DEPLOYMENT\n');
  process.exit(0);
} else {
  console.log('\n⚠️  DEPLOYMENT BLOCKED - FIX FAILING CHECKS ABOVE\n');
  process.exit(1);
}
