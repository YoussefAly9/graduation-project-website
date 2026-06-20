import apiClient from './apiClient.js';

/**
 * Robot / ROS 2 integration client.
 *
 * Real-time strategy:
 * - If VITE_SOCKET_URL is set (standalone backend with Socket.IO), we open a
 *   live socket connection for instant updates.
 * - Otherwise (e.g. on Vercel serverless) we fall back to polling GET /robot/status.
 */

export const sendOrderToRobot = async (orderId, priority) => {
  const response = await apiClient.post('/robot/send-order', { orderId, priority });
  return response.data;
};

export const fetchRobotStatus = async (params = {}) => {
  const response = await apiClient.get('/robot/status', { params });
  return response.data.data;
};

export const cancelRobotTask = async ({ orderId, taskId, reason } = {}) => {
  const response = await apiClient.post('/robot/cancel-order', { orderId, taskId, reason });
  return response.data;
};

/**
 * Robot/bridge-facing helper (mostly used by simulators/tests from the browser).
 */
export const pushRobotStatus = async (payload) => {
  const response = await apiClient.post('/robot/update-status', payload);
  return response.data;
};

/**
 * Open a realtime stream of robot events for a given order.
 * Returns a cleanup function. Falls back to polling if sockets are unavailable.
 *
 * @param {object} opts
 * @param {string} opts.orderId
 * @param {(event:object)=>void} opts.onEvent  - called on each robot event
 * @param {(snapshot:object)=>void} [opts.onSnapshot] - called with polled task snapshot
 * @param {number} [opts.pollIntervalMs=2500]
 * @returns {() => void} cleanup
 */
export const subscribeToRobot = ({ orderId, onEvent, onSnapshot, pollIntervalMs = 2500 }) => {
  const socketUrl = (import.meta.env.VITE_SOCKET_URL || '').trim();
  let cleanedUp = false;
  let socket = null;
  let pollTimer = null;

  const startPolling = () => {
    const tick = async () => {
      if (cleanedUp) return;
      try {
        const snapshot = await fetchRobotStatus({ orderId });
        if (!cleanedUp && onSnapshot && snapshot?.task) onSnapshot(snapshot.task);
      } catch {
        // ignore transient polling errors
      }
    };
    tick();
    pollTimer = setInterval(tick, pollIntervalMs);
  };

  if (socketUrl) {
    // Dynamically import so socket.io-client is only bundled when actually used.
    import('socket.io-client')
      .then(({ io }) => {
        if (cleanedUp) return;
        socket = io(socketUrl, { path: import.meta.env.VITE_SOCKET_PATH || '/socket.io' });
        socket.on('connect', () => socket.emit('subscribe:order', orderId));
        socket.on('order:robot:event', (event) => {
          if (!cleanedUp && onEvent) onEvent(event);
        });
        // Poll once for the initial snapshot, then rely on the socket.
        fetchRobotStatus({ orderId })
          .then((snapshot) => {
            if (!cleanedUp && onSnapshot && snapshot?.task) onSnapshot(snapshot.task);
          })
          .catch(() => {});
      })
      .catch(() => startPolling());
  } else {
    startPolling();
  }

  return () => {
    cleanedUp = true;
    if (pollTimer) clearInterval(pollTimer);
    if (socket) socket.disconnect();
  };
};

// Ordered pipeline used by the UI to render progress.
export const ROBOT_PIPELINE = [
  { state: 'sent', label: 'Sent to robot' },
  { state: 'accepted', label: 'Robot accepted' },
  { state: 'navigating', label: 'Navigating' },
  { state: 'product_found', label: 'Product detected' },
  { state: 'picking', label: 'Picking' },
  { state: 'placing', label: 'Placing' },
  { state: 'completed', label: 'Completed' }
];
