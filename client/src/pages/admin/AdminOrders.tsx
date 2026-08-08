import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { dayLabel, money, shortDate } from '../../lib/format';
import type { Booking, Order } from '../../lib/types';

const ORDER_STATUS = ['new', 'confirmed', 'out-for-delivery', 'paid', 'cancelled'];
const BOOKING_STATUS = ['pending', 'confirmed', 'done', 'cancelled'];

type Tab = 'orders' | 'bookings';

export default function AdminOrders() {
  const [tab, setTab] = useState<Tab>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState('');

  const load = async () => {
    const [o, b] = await Promise.all([api<Order[]>('/orders'), api<Booking[]>('/bookings')]);
    setOrders(o);
    setBookings(b);
  };

  useEffect(() => {
    load().catch((e) => setError((e as Error).message));
  }, []);

  const move = async (kind: Tab, id: number, status: string) => {
    try {
      await api(`/${kind}/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <>
      <header className="admin__head">
        <div>
          <p className="stencil">Counter</p>
          <h1 className="headline">Orders &amp; bookings</h1>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="chip" aria-pressed={tab === 'orders'} onClick={() => setTab('orders')}>
            Orders ({orders.length})
          </button>
          <button
            className="chip"
            aria-pressed={tab === 'bookings'}
            onClick={() => setTab('bookings')}
          >
            Bookings ({bookings.length})
          </button>
        </div>
      </header>

      {error && <div className="notice notice--error">{error}</div>}

      {tab === 'orders' ? (
        <table className="table">
          <thead>
            <tr>
              <th>Ref</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total (cash)</th>
              <th>Fulfilment</th>
              <th>Placed</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>
                  <span className="tag" data-on="true">
                    {o.reference}
                  </span>
                </td>
                <td>
                  <strong>{o.customer}</strong>
                  <br />
                  <span className="muted" style={{ fontSize: '0.78rem' }}>
                    {o.phone} · {o.city}
                    {o.address ? ` · ${o.address}` : ''}
                  </span>
                </td>
                <td style={{ maxWidth: 260 }}>
                  <span className="muted" style={{ fontSize: '0.8rem' }}>
                    {o.items.map((i) => `${i.qty}× ${i.name}`).join(', ')}
                  </span>
                </td>
                <td>{money(o.total)}</td>
                <td>
                  {o.fulfilment === 'pickup' ? (
                    <>
                      Pickup
                      <br />
                      <span className="muted" style={{ fontSize: '0.78rem' }}>
                        {dayLabel(o.slot_date)} {o.slot_time}
                      </span>
                    </>
                  ) : (
                    'Delivery'
                  )}
                </td>
                <td className="muted" style={{ fontSize: '0.78rem' }}>
                  {shortDate(o.created_at)}
                </td>
                <td>
                  <select value={o.status} onChange={(e) => move('orders', o.id, e.target.value)}>
                    {ORDER_STATUS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
            {!orders.length && (
              <tr>
                <td colSpan={7}>
                  <div className="empty">No orders yet.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Ref</th>
              <th>Customer</th>
              <th>Reason</th>
              <th>Wants to play</th>
              <th>Slot</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id}>
                <td>
                  <span className="tag" data-on="true">
                    {b.reference}
                  </span>
                </td>
                <td>
                  <strong>{b.customer}</strong>
                  <br />
                  <span className="muted" style={{ fontSize: '0.78rem' }}>
                    {b.phone}
                  </span>
                </td>
                <td>{b.reason}</td>
                <td className="muted" style={{ fontSize: '0.82rem' }}>
                  {b.interest || '-'}
                  {b.notes ? ` · ${b.notes}` : ''}
                </td>
                <td>
                  {dayLabel(b.slot_date)}
                  <br />
                  <span className="muted" style={{ fontSize: '0.78rem' }}>
                    {b.slot_time}
                  </span>
                </td>
                <td>
                  <select value={b.status} onChange={(e) => move('bookings', b.id, e.target.value)}>
                    {BOOKING_STATUS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
            {!bookings.length && (
              <tr>
                <td colSpan={6}>
                  <div className="empty">No bookings yet.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </>
  );
}
