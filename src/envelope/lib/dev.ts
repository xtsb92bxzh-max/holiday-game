/**
 * The development view (/the-envelope/dev) shows how each decision moved the
 * recommendation. It is on in `npm run dev` and off in production builds,
 * unless the build sets NEXT_PUBLIC_ENVELOPE_DEV=1 (useful on a preview deploy).
 */
export const devViewEnabled = process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_ENVELOPE_DEV === '1';
