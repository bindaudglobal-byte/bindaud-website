const express = require('express');
const { getReviews, createReview, updateReview, deleteReview } = require('../controllers/reviewController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/:productId', getReviews);
router.post('/:productId', auth, createReview);
router.put('/:id', auth, updateReview);
router.delete('/:id', auth, deleteReview);

module.exports = router;
