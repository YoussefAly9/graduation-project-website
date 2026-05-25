import { useState } from 'react';
import OrderDetail from '@/components/OrderDetail.jsx';

const OrdersBoard = ({ orders = [], error, onUpdate }) => {
  const [selectedOrderId, setSelectedOrderId] = useState(null);

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

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  const handleOrderClick = (orderId) => {
    setSelectedOrderId(orderId);
  };

  const handleCloseDetail = () => {
    setSelectedOrderId(null);
  };

  const handleDetailUpdate = () => {
    if (onUpdate) onUpdate();
  };

  return (
    <>
      <section className="orders-board" id="orders">
        <div className="container">
          <h2 className="section-title">Recent Orders</h2>
          <p className="section-subtitle">
            Track the latest orders queued for robot fulfilment. Click on any order to view details and manage it.
          </p>

          {error ? <p className="status-message status-message--warning">{error}</p> : null}

          {!error && orders.length === 0 ? <p className="status-message">No orders have been created yet.</p> : null}

          {orders.length > 0 ? (
            <div className="orders-table-wrapper">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th>Total (EGP)</th>
                    <th>Items</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order._id} className="order-row">
                      <td className="order-id-cell">{order._id.slice(-8)}</td>
                      <td>{order.customer?.name || 'Guest'}</td>
                      <td>
                        <span 
                          className="status-badge" 
                          style={{ backgroundColor: getStatusColor(order.status) }}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td>EGP {order.total?.toFixed(2)}</td>
                      <td>
                        {order.items
                          ?.map((item) => `${item.quantity}× ${item.product?.title || 'Unknown'}`)
                          .join(', ')}
                      </td>
                      <td>{formatDate(order.createdAt)}</td>
                      <td>
                        <button 
                          className="btn-view-details"
                          onClick={() => handleOrderClick(order._id)}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </section>

      {selectedOrderId && (
        <OrderDetail
          orderId={selectedOrderId}
          onClose={handleCloseDetail}
          onUpdate={handleDetailUpdate}
        />
      )}

      <style>{`
        .orders-table-wrapper {
          overflow-x: auto;
          margin-top: 24px;
        }

        .orders-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .orders-table thead {
          background: #f9fafb;
        }

        .orders-table th {
          padding: 16px;
          text-align: left;
          font-weight: 600;
          color: #374151;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .orders-table td {
          padding: 16px;
          border-top: 1px solid #e5e7eb;
          color: #4b5563;
        }

        .order-row {
          transition: background-color 0.2s;
        }

        .order-row:hover {
          background-color: #f9fafb;
        }

        .order-id-cell {
          font-family: monospace;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          color: white;
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: capitalize;
        }

        .btn-view-details {
          padding: 6px 12px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          transition: background-color 0.2s;
        }

        .btn-view-details:hover {
          background: #2563eb;
        }

        @media (max-width: 768px) {
          .orders-table {
            font-size: 0.875rem;
          }

          .orders-table th,
          .orders-table td {
            padding: 12px 8px;
          }

          .order-id-cell {
            font-size: 0.75rem;
          }
        }
      `}</style>
    </>
  );
};

export default OrdersBoard;


