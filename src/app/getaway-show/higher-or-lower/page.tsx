import type { Metadata } from 'next';
import HigherLowerGame from '@/getaway-show/components/HigherLowerGame';

export const metadata: Metadata = { title: 'Round 2: Play Your Flights Right' };

export default function Page() {
  return <HigherLowerGame />;
}
