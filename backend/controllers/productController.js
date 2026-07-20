const Product = require('../models/Product');
const Category = require('../models/Category');
const { uploadToCloudinary } = require('../config/cloudinary');
const { validateObjectId } = require('../utils/validators');

const parseList = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }

  return [];
};

const getProducts = async (req, res, next) => {
  try {
    const query = { isActive: true };
    const { q, category, featured, bestSeller, minPrice, maxPrice, sort = 'newest', page = 1, limit = 12 } = req.query;

    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { collectionName: { $regex: q, $options: 'i' } },
      ];
    }

    if (category) {
      query.category = category;
    }

    if (featured === 'true') {
      query.featured = true;
    }

    if (bestSeller === 'true') {
      query.bestSeller = true;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const sortOptions = {
      newest: { createdAt: -1 },
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      rating: { rating: -1 },
    };

    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      Product.find(query).populate('category').sort(sortOptions[sort] || sortOptions.newest).skip(skip).limit(Number(limit)),
      Product.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    validateObjectId(req.params.id);
    const product = await Product.findById(req.params.id).populate('category').populate('reviews');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const category = await Category.findById(req.body.category);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const images = [];
    if (req.files?.images) {
      for (const file of req.files.images) {
        const result = await uploadToCloudinary(file.buffer, 'bindaud/products');
        images.push({ url: result.secure_url, publicId: result.public_id });
      }
    }

    let video = null;
    if (req.files?.video?.[0]) {
      const result = await uploadToCloudinary(req.files.video[0].buffer, 'bindaud/videos');
      video = { url: result.secure_url, publicId: result.public_id };
    }

    const product = await Product.create({
      name: req.body.name,
      description: req.body.description,
      price: Number(req.body.price),
      salePrice: Number(req.body.salePrice || 0),
      category: req.body.category,
      sizes: parseList(req.body.sizes),
      colors: parseList(req.body.colors),
      stock: Number(req.body.stock || 0),
      images,
      video,
      rating: Number(req.body.rating || 0),
      featured: req.body.featured === 'true' || req.body.featured === true,
      bestSeller: req.body.bestSeller === 'true' || req.body.bestSeller === true,
      collectionName: req.body.collection || '',
      isActive: req.body.isActive !== 'false',
    });

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    validateObjectId(req.params.id);
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (req.files?.images) {
      const images = [];
      for (const file of req.files.images) {
        const result = await uploadToCloudinary(file.buffer, 'bindaud/products');
        images.push({ url: result.secure_url, publicId: result.public_id });
      }
      product.images = images;
    }

    if (req.files?.video?.[0]) {
      const result = await uploadToCloudinary(req.files.video[0].buffer, 'bindaud/videos');
      product.video = { url: result.secure_url, publicId: result.public_id };
    }

    Object.assign(product, {
      name: req.body.name || product.name,
      description: req.body.description || product.description,
      price: req.body.price !== undefined ? Number(req.body.price) : product.price,
      salePrice: req.body.salePrice !== undefined ? Number(req.body.salePrice) : product.salePrice,
      category: req.body.category || product.category,
      sizes: req.body.sizes ? parseList(req.body.sizes) : product.sizes,
      colors: req.body.colors ? parseList(req.body.colors) : product.colors,
      stock: req.body.stock !== undefined ? Number(req.body.stock) : product.stock,
      rating: req.body.rating !== undefined ? Number(req.body.rating) : product.rating,
      featured: req.body.featured !== undefined ? req.body.featured === 'true' || req.body.featured === true : product.featured,
      bestSeller: req.body.bestSeller !== undefined ? req.body.bestSeller === 'true' || req.body.bestSeller === true : product.bestSeller,
      collectionName: req.body.collection !== undefined ? req.body.collection : product.collectionName,
      isActive: req.body.isActive !== undefined ? req.body.isActive !== 'false' : product.isActive,
    });

    await product.save();
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    validateObjectId(req.params.id);
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
