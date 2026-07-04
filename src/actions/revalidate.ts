'use server';

import { revalidateDdys } from '../server/cache';

export async function revalidateDdysAction(input: { tag?: string; tagProfile?: string; path?: string; pathType?: 'layout' | 'page'; token?: string }) {
  const expected = process.env.DDYS_REVALIDATE_TOKEN ?? '';
  if (!expected || input.token !== expected) {
    return { success: false, message: 'Invalid revalidation token.' };
  }
  if (!input.tag && !input.path) {
    return { success: false, message: 'Missing tag or path.' };
  }
  revalidateDdys({ tag: input.tag, tagProfile: input.tagProfile, path: input.path, pathType: input.pathType });
  return { success: true };
}
