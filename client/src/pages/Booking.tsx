import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api, INSTAGRAM_DM } from '../lib/api';
import { bookableDays, dayLabel, SLOTS } from '../lib/format';

const REASONS = [
  { id: 'try-out', label: 'Try gear out', hint: 'Plug in, turn it up, take your time.' },
  { id: 'setup', label: 'Setup & Repairs', hint: 'Any sort of maintenance that your guitar could need.' },
  { id: 'sell', label: 'Sell', hint: 'Set up an appointment to agree on the details.' },
];

export default function Booking() {
  const days = bookableDays();
  const [reason, setReason] = useState('try-out');
  const [slotDate, setSlotDate] = useState(days[0]);
  const [slotTime, setSlotTime] = useState('');
  const [taken, setTaken] = useState<string[]>([]);
  const [form, setForm] = useState({ customer: '', phone: '', interest: '', notes: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [reference, setReference] = useState('');

  // One booking per slot, so refresh the taken list whenever the day changes.
  useEffect(() => {
    api<string[]>(`/bookings/taken?date=${slotDate}`)
      .then(setTaken)
      .catch(() => setTaken([]));
  }, [slotDate]);

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await api<{ reference: string }>('/bookings', {
        method: 'POST',
        body: JSON.stringify({ ...form, reason, slot_date: slotDate, slot_time: slotTime }),
      });
      setReference(res.reference);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (reference) {
    return (
      <section className="section">
        <div className="shell">
          <div className="receipt">
            <span className="lamp" aria-hidden="true" />
            <p className="stencil">Booked</p>
            <h1 className="headline headline--lg">See you at the shop</h1>
            <p className="receipt__ref">{reference}</p>
            <p>
              {dayLabel(slotDate)} at {slotTime}. Bring your own cable if you have a favourite - we
              will have the amp warm.
            </p>
            <div className="receipt__acts" style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a className="btn btn--ghost" href={INSTAGRAM_DM} target="_blank" rel="noreferrer">
                Message us on Instagram
              </a>
              <Link className="btn" to="/store">
                Back to the store
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="shell">
        <div className="section__head">
          <div>
            <p className="stencil">Booking</p>
            <h1 className="headline headline--lg">Make an appointment</h1>
            <p className="muted">
              If you're looking to buy one of our guitars or even set up one of your own, pick a time and a date, 
              and let us know what it's for. We'll be sure to get back to you within an hour.</p>
          </div>
        </div>

        <form className="checkout" onSubmit={submit}>
          <div className="pane">
            <p className="stencil">01 - What for</p>
            <div className="pick">
              {REASONS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className="pick__opt"
                  aria-pressed={reason === r.id}
                  onClick={() => setReason(r.id)}
                >
                  <strong>{r.label}</strong>
                  <span>{r.hint}</span>
                </button>
              ))}
            </div>

            <p className="stencil" style={{ marginTop: '1.75rem' }}>
              02 - When
            </p>
            <label className="field">
              <span>Day</span>
              <select value={slotDate} onChange={(e) => setSlotDate(e.target.value)}>
                {days.map((d) => (
                  <option key={d} value={d}>
                    {dayLabel(d)}
                  </option>
                ))}
              </select>
            </label>

            <div className="slots">
              {SLOTS.map((t) => {
                const gone = taken.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    className="slot"
                    disabled={gone}
                    aria-pressed={slotTime === t}
                    onClick={() => setSlotTime(t)}
                  >
                    {t}
                    {gone && <small>taken</small>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pane">
            <p className="stencil">03 - Your Info</p>
            <label className="field">
              <span>Full name</span>
              <input value={form.customer} onChange={set('customer')} required />
            </label>
            <label className="field">
              <span>Phone</span>
              <input value={form.phone} onChange={set('phone')} required placeholder="07…" />
            </label>
            <label className="field">
              <span>Tell us what you need</span>
              <textarea rows={3} value={form.notes} onChange={set('notes')} />
            </label>

            {error && <p className="notice notice--error">{error}</p>}

            <button className="btn btn--primary btn--block" disabled={busy || !slotTime}>
              {busy ? 'Booking…' : 'Confirm booking'}
            </button>
            <p className="muted" style={{ fontSize: '0.82rem', marginTop: '0.9rem' }}>
              Prefer to sort it in a DM?{' '}
              <a href={INSTAGRAM_DM} target="_blank" rel="noreferrer">
                Message us on Instagram
              </a>
              .
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}
