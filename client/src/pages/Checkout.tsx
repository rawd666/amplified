import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { api, INSTAGRAM_DM } from '../lib/api';
import { bookableDays, dayLabel, money, SLOTS } from '../lib/format';

type Fulfilment = 'delivery' | 'pickup';

export default function Checkout() {
  const { lines, total, clear } = useCart();
  const [fulfilment, setFulfilment] = useState<Fulfilment>('delivery');
  const [form, setForm] = useState({
    customer: '',
    phone: '',
    email: '',
    address: '',
    city: 'Amman',
    notes: '',
  });
  const [slotDate, setSlotDate] = useState(bookableDays()[0]);
  const [slotTime, setSlotTime] = useState('');
  const [taken, setTaken] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [reference, setReference] = useState('');

  // Pickup slots share the booking calendar, so check what's already gone.
  useEffect(() => {
    if (fulfilment !== 'pickup') return;
    api<string[]>(`/bookings/taken?date=${slotDate}`)
      .then(setTaken)
      .catch(() => setTaken([]));
  }, [fulfilment, slotDate]);

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await api<{ reference: string }>('/orders', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          fulfilment,
          slot_date: fulfilment === 'pickup' ? slotDate : '',
          slot_time: fulfilment === 'pickup' ? slotTime : '',
          items: lines.map((l) => ({
            product_id: l.product_id,
            name: l.name,
            price: l.price,
            qty: l.qty,
          })),
        }),
      });
      setReference(res.reference);
      clear();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (reference) {
    return (
      <div className="shell">
        <div className="receipt">
          <span className="lamp" style={{ margin: '0 auto 1rem' }} aria-hidden="true" />
          <p className="stencil">Order placed</p>
          <h1 className="headline headline--md">Have the cash ready</h1>
          <p className="receipt__ref">{reference}</p>
          <p className="muted">
            {fulfilment === 'delivery'
              ? 'We will call you to confirm the address, then a driver brings it out. Pay the driver in cash.'
              : `Come to the shop on ${dayLabel(slotDate)} at ${slotTime}. Pay in cash at the counter.`}
          </p>
          <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            <Link className="btn" to="/store">
              Keep browsing
            </Link>
            <a className="btn btn--primary" href={INSTAGRAM_DM} target="_blank" rel="noreferrer">
              Send us a DM
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="shell section">
        <div className="empty">
          Your cart is empty.{' '}
          <Link to="/store" style={{ color: 'var(--violet-hot)' }}>
            Go pick something →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="shell">
      <div className="section__head" style={{ paddingTop: '3rem', marginBottom: 0 }}>
        <div>
          <p className="stencil">Checkout</p>
          <h1 className="headline headline--lg">Cash on delivery</h1>
          <p>No cards, no transfers. You pay when the gear is in your hands.</p>
        </div>
      </div>

      <form className="checkout" onSubmit={submit}>
        <div className="pane">
          {error && <div className="notice notice--error">{error}</div>}

          <p className="stencil">How do you want it?</p>
          <div className="pick">
            <button
              type="button"
              className="pick__opt"
              aria-pressed={fulfilment === 'delivery'}
              onClick={() => setFulfilment('delivery')}
            >
              <strong>Deliver it</strong>
              <small>A driver brings it. Pay him in cash.</small>
            </button>
            <button
              type="button"
              className="pick__opt"
              aria-pressed={fulfilment === 'pickup'}
              onClick={() => setFulfilment('pickup')}
            >
              <strong>Book a pickup</strong>
              <small>Collect it in store at a time you choose.</small>
            </button>
          </div>

          <div className="pair">
            <label className="field">
              <span>Full name</span>
              <input value={form.customer} onChange={set('customer')} required minLength={2} />
            </label>
            <label className="field">
              <span>Phone</span>
              <input
                value={form.phone}
                onChange={set('phone')}
                required
                inputMode="tel"
                placeholder="07 9 000 0000"
              />
            </label>
          </div>

          <label className="field">
            <span>Email (optional)</span>
            <input type="email" value={form.email} onChange={set('email')} />
          </label>

          {fulfilment === 'delivery' ? (
            <div className="pair">
              <label className="field">
                <span>City</span>
                <input value={form.city} onChange={set('city')} required />
              </label>
              <label className="field">
                <span>Address</span>
                <input
                  value={form.address}
                  onChange={set('address')}
                  required
                  placeholder="Street, building, floor"
                />
              </label>
            </div>
          ) : (
            <>
              <label className="field">
                <span>Pickup day</span>
                <select value={slotDate} onChange={(e) => setSlotDate(e.target.value)}>
                  {bookableDays().map((d) => (
                    <option key={d} value={d}>
                      {dayLabel(d)}
                    </option>
                  ))}
                </select>
              </label>

              <div className="field">
                <span>Pickup time</span>
                <div className="slots">
                  {SLOTS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      className="slot"
                      aria-pressed={slotTime === t}
                      disabled={taken.includes(t)}
                      onClick={() => setSlotTime(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <label className="field">
            <span>Anything we should know?</span>
            <textarea
              value={form.notes}
              onChange={set('notes')}
              placeholder="Gate code, string gauge you want fitted, a landmark near you…"
            />
          </label>

          <button
            className="btn btn--primary btn--block"
            disabled={busy || (fulfilment === 'pickup' && !slotTime)}
          >
            {busy ? 'Placing order…' : `Place order · ${money(total)}`}
          </button>
          {fulfilment === 'pickup' && !slotTime && (
            <p className="muted" style={{ fontSize: '0.8rem' }}>
              Pick a time to place the order.
            </p>
          )}
        </div>

        <aside className="pane pane--summary">
          <p className="stencil">Your order</p>
          {lines.map((l) => (
            <div className="line" key={l.product_id} style={{ gridTemplateColumns: '1fr auto' }}>
              <div>
                <strong>{l.name}</strong>
                <small>
                  {l.qty} × {money(l.price)}
                </small>
              </div>
              <span className="price">{money(l.qty * l.price)}</span>
            </div>
          ))}
          <div className="total">
            <span className="muted">Pay on arrival</span>
            <span>{money(total)}</span>
          </div>
          <p className="muted" style={{ fontSize: '0.82rem' }}>
            Delivery inside Amman is free. Outside the city we will call you with the courier fee
            before anything ships.
          </p>
        </aside>
      </form>
    </div>
  );
}
