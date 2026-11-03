import { NextResponse } from 'next/server';
import { devViewEnabled } from './envelope/lib/dev';

/** The Envelope's development view answers with a real 404 in production builds. */
export function middleware() {
  if (devViewEnabled) return NextResponse.next();
  return new NextResponse('Not found', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8' } });
}

export const config = { matcher: '/the-envelope/dev' };
