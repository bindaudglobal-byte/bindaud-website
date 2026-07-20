const express = require('express');
const { getCart, addToCart, updateCartItem, removeCartItem, clearCart } = require('../controllers/cartController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, getCart);
router.post('/add', auth, addToCart);
router.put('/:itemId', auth, updateCartItem);
router.delete('/:itemId', auth, removeCartItem);
router.delete('/', auth, clearCart);

module.exports = router;
