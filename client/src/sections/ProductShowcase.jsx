import ProductCard from '@/components/ProductCard.jsx';
import { ProductCardSkeleton } from '@/components/LoadingSkeleton.jsx';

const ProductShowcase = ({
  sectionId,
  title,
  subtitle,
  products = [],
  onAddToCart,
  loading = false,
  emptyMessage
}) => (
  <section className="product-section" id={sectionId}>
    <div className="container">
      <h2 className="section-title">{title}</h2>
      {subtitle ? <p className="section-subtitle">{subtitle}</p> : null}
      {loading ? (
        <div className="products">
          {[...Array(8)].map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="products fade-in">
          {products.map((product) => (
            <ProductCard
              key={product._id || product.id}
              product={product}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      ) : (
        <p className="status-message">{emptyMessage || 'No products available.'}</p>
      )}
    </div>
  </section>
);

export default ProductShowcase;

