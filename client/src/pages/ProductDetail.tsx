import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { api, INSTAGRAM_DM } from '../lib/api';
import { getCropStyle } from '../lib/crop';
import { money } from '../lib/format';
import type { Product } from '../lib/types';

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { add } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [shot, setShot] = useState(0);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => {
    setShot(0);
    setQty(1);
    api<Product>(`/products/${slug}`)
      .then(setProduct)
      .catch((e: Error) => setError(e.message));
  }, [slug]);

  if (error) {
    return (
      <div className="shell section">
        <div className="empty">
          {error} <Link to="/store" style={{ color: 'var(--violet-hot)' }}>Back to the store</Link>
        </div>
      </div>
    );
  }

  if (!product) return <div className="shell section empty">Loading…</div>;

  const out = product.stock <= 0;

  return (
    <div className="shell">
      <div className="detail">
        <div>
          <div className="detail__stage">
            {product.images[shot] ? (
              <img
                src={product.images[shot].url}
                alt={product.name}
                style={getCropStyle(product.images[shot].crop)}
              />
            ) : (
              <span className="card__shot-fallback">{product.name.slice(0, 2)}</span>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="detail__thumbs">
              {product.images.map((img, i) => (
                <button
                  key={img.url}
                  className="detail__thumb"
                  aria-pressed={i === shot}
                  aria-label={`View image ${i + 1}`}
                  onClick={() => setShot(i)}
                >
                  <img src={img.url} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="stencil">
            <Link to={`/store/${product.category_slug}`}>{product.category_name}</Link>
            {product.brand && ` · ${product.brand}`}
          </p>
          <h1 className="headline headline--lg">{product.name}</h1>
          <p className="detail__price price">{money(product.price)}</p>
          <p className="muted">{product.description}</p>

          {product.specs.length > 0 && (
            <div className="specplate">
              <p className="stencil" style={{ marginBottom: '0.75rem' }}>
                Spec plate
              </p>
              <ul>
                {product.specs.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="detail__buy">
            <div className="qty">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Fewer">
                −
              </button>
              <span>{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(product.stock || 1, q + 1))}
                aria-label="More"
              >
                +
              </button>
            </div>
            <button
              className="btn btn--primary"
              disabled={out}
              onClick={() => add(product, qty)}
            >
              {out ? 'Sold out' : 'Add to cart'}
            </button>
            <Link className="btn" to="/booking">
              Play it in store
            </Link>
          </div>

          <p className="muted" style={{ fontSize: '0.85rem', marginTop: '1rem' }}>
            {out ? 'Ask us when the next one lands → ' : 'Have questions? '}
            <a href={INSTAGRAM_DM} target="_blank" rel="noreferrer" style={{ color: 'var(--violet-hot)' }}>
              DM us on Instagram
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
