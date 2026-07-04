import { createDdysManifest } from 'ddys-nextjs/metadata';

export default function manifest() {
  return createDdysManifest({
    name: 'DDYS',
    shortName: 'DDYS',
    startUrl: '/ddys'
  });
}
