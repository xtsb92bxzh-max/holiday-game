import type { Metadata } from 'next';
import ResultsStudio from '@/getaway-show/components/ResultsStudio';

export const metadata: Metadata = { title: 'Results' };

export default function Page() {
  return <ResultsStudio />;
}
