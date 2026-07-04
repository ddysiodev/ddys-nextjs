export interface DdysCacheConfig {
  defaultTtl: number;
  dictionaryTtl: number;
  freshTtl: number;
  listTtl: number;
  detailTtl: number;
  communityTtl: number;
}

export interface DdysRequestFormConfig {
  enabled: boolean;
  csrf: boolean;
  honeypotField: string;
  rateLimitSeconds: number;
  tokenTtlSeconds: number;
  secret?: string;
}

export interface DdysProxyConfig {
  enabled: boolean;
  allowRoutes: string[];
}

export interface DdysSecurityConfig {
  maxLimit: number;
  maxPerPage: number;
  maxPage: number;
  allowedResourceProtocols: string[];
}

export interface DdysConfig {
  apiBaseUrl: string;
  siteBaseUrl: string;
  apiKey?: string;
  timeout: number;
  retryTimes: number;
  retrySleep: number;
  userAgent: string;
  cache: DdysCacheConfig;
  proxy: DdysProxyConfig;
  requestForm: DdysRequestFormConfig;
  diagnostics: {
    enabled: boolean;
  };
  security: DdysSecurityConfig;
}

export const DDYS_VERSION = '0.1.0';

export const DEFAULT_DDYS_CONFIG: DdysConfig = {
  apiBaseUrl: 'https://ddys.io/api/v1',
  siteBaseUrl: 'https://ddys.io',
  apiKey: '',
  timeout: 12,
  retryTimes: 1,
  retrySleep: 150,
  userAgent: `ddys-nextjs/${DDYS_VERSION}`,
  cache: {
    defaultTtl: 300,
    dictionaryTtl: 86400,
    freshTtl: 300,
    listTtl: 600,
    detailTtl: 1800,
    communityTtl: 120
  },
  proxy: {
    enabled: true,
    allowRoutes: [
      'movies', 'latest', 'hot', 'search', 'suggest', 'calendar',
      'movie', 'sources', 'related', 'comments',
      'collections', 'collection', 'shares', 'share',
      'requests', 'activities', 'user', 'types', 'genres', 'regions'
    ]
  },
  requestForm: {
    enabled: false,
    csrf: true,
    honeypotField: 'ddys_website',
    rateLimitSeconds: 60,
    tokenTtlSeconds: 1800
  },
  diagnostics: {
    enabled: false
  },
  security: {
    maxLimit: 50,
    maxPerPage: 50,
    maxPage: 999,
    allowedResourceProtocols: ['http:', 'https:', 'magnet:', 'ed2k:', 'thunder:']
  }
};

export type DdysConfigInput = Partial<Omit<DdysConfig, 'cache' | 'proxy' | 'requestForm' | 'diagnostics' | 'security'>> & {
  cache?: Partial<DdysCacheConfig>;
  proxy?: Partial<DdysProxyConfig>;
  requestForm?: Partial<DdysRequestFormConfig>;
  diagnostics?: Partial<DdysConfig['diagnostics']>;
  security?: Partial<DdysSecurityConfig>;
};

export function mergeDdysConfig(input: DdysConfigInput = {}): DdysConfig {
  return {
    ...DEFAULT_DDYS_CONFIG,
    ...input,
    cache: { ...DEFAULT_DDYS_CONFIG.cache, ...input.cache },
    proxy: { ...DEFAULT_DDYS_CONFIG.proxy, ...input.proxy },
    requestForm: { ...DEFAULT_DDYS_CONFIG.requestForm, ...input.requestForm },
    diagnostics: { ...DEFAULT_DDYS_CONFIG.diagnostics, ...input.diagnostics },
    security: { ...DEFAULT_DDYS_CONFIG.security, ...input.security }
  };
}
