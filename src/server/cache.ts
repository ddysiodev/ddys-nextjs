import 'server-only';

import { revalidatePath, revalidateTag } from 'next/cache';
import type { DdysConfig } from '../client/config';

export interface DdysRevalidateInput {
  tag?: string;
  tagProfile?: string | { expire?: number };
  path?: string;
  pathType?: 'layout' | 'page';
}

export function ttlForPath(path: string, config: DdysConfig): number {
  if (/^\/(types|genres|regions|calendar)$/.test(path)) return config.cache.dictionaryTtl;
  if (/^\/(latest|hot)$/.test(path)) return config.cache.freshTtl;
  if (/^\/(movies\/[^/]+|movies\/[^/]+\/sources|movies\/[^/]+\/related|collections\/[^/]+|shares\/[0-9]+)$/.test(path)) return config.cache.detailTtl;
  if (/^\/(movies\/[^/]+\/comments|suggest|shares|requests|activities|user\/)/.test(path)) return config.cache.communityTtl;
  if (/^\/(movies|search|collections)/.test(path)) return config.cache.listTtl;
  return config.cache.defaultTtl;
}

export function tagsForPath(path: string): string[] {
  const tags = ['ddys'];
  if (/^\/latest/.test(path)) tags.push('ddys:latest');
  if (/^\/hot/.test(path)) tags.push('ddys:hot');
  if (/^\/movies$/.test(path)) tags.push('ddys:movies');
  if (/^\/movies\/([^/]+)/.test(path)) tags.push(`ddys:movie:${path.split('/')[2]}`);
  if (/^\/(types|genres|regions|calendar)$/.test(path)) tags.push('ddys:dictionary');
  if (/^\/(shares|requests|activities|user\/|movies\/[^/]+\/comments)/.test(path)) tags.push('ddys:community');
  return tags;
}

export function nextFetchOptions(path: string, config: DdysConfig) {
  return {
    next: {
      revalidate: ttlForPath(path, config),
      tags: tagsForPath(path)
    }
  };
}

export function revalidateDdys(input: DdysRevalidateInput) {
  if (input.tag) revalidateTag(input.tag, input.tagProfile ?? 'max');
  if (input.path) revalidatePath(input.path, input.pathType ?? 'page');
}
