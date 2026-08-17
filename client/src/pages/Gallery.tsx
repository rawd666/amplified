import { useEffect, useMemo, useState } from 'react';
import Lightbox from '../components/Lightbox';
import { api } from '../lib/api';
import type { GalleryShot } from '../lib/types';

export default function Gallery() {
  const [shots, setShots] = useState<GalleryShot[]>([]);
  const [tag, setTag] = useState('all');
  const [open, setOpen] = useState<GalleryShot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<GalleryShot[]>('/gallery')
      .then(setShots)
      .catch(() => setShots([]))
      .finally(() => setLoading(false));
  }, []);

  const tags = useMemo(() => ['all', ...new Set(shots.map((s) => s.tag).filter(Boolean))], [shots]);
  const shown = tag === 'all' ? shots : shots.filter((s) => s.tag === tag);

  return (
    <section className="section">
      <div className="shell">
        <div className="section__head">
          <div>
            <p className="stencil">Gallery</p>
            <h1 className="headline headline--lg">Masterpieces we've sold</h1>
            <p>
              We've had many magnificent guitars over the years, here are some highlights. 
              Although they might be not be available at the moment, you never know what we might come across again. just in case ;)
            </p>
          </div>
        </div>

        {tags.length > 2 && (
          <div className="filters">
            {tags.map((t) => (
              <button key={t} className="chip" aria-pressed={tag === t} onClick={() => setTag(t)}>
                {t}
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
