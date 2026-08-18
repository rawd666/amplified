import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import ReviewForm from '../components/ReviewForm';
import StarRating from '../components/StarRating';
import { api, INSTAGRAM_DM } from '../lib/api';
import { shortDate } from '../lib/format';
import type { Category, Product, Review } from '../lib/types';

export default function Home({ categories }: { categories: Category[] }) {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewTab, setReviewTab] = useState<'reviews' | 'write'>('reviews');

  useEffect(() => {
    api<Product[]>('/products?featured=1')
      .then((rows) => setFeatured(rows.slice(0, 4)))
      .catch(() => setFeatured([]));
  }, []);

  useEffect(() => {
    api<Review[]>('/reviews')
      .then(setReviews)
      .catch(() => setReviews([]));
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
            Guitars, amps, pedals and the small parts that keep a band running.
          </p>
          <div className="hero__cta">
            <Link className="btn btn--primary" to="/store">
              Our Collection
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
              <p className="stencil">What are you looking for?</p>
              <h2 className="headline headline--lg">Our Collection</h2>
            </div>
          </div>
          <div className="grid">
            {categories.filter((c) => !c.parent_id).map((c) => (
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
                <p className="stencil">on display</p>
                <h2 className="headline headline--lg">Hottest Items</h2>
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
          <div className="section__head">
            <div>
              <p className="stencil">Straight from the players</p>
              <h2 className="headline headline--lg">Reviews</h2>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="chip"
                aria-pressed={reviewTab === 'reviews'}
                onClick={() => setReviewTab('reviews')}
              >
                Reviews
              </button>
              <button
                className="chip"
                aria-pressed={reviewTab === 'write'}
                onClick={() => setReviewTab('write')}
              >
                Write a review
              </button>
            </div>
          </div>

          {reviewTab === 'write' ? (
            <ReviewForm />
          ) : reviews.length === 0 ? (
            <div className="empty">No reviews yet. Be the first.</div>
          ) : (
            <>
              {reviews.slice(0, 3).map((r) => (
                <article className="review" key={r.id}>
                  <div className="review__top">
                    <span className="review__who">{r.author}</span>
                    <span className="review__when">{shortDate(r.created_at)}</span>
                  </div>
                  <StarRating value={r.rating} />
                  {r.title && <h3>{r.title}</h3>}
                  <p>{r.body}</p>
                </article>
              ))}
              <Link className="btn btn--sm" to="/reviews" style={{ marginTop: '0.5rem' }}>
                View more
              </Link>
            </>
          )}
        </div>
      </section>

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
