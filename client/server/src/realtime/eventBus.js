import { EventEmitter } from 'node:events';

/**
 * Central event bus for robot/order execution events.
 *
 * Why this abstraction:
 * - The backend runs in two modes: (1) Vercel serverless functions, which CANNOT
 *   hold persistent WebSocket connections, and (2) a standalone Node server
 *   (`server/src/index.js`) which CAN run Socket.IO.
 * - Controllers always call `emitRobotEvent(...)` regardless of mode. In serverless
 *   mode nothing is listening (the frontend uses polling). In standalone mode the
 *   Socket.IO layer subscribes and pushes updates to connected clients in real time.
 *
 * This keeps the integration logic identical across environments.
 */
const bus = new EventEmitter();

// Avoid noisy warnings if many sockets subscribe.
bus.setMaxListeners(50);

export const ROBOT_EVENT = 'robot:event';

/**
 * Emit a robot execution event.
 * @param {object} payload - { type, orderId, taskId, robotStatus, currentStep, ... }
 */
export const emitRobotEvent = (payload) => {
  bus.emit(ROBOT_EVENT, { ...payload, emittedAt: new Date().toISOString() });
};

/**
 * Subscribe to robot events. Returns an unsubscribe function.
 */
export const onRobotEvent = (handler) => {
  bus.on(ROBOT_EVENT, handler);
  return () => bus.off(ROBOT_EVENT, handler);
};

export default bus;
