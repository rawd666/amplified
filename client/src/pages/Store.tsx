import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { api } from '../lib/api';
import type { Category, Product } from '../lib/types';

type Sort = 'newest' | 'low' | 'high';

export default function Store({ categories }: { categories: Category[] }) {
  const { category } = useParams<{ category?: string }>();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>('newest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const active = categories.find((c) => c.slug === category);
  // A category with subcategories is a pure folder - browse into a child
  // instead of listing products directly on the parent.
  const children = active ? categories.filter((c) => c.parent_id === active.id) : [];
  const browsingFolder = Boolean(active) && children.length > 0;

  useEffect(() => {
    if (browsingFolder) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api<Product[]>(`/products${category ? `?category=${category}` : ''}`)
      .then(setProducts)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [category, browsingFolder]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = products.filter(
      (p) => !q || p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q),
    );
    if (sort === 'low') return [...rows].sort((a, b) => a.price - b.price);
    if (sort === 'high') return [...rows].sort((a, b) => b.price - a.price);
    return rows;
  }, [products, query, sort]);

  return (
    <section className="section">
      <div className="shell">
        <div className="section__head">
          <div>
            <p className="stencil">Store</p>
            <h1 className="headline headline--lg">{active ? active.name : 'All Items'}</h1>
            <p>{active ? active.blurb : 'The whole floor, newest arrivals first.'}</p>
          </div>
        </div>

        <div className="filters">
          <button
            className="chip"
            aria-pressed={!category}
            onClick={() => navigate('/store')}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              className="chip"
              aria-pressed={category === c.slug}
              onClick={() => navigate(`/store/${c.slug}`)}
            >
              {c.name}
            </button>
          ))}

          {!browsingFolder && (
            <>
              <select
                className="filters__search"
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                aria-label="Sort products"
                style={{ minWidth: 150 }}
              >
                <option value="newest">Newest first</option>
                <option value="low">Price: low to high</option>
                <option value="high">Price: high to low</option>
              </select>

              <input
                className="filters__search"
                placeholder="Search the floor"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search products"
              />
            </>
          )}
        </div>

        {error && <div className="notice notice--error">{error}</div>}

        {browsingFolder ? (
          <div className="grid">
            {children.map((c) => (
              <Link key={c.id} className="card" to={`/store/${c.slug}`}>
                <div className="card__body">
                  <span className="card__brand">{c.product_count ?? 0} in stock</span>
                  <h3 className="card__name">{c.name}</h3>
                  <p className="muted" style={{ margin: 0, fontSize: '0.9rem' }}>
                    {c.blurb}
                  </p>
                  <span className="card__foot" style={{ color: 'var(--violet-hot)' }}>
                    Browse {c.name.toLowerCase()} →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : loading ? (
          <div className="empty">Pulling stock from the back…</div>
        ) : shown.length === 0 ? (
          <div className="empty">
            Nothing here matches that. Try another category, or clear the search.
          </div>
        ) : (
          <div className="grid">
            {shown.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
