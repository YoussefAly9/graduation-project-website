import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
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
    price: {
      type: Number,
      min: 0,
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

const orderSchema = new mongoose.Schema(
  {
    customer: {
      name: {
        type: String,
        trim: true
      },
      phone: {
        type: String,
        trim: true
      },
      email: {
        type: String,
        trim: true
      }
    },
    channel: {
      type: String,
      enum: ['web', 'mobile', 'kiosk', 'robot'],
      default: 'web'
    },
    deliveryMethod: {
      type: String,
      enum: ['pickup', 'delivery'],
      default: 'pickup'
    },
    status: {
      type: String,
      enum: ['pending', 'queued', 'picking', 'ready', 'completed', 'cancelled', 'refunded'],
      default: 'pending'
    },
    total: {
      type: Number,
      min: 0,
      default: 0
    },
    items: {
      type: [orderItemSchema],
      required: true
    },
    robotTask: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RobotTask'
    },
    notes: {
      type: String,
      trim: true
    },
    // Advanced order management fields
    statusHistory: [{
      status: {
        type: String,
        enum: ['pending', 'queued', 'picking', 'ready', 'completed', 'cancelled', 'refunded'],
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      changedBy: {
        type: String,
        trim: true
      },
      reason: {
        type: String,
        trim: true
      }
    }],
    cancellation: {
      cancelledAt: Date,
      cancelledBy: String,
      reason: String,
      refundAmount: Number,
      refundStatus: {
        type: String,
        enum: ['pending', 'processed', 'failed'],
        default: 'pending'
      },
      refundTransactionId: String
    },
    delivery: {
      trackingNumber: String,
      carrier: String,
      estimatedDelivery: Date,
      actualDelivery: Date,
      address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
      },
      status: {
        type: String,
        enum: ['pending', 'preparing', 'shipped', 'in_transit', 'out_for_delivery', 'delivered', 'failed'],
        default: 'pending'
      },
      updates: [{
        status: String,
        location: String,
        timestamp: {
          type: Date,
          default: Date.now
        },
        notes: String
      }]
    },
    modifications: [{
      modifiedAt: {
        type: Date,
        default: Date.now
      },
      modifiedBy: String,
      changes: {
        items: [orderItemSchema],
        total: Number,
        notes: String
      },
      reason: String
    }],
    specialInstructions: {
      type: String,
      trim: true
    },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed
    }
  },
  {
    timestamps: true
  }
);

orderSchema.index({ status: 1, createdAt: 1 });
orderSchema.index({ 'delivery.trackingNumber': 1 });
orderSchema.index({ 'customer.email': 1 });

// Middleware to automatically track status changes
orderSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    if (!this.statusHistory) {
      this.statusHistory = [];
    }
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      changedBy: this.metadata?.get('lastModifiedBy') || 'system',
      reason: this.metadata?.get('statusChangeReason') || null
    });
  }
  next();
});

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

export default Order;


