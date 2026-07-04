import { DdysRequestForm } from 'ddys-nextjs/components/client';
import { createRequestFormToken, getDdysConfigFromEnv } from 'ddys-nextjs/server';

export default async function Page() {
  const config = getDdysConfigFromEnv();
  const token = await createRequestFormToken(config, 'anonymous');
  return <DdysRequestForm token={token} honeypotField={config.requestForm.honeypotField} />;
}
