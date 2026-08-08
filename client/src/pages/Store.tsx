import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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

  useEffect(() => {
    setLoading(true);
    api<Product[]>(`/products${category ? `?category=${category}` : ''}`)
      .then(setProducts)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [category]);

  const active = categories.find((c) => c.slug === category);

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
            <h1 className="headline headline--lg">{active ? active.name : 'Everything'}</h1>
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
        </div>

        {error && <div className="notice notice--error">{error}</div>}

        {loading ? (
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
