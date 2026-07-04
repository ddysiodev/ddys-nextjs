export type DdysScalar = string | number | boolean | null | undefined;

export interface DdysQuery {
  [key: string]: DdysScalar | DdysScalar[];
}

export interface DdysApiResponse<T = unknown> {
  success?: boolean;
  message?: string;
  data?: T;
  meta?: DdysPaginationMeta;
  [key: string]: unknown;
}

export interface DdysPaginationMeta {
  page?: number;
  per_page?: number;
  total?: number;
  total_pages?: number;
  [key: string]: unknown;
}

export interface DdysPaginated<T = DdysItem> {
  data: T[];
  meta: DdysPaginationMeta;
}

export interface DdysItem {
  id?: string | number;
  slug?: string;
  title?: string;
  name?: string;
  cn_name?: string;
  en_name?: string;
  username?: string;
  search_keyword?: string;
  poster?: string;
  cover?: string;
  image?: string;
  avatar?: string;
  url?: string;
  link?: string;
  href?: string;
  year?: string | number;
  type?: string;
  type_code?: string;
  genre?: string | string[];
  region?: string | string[];
  quality?: string;
  episode?: string | number;
  status?: string;
  rating?: string | number;
  description?: string;
  intro?: string;
  summary?: string;
  note?: string;
  content?: string;
  bio?: string;
  [key: string]: unknown;
}

export interface DdysResource {
  title?: string;
  name?: string;
  label?: string;
  download_type?: string;
  type?: string;
  quality?: string;
  url?: string;
  link?: string;
  href?: string;
  [key: string]: unknown;
}

export interface DdysRequestInput {
  title: string;
  year?: string | number;
  type?: 'movie' | 'series' | 'variety' | 'anime' | '';
  description?: string;
  douban_id?: string;
  imdb_id?: string;
  site?: string;
  [key: string]: unknown;
}

export interface DdysDisplayOptions {
  layout?: 'grid' | 'list' | 'compact';
  theme?: 'auto' | 'light' | 'dark';
  columns?: number;
  target?: '_blank' | '_self';
  showPoster?: boolean;
  showRating?: boolean;
  showSummary?: boolean;
  showSourceLink?: boolean;
}

export interface DdysRouteHandlerContext {
  params?: Record<string, string> | Promise<Record<string, string>>;
}
