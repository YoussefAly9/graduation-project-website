import { useMemo } from 'react';
import ProductShowcase from '@/sections/ProductShowcase.jsx';
import CategoriesSection from '@/sections/CategoriesSection.jsx';

/**
 * ShopPage Component
 * Full product catalog with search and filter capabilities
 */
function ShopPage({ 
  products, 
  loading, 
  onAddToCart,
  searchTerm,
  activeCategory,
  onCategorySelect,
  inventorySubtitle 
}) {
  return (
    <div className="page-shop">
      <div className="shop-header">
        <div className="container">
          <h1 className="page-title">Shop All Products</h1>
          <p className="page-subtitle">
            Browse our complete selection of fresh groceries and essentials
          </p>
        </div>
      </div>

      <CategoriesSection
        onSelectCategory={onCategorySelect}
        activeCategory={activeCategory}
      />
      
      <ProductShowcase
        sectionId="inventory"
        title="All Products"
        subtitle={inventorySubtitle}
        products={products}
        loading={loading}
        onAddToCart={onAddToCart}
        emptyMessage={
          searchTerm
            ? `No products found for "${searchTerm}". Try another keyword or reset filters.`
            : 'No products available at the moment.'
        }
      />

      <style>{`
        .page-shop {
          animation: fadeIn 0.4s ease-out;
        }

        .shop-header {
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
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
          .shop-header {
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

export default ShopPage;

