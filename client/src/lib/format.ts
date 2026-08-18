import { CURRENCY } from './api';

export function money(amount: number) {
  return `${CURRENCY} ${amount.toLocaleString('en-JO', { minimumFractionDigits: 2 })}`;
}

export function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** The shop floor takes one booking per slot, noon to seven. */
export const SLOTS = [
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
];

/** Bookings open tomorrow and run two weeks out. */
export function bookableDays(count = 14) {
  const days: string[] = [];
  const cursor = new Date();
  for (let i = 1; i <= count; i += 1) {
    const day = new Date(cursor);
    day.setDate(cursor.getDate() + i);
    days.push(day.toISOString().slice(0, 10));
  }
  return days;
}

export function dayLabel(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}
