import 'server-only';

import type { Metadata, MetadataRoute } from 'next';
import type { DdysConfig, DdysConfigInput } from '../client/config';
import type { DdysItem } from '../types/ddys';
import { createDdysServerClient } from '../server/client';
import { nextFetchOptions } from '../server/cache';
import { getDdysConfigFromEnv } from '../server/config';
import { itemPoster, itemSummary, itemTitle, itemUrl } from '../components/utils';

type SitemapEntry = MetadataRoute.Sitemap[number];
type SitemapChangeFrequency = NonNullable<SitemapEntry['changeFrequency']>;

export interface DdysMetadataOptions {
  config?: DdysConfigInput;
  title?: string;
  description?: string;
  path?: string;
  siteName?: string;
  titleTemplate?: string;
  images?: string[];
  robots?: Metadata['robots'];
}

export interface DdysMovieMetadataOptions extends DdysMetadataOptions {
  fallbackTitle?: string;
  fallbackDescription?: string;
  fallbackImage?: string;
  throwOnError?: boolean;
}

export interface DdysSitemapOptions {
  config?: DdysConfigInput;
  basePath?: string;
  staticPaths?: string[];
  includeLatest?: boolean;
  latestLimit?: number;
  changeFrequency?: SitemapChangeFrequency;
  priority?: number;
  moviePriority?: number;
  throwOnError?: boolean;
}

export interface DdysRobotsOptions {
  config?: DdysConfigInput;
  userAgent?: string | string[];
  allow?: string | string[];
  disallow?: string | string[];
  sitemap?: string | string[];
  host?: string;
}

export interface DdysManifestOptions {
  config?: DdysConfigInput;
  name?: string;
  shortName?: string;
  description?: string;
  startUrl?: string;
  scope?: string;
  display?: MetadataRoute.Manifest['display'];
  themeColor?: string;
  backgroundColor?: string;
  iconBasePath?: string;
  icons?: MetadataRoute.Manifest['icons'];
}

export function createDdysMetadata(options: DdysMetadataOptions = {}): Metadata {
  return metadataFromConfig(getDdysConfigFromEnv(options.config), options);
}

export async function createDdysMovieMetadata(slug: string, options: DdysMovieMetadataOptions = {}): Promise<Metadata> {
  const client = createDdysServerClient(options.config);
  const encodedSlug = encodeURIComponent(String(slug));
  const path = options.path ?? `/ddys/movie/${encodedSlug}`;
  try {
    const movie = await client.movie(slug, nextFetchOptions(`/movies/${encodedSlug}`, client.config)) as DdysItem;
    const title = itemTitle(movie);
    const description = itemSummary(movie) || options.description || `${title} - DDYS`;
    const poster = itemPoster(movie) || options.fallbackImage;
    const url = options.path || itemUrl(movie, client.config.siteBaseUrl) || path;
    return metadataFromConfig(client.config, {
      ...options,
      title,
      description,
      path: url,
      images: poster ? [poster, ...(options.images ?? [])] : options.images
    });
  } catch (error) {
    if (options.throwOnError) throw error;
    return metadataFromConfig(client.config, {
      ...options,
      title: options.fallbackTitle ?? options.title ?? 'DDYS Movie',
      description: options.fallbackDescription ?? options.description ?? 'DDYS movie details.',
      path,
      images: options.fallbackImage ? [options.fallbackImage, ...(options.images ?? [])] : options.images
    });
  }
}

export async function createDdysSitemap(options: DdysSitemapOptions = {}): Promise<MetadataRoute.Sitemap> {
  const client = createDdysServerClient(options.config);
  const config = client.config;
  const basePath = normalizePath(options.basePath ?? '/ddys');
  const now = new Date();
  const staticPaths = options.staticPaths ?? [
    basePath,
    joinPath(basePath, 'latest'),
    joinPath(basePath, 'hot'),
    joinPath(basePath, 'movies'),
    joinPath(basePath, 'search'),
    joinPath(basePath, 'calendar'),
    joinPath(basePath, 'collections'),
    joinPath(basePath, 'shares'),
    joinPath(basePath, 'request')
  ];
  const entries: MetadataRoute.Sitemap = staticPaths.flatMap((path) => sitemapEntry(config.siteBaseUrl, path, now, options.changeFrequency ?? 'hourly', options.priority ?? 0.7));

  if (options.includeLatest !== false) {
    try {
      const latest = await client.latest({ limit: options.latestLimit ?? 24 }, nextFetchOptions('/latest', config));
      for (const item of asItems(latest)) {
        if (!item.slug) continue;
        entries.push(...sitemapEntry(config.siteBaseUrl, joinPath(basePath, `movie/${encodeURIComponent(item.slug)}`), now, 'daily', options.moviePriority ?? 0.8));
      }
    } catch (error) {
      if (options.throwOnError) throw error;
    }
  }

  return dedupeSitemap(entries);
}

export function createDdysRobots(options: DdysRobotsOptions = {}): MetadataRoute.Robots {
  const config = getDdysConfigFromEnv(options.config);
  return {
    rules: {
      userAgent: options.userAgent ?? '*',
      allow: options.allow ?? '/',
      disallow: options.disallow ?? ['/api/ddys/diagnostics', '/api/ddys/revalidate']
    },
    sitemap: options.sitemap ?? absoluteUrl(config.siteBaseUrl, '/sitemap.xml'),
    host: options.host ?? config.siteBaseUrl
  };
}

export function createDdysManifest(options: DdysManifestOptions = {}): MetadataRoute.Manifest {
  const config = getDdysConfigFromEnv(options.config);
  const iconBasePath = normalizePath(options.iconBasePath ?? '/images');
  return {
    name: options.name ?? 'DDYS',
    short_name: options.shortName ?? 'DDYS',
    description: options.description ?? 'DDYS API powered movie and video experience.',
    start_url: options.startUrl ?? '/ddys',
    scope: options.scope ?? '/',
    display: options.display ?? 'standalone',
    background_color: options.backgroundColor ?? '#0f172a',
    theme_color: options.themeColor ?? '#0f172a',
    icons: options.icons ?? [
      { src: joinPath(iconBasePath, 'icon-192.png'), sizes: '192x192', type: 'image/png' },
      { src: joinPath(iconBasePath, 'icon-512.png'), sizes: '512x512', type: 'image/png' }
    ]
  };
}

export function createDdysMovieJsonLd(movie: DdysItem, configInput: DdysConfigInput = {}) {
  const config = getDdysConfigFromEnv(configInput);
  const image = itemPoster(movie);
  const url = itemUrl(movie, config.siteBaseUrl);
  return stripEmpty({
    '@context': 'https://schema.org',
    '@type': 'Movie',
    name: itemTitle(movie),
    description: itemSummary(movie),
    image,
    url,
    datePublished: movie.year ? String(movie.year) : undefined,
    genre: Array.isArray(movie.genre) ? movie.genre.join(', ') : movie.genre,
    countryOfOrigin: Array.isArray(movie.region) ? movie.region.join(', ') : movie.region,
    aggregateRating: movie.rating ? {
      '@type': 'AggregateRating',
      ratingValue: String(movie.rating),
      bestRating: '10'
    } : undefined
  });
}

function metadataFromConfig(config: DdysConfig, options: DdysMetadataOptions): Metadata {
  const siteName = options.siteName ?? 'DDYS';
  const title = options.title ?? siteName;
  const description = options.description ?? 'DDYS API powered movie and video experience.';
  const canonical = absoluteUrl(config.siteBaseUrl, options.path ?? '/ddys');
  const images = normalizeImages(config.siteBaseUrl, options.images);
  return {
    metadataBase: new URL(config.siteBaseUrl),
    title: {
      default: title,
      template: options.titleTemplate ?? `%s | ${siteName}`
    },
    applicationName: siteName,
    description,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      title,
      description,
      url: canonical,
      siteName,
      type: 'website',
      images
    },
    twitter: {
      card: images.length ? 'summary_large_image' : 'summary',
      title,
      description,
      images
    },
    robots: options.robots ?? {
      index: true,
      follow: true
    }
  };
}

function normalizeImages(baseUrl: string, images: string[] = []) {
  return images.flatMap((image) => {
    const url = absoluteUrl(baseUrl, image);
    return url ? [url] : [];
  });
}

function sitemapEntry(baseUrl: string, path: string, lastModified: Date, changeFrequency: SitemapChangeFrequency, priority: number): MetadataRoute.Sitemap {
  const url = absoluteUrl(baseUrl, path);
  return url ? [{ url, lastModified, changeFrequency, priority }] : [];
}

function dedupeSitemap(entries: MetadataRoute.Sitemap): MetadataRoute.Sitemap {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
}

function asItems(payload: unknown): DdysItem[] {
  if (Array.isArray(payload)) return payload as DdysItem[];
  if (payload && typeof payload === 'object' && Array.isArray((payload as { data?: unknown }).data)) return (payload as { data: DdysItem[] }).data;
  return [];
}

function absoluteUrl(baseUrl: string, value: string): string | undefined {
  const text = String(value || '').trim();
  if (!text) return undefined;
  try {
    return new URL(text, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`).toString();
  } catch {
    return undefined;
  }
}

function normalizePath(path: string): string {
  const clean = String(path || '/').trim();
  return clean.startsWith('/') ? clean.replace(/\/+$/, '') || '/' : `/${clean.replace(/\/+$/, '')}`;
}

function joinPath(basePath: string, segment: string): string {
  const base = normalizePath(basePath);
  const cleanSegment = String(segment || '').replace(/^\/+/, '').replace(/\/+$/, '');
  return cleanSegment ? `${base === '/' ? '' : base}/${cleanSegment}` : base;
}

function stripEmpty(input: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined && value !== null && value !== ''));
}
