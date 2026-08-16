import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { getCropStyle } from '../lib/crop';
import { money } from '../lib/format';
import type { Product } from '../lib/types';

export default function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  const out = product.stock <= 0;

  return (
    <article className="card">
      <Link to={`/product/${product.slug}`} className="card__shot">
        {product.images[0] ? (
          <img
            src={product.images[0].url}
            alt={product.name}
            loading="lazy"
            style={getCropStyle(product.images[0].crop)}
          />
        ) : (
          <span className="card__shot-fallback">{product.name.slice(0, 2)}</span>
        )}
        {product.featured && <span className="card__flag">On the wall</span>}
      </Link>

      <div className="card__body">
        <span className="card__brand">{product.brand || product.category_name}</span>
        <h3 className="card__name">
          <Link to={`/product/${product.slug}`}>{product.name}</Link>
        </h3>
        <span className="price">{money(product.price)}</span>

        <div className="card__foot">
          <span className="card__stock" data-out={out}>
            {out ? 'Sold out' : `${product.stock} in stock`}
          </span>
          <button
            className="btn btn--sm btn--primary"
            disabled={out}
            onClick={() => add(product)}
          >
            Add to cart
          </button>
        </div>
      </div>
    </article>
  );
}
