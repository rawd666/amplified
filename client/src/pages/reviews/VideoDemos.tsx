import { useEffect, useState } from 'react';
import VideoLightbox from '../../components/VideoLightbox';
import { api, INSTAGRAM_PROFILE } from '../../lib/api';
import type { Demo } from '../../lib/types';

export default function VideoDemos() {
  const [demos, setDemos] = useState<Demo[]>([]);
  const [open, setOpen] = useState<Demo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Demo[]>('/demos')
      .then(setDemos)
      .catch(() => setDemos([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="section">
      <div className="shell">
        <div className="section__head">
          <div>
            <p className="stencil">Reviews</p>
            <h1 className="headline headline--lg">Gear demos</h1>
            <p>
              Our clients and friends have been demoing gear on the shop floor for years. These clips are
              unpolished, unprocessed, and unedited. Just the way we like it.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="empty">Loading clips…</div>
        ) : demos.length === 0 ? (
          <div className="empty">
            No clips up yet.{' '}
            <a href={INSTAGRAM_PROFILE} target="_blank" rel="noreferrer" style={{ color: 'var(--violet-hot)' }}>
              Watch the shop floor on Instagram →
            </a>
          </div>
        ) : (
          <div className="gallery">
            {demos.map((demo) => (
              <figure
                key={demo.id}
                className="gallery__item gallery__item--video"
                onClick={() => setOpen(demo)}
              >
                <video src={demo.url} muted preload="metadata" />
                <span className="gallery__play" aria-hidden="true">▶</span>
                <figcaption>
                  <strong>{demo.product_name}</strong>
                  {demo.description && <span className="muted"> — {demo.description}</span>}
                </figcaption>
              </figure>
            ))}
          </div>
        )}

        <a
          className="btn btn--primary"
          href={INSTAGRAM_PROFILE}
          target="_blank"
          rel="noreferrer"
          style={{ marginTop: '1.5rem', display: 'inline-block' }}
        >
          Watch more on Instagram
        </a>
      </div>

      {open && <VideoLightbox demo={open} onClose={() => setOpen(null)} />}
    </section>
  );
}
