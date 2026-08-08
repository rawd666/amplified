import { useEffect, useState, type FormEvent } from 'react';
import ImageUploader from '../../components/ImageUploader';
import { api } from '../../lib/api';
import type { GalleryShot } from '../../lib/types';

export default function AdminGallery() {
  const [shots, setShots] = useState<GalleryShot[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [caption, setCaption] = useState('');
  const [tag, setTag] = useState('shop');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => api<GalleryShot[]>('/gallery').then(setShots);

  useEffect(() => {
    load().catch((e) => setError((e as Error).message));
  }, []);

  // One upload can carry several photos; each becomes its own gallery row.
  const add = async (e: FormEvent) => {
    e.preventDefault();
    if (!images.length) return setError('Upload at least one photo.');
    setError('');
    setBusy(true);
    try {
      for (const url of images) {
        await api('/gallery', {
          method: 'POST',
          body: JSON.stringify({ url, caption, tag, position: 0 }),
        });
      }
      setImages([]);
      setCaption('');
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (shot: GalleryShot) => {
    if (!confirm('Remove this photo from the gallery?')) return;
    try {
      await api(`/gallery/${shot.id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <>
      <header className="admin__head">
        <div>
          <p className="stencil">Shop floor</p>
          <h1 className="headline">Gallery</h1>
        </div>
      </header>

      {error && <div className="notice notice--error">{error}</div>}

      <form className="modal__card" style={{ width: '100%', marginBottom: '2rem' }} onSubmit={add}>
        <ImageUploader images={images} onChange={setImages} label="New photos" />

        <label className="field">
          <span>Caption</span>
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Sunday jam, back room"
          />
        </label>

        <label className="field">
          <span>Tag</span>
          <select value={tag} onChange={(e) => setTag(e.target.value)}>
            <option value="shop">shop</option>
            <option value="gear">gear</option>
            <option value="players">players</option>
            <option value="workshop">workshop</option>
          </select>
        </label>

        <button className="btn btn--primary" disabled={busy || !images.length}>
          {busy ? 'Adding…' : `Add ${images.length || ''} photo${images.length === 1 ? '' : 's'}`}
        </button>
      </form>

      <table className="table">
        <thead>
          <tr>
            <th />
            <th>Caption</th>
            <th>Tag</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {shots.map((s) => (
            <tr key={s.id}>
              <td>
                <img className="table__thumb" src={s.url} alt="" />
              </td>
              <td>{s.caption || '—'}</td>
              <td>
                <span className="tag">{s.tag}</span>
              </td>
              <td>
                <div className="table__actions">
                  <button className="btn btn--ghost btn--sm" onClick={() => remove(s)}>
                    Remove
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {!shots.length && (
            <tr>
              <td colSpan={4}>
                <div className="empty">No photos yet.</div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}
