import assumptions from '../data/assumptions.json';

const DAY = 24 * 60 * 60 * 1000;

export function nightsBetween(departDate: string, returnDate: string): number {
  const a = Date.parse(departDate + 'T00:00:00Z');
  const b = Date.parse(returnDate + 'T00:00:00Z');
  return Math.round((b - a) / DAY);
}

/** True when the dates fit the trip rules: out 17/18, back 21/22 Jan 2027, at least four nights. */
export function isEligibleTrip(
  departDate: string,
  returnDate: string,
  rules = assumptions.travelWindow,
): boolean {
  if (!rules.departDates.includes(departDate)) return false;
  if (!rules.returnDates.includes(returnDate)) return false;
  return nightsBetween(departDate, returnDate) >= rules.minNights;
}

const fmtDay = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });

export function formatDate(iso: string): string {
  return fmtDay.format(new Date(iso + 'T00:00:00Z'));
}

export function formatDateRange(departDate: string, returnDate: string): string {
  return `${formatDate(departDate)} → ${formatDate(returnDate)}`;
}
