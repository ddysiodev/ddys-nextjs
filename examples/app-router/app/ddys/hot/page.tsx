import { DdysView } from 'ddys-nextjs/components';

export default function Page() {
  return <DdysView view="hot" params={{ limit: 12 }} />;
}
