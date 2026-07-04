import type { DdysQuery, DdysScalar } from '../types/ddys';

export function scalar(value: unknown, fallback = ''): string {
  if (Array.isArray(value) || value === null || typeof value === 'object' || typeof value === 'function') {
    return fallback;
  }

  return String(value ?? fallback).replace(/\0/g, '').trim();
}

export function boolValue(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  return ['1', 'true', 'yes', 'on'].includes(scalar(value).toLowerCase());
}

export function intRange(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = Number.parseInt(scalar(value), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

export function choice<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  const text = scalar(value).toLowerCase();
  return allowed.includes(text as T) ? (text as T) : fallback;
}

export function normalizeBaseUrl(value: unknown, fallback: string): string {
  const text = scalar(value);
  try {
    const url = new URL(text);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
      return fallback;
    }
    return text.replace(/\/+$/, '');
  } catch {
    return fallback;
  }
}

export function cleanQuery(query: DdysQuery = {}): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(query)) {
    const raw = Array.isArray(value) ? value[0] : value;
    const text = scalar(raw as DdysScalar);
    if (text !== '') out[key] = text;
  }
  return Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)));
}

export function normalizeQueryValue(key: string, value: unknown, limits: Record<string, number> = {}): string | number {
  const text = scalar(value);
  if (text === '') return '';
  if (key === 'limit') return intRange(text, 12, 1, limits.maxLimit ?? 50);
  if (key === 'per_page') return intRange(text, 12, 1, limits.maxPerPage ?? 50);
  if (key === 'page') return intRange(text, 1, 1, limits.maxPage ?? 999);
  if (key === 'year') return /^\d{4}$/.test(text) && Number(text) >= 1900 && Number(text) <= 2099 ? Number(text) : '';
  if (key === 'month') return /^\d{1,2}$/.test(text) && Number(text) >= 1 && Number(text) <= 12 ? Number(text) : '';
  if (key === 'q') return text.slice(0, 120);
  if (['type', 'genre', 'region', 'sort'].includes(key)) return text.slice(0, 64);
  return text.slice(0, 255);
}

export function buildQuery(source: DdysQuery = {}, keys: string[], limits: Record<string, number> = {}): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const key of keys) {
    if (!(key in source)) continue;
    const value = normalizeQueryValue(key, source[key], limits);
    if (value !== '') out[key] = value;
  }
  return out;
}

export function toSearchParams(query: Record<string, string | number> = {}): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) params.set(key, String(value));
  return params.toString();
}

export function routeSegment(value: unknown, label: string): string {
  const text = scalar(value);
  if (text === '' || text.includes('/') || /[\x00-\x1F\x7F]/.test(text)) {
    throw new Error(`Invalid ${label}.`);
  }
  return encodeURIComponent(text);
}

export function positiveId(value: unknown, label: string): number {
  const text = scalar(value);
  if (!/^[1-9][0-9]*$/.test(text)) throw new Error(`Invalid ${label}.`);
  return Number(text);
}

export function safeMediaUrl(value: unknown): string {
  const text = scalar(value);
  if (!text) return '';
  try {
    const url = new URL(text);
    return ['http:', 'https:'].includes(url.protocol) ? text : '';
  } catch {
    return '';
  }
}

export function isAllowedResourceUrl(href: string, protocols: readonly string[]): boolean {
  const text = href.trim();
  return protocols.some((protocol) => {
    const lower = protocol.toLowerCase().trim();
    if (lower === 'http:' || lower === 'https:') return text.toLowerCase().startsWith(`${lower}//`);
    return text.toLowerCase().startsWith(lower);
  });
}

export function formDataToObject(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    out[key] = typeof value === 'string' ? value : value.name;
  }
  return out;
}
