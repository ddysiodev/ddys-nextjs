import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const failures = [];

const requiredFiles = [
  'README.md',
  'README.zh-CN.md',
  'LICENSE',
  '.gitignore',
  '.env.example',
  'next.config.example.mjs',
  'package.json',
  'tsconfig.json',
  'src/index.ts',
  'src/types/ddys.ts',
  'src/utils/security.ts',
  'src/client/client.ts',
  'src/client/config.ts',
  'src/client/error.ts',
  'src/client/index.ts',
  'src/server/cache.ts',
  'src/server/client.ts',
  'src/server/config.ts',
  'src/server/request-service.ts',
  'src/server/index.ts',
  'src/actions/index.ts',
  'src/actions/request.ts',
  'src/actions/revalidate.ts',
  'src/route-handlers/index.ts',
  'src/route-handlers/proxy.ts',
  'src/route-handlers/request.ts',
  'src/route-handlers/diagnostics.ts',
  'src/route-handlers/revalidate.ts',
  'src/metadata/index.ts',
  'src/components/card.tsx',
  'src/components/diagnostics.tsx',
  'src/components/grid.tsx',
  'src/components/movie-detail.tsx',
  'src/components/request-form.tsx',
  'src/components/search.tsx',
  'src/components/sources.tsx',
  'src/components/utils.ts',
  'src/components/view.tsx',
  'src/components/client.ts',
  'src/components/index.ts',
  'src/styles/ddys.css',
  'public/images/icon-16.png',
  'public/images/icon-32.png',
  'public/images/icon-192.png',
  'public/images/icon-512.png',
  'public/images/logo.png',
  'tests/structure.test.mjs',
  'tools/build-package.ps1',
  'tools/check.mjs'
];

const exampleFiles = [
  'examples/app-router/app/ddys/layout.tsx',
  'examples/app-router/app/ddys/latest/page.tsx',
  'examples/app-router/app/ddys/hot/page.tsx',
  'examples/app-router/app/ddys/movies/page.tsx',
  'examples/app-router/app/ddys/search/page.tsx',
  'examples/app-router/app/ddys/calendar/page.tsx',
  'examples/app-router/app/ddys/movie/[slug]/page.tsx',
  'examples/app-router/app/ddys/movie/[slug]/sources/page.tsx',
  'examples/app-router/app/ddys/collections/page.tsx',
  'examples/app-router/app/ddys/shares/page.tsx',
  'examples/app-router/app/ddys/types/page.tsx',
  'examples/app-router/app/ddys/genres/page.tsx',
  'examples/app-router/app/ddys/regions/page.tsx',
  'examples/app-router/app/ddys/request/page.tsx',
  'examples/app-router/app/ddys/diagnostics/page.tsx',
  'examples/app-router/app/sitemap.ts',
  'examples/app-router/app/robots.ts',
  'examples/app-router/app/manifest.ts',
  'examples/app-router/app/api/ddys/[route]/route.ts',
  'examples/app-router/app/api/ddys/request/route.ts',
  'examples/app-router/app/api/ddys/diagnostics/route.ts',
  'examples/app-router/app/api/ddys/revalidate/route.ts'
];

const clientMethods = [
  'movies', 'latest', 'hot', 'search', 'suggest', 'calendar',
  'movie', 'sources', 'related', 'comments',
  'collections', 'collection', 'shares', 'share',
  'requests', 'activities', 'user', 'types', 'genres', 'regions',
  'me', 'createRequest', 'createComment', 'deleteComment',
  'reportInvalidResource', 'follow', 'unfollow'
];

for (const file of [...requiredFiles, ...exampleFiles]) await mustExist(file);

await checkEncoding();
await checkPackage();
await checkClient();
await checkServerOnly();
await checkRouteHandlers();
await checkMetadata();
await checkActionsAndComponents();
await checkExamples();
await checkAssets();
await checkDocs();
await checkBuildScript();
await checkForbiddenFiles();
await checkForbiddenText();

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join('\n'));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, files: (await listFiles(root)).length, examples: exampleFiles.length, clientMethods: clientMethods.length }, null, 2));

async function mustExist(rel) {
  try {
    await fs.stat(path.join(root, rel));
  } catch {
    failures.push(`Missing required file: ${rel}`);
  }
}

async function checkEncoding() {
  for (const full of await listFiles(root)) {
    const rel = slash(path.relative(root, full));
    if (!isTextFile(rel)) continue;
    const buffer = await fs.readFile(full);
    assert(!(buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf), `${rel} must not contain a UTF-8 BOM.`);
    const text = buffer.toString('utf8');
    assert(!text.includes('\uFFFD'), `${rel} contains Unicode replacement characters.`);
  }
}

async function checkPackage() {
  const pkg = JSON.parse(await read('package.json'));
  assert(pkg.name === 'ddys-nextjs', 'package name mismatch.');
  assert(pkg.type === 'module', 'package must be ESM.');
  assert(pkg.exports?.['./server'] && pkg.exports?.['./route-handlers'] && pkg.exports?.['./actions'] && pkg.exports?.['./metadata'] && pkg.exports?.['./components'] && pkg.exports?.['./components/client'] && pkg.exports?.['./styles.css'], 'package exports must expose server, route-handlers, actions, metadata, components, client components, and styles.');
  assert(pkg.peerDependencies?.next && pkg.peerDependencies?.react && pkg.peerDependencies?.['react-dom'], 'package must declare Next and React peer dependencies.');
  assert(pkg.dependencies?.['server-only'], 'package must depend on server-only.');
  assert(pkg.scripts?.check === 'node tools/check.mjs', 'package check script mismatch.');
  const config = await read('next.config.example.mjs');
  assert(config.includes("transpilePackages: ['ddys-nextjs']") && config.includes('cacheComponents'), 'next.config example must document transpilePackages and Cache Components.');
  const env = await read('.env.example');
  for (const key of ['DDYS_API_BASE_URL', 'DDYS_API_KEY', 'DDYS_FORM_SECRET', 'DDYS_REVALIDATE_TOKEN']) {
    assert(env.includes(key), `.env.example missing ${key}.`);
  }
}

async function checkClient() {
  const client = await read('src/client/client.ts');
  for (const method of clientMethods) {
    assert(client.includes(`${method}(`), `DdysClient missing ${method}().`);
  }
  for (const fragment of ['sendWithRetry', "method !== 'GET'", 'Authorization', 'Bearer', "typeof window === 'undefined'", 'finally', 'clearTimeout', 'routeSegment', 'positiveId', 'proxyPath', 'allowRoutes', 'noCache', 'next: options.noCache']) {
    assert(client.includes(fragment), `DdysClient missing ${fragment}.`);
  }
  const security = await read('src/utils/security.ts');
  for (const fragment of ['normalizeBaseUrl', 'buildQuery', 'safeMediaUrl', 'isAllowedResourceUrl', 'formDataToObject', 'maxPerPage']) {
    assert(security.includes(fragment), `security utils missing ${fragment}.`);
  }
}

async function checkServerOnly() {
  for (const file of ['src/server/config.ts', 'src/server/cache.ts', 'src/server/client.ts', 'src/server/request-service.ts', 'src/metadata/index.ts']) {
    const text = await read(file);
    assert(text.includes("import 'server-only'"), `${file} must import server-only.`);
  }
  const serverConfig = await read('src/server/config.ts');
  assert(serverConfig.includes('process.env') && serverConfig.includes('safeDdysConfig') && serverConfig.includes('DDYS_API_KEY') && serverConfig.includes('DDYS_FORM_SECRET') && serverConfig.includes('envConfig') && serverConfig.includes('...envConfig.requestForm'), 'server config must read env, deep merge input, and expose safe config.');
  const request = await read('src/server/request-service.ts');
  for (const fragment of ['createRequestFormToken', 'verifyRequestFormToken', 'crypto.subtle', 'enforceRateLimit', 'normalizeRequestInput', 'honeypot', 'DDYS request form is disabled']) {
    assert(request.includes(fragment), `request service missing ${fragment}.`);
  }
  for (const file of ['src/components/request-form.tsx', 'src/components/search.tsx', 'src/components/diagnostics.tsx']) {
    const text = await read(file);
    assert(text.trimStart().startsWith("'use client';"), `${file} must be an explicit Client Component.`);
    assert(!text.includes('DDYS_API_KEY') && !text.includes('Authorization') && !text.includes('process.env'), `${file} must not include server secrets.`);
  }
}

async function checkRouteHandlers() {
  const proxy = await read('src/route-handlers/proxy.ts');
  assert(proxy.includes('createDdysProxyRouteHandler') && proxy.includes('context.params') && proxy.includes('client.proxy') && proxy.includes('Cache-Control'), 'proxy route handler must support dynamic params and client proxy.');
  const request = await read('src/route-handlers/request.ts');
  assert(request.includes('createDdysRequestRouteHandler') && request.includes('request.formData') && request.includes('submitDdysRequest') && request.includes('identityFromRequest'), 'request route handler must parse form data and identity.');
  const diagnostics = await read('src/route-handlers/diagnostics.ts');
  assert(diagnostics.includes('createDdysDiagnosticsRouteHandler') && diagnostics.includes('safeDdysConfig') && diagnostics.includes('diagnostics.enabled') && diagnostics.includes('ddysDiagnosticsTestPOST'), 'diagnostics route handler must gate, hide secrets, and test API.');
  const revalidate = await read('src/route-handlers/revalidate.ts');
  assert(revalidate.includes('DDYS_REVALIDATE_TOKEN') && revalidate.includes('x-ddys-revalidate-token') && revalidate.includes('revalidateDdys') && revalidate.includes('tagProfile') && revalidate.includes('pathType'), 'revalidate route handler must validate token and revalidate.');
}

async function checkMetadata() {
  const metadata = await read('src/metadata/index.ts');
  for (const fragment of ['createDdysMetadata', 'createDdysMovieMetadata', 'createDdysSitemap', 'createDdysRobots', 'createDdysManifest', 'createDdysMovieJsonLd', 'MetadataRoute', 'nextFetchOptions', 'joinPath', 'throwOnError']) {
    assert(metadata.includes(fragment), `metadata helper missing ${fragment}.`);
  }
  assert(metadata.includes('encodedSlug') && metadata.includes('options.path || itemUrl') && !metadata.includes('video.movie'), 'movie metadata must encode slugs, prefer local canonical paths, and use Next-safe Open Graph types.');
}

async function checkActionsAndComponents() {
  const action = await read('src/actions/request.ts');
  assert(action.trimStart().startsWith("'use server';") && action.includes('submitDdysRequestAction') && action.includes('FormData'), 'request action must be a Server Action.');
  const revalidate = await read('src/actions/revalidate.ts');
  assert(revalidate.trimStart().startsWith("'use server';") && revalidate.includes('revalidateDdysAction') && revalidate.includes('DDYS_REVALIDATE_TOKEN') && revalidate.includes('tagProfile') && revalidate.includes('pathType'), 'revalidate action must be a protected Server Action.');
  const view = await read('src/components/view.tsx');
  for (const viewName of ['latest', 'hot', 'movies', 'search', 'collections', 'shares', 'requests', 'activities', 'movie', 'types', 'genres', 'regions']) {
    assert(view.includes(`case '${viewName}'`), `DdysView missing ${viewName}.`);
  }
  const components = await read('src/components/index.ts');
  for (const name of ['DdysCard', 'DdysGrid', 'DdysMovieDetail', 'DdysSources', 'DdysSearch', 'DdysRequestForm', 'DdysDiagnostics', 'DdysView']) {
    assert(components.includes(name), `components index missing ${name}.`);
  }
  const clientComponents = await read('src/components/client.ts');
  assert(clientComponents.includes('DdysRequestForm') && clientComponents.includes('DdysSearch') && clientComponents.includes('DdysDiagnostics'), 'client components entry must export interactive widgets.');
  const root = await read('src/index.ts');
  assert(!root.includes("components/index"), 'root export must not re-export server components into client bundles.');
  assert(view.includes('nextFetchOptions'), 'DdysView must use Next fetch cache options.');
  const css = await read('src/styles/ddys.css');
  assert(css.includes('ddys-next-items') && css.includes('ddys-next-request-form') && css.includes('@media') && css.includes('prefers-color-scheme'), 'CSS must include layout, request form, responsive, and dark-mode styles.');
}

async function checkExamples() {
  for (const file of exampleFiles) {
    const text = await read(file);
    assert(text.includes('ddys-nextjs'), `${file} must import ddys-nextjs.`);
  }
  assert((await read('examples/app-router/app/api/ddys/[route]/route.ts')).includes('ddysProxyGET as GET'), 'proxy example route export mismatch.');
  assert((await read('examples/app-router/app/api/ddys/request/route.ts')).includes('ddysRequestPOST as POST'), 'request example route export mismatch.');
  assert((await read('examples/app-router/app/ddys/movie/[slug]/page.tsx')).includes('Promise<{ slug: string }>'), 'dynamic movie page must support Next 15/16 params promise.');
  assert((await read('examples/app-router/app/ddys/movie/[slug]/page.tsx')).includes('generateMetadata') && (await read('examples/app-router/app/ddys/movie/[slug]/page.tsx')).includes('createDdysMovieMetadata'), 'movie page must include generateMetadata.');
  assert((await read('examples/app-router/app/ddys/movies/page.tsx')).includes('searchParams: Promise'), 'searchParams examples must support Next 15/16 promise props.');
  assert((await read('examples/app-router/app/sitemap.ts')).includes('createDdysSitemap'), 'sitemap example must use metadata helper.');
  assert((await read('examples/app-router/app/robots.ts')).includes('createDdysRobots'), 'robots example must use metadata helper.');
  assert((await read('examples/app-router/app/manifest.ts')).includes('createDdysManifest'), 'manifest example must use metadata helper.');
}

async function checkAssets() {
  const expected = {
    'public/images/icon-16.png': [16, 16],
    'public/images/icon-32.png': [32, 32],
    'public/images/icon-192.png': [192, 192],
    'public/images/icon-512.png': [512, 512],
    'public/images/logo.png': [512, 512]
  };
  for (const [rel, size] of Object.entries(expected)) {
    const actual = await pngSize(rel);
    assert(actual[0] === size[0] && actual[1] === size[1], `${rel} must be ${size[0]}x${size[1]}, got ${actual[0]}x${actual[1]}.`);
  }
}

async function checkDocs() {
  const en = await read('README.md');
  const zh = await read('README.zh-CN.md');
  assert(en.includes('[中文](README.zh-CN.md)') && zh.includes('[English](README.md)'), 'READMEs must link to each other.');
  for (const fragment of ['ddys-nextjs', 'transpilePackages', 'DDYS_API_KEY', 'Route Handlers', 'Server Components', 'Server Actions', 'Metadata', 'createDdysMovieMetadata', 'createDdysSitemap', 'DdysRequestForm', 'revalidateDdysAction', '/api/ddys/[route]', '/ddys/movie/[slug]', 'ddys-nextjs/components/client']) {
    assert(en.includes(fragment) && zh.includes(fragment), `READMEs missing ${fragment}.`);
  }
  assert(en.includes('Do not prefix them with `NEXT_PUBLIC_`') && zh.includes('不要加 `NEXT_PUBLIC_`'), 'READMEs must document secret environment variables.');
}

async function checkBuildScript() {
  const script = await read('tools/build-package.ps1');
  assert(script.includes('ddys-nextjs-v{0}.zip') && script.includes('StartsWith($resolvedRoot') && script.includes('ZipFileExtensions') && script.includes('Replace("\\", "/")'), 'build-package.ps1 must safely create portable release zip.');
}

async function checkForbiddenFiles() {
  for (const full of await listFiles(root)) {
    const rel = slash(path.relative(root, full));
    assert(rel === '.env.example' || !/(^|\/)(\.env|\.env\..*|node_modules|\.next|out|coverage|dist)(\/|$)/.test(rel), `Forbidden generated or sensitive path committed: ${rel}`);
    assert(!/\.(log|bak|tmp|cache)$/i.test(rel), `Forbidden generated file committed: ${rel}`);
  }
}

async function checkForbiddenText() {
  const patterns = ['ghp_', 'github_pat_', 'npm_', '\uFFFD', '????', '涓', '闆', '鏄', '鍖', '绔'];
  for (const full of await listFiles(root)) {
    const rel = slash(path.relative(root, full));
    if (!isTextFile(rel) || rel === 'tools/check.mjs') continue;
    const text = await read(rel);
    for (const pattern of patterns) {
      assert(!text.includes(pattern), `${rel} contains forbidden text pattern ${pattern}.`);
    }
  }
}

async function read(rel) {
  return fs.readFile(path.join(root, rel), 'utf8');
}

async function listFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const out = [];
  for (const entry of entries) {
    if (['.git', 'dist', 'node_modules', '.next', 'out', 'coverage'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await listFiles(full));
    else out.push(full);
  }
  return out;
}

async function pngSize(rel) {
  const buffer = await fs.readFile(path.join(root, rel));
  assert(buffer.readUInt32BE(0) === 0x89504e47, `${rel} is not a PNG.`);
  return [buffer.readUInt32BE(16), buffer.readUInt32BE(20)];
}

function isTextFile(rel) {
  return /\.(ts|tsx|js|mjs|json|css|md|txt|ps1)$/i.test(rel) || rel === '.gitignore' || rel === 'LICENSE' || rel === '.env.example';
}

function slash(value) {
  return value.replace(/\\/g, '/');
}

function assert(condition, message) {
  if (!condition) failures.push(message);
}
