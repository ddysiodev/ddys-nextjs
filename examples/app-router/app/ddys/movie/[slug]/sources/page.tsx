import { createDdysServerClient } from 'ddys-nextjs/server';
import { DdysSources } from 'ddys-nextjs/components';
import type { DdysResource } from 'ddys-nextjs';

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sources = await createDdysServerClient().sources(slug) as Record<string, unknown>;
  const groups = {
    Resources: (Array.isArray(sources) ? sources : Array.isArray(sources.resources) ? sources.resources : []) as DdysResource[]
  };
  return <DdysSources groups={groups} />;
}
