import { DdysError } from './error';
import { DEFAULT_DDYS_CONFIG, type DdysConfig, type DdysConfigInput, mergeDdysConfig } from './config';
import type { DdysApiResponse, DdysPaginated, DdysQuery, DdysRequestInput } from '../types/ddys';
import { buildQuery, cleanQuery, normalizeBaseUrl, positiveId, routeSegment, toSearchParams } from '../utils/security';

export interface DdysRequestOptions {
  auth?: boolean;
  noCache?: boolean;
  cacheTtl?: number;
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
  cache?: RequestCache;
  signal?: AbortSignal;
}

export type DdysFetch = (input: string | URL | Request, init?: RequestInit & { next?: DdysRequestOptions['next'] }) => Promise<Response>;

export class DdysClient {
  readonly config: DdysConfig;
  private readonly fetcher: DdysFetch;

  constructor(config: DdysConfigInput = {}, fetcher: DdysFetch = fetch) {
    const merged = mergeDdysConfig(config);
    this.config = {
      ...merged,
      apiBaseUrl: normalizeBaseUrl(merged.apiBaseUrl, DEFAULT_DDYS_CONFIG.apiBaseUrl),
      siteBaseUrl: normalizeBaseUrl(merged.siteBaseUrl, DEFAULT_DDYS_CONFIG.siteBaseUrl)
    };
    this.fetcher = fetcher;
  }

  async request<T = unknown>(method: string, path: string, query: DdysQuery = {}, body?: unknown, options: DdysRequestOptions = {}): Promise<DdysApiResponse<T>> {
    method = method.toUpperCase();
    path = `/${path.replace(/^\/+/, '')}`;
    const clean = cleanQuery(query);
    const auth = Boolean(options.auth);
    if (auth && !this.config.apiKey) {
      throw new DdysError('DDYS API Key is not configured.', 401, method, path);
    }

    return this.sendWithRetry<T>(method, path, clean, body, auth, options);
  }

  async get<T = unknown>(path: string, query: DdysQuery = {}, options: DdysRequestOptions = {}): Promise<DdysApiResponse<T>> {
    return this.request<T>('GET', path, query, undefined, options);
  }

  async post<T = unknown>(path: string, body: unknown = {}, options: DdysRequestOptions = {}): Promise<DdysApiResponse<T>> {
    return this.request<T>('POST', path, {}, body, options);
  }

  async delete<T = unknown>(path: string, options: DdysRequestOptions = {}): Promise<DdysApiResponse<T>> {
    return this.request<T>('DELETE', path, {}, undefined, options);
  }

  async data<T = unknown>(path: string, query: DdysQuery = {}, options: DdysRequestOptions = {}): Promise<T> {
    const payload = await this.get<T>(path, query, options);
    return (payload.data ?? payload) as T;
  }

  async paginated<T = unknown>(path: string, query: DdysQuery = {}, options: DdysRequestOptions = {}): Promise<DdysPaginated<T>> {
    const payload = await this.get<T[]>(path, query, options);
    return {
      data: Array.isArray(payload.data) ? payload.data : [],
      meta: payload.meta ?? {}
    };
  }

  movies(params: DdysQuery = {}, options?: DdysRequestOptions) { return this.paginated('/movies', this.query(params, ['type', 'genre', 'region', 'year', 'sort', 'page', 'per_page']), options); }
  latest(params: DdysQuery = {}, options?: DdysRequestOptions) { return this.data('/latest', this.query(params, ['type', 'genre', 'region', 'year', 'limit']), options); }
  hot(params: DdysQuery = {}, options?: DdysRequestOptions) { return this.data('/hot', this.query(params, ['type', 'genre', 'region', 'limit']), options); }
  search(params: DdysQuery = {}, options?: DdysRequestOptions) { return this.paginated('/search', this.query(params, ['q', 'type', 'page', 'per_page']), options); }
  suggest(q: string, params: DdysQuery = {}, options?: DdysRequestOptions) { return this.data('/suggest', this.query({ ...params, q }, ['q', 'limit']), options); }
  calendar(params: DdysQuery = {}, options?: DdysRequestOptions) { return this.data('/calendar', this.query(params, ['year', 'month']), options); }
  movie(slug: string, options?: DdysRequestOptions) { return this.data(`/movies/${routeSegment(slug, 'movie slug')}`, {}, options); }
  sources(slug: string, options?: DdysRequestOptions) { return this.data(`/movies/${routeSegment(slug, 'movie slug')}/sources`, {}, options); }
  related(slug: string, options?: DdysRequestOptions) { return this.data(`/movies/${routeSegment(slug, 'movie slug')}/related`, {}, options); }
  comments(slug: string, params: DdysQuery = {}, options?: DdysRequestOptions) { return this.paginated(`/movies/${routeSegment(slug, 'movie slug')}/comments`, this.query(params, ['page', 'per_page']), options); }
  collections(params: DdysQuery = {}, options?: DdysRequestOptions) { return this.paginated('/collections', this.query(params, ['page', 'per_page']), options); }
  collection(slug: string, params: DdysQuery = {}, options?: DdysRequestOptions) { return this.data(`/collections/${routeSegment(slug, 'collection slug')}`, this.query(params, ['page', 'per_page']), options); }
  shares(params: DdysQuery = {}, options?: DdysRequestOptions) { return this.paginated('/shares', this.query(params, ['page', 'per_page']), options); }
  share(id: string | number, options?: DdysRequestOptions) { return this.data(`/shares/${positiveId(id, 'share ID')}`, {}, options); }
  requests(params: DdysQuery = {}, options?: DdysRequestOptions) { return this.paginated('/requests', this.query(params, ['page', 'per_page']), options); }
  activities(params: DdysQuery = {}, options?: DdysRequestOptions) { return this.paginated('/activities', this.query(params, ['type', 'page', 'per_page']), options); }
  user(username: string, options?: DdysRequestOptions) { return this.data(`/user/${routeSegment(username, 'username')}`, {}, options); }
  types(options?: DdysRequestOptions) { return this.data('/types', {}, options); }
  genres(options?: DdysRequestOptions) { return this.data('/genres', {}, options); }
  regions(options?: DdysRequestOptions) { return this.data('/regions', {}, options); }
  me(options?: DdysRequestOptions) { return this.unwrap(this.get('/me', {}, { ...options, auth: true, noCache: true })); }
  createRequest(input: DdysRequestInput, options?: DdysRequestOptions) { return this.unwrap(this.post('/requests', input, { ...options, auth: true, noCache: true })); }
  createComment(input: Record<string, unknown>, options?: DdysRequestOptions) { return this.unwrap(this.post('/comments', input, { ...options, auth: true, noCache: true })); }
  deleteComment(id: string | number, options?: DdysRequestOptions) { return this.unwrap(this.delete(`/comments/${positiveId(id, 'comment ID')}`, { ...options, auth: true, noCache: true })); }
  reportInvalidResource(input: Record<string, unknown>, options?: DdysRequestOptions) { return this.unwrap(this.post('/report', input, { ...options, auth: true, noCache: true })); }
  follow(username: string, options?: DdysRequestOptions) { return this.setFollow(username, 'follow', options); }
  unfollow(username: string, options?: DdysRequestOptions) { return this.setFollow(username, 'unfollow', options); }

  async setFollow(username: string, action: 'follow' | 'unfollow', options?: DdysRequestOptions) {
    return this.unwrap(this.post('/follow', { username, action }, { ...options, auth: true, noCache: true }));
  }

  async proxy(route: string, query: DdysQuery = {}, options?: DdysRequestOptions): Promise<DdysApiResponse> {
    route = String(route || 'latest').toLowerCase();
    if (!this.config.proxy.allowRoutes.includes(route)) {
      throw new DdysError('Route is not allowed.', 403, 'GET', '/proxy');
    }
    const path = this.proxyPath(route, query);
    if (!path) throw new DdysError('Invalid route parameters.', 400, 'GET', '/proxy');
    return this.get(path, this.query(query, ['type', 'genre', 'region', 'year', 'sort', 'page', 'per_page', 'limit', 'q', 'month']), options);
  }

  private async unwrap<T>(promise: Promise<DdysApiResponse<T>>): Promise<T | DdysApiResponse<T>> {
    const payload = await promise;
    return payload.data ?? payload;
  }

  private query(params: DdysQuery, keys: string[]) {
    return buildQuery(params, keys, this.config.security);
  }

  private proxyPath(route: string, query: DdysQuery): string {
    const slug = String(query.slug ?? '');
    const id = String(query.id ?? '');
    const username = String(query.username ?? '');
    switch (route) {
      case 'movies': return '/movies';
      case 'latest': return '/latest';
      case 'hot': return '/hot';
      case 'search': return '/search';
      case 'suggest': return '/suggest';
      case 'calendar': return '/calendar';
      case 'movie': return slug ? `/movies/${routeSegment(slug, 'movie slug')}` : '';
      case 'sources': return slug ? `/movies/${routeSegment(slug, 'movie slug')}/sources` : '';
      case 'related': return slug ? `/movies/${routeSegment(slug, 'movie slug')}/related` : '';
      case 'comments': return slug ? `/movies/${routeSegment(slug, 'movie slug')}/comments` : '';
      case 'collections': return '/collections';
      case 'collection': return slug ? `/collections/${routeSegment(slug, 'collection slug')}` : '';
      case 'shares': return '/shares';
      case 'share': return id ? `/shares/${positiveId(id, 'share ID')}` : '';
      case 'requests': return '/requests';
      case 'activities': return '/activities';
      case 'user': return username ? `/user/${routeSegment(username, 'username')}` : '';
      case 'types': return '/types';
      case 'genres': return '/genres';
      case 'regions': return '/regions';
      default: return '';
    }
  }

  private async sendWithRetry<T>(method: string, path: string, query: Record<string, string>, body: unknown, auth: boolean, options: DdysRequestOptions): Promise<DdysApiResponse<T>> {
    const attempts = Math.max(1, this.config.retryTimes + 1);
    let last: unknown;
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        const qs = toSearchParams(query);
        const url = `${this.config.apiBaseUrl}${path}${qs ? `?${qs}` : ''}`;
        const controller = options.signal ? undefined : new AbortController();
        const timeout = controller ? setTimeout(() => controller.abort(), this.config.timeout * 1000) : undefined;
        const headers = {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...(typeof window === 'undefined' ? { 'User-Agent': this.config.userAgent } : {}),
            ...(auth ? { Authorization: `Bearer ${this.config.apiKey}` } : {})
        };
        let response: Response;
        try {
          response = await this.fetcher(url, {
            method,
            headers,
            body: method === 'GET' || body === undefined ? undefined : JSON.stringify(body),
            cache: options.noCache ? 'no-store' : options.cache,
            next: options.noCache ? undefined : options.next,
            signal: options.signal ?? controller?.signal
          });
        } finally {
          if (timeout) clearTimeout(timeout);
        }
        const json = await response.json().catch(() => null);
        if (!json || typeof json !== 'object') throw new DdysError('DDYS API returned invalid JSON.', 502, method, path);
        if (!response.ok) throw new DdysError(`DDYS API HTTP ${response.status}.`, response.status, method, path, json);
        if ('success' in json && json.success === false) throw new DdysError(String(json.message || 'DDYS API request failed.'), 502, method, path, json);
        return json as DdysApiResponse<T>;
      } catch (error) {
        last = error;
        if (error instanceof DdysError && error.status >= 400 && error.status < 500) throw error;
        if (method !== 'GET' || attempt >= attempts) break;
        await new Promise((resolve) => setTimeout(resolve, this.config.retrySleep));
      }
    }
    if (last instanceof DdysError) throw last;
    throw new DdysError(`DDYS API request failed: ${last instanceof Error ? last.message : 'unknown error'}`, 0, method, path, last);
  }
}
