import OrdersBoard from '@/sections/OrdersBoard.jsx';

/**
 * OrdersPage Component
 * Dedicated page for viewing recent orders and robot status
 */
function OrdersPage({ orders, ordersError, onRefresh }) {
  return (
    <div className="page-orders">
      <div className="orders-header">
        <div className="container">
          <h1 className="page-title">Orders & Fulfillment</h1>
          <p className="page-subtitle">
            Track your recent orders and robot-assisted fulfillment status
          </p>
        </div>
      </div>

      <OrdersBoard orders={orders} error={ordersError} onUpdate={onRefresh} />

      <style>{`
        .page-orders {
          animation: fadeIn 0.4s ease-out;
          min-height: 60vh;
        }

        .orders-header {
          background: linear-gradient(135deg, var(--secondary) 0%, #2563eb 100%);
          color: white;
          padding: 60px 0 40px;
          margin-bottom: 40px;
        }

        .page-title {
          font-size: 2.5rem;
          margin-bottom: 12px;
          font-weight: 700;
        }

        .page-subtitle {
          font-size: 1.1rem;
          opacity: 0.95;
        }

        @media (max-width: 768px) {
          .orders-header {
            padding: 40px 0 30px;
          }

          .page-title {
            font-size: 2rem;
          }

          .page-subtitle {
            font-size: 1rem;
          }
        }
      `}</style>
    </div>
  );
}

export default OrdersPage;
