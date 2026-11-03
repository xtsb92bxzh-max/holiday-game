import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import DevView from '@/envelope/components/DevView';
import { devViewEnabled } from '@/envelope/lib/dev';

export const metadata: Metadata = { title: 'Development view', robots: { index: false } };

export default function Page() {
  if (!devViewEnabled) notFound();
  return <DevView />;
}
