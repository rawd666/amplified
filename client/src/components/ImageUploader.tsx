import { useRef, useState, type DragEvent } from 'react';
import { uploadImages } from '../lib/api';

interface Props {
  images: string[];
  onChange: (images: string[]) => void;
  label?: string;
  multiple?: boolean;
}

/** Drop or pick files, push them to /api/uploads, keep the returned URLs. */
export default function ImageUploader({ images, onChange, label, multiple = true }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const take = async (files: FileList | File[]) => {
    if (!files || !files.length) return;
    setError('');
    setBusy(true);
    try {
      const urls = await uploadImages(files);
      onChange(multiple ? [...images, ...urls] : urls.slice(0, 1));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const drop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setOver(false);
    void take(e.dataTransfer.files);
  };

  return (
    <div className="field">
      <span>{label ?? 'Images'}</span>

      <div
        className="drop"
        data-over={over}
        role="button"
        tabIndex={0}
        onClick={() => input.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={drop}
      >
        {busy ? 'Uploading…' : 'Drop images here, or click to choose. JPG, PNG, WebP, AVIF - 6MB max.'}
      </div>

      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple={multiple}
        hidden
        onChange={(e) => {
          if (e.target.files) void take(e.target.files);
          e.target.value = '';
        }}
      />

      {error && <p className="notice notice--error">{error}</p>}

      {images.length > 0 && (
        <div className="shots">
          {images.map((url) => (
            <div className="shots__item" key={url}>
              <img src={url} alt="" />
              <button
                type="button"
                className="shots__kill"
                aria-label="Remove image"
                onClick={() => onChange(images.filter((u) => u !== url))}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
