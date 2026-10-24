import type { Metadata } from 'next';
import ShowScreen from '@/blind-flight/components/ShowScreen';

export const metadata: Metadata = { title: 'Meet the contestants' };

export default function Page() {
  return <ShowScreen />;
}
