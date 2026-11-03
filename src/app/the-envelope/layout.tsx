import type { Metadata } from 'next';
import EnvelopeProvider from '@/envelope/components/EnvelopeProvider';

export const metadata: Metadata = {
  title: { default: 'The Envelope', template: '%s · The Envelope' },
  description: 'A short choose-your-own-adventure story in an unnamed city. What you choose to do there suggests where to go in January 2027.',
};

export default function EnvelopeLayout({ children }: { children: React.ReactNode }) {
  return <EnvelopeProvider>{children}</EnvelopeProvider>;
}
