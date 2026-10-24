import type { Metadata } from 'next';
import HolidaysScreen from '@/blind-flight/components/HolidaysScreen';

export const metadata: Metadata = { title: 'All the holidays' };

export default function Page() {
  return <HolidaysScreen />;
}
