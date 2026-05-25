import mongoose from 'mongoose';

import Product from '../models/Product.js';
import { seedProducts } from '../data/products.js';

const isDatabaseConnected = () => mongoose.connection.readyState === 1;

export const listProducts = async (req, res, next) => {
  try {
    if (!isDatabaseConnected()) {
      return res.json({ data: seedProducts });
    }

    const { tag, category, search, limit = 50 } = req.query;
    const filter = {};

    if (tag === 'featured') {
      filter.isFeatured = true;
    }

    if (tag === 'popular') {
      filter.isPopular = true;
    }

    if (category) {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .lean();
    res.json({ data: products });
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid product id' });
    }

    const product = await Product.findById(id).lean();

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ data: product });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    if (!isDatabaseConnected()) {
      return res.status(503).json({
        message: 'Database connection is not available. Please configure MONGODB_URI before creating products.'
      });
    }

    const product = await Product.create(req.body);
    res.status(201).json({ data: product });
  } catch (error) {
    next(error);
  }
};

