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

// Granular ROS 2 execution lifecycle reported by the robot/bridge.
export const EXECUTION_STATES = [
  'pending', // task created, not yet dispatched
  'sent', // dispatched to the robot/bridge
  'accepted', // robot accepted the task
  'rejected', // robot rejected the task
  'navigating', // moving to a product location
  'product_found', // detection succeeded for current item
  'picking', // executing pick
  'placing', // placing into basket/tote
  'completed', // all items fulfilled
  'failed', // unrecoverable error
  'cancelled' // cancelled by website/operator
];

// One feedback entry per robot update — builds a live timeline of execution.
const feedbackSchema = new mongoose.Schema(
  {
    state: { type: String, enum: EXECUTION_STATES },
    step: String,
    message: String,
    progress: { type: Number, min: 0, max: 100 },
    location: {
      x: Number,
      y: Number,
      zone: String,
      label: String
    },
    at: { type: Date, default: Date.now }
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
    // Free-form robot identifier (e.g. ROS namespace) so the system works even
    // before a RobotController document exists. Enables multiple robots.
    assignedRobotId: {
      type: String,
      trim: true
    },
    type: {
      type: String,
      enum: ['fulfillment', 'restock', 'inventory-audit'],
      default: 'fulfillment'
    },
    // Coarse status kept for backward compatibility with existing queue logic.
    status: {
      type: String,
      enum: ['queued', 'in_progress', 'completed', 'failed', 'cancelled'],
      default: 'queued'
    },
    // Fine-grained state the website shows live to the user/admin.
    executionStatus: {
      type: String,
      enum: EXECUTION_STATES,
      default: 'pending'
    },
    currentStep: {
      type: String,
      trim: true
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    currentLocation: {
      x: Number,
      y: Number,
      zone: String,
      label: String
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
    failureReason: String,
    feedback: {
      type: [feedbackSchema],
      default: []
    },
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
robotTaskSchema.index({ executionStatus: 1 });
robotTaskSchema.index({ assignedRobotId: 1 });

const RobotTask = mongoose.models.RobotTask || mongoose.model('RobotTask', robotTaskSchema);

export default RobotTask;


