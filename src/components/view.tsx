import type { DdysDisplayOptions, DdysItem } from '../types/ddys';
import { createDdysServerClient } from '../server/client';
import { nextFetchOptions } from '../server/cache';
import type { DdysConfigInput } from '../client/config';
import { DdysGrid } from './grid';
import { DdysMovieDetail } from './movie-detail';

export interface DdysViewProps {
  view: string;
  params?: Record<string, string | number | undefined>;
  display?: DdysDisplayOptions;
  config?: DdysConfigInput;
}

export async function DdysView({ view, params = {}, display, config }: DdysViewProps) {
  const client = createDdysServerClient(config);
  switch (view) {
    case 'latest': return <DdysGrid items={await asItems(client.latest(params, nextFetchOptions('/latest', client.config)))} display={display} siteBaseUrl={client.config.siteBaseUrl} />;
    case 'hot': return <DdysGrid items={await asItems(client.hot(params, nextFetchOptions('/hot', client.config)))} display={display} siteBaseUrl={client.config.siteBaseUrl} />;
    case 'movies': return <DdysGrid items={(await client.movies(params, nextFetchOptions('/movies', client.config))).data as DdysItem[]} display={display} siteBaseUrl={client.config.siteBaseUrl} />;
    case 'search': return <DdysGrid items={(await client.search(params, nextFetchOptions('/search', client.config))).data as DdysItem[]} display={display} siteBaseUrl={client.config.siteBaseUrl} />;
    case 'collections': return <DdysGrid items={(await client.collections(params, nextFetchOptions('/collections', client.config))).data as DdysItem[]} display={display} siteBaseUrl={client.config.siteBaseUrl} />;
    case 'shares': return <DdysGrid items={(await client.shares(params, nextFetchOptions('/shares', client.config))).data as DdysItem[]} display={display} siteBaseUrl={client.config.siteBaseUrl} />;
    case 'requests': return <DdysGrid items={(await client.requests(params, nextFetchOptions('/requests', client.config))).data as DdysItem[]} display={display} siteBaseUrl={client.config.siteBaseUrl} />;
    case 'activities': return <DdysGrid items={(await client.activities(params, nextFetchOptions('/activities', client.config))).data as DdysItem[]} display={display} siteBaseUrl={client.config.siteBaseUrl} />;
    case 'movie': return <DdysMovieDetail movie={await client.movie(String(params.slug || ''), nextFetchOptions(`/movies/${params.slug}`, client.config)) as DdysItem} display={display} siteBaseUrl={client.config.siteBaseUrl} />;
    case 'types': return <DdysGrid items={dictionary(await client.types(nextFetchOptions('/types', client.config)))} display={display} siteBaseUrl={client.config.siteBaseUrl} />;
    case 'genres': return <DdysGrid items={dictionary(await client.genres(nextFetchOptions('/genres', client.config)))} display={display} siteBaseUrl={client.config.siteBaseUrl} />;
    case 'regions': return <DdysGrid items={dictionary(await client.regions(nextFetchOptions('/regions', client.config)))} display={display} siteBaseUrl={client.config.siteBaseUrl} />;
    default: return <div className="ddys-next-empty">Unsupported DDYS view.</div>;
  }
}

async function asItems(payload: Promise<unknown>): Promise<DdysItem[]> {
  const data = await payload;
  if (Array.isArray(data)) return data as DdysItem[];
  if (data && typeof data === 'object' && Array.isArray((data as { data?: unknown }).data)) return (data as { data: DdysItem[] }).data;
  return [];
}

function dictionary(payload: unknown): DdysItem[] {
  if (Array.isArray(payload)) return payload.map((item) => typeof item === 'object' ? item as DdysItem : { title: String(item) });
  if (payload && typeof payload === 'object') {
    return Object.entries(payload as Record<string, unknown>).map(([code, value]) => {
      if (value && typeof value === 'object') return { code, ...(value as Record<string, unknown>) } as DdysItem;
      return { title: String(value), code } as DdysItem;
    });
  }
  return [];
}
