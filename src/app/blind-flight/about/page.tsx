import type { Metadata } from 'next';
import AboutScreen from '@/blind-flight/components/AboutScreen';

export const metadata: Metadata = { title: 'About these prices' };

export default function Page() {
  return <AboutScreen />;
}
