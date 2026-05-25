import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { fetchProducts } from '@/services/productService.js';
import { createOrder, fetchOrders } from '@/services/orderService.js';
import { allFallback, featuredFallback, popularFallback } from '@/data/products.js';
import useToast from '@/hooks/useToast.js';

const AppContext = createContext();

export function AppProvider({ children }) {
  // Product state
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  
  // Cart state
  const [cartCount, setCartCount] = useState(0);
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Orders state
  const [orders, setOrders] = useState([]);
  const [ordersError, setOrdersError] = useState(null);
  
  // Delivery state
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [deliveryOptions, setDeliveryOptions] = useState(null);
  const [showAddressManager, setShowAddressManager] = useState(false);
  const [showDeliveryOptions, setShowDeliveryOptions] = useState(false);
  
  // Toast notifications
  const { toasts, success, error: showError, info, removeToast } = useToast();

  // Load products on mount
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
          setFeaturedProducts(featured);
          setPopularProducts(popular);
          setAllProducts(all);
          setFilteredProducts(all);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load products from API. Falling back to seed data.', err);
          setError('Working in offline mode. Displaying seed inventory.');
          setFeaturedProducts(featuredFallback);
          setPopularProducts(popularFallback);
          setAllProducts(allFallback);
          setFilteredProducts(allFallback);
          info('Working offline with cached data');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadProducts();

    fetchOrders({ limit: 5 })
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
  }, [info]);

  // Filter products when search/category changes
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
  };

  const handleCategorySelect = (categoryId) => {
    setActiveCategory(categoryId);
    setSearchTerm('');
  };

  const handleAddToCart = (product) => {
    setCartCount((prev) => prev + 1);
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
          title: product.title,
          price: product.price,
          unit: product.unit,
          quantity: 1
        }
      ];
    });

    // Show toast notification
    success(`Added ${product.title} to cart!`);
    
    if (product._id) {
      const payload = {
        items: [
          {
            productId: product._id,
            quantity: 1
          }
        ],
        customer: {
          name: 'Guest User'
        },
        notes: 'Auto-generated quick order from demo UI.'
      };

      createOrder(payload)
        .then(({ order }) => {
          setOrders((previous) => [order, ...previous].slice(0, 5));
          setOrdersError(null);
        })
        .catch((err) => {
          console.error('Failed to push quick order to backend', err);
        });
    }
  };

  const cartTotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems]
  );

  const handleCheckout = () => {
    const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);
    
    if (!selectedAddress || !deliveryOptions) {
      showError('Please complete delivery address and options before checkout');
      return;
    }

    if (typeof window !== 'undefined') {
      const deliveryInfo = `
Delivery Address:
${selectedAddress.fullName}
${selectedAddress.street}, Building ${selectedAddress.building}
${selectedAddress.city}

Delivery Option:
${deliveryOptions.speed === 'standard' ? 'Standard Delivery (2-4 hours)' : 
  deliveryOptions.speed === 'express' ? 'Express Delivery (30-60 mins)' : 
  'Scheduled Delivery'}
${deliveryOptions.date ? `\nDate: ${new Date(deliveryOptions.date).toLocaleDateString()}` : ''}
${deliveryOptions.timeSlot ? `\nTime: ${deliveryOptions.timeSlot}` : ''}

Delivery Fee: EGP ${deliveryOptions.fee}
Total: EGP ${(cartTotal + deliveryOptions.fee).toFixed(2)}
      `;
      
      // Show success toast and log order details
      success('Order placed successfully! 🎉', 4000);
      console.log('Order Summary:', deliveryInfo);
      
      // Future: Send to backend API
      // await createCheckoutOrder({ cartItems, selectedAddress, deliveryOptions });
    }
  };

  const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);

  const value = {
    // Products
    featuredProducts,
    popularProducts,
    allProducts,
    filteredProducts,
    loading,
    error,
    searchTerm,
    activeCategory,
    handleSearch,
    handleCategorySelect,
    
    // Cart
    cartCount,
    cartItems,
    cartTotal,
    isCartOpen,
    setIsCartOpen,
    handleAddToCart,
    handleCheckout,
    
    // Orders
    orders,
    ordersError,
    
    // Delivery
    addresses,
    setAddresses,
    selectedAddressId,
    setSelectedAddressId,
    selectedAddress,
    deliveryOptions,
    setDeliveryOptions,
    showAddressManager,
    setShowAddressManager,
    showDeliveryOptions,
    setShowDeliveryOptions,
    
    // Toast
    toasts,
    success,
    showError,
    info,
    removeToast
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}

export default AppContext;

