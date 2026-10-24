import type { Metadata, Viewport } from 'next';
import '@fontsource/bungee/400.css';
import '@fontsource-variable/fraunces';
import '@fontsource-variable/dm-sans';
import './globals.css';

export const metadata: Metadata = {
  title: 'Holiday Games',
  description: 'Pick tonight’s show.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0b1452',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body>{children}</body>
    </html>
  );
}
