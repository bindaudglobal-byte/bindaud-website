const Category = require('../models/Category');
const { validateObjectId } = require('../utils/validators');

const getCategories = async (_req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

const getCategoryById = async (req, res, next) => {
  try {
    validateObjectId(req.params.id);
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const category = await Category.create({
      name: req.body.name,
      slug: req.body.slug || req.body.name.toLowerCase().replace(/\s+/g, '-'),
      description: req.body.description || '',
      image: req.body.image || '',
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
    });
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    validateObjectId(req.params.id);
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    Object.assign(category, {
      name: req.body.name || category.name,
      slug: req.body.slug || category.slug,
      description: req.body.description !== undefined ? req.body.description : category.description,
      image: req.body.image !== undefined ? req.body.image : category.image,
      isActive: req.body.isActive !== undefined ? req.body.isActive : category.isActive,
    });

    await category.save();
    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    validateObjectId(req.params.id);
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
