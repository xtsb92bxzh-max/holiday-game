import type { Metadata } from 'next';
import HandoverScreen from '@/blind-flight/components/HandoverScreen';

export const metadata: Metadata = { title: 'Pass the phone' };

export default function Page() {
  return <HandoverScreen />;
}
