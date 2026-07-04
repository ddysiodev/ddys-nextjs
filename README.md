# DDYS API Next.js Integration

[中文](README.zh-CN.md)

`ddys-nextjs` is the official Next.js App Router integration for the DDYS API. It provides a TypeScript API client, Server Components, Client Components, Route Handler factories, Server Actions, cache helpers, diagnostics, secure request-form handling, and App Router examples.

## Installation

```bash
npm install ddys-nextjs
```

For source-package consumption, add `transpilePackages`:

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

Import the stylesheet once:

```tsx
import 'ddys-nextjs/styles.css';
```

## Environment

```env
DDYS_API_BASE_URL=https://ddys.io/api/v1
DDYS_SITE_BASE_URL=https://ddys.io
DDYS_API_KEY=
DDYS_FORM_SECRET=
DDYS_REQUEST_FORM_ENABLED=false
DDYS_DIAGNOSTICS_ENABLED=false
DDYS_REVALIDATE_TOKEN=
```

`DDYS_API_KEY`, `DDYS_FORM_SECRET`, and `DDYS_REVALIDATE_TOKEN` are server-only. Do not prefix them with `NEXT_PUBLIC_`.

## Server Client

```tsx
import { createDdysServerClient } from 'ddys-nextjs/server';

export default async function Page() {
  const client = createDdysServerClient();
  const latest = await client.latest({ limit: 12 });
  return <pre>{JSON.stringify(latest, null, 2)}</pre>;
}
```

The client supports:

`movies`, `latest`, `hot`, `search`, `suggest`, `calendar`, `movie`, `sources`, `related`, `comments`, `collections`, `collection`, `shares`, `share`, `requests`, `activities`, `user`, `types`, `genres`, `regions`, `me`, `createRequest`, `createComment`, `deleteComment`, `reportInvalidResource`, `follow`, and `unfollow`.

## Components

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

Available components:

- `DdysView`
- `DdysGrid`
- `DdysCard`
- `DdysMovieDetail`
- `DdysSources`
- `DdysSearch`
- `DdysRequestForm`
- `DdysDiagnostics`

## App Router Pages

The `examples/app-router` folder includes ready-to-copy routes:

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

The proxy uses an allow-list and validates route parameters before building DDYS API paths.

## Request Form

Enable it only with an API key:

```env
DDYS_API_KEY=...
DDYS_FORM_SECRET=...
DDYS_REQUEST_FORM_ENABLED=true
```

The request service validates title, year, type, Douban ID, IMDb ID, honeypot, form token, and per-identity rate limit before using the authenticated DDYS API. The form token is created server-side and should be rendered into `DdysRequestForm`.

Client Component files should import interactive widgets from `ddys-nextjs/components/client` so that server-only helpers never enter a browser bundle.

## Cache And Revalidation

The server helper maps DDYS paths to TTL and tags:

- `ddys:latest`
- `ddys:hot`
- `ddys:movies`
- `ddys:movie:{slug}`
- `ddys:dictionary`
- `ddys:community`

Use `revalidateDdysAction()` or `/api/ddys/revalidate` with `DDYS_REVALIDATE_TOKEN` to revalidate by tag or path.

## Diagnostics

Set `DDYS_DIAGNOSTICS_ENABLED=true`, then call `/api/ddys/diagnostics`. It returns safe config, supported views, route handlers, version, runtime, and App Router status without exposing secrets.

## Development Checks

```bash
node tools/check.mjs
node --test tests/structure.test.mjs
powershell -ExecutionPolicy Bypass -File tools/build-package.ps1 -Version 0.1.0
```

The release ZIP is written to `dist/ddys-nextjs-v0.1.0.zip`.
