'use server';

import type { DdysConfigInput } from '../client/config';
import { getDdysConfigFromEnv } from '../server/config';
import { submitDdysRequest } from '../server/request-service';
import { formDataToObject } from '../utils/security';

export interface DdysActionState {
  success: boolean;
  message: string;
  data?: unknown;
}

export async function submitDdysRequestAction(_state: DdysActionState, formData: FormData, configInput: DdysConfigInput = {}): Promise<DdysActionState> {
  const config = getDdysConfigFromEnv(configInput);
  const input = formDataToObject(formData);
  try {
    const data = await submitDdysRequest(input, config, {
      identity: input.ddys_identity || 'anonymous',
      token: input.ddys_token
    });
    return { success: true, message: 'Request submitted.', data };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Request failed.' };
  }
}
