import 'ddys-nextjs/styles.css';
import type { ReactNode } from 'react';

export default function DdysLayout({ children }: { children: ReactNode }) {
  return <main style={{ margin: '0 auto', maxWidth: 1180, padding: '24px 18px' }}>{children}</main>;
}
