const express = require('express');
const { getCustomers, getCustomerById, updateCustomer, deleteCustomer } = require('../controllers/customerController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

const router = express.Router();

router.get('/', auth, admin, getCustomers);
router.get('/:id', auth, admin, getCustomerById);
router.put('/:id', auth, admin, updateCustomer);
router.delete('/:id', auth, admin, deleteCustomer);

module.exports = router;
