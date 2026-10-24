import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { destinationById } from '@/lib/catalogue';
import { featuredIds, isFeatured, isShowable, showDestinationIds } from '@/blind-flight/lib/cast';
import ContestantScreen from '@/blind-flight/components/ContestantScreen';

export const dynamicParams = false;

export function generateStaticParams() {
  return showDestinationIds.map((id) => ({ id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  // Featured contestants keep their identity out of the tab title until revealed.
  if (isFeatured(id)) return { title: `Contestant ${featuredIds.indexOf(id) + 1}` };
  return { title: destinationById[id]?.name ?? 'Contestant' };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isShowable(id)) notFound();
  return <ContestantScreen id={id} />;
}
