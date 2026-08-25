import nodemailer from 'nodemailer';

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, ORDER_NOTIFY_EMAIL, BOOKING_NOTIFY_EMAIL } =
  process.env;

const transporter =
  SMTP_HOST && SMTP_USER && SMTP_PASS
    ? nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT ?? 587),
        secure: Number(SMTP_PORT ?? 587) === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      })
    : null;

interface OrderForEmail {
  reference: string;
  customer: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  notes: string;
  items: { name: string; price: number; qty: number }[];
  total: number;
  fulfilment: string;
  slot_date: string;
  slot_time: string;
}

/** Fire-and-forget: a missing/broken mail server should never block an order from saving. */
export async function sendOrderNotification(order: OrderForEmail) {
  if (!transporter || !ORDER_NOTIFY_EMAIL) return;

  const lines = order.items.map(
    (i) => `  ${i.qty} x ${i.name} - ${(i.price * i.qty).toFixed(2)} JOD`,
  );

  const text = [
    `New order ${order.reference}`,
    '',
    `Customer: ${order.customer}`,
    `Phone: ${order.phone}`,
    order.email && `Email: ${order.email}`,
    order.fulfilment === 'delivery'
      ? `Delivery to: ${order.address}, ${order.city}`
      : `Pickup: ${order.slot_date} ${order.slot_time}`,
    order.notes && `Notes: ${order.notes}`,
    '',
    'Items:',
    ...lines,
    '',
    `Total: ${order.total.toFixed(2)} JOD`,
  ]
    .filter(Boolean)
    .join('\n');

  try {
    await transporter.sendMail({
      from: SMTP_FROM ?? SMTP_USER,
      to: ORDER_NOTIFY_EMAIL,
      subject: `New order ${order.reference} - ${order.customer}`,
      text,
    });
  } catch (err) {
    console.error('Order notification email failed:', err);
  }
}

interface BookingForEmail {
  reference: string;
  customer: string;
  phone: string;
  reason: string;
  interest: string;
  slot_date: string;
  slot_time: string;
  notes: string;
}

/** Fire-and-forget: a missing/broken mail server should never block a booking from saving. */
export async function sendBookingNotification(booking: BookingForEmail) {
  const to = BOOKING_NOTIFY_EMAIL || ORDER_NOTIFY_EMAIL;
  if (!transporter || !to) return;

  const text = [
    `New booking ${booking.reference}`,
    '',
    `Customer: ${booking.customer}`,
    `Phone: ${booking.phone}`,
    `Reason: ${booking.reason}`,
    booking.interest && `Interested in: ${booking.interest}`,
    `When: ${booking.slot_date} ${booking.slot_time}`,
    booking.notes && `Notes: ${booking.notes}`,
  ]
    .filter(Boolean)
    .join('\n');

  try {
    await transporter.sendMail({
      from: SMTP_FROM ?? SMTP_USER,
      to,
      subject: `New booking ${booking.reference} - ${booking.customer}`,
      text,
    });
  } catch (err) {
    console.error('Booking notification email failed:', err);
  }
}
