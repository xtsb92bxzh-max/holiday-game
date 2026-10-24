import type { Metadata } from 'next';
import ResultsScreen from '@/blind-flight/components/ResultsScreen';

export const metadata: Metadata = { title: 'Results' };

export default function Page() {
  return <ResultsScreen />;
}
