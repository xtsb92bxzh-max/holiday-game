import type { Metadata } from 'next';
import CompareScreen from '@/blind-flight/components/CompareScreen';

export const metadata: Metadata = { title: 'Grand final' };

export default function Page() {
  return <CompareScreen />;
}
