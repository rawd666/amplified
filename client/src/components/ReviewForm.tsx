import { useEffect, useState, type FormEvent } from 'react';
import StarRating from './StarRating';
import { api } from '../lib/api';
import type { Product } from '../lib/types';

export default function ReviewForm() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState('');
  const [author, setAuthor] = useState('');
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<Product[]>('/products')
      .then(setProducts)
      .catch(() => setProducts([]));
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api('/reviews', {
        method: 'POST',
        body: JSON.stringify({
          product_id: productId ? Number(productId) : null,
          author,
          rating,
          title,
          body,
        }),
      });
      setSent(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div className="specplate" style={{ marginTop: 0 }}>
        <p className="stencil stencil--violet">Review received</p>
        <p style={{ margin: 0 }}>
          Thanks. A member of staff reads every review before it goes up, so give it a day and yours
          will appear under All reviews.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      <p className="muted" style={{ marginTop: 0 }}>
        Tell other players what the gear actually did. Staff check reviews before they publish.
      </p>

      {error && <div className="notice notice--error">{error}</div>}

      <label className="field">
        <span>Your name</span>
        <input value={author} onChange={(e) => setAuthor(e.target.value)} required minLength={2} />
      </label>

      <label className="field">
        <span>What did you buy?</span>
        <select value={productId} onChange={(e) => setProductId(e.target.value)}>
          <option value="">The shop in general</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>

      <div className="field">
        <span>Rating</span>
        <StarRating value={rating} onChange={setRating} />
      </div>

      <label className="field">
        <span>Headline (optional)</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={80}
          placeholder="Sums it up in a few words"
        />
      </label>

      <label className="field">
        <span>Your review</span>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          minLength={10}
          placeholder="How does it play? How did the delivery go?"
        />
      </label>

      <button className="btn btn--primary" disabled={busy || rating === 0}>
        {busy ? 'Sending…' : 'Send review'}
      </button>
      {rating === 0 && (
        <p className="muted" style={{ fontSize: '0.8rem' }}>
          Pick a star rating to send.
        </p>
      )}
    </form>
  );
}
