import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    price: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      trim: true
    },
    sku: {
      type: String,
      trim: true,
      uppercase: true,
      unique: true
    },
    stock: {
      type: Number,
      default: 0,
      min: 0
    },
    storageLocation: {
      type: {
        zone: {
          type: String,
          trim: true
        },
        aisle: {
          type: String,
          trim: true
        },
        shelf: {
          type: String,
          trim: true
        },
        bin: {
          type: String,
          trim: true
        }
      },
      default: undefined,
      _id: false
    },
    weightKg: {
      type: Number,
      min: 0
    },
    image: {
      type: String,
      trim: true
    },
    category: {
      type: String,
      trim: true
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    isPopular: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

export default Product;

