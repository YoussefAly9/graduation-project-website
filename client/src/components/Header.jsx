import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import {
  FaShoppingBasket,
  FaUser,
  FaShoppingCart,
  FaSearch
} from 'react-icons/fa';

const Header = ({ cartCount = 0, onSearch, onCartClick }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();
    const searchQuery = query.trim();
    if (searchQuery) {
      onSearch?.(searchQuery);
      navigate('/shop');
    }
  };

  return (
    <header className="header" id="header">
      <div className="container">
        <div className="top-header">
          <Link className="logo" to="/">
            <FaShoppingBasket aria-hidden="true" />
            <h1>
              Fresh<span>Mart</span>
            </h1>
          </Link>
          <form className="search-bar" role="search" onSubmit={handleSubmit}>
            <input
              type="search"
              placeholder="Search for products..."
              aria-label="Search products"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <button type="submit" aria-label="Search">
              <FaSearch aria-hidden="true" />
            </button>
          </form>
          <div className="user-actions">
            <a className="user-action" href="#support" aria-label="Account">
              <FaUser aria-hidden="true" />
              <span>Account</span>
            </a>
            <Link to="/cart" className="user-action cart-action" aria-label="Cart">
              <span className="cart-icon">
                <FaShoppingCart aria-hidden="true" />
                <span>Cart</span>
                {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
              </span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

