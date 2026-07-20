const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');

const uri = 'mongodb+srv://bindaudglobal_db_user:Bindaud213@cluster0.qpdqxe3.mongodb.net/bindaud?retryWrites=true&w=majority';

(async () => {
  try {
    await mongoose.connect(uri);
    console.log('Connected to Atlas');

    const category = await Category.findOne();
    if (!category) {
      console.error('No category found to attach product to');
      process.exit(1);
    }

    const product = await Product.create({
      name: `TEST PRODUCT ${Date.now()}`,
      description: 'This is a test product for verification',
      price: 100,
      category: category._id,
      stock: 10,
      isActive: true,
    });

    console.log('Created product id:', product._id.toString());

    const found = await Product.findById(product._id);
    console.log('Found product:', !!found);

    await mongoose.disconnect();
    process.exit(0);
  } catch (e) {
    console.error('ERROR', e);
    process.exit(1);
  }
})();
