import mongoose from 'mongoose';

const taskItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      min: 1,
      required: true
    },
    storageLocation: {
      zone: String,
      aisle: String,
      shelf: String,
      bin: String
    }
  },
  { _id: false }
);

const detectionSchema = new mongoose.Schema(
  {
    label: String,
    confidence: Number,
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    imageUrl: String,
    detectedAt: {
      type: Date,
      default: Date.now
    },
    meta: mongoose.Schema.Types.Mixed
  },
  { _id: false }
);

const robotTaskSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    controller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RobotController'
    },
    type: {
      type: String,
      enum: ['fulfillment', 'restock', 'inventory-audit'],
      default: 'fulfillment'
    },
    status: {
      type: String,
      enum: ['queued', 'in_progress', 'completed', 'failed'],
      default: 'queued'
    },
    priority: {
      type: Number,
      default: 3,
      min: 1,
      max: 5
    },
    items: {
      type: [taskItemSchema],
      default: []
    },
    startedAt: Date,
    completedAt: Date,
    errorMessage: String,
    detections: {
      type: [detectionSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

robotTaskSchema.index({ status: 1, priority: 1, createdAt: 1 });

const RobotTask = mongoose.models.RobotTask || mongoose.model('RobotTask', robotTaskSchema);

export default RobotTask;


