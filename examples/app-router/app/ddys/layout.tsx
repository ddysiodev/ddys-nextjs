import 'ddys-nextjs/styles.css';
import { createDdysMetadata } from 'ddys-nextjs/metadata';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = createDdysMetadata({
  title: 'DDYS',
  path: '/ddys'
});

export default function DdysLayout({ children }: { children: ReactNode }) {
  return <main style={{ margin: '0 auto', maxWidth: 1180, padding: '24px 18px' }}>{children}</main>;
}
