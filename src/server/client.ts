import 'server-only';

import { DdysClient } from '../client/client';
import type { DdysConfigInput } from '../client/config';
import { getDdysConfigFromEnv } from './config';
import { nextFetchOptions } from './cache';

export function createDdysServerClient(config: DdysConfigInput = {}) {
  return new DdysClient(getDdysConfigFromEnv(config));
}

export function withDdysCache(path: string, config: DdysConfigInput = {}) {
  const merged = getDdysConfigFromEnv(config);
  return nextFetchOptions(path, merged);
}
