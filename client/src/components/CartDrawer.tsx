import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { money } from '../lib/format';
import { INSTAGRAM_DM } from '../lib/api';

export default function CartDrawer() {
  const { lines, total, open, setOpen, setQty, remove } = useCart();
  if (!open) return null;

  return (
    <div className="drawer" onClick={() => setOpen(false)}>
      <aside
        className="drawer__panel"
        role="dialog"
        aria-modal="true"
        aria-label="Cart"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="drawer__head">
          <strong className="stencil" style={{ margin: 0 }}>
            Your cart
          </strong>
          <button className="btn btn--sm btn--ghost" onClick={() => setOpen(false)}>
            Close
          </button>
        </header>

        <div className="drawer__list">
          {lines.length === 0 ? (
            <div className="empty">
              Nothing in here yet.
              <br />
              <Link to="/store" onClick={() => setOpen(false)} style={{ color: 'var(--violet-hot)' }}>
                Go pick something loud →
              </Link>
            </div>
          ) : (
            lines.map((line) => (
              <div className="line" key={line.product_id}>
                {line.image ? (
                  <img className="line__shot" src={line.image} alt="" />
                ) : (
                  <span className="line__shot" />
                )}
                <div>
                  <strong>{line.name}</strong>
                  <small>{money(line.price)} each</small>
                  <div className="qty" style={{ marginTop: '0.4rem', width: 'fit-content' }}>
                    <button onClick={() => setQty(line.product_id, line.qty - 1)} aria-label="Remove one">
                      −
                    </button>
                    <span>{line.qty}</span>
                    <button onClick={() => setQty(line.product_id, line.qty + 1)} aria-label="Add one">
                      +
                    </button>
                  </div>
                </div>
                <button
                  className="btn btn--sm btn--ghost"
                  onClick={() => remove(line.product_id)}
                  aria-label={`Remove ${line.name}`}
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        <footer className="drawer__foot">
          <div className="total">
            <span className="muted">Total</span>
            <span>{money(total)}</span>
          </div>
          <p className="muted" style={{ margin: 0, fontSize: '0.8rem' }}>
            You pay the driver in cash when the gear arrives.
          </p>
          <Link
            className="btn btn--primary btn--block"
            to="/checkout"
            onClick={() => setOpen(false)}
            aria-disabled={lines.length === 0}
            style={lines.length === 0 ? { pointerEvents: 'none', opacity: 0.45 } : undefined}
          >
            Checkout
          </Link>
          <a className="btn btn--block btn--ghost" href={INSTAGRAM_DM} target="_blank" rel="noreferrer">
            Ask us on Instagram
          </a>
        </footer>
      </aside>
    </div>
  );
}
