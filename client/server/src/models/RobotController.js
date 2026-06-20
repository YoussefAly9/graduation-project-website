import mongoose from 'mongoose';

const robotControllerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    identifier: {
      type: String,
      required: true,
      unique: true,
      uppercase: true
    },
    type: {
      type: String,
      enum: ['arduino', 'raspberry_pi'],
      required: true
    },
    hardware: {
      type: String,
      trim: true
    },
    firmwareVersion: {
      type: String,
      trim: true
    },
    capabilities: {
      type: [String],
      default: []
    },
    description: {
      type: String,
      trim: true
    },
    ipAddress: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ['idle', 'active', 'charging', 'error', 'offline'],
      default: 'idle'
    },
    batteryLevel: {
      type: Number,
      min: 0,
      max: 100
    },
    lastHeartbeatAt: {
      type: Date
    },
    notes: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

robotControllerSchema.index({ type: 1, status: 1 });

const RobotController =
  mongoose.models.RobotController || mongoose.model('RobotController', robotControllerSchema);

export default RobotController;


