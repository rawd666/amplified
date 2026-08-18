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
            <p className="stencil">By the team</p>
            <h1 className="headline headline--lg">Gear demos</h1>
            <p>
              In case you were wondering how a certain guitar sounds, we decided to shoot these videos for you to be able to get the clearest idea. 
              All demos are being taken with guitars being run through average amps to get the most realistic sound.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="empty">Loading clips…</div>
        ) : demos.length === 0 ? (
          <div className="empty">
            No clips up yet.{' '}
            <a href={INSTAGRAM_PROFILE} target="_blank" rel="noreferrer" style={{ color: 'var(--violet-hot)' }}>
              Check out our Instagram →
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
