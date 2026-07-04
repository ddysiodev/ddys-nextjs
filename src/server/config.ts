import 'server-only';

import { DEFAULT_DDYS_CONFIG, mergeDdysConfig, type DdysConfig, type DdysConfigInput } from '../client/config';
import { boolValue, intRange, normalizeBaseUrl } from '../utils/security';

export function getDdysConfigFromEnv(input: DdysConfigInput = {}): DdysConfig {
  const env = process.env;
  const envConfig: DdysConfigInput = {
    apiBaseUrl: normalizeBaseUrl(env.DDYS_API_BASE_URL, DEFAULT_DDYS_CONFIG.apiBaseUrl),
    siteBaseUrl: normalizeBaseUrl(env.DDYS_SITE_BASE_URL, DEFAULT_DDYS_CONFIG.siteBaseUrl),
    apiKey: env.DDYS_API_KEY ?? '',
    timeout: intRange(env.DDYS_TIMEOUT, DEFAULT_DDYS_CONFIG.timeout, 1, 60),
    retryTimes: intRange(env.DDYS_RETRY_TIMES, DEFAULT_DDYS_CONFIG.retryTimes, 0, 5),
    retrySleep: intRange(env.DDYS_RETRY_SLEEP, DEFAULT_DDYS_CONFIG.retrySleep, 0, 3000),
    requestForm: {
      enabled: boolValue(env.DDYS_REQUEST_FORM_ENABLED),
      secret: env.DDYS_FORM_SECRET,
      csrf: env.DDYS_REQUEST_FORM_CSRF === undefined ? true : boolValue(env.DDYS_REQUEST_FORM_CSRF)
    },
    diagnostics: {
      enabled: boolValue(env.DDYS_DIAGNOSTICS_ENABLED)
    }
  };

  return mergeDdysConfig({
    ...envConfig,
    ...input,
    cache: { ...envConfig.cache, ...input.cache },
    proxy: { ...envConfig.proxy, ...input.proxy },
    requestForm: { ...envConfig.requestForm, ...input.requestForm },
    diagnostics: { ...envConfig.diagnostics, ...input.diagnostics },
    security: { ...envConfig.security, ...input.security }
  });
}

export function requireDdysApiKey(config: DdysConfig): void {
  if (!config.apiKey) throw new Error('DDYS_API_KEY is required for this server action.');
}

export function safeDdysConfig(config: DdysConfig) {
  return {
    ...config,
    apiKey: config.apiKey ? 'configured' : 'not configured',
    requestForm: {
      ...config.requestForm,
      secret: config.requestForm.secret ? 'configured' : 'not configured'
    }
  };
}
