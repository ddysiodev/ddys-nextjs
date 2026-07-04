import { createDdysSitemap } from 'ddys-nextjs/metadata';

export default function sitemap() {
  return createDdysSitemap({
    basePath: '/ddys'
  });
}
