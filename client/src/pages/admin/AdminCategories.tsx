import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../../lib/api';
import type { Category } from '../../lib/types';

interface Draft {
  id?: number;
  name: string;
  slug: string;
  blurb: string;
  position: string;
}

const blank: Draft = { name: '', slug: '', blurb: '', position: '0' };

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => api<Category[]>('/categories').then(setCategories);

  useEffect(() => {
    load().catch((e) => setError((e as Error).message));
  }, []);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    setError('');
    setBusy(true);
    try {
      await api(draft.id ? `/categories/${draft.id}` : '/categories', {
        method: draft.id ? 'PUT' : 'POST',
        body: JSON.stringify({
          name: draft.name,
          slug: draft.slug,
          blurb: draft.blurb,
          position: Number(draft.position) || 0,
        }),
      });
      setDraft(null);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (c: Category) => {
    if (!confirm(`Delete the ${c.name} category?`)) return;
    try {
      await api(`/categories/${c.id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      // The server refuses to delete a category that still holds products.
      setError((err as Error).message);
    }
  };

  const set = (key: keyof Draft) => (e: { target: { value: string } }) =>
    setDraft((d) => (d ? { ...d, [key]: e.target.value } : d));

  return (
    <>
      <header className="admin__head">
        <div>
          <p className="stencil">Structure</p>
          <h1 className="headline">Categories</h1>
        </div>
        <button className="btn btn--primary" onClick={() => setDraft({ ...blank })}>
          New category
        </button>
      </header>

      {error && <div className="notice notice--error">{error}</div>}

      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Slug</th>
            <th>Blurb</th>
            <th>Products</th>
            <th>Order</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {categories.map((c) => (
            <tr key={c.id}>
              <td>
                <strong>{c.name}</strong>
              </td>
              <td>
                <span className="tag">/{c.slug}</span>
              </td>
              <td style={{ maxWidth: 320 }}>
                <span className="muted" style={{ fontSize: '0.82rem' }}>
                  {c.blurb || '—'}
                </span>
              </td>
              <td>{c.product_count ?? 0}</td>
              <td>{c.position}</td>
              <td>
                <div className="table__actions">
                  <button
                    className="btn btn--ghost btn--sm"
                    onClick={() =>
                      setDraft({
                        id: c.id,
                        name: c.name,
                        slug: c.slug,
                        blurb: c.blurb,
                        position: String(c.position),
                      })
                    }
                  >
                    Edit
                  </button>
                  <button className="btn btn--ghost btn--sm" onClick={() => remove(c)}>
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {draft && (
        <div className="modal" role="dialog" aria-modal="true">
          <form className="modal__card" onSubmit={save}>
            <div className="modal__head">
              <h2 className="headline">{draft.id ? 'Edit category' : 'New category'}</h2>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setDraft(null)}>
                Close
              </button>
            </div>

            <label className="field">
              <span>Name</span>
              <input value={draft.name} onChange={set('name')} required />
            </label>
            <label className="field">
              <span>Slug — leave empty to generate from the name</span>
              <input value={draft.slug} onChange={set('slug')} placeholder="amplifiers" />
            </label>
            <label className="field">
              <span>Blurb</span>
              <textarea rows={2} value={draft.blurb} onChange={set('blurb')} />
            </label>
            <label className="field">
              <span>Menu position</span>
              <input type="number" value={draft.position} onChange={set('position')} />
            </label>

            <div className="modal__foot">
              <button type="button" className="btn btn--ghost" onClick={() => setDraft(null)}>
                Cancel
              </button>
              <button className="btn btn--primary" disabled={busy}>
                {busy ? 'Saving…' : 'Save category'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
