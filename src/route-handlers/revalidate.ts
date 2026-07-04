import type { DdysConfigInput } from '../client/config';
import { getDdysConfigFromEnv } from '../server/config';
import { revalidateDdys } from '../server/cache';

export interface DdysRevalidateRouteOptions {
  config?: DdysConfigInput;
  token?: string;
}

export function createDdysRevalidateRouteHandler(options: DdysRevalidateRouteOptions = {}) {
  return async function POST(request: Request) {
    const expected = options.token ?? process.env.DDYS_REVALIDATE_TOKEN ?? '';
    const given = request.headers.get('x-ddys-revalidate-token') ?? new URL(request.url).searchParams.get('token') ?? '';
    if (!expected || given !== expected) {
      return Response.json({ success: false, message: 'Invalid revalidation token.' }, { status: 403 });
    }
    getDdysConfigFromEnv(options.config);
    const body = await request.json().catch(() => ({}));
    const tag = typeof body.tag === 'string' ? body.tag : undefined;
    const tagProfile = typeof body.tagProfile === 'string' ? body.tagProfile : undefined;
    const path = typeof body.path === 'string' ? body.path : undefined;
    const pathType = body.pathType === 'layout' ? 'layout' : 'page';
    if (!tag && !path) {
      return Response.json({ success: false, message: 'Missing tag or path.' }, { status: 422 });
    }
    revalidateDdys({ tag, tagProfile, path, pathType });
    return Response.json({ success: true, data: { tag, tagProfile, path, pathType } });
  };
}

export const ddysRevalidatePOST = createDdysRevalidateRouteHandler();
