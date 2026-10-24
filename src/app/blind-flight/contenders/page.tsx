import type { Metadata } from 'next';
import ContendersScreen from '@/blind-flight/components/ContendersScreen';

export const metadata: Metadata = { title: 'More eligible contenders' };

export default function Page() {
  return <ContendersScreen />;
}
