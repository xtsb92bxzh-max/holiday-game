import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { contenderIds, featuredEpisodes } from '@/blind-flight/lib/cast';
import EpisodeScreen from '@/blind-flight/components/EpisodeScreen';

export const dynamicParams = false;

/** Every featured episode, plus enough bonus rounds for every possible contender. */
const episodeIds = [...featuredEpisodes.map((e) => e.id), ...Array.from({ length: Math.ceil(contenderIds.length / 3) }, (_, i) => `bonus-${i + 1}`)];

export function generateStaticParams() {
  return episodeIds.map((id) => ({ id }));
}

export const metadata: Metadata = { title: 'Episode' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!episodeIds.includes(id)) notFound();
  return <EpisodeScreen id={id} />;
}
