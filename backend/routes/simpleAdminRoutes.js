const express = require('express');
const fs = require('fs');
const path = require('path');
const Product = require('../models/Product');
const Category = require('../models/Category');
const { uploadToCloudinary } = require('../config/cloudinary');
const { normalizeAdminProductPayload } = require('../utils/adminProductAdapter');
const upload = require('../middleware/upload');

const router = express.Router();
const productsFile = path.join(__dirname, '../data/products.json');
const githubRepository = process.env.GITHUB_REPOSITORY || (process.env.VERCEL_GIT_REPO_OWNER && process.env.VERCEL_GIT_REPO_SLUG ? `${process.env.VERCEL_GIT_REPO_OWNER}/${process.env.VERCEL_GIT_REPO_SLUG}` : '');
const githubBranch = process.env.GITHUB_BRANCH || process.env.VERCEL_GIT_COMMIT_REF || 'main';
const githubToken = process.env.GITHUB_TOKEN;
const GITHUB_API_BASE = 'https://api.github.com';
const uploadFields = upload.fields([{ name: 'images', maxCount: 8 }, { name: 'video', maxCount: 1 }]);

const encodeGithubPath = (filePath) => filePath.split('/').map(encodeURIComponent).join('/');

const getGithubHeaders = () => ({
  Authorization: `Bearer ${githubToken}`,
  'Content-Type': 'application/json',
  'User-Agent': 'bindaud-admin-backend'
});

const getGithubFileSha = async (filePath) => {
  const url = `${GITHUB_API_BASE}/repos/${githubRepository}/contents/${encodeGithubPath(filePath)}?ref=${githubBranch}`;
  const response = await fetch(url, { headers: getGithubHeaders() });
  if (response.status === 404) return null;
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GitHub content lookup failed: ${response.status} ${errorText}`);
  }
  const data = await response.json();
  return data.sha;
};

const commitGithubFile = async (filePath, content, message) => {
  if (!githubToken || !githubRepository) {
    throw new Error('GitHub repository configuration is missing. Set GITHUB_TOKEN and GITHUB_REPOSITORY in your environment.');
  }

  const sha = await getGithubFileSha(filePath);
  const encodedContent = typeof content === 'string'
    ? Buffer.from(content, 'utf8').toString('base64')
    : Buffer.from(content).toString('base64');

  const response = await fetch(`${GITHUB_API_BASE}/repos/${githubRepository}/contents/${encodeGithubPath(filePath)}`, {
    method: 'PUT',
    headers: getGithubHeaders(),
    body: JSON.stringify({
      message,
      content: encodedContent,
      branch: githubBranch,
      ...(sha ? { sha } : {})
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GitHub commit failed: ${response.status} ${errorText}`);
  }

  return response.json();
};

const normalizeFilename = (filename) => {
  const safeName = path.basename(filename || `product-${Date.now()}.jpg`);
  return safeName.replace(/[^a-zA-Z0-9._-]/g, '_');
};

const serializeProduct = (product) => {
  const plain = product.toObject ? product.toObject() : product;
  const images = Array.isArray(plain.images) ? plain.images : [];
  return {
    ...plain,
    id: plain._id?.toString() || plain.id,
    category: plain.category && typeof plain.category === 'object' ? plain.category.name : plain.category,
    image: images[0]?.url || '',
    images,
    price: Number(plain.price) || 0,
    salePrice: Number(plain.salePrice) || 0,
    stock: Number(plain.stock) || 0,
    createdAt: plain.createdAt || new Date().toISOString(),
    updatedAt: plain.updatedAt || plain.createdAt || new Date().toISOString(),
  };
};

const slugify = (value = '') => String(value)
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)/g, '');

const getOrCreateCategory = async (categoryName) => {
  const normalizedName = String(categoryName || 'Essentials').trim() || 'Essentials';
  const slug = slugify(normalizedName);

  let category = await Category.findOne({ $or: [{ name: normalizedName }, { slug }] });
  if (!category) {
    category = await Category.create({ name: normalizedName, slug, description: `${normalizedName} products`, isActive: true });
  }

  return category._id;
};

const uploadImageFiles = async (files = []) => {
  const uploadedImages = [];

  for (const file of files || []) {
    if (!file?.buffer) continue;

    try {
      const result = await uploadToCloudinary(file.buffer, 'bindaud/products');
      uploadedImages.push({ url: result.secure_url, publicId: result.public_id });
    } catch (error) {
      console.warn('Cloudinary upload skipped:', error.message);
    }
  }

  return uploadedImages;
};

const buildProductDocument = async (payload, files = []) => {
  const normalizedPayload = normalizeAdminProductPayload(payload || {});
  const category = await getOrCreateCategory(normalizedPayload.category);
  const uploadedImages = await uploadImageFiles(files.images || files);
  const persistedImages = uploadedImages.length
    ? uploadedImages
    : normalizedPayload.images;

  return {
    name: normalizedPayload.name || 'New Product',
    description: normalizedPayload.description || 'Premium BIN DAUD piece.',
    price: Number(normalizedPayload.price) || 0,
    salePrice: Number(normalizedPayload.salePrice) || 0,
    category,
    sizes: normalizedPayload.sizes,
    colors: normalizedPayload.colors,
    stock: Number(normalizedPayload.stock) || 0,
    images: persistedImages,
    featured: normalizedPayload.featured,
    bestSeller: normalizedPayload.bestSeller,
    collectionName: normalizedPayload.collectionName,
    isActive: normalizedPayload.isActive,
    code: normalizedPayload.code,
  };
};

// Auth Middleware (simple token-based)
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token === process.env.ADMIN_TOKEN || token === 'admin-token-2026') {
    next();
  } else {
    res.status(401).json({ success: false, message: 'Unauthorized' });
  }
};

// POST /api/admin/login - Simple login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username === 'admin' && password === 'Bindaud@2026') {
    res.json({
      success: true,
      token: 'admin-token-2026',
      message: 'Login successful'
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});

// GET /api/admin/products - Get all products
router.get('/products', authMiddleware, async (req, res) => {
  try {
    const products = await Product.find().populate('category').sort({ createdAt: -1 });
    res.json({ success: true, products: products.map(serializeProduct) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to read products' });
  }
});

// POST /api/admin/products - Add new product
router.post('/products', authMiddleware, uploadFields, async (req, res) => {
  try {
    const productData = await buildProductDocument(req.body, req.files || {});
    const newProduct = await Product.create(productData);

    try {
      await commitGithubFile('data/products.json', JSON.stringify({ products: [serializeProduct(newProduct)] }, null, 2), `Admin: add product ${newProduct.name}`);
    } catch (gitError) {
      console.warn('GitHub commit failed:', gitError.message);
    }

    res.json({ success: true, product: serializeProduct(newProduct), message: 'Product added' });
  } catch (error) {
    res.status(500).json({ success: false, message: `Failed to add product: ${error.message}` });
  }
});

// PUT /api/admin/products/:id - Update product
router.put('/products/:id', authMiddleware, uploadFields, async (req, res) => {
  try {
    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const productData = await buildProductDocument(req.body, req.files || {});
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        ...productData,
        images: Array.isArray(productData.images) && productData.images.length ? productData.images : existingProduct.images,
      },
      { new: true }
    );

    try {
      await commitGithubFile('data/products.json', JSON.stringify({ products: [serializeProduct(updatedProduct)] }, null, 2), `Admin: update product ${updatedProduct.name}`);
    } catch (gitError) {
      console.warn('GitHub commit failed:', gitError.message);
    }

    res.json({ success: true, product: serializeProduct(updatedProduct), message: 'Product updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: `Failed to update product: ${error.message}` });
  }
});

// DELETE /api/admin/products/:id - Delete product
router.delete('/products/:id', authMiddleware, async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    try {
      await commitGithubFile('data/products.json', JSON.stringify({ products: [] }, null, 2), `Admin: delete product ${req.params.id}`);
    } catch (gitError) {
      console.warn('GitHub commit failed:', gitError.message);
    }

    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: `Failed to delete product: ${error.message}` });
  }
});

// POST /api/admin/upload - Upload image to repository
router.post('/upload', authMiddleware, async (req, res) => {
  try {
    const { file, filename } = req.body;

    if (!file) {
      return res.status(400).json({ success: false, message: 'No file provided' });
    }

    const normalizedFilename = normalizeFilename(filename || `product-${Date.now()}.jpg`);
    const filePath = `assets/products/${normalizedFilename}`;
    const fileData = file.includes(',') ? file.split(',')[1] : file;
    const buffer = Buffer.from(fileData, 'base64');

    await commitGithubFile(filePath, buffer, `Admin: upload image ${normalizedFilename}`);

    res.json({
      success: true,
      file: {
        name: normalizedFilename,
        path: filePath,
        uploadedAt: new Date().toISOString()
      },
      message: 'Image uploaded successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: `Failed to upload image: ${error.message}` });
  }
});

// PUBLIC: POST /api/admin/orders - Create order from customer checkout (WhatsApp)
router.post('/orders', async (req, res) => {
  try {
    const Order = require('../models/Order');
    const { sendOrderConfirmation } = require('../services/emailService');

    const orderData = {
      customerName: req.body.customerName || 'Guest',
      email: req.body.email,
      phone: req.body.phone,
      address: req.body.address,
      city: req.body.city,
      postalCode: req.body.postalCode || '',
      province: req.body.province || '',
      products: req.body.products || [],
      subtotal: Number(req.body.subtotal) || 0,
      discount: Number(req.body.discount) || 0,
      shipping: Number(req.body.shipping) || 0,
      tax: Number(req.body.tax) || 0,
      total: Number(req.body.total) || 0,
      paymentMethod: req.body.paymentMethod || 'Cash on Delivery',
      orderStatus: 'pending',
      paymentStatus: 'unpaid',
      createdAt: new Date()
    };

    const order = new Order(orderData);
    const savedOrder = await order.save();

    // Send confirmation email if email is provided
    if (orderData.email) {
      try {
        await sendOrderConfirmation(savedOrder);
      } catch (emailError) {
        console.warn('Email send failed, but order created:', emailError.message);
      }
    }

    res.status(201).json({
      success: true,
      data: savedOrder,
      message: 'Order created successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: `Failed to create order: ${error.message}` });
  }
});

// ADMIN: GET /api/admin/orders - Fetch all orders (admin view)
router.get('/orders', async (req, res) => {
  try {
    const Order = require('../models/Order');
    const orders = await Order.find({}).sort({ createdAt: -1 });
    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    res.status(500).json({ success: false, message: `Failed to fetch orders: ${error.message}` });
  }
});

// ADMIN: PUT /api/admin/orders/:id - Update order status
router.put('/orders/:id', async (req, res) => {
  try {
    const Order = require('../models/Order');
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        orderStatus: req.body.status || req.body.orderStatus,
        paymentStatus: req.body.paymentStatus,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Send shipping update email if status is shipped
    if ((req.body.status === 'shipped' || req.body.orderStatus === 'shipped') && order.email) {
      try {
        const { sendShippingUpdate } = require('../services/emailService');
        await sendShippingUpdate(order);
      } catch (emailError) {
        console.warn('Email send failed:', emailError.message);
      }
    }

    res.json({
      success: true,
      data: order,
      message: 'Order updated successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: `Failed to update order: ${error.message}` });
  }
});

// PUBLIC: POST /api/email - Send email notifications (order confirmation, shipping updates)
router.post('/email', async (req, res) => {
  try {
    const { type, email, customerName, orderData, orderNumber } = req.body;
    
    if (!email || !type) {
      return res.status(400).json({ success: false, message: 'Email and type are required' });
    }

    const { sendMail } = require('../services/emailService');

    if (type === 'order-confirmation') {
      // Send order confirmation email
      const emailHtml = `
        <h2>Order Confirmation</h2>
        <p>Hi ${customerName || 'Customer'},</p>
        <p>Thank you for your order! We've received your order and will process it shortly.</p>
        <h3>Order Details:</h3>
        <p><strong>Order Number:</strong> ${orderNumber || 'N/A'}</p>
        <p><strong>Total Amount:</strong> ${orderData?.total ? `Rs. ${Number(orderData.total).toFixed(2)}` : 'N/A'}</p>
        <h4>Items:</h4>
        <ul>
          ${orderData?.products?.map((item) => `<li>${item.name || 'Product'} × ${item.quantity || 1}</li>`).join('') || '<li>No items</li>'}
        </ul>
        <p>We'll send you a shipping update once your order is dispatched.</p>
        <p>Thank you for shopping with BIN DAUD!</p>
      `;

      await sendMail({
        to: email,
        subject: `Order Confirmation - ${orderNumber || 'Your Order'}`,
        html: emailHtml
      });

      return res.json({ success: true, message: 'Order confirmation email sent' });
    }

    if (type === 'shipping-update') {
      // Send shipping update email
      const emailHtml = `
        <h2>Your Order is on the Way!</h2>
        <p>Hi ${customerName || 'Customer'},</p>
        <p>Good news! Your order has been dispatched and is on its way to you.</p>
        <p><strong>Tracking Number:</strong> ${orderData?.trackingNumber || 'N/A'}</p>
        <p>You can track your shipment using the tracking number above.</p>
        <p>Thank you for your patience!</p>
      `;

      await sendMail({
        to: email,
        subject: `Shipping Update - ${orderNumber || 'Your Order'}`,
        html: emailHtml
      });

      return res.json({ success: true, message: 'Shipping update email sent' });
    }

    res.status(400).json({ success: false, message: `Unknown email type: ${type}` });
  } catch (error) {
    res.status(500).json({ success: false, message: `Failed to send email: ${error.message}` });
  }
});

module.exports = router;
