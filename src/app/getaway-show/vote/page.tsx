import type { Metadata } from 'next';
import IndependentBallot from '@/getaway-show/components/IndependentBallot';

export const metadata: Metadata = { title: 'Round 4: The Nation Has Voted' };

export default function Page() {
  return <IndependentBallot />;
}
