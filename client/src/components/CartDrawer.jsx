import { FaMinus, FaPlus, FaTimes, FaTrash } from 'react-icons/fa';

const CartDrawer = ({ 
  isOpen, 
  onClose, 
  items, 
  total, 
  onCheckout,
  isCheckingOut = false,
  deliveryAddress,
  deliveryOptions,
  onEditAddress,
  onEditDelivery,
  onRemoveItem,
  onUpdateQuantity
}) => {
  if (!isOpen) {
    return null;
  }

  const deliveryFee = deliveryOptions?.fee || 0;
  const grandTotal = total + deliveryFee;

  return (
    <div className="cart-overlay" role="presentation" onClick={onClose}>
      <aside
        className="cart-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="cart-drawer__header">
          <h3>Shopping Cart</h3>
          <button type="button" className="cart-drawer__close" onClick={onClose} aria-label="Close cart">
            <FaTimes aria-hidden="true" />
          </button>
        </header>
        <div className="cart-drawer__body">
          {items.length === 0 ? (
            <p>Your cart is currently empty. Browse products to add items.</p>
          ) : (
            <>
              {/* Cart Items */}
              <ul className="cart-drawer__list">
                {items.map(({ id, title, quantity, price, unit }) => (
                  <li key={id} className="cart-drawer__item">
                    <div className="cart-drawer__item-info">
                      <h4>{title}</h4>
                      <p>
                        EGP {price}
                        {unit ? `/${unit}` : ''}
                      </p>
                      <div className="cart-item-controls">
                        <div className="cart-qty" role="group" aria-label={`Quantity for ${title}`}>
                          <button
                            type="button"
                            className="cart-qty__btn"
                            onClick={() => onUpdateQuantity?.(id, quantity - 1)}
                            aria-label="Decrease quantity"
                          >
                            <FaMinus aria-hidden="true" />
                          </button>
                          <span className="cart-qty__value">{quantity}</span>
                          <button
                            type="button"
                            className="cart-qty__btn"
                            onClick={() => onUpdateQuantity?.(id, quantity + 1)}
                            aria-label="Increase quantity"
                          >
                            <FaPlus aria-hidden="true" />
                          </button>
                        </div>
                        <button
                          type="button"
                          className="cart-remove-btn"
                          onClick={() => onRemoveItem?.(id)}
                          aria-label={`Remove ${title} from cart`}
                        >
                          <FaTrash aria-hidden="true" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                    <span className="cart-drawer__subtotal">EGP {(price * quantity).toFixed(2)}</span>
                  </li>
                ))}
              </ul>

              {/* Delivery Address Section */}
              <div className="cart-section">
                <div className="cart-section-header">
                  <h4>📍 Delivery Address</h4>
                  <button 
                    className="cart-edit-btn"
                    onClick={onEditAddress}
                  >
                    {deliveryAddress ? 'Change' : 'Add'}
                  </button>
                </div>
                {deliveryAddress ? (
                  <div className="cart-delivery-info">
                    <div className="delivery-label">{deliveryAddress.label || 'Address'}</div>
                    <div className="delivery-text">{deliveryAddress.fullName}</div>
                    <div className="delivery-text">
                      {deliveryAddress.street}, {deliveryAddress.building}
                      {deliveryAddress.floor && `, Floor ${deliveryAddress.floor}`}
                    </div>
                    <div className="delivery-text">{deliveryAddress.area}, {deliveryAddress.city}</div>
                    <div className="delivery-phone">{deliveryAddress.phone}</div>
                  </div>
                ) : (
                  <div className="cart-empty-state">
                    <p>Please add a delivery address</p>
                  </div>
                )}
              </div>

              {/* Delivery Options Section */}
              <div className="cart-section">
                <div className="cart-section-header">
                  <h4>🚚 Delivery Options</h4>
                  <button 
                    className="cart-edit-btn"
                    onClick={onEditDelivery}
                  >
                    {deliveryOptions ? 'Change' : 'Select'}
                  </button>
                </div>
                {deliveryOptions ? (
                  <div className="cart-delivery-info">
                    <div className="delivery-speed">
                      {deliveryOptions.speed === 'standard' && '🚚 Standard Delivery'}
                      {deliveryOptions.speed === 'express' && '⚡ Express Delivery'}
                      {deliveryOptions.speed === 'scheduled' && '📅 Scheduled Delivery'}
                    </div>
                    {deliveryOptions.speed === 'scheduled' && deliveryOptions.date && (
                      <>
                        <div className="delivery-text">
                          {new Date(deliveryOptions.date).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </div>
                        {deliveryOptions.timeSlot && (
                          <div className="delivery-text">
                            Time: {deliveryOptions.timeSlot.replace('-', ':00 - ')}:00
                          </div>
                        )}
                      </>
                    )}
                    {deliveryOptions.instructions && (
                      <div className="delivery-notes">
                        Note: {deliveryOptions.instructions}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="cart-empty-state">
                    <p>Please select delivery options</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        <footer className="cart-drawer__footer">
          {items.length > 0 && (
            <>
              <div className="cart-drawer__subtotal-line">
                <span>Subtotal</span>
                <span>EGP {total.toFixed(2)}</span>
              </div>
              <div className="cart-drawer__subtotal-line">
                <span>Delivery Fee</span>
                <span>{deliveryFee === 0 ? 'Free' : `EGP ${deliveryFee.toFixed(2)}`}</span>
              </div>
              <div className="cart-drawer__total">
                <span>Total</span>
                <strong>EGP {grandTotal.toFixed(2)}</strong>
              </div>
            </>
          )}
          <button
            type="button"
            className="btn cart-drawer__checkout"
            disabled={items.length === 0 || !deliveryAddress || !deliveryOptions || isCheckingOut}
            onClick={onCheckout}
          >
            {isCheckingOut
              ? 'Placing order...'
              : !deliveryAddress || !deliveryOptions 
                ? 'Complete Delivery Details' 
                : 'Proceed to Checkout'}
          </button>
        </footer>
      </aside>
    </div>
  );
};

export default CartDrawer;


