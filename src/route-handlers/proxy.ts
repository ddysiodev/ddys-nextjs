import { DdysError } from '../client/error';
import type { DdysConfigInput } from '../client/config';
import type { DdysRouteHandlerContext } from '../types/ddys';
import { createDdysServerClient } from '../server/client';

export interface DdysProxyRouteOptions {
  config?: DdysConfigInput;
}

export function createDdysProxyRouteHandler(options: DdysProxyRouteOptions = {}) {
  return async function GET(request: Request, context: DdysRouteHandlerContext = {}) {
    const params = await context.params;
    const route = params?.route ?? new URL(request.url).searchParams.get('route') ?? '';
    const query = Object.fromEntries(new URL(request.url).searchParams.entries());
    try {
      const client = createDdysServerClient(options.config);
      if (!client.config.proxy.enabled) return json({ success: false, message: 'DDYS proxy is disabled.' }, 404);
      const payload = await client.proxy(route, query);
      return json(payload);
    } catch (error) {
      return errorJson(error);
    }
  };
}

export const ddysProxyGET = createDdysProxyRouteHandler();

function json(payload: unknown, status = 200) {
  return Response.json(payload, {
    status,
    headers: {
      'Cache-Control': 'private, no-store'
    }
  });
}

function errorJson(error: unknown) {
  if (error instanceof DdysError) {
    return json({ success: false, message: error.message, status: error.status }, error.status >= 400 ? error.status : 500);
  }
  return json({ success: false, message: error instanceof Error ? error.message : 'DDYS proxy failed.' }, 500);
}
