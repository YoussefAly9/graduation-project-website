import mongoose from 'mongoose';

import Order from '../models/Order.js';
import Product from '../models/Product.js';
import RobotController from '../models/RobotController.js';
import RobotTask from '../models/RobotTask.js';

export const listControllers = async (_req, res, next) => {
  try {
    const controllers = await RobotController.find().sort({ type: 1, name: 1 });
    res.json({ data: controllers });
  } catch (error) {
    next(error);
  }
};

export const heartbeat = async (req, res, next) => {
  try {
    const { identifier, status, batteryLevel, ipAddress } = req.body;

    if (!identifier) {
      return res.status(400).json({ message: 'identifier is required' });
    }

    const controller = await RobotController.findOneAndUpdate(
      { identifier: identifier.toUpperCase() },
      {
        status: status || 'active',
        batteryLevel,
        ipAddress,
        lastHeartbeatAt: new Date()
      },
      { new: true }
    );

    if (!controller) {
      return res.status(404).json({ message: 'Controller not registered' });
    }

    res.json({ data: controller });
  } catch (error) {
    next(error);
  }
};

export const getNextTask = async (req, res, next) => {
  try {
    const { controllerId, identifier } = req.query;

    let controller;
    if (controllerId && mongoose.Types.ObjectId.isValid(controllerId)) {
      controller = await RobotController.findById(controllerId);
    } else if (identifier) {
      controller = await RobotController.findOne({ identifier: identifier.toUpperCase() });
    }

    if (!controller) {
      return res.status(404).json({ message: 'Controller not found' });
    }

    const task = await RobotTask.findOne({ status: 'queued' })
      .sort({ priority: -1, createdAt: 1 })
      .populate('order')
      .populate('items.product');

    if (!task) {
      return res.json({ data: null });
    }

    task.status = 'in_progress';
    task.startedAt = new Date();
    task.controller = controller._id;
    await task.save();

    await task.populate('controller');

    if (task.order) {
      await Order.findByIdAndUpdate(task.order, { status: 'picking' });
    }

    res.json({ data: task });
  } catch (error) {
    next(error);
  }
};

export const updateTaskStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, errorMessage, detections = [] } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid task id' });
    }

    const task = await RobotTask.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (status) {
      task.status = status;
      if (status === 'completed') {
        task.completedAt = new Date();
        if (task.order) {
          await Order.findByIdAndUpdate(task.order, { status: 'ready' });
        }
      }
      if (status === 'failed' && errorMessage) {
        task.errorMessage = errorMessage;
        if (task.order) {
          await Order.findByIdAndUpdate(task.order, { status: 'pending' });
        }
      }
      if (status === 'in_progress' && task.order) {
        await Order.findByIdAndUpdate(task.order, { status: 'picking' });
      }
    }

    if (Array.isArray(detections) && detections.length) {
      const productIds = detections
        .map((detection) => detection.productId)
        .filter((id) => id && mongoose.Types.ObjectId.isValid(id));

      let products = [];
      if (productIds.length) {
        products = await Product.find({ _id: { $in: productIds } });
      }
      const productMap = new Map(products.map((product) => [product._id.toString(), product._id]));

      detections.forEach(({ label, confidence, imageUrl, meta, productId }) => {
        task.detections.push({
          label,
          confidence,
          imageUrl,
          meta,
          product: productId && mongoose.Types.ObjectId.isValid(productId)
            ? productMap.get(productId.toString())
            : undefined
        });
      });
    }

    await task.save();

    const populatedTask = await RobotTask.findById(id)
      .populate('order')
      .populate('items.product')
      .populate('controller');
    res.json({ data: populatedTask });
  } catch (error) {
    next(error);
  }
};


