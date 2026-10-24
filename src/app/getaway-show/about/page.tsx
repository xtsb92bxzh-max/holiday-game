import type { Metadata } from 'next';
import AboutScreen from '@/getaway-show/components/AboutScreen';

export const metadata: Metadata = { title: 'What do these prices include?' };

export default function Page() {
  return <AboutScreen />;
}
