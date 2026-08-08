interface Props {
  value: number;
  onChange?: (value: number) => void;
}

/** Read-only by default; pass onChange to turn it into a 1–5 picker. */
export default function StarRating({ value, onChange }: Props) {
  if (!onChange) {
    return (
      <span className="stars" aria-label={`${value} out of 5`}>
        {'★★★★★'.slice(0, value)}
        <span style={{ color: 'var(--steel-line)' }}>{'★★★★★'.slice(value)}</span>
      </span>
    );
  }

  return (
    <span className="stars stars--input" role="group" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          data-on={n <= value}
          aria-label={`${n} star${n === 1 ? '' : 's'}`}
          aria-pressed={n === value}
          onClick={() => onChange(n)}
        >
          ★
        </button>
      ))}
    </span>
  );
}
