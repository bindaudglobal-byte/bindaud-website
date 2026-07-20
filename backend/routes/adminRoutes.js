const express = require('express');
const { createAdmin, loginAdmin, getAdminProfile, getDashboard } = require('../controllers/adminController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

const router = express.Router();

router.post('/auth/register', createAdmin);
router.post('/auth/login', loginAdmin);
router.get('/profile', auth, admin, getAdminProfile);
router.get('/dashboard', auth, admin, getDashboard);

module.exports = router;
