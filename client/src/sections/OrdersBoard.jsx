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
                      <td data-label="Order ID" className="order-id-cell">{order._id.slice(-8)}</td>
                      <td data-label="Customer">{order.customer?.name || 'Guest'}</td>
                      <td data-label="Status">
                        <span 
                          className="status-badge" 
                          style={{ backgroundColor: getStatusColor(order.status) }}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td data-label="Total">EGP {order.total?.toFixed(2)}</td>
                      <td data-label="Items" className="order-items-cell">
                        {order.items
                          ?.map((item) => `${item.quantity}× ${item.product?.title || 'Unknown'}`)
                          .join(', ')}
                      </td>
                      <td data-label="Date">{formatDate(order.createdAt)}</td>
                      <td data-label="Actions" className="order-actions-cell">
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
          background: var(--bg-primary);
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px var(--shadow);
        }

        .orders-table thead {
          background: var(--bg-secondary);
        }

        .orders-table th {
          padding: 16px;
          text-align: left;
          font-weight: 600;
          color: var(--text-primary);
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .orders-table td {
          padding: 16px;
          border-top: 1px solid var(--border-color);
          color: var(--text-secondary);
        }

        .order-row {
          transition: background-color 0.2s;
        }

        .order-id-cell {
          font-family: monospace;
          font-size: 0.875rem;
          color: var(--text-tertiary);
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
          background: var(--secondary);
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

        .order-row:hover {
          background-color: var(--bg-secondary);
        }

        .order-items-cell {
          max-width: 220px;
          word-break: break-word;
        }

        @media (max-width: 768px) {
          .orders-table thead {
            display: none;
          }

          .orders-table,
          .orders-table tbody,
          .orders-table tr,
          .orders-table td {
            display: block;
            width: 100%;
          }

          .orders-table tr {
            margin-bottom: 16px;
            border: 1px solid var(--border-color);
            border-radius: 10px;
            padding: 12px 16px;
            background: var(--bg-primary);
            box-shadow: 0 1px 3px var(--shadow);
          }

          .orders-table tr:hover {
            background: var(--bg-primary);
          }

          .orders-table td {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 12px;
            padding: 8px 0;
            border-top: none;
            text-align: right;
          }

          .orders-table td::before {
            content: attr(data-label);
            font-weight: 600;
            color: var(--text-secondary);
            font-size: 0.7rem;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            text-align: left;
            flex-shrink: 0;
          }

          .order-items-cell {
            max-width: none;
            flex-direction: column;
            align-items: stretch;
            text-align: left;
          }

          .order-items-cell::before {
            margin-bottom: 4px;
          }

          .order-actions-cell {
            justify-content: center;
            padding-top: 12px;
            border-top: 1px solid var(--border-color);
            margin-top: 4px;
          }

          .order-actions-cell::before {
            display: none;
          }

          .btn-view-details {
            width: 100%;
            padding: 10px 16px;
          }
        }

        @media (max-width: 768px) {
          .orders-table {
            font-size: 0.875rem;
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


