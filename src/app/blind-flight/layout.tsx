import type { Metadata } from 'next';
import '@fontsource/shrikhand/400.css';
import BlindFlightProvider from '@/blind-flight/components/BlindFlightProvider';

export const metadata: Metadata = {
  title: { default: 'Blind Flight', template: '%s · Blind Flight' },
  description: 'Love at first flight. Regret at baggage claim. The dating show where you fall for a destination, not a person.',
};

export default function BlindFlightLayout({ children }: { children: React.ReactNode }) {
  return <BlindFlightProvider>{children}</BlindFlightProvider>;
}
