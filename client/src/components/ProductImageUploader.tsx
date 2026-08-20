import { useRef, useState, type DragEvent } from 'react';
import Cropper, { type Area, type Point } from 'react-easy-crop';
import { uploadImages } from '../lib/api';
import { getCropStyle, type ProductImage } from '../lib/crop';

interface Props {
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
  label?: string;
  multiple?: boolean;
}

const ASPECT = 2 / 3;

/** Drop or pick files, push them to /api/uploads, then let the admin pan/zoom
 *  to frame each shot within a 3:2 vertical crop. The original file is never
 *  touched - only the chosen framing (as percentages) is saved alongside the URL. */
export default function ProductImageUploader({ images, onChange, label, multiple = true }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [editing, setEditing] = useState<number | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pendingArea, setPendingArea] = useState<Area | null>(null);

  const take = async (files: FileList | File[]) => {
    if (!files || !files.length) return;
    setError('');
    setBusy(true);
    try {
      const urls = await uploadImages(files);
      const next = urls.map((url) => ({ url }));
      onChange(multiple ? [...images, ...next] : next.slice(0, 1));
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

  const removeAt = (i: number) => onChange(images.filter((_, idx) => idx !== i));

  const openEditor = (i: number) => {
    setEditing(i);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setPendingArea(null);
  };

  const saveCrop = () => {
    if (editing !== null && pendingArea) {
      onChange(
        images.map((img, idx) =>
          idx === editing
            ? {
                ...img,
                crop: {
                  x: pendingArea.x,
                  y: pendingArea.y,
                  width: pendingArea.width,
                  height: pendingArea.height,
                },
              }
            : img,
        ),
      );
    }
    setEditing(null);
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
        <div className="pshots">
          {images.map((img, i) => (
            <div className="pshots__item" key={img.url}>
              <img src={img.url} alt="" style={getCropStyle(img.crop)} />
              <button type="button" className="pshots__reposition" onClick={() => openEditor(i)}>
                Reposition
              </button>
              <button
                type="button"
                className="pshots__kill"
                aria-label="Remove image"
                onClick={() => removeAt(i)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {editing !== null && images[editing] && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal__card">
            <div className="modal__head">
              <h2 className="headline">Reposition image</h2>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setEditing(null)}>
                Close
              </button>
            </div>

            <div className="cropper-stage">
              <Cropper
                image={images[editing].url}
                crop={crop}
                zoom={zoom}
                aspect={ASPECT}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(area) => setPendingArea(area)}
              />
            </div>

            <label className="field" style={{ marginTop: '1rem' }}>
              <span>Zoom</span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
              />
            </label>

            <div className="modal__foot">
              <button type="button" className="btn btn--ghost" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button type="button" className="btn btn--primary" onClick={saveCrop}>
                Save framing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
