const express = require('express');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', auth, admin, upload.fields([{ name: 'images', maxCount: 8 }, { name: 'video', maxCount: 1 }]), createProduct);
router.put('/:id', auth, admin, upload.fields([{ name: 'images', maxCount: 8 }, { name: 'video', maxCount: 1 }]), updateProduct);
router.delete('/:id', auth, admin, deleteProduct);

module.exports = router;
