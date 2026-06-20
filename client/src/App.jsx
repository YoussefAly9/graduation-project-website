import { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';

import Header from '@/components/Header.jsx';
import CartDrawer from '@/components/CartDrawer.jsx';
import Navbar from '@/components/Navbar.jsx';
import InstallPrompt from '@/components/InstallPrompt.jsx';
import OfflineIndicator from '@/components/OfflineIndicator.jsx';
import DeliveryOptions from '@/components/DeliveryOptions.jsx';
import AddressManager from '@/components/AddressManager.jsx';
import ThemeToggle from '@/components/ThemeToggle.jsx';
import { ToastContainer } from '@/components/Toast.jsx';
import Footer from '@/sections/Footer.jsx';

// Pages
import HomePage from '@/pages/HomePage.jsx';
import ShopPage from '@/pages/ShopPage.jsx';
import CartPage from '@/pages/CartPage.jsx';
import OrdersPage from '@/pages/OrdersPage.jsx';
import AboutPage from '@/pages/AboutPage.jsx';

import { allFallback, featuredFallback, popularFallback } from '@/data/products.js';
import { categories as categoryList } from '@/data/categories.js';
import { fetchProducts } from '@/services/productService.js';
import { createOrder, fetchOrders } from '@/services/orderService.js';
import useToast from '@/hooks/useToast.js';

function AppContent() {
  const navigate = useNavigate();
  
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [ordersError, setOrdersError] = useState(null);
  
  // Delivery state
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [deliveryOptions, setDeliveryOptions] = useState(null);
  const [showAddressManager, setShowAddressManager] = useState(false);
  const [showDeliveryOptions, setShowDeliveryOptions] = useState(false);
  
  // Toast notifications
  const { toasts, success, error: showError, removeToast } = useToast();

  const categoryLookup = useMemo(
    () => Object.fromEntries(categoryList.map(({ id, label }) => [id, label])),
    []
  );

  useEffect(() => {
    let isMounted = true;

    const loadProducts = async () => {
      try {
        const [featured, popular, all] = await Promise.all([
          fetchProducts({ tag: 'featured' }),
          fetchProducts({ tag: 'popular' }),
          fetchProducts({ limit: 40 })
        ]);

        if (isMounted) {
          const hasProducts = [featured, popular, all].some((list) => list?.length > 0);
          if (!hasProducts) {
            throw new Error('API returned no products');
          }

          setFeaturedProducts(featured);
          setPopularProducts(popular);
          setAllProducts(all);
          setFilteredProducts(all);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load products from API. Falling back to seed data.', err);
          setFeaturedProducts(featuredFallback);
          setPopularProducts(popularFallback);
          setAllProducts(allFallback);
          setFilteredProducts(allFallback);
          setError(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadProducts();

    fetchOrders({ limit: 25 })
      .then((data) => {
        if (isMounted) {
          setOrders(data);
          setOrdersError(null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Failed to load orders', err);
          setOrders([]);
          setOrdersError('Orders dashboard is unavailable while the API is offline.');
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const refreshOrders = async () => {
    try {
      const data = await fetchOrders({ limit: 25 });
      setOrders(data);
      setOrdersError(null);
    } catch (err) {
      console.error('Failed to load orders', err);
      setOrdersError('Orders dashboard is unavailable while the API is offline.');
    }
  };

  useEffect(() => {
    const lowerSearch = searchTerm.toLowerCase();

    const nextProducts = allProducts.filter((product) => {
      const matchesCategory = !activeCategory || product.category === activeCategory;
      const textToSearch = [product.title, product.description, product.sku]
        .filter(Boolean)
        .map((value) => value.toLowerCase());
      const matchesSearch = !lowerSearch || textToSearch.some((value) => value.includes(lowerSearch));
      return matchesCategory && matchesSearch;
    });

    setFilteredProducts(nextProducts);
  }, [allProducts, searchTerm, activeCategory]);

  const handleSearch = (query) => {
    setSearchTerm(query);
    if (query) {
      setActiveCategory(null);
    }
    navigate('/shop');
  };

  const handleCategorySelect = (categoryId) => {
    setActiveCategory(categoryId);
    setSearchTerm('');
    navigate('/shop');
  };

  const inventorySubtitle = useMemo(() => {
    if (searchTerm && activeCategory) {
      return `Showing results for "${searchTerm}" in ${categoryLookup[activeCategory] || activeCategory}`;
    }

    if (searchTerm) {
      return `Search results for "${searchTerm}"`;
    }

    if (activeCategory) {
      return `Filtered by ${categoryLookup[activeCategory] || activeCategory}`;
    }

    return 'Browse our complete inventory curated for robot-assisted fulfilment.';
  }, [searchTerm, activeCategory, categoryLookup]);

  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  const handleRemoveFromCart = (productId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== productId));
  };

  const handleUpdateCartQuantity = (productId, quantity) => {
    if (quantity < 1) {
      handleRemoveFromCart(productId);
      return;
    }
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleAddToCart = (product) => {
    const productId = product._id || product.id;

    setCartItems((prevItems) => {
      const existing = prevItems.find((item) => item.id === productId);
      if (existing) {
        return prevItems.map((item) =>
          item.id === productId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      return [
        ...prevItems,
        {
          id: productId,
          productId: product._id || null,
          title: product.title,
          price: product.price,
          unit: product.unit,
          quantity: 1
        }
      ];
    });

    // Show toast notification
    success(`Added ${product.title} to cart!`);
  };

  const cartTotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems]
  );

  const handleCheckout = async () => {
    const selectedAddress = addresses.find((addr) => addr.id === selectedAddressId);

    if (!selectedAddress || !deliveryOptions) {
      showError('Please complete delivery address and options before checkout');
      return;
    }

    if (cartItems.length === 0) {
      showError('Your cart is empty');
      return;
    }

    const isMongoId = (value) => typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);

    const orderItems = cartItems
      .filter((item) => isMongoId(item.productId))
      .map((item) => ({
        productId: item.productId,
        quantity: item.quantity
      }));

    if (orderItems.length === 0) {
      showError('Cannot place order — products are not loaded from the server. Please refresh and try again.');
      return;
    }

    const deliveryNotes = [
      `Delivery: ${deliveryOptions.speed}`,
      deliveryOptions.date ? `Date: ${deliveryOptions.date}` : null,
      deliveryOptions.timeSlot ? `Time: ${deliveryOptions.timeSlot}` : null,
      deliveryOptions.instructions ? `Instructions: ${deliveryOptions.instructions}` : null,
      `Fee: EGP ${deliveryOptions.fee}`
    ]
      .filter(Boolean)
      .join('\n');

    try {
      const { order } = await createOrder({
        items: orderItems,
        customer: {
          name: selectedAddress.fullName,
          phone: selectedAddress.phone,
          address: `${selectedAddress.street}, Building ${selectedAddress.building}, ${selectedAddress.city}`
        },
        deliveryMethod: deliveryOptions.speed === 'express' ? 'express' : 'standard',
        channel: 'web',
        notes: deliveryNotes
      });

      setOrders((previous) => [order, ...previous].slice(0, 25));
      setOrdersError(null);
      setCartItems([]);
      setIsCartOpen(false);
      success('Order placed successfully! 🎉', 4000);
      navigate('/orders');
    } catch (err) {
      console.error('Checkout failed:', err);
      showError('Could not place order. Make sure the server is running and try again.');
    }
  };

  const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);

  return (
    <div className="app">
      <a href="#main-content" className="skip-to-main sr-only">
        Skip to main content
      </a>
      <OfflineIndicator />
      <ThemeToggle />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <Header
        cartCount={cartCount}
        onSearch={handleSearch}
        onCartClick={() => setIsCartOpen(true)}
      />
      <Navbar />
      <main id="main-content">
        <Routes>
          <Route 
            path="/" 
            element={
              <HomePage
                featuredProducts={featuredProducts}
                popularProducts={popularProducts}
                loading={loading}
                onAddToCart={handleAddToCart}
                onCategorySelect={handleCategorySelect}
                activeCategory={activeCategory}
              />
            } 
          />
          <Route 
            path="/shop" 
            element={
              <ShopPage
                products={filteredProducts}
                loading={loading}
                onAddToCart={handleAddToCart}
                searchTerm={searchTerm}
                activeCategory={activeCategory}
                onCategorySelect={handleCategorySelect}
                inventorySubtitle={inventorySubtitle}
              />
            } 
          />
          <Route 
            path="/cart" 
            element={
              <CartPage
                cartItems={cartItems}
                cartTotal={cartTotal}
                deliveryAddress={selectedAddress}
                deliveryOptions={deliveryOptions}
                onEditAddress={() => setShowAddressManager(true)}
                onEditDelivery={() => setShowDeliveryOptions(true)}
                onCheckout={handleCheckout}
                onRemoveItem={handleRemoveFromCart}
                onUpdateQuantity={handleUpdateCartQuantity}
              />
            } 
          />
          <Route 
            path="/orders" 
            element={
              <OrdersPage
                orders={orders}
                ordersError={ordersError}
                onRefresh={refreshOrders}
              />
            } 
          />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/products" element={<Navigate to="/shop" replace />} />
        </Routes>
        {error ? <p className="status-message status-message--warning">{error}</p> : null}
      </main>
      <Footer />
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        total={cartTotal}
        onCheckout={handleCheckout}
        deliveryAddress={selectedAddress}
        deliveryOptions={deliveryOptions}
        onEditAddress={() => setShowAddressManager(true)}
        onEditDelivery={() => setShowDeliveryOptions(true)}
        onRemoveItem={handleRemoveFromCart}
        onUpdateQuantity={handleUpdateCartQuantity}
      />
      {showAddressManager && (
        <AddressManager
          addresses={addresses}
          selectedAddressId={selectedAddressId}
          onAddressSelect={setSelectedAddressId}
          onAddressesUpdate={setAddresses}
          onClose={() => setShowAddressManager(false)}
        />
      )}
      {showDeliveryOptions && (
        <DeliveryOptions
          value={deliveryOptions}
          onChange={setDeliveryOptions}
          onClose={() => setShowDeliveryOptions(false)}
        />
      )}
      <InstallPrompt />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
