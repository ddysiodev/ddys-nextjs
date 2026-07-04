import { DdysView } from 'ddys-nextjs/components';
import { createDdysMovieMetadata } from 'ddys-nextjs/metadata';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return createDdysMovieMetadata(slug, {
    path: `/ddys/movie/${slug}`
  });
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <DdysView view="movie" params={{ slug }} />;
}
