const express = require('express');
const { getWishlist, addToWishlist, removeFromWishlist } = require('../controllers/wishlistController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, getWishlist);
router.post('/add', auth, addToWishlist);
router.delete('/remove/:productId', auth, removeFromWishlist);

module.exports = router;
