import type { Metadata } from 'next';
import GameApp from '@/components/GameApp';

export const metadata: Metadata = {
  title: 'The Great January Getaway',
  description: 'Two travellers. Twenty holidays. One deeply overworked spreadsheet.',
};

export default function Page() {
  return <GameApp />;
}
