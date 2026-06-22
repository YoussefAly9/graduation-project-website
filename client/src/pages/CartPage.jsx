import { useNavigate } from 'react-router-dom';
import { FaMinus, FaPlus, FaTrash } from 'react-icons/fa';

/**
 * CartPage Component
 * Dedicated cart page with full checkout flow
 */
function CartPage({ 
  cartItems,
  cartTotal,
  deliveryAddress,
  deliveryOptions,
  onEditAddress,
  onEditDelivery,
  onCheckout,
  isCheckingOut = false,
  onRemoveItem,
  onUpdateQuantity
}) {
  const navigate = useNavigate();
  const deliveryFee = deliveryOptions?.fee || 0;
  const grandTotal = cartTotal + deliveryFee;

  if (cartItems.length === 0) {
    return (
      <div className="page-cart-empty">
        <div className="container">
          <div className="empty-cart-card">
            <div className="empty-icon">🛒</div>
            <h2>Your Cart is Empty</h2>
            <p>Looks like you haven't added any items yet.</p>
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/shop')}
            >
              Start Shopping
            </button>
          </div>
        </div>

        <style>{`
          .page-cart-empty {
            min-height: 60vh;
            display: flex;
            align-items: center;
            padding: 60px 0;
          }

          .empty-cart-card {
            text-align: center;
            padding: 60px 40px;
            background: var(--bg-primary);
            border-radius: 16px;
            box-shadow: 0 4px 12px var(--shadow);
            max-width: 500px;
            margin: 0 auto;
          }

          .empty-icon {
            font-size: 80px;
            margin-bottom: 20px;
          }

          .empty-cart-card h2 {
            margin-bottom: 12px;
            color: var(--text-primary);
          }

          .empty-cart-card p {
            color: var(--text-secondary);
            margin-bottom: 30px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="page-cart">
      <div className="container">
        <div className="cart-header">
          <h1 className="page-title">Shopping Cart</h1>
          <p className="page-subtitle">{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}</p>
        </div>

        <div className="cart-layout">
          <div className="cart-main">
            {/* Cart Items */}
            <div className="cart-section-card">
              <h3>Items in Cart</h3>
              <div className="cart-items-list">
                {cartItems.map(({ id, title, quantity, price, unit }) => (
                  <div key={id} className="cart-item-row">
                    <div className="item-details">
                      <h4>{title}</h4>
                      <p className="item-meta">
                        EGP {price}
                        {unit ? `/${unit}` : ''}
                      </p>
                      <div className="item-controls">
                        <div className="item-qty" role="group" aria-label={`Quantity for ${title}`}>
                          <button
                            type="button"
                            className="item-qty__btn"
                            onClick={() => onUpdateQuantity?.(id, quantity - 1)}
                            aria-label="Decrease quantity"
                          >
                            <FaMinus aria-hidden="true" />
                          </button>
                          <span className="item-qty__value">{quantity}</span>
                          <button
                            type="button"
                            className="item-qty__btn"
                            onClick={() => onUpdateQuantity?.(id, quantity + 1)}
                            aria-label="Increase quantity"
                          >
                            <FaPlus aria-hidden="true" />
                          </button>
                        </div>
                        <button
                          type="button"
                          className="item-remove-btn"
                          onClick={() => onRemoveItem?.(id)}
                          aria-label={`Remove ${title} from cart`}
                        >
                          <FaTrash aria-hidden="true" />
                          Remove
                        </button>
                      </div>
                    </div>
                    <div className="item-total">
                      EGP {(price * quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Address */}
            <div className="cart-section-card">
              <div className="section-header">
                <h3>📍 Delivery Address</h3>
                <button className="btn-edit" onClick={onEditAddress}>
                  {deliveryAddress ? 'Change' : 'Add'}
                </button>
              </div>
              {deliveryAddress ? (
                <div className="delivery-info">
                  <div className="info-label">{deliveryAddress.label || 'Address'}</div>
                  <div className="info-text">{deliveryAddress.fullName}</div>
                  <div className="info-text">
                    {deliveryAddress.street}, {deliveryAddress.building}
                    {deliveryAddress.floor && `, Floor ${deliveryAddress.floor}`}
                  </div>
                  <div className="info-text">{deliveryAddress.area}, {deliveryAddress.city}</div>
                  <div className="info-phone">{deliveryAddress.phone}</div>
                </div>
              ) : (
                <div className="info-empty">
                  <p>Please add a delivery address to continue</p>
                </div>
              )}
            </div>

            {/* Delivery Options */}
            <div className="cart-section-card">
              <div className="section-header">
                <h3>🚚 Delivery Options</h3>
                <button className="btn-edit" onClick={onEditDelivery}>
                  {deliveryOptions ? 'Change' : 'Select'}
                </button>
              </div>
              {deliveryOptions ? (
                <div className="delivery-info">
                  <div className="info-speed">
                    {deliveryOptions.speed === 'standard' && '🚚 Standard Delivery'}
                    {deliveryOptions.speed === 'express' && '⚡ Express Delivery'}
                    {deliveryOptions.speed === 'scheduled' && '📅 Scheduled Delivery'}
                  </div>
                  {deliveryOptions.speed === 'scheduled' && deliveryOptions.date && (
                    <>
                      <div className="info-text">
                        {new Date(deliveryOptions.date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </div>
                      {deliveryOptions.timeSlot && (
                        <div className="info-text">
                          Time: {deliveryOptions.timeSlot.replace('-', ':00 - ')}:00
                        </div>
                      )}
                    </>
                  )}
                  {deliveryOptions.instructions && (
                    <div className="info-notes">
                      Note: {deliveryOptions.instructions}
                    </div>
                  )}
                </div>
              ) : (
                <div className="info-empty">
                  <p>Please select delivery options to continue</p>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="cart-sidebar">
            <div className="summary-card">
              <h3>Order Summary</h3>
              
              <div className="summary-row">
                <span>Subtotal</span>
                <span>EGP {cartTotal.toFixed(2)}</span>
              </div>
              
              <div className="summary-row">
                <span>Delivery Fee</span>
                <span>{deliveryFee === 0 ? 'Free' : `EGP ${deliveryFee.toFixed(2)}`}</span>
              </div>
              
              <div className="summary-divider"></div>
              
              <div className="summary-total">
                <span>Total</span>
                <strong>EGP {grandTotal.toFixed(2)}</strong>
              </div>
              
              <button
                className="btn btn-primary btn-checkout"
                disabled={!deliveryAddress || !deliveryOptions || isCheckingOut}
                onClick={onCheckout}
              >
                {isCheckingOut
                  ? 'Placing order...'
                  : !deliveryAddress || !deliveryOptions 
                    ? 'Complete Delivery Details' 
                    : 'Proceed to Checkout'}
              </button>
              
              <button
                className="btn btn-secondary"
                onClick={() => navigate('/shop')}
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .page-cart {
          padding: 40px 0 80px;
          animation: fadeIn 0.4s ease-out;
        }

        .cart-header {
          margin-bottom: 40px;
        }

        .page-title {
          font-size: 2.5rem;
          margin-bottom: 8px;
          color: var(--text-primary);
        }

        .page-subtitle {
          color: var(--text-secondary);
          font-size: 1.1rem;
        }

        .cart-layout {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 30px;
        }

        .cart-main {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .cart-section-card {
          background: var(--bg-primary);
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 8px var(--shadow);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .cart-section-card h3 {
          margin: 0 0 20px 0;
          font-size: 1.3rem;
          color: var(--text-primary);
        }

        .section-header h3 {
          margin-bottom: 0;
        }

        .btn-edit {
          background: none;
          border: 1px solid var(--primary);
          color: var(--primary);
          padding: 8px 20px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-edit:hover {
          background: var(--primary);
          color: white;
        }

        .cart-items-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .cart-item-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          padding: 16px;
          background: var(--bg-secondary);
          border-radius: 8px;
        }

        .item-details {
          flex: 1;
          min-width: 0;
        }

        .item-controls {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 12px;
          margin-top: 12px;
        }

        .item-qty {
          display: inline-flex;
          align-items: center;
          border: 1px solid var(--border-color);
          border-radius: 6px;
          overflow: hidden;
        }

        .item-qty__btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          padding: 0;
          border: none;
          background: var(--bg-primary);
          color: var(--text-primary);
          cursor: pointer;
          transition: background 0.2s;
        }

        .item-qty__btn:hover {
          background: var(--bg-tertiary);
        }

        .item-qty__value {
          min-width: 36px;
          text-align: center;
          font-weight: 600;
          font-size: 0.95rem;
        }

        .item-remove-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border: none;
          background: transparent;
          color: #dc2626;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          border-radius: 6px;
          transition: background 0.2s;
        }

        .item-remove-btn:hover {
          background: rgba(220, 38, 38, 0.08);
        }

        .item-details h4 {
          margin: 0 0 4px 0;
          color: var(--text-primary);
        }

        .item-meta {
          margin: 0;
          font-size: 0.9rem;
          color: var(--text-secondary);
        }

        .item-total {
          font-weight: 600;
          font-size: 1.1rem;
          color: var(--primary);
        }

        .delivery-info {
          background: var(--bg-secondary);
          padding: 16px;
          border-radius: 8px;
        }

        .info-label {
          font-weight: 700;
          font-size: 0.9rem;
          color: var(--primary);
          margin-bottom: 8px;
        }

        .info-text {
          font-size: 0.95rem;
          color: var(--text-primary);
          margin-bottom: 4px;
        }

        .info-phone {
          font-size: 0.95rem;
          color: var(--primary);
          font-weight: 600;
          margin-top: 8px;
        }

        .info-speed {
          font-weight: 600;
          font-size: 1rem;
          color: var(--text-primary);
          margin-bottom: 8px;
        }

        .info-notes {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-top: 8px;
          font-style: italic;
        }

        .info-empty {
          background: #fef3c7;
          padding: 16px;
          border-radius: 8px;
          border-left: 3px solid #fbbf24;
        }

        .info-empty p {
          margin: 0;
          font-size: 0.9rem;
          color: #92400e;
        }

        .cart-sidebar {
          position: sticky;
          top: 100px;
          height: fit-content;
        }

        .summary-card {
          background: var(--bg-primary);
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 8px var(--shadow);
        }

        .summary-card h3 {
          margin: 0 0 20px 0;
          font-size: 1.3rem;
          color: var(--text-primary);
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          color: var(--text-secondary);
        }

        .summary-divider {
          height: 1px;
          background: var(--border-color);
          margin: 16px 0;
        }

        .summary-total {
          display: flex;
          justify-content: space-between;
          font-size: 1.2rem;
          margin-bottom: 20px;
          color: var(--text-primary);
        }

        .btn-checkout {
          width: 100%;
          margin-bottom: 12px;
        }

        .btn-secondary {
          width: 100%;
          background: var(--bg-tertiary);
          color: var(--text-primary);
          border: 2px solid var(--border-color);
        }

        .btn-secondary:hover {
          background: var(--bg-secondary);
        }

        @media (max-width: 1024px) {
          .cart-layout {
            grid-template-columns: 1fr;
          }

          .cart-sidebar {
            position: static;
          }
        }

        @media (max-width: 768px) {
          .page-title {
            font-size: 2rem;
          }

          .cart-section-card {
            padding: 20px;
          }

          .cart-item-row {
            flex-direction: column;
            align-items: stretch;
          }

          .item-total {
            align-self: flex-end;
            margin-top: 8px;
          }

          .section-header {
            flex-wrap: wrap;
            gap: 12px;
          }
        }

        @media (max-width: 480px) {
          .page-cart {
            padding: 24px 0 48px;
          }

          .page-title {
            font-size: 1.75rem;
          }

          .btn-edit {
            padding: 6px 14px;
            font-size: 0.85rem;
          }
        }
      `}</style>
    </div>
  );
}

export default CartPage;
