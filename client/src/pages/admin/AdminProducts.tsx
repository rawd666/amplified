import { useEffect, useMemo, useState, type FormEvent } from 'react';
import ProductImageUploader from '../../components/ProductImageUploader';
import { getCropStyle, type ProductImage } from '../../lib/crop';
import { api } from '../../lib/api';
import { money } from '../../lib/format';
import type { Category, Product } from '../../lib/types';

interface Draft {
  id?: number;
  name: string;
  brand: string;
  category_id: number;
  price: string;
  stock: string;
  description: string;
  specs: string;
  images: ProductImage[];
  featured: boolean;
}

const blank = (category_id: number): Draft => ({
  name: '',
  brand: '',
  category_id,
  price: '',
  stock: '1',
  description: '',
  specs: '',
  images: [],
  featured: false,
});

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState('');

  const load = async () => {
    const [p, c] = await Promise.all([
      api<Product[]>('/products'),
      api<Category[]>('/categories'),
    ]);
    setProducts(p);
    setCategories(c);
  };

  useEffect(() => {
    load().catch((e) => setError((e as Error).message));
  }, []);

  const shown = useMemo(
    () =>
      products.filter((p) =>
        `${p.name} ${p.brand} ${p.category_name}`.toLowerCase().includes(filter.toLowerCase()),
      ),
    [products, filter],
  );

  // Only leaf categories can hold products - one with subcategories is a pure folder.
  const isLeaf = (c: Category) => !categories.some((o) => o.parent_id === c.id);
  const leafCategories = useMemo(() => categories.filter(isLeaf), [categories]);
  const leafParents = useMemo(
    () => categories.filter((c) => !c.parent_id && categories.some((o) => o.parent_id === c.id)),
    [categories],
  );

  const edit = (p: Product) =>
    setDraft({
      id: p.id,
      name: p.name,
      brand: p.brand,
      category_id: p.category_id,
      price: String(p.price),
      stock: String(p.stock),
      description: p.description,
      specs: p.specs.join('\n'),
      images: p.images,
      featured: p.featured,
    });

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    setError('');
    setBusy(true);
    try {
      const body = JSON.stringify({
        name: draft.name,
        brand: draft.brand,
        category_id: Number(draft.category_id),
        price: Number(draft.price),
        stock: Number(draft.stock),
        description: draft.description,
        specs: draft.specs
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        images: draft.images,
        featured: draft.featured,
      });
      await api(draft.id ? `/products/${draft.id}` : '/products', {
        method: draft.id ? 'PUT' : 'POST',
        body,
      });
      setDraft(null);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (p: Product) => {
    if (!confirm(`Delete ${p.name}? This cannot be undone.`)) return;
    try {
      await api(`/products/${p.id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => (d ? { ...d, [key]: value } : d));

  return (
    <>
      <header className="admin__head">
        <div>
          <p className="stencil">Inventory</p>
          <h1 className="headline">Products</h1>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <input
            className="admin__filter"
            placeholder="Filter…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ maxWidth: 200 }}
          />
          <button
            className="btn btn--primary"
            onClick={() => setDraft(blank(leafCategories[0]?.id ?? 0))}
            disabled={!leafCategories.length}
          >
            New product
          </button>
        </div>
      </header>

      {error && <div className="notice notice--error">{error}</div>}

      <table className="table">
        <thead>
          <tr>
            <th />
            <th>Name</th>
            <th>Category</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Featured</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {shown.map((p) => (
            <tr key={p.id}>
              <td>
                <span className="table__thumb">
                  <img src={p.images[0]?.url ?? ''} alt="" style={getCropStyle(p.images[0]?.crop)} />
                </span>
              </td>
              <td>
                <strong>{p.name}</strong>
                <br />
                <span className="muted" style={{ fontSize: '0.78rem' }}>
                  {p.brand}
                </span>
              </td>
              <td>{p.category_name}</td>
              <td>{money(p.price)}</td>
              <td>{p.stock}</td>
              <td>
                <span className="tag" data-on={p.featured}>
                  {p.featured ? 'Hot Item' : '-'}
                </span>
              </td>
              <td>
                <div className="table__actions">
                  <button className="btn btn--ghost btn--sm" onClick={() => edit(p)}>
                    Edit
                  </button>
                  <button className="btn btn--ghost btn--sm" onClick={() => remove(p)}>
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {!shown.length && (
            <tr>
              <td colSpan={7}>
                <div className="empty">Nothing here yet.</div>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {draft && (
        <div className="modal" role="dialog" aria-modal="true">
          <form className="modal__card" onSubmit={save}>
            <div className="modal__head">
              <h2 className="headline">{draft.id ? 'Edit product' : 'New product'}</h2>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setDraft(null)}>
                Close
              </button>
            </div>

            <label className="field">
              <span>Name</span>
              <input value={draft.name} onChange={(e) => set('name', e.target.value)} required />
            </label>

            <label className="field">
              <span>Brand</span>
              <input value={draft.brand} onChange={(e) => set('brand', e.target.value)} />
            </label>

            <label className="field">
              <span>Category</span>
              <select
                value={draft.category_id}
                onChange={(e) => set('category_id', Number(e.target.value))}
              >
                {leafCategories
                  .filter((c) => !c.parent_id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                {leafParents.map((parent) => (
                  <optgroup key={parent.id} label={parent.name}>
                    {leafCategories
                      .filter((c) => c.parent_id === parent.id)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Price (JOD)</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={draft.price}
                onChange={(e) => set('price', e.target.value)}
                required
              />
            </label>

            <label className="field">
              <span>Stock</span>
              <input
                type="number"
                min="0"
                value={draft.stock}
                onChange={(e) => set('stock', e.target.value)}
                required
              />
            </label>

            <label className="field">
              <span>Description</span>
              <textarea
                rows={3}
                value={draft.description}
                onChange={(e) => set('description', e.target.value)}
              />
            </label>

            <label className="field">
              <span>Specs - one per line</span>
              <textarea
                rows={4}
                value={draft.specs}
                onChange={(e) => set('specs', e.target.value)}
                placeholder={'Alder body\nMaple neck\n6L6 power section'}
              />
            </label>

            <ProductImageUploader images={draft.images} onChange={(images) => set('images', images)} />

            <label className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.6rem' }}>
              <input
                type="checkbox"
                checked={draft.featured}
                onChange={(e) => set('featured', e.target.checked)}
                style={{ width: 'auto' }}
              />
              <span>Feature it on the home page</span>
            </label>

            <div className="modal__foot">
              <button type="button" className="btn btn--ghost" onClick={() => setDraft(null)}>
                Cancel
              </button>
              <button className="btn btn--primary" disabled={busy}>
                {busy ? 'Saving…' : 'Save product'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
