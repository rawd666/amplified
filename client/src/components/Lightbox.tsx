import { useEffect } from 'react';
import type { GalleryShot } from '../lib/types';

interface Props {
  shot: GalleryShot;
  onClose: () => void;
}

export default function Lightbox({ shot, onClose }: Props) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onClose]);

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={shot.caption || 'Photo'}>
      <button className="btn btn--sm lightbox__close" onClick={onClose}>
        Close
      </button>
      <div>
        <img src={shot.url} alt={shot.caption} />
        {shot.caption && <p className="lightbox__caption">{shot.caption}</p>}
      </div>
    </div>
  );
}
