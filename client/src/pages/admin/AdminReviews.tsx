import { useEffect, useMemo, useState } from 'react';
import StarRating from '../../components/StarRating';
import { api } from '../../lib/api';
import { shortDate } from '../../lib/format';
import type { Review } from '../../lib/types';

type Tab = 'pending' | 'approved';

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [tab, setTab] = useState<Tab>('pending');
  const [error, setError] = useState('');

  const load = () => api<Review[]>('/reviews?all=1').then(setReviews);

  useEffect(() => {
    load().catch((e) => setError((e as Error).message));
  }, []);

  const shown = useMemo(
    () => reviews.filter((r) => (tab === 'pending' ? !r.approved : Boolean(r.approved))),
    [reviews, tab],
  );

  const setApproved = async (r: Review, approved: boolean) => {
    try {
      await api(`/reviews/${r.id}`, { method: 'PATCH', body: JSON.stringify({ approved }) });
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const remove = async (r: Review) => {
    if (!confirm('Delete this review?')) return;
    try {
      await api(`/reviews/${r.id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const pending = reviews.filter((r) => !r.approved).length;

  return (
    <>
      <header className="admin__head">
        <div>
          <p className="stencil">Moderation</p>
          <h1 className="headline">Reviews</h1>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="chip"
            aria-pressed={tab === 'pending'}
            onClick={() => setTab('pending')}
          >
            Waiting ({pending})
          </button>
          <button
            className="chip"
            aria-pressed={tab === 'approved'}
            onClick={() => setTab('approved')}
          >
            Published
          </button>
        </div>
      </header>

      {error && <div className="notice notice--error">{error}</div>}

      <table className="table">
        <thead>
          <tr>
            <th>Author</th>
            <th>Product</th>
            <th>Rating</th>
            <th>Review</th>
            <th>Date</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {shown.map((r) => (
            <tr key={r.id}>
              <td>
                <strong>{r.author}</strong>
              </td>
              <td>{r.product_name ?? 'The shop'}</td>
              <td>
                <StarRating value={r.rating} />
              </td>
              <td style={{ maxWidth: 380 }}>
                {r.title && <strong>{r.title}</strong>}
                <p className="muted" style={{ fontSize: '0.82rem' }}>
                  {r.body}
                </p>
              </td>
              <td className="muted" style={{ fontSize: '0.78rem' }}>
                {shortDate(r.created_at)}
              </td>
              <td>
                <div className="table__actions">
                  {r.approved ? (
                    <button className="btn btn--ghost btn--sm" onClick={() => setApproved(r, false)}>
                      Unpublish
                    </button>
                  ) : (
                    <button className="btn btn--primary btn--sm" onClick={() => setApproved(r, true)}>
                      Publish
                    </button>
                  )}
                  <button className="btn btn--ghost btn--sm" onClick={() => remove(r)}>
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {!shown.length && (
            <tr>
              <td colSpan={6}>
                <div className="empty">
                  {tab === 'pending' ? 'Nothing waiting for you.' : 'No published reviews yet.'}
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}
