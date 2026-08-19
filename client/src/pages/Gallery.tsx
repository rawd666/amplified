import { useEffect, useMemo, useState } from 'react';
import Lightbox from '../components/Lightbox';
import { api } from '../lib/api';
import type { GalleryShot } from '../lib/types';

export default function Gallery() {
  const [shots, setShots] = useState<GalleryShot[]>([]);
  const [folder, setFolder] = useState('all');
  const [open, setOpen] = useState<GalleryShot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<GalleryShot[]>('/gallery')
      .then(setShots)
      .catch(() => setShots([]))
      .finally(() => setLoading(false));
  }, []);

  // Folders in use, derived straight from the photos rather than a separate
  // fetch - only ones with at least one photo are worth showing as a filter.
  const folders = useMemo(() => {
    const seen = new Map<string, string>();
    for (const s of shots) {
      if (s.category_slug && s.category_name && !seen.has(s.category_slug)) {
        seen.set(s.category_slug, s.category_name);
      }
    }
    return [{ slug: 'all', name: 'all' }, ...Array.from(seen, ([slug, name]) => ({ slug, name }))];
  }, [shots]);
  const shown = folder === 'all' ? shots : shots.filter((s) => s.category_slug === folder);

  return (
    <section className="section">
      <div className="shell">
        <div className="section__head">
          <div>
            <p className="stencil">Gallery</p>
            <h1 className="headline headline--lg">Masterpieces we've sold</h1>
            <p>
              We've had many magnificent guitars over the years, here are some highlights. 
              Although they might be not be available at the moment, you never know what we might come across again. Just in case ;)
            </p>
          </div>
        </div>

        {folders.length > 2 && (
          <div className="filters">
            {folders.map((f) => (
              <button
                key={f.slug}
                className="chip"
                aria-pressed={folder === f.slug}
                onClick={() => setFolder(f.slug)}
              >
                {f.name}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="empty">Loading photos…</div>
        ) : shown.length === 0 ? (
          <div className="empty">No photos here yet.</div>
        ) : (
          <div className="gallery">
            {shown.map((shot) => (
              <figure key={shot.id} className="gallery__item" onClick={() => setOpen(shot)}>
                <img src={shot.url} alt={shot.caption} loading="lazy" />
                {shot.caption && <figcaption>{shot.caption}</figcaption>}
              </figure>
            ))}
          </div>
        )}
      </div>

      {open && <Lightbox shot={open} onClose={() => setOpen(null)} />}
    </section>
  );
}
