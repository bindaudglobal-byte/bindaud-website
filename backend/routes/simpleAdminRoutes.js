const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const productsFile = path.join(__dirname, '../data/products.json');
const githubRepository = process.env.GITHUB_REPOSITORY || (process.env.VERCEL_GIT_REPO_OWNER && process.env.VERCEL_GIT_REPO_SLUG ? `${process.env.VERCEL_GIT_REPO_OWNER}/${process.env.VERCEL_GIT_REPO_SLUG}` : '');
const githubBranch = process.env.GITHUB_BRANCH || process.env.VERCEL_GIT_COMMIT_REF || 'main';
const githubToken = process.env.GITHUB_TOKEN;
const GITHUB_API_BASE = 'https://api.github.com';

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

// Helper: Read products from JSON
const readProducts = () => {
  try {
    const data = fs.readFileSync(productsFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return { products: [] };
  }
};

// Helper: Write products to JSON
const writeProducts = (data) => {
  fs.writeFileSync(productsFile, JSON.stringify(data, null, 2), 'utf8');
};

const normalizeFilename = (filename) => {
  const safeName = path.basename(filename || `product-${Date.now()}.jpg`);
  return safeName.replace(/[^a-zA-Z0-9._-]/g, '_');
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
router.get('/products', authMiddleware, (req, res) => {
  try {
    const data = readProducts();
    res.json({ success: true, products: data.products });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to read products' });
  }
});

// POST /api/admin/products - Add new product
router.post('/products', authMiddleware, async (req, res) => {
  try {
    const data = readProducts();
    const newProduct = {
      id: Date.now(),
      ...req.body,
      createdAt: new Date().toISOString()
    };
    data.products.push(newProduct);
    writeProducts(data);

    try {
      await commitGithubFile('data/products.json', JSON.stringify(data, null, 2), `Admin: add product ${newProduct.name}`);
    } catch (gitError) {
      console.warn('GitHub commit failed:', gitError.message);
    }

    res.json({ success: true, product: newProduct, message: 'Product added' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add product' });
  }
});

// PUT /api/admin/products/:id - Update product
router.put('/products/:id', authMiddleware, async (req, res) => {
  try {
    const data = readProducts();
    const productIndex = data.products.findIndex(p => p.id == req.params.id);
    
    if (productIndex === -1) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    data.products[productIndex] = {
      ...data.products[productIndex],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    writeProducts(data);

    try {
      await commitGithubFile('data/products.json', JSON.stringify(data, null, 2), `Admin: update product ${data.products[productIndex].name}`);
    } catch (gitError) {
      console.warn('GitHub commit failed:', gitError.message);
    }

    res.json({ success: true, product: data.products[productIndex], message: 'Product updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update product' });
  }
});

// DELETE /api/admin/products/:id - Delete product
router.delete('/products/:id', authMiddleware, async (req, res) => {
  try {
    const data = readProducts();
    data.products = data.products.filter(p => p.id != req.params.id);
    writeProducts(data);

    try {
      await commitGithubFile('data/products.json', JSON.stringify(data, null, 2), `Admin: delete product ${req.params.id}`);
    } catch (gitError) {
      console.warn('GitHub commit failed:', gitError.message);
    }

    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete product' });
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

module.exports = router;
