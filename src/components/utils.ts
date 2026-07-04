import type { DdysItem, DdysResource } from '../types/ddys';
import { isAllowedResourceUrl, safeMediaUrl } from '../utils/security';

export function itemTitle(item: DdysItem): string {
  return String(item.title || item.name || item.cn_name || item.en_name || item.username || item.search_keyword || 'Untitled');
}

export function itemPoster(item: DdysItem): string {
  return safeMediaUrl(item.poster || item.cover || item.image || item.avatar);
}

export function itemSummary(item: DdysItem): string {
  return String(item.description || item.intro || item.summary || item.note || item.content || item.bio || '').replace(/<[^>]*>/g, '').slice(0, 160);
}

export function itemUrl(item: DdysItem, siteBaseUrl = 'https://ddys.io'): string {
  const url = String(item.url || item.link || item.href || '');
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('/')) return `${siteBaseUrl.replace(/\/+$/, '')}${url}`;
  if (item.slug) return `${siteBaseUrl.replace(/\/+$/, '')}/movie/${encodeURIComponent(item.slug)}`;
  return '';
}

export function itemMeta(item: DdysItem): string[] {
  const meta: string[] = [];
  for (const key of ['year', 'type', 'type_code', 'region', 'quality', 'episode', 'status', 'resource_type'] as const) {
    const value = item[key];
    if (Array.isArray(value)) meta.push(value.join(', '));
    else if (value !== undefined && value !== null && value !== '') meta.push(String(value));
  }
  if (item.rating) meta.push(`Rating ${item.rating}`);
  return meta;
}

export function resourceParts(resource: DdysResource, protocols: readonly string[]) {
  const title = String(resource.title || resource.name || resource.label || resource.download_type || resource.type || resource.quality || 'Resource');
  const raw = String(resource.url || resource.link || resource.href || '');
  return raw.split('#').flatMap((part, index, all) => {
    part = part.trim();
    if (!part) return [];
    let label = all.length > 1 ? `${title} ${index + 1}` : title;
    let href = part;
    if (part.includes('$')) {
      const pieces = part.split('$');
      label = pieces[0] || title;
      href = pieces.slice(1).join('$');
    }
    return isAllowedResourceUrl(href, protocols) ? [{ label, href }] : [];
  });
}
