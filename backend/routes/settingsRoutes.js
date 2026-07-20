const express = require('express');
const { getSettings, updateSettings } = require('../controllers/settingsController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

const router = express.Router();

router.get('/', getSettings);
router.put('/', auth, admin, updateSettings);

module.exports = router;
