const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const Category = require('./models/Category');
const Product = require('./models/Product');

dotenv.config();

const sampleCategories = [
  { name: 'Kimonos', slug: 'kimono', description: 'Premium contemporary kimono styles.' },
  { name: 'Jackets', slug: 'jackets', description: 'Luxury jackets with streetwear edge.' },
  { name: 'Tees', slug: 'tees', description: 'Oversized premium tees for daily wear.' },
];

const sampleProducts = [
  {
    name: 'Oversized Dragon Tee',
    description: 'Legacy meets street culture in the Oversized Dragon Tee. Designed for the modern explorer with premium cotton and a relaxed silhouette.',
    price: 2499,
    salePrice: 2499,
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Black', 'Sand'],
    stock: 45,
    images: [{ url: 'https://via.placeholder.com/650x850?text=Oversized+Dragon+Tee' }],
    rating: 4.9,
    featured: false,
    bestSeller: true,
    collectionName: 'tees',
    isActive: true,
  },
  {
    name: 'Urban Odyssey Cardigan',
    description: 'A luxury cardigan with clean lines, premium texture, and an oversized fit inspired by urban motion and modern craftsmanship.',
    price: 1884,
    salePrice: 1884,
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    colors: ['Charcoal', 'Navy'],
    stock: 32,
    images: [{ url: 'https://via.placeholder.com/650x850?text=Urban+Odyssey+Cardigan' }],
    rating: 4.8,
    featured: true,
    bestSeller: false,
    collectionName: 'jackets',
    isActive: true,
  },
  {
    name: 'Premium Kimono',
    description: 'A premium kimono that blends heritage-inspired tailoring with a modern streetwear silhouette.',
    price: 1899,
    salePrice: 1899,
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Ivory', 'Graphite'],
    stock: 18,
    images: [{ url: 'https://via.placeholder.com/650x850?text=Premium+Kimono' }],
    rating: 4.7,
    featured: false,
    bestSeller: false,
    collectionName: 'kimono',
    isActive: true,
  },
  {
    name: 'Crane Kimono',
    description: 'A sculpted kimono for elevated layering, featuring smooth comfort and a contemporary oversized cut.',
    price: 1899,
    salePrice: 1899,
    sizes: ['M', 'L', 'XL', '2XL'],
    colors: ['Jet Black', 'Stone'],
    stock: 26,
    images: [{ url: 'https://via.placeholder.com/650x850?text=Crane+Kimono' }],
    rating: 4.6,
    featured: false,
    bestSeller: true,
    collectionName: 'kimono',
    isActive: true,
  },
  {
    name: 'Premium Jacket',
    description: 'Constructed for seasonless performance and a luxury streetwear look, this jacket is built to stand out.',
    price: 4999,
    salePrice: 4999,
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Olive', 'Graphite'],
    stock: 40,
    images: [{ url: 'https://via.placeholder.com/650x850?text=Premium+Jacket' }],
    rating: 4.9,
    featured: false,
    bestSeller: true,
    collectionName: 'jackets',
    isActive: true,
  },
  {
    name: 'Limited Edition',
    description: 'A limited release that merges artistry with tailored comfort for an iconic wardrobe statement.',
    price: 5999,
    salePrice: 5999,
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    colors: ['Midnight', 'Cream'],
    stock: 22,
    images: [{ url: 'https://via.placeholder.com/650x850?text=Limited+Edition' }],
    rating: 4.8,
    featured: true,
    bestSeller: false,
    collectionName: 'tees',
    isActive: true,
  },
];

const seed = async () => {
  try {
    await connectDB();

    const categoryDocs = {};
    for (const category of sampleCategories) {
      const existing = await Category.findOne({ slug: category.slug });
      if (existing) {
        categoryDocs[category.slug] = existing;
      } else {
        const created = await Category.create(category);
        categoryDocs[category.slug] = created;
      }
    }

    for (const productData of sampleProducts) {
      const productExists = await Product.findOne({ name: productData.name });
      if (productExists) {
        console.log(`Product already exists: ${productData.name}`);
        continue;
      }

      const category = categoryDocs[productData.collectionName];
      if (!category) {
        throw new Error(`Missing category for product ${productData.name}`);
      }

      await Product.create({
        ...productData,
        category: category._id,
      });
      console.log(`Created product: ${productData.name}`);
    }

    const total = await Product.countDocuments();
    console.log(`Seed complete. Total products: ${total}`);
  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seed();
