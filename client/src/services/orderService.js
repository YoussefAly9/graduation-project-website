import apiClient from './apiClient.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableOrderError = (error) => {
  const status = error.response?.status;
  return !error.response || status === 503 || status === 502 || status === 504 || status === 429;
};

export const createOrder = async (
  { items, customer, deliveryMethod = 'pickup', channel = 'web', notes, specialInstructions },
  { maxAttempts = 4 } = {}
) => {
  const payload = {
    items,
    customer,
    deliveryMethod,
    channel,
    notes,
    specialInstructions
  };

  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await apiClient.post('/orders', payload, { timeout: 30000 });
      return response.data.data;
    } catch (error) {
      lastError = error;

      if (!isRetryableOrderError(error) || attempt === maxAttempts) {
        throw error;
      }

      await sleep(1200 * attempt);
    }
  }

  throw lastError;
};

export const fetchOrders = async (params = {}) => {
  const response = await apiClient.get('/orders', { params });
  return response.data.data;
};

export const fetchOrderById = async (id) => {
  const response = await apiClient.get(`/orders/${id}`);
  return response.data.data;
};

export const updateOrderStatus = async (id, { status, notes, changedBy, reason }) => {
  const response = await apiClient.patch(`/orders/${id}/status`, {
    status,
    notes,
    changedBy,
    reason
  });
  return response.data.data;
};

export const cancelOrder = async (id, { reason, cancelledBy, refundAmount }) => {
  const response = await apiClient.post(`/orders/${id}/cancel`, {
    reason,
    cancelledBy,
    refundAmount
  });
  return response.data;
};

export const modifyOrder = async (id, { items, notes, modifiedBy, reason }) => {
  const response = await apiClient.patch(`/orders/${id}/modify`, {
    items,
    notes,
    modifiedBy,
    reason
  });
  return response.data;
};

export const updateDeliveryTracking = async (id, { trackingNumber, carrier, estimatedDelivery, status, location, notes }) => {
  const response = await apiClient.patch(`/orders/${id}/delivery`, {
    trackingNumber,
    carrier,
    estimatedDelivery,
    status,
    location,
    notes
  });
  return response.data;
};

export const fetchOrderTimeline = async (id) => {
  const response = await apiClient.get(`/orders/${id}/timeline`);
  return response.data.data;
};
