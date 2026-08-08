import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { api, INSTAGRAM_DM } from '../lib/api';
import type { Category, Product } from '../lib/types';

export default function Home({ categories }: { categories: Category[] }) {
  const [featured, setFeatured] = useState<Product[]>([]);

  useEffect(() => {
    api<Product[]>('/products?featured=1')
      .then((rows) => setFeatured(rows.slice(0, 4)))
      .catch(() => setFeatured([]));
  }, []);

  return (
    <>
      <section className="hero">
        <div className="shell">
          <div className="hero__guitar" aria-hidden="true">
            <div className="hero__guitar-inner">
              <img className="hero__guitar-img hero__guitar-img--back" src="/guitar.svg" alt="" />
              <img className="hero__guitar-img hero__guitar-img--front" src="/guitar.svg" alt="" />
            </div>
          </div>

          <p className="stencil stencil--violet">Amman · Est. 2022</p>
          <h1 className="headline headline--xl hero__title">
            Gear that
            <span>earns its</span>
            volume
          </h1>
          <p className="hero__lede">
            Guitars, amps, pedals and the small parts that keep a band running. Every instrument is
            set up on the bench and played through a real amp before we let it leave.
          </p>
          <div className="hero__cta">
            <Link className="btn btn--primary" to="/store">
              Shop the floor
            </Link>
            <Link className="btn" to="/booking">
              Book a try-out
            </Link>
            <a className="btn btn--ghost" href={INSTAGRAM_DM} target="_blank" rel="noreferrer">
              DM us
            </a>
          </div>
        </div>
      </section>

      <section className="section section--edge">
        <div className="shell">
          <div className="section__head">
            <div>
              <p className="stencil">Four ways in</p>
              <h2 className="headline headline--lg">The floor</h2>
            </div>
          </div>
          <div className="grid">
            {categories.map((c) => (
              <Link key={c.id} className="card" to={`/store/${c.slug}`}>
                <div className="card__body">
                  <span className="card__brand">{c.product_count ?? 0} in stock</span>
                  <h3 className="card__name">{c.name}</h3>
                  <p className="muted" style={{ margin: 0, fontSize: '0.9rem' }}>
                    {c.blurb}
                  </p>
                  <span className="card__foot" style={{ color: 'var(--violet-hot)' }}>
                    Browse {c.name.toLowerCase()} →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="section section--edge">
          <div className="shell">
            <div className="section__head">
              <div>
                <p className="stencil">Picked by the bench</p>
                <h2 className="headline headline--lg">On the wall</h2>
                <p>The pieces we keep plugged in, because someone always asks to hear them.</p>
              </div>
              <Link className="btn btn--sm" to="/store">
                See everything
              </Link>
            </div>
            <div className="grid">
              {featured.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section section--edge">
        <div className="shell">
          <div className="rig" style={{ padding: 'clamp(1.5rem, 4vw, 3rem)' }}>
            <div className="rig__head" style={{ borderBottom: 0, paddingBottom: 0 }}>
              <span className="lamp" aria-hidden="true" />
              <span>How buying works</span>
            </div>
            <div
              style={{
                display: 'grid',
                gap: '1.5rem',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                marginTop: '1.75rem',
              }}
            >
              <div>
                <p className="stencil stencil--violet">Pay in cash</p>
                <p className="muted" style={{ margin: 0 }}>
                  No cards, no transfers. You hand the driver the cash when the box is in your hands.
                </p>
              </div>
              <div>
                <p className="stencil stencil--violet">Or come and play it</p>
                <p className="muted" style={{ margin: 0 }}>
                  Book a slot and we will have it tuned, plugged in and waiting for you.
                </p>
              </div>
              <div>
                <p className="stencil stencil--violet">Questions go to the DMs</p>
                <p className="muted" style={{ margin: 0 }}>
                  We answer Instagram faster than email. Ask about stock, tone, anything.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
