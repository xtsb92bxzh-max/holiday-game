import type { Metadata } from 'next';
import '@fontsource/anton/400.css';
import ShowProvider from '@/getaway-show/components/ShowProvider';

export const metadata: Metadata = {
  title: { default: 'The Great British Getaway Show', template: '%s · The Great British Getaway Show' },
  description: 'Tonight, twelve cities enter. Two indecisive adults leave. A game-show parody for choosing a January 2027 break for two.',
};

export default function GetawayShowLayout({ children }: { children: React.ReactNode }) {
  return <ShowProvider>{children}</ShowProvider>;
}
