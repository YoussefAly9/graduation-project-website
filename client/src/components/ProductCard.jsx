import { FaRegHeart } from 'react-icons/fa';

const ProductCard = ({ product, onAddToCart }) => {
  const { title, description, price, unit, image } = product;

  const handleAddToCart = () => {
    onAddToCart?.(product);
  };

  return (
    <article className="product">
      <div className="product-img">
        <img src={image} alt={title} loading="lazy" decoding="async" />
      </div>
      <div className="product-info">
        <h3 className="product-title">{title}</h3>
        {description ? <p className="product-desc">{description}</p> : null}
        <div className="product-price">{unit ? `${price}/${unit}` : price}</div>
        <div className="product-actions">
          <button type="button" className="add-to-cart" onClick={handleAddToCart}>
            Add to Cart
          </button>
          <button type="button" className="wishlist" aria-label={`Add ${title} to wishlist`}>
            <FaRegHeart aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;

