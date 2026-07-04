import 'server-only';

import type { DdysConfig } from '../client/config';
import { DdysClient } from '../client/client';
import type { DdysRequestInput } from '../types/ddys';
import { scalar } from '../utils/security';

const globalStore = globalThis as typeof globalThis & {
  __ddysNextRateLimit?: Map<string, number>;
};

export interface DdysRequestSubmitOptions {
  identity: string;
  token?: string;
}

export async function submitDdysRequest(input: Record<string, unknown>, config: DdysConfig, options: DdysRequestSubmitOptions) {
  if (!config.requestForm.enabled) throw new Error('DDYS request form is disabled.');
  if (config.requestForm.csrf && !(await verifyRequestFormToken(options.token || '', config, options.identity))) {
    throw new Error('Invalid request token.');
  }
  const honeypot = scalar(input[config.requestForm.honeypotField]);
  if (honeypot !== '') throw new Error('Invalid submission.');
  enforceRateLimit(options.identity, config.requestForm.rateLimitSeconds);
  const payload = normalizeRequestInput(input);
  return new DdysClient(config).createRequest(payload);
}

export function normalizeRequestInput(input: Record<string, unknown>): DdysRequestInput {
  const title = scalar(input.title).slice(0, 255);
  if (!title) throw new Error('Title is required.');
  const year = scalar(input.year);
  if (year && (!/^\d{4}$/.test(year) || Number(year) < 1900 || Number(year) > 2099)) throw new Error('Invalid year.');
  const type = scalar(input.type).toLowerCase();
  if (type && !['movie', 'series', 'variety', 'anime'].includes(type)) throw new Error('Invalid type.');
  const douban = scalar(input.douban_id);
  if (douban && !/^\d{1,20}$/.test(douban)) throw new Error('Invalid Douban ID.');
  const imdb = scalar(input.imdb_id);
  if (imdb && !/^tt\d{1,20}$/i.test(imdb)) throw new Error('Invalid IMDb ID.');

  return Object.fromEntries(Object.entries({
    title,
    year: year ? Number(year) : undefined,
    type: type || undefined,
    description: scalar(input.description).slice(0, 1000) || undefined,
    douban_id: douban || undefined,
    imdb_id: imdb || undefined,
    site: 'Next.js'
  }).filter(([, value]) => value !== undefined && value !== '')) as DdysRequestInput;
}

export function enforceRateLimit(identity: string, seconds: number): void {
  globalStore.__ddysNextRateLimit ??= new Map();
  const key = `ddys:${identity}`;
  const now = Date.now();
  const last = globalStore.__ddysNextRateLimit.get(key) ?? 0;
  if (now - last < seconds * 1000) throw new Error('Too many submissions. Please try again later.');
  globalStore.__ddysNextRateLimit.set(key, now);
}

export async function createRequestFormToken(config: DdysConfig, identity = 'anonymous', now = Date.now()): Promise<string> {
  const secret = formSecret(config);
  if (!secret) return '';
  const bucket = Math.floor(now / (config.requestForm.tokenTtlSeconds * 1000));
  const signature = await hmac(secret, `ddys-request:${identity}:${bucket}`);
  return `${bucket}.${signature}`;
}

export async function verifyRequestFormToken(token: string, config: DdysConfig, identity = 'anonymous', now = Date.now()): Promise<boolean> {
  const secret = formSecret(config);
  if (!secret) return false;
  const [bucketText, signature] = token.split('.', 2);
  const bucket = Number(bucketText);
  if (!Number.isInteger(bucket) || !signature) return false;
  const current = Math.floor(now / (config.requestForm.tokenTtlSeconds * 1000));
  if (bucket < current - 1 || bucket > current) return false;
  const expected = await hmac(secret, `ddys-request:${identity}:${bucket}`);
  return timingSafeEqual(signature, expected);
}

function formSecret(config: DdysConfig): string {
  return config.requestForm.secret || config.apiKey || '';
}

async function hmac(secret: string, value: string): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Web Crypto is required to sign DDYS request form tokens.');
  }
  const key = await globalThis.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await globalThis.crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(signature)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}
