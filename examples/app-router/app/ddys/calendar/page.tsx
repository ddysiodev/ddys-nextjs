import { DdysView } from 'ddys-nextjs/components';

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  return <DdysView view="calendar" params={await searchParams} />;
}
