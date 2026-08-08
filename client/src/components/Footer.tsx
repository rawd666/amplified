import { Link } from 'react-router-dom';
import { INSTAGRAM_DM, INSTAGRAM_HANDLE, INSTAGRAM_PROFILE } from '../lib/api';
import type { Category } from '../lib/types';

export default function Footer({ categories }: { categories: Category[] }) {
  return (
    <footer className="foot">
      <div className="shell">
        <div className="foot__grid">
          <div>
            <div className="plate__brand" style={{ marginBottom: '0.75rem' }}>
              <img src="/logo.png" alt="Amplified" className="plate__logo" />
            </div>
            <p className="muted" style={{ maxWidth: '32ch', marginTop: 0 }}>
              A guitar shop in Amman. Everything gets set up on the bench, plugged in, and played
              before it goes out the door.
            </p>
            <a className="foot__dm" href={INSTAGRAM_DM} target="_blank" rel="noreferrer">
              ◎ DM us on Instagram
            </a>
          </div>

          <div>
            <h4>Store</h4>
            <ul>
              {categories.map((c) => (
                <li key={c.id}>
                  <Link to={`/store/${c.slug}`}>{c.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4>Reviews</h4>
            <ul>
              <li>
                <Link to="/reviews">All reviews</Link>
              </li>
              <li>
                <Link to="/reviews/write">Write a review</Link>
              </li>
            </ul>
          </div>

          <div>
            <h4>Visit</h4>
            <ul>
              <li>
                <Link to="/booking">Book a try-out</Link>
              </li>
              <li>
                <Link to="/gallery">Gallery</Link>
              </li>
              <li>
                <a href={INSTAGRAM_PROFILE} target="_blank" rel="noreferrer">
                  @{INSTAGRAM_HANDLE}
                </a>
              </li>
              <li className="muted">Tlaa' Al Ali, Amman</li>
              <li className="muted">Sat–Thu, 10:00–20:00</li>
            </ul>
          </div>
        </div>

        <div className="foot__base">
          <span>© {new Date().getFullYear()} Amplified. Guitars & More.</span>
          <Link to="/admin">Staff sign in</Link>
        </div>
      </div>
    </footer>
  );
}
