import { useEffect, useState, type FormEvent } from 'react';
import VideoUploader from '../../components/VideoUploader';
import { api } from '../../lib/api';
import type { Demo } from '../../lib/types';

export default function AdminVideoDemos() {
  const [demos, setDemos] = useState<Demo[]>([]);
  const [video, setVideo] = useState('');
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => api<Demo[]>('/demos').then(setDemos);

  useEffect(() => {
    load().catch((e) => setError((e as Error).message));
  }, []);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    if (!video) return setError('Upload a video first.');
    setError('');
    setBusy(true);
    try {
      await api('/demos', {
        method: 'POST',
        body: JSON.stringify({ url: video, product_name: productName, description, position: 0 }),
      });
      setVideo('');
      setProductName('');
      setDescription('');
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (demo: Demo) => {
    if (!confirm('Remove this clip?')) return;
    try {
      await api(`/demos/${demo.id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <>
      <header className="admin__head">
        <div>
          <p className="stencil">Our clips</p>
          <h1 className="headline">Gear demos</h1>
        </div>
      </header>

      {error && <div className="notice notice--error">{error}</div>}

      <form className="modal__card" style={{ width: '100%', marginBottom: '2rem' }} onSubmit={add}>
        <VideoUploader video={video} onChange={setVideo} label="Clip" />

        <label className="field">
          <span>Product / rig name</span>
          <input
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            required
            placeholder="Nightshade S-Type → Valvewright 30"
          />
        </label>

        <label className="field">
          <span>Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Recorded by us, one take"
          />
        </label>

        <button className="btn btn--primary" disabled={busy || !video}>
          {busy ? 'Adding…' : 'Add clip'}
        </button>
      </form>

      <table className="table">
        <thead>
          <tr>
            <th />
            <th>Product / rig</th>
            <th>Description</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {demos.map((d) => (
            <tr key={d.id}>
              <td>
                <video className="table__thumb" src={d.url} muted preload="metadata" />
              </td>
              <td>{d.product_name}</td>
              <td>{d.description || '-'}</td>
              <td>
                <div className="table__actions">
                  <button className="btn btn--ghost btn--sm" onClick={() => remove(d)}>
                    Remove
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {!demos.length && (
            <tr>
              <td colSpan={4}>
                <div className="empty">No clips yet.</div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}
