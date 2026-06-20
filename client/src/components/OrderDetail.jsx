import { useState, useEffect } from 'react';
import { fetchOrderById, cancelOrder, modifyOrder, updateDeliveryTracking, fetchOrderTimeline } from '@/services/orderService.js';
import { sendOrderToRobot } from '@/services/robotService.js';
import RobotTracker from '@/components/RobotTracker.jsx';
import useToast from '@/hooks/useToast.js';

const OrderDetail = ({ orderId, onClose, onUpdate }) => {
  const [order, setOrder] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [deliveryData, setDeliveryData] = useState({
    trackingNumber: '',
    carrier: '',
    estimatedDelivery: '',
    status: 'pending',
    location: '',
    notes: ''
  });
  const { success, error: showError } = useToast();

  useEffect(() => {
    loadOrderData();
  }, [orderId]);

  const loadOrderData = async () => {
    try {
      setLoading(true);
      const [orderData, timelineData] = await Promise.all([
        fetchOrderById(orderId),
        fetchOrderTimeline(orderId)
      ]);
      setOrder(orderData);
      setTimeline(timelineData);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      await cancelOrder(orderId, {
        reason: cancelReason || 'Customer request',
        cancelledBy: 'customer'
      });
      success('Order cancelled successfully');
      setShowCancelModal(false);
      setCancelReason('');
      await loadOrderData();
      if (onUpdate) onUpdate();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to cancel order');
    }
  };

  const handleSendToRobot = async () => {
    try {
      const result = await sendOrderToRobot(orderId);
      success(result?.duplicate ? 'Order already queued for the robot' : 'Order sent to robot');
      await loadOrderData();
      if (onUpdate) onUpdate();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to send order to robot');
    }
  };

  const handleDeliveryUpdate = async () => {
    try {
      await updateDeliveryTracking(orderId, deliveryData);
      success('Delivery tracking updated successfully');
      setShowDeliveryModal(false);
      setDeliveryData({
        trackingNumber: '',
        carrier: '',
        estimatedDelivery: '',
        status: 'pending',
        location: '',
        notes: ''
      });
      await loadOrderData();
      if (onUpdate) onUpdate();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update delivery tracking');
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      queued: '#3b82f6',
      picking: '#8b5cf6',
      ready: '#10b981',
      completed: '#059669',
      cancelled: '#ef4444',
      refunded: '#6b7280'
    };
    return colors[status] || '#6b7280';
  };

  if (loading) {
    return (
      <div className="order-detail-overlay" onClick={onClose}>
        <div className="order-detail-modal" onClick={(e) => e.stopPropagation()}>
          <div className="order-detail-loading">Loading order details...</div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="order-detail-overlay" onClick={onClose}>
        <div className="order-detail-modal" onClick={(e) => e.stopPropagation()}>
          <div className="order-detail-error">Order not found</div>
        </div>
      </div>
    );
  }

  const canCancel = ['pending', 'queued', 'picking'].includes(order.status);
  const canModify = ['pending', 'queued'].includes(order.status);
  const isDelivery = order.deliveryMethod === 'delivery';

  return (
    <>
      <div className="order-detail-overlay" onClick={onClose}>
        <div className="order-detail-modal" onClick={(e) => e.stopPropagation()}>
          <div className="order-detail-header">
            <h2>Order Details</h2>
            <button className="order-detail-close" onClick={onClose}>×</button>
          </div>

          <div className="order-detail-content">
            {/* Order Info */}
            <div className="order-detail-section">
              <h3>Order Information</h3>
              <div className="order-info-grid">
                <div>
                  <strong>Order ID:</strong> {order._id}
                </div>
                <div>
                  <strong>Status:</strong>
                  <span className="order-status-badge" style={{ backgroundColor: getStatusColor(order.status) }}>
                    {order.status}
                  </span>
                </div>
                <div>
                  <strong>Total:</strong> EGP {order.total?.toFixed(2)}
                </div>
                <div>
                  <strong>Created:</strong> {formatDate(order.createdAt)}
                </div>
                <div>
                  <strong>Customer:</strong> {order.customer?.name || 'Guest'}
                </div>
                <div>
                  <strong>Email:</strong> {order.customer?.email || 'N/A'}
                </div>
                <div>
                  <strong>Phone:</strong> {order.customer?.phone || 'N/A'}
                </div>
                <div>
                  <strong>Delivery Method:</strong> {order.deliveryMethod}
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="order-detail-section">
              <h3>Order Items</h3>
              <table className="order-items-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.product?.title || 'Unknown'}</td>
                      <td>{item.quantity}</td>
                      <td>EGP {item.price?.toFixed(2)}</td>
                      <td>EGP {(item.price * item.quantity)?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Robot Fulfillment (ROS 2) */}
            <div className="order-detail-section">
              <h3>Robot Fulfillment</h3>
              <RobotTracker orderId={orderId} />
            </div>

            {/* Delivery Tracking */}
            {isDelivery && order.delivery && (
              <div className="order-detail-section">
                <h3>Delivery Tracking</h3>
                <div className="delivery-info">
                  {order.delivery.trackingNumber && (
                    <div><strong>Tracking Number:</strong> {order.delivery.trackingNumber}</div>
                  )}
                  {order.delivery.carrier && (
                    <div><strong>Carrier:</strong> {order.delivery.carrier}</div>
                  )}
                  {order.delivery.estimatedDelivery && (
                    <div><strong>Estimated Delivery:</strong> {formatDate(order.delivery.estimatedDelivery)}</div>
                  )}
                  <div>
                    <strong>Status:</strong>
                    <span className="order-status-badge" style={{ backgroundColor: getStatusColor(order.delivery.status) }}>
                      {order.delivery.status}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            {order.notes && (
              <div className="order-detail-section">
                <h3>Notes</h3>
                <p>{order.notes}</p>
              </div>
            )}

            {/* Timeline */}
            <div className="order-detail-section">
              <h3>Order Timeline</h3>
              <div className="timeline">
                {timeline.map((event, idx) => (
                  <div key={idx} className="timeline-item">
                    <div className="timeline-marker"></div>
                    <div className="timeline-content">
                      <div className="timeline-title">{event.description}</div>
                      <div className="timeline-time">{formatDate(event.timestamp)}</div>
                      {event.reason && <div className="timeline-reason">{event.reason}</div>}
                      {event.location && <div className="timeline-location">📍 {event.location}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="order-detail-actions">
              {['pending', 'queued'].includes(order.status) && (
                <button className="btn btn-primary" onClick={handleSendToRobot}>
                  Send to Robot
                </button>
              )}
              {canCancel && (
                <button className="btn btn-danger" onClick={() => setShowCancelModal(true)}>
                  Cancel Order
                </button>
              )}
              {canModify && (
                <button className="btn btn-secondary" onClick={() => setShowModifyModal(true)}>
                  Modify Order
                </button>
              )}
              {isDelivery && (
                <button className="btn btn-primary" onClick={() => setShowDeliveryModal(true)}>
                  Update Delivery
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Cancel Order</h3>
            <p>Are you sure you want to cancel this order? This action cannot be undone.</p>
            <textarea
              placeholder="Reason for cancellation (optional)"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows="3"
            />
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowCancelModal(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleCancel}>Confirm Cancellation</button>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Update Modal */}
      {showDeliveryModal && (
        <div className="modal-overlay" onClick={() => setShowDeliveryModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Update Delivery Tracking</h3>
            <div className="form-group">
              <label>Tracking Number</label>
              <input
                type="text"
                value={deliveryData.trackingNumber}
                onChange={(e) => setDeliveryData({ ...deliveryData, trackingNumber: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Carrier</label>
              <input
                type="text"
                value={deliveryData.carrier}
                onChange={(e) => setDeliveryData({ ...deliveryData, carrier: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select
                value={deliveryData.status}
                onChange={(e) => setDeliveryData({ ...deliveryData, status: e.target.value })}
              >
                <option value="pending">Pending</option>
                <option value="preparing">Preparing</option>
                <option value="shipped">Shipped</option>
                <option value="in_transit">In Transit</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="delivered">Delivered</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                value={deliveryData.location}
                onChange={(e) => setDeliveryData({ ...deliveryData, location: e.target.value })}
                placeholder="Current location"
              />
            </div>
            <div className="form-group">
              <label>Estimated Delivery</label>
              <input
                type="datetime-local"
                value={deliveryData.estimatedDelivery}
                onChange={(e) => setDeliveryData({ ...deliveryData, estimatedDelivery: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea
                value={deliveryData.notes}
                onChange={(e) => setDeliveryData({ ...deliveryData, notes: e.target.value })}
                rows="3"
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowDeliveryModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleDeliveryUpdate}>Update</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .order-detail-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .order-detail-modal {
          background: white;
          border-radius: 12px;
          max-width: 900px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .order-detail-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #e5e7eb;
        }

        .order-detail-header h2 {
          margin: 0;
          font-size: 1.5rem;
        }

        .order-detail-close {
          background: none;
          border: none;
          font-size: 2rem;
          cursor: pointer;
          color: #6b7280;
          line-height: 1;
        }

        .order-detail-close:hover {
          color: #000;
        }

        .order-detail-content {
          padding: 24px;
        }

        .order-detail-section {
          margin-bottom: 32px;
        }

        .order-detail-section h3 {
          margin: 0 0 16px 0;
          font-size: 1.25rem;
          color: #111827;
        }

        .order-info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .order-status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          color: white;
          font-size: 0.875rem;
          font-weight: 500;
          margin-left: 8px;
        }

        .order-items-table {
          width: 100%;
          border-collapse: collapse;
        }

        .order-items-table th,
        .order-items-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }

        .order-items-table th {
          background: #f9fafb;
          font-weight: 600;
        }

        .delivery-info {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .timeline {
          position: relative;
          padding-left: 24px;
        }

        .timeline-item {
          position: relative;
          padding-bottom: 24px;
        }

        .timeline-marker {
          position: absolute;
          left: -32px;
          top: 4px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #3b82f6;
          border: 2px solid white;
          box-shadow: 0 0 0 2px #3b82f6;
        }

        .timeline-content {
          background: #f9fafb;
          padding: 12px 16px;
          border-radius: 8px;
        }

        .timeline-title {
          font-weight: 600;
          margin-bottom: 4px;
        }

        .timeline-time {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .timeline-reason,
        .timeline-location {
          margin-top: 8px;
          font-size: 0.875rem;
          color: #4b5563;
        }

        .order-detail-actions {
          display: flex;
          gap: 12px;
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #e5e7eb;
        }

        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
        }

        .btn-primary:hover {
          background: #2563eb;
        }

        .btn-secondary {
          background: #6b7280;
          color: white;
        }

        .btn-secondary:hover {
          background: #4b5563;
        }

        .btn-danger {
          background: #ef4444;
          color: white;
        }

        .btn-danger:hover {
          background: #dc2626;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
        }

        .modal {
          background: white;
          border-radius: 12px;
          padding: 24px;
          max-width: 500px;
          width: 90%;
        }

        .modal h3 {
          margin: 0 0 16px 0;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-weight: 500;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 1rem;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 24px;
        }

        .order-detail-loading,
        .order-detail-error {
          padding: 40px;
          text-align: center;
        }

        @media (max-width: 768px) {
          .order-info-grid {
            grid-template-columns: 1fr;
          }

          .order-detail-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </>
  );
};

export default OrderDetail;

