import type { Metadata } from 'next';
import FinalComparison from '@/getaway-show/components/FinalComparison';

export const metadata: Metadata = { title: 'Grand Final' };

export default function Page() {
  return <FinalComparison />;
}
