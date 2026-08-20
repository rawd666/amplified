import { useEffect, useMemo, useState } from 'react';
import Lightbox from '../components/Lightbox';
import { api } from '../lib/api';
import { getCropStyle } from '../lib/crop';
import type { GalleryCategory, GalleryShot } from '../lib/types';

export default function Gallery() {
  const [shots, setShots] = useState<GalleryShot[]>([]);
  const [folders, setFolders] = useState<GalleryCategory[]>([]);
  const [openFolder, setOpenFolder] = useState<GalleryCategory | null>(null);
  const [open, setOpen] = useState<GalleryShot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api<GalleryShot[]>('/gallery'), api<GalleryCategory[]>('/gallery-categories')])
      .then(([g, f]) => {
        setShots(g);
        setFolders(f);
      })
      .catch(() => {
        setShots([]);
        setFolders([]);
      })
      .finally(() => setLoading(false));
  }, []);

  // Only folders that actually hold a photo are worth showing.
  const shownFolders = useMemo(() => folders.filter((f) => (f.photo_count ?? 0) > 0), [folders]);
  const folderShots = useMemo(
    () => (openFolder ? shots.filter((s) => s.category_id === openFolder.id) : []),
    [shots, openFolder],
  );

  const coverFor = (folder: GalleryCategory) =>
    shots.find((s) => s.id === folder.cover_image_id) ??
    shots.find((s) => s.category_id === folder.id);

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

        {loading ? (
          <div className="empty">Loading photos…</div>
        ) : openFolder ? (
          <>
            <button className="btn btn--ghost btn--sm gallery-back" onClick={() => setOpenFolder(null)}>
              ← All folders
            </button>
            <h2 className="headline" style={{ marginBottom: '1.5rem' }}>
              {openFolder.name}
            </h2>
            {folderShots.length === 0 ? (
              <div className="empty">No photos here yet.</div>
            ) : (
              <div className="photo-grid">
                {folderShots.map((shot) => (
                  <div key={shot.id}>
                    <div
                      className="photo-grid__frame"
                      role="button"
                      tabIndex={0}
                      onClick={() => setOpen(shot)}
                      onKeyDown={(e) => e.key === 'Enter' && setOpen(shot)}
                    >
                      <img src={shot.url} alt={shot.caption} loading="lazy" style={getCropStyle(shot.crop ?? undefined)} />
                    </div>
                    {shot.caption && <p className="photo-grid__caption">{shot.caption}</p>}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : shownFolders.length === 0 ? (
          <div className="empty">No photos here yet.</div>
        ) : (
          <div className="gallery-folders">
            {shownFolders.map((folder) => {
              const cover = coverFor(folder);
              return (
                <div
                  key={folder.id}
                  className="gallery-folder"
                  role="button"
                  tabIndex={0}
                  onClick={() => setOpenFolder(folder)}
                  onKeyDown={(e) => e.key === 'Enter' && setOpenFolder(folder)}
                >
                  <div className="gallery-folder__cover">
                    {cover && (
                      <img src={cover.url} alt={folder.name} loading="lazy" style={getCropStyle(cover.crop ?? undefined)} />
                    )}
                  </div>
                  <span className="gallery-folder__name">{folder.name}</span>
                  <span className="gallery-folder__count">
                    {folder.photo_count} photo{folder.photo_count === 1 ? '' : 's'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {open && <Lightbox shot={open} onClose={() => setOpen(null)} />}
    </section>
  );
}
