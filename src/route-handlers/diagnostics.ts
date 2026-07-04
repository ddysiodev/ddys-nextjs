import { DDYS_VERSION, type DdysConfigInput } from '../client/config';
import { DdysError } from '../client/error';
import { createDdysServerClient } from '../server/client';
import { getDdysConfigFromEnv, safeDdysConfig } from '../server/config';

export interface DdysDiagnosticsRouteOptions {
  config?: DdysConfigInput;
}

export function createDdysDiagnosticsRouteHandler(options: DdysDiagnosticsRouteOptions = {}) {
  return async function GET() {
    const config = getDdysConfigFromEnv(options.config);
    if (!config.diagnostics.enabled) {
      return Response.json({ success: false, message: 'DDYS diagnostics is disabled.' }, { status: 403 });
    }
    return Response.json({
      success: true,
      data: {
        version: DDYS_VERSION,
        runtime: typeof EdgeRuntime === 'string' ? 'edge' : 'node',
        next: 'app-router',
        config: safeDdysConfig(config),
        views: [
          'movies', 'latest', 'hot', 'search', 'suggest', 'calendar',
          'movie', 'sources', 'related', 'comments',
          'collections', 'collection', 'shares', 'share',
          'requests', 'activities', 'user', 'types', 'genres', 'regions'
        ],
        routeHandlers: [
          '/api/ddys/[route]',
          '/api/ddys/request',
          '/api/ddys/diagnostics',
          '/api/ddys/revalidate'
        ]
      }
    });
  };
}

export function createDdysDiagnosticsTestRouteHandler(options: DdysDiagnosticsRouteOptions = {}) {
  return async function POST() {
    const config = getDdysConfigFromEnv(options.config);
    if (!config.diagnostics.enabled) {
      return Response.json({ success: false, message: 'DDYS diagnostics is disabled.' }, { status: 403 });
    }
    try {
      const payload = await createDdysServerClient(options.config).get('/latest', { limit: 1 }, { noCache: true });
      return Response.json({ success: true, data: payload });
    } catch (error) {
      return Response.json({
        success: false,
        message: error instanceof DdysError ? error.message : 'DDYS diagnostics test failed.'
      }, { status: 500 });
    }
  };
}

declare const EdgeRuntime: string | undefined;

export const ddysDiagnosticsGET = createDdysDiagnosticsRouteHandler();
export const ddysDiagnosticsTestPOST = createDdysDiagnosticsTestRouteHandler();
