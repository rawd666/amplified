import { useEffect } from 'react';
import type { Demo } from '../lib/types';

interface Props {
  demo: Demo;
  onClose: () => void;
}

export default function VideoLightbox({ demo, onClose }: Props) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onClose]);

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={demo.product_name}>
      <button className="btn btn--sm lightbox__close" onClick={onClose}>
        Close
      </button>
      <div>
        {/* Native controls include a fullscreen toggle in every modern browser. */}
        <video src={demo.url} controls autoPlay />
        <p className="lightbox__caption">
          <strong>{demo.product_name}</strong>
          {demo.description && <><br />{demo.description}</>}
        </p>
      </div>
    </div>
  );
}
