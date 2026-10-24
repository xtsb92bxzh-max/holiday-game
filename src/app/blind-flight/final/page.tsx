import type { Metadata } from 'next';
import FinalScreen from '@/blind-flight/components/FinalScreen';

export const metadata: Metadata = { title: 'The grand final' };

export default function Page() {
  return <FinalScreen />;
}
