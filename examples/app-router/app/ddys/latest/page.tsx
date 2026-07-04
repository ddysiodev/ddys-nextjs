import { DdysView } from 'ddys-nextjs/components';

export default function Page() {
  return <DdysView view="latest" params={{ limit: 12 }} />;
}
