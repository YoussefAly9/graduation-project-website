import dotenv from 'dotenv';
import mongoose from 'mongoose';

import Product from '../src/models/Product.js';
import { seedProducts } from '../src/data/products.js';

dotenv.config();

const toDbProduct = ({ id, ...product }) => product;

const reseedProducts = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('MONGODB_URI is not set. Aborting reseed.');
    process.exit(1);
  }

  await mongoose.connect(uri);

  const deleted = await Product.deleteMany({});
  const inserted = await Product.insertMany(seedProducts.map(toDbProduct));

  console.log(`Removed ${deleted.deletedCount} products.`);
  console.log(`Inserted ${inserted.length} products.`);

  await mongoose.disconnect();
};

reseedProducts().catch((error) => {
  console.error('Reseed failed:', error);
  process.exit(1);
});
