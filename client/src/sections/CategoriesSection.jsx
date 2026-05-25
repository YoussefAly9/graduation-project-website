import { categories } from '@/data/categories.js';

const CategoriesSection = ({ onSelectCategory, activeCategory }) => (
  <section className="categories-section" id="categories">
    <div className="container">
      <h2 className="section-title">Shop by Category</h2>
      <div className="categories">
        {categories.map(({ id, label, icon: Icon }) => (
          <a
            key={id}
            className={`category${activeCategory === id ? ' category--active' : ''}`}
            href="#inventory"
            aria-label={label}
            onClick={() => onSelectCategory?.(id)}
          >
            <Icon aria-hidden="true" />
            <h3>{label}</h3>
          </a>
        ))}
      </div>
    </div>
  </section>
);

export default CategoriesSection;

