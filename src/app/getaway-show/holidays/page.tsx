import type { Metadata } from 'next';
import HolidaysTable from '@/getaway-show/components/HolidaysTable';

export const metadata: Metadata = { title: 'All eligible holidays' };

export default function Page() {
  return <HolidaysTable />;
}
