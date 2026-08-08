import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import StarRating from '../../components/StarRating';
import { api } from '../../lib/api';
import { shortDate } from '../../lib/format';
import type { Review } from '../../lib/types';

export default function AllReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filter, setFilter] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Review[]>('/reviews')
      .then(setReviews)
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, []);

  const average = useMemo(
    () => (reviews.length ? reviews.reduce((n, r) => n + r.rating, 0) / reviews.length : 0),
    [reviews],
  );
  const shown = filter ? reviews.filter((r) => r.rating === filter) : reviews;

  if (loading) return <div className="empty">Loading reviews…</div>;

  return (
    <>
      <div className="specplate" style={{ marginTop: 0 }}>
        <p className="stencil" style={{ marginBottom: '0.5rem' }}>
          Average rating
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="price" style={{ fontSize: '1.6rem' }}>
            {average.toFixed(1)}
          </span>
          <StarRating value={Math.round(average)} />
          <span className="muted" style={{ fontSize: '0.85rem' }}>
            from {reviews.length} review{reviews.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      <div className="filters">
        <button className="chip" aria-pressed={filter === 0} onClick={() => setFilter(0)}>
          All
        </button>
        {[5, 4, 3, 2, 1].map((n) => (
          <button key={n} className="chip" aria-pressed={filter === n} onClick={() => setFilter(n)}>
            {n} ★
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="empty">
          Nothing at that rating yet.{' '}
          <Link to="/reviews/write" style={{ color: 'var(--violet-hot)' }}>
            Write one →
          </Link>
        </div>
      ) : (
        shown.map((r) => (
          <article className="review" key={r.id}>
            <div className="review__top">
              <span className="review__who">{r.author}</span>
              <span className="review__when">{shortDate(r.created_at)}</span>
            </div>
            <StarRating value={r.rating} />
            {r.title && <h3>{r.title}</h3>}
            <p>{r.body}</p>
            {r.product_slug && (
              <p style={{ marginTop: '0.75rem' }}>
                <Link to={`/product/${r.product_slug}`} style={{ color: 'var(--violet-hot)', fontFamily: 'var(--mono)', fontSize: '0.75rem' }}>
                  on {r.product_name} →
                </Link>
              </p>
            )}
          </article>
        ))
      )}
    </>
  );
}
