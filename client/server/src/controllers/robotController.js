import mongoose from 'mongoose';

import connectDatabase from '../config/database.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import RobotController from '../models/RobotController.js';
import RobotTask from '../models/RobotTask.js';
import { emitRobotEvent } from '../realtime/eventBus.js';
import {
  applyExecutionUpdate,
  cancelOrderTask,
  dispatchOrderToRobot,
  getRobotSnapshot
} from '../services/robotIntegration.js';

export const listControllers = async (_req, res, next) => {
  try {
    await connectDatabase();
    const controllers = await RobotController.find().sort({ type: 1, name: 1 });
    res.json({ data: controllers });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/robot/send-order
 * Dispatch an existing order to the robot queue (idempotent — no duplicate tasks).
 * Body: { orderId, priority? }
 */
export const sendOrder = async (req, res, next) => {
  try {
    await connectDatabase();
    const { orderId, priority } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: 'orderId is required' });
    }

    const result = await dispatchOrderToRobot(orderId, { priority });

    return res.status(result.created ? 201 : 200).json({
      data: result.task,
      duplicate: result.duplicate,
      message: result.duplicate
        ? 'Order already has an active robot task'
        : 'Order dispatched to robot'
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
};

/**
 * GET /api/robot/status[?orderId=&taskId=]
 * Returns robots + active tasks, or a single task snapshot. Used for polling.
 */
export const getStatus = async (req, res, next) => {
  try {
    await connectDatabase();

    // Degrade gracefully when the DB is unavailable so the live UI keeps working.
    if (mongoose.connection.readyState !== 1) {
      return res.json({
        data: { robots: [], activeTasks: [], robotsOnline: 0, task: null, dbConnected: false }
      });
    }

    const { orderId, taskId } = req.query;
    const snapshot = await getRobotSnapshot({ orderId, taskId });
    res.json({ data: snapshot });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/robot/update-status
 * The ROS 2 bridge / robot posts execution updates here.
 * Body: { taskId|orderId, state, step?, progress?, location?, errorMessage?, robotId?, detections? }
 */
export const updateStatus = async (req, res, next) => {
  try {
    await connectDatabase();
    const result = await applyExecutionUpdate(req.body);
    res.json({ data: result.task, ignored: result.ignored });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
};

/**
 * POST /api/robot/cancel-order
 * Cancel an order's robot task (safe mid-execution).
 * Body: { orderId|taskId, reason? }
 */
export const cancelOrder = async (req, res, next) => {
  try {
    await connectDatabase();
    const { orderId, taskId, reason } = req.body;

    if (!orderId && !taskId) {
      return res.status(400).json({ message: 'orderId or taskId is required' });
    }

    const result = await cancelOrderTask({ orderId, taskId, reason });
    res.json({ data: result.task, message: 'Robot task cancelled' });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
};

export const heartbeat = async (req, res, next) => {
  try {
    await connectDatabase();
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
    await connectDatabase();
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
    task.executionStatus = 'accepted';
    task.currentStep = 'Robot accepted the task';
    task.startedAt = new Date();
    task.controller = controller._id;
    task.assignedRobotId = controller.identifier;
    task.feedback.push({
      state: 'accepted',
      step: 'Robot accepted the task',
      progress: task.progress || 0,
      at: new Date()
    });
    await task.save();

    await task.populate('controller');

    if (task.order) {
      await Order.findByIdAndUpdate(task.order, {
        status: 'picking',
        robotStatus: 'accepted',
        currentStep: 'Robot accepted the task',
        assignedRobotId: controller.identifier
      });
    }

    emitRobotEvent({
      type: 'task_accepted',
      orderId: task.order ? task.order.toString() : null,
      taskId: task._id.toString(),
      robotStatus: 'accepted',
      currentStep: task.currentStep,
      robotId: controller.identifier
    });

    res.json({ data: task });
  } catch (error) {
    next(error);
  }
};

export const updateTaskStatus = async (req, res, next) => {
  try {
    await connectDatabase();
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


