import type { Metadata } from 'next';
import CategoryTarget from '@/getaway-show/components/CategoryTarget';

export const metadata: Metadata = { title: 'Round 3: The Holiday Bullseye' };

export default function Page() {
  return <CategoryTarget />;
}
