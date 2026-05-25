import { useMemo } from 'react';
import { useApp } from '@/context/AppContext.jsx';
import { categories as categoryList } from '@/data/categories.js';
import ProductShowcase from '@/sections/ProductShowcase.jsx';

function ProductsPage() {
  const {
    filteredProducts,
    loading,
    searchTerm,
    activeCategory,
    handleAddToCart
  } = useApp();

  const categoryLookup = useMemo(
    () => Object.fromEntries(categoryList.map(({ id, label }) => [id, label])),
    []
  );

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

  return (
    <div className="products-page">
      <ProductShowcase
        sectionId="all-products"
        title="All Products"
        subtitle={inventorySubtitle}
        products={filteredProducts}
        loading={loading}
        onAddToCart={handleAddToCart}
        emptyMessage={
          searchTerm
            ? `No products found for "${searchTerm}". Try another keyword or reset filters.`
            : 'No products available at the moment.'
        }
      />
    </div>
  );
}

export default ProductsPage;

