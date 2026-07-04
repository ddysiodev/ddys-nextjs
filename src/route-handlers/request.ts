import type { DdysConfigInput } from '../client/config';
import { getDdysConfigFromEnv } from '../server/config';
import { submitDdysRequest } from '../server/request-service';
import { formDataToObject } from '../utils/security';

export interface DdysRequestRouteOptions {
  config?: DdysConfigInput;
  identity?: (request: Request) => string;
}

export function createDdysRequestRouteHandler(options: DdysRequestRouteOptions = {}) {
  return async function POST(request: Request) {
    const config = getDdysConfigFromEnv(options.config);
    const formData = await request.formData();
    const input = formDataToObject(formData);
    const identity = options.identity?.(request) ?? identityFromRequest(request);
    try {
      const payload = await submitDdysRequest(input, config, {
        identity,
        token: input.ddys_token
      });
      return Response.json({ success: true, data: payload });
    } catch (error) {
      return Response.json({
        success: false,
        message: error instanceof Error ? error.message : 'DDYS request submission failed.'
      }, { status: statusFor(error) });
    }
  };
}

export const ddysRequestPOST = createDdysRequestRouteHandler();

function identityFromRequest(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const realIp = request.headers.get('x-real-ip');
  return forwarded || realIp || 'anonymous';
}

function statusFor(error: unknown): number {
  if (!(error instanceof Error)) return 500;
  if (/disabled/i.test(error.message)) return 403;
  if (/token|submission|invalid/i.test(error.message)) return 400;
  if (/too many/i.test(error.message)) return 429;
  return 500;
}
