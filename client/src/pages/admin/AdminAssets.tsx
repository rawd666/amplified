import { useState } from 'react';

/* Brand colours - keep in step with the :root tokens in styles/global.css. */
const COLOURS = [
  { token: '--violet', name: 'Violet', hex: '#713991' },
  { token: '--violet-hot', name: 'Violet hot', hex: '#8141A6' },
  { token: '--violet-deep', name: 'Violet deep', hex: '#34213F' },
  { token: '--ink', name: 'Ink', hex: '#0B0A0E' },
  { token: '--ink-2', name: 'Ink 2', hex: '#131118' },
  { token: '--panel', name: 'Panel', hex: '#1A1822' },
  { token: '--steel', name: 'Steel', hex: '#2C2936' },
  { token: '--steel-line', name: 'Steel line', hex: '#3A3745' },
  { token: '--grey', name: 'Grey', hex: '#8E8A9C' },
  { token: '--grey-dim', name: 'Grey dim', hex: '#605C6E' },
  { token: '--chalk', name: 'Chalk', hex: '#F5F4F8' },
  { token: '--white', name: 'White', hex: '#FFFFFF' },
];

const TYPEFACES = [
  {
    name: 'Big Shoulders Display',
    role: 'Display - headlines',
    family: 'var(--display)',
    weights: '500 · 700 · 900',
    href: 'https://fonts.google.com/specimen/Big+Shoulders+Display',
  },
  {
    name: 'Space Grotesk',
    role: 'Body - paragraphs and UI',
    family: 'var(--body)',
    weights: '400 · 500 · 700',
    href: 'https://fonts.google.com/specimen/Space+Grotesk',
  },
  {
    name: 'IBM Plex Mono',
    role: 'Mono - labels and stencils',
    family: 'var(--mono)',
    weights: '400 · 500',
    href: 'https://fonts.google.com/specimen/IBM+Plex+Mono',
  },
];

/* Logos are picked up from assets/brand/logos/<group>/ at build time -
   drop a file into a folder and it shows up here, no code change needed. */
const LOGO_FILES = import.meta.glob(
  '../../assets/brand/logos/**/*.{png,jpg,jpeg,webp,svg,pdf,eps,ai}',
  { eager: true, query: '?url', import: 'default' },
) as Record<string, string>;

const GROUPS = [
  { folder: 'original', label: 'Original' },
  { folder: 'orientations', label: 'Orientations' },
  { folder: 'rebrand', label: 'Rebrand' },
];

const PREVIEWABLE = /\.(png|jpe?g|webp|svg)$/i;

interface Logo {
  file: string;
  ext: string;
  url: string;
}

function logosIn(folder: string): Logo[] {
  return Object.entries(LOGO_FILES)
    .filter(([path]) => path.includes(`/logos/${folder}/`))
    .map(([path, url]) => {
      const file = path.split('/').pop()!;
      return { file, ext: file.split('.').pop()!.toUpperCase(), url };
    })
    .sort((a, b) => a.file.localeCompare(b.file));
}

export default function AdminAssets() {
  const [copied, setCopied] = useState('');

  const copy = async (hex: string) => {
    try {
      await navigator.clipboard.writeText(hex);
      setCopied(hex);
      setTimeout(() => setCopied((c) => (c === hex ? '' : c)), 1400);
    } catch {
      // Clipboard is blocked outside https/localhost - the hex is still selectable.
    }
  };

  return (
    <>
      <header className="admin__head">
        <div>
          <p className="stencil">Brand</p>
          <h1 className="headline">Asset library</h1>
        </div>
      </header>

      <section className="assets__section">
        <h2 className="stencil">Colours</h2>
        <div className="swatches">
          {COLOURS.map((c) => (
            <button
              key={c.hex}
              type="button"
              className="swatch"
              onClick={() => copy(c.hex)}
              title={`Copy ${c.hex}`}
            >
              <span className="swatch__chip" style={{ background: c.hex }} />
              <span className="swatch__name">{c.name}</span>
              <span className="swatch__hex">{copied === c.hex ? 'Copied' : c.hex}</span>
              <span className="swatch__token">{c.token}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="assets__section">
        <h2 className="stencil">Typography</h2>
        <div className="typefaces">
          {TYPEFACES.map((t) => (
            <a key={t.name} className="typeface" href={t.href} target="_blank" rel="noreferrer">
              <span className="typeface__sample" style={{ fontFamily: t.family }}>
                Aa Amplified
              </span>
              <span className="typeface__name">{t.name} ↗</span>
              <span className="muted">{t.role}</span>
              <span className="swatch__token">{t.weights}</span>
            </a>
          ))}
        </div>
      </section>

      {GROUPS.map((g) => {
        const logos = logosIn(g.folder);
        return (
          <section key={g.folder} className="assets__section">
            <h2 className="stencil">Logos - {g.label}</h2>
            {logos.length ? (
              <div className="logos">
                {logos.map((l) => (
                  <a key={l.url} className="logo-tile" href={l.url} download={l.file}>
                    <span className="logo-tile__preview">
                      {PREVIEWABLE.test(l.file) ? (
                        <img src={l.url} alt={l.file} />
                      ) : (
                        <span className="logo-tile__ext">{l.ext}</span>
                      )}
                    </span>
                    <span className="logo-tile__name">{l.file}</span>
                    <span className="tag">Download {l.ext}</span>
                  </a>
                ))}
              </div>
            ) : (
              <p className="muted">
                No files yet - add them to <code>client/src/assets/brand/logos/{g.folder}/</code>
              </p>
            )}
          </section>
        );
      })}
    </>
  );
}
