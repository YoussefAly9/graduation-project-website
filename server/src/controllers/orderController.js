import mongoose from 'mongoose';

import Order from '../models/Order.js';
import Product from '../models/Product.js';
import RobotController from '../models/RobotController.js';
import RobotTask from '../models/RobotTask.js';

const buildOrderItems = (productsMap, items) =>
  items.map(({ productId, quantity }) => {
    const product = productsMap.get(productId.toString());
    return {
      product: product._id,
      quantity,
      price: product.price,
      storageLocation: product.storageLocation
    };
  });

export const listOrders = async (req, res, next) => {
  try {
    const { status, limit = 25 } = req.query;
    const query = {};
    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .populate('items.product')
      .populate('robotTask');

    res.json({ data: orders });
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid order id' });
    }

    const order = await Order.findById(id).populate('items.product').populate('robotTask');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({ data: order });
  } catch (error) {
    next(error);
  }
};

export const createOrder = async (req, res, next) => {
  try {
    const { customer = {}, channel = 'web', deliveryMethod = 'pickup', items = [], notes } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order items are required' });
    }

    const productIds = items.map((item) => item.productId);

    const invalidProductId = productIds.some((productId) => !mongoose.Types.ObjectId.isValid(productId));

    if (invalidProductId) {
      return res.status(400).json({ message: 'One or more product ids are invalid' });
    }
    const products = await Product.find({ _id: { $in: productIds } });

    if (products.length !== items.length) {
      return res.status(400).json({ message: 'One or more products are invalid' });
    }

    const productsMap = new Map(products.map((product) => [product._id.toString(), product]));

    const orderItems = buildOrderItems(productsMap, items);
    const total = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // prevent negative stock
    const insufficientStock = orderItems.some(({ product, quantity }) => {
      const productDoc = productsMap.get(product.toString());
      return typeof productDoc.stock === 'number' && productDoc.stock < quantity;
    });

    if (insufficientStock) {
      return res.status(409).json({ message: 'Insufficient stock for one or more items' });
    }

    const order = await Order.create({
      customer,
      channel,
      deliveryMethod,
      status: 'queued',
      total,
      items: orderItems,
      notes
    });

    await Promise.all(
      orderItems.map(({ product, quantity }) =>
        Product.updateOne({ _id: product }, { $inc: { stock: -quantity } })
      )
    );

    const coordinator = await RobotController.findOne({ type: 'raspberry_pi' }).sort({ createdAt: 1 });

    const task = await RobotTask.create({
      order: order._id,
      controller: coordinator?._id,
      type: 'fulfillment',
      status: 'queued',
      priority: 3,
      items: orderItems.map(({ product, quantity, storageLocation }) => ({
        product,
        quantity,
        storageLocation
      }))
    });

    order.robotTask = task._id;
    await order.save();

    await order.populate('items.product');
    await task.populate('items.product').populate('controller').populate('order');

    res.status(201).json({ data: { order, task } });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes, changedBy, reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid order id' });
    }

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Prevent status changes for cancelled/refunded orders
    if (order.status === 'cancelled' || order.status === 'refunded') {
      return res.status(400).json({ message: 'Cannot modify cancelled or refunded order' });
    }

    // Track status change
    if (order.status !== status) {
      order.metadata = order.metadata || new Map();
      order.metadata.set('lastModifiedBy', changedBy || 'system');
      order.metadata.set('statusChangeReason', reason || null);
    }

    order.status = status;
    if (notes) {
      order.notes = notes;
    }

    await order.save();

    if (order.robotTask) {
      const taskUpdate = {};
      if (status === 'cancelled') {
        taskUpdate.status = 'failed';
        taskUpdate.errorMessage = 'Order cancelled by operator';
      }
      if (status === 'completed' || status === 'ready') {
        taskUpdate.status = 'completed';
        taskUpdate.completedAt = new Date();
      }

      if (Object.keys(taskUpdate).length > 0) {
        await RobotTask.findByIdAndUpdate(order.robotTask, taskUpdate);
      }
    }

    await order.populate('items.product').populate('robotTask');
    res.json({ data: order });
  } catch (error) {
    next(error);
  }
};

export const cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason, cancelledBy, refundAmount } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid order id' });
    }

    const order = await Order.findById(id).populate('items.product');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order can be cancelled
    if (order.status === 'cancelled' || order.status === 'refunded') {
      return res.status(400).json({ message: 'Order is already cancelled or refunded' });
    }

    if (order.status === 'completed') {
      return res.status(400).json({ message: 'Cannot cancel completed order' });
    }

    // Restore stock for cancelled items
    await Promise.all(
      order.items.map(({ product, quantity }) =>
        Product.updateOne({ _id: product }, { $inc: { stock: quantity } })
      )
    );

    // Update order cancellation info
    order.status = 'cancelled';
    order.cancellation = {
      cancelledAt: new Date(),
      cancelledBy: cancelledBy || 'customer',
      reason: reason || 'Customer request',
      refundAmount: refundAmount || order.total,
      refundStatus: 'pending'
    };

    // Update robot task if exists
    if (order.robotTask) {
      await RobotTask.findByIdAndUpdate(order.robotTask, {
        status: 'failed',
        errorMessage: `Order cancelled: ${reason || 'Customer request'}`,
        completedAt: new Date()
      });
    }

    await order.save();
    await order.populate('items.product').populate('robotTask');

    res.json({ 
      data: order,
      message: 'Order cancelled successfully. Stock has been restored.'
    });
  } catch (error) {
    next(error);
  }
};

export const modifyOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { items, notes, modifiedBy, reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid order id' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Only allow modifications for pending/queued orders
    if (!['pending', 'queued'].includes(order.status)) {
      return res.status(400).json({ 
        message: `Cannot modify order with status: ${order.status}. Only pending or queued orders can be modified.` 
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order items are required' });
    }

    // Validate new items
    const productIds = items.map((item) => item.productId);
    const invalidProductId = productIds.some((productId) => !mongoose.Types.ObjectId.isValid(productId));

    if (invalidProductId) {
      return res.status(400).json({ message: 'One or more product ids are invalid' });
    }

    const products = await Product.find({ _id: { $in: productIds } });
    if (products.length !== items.length) {
      return res.status(400).json({ message: 'One or more products are invalid' });
    }

    // Restore old stock
    await Promise.all(
      order.items.map(({ product, quantity }) =>
        Product.updateOne({ _id: product }, { $inc: { stock: quantity } })
      )
    );

    // Build new order items
    const productsMap = new Map(products.map((product) => [product._id.toString(), product]));
    const newOrderItems = buildOrderItems(productsMap, items);
    const newTotal = newOrderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Check stock availability
    const insufficientStock = newOrderItems.some(({ product, quantity }) => {
      const productDoc = productsMap.get(product.toString());
      return typeof productDoc.stock === 'number' && productDoc.stock < quantity;
    });

    if (insufficientStock) {
      // Restore stock back
      await Promise.all(
        newOrderItems.map(({ product, quantity }) =>
          Product.updateOne({ _id: product }, { $inc: { stock: quantity } })
        )
      );
      return res.status(409).json({ message: 'Insufficient stock for one or more items' });
    }

    // Save modification history
    if (!order.modifications) {
      order.modifications = [];
    }
    order.modifications.push({
      modifiedAt: new Date(),
      modifiedBy: modifiedBy || 'customer',
      changes: {
        items: order.items,
        total: order.total,
        notes: order.notes
      },
      reason: reason || 'Order modification'
    });

    // Update order
    order.items = newOrderItems;
    order.total = newTotal;
    if (notes !== undefined) {
      order.notes = notes;
    }

    // Deduct new stock
    await Promise.all(
      newOrderItems.map(({ product, quantity }) =>
        Product.updateOne({ _id: product }, { $inc: { stock: -quantity } })
      )
    );

    // Update robot task if exists
    if (order.robotTask) {
      await RobotTask.findByIdAndUpdate(order.robotTask, {
        items: newOrderItems.map(({ product, quantity, storageLocation }) => ({
          product,
          quantity,
          storageLocation
        }))
      });
    }

    await order.save();
    await order.populate('items.product').populate('robotTask');

    res.json({ 
      data: order,
      message: 'Order modified successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const updateDeliveryTracking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { trackingNumber, carrier, estimatedDelivery, status, location, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid order id' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.deliveryMethod !== 'delivery') {
      return res.status(400).json({ message: 'Order is not a delivery order' });
    }

    if (!order.delivery) {
      order.delivery = {
        status: 'pending',
        updates: []
      };
    }

    if (trackingNumber) order.delivery.trackingNumber = trackingNumber;
    if (carrier) order.delivery.carrier = carrier;
    if (estimatedDelivery) order.delivery.estimatedDelivery = new Date(estimatedDelivery);
    if (status) order.delivery.status = status;

    // Add tracking update
    if (status || location || notes) {
      order.delivery.updates.push({
        status: status || order.delivery.status,
        location: location || null,
        timestamp: new Date(),
        notes: notes || null
      });

      if (status === 'delivered') {
        order.delivery.actualDelivery = new Date();
        if (order.status === 'ready') {
          order.status = 'completed';
        }
      }
    }

    await order.save();
    await order.populate('items.product').populate('robotTask');

    res.json({ 
      data: order,
      message: 'Delivery tracking updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderTimeline = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid order id' });
    }

    const order = await Order.findById(id)
      .populate('items.product')
      .populate('robotTask')
      .select('statusHistory modifications delivery cancellation createdAt updatedAt');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Build comprehensive timeline
    const timeline = [];

    // Add creation event
    timeline.push({
      type: 'created',
      timestamp: order.createdAt,
      description: 'Order created',
      status: 'pending'
    });

    // Add status history
    if (order.statusHistory && order.statusHistory.length > 0) {
      order.statusHistory.forEach((entry) => {
        timeline.push({
          type: 'status_change',
          timestamp: entry.timestamp,
          description: `Status changed to ${entry.status}`,
          status: entry.status,
          changedBy: entry.changedBy,
          reason: entry.reason
        });
      });
    }

    // Add modifications
    if (order.modifications && order.modifications.length > 0) {
      order.modifications.forEach((mod) => {
        timeline.push({
          type: 'modified',
          timestamp: mod.modifiedAt,
          description: 'Order modified',
          modifiedBy: mod.modifiedBy,
          reason: mod.reason
        });
      });
    }

    // Add delivery updates
    if (order.delivery && order.delivery.updates && order.delivery.updates.length > 0) {
      order.delivery.updates.forEach((update) => {
        timeline.push({
          type: 'delivery_update',
          timestamp: update.timestamp,
          description: `Delivery: ${update.status}`,
          location: update.location,
          notes: update.notes
        });
      });
    }

    // Add cancellation if exists
    if (order.cancellation && order.cancellation.cancelledAt) {
      timeline.push({
        type: 'cancelled',
        timestamp: order.cancellation.cancelledAt,
        description: 'Order cancelled',
        cancelledBy: order.cancellation.cancelledBy,
        reason: order.cancellation.reason,
        refundAmount: order.cancellation.refundAmount
      });
    }

    // Sort by timestamp
    timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    res.json({ data: timeline });
  } catch (error) {
    next(error);
  }
};


