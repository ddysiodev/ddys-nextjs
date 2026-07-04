# DDYS API Next.js 集成包

[English](README.md)

`ddys-nextjs` 是低端影视 API 的官方 Next.js App Router 集成包，提供 TypeScript API Client、Server Components、Client Components、Route Handler 工厂、Server Actions、Metadata 辅助、缓存辅助、诊断接口、安全求片表单和可直接复制的 App Router 示例。

## 安装

```bash
npm install ddys-nextjs
```

如果以源码包方式使用，请在 Next.js 配置中加入 `transpilePackages`：

```js
// next.config.mjs
const nextConfig = {
  transpilePackages: ['ddys-nextjs'],
  experimental: {
    cacheComponents: true
  }
};

export default nextConfig;
```

全局引入样式：

```tsx
import 'ddys-nextjs/styles.css';
```

## 环境变量

```env
DDYS_API_BASE_URL=https://ddys.io/api/v1
DDYS_SITE_BASE_URL=https://ddys.io
DDYS_API_KEY=
DDYS_FORM_SECRET=
DDYS_REQUEST_FORM_ENABLED=false
DDYS_DIAGNOSTICS_ENABLED=false
DDYS_REVALIDATE_TOKEN=
```

`DDYS_API_KEY`、`DDYS_FORM_SECRET`、`DDYS_REVALIDATE_TOKEN` 必须只在服务端使用，不要加 `NEXT_PUBLIC_` 前缀。

## 服务端 Client

```tsx
import { createDdysServerClient } from 'ddys-nextjs/server';

export default async function Page() {
  const client = createDdysServerClient();
  const latest = await client.latest({ limit: 12 });
  return <pre>{JSON.stringify(latest, null, 2)}</pre>;
}
```

Client 覆盖：

`movies`、`latest`、`hot`、`search`、`suggest`、`calendar`、`movie`、`sources`、`related`、`comments`、`collections`、`collection`、`shares`、`share`、`requests`、`activities`、`user`、`types`、`genres`、`regions`、`me`、`createRequest`、`createComment`、`deleteComment`、`reportInvalidResource`、`follow`、`unfollow`。

## 组件

```tsx
import { DdysView } from 'ddys-nextjs/components';
import { DdysSearch, DdysRequestForm } from 'ddys-nextjs/components/client';
import { createRequestFormToken, getDdysConfigFromEnv } from 'ddys-nextjs/server';

export default async function Page() {
  const config = getDdysConfigFromEnv();
  const token = await createRequestFormToken(config, 'anonymous');
  return (
    <>
      <DdysView view="latest" params={{ limit: 12 }} />
      <DdysSearch />
      <DdysRequestForm token={token} />
    </>
  );
}
```

组件包括：

- `DdysView`
- `DdysGrid`
- `DdysCard`
- `DdysMovieDetail`
- `DdysSources`
- `DdysSearch`
- `DdysRequestForm`
- `DdysDiagnostics`

Client Component 文件应从 `ddys-nextjs/components/client` 导入交互组件，避免 server-only 辅助逻辑进入浏览器 bundle。

## Metadata 与 SEO

`ddys-nextjs/metadata` 是服务端专用入口，覆盖 App Router 的 metadata 约定：

```tsx
import { createDdysMetadata, createDdysMovieMetadata } from 'ddys-nextjs/metadata';
import type { Metadata } from 'next';

export const metadata: Metadata = createDdysMetadata({
  title: 'DDYS',
  path: '/ddys'
});

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return createDdysMovieMetadata(slug, {
    path: `/ddys/movie/${slug}`
  });
}
```

辅助函数包括 `createDdysMetadata`、`createDdysMovieMetadata`、`createDdysSitemap`、`createDdysRobots`、`createDdysManifest`、`createDdysMovieJsonLd`。

## App Router 页面

`examples/app-router` 目录提供可复制路由：

- `/ddys/latest`
- `/ddys/hot`
- `/ddys/movies`
- `/ddys/search`
- `/ddys/calendar`
- `/ddys/movie/[slug]`
- `/ddys/movie/[slug]/sources`
- `/ddys/collections`
- `/ddys/shares`
- `/ddys/types`
- `/ddys/genres`
- `/ddys/regions`
- `/ddys/request`
- `/ddys/diagnostics`
- `/sitemap.xml`
- `/robots.txt`
- `/manifest.webmanifest`

## Route Handlers

```ts
// app/api/ddys/[route]/route.ts
export { ddysProxyGET as GET } from 'ddys-nextjs/route-handlers';

// app/api/ddys/request/route.ts
export { ddysRequestPOST as POST } from 'ddys-nextjs/route-handlers';

// app/api/ddys/diagnostics/route.ts
export { ddysDiagnosticsGET as GET, ddysDiagnosticsTestPOST as POST } from 'ddys-nextjs/route-handlers';

// app/api/ddys/revalidate/route.ts
export { ddysRevalidatePOST as POST } from 'ddys-nextjs/route-handlers';
```

代理入口使用 allow-list，并在拼接 DDYS API 路径前校验 route 参数。

## 求片表单

只有配置 API Key 后才建议开启：

```env
DDYS_API_KEY=...
DDYS_FORM_SECRET=...
DDYS_REQUEST_FORM_ENABLED=true
```

求片服务会在调用低端影视认证 API 前校验标题、年份、类型、豆瓣 ID、IMDb ID、蜜罐字段、表单 token 和单身份提交频率。表单 token 在服务端生成后传给 `DdysRequestForm`。

## 缓存与刷新

服务端辅助会把 DDYS 路径映射到 TTL 和 tag：

- `ddys:latest`
- `ddys:hot`
- `ddys:movies`
- `ddys:movie:{slug}`
- `ddys:dictionary`
- `ddys:community`

使用 `revalidateDdysAction()` 或 `/api/ddys/revalidate`，配合 `DDYS_REVALIDATE_TOKEN` 按 tag 或 path 刷新缓存。

## 诊断

设置 `DDYS_DIAGNOSTICS_ENABLED=true` 后访问 `/api/ddys/diagnostics`。它会返回脱敏配置、支持的视图、Route Handlers、版本、运行时和 App Router 状态，不暴露密钥。

## 开发检查

```bash
node tools/check.mjs
node --test tests/structure.test.mjs
powershell -ExecutionPolicy Bypass -File tools/build-package.ps1 -Version 0.1.0
```

发布 ZIP 会生成到 `dist/ddys-nextjs-v0.1.0.zip`。
