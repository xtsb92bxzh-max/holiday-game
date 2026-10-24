import type { Metadata } from 'next';
import DestinationReveal from '@/getaway-show/components/DestinationReveal';

export const metadata: Metadata = { title: 'Round 1: Catch a Flight' };

export default function Page() {
  return <DestinationReveal />;
}
