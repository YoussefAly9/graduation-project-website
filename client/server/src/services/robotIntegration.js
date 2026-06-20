import mongoose from 'mongoose';

import Order from '../models/Order.js';
import Product from '../models/Product.js';
import RobotController from '../models/RobotController.js';
import RobotTask, { EXECUTION_STATES } from '../models/RobotTask.js';
import { emitRobotEvent } from '../realtime/eventBus.js';

/**
 * Robot integration service.
 *
 * This is the single source of truth that translates between:
 *   - Website order lifecycle (Order.status)
 *   - Robot execution lifecycle (RobotTask.executionStatus, reported via ROS 2)
 *
 * It is deliberately transport-agnostic: the ROS 2 bridge talks to the backend
 * over REST, and these functions perform the DB writes + emit realtime events.
 */

// Map a granular robot execution state -> coarse Order.status (existing enum).
const EXECUTION_TO_ORDER_STATUS = {
  pending: 'queued',
  sent: 'queued',
  accepted: 'picking',
  rejected: 'pending',
  navigating: 'picking',
  product_found: 'picking',
  picking: 'picking',
  placing: 'picking',
  completed: 'ready',
  failed: 'pending',
  cancelled: 'cancelled'
};

// Map a granular robot execution state -> coarse RobotTask.status.
const EXECUTION_TO_TASK_STATUS = {
  pending: 'queued',
  sent: 'queued',
  accepted: 'in_progress',
  rejected: 'failed',
  navigating: 'in_progress',
  product_found: 'in_progress',
  picking: 'in_progress',
  placing: 'in_progress',
  completed: 'completed',
  failed: 'failed',
  cancelled: 'cancelled'
};

const TERMINAL_EXECUTION_STATES = ['completed', 'failed', 'rejected', 'cancelled'];

export const isValidExecutionState = (state) => EXECUTION_STATES.includes(state);

const toId = (value) => (value && value._id ? value._id : value);

/**
 * Dispatch an order to the robot system (idempotent).
 *
 * - Creates a RobotTask for the order if one does not already exist.
 * - Will NOT create a duplicate task if an active (queued/in_progress) task exists,
 *   which prevents double execution if the endpoint is called twice.
 *
 * @param {string} orderId
 * @param {object} [options] - { priority }
 * @returns {Promise<{ task, order, created, duplicate }>}
 */
export const dispatchOrderToRobot = async (orderId, options = {}) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    const error = new Error('Invalid order id');
    error.statusCode = 400;
    throw error;
  }

  const order = await Order.findById(orderId).populate('items.product');
  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  if (['cancelled', 'refunded'].includes(order.status)) {
    const error = new Error(`Cannot dispatch a ${order.status} order to the robot`);
    error.statusCode = 409;
    throw error;
  }

  // Guard against duplicate execution: reuse any existing active task.
  const existingTask = await RobotTask.findOne({
    order: order._id,
    status: { $in: ['queued', 'in_progress'] }
  });

  if (existingTask) {
    return { task: existingTask, order, created: false, duplicate: true };
  }

  const taskItems = order.items.map((item) => ({
    product: toId(item.product),
    quantity: item.quantity,
    storageLocation:
      item.product && item.product.storageLocation ? item.product.storageLocation : undefined
  }));

  const task = await RobotTask.create({
    order: order._id,
    type: 'fulfillment',
    status: 'queued',
    executionStatus: 'sent',
    currentStep: 'Order sent to robot queue',
    priority: options.priority || 3,
    progress: 0,
    items: taskItems,
    feedback: [
      {
        state: 'sent',
        step: 'Order queued for the robot',
        progress: 0,
        at: new Date()
      }
    ]
  });

  order.robotTask = task._id;
  order.robotTaskId = task._id;
  order.robotStatus = 'sent';
  order.currentStep = 'Order sent to robot queue';
  if (order.status === 'pending') {
    order.status = 'queued';
  }
  await order.save();

  emitRobotEvent({
    type: 'task_dispatched',
    orderId: order._id.toString(),
    taskId: task._id.toString(),
    robotStatus: 'sent',
    currentStep: order.currentStep,
    progress: 0
  });

  return { task, order, created: true, duplicate: false };
};

/**
 * Apply a robot execution status update (called by the ROS 2 bridge / robot).
 *
 * @param {object} params
 * @param {string} [params.taskId]
 * @param {string} [params.orderId]
 * @param {string} params.state - one of EXECUTION_STATES
 * @param {string} [params.step] - human-readable step
 * @param {number} [params.progress] - 0..100
 * @param {object} [params.location] - { x, y, zone, label }
 * @param {string} [params.errorMessage]
 * @param {string} [params.robotId] - robot identifier/namespace
 * @param {Array}  [params.detections]
 */
export const applyExecutionUpdate = async ({
  taskId,
  orderId,
  state,
  step,
  progress,
  location,
  errorMessage,
  robotId,
  detections = []
}) => {
  if (!isValidExecutionState(state)) {
    const error = new Error(
      `Invalid execution state "${state}". Valid states: ${EXECUTION_STATES.join(', ')}`
    );
    error.statusCode = 400;
    throw error;
  }

  // Locate the task by id or by order id.
  let task = null;
  if (taskId && mongoose.Types.ObjectId.isValid(taskId)) {
    task = await RobotTask.findById(taskId);
  } else if (orderId && mongoose.Types.ObjectId.isValid(orderId)) {
    task = await RobotTask.findOne({ order: orderId }).sort({ createdAt: -1 });
  }

  if (!task) {
    const error = new Error('Robot task not found for the given taskId/orderId');
    error.statusCode = 404;
    throw error;
  }

  // Ignore updates for tasks that already finished (prevents out-of-order writes).
  if (TERMINAL_EXECUTION_STATES.includes(task.executionStatus)) {
    return { task, order: await Order.findById(task.order), ignored: true };
  }

  // Update task execution fields.
  task.executionStatus = state;
  task.status = EXECUTION_TO_TASK_STATUS[state] || task.status;
  if (step) task.currentStep = step;
  if (typeof progress === 'number') task.progress = Math.max(0, Math.min(100, progress));
  if (location) task.currentLocation = location;
  if (robotId) task.assignedRobotId = robotId;

  if (!task.startedAt && ['accepted', 'navigating', 'product_found', 'picking', 'placing'].includes(state)) {
    task.startedAt = new Date();
  }

  if (state === 'completed') {
    task.completedAt = new Date();
    task.progress = 100;
  }

  if (state === 'failed' || state === 'rejected') {
    task.failureReason = errorMessage || `Robot reported ${state}`;
    task.errorMessage = task.failureReason;
  }

  // Append detections (product detection results).
  if (Array.isArray(detections) && detections.length) {
    const productIds = detections
      .map((d) => d.productId)
      .filter((id) => id && mongoose.Types.ObjectId.isValid(id));
    let products = [];
    if (productIds.length) {
      products = await Product.find({ _id: { $in: productIds } });
    }
    const productMap = new Map(products.map((p) => [p._id.toString(), p._id]));
    detections.forEach(({ label, confidence, imageUrl, meta, productId }) => {
      task.detections.push({
        label,
        confidence,
        imageUrl,
        meta,
        product:
          productId && mongoose.Types.ObjectId.isValid(productId)
            ? productMap.get(productId.toString())
            : undefined
      });
    });
  }

  // Append a feedback timeline entry.
  task.feedback.push({
    state,
    step: step || task.currentStep,
    message: errorMessage,
    progress: task.progress,
    location,
    at: new Date()
  });

  await task.save();

  // Mirror onto the order document.
  const order = await Order.findById(task.order);
  if (order) {
    order.robotStatus = state;
    order.robotTaskId = task._id;
    if (robotId) order.assignedRobotId = robotId;
    if (step) order.currentStep = step;

    const mappedOrderStatus = EXECUTION_TO_ORDER_STATUS[state];
    if (mappedOrderStatus && !['cancelled', 'refunded'].includes(order.status)) {
      order.status = mappedOrderStatus;
    }

    if (!order.startedAt && task.startedAt) order.startedAt = task.startedAt;
    if (state === 'completed') order.completedAt = new Date();
    if (state === 'failed' || state === 'rejected') {
      order.failureReason = task.failureReason;
    }

    await order.save();
  }

  emitRobotEvent({
    type: 'execution_update',
    orderId: order ? order._id.toString() : null,
    taskId: task._id.toString(),
    robotStatus: state,
    currentStep: task.currentStep,
    progress: task.progress,
    location: task.currentLocation,
    robotId: task.assignedRobotId,
    errorMessage: task.failureReason
  });

  return { task, order, ignored: false };
};

/**
 * Cancel an order's robot task — safe to call even mid-execution.
 */
export const cancelOrderTask = async ({ orderId, taskId, reason }) => {
  let task = null;
  if (taskId && mongoose.Types.ObjectId.isValid(taskId)) {
    task = await RobotTask.findById(taskId);
  } else if (orderId && mongoose.Types.ObjectId.isValid(orderId)) {
    task = await RobotTask.findOne({ order: orderId }).sort({ createdAt: -1 });
  }

  if (!task) {
    const error = new Error('Robot task not found');
    error.statusCode = 404;
    throw error;
  }

  if (['completed'].includes(task.status)) {
    const error = new Error('Cannot cancel a completed task');
    error.statusCode = 409;
    throw error;
  }

  task.status = 'cancelled';
  task.executionStatus = 'cancelled';
  task.currentStep = 'Cancelled';
  task.failureReason = reason || 'Cancelled by website';
  task.feedback.push({
    state: 'cancelled',
    step: 'Task cancelled',
    message: reason || 'Cancelled by website',
    progress: task.progress,
    at: new Date()
  });
  await task.save();

  const order = await Order.findById(task.order);
  if (order) {
    order.robotStatus = 'cancelled';
    order.currentStep = 'Cancelled';
    order.failureReason = reason || 'Cancelled by website';
    await order.save();
  }

  emitRobotEvent({
    type: 'task_cancelled',
    orderId: order ? order._id.toString() : null,
    taskId: task._id.toString(),
    robotStatus: 'cancelled',
    currentStep: 'Cancelled',
    errorMessage: task.failureReason
  });

  return { task, order };
};

/**
 * Build a status snapshot for the website (robots + active tasks).
 * Optionally narrowed to a single order or task.
 */
export const getRobotSnapshot = async ({ orderId, taskId } = {}) => {
  // Heartbeat threshold: a robot is "online" if seen within the last 30s.
  const ONLINE_THRESHOLD_MS = 30 * 1000;

  if (taskId && mongoose.Types.ObjectId.isValid(taskId)) {
    const task = await RobotTask.findById(taskId)
      .populate('order')
      .populate('items.product')
      .populate('controller');
    return { task };
  }

  if (orderId && mongoose.Types.ObjectId.isValid(orderId)) {
    const task = await RobotTask.findOne({ order: orderId })
      .sort({ createdAt: -1 })
      .populate('items.product')
      .populate('controller');
    return { task };
  }

  const [controllers, activeTasks] = await Promise.all([
    RobotController.find().sort({ type: 1, name: 1 }).lean(),
    RobotTask.find({ status: { $in: ['queued', 'in_progress'] } })
      .sort({ priority: -1, createdAt: 1 })
      .limit(25)
      .populate('items.product')
      .lean()
  ]);

  const now = Date.now();
  const robots = controllers.map((c) => ({
    ...c,
    online: c.lastHeartbeatAt ? now - new Date(c.lastHeartbeatAt).getTime() < ONLINE_THRESHOLD_MS : false
  }));

  return {
    robots,
    activeTasks,
    robotsOnline: robots.filter((r) => r.online).length,
    generatedAt: new Date().toISOString()
  };
};
