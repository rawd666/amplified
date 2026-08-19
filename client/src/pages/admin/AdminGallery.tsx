import { useEffect, useState, type FormEvent } from 'react';
import ImageUploader from '../../components/ImageUploader';
import { api } from '../../lib/api';
import type { GalleryCategory, GalleryShot } from '../../lib/types';

export default function AdminGallery() {
  const [shots, setShots] = useState<GalleryShot[]>([]);
  const [folders, setFolders] = useState<GalleryCategory[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [caption, setCaption] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editing, setEditing] = useState<GalleryShot | null>(null);
  const [editCaption, setEditCaption] = useState('');
  const [editImage, setEditImage] = useState<string[]>([]);
  const [editBusy, setEditBusy] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [g, f] = await Promise.all([
      api<GalleryShot[]>('/gallery'),
      api<GalleryCategory[]>('/gallery-categories'),
    ]);
    setShots(g);
    setFolders(f);
  };

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
          body: JSON.stringify({
            url,
            caption,
            category_id: categoryId ? Number(categoryId) : null,
            position: 0,
          }),
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

  const setShotFolder = async (shot: GalleryShot, folderId: number | null) => {
    setShots((prev) =>
      prev.map((s) => (s.id === shot.id ? { ...s, category_id: folderId } : s)),
    );
    try {
      await api(`/gallery/${shot.id}`, {
        method: 'PUT',
        body: JSON.stringify({ category_id: folderId }),
      });
      await load();
    } catch (err) {
      setError((err as Error).message);
      await load();
    }
  };

  const addFolder = async (e: FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    setError('');
    try {
      const folder = await api<GalleryCategory>('/gallery-categories', {
        method: 'POST',
        body: JSON.stringify({ name: newFolderName.trim() }),
      });
      setNewFolderName('');
      setFolders((prev) => [...prev, folder]);
      setCategoryId(String(folder.id));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const commitRename = async (folder: GalleryCategory) => {
    setEditingFolderId(null);
    const name = editingName.trim();
    if (!name || name === folder.name) return;
    try {
      await api(`/gallery-categories/${folder.id}`, { method: 'PUT', body: JSON.stringify({ name }) });
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const openEdit = (shot: GalleryShot) => {
    setEditing(shot);
    setEditCaption(shot.caption);
    setEditImage([shot.url]);
  };

  const saveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    if (!editImage.length) return setError('A photo is required.');
    setError('');
    setEditBusy(true);
    try {
      await api(`/gallery/${editing.id}`, {
        method: 'PUT',
        body: JSON.stringify({ caption: editCaption, url: editImage[0] }),
      });
      setEditing(null);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setEditBusy(false);
    }
  };

  const removeFolder = async (folder: GalleryCategory) => {
    if (!confirm(`Delete the "${folder.name}" folder?`)) return;
    try {
      await api(`/gallery-categories/${folder.id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      // The server refuses to delete a folder that still holds photos.
      setError((err as Error).message);
    }
  };

  return (
    <>
      <header className="admin__head">
        <div>
          <p className="stencil">Our favorites</p>
          <h1 className="headline">Gallery</h1>
        </div>
      </header>

      {error && <div className="notice notice--error">{error}</div>}

      <div className="folders">
        {folders.map((f) => (
          <div className="folder-chip" key={f.id}>
            {editingFolderId === f.id ? (
              <input
                autoFocus
                className="folder-chip__edit"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={() => commitRename(f)}
                onKeyDown={(e) => e.key === 'Enter' && commitRename(f)}
              />
            ) : (
              <span
                className="folder-chip__name"
                onClick={() => {
                  setEditingFolderId(f.id);
                  setEditingName(f.name);
                }}
              >
                {f.name} <small>{f.photo_count ?? 0}</small>
              </span>
            )}
            <button
              type="button"
              className="folder-chip__kill"
              aria-label={`Delete ${f.name}`}
              onClick={() => removeFolder(f)}
            >
              ×
            </button>
          </div>
        ))}
        <form className="folder-chip folder-chip--new" onSubmit={addFolder}>
          <input
            placeholder="+ New folder"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
          />
        </form>
      </div>

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
          <span>Folder</span>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">No folder</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
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
            <th>Folder</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {shots.map((s) => (
            <tr key={s.id}>
              <td>
                <img className="table__thumb" src={s.url} alt="" />
              </td>
              <td>{s.caption || '-'}</td>
              <td>
                <select
                  value={s.category_id ?? ''}
                  onChange={(e) =>
                    setShotFolder(s, e.target.value ? Number(e.target.value) : null)
                  }
                >
                  <option value="">No folder</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <div className="table__actions">
                  <button className="btn btn--ghost btn--sm" onClick={() => openEdit(s)}>
                    Edit
                  </button>
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

      {editing && (
        <div className="modal" role="dialog" aria-modal="true">
          <form className="modal__card" onSubmit={saveEdit}>
            <div className="modal__head">
              <h2 className="headline">Edit photo</h2>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setEditing(null)}>
                Close
              </button>
            </div>

            <ImageUploader
              images={editImage}
              onChange={setEditImage}
              multiple={false}
              label="Photo - drop a new one to replace it"
            />

            <label className="field">
              <span>Caption</span>
              <input
                value={editCaption}
                onChange={(e) => setEditCaption(e.target.value)}
                placeholder="Sunday jam, back room"
              />
            </label>

            <div className="modal__foot">
              <button type="button" className="btn btn--ghost" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button className="btn btn--primary" disabled={editBusy}>
                {editBusy ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
