import Hero from '@/sections/Hero.jsx';
import CategoriesSection from '@/sections/CategoriesSection.jsx';
import ProductShowcase from '@/sections/ProductShowcase.jsx';

/**
 * HomePage Component
 * Landing page with hero, categories, featured and popular products
 */
function HomePage({ 
  featuredProducts, 
  popularProducts, 
  loading, 
  onAddToCart,
  onCategorySelect,
  activeCategory 
}) {
  return (
    <div className="page-home">
      <Hero />
      
      <CategoriesSection
        onSelectCategory={onCategorySelect}
        activeCategory={activeCategory}
      />
      
      <ProductShowcase
        sectionId="featured-products"
        title="Featured Products"
        subtitle="Hand-selected items our shoppers love this week."
        products={featuredProducts}
        loading={loading}
        onAddToCart={onAddToCart}
      />
      
      <ProductShowcase
        sectionId="popular-products"
        title="Popular Products"
        subtitle="Top sellers updated hourly from the FreshMart warehouse."
        products={popularProducts}
        loading={loading}
        onAddToCart={onAddToCart}
      />

      <style>{`
        .page-home {
          animation: fadeIn 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}

export default HomePage;
