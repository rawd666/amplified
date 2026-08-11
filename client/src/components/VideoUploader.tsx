import { useRef, useState, type DragEvent } from 'react';
import { uploadVideo } from '../lib/api';

interface Props {
  video: string;
  onChange: (url: string) => void;
  label?: string;
}

/** Drop or pick one clip, push it to /api/uploads/video, keep the returned URL. */
export default function VideoUploader({ video, onChange, label }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const take = async (files: FileList | File[]) => {
    const file = files[0];
    if (!file) return;
    setError('');
    setBusy(true);
    try {
      onChange(await uploadVideo(file));
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
      <span>{label ?? 'Video'}</span>

      {video ? (
        <div className="shots">
          <div className="shots__item shots__item--video">
            <video src={video} muted preload="metadata" />
            <button
              type="button"
              className="shots__kill"
              aria-label="Remove video"
              onClick={() => onChange('')}
            >
              ×
            </button>
          </div>
        </div>
      ) : (
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
          {busy ? 'Uploading…' : 'Drop a clip here, or click to choose. MP4, WebM, MOV - 80MB max.'}
        </div>
      )}

      <input
        ref={input}
        type="file"
        accept="video/*"
        hidden
        onChange={(e) => {
          if (e.target.files) void take(e.target.files);
          e.target.value = '';
        }}
      />

      {error && <p className="notice notice--error">{error}</p>}
    </div>
  );
}
